/**
 * Pure Node.js DOCX Exporter for Generator Modul Ajar & Lesson Plan
 * Supports 2 distinct templates based on `jenisDokumen`:
 *   1. "Modul Ajar"  -> template-modul-ajar.docx (Bab Lengkap 1-9 Pertemuan, Cover, Asesmen, Dapus, Lampiran)
 *   2. "Lesson Plan" -> template-lesson-plan.docx (Harian 1-2 Pertemuan, Tanpa Cover, Judul LESSON PLAN, Tanpa Asesmen/Dapus/Lampiran)
 *
 * Usage: node export-docx.cjs <input.json> [output.docx]
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const core = require(path.join(__dirname, 'generator-core.cjs'));

// Minimal CRC32 table for ZIP archive creation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function readZip(buffer) {
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error('Invalid DOCX/ZIP file (EOCD not found).');
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries = [];
  let ptr = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) throw new Error('Invalid Central Directory header.');
    const method = buffer.readUInt16LE(ptr + 10);
    const compSize = buffer.readUInt32LE(ptr + 20);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);
    const name = buffer.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');

    const lNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const lExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const compData = buffer.subarray(dataStart, dataStart + compSize);
    const data = method === 8 ? zlib.inflateRawSync(compData) : Buffer.from(compData);

    entries.push({ name, method, data });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function writeZip(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const uncompData = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(uncompData);
    const compData = entry.method === 8 ? zlib.deflateRawSync(uncompData) : uncompData;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(entry.method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compData.length, 18);
    localHeader.writeUInt32LE(uncompData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(entry.method, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(compData.length, 20);
    cdHeader.writeUInt32LE(uncompData.length, 24);
    cdHeader.writeUInt16LE(nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(offset, 42);

    localParts.push(localHeader, nameBuf, compData);
    cdParts.push(cdHeader, nameBuf);
    offset += 30 + nameBuf.length + compData.length;
  }

  const cdBuffer = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuffer, eocd]);
}

function escapeXmlWithBreaks(text) {
  const str = String(text || '').trim();
  if (!str) return '';
  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.split(/\r?\n/).filter(l => l.trim().length > 0).join('</w:t><w:br/><w:t xml:space="preserve">');
}

function removeRowContaining(xml, marker) {
  const idx = xml.indexOf(marker);
  if (idx < 0) return xml;
  const before = xml.slice(0, idx);
  const matches = [...before.matchAll(/<w:tr(?:>|\s[^>]*>)/g)];
  const trEnd = xml.indexOf('</w:tr>', idx);
  if (matches.length > 0 && trEnd > idx) {
    const trStart = matches[matches.length - 1].index;
    return xml.slice(0, trStart) + xml.slice(trEnd + '</w:tr>'.length);
  }
  return xml;
}

/**
 * Ensures `template-lesson-plan.docx` exists by deriving it from `template-modul-ajar.docx`:
 * - Removes the 30 COVER paragraphs before <w:tbl>
 * - Changes header title from "MODUL AJAR" to "LESSON PLAN"
 * - Removes PERTEMUAN 3, 4, 5 blocks (since Lesson Plan is max 2 meetings)
 * - Removes Asesmen Pembelajaran ({{ListAsesmen}}), Daftar Pustaka ({{Dapus}}), and LAMPIRAN ({{Lampiran}})
 */
