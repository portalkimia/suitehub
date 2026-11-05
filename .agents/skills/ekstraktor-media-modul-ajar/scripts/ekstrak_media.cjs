#!/usr/bin/env node
/**
 * Ekstraktor Media Eksternal (PPTX, PPT, HTML, PDF) untuk Generator Modul Ajar
 * ----------------------------------------------------------------------------
 * Mengubah berkas media pembelajaran eksternal berukuran besar menjadi
 * Paket Prompt Pedagogis Ringkas (< 3.000 karakter/pertemuan) yang hemat token
 * untuk DeepSeek API / Gemini API dan 100% kompatibel dengan parser Code.gs
 * (termasuk pemetaan otomatis Ayat Al-Qur'an per pertemuan).
 *
 * Penggunaan:
 *   node ekstrak_media.cjs <berkas_pertemuan_1> [berkas_pertemuan_2 ...] [--out hasil.txt]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// ============================================================================
// 1. UTILITAS TEKS & DEKODE ENTITAS
// ============================================================================
function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&bull;/gi, '•')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&rarr;/gi, '→')
    .replace(/&larr;/gi, '←')
    .replace(/&uarr;/gi, '↑')
    .replace(/&darr;/gi, '↓')
    .replace(/&nearr;/gi, '↗')
    .replace(/&swarr;/gi, '↙')
    .replace(/&harr;/gi, '↔')
    .replace(/&Delta;/g, 'Δ')
    .replace(/&delta;/g, 'δ')
    .replace(/&times;/gi, '×')
    .replace(/&deg;/gi, '°')
    .replace(/&plusmn;/gi, '±')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function cleanText(str) {
  return decodeEntities(String(str || ''))
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function deduplicateLines(lines) {
  const seen = new Set();
  const out = [];
  for (const raw of lines) {
    const line = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!line || line.length < 2) continue;
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }
  return out;
}

// ============================================================================
// 2. EKSTRAKTOR ZIP NATIVE (UNTUK .PPTX TANPA DEPENDENSI EKSTERNAL)
// ============================================================================
function readZipEntries(buffer) {
  // Cari End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Format ZIP/PPTX tidak valid (EOCD tidak ditemukan).');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdSize = buffer.readUInt32LE(eocdOffset + 12);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries = new Map();
  let ptr = cdOffset;
  const cdEnd = cdOffset + cdSize;

  for (let idx = 0; idx < totalEntries && ptr < cdEnd; idx++) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) break;
    const compressionMethod = buffer.readUInt16LE(ptr + 10);
    const compressedSize = buffer.readUInt32LE(ptr + 20);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);
    const fileName = buffer.slice(ptr + 46, ptr + 46 + nameLen).toString('utf8');

    ptr += 46 + nameLen + extraLen + commentLen;

    // Baca Local File Header (0x04034b50)
    if (localHeaderOffset + 30 > buffer.length) continue;
    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) continue;
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressedSlice = buffer.slice(dataStart, dataStart + compressedSize);

    entries.set(fileName, {
      compressionMethod,
      compressedSlice,
      getText() {
        if (compressionMethod === 0) {
          return compressedSlice.toString('utf8');
        }
        if (compressionMethod === 8) {
          return zlib.inflateRawSync(compressedSlice).toString('utf8');
        }
        throw new Error('Metode kompresi ZIP tidak didukung: ' + compressionMethod);
      }
    });
  }
  return entries;
}

function extractXmlParagraphs(xmlString) {
  const paragraphs = [];
  const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(xmlString)) !== null) {
    const pBody = pMatch[1];
    const tRegex = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/gi;
    const runs = [];
    let tMatch;
    while ((tMatch = tRegex.exec(pBody)) !== null) {
      runs.push(decodeEntities(tMatch[1]));
    }
    const line = runs.join('').replace(/\s+/g, ' ').trim();
    if (line) paragraphs.push(line);
  }
  return deduplicateLines(paragraphs);
}

function extractPptx(filePath) {
  const buffer = fs.readFileSync(filePath);
  const entries = readZipEntries(buffer);

  const slideNames = [...entries.keys()]
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/i)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/i)[1], 10);
      return na - nb;
    });

  const slides = [];
  for (const slideName of slideNames) {
    const slideNum = parseInt(slideName.match(/slide(\d+)\.xml/i)[1], 10);
    const xml = entries.get(slideName).getText();
    const lines = extractXmlParagraphs(xml);

    // Cek speaker notes jika ada
    const noteName = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let notes = [];
    if (entries.has(noteName)) {
      try {
        notes = extractXmlParagraphs(entries.get(noteName).getText())
          .filter(n => !/^\d+$/.test(n));
      } catch (_) {}
    }

    if (lines.length || notes.length) {
      slides.push({
        slideNum,
        title: lines[0] || `Slide ${slideNum}`,
        lines,
        notes
      });
    }
  }

  const allLines = [];
  slides.forEach(s => {
    allLines.push(`[Slide ${s.slideNum}] ${s.lines.join(' | ')}`);
    if (s.notes.length) {
      allLines.push(`  (Catatan Guru Slide ${s.slideNum}: ${s.notes.join(' ')})`);
    }
  });

  return {
    mediaType: 'Presentasi Interaktif (PowerPoint / Canva PPTX)',
    title: (slides[0] && slides[0].title) || path.basename(filePath, path.extname(filePath)),
    slides,
    fullText: allLines.join('\n')
  };
}

// ============================================================================
// 3. EKSTRAKTOR .PPT BINER LAMA (POWERPOINT 97-2003)
// ============================================================================
function extractLegacyPpt(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunks = [];

  // Scan UTF-16LE dan ASCII runs yang bermakna
  const utf16Text = buf.toString('utf16le');
  const matches16 = utf16Text.match(/[\u0020-\u007E\u00A0-\u00FF\u0600-\u06FF\n\r]{8,}/g) || [];
  for (const m of matches16) {
    const c = cleanText(m);
    if (c.length >= 10 && /[a-zA-Z]{3,}|[\u0600-\u06FF]{3,}/.test(c) && !/Microsoft|PowerPoint|Times New Roman|Arial|Calibri|Default Design/i.test(c)) {
      chunks.push(c);
    }
  }

  const latinText = buf.toString('latin1');
  const matches8 = latinText.match(/[A-Za-z0-9 ,.;:?!()'"/\-\n]{12,}/g) || [];
  for (const m of matches8) {
    const c = cleanText(m);
    if (c.length >= 15 && /[a-zA-Z]{4,}/.test(c) && /[aiueoAIUEO]/.test(c) && !/Microsoft|PowerPoint|Root Entry|Current User|SummaryInformation/i.test(c)) {
      chunks.push(c);
    }
  }

  const lines = deduplicateLines(chunks);
  return {
    mediaType: 'Presentasi Pembelajaran (PowerPoint PPT)',
    title: lines[0] || path.basename(filePath, path.extname(filePath)),
    slides: [],
    fullText: lines.join('\n')
  };
}

// ============================================================================
// 4. EKSTRAKTOR HTML INTERAKTIF (HEMAT TOKEN)
// ============================================================================
function stripHtmlTags(html) {
  return cleanText(
    String(html || '')
      .replace(/<(?:script|style|svg|noscript|iframe|object|nav|footer)\b[^>]*>[\s\S]*?<\/(?:script|style|svg|noscript|iframe|object|nav|footer)>/gi, ' ')
      .replace(/<(?:span|i)\b[^>]*class=["'][^"']*material-(?:symbols|icons)[^"']*["'][^>]*>[\s\S]*?<\/(?:span|i)>/gi, ' ')
      .replace(/<(?:br|hr|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
}

function extractHtmlSectionByHeading(html, headingRegex) {
  const sectionRegex = /<(section|article)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const matches = [];
  let m;
  while ((m = sectionRegex.exec(html)) !== null) {
    const block = m[2];
    if (/<h[1-5]\b[^>]*>[\s\S]*?<\/h[1-5]>/i.test(block)) {
      const headings = block.match(/<h[1-5]\b[^>]*>([\s\S]*?)<\/h[1-5]>/gi) || [];
      if (headings.some(h => headingRegex.test(stripHtmlTags(h)))) {
        const text = stripHtmlTags(block);
        if (text.length >= 25) {
          matches.push(text.slice(0, 2200));
        }
      }
    }
  }
  return deduplicateLines(matches).join('\n').slice(0, 2200);
}

function extractHtml(filePath) {
  const rawHtml = fs.readFileSync(filePath, 'utf8');
  const cleanedHtml = rawHtml.replace(
    /<(?:script|style|svg|noscript|iframe|object)\b[^>]*>[\s\S]*?<\/(?:script|style|svg|noscript|iframe|object)>/gi,
    ' '
  );

  const titleMatch = cleanedHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) ||
                     cleanedHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch
    ? stripHtmlTags(titleMatch[1]).split('\n')[0].replace(/\s*•\s*PortalKimia.*$/i, '').trim()
    : path.basename(filePath, path.extname(filePath));

  // Cari berdasarkan ID standar pada <section> atau slice dari posisi id="..."
  const getByIdOrHeading = (idPattern, headingRegex) => {
    const secReg = new RegExp(`<section\\b[^>]*id=["'][^"']*(?:${idPattern})[^"']*["'][^>]*>([\\s\\S]*?)<\\/section>`, 'i');
    const secMatch = cleanedHtml.match(secReg);
    if (secMatch) {
      const t = stripHtmlTags(secMatch[1]);
      if (t.length >= 20) return t.slice(0, 2200);
    }
    const anyIdReg = new RegExp(`id=["'][^"']*(?:${idPattern})[^"']*["'][^>]*>`, 'i');
    const anyMatch = anyIdReg.exec(cleanedHtml);
    if (anyMatch) {
      const slice = cleanedHtml.slice(anyMatch.index + anyMatch[0].length, anyMatch.index + anyMatch[0].length + 14000);
      const t = stripHtmlTags(slice);
      if (t.length >= 20) return t.slice(0, 2000);
    }
    return extractHtmlSectionByHeading(cleanedHtml, headingRegex);
  };

  let fenomena = getByIdOrHeading('fenomena|apersepsi|stimulus', /fenomena|apersepsi|kontekstual|stimulus|masalah nyata/i);
  let keislaman = getByIdOrHeading('keislaman|ayat|tadabbur|religi', /keislaman|tadabbur|ayat|hadits|hadis|al-qur['’]?an|nilai islam/i);
  const simulasi = getByIdOrHeading('lab|simulator|simulasi|praktikum', /laboratorium|simulator|simulasi|praktikum|percobaan|eksplorasi interaktif/i);
  const lkpd = getByIdOrHeading('lkpd|analisis|penyelidikan', /lkpd|lembar kerja|tabel pengamatan|analisis data|penyelidikan|diskusi kelompok/i);
  const kuis = getByIdOrHeading('kuis|evaluasi|quiz|latihan', /kuis|evaluasi|soal latihan|tes formatif|uji pemahaman/i);

  const fullText = stripHtmlTags(cleanedHtml);

  // Fallback jika keislaman ada di dalam script data atau teks penuh
  if (!keislaman) {
    const arabMatch = rawHtml.match(/[\u0600-\u06FF][\u0600-\u06FF\s\u064B-\u065F\u0670\u06D6-\u06ED]{10,}/g);
    const qsMatch = fullText.match(/(?:QS\.?|Q\.S\.?|Surah|Surat)\s+[A-Za-z'’-]+\s*(?:ayat|:)?\s*\d+(?:\s*[-–]\s*\d+)?[^\n]{0,400}/i);
    if (arabMatch || qsMatch) {
      keislaman = [qsMatch ? qsMatch[0] : '', arabMatch ? arabMatch.slice(0, 2).join(' ') : ''].filter(Boolean).join(' - ');
    }
  }

  return {
    mediaType: 'Media Pembelajaran HTML Interaktif',
    title,
    sections: { fenomena, keislaman, simulasi, lkpd, kuis },
    fullText
  };
}

// ============================================================================
// 5. EKSTRAKTOR PDF RINGAN (FLATEDECODE STREAM + TEKS OPERATOR)
// ============================================================================
function decodePdfLiteralString(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '\\') {
      const next = str[++i];
      if (next === 'n') out += '\n';
      else if (next === 'r') out += '\r';
      else if (next === 't') out += '\t';
      else if (/[0-7]/.test(next)) {
        let oct = next;
        if (/[0-7]/.test(str[i + 1] || '')) oct += str[++i];
        if (/[0-7]/.test(str[i + 1] || '')) oct += str[++i];
        out += String.fromCharCode(parseInt(oct, 8));
      } else if (next) {
        out += next;
      }
    } else {
      out += ch;
    }
  }
  return out;
}

function extractTextFromPdfStream(streamStr) {
  const parts = [];
  // Ekstrak array TJ: [(teks) -10 (lanjut)] TJ
  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  let m;
  while ((m = tjArrayRegex.exec(streamStr)) !== null) {
    const inner = m[1];
    const litRegex = /\(((?:\\.|[^\\()])*)\)/g;
    let lit;
    let line = '';
    while ((lit = litRegex.exec(inner)) !== null) {
      line += decodePdfLiteralString(lit[1]);
    }
    if (line.trim()) parts.push(line.trim());
  }
  // Ekstrak string tunggal: (teks) Tj
  const tjSingleRegex = /\(((?:\\.|[^\\()])*)\)\s*(?:Tj|'|")/g;
  while ((m = tjSingleRegex.exec(streamStr)) !== null) {
    const s = decodePdfLiteralString(m[1]).trim();
    if (s) parts.push(s);
  }
  return parts.join(' ');
}

function extractPdf(filePath) {
  const buf = fs.readFileSync(filePath);
  const rawLatin = buf.toString('latin1');
  const extractedChunks = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(rawLatin)) !== null) {
    const startIdx = match.index + match[0].indexOf('\n') + 1;
    const endIdx = match.index + match[0].lastIndexOf('endstream') - (rawLatin[match.index + match[0].lastIndexOf('endstream') - 2] === '\r' ? 2 : 1);
    const slice = buf.slice(startIdx, endIdx);

    let decompressed = null;
    try {
      decompressed = zlib.inflateSync(slice).toString('latin1');
    } catch (_) {
      try {
        decompressed = zlib.inflateRawSync(slice).toString('latin1');
      } catch (_2) {
        if (slice.includes(Buffer.from('BT')) && slice.includes(Buffer.from('ET'))) {
          decompressed = slice.toString('latin1');
        }
      }
    }
    if (decompressed && /BT[\s\S]*?ET/.test(decompressed)) {
      const txt = extractTextFromPdfStream(decompressed);
      if (txt && /[A-Za-z]{3,}/.test(txt)) {
        extractedChunks.push(txt);
      }
    }
  }

  const fullText = deduplicateLines(extractedChunks).join('\n');
  const needsGeminiVision = fullText.replace(/\s+/g, '').length < 150;

  return {
    mediaType: 'Modul / Bahan Ajar PDF',
    title: path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, ' '),
    fullText,
    needsGeminiVision
  };
}

// ============================================================================
// 6. ANALISIS PEDAGOGIS & PEMADATAN TOKEN (UNTUK DEEPSEEK API)
// ============================================================================
function analyzePedagogicalStructure(rawInfo, filePath) {
  const lines = String(rawInfo.fullText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const sections = rawInfo.sections || {};

  // 1. Deteksi Ayat Al-Qur'an / Hadits
  const regexAyat = /(?:[\u0600-\u06FF]{4,}|\b(?:QS\.?|Q\.S\.?|Surah\s+[A-Za-z'’-]+|Surat\s+[A-Za-z'’-]+|Al-Qur['’]?an|HR\.?\s+[A-Za-z]+|Hadis\s+Riwayat|Hadits\s+Riwayat|Tadabbur)\b)/i;
  const subLines = [];
  for (const l of lines) {
    const parts = l.replace(/^\[Slide\s+\d+\]\s*/i, '').split(/\s*\|\s*/);
    for (const p of parts) {
      if (p.trim()) subLines.push(p.trim());
    }
  }
  const ayatLines = [];
  for (let i = 0; i < subLines.length; i++) {
    if (regexAyat.test(subLines[i])) {
      const cleanedAyat = subLines[i].replace(/^(?:Tadabbur\s+Al-?Qur['’]?an\s*[:=-]?\s*)/i, '').trim();
      ayatLines.push(cleanedAyat);
    }
  }
  const keislamanText = (sections.keislaman || deduplicateLines(ayatLines).join(' | '))
    .replace(/^Integrasi Nilai Keislaman\s*:\s*Tadabbur Ayat Kauniyah\s*(?:Harmonisasi Wahyu Ilahi dengan Keteraturan Hukum Sains dan Kosmos\s*)?/i, '')
    .replace(/\s*Tujuan\s*&\s*Indikator[\s\S]*$/i, '')
    .trim()
    .slice(0, 900);

  // 2. Deteksi Tujuan Pembelajaran
  const regexTujuan = /\b(?:tujuan\s+pembelajaran|indikator\s+tujuan|capaian\s+pembelajaran|murid\s+mampu|peserta\s+didik\s+mampu|siswa\s+mampu)\b/i;
  const tujuanLines = lines.filter(l => regexTujuan.test(l)).slice(0, 6);

  // 3. Deteksi Stimulus Fenomena / Apersepsi
  const regexFenomena = /\b(?:fenomena|apersepsi|kontekstual|tahukah\s+kamu|mengapa|kasus\s+nyata|aplikasi\s+dalam\s+kehidupan|masalah\s+kontekstual)\b/i;
  const fenomenaText = (sections.fenomena || lines.filter(l => regexFenomena.test(l)).slice(0, 6).join('\n')).slice(0, 900);

  // 4. Deteksi Simulasi / Kegiatan Inti / Praktikum
  const regexSimulasi = /\b(?:simulasi|simulator|laboratorium|praktikum|percobaan|eksperimen|langkah\s+kerja|prosedur|eksplorasi|mengamati|membandingkan)\b/i;
  const simulasiText = (sections.simulasi || lines.filter(l => regexSimulasi.test(l)).slice(0, 8).join('\n')).slice(0, 1000);

  // 5. Deteksi LKPD / Diskusi / Penugasan
  const regexLkpd = /\b(?:lkpd|lembar\s+kerja|diskusi\s+kelompok|tabel\s+pengamatan|pertanyaan\s+diskusi|analisis\s+data|tugas\s+kelompok|latihan\s+bersama)\b/i;
  const lkpdText = (sections.lkpd || lines.filter(l => regexLkpd.test(l)).slice(0, 8).join('\n')).slice(0, 1000);

  // 6. Deteksi Kuis / Evaluasi Formatif
  const regexKuis = /\b(?:kuis|evaluasi|uji\s+pemahaman|soal\s+latihan|latihan\s+soal|tes\s+formatif|pilihan\s+ganda|refleksi)\b/i;
  const kuisText = (sections.kuis || lines.filter(l => regexKuis.test(l)).slice(0, 8).join('\n')).slice(0, 900);

  // 7. Isi Materi Lengkap dari seluruh slide/halaman (tanpa pemotongan dangkal)
  const materiRingkas = deduplicateLines(lines)
    .join('\n')
    .slice(0, 28000);

  return {
    fileName: path.basename(filePath),
    mediaType: rawInfo.mediaType,
    title: rawInfo.title,
    needsGeminiVision: !!rawInfo.needsGeminiVision,
    tujuan: tujuanLines.join(' | ').slice(0, 1200),
    keislaman: keislamanText,
    fenomena: fenomenaText,
    simulasi: simulasiText,
    lkpd: lkpdText,
    kuis: kuisText,
    materiRingkas
  };
}

function formatMeetingPrompt(analyzed, meetingNum) {
  const out = [];
  out.push(`[MEDIA PERTEMUAN ${meetingNum}]`);
  out.push(`Berkas Sumber: ${analyzed.fileName} | Jenis Media: ${analyzed.mediaType}`);
  out.push(`Sub-Topik Pertemuan ${meetingNum}: ${analyzed.title}`);

  if (analyzed.keislaman) {
    out.push(`Ayat Pertemuan ${meetingNum}: ${analyzed.keislaman.replace(/\s+/g, ' ').trim()}`);
  } else {
    out.push(`Ayat Pertemuan ${meetingNum}: [WAJIB DIISI OLEH GEMINI/AI: Pilih 1 Ayat Al-Qur'an atau Hadits Shahih/Hasan lengkap Teks Arab, Terjemahan, & Keterkaitan Materi yang relevan dengan "${analyzed.title}"]`);
  }

  if (analyzed.tujuan) {
    out.push(`Tujuan Pembelajaran Rujukan: ${analyzed.tujuan}`);
  }

  out.push(`\n[BAGIAN 1: PENGANTAR, MATERI PRASYARAT, & PEMANTIK APERSEPSI]`);
  out.push(analyzed.fenomena || `1. Konteks Pengantar dari Media: Judul dan konsep pengantar "${analyzed.title}" yang tertulis di awal ${analyzed.mediaType}.\n2. Pertanyaan Pemantik Diskusi Awal: Menggali pengetahuan prasyarat dan ide awal murid berdasarkan pengantar media.`);

  out.push(`\n[BAGIAN 2: INTEGRASI NILAI KEISLAMAN & AYAT/HADITS]`);
  out.push(analyzed.keislaman || `Tadabbur keteraturan hukum Allah SWT pada materi ${analyzed.title}.`);

  out.push(`\n[BAGIAN 3: EKSTRAKSI LENGKAP MATERI PER SLIDE / HALAMAN (FAKTUAL DARI MEDIA)]`);
  if (analyzed.needsGeminiVision) {
    out.push(`[CATATAN EKSTRAKTOR: PDF "${analyzed.fileName}" menggunakan encoding font khusus/halaman pindaian. Agen Gemini wajib membaca berkas ini menggunakan tool read_file untuk mengekstrak seluruh isi halaman secara lengkap di bawah ini.]`);
  } else {
    out.push(analyzed.materiRingkas);
  }

  out.push(`\n[BAGIAN 4: SKENARIO PEMBELAJARAN MENDALAM (DEEP LEARNING: STUDENT-CENTERED)]`);
  out.push(`1. Fase Memahami (Mindful & Meaningful Exploration): ${analyzed.simulasi || `Murid secara berkelompok menelaah, mengamati, dan membedah konsep, definisi, serta rumus/bagan yang tertulis pada ${analyzed.mediaType} "${analyzed.title}" dengan pertanyaan pengarah (scaffolding) dari pendidik, lalu merumuskan penjelasannya dengan bahasa sendiri.`}`);
  out.push(`2. Fase Mengaplikasi (Collaborative Problem Solving): ${analyzed.lkpd || `Murid berkolaborasi dalam kelompok untuk menganalisis contoh soal/kasus dan mengerjakan latihan penerapan konsep yang tertera di dalam ${analyzed.mediaType} "${analyzed.title}", lalu mempresentasikan dan membandingkan hasil diskusi antar-kelompok.`}`);
  out.push(`3. Fase Merefleksi (Synthesis & Confirmation): Murid menyimpulkan benang merah materi "${analyzed.title}" berdasarkan slide/halaman yang telah ditelaah, melakukan verifikasi konsep bersama pendidik, dan merefleksikan makna materi.`);

  out.push(`\n[BAGIAN 5: ACUAN ASESMEN DIAGNOSTIK AWAL & FORMATIF FLEKSIBEL (SIAP RUBRIK, TANPA OBSERVASI SIKAP)]`);
  out.push(`1. Asesmen Diagnostik Awal (Acuan Baris 1 Tabel ITP & Kegiatan Awal): Tanya-jawab singkat mengecek penguasaan materi prasyarat sebelum mempelajari "${analyzed.title}".`);
  out.push(`2. Formatif 1 (${analyzed.lkpd ? 'Penyelidikan & LKPD' : 'Telaah Konsep & Diskusi Kelompok'}): ${analyzed.lkpd || `Penilaian hasil kerja kelompok dalam membedah konsep dan menganalisis contoh/kasus pada ${analyzed.mediaType} "${analyzed.title}"`} (Kriteria Rubrik: ketepatan konsep ilmiah, kelogisan analisis, dan kelengkapan jawaban).`);
  out.push(`3. Formatif 2 (${analyzed.kuis ? 'Evaluasi / Kuis Mandiri' : 'Latihan Pemecahan Masalah'}): ${analyzed.kuis || `Penilaian penyelesaian latihan penerapan konsep berdasarkan materi pada ${analyzed.mediaType} "${analyzed.title}"`} (Kriteria Rubrik: ketepatan langkah penyelesaian dan kebenaran hasil akhir).`);

  return out.join('\n');
}

// ============================================================================
// 7. ENTRY POINT CLI
// ============================================================================
function processMediaFile(filePath, meetingNum) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Berkas tidak ditemukan: ${absPath}`);
  }
  const ext = path.extname(absPath).toLowerCase();
  let rawInfo;
  if (ext === '.pptx') {
    rawInfo = extractPptx(absPath);
  } else if (ext === '.ppt') {
    rawInfo = extractLegacyPpt(absPath);
  } else if (ext === '.html' || ext === '.htm') {
    rawInfo = extractHtml(absPath);
  } else if (ext === '.pdf') {
    rawInfo = extractPdf(absPath);
  } else if (ext === '.txt' || ext === '.md') {
    const txt = fs.readFileSync(absPath, 'utf8');
    rawInfo = {
      mediaType: 'Dokumen Teks Bahan Ajar',
      title: path.basename(absPath, ext),
      fullText: cleanText(txt)
    };
  } else {
    throw new Error(`Ekstensi berkas "${ext}" belum didukung. Gunakan .pptx, .ppt, .html, .pdf, .txt, atau .md`);
  }

  const analyzed = analyzePedagogicalStructure(rawInfo, absPath);
  return {
    analyzed,
    promptBlock: formatMeetingPrompt(analyzed, meetingNum)
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let outPath = null;
  const files = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' || args[i] === '-o') {
      outPath = args[++i];
    } else {
      files.push(args[i]);
    }
  }

  if (!files.length) {
    console.error('Penggunaan: node ekstrak_media.cjs <file1.pptx|html|pdf> [file2 ...] [--out hasil.txt]');
    process.exit(1);
  }

  const blocks = [];
  const summaryHeader = [
    `[BERKAS EKSTRAKSI: ${files.map(f => path.basename(f)).join(', ')}]`,
    `INSTRUKSI KHUSUS MEDIA & BAHAN AJAR:`,
    `1. Seluruh konsep, rumus, data, contoh, dan soal pada Bagian 3 berasal dari ${files.length} berkas media pembelajaran (${files.length} Pertemuan). Jangan menambahkan simulasi, praktikum, tabel pengamatan, atau kuis yang tidak tercantum pada rincian pertemuan di bawah ini.`,
    `2. Gunakan "Ayat Pertemuan 1" untuk mengisi field "ayat1", "Ayat Pertemuan 2" untuk mengisi field "ayat2", dan seterusnya secara utuh.`,
    `3. Susun langkah pembelajaran mengikuti kerangka Pembelajaran Mendalam (Deep Learning: Memahami, Mengaplikasi, Merefleksi) yang berpusat pada murid sesuai Bagian 4 secara mendetail.`,
    `4. Susun tabel ITP dan Asesmen merujuk pada Bagian 5 (Baris 1 wajib Asesmen Diagnostik Awal, diikuti Asesmen Formatif 1 dan Formatif 2 setiap pertemuan tanpa asesmen observasi sikap).\n`
  ].join('\n');

  blocks.push(summaryHeader);

  files.forEach((f, idx) => {
    const res = processMediaFile(f, idx + 1);
    blocks.push(res.promptBlock);
  });

  const finalPrompt = blocks.join('\n\n========================================================\n\n');
  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), finalPrompt, 'utf8');
    console.log(`Berhasil mengekstrak ${files.length} berkas (${finalPrompt.length} karakter) ke: ${path.resolve(outPath)}`);
  } else {
    process.stdout.write(finalPrompt + '\n');
  }
}

module.exports = {
  extractPptx,
  extractLegacyPpt,
  extractHtml,
  extractPdf,
  analyzePedagogicalStructure,
  formatMeetingPrompt,
  processMediaFile
};
