/**
 * =========================================================================
 * PORTALKIMIA SUITE — GENERATOR SOAL KIMIA AI (JAVASCRIPT ENGINE v5)
 * Terintegrasi Penuh | Tito Vanzal, S.Pd.
 * Fitur: Tabel Data Eksperimen, Diagram Kimia SVG, Tipe AKM/UTBK,
 *        Kisi-Kisi Resmi, Paket Paralel (A/B), & Ekspor Quizizz (.xlsx)
 * =========================================================================
 */

// Global State
let currentPackage = null;
let activeParallelTab = 'A'; // 'A' atau 'B'

// SYSTEM PROMPT DASAR DENGAN ATURAN ILMIAH DAN NOTASI KIMIA
const BASE_CHEMISTRY_PROMPT = `
Anda adalah Pakar Guru Kimia Senior dan Penyusun Soal Standar Nasional (Kurikulum Merdeka, UTBK-SNBT, AKM, dan Olimpiade Kimia).
Tugas Anda adalah menyusun instrumen asesmen kimia yang berstandar tinggi, valid secara ilmiah, kontekstual, dan bebas dari miskonsepsi.

PEDOMAN UTAMA:
1. AKURASI ILMIAH & MATEMATIS:
   - Persamaan reaksi kimia WAJIB setara (hukum kekekalan massa & muatan).
   - Perhitungan stoikiometri, massa atom relatif (Ar), massa molekul (Mr), tetapan asam-basa (Ka/Kb), potensial sel (E°), dan tetapan lainnya harus akurat secara empiris.

2. ATURAN PENULISAN ANGKA, PERSEN (%), DAN NOTASI LATEX (MUTLAK):
   - DILARANG menggunakan tanda dollar ($...$) untuk persentase (%), angka biasa, atau satuan umum.
   - Tuliskan persentase secara langsung dalam teks biasa: tulis '50,0%' atau '25%' (JANGAN menulis '$50{,}0\\%$' atau '$50{,}0\\%' atau '$50%$').
   - Tuliskan angka desimal dan satuan biasa: '0,5 mol', '100 mL', '25 °C', '1 atm', '5,4 gram'.
   - Tanda dollar inline ($...$) HANYA digunakan untuk:
     a. Rumus kimia senyawa/ion: $\\text{H}_2\\text{SO}_4$, $\\text{Al}^{3+}$, $\\text{CH}_3\\text{COOH}$, $\\text{Ca(OH)}_2$
     b. Persamaan reaksi kimia: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$
     c. Besaran termokimia & kesetimbangan: $\\Delta H = -285{,}8\\text{ kJ/mol}$, $K_a = 10^{-5}$, $E^\\circ = +1{,}10\\text{ V}$, $\\text{pH} = 3 - \\log 2$

3. FORMAT TABEL DATA & ILUSTRASI KIMIA SVG:
   - Jika materi memerlukan data pengamatan (misal: laju reaksi, titrasi, sifat koligatif, daya hantar listrik), sajikan tabel dalam format Markdown table yang rapi.
   - Jika materi sangat terbantu dengan diagram (misal: Rangkaian Sel Volta Zn-Cu, Diagram Profil Energi Hess/Eksoterm, Tabung Uji Elektrolit, Buret Titrasi), Anda DAPAT menyertakan kode vektor SVG murni yang valid pada properti "ilustrasi_svg". Kode SVG harus bersih, menggunakan viewBox="0 0 400 250", gaya minimalis kontras tinggi, teks terbaca jelas, dan tanpa tag script berbahaya.

4. FORMAT PILIHAN GANDA KOMPLEKS & SEBAB-AKIBAT:
   - Untuk Pilihan Ganda Kompleks: Sajikan pernyataan (1), (2), (3), (4) di narasi pertanyaan, lalu opsi jawaban berupa kombinasi:
     A. (1), (2), dan (3) saja
     B. (1) dan (3) saja
     C. (2) dan (4) saja
     D. (4) saja
     E. Semua pernyataan benar
   - Untuk Sebab-Akibat (UTBK): Sajikan kalimat Pernyataan diikuti "SEBAB" dan Alasan, lalu gunakan opsi standar UTBK (A: Pernyataan benar, alasan benar, berhubungan; B: Keduanya benar tapi tidak berhubungan; C: Pernyataan benar, alasan salah; D: Pernyataan salah, alasan benar; E: Keduanya salah).
`;

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  initApiKey();
  initFormListeners();
  initTabListeners();
  initExportListeners();
});

// API KEY & GAS BACKEND MANAGEMENT
function getGasUrl() {
  if (typeof window !== 'undefined') {
    if (window.SOAL_CONFIG && window.SOAL_CONFIG.GAS_API_URL && window.SOAL_CONFIG.GAS_API_URL.startsWith('http')) {
      return window.SOAL_CONFIG.GAS_API_URL.trim();
    }
    if (window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.SOAL_API && window.PORTALKIMIA_CONFIG.SOAL_API.startsWith('http')) {
      return window.PORTALKIMIA_CONFIG.SOAL_API.trim();
    }
  }
  const localGas = localStorage.getItem("portal_soal_gas_url");
  if (localGas && localGas.startsWith('http')) {
    return localGas.trim();
  }
  return "";
}

