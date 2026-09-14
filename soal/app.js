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
let savedQuestions = [];     // Koleksi soal yang ditandai / disimpan oleh guru
let filterSavedOnly = false; // Filter tampilan: tampilkan hanya soal yang ditandai

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
   - Tanda dollar inline ($...$) WAJIB DIGUNAKAN untuk SEMUA rumus kimia, ion, dan reaksi:
     a. Rumus kimia senyawa/ion: $\\text{H}_2\\text{SO}_4$, $\\text{Al}^{3+}$, $\\text{CH}_3\\text{COOH}$, $\\text{Ca(OH)}_2$, $\\text{KOH}$, $\\text{O}_2$, $\\text{C}_x\\text{H}_{2x+2}$, $\\text{C}_2\\text{H}_6$, $\\text{C}_y\\text{H}_{2y}$
     b. Persamaan reaksi kimia: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$, $\\text{C}_x\\text{H}_{2x+2} + \\frac{3x+1}{2}\\text{O}_2 \\rightarrow x\\text{CO}_2 + (x+1)\\text{H}_2\\text{O}$
     c. Besaran termokimia & kesetimbangan: $\\Delta H = -285{,}8\\text{ kJ/mol}$, $K_a = 10^{-5}$, $E^\\circ = +1{,}10\\text{ V}$, $\\text{pH} = 3 - \\log 2$
   - ATURAN KUNCI JAWABAN & PEMBAHASAN: Wajib juga menyertakan tanda dollar ($...$) pada rumus kimia, persamaan reaksi, dan variabel perhitungan.
   - PERINGATAN KERAS: JANGAN PERNAH menulis perintah LaTeX seperti \\text{...}, \\rightarrow, \\rightleftharpoons, atau \\frac{...}{...} tanpa diapit tanda dollar $! Penulisan bare LaTeX tanpa tanda dollar inline dilarang keras.

3. FORMAT TABEL DATA & ILUSTRASI KIMIA SVG (PROPORSIONAL & KONTEKSTUAL):
   - Gunakan tabel data eksperimen atau diagram vektor SVG HANYA untuk butir soal yang secara alamiah membutuhkan data empiris atau sajian visual (misal: Laju Reaksi, Sel Volta/Elektrolisis, Diagram Tingkat Energi Hess, Buret Titrasi).
   - JANGAN memaksakan tabel atau diagram pada seluruh butir soal jika konteks soal bersifat konseptual murni atau perhitungan numerik langsung.
   - KECUALI jika guru menuliskan instruksi khusus yang mewajibkan diagram/tabel pada tiap soal, baru patuhi instruksi tersebut secara penuh.
   - Jika memuat diagram SVG: kode SVG harus bersih, menggunakan viewBox="0 0 400 250", kontras tinggi, teks terbaca jelas, dan tanpa tag script berbahaya.

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
  initConnectionModal();
  initFormListeners();
  initTabListeners();
  initCollectionListeners();
  initExportListeners();
});

// URL BACKEND GAS DENGAN PRIORITAS SUITE CONFIG
function getGasUrl() {
  if (typeof window !== 'undefined') {
    if (window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.SOAL_API && window.PORTALKIMIA_CONFIG.SOAL_API.startsWith('http')) {
      return window.PORTALKIMIA_CONFIG.SOAL_API.trim();
    }
    if (window.SOAL_CONFIG && window.SOAL_CONFIG.GAS_API_URL && window.SOAL_CONFIG.GAS_API_URL.startsWith('http')) {
      return window.SOAL_CONFIG.GAS_API_URL.trim();
    }
  }
  const localGas = localStorage.getItem("portal_soal_gas_url");
  if (localGas && localGas.startsWith('http')) {
    return localGas.trim();
  }
  return "https://script.google.com/macros/s/AKfycbx5znz66Ye57dVVgoqiD5_QUlhbr8ap7ve81iJqeFNjLaVVRaTwpUzDMipXfE5bQbSSMQ/exec";
}