function ensureLessonPlanTemplate() {
  const modulTplPath = path.join(__dirname, 'template-modul-ajar.docx');
  const lessonTplPath = path.join(__dirname, 'template-lesson-plan.docx');
  if (fs.existsSync(lessonTplPath)) return lessonTplPath;

  const entries = readZip(fs.readFileSync(modulTplPath));
  const docEntry = entries.find(e => e.name === 'word/document.xml');
  let xml = docEntry.data.toString('utf8');

  // 1. Remove COVER paragraphs before the main <w:tbl>
  const bodyStart = xml.indexOf('<w:body>');
  const tblStart = xml.indexOf('<w:tbl>', bodyStart);
  if (bodyStart >= 0 && tblStart > bodyStart) {
    xml = xml.slice(0, bodyStart + '<w:body>'.length) + xml.slice(tblStart);
  }

  // 2. Change title from MODUL AJAR to LESSON PLAN
  xml = xml.replace('>MODUL AJAR<', '>LESSON PLAN<');

  // 3. Remove PERTEMUAN 3, 4, 5 blocks (Lesson Plan supports max 2 meetings)
  for (let j = 3; j <= 9; j++) {
    const startMarker = `>PERTEMUAN ${j}<`;
    const endMarker = `{{Penutup${j}}}`;
    const startIdx = xml.indexOf(startMarker);
    const endIdx = xml.indexOf(endMarker);
    if (startIdx >= 0 && endIdx > startIdx) {
      const before = xml.slice(0, startIdx);
      const matches = [...before.matchAll(/<w:tr(?:>|\s[^>]*>)/g)];
      const trEnd = xml.indexOf('</w:tr>', endIdx);
      if (matches.length > 0 && trEnd > startIdx) {
        const trStart = matches[matches.length - 1].index;
        xml = xml.slice(0, trStart) + xml.slice(trEnd + '</w:tr>'.length);
      }
    }
  }

  // 4. Remove Asesmen Pembelajaran & Daftar Pustaka rows and trailing LAMPIRAN paragraphs
  xml = removeRowContaining(xml, '{{ListAsesmen}}');
  xml = removeRowContaining(xml, '{{Dapus}}');
  const tblEnd = xml.lastIndexOf('</w:tbl>');
  const sectStart = xml.lastIndexOf('<w:sectPr');
  if (tblEnd >= 0 && sectStart > tblEnd) {
    xml = xml.slice(0, tblEnd + '</w:tbl>'.length) + xml.slice(sectStart);
  }

  docEntry.data = Buffer.from(xml, 'utf8');
  fs.writeFileSync(lessonTplPath, writeZip(entries));
  return lessonTplPath;
}

function pruneUnusedRows(xml, validated, pertemuanCount) {
  // 1. Prune unused ITP rows in the nested ITP table
  for (let i = 2; i <= 14; i++) {
    if (!validated[`itp${i}`] || !String(validated[`itp${i}`]).trim()) {
      xml = removeRowContaining(xml, `{{ITP${i}}}`);
    }
  }

  // 2. Prune unused Pertemuan blocks (PERTEMUAN j header row through {{Penutupj}} row)
  for (let j = pertemuanCount + 1; j <= 9; j++) {
    const startMarker = `>PERTEMUAN ${j}<`;
    const endMarker = `{{Penutup${j}}}`;
    const startIdx = xml.indexOf(startMarker);
    const endIdx = xml.indexOf(endMarker);
    if (startIdx >= 0 && endIdx > startIdx) {
      const before = xml.slice(0, startIdx);
      const matches = [...before.matchAll(/<w:tr(?:>|\s[^>]*>)/g)];
      const trEnd = xml.indexOf('</w:tr>', endIdx);
      if (matches.length > 0 && trEnd > startIdx) {
        const trStart = matches[matches.length - 1].index;
        xml = xml.slice(0, trStart) + xml.slice(trEnd + '</w:tr>'.length);
      }
    }
  }
  return xml;
}