function initApiKey() {
  const savedKey = localStorage.getItem("portal_gemini_api_key") || "";
  const currentGasUrl = getGasUrl();
  const apiKeyStatusText = document.getElementById("apiKeyStatusText");
  const apiKeyBanner = document.getElementById("apiKeyBanner");
  const modalApiKeyInput = document.getElementById("modalApiKeyInput");
  const modalGasUrlInput = document.getElementById("modalGasUrlInput");
  const modal = document.getElementById("apiKeyModal");
  const btnTestGasPing = document.getElementById("btnTestGasPing");
  const gasPingResult = document.getElementById("gasPingResult");

  if (modalGasUrlInput) {
    modalGasUrlInput.value = currentGasUrl;
  }

  const updateStatusBadge = () => {
    const key = localStorage.getItem("portal_gemini_api_key") || "";
    const gas = getGasUrl();
    if (key) {
      apiKeyStatusText.textContent = "API Key Aktif (Direct)";
      apiKeyStatusText.className = "text-xs font-semibold text-emerald-400";
      apiKeyBanner.classList.add("hidden");
    } else if (gas) {
      apiKeyStatusText.textContent = "Backend GAS Aktif (Cloud)";
      apiKeyStatusText.className = "text-xs font-semibold text-indigo-400";
      apiKeyBanner.classList.add("hidden");
    } else {
      apiKeyStatusText.textContent = "Set API / Backend";
      apiKeyStatusText.className = "text-xs font-semibold text-amber-400";
      apiKeyBanner.classList.remove("hidden");
    }
  };

  updateStatusBadge();

  if (savedKey) {
    modalApiKeyInput.value = savedKey;
  }

  const openModal = () => modal.classList.remove("hidden");
  const closeModal = () => modal.classList.add("hidden");

  document.getElementById("btnOpenApiKeyModal").addEventListener("click", openModal);
  document.getElementById("btnBannerSetKey").addEventListener("click", openModal);
  document.getElementById("closeApiKeyModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelApiKeyBtn").addEventListener("click", closeModal);

  // Tes Ping Backend GAS
  if (btnTestGasPing) {
    btnTestGasPing.addEventListener("click", async () => {
      const targetUrl = modalGasUrlInput.value.trim() || getGasUrl();
      if (!targetUrl || !targetUrl.startsWith("http")) {
        gasPingResult.className = "text-[11px] font-medium text-amber-400 block";
        gasPingResult.textContent = "⚠️ Masukkan URL Web App GAS yang valid (berakhiran /exec)!";
        return;
      }

      btnTestGasPing.disabled = true;
      btnTestGasPing.textContent = "Menguji...";
      gasPingResult.className = "text-[11px] font-medium text-zinc-400 block";
      gasPingResult.textContent = "Menghubungi server GAS...";

      const tStart = performance.now();
      try {
        const pingUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=ping&_t=" + Date.now();
        const res = await fetch(pingUrl, { method: "GET", mode: "cors" });
        const latency = Math.round(performance.now() - tStart);
        if (res.ok) {
          const json = await res.json();
          gasPingResult.className = "text-[11px] font-medium text-emerald-400 block";
          gasPingResult.textContent = `✅ Terhubung ke Backend GAS! Latensi: ${latency} ms (${json.service || 'Siap'})`;
        } else {
          gasPingResult.className = "text-[11px] font-medium text-amber-400 block";
          gasPingResult.textContent = `⚠️ Server merespon HTTP ${res.status} (${latency} ms). Pastikan deployment diset 'Anyone'.`;
        }
      } catch (err) {
        gasPingResult.className = "text-[11px] font-medium text-rose-400 block";
        gasPingResult.textContent = `❌ Gagal terhubung: ${err.message}. Pastikan izin Web App adalah 'Anyone'.`;
      } finally {
        btnTestGasPing.disabled = false;
        btnTestGasPing.textContent = "Tes Ping";
      }
    });
  }

  document.getElementById("btnSaveApiKey").addEventListener("click", () => {
    const keyVal = modalApiKeyInput.value.trim();
    const gasVal = modalGasUrlInput ? modalGasUrlInput.value.trim() : "";

    if (keyVal) {
      localStorage.setItem("portal_gemini_api_key", keyVal);
    } else {
      localStorage.removeItem("portal_gemini_api_key");
    }

    if (gasVal) {
      localStorage.setItem("portal_soal_gas_url", gasVal);
      if (window.SOAL_CONFIG) window.SOAL_CONFIG.GAS_API_URL = gasVal;
    } else {
      localStorage.removeItem("portal_soal_gas_url");
    }

    updateStatusBadge();
    closeModal();
    alert("✅ Konfigurasi tersimpan!");
  });
}