// MODAL TES KONEKSI & DIAGNOSTIK AI
function initConnectionModal() {
  const modal = document.getElementById("connectionModal");
  const btnOpen = document.getElementById("btnOpenConnectionModal");
  const btnClose = document.getElementById("closeConnectionModalBtn");
  const btnCloseBottom = document.getElementById("btnCloseDiagModal");
  const btnPing = document.getElementById("btnRunDiagnosticPing");
  const diagResult = document.getElementById("diagPingResult");
  const diagEndpointText = document.getElementById("diagEndpointText");
  const connStatusText = document.getElementById("connectionStatusText");

  const gasUrl = getGasUrl();
  if (diagEndpointText) {
    diagEndpointText.textContent = gasUrl ? `Tersambung ke ${gasUrl.slice(0, 48)}...` : "URL GAS belum terpasang";
  }

  const openModal = () => {
    modal.classList.remove("hidden");
    runPingTest();
  };
  const closeModal = () => modal.classList.add("hidden");

  if (btnOpen) btnOpen.addEventListener("click", openModal);
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCloseBottom) btnCloseBottom.addEventListener("click", closeModal);

  async function runPingTest() {
    const url = getGasUrl();
    if (!url) {
      if (diagResult) diagResult.innerHTML = `<span class="text-rose-400">❌ URL Backend GAS belum terpasang di config.js!</span>`;
      return;
    }

    if (btnPing) {
      btnPing.disabled = true;
      btnPing.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Menguji...</span>`;
      if (window.lucide) lucide.createIcons();
    }

    if (diagResult) {
      diagResult.innerHTML = `<span class="text-zinc-400">Menghubungi Google Apps Script &amp; AI Gemini...</span>`;
    }

    const tStart = performance.now();
    try {
      const pingUrl = url + (url.includes("?") ? "&" : "?") + "action=ping&_t=" + Date.now();
      const res = await fetch(pingUrl, { method: "GET", mode: "cors" });
      const latency = Math.round(performance.now() - tStart);

      if (res.ok) {
        const json = await res.json();
        if (diagResult) {
          diagResult.innerHTML = `
            <div class="text-emerald-400 font-semibold">✅ Status: Terhubung Normal (HTTP 200)</div>
            <div class="text-zinc-200">⏱️ Latensi Server: <b class="text-emerald-300">${latency} ms</b></div>
            <div class="text-zinc-400 text-[10px] mt-1">Layanan: ${json.service || 'PortalKimia Generator Soal AI Backend'}</div>
          `;
        }
        if (connStatusText) {
          connStatusText.textContent = `Online (${latency} ms)`;
        }
      } else {
        if (diagResult) {
          diagResult.innerHTML = `<span class="text-amber-400">⚠️ Respon server: HTTP ${res.status} (${latency} ms)</span>`;
        }
      }
    } catch (err) {
      if (diagResult) {
        diagResult.innerHTML = `<span class="text-rose-400">❌ Gagal terhubung: ${err.message}</span>`;
      }
    } finally {
      if (btnPing) {
        btnPing.disabled = false;
        btnPing.innerHTML = `<i data-lucide="zap" class="w-3.5 h-3.5"></i><span>Uji Lagi</span>`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  if (btnPing) {
    btnPing.addEventListener("click", runPingTest);
  }

  // Cek latensi otomatis di awal
  setTimeout(() => {
    const url = getGasUrl();
    if (url) {
      const t0 = performance.now();
      fetch(url + (url.includes("?") ? "&" : "?") + "action=ping&_t=" + Date.now(), { method: "GET", mode: "cors" })
        .then(r => r.json())
        .then(() => {
          const lat = Math.round(performance.now() - t0);
          if (connStatusText) connStatusText.textContent = `AI Aktif (${lat} ms)`;
        })
        .catch(() => {
          if (connStatusText) connStatusText.textContent = "AI Siap";
        });
    }
  }, 800);
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

// KOLEKSI SOAL TERSIMPAN / DITANDAI (FITUR SIMPAN INKREMENTAL)
function initCollectionListeners() {
  const btnFilter = document.getElementById("btnFilterSavedOnly");
  const btnClear = document.getElementById("btnClearSavedCollection");
  const filterText = document.getElementById("filterSavedText");

  if (btnFilter) {
    btnFilter.addEventListener("click", () => {
      filterSavedOnly = !filterSavedOnly;
      if (filterSavedOnly) {
        btnFilter.className = "px-3 py-1.5 rounded-lg bg-violet-600 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm";
        if (filterText) filterText.textContent = "Tampilkan Semua Soal";
      } else {
        btnFilter.className = "px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium transition-all text-xs flex items-center gap-1.5 border border-zinc-700";
        if (filterText) filterText.textContent = "Lihat Soal Ditandai Saja";
      }
      renderActiveQuestionsList();
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (savedQuestions.length === 0) {
        alert("Belum ada soal yang ditandai.");
        return;
      }
      if (confirm(`Apakah Anda yakin ingin mereset tanda simpan pada ${savedQuestions.length} butir soal ini?`)) {
        if (currentPackage && currentPackage.daftar_soal) {
          currentPackage.daftar_soal.forEach(q => q.is_pinned = false);
        }
        if (currentPackage && currentPackage.daftar_soal_paket_b) {
          currentPackage.daftar_soal_paket_b.forEach(q => q.is_pinned = false);
        }
        savedQuestions = [];
        filterSavedOnly = false;
        if (btnFilter) {
          btnFilter.className = "px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium transition-all text-xs flex items-center gap-1.5 border border-zinc-700";
          if (filterText) filterText.textContent = "Lihat Soal Ditandai Saja";
        }
        updateSavedCountBadge();
        renderActiveQuestionsList();
      }
    });
  }
}

function updateSavedCountBadge() {
  const badge = document.getElementById("savedCountBadge");
  if (badge) {
    badge.textContent = `${savedQuestions.length} Soal Ditandai`;
  }
}

function togglePinQuestion(nomor) {
  if (!currentPackage || !currentPackage.daftar_soal) return;
  const list = (activeParallelTab === 'B' && currentPackage.daftar_soal_paket_b)
    ? currentPackage.daftar_soal_paket_b
    : currentPackage.daftar_soal;

  const target = list.find(q => q.nomor === nomor);
  if (!target) return;

  target.is_pinned = !target.is_pinned;

  syncSavedQuestions();
  updateSavedCountBadge();
  renderActiveQuestionsList();
  renderPrintLayout(currentPackage);
}

function syncSavedQuestions() {
  if (!currentPackage) return;
  const pinnedA = Array.isArray(currentPackage.daftar_soal) ? currentPackage.daftar_soal.filter(q => q.is_pinned === true) : [];
  const pinnedB = Array.isArray(currentPackage.daftar_soal_paket_b) ? currentPackage.daftar_soal_paket_b.filter(q => q.is_pinned === true) : [];
  savedQuestions = [...pinnedA, ...pinnedB.filter(b => !pinnedA.some(a => a.pertanyaan === b.pertanyaan))];
}

/**
 * KONVERTER NOTASI KIMIA & FORMULA LATEX MENJADI HTML NATIVE UNTUK WORD (.DOC)
 * Word tidak menjalankan JavaScript KaTeX, sehingga formula diubah menjadi
 * tag HTML native: <sub>, <sup>, &rarr;, &#8652;, &Delta;, dll.
 */
function formatChemistryForWordHtml(text) {
  if (!text) return "";

  // Pastikan format LaTeX sudah dinormalisasi dan di-repair terlebih dahulu
  let s = formatChemistryText(text);

  // 1. Konversi tabel Markdown menjadi tabel native HTML Word
  s = convertMarkdownTableToWordHtml(s);

  // 2. Normalisasi pecahan \frac{a}{b} -> (a)/b untuk Word
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/$2");

  // 3. Hapus \text{...} berulang sampai bersih tuntas
  while (/\\text\{/.test(s)) {
    s = s.replace(/\\text\{([^{}]+)\}/g, "$1");
  }

  // 4. Subscripts: _{...} atau _angka/huruf
  s = s.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");
  s = s.replace(/_([0-9a-zA-Z\+\-]+)/g, "<sub>$1</sub>");

  // 5. Superscripts & Derajat Celsius
  s = s.replace(/\^\\circ/g, "&deg;");
  s = s.replace(/\\circ/g, "&deg;");
  s = s.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>");
  s = s.replace(/\^([0-9a-zA-Z\+\-]+)/g, "<sup>$1</sup>");

  // 6. Panah dan Kesetimbangan Kimia
  s = s.replace(/\\rightleftharpoons/g, "&#8652;"); // ⇌
  s = s.replace(/\\longleftrightarrow/g, "&#8652;");
  s = s.replace(/\\leftrightarrow/g, "&harr;");
  s = s.replace(/\\rightarrow/g, "&rarr;"); // →
  s = s.replace(/\\to\b/g, "&rarr;");
  s = s.replace(/\\leftarrow/g, "&larr;");

  // 7. Simbol Termodinamika & Yunani
  s = s.replace(/\\Delta\s*H/g, "&Delta;H");
  s = s.replace(/\\Delta/g, "&Delta;"); // Δ
  s = s.replace(/\\alpha/g, "&alpha;");
  s = s.replace(/\\beta/g, "&beta;");
  s = s.replace(/\\gamma/g, "&gamma;");
  s = s.replace(/\\pm/g, "&plusmn;");
  s = s.replace(/\\times/g, "&times;");
  s = s.replace(/\\cdot/g, "&middot;");
  s = s.replace(/\\dots/g, "...");
  s = s.replace(/\\ldots/g, "...");

  // 8. Bersihkan koma dan persen LaTeX
  s = s.replace(/\{,\}/g, ",");
  s = s.replace(/\\%/g, "%");

  // 9. Hapus delimiter math $
  s = s.replace(/\$\$/g, "");
  s = s.replace(/\$/g, "");

  return s;
}

function convertMarkdownTableToWordHtml(text) {
  if (!text || !text.includes("|")) return text;

  const lines = text.split("\n");
  let inTable = false;
  let tableLines = [];
  let resultLines = [];

  const renderTable = (tbl) => {
    if (tbl.length < 2) return tbl.join("<br>");
    const headerRow = tbl[0];
    const bodyRows = tbl.slice(2);

    const splitCells = (row) => row.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length);

    let headers = splitCells(headerRow);
    let html = `<table border="1" style="width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt;"><thead><tr style="background-color: #f2f2f2;">`;
    headers.forEach(h => html += `<th style="border: 1px solid #000; padding: 4pt 6pt; text-align: center; font-weight: bold;">${formatChemistryForWordHtml(h)}</th>`);
    html += `</tr></thead><tbody>`;

    bodyRows.forEach(r => {
      let cells = splitCells(r);
      if (cells.length > 0) {
        html += `<tr>`;
        cells.forEach(c => html += `<td style="border: 1px solid #000; padding: 4pt 6pt; text-align: left;">${formatChemistryForWordHtml(c)}</td>`);
        html += `</tr>`;
      }
    });

    html += `</tbody></table>`;
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) {
        resultLines.push(renderTable(tableLines));
        tableLines = [];
        inTable = false;
      }
      resultLines.push(lines[i]);
    }
  }

  if (inTable) {
    resultLines.push(renderTable(tableLines));
  }

  return resultLines.join("<br>");
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

  // 7. Auto-Repair & Normalisasi LaTeX (Memastikan setiap rumus, ion, & reaksi terbungkus KaTeX $...$)
  cleaned = repairAndNormalizeLatex(cleaned);

  return cleaned;
}

/**
 * AUTO-REPAIR & NORMALISASI NOTASI LATEX & KIMIA
 * Mengatasi masalah model (termasuk saat Gemini 3.6 fallback) yang memunculkan bare LaTeX (\text{}, \rightarrow, dsb.)
 * tanpa tanda dollar, formula berkurung (\text{...}), atau dangling/unbalanced dollar.
 */
function repairAndNormalizeLatex(text) {
  if (!text || typeof text !== "string") return "";

  let s = text;

  // 1. Perbaiki dangling single dollar pada formula kimia SEBELUM proteksi math
  // Kasus a: "volume gas \text{CO}_2$ dan" -> berawalan \text{ diakhiri $ tanpa pembuka $
  s = s.replace(/(^|[\s\(])(\\text\{[^{}]+\}(?:_[0-9a-zA-Z\{\}\+\-]+|\^[0-9a-zA-Z\{\}\+\-]+)*)\$/g, (m, p1, p2) => {
    return `${p1}$${p2}$`;
  });
  // Kasus b: "volume gas $\text{CO}_2 dan" -> pembuka $ tanpa penutup $ sebelum spasi/tanda baca
  s = s.replace(/(^|[\s\(])\$(\\text\{[^{}]+\}(?:_[0-9a-zA-Z\{\}\+\-]+|\^[0-9a-zA-Z\{\}\+\-]+)*)(?=[\s\.,;:!?\)]|$)/g, (m, p1, p2) => {
    return `${p1}$${p2}$`;
  });

  // 2. Normalisasi delimiter baku LaTeX \(...\) -> $...$ dan \[...\] -> $$...$$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (m, p1) => `$${p1}$`);
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (m, p1) => `$$${p1}$$`);

  // 3. Formula dalam kurung tanpa tanda dollar: (\text{C}_x\text{H}_{2x+2}) -> ($\text{C}_x\text{H}_{2x+2}$)
  s = s.replace(/\(([^()$\r\n]*?\\text\{[^()$\r\n]*?)\)/g, (m, p1) => `($${p1}$)`);

  // 4. Bungkus baris persamaan reaksi kimia utuh tanpa dollar (mengandung panah dan notasi kimia/fraksi)
  const lines = s.split(/\r?\n/);
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes("$")) return line;

    const hasArrow = /(\\rightarrow|\\rightleftharpoons|\\leftrightarrow|\\to)/.test(trimmed);
    const hasChemOrMath = /(\\text|\\frac|_|\^)/.test(trimmed);

    if (hasArrow && hasChemOrMath) {
      // Jika baris diawali nomor poin seperti "1. " atau "- "
      const listMatch = line.match(/^(\s*(?:[0-9]+\.|\-|\*)\s*)(.*)$/);
      if (listMatch) {
        const prefix = listMatch[1];
        const content = listMatch[2].trim();
        const colonIdx = content.indexOf(":");
        const slashIdx = content.indexOf("\\");
        if (colonIdx !== -1 && (slashIdx === -1 || colonIdx < slashIdx)) {
          const intro = content.substring(0, colonIdx + 1);
          const mathPart = content.substring(colonIdx + 1).trim();
          return `${prefix}${intro} $$${mathPart}$$`;
        } else {
          return `${prefix}$$${content}$$`;
        }
      } else {
        return `$$${trimmed}$$`;
      }
    }
    return line;
  });
  s = processedLines.join("\n");

  // 5. Proteksi seluruh blok matematika valid ($$...$$ dan $...$) dengan placeholder unik
  const mathBlocks = [];
  const placeholderPrefix = "___CHEM_MATH_BLOCK_";

  // Proteksi display math $$...$$
  s = s.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    const idx = mathBlocks.length;
    mathBlocks.push(match);
    return `${placeholderPrefix}${idx}___`;
  });

  // Proteksi inline math $...$ (tidak melompati baris baru)
  s = s.replace(/\$[^\$\r\n]+?\$/g, (match) => {
    const idx = mathBlocks.length;
    mathBlocks.push(match);
    return `${placeholderPrefix}${idx}___`;
  });

  // 6. Teks yang tersisa saat ini 100% berada DI LUAR blok matematika KaTeX:
  // a. Bungkus bare \text{...} beserta subscript/superscript: \text{KOH}, \text{O}_2, dsb.
  s = s.replace(/((?:\\text\{[^{}]+\}(?:_[0-9a-zA-Z\{\}\+\-]+|\^[0-9a-zA-Z\{\}\+\-]+)*)+)/g, (match) => {
    const trimmedM = match.trim();
    if (!trimmedM) return match;
    return `$${trimmedM}$`;
  });

  // b. Bungkus pecahan telanjang: \frac{...}{...}
  s = s.replace(/(\\frac\{[^{}]+\}\{[^{}]+\})/g, (m, p1) => `$${p1}$`);

  // c. Bungkus panah reaksi telanjang: \rightarrow -> $\rightarrow$, \rightleftharpoons -> $\rightleftharpoons$
  s = s.replace(/\\rightarrow/g, "$\\rightarrow$");
  s = s.replace(/\\rightleftharpoons/g, "$\\rightleftharpoons$");
  s = s.replace(/\\leftrightarrow/g, "$\\leftrightarrow$");
  s = s.replace(/\\to\b/g, "$\\to$");

  // d. Bungkus simbol kimia/termodinamika/matematika: \Delta H, \Delta, \cdot, \pm
  s = s.replace(/\\Delta\s*H/g, "$\\Delta H$");
  s = s.replace(/\\Delta\b/g, "$\\Delta$");
  s = s.replace(/\\cdot/g, "$\\cdot$");
  s = s.replace(/\\pm/g, "$\\pm$");

  // 7. Bersihkan dollar kosong ($ $) atau sisa ganjil jika ada
  s = s.replace(/\$\s*\$/g, "");

  // 8. Kembalikan seluruh blok matematika yang telah diproteksi
  for (let i = 0; i < mathBlocks.length; i++) {
    const placeholder = `${placeholderPrefix}${i}___`;
    s = s.replace(placeholder, () => mathBlocks[i]);
  }

  return s;
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

/**
 * NORMALISASI & VALIDASI STRUKTUR PAKET SOAL
 * Menjamin objek paket soal selalu memiliki format valid dan daftar_soal berupa Array,
 * bahkan jika AI mengembalikan format alternatif (soal, questions, array polos, pilihan jawaban object, dsb.)
 */
function normalizeAndValidateQuizPackage(rawInput, defaults = {}) {
  let pkg = rawInput;

  // 1. Ekstraksi dan parsing jika input masih berupa string mentah
  if (typeof pkg === "string") {
    let clean = pkg.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    const firstBrace = clean.indexOf("{");
    const firstBracket = clean.indexOf("[");
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = clean.lastIndexOf("}");
      if (lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1) {
      const lastBracket = clean.lastIndexOf("]");
      if (lastBracket !== -1) clean = clean.substring(firstBracket, lastBracket + 1);
    }
    try {
      pkg = JSON.parse(clean);
    } catch (e) {
      console.error("Gagal melakukan parse JSON paket soal:", e, clean);
      throw new Error("Format respon AI tidak dapat dibaca sebagai JSON valid.");
    }
  }

  if (!pkg || typeof pkg !== "object") {
    throw new Error("Respon AI kosong atau bukan objek valid.");
  }

  // 2. Buka pembungkus bersarang jika ada (.data, .raw, .quiz, .paket, dsb.)
  if (pkg.data && typeof pkg.data === "object" && !Array.isArray(pkg.daftar_soal)) {
    pkg = pkg.data;
  }
  if (pkg.quiz && typeof pkg.quiz === "object" && !Array.isArray(pkg.daftar_soal)) {
    pkg = pkg.quiz;
  }
  if (pkg.paket && typeof pkg.paket === "object" && !Array.isArray(pkg.daftar_soal)) {
    pkg = pkg.paket;
  }

  // 3. Jika respon AI berupa Array langsung (daftar butir soal tanpa pembungkus paket)
  if (Array.isArray(pkg)) {
    pkg = {
      judul: defaults.topic ? `Asesmen Kimia - ${defaults.topic}` : "Naskah Soal Asesmen Kimia",
      jenjang: defaults.grade || "SMA Kelas 11 (Fase F)",
      topik_utama: defaults.topic || "Kimia Umum",
      stimulus_model: defaults.stimulus || "Kontekstual",
      daftar_soal: pkg
    };
  }

  // 4. Deteksi lokasi array butir soal (daftar_soal) dari berbagai variasi penamaan AI
  if (!Array.isArray(pkg.daftar_soal)) {
    if (Array.isArray(pkg.soal)) {
      pkg.daftar_soal = pkg.soal;
    } else if (Array.isArray(pkg.daftarSoal)) {
      pkg.daftar_soal = pkg.daftarSoal;
    } else if (Array.isArray(pkg.questions)) {
      pkg.daftar_soal = pkg.questions;
    } else if (Array.isArray(pkg.items)) {
      pkg.daftar_soal = pkg.items;
    } else if (Array.isArray(pkg.paket_soal)) {
      pkg.daftar_soal = pkg.paket_soal;
    } else if (Array.isArray(pkg.soal_list)) {
      pkg.daftar_soal = pkg.soal_list;
    } else if (Array.isArray(pkg.daftar_pertanyaan)) {
      pkg.daftar_soal = pkg.daftar_pertanyaan;
    } else {
      // Cari properti apa saja yang berupa Array berisi objek soal
      const candidateKey = Object.keys(pkg).find(k => 
        Array.isArray(pkg[k]) && 
        pkg[k].length > 0 && 
        (pkg[k][0].pertanyaan || pkg[k][0].soal || pkg[k][0].question || pkg[k][0].pilihan_jawaban)
      );
      if (candidateKey) {
        pkg.daftar_soal = pkg[candidateKey];
      } else if (pkg.pertanyaan || pkg.soal || pkg.question) {
        // AI hanya mengembalikan 1 butir soal tunggal sebagai objek langsung
        pkg.daftar_soal = [ pkg ];
      } else {
        pkg.daftar_soal = [];
      }
    }
  }

  // 5. Pastikan Paket B jika ada
  if (!Array.isArray(pkg.daftar_soal_paket_b)) {
    if (Array.isArray(pkg.paket_b)) {
      pkg.daftar_soal_paket_b = pkg.paket_b;
    } else if (Array.isArray(pkg.soal_paket_b)) {
      pkg.daftar_soal_paket_b = pkg.soal_paket_b;
    } else {
      delete pkg.daftar_soal_paket_b;
    }
  }

  // 6. Normalisasi setiap butir soal di daftar_soal
  const normalizeList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((soal, idx) => {
      if (!soal || typeof soal !== "object") {
        soal = { pertanyaan: String(soal) };
      }

      soal.nomor = parseInt(soal.nomor, 10) || (idx + 1);
      soal.tipe_soal = soal.tipe_soal || defaults.qType || "Pilihan Ganda";
      soal.topik = soal.topik || defaults.topic || "Kimia";
      soal.subtopik = soal.subtopik || defaults.subtopic || "Materi Esensial";
      soal.tingkat_kesulitan = soal.tingkat_kesulitan || defaults.difficulty || "Sedang";

      // Pertanyaan
      soal.pertanyaan = String(soal.pertanyaan || soal.soal || soal.question || soal.teks || "Pertanyaan belum ditentukan.").trim();

      // Pilihan Jawaban (Menangani format Array maupun format Object { A: '...', B: '...' })
      if (soal.pilihan_jawaban) {
        if (Array.isArray(soal.pilihan_jawaban)) {
          soal.pilihan_jawaban = soal.pilihan_jawaban.map((opt, i) => {
            if (typeof opt === "string") {
              const lbl = String.fromCharCode(65 + i);
              return { label: lbl, teks: opt.replace(/^[A-E][.:\)]\s*/i, "").trim() };
            }
            return {
              label: String(opt.label || String.fromCharCode(65 + i)).trim().toUpperCase(),
              teks: String(opt.teks || opt.text || opt.jawaban || "").trim()
            };
          });
        } else if (typeof soal.pilihan_jawaban === "object") {
          soal.pilihan_jawaban = Object.keys(soal.pilihan_jawaban).map(k => ({
            label: k.trim().toUpperCase(),
            teks: String(soal.pilihan_jawaban[k]).trim()
          }));
        }
      } else if (soal.options || soal.opsi || soal.pilihan) {
        const rawOpts = soal.options || soal.opsi || soal.pilihan;
        if (Array.isArray(rawOpts)) {
          soal.pilihan_jawaban = rawOpts.map((opt, i) => ({
            label: (typeof opt === "object" && opt.label) ? opt.label : String.fromCharCode(65 + i),
            teks: typeof opt === "object" ? (opt.teks || opt.text || "") : String(opt)
          }));
        } else if (typeof rawOpts === "object") {
          soal.pilihan_jawaban = Object.keys(rawOpts).map(k => ({
            label: k.trim().toUpperCase(),
            teks: String(rawOpts[k]).trim()
          }));
        }
      } else {
        soal.pilihan_jawaban = [];
      }

      // Kunci Jawaban
      soal.kunci_jawaban = String(soal.kunci_jawaban || soal.kunci || soal.answer || "A").trim();

      // Pembahasan Langkah
      if (!soal.pembahasan_langkah) {
        if (soal.pembahasan) {
          if (Array.isArray(soal.pembahasan)) {
            soal.pembahasan_langkah = soal.pembahasan.map(String);
          } else if (typeof soal.pembahasan === "string") {
            soal.pembahasan_langkah = soal.pembahasan.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          }
        } else if (soal.explanation) {
          soal.pembahasan_langkah = Array.isArray(soal.explanation) ? soal.explanation.map(String) : [String(soal.explanation)];
        } else {
          soal.pembahasan_langkah = ["Pembahasan dapat diselesaikan berdasarkan konsep stoikiometri dan hukum dasar kimia terkait."];
        }
      } else if (typeof soal.pembahasan_langkah === "string") {
        soal.pembahasan_langkah = soal.pembahasan_langkah.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(soal.pembahasan_langkah)) {
        soal.pembahasan_langkah = [String(soal.pembahasan_langkah)];
      }

      // Tips atau Jebakan
      soal.tips_atau_jebakan = String(soal.tips_atau_jebakan || soal.tips || soal.miskonsepsi || "").trim();

      return soal;
    });
  };

  pkg.daftar_soal = normalizeList(pkg.daftar_soal);
  if (pkg.daftar_soal_paket_b) {
    pkg.daftar_soal_paket_b = normalizeList(pkg.daftar_soal_paket_b);
  }

  // 7. Metadata Paket
  pkg.judul = String(pkg.judul || (defaults.topic ? `Asesmen Kimia - ${defaults.topic}` : "Naskah Soal Asesmen Kimia")).trim();
  pkg.jenjang = String(pkg.jenjang || defaults.grade || "SMA Kelas 11 (Fase F)").trim();
  pkg.topik_utama = String(pkg.topik_utama || defaults.topic || "Kimia Umum").trim();
  pkg.stimulus_model = String(pkg.stimulus_model || defaults.stimulus || "Kontekstual").trim();

  // 8. Kisi-Kisi
  if (pkg.kisi_kisi_asesmen && !Array.isArray(pkg.kisi_kisi_asesmen)) {
    delete pkg.kisi_kisi_asesmen;
  }

  return pkg;
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

  if (pkg.kisi_kisi_asesmen && Array.isArray(pkg.kisi_kisi_asesmen)) {
    pkg.kisi_kisi_asesmen.forEach(k => {
      if (k.cp_tp) k.cp_tp = formatChemistryText(k.cp_tp);
      if (k.indikator_soal) k.indikator_soal = formatChemistryText(k.indikator_soal);
    });
  }

  return pkg;
}

// NOTIFIKASI & PERGANTIAN OTOMATIS KE GEMINI 3.6 FLASH JIKA 3.7 HIGH DEMAND
function notifyFallbackTo36() {
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingDesc = document.getElementById("loadingDesc");
  if (loadingTitle) {
    loadingTitle.textContent = "Gemini 3.7 Flash Sibuk (High Demand)...";
  }
  if (loadingDesc) {
    loadingDesc.innerHTML = `<span class="text-amber-300 font-semibold">⚡ Mengalihkan otomatis ke Gemini 3.6 Flash agar soal tetap selesai dibuat tanpa hambatan...</span>`;
  }

  const headerModelBadge = document.getElementById("headerModelBadge");
  if (headerModelBadge) {
    headerModelBadge.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      <span>Gemini 3.6 Flash (Auto-Fallback)</span>
    `;
  }
  const modelSelect = document.getElementById("modelSelect");
  if (modelSelect) {
    modelSelect.value = "gemini-3.6-flash";
  }
}