function exportDocx(jsonPath, outDocxPath, templatePath) {
  ensureLessonPlanTemplate();
  const rawJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const jenisDokumen = String(rawJson.jenisDokumen || 'Lesson Plan').trim();
  const isLessonPlan = /^lesson\s*plan$/i.test(jenisDokumen);

  let pertemuanCount = Number(rawJson.pertemuan) || 0;
  if (!pertemuanCount) {
    for (let j = 9; j >= 1; j--) {
      if (rawJson[`subTopik${j}`] && String(rawJson[`subTopik${j}`]).trim()) {
        pertemuanCount = j;
        break;
      }
    }
    if (!pertemuanCount) pertemuanCount = 1;
  }
  if (isLessonPlan && pertemuanCount > 2) {
    throw new Error('Lesson Plan maksimal 2 pertemuan (gunakan jenisDokumen "Modul Ajar" untuk > 2 pertemuan).');
  }

  const cleanPayload = { ...rawJson };
  delete cleanPayload.nama;
  delete cleanPayload.pertemuan;
  delete cleanPayload.jenisDokumen;
  delete cleanPayload.requestId;

  // In Lesson Plan mode, listAsesmen, dapus, and lampiran are empty per Code.gs specification
  if (isLessonPlan) {
    cleanPayload.listAsesmen = '';
    cleanPayload.dapus = '';
    cleanPayload.lampiran = '';
  }

  const validated = core.validateAI(cleanPayload, 'full', pertemuanCount);
  const selectedTemplate = templatePath || path.join(
    __dirname,
    isLessonPlan ? 'template-lesson-plan.docx' : 'template-modul-ajar.docx'
  );

  const entries = readZip(fs.readFileSync(selectedTemplate));
  const docEntry = entries.find(e => e.name === 'word/document.xml');
  if (!docEntry) throw new Error('word/document.xml not found in template.');

  let xml = docEntry.data.toString('utf8');

  // Remove unused ITP rows and Pertemuan blocks before replacing placeholders
  xml = pruneUnusedRows(xml, validated, pertemuanCount);

  const mapText = {
    '{{Nama}}': rawJson.nama || 'Tito Vanzal, S.Pd.',
    '{{Topik}}': validated.topik || rawJson.topik || '',
    '{{Kelas}}': validated.kelas || rawJson.kelas || '',
    '{{Waktu}}': validated.waktu || rawJson.waktu || '',
    '{{Tujuan}}': validated.tujuan || '',
    '{{Model}}': validated.model || '',
    '{{Strategi}}': validated.strategi || '',
    '{{Metode}}': validated.metode || '',
    '{{Kemitraan}}': validated.kemitraan || '',
    '{{Lingkungan}}': validated.lingkungan || '',
    '{{Digital}}': validated.digital || '',
    '{{ListAsesmen}}': validated.listAsesmen || '',
    '{{Dapus}}': validated.dapus || '',
    '{{Lampiran}}': validated.lampiran || ''
  };

  const boolMap = {
    '{{Keimanan}}': validated.keimanan,
    '{{Penalaran}}': validated.penalaran,
    '{{Kolaborasi}}': validated.kolaborasi,
    '{{Kesehatan}}': validated.kesehatan,
    '{{Kewargaan}}': validated.kewargaan,
    '{{Kreativitas}}': validated.kreativitas,
    '{{Kemandirian}}': validated.kemandirian,
    '{{Komunikasi}}': validated.komunikasi
  };

  for (const [ph, val] of Object.entries(mapText)) {
    xml = xml.split(ph).join(escapeXmlWithBreaks(val));
  }
  for (const [ph, val] of Object.entries(boolMap)) {
    xml = xml.split(ph).join(val === true ? '☑' : '☐');
  }

  for (let i = 1; i <= 14; i++) {
    xml = xml.split(`{{ITP${i}}}`).join(escapeXmlWithBreaks(validated[`itp${i}`] || ''));
    xml = xml.split(`{{Asesmen${i}}}`).join(escapeXmlWithBreaks(validated[`asesmen${i}`] || ''));
    xml = xml.split(`{{Aktivitas${i}}}`).join(escapeXmlWithBreaks(validated[`aktivitas${i}`] || ''));
  }

  for (let j = 1; j <= 9; j++) {
    xml = xml.split(`{{SubTopik${j}}}`).join(escapeXmlWithBreaks(validated[`subTopik${j}`] || ''));
    xml = xml.split(`{{Ayat${j}}}`).join(escapeXmlWithBreaks(validated[`ayat${j}`] || ''));
    xml = xml.split(`{{Zona${j}}}`).join(escapeXmlWithBreaks(validated[`zona${j}`] || ''));
    xml = xml.split(`{{Awal${j}}}`).join(escapeXmlWithBreaks(validated[`awal${j}`] || ''));
    xml = xml.split(`{{Memahami${j}}}`).join(escapeXmlWithBreaks(validated[`memahami${j}`] || ''));
    xml = xml.split(`{{Mengaplikasi${j}}}`).join(escapeXmlWithBreaks(validated[`mengaplikasi${j}`] || ''));
    xml = xml.split(`{{Merefleksi${j}}}`).join(escapeXmlWithBreaks(validated[`merefleksi${j}`] || ''));
    xml = xml.split(`{{Penutup${j}}}`).join(escapeXmlWithBreaks(validated[`penutup${j}`] || ''));
  }

  const remaining = core.placeholders(xml.replace(/<[^>]+>/g, ''));
  if (remaining.length > 0) {
    throw new Error('Remaining unreplaced placeholders in DOCX: ' + remaining.join(', '));
  }

  docEntry.data = Buffer.from(xml, 'utf8');
  const outPath = outDocxPath || jsonPath.replace(/\.json$/i, '.docx');
  fs.writeFileSync(outPath, writeZip(entries));
  return { outPath, jenisDokumen, templateUsed: path.basename(selectedTemplate) };
}

if (require.main === module) {
  const inputJson = process.argv[2];
  const outputDocx = process.argv[3];
  if (!inputJson) {
    console.error('Usage: node export-docx.cjs <input.json> [output.docx]');
    process.exit(1);
  }
  const info = exportDocx(path.resolve(inputJson), outputDocx ? path.resolve(outputDocx) : undefined);
  console.log(`DOCX (${info.jenisDokumen} -> ${info.templateUsed}) generated successfully: ${info.outPath}`);
}

module.exports = { exportDocx, ensureLessonPlanTemplate };