// FORM LISTENERS
function initFormListeners() {
  const topicSelect = document.getElementById("topicSelect");
  const customContainer = document.getElementById("customTopicContainer");

  topicSelect.addEventListener("change", (e) => {
    if (e.target.value === "CUSTOM") {
      customContainer.classList.remove("hidden");
    } else {
      customContainer.classList.add("hidden");
    }
  });

  const modelSelect = document.getElementById("modelSelect");
  const headerModelBadge = document.getElementById("headerModelBadge");
  modelSelect.addEventListener("change", (e) => {
    headerModelBadge.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
      <span>${e.target.value === "gemini-3.7-flash" ? "Gemini 3.7 Flash" : "Gemini 3.6 Flash"}</span>
    `;
  });

  document.getElementById("quizConfigForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await generateQuiz();
  });
}

// TAB SWITCHING (GURU VS SISWA VS KISI-KISI)
function initTabListeners() {
  const tabTeacher = document.getElementById("tab-teacher");
  const tabStudent = document.getElementById("tab-student");
  const tabKisiKisi = document.getElementById("tab-kisi-kisi");
  const paneTeacher = document.getElementById("pane-teacher");
  const paneStudent = document.getElementById("pane-student");
  const paneKisiKisi = document.getElementById("pane-kisi-kisi");

  const resetTabs = () => {
    tabTeacher.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all";
    tabStudent.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all";
    tabKisiKisi.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all";
    paneTeacher.classList.add("hidden");
    paneStudent.classList.add("hidden");
    paneKisiKisi.classList.add("hidden");
  };

  tabTeacher.addEventListener("click", () => {
    resetTabs();
    tabTeacher.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-violet-600/20 text-violet-300 border border-violet-500/40";
    paneTeacher.classList.remove("hidden");
  });

  tabStudent.addEventListener("click", () => {
    resetTabs();
    tabStudent.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-600/20 text-emerald-300 border border-emerald-500/40";
    paneStudent.classList.remove("hidden");
  });

  tabKisiKisi.addEventListener("click", () => {
    resetTabs();
    tabKisiKisi.className = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-600/20 text-amber-300 border border-amber-500/40";
    paneKisiKisi.classList.remove("hidden");
  });

  // Switcher Paket Paralel (Paket A vs Paket B)
  const btnPaketA = document.getElementById("btnSwitchPaketA");
  const btnPaketB = document.getElementById("btnSwitchPaketB");

  btnPaketA.addEventListener("click", () => {
    activeParallelTab = 'A';
    btnPaketA.className = "px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 text-white shadow-sm transition-all";
    btnPaketB.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all";
    renderActiveQuestionsList();
  });

  btnPaketB.addEventListener("click", () => {
    activeParallelTab = 'B';
    btnPaketB.className = "px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all";
    btnPaketA.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all";
    renderActiveQuestionsList();
  });
}

/**
 * SANITIZER NOTASI KIMIA & ANGKA
 */
function formatChemistryText(text) {
  if (!text) return "";

  let cleaned = text;

  // 1. Bersihkan persentase dalam format LaTeX: $50{,}0\%$, $50{,}0\%, $50%$ -> 50,0%
  cleaned = cleaned.replace(/\$\s*([0-9]+(?:\{,\}|,|\.)?[0-9]*)\s*(?:\\%|%)(?:\s*\$)?/g, (match, p1) => {
    return p1.replace(/\{,\}/g, ",") + "%";
  });

  // 2. Bersihkan sisa format LaTeX koma desimal: 50{,}0 -> 50,0
  cleaned = cleaned.replace(/([0-9]+)\{,\}([0-9]+)/g, "$1,$2");

  // 3. Bersihkan tanda \% yang terlepas menjadi %
  cleaned = cleaned.replace(/\\%/g, "%");

  // 4. Bersihkan angka satuan umum: $0{,}1\text{ M}$ -> 0,1 M, $100\text{ mL}$ -> 100 mL
  cleaned = cleaned.replace(/\$\s*([0-9]+(?:,|\.)?[0-9]*)\s*\\text\{\s*([a-zA-Z]+)\s*\}\s*\$/g, "$1 $2");

  // 5. Bersihkan suhu derajat Celsius: $25^\circ\text{C}$ atau $25^\circ C$ -> 25 °C
  cleaned = cleaned.replace(/\$\s*([0-9]+)\s*\^\\circ\s*(?:\\text\{)?C\}?\s*\$/g, "$1 °C");
  cleaned = cleaned.replace(/([0-9]+)\s*\^\\circ\s*(?:\\text\{)?C\}?/g, "$1 °C");
  cleaned = cleaned.replace(/\\circ/g, "°");

  // 6. Bersihkan angka polos dalam dollar yang berdiri sendiri: $5$ -> 5, $0,2$ -> 0,2
  cleaned = cleaned.replace(/\$\s*([0-9]+(?:,|\.)?[0-9]*)\s*\$/g, "$1");

  return cleaned;
}

/**
 * PARSER TABEL MARKDOWN MENJADI ELEMEN HTML TABLE OBSIDIAN
 */
function parseMarkdownTable(text) {
  if (!text || !text.includes("|")) return text;

  const lines = text.split("\n");
  let inTable = false;
  let tableLines = [];
  let resultLines = [];

  const processTable = (tbl) => {
    if (tbl.length < 2) return tbl.join("\n");
    let headerRow = tbl[0];
    let bodyRows = tbl.slice(2); // abaikan garis separator |--|--|

    const splitCells = (row) => row.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length);

    let headers = splitCells(headerRow);
    let html = `<div class="chem-table-container"><table class="chem-table"><thead><tr>`;
    headers.forEach(h => html += `<th>${formatChemistryText(h)}</th>`);
    html += `</tr></thead><tbody>`;

    bodyRows.forEach(r => {
      let cells = splitCells(r);
      if (cells.length > 0) {
        html += `<tr>`;
        cells.forEach(c => html += `<td>${formatChemistryText(c)}</td>`);
        html += `</tr>`;
      }
    });

    html += `</tbody></table></div>`;
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) {
        resultLines.push(processTable(tableLines));
        tableLines = [];
        inTable = false;
      }
      resultLines.push(lines[i]);
    }
  }

  if (inTable) {
    resultLines.push(processTable(tableLines));
  }

  return resultLines.join("\n");
}

/**
 * SANITASI & RENDER SVG ILUSTRASI
 */
function renderSvgIllustration(svgCode, caption) {
  if (!svgCode || !svgCode.includes("<svg")) return "";
  
  // Bersihkan SVG dari script tag
  let cleanSvg = svgCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Pastikan style responsif
  if (!cleanSvg.includes("viewBox")) {
    cleanSvg = cleanSvg.replace("<svg", '<svg viewBox="0 0 400 250"');
  }

  return `
    <div class="chem-svg-wrapper">
      ${cleanSvg}
      <div class="chem-svg-caption">Ilustrasi Diagram: ${caption || 'Data Kimia Eksperimental'}</div>
    </div>
  `;
}

// SANITASI SELURUH DATA PAKET SOAL
function sanitizeQuizPackage(pkg) {
  if (!pkg) return pkg;

  const sanitizeQuestionList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach(soal => {
      soal.pertanyaan = formatChemistryText(soal.pertanyaan);
      if (soal.pilihan_jawaban) {
        soal.pilihan_jawaban.forEach(opt => {
          opt.teks = formatChemistryText(opt.teks);
        });
      }
      soal.kunci_jawaban = formatChemistryText(soal.kunci_jawaban);
      if (soal.pembahasan_langkah) {
        soal.pembahasan_langkah = soal.pembahasan_langkah.map(st => formatChemistryText(st));
      }
      if (soal.tips_atau_jebakan) {
        soal.tips_atau_jebakan = formatChemistryText(soal.tips_atau_jebakan);
      }
    });
  };

  sanitizeQuestionList(pkg.daftar_soal);
  if (pkg.daftar_soal_paket_b) {
    sanitizeQuestionList(pkg.daftar_soal_paket_b);
  }

  return pkg;
}

// GENERATE QUIZ DENGAN FITUR DINAMIS
async function generateQuiz() {
  const apiKey = localStorage.getItem("portal_gemini_api_key");
  const gasUrl = getGasUrl();
  if (!apiKey && !gasUrl) {
    document.getElementById("apiKeyModal").classList.remove("hidden");
    alert("Silakan masukkan Gemini API Key atau URL Backend Google Apps Script terlebih dahulu.");
    return;
  }

  const model = document.getElementById("modelSelect").value;
  const grade = document.getElementById("gradeSelect").value;
  const qType = document.getElementById("questionTypeSelect").value;
  const stimulus = document.getElementById("stimulusSelect").value;
  const topicSelect = document.getElementById("topicSelect");
  const topic = topicSelect.value === "CUSTOM" 
    ? (document.getElementById("customTopicInput").value.trim() || "Kimia Umum")
    : topicSelect.value;
  const subtopic = document.getElementById("subtopicInput").value.trim();
  const difficulty = document.getElementById("difficultySelect").value;
  const numQuestions = parseInt(document.getElementById("numQuestionsSelect").value, 10);
  const extraNotes = document.getElementById("extraNotesInput").value.trim();

  // Ambil Nilai Checkbox
  const includeKisiKisi = document.getElementById("chkIncludeKisiKisi").checked;
  const includeParallel = document.getElementById("chkIncludeParallel").checked;
  const includeVisuals = document.getElementById("chkIncludeVisuals").checked;

  // UI State Loading
  const loadingState = document.getElementById("loadingState");
  const resultsSection = document.getElementById("resultsSection");
  const btnGenerate = document.getElementById("btnGenerate");

  loadingState.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  btnGenerate.disabled = true;

  // Bangun Skema JSON Respons Secara Dinamis
  const questionItemSchema = {
    type: "OBJECT",
    required: ["nomor", "tipe_soal", "topik", "subtopik", "tingkat_kesulitan", "pertanyaan", "kunci_jawaban", "pembahasan_langkah"],
    properties: {
      nomor: { type: "INTEGER" },
      tipe_soal: { type: "STRING" },
      topik: { type: "STRING" },
      subtopik: { type: "STRING" },
      tingkat_kesulitan: { type: "STRING" },
      pertanyaan: { type: "STRING", description: "Teks soal lengkap. Jika memuat data tabel, sajikan dalam Markdown table. Rumus kimia dalam LaTeX ($...$)." },
      ilustrasi_svg: { type: "STRING", description: "Opsional. Kode SVG vektor murni jika soal memerlukan diagram ilmiah (misal: Sel Volta, Profil Hess, Tabung Uji, Titrasi)." },
      caption_ilustrasi: { type: "STRING", description: "Keterangan gambar diagram" },
      pilihan_jawaban: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["label", "teks"],
          properties: {
            label: { type: "STRING", description: "A, B, C, D, atau E" },
            teks: { type: "STRING", description: "Teks pilihan jawaban" }
          }
        }
      },
      kunci_jawaban: { type: "STRING", description: "Huruf kunci atau jawaban esai" },
      pembahasan_langkah: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Langkah penyelesaian terperinci"
      },
      tips_atau_jebakan: { type: "STRING", description: "Tips cepat atau miskonsepsi umum" }
    }
  };

  const dynamicProperties = {
    judul: { type: "STRING", description: "Judul paket naskah soal asesmen kimia" },
    jenjang: { type: "STRING" },
    topik_utama: { type: "STRING" },
    stimulus_model: { type: "STRING" },
    daftar_soal: {
      type: "ARRAY",
      items: questionItemSchema
    }
  };

  const dynamicRequired = ["judul", "jenjang", "topik_utama", "daftar_soal"];

  // Tambahkan schema Paket B jika paralel dicentang
  if (includeParallel) {
    dynamicProperties.daftar_soal_paket_b = {
      type: "ARRAY",
      items: questionItemSchema,
      description: "Paket B paralel anti-contek dengan indikator materi setara tetapi variabel/angka berbeda"
    };
    dynamicRequired.push("daftar_soal_paket_b");
  }

  // Tambahkan schema Kisi-Kisi jika dicentang
  if (includeKisiKisi) {
    dynamicProperties.kisi_kisi_asesmen = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["nomor", "cp_tp", "indikator_soal", "level_kognitif", "bentuk_soal", "kunci_jawaban", "skor"],
        properties: {
          nomor: { type: "INTEGER" },
          cp_tp: { type: "STRING", description: "Capaian Pembelajaran / Tujuan Pembelajaran" },
          indikator_soal: { type: "STRING", description: "Indikator spesifik butir soal" },
          level_kognitif: { type: "STRING", description: "Level Bloom (C2, C3, C4, atau C5)" },
          bentuk_soal: { type: "STRING", description: "PG, PG Kompleks, atau Esai" },
          kunci_jawaban: { type: "STRING" },
          skor: { type: "INTEGER", description: "Skor maksimal per butir soal" }
        }
      }
    };
    dynamicRequired.push("kisi_kisi_asesmen");
  }

  const quizJsonSchema = {
    type: "OBJECT",
    required: dynamicRequired,
    properties: dynamicProperties
  };

  // Buat User Prompt
  const userPrompt = `
Susun naskah soal asesmen kimia berkualitas tinggi dengan spesifikasi berikut:
- Topik Utama: ${topic}
- Subtopik: ${subtopic || 'Materi inti dan esensial dalam materi ini'}
- Jenjang Pendidikan: ${grade}
- Format Tipe Soal: ${qType}
- Model Pendekatan Stimulus: ${stimulus}
- Tingkat Kesulitan: ${difficulty}
- Jumlah Butir Soal: ${numQuestions} butir soal
- Catatan Tambahan Guru: ${extraNotes || 'Sesuai standar asesmen kimia nasional'}

INSTRUKSI KHUSUS FITUR:
1. STIMULUS SOAL: Gunakan model pendekatan "${stimulus}". Awali pertanyaan dengan narasi kontekstual yang relevan dan menggugah nalar literasi sains.
2. FORMAT TIPE SOAL: Buat butir soal dalam format "${qType}".
3. TABEL & ILUSTRASI KIMIA: ${includeVisuals ? 'Sertakan tabel data eksperimen (dalam Markdown table) atau diagram vektor SVG (pada ilustrasi_svg) untuk soal-soal yang membutuhkan pengamatan data / visual (seperti laju reaksi, sel volta, titrasi, termokimia).' : 'Tidak perlu tabel atau diagram khusus.'}
4. PAKET PARALEL: ${includeParallel ? 'WAJIB susun juga daftar_soal_paket_b sebanyak ' + numQuestions + ' butir soal paralel yang memiliki indikator setara dengan Paket A namun berbeda variabel/angka stoikiometrinya.' : 'Hanya susun Paket A.'}
5. KISI-KISI ASESMEN: ${includeKisiKisi ? 'WAJIB susun matriks kisi_kisi_asesmen yang memetakan CP/TP, indikator soal, level kognitif Bloom (C2-C5), kunci, dan skor.' : 'Tidak perlu menyusun matriks kisi-kisi.'}

Pastikan tidak ada format $persen$ rusak. Tulis persen biasa (50,0%). Seluruh soal harus berbobot dan terverifikasi akurat!
`;

  try {
    let parsedPkg;

    if (apiKey) {
      // MODE 1: Direct Client-Side (Kecepatan Maksimal langsung dari browser)
      const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: BASE_CHEMISTRY_PROMPT }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: quizJsonSchema,
          temperature: 0.7
        }
      };

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ? errorData.error.message : `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
        throw new Error("Respon Gemini tidak memuat teks konten.");
      }

      const jsonText = candidate.content.parts[0].text;
      parsedPkg = JSON.parse(jsonText);
    } else {
      // MODE 2: Cloud Backend Proxy via Google Apps Script (Multi-Device Tanpa Input API Key)
      const gasPayload = {
        action: "panggilGemini",
        model: model,
        prompt: userPrompt,
        systemInstruction: BASE_CHEMISTRY_PROMPT,
        schema: quizJsonSchema
      };

      const response = await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(gasPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error dari Backend GAS: ${response.status}`);
      }

      const gasRes = await response.json();
      if (gasRes.status === "error") {
        throw new Error(gasRes.message || "Gagal diproses di Backend GAS");
      }

      parsedPkg = gasRes.data || (typeof gasRes.raw === "string" ? JSON.parse(gasRes.raw) : gasRes);
    }

    currentPackage = sanitizeQuizPackage(parsedPkg);
    activeParallelTab = 'A';
    renderResults(currentPackage);
  } catch (err) {
    alert("❌ Terjadi kesalahan saat membuat soal: " + err.message);
  } finally {
    loadingState.classList.add("hidden");
    btnGenerate.disabled = false;
  }
}

// RENDER RESULTS
function renderResults(pkg) {
  document.getElementById("resPackageTitle").textContent = pkg.judul;
  document.getElementById("resGradeBadge").textContent = pkg.jenjang;
  document.getElementById("resPackageMeta").textContent = `${pkg.topik_utama} • ${pkg.daftar_soal.length} Butir Soal • Stimulus: ${pkg.stimulus_model || 'Kontekstual'}`;

  // Cek apakah ada Paket Paralel
  const parallelNav = document.getElementById("parallelPackageNav");
  if (pkg.daftar_soal_paket_b && pkg.daftar_soal_paket_b.length > 0) {
    parallelNav.classList.remove("hidden");
  } else {
    parallelNav.classList.add("hidden");
  }

  // Cek apakah ada Kisi-Kisi
  const tabKisiKisi = document.getElementById("tab-kisi-kisi");
  const printKisiSection = document.getElementById("printKisiKisiSection");
  if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0) {
    tabKisiKisi.classList.remove("hidden");
    printKisiSection.classList.remove("hidden");
    renderKisiKisiTab(pkg.kisi_kisi_asesmen);
  } else {
    tabKisiKisi.classList.add("hidden");
    printKisiSection.classList.add("hidden");
  }

  renderActiveQuestionsList();
  renderPrintLayout(pkg);

  const resultsSection = document.getElementById("resultsSection");
  resultsSection.classList.remove("hidden");

  // KaTeX rendering
  if (window.renderMathInElement) {
    renderMathInElement(resultsSection, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }

  if (window.lucide) {
    lucide.createIcons();
  }

  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// RENDER LIST SOAL AKTIF (PAKET A ATAU PAKET B)
function renderActiveQuestionsList() {
  if (!currentPackage) return;
  const activeQuestions = (activeParallelTab === 'B' && currentPackage.daftar_soal_paket_b) 
    ? currentPackage.daftar_soal_paket_b 
    : currentPackage.daftar_soal;

  renderTeacherQuestions(activeQuestions);
  renderStudentQuestions(activeQuestions);

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("teacherQuestionsList"), {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
      throwOnError: false
    });
    renderMathInElement(document.getElementById("studentQuestionsList"), {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
      throwOnError: false
    });
  }
}

// RENDER GURU QUESTIONS (DENGAN TABEL & SVG)
function renderTeacherQuestions(questions) {
  const container = document.getElementById("teacherQuestionsList");
  container.innerHTML = "";

  questions.forEach((soal) => {
    const card = document.createElement("div");
    card.className = "question-item";

    let optionsHtml = "";
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      optionsHtml = soal.pilihan_jawaban.map((opt) => {
        const isCorrect = opt.label.toUpperCase() === soal.kunci_jawaban.toUpperCase();
        return `
          <div class="option-row ${isCorrect ? 'correct-answer' : ''}">
            <span class="option-label">${opt.label}</span>
            <div class="flex-grow-1">${opt.teks} ${isCorrect ? '<b class="text-emerald-400 ms-2 font-mono">(Kunci Jawaban)</b>' : ''}</div>
          </div>
        `;
      }).join("");
    }

    // Render Tabel jika ada di pertanyaan
    const formattedQuestion = parseMarkdownTable(soal.pertanyaan);

    // Render SVG jika ada
    const svgHtml = soal.ilustrasi_svg ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) : "";

    const stepsHtml = soal.pembahasan_langkah.map(st => `<li class="mb-1 text-zinc-200">${st}</li>`).join("");
    const tipsHtml = soal.tips_atau_jebakan 
      ? `<div class="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-xs"><b>💡 Tips & Miskonsepsi Siswa:</b> ${soal.tips_atau_jebakan}</div>` 
      : "";

    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 text-xs font-mono font-bold">Paket ${activeParallelTab}</span>
          <h5 class="font-bold text-white text-sm sm:text-base">Soal Nomor ${soal.nomor}</h5>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">${soal.tingkat_kesulitan}</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">${soal.subtopik}</span>
        </div>
      </div>

      <!-- Pertanyaan (Termasuk Tabel Markdown) -->
      <div class="text-sm leading-relaxed text-zinc-100 mb-3">${formattedQuestion}</div>

      <!-- Ilustrasi SVG (Jika Ada) -->
      ${svgHtml}

      <div class="space-y-1 mb-3">${optionsHtml}</div>

      <!-- Pembahasan Box -->
      <div class="pembahasan-box">
        <div class="flex items-center gap-2 mb-2 text-xs font-bold text-violet-300">
          <i data-lucide="book-open" class="w-4 h-4"></i>
          <span>Kunci Jawaban: <b class="text-emerald-400 text-sm">${soal.kunci_jawaban}</b></span>
        </div>
        <div class="text-xs font-semibold text-zinc-400 mb-1">Langkah-Langkah Penyelesaian:</div>
        <ul class="list-disc list-inside text-xs space-y-1 pl-1">${stepsHtml}</ul>
        ${tipsHtml}
      </div>
    `;

    container.appendChild(card);
  });
}