// GENERATE QUIZ DENGAN FITUR DINAMIS
async function generateQuiz() {
  const gasUrl = getGasUrl();
  const apiKey = localStorage.getItem("portal_gemini_api_key");
  if (!gasUrl && !apiKey) {
    alert("⚠️ Backend Google Apps Script belum terhubung di config.js!");
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
3. TABEL & ILUSTRASI KIMIA: ${includeVisuals 
     ? 'Sertakan tabel data eksperimen (dalam format Markdown table rapi) atau diagram vektor SVG (pada properti ilustrasi_svg) HANYA untuk butir soal yang secara alamiah membutuhkan pengamatan data empiris / sajian visual (seperti laju reaksi, sel volta, titrasi, termokimia). JANGAN memaksakan tabel atau diagram pada seluruh butir soal jika tidak relevan, KECUALI jika catatan instruksi khusus guru di bawah secara eksplisit meminta tabel/diagram di setiap soal.' 
     : 'Tidak perlu menyertakan tabel atau diagram khusus.'}
4. PAKET PARALEL: ${includeParallel ? 'WAJIB susun juga daftar_soal_paket_b sebanyak ' + numQuestions + ' butir soal paralel yang memiliki indikator setara dengan Paket A namun berbeda variabel/angka stoikiometrinya.' : 'Hanya susun Paket A.'}
5. KISI-KISI ASESMEN: ${includeKisiKisi ? 'WAJIB susun matriks kisi_kisi_asesmen yang memetakan CP/TP, indikator soal, level kognitif Bloom (C2-C5), kunci, dan skor.' : 'Tidak perlu menyusun matriks kisi-kisi.'}

6. FORMAT NOTASI RUMUS KIMIA: SETIAP rumus kimia senyawa/ion dan persamaan reaksi kimia (\text{...}, \rightarrow, \frac) WAJIB DIAPIT TANDA DOLLAR INLINE: $...$ (Contoh: $\text{KOH}$, $\text{C}_x\text{H}_{2x+2}$, $\text{O}_2$, $\text{C}_2\text{H}_6$, $2\text{H}_2 + \text{O}_2 \rightarrow 2\text{H}_2\text{O}$). JANGAN PERNAH menulis \text atau \rightarrow tanpa tanda dollar $! Kunci jawaban dan pembahasan juga wajib menggunakan tanda dollar untuk rumus kimia. Tulis persen dan angka desimal secara biasa tanpa dollar (50,0%).
`;

  try {
    let parsedPkg;

    if (apiKey) {
      // MODE 1: Direct Client-Side (Kecepatan Maksimal langsung dari browser)
      let endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

      let response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error ? errorData.error.message : `HTTP error: ${response.status}`;

        const isDemandIssue = response.status === 503 || 
                              response.status === 429 || 
                              errMsg.toLowerCase().includes("high demand") || 
                              errMsg.toLowerCase().includes("spikes in demand") || 
                              errMsg.toLowerCase().includes("unavailable") ||
                              errMsg.toLowerCase().includes("temporarily unavailable");

        // Auto-Fallback ke Gemini 3.6 Flash jika 3.7 Flash sedang high demand
        if (isDemandIssue && model === "gemini-3.7-flash") {
          console.warn("⚠️ Gemini 3.7 Flash sedang sibuk (503 High Demand). Mengalihkan otomatis ke Gemini 3.6 Flash...");
          notifyFallbackTo36();

          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
          response = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errFb = await response.json().catch(() => ({}));
            throw new Error(errFb.error ? errFb.error.message : `HTTP error: ${response.status}`);
          }
        } else {
          throw new Error(errMsg);
        }
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
        throw new Error("Respon Gemini tidak memuat teks konten.");
      }

      const jsonText = candidate.content.parts[0].text;
      parsedPkg = normalizeAndValidateQuizPackage(jsonText, {
        topic,
        grade,
        qType,
        stimulus,
        subtopic,
        difficulty,
        numQuestions
      });
    } else {
      // MODE 2: Cloud Backend Proxy via Google Apps Script (Multi-Device Tanpa Input API Key)
      const gasPayload = {
        action: "panggilGemini",
        model: model,
        prompt: userPrompt,
        systemInstruction: BASE_CHEMISTRY_PROMPT,
        schema: quizJsonSchema
      };

      let response = await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(gasPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error dari Backend GAS: ${response.status}`);
      }

      let gasRes = await response.json();

      const isGasDemandIssue = (gasRes.status === "error") && (
        gasRes.code == 503 || 
        gasRes.code == 429 ||
        (gasRes.message && (
          gasRes.message.toLowerCase().includes("high demand") ||
          gasRes.message.toLowerCase().includes("spikes in demand") ||
          gasRes.message.toLowerCase().includes("unavailable") ||
          gasRes.message.includes("503")
        ))
      );

      // Jika model 3.7 mengalami 503 (high demand sementara), otomatis alihkan ke 3.6 Flash
      if (isGasDemandIssue && model === "gemini-3.7-flash") {
        console.warn("⚠️ Gemini 3.7 Flash sibuk (503). Mengalihkan otomatis ke Gemini 3.6 Flash...");
        notifyFallbackTo36();
        gasPayload.model = "gemini-3.6-flash";
        response = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(gasPayload)
        });
        gasRes = await response.json();
      }

      if (gasRes.status === "error") {
        throw new Error(gasRes.message || "Gagal diproses di Backend GAS");
      }

      const rawPayload = gasRes.data || gasRes.raw || gasRes;
      parsedPkg = normalizeAndValidateQuizPackage(rawPayload, {
        topic,
        grade,
        qType,
        stimulus,
        subtopic,
        difficulty,
        numQuestions
      });
    }

    parsedPkg = sanitizeQuizPackage(parsedPkg);

    // Pastikan parsedPkg.daftar_soal selalu Array
    parsedPkg.daftar_soal = Array.isArray(parsedPkg.daftar_soal) ? parsedPkg.daftar_soal : [];

    // FITUR SIMPAN SOAL INKREMENTAL:
    // Jika ada soal yang ditandai sebelumnya, JANGAN HAPUS!
    // Tambahkan N butir soal baru yang baru digenerate ke koleksi soal bertanda
    if (savedQuestions && savedQuestions.length > 0) {
      // Pertahankan tanda pada soal yang lama
      savedQuestions.forEach(q => q.is_pinned = true);

      // Butir soal baru yang datang diberi status belum ditandai
      parsedPkg.daftar_soal.forEach(q => q.is_pinned = false);

      // Gabungkan: Soal lama yang ditandai tetap ada di awal, disusul butir soal baru
      const combined = [...savedQuestions, ...parsedPkg.daftar_soal];

      // Re-numbering urut 1, 2, 3, ... N
      combined.forEach((soal, idx) => {
        soal.nomor = idx + 1;
      });

      parsedPkg.daftar_soal = combined;
    }

    currentPackage = parsedPkg;
    syncSavedQuestions();
    updateSavedCountBadge();
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
  if (!pkg) return;
  pkg.daftar_soal = Array.isArray(pkg.daftar_soal) ? pkg.daftar_soal : [];
  document.getElementById("resPackageTitle").textContent = pkg.judul || "Naskah Soal Asesmen Kimia";
  document.getElementById("resGradeBadge").textContent = pkg.jenjang || "SMA";
  document.getElementById("resPackageMeta").textContent = `${pkg.topik_utama || 'Kimia'} • ${pkg.daftar_soal.length} Butir Soal • Stimulus: ${pkg.stimulus_model || 'Kontekstual'}`;

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
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
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
    const mathOpts = {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    };
    const tElem = document.getElementById("teacherQuestionsList");
    const sElem = document.getElementById("studentQuestionsList");
    if (tElem) renderMathInElement(tElem, mathOpts);
    if (sElem) renderMathInElement(sElem, mathOpts);
  }
}