// RENDER SISWA QUESTIONS
function renderStudentQuestions(questions) {
  const container = document.getElementById("studentQuestionsList");
  container.innerHTML = "";
  document.getElementById("studentScoreBanner").classList.add("hidden");

  questions.forEach((soal) => {
    const card = document.createElement("div");
    card.className = "question-item";
    card.id = `student-card-${soal.nomor}`;

    let inputHtml = "";
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      inputHtml = soal.pilihan_jawaban.map((opt) => `
        <label class="option-row" for="opt_${soal.nomor}_${opt.label}">
          <input type="radio" class="mr-2.5 text-violet-600 focus:ring-violet-500" name="q_${soal.nomor}" id="opt_${soal.nomor}_${opt.label}" value="${opt.label}">
          <span class="option-label">${opt.label}</span>
          <span class="flex-grow-1">${opt.teks}</span>
        </label>
      `).join("");
    } else {
      inputHtml = `
        <textarea class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:ring-2 focus:ring-violet-500 outline-none" rows="3" placeholder="Tuliskan langkah jawaban Anda di sini..."></textarea>
      `;
    }

    const formattedQuestion = parseMarkdownTable(soal.pertanyaan);
    const svgHtml = soal.ilustrasi_svg ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) : "";

    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h6 class="text-xs font-bold text-zinc-400">Nomor ${soal.nomor} (${soal.subtopik}) — Paket ${activeParallelTab}</h6>
        <span class="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">${soal.tingkat_kesulitan}</span>
      </div>
      <div class="text-sm text-zinc-100 mb-3">${formattedQuestion}</div>
      ${svgHtml}
      <div class="space-y-1">${inputHtml}</div>
      <div id="feedback-${soal.nomor}" class="mt-2 text-xs hidden"></div>
    `;

    container.appendChild(card);
  });

  document.getElementById("btnSubmitStudentQuiz").onclick = () => {
    evaluateStudentQuiz(questions);
  };
}

// EVALUASI KUIS SISWA
function evaluateStudentQuiz(questions) {
  let correct = 0;
  let totalPG = 0;

  questions.forEach((soal) => {
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      totalPG++;
      const checkedRadio = document.querySelector(`input[name="q_${soal.nomor}"]:checked`);
      const feedbackDiv = document.getElementById(`feedback-${soal.nomor}`);
      feedbackDiv.classList.remove("hidden");

      if (checkedRadio) {
        const userChoice = checkedRadio.value;
        if (userChoice.toUpperCase() === soal.kunci_jawaban.toUpperCase()) {
          correct++;
          feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs";
          feedbackDiv.innerHTML = `✅ <b>Tepat Sekali!</b> Jawaban Anda: ${userChoice}`;
        } else {
          feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs";
          feedbackDiv.innerHTML = `❌ <b>Kurang Tepat.</b> Jawaban Anda: ${userChoice} | Kunci Jawaban: <b>${soal.kunci_jawaban}</b>`;
        }
      } else {
        feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs";
        feedbackDiv.innerHTML = `⚠️ <b>Belum Dijawab.</b> Kunci Jawaban: <b>${soal.kunci_jawaban}</b>`;
      }
    }
  });

  if (totalPG > 0) {
    const score = Math.round((correct / totalPG) * 100);
    const banner = document.getElementById("studentScoreBanner");
    banner.classList.remove("hidden");
    document.getElementById("studentScoreVal").textContent = score;
    banner.scrollIntoView({ behavior: "smooth" });
  }
}

// RENDER TAB KISI-KISI
function renderKisiKisiTab(kisiList) {
  const container = document.getElementById("kisiKisiDisplayCard");
  let rows = kisiList.map(k => `
    <tr>
      <td class="font-mono font-bold text-center">${k.nomor}</td>
      <td class="text-left">${k.cp_tp}</td>
      <td class="text-left">${k.indikator_soal}</td>
      <td class="font-bold text-violet-400 text-center">${k.level_kognitif}</td>
      <td class="text-center">${k.bentuk_soal}</td>
      <td class="font-bold text-emerald-400 text-center">${k.kunci_jawaban}</td>
      <td class="font-mono text-center">${k.skor || 10}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <i data-lucide="clipboard-check" class="w-5 h-5 text-amber-400"></i>
      <h4 class="text-base font-bold text-white">Matriks Kisi-Kisi &amp; Kartu Soal Resmi</h4>
    </div>
    <p class="text-xs text-zinc-400 mb-4">Pemetaan Capaian Pembelajaran (CP), Indikator Asesmen, dan Taksonomi Bloom untuk dokumen administrasi ujian.</p>
    
    <div class="chem-table-container">
      <table class="chem-table">
        <thead>
          <tr>
            <th style="width: 50px;">No</th>
            <th>Capaian / Tujuan Pembelajaran</th>
            <th>Indikator Butir Soal</th>
            <th style="width: 80px;">Level</th>
            <th style="width: 90px;">Bentuk</th>
            <th style="width: 70px;">Kunci</th>
            <th style="width: 60px;">Skor</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  // Render juga ke section cetak
  const printContainer = document.getElementById("printKisiKisiContent");
  printContainer.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: left;" border="1">
      <thead>
        <tr style="background: #eee;">
          <th style="padding: 4pt; text-align: center;">No</th>
          <th style="padding: 4pt;">Capaian / Tujuan Pembelajaran</th>
          <th style="padding: 4pt;">Indikator Soal</th>
          <th style="padding: 4pt; text-align: center;">Level</th>
          <th style="padding: 4pt; text-align: center;">Bentuk</th>
          <th style="padding: 4pt; text-align: center;">Kunci</th>
          <th style="padding: 4pt; text-align: center;">Skor</th>
        </tr>
      </thead>
      <tbody>
        ${kisiList.map(k => `
          <tr>
            <td style="padding: 4pt; text-align: center;">${k.nomor}</td>
            <td style="padding: 4pt;">${k.cp_tp}</td>
            <td style="padding: 4pt;">${k.indikator_soal}</td>
            <td style="padding: 4pt; text-align: center;">${k.level_kognitif}</td>
            <td style="padding: 4pt; text-align: center;">${k.bentuk_soal}</td>
            <td style="padding: 4pt; text-align: center; font-weight: bold;">${k.kunci_jawaban}</td>
            <td style="padding: 4pt; text-align: center;">${k.skor || 10}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// PRINT / PDF LAYOUT RENDERER
function renderPrintLayout(pkg) {
  document.getElementById("printMetaText").textContent = `Mata Pelajaran: Kimia | Jenjang: ${pkg.jenjang} | Topik: ${pkg.topik_utama}`;

  const qContainer = document.getElementById("printQuestionsContent");
  const sContainer = document.getElementById("printSolutionsContent");
  qContainer.innerHTML = "";
  sContainer.innerHTML = "";

  const renderPrintQuestions = (questions, labelPaket) => {
    let html = `<h4 style="margin: 10pt 0 6pt 0; text-decoration: underline;">LEMBAR SOAL ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;
    questions.forEach((soal) => {
      let optText = "";
      if (soal.pilihan_jawaban) {
        optText = soal.pilihan_jawaban.map(o => `
          <div style="margin-left: 18pt; margin-top: 2pt;">
            <b>${o.label}.</b> ${cleanLatex(o.teks)}
          </div>
        `).join("");
      } else {
        optText = `<div style="margin-left: 18pt; margin-top: 6pt; color: #555;">[Jawaban: ..........................................................................................................................]</div>`;
      }

      html += `
        <div style="margin-bottom: 12pt; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 3pt;">${soal.nomor}. ${cleanLatex(soal.pertanyaan)}</div>
          ${optText}
        </div>
      `;
    });
    return html;
  };

  const renderPrintSolutions = (questions, labelPaket) => {
    let html = `<h4 style="margin: 10pt 0 6pt 0; text-decoration: underline;">KUNCI JAWABAN &amp; PEMBAHASAN ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;
    questions.forEach((soal) => {
      const steps = soal.pembahasan_langkah.map(st => `<li>${cleanLatex(st)}</li>`).join("");
      html += `
        <div style="margin-bottom: 10pt; page-break-inside: avoid;">
          <div style="font-weight: bold;">Soal ${soal.nomor} — Kunci: <u>${soal.kunci_jawaban}</u></div>
          <ul style="margin: 2pt 0; padding-left: 18pt;">${steps}</ul>
          ${soal.tips_atau_jebakan ? `<div style="font-size: 9pt; font-style: italic; margin-left: 18pt;">Tips: ${cleanLatex(soal.tips_atau_jebakan)}</div>` : ''}
        </div>
      `;
    });
    return html;
  };

  qContainer.innerHTML = renderPrintQuestions(pkg.daftar_soal, pkg.daftar_soal_paket_b ? "PAKET A" : "");
  sContainer.innerHTML = renderPrintSolutions(pkg.daftar_soal, pkg.daftar_soal_paket_b ? "PAKET A" : "");

  if (pkg.daftar_soal_paket_b && pkg.daftar_soal_paket_b.length > 0) {
    qContainer.innerHTML += `<div class="page-break"></div>` + renderPrintQuestions(pkg.daftar_soal_paket_b, "PAKET B");
    sContainer.innerHTML += `<div class="page-break"></div>` + renderPrintSolutions(pkg.daftar_soal_paket_b, "PAKET B");
  }
}

// PEMBERSIH LATEX UNTUK PLAIN TEXT / WORD
function cleanLatex(text) {
  if (!text) return "";
  let s = formatChemistryText(text);
  return s
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\$\\rightarrow\$/g, "→")
    .replace(/\\rightarrow/g, "→")
    .replace(/\$\\leftrightarrow\$/g, "⇄")
    .replace(/\\leftrightarrow/g, "⇄")
    .replace(/\$\\Delta\$/g, "Δ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\$\\circ\$/g, "°")
    .replace(/\\circ/g, "°")
    .replace(/\{,\}/g, ",")
    .replace(/\\%/g, "%")
    .replace(/\$/g, "");
}

// EXPORT HANDLERS
function initExportListeners() {
  document.getElementById("btnPrintExam").addEventListener("click", () => {
    if (!currentPackage) return;
    window.print();
  });

  document.getElementById("btnExportWord").addEventListener("click", () => {
    if (!currentPackage) return;
    exportToWordDocx(currentPackage);
  });

  document.getElementById("btnExportExcelQuizizz").addEventListener("click", () => {
    if (!currentPackage) return;
    exportToQuizizzExcel(currentPackage);
  });

  document.getElementById("btnExportMarkdown").addEventListener("click", () => {
    if (!currentPackage) return;
    exportToMarkdownFile(currentPackage);
  });

  document.getElementById("btnExportJson").addEventListener("click", () => {
    if (!currentPackage) return;
    exportToJsonFile(currentPackage);
  });

  const btnSaveCloud = document.getElementById("btnSaveToCloudBank");
  if (btnSaveCloud) {
    btnSaveCloud.addEventListener("click", async () => {
      if (!currentPackage) return;
      const gasUrl = getGasUrl();
      if (!gasUrl) {
        alert("⚠️ Backend Google Apps Script belum dikonfigurasi.\nSilakan klik tombol 'Set API / Backend' di kanan atas dan masukkan URL Web App GAS Anda!");
        document.getElementById("apiKeyModal").classList.remove("hidden");
        return;
      }

      btnSaveCloud.disabled = true;
      const oldHtml = btnSaveCloud.innerHTML;
      btnSaveCloud.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-purple-400"></i><span>Menyimpan...</span>`;
      if (window.lucide) lucide.createIcons();

      try {
        const resp = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "simpanBankSoal",
            dataSoal: currentPackage
          })
        });

        const result = await resp.json();
        if (result.status === "ok") {
          alert(`✅ BERHASIL DISIMPAN KE CLOUD!\n\nPaket soal telah tercatat ke Google Spreadsheet Bank Soal.\n${result.spreadsheetUrl ? 'Buka: ' + result.spreadsheetUrl : ''}`);
        } else {
          alert(`❌ Gagal menyimpan ke Spreadsheet: ${result.message || 'Terjadi kesalahan di server GAS'}`);
        }
      } catch (err) {
        alert(`❌ Gagal menghubungi backend GAS: ${err.message}`);
      } finally {
        btnSaveCloud.disabled = false;
        btnSaveCloud.innerHTML = oldHtml;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
}