// RENDER GURU QUESTIONS (DENGAN TABEL & SVG & FITUR TANDAI SOAL)
function renderTeacherQuestions(questions) {
  const container = document.getElementById("teacherQuestionsList");
  container.innerHTML = "";
  questions = Array.isArray(questions) ? questions : [];

  const displayedQuestions = filterSavedOnly ? questions.filter(q => q && q.is_pinned === true) : questions;

  if (filterSavedOnly && displayedQuestions.length === 0) {
    container.innerHTML = `
      <div class="glass-card p-6 text-center text-zinc-400">
        <i data-lucide="bookmark-x" class="w-8 h-8 mx-auto mb-2 text-violet-400 opacity-60"></i>
        <h5 class="text-sm font-bold text-zinc-200 mb-1">Belum Ada Soal yang Ditandai</h5>
        <p class="text-xs">Klik tombol "📌 Tandai Soal" pada butir soal yang Anda sukai untuk menyimpannya.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  displayedQuestions.forEach((soal) => {
    if (!soal) return;
    const isPinned = soal.is_pinned === true;
    const card = document.createElement("div");
    card.className = `question-item ${isPinned ? 'pinned-active' : ''}`;

    let optionsHtml = "";
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      optionsHtml = soal.pilihan_jawaban.map((opt) => {
        const isCorrect = String(opt.label || "").toUpperCase() === String(soal.kunci_jawaban || "").toUpperCase();
        return `
          <div class="option-row ${isCorrect ? 'correct-answer' : ''}">
            <span class="option-label">${opt.label}</span>
            <div class="flex-grow-1">${opt.teks} ${isCorrect ? '<b class="text-emerald-400 ms-2 font-mono">(Kunci Jawaban)</b>' : ''}</div>
          </div>
        `;
      }).join("");
    }

    // Render Tabel jika ada di pertanyaan
    const formattedQuestion = parseMarkdownTable(soal.pertanyaan || "");

    // Render SVG jika ada
    const svgHtml = soal.ilustrasi_svg ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) : "";

    const stepsList = Array.isArray(soal.pembahasan_langkah) 
      ? soal.pembahasan_langkah 
      : (soal.pembahasan_langkah ? [String(soal.pembahasan_langkah)] : ["Pembahasan terlampir sesuai materi."]);
    const stepsHtml = stepsList.map(st => `<li class="mb-1 text-zinc-200">${st}</li>`).join("");
    const tipsHtml = soal.tips_atau_jebakan 
      ? `<div class="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-xs"><b>💡 Tips & Miskonsepsi Siswa:</b> ${soal.tips_atau_jebakan}</div>` 
      : "";

    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 text-xs font-mono font-bold">Paket ${activeParallelTab}</span>
          <h5 class="font-bold text-white text-sm sm:text-base">Soal Nomor ${soal.nomor}</h5>
          ${isPinned ? '<span class="pinned-badge"><i data-lucide="star" class="w-2.5 h-2.5 fill-violet-300 inline mr-0.5"></i>Ditandai</span>' : ''}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-pin-question ${isPinned ? 'is-pinned' : ''}" onclick="togglePinQuestion(${soal.nomor})" title="${isPinned ? 'Batalkan tanda simpan' : 'Tandai soal ini agar tidak hilang saat generate baru'}">
            <i data-lucide="${isPinned ? 'check' : 'bookmark'}" class="w-3.5 h-3.5"></i>
            <span>${isPinned ? '⭐ Disimpan' : '📌 Tandai Soal'}</span>
          </button>
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
  questions = Array.isArray(questions) ? questions : [];

  const displayedQuestions = filterSavedOnly ? questions.filter(q => q && q.is_pinned === true) : questions;

  displayedQuestions.forEach((soal) => {
    if (!soal) return;
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

    const formattedQuestion = parseMarkdownTable(soal.pertanyaan || "");
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
  questions = Array.isArray(questions) ? questions : [];
  let correct = 0;
  let totalPG = 0;

  questions.forEach((soal) => {
    if (!soal) return;
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

  if (window.renderMathInElement) {
    const mathOpts = {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    };
    renderMathInElement(container, mathOpts);
    if (printContainer) renderMathInElement(printContainer, mathOpts);
  }
}

// PRINT / PDF LAYOUT RENDERER (STANDAR A4 & KATEX RESMI)
function renderPrintLayout(pkg) {
  if (!pkg) return;
  document.getElementById("printMetaText").textContent = `Mata Pelajaran: Kimia | Jenjang: ${pkg.jenjang} | Topik: ${pkg.topik_utama}`;

  const qContainer = document.getElementById("printQuestionsContent");
  const sContainer = document.getElementById("printSolutionsContent");
  qContainer.innerHTML = "";
  sContainer.innerHTML = "";

  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let questionsA = pkg.daftar_soal || [];
  let questionsB = pkg.daftar_soal_paket_b || [];

  if (exportSavedOnly && savedQuestions.length > 0) {
    questionsA = questionsA.filter(q => q.is_pinned === true);
    if (questionsB.length > 0) {
      questionsB = questionsB.filter(q => q.is_pinned === true);
    }
  }

  const renderPrintQuestions = (questions, labelPaket) => {
    let html = `<h4 style="margin: 12pt 0 6pt 0; text-decoration: underline; font-weight: bold; font-size: 11pt;">LEMBAR SOAL ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;
    questions.forEach((soal) => {
      let optText = "";
      if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
        optText = soal.pilihan_jawaban.map(o => `
          <div style="margin-left: 18pt; margin-top: 2pt;">
            <b>${o.label}.</b> ${o.teks}
          </div>
        `).join("");
      } else {
        optText = `<div style="margin-left: 18pt; margin-top: 6pt; color: #555;">[Jawaban: ..........................................................................................................................]</div>`;
      }

      const formattedQ = parseMarkdownTable(soal.pertanyaan);
      const svgHtml = (soal.ilustrasi_svg && soal.ilustrasi_svg.includes("<svg")) 
        ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) 
        : "";

      html += `
        <div style="margin-bottom: 12pt; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 3pt;">${soal.nomor}. ${formattedQ}</div>
          ${svgHtml}
          ${optText}
        </div>
      `;
    });
    return html;
  };

  const renderPrintSolutions = (questions, labelPaket) => {
    let html = `<h4 style="margin: 12pt 0 6pt 0; text-decoration: underline; font-weight: bold; font-size: 11pt;">KUNCI JAWABAN &amp; PEMBAHASAN ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;
    questions.forEach((soal) => {
      const steps = soal.pembahasan_langkah.map(st => `<li>${st}</li>`).join("");
      html += `
        <div style="margin-bottom: 10pt; page-break-inside: avoid;">
          <div style="font-weight: bold;">Soal ${soal.nomor} — Kunci: <u>${soal.kunci_jawaban}</u></div>
          <ul style="margin: 2pt 0; padding-left: 18pt;">${steps}</ul>
          ${soal.tips_atau_jebakan ? `<div style="font-size: 9.5pt; font-style: italic; margin-left: 18pt; margin-top: 2pt;">Tips: ${soal.tips_atau_jebakan}</div>` : ''}
        </div>
      `;
    });
    return html;
  };

  qContainer.innerHTML = renderPrintQuestions(questionsA, questionsB.length > 0 ? "PAKET A" : "");
  sContainer.innerHTML = renderPrintSolutions(questionsA, questionsB.length > 0 ? "PAKET A" : "");

  if (questionsB.length > 0) {
    qContainer.innerHTML += `<div class="page-break"></div>` + renderPrintQuestions(questionsB, "PAKET B");
    sContainer.innerHTML += `<div class="page-break"></div>` + renderPrintSolutions(questionsB, "PAKET B");
  }

  // Render KaTeX untuk dokumen cetak
  const printSheet = document.getElementById("printExamSheet");
  if (window.renderMathInElement && printSheet) {
    renderMathInElement(printSheet, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    });
  }
}

// PEMBERSIH LATEX UNTUK PLAIN TEXT
function cleanLatex(text) {
  if (!text) return "";
  let s = formatChemistryText(text);

  // Bersihkan pecahan: \frac{a}{b} -> (a)/b
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/$2");

  // Bersihkan \text{...} berulang sampai tuntas
  while (/\\text\{/.test(s)) {
    s = s.replace(/\\text\{([^{}]+)\}/g, "$1");
  }

  return s
    .replace(/\$\\rightleftharpoons\$/g, "⇌")
    .replace(/\\rightleftharpoons/g, "⇌")
    .replace(/\$\\longleftrightarrow\$/g, "⇌")
    .replace(/\\longleftrightarrow/g, "⇌")
    .replace(/\$\\rightarrow\$/g, "→")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\to\b/g, "→")
    .replace(/\$\\leftrightarrow\$/g, "⇄")
    .replace(/\\leftrightarrow/g, "⇄")
    .replace(/\$\\Delta\s*H\$/g, "ΔH")
    .replace(/\\Delta\s*H/g, "ΔH")
    .replace(/\$\\Delta\$/g, "Δ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\$\\cdot\$/g, "·")
    .replace(/\\cdot/g, "·")
    .replace(/\$\\pm\$/g, "±")
    .replace(/\\pm/g, "±")
    .replace(/\^\\circ/g, "°")
    .replace(/\$\\circ\$/g, "°")
    .replace(/\\circ/g, "°")
    .replace(/\{,\}/g, ",")
    .replace(/\\%/g, "%")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "");
}

// EXPORT HANDLERS
function initExportListeners() {
  document.getElementById("btnPrintExam").addEventListener("click", () => {
    if (!currentPackage) return;
    const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
    if (exportSavedOnly && savedQuestions.length === 0) {
      alert("⚠️ Belum ada soal yang ditandai untuk dicetak.\nSilakan klik tombol '📌 Tandai Soal' pada butir soal yang ingin Anda cetak, atau hilangkan centang 'Hanya Ekspor Soal Ditandai'.");
      return;
    }
    renderPrintLayout(currentPackage);
    setTimeout(() => {
      window.print();
    }, 150);
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
        alert("⚠️ Backend Google Apps Script belum dikonfigurasi di config.js.");
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

  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let questionsA = pkg.daftar_soal || [];
  let questionsB = pkg.daftar_soal_paket_b || [];

  if (exportSavedOnly) {
    if (savedQuestions.length === 0) {
      alert("⚠️ Belum ada soal yang ditandai untuk diekspor ke Quizizz.\nSilakan klik tombol '📌 Tandai Soal' pada butir soal yang ingin Anda pilih.");
      return;
    }
    questionsA = questionsA.filter(q => q.is_pinned === true);
    if (questionsB.length > 0) questionsB = questionsB.filter(q => q.is_pinned === true);
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
        60,
        "",
        explanation
      ]);
    });

    return rows;
  };

  const wsA = XLSX.utils.aoa_to_sheet(prepareQuizizzRows(questionsA));
  XLSX.utils.book_append_sheet(wb, wsA, "Quizizz Paket A");

  if (questionsB.length > 0) {
    const wsB = XLSX.utils.aoa_to_sheet(prepareQuizizzRows(questionsB));
    XLSX.utils.book_append_sheet(wb, wsB, "Quizizz Paket B");
  }

  if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0 && !exportSavedOnly) {
    const kisiRows = [
      ["No", "Capaian / Tujuan Pembelajaran (CP/TP)", "Indikator Soal", "Level Kognitif", "Bentuk Soal", "Kunci Jawaban", "Skor Maksimal"]
    ];
    pkg.kisi_kisi_asesmen.forEach(k => {
      kisiRows.push([k.nomor, k.cp_tp, k.indikator_soal, k.level_kognitif, k.bentuk_soal, k.kunci_jawaban, k.skor || 10]);
    });
    const wsKisi = XLSX.utils.aoa_to_sheet(kisiRows);
    XLSX.utils.book_append_sheet(wb, wsKisi, "Matriks Kisi-Kisi");
  }

  const fileName = `Quizizz_${pkg.judul.replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// WORD EXPORTER (.doc / .docx - STANDAR UKURAN KERTAS A4 & NOTASI KIMIA HTML)
function exportToWordDocx(pkg) {
  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let listA = pkg.daftar_soal || [];
  let listB = pkg.daftar_soal_paket_b || [];

  if (exportSavedOnly) {
    if (savedQuestions.length === 0) {
      alert("⚠️ Belum ada soal yang ditandai untuk diekspor.\nSilakan klik tombol '📌 Tandai Soal' pada butir soal yang ingin Anda ekspor, atau hilangkan centang 'Hanya Ekspor Soal Ditandai'.");
      return;
    }
    listA = listA.filter(q => q.is_pinned === true);
    if (listB.length > 0) {
      listB = listB.filter(q => q.is_pinned === true);
    }
  }

  const formatWordQuestions = (questions) => {
    return questions.map((soal) => {
      let opts = "";
      if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
        opts = soal.pilihan_jawaban.map(o => `
          <p style="margin-left: 20pt; margin-top: 2pt; margin-bottom: 2pt;">
            <b>${o.label}.</b> ${formatChemistryForWordHtml(o.teks)}
          </p>
        `).join("");
      } else {
        opts = `<p style="margin-left: 20pt; margin-top: 6pt; color: #555;">[Jawaban: .....................................................................................................]</p>`;
      }

      let svgWord = "";
      if (soal.ilustrasi_svg && soal.ilustrasi_svg.includes("<svg")) {
        let cleanSvg = soal.ilustrasi_svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        if (!cleanSvg.includes("xmlns")) {
          cleanSvg = cleanSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        svgWord = `
          <div style="text-align: center; margin: 8pt auto;">
            ${cleanSvg}
            ${soal.caption_ilustrasi ? `<p style="font-size: 9pt; font-style: italic; color: #555; margin-top: 3pt;">Diagram: ${formatChemistryForWordHtml(soal.caption_ilustrasi)}</p>` : ''}
          </div>
        `;
      }

      return `
        <div style="margin-bottom: 12pt; page-break-inside: avoid;">
          <p style="font-weight: bold; margin-bottom: 4pt;">${soal.nomor}. ${formatChemistryForWordHtml(soal.pertanyaan)}</p>
          ${svgWord}
          ${opts}
        </div>
      `;
    }).join("");
  };

  const formatWordSolutions = (questions) => {
    return questions.map((soal) => {
      let steps = soal.pembahasan_langkah.map(st => `<li>${formatChemistryForWordHtml(st)}</li>`).join("");
      return `
        <div style="margin-bottom: 12pt; page-break-inside: avoid;">
          <p style="font-weight: bold; margin-bottom: 2pt;">Soal ${soal.nomor} — Kunci: <u>${soal.kunci_jawaban}</u></p>
          <ul style="margin: 0; padding-left: 20pt;">${steps}</ul>
          ${soal.tips_atau_jebakan ? `<p style="font-size: 10pt; font-style: italic; margin-left: 20pt; margin-top: 3pt;">💡 Tips: ${formatChemistryForWordHtml(soal.tips_atau_jebakan)}</p>` : ''}
        </div>
      `;
    }).join("");
  };

  let questionsPart = `<h3 style="color: #2980b9;">BAGIAN I: LEMBAR SOAL ${listB.length > 0 ? '(PAKET A)' : ''}</h3>` + formatWordQuestions(listA);
  let solutionsPart = `<h3 style="color: #c0392b; text-align: center;">BAGIAN II: KUNCI JAWABAN &amp; PEMBAHASAN ${listB.length > 0 ? '(PAKET A)' : ''}</h3>` + formatWordSolutions(listA);

  if (listB.length > 0) {
    questionsPart += `<div class="page-break"></div><h3 style="color: #2980b9;">LEMBAR SOAL (PAKET B)</h3>` + formatWordQuestions(listB);
    solutionsPart += `<div class="page-break"></div><h3 style="color: #c0392b; text-align: center;">KUNCI JAWABAN &amp; PEMBAHASAN (PAKET B)</h3>` + formatWordSolutions(listB);
  }

  let kisiPart = "";
  if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0 && !exportSavedOnly) {
    let rows = pkg.kisi_kisi_asesmen.map(k => `
      <tr>
        <td style="padding: 4pt; text-align: center; border: 1px solid #000;">${k.nomor}</td>
        <td style="padding: 4pt; border: 1px solid #000;">${formatChemistryForWordHtml(k.cp_tp)}</td>
        <td style="padding: 4pt; border: 1px solid #000;">${formatChemistryForWordHtml(k.indikator_soal)}</td>
        <td style="padding: 4pt; text-align: center; border: 1px solid #000;">${k.level_kognitif}</td>
        <td style="padding: 4pt; text-align: center; border: 1px solid #000;">${k.bentuk_soal}</td>
        <td style="padding: 4pt; text-align: center; font-weight: bold; border: 1px solid #000;">${k.kunci_jawaban}</td>
        <td style="padding: 4pt; text-align: center; border: 1px solid #000;">${k.skor || 10}</td>
      </tr>
    `).join("");

    kisiPart = `
      <div class="page-break"></div>
      <h3 style="color: #8e44ad; text-align: center;">LAMPIRAN: MATRIKS KISI-KISI &amp; KARTU SOAL ASESMEN</h3>
      <div style="border-bottom: 1px solid #000; margin-bottom: 12pt;"></div>
      <table border="1" style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <thead>
          <tr style="background: #f2f2f2;">
            <th style="border: 1px solid #000; padding: 4pt; text-align: center;">No</th>
            <th style="border: 1px solid #000; padding: 4pt;">Capaian / Tujuan Pembelajaran</th>
            <th style="border: 1px solid #000; padding: 4pt;">Indikator Butir Soal</th>
            <th style="border: 1px solid #000; padding: 4pt; text-align: center;">Level</th>
            <th style="border: 1px solid #000; padding: 4pt; text-align: center;">Bentuk</th>
            <th style="border: 1px solid #000; padding: 4pt; text-align: center;">Kunci</th>
            <th style="border: 1px solid #000; padding: 4pt; text-align: center;">Skor</th>
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
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4: 210mm x 297mm */
          margin: 54.0pt 54.0pt 54.0pt 54.0pt; /* 1.9cm (0.75in) Margins */
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #000; }
        h2 { text-align: center; font-size: 14pt; margin-bottom: 4pt; color: #1E3C72; }
        .meta { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 15pt; border-bottom: 2px solid #000; padding-bottom: 8pt; }
        .page-break { page-break-before: always; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
        th, td { border: 1px solid #000; padding: 4pt 6pt; }
        th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
        sub { vertical-align: sub; font-size: 8pt; }
        sup { vertical-align: super; font-size: 8pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>${pkg.judul.toUpperCase()}</h2>
        <div class='meta'>Mata Pelajaran: Kimia | Jenjang: ${pkg.jenjang} | Topik: ${pkg.topik_utama} | Pendekatan: ${pkg.stimulus_model || 'Kontekstual'}${exportSavedOnly ? ' (Koleksi Soal Pilihan Guru)' : ''}</div>
        ${questionsPart}

        <div class="page-break"></div>
        ${solutionsPart}

        ${kisiPart}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// MARKDOWN EXPORTER
function exportToMarkdownFile(pkg) {
  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let questionsA = pkg.daftar_soal || [];
  let questionsB = pkg.daftar_soal_paket_b || [];

  if (exportSavedOnly) {
    if (savedQuestions.length === 0) {
      alert("⚠️ Belum ada soal yang ditandai untuk diekspor ke Markdown.");
      return;
    }
    questionsA = questionsA.filter(q => q.is_pinned === true);
    if (questionsB.length > 0) questionsB = questionsB.filter(q => q.is_pinned === true);
  }

  let lines = [
    `# ${pkg.judul}${exportSavedOnly ? ' (Soal Pilihan Guru)' : ''}`,
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

  formatMdList(questionsA);

  if (questionsB.length > 0) {
    lines.push(`\n## 📝 Lembar Soal Paralel (Paket B)\n`);
    formatMdList(questionsB);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON EXPORTER
function exportToJsonFile(pkg) {
  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let exportData = pkg;

  if (exportSavedOnly) {
    if (savedQuestions.length === 0) {
      alert("⚠️ Belum ada soal yang ditandai untuk diekspor ke JSON.");
      return;
    }
    exportData = JSON.parse(JSON.stringify(pkg));
    exportData.daftar_soal = (exportData.daftar_soal || []).filter(q => q.is_pinned === true);
    if (exportData.daftar_soal_paket_b) {
      exportData.daftar_soal_paket_b = (exportData.daftar_soal_paket_b || []).filter(q => q.is_pinned === true);
    }
  }

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.judul.replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