// EXCEL QUIZIZZ EXPORTER (.xlsx via SheetJS)
function exportToQuizizzExcel(pkg) {
  if (!window.XLSX) {
    alert("Library SheetJS (XLSX) sedang dimuat. Silakan coba lagi sesaat lagi.");
    return;
  }

  const wb = XLSX.utils.book_new();

  const prepareQuizizzRows = (questions) => {
    const rows = [
      ["Question Text", "Question Type", "Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Correct Answer", "Time in seconds", "Image Link", "Explanation"]
    ];

    questions.forEach((q) => {
      let opt1 = "", opt2 = "", opt3 = "", opt4 = "", opt5 = "";
      if (q.pilihan_jawaban) {
        q.pilihan_jawaban.forEach(o => {
          const l = o.label.toUpperCase();
          if (l === 'A') opt1 = cleanLatex(o.teks);
          else if (l === 'B') opt2 = cleanLatex(o.teks);
          else if (l === 'C') opt3 = cleanLatex(o.teks);
          else if (l === 'D') opt4 = cleanLatex(o.teks);
          else if (l === 'E') opt5 = cleanLatex(o.teks);
        });
      }

      // Konversi kunci huruf (A,B,C,D,E) ke nomor (1,2,3,4,5) untuk Quizizz
      let correctIdx = 1;
      const keyUpper = q.kunci_jawaban.toUpperCase().trim();
      if (keyUpper === 'B' || keyUpper === '2') correctIdx = 2;
      else if (keyUpper === 'C' || keyUpper === '3') correctIdx = 3;
      else if (keyUpper === 'D' || keyUpper === '4') correctIdx = 4;
      else if (keyUpper === 'E' || keyUpper === '5') correctIdx = 5;

      const explanation = q.pembahasan_langkah ? q.pembahasan_langkah.map(cleanLatex).join(" | ") : "";

      rows.push([
        cleanLatex(q.pertanyaan),
        "Multiple Choice",
        opt1,
        opt2,
        opt3,
        opt4,
        opt5,
        correctIdx,
        60, // waktu default 60 detik per butir
        "",
        explanation
      ]);
    });

    return rows;
  };

  const wsA = XLSX.utils.aoa_to_sheet(prepareQuizizzRows(pkg.daftar_soal));
  XLSX.utils.book_append_sheet(wb, wsA, "Quizizz Paket A");

  if (pkg.daftar_soal_paket_b && pkg.daftar_soal_paket_b.length > 0) {
    const wsB = XLSX.utils.aoa_to_sheet(prepareQuizizzRows(pkg.daftar_soal_paket_b));
    XLSX.utils.book_append_sheet(wb, wsB, "Quizizz Paket B");
  }

  if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0) {
    const kisiRows = [
      ["No", "Capaian / Tujuan Pembelajaran (CP/TP)", "Indikator Soal", "Level Kognitif", "Bentuk Soal", "Kunci Jawaban", "Skor Maksimal"]
    ];
    pkg.kisi_kisi_asesmen.forEach(k => {
      kisiRows.push([k.nomor, k.cp_tp, k.indikator_soal, k.level_kognitif, k.bentuk_soal, k.kunci_jawaban, k.skor || 10]);
    });
    const wsKisi = XLSX.utils.aoa_to_sheet(kisiRows);
    XLSX.utils.book_append_sheet(wb, wsKisi, "Matriks Kisi-Kisi");
  }

  const fileName = `Quizizz_${pkg.judul.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// WORD EXPORTER (.doc / .docx)
function exportToWordDocx(pkg) {
  const formatWordQuestions = (questions, label) => {
    return questions.map((soal) => {
      let opts = "";
      if (soal.pilihan_jawaban) {
        opts = soal.pilihan_jawaban.map(o => `
          <p style="margin-left: 20pt; margin-top: 2pt; margin-bottom: 2pt;">
            <b>${o.label}.</b> ${cleanLatex(o.teks)}
          </p>
        `).join("");
      } else {
        opts = `<p style="margin-left: 20pt; margin-top: 6pt;">[Jawaban: .....................................................................................................]</p>`;
      }
      return `
        <div style="margin-bottom: 12pt;">
          <p style="font-weight: bold; margin-bottom: 4pt;">${soal.nomor}. ${cleanLatex(soal.pertanyaan)}</p>
          ${opts}
        </div>
      `;
    }).join("");
  };

  const formatWordSolutions = (questions, label) => {
    return questions.map((soal) => {
      let steps = soal.pembahasan_langkah.map(st => `<li>${cleanLatex(st)}</li>`).join("");
      return `
        <div style="margin-bottom: 12pt;">
          <p style="font-weight: bold; margin-bottom: 2pt;">Soal ${soal.nomor} — Kunci: ${soal.kunci_jawaban}</p>
          <ul style="margin: 0; padding-left: 20pt;">${steps}</ul>
          ${soal.tips_atau_jebakan ? `<p style="font-size: 10pt; font-style: italic; margin-left: 20pt; margin-top: 3pt;">💡 Tips: ${cleanLatex(soal.tips_atau_jebakan)}</p>` : ''}
        </div>
      `;
    }).join("");
  };

  let questionsPart = `<h3 style="color: #2980b9;">BAGIAN I: LEMBAR SOAL ${pkg.daftar_soal_paket_b ? '(PAKET A)' : ''}</h3>` + formatWordQuestions(pkg.daftar_soal);
  let solutionsPart = `<h3 style="color: #c0392b; text-align: center;">BAGIAN II: KUNCI JAWABAN &amp; PEMBAHASAN ${pkg.daftar_soal_paket_b ? '(PAKET A)' : ''}</h3>` + formatWordSolutions(pkg.daftar_soal);

  if (pkg.daftar_soal_paket_b && pkg.daftar_soal_paket_b.length > 0) {
    questionsPart += `<div class="page-break"></div><h3 style="color: #2980b9;">LEMBAR SOAL (PAKET B)</h3>` + formatWordQuestions(pkg.daftar_soal_paket_b);
    solutionsPart += `<div class="page-break"></div><h3 style="color: #c0392b; text-align: center;">KUNCI JAWABAN &amp; PEMBAHASAN (PAKET B)</h3>` + formatWordSolutions(pkg.daftar_soal_paket_b);
  }

  let kisiPart = "";
  if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0) {
    let rows = pkg.kisi_kisi_asesmen.map(k => `
      <tr>
        <td style="padding: 4pt; text-align: center;">${k.nomor}</td>
        <td style="padding: 4pt;">${k.cp_tp}</td>
        <td style="padding: 4pt;">${k.indikator_soal}</td>
        <td style="padding: 4pt; text-align: center;">${k.level_kognitif}</td>
        <td style="padding: 4pt; text-align: center;">${k.bentuk_soal}</td>
        <td style="padding: 4pt; text-align: center; font-weight: bold;">${k.kunci_jawaban}</td>
        <td style="padding: 4pt; text-align: center;">${k.skor || 10}</td>
      </tr>
    `).join("");

    kisiPart = `
      <div class="page-break"></div>
      <h3 style="color: #8e44ad; text-align: center;">LAMPIRAN: MATRIKS KISI-KISI &amp; KARTU SOAL ASESMEN</h3>
      <div style="border-bottom: 1px solid #000; margin-bottom: 12pt;"></div>
      <table border="1" style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <thead>
          <tr style="background: #eee;">
            <th>No</th>
            <th>Capaian / Tujuan Pembelajaran</th>
            <th>Indikator Butir Soal</th>
            <th>Level</th>
            <th>Bentuk</th>
            <th>Kunci</th>
            <th>Skor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${pkg.judul}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #000; }
        h2 { text-align: center; font-size: 14pt; margin-bottom: 4pt; color: #1E3C72; }
        .meta { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 15pt; border-bottom: 2px solid #000; padding-bottom: 8pt; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h2>${pkg.judul.toUpperCase()}</h2>
      <div class='meta'>Mata Pelajaran: Kimia | Jenjang: ${pkg.jenjang} | Topik: ${pkg.topik_utama} | Pendekatan: ${pkg.stimulus_model || 'Kontekstual'}</div>
      ${questionsPart}

      <div class="page-break"></div>
      ${solutionsPart}

      ${kisiPart}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// MARKDOWN EXPORTER
function exportToMarkdownFile(pkg) {
  let lines = [
    `# ${pkg.judul}`,
    `**Jenjang:** ${pkg.jenjang} | **Topik Pokok:** ${pkg.topik_utama} | **Model:** ${pkg.stimulus_model || 'Kontekstual'}\n`,
    `---\n`,
    `## 📝 Lembar Soal (Paket A)\n`
  ];

  const formatMdList = (list) => {
    list.forEach((soal) => {
      lines.push(`### Soal ${soal.nomor} (${soal.tingkat_kesulitan})`);
      lines.push(`*${soal.subtopik}*\n`);
      lines.push(`${soal.pertanyaan}\n`);

      if (soal.pilihan_jawaban) {
        soal.pilihan_jawaban.forEach((o) => {
          lines.push(`- **${o.label}.** ${o.teks}`);
        });
        lines.push("");
      }

      lines.push("<details>");
      lines.push("<summary><b>🔍 Kunci Jawaban & Pembahasan</b></summary>\n");
      lines.push(`**Kunci Jawaban:** \`${soal.kunci_jawaban}\`\n`);
      lines.push("**Langkah Penyelesaian:**");
      soal.pembahasan_langkah.forEach((st) => lines.push(`- ${st}`));
      if (soal.tips_atau_jebakan) {
        lines.push(`\n> 💡 **Tips / Jebakan:** ${soal.tips_atau_jebakan}`);
      }
      lines.push("\n</details>\n---\n");
    });
  };

  formatMdList(pkg.daftar_soal);

  if (pkg.daftar_soal_paket_b && pkg.daftar_soal_paket_b.length > 0) {
    lines.push(`\n## 📝 Lembar Soal Paralel (Paket B)\n`);
    formatMdList(pkg.daftar_soal_paket_b);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON EXPORTER
function exportToJsonFile(pkg) {
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
