/**
 * =========================================================================
 * PORTALKIMIA SUITE — GENERATOR SOAL KIMIA AI (JAVASCRIPT ENGINE v5)
 * Terintegrasi Penuh | Tito Vanzal, S.Pd.
 * Fitur: Tabel Data Eksperimen, Diagram Kimia SVG, Tipe AKM/UTBK,
 *        Kisi-Kisi Resmi, Paket Paralel (A/B), & Ekspor Quizizz (.xlsx)
 * =========================================================================
 */

// Versioning & Cache Busting
const APP_VERSION = "2.15";

// Migration Purge Token Lawas (Satu Kali Reset untuk Seluruh Klien)
(function jalankanPembersihanTokenLama() {
  const PURGE_KEY = "portalkimia_token_reset_v20261001";
  try {
    if (!localStorage.getItem(PURGE_KEY)) {
      localStorage.removeItem("portalkimia_guru_token");
      localStorage.removeItem("generatorAccessToken");
      localStorage.removeItem("portalkimia_soal_access_token");
      localStorage.removeItem("generatorAccountInfo");
      localStorage.removeItem("portalkimia_guru_nama");
      localStorage.removeItem("portalkimia_nama_guru");
      try { sessionStorage.removeItem("PORTALKIMIA_SESSION_ROLE"); } catch (e) {}
      localStorage.setItem(PURGE_KEY, "done");
    }
  } catch (e) {}
})();

// Helper Standarisasi Nama Guru
function formatNamaGuru(nama) {
  if (!nama || !nama.trim()) return "Rekan Guru";
  const trimmed = nama.trim();
  if (/^(guru|pak|bu|ibu|bapak|ustadz|ustadzah|ust|ustz)\b/i.test(trimmed)) {
    return trimmed;
  }
  if (/^(admin|master)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Guru ${trimmed}`;
}

// Kustomisasi Identitas Guru & Sekolah
const TEACHER_NAME_KEY = "portalkimia_nama_guru";
const SCHOOL_NAME_KEY = "portalkimia_nama_sekolah";
const DEFAULT_TEACHER_NAME = "Tito Vanzal, S.Pd.";
const DEFAULT_SCHOOL_NAME = "SMA Progresif Bumi Shalawat";

function getCustomTeacherName() {
  try {
    const val = localStorage.getItem(TEACHER_NAME_KEY);
    return (val !== null && val !== undefined && val.trim()) ? val.trim() : DEFAULT_TEACHER_NAME;
  } catch (e) {
    return DEFAULT_TEACHER_NAME;
  }
}

function setCustomTeacherName(name, updateDom = true) {
  try {
    if (typeof name === "string" && name.trim()) {
      localStorage.setItem(TEACHER_NAME_KEY, name);
    } else if (typeof name === "string" && name.length === 0) {
      localStorage.removeItem(TEACHER_NAME_KEY);
    }
    if (updateDom) {
      const input = document.getElementById("inputCustomNamaGuru");
      if (input && document.activeElement !== input) {
        input.value = getCustomTeacherName();
      }
    }
  } catch (e) {}
}

function getCustomSchoolName() {
  try {
    const val = localStorage.getItem(SCHOOL_NAME_KEY);
    return (val !== null && val !== undefined && val.trim()) ? val.trim() : DEFAULT_SCHOOL_NAME;
  } catch (e) {
    return DEFAULT_SCHOOL_NAME;
  }
}

function setCustomSchoolName(school, updateDom = true) {
  try {
    if (typeof school === "string" && school.trim()) {
      localStorage.setItem(SCHOOL_NAME_KEY, school);
    } else if (typeof school === "string" && school.length === 0) {
      localStorage.removeItem(SCHOOL_NAME_KEY);
    }
    if (updateDom) {
      const input = document.getElementById("inputCustomNamaSekolah");
      if (input && document.activeElement !== input) {
        input.value = getCustomSchoolName();
      }
    }
  } catch (e) {}
}

function initTeacherIdentityListeners() {
  const inputGuru = document.getElementById("inputCustomNamaGuru");
  const inputSekolah = document.getElementById("inputCustomNamaSekolah");
  if (inputGuru) {
    inputGuru.value = getCustomTeacherName();
    inputGuru.addEventListener("input", (e) => {
      // Simpan langsung nilai input ke localStorage tanpa mereset input.value saat mengetik (memperbolehkan spasi)
      try {
        localStorage.setItem(TEACHER_NAME_KEY, e.target.value);
      } catch (err) {}
    });
    inputGuru.addEventListener("blur", (e) => {
      const trimmed = e.target.value.trim();
      if (!trimmed) {
        localStorage.removeItem(TEACHER_NAME_KEY);
        e.target.value = DEFAULT_TEACHER_NAME;
      } else {
        localStorage.setItem(TEACHER_NAME_KEY, trimmed);
        e.target.value = trimmed;
      }
    });
  }
  if (inputSekolah) {
    inputSekolah.value = getCustomSchoolName();
    inputSekolah.addEventListener("input", (e) => {
      // Simpan langsung nilai input ke localStorage tanpa mereset input.value saat mengetik (memperbolehkan spasi)
      try {
        localStorage.setItem(SCHOOL_NAME_KEY, e.target.value);
      } catch (err) {}
    });
    inputSekolah.addEventListener("blur", (e) => {
      const trimmed = e.target.value.trim();
      if (!trimmed) {
        localStorage.removeItem(SCHOOL_NAME_KEY);
        e.target.value = DEFAULT_SCHOOL_NAME;
      } else {
        localStorage.setItem(SCHOOL_NAME_KEY, trimmed);
        e.target.value = trimmed;
      }
    });
  }
}

// Handler Magic Link (?token=... atau ?kunci=...)
function handleMagicLinkToken() {
  if (typeof window === "undefined" || !window.location) return;
  let magicToken = null;
  try {
    if (typeof URLSearchParams !== "undefined") {
      const params = new URLSearchParams(window.location.search || "");
      magicToken = params.get("token") || params.get("kunci") || params.get("accessToken") || params.get("key");
    } else if (window.location.search) {
      const m = window.location.search.match(/[?&](token|kunci|accessToken|key)=([^&#]*)/i);
      if (m && m[2]) magicToken = decodeURIComponent(m[2]);
    }
  } catch (e) {
    console.warn("Error parsing URL search params:", e);
  }
  if (magicToken && magicToken.trim()) {
    const cleanToken = magicToken.trim();
    setGeneratorAccessToken(cleanToken);
    
    const inputToken = document.getElementById("inputAccessTokenSoal");
    if (inputToken) inputToken.value = cleanToken;

    // Bersihkan URL tanpa reload agar rapi
    try {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, document.title, cleanUrl);
    } catch (e) {}

    ujiKoneksiDanToken(cleanToken).then(acc => {
      const nama = (acc && acc.nama) ? formatNamaGuru(acc.nama) : "Rekan Guru";
      const saldo = (acc && acc.saldo != null) ? acc.saldo : "";
      showVersionToast(`🎉 Selamat datang, ${nama}! Token Anda aktif${saldo ? ` (${saldo}x kuota)` : ''}.`);
      
      const storedTeacher = localStorage.getItem(TEACHER_NAME_KEY);
      if (!storedTeacher && acc && acc.nama) {
        setCustomTeacherName(formatNamaGuru(acc.nama));
      }
    }).catch(() => {
      showVersionToast(`✨ Token akses guru (${cleanToken}) berhasil dipasang.`);
    });
  } else {
    const token = getGeneratorAccessToken();
    if (token) ujiKoneksiDanToken(token);
  }
}

// Global State
let currentPackage = null;
let currentQuizData = null; // Alias kompatibilitas
window.currentQuizData = null;
let activeParallelTab = 'A'; // 'A' atau 'B'
let savedQuestions = [];     // Koleksi soal yang ditandai / disimpan oleh guru
let filterSavedOnly = false; // Filter tampilan: tampilkan hanya soal yang ditandai
const LAST_GENERATED_DRAFT_KEY = "portalkimia_generator_last_draft_v1";
const APP_VERSION_KEY = "portalkimia_generator_version";

function handleAppVersionMigration() {
  try {
    const stored = localStorage.getItem(APP_VERSION_KEY);
    const badge = document.getElementById("appVersionBadge");
    if (badge) badge.textContent = "v" + APP_VERSION;
    const footerBadge = document.getElementById("footerVersionBadge");
    if (footerBadge) footerBadge.textContent = "v" + APP_VERSION;
    console.info(`[PortalKimia Generator Soal] Aktif Versi v${APP_VERSION}`);
    if (stored && stored !== APP_VERSION) {
      console.info(`[PortalKimia] Deteksi pembaruan versi: ${stored} ➜ v${APP_VERSION}`);
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
      // Bersihkan layout TTS usang & sanitize draft tersimpan
      try {
        const raw = localStorage.getItem(LAST_GENERATED_DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft && draft.package) {
            delete draft.package._crosswordLayoutA;
            delete draft.package._crosswordLayoutB;
            if (typeof sanitizeQuizPackage === "function") {
              sanitizeQuizPackage(draft.package);
            }
            localStorage.setItem(LAST_GENERATED_DRAFT_KEY, JSON.stringify(draft));
          }
        }
      } catch (e) {}
      setTimeout(() => {
        showVersionToast(`✨ Generator Soal berhasil diperbarui ke versi v${APP_VERSION}!`);
      }, 1000);
    } else if (!stored) {
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
    }
  } catch (e) {
    console.warn("Versi migration error:", e);
  }
}

function showVersionToast(msg) {
  try {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900/95 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300";
    toast.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()" class="text-zinc-400 hover:text-white font-bold ml-2">✕</button>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 6000);
  } catch (e) {}
}

// SYSTEM PROMPT DASAR DENGAN ATURAN ILMIAH DAN NOTASI KIMIA / SEMUA MAPEL
const BASE_CHEMISTRY_PROMPT = `
Anda adalah Pakar Pendidik Senior dan Penyusun Soal Standar Asesmen Nasional (Kurikulum Merdeka, UTBK-SNBT, AKM, Olimpiade Sains/Mapel, dan Asesmen Sekolah).
Tugas Anda adalah menyusun instrumen asesmen pembelajaran berstandar tinggi, valid secara keilmuan sesuai mata pelajaran terkait, kontekstual, dan bebas dari miskonsepsi.

PEDOMAN UTAMA:
1. AKURASI ILMIAH & KEILMUAN (KIMIA, FISIKA, BIOLOGI, MATEMATIKA, MAUPUN MAPEL LAINNYA):
   - Sesuaikan materi dengan kaidah keilmuan topik mata pelajaran yang diujikan secara komprehensif.
   - Untuk Kimia: Persamaan reaksi kimia WAJIB setara (hukum kekekalan massa & muatan). Perhitungan stoikiometri, massa atom relatif (Ar), massa molekul (Mr), tetapan asam-basa (Ka/Kb), potensial sel (E°), dll harus akurat secara empiris.
   - Untuk Fisika / Matematika: Rumus, variabel, hukum fisika, dan perhitungan matematis harus presisi.
   - Untuk Biologi / IPA / IPS / Bahasa: Konsep biologi, anatomi, data sejarah, geografi, dan tata bahasa harus valid dan kontekstual.

2. ATURAN PENULISAN ANGKA, PERSEN (%), DAN NOTASI LATEX (MUTLAK):
   - DILARANG menggunakan tanda dollar ($...$) untuk persentase (%), angka biasa, atau satuan umum.
   - Tuliskan persentase secara langsung dalam teks biasa: tulis '50,0%' atau '25%' (JANGAN menulis '$50{,}0\\%$' atau '$50{,}0\\%' atau '$50%$').
   - Tuliskan angka desimal dan satuan biasa: '0,5 mol', '100 mL', '25 °C', '1 atm', '5,4 gram'.
   - Tanda dollar inline ($...$) WAJIB DIGUNAKAN untuk SEMUA rumus kimia, ion, reaksi, atau persamaan matematika:
     a. Rumus kimia senyawa/ion: $\\text{H}_2\\text{SO}_4$, $\\text{Al}^{3+}$, $\\text{CH}_3\\text{COOH}$, $\\text{Ca(OH)}_2$, $\\text{KOH}$, $\\text{O}_2$, $\\text{C}_x\\text{H}_{2x+2}$, $\\text{C}_2\\text{H}_6$, $\\text{C}_y\\text{H}_{2y}$
     b. Persamaan reaksi kimia: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$, $\\text{C}_x\\text{H}_{2x+2} + \\frac{3x+1}{2}\\text{O}_2 \\rightarrow x\\text{CO}_2 + (x+1)\\text{H}_2\\text{O}$
     c. Besaran termokimia, fisika & kesetimbangan: $\\Delta H = -285{,}8\\text{ kJ/mol}$, $K_a = 10^{-5}$, $E^\\circ = +1{,}10\\text{ V}$, $\\text{pH} = 3 - \\log 2$, $F = m \\cdot a$
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

5. STANDAR TES KEMAMPUAN AKADEMIK (TKA) & CAMPURAN MULTI-FORMAT:
   - Jika tipe soal adalah TKA atau Campuran, variasikan format butir soal antara Pilihan Ganda Biasa, Hubungan Sebab-Akibat (Pernyataan & Alasan), dan PG Asosiasi (Pernyataan 1, 2, 3, dan 4).
   - Pastikan opsi jawaban pada Sebab-Akibat dan Asosiasi mengikuti standar baku nasional secara konsisten.
   - Jika tingkat kesulitan bertuliskan 'Campuran', distribusikan level kognitif secara bertingkat dan proporsional dari L1 (C1-C2 Pemahaman), L2 (C3 Aplikasi & Perhitungan), hingga L3 (C4-C5 Penalaran HOTS).

6. STANDAR UJIAN RESMI PEARSON EDEXCEL (100% BRITISH ENGLISH):
   - Jika jenjang adalah Pearson Edexcel (Grade 10 IGCSE, Grade 11 International AS, atau Grade 12 International A2):
     * SELURUH naskah (judul, pengantar, pertanyaan, sub-soal, opsi, kunci, dan mark scheme) WAJIB 100% BAHASA INGGRIS BAKU (British English).
     * Nomenklatur & Konvensi IUPAC resmi Edexcel: 'ethanoic acid' (BUKAN 'acetic acid'), 'propanoic acid', 'cm³', 'dm³', 'mol dm⁻³', 'g mol⁻¹', 'limiting reagent', 'enthalpy change of neutralisation', 'relative formula mass Mr', 'molar gas volume at r.t.p. = 24.0 dm³ mol⁻¹', 'Kw = 1.00 x 10^-14 mol² dm⁻⁶', 'Ka', 'R = 8.31 J mol⁻¹ K⁻¹'.
     * Taksonomi Kata Perintah (Command Words) resmi Pearson Edexcel:
       - 'State' / 'Name' / 'Give': 1 mark recall atau identifikasi singkat.
       - 'Define': Definisi kimia presisi (misal: standard enthalpy of combustion, first electron affinity, buffer solution).
       - 'Calculate': Perhitungan kuantitatif lengkap dengan rumus, substitusi angka, dan angka penting yang tepat (2 atau 3 s.f.).
       - 'Describe': Menyebutkan observasi empiris laboratorium (effervescence / bubbling, precipitate color & solubility, temperature change).
       - 'Explain': Menjelaskan konsep 'mengapa' menggunakan prinsip kimia, gaya antarmolekul, ikatan, atau orbital elektron.
       - 'Write an ionic equation including state symbols': Persamaan ionik dengan simbol wujud (aq, s, l, g).
       - 'Deduce' / 'Suggest': Penarikan kesimpulan logis dari data atau tabel tren periodik.
     * Aturan Butir Soal Terstruktur (Section B Style):
       - Diawali konteks ("This question is about...", "A student carried out an experiment to...").
       - Sub-soal bertingkat: (a)(i), (a)(ii), (b)(i), (b)(ii), (c)... dengan alokasi mark di akhir setiap sub-soal: [1 mark], [2 marks], [3 marks].
       - Di akhir butir soal WAJIB dicantumkan total mark: [Total for Question X = Y marks].
     * Aturan Multiple Choice Questions (Section A Style):
       - WAJIB TEPAT 4 OPSI: A, B, C, D (DILARANG KERAS 5 opsi!).
       - Setiap butir MCQ bernilai tepat 1 mark.
     * Standar Kunci & Worked Solutions (Official Pearson Mark Scheme):
       - Format wajib menggunakan struktur Mark Scheme resmi Edexcel:
         M1: Method mark pertama (misal: calculation of moles of acid)
         M2: Method mark kedua / intermediate step
         A1: Accuracy mark (angka final + satuan benar)
         Additional Guidance: ALLOW..., IGNORE..., DO NOT ALLOW..., TE (Transferred Error / ECF).
      * PENTING TERKAIT STRUKTUR JSON: Meskipun SELURUH isi konten naskah soal wajib 100% British English, NAMA KUNCI JSON HARUS TETAP MEMAKAI SKEMA BAKU:
        "judul", "jenjang", "topik_utama", "daftar_soal", "nomor", "tipe_soal", "topik", "subtopik", "tingkat_kesulitan", "pertanyaan", "pilihan_jawaban", "kunci_jawaban", "pembahasan_langkah".
        DILARANG KERAS mengganti nama kunci JSON menjadi bahasa Inggris (misalnya: JANGAN ganti "daftar_soal" jadi "questions", JANGAN ganti "pertanyaan" jadi "question_text" / "stem").

7. FORMAT URAIAN TERSTRUKTUR & MODE TANPA STIMULUS:
   - Untuk soal Esai / Uraian Terstruktur:
     * Tuliskan stem / narasi pengantar soal terlebih dahulu (jika ada).
     * Setiap sub-pertanyaan bertingkat WAJIB dipisahkan pada BARIS BARU tersendiri dengan diawali (a), (b), (c)... Contoh:
       Pengantar reaksi atau kasus...
       (a) Pertanyaan sub a... [1 mark]
       (b) Pertanyaan sub b... [2 marks]
       (c) Pertanyaan sub c... [3 marks]
     * DILARANG KERAS menggabungkan sub-pertanyaan (a), (b), (c) dalam satu baris/paragraf bersambung.
     * DILARANG menuliskan titik-titik manual seperti 'Answer: .............' atau 'Jawaban: .............' di dalam string pertanyaan karena sistem otomatis menambahkan lembar jawab bertitik-titik untuk siswa.
     * Kosongkan pilihan_jawaban (isi array kosong []).
     * Kunci jawaban dan pembahasan untuk uraian terstruktur wajib dirinci per sub-poin: (a) ..., (b) ..., (c) ...
   - Jika dipilih 'Tanpa Stimulus (Drilling Langsung)': DILARANG membuat cerita/narasi konteks panjang. Langsung ke pokok reaksi/perhitungan to the point demi efisiensi kertas saat dicetak.

8. FORMAT SOAL UNIK & INTERAKTIF (MENJODOHKAN, SCRAMBLE, & TEKA-TEKI SILANG / TTS):
   - FORMAT MENJODOHKAN (MATCHING KOLOM A & B):
     * Sajikan instruksi: "Pasangkanlah konsep/senyawa/istilah pada Kolom A dengan karakteristik/reaksi/kegunaan yang tepat pada Kolom B!"
     * Sajikan tabel Markdown 2 kolom: Kolom A (nomor 1, 2, 3, 4 berisi istilah/konsep) dan Kolom B (kode huruf A, B, C, D, E berisi deskripsi/karakteristik dengan opsi pengecoh).
     * Cantumkan baris panduan: "Lembar Pasangan Jawaban: 1-[...], 2-[...], 3-[...], 4-[...]".
     * Kosongkan properti 'pilihan_jawaban' ([]).
     * Pada 'kunci_jawaban', tuliskan pasangan yang benar secara ringkas: "1 - B, 2 - D, 3 - A, 4 - C".
     * Pada 'tipe_soal', tuliskan 'Menjodohkan (Matching)'.
   - FORMAT KATA ACAK / SCRAMBLE (SUSUN HURUF ISTILAH KIMIA):
     * Susun kata/istilah kimia esensial menjadi huruf acak yang dipisah tanda hubung: "KATA ACAK: E - N - D - O - T - E - R - M (8 Huruf)".
     * Berikan petunjuk konsep kimia yang jelas: "PETUNJUK: Reaksi kimia yang menyerap kalor dari lingkungan ke sistem (ΔH > 0)...".
     * Sertakan kotak huruf kosong: "KOTAK JAWABAN: [   ] [   ] [   ] [   ] [   ] [   ] [   ] [   ]".
     * Kosongkan 'pilihan_jawaban' ([]).
     * Pada 'kunci_jawaban', tuliskan kata asli dalam huruf kapital, contoh: "ENDOTERM".
     * Pada 'tipe_soal', tuliskan 'Scramble (Kata Acak)'.
   - FORMAT TEKA-TEKI SILANG (TTS KIMIA 2D INTERLOCKING MENDATAR & MENURUN):
     * Pilihlah istilah, nama senyawa, konsep, atau partikel kimia yang esensial dan bervariasi (panjang 3 hingga 10 huruf, SATU KATA tanpa spasi).
     * Pastikan kata-kata yang dipilih memiliki huruf-huruf umum yang saling bersinggungan agar dapat berpotongan secara silang (interlocking 2D grid) mendatar dan menurun.
     * Pada 'pertanyaan', tuliskan HANYA kalimat petunjuk (clue) konsep kimia yang mendalam, menarik, dan edukatif (JANGAN menuliskan kotak-kotak manual atau label arah, karena sistem otomatis menyusun kisi-kisi kotak 2D dan nomornya).
      * KHUSUS TEKA-TEKI SILANG (TTS): Pada kalimat petunjuk (clue), TULISKAN SEMUA RUMUS KIMIA & NOTASI DALAM TEKS BIASA / NATURAL (misal: HCl, CH3COOH, H2O, pH, Ka, 10^-2 M) TANPA simbol sintaks LaTeX $...$ atau \\text{} agar petunjuk langsung terbaca bersih dan rapi oleh siswa di lembar soal.
     * Kosongkan 'pilihan_jawaban' ([]).
     * Pada 'kunci_jawaban', tuliskan kata kunci TTS dalam SATU KATA huruf kapital murni (contoh: "ELEKTRON", "TITRASI", "INDIKATOR", "BUFFER", "LAKMUS", "HIDROLISIS").
     * Pada 'tipe_soal', tuliskan 'Teka-Teki Silang (TTS)'.
     * Pada 'pembahasan_langkah', jelaskan materi konsep kimia terkait kata kunci tersebut.
   - FORMAT CAMPURAN SOAL UNIK:
     * Distribusikan paket butir soal secara proporsional ke dalam ketiga format di atas (Menjodohkan, Scramble, dan TTS).
     * Tuliskan format spesifik butir tersebut pada properti 'tipe_soal': 'Menjodohkan (Matching)', 'Scramble (Kata Acak)', atau 'Teka-Teki Silang (TTS)'.
`;

// INITIALIZATION

// =========================================================================
// GLOBAL STATE & KEYS (HOISTED FOR SAFE ACCESS)
// =========================================================================
const LOCAL_QUESTION_BANK_KEY = "portalkimia_question_bank_v1";
var localQuestionBank = [];
var selectedBankQuestions = new Set();
var questionBankSource = "local";
var cloudBankItems = [];
var cloudBankSearchSequence = 0;
var cloudBankSearchTimer = null;
var editingQuestionRef = null;
const AI_USAGE_KEY = "portalkimia_ai_usage_v1";

// INITIALIZATION BULLETPROOF
function initializeAllComponents() {
  try { handleAppVersionMigration(); } catch (e) { console.warn("handleAppVersionMigration error:", e); }
  try {
    if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  } catch (e) { console.warn("Lucide icons:", e); }

  try { initConnectionModal(); } catch (e) { console.error("initConnectionModal error:", e); }
  try { updateConnectionStatusUI(); } catch (e) { console.error("updateConnectionStatusUI error:", e); }
  try {
    handleMagicLinkToken();
  } catch (e) { console.error("handleMagicLinkToken error:", e); }
  try {
    initTeacherIdentityListeners();
  } catch (e) { console.error("initTeacherIdentityListeners error:", e); }

  try { initFormListeners(); } catch (e) { console.error("initFormListeners error:", e); }
  try { initTabListeners(); } catch (e) { console.error("initTabListeners error:", e); }
  try { initCollectionListeners(); } catch (e) { console.error("initCollectionListeners error:", e); }
  try { initExportListeners(); } catch (e) { console.error("initExportListeners error:", e); }
  try { initAIUsageTracker(); } catch (e) { console.error("initAIUsageTracker error:", e); }
  try { initQualityAndBankTools(); } catch (e) { console.error("initQualityAndBankTools error:", e); }
  try { restoreLastGeneratedDraft(); } catch (e) { console.error("restoreLastGeneratedDraft error:", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAllComponents);
} else {
  initializeAllComponents();
}

function persistLastGeneratedDraft(pkg) {
  if (!pkg || !Array.isArray(pkg.daftar_soal)) return;
  try {
    localStorage.setItem(LAST_GENERATED_DRAFT_KEY, JSON.stringify({
      savedAt: new Date().toISOString(), package: pkg,
      activeParallelTab: activeParallelTab === "B" ? "B" : "A",
      filterSavedOnly: filterSavedOnly === true
    }));
  } catch (err) { console.warn("Draf terakhir gagal disimpan di browser:", err); }
}
function restoreLastGeneratedDraft() {
  try {
    const raw = localStorage.getItem(LAST_GENERATED_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft || !draft.package || !Array.isArray(draft.package.daftar_soal) || !draft.package.daftar_soal.length) return;
    currentPackage = draft.package;
    sanitizeQuizPackage(currentPackage);
    activeParallelTab = draft.activeParallelTab === "B" && Array.isArray(currentPackage.daftar_soal_paket_b) && currentPackage.daftar_soal_paket_b.length ? "B" : "A";
    filterSavedOnly = false;
    const btnA = document.getElementById("btnSwitchPaketA");
    const btnB = document.getElementById("btnSwitchPaketB");
    if (btnA && btnB) {
      btnA.className = activeParallelTab === "A" ? "px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 text-white shadow-sm transition-all" : "px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all";
      btnB.className = activeParallelTab === "B" ? "px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all" : "px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all";
    }
    syncSavedQuestions();
    updateSavedCountBadge();
    renderResults(currentPackage);
    const report = document.getElementById("qualityAuditReport");
    if (report) qualityText(report, "Draf terakhir dipulihkan otomatis dari browser (" + new Date(draft.savedAt || Date.now()).toLocaleString("id-ID") + ").", "ok");
  } catch (err) {
    console.warn("Draf terakhir tidak dapat dipulihkan:", err);
  }
}
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

// =========================================================================
// SISTEM TOKEN AKSES GURU & MULTI-USER QUOTA LEDGER (SINKRON MODUL AJAR)
// =========================================================================

function getGeneratorAccessToken() {
  return (
    localStorage.getItem('generatorAccessToken') ||
    localStorage.getItem('portalkimia_guru_token') ||
    localStorage.getItem('portalkimia_soal_access_token') ||
    ''
  ).trim();
}

function setGeneratorAccessToken(token) {
  if (token && token.trim()) {
    const clean = token.trim();
    localStorage.setItem('generatorAccessToken', clean);
    localStorage.setItem('portalkimia_guru_token', clean);
    localStorage.setItem('portalkimia_soal_access_token', clean);
  } else {
    localStorage.removeItem('generatorAccessToken');
    localStorage.removeItem('portalkimia_guru_token');
    localStorage.removeItem('portalkimia_soal_access_token');
  }
}

function getGeneratorAccountInfo() {
  try {
    return JSON.parse(localStorage.getItem('generatorAccountInfo') || 'null');
  } catch (e) {
    return null;
  }
}

function setGeneratorAccountInfo(info) {
  if (info) {
    localStorage.setItem('generatorAccountInfo', JSON.stringify(info));
    if (info.nama) {
      localStorage.setItem('portalkimia_guru_nama', info.nama);
      localStorage.setItem('portalkimia_nama_guru', info.nama);
    }
  } else {
    localStorage.removeItem('generatorAccountInfo');
    localStorage.removeItem('portalkimia_guru_nama');
    localStorage.removeItem('portalkimia_nama_guru');
  }
}

function updateConnectionStatusUI() {
  const token = getGeneratorAccessToken();
  const acc = window.currentUserAccount || getGeneratorAccountInfo();
  const dot = document.getElementById("backendDot");
  const keyIcon = document.getElementById("backendKeyIcon");
  const connText = document.getElementById("connectionStatusText");
  const badgePeran = document.getElementById("badgePeranTokenSoal");
  const feedback = document.getElementById("tokenSaldoFeedbackSoal");
  const infoCard = document.getElementById("tokenInfoCardSoal");
  const infoNama = document.getElementById("tokenInfoNamaSoal");
  const infoSaldo = document.getElementById("tokenInfoSaldoSoal");
  const infoDetail = document.getElementById("tokenInfoDetailSoal");
  const panelAdmin = document.getElementById("panelAdminTokenGuruSoal");
  const inputToken = document.getElementById("inputAccessTokenSoal");

  if (inputToken && !inputToken.value && token) {
    inputToken.value = token;
  }

  if (!token) {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
    if (keyIcon) keyIcon.className = "w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform";
    if (connText) connText.textContent = "Token Belum Diatur";
    if (badgePeran) {
      badgePeran.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700";
      badgePeran.textContent = "Belum Diatur";
    }
    if (infoCard) infoCard.classList.add("hidden");
    if (panelAdmin) panelAdmin.classList.add("hidden");
    return;
  }

  if (acc && acc.peran === 'master') {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-violet-400 animate-pulse";
    if (keyIcon) keyIcon.className = "w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform";
    if (connText) connText.textContent = "⭐ Master (Unlimited)";
    if (badgePeran) {
      badgePeran.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40";
      badgePeran.textContent = "Master Tito";
    }
    if (feedback) feedback.innerHTML = '<span class="text-violet-300 font-semibold">Akses Penuh Master (Kuota Unlimited)</span>';
    if (infoCard) {
      infoCard.classList.remove("hidden");
      if (infoNama) infoNama.textContent = "Master Tito Vanzal";
      if (infoSaldo) {
        infoSaldo.className = "px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono";
        infoSaldo.textContent = "Unlimited";
      }
      if (infoDetail) infoDetail.textContent = "Akses Master: Dapat menambah & mengelola kuota rekan guru di bawah.";
    }
    if (panelAdmin) {
      panelAdmin.classList.remove("hidden");
      muatDaftarTokenGuruAdminSoal();
    }
  } else if (acc && acc.peran === 'guru') {
    const saldo = typeof acc.saldo === 'number' ? acc.saldo : Number(acc.saldo || 0);
    const nama = formatNamaGuru(acc.nama);
    const isHabis = saldo <= 0;

    if (dot) dot.className = isHabis ? "w-2 h-2 rounded-full bg-rose-400 animate-pulse" : "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
    if (keyIcon) keyIcon.className = isHabis ? "w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" : "w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform";
    if (connText) connText.textContent = isHabis ? (nama + " (Kuota Habis)") : (nama + " (" + saldo + "x Kuota)");
    
    if (badgePeran) {
      badgePeran.className = isHabis 
        ? "text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40"
        : "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      badgePeran.textContent = isHabis ? "Kuota Habis" : "Rekan Guru";
    }
    if (feedback) {
      feedback.innerHTML = isHabis 
        ? '<span class="text-rose-400 font-semibold">Kuota habis. Hubungi Ust. Tito Vanzal untuk isi ulang.</span>'
        : '<span class="text-emerald-400 font-semibold">Tersambung ke PortalKimia Suite</span>';
    }
    if (infoCard) {
      infoCard.classList.remove("hidden");
      if (infoNama) infoNama.textContent = nama;
      if (infoSaldo) {
        infoSaldo.className = isHabis ? "px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono" : "px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono";
        infoSaldo.textContent = saldo + "x Kesempatan";
      }
      if (infoDetail) infoDetail.textContent = "Total Terpakai: " + (acc.terpakai || 0) + "x • Tersinkron dengan Modul Ajar";
    }
    if (panelAdmin) panelAdmin.classList.add("hidden");
  } else {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
    if (connText) connText.textContent = "Token Tersimpan";
    if (panelAdmin) panelAdmin.classList.add("hidden");
  }
  if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
}

async function ujiKoneksiDanToken(tokenToTest) {
  const url = getGasUrl();
  const token = (tokenToTest || getGeneratorAccessToken()).trim();
  const feedback = document.getElementById("tokenSaldoFeedbackSoal");
  const btnUji = document.getElementById("btnSimpanDanUjiTokenSoal");

  if (!url) {
    if (feedback) feedback.innerHTML = '<span class="text-rose-400">URL backend GAS belum diatur di config.js!</span>';
    return null;
  }
  if (!token) {
    if (feedback) feedback.innerHTML = '<span class="text-amber-400">Masukkan token akses terlebih dahulu.</span>';
    return null;
  }

  if (feedback) feedback.innerHTML = '<span class="text-emerald-400 animate-pulse">⏳ Memverifikasi token ke backend GAS...</span>';
  if (btnUji) btnUji.disabled = true;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ping", accessToken: token })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    setGeneratorAccessToken(token);
    window.currentUserAccount = {
      peran: data.peran || 'guru',
      nama: data.nama || 'Guru',
      saldo: data.saldo !== undefined ? data.saldo : 'Unlimited',
      terpakai: data.terpakai || 0
    };
    setGeneratorAccountInfo(window.currentUserAccount);
    updateConnectionStatusUI();

    if (feedback) {
      feedback.innerHTML = '<span class="text-emerald-400 font-semibold">✅ Token sah! ' + (data.message || '') + '</span>';
    }
    return data;
  } catch (err) {
    if (feedback) {
      feedback.innerHTML = '<span class="text-rose-400 font-semibold">❌ ' + (err.message || 'Verifikasi token gagal.') + '</span>';
    }
    // Invalidate local cache on rejected token
    window.currentUserAccount = null;
    setGeneratorAccountInfo(null);
    updateConnectionStatusUI();
    return null;
  } finally {
    if (btnUji) btnUji.disabled = false;
  }
}

async function muatDaftarTokenGuruAdminSoal() {
  const container = document.getElementById("adminTableAkunGuruContainerSoal");
  if (!container) return;
  const token = getGeneratorAccessToken();
  const url = getGasUrl();
  container.innerHTML = '<div class="p-3 text-center text-zinc-400 text-xs">Memuat daftar token rekan guru...</div>';
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "adminListAkun", accessToken: token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const daftar = data.daftar || [];
    if (!daftar.length) {
      container.innerHTML = '<div class="p-3 text-center text-zinc-400 text-xs">Belum ada akun guru. Buat akun pertama menggunakan formulir di atas.</div>';
      return;
    }

    let html = '<table class="w-full text-left border-collapse">' +
      '<thead><tr class="border-b border-zinc-800 bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400">' +
      '<th class="p-2">Guru</th><th class="p-2">Token</th><th class="p-2 text-center">Saldo</th><th class="p-2 text-center">Terpakai</th><th class="p-2 text-right">Aksi</th>' +
      '</tr></thead><tbody class="divide-y divide-zinc-800/60">';

    daftar.forEach(item => {
      const isHabis = Number(item.saldo || 0) <= 0;
      const namaGuruTampil = formatNamaGuru(item.nama);
      html += '<tr class="hover:bg-zinc-900/40 transition-colors">' +
        '<td class="p-2 font-semibold text-zinc-200">' + namaGuruTampil + '</td>' +
        '<td class="p-2 font-mono text-[11px] text-zinc-400"><span class="cursor-pointer hover:text-emerald-300 select-all" title="Klik untuk salin" onclick="navigator.clipboard && navigator.clipboard.writeText(\'' + item.token + '\')">' + item.token + '</span></td>' +
        '<td class="p-2 text-center font-bold font-mono ' + (isHabis ? 'text-rose-400' : 'text-emerald-400') + '">' + item.saldo + 'x</td>' +
        '<td class="p-2 text-center font-mono text-zinc-400">' + item.terpakai + 'x</td>' +
        '<td class="p-2 text-right space-x-1 whitespace-nowrap">' +
        '<button type="button" class="px-2 py-0.5 rounded bg-violet-600/30 hover:bg-violet-600/60 text-violet-300 font-bold text-[10px]" title="Salin Tautan Akses Langsung WhatsApp untuk guru ini" onclick="window.adminSalinMagicLinkGuruSoal(\'' + item.token + '\', \'' + item.nama + '\')">🔗 Link WA</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded bg-sky-600/30 hover:bg-sky-600/60 text-sky-300 font-bold text-[10px]" title="Ubah / Custom Token Guru" onclick="window.adminGantiTokenGuruSoal(\'' + item.token + '\', \'' + item.nama + '\')">✏️ Ubah</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[10px]" title="Tambah 5 kuota" onclick="window.adminUbahSaldoGuruSoal(\'' + item.token + '\', 5, \'tambah\')">+5</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[10px]" title="Tambah 1 kuota" onclick="window.adminUbahSaldoGuruSoal(\'' + item.token + '\', 1, \'tambah\')">+1</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 font-bold text-[10px]" title="Kurangi 1 kuota" onclick="window.adminUbahSaldoGuruSoal(\'' + item.token + '\', 1, \'kurang\')">-1</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-[10px]" title="Hapus akun guru" onclick="window.adminHapusAkunGuruSoal(\'' + item.token + '\', \'' + item.nama + '\')">🗑️</button>' +
        '</td></tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div class="p-3 text-center text-rose-400 text-xs">Gagal memuat: ' + err.message + '</div>';
  }
}

window.adminSalinMagicLinkGuruSoal = function(token, nama) {
  let base = "https://portalkimia.github.io/suitehub/soal/";
  try {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      if (window.location.origin.includes("github.io")) {
        base = window.location.origin + window.location.pathname;
        base = base.replace(/\/index\.html$/i, "/");
        if (!base.endsWith("/")) base += "/";
      }
    }
  } catch (e) {}

  const magicUrl = `${base}?token=${encodeURIComponent(token)}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(magicUrl).then(() => {
      alert(`✅ Tautan Akses WhatsApp untuk ${formatNamaGuru(nama)} berhasil disalin:\n\n${magicUrl}\n\nKirimkan tautan ini ke WhatsApp rekan guru. Rekan guru cukup mengklik tautan tersebut untuk langsung menggunakan Generator Soal dengan token dan kuota aktif tanpa perlu mengetik apapun!`);
    }).catch(() => {
      prompt("Salin tautan WhatsApp ini untuk rekan guru:", magicUrl);
    });
  } else {
    prompt("Salin tautan WhatsApp ini untuk rekan guru:", magicUrl);
  }
};

async function adminTambahAkunGuruSoal() {
  const inputNama = document.getElementById("adminInputNamaGuruSoal");
  const inputSaldo = document.getElementById("adminInputSaldoAwalSoal");
  const inputCustom = document.getElementById("adminInputCustomTokenSoal");
  const nama = (inputNama ? inputNama.value : '').trim();
  const customToken = (inputCustom ? inputCustom.value : '').trim();
  const saldo = parseInt(inputSaldo ? inputSaldo.value : '5', 10);
  if (!nama) {
    alert("Masukkan nama rekan guru terlebih dahulu.");
    return;
  }
  const url = getGasUrl();
  const token = getGeneratorAccessToken();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "adminTambahAkun",
        accessToken: token,
        nama: nama,
        saldoAwal: isNaN(saldo) ? 5 : saldo,
        customToken: customToken || undefined
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const magicLink = "https://portalkimia.github.io/suitehub/soal/?token=" + encodeURIComponent(data.token);
    alert("Akun berhasil dibuat!\n\nNama: " + formatNamaGuru(data.nama) + "\nToken: " + data.token + "\nSaldo: " + data.saldo + "x generate\n\nTautan Akses WhatsApp:\n" + magicLink + "\n\n(Tautan WhatsApp telah disalin otomatis ke clipboard)");
    if (navigator.clipboard) navigator.clipboard.writeText(magicLink).catch(() => {});
    if (inputNama) inputNama.value = '';
    if (inputCustom) inputCustom.value = '';
    muatDaftarTokenGuruAdminSoal();
  } catch (err) {
    alert("Gagal membuat akun: " + err.message);
  }
}

async function adminGantiTokenGuruSoal(tokenLama, namaGuru) {
  const tokenBaru = prompt(`Ganti token untuk ${formatNamaGuru(namaGuru) || tokenLama}:\n\nKetik token baru yang singkat & mudah diingat (misal: BUDI-KIMIA atau BUDI2026):`, tokenLama);
  if (!tokenBaru || !tokenBaru.trim() || tokenBaru.trim() === tokenLama) return;
  const cleanBaru = tokenBaru.trim();
  const url = getGasUrl();
  const token = getGeneratorAccessToken();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "adminGantiToken",
        accessToken: token,
        identitas: tokenLama,
        tokenBaru: cleanBaru
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const magicLink = "https://portalkimia.github.io/suitehub/soal/?token=" + encodeURIComponent(cleanBaru);
    alert(`✅ Token untuk ${formatNamaGuru(data.nama || namaGuru)} berhasil diubah menjadi:\n${cleanBaru}\n\nTautan Akses WhatsApp Baru:\n${magicLink}\n\n(Tautan baru telah disalin otomatis ke clipboard)`);
    if (navigator.clipboard) navigator.clipboard.writeText(magicLink).catch(() => {});
    muatDaftarTokenGuruAdminSoal();
  } catch (err) {
    alert("Gagal mengganti token: " + err.message);
  }
}
window.adminGantiTokenGuruSoal = adminGantiTokenGuruSoal;

async function adminUbahSaldoGuruSoal(identitas, nilai, mode) {
  const url = getGasUrl();
  const token = getGeneratorAccessToken();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "adminUbahSaldo", accessToken: token, identitas: identitas, nilai: nilai, mode: mode })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    muatDaftarTokenGuruAdminSoal();
  } catch (err) {
    alert("Gagal update kuota: " + err.message);
  }
}

async function adminHapusAkunGuruSoal(identitas, nama) {
  if (!confirm("Hapus akun " + nama + "? Token tidak akan dapat digunakan lagi.")) return;
  const url = getGasUrl();
  const token = getGeneratorAccessToken();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "adminHapusAkun", accessToken: token, identitas: identitas })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    muatDaftarTokenGuruAdminSoal();
  } catch (err) {
    alert("Gagal menghapus akun: " + err.message);
  }
}

window.adminUbahSaldoGuruSoal = adminUbahSaldoGuruSoal;
window.adminHapusAkunGuruSoal = adminHapusAkunGuruSoal;



// =========================================================================
// MODAL CONTROLLERS (GLOBAL ACCESS)
// =========================================================================

function switchConnectionModalTab(tab) {
  const paneToken = document.getElementById("paneModalTokenGuru");
  const paneDiag = document.getElementById("paneModalServerDiag");
  const btnToken = document.getElementById("tabBtnTokenGuru");
  const btnDiag = document.getElementById("tabBtnServerDiag");

  if (tab === "diag") {
    if (paneToken) paneToken.classList.add("hidden");
    if (paneDiag) paneDiag.classList.remove("hidden");
    if (btnToken) {
      btnToken.className = "inline-flex items-center gap-1.5 px-3 py-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 font-semibold text-xs transition-colors";
    }
    if (btnDiag) {
      btnDiag.className = "inline-flex items-center gap-1.5 px-3 py-2 border-b-2 border-emerald-500 text-emerald-300 font-bold text-xs transition-colors";
    }
  } else {
    if (paneToken) paneToken.classList.remove("hidden");
    if (paneDiag) paneDiag.classList.add("hidden");
    if (btnToken) {
      btnToken.className = "inline-flex items-center gap-1.5 px-3 py-2 border-b-2 border-emerald-500 text-emerald-300 font-bold text-xs transition-colors";
    }
    if (btnDiag) {
      btnDiag.className = "inline-flex items-center gap-1.5 px-3 py-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 font-semibold text-xs transition-colors";
    }
  }
  if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}
window.switchConnectionModalTab = switchConnectionModalTab;

function openConnectionModal() {
  const modal = document.getElementById("connectionModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  if (typeof runPingTestManual === "function") {
    runPingTestManual();
  }
}
window.openConnectionModal = openConnectionModal;

function closeConnectionModal() {
  const modal = document.getElementById("connectionModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}
window.closeConnectionModal = closeConnectionModal;

function openAIUsageModal() {
  if (typeof renderAIUsageSummary === "function") {
    try { renderAIUsageSummary(); } catch (e) { console.warn("renderAIUsageSummary error:", e); }
  }
  const modal = document.getElementById("aiUsageModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("block");
  }
}
window.openAIUsageModal = openAIUsageModal;

function closeAIUsageModal() {
  const modal = document.getElementById("aiUsageModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("block");
  }
}
window.closeAIUsageModal = closeAIUsageModal;


function initConnectionModal() {
  const modal = document.getElementById("connectionModal");
  const btnOpen = document.getElementById("btnOpenConnectionModal");
  const btnClose = document.getElementById("closeConnectionModalBtn");
  const btnCloseBottom = document.getElementById("btnCloseDiagModal");
  const btnPing = document.getElementById("btnRunDiagnosticPing");
  const diagResult = document.getElementById("diagPingResult");
  const diagEndpointText = document.getElementById("diagEndpointText");
  const connStatusText = document.getElementById("connectionStatusText");
  const inputToken = document.getElementById("inputAccessTokenSoal");
  const btnToggleVisibility = document.getElementById("btnToggleTokenVisibilitySoal");
  const btnSimpanToken = document.getElementById("btnSimpanDanUjiTokenSoal");
  const btnRefreshAdmin = document.getElementById("btnRefreshAdminTokensSoal");
  const btnAdminTambah = document.getElementById("btnAdminTambahTokenSoal");

  if (inputToken) {
    inputToken.value = getGeneratorAccessToken();
  }
  if (btnToggleVisibility && inputToken) {
    btnToggleVisibility.addEventListener("click", () => {
      inputToken.type = inputToken.type === "password" ? "text" : "password";
    });
  }
  if (btnSimpanToken && inputToken) {
    btnSimpanToken.addEventListener("click", () => {
      ujiKoneksiDanToken(inputToken.value);
    });
  }
  if (btnRefreshAdmin) {
    btnRefreshAdmin.addEventListener("click", () => {
      muatDaftarTokenGuruAdminSoal();
    });
  }
  if (btnAdminTambah) {
    btnAdminTambah.addEventListener("click", () => {
      adminTambahAkunGuruSoal();
    });
  }

  const gasUrl = getGasUrl();
  if (diagEndpointText) {
    diagEndpointText.textContent = gasUrl ? `Tersambung ke ${gasUrl.slice(0, 48)}...` : "URL GAS belum terpasang";
  }

  window.runPingTestManual = runPingTest;

  if (btnOpen) btnOpen.addEventListener("click", openConnectionModal);
  if (btnClose) btnClose.addEventListener("click", closeConnectionModal);
  if (btnCloseBottom) btnCloseBottom.addEventListener("click", closeConnectionModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeConnectionModal();
    });
  }

  async function runPingTest() {
    const url = getGasUrl();
    if (!url) {
      if (diagResult) diagResult.innerHTML = `<span class="text-rose-400">❌ URL Backend GAS belum terpasang di config.js!</span>`;
      return;
    }

    if (btnPing) {
      btnPing.disabled = true;
      btnPing.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Menguji...</span>`;
      if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }

    if (diagResult) {
      diagResult.innerHTML = `<span class="text-zinc-400">Menghubungi Google Apps Script &amp; AI Gemini...</span>`;
    }

    const tStart = performance.now();
    let isConnected = false;
    let latency = 0;
    let serviceName = "PortalKimia Generator Soal AI Backend";
    let statusMsg = "";

    try {
      // 1. Coba metode GET ping terlebih dahulu
      const pingUrl = url + (url.includes("?") ? "&" : "?") + "action=ping";
      let res = await fetch(pingUrl, { method: "GET", mode: "cors" });
      latency = Math.round(performance.now() - tStart);

      if (res.ok) {
        const json = await res.json();
        isConnected = true;
        serviceName = json.service || serviceName;
      } else {
        // 2. Fallback otomatis ke metode POST ping jika GET terkena cold-start / redirect timeout
        if (diagResult) {
          diagResult.innerHTML = `<span class="text-amber-300 animate-pulse">Menghubungi jalur cadangan POST...</span>`;
        }
        const postRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "ping" })
        });
        latency = Math.round(performance.now() - tStart);
        if (postRes.ok) {
          const postJson = await postRes.json();
          isConnected = true;
          serviceName = postJson.service || serviceName;
        } else {
          statusMsg = `HTTP ${res.status} (GET) / HTTP ${postRes.status} (POST)`;
        }
      }

      if (isConnected) {
        const isColdStart = latency > 8000;
        if (diagResult) {
          diagResult.innerHTML = `
            <div class="text-emerald-400 font-semibold">✅ Status: Terhubung Normal (HTTP 200)</div>
            <div class="text-zinc-200">⏱️ Latensi Server: <b class="text-emerald-300">${latency} ms</b> ${isColdStart ? '<span class="text-amber-300 text-[10px]">(Google Server Cold Start)</span>' : ''}</div>
            <div class="text-zinc-400 text-[10px] mt-1">Layanan: ${serviceName}</div>
          `;
        }
        if (connStatusText) {
          connStatusText.textContent = `Online (${latency} ms)`;
        }
      } else {
        if (diagResult) {
          diagResult.innerHTML = `
            <div class="text-amber-400 font-semibold">⚠️ Respon server: ${statusMsg} (${latency} ms)</div>
            <div class="text-zinc-300 text-[10px] mt-1">Kemungkinan server Google Apps Script sedang mengalami pemanasan container (cold start). Silakan klik tombol <b>Uji Lagi</b> atau langsung generate soal.</div>
          `;
        }
      }
    } catch (err) {
      latency = Math.round(performance.now() - tStart);
      // Coba fallback POST jika error terjadi pada fetch GET
      try {
        const postRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "ping" })
        });
        latency = Math.round(performance.now() - tStart);
        if (postRes.ok) {
          if (diagResult) {
            diagResult.innerHTML = `
              <div class="text-emerald-400 font-semibold">✅ Status: Terhubung Normal via Jalur Cadangan (HTTP 200)</div>
              <div class="text-zinc-200">⏱️ Latensi Server: <b class="text-emerald-300">${latency} ms</b></div>
              <div class="text-zinc-400 text-[10px] mt-1">Layanan: ${serviceName}</div>
            `;
          }
          if (connStatusText) connStatusText.textContent = `Online (${latency} ms)`;
          return;
        }
      } catch (postErr) {
        // Biarkan ditangani di bawah
      }

      if (diagResult) {
        diagResult.innerHTML = `
          <div class="text-rose-400 font-semibold">❌ Waktu tunggu habis / Gagal terhubung (${latency} ms)</div>
          <div class="text-zinc-400 text-[10px] mt-1">Pesan: ${err.message}. Pastikan Web App GAS diatur ke 'Anyone' (Siapa saja).</div>
        `;
      }
    } finally {
      if (btnPing) {
        btnPing.disabled = false;
        btnPing.innerHTML = `<i data-lucide="zap" class="w-3.5 h-3.5"></i><span>Uji Lagi</span>`;
        if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
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
          updateConnectionStatusUI();
        })
        .catch(() => {
          updateConnectionStatusUI();
        });
    }
  }, 800);
}

// DATA KURIKULUM & TOPIK DINAMIS (PEARSON EDEXCEL VS NASIONAL)
const PEARSON_CURRICULUM_DATA = {
  grade10: [
    { value: "Principles of Chemistry: States of Matter, Formulae & Calculations", label: "Principles: Formulae, Equations & Chemical Calculations" },
    { value: "Atomic Structure, Periodic Table & Chemical Bonding", label: "Atomic Structure, Periodic Table & Chemical Bonding" },
    { value: "Inorganic Chemistry: Reactivity Series, Extraction & Rusting", label: "Reactivity Series, Metal Extraction & Rusting" },
    { value: "Acids, Alkalis, Titrations & Salt Preparation", label: "Acids, Alkalis, Titrations & Salt Preparation" },
    { value: "Energetics, Rates of Reaction & Reversible Equilibria", label: "Energetics, Rates of Reaction & Reversible Equilibria" },
    { value: "Organic Chemistry: Alkanes, Alkenes, Alcohols & Polymers", label: "Organic Chemistry: Alkanes, Alkenes, Alcohols & Polymers" },
    { value: "Qualitative Analysis: Chemical Tests for Gases, Cations & Anions", label: "Qualitative Analysis: Tests for Gases, Cations & Anions" },
    { value: "CUSTOM", label: "[Other Topic / Custom Specification]" }
  ],
  grade11: [
    { value: "Unit 1: Formulae, Equations and Amount of Substance (Moles)", label: "Unit 1: Formulae, Equations and Amount of Substance" },
    { value: "Unit 1: Energetics (Enthalpy Changes & Hess's Law Cycles)", label: "Unit 1: Energetics (Enthalpy Changes & Hess Cycles)" },
    { value: "Unit 1: Atomic Structure, Ionisation Energies & Bonding", label: "Unit 1: Atomic Structure, Ionisation Energies & Bonding" },
    { value: "Unit 1: Introductory Organic Chemistry, Alkanes & Alkenes", label: "Unit 1: Introductory Organic Chemistry, Alkanes & Alkenes" },
    { value: "Unit 2: Intermolecular Forces & Halogenoalkanes", label: "Unit 2: Intermolecular Forces & Halogenoalkanes" },
    { value: "Unit 2: Alcohols, Mass Spectrometry & Infrared (IR)", label: "Unit 2: Alcohols, Mass Spectrometry & Infrared (IR)" },
    { value: "Unit 2: Kinetics I & Chemical Equilibria I (Dynamic Equilibrium)", label: "Unit 2: Kinetics I & Chemical Equilibria I" },
    { value: "Unit 2: Group 2 Alkaline Earth Metals & Group 7 Halogens", label: "Unit 2: Group 2 Alkaline Earth Metals & Group 7 Halogens" },
    { value: "Unit 3: Practical Skills in Chemistry I (Core Practicals & Titration)", label: "Unit 3: Practical Skills in Chemistry I (Core Practicals)" },
    { value: "CUSTOM", label: "[Other Topic / Custom Specification]" }
  ],
  grade12: [
    { value: "Unit 4: Kinetics II (Rate Equations, Orders, Arrhenius & Mechanisms)", label: "Unit 4: Kinetics II (Rate Equations, Orders & Arrhenius)" },
    { value: "Unit 4: Entropy, Lattice Energy & Born-Haber Cycles", label: "Unit 4: Entropy, Lattice Energy & Born-Haber Cycles" },
    { value: "Unit 4: Chemical Equilibria II (Kc, Kp & Temperature Effects)", label: "Unit 4: Chemical Equilibria II (Kc, Kp)" },
    { value: "Unit 4: Acid-Base Equilibria (pH, Kw, Ka, Buffers & Titration Curves)", label: "Unit 4: Acid-Base Equilibria (pH, Kw, Ka, Buffers & Titrations)" },
    { value: "Unit 4: Carbonyl Compounds, Carboxylic Acids & Acyl Chlorides", label: "Unit 4: Carbonyl Compounds, Carboxylic Acids & Derivatives" },
    { value: "Unit 5: Redox Equilibria, Standard Electrode Potentials (E°) & Cells", label: "Unit 5: Redox Equilibria, Electrode Potentials (E°) & Cells" },
    { value: "Unit 5: Transition Metals, Ligand Exchange & Complex Ions", label: "Unit 5: Transition Metals, Ligands & Complex Ions" },
    { value: "Unit 5: Arenes & Benzene Chemistry (Electrophilic Substitution)", label: "Unit 5: Arenes & Benzene Chemistry" },
    { value: "Unit 5: Organic Nitrogen Chemistry (Amines, Amides, Amino Acids & Polymers)", label: "Unit 5: Organic Nitrogen Chemistry (Amines, Amides & Amino Acids)" },
    { value: "Unit 6: Practical Skills in Chemistry II (Organic Synthesis, TLC, 1H/13C-NMR)", label: "Unit 6: Practical Skills in Chemistry II (Synthesis & NMR)" },
    { value: "CUSTOM", label: "[Other Topic / Custom Specification]" }
  ]
};

const INDONESIA_TOPIC_LIST = [
  { value: "Stoikiometri & Hukum Dasar Kimia", label: "Stoikiometri & Hukum Dasar Kimia" },
  { value: "Larutan Asam-Basa & Indikator pH", label: "Larutan Asam-Basa & Indikator pH" },
  { value: "Larutan Penyangga (Buffer)", label: "Larutan Penyangga (Buffer)" },
  { value: "Hidrolisis Garam", label: "Hidrolisis Garam" },
  { value: "Kelarutan dan Hasil Kali Kelarutan (Ksp)", label: "Kelarutan dan Hasil Kali Kelarutan (Ksp)" },
  { value: "Termokimia & Entalpi Reaksi", label: "Termokimia & Entalpi Reaksi" },
  { value: "Laju Reaksi & Teori Tumbukan", label: "Laju Reaksi & Teori Tumbukan" },
  { value: "Kesetimbangan Kimia & Asas Le Chatelier", label: "Kesetimbangan Kimia & Asas Le Chatelier" },
  { value: "Reaksi Redoks & Penyetaraan Reaksi", label: "Reaksi Redoks & Penyetaraan Reaksi" },
  { value: "Elektrokimia (Sel Volta & Elektrolisis)", label: "Elektrokimia (Sel Volta & Elektrolisis)" },
  { value: "Struktur Atom & Sistem Periodik Unsur", label: "Struktur Atom & Sistem Periodik Unsur" },
  { value: "Ikatan Kimia & Geometri Molekul", label: "Ikatan Kimia & Geometri Molekul" },
  { value: "Senyawa Hidrokarbon & Minyak Bumi", label: "Senyawa Hidrokarbon & Minyak Bumi" },
  { value: "Gugus Fungsi Senyawa Karbon", label: "Gugus Fungsi Senyawa Karbon" },
  { value: "Makromolekul & Polimer", label: "Makromolekul & Polimer" },
  { value: "Kimia Koloid & Sifat Koloid", label: "Kimia Koloid & Sifat Koloid" },
  { value: "Kimia Unsur & Sifat Periodik", label: "Kimia Unsur & Sifat Periodik" },
  { value: "Kimia Lingkungan & Kimia Hijau", label: "Kimia Lingkungan & Kimia Hijau" },
  { value: "CUSTOM", label: "[Topik Lain / Tulis Sendiri]" }
];

const PEARSON_TYPES_LIST = [
  { value: "Section B: Structured Questions Paper (Exam Style with subparts & marks)", label: "📝 Section B: Structured Questions Paper (Subparts & Marks)" },
  { value: "Section A: Multiple Choice Questions (4 Options: A to D)", label: "🔘 Section A: Multiple Choice Questions (4 Options: A to D)" },
  { value: "Complete Examination Paper (Section A MCQs + Section B Structured)", label: "📋 Complete Exam Paper (Section A MCQs + Section B Structured)" },
  { value: "Core Practical & Experimental Skills (Unit 3/6 Laboratory & Data Analysis)", label: "🧪 Core Practical & Experimental Analysis (Unit 3/6 Style)" }
];

const INDONESIA_TYPES_LIST = [
  { value: "Pilihan Ganda Biasa (A-E)", label: "Pilihan Ganda Biasa (5 Opsi: A s.d. E)" },
  { value: "TKA Model Standar (Campuran Tipe 1 PG, Tipe 2 Asosiasi 1-2-3-4, Tipe 3 Sebab-Akibat)", label: "🎯 TKA Standar (Campuran Tipe 1 PG, Tipe 2 Asosiasi, Tipe 3 Sebab-Akibat)" },
  { value: "Campuran Semua Bentuk Soal (PG Biasa, PG Kompleks 1-2-3-4, Sebab-Akibat, Esai/Tabel)", label: "🎲 Campuran Multi-Bentuk (PG, Kompleks 1-2-3-4, Sebab-Akibat, Esai)" },
  { value: "Esai / Uraian Terstruktur (Sub a, b, c & Garis Lembar Jawab)", label: "📝 Esai / Uraian Terstruktur (Sub-pertanyaan a, b, c & Garis Lembar Jawab)" },
  { value: "Pilihan Ganda Kompleks (Kombinasi Pernyataan 1, 2, 3, 4)", label: "PG Kompleks (Kombinasi Pernyataan 1, 2, 3, 4 - Asosiasi)" },
  { value: "Pilihan Ganda Kompleks Matriks / Tabel (Benar-Salah)", label: "PG Kompleks Tabel (Benar / Salah - AKM)" },
  { value: "Sebab-Akibat / Asosiasi (UTBK)", label: "Sebab-Akibat / Hubungan Antar-Hal (Pernyataan - Alasan)" },
  { value: "Esai / Uraian Perhitungan", label: "Esai / Uraian Perhitungan Bertingkat" },
  { value: "Menjodohkan (Matching Kolom A & B)", label: "🧩 Menjodohkan (Matching Pasangan Konsep Kolom A & B)" },
  { value: "Kata Acak / Scramble (Susun Huruf & Konsep)", label: "🔤 Scramble / Kata Acak (Susun Huruf & Konsep Kimia)" },
  { value: "Teka-Teki Silang (TTS Kimia Mendatar & Menurun)", label: "📰 Teka-Teki Silang (TTS Kimia - Mendatar & Menurun)" },
  { value: "Campuran Soal Unik (Menjodohkan, Scramble, & TTS)", label: "✨ Campuran Soal Unik (Menjodohkan, Scramble, & TTS)" }
];

const PEARSON_STIMULUS_LIST = [
  { value: "Core Practical & Laboratory Investigation (Titration, Calorimetry, Rates, Synthesis)", label: "🧪 Core Practical & Laboratory Investigation" },
  { value: "Industrial & Environmental Chemistry (Haber Process, Contact Process, Catalysis)", label: "🏭 Industrial & Environmental Chemistry" },
  { value: "Analytical & Spectroscopic Data (Mass Spec, IR, NMR, Chromatography)", label: "📊 Analytical & Spectroscopic Data" },
  { value: "Theoretical & Pure Conceptual Principles", label: "📚 Pure Conceptual & Reaction Mechanisms" },
  { value: "Tanpa Stimulus (Drilling Soal Langsung & Hemat Kertas)", label: "⚡ Direct Questions (No Stimulus / Paper-Saving)" }
];

const INDONESIA_STIMULUS_LIST = [
  { value: "Kimia Hijau & Isu Lingkungan", label: "🌿 Kimia Hijau & Isu Lingkungan (Baterai EV, Polusi, Efisiensi)" },
  { value: "Kontekstual Kehidupan Sehari-hari", label: "🏠 Kontekstual Sehari-hari (Antasida, Korosi, Bahan Rumah Tangga)" },
  { value: "Proses Industri Kimia", label: "🏭 Proses Industri Kimia (Amonia Haber-Bosch, Kontak Asam Sulfat)" },
  { value: "Prosedur Laboratorium & Praktikum", label: "🧪 Laboratorium & Praktikum (Titrasi, Uji Nyala, Kalorimeter)" },
  { value: "Konseptual & Teori Murni", label: "📚 Konseptual & Teori Murni (Prinsip Kimia Standar)" },
  { value: "Tanpa Stimulus (Drilling Soal Langsung & Hemat Kertas)", label: "⚡ Tanpa Stimulus (Drilling Soal Langsung & Hemat Kertas)" }
];

function updateCurriculumFormUI() {
  const gradeElem = document.getElementById("gradeSelect");
  const typeElem = document.getElementById("questionTypeSelect");
  const topicElem = document.getElementById("topicSelect");
  const stimulusElem = document.getElementById("stimulusSelect");
  if (!gradeElem || !typeElem || !topicElem || !stimulusElem) return;

  const gradeVal = gradeElem.value || "";
  const isPearson = gradeVal.toLowerCase().includes("pearson") || gradeVal.toLowerCase().includes("edexcel");

  const prevType = typeElem.value;
  const prevTopic = topicElem.value;
  const prevStimulus = stimulusElem.value;

  if (isPearson) {
    // 1. Tipe Soal Resmi Pearson
    typeElem.innerHTML = PEARSON_TYPES_LIST.map(item => 
      `<option value="${item.value}" ${item.value === prevType ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!PEARSON_TYPES_LIST.some(item => item.value === prevType)) {
      typeElem.selectedIndex = 0;
    }

    // 2. Topik Materi Pokok Pearson
    let topicList = PEARSON_CURRICULUM_DATA.grade11;
    if (gradeVal.includes("Grade 10")) topicList = PEARSON_CURRICULUM_DATA.grade10;
    else if (gradeVal.includes("Grade 12")) topicList = PEARSON_CURRICULUM_DATA.grade12;

    topicElem.innerHTML = topicList.map(item =>
      `<option value="${item.value}" ${item.value === prevTopic ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!topicList.some(item => item.value === prevTopic)) {
      topicElem.selectedIndex = 0;
    }

    // 3. Model Stimulus Pearson
    stimulusElem.innerHTML = PEARSON_STIMULUS_LIST.map(item =>
      `<option value="${item.value}" ${item.value === prevStimulus ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!PEARSON_STIMULUS_LIST.some(item => item.value === prevStimulus)) {
      stimulusElem.selectedIndex = 0;
    }
  } else {
    // Kurikulum Nasional
    typeElem.innerHTML = INDONESIA_TYPES_LIST.map(item =>
      `<option value="${item.value}" ${item.value === prevType ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!INDONESIA_TYPES_LIST.some(item => item.value === prevType)) {
      typeElem.selectedIndex = 1; // Default TKA Standar
    }

    topicElem.innerHTML = INDONESIA_TOPIC_LIST.map(item =>
      `<option value="${item.value}" ${item.value === prevTopic ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!INDONESIA_TOPIC_LIST.some(item => item.value === prevTopic)) {
      topicElem.selectedIndex = 0;
    }

    stimulusElem.innerHTML = INDONESIA_STIMULUS_LIST.map(item =>
      `<option value="${item.value}" ${item.value === prevStimulus ? "selected" : ""}>${item.label}</option>`
    ).join("");
    if (!INDONESIA_STIMULUS_LIST.some(item => item.value === prevStimulus)) {
      stimulusElem.selectedIndex = 0;
    }
  }

  // Toggle custom topic container
  const customContainer = document.getElementById("customTopicContainer");
  if (customContainer) {
    if (topicElem.value === "CUSTOM") customContainer.classList.remove("hidden");
    else customContainer.classList.add("hidden");
  }
}

function hitungBobotKuotaSoalClient(numQuestions, includeParallel) {
  const n = parseInt(numQuestions || 5, 10);
  let bobot = 1;
  if (n <= 10) bobot = 1;
  else bobot = 2; // n <= 20 (Maksimal 20 butir)

  if (includeParallel) bobot += 1;
  return bobot;
}

function updateGenerateButtonQuotaBadge() {
  const numSelect = document.getElementById("numQuestionsSelect");
  const chkParallel = document.getElementById("chkIncludeParallel");
  const btnText = document.getElementById("btnGenerateText");
  if (!btnText) return;

  const n = numSelect ? parseInt(numSelect.value, 10) : 5;
  const isParallel = chkParallel ? chkParallel.checked : false;
  const bobot = hitungBobotKuotaSoalClient(n, isParallel);

  btnText.textContent = `Buat Soal dengan AI [${bobot} Kuota]`;
}

// MODAL KONFIRMASI PRA-GENERATE SOAL AI
function bukaModalKonfirmasiSoal() {
  const gasUrl = getGasUrl();
  const apiKey = localStorage.getItem("portal_gemini_api_key");
  if (!gasUrl && !apiKey) {
    alert("⚠️ Backend Google Apps Script belum terhubung di config.js!");
    return;
  }

  const topicSelect = document.getElementById("topicSelect");
  let topic = "";
  if (topicSelect) {
    topic = topicSelect.value === "CUSTOM" 
      ? (document.getElementById("customTopicInput")?.value.trim() || "")
      : (topicSelect.value || "");
  }
  if (!topic) {
    alert("⚠️ Silakan pilih atau tuliskan Topik / Materi soal terlebih dahulu.");
    return;
  }

  const grade = document.getElementById("gradeSelect")?.value || "-";
  const qType = document.getElementById("questionTypeSelect")?.value || "-";
  const stimulus = document.getElementById("stimulusSelect")?.value || "-";
  const difficulty = document.getElementById("difficultySelect")?.value || "-";
  const subtopic = document.getElementById("subtopicInput")?.value.trim() || "- (Umum)";
  const numQuestions = parseInt(document.getElementById("numQuestionsSelect")?.value, 10) || 5;
  const model = document.getElementById("modelSelect")?.value || "deepseek-flash";
  const modelLabel = model === "deepseek-flash" ? "DeepSeek V4.1 Flash (Utama)" : (model === "gemini-3.7-flash" ? "Gemini 3.7 Flash" : "Gemini 3.6 Flash");

  const includeKisiKisi = document.getElementById("chkIncludeKisiKisi")?.checked;
  const includeParallel = document.getElementById("chkIncludeParallel")?.checked;
  const includeVisuals = document.getElementById("chkIncludeVisuals")?.checked;
  const includeSolutions = document.getElementById("chkIncludeSolutions")?.checked;

  const bobot = hitungBobotKuotaSoalClient(numQuestions, includeParallel);
  const accInfo = getGeneratorAccountInfo();

  if (accInfo && accInfo.peran !== 'master') {
    const s = Number(accInfo.saldo || 0);
    if (s <= 0) {
      alert("Token Penggunaan AI Berbayar Anda habis. Hubungi U Tito untuk penambahan kuota.");
      openConnectionModal();
      return;
    }
    if (s < bobot) {
      alert(`Sisa kuota Anda (${s} kuota) tidak mencukupi untuk membuat ${numQuestions} butir soal (membutuhkan ${bobot} kuota).\n\nSilakan kurangi jumlah butir soal atau hubungi U Tito untuk penambahan kuota.`);
      return;
    }
  }

  // Populate Field Modal
  const elTopik = document.getElementById("confirmSoalTopik");
  if (elTopik) elTopik.textContent = topic;
  const elSubtopik = document.getElementById("confirmSoalSubtopik");
  if (elSubtopik) elSubtopik.textContent = subtopic;
  const elJenjang = document.getElementById("confirmSoalJenjang");
  if (elJenjang) elJenjang.textContent = grade;
  const elTipe = document.getElementById("confirmSoalTipe");
  if (elTipe) elTipe.textContent = qType;
  const elStimulus = document.getElementById("confirmSoalStimulus");
  if (elStimulus) elStimulus.textContent = stimulus;
  const elKesulitan = document.getElementById("confirmSoalKesulitan");
  if (elKesulitan) elKesulitan.textContent = difficulty;
  const elJumlah = document.getElementById("confirmSoalJumlah");
  if (elJumlah) elJumlah.textContent = `${numQuestions} Butir Soal`;
  const elModel = document.getElementById("confirmSoalModelAI");
  if (elModel) elModel.textContent = modelLabel;

  // Render Badges Fitur Tambahan
  const containerBadges = document.getElementById("confirmSoalBadges");
  if (containerBadges) {
    let badgesHtml = "";
    if (includeParallel) {
      badgesHtml += `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] border border-amber-500/30">🔀 Paket Paralel A &amp; B (+1 Kuota)</span>`;
    }
    if (includeKisiKisi) {
      badgesHtml += `<span class="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold text-[10px] border border-violet-500/30">📋 Kisi-Kisi Soal</span>`;
    }
    if (includeSolutions) {
      badgesHtml += `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">💡 Kunci &amp; Pembahasan</span>`;
    }
    if (includeVisuals) {
      badgesHtml += `<span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold text-[10px] border border-cyan-500/30">🧪 Diagram/Tabel SVG</span>`;
    }
    if (!badgesHtml) {
      badgesHtml = `<span class="text-zinc-500 italic text-[10px]">Standar Butir Soal Ujian (Tanpa Fitur Tambahan)</span>`;
    }
    containerBadges.innerHTML = badgesHtml;
  }

  // Tampilkan peringatan admin jika fitur kisi-kisi dicentang
  const warnKisiKisi = document.getElementById("confirmKisiKisiWarning");
  if (warnKisiKisi) {
    warnKisiKisi.classList.toggle("hidden", !includeKisiKisi);
  }

  // Tampilkan Total Kuota dan Saldo
  const elKuota = document.getElementById("confirmSoalKuotaDipakai");
  if (elKuota) elKuota.textContent = `${bobot} Kuota`;
  const elSaldo = document.getElementById("confirmSoalSaldoUser");
  if (elSaldo) {
    elSaldo.textContent = accInfo 
      ? (accInfo.peran === 'master' ? 'Master (Tanpa Batas)' : `${accInfo.saldo ?? 0} Kuota`) 
      : 'Belum Terhubung';
  }

  const btnEksekusiText = document.getElementById("btnExecuteGenerateSoalText");
  if (btnEksekusiText) {
    btnEksekusiText.textContent = `Lanjutkan Generate [${bobot} Kuota]`;
  }

  const modal = document.getElementById("modalConfirmGenerateSoal");
  if (modal) modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function tutupModalKonfirmasiSoal() {
  const modal = document.getElementById("modalConfirmGenerateSoal");
  if (modal) modal.classList.add("hidden");
}

// FORM LISTENERS
function initFormListeners() {
  const gradeSelect = document.getElementById("gradeSelect");
  if (gradeSelect) {
    gradeSelect.addEventListener("change", updateCurriculumFormUI);
  }

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
  if (modelSelect) {
    modelSelect.addEventListener("change", (e) => {
      const headerModelBadge = document.getElementById("headerModelBadge");
      if (headerModelBadge) {
        headerModelBadge.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>${e.target.value === "gemini-3.7-flash" ? "Gemini 3.7 Flash" : (e.target.value === "deepseek-flash" ? "DeepSeek V4.1" : "Gemini 3.6 Flash")}</span>
        `;
      }
    });
  }

  const numQuestionsSelect = document.getElementById("numQuestionsSelect");
  if (numQuestionsSelect) {
    numQuestionsSelect.addEventListener("change", updateGenerateButtonQuotaBadge);
  }

  const chkIncludeParallel = document.getElementById("chkIncludeParallel");
  if (chkIncludeParallel) {
    chkIncludeParallel.addEventListener("change", updateGenerateButtonQuotaBadge);
  }

  // Peringatan Admin saat Checkbox Kisi-Kisi dicentang
  const chkIncludeKisiKisi = document.getElementById("chkIncludeKisiKisi");
  if (chkIncludeKisiKisi) {
    chkIncludeKisiKisi.addEventListener("change", (e) => {
      if (e.target.checked) {
        const setuju = confirm(
          "⚠️ Peringatan Kualitas Kisi-Kisi:\n\n" +
          "Fitur pembuatan kisi-kisi dan kartu soal saat ini belum dikaji ulang kualitasnya secara mendalam oleh admin pengembang.\n\n" +
          "Apakah Anda yakin tetap ingin menggunakannya?"
        );
        if (!setuju) {
          e.target.checked = false;
        }
      }
    });
  }

  // Modal Konfirmasi Pra-Generate Button Listeners
  const btnCancelConfirmSoalX = document.getElementById("btnCancelConfirmSoalX");
  if (btnCancelConfirmSoalX) {
    btnCancelConfirmSoalX.addEventListener("click", tutupModalKonfirmasiSoal);
  }

  const btnDismissConfirmSoal = document.getElementById("btnDismissConfirmSoal");
  if (btnDismissConfirmSoal) {
    btnDismissConfirmSoal.addEventListener("click", tutupModalKonfirmasiSoal);
  }

  const btnExecuteGenerateSoal = document.getElementById("btnExecuteGenerateSoal");
  if (btnExecuteGenerateSoal) {
    btnExecuteGenerateSoal.addEventListener("click", async () => {
      tutupModalKonfirmasiSoal();
      await generateQuiz();
    });
  }

  updateGenerateButtonQuotaBadge();

  // Tampilkan Konfirmasi sebelum Generate
  document.getElementById("quizConfigForm").addEventListener("submit", (e) => {
    e.preventDefault();
    bukaModalKonfirmasiSoal();
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
 * KONVERTER NOTASI KIMIA & FORMULA LATEX UNTUK TAMPILAN WEB (PREVIEW)
 * Mengubah notasi kimia LaTeX menjadi HTML native (<sub>, <sup>, &rarr;, &#8652;, dll.)
 * agar font konsisten, tidak miring (italic) matematika, spasi tetap utuh, dan bebas kode LaTeX mentah.
 */
function formatChemistryForWebHtml(text) {
  if (!text) return "";
  let s = String(text);

  // 1. Bersihkan persentase LaTeX: $50{,}0%$ -> 50,0%
  s = s.replace(/\$\s*([0-9]+(?:\{,\}|,|\.)?[0-9]*)\s*(?:\\%|%)(?:\s*\$)?/g, (m, p1) => p1.replace(/\{,\}/g, ",") + "%");
  s = s.replace(/([0-9]+)\{,\}([0-9]+)/g, "$1,$2");
  s = s.replace(/\{,\}/g, ",");
  s = s.replace(/\\%/g, "%");

  // 2. Bersihkan wrapper teks LaTeX berulang
  let loop = 0;
  while (/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/.test(s) && loop++ < 10) {
    s = s.replace(/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/g, "$1");
  }
  s = s.replace(/\\(?:text|mathrm|mathbf|ce)\b/g, "");

  // 3. Pecahan \frac{num}{den} dengan dukungan kurung bersarang (nested braces)
  let fIdx;
  let fSafety = 0;
  while ((fIdx = s.indexOf('\\frac')) !== -1 && fSafety++ < 20) {
    let p = fIdx + 5;
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') {
      s = s.replace('\\frac', '');
      break;
    }
    let b1Start = p;
    let depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let num = s.slice(b1Start + 1, p - 1);
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') break;
    let b2Start = p;
    depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let den = s.slice(b2Start + 1, p - 1);
    s = s.slice(0, fIdx) + '(' + num + ' / ' + den + ')' + s.slice(p);
  }

  // 4. Subscripts: _{...} atau _angka/huruf variabel tunggal
  s = s.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");
  s = s.replace(/_([0-9]+|[a-zA-Z]|\+|\-)/g, "<sub>$1</sub>");

  // 5. Superscripts & Derajat Celsius
  s = s.replace(/\^\\circ\s*(?:C)?/g, "&deg;C");
  s = s.replace(/\\circ\s*(?:C)?/g, "&deg;C");
  s = s.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>");
  s = s.replace(/\^([0-9]+[\+\-]??|[\+\-]|[a-zA-Z])/g, "<sup>$1</sup>");

  // 6. Panah dan Kesetimbangan Kimia
  s = s.replace(/\\rightleftharpoons/g, "&#8652;");
  s = s.replace(/\\longleftrightarrow/g, "&#8652;");
  s = s.replace(/\\leftrightarrow/g, "&harr;");
  s = s.replace(/\\longrightarrow/g, "&rarr;");
  s = s.replace(/\\rightarrow/g, "&rarr;");
  s = s.replace(/\\to\b/g, "&rarr;");
  s = s.replace(/\\leftarrow/g, "&larr;");
  s = s.replace(/<=>/g, "&#8652;");
  s = s.replace(/->/g, "&rarr;");

  // 7. Simbol Matematika, Termodinamika & Yunani
  s = s.replace(/\\Delta\s*H/g, "&Delta;H");
  s = s.replace(/\\Delta/g, "&Delta;");
  s = s.replace(/\\alpha/g, "&alpha;");
  s = s.replace(/\\beta/g, "&beta;");
  s = s.replace(/\\gamma/g, "&gamma;");
  s = s.replace(/\\pm/g, "&plusmn;");
  s = s.replace(/\\times/g, "&times;");
  s = s.replace(/\\cdot/g, "&middot;");
  s = s.replace(/\\dots/g, "...");
  s = s.replace(/\\ldots/g, "...");
  s = s.replace(/\\approx/g, "&asymp;");
  s = s.replace(/\\neq/g, "&ne;");
  s = s.replace(/\\leq?/g, "&le;");
  s = s.replace(/\\geq?/g, "&ge;");
  s = s.replace(/\\infty/g, "&infin;");

  // 8. Fungsi Matematika Umum (Preservasi \log, \ln, dll.)
  s = s.replace(/\\log\b/g, "log");
  s = s.replace(/\\ln\b/g, "ln");
  s = s.replace(/\\sin\b/g, "sin");
  s = s.replace(/\\cos\b/g, "cos");
  s = s.replace(/\\tan\b/g, "tan");
  s = s.replace(/\\exp\b/g, "exp");
  s = s.replace(/\\lim\b/g, "lim");
  s = s.replace(/\\min\b/g, "min");
  s = s.replace(/\\max\b/g, "max");

  // 9. Bersihkan delimiter kurung LaTeX: \left[, \right], \left(, \right), \left., \right.
  s = s.replace(/\\left\s*([\[\(\{])/g, "$1");
  s = s.replace(/\\right\s*([\]\)\}])/g, "$1");
  s = s.replace(/\\left\./g, "");
  s = s.replace(/\\right\./g, "");

  // 10. Bersihkan spasi khusus LaTeX: \,, \;, \:, \!, \ , \quad, \qquad
  s = s.replace(/\\(?:quad|qquad)\b/g, " ");
  s = s.replace(/\\([\,\;\:\!\s])/g, " ");
  s = s.replace(/\\([\[\(\]\)])/g, "$1");
  s = s.replace(/\\\\/g, " ");

  // 11. Hapus delimiter math $ dan $
  s = s.replace(/\$\$/g, "");
  s = s.replace(/\$/g, "");

  // 12. Bersihkan sisa backslash perintah LaTeX umum
  s = s.replace(/\\[a-zA-Z]+/g, "");

  // 13. Bersihkan kurung kurawal sisa LaTeX
  s = s.replace(/[{}]/g, "");

  // 14. JAMINAN MUTLAK: Bersihkan semua sisa backslash liar tanpa merusak entitas HTML
  s = s.replace(/\\/g, "");

  return s;
}

/**
 * PARSER SUB-PERTANYAAN URAIAN TERSTRUKTUR
 * Memisahkan stem / pengantar soal dengan sub-soal bertingkat (a), (b), (c)...
 * serta membuang sisa teks titik-titik (Answer: ......) buatan model AI.
 */
function parseStructuredQuestionContent(text) {
  if (!text) return { hasSubparts: false, stem: "", subparts: [] };
  let clean = String(text)
    .replace(/(?:Answer|Jawaban)\s*:\s*[\._\s]{3,}/gi, "")
    .replace(/\[\s*(?:Answer|Jawaban)\s*:\s*[\._\s]{3,}\]/gi, "")
    .replace(/[\.]{5,}/g, "")
    .replace(/[_\s]{6,}/g, " ")
    .trim();

  // Cari apakah ada sub-pertanyaan seperti (a), (b), (c) atau a), b), c) atau a., b., c.
  const regex = /(?:^|\s+)((?:\([a-hA-H]\)|[a-hA-H][\)\.]|\([0-9]+\)|[0-9]+[\)\.]))\s+/g;
  const matches = [];
  let m;
  while ((m = regex.exec(clean)) !== null) {
    matches.push({ label: m[1], index: m.index + m[0].indexOf(m[1]), length: m[1].length });
  }

  if (!matches.length || (matches.length === 1 && matches[0].index > 80)) {
    return { hasSubparts: false, stem: clean, subparts: [] };
  }

  const stem = clean.substring(0, matches[0].index).trim();
  const subparts = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].index : clean.length;
    const content = clean.substring(cur.index + cur.length, nextStart).trim();
    subparts.push({
      label: cur.label,
      text: content
    });
  }

  return { hasSubparts: true, stem: stem, subparts: subparts };
}

function splitRomanSubparts(text) {
  if (!text) return [];
  const romanRegex = /(?:^|\s+)((?:\([ivx]+\)|[ivx]+[\)\.]))\s+/gi;
  const matches = [];
  let m;
  while ((m = romanRegex.exec(text)) !== null) {
    matches.push({ label: m[1], index: m.index + m[0].indexOf(m[1]), length: m[1].length });
  }
  if (!matches.length) return [{ label: "", text: text }];

  const parts = [];
  const intro = text.substring(0, matches[0].index).trim();
  if (intro) parts.push({ label: "", text: intro });

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    parts.push({
      label: cur.label,
      text: text.substring(cur.index + cur.length, nextStart).trim()
    });
  }
  return parts;
}

function formatAnswerKeyForWeb(keyText) {
  if (!keyText) return "-";
  const formatted = formatChemistryForWebHtml(keyText);
  const parsed = parseStructuredQuestionContent(formatted);
  if (parsed.hasSubparts) {
    return parsed.subparts.map(sub => `
      <div class="flex items-start gap-1.5 my-1">
        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[11px] shrink-0">${sub.label}</span>
        <span class="text-emerald-300 font-mono text-xs leading-relaxed">${sub.text}</span>
      </div>
    `).join("");
  }
  return `<span class="text-emerald-400 font-mono text-xs sm:text-sm">${formatted}</span>`;
}

/**
 * KONVERTER NOTASI KIMIA & FORMULA LATEX MENJADI HTML NATIVE UNTUK WORD (.DOC)
 * Word tidak menjalankan JavaScript KaTeX, sehingga formula diubah menjadi
 * tag HTML native: <sub>, <sup>, &rarr;, &#8652;, &Delta;, dll.
 */
function formatChemistryForWordHtml(text, inTable = false) {
  if (!text) return "";
  let s = String(text);

  // 1. Konversi tabel Markdown menjadi tabel native HTML Word (hanya jika di luar tabel)
  if (!inTable && s.includes("|")) {
    s = convertMarkdownTableToWordHtml(s);
  }

  // 2. Bersihkan koma dan persen LaTeX: $50{,}0%$ -> 50,0%
  s = s.replace(/\$\s*([0-9]+(?:\{,\}|,|\.)?[0-9]*)\s*(?:\\%|%)(?:\s*\$)?/g, (m, p1) => p1.replace(/\{,\}/g, ",") + "%");
  s = s.replace(/([0-9]+)\{,\}([0-9]+)/g, "$1,$2");
  s = s.replace(/\{,\}/g, ",");
  s = s.replace(/\\%/g, "%");

  // 3. Bersihkan wrapper teks LaTeX berulang
  let textLoop = 0;
  while (/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/.test(s) && textLoop++ < 10) {
    s = s.replace(/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/g, "$1");
  }
  s = s.replace(/\\(?:text|mathrm|mathbf|ce)\b/g, "");

  // 4. Pecahan \frac{num}{den} dengan dukungan kurung bersarang (nested braces)
  let fIdx;
  let fSafety = 0;
  while ((fIdx = s.indexOf('\\frac')) !== -1 && fSafety++ < 20) {
    let p = fIdx + 5;
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') {
      s = s.replace('\\frac', '');
      break;
    }
    let b1Start = p;
    let depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let num = s.slice(b1Start + 1, p - 1);
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') break;
    let b2Start = p;
    depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let den = s.slice(b2Start + 1, p - 1);
    s = s.slice(0, fIdx) + '(' + num + ' / ' + den + ')' + s.slice(p);
  }

  // 5. Subscripts: _{...} atau _angka/huruf variabel tunggal
  s = s.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");
  s = s.replace(/_([0-9]+|[a-zA-Z]|\+|\-)/g, "<sub>$1</sub>");

  // 6. Superscripts & Derajat Celsius (Literal UTF-8 aman tanpa entitas XML)
  s = s.replace(/\^\\circ\s*(?:C)?/g, "°C");
  s = s.replace(/\\circ\s*(?:C)?/g, "°C");
  s = s.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>");
  s = s.replace(/\^([0-9]+[\+\-]??|[\+\-]|[a-zA-Z])/g, "<sup>$1</sup>");

  // 7. Panah dan Kesetimbangan Kimia (Karakter UTF-8 Asli agar lolos parser Word/WPS)
  s = s.replace(/\\rightleftharpoons/g, "⇌");
  s = s.replace(/\\longleftrightarrow/g, "⇌");
  s = s.replace(/\\leftrightarrow/g, "↔");
  s = s.replace(/\\longrightarrow/g, "→");
  s = s.replace(/\\rightarrow/g, "→");
  s = s.replace(/\\to\b/g, "→");
  s = s.replace(/\\leftarrow/g, "←");
  s = s.replace(/<=>/g, "⇌");
  s = s.replace(/->/g, "→");

  // 8. Simbol Termodinamika & Yunani (Karakter UTF-8 Asli)
  s = s.replace(/\\Delta\s*H/g, "ΔH");
  s = s.replace(/\\Delta/g, "Δ");
  s = s.replace(/\\alpha/g, "α");
  s = s.replace(/\\beta/g, "β");
  s = s.replace(/\\gamma/g, "γ");
  s = s.replace(/\\pm/g, "±");
  s = s.replace(/\\times/g, "×");
  s = s.replace(/\\cdot/g, "·");
  s = s.replace(/\\dots/g, "...");
  s = s.replace(/\\ldots/g, "...");
  s = s.replace(/\\approx/g, "≈");
  s = s.replace(/\\neq/g, "≠");
  s = s.replace(/\\leq?/g, "≤");
  s = s.replace(/\\geq?/g, "≥");
  s = s.replace(/\\infty/g, "∞");

  // 9. Fungsi Matematika Umum (Preservasi \log, \ln, dll.)
  s = s.replace(/\\log\b/g, "log");
  s = s.replace(/\\ln\b/g, "ln");
  s = s.replace(/\\sin\b/g, "sin");
  s = s.replace(/\\cos\b/g, "cos");
  s = s.replace(/\\tan\b/g, "tan");
  s = s.replace(/\\exp\b/g, "exp");
  s = s.replace(/\\lim\b/g, "lim");
  s = s.replace(/\\min\b/g, "min");
  s = s.replace(/\\max\b/g, "max");

  // 10. Bersihkan delimiter kurung LaTeX: \left[, \right], \left(, \right), \left., \right.
  s = s.replace(/\\left\s*([\[\(\{])/g, "$1");
  s = s.replace(/\\right\s*([\]\)\}])/g, "$1");
  s = s.replace(/\\left\./g, "");
  s = s.replace(/\\right\./g, "");

  // 11. Bersihkan spasi khusus LaTeX: \,, \;, \:, \!, \ , \quad, \qquad
  s = s.replace(/\\(?:quad|qquad)\b/g, " ");
  s = s.replace(/\\([\,\;\:\!\s])/g, " ");
  s = s.replace(/\\([\[\(\]\)])/g, "$1");
  s = s.replace(/\\\\/g, " ");

  // 12. Hapus delimiter math $ dan $
  s = s.replace(/\$\$/g, "");
  s = s.replace(/\$/g, "");

  // 13. Bersihkan sisa backslash perintah LaTeX umum
  s = s.replace(/\\[a-zA-Z]+/g, "");

  // 14. Bersihkan kurung kurawal sisa LaTeX
  s = s.replace(/[{}]/g, "");

  // 15. JAMINAN MUTLAK: Bersihkan semua sisa backslash liar
  s = s.replace(/\\/g, "");

  return s;
}

function formatAnswerKeyForWordHtml(keyText) {
  if (!keyText) return "-";
  const parsed = parseStructuredQuestionContent(keyText);
  if (parsed.hasSubparts && parsed.subparts.length > 0) {
    let out = [];
    if (parsed.stem) {
      out.push(`<div style="margin-bottom: 2pt; font-size: 10.5pt; color: #0f172a; text-align: justify; text-justify: inter-ideograph;">${formatChemistryForWordHtml(parsed.stem)}</div>`);
    }
    parsed.subparts.forEach(sub => {
      out.push(`<div style="margin-left: 12pt; margin-top: 2pt; margin-bottom: 2pt; font-size: 10.5pt; line-height: 1.45; text-align: justify; text-justify: inter-ideograph;"><b style="color: #15803d;">${sub.label}</b> <span style="color: #0f172a;">${formatChemistryForWordHtml(sub.text)}</span></div>`);
    });
    return out.join("");
  }
  return `<span style="color: #15803d; font-weight: bold;">${formatChemistryForWordHtml(keyText)}</span>`;
}

function convertMarkdownTableToWordHtml(text) {
  if (!text || !text.includes("|")) return text;

  const lines = text.split(/\r?\n/);
  let inTable = false;
  let tableLines = [];
  let resultLines = [];

  const renderTable = (tbl) => {
    if (tbl.length < 2) return tbl.join("<br>");
    const headerRow = tbl[0];
    const startBody = (tbl.length > 1 && /^[|:\-\s]+$/.test(tbl[1])) ? 2 : 1;
    const bodyRows = tbl.slice(startBody);

    const splitCells = (row) => {
      let parts = row.split("|").map(c => c.trim());
      if (parts.length > 0 && parts[0] === "") parts.shift();
      if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
      return parts;
    };

    let headers = splitCells(headerRow);
    let html = `<table border="1" cellpadding="0" cellspacing="0" class="chem-word-table" style="width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 11pt; font-family: 'Times New Roman', Times, serif; border: 1px solid #000000;"><thead><tr style="background-color: #f1f5f9;">`;
    headers.forEach(h => html += `<th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-weight: bold; background-color: #f1f5f9; color: #000000; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(h, true)}</th>`);
    html += `</tr></thead><tbody>`;

    bodyRows.forEach(r => {
      let cells = splitCells(r);
      if (cells.length > 0) {
        html += `<tr>`;
        cells.forEach(c => {
          const isShort = c.length <= 15 || /^[0-9\s°C,.\-+±%]+$/.test(c);
          html += `<td style="border: 1px solid #000000; padding: 4pt 6pt; text-align: ${isShort ? 'center' : 'left'}; vertical-align: middle; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(c, true)}</td>`;
        });
        html += `</tr>`;
      }
    });

    html += `</tbody></table>`;
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("|") && (line.split("|").length >= 3)) {
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

  // 3. Formula dalam kurung tanpa tanda dollar (hanya jika murni formula kimia, bukan teks bahasa Inggris berkurung): (\text{C}_x\text{H}_{2x+2}) -> ($\text{C}_x\text{H}_{2x+2}$)
  s = s.replace(/\((\s*\\text\{[^{}]+\}(?:_[0-9a-zA-Z\{\}\+\-]+|\^[0-9a-zA-Z\{\}\+\-]+)*\s*)\)/g, (m, p1) => `($${p1}$)`);

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
function isQuestionLike(item) {
  if (!item || typeof item !== "object") return false;
  if (item.pertanyaan || item.soal || item.question || item.question_text || item.stem || item.prompt || item.context || item.problem || item.teks) return true;
  if (Array.isArray(item.subparts) || Array.isArray(item.sub_questions) || Array.isArray(item.parts) || Array.isArray(item.sub_soal) || Array.isArray(item.subSoal)) return true;
  if (Array.isArray(item.pilihan_jawaban) || Array.isArray(item.options) || Array.isArray(item.choices) || Array.isArray(item.pilihan) || Array.isArray(item.opsi)) return true;
  if ((item.nomor != null || item.number != null || item.question_number != null || item.no != null) && 
      (item.kunci_jawaban || item.answer || item.mark_scheme || item.pembahasan || item.marks || item.total_marks || item.tipe_soal || item.type)) return true;
  return false;
}

function normalizeAndValidateQuizPackage(rawInput, defaults = {}) {
  let pkg = rawInput;

  // 1. Ekstraksi dan parsing jika input masih berupa string mentah
  if (typeof pkg === "string") {
    let clean = pkg.trim();
    clean = clean.replace(/<think(?:s[^>]*)?>[\s\S]*?<\/think>/gi, "").trim();
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

  // 2. Buka pembungkus bersarang (multi-level unwrapping)
  const wrapperKeys = [
    "data", "raw", "quiz", "paket", "paper", "exam_paper", "examination_paper", 
    "exam", "examination", "assessment", "test", "quiz_package", "package", 
    "result", "response", "content", "output", "payload"
  ];
  for (let depth = 0; depth < 8; depth++) {
    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) break;
    if ((Array.isArray(pkg.daftar_soal) && pkg.daftar_soal.length > 0) ||
        (Array.isArray(pkg.questions) && pkg.questions.length > 0) ||
        (Array.isArray(pkg.soal) && pkg.soal.length > 0)) {
      break;
    }

    const keys = Object.keys(pkg);
    if (keys.length === 1 && pkg[keys[0]] && typeof pkg[keys[0]] === "object" && !Array.isArray(pkg[keys[0]])) {
      pkg = pkg[keys[0]];
      continue;
    }

    let unwrapped = false;
    for (const k of wrapperKeys) {
      if (pkg[k] && typeof pkg[k] === "object" && !Array.isArray(pkg[k])) {
        pkg = pkg[k];
        unwrapped = true;
        break;
      }
    }
    if (!unwrapped) break;
  }

  // 3. Jika respon AI berupa Array langsung
  if (Array.isArray(pkg)) {
    pkg = {
      judul: defaults.topic ? `Asesmen Kimia - ${defaults.topic}` : "Naskah Soal Asesmen Kimia",
      jenjang: defaults.grade || "SMA Kelas 11 (Fase F)",
      topik_utama: defaults.topic || "Kimia Umum",
      stimulus_model: defaults.stimulus || "Kontekstual",
      daftar_soal: pkg
    };
  }

  // 4. Deteksi dan gabungkan struktur sections jika ada (misal Section A + Section B Pearson)
  if (!Array.isArray(pkg.daftar_soal) || pkg.daftar_soal.length === 0) {
    const sectionCandidateKeys = ["sections", "parts", "bagian", "paper_sections", "examination_sections"];
    for (const sKey of sectionCandidateKeys) {
      if (Array.isArray(pkg[sKey]) && pkg[sKey].length > 0) {
        const flattened = [];
        pkg[sKey].forEach(sec => {
          if (sec && typeof sec === "object") {
            const secQuestions = sec.questions || sec.soal || sec.daftar_soal || sec.items || sec.problems;
            if (Array.isArray(secQuestions)) {
              secQuestions.forEach(q => {
                if (q && typeof q === "object") {
                  if (sec.section_name || sec.title || sec.name) {
                    q._section_origin = sec.section_name || sec.title || sec.name;
                  }
                  flattened.push(q);
                }
              });
            }
          }
        });
        if (flattened.length > 0) {
          pkg.daftar_soal = flattened;
          break;
        }
      }
    }
  }

  // Deteksi kunci section terpisah (section_a, section_b, dll.)
  if (!Array.isArray(pkg.daftar_soal) || pkg.daftar_soal.length === 0) {
    const secSplitKeys = [
      'section_a', 'section_b', 'section_c', 
      'sectionA', 'sectionB', 'sectionC', 
      'bagian_a', 'bagian_b', 'bagian_c',
      'multiple_choice_section', 'structured_section'
    ];
    let collectedSec = [];
    secSplitKeys.forEach(k => {
      if (Array.isArray(pkg[k])) {
        collectedSec.push(...pkg[k]);
      } else if (pkg[k] && typeof pkg[k] === "object") {
        const qList = pkg[k].questions || pkg[k].soal || pkg[k].daftar_soal || pkg[k].items;
        if (Array.isArray(qList)) collectedSec.push(...qList);
      }
    });
    if (collectedSec.length > 0) {
      pkg.daftar_soal = collectedSec;
    }
  }

  // 5. Deteksi array daftar_soal dari berbagai variasi penamaan AI
  if (!Array.isArray(pkg.daftar_soal)) {
    const candidateArrayKeys = [
      "soal", "daftarSoal", "questions", "items", "paket_soal", 
      "soal_list", "daftar_pertanyaan", "structured_questions", 
      "mcq_questions", "exam_questions", "problems", "question_list", "questionList"
    ];
    for (const key of candidateArrayKeys) {
      if (Array.isArray(pkg[key]) && pkg[key].length > 0) {
        pkg.daftar_soal = pkg[key];
        break;
      }
    }

    if (!Array.isArray(pkg.daftar_soal)) {
      const candidateKey = Object.keys(pkg).find(k => 
        Array.isArray(pkg[k]) && 
        pkg[k].length > 0 && 
        pkg[k].some(isQuestionLike)
      );
      if (candidateKey) {
        pkg.daftar_soal = pkg[candidateKey];
      } else if (isQuestionLike(pkg)) {
        pkg.daftar_soal = [ pkg ];
      } else {
        pkg.daftar_soal = [];
      }
    }
  }

  // 6. Pastikan Paket B jika ada
  if (!Array.isArray(pkg.daftar_soal_paket_b)) {
    if (Array.isArray(pkg.paket_b)) {
      pkg.daftar_soal_paket_b = pkg.paket_b;
    } else if (Array.isArray(pkg.soal_paket_b)) {
      pkg.daftar_soal_paket_b = pkg.soal_paket_b;
    } else if (Array.isArray(pkg.questions_set_b)) {
      pkg.daftar_soal_paket_b = pkg.questions_set_b;
    } else {
      delete pkg.daftar_soal_paket_b;
    }
  }

  // 7. Normalisasi setiap butir soal di daftar_soal
  const normalizeList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((soal, idx) => {
      if (!soal || typeof soal !== "object") {
        soal = { pertanyaan: String(soal) };
      }

      soal.nomor = parseInt(soal.nomor || soal.number || soal.question_number || soal.no, 10) || (idx + 1);
      soal.tipe_soal = soal.tipe_soal || soal.type || soal.question_type || defaults.qType || "Pilihan Ganda";
      soal.topik = soal.topik || soal.topic || defaults.topic || "Kimia";
      soal.subtopik = soal.subtopik || soal.subtopic || defaults.subtopic || "Materi Esensial";
      soal.tingkat_kesulitan = soal.tingkat_kesulitan || soal.difficulty || soal.demand || soal.level || defaults.difficulty || "Sedang";

      // 7a. Bangun teks pertanyaan lengkap (gabungkan context, stem, dan subparts jika terpisah)
      let mainPrompt = "";
      if (soal.context && soal.stem && soal.context !== soal.stem) {
        mainPrompt = `${soal.context}\n\n${soal.stem}`;
      } else {
        mainPrompt = soal.pertanyaan || soal.question || soal.question_text || soal.stem || soal.prompt || soal.context || soal.soal || soal.teks || soal.problem || "";
      }

      // Deteksi jika ada array subparts / sub-pertanyaan terpisah
      const rawSubparts = soal.subparts || soal.sub_questions || soal.parts || soal.sub_soal || soal.subSoal;
      if (Array.isArray(rawSubparts) && rawSubparts.length > 0) {
        const formattedSubs = rawSubparts.map((sub, sIdx) => {
          if (typeof sub === "string") return sub.trim();
          if (!sub || typeof sub !== "object") return "";
          const label = sub.label || sub.sub_number || sub.part || sub.no || `(${String.fromCharCode(97 + sIdx)})`;
          const qText = sub.question || sub.text || sub.teks || sub.pertanyaan || sub.prompt || "";
          const marks = sub.marks || sub.mark || sub.skor || sub.points;
          const marksStr = marks ? ` [${marks} ${Number(marks) === 1 ? 'mark' : 'marks'}]` : "";
          return `${label} ${qText}${marksStr}`.trim();
        }).filter(Boolean);

        const subsCombined = formattedSubs.join("\n\n");
        if (subsCombined && !mainPrompt.includes(formattedSubs[0])) {
          mainPrompt = mainPrompt ? `${mainPrompt}\n\n${subsCombined}` : subsCombined;
        }
      }

      // Tambahkan Total Marks jika ada
      if (soal.total_marks || soal.total_mark) {
        const tot = soal.total_marks || soal.total_mark;
        const totTag = `[Total for Question ${soal.nomor} = ${tot} marks]`;
        if (!mainPrompt.includes("Total for Question") && !mainPrompt.includes("Total:")) {
          mainPrompt = `${mainPrompt}\n\n${totTag}`;
        }
      }

      let rawPertanyaan = String(mainPrompt || "Pertanyaan belum ditentukan.").trim();
      rawPertanyaan = rawPertanyaan
        .replace(/(?:Answer|Jawaban)\s*:\s*[\._\s]{3,}/gi, "")
        .replace(/\[\s*(?:Answer|Jawaban)\s*:\s*[\._\s]{3,}\]/gi, "")
        .replace(/[\.]{5,}/g, "")
        .replace(/[\_\s]{6,}/g, " ")
        .trim();
      soal.pertanyaan = rawPertanyaan;

      // 7b. Pilihan Jawaban (Menangani format Array maupun format Object)
      const rawOptions = soal.pilihan_jawaban || soal.options || soal.choices || soal.pilihan || soal.opsi || soal.answers;
      if (rawOptions) {
        if (Array.isArray(rawOptions)) {
          soal.pilihan_jawaban = rawOptions.map((opt, i) => {
            if (typeof opt === "string") {
              const matchLetter = opt.match(/^([A-E])[.:\)]\s*(.*)$/i);
              const lbl = matchLetter ? matchLetter[1].toUpperCase() : String.fromCharCode(65 + i);
              const txt = matchLetter ? matchLetter[2] : opt;
              return { label: lbl, teks: txt.trim() };
            }
            return {
              label: String(opt.label || opt.letter || opt.key || String.fromCharCode(65 + i)).trim().toUpperCase(),
              teks: String(opt.teks || opt.text || opt.jawaban || opt.option || opt.value || "").trim()
            };
          });
        } else if (typeof rawOptions === "object") {
          soal.pilihan_jawaban = Object.keys(rawOptions).map(k => ({
            label: k.trim().toUpperCase(),
            teks: String(rawOptions[k]).trim()
          }));
        } else {
          soal.pilihan_jawaban = [];
        }
      } else {
        soal.pilihan_jawaban = [];
      }

      // 7c. Kunci Jawaban
      soal.kunci_jawaban = String(
        soal.kunci_jawaban || soal.kunci || soal.answer || soal.correct_answer || 
        soal.key || soal.correctAnswer || (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0 ? "A" : "Terlampir")
      ).trim();

      // 7d. Pembahasan Langkah / Mark Scheme
      const rawSolutions = soal.pembahasan_langkah || soal.pembahasan || soal.explanation || 
                           soal.mark_scheme || soal.marking_scheme || soal.worked_solution || 
                           soal.solution || soal.solutions || soal.rubric;
      if (rawSolutions) {
        if (Array.isArray(rawSolutions)) {
          soal.pembahasan_langkah = rawSolutions.map(s => {
            if (typeof s === "object" && s !== null) {
              return Object.entries(s).map(([k, v]) => `${k}: ${v}`).join(" | ");
            }
            return String(s).trim();
          }).filter(Boolean);
        } else if (typeof rawSolutions === "string") {
          soal.pembahasan_langkah = rawSolutions.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        } else if (typeof rawSolutions === "object") {
          soal.pembahasan_langkah = Object.entries(rawSolutions).map(([k, v]) => `${k}: ${v}`);
        } else {
          soal.pembahasan_langkah = [String(rawSolutions)];
        }
      } else {
        soal.pembahasan_langkah = defaults.includeSolutions === false
          ? []
          : ["Pembahasan dapat diselesaikan berdasarkan konsep stoikiometri dan hukum dasar kimia terkait."];
      }

      // 7e. Tips atau Jebakan
      soal.tips_atau_jebakan = String(soal.tips_atau_jebakan || soal.tips || soal.miskonsepsi || soal.common_mistakes || soal.guidance || "").trim();

      return soal;
    });
  };

  pkg.daftar_soal = normalizeList(pkg.daftar_soal);
  if (pkg.daftar_soal_paket_b) {
    pkg.daftar_soal_paket_b = normalizeList(pkg.daftar_soal_paket_b);
  }

  // 8. Metadata Paket (Dukung kunci bahasa Inggris: title, grade, topic, stimulus)
  pkg.judul = String(pkg.judul || pkg.title || (defaults.topic ? `Asesmen Kimia - ${defaults.topic}` : "Naskah Soal Asesmen Kimia")).trim();
  pkg.jenjang = String(pkg.jenjang || pkg.grade || defaults.grade || "SMA Kelas 11 (Fase F)").trim();
  pkg.topik_utama = String(pkg.topik_utama || pkg.topic || defaults.topic || "Kimia Umum").trim();
  pkg.stimulus_model = String(pkg.stimulus_model || pkg.stimulus || defaults.stimulus || "Kontekstual").trim();

  // 9. Kisi-Kisi
  const rawKisi = pkg.kisi_kisi_asesmen || pkg.kisi_kisi || pkg.assessment_grid || pkg.specification_grid;
  if (Array.isArray(rawKisi)) {
    pkg.kisi_kisi_asesmen = rawKisi;
  } else {
    delete pkg.kisi_kisi_asesmen;
  }

  return pkg;
}

// SANITASI SELURUH DATA PAKET SOAL
function sanitizeQuizPackage(pkg) {
  if (!pkg) return pkg;

  // Invalidate any previously cached crossword layout to force re-render with clean clues
  delete pkg._crosswordLayoutA;
  delete pkg._crosswordLayoutB;

  const sanitizeQuestionList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach(soal => {
      const tSoal = (soal.tipe_soal || "").toLowerCase();
      const isTts = tSoal.includes("tts") || tSoal.includes("silang") || tSoal.includes("crossword");
      if (isTts) {
        soal.pertanyaan = formatChemistryForWebHtml(cleanTtsClue(soal.pertanyaan));
      } else {
        soal.pertanyaan = formatChemistryText(soal.pertanyaan);
      }
      if (soal.pilihan_jawaban) {
        soal.pilihan_jawaban.forEach(opt => {
          opt.teks = formatChemistryText(opt.teks);
        });
      }
      soal.kunci_jawaban = isTts
        ? (soal.kunci_jawaban || "").toUpperCase().replace(/[^A-Z]/g, "")
        : formatChemistryText(soal.kunci_jawaban);
      if (soal.pembahasan_langkah) {
        soal.pembahasan_langkah = soal.pembahasan_langkah.map(st => isTts ? formatChemistryForWebHtml(st) : formatChemistryText(st));
      }
      if (soal.tips_atau_jebakan) {
        soal.tips_atau_jebakan = isTts ? formatChemistryForWebHtml(soal.tips_atau_jebakan) : formatChemistryText(soal.tips_atau_jebakan);
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


// -------------------------------------------------------------
// TAB SAFETY GUARD & ANTI-HANGUS KUOTA
// -------------------------------------------------------------
window.isAIGeneratingActive = false;

window.addEventListener("beforeunload", function (e) {
  if (window.isAIGeneratingActive) {
    e.preventDefault();
    e.returnValue = "Proses generate AI sedang berjalan di server! Meninggalkan atau me-refresh halaman sekarang dapat menyebabkan kuota Anda terpotong namun naskah gagal diterima.";
    return e.returnValue;
  }
});

document.addEventListener("visibilitychange", function () {
  if (window.isAIGeneratingActive && !document.hidden) {
    if (typeof showVersionToast === "function") {
      showVersionToast("⚠️ Perhatian: Anda sempat berpindah tab saat generate. Harap tetap di halaman ini agar hasil naskah soal tidak gagal mendarat!");
    }
  }
});

// GENERATE QUIZ DENGAN FITUR DINAMIS
async function generateQuiz() {
  window.isAIGeneratingActive = true;
  const gasUrl = getGasUrl();
  const apiKey = localStorage.getItem("portal_gemini_api_key");
  if (!gasUrl && !apiKey) {
    alert("⚠️ Backend Google Apps Script belum terhubung di config.js!");
    return;
  }

  const model = document.getElementById("modelSelect").value;
  const useDirectGemini = Boolean(apiKey) && model.indexOf("gemini-") === 0;
  const grade = document.getElementById("gradeSelect").value;
  const qType = document.getElementById("questionTypeSelect").value;
  const stimulus = document.getElementById("stimulusSelect").value;
  const isPearson = grade.toLowerCase().includes("pearson") || grade.toLowerCase().includes("edexcel");
  const isNoStimulus = stimulus.toLowerCase().includes("tanpa stimulus");
  const isStructured = qType.toLowerCase().includes("terstruktur") || qType.toLowerCase().includes("esai") || qType.toLowerCase().includes("uraian");
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
  const includeSolutions = document.getElementById("chkIncludeSolutions") ? document.getElementById("chkIncludeSolutions").checked : false;
  // DeepSeek V4.1 Flash accepts up to 393,216 output tokens; Gemini stays at its existing cap.
  // This is a ceiling only: the API bills generated tokens, not the unused allowance.
  const deepSeekOutputTokenBudget = 393216;
  let usageRecorded = false;
  let actualModel = model;
  let aiPromptForUsage = "";
  const aiStartedAt = Date.now();

  // UI State Loading
  const loadingState = document.getElementById("loadingState");
  const resultsSection = document.getElementById("resultsSection");
  const btnGenerate = document.getElementById("btnGenerate");

  loadingState.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  btnGenerate.disabled = true;

  // Bangun Skema JSON Respons Secara Dinamis
  const itemRequired = ["nomor", "tipe_soal", "topik", "subtopik", "tingkat_kesulitan", "pertanyaan", "pilihan_jawaban"];
  if (includeSolutions) {
    itemRequired.push("kunci_jawaban", "pembahasan_langkah");
  }

  const questionItemSchema = {
    type: "OBJECT",
    required: itemRequired,
    properties: {
      nomor: { type: "INTEGER" },
      tipe_soal: { type: "STRING" },
      topik: { type: "STRING" },
      subtopik: { type: "STRING" },
      tingkat_kesulitan: { type: "STRING" },
      pertanyaan: { type: "STRING", description: "Teks butir soal lengkap berkualitas tinggi. Jika memuat data eksperimen, sajikan dalam Markdown table rapi. Rumus kimia wajib dalam LaTeX inline ($...$)." },
      ilustrasi_svg: { type: "STRING", description: "Opsional. Kode SVG vektor murni jika soal memerlukan diagram ilmiah (misal: Sel Volta, Profil Hess, Tabung Uji, Titrasi)." },
      caption_ilustrasi: { type: "STRING", description: "Keterangan gambar diagram" },
      pilihan_jawaban: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["label", "teks"],
          properties: {
            label: { type: "STRING", description: "A, B, C, D, atau E" },
            teks: { type: "STRING", description: "Teks pilihan jawaban dengan opsi pengecoh (distraktor) bermutu tinggi" }
          }
        }
      },
      kunci_jawaban: { type: "STRING", description: "Huruf kunci jawaban singkat (A, B, C, D, atau E)" },
      pembahasan_langkah: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: includeSolutions 
          ? "Langkah penyelesaian terperinci tahap demi tahap" 
          : "Kosongkan atau berikan catatan 1 kalimat ringkas agar kuota token fokus 100% pada penyusunan butir soal"
      },
      tips_atau_jebakan: { type: "STRING", description: "Tips cepat atau miskonsepsi umum siswa (opsional)" }
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

  // Distribusi Level Kognitif
  let difficultyInstruction = `Tingkat Kesulitan: ${difficulty}`;
  if (difficulty.includes("Campuran")) {
    let l1Count, l3Count, l2Count;
    if (difficulty.includes("HOTS")) {
      l1Count = Math.max(0, Math.round(numQuestions * 0.10));
      l3Count = Math.max(1, Math.round(numQuestions * 0.50));
      l2Count = Math.max(1, numQuestions - l1Count - l3Count);
    } else {
      l1Count = Math.max(1, Math.round(numQuestions * 0.20));
      l3Count = Math.max(1, Math.round(numQuestions * 0.30));
      l2Count = Math.max(1, numQuestions - l1Count - l3Count);
    }
    const diffSum = l1Count + l2Count + l3Count;
    if (diffSum !== numQuestions) {
      l2Count += (numQuestions - diffSum);
    }

    if (isPearson) {
      difficultyInstruction = `DEMAND & ASSESSMENT OBJECTIVES (AO) DISTRIBUTION (PEARSON EDEXCEL SPECIFICATION):
Dalam paket ${numQuestions} butir soal ini, distribusikan tingkat tuntutan kognitif sesuai standar baku Pearson Edexcel Chemistry:
- Low Demand / AO1 (Knowledge & Understanding): Tepat ${l1Count} butir soal (menguji definisi presisi, penamaan IUPAC, recall tren periodik, identifikasi rumus kimia).
- Standard Demand / AO2 (Application of Knowledge & Calculation): Tepat ${l2Count} butir soal (menguji stoikiometri bertingkat, hukum Hess, perhitungan pH/Ka, mekanisme reaksi standar).
- High Demand / AO3 (Analysis, Evaluation & Unfamiliar Contexts): Tepat ${l3Count} butir soal (menguji evaluasi ketidakpastian eksperimen, analisis data spektroskopi IR/MS/NMR, kurva titrasi kompleks).
Pada properti 'tingkat_kesulitan' di SETIAP butir soal, tuliskan: 'AO1 (Low Demand)', 'AO2 (Standard Demand)', atau 'AO3 (High Demand)'.`;
    } else {
      difficultyInstruction = `DISTRIBUSI LEVEL KOGNITIF CAMPURAN (TOTAL ${numQuestions} BUTIR SOAL):
- Level 1 (Pengetahuan & Pemahaman - C1/C2): Tepat ${l1Count} butir soal (menguji konsep dasar, rumus, tata nama, struktur).
- Level 2 (Aplikasi & Perhitungan - C3): Tepat ${l2Count} butir soal (menguji stoikiometri, reaksi kimia, substitusi rumus kuantitatif, pH, elektrokimia).
- Level 3 (Penalaran & Logika Tinggi HOTS - C4/C5/C6): Tepat ${l3Count} butir soal (menguji analisis grafik/kurva, data eksperimen anomali, evaluasi kesetimbangan/mekanisme, kimia hijau).
ATURAN WAJIB:
1. Susunlah urutan butir soal secara berjenjang dari mudah (soal L1 di awal), kemudian terapan sedang (soal L2 di tengah), lalu penalaran analitis mendalam (soal L3 di nomor-nomor akhir).
2. Pada properti 'tingkat_kesulitan' di SETIAP butir soal, WAJIB dituliskan level aslinya secara spesifik: 'L1 (C2 - Pemahaman)', 'L2 (C3 - Aplikasi)', atau 'L3 (C4/C5 - Penalaran HOTS)'.`;
    }
  } else {
    difficultyInstruction = `Tingkat Kesulitan: ${difficulty}. Semua butir soal berbobot ${difficulty}. Pada properti 'tingkat_kesulitan' di setiap butir soal tuliskan '${difficulty}'.`;
  }

  // Distribusi Format Tipe Soal
  let typeInstruction = "";
  if (isPearson) {
    const isMcqOnly = qType.toLowerCase().includes("multiple choice") || qType.toLowerCase().includes("section a");
    const isCompletePaper = qType.toLowerCase().includes("complete exam");
    const isPractical = qType.toLowerCase().includes("practical") || qType.toLowerCase().includes("experimental");

    if (isMcqOnly) {
      typeInstruction = `AUTHENTIC PEARSON EDEXCEL SECTION A (MULTIPLE CHOICE QUESTIONS):
- All questions MUST be 100% in British English.
- EVERY question MUST have EXACTLY 4 OPTIONS: A, B, C, D (FORBIDDEN to generate 5 options!).
- Each question is worth exactly 1 mark.
- Rigorous question styles: stoichiometry with molar gas volume (24.0 dm³ mol⁻¹ at r.t.p.), skeletal isomers, electron configurations, ionisation energy successive jumps, atom economy & percentage yield, mass spectrometry fragment ions, reaction condition deductions.
- Set property 'tipe_soal' to 'Multiple Choice (Section A)'.
- Set property 'pilihan_jawaban' to an array of 4 items with 'label' ('A', 'B', 'C', 'D') and 'teks'.
- In 'pembahasan_langkah', provide clear reasoning justifying why the key option is correct and explaining why key distractors are incorrect.`;
    } else if (isCompletePaper) {
      const mcqCount = Math.max(1, Math.floor(numQuestions * 0.4));
      typeInstruction = `AUTHENTIC PEARSON EDEXCEL COMPLETE EXAMINATION PAPER:
This paper consists of TWO sections:
1. SECTION A (Questions 1 to ${mcqCount}): Multiple Choice Questions.
   - EXACTLY 4 OPTIONS (A, B, C, D) per question. Worth 1 mark each.
   - Set 'tipe_soal' to 'Multiple Choice (Section A)'.
2. SECTION B (Questions ${mcqCount + 1} to ${numQuestions}): Structured Questions.
   - Each question begins with a context ("This question is about...").
   - Subparts: (a)(i), (a)(ii), (b)... with explicit mark allocations [1 mark], [2 marks], etc.
   - At the end of each question: [Total for Question X = Y marks].
   - Set 'tipe_soal' to 'Structured Question (Section B)'.
   - Leave 'pilihan_jawaban' as empty array [].
   - In 'pembahasan_langkah', use official Pearson Mark Scheme: M1, M2, A1, Additional Guidance: ALLOW..., IGNORE..., DO NOT ALLOW...`;
    } else if (isPractical) {
      typeInstruction = `AUTHENTIC PEARSON EDEXCEL CORE PRACTICAL & EXPERIMENTAL SKILLS (UNIT 3/6 STYLE):
- All questions MUST be in British English, focusing on laboratory techniques and practical competencies:
  * Volumetric titrations (burette readings, concordant titres within 0.20 cm³, indicator choices: phenolphthalein, methyl orange).
  * Enthalpy changes in a coffee-cup calorimeter (temperature readings, cooling curve extrapolation, Q = mcΔT, percentage uncertainty = (uncertainty / reading) * 100).
  * Rate of reaction experiments (gas collection with gas syringe, clock reactions, initial rates from tangents).
  * Organic preparation & purification (reflux, distillation, drying with anhydrous MgSO4, boiling temperature determination).
  * Qualitative inorganic tests (flame tests, precipitations with aqueous NaOH and NH3, halide tests with acidified AgNO3 and dilute/conc NH3).
- Format: Multi-part structured questions with subparts (a), (b), (c) and allocated marks [1 mark], [2 marks].
- At the end: [Total for Question X = Y marks].
- Set 'tipe_soal' to 'Practical Skills & Data Analysis'.
- In 'pembahasan_langkah', use official Pearson Mark Scheme with M1, M2, A1, and Additional Guidance.`;
    } else {
      // Default: Section B Structured Questions Paper
      typeInstruction = `AUTHENTIC PEARSON EDEXCEL SECTION B (STRUCTURED QUESTIONS EXAM PAPER):
- All questions MUST be 100% British English following official Pearson Edexcel IGCSE / International A-Level specifications.
- Every question MUST begin with an authentic chemical or experimental context:
  "This question is about..." or "A student investigated the reaction between..."
- Break each question into structured subparts labeled (a)(i), (a)(ii), (b), (c)...
- EVERY subpart MUST have an explicit mark allocation in square brackets at the end: [1 mark], [2 marks], [3 marks].
- Strictly use official Pearson Command Words:
  * 'State' / 'Name' / 'Give' [1 mark]
  * 'Define' [1 or 2 marks]
  * 'Calculate' [2 or 3 marks] - show formula, working, correct units and 2-3 significant figures.
  * 'Describe' [1 or 2 marks] - observations, color changes, effervescence.
  * 'Explain' [2 marks] - reason using chemical principles, bonding, or electron configurations.
  * 'Write an ionic equation, including state symbols' [1 or 2 marks]
  * 'Deduce' / 'Suggest' [1 or 2 marks]
- At the end of each question, include the total mark: [Total for Question X = Y marks].
- Set 'pilihan_jawaban' to empty array [].
- Set 'tipe_soal' to 'Structured Question (Section B)'.
- In 'pembahasan_langkah', structure solutions strictly as an Official Pearson Edexcel Mark Scheme:
  M1: (Method mark 1, e.g. calculation of moles or first scientific point)
  M2: (Method mark 2 / intermediate deduction)
  A1: (Accuracy mark - final numerical answer with units or precise formula)
  Additional Guidance: ALLOW..., IGNORE..., DO NOT ALLOW..., TE (Error Carried Forward).`;
    }
  } else if (qType.includes("Terstruktur")) {
    typeInstruction = `FORMAT KHUSUS ESAI / URAIAN TERSTRUKTUR:
- Setiap butir soal diawali pengantar reaksi/data kasus, lalu dipecah menjadi sub-pertanyaan bertingkat terstruktur:
  a) ... [Skor: 1]
  b) ... [Skor: 2]
  c) ... [Skor: 3]
- WAJIB KOSONGKAN properti 'pilihan_jawaban' (berikan array kosong []).
- Pada properti 'tipe_soal', tuliskan 'Uraian Terstruktur'.
- Pada properti 'kunci_jawaban', tuliskan ringkasan jawaban per sub-pertanyaan.
- Pada properti 'pembahasan_langkah', sajikan rubrik penskoran dan tahapan pengerjaan per sub-soal.`;
  } else if (qType.includes("TKA") || qType.includes("Campuran")) {
    typeInstruction = `DISTRIBUSI FORMAT TIPE SOAL (STANDAR TKA & CAMPURAN MULTI-BENTUK):
Dalam paket ${numQuestions} butir soal ini, variasikan bentuk soal mengikuti standar baku Tes Kemampuan Akademik (TKA) Saintek Kimia:
1. TIPE 1 - PILIHAN GANDA BIASA (5 Opsi: A, B, C, D, E):
   - Satu kunci jawaban benar dan 4 opsi distraktor bermutu tinggi.
2. TIPE 2 - PILIHAN GANDA ASOSIASI / KOMBINASI PERNYATAAN (1, 2, 3, dan 4):
   - Narasi soal menyajikan permasalahan ilmiah diikuti 4 nomor pernyataan (1), (2), (3), dan (4).
   - Opsi jawaban WAJIB mengikuti standar baku nasional:
     A. jika (1), (2), dan (3) benar
     B. jika (1) dan (3) benar
     C. jika (2) dan (4) benar
     D. jika hanya (4) yang benar
     E. jika semua pernyataan benar
3. TIPE 3 - HUBUNGAN SEBAB-AKIBAT (PERNYATAAN - ALASAN):
   - Narasi soal menyajikan kalimat PERNYATAAN diikuti kata 'SEBAB', lalu kalimat ALASAN.
   - Opsi jawaban WAJIB mengikuti standar baku nasional:
     A. Pernyataan benar, alasan benar, dan keduanya menunjukkan hubungan sebab-akibat
     B. Pernyataan benar, alasan benar, tetapi keduanya tidak menunjukkan hubungan sebab-akibat
     C. Pernyataan benar dan alasan salah
     D. Pernyataan salah dan alasan benar
     E. Pernyataan dan alasan keduanya salah
${qType.includes("Tabel") || qType.includes("Esai") ? `4. TIPE 4 - PILIHAN GANDA KOMPLEKS TABEL / ANALISIS KASUS (Benar/Salah):
   - Menyajikan tabel klaim/pernyataan untuk dianalisis kebenarannya.` : ''}

ATURAN WAJIB FORMAT:
- Sebarkan format-format di atas secara variatif dan proporsional di seluruh nomor soal dalam paket naskah ini (jangan monoton hanya 1 format).
- Pada properti 'tipe_soal' di SETIAP butir soal, tuliskan jenis format spesifik butir tersebut (misal: 'Pilihan Ganda', 'Sebab-Akibat (Pernyataan-Alasan)', 'PG Kompleks (Asosiasi 1, 2, 3, 4)').`;
  } else if (qType.includes("Sebab-Akibat")) {
    typeInstruction = `FORMAT KHUSUS SEBAB-AKIBAT (PERNYATAAN - ALASAN):
Setiap butir soal disusun dengan menyajikan kalimat Pernyataan, diikuti kata 'SEBAB', lalu kalimat Alasan.
Pilihan jawaban WAJIB mengikuti format baku:
A. Pernyataan benar, alasan benar, dan keduanya menunjukkan hubungan sebab-akibat
B. Pernyataan benar, alasan benar, tetapi keduanya tidak menunjukkan hubungan sebab-akibat
C. Pernyataan benar dan alasan salah
D. Pernyataan salah dan alasan benar
E. Pernyataan dan alasan keduanya salah
Pada properti 'tipe_soal' tuliskan 'Sebab-Akibat (Pernyataan-Alasan)'.`;
  } else if (qType.includes("1, 2, 3, 4") || qType.includes("Asosiasi")) {
    typeInstruction = `FORMAT KHUSUS PG ASOSIASI (1, 2, 3, dan 4):
Setiap butir soal menyajikan stimulus lalu 4 nomor pernyataan (1), (2), (3), dan (4).
Pilihan jawaban WAJIB:
A. jika (1), (2), dan (3) benar
B. jika (1) dan (3) benar
C. jika (2) dan (4) benar
D. jika hanya (4) yang benar
E. jika semua pernyataan benar
Pada properti 'tipe_soal' tuliskan 'PG Kompleks (Asosiasi 1-2-3-4)'.`;
  } else if (qType.includes("Menjodohkan")) {
    typeInstruction = `FORMAT KHUSUS MENJODOHKAN (MATCHING KOLOM A & B):
- Susun seluruh butir soal dalam format Menjodohkan Pasangan Konsep Kimia.
- Setiap butir soal WAJIB memuat:
  1. Instruksi penjodohan: "Pasangkanlah konsep/istilah pada Kolom A dengan karakteristik/definisi yang tepat pada Kolom B!"
  2. Tabel Markdown 2 kolom: Kolom A (nomor 1, 2, 3, 4 berisi konsep) dan Kolom B (huruf A, B, C, D, E berisi deskripsi pasangan dengan 1 opsi pengecoh).
  3. Baris panduan isian siswa: "Lembar Pasangan Jawaban: 1-[...], 2-[...], 3-[...], 4-[...]".
- WAJIB KOSONGKAN properti 'pilihan_jawaban' (berikan array kosong []).
- Pada 'kunci_jawaban', tuliskan pasangan yang benar (misal: '1 - B, 2 - D, 3 - A, 4 - C').
- Pada 'pembahasan_langkah', jelaskan alasan ilmiah keterkaitan setiap pasangan.
- Pada 'tipe_soal', tuliskan 'Menjodohkan (Matching)'.`;
  } else if (qType.includes("Scramble") || qType.includes("Kata Acak")) {
    typeInstruction = `FORMAT KHUSUS SCRAMBLE (SUSUN HURUF & KATA KIMIA):
- Susun seluruh butir soal dalam format Kata Acak Kimia.
- Setiap butir soal WAJIB memuat:
  1. Huruf acak yang dipisah tanda hubung: "KATA ACAK: [HURUF-ACAK-KAPITAL] (X Huruf)".
  2. Petunjuk konsep kimia yang komprehensif: "PETUNJUK: [Deskripsi konsep / reaksi / sifat zat]".
  3. Kotak huruf isian siswa: "KOTAK JAWABAN: [   ] [   ]... (sejumlah X kotak kosong)".
- WAJIB KOSONGKAN properti 'pilihan_jawaban' (berikan array kosong []).
- Pada 'kunci_jawaban', tuliskan kata asli dalam huruf kapital (misal: 'STOIKIOMETRI').
- Pada 'pembahasan_langkah', uraikan penjelasan konsep ilmiah istilah tersebut.
- Pada 'tipe_soal', tuliskan 'Scramble (Kata Acak)'.`;
  } else if (qType.includes("Teka-Teki Silang") || qType.includes("TTS")) {
    typeInstruction = `FORMAT KHUSUS TEKA-TEKI SILANG (TTS KIMIA 2D INTERLOCKING MENDATAR & MENURUN):
- Susun paket ${numQuestions} butir soal ini sebagai instrumen Teka-Teki Silang Kimia 2 Dimensi (Crossword Puzzle).
- Pilihlah istilah/kata kunci kimia esensial dengan panjang 3–10 huruf yang kaya huruf vokal/konsonan umum sehingga dapat saling berpotongan (interlocking) pada kisi-kisi 2D.
- Pada properti 'pertanyaan', sajikan HANYA kalimat petunjuk/clue konsep kimia yang mendidik dan menantang (DILARANG menambahkan teks kotak manual atau [MENDATAR/MENURUN] di dalam pertanyaan karena tata letak dan penomoran 2D dibuat otomatis oleh sistem web).
- WAJIB KOSONGKAN properti 'pilihan_jawaban' (berikan array kosong []).
- Pada 'kunci_jawaban', tuliskan kata kunci TTS dalam SATU KATA huruf kapital murni (misal: 'INDIKATOR', 'TITRASI', 'ELEKTRON', 'BUFFER', 'LAKMUS').
- Pada 'pembahasan_langkah', jelaskan materi konsep kimia terkait kata kunci tersebut secara lengkap.
- Pada 'tipe_soal', tuliskan 'Teka-Teki Silang (TTS)'.`;
  } else if (qType.includes("Campuran Soal Unik")) {
    typeInstruction = `FORMAT CAMPURAN SOAL UNIK (MENJODOHKAN, SCRAMBLE, & TTS):
- Distribusikan ${numQuestions} butir soal secara seimbang ke dalam 3 format unik:
  1. Menjodohkan (Matching Kolom A & B dengan tabel Markdown)
  2. Scramble (Kata Acak dengan petunjuk konsep dan kotak huruf)
  3. Teka-Teki Silang (Petunjuk TTS Mendatar & Menurun dengan kotak TTS)
- WAJIB KOSONGKAN properti 'pilihan_jawaban' (berikan array kosong []).
- Pada properti 'tipe_soal' di SETIAP butir, tuliskan format spesifiknya: 'Menjodohkan (Matching)', 'Scramble (Kata Acak)', atau 'Teka-Teki Silang (TTS)'.`;
  } else {
    typeInstruction = `FORMAT SOAL: Susun seluruh butir soal dalam format '${qType}'. Pada properti 'tipe_soal' tuliskan '${qType}'.`;
  }

  // Buat User Prompt
  const userPrompt = `
Susun naskah soal asesmen berkualitas tinggi untuk mata pelajaran / topik spesifik berikut:
- Topik / Mata Pelajaran Utama: ${topic}
- Subtopik: ${subtopic || 'Materi inti dan esensial dalam materi ini'}
- Jenjang Pendidikan: ${grade}
- Format Tipe Soal: ${qType}
- Model Pendekatan Stimulus: ${stimulus}
- Tingkat Kesulitan: ${difficulty}
- Jumlah Butir Soal: ${numQuestions} butir soal
- Catatan Tambahan Guru: ${extraNotes || (isPearson ? 'Follow Pearson Edexcel International A-Level specifications' : 'Sesuai standar asesmen nasional')}

INSTRUKSI KHUSUS FITUR:
1. PEDOMAN TINGKAT KESULITAN & LEVEL KOGNITIF:
${difficultyInstruction}

2. PEDOMAN FORMAT TIPE SOAL:
${typeInstruction}

3. STIMULUS SOAL: ${isNoStimulus 
     ? 'MODE TANPA STIMULUS / DRILLING LANGSUNG (HEMAT KERTAS): DILARANG MEMBUAT PARAGRAF CERITA / STIMULUS PANJANG! Langsung susun pertanyaan to the point pada pokok reaksi kimia/konsep inti, data stoikiometri/rumus, atau formula perhitungan yang diuji agar lembar naskah sangat hemat ruang kertas saat dicetak.' 
     : 'Gunakan model pendekatan "' + stimulus + '". Awali pertanyaan dengan narasi kontekstual yang relevan dan menggugah nalar literasi sains.'}
4. TABEL & ILUSTRASI KIMIA: ${includeVisuals 
     ? 'Sertakan tabel data eksperimen (dalam format Markdown table rapi) atau diagram vektor SVG (pada properti ilustrasi_svg) HANYA untuk butir soal yang secara alamiah membutuhkan pengamatan data empiris / sajian visual (seperti laju reaksi, sel volta, titrasi, termokimia). JANGAN memaksakan tabel atau diagram pada seluruh butir soal jika tidak relevan, KECUALI jika catatan instruksi khusus guru di bawah secara eksplisit meminta tabel/diagram di setiap soal.' 
     : 'Tidak perlu menyertakan tabel atau diagram khusus.'}
5. PAKET PARALEL: ${includeParallel ? 'WAJIB susun juga daftar_soal_paket_b sebanyak ' + numQuestions + ' butir soal paralel yang memiliki indikator setara dengan Paket A namun berbeda variabel/angka stoikiometrinya.' : 'Hanya susun Paket A.'}
6. KISI-KISI ASESMEN: ${includeKisiKisi ? 'WAJIB susun matriks kisi_kisi_asesmen yang memetakan CP/TP, indikator soal, level kognitif Bloom/Pusmendik (L1/C2, L2/C3, L3/C4-C5), bentuk soal spesifik, kunci, dan skor.' : 'Tidak perlu menyusun matriks kisi-kisi.'}

7. FORMAT NOTASI RUMUS KIMIA: SETIAP rumus kimia senyawa/ion dan persamaan reaksi kimia (\\text{...}, \\rightarrow, \\frac) WAJIB DIAPIT TANDA DOLLAR INLINE: $...$ (Contoh: $\\text{KOH}$, $\\text{C}_x\\text{H}_{2x+2}$, $\\text{O}_2$, $\\text{C}_2\\text{H}_6$, $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$). JANGAN PERNAH menulis \\text atau \\rightarrow tanpa tanda dollar $! Kunci jawaban dan pembahasan juga wajib menggunakan tanda dollar untuk rumus kimia. Tulis persen dan angka desimal secara biasa tanpa dollar (50,0%).

8. PEMBUATAN JAWABAN & PEMBAHASAN: ${includeSolutions 
     ? 'WAJIB susun kunci_jawaban yang presisi dan susun pembahasan_langkah secara terperinci tahap demi tahap (step-by-step), mencakup rumus kimia, substitusi angka stoikiometri, dan analisis ilmiahnya.' 
     : 'DINONAKTIFKAN (FOKUS 100% MAKSIMAL PADA KUALITAS NASKAH SOAL). Pengajar TIDAK MEMERLUKAN langkah pembahasan panjang. KERAHKAN 100% KUOTA TOKEN DAN KAPASITAS PENALARAN AI UNTUK MENYUSUN BUTIR SOAL TERBAIK: susun narasi stimulus kontekstual yang mendalam, sajikan tabel data eksperimen empiris, angka yang presisi, dan opsi jawaban dengan distraktor (pengecoh) yang cerdas dan menantang nalar siswa. Cukup berikan huruf kunci_jawaban singkat (misal: "A") dan KOSONGKAN pembahasan_langkah agar kuota token tidak terbuang!'}

9. BAHASA & KURIKULUM: ${isPearson 
     ? 'WAJIB 100% BAHASA INGGRIS (British English). Gunakan istilah dan tata nama kurikulum Pearson Edexcel International GCSE / A-Level (ethanoic acid, propanoic acid, cm³, dm³, mol dm⁻³, limiting reagent, Brønsted-Lowry, Ka, Kw = 1.0 x 10^-14 mol² dm⁻⁶). Judul naskah soal WAJIB Bahasa Inggris (misal: "PEARSON EDEXCEL INTERNATIONAL A-LEVEL ASSESSMENT - ' + topic.toUpperCase() + '"). PENTING: Nama kunci JSON WAJIB TETAP ("judul", "jenjang", "topik_utama", "daftar_soal", "nomor", "pertanyaan", "pilihan_jawaban", "kunci_jawaban", "pembahasan_langkah") dan DILARANG diubah ke bahasa Inggris!' 
     : 'Bahasa Indonesia standar Kurikulum Merdeka / asesmen nasional.'}
`;

  aiPromptForUsage = userPrompt + "\n" + BASE_CHEMISTRY_PROMPT + "\n" + JSON.stringify(quizJsonSchema);
  try {
    let parsedPkg;

    // Cek Ketersediaan Token Akses Guru & Kuota Terpusat
    const currentToken = getGeneratorAccessToken();
    if (!useDirectGemini) {
      if (!currentToken) {
        alert("Silakan masukkan Token Akses Guru terlebih dahulu sebelum membuat soal AI.");
        const modal = document.getElementById("connectionModal");
        if (modal) modal.classList.remove("hidden");
        return;
      }
      const accInfo = getGeneratorAccountInfo();
      const requiredQuota = hitungBobotKuotaSoalClient(numQuestions, includeParallel);
      if (accInfo && accInfo.peran !== 'master') {
        const s = Number(accInfo.saldo || 0);
        if (s <= 0) {
          alert("Token Penggunaan AI Berbayar Anda habis. Hubungi U Tito untuk penambahan kuota.");
          const modal = document.getElementById("connectionModal");
          if (modal) modal.classList.remove("hidden");
          return;
        }
        if (s < requiredQuota) {
          alert(`Sisa kuota Anda (${s} kuota) tidak mencukupi untuk membuat paket ini (membutuhkan ${requiredQuota} kuota: ${numQuestions} butir soal${includeParallel ? ' + Paket Paralel' : ''}).\n\nSilakan sesuaikan jumlah butir soal atau hubungi U Tito untuk penambahan kuota.`);
          return;
        }
      }
    }

    if (useDirectGemini) {
      // MODE 1: Direct Client-Side Gemini bila pengguna menyimpan kunci Gemini lokal
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
          maxOutputTokens: 8192,
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
          actualModel = "gemini-3.6-flash";
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
        numQuestions,
        includeSolutions
      });
      recordAIUsage(actualModel, data.usageMetadata, aiPromptForUsage, jsonText, "berhasil", aiStartedAt);
      usageRecorded = true;
    } else {
      // MODE 2: Cloud Backend Proxy via Google Apps Script (Multi-Device Tanpa Input API Key)
      const gasPayload = {
        action: "panggilGemini",
        accessToken: getGeneratorAccessToken(),
        model: model,
        prompt: userPrompt,
        systemInstruction: BASE_CHEMISTRY_PROMPT,
        schema: quizJsonSchema,
        numQuestions: numQuestions,
        includeParallel: includeParallel,
        maxOutputTokens: model === "deepseek-flash" ? deepSeekOutputTokenBudget : 8192
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
        throw new Error(gasRes.message || gasRes.error || "Gagal diproses di Backend GAS");
      }
      if (gasRes.account) {
        window.currentUserAccount = gasRes.account;
        setGeneratorAccountInfo(gasRes.account);
        updateConnectionStatusUI();
      }

      actualModel = gasRes.modelUsed || gasPayload.model || model;
      const rawPayload = gasRes.data || gasRes.raw || gasRes;
      parsedPkg = normalizeAndValidateQuizPackage(rawPayload, {
        topic,
        grade,
        qType,
        stimulus,
        subtopic,
        difficulty,
        numQuestions,
        includeSolutions
      });
      recordAIUsage(actualModel, gasRes.usage, aiPromptForUsage, gasRes.raw || JSON.stringify(rawPayload), "berhasil", aiStartedAt);
      usageRecorded = true;
    }

    parsedPkg.generator_settings = {
      requested_count: numQuestions,
      retained_count: savedQuestions.length,
      requested_parallel: includeParallel,
      requested_solutions: includeSolutions,
      question_type: qType
    };
    parsedPkg = sanitizeQuizPackage(parsedPkg);

    // Pastikan parsedPkg.daftar_soal selalu Array
    parsedPkg.daftar_soal = Array.isArray(parsedPkg.daftar_soal) ? parsedPkg.daftar_soal : [];

    // Validasi Keras: Cegah naskah kosong (0 butir soal)
    if (!parsedPkg.daftar_soal || parsedPkg.daftar_soal.length === 0) {
      console.error("[PortalKimia] Normalisasi tidak menemukan butir soal dalam respon AI:", parsedPkg);
      throw new Error(
        isPearson 
          ? "AI tidak menghasilkan butir soal dalam format yang dikenali (0 soal). Silakan coba klik 'Buat Naskah Soal' lagi."
          : "Format respon AI tidak memuat butir soal yang valid (0 soal). Silakan coba klik 'Buat Naskah Soal' kembali."
      );
    }

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
    autoBackupToCloudAndDocs(currentPackage);
  } catch (err) {
    if (!usageRecorded && aiPromptForUsage) recordAIUsage(actualModel, null, aiPromptForUsage, "", "gagal", aiStartedAt);
    alert("❌ Terjadi kesalahan saat membuat soal: " + err.message);
  } finally {
    loadingState.classList.add("hidden");
    btnGenerate.disabled = false;
  }
}

// AUTO-BACKUP CLOUD & GOOGLE DOCS (Background Sync Otomatis)
async function autoBackupToCloudAndDocs(pkg) {
  if (!pkg || !pkg.daftar_soal || pkg.daftar_soal.length === 0) return;
  const gasUrl = getGasUrl();
  const token = getGeneratorAccessToken();
  if (!gasUrl || !token) return;

  const badge = document.getElementById("autoBackupBadge");
  if (badge) {
    badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-950/60 border border-violet-500/40 text-violet-300 text-[11px] font-medium transition-all animate-pulse";
    badge.innerHTML = `<i data-lucide="cloud-upload" class="w-3.5 h-3.5 text-violet-400"></i><span>Mencadangkan ke Cloud...</span>`;
    badge.classList.remove("hidden");
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  try {
    const autoRequestId = "auto-doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const [resBank, resDocs] = await Promise.allSettled([
      fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "simpanBankSoal",
          teacherToken: token,
          accessToken: token,
          dataSoal: pkg
        })
      }).then(r => r.json()),
      fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "buatGoogleDoc",
          teacherToken: token,
          accessToken: token,
          requestId: autoRequestId,
          dataSoal: pkg
        })
      }).then(r => r.json())
    ]);

    const bankOk = resBank.status === "fulfilled" && resBank.value && resBank.value.status === "ok";
    const docsOk = resDocs.status === "fulfilled" && resDocs.value && resDocs.value.status === "ok";

    if (badge) {
      if (bankOk && docsOk) {
        badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition-all";
        badge.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i><span>Tersimpan di Cloud & Docs</span>`;
        badge.title = "Paket soal otomatis tersimpan di Bank Soal Spreadsheet & Google Docs Drive";
      } else if (bankOk || docsOk) {
        badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium transition-all";
        badge.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-cyan-400"></i><span>Tersimpan di Cloud</span>`;
      } else {
        badge.className = "hidden";
      }
      if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }
  } catch (err) {
    console.warn("Auto-backup cloud background:", err);
    if (badge) badge.className = "hidden";
  }
}

// RENDER RESULTS
function renderResults(pkg) {
  if (!pkg) return;
  pkg.daftar_soal = Array.isArray(pkg.daftar_soal) ? pkg.daftar_soal : [];
  persistLastGeneratedDraft(pkg);
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
  runStructuralQualityAudit();

  // KaTeX rendering (gunakan hanya display math dan \(...\) agar teks kalimat bahasa Inggris tidak terformat miring tanpa spasi)
  if (window.renderMathInElement) {
    renderMathInElement(resultsSection, {
      delimiters: [
        { left: "$", right: "$", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      ignoredClasses: ["tts-clue-item", "tts-cell-box", "crossword-container"],
      throwOnError: false
    });
  }

  if (window.lucide) {
    if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// RENDER LIST SOAL AKTIF (PAKET A ATAU PAKET B)
function renderActiveQuestionsList() {
  if (!currentPackage) return;
  persistLastGeneratedDraft(currentPackage);
  const activeQuestions = (activeParallelTab === 'B' && currentPackage.daftar_soal_paket_b) 
    ? currentPackage.daftar_soal_paket_b 
    : currentPackage.daftar_soal;

  renderTeacherQuestions(activeQuestions);
  renderStudentQuestions(activeQuestions);

  if (window.renderMathInElement) {
    const mathOpts = {
      delimiters: [
        { left: "$", right: "$", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      ignoredClasses: ["tts-clue-item", "tts-cell-box", "crossword-container"],
      throwOnError: false
    };
    const tElem = document.getElementById("teacherQuestionsList");
    const sElem = document.getElementById("studentQuestionsList");
    if (tElem) renderMathInElement(tElem, mathOpts);
    if (sElem) renderMathInElement(sElem, mathOpts);
  }
}


// =========================================================================
// CROSSWORD (TEKA-TEKI SILANG 2D INTERLOCKING) ENGINE & GENERATOR
// =========================================================================

function cleanTtsClue(text) {
  if (!text) return '';
  let c = text.trim();
  c = c.replace(/^\[[^\]]*(?:MENDATAR|MENURUN|ACROSS|DOWN)[^\]]*\]\s*/i, '');
  c = c.replace(/^(?:[-–:]\s*)*(?:Nomor\s*\d+\s*)?(?:\(\d+\s*Huruf\)\s*)?(?:PETUNJUK\s*:\s*)?/i, '');
  c = c.replace(/(?:KOTAK\s+TTS|KOTAK\s+JAWABAN)\s*:\s*\[[\s\S]*$/i, '');
  c = c.replace(/\(\d+\s*kotak\s*kosong\)\s*$/i, '');
  return c.trim();
}

function isValidPlacement(grid, word, row, col, direction, gridSize) {
  const len = word.length;
  if (direction === 'across') {
    if (col < 1 || col + len >= gridSize - 1 || row < 1 || row >= gridSize - 1) return false;
    if (grid[row][col - 1] !== null || grid[row][col + len] !== null) return false;

    let hasIntersection = false;
    for (let i = 0; i < len; i++) {
      const curCell = grid[row][col + i];
      if (curCell !== null) {
        if (curCell !== word[i]) return false;
        hasIntersection = true;
      } else {
        if (grid[row - 1][col + i] !== null || grid[row + 1][col + i] !== null) return false;
      }
    }
    return hasIntersection;
  } else {
    if (row < 1 || row + len >= gridSize - 1 || col < 1 || col >= gridSize - 1) return false;
    if (grid[row - 1][col] !== null || grid[row + len][col] !== null) return false;

    let hasIntersection = false;
    for (let i = 0; i < len; i++) {
      const curCell = grid[row + i][col];
      if (curCell !== null) {
        if (curCell !== word[i]) return false;
        hasIntersection = true;
      } else {
        if (grid[row + i][col - 1] !== null || grid[row + i][col + 1] !== null) return false;
      }
    }
    return hasIntersection;
  }
}

function countIntersections(grid, word, row, col, direction) {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'down' ? row + i : row;
    const c = direction === 'across' ? col + i : col;
    if (grid[r][c] !== null) count++;
  }
  return count;
}

function computeBounds(words) {
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  for (const w of words) {
    minRow = Math.min(minRow, w.row);
    minCol = Math.min(minCol, w.col);
    if (w.direction === 'across') {
      maxRow = Math.max(maxRow, w.row);
      maxCol = Math.max(maxCol, w.col + w.word.length - 1);
    } else {
      maxRow = Math.max(maxRow, w.row + w.word.length - 1);
      maxCol = Math.max(maxCol, w.col);
    }
  }
  return { minRow, maxRow, minCol, maxCol };
}

function computeArea(words) {
  const b = computeBounds(words);
  return (b.maxRow - b.minRow + 1) * (b.maxCol - b.minCol + 1);
}

function generateCrosswordLayout(wordList, maxAttempts = 80) {
  const cleanList = wordList.map((item, idx) => ({
    id: idx + 1,
    word: (item.word || item.kunci_jawaban || '').toUpperCase().replace(/[^A-Z]/g, ''),
    clue: formatChemistryForWebHtml(cleanTtsClue(item.clue || item.pertanyaan || '')),
    clueWord: formatChemistryForWordHtml(cleanTtsClue(item.clue || item.pertanyaan || '')),
    rawClue: cleanTtsClue(item.clue || item.pertanyaan || ''),
    soal: item.soal || item
  })).filter(item => item.word.length >= 2);

  if (cleanList.length === 0) return null;

  let bestResult = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const list = [...cleanList];
    if (attempt > 0) {
      list.sort(() => Math.random() - 0.5);
    } else {
      list.sort((a, b) => b.word.length - a.word.length);
    }

    const GRID_SIZE = 60;
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const placedWords = [];

    const first = list[0];
    const startRow = Math.floor(GRID_SIZE / 2);
    const startCol = Math.floor((GRID_SIZE - first.word.length) / 2);

    for (let c = 0; c < first.word.length; c++) {
      grid[startRow][startCol + c] = first.word[c];
    }
    placedWords.push({
      ...first,
      row: startRow,
      col: startCol,
      direction: 'across',
      intersections: 0
    });

    for (let i = 1; i < list.length; i++) {
      const candidate = list[i];
      let bestPlacement = null;
      let minScore = Infinity;

      for (const placed of placedWords) {
        const nextDir = placed.direction === 'across' ? 'down' : 'across';

        for (let pIdx = 0; pIdx < placed.word.length; pIdx++) {
          const letter = placed.word[pIdx];

          for (let cIdx = 0; cIdx < candidate.word.length; cIdx++) {
            if (candidate.word[cIdx] !== letter) continue;

            let r, c;
            if (nextDir === 'down') {
              r = placed.row - cIdx;
              c = placed.col + pIdx;
            } else {
              r = placed.row + pIdx;
              c = placed.col - cIdx;
            }

            if (isValidPlacement(grid, candidate.word, r, c, nextDir, GRID_SIZE)) {
              const intersections = countIntersections(grid, candidate.word, r, c, nextDir);
              const bounds = computeBounds([...placedWords, { row: r, col: c, word: candidate.word, direction: nextDir }]);
              const aspectPenalty = Math.abs((bounds.maxCol - bounds.minCol) - (bounds.maxRow - bounds.minRow)) * 2;
              const area = (bounds.maxRow - bounds.minRow + 1) * (bounds.maxCol - bounds.minCol + 1);
              const score = area - (intersections * 50) + aspectPenalty;

              if (score < minScore) {
                minScore = score;
                bestPlacement = { row: r, col: c, direction: nextDir, intersections };
              }
            }
          }
        }
      }

      if (bestPlacement) {
        for (let idx = 0; idx < candidate.word.length; idx++) {
          const r = bestPlacement.direction === 'down' ? bestPlacement.row + idx : bestPlacement.row;
          const c = bestPlacement.direction === 'across' ? bestPlacement.col + idx : bestPlacement.col;
          grid[r][c] = candidate.word[idx];
        }
        placedWords.push({
          ...candidate,
          row: bestPlacement.row,
          col: bestPlacement.col,
          direction: bestPlacement.direction,
          intersections: bestPlacement.intersections
        });
      }
    }

    if (!bestResult || placedWords.length > bestResult.placedWords.length || 
        (placedWords.length === bestResult.placedWords.length && bestResult.area > computeArea(placedWords))) {
      bestResult = {
        grid,
        placedWords,
        area: computeArea(placedWords)
      };
      if (placedWords.length === cleanList.length) {
        if (attempt >= 25) break;
      }
    }
  }

  if (!bestResult || bestResult.placedWords.length === 0) return null;

  // Fallback placement for any unplaced words so 100% of words are in the crossword!
  if (bestResult.placedWords.length < cleanList.length) {
    const placedIds = new Set(bestResult.placedWords.map(w => w.id));
    const unplaced = cleanList.filter(w => !placedIds.has(w.id));
    for (const uw of unplaced) {
      const bounds = computeBounds(bestResult.placedWords);
      const newRow = bounds.maxRow + 2;
      const newCol = bounds.minCol;
      bestResult.placedWords.push({
        ...uw,
        row: newRow,
        col: newCol,
        direction: 'across',
        intersections: 0
      });
    }
  }

  // Crop to bounding box
  const bounds = computeBounds(bestResult.placedWords);
  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;

  const croppedGrid = Array.from({ length: height }, () => Array(width).fill(null));
  const finalWords = bestResult.placedWords.map(w => ({
    ...w,
    row: w.row - bounds.minRow,
    col: w.col - bounds.minCol
  }));

  for (const w of finalWords) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      if (!croppedGrid[r][c]) {
        croppedGrid[r][c] = { letter: w.word[i], number: null, row: r, col: c };
      }
    }
  }

  // Crossword numbering in reading order (top-to-bottom, left-to-right)
  let currentNum = 1;
  const startCells = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const startsAcross = finalWords.find(w => w.direction === 'across' && w.row === r && w.col === c);
      const startsDown = finalWords.find(w => w.direction === 'down' && w.row === r && w.col === c);
      if (startsAcross || startsDown) {
        startCells.push({ r, c, num: currentNum++ });
      }
    }
  }

  for (const sc of startCells) {
    if (croppedGrid[sc.r][sc.c]) {
      croppedGrid[sc.r][sc.c].number = sc.num;
    }
    const across = finalWords.find(w => w.direction === 'across' && w.row === sc.r && w.col === sc.c);
    if (across) across.number = sc.num;
    const down = finalWords.find(w => w.direction === 'down' && w.row === sc.r && w.col === sc.c);
    if (down) down.number = sc.num;
  }

  const acrossClues = finalWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const downClues = finalWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  return {
    width,
    height,
    grid: croppedGrid,
    words: finalWords,
    acrossClues,
    downClues
  };
}

function getOrBuildCrosswordLayout(pkg, activeTab = 'A') {
  if (!pkg) return null;
  const cacheKey = activeTab === 'B' ? '_crosswordLayoutB' : '_crosswordLayoutA';
  if (pkg[cacheKey]) return pkg[cacheKey];

  const questions = (activeTab === 'B' && pkg.daftar_soal_paket_b) ? pkg.daftar_soal_paket_b : (pkg.daftar_soal || []);
  const ttsQuestions = questions.filter(q => {
    const t = (q.tipe_soal || '').toLowerCase();
    return t.includes('tts') || t.includes('silang') || t.includes('crossword');
  });

  if (ttsQuestions.length === 0) return null;

  const layout = generateCrosswordLayout(ttsQuestions, 80);
  pkg[cacheKey] = layout;
  return layout;
}

// RENDER CROSSWORD FOR WEB (TEACHER & STUDENT MODES)
function renderCrosswordSectionForWeb(layout, isStudent = false) {
  if (!layout || !layout.grid) return '';

  let gridCellsHtml = '';
  for (let r = 0; r < layout.height; r++) {
    for (let c = 0; c < layout.width; c++) {
      const cell = layout.grid[r][c];
      if (!cell) {
        gridCellsHtml += `<div class="w-8 h-8 sm:w-9 sm:h-9 bg-transparent pointer-events-none select-none"></div>`;
      } else if (isStudent) {
        gridCellsHtml += `
          <div class="relative w-8 h-8 sm:w-9 sm:h-9 bg-zinc-900 border-2 border-zinc-600 rounded flex items-center justify-center focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/50 tts-cell-box" id="tts_box_${r}_${c}">
            ${cell.number ? `<span class="absolute top-0.5 left-1 text-[8px] font-mono text-cyan-400 font-bold leading-none select-none">${cell.number}</span>` : ''}
            <input type="text" maxlength="1" 
                   id="tts_input_${r}_${c}" 
                   data-row="${r}" data-col="${c}" 
                   data-letter="${cell.letter}"
                   class="w-full h-full bg-transparent text-center font-bold font-mono text-sm uppercase text-white focus:outline-none selection:bg-transparent" 
                   autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">
          </div>
        `;
      } else {
        gridCellsHtml += `
          <div class="relative w-8 h-8 sm:w-9 sm:h-9 bg-zinc-900 border-2 border-cyan-500/50 rounded flex items-center justify-center shadow-sm tts-cell-box" id="teacher_tts_${r}_${c}">
            ${cell.number ? `<span class="absolute top-0.5 left-1 text-[8px] font-mono text-cyan-400 font-bold leading-none select-none">${cell.number}</span>` : ''}
            <span class="font-bold font-mono text-sm text-cyan-200 tts-letter-preview">${cell.letter}</span>
          </div>
        `;
      }
    }
  }

  const acrossCluesHtml = layout.acrossClues.map(c => `
    <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-500/50 cursor-pointer transition-all tts-clue-item" 
         data-direction="${c.direction}" data-row="${c.row}" data-col="${c.col}" data-word="${c.word}" 
         onclick="highlightCrosswordWord(${c.row}, ${c.col}, '${c.direction}', ${c.word.length}, ${isStudent})">
      <div class="text-xs text-zinc-300 leading-snug">
        <b class="text-cyan-400 font-bold mr-1">${c.number}.</b> ${c.clue || formatChemistryForWebHtml(c.rawClue || '')}
        ${isStudent ? `<span class="text-zinc-500 font-mono text-[11px] ml-1">(${c.word.length} huruf)</span>` : `<span class="text-cyan-300 font-mono font-bold ml-1.5 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">[${c.word}]</span>`}
      </div>
    </div>
  `).join('');

  const downCluesHtml = layout.downClues.map(c => `
    <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-violet-500/50 cursor-pointer transition-all tts-clue-item" 
         data-direction="${c.direction}" data-row="${c.row}" data-col="${c.col}" data-word="${c.word}" 
         onclick="highlightCrosswordWord(${c.row}, ${c.col}, '${c.direction}', ${c.word.length}, ${isStudent})">
      <div class="text-xs text-zinc-300 leading-snug">
        <b class="text-violet-400 font-bold mr-1">${c.number}.</b> ${c.clue || formatChemistryForWebHtml(c.rawClue || '')}
        ${isStudent ? `<span class="text-zinc-500 font-mono text-[11px] ml-1">(${c.word.length} huruf)</span>` : `<span class="text-violet-300 font-mono font-bold ml-1.5 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-500/30">[${c.word}]</span>`}
      </div>
    </div>
  `).join('');

  // Detailed explanations for teacher mode
  let explanationsHtml = '';
  if (!isStudent) {
    const allWords = [...layout.acrossClues, ...layout.downClues].sort((a, b) => a.number - b.number);
    const stepsHtml = allWords.map(w => {
      const steps = w.soal && Array.isArray(w.soal.pembahasan_langkah) ? w.soal.pembahasan_langkah.join(' ') : (w.clue || '');
      return `
        <div class="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
          <div class="font-bold text-white mb-1 flex items-center justify-between">
            <span><b>No. ${w.number} (${w.direction === 'across' ? 'Mendatar' : 'Menurun'})</b> — ${w.word}</span>
            <span class="text-[10px] text-zinc-400 font-mono">${w.word.length} Huruf</span>
          </div>
          <div class="text-zinc-300 leading-relaxed">${formatChemistryForWebHtml(steps)}</div>
        </div>
      `;
    }).join('');

    explanationsHtml = `
      <details class="group mt-4 pt-3 border-t border-zinc-800">
        <summary class="flex items-center justify-between text-xs font-bold text-cyan-300 cursor-pointer list-none select-none py-1">
          <span class="flex items-center gap-1.5">
            <i data-lucide="key" class="w-4 h-4 text-emerald-400"></i>
            <span>🔍 Pembahasan Konsep Ilmiah TTS Lengkap (${allWords.length} Istilah)</span>
          </span>
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="mt-3 space-y-2">
          ${stepsHtml}
        </div>
      </details>
    `;
  }

  return `
    <div class="glass-card p-4 sm:p-6 mb-6 rounded-2xl border border-cyan-500/40 shadow-xl space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-lg">
            📰
          </div>
          <div>
            <h4 class="text-base font-bold text-white leading-tight">Lembar Teka-Teki Silang (TTS 2D Interlocking)</h4>
            <p class="text-xs text-zinc-400">Kisi-kisi berpotongan mendatar &amp; menurun sesuai kaidah baku TTS.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${!isStudent ? `
            <button type="button" id="btnToggleCrosswordLetters" onclick="toggleTeacherCrosswordLetters()" 
                    class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-colors">
              👁️ Sembunyikan Kunci Huruf
            </button>
          ` : `
            <span class="text-[11px] text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-500/30 font-medium">
              💡 Ketik huruf di kotak atau klik petunjuk soal
            </span>
          `}
        </div>
      </div>

      <!-- 2D Crossword Grid -->
      <div class="overflow-x-auto py-2 flex justify-center">
        <div class="inline-grid gap-1 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 shadow-inner" 
             style="grid-template-columns: repeat(${layout.width}, minmax(0, 1fr));">
          ${gridCellsHtml}
        </div>
      </div>

      <!-- Clues Section: 2 Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
          <h5 class="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
            <span>➡️</span> MENDATAR (Across)
          </h5>
          <div class="space-y-2">
            ${acrossCluesHtml}
          </div>
        </div>

        <div class="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2.5">
          <h5 class="text-xs font-bold text-violet-300 flex items-center gap-1.5 uppercase tracking-wider">
            <span>⬇️</span> MENURUN (Down)
          </h5>
          <div class="space-y-2">
            ${downCluesHtml}
          </div>
        </div>
      </div>

      ${explanationsHtml}
    </div>
  `;
}

// TOGGLE TEACHER LETTERS
var teacherCrosswordLettersVisible = true;
function toggleTeacherCrosswordLetters() {
  teacherCrosswordLettersVisible = !teacherCrosswordLettersVisible;
  const letters = document.querySelectorAll('.tts-letter-preview');
  letters.forEach(el => {
    el.style.visibility = teacherCrosswordLettersVisible ? 'visible' : 'hidden';
  });
  const btn = document.getElementById('btnToggleCrosswordLetters');
  if (btn) {
    btn.textContent = teacherCrosswordLettersVisible ? '👁️ Sembunyikan Kunci Huruf' : '👁️ Tampilkan Kunci Huruf';
  }
}

// HIGHLIGHT ACTIVE WORD ON CROSSWORD GRID
function highlightCrosswordWord(startRow, startCol, direction, length, isStudent = false) {
  document.querySelectorAll('.tts-cell-box').forEach(b => b.classList.remove('tts-cell-highlight'));
  document.querySelectorAll('.tts-clue-item').forEach(c => c.classList.remove('tts-clue-active'));

  for (let i = 0; i < length; i++) {
    const r = direction === 'down' ? startRow + i : startRow;
    const c = direction === 'across' ? startCol + i : startCol;
    const boxId = isStudent ? `tts_box_${r}_${c}` : `teacher_tts_${r}_${c}`;
    const box = document.getElementById(boxId);
    if (box) box.classList.add('tts-cell-highlight');
  }

  if (isStudent) {
    const firstInput = document.getElementById(`tts_input_${startRow}_${startCol}`);
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }
  }
}

// STUDENT CROSSWORD NAVIGATION
function initStudentCrosswordNavigation() {
  const inputs = document.querySelectorAll('input[id^="tts_input_"]');
  inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      const r = parseInt(input.dataset.row, 10);
      const c = parseInt(input.dataset.col, 10);

      if (e.key === 'ArrowRight') {
        const next = document.getElementById(`tts_input_${r}_${c + 1}`);
        if (next) { next.focus(); next.select(); e.preventDefault(); }
      } else if (e.key === 'ArrowLeft') {
        const prev = document.getElementById(`tts_input_${r}_${c - 1}`);
        if (prev) { prev.focus(); prev.select(); e.preventDefault(); }
      } else if (e.key === 'ArrowDown') {
        const down = document.getElementById(`tts_input_${r + 1}_${c}`);
        if (down) { down.focus(); down.select(); e.preventDefault(); }
      } else if (e.key === 'ArrowUp') {
        const up = document.getElementById(`tts_input_${r - 1}_${c}`);
        if (up) { up.focus(); up.select(); e.preventDefault(); }
      } else if (e.key === 'Backspace' && !input.value) {
        // Find previous across or down cell
        const prevAcross = document.getElementById(`tts_input_${r}_${c - 1}`);
        if (prevAcross) { prevAcross.focus(); prevAcross.select(); }
      }
    });

    input.addEventListener('input', () => {
      if (input.value && input.value.length === 1) {
        input.value = input.value.toUpperCase();
        const r = parseInt(input.dataset.row, 10);
        const c = parseInt(input.dataset.col, 10);
        // Advance to next across or down cell
        const nextAcross = document.getElementById(`tts_input_${r}_${c + 1}`);
        if (nextAcross) {
          nextAcross.focus();
          nextAcross.select();
        } else {
          const nextDown = document.getElementById(`tts_input_${r + 1}_${c}`);
          if (nextDown) {
            nextDown.focus();
            nextDown.select();
          }
        }
      }
    });
  });
}

// RENDER CROSSWORD FOR WORD EXPORT & PRINT
function renderCrosswordTableForWord(layout, isStudent = false) {
  if (!layout || !layout.grid) return '';

  const cellPt = layout.width > 14 ? Math.max(16, Math.floor(400 / layout.width)) : 22;

  let rowsHtml = '';
  for (let r = 0; r < layout.height; r++) {
    let cellsHtml = '';
    for (let c = 0; c < layout.width; c++) {
      const cell = layout.grid[r][c];
      if (!cell) {
        cellsHtml += `<td style="width: ${cellPt}pt; height: ${cellPt}pt; border: none; background-color: transparent; padding: 0;">&nbsp;</td>`;
      } else {
        const numText = cell.number ? `<span style="font-size: 7pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; position: absolute; top: 1pt; left: 2pt; line-height: 1;">${cell.number}</span>` : '';
        const letterText = isStudent ? '&nbsp;' : `<b style="font-size: 11pt; font-family: 'Times New Roman', Times, serif; font-weight: bold;">${cell.letter}</b>`;
        cellsHtml += `
          <td style="width: ${cellPt}pt; height: ${cellPt}pt; border: 1.5pt solid #000000; background-color: #ffffff; text-align: center; vertical-align: middle; position: relative; padding: 0; line-height: ${cellPt}pt;">
            ${numText}
            ${letterText}
          </td>
        `;
      }
    }
    rowsHtml += `<tr>${cellsHtml}</tr>`;
  }

  const acrossHtml = layout.acrossClues.map(c => `
    <div style="margin-bottom: 5pt; text-align: justify; line-height: 1.35; font-size: 10.5pt; font-family: 'Times New Roman', Times, serif;">
      <b>${c.number}.</b> ${c.clueWord || formatChemistryForWordHtml(c.clue || c.rawClue || '')} ${isStudent ? `<i>(${c.word.length} huruf)</i>` : `<b style="color: #1e3a8a;">[${c.word}]</b>`}
    </div>
  `).join('');

  const downHtml = layout.downClues.map(c => `
    <div style="margin-bottom: 5pt; text-align: justify; line-height: 1.35; font-size: 10.5pt; font-family: 'Times New Roman', Times, serif;">
      <b>${c.number}.</b> ${c.clueWord || formatChemistryForWordHtml(c.clue || c.rawClue || '')} ${isStudent ? `<i>(${c.word.length} huruf)</i>` : `<b style="color: #1e3a8a;">[${c.word}]</b>`}
    </div>
  `).join('');

  return `
    <div style="text-align: center; margin: 10pt 0 16pt 0;">
      <table align="center" style="border-collapse: collapse; margin: 0 auto; border: none;">
        ${rowsHtml}
      </table>
    </div>
    <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 12pt; font-family: 'Times New Roman', Times, serif;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none; padding-right: 12pt;">
          <div style="font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid #000000; padding-bottom: 2pt; margin-bottom: 6pt; text-transform: uppercase;">
            MENDATAR
          </div>
          ${acrossHtml}
        </td>
        <td style="width: 50%; vertical-align: top; border: none; padding-left: 12pt;">
          <div style="font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid #000000; padding-bottom: 2pt; margin-bottom: 6pt; text-transform: uppercase;">
            MENURUN
          </div>
          ${downHtml}
        </td>
      </tr>
    </table>
  `;
}

// HELPER RENDER VISUAL KHUSUS SOAL UNIK (SCRAMBLE, TTS, & MENJODOHKAN)
function renderUniqueQuestionVisuals(text, soal) {
  if (!soal) return "";
  const tSoal = (soal.tipe_soal || "").toLowerCase();
  const isScramble = tSoal.includes("scramble") || tSoal.includes("acak") || /KATA ACAK\s*:/i.test(text);
  const isTts = tSoal.includes("tts") || tSoal.includes("silang") || /\[?(?:MENDATAR|MENURUN)\]?/i.test(text) || /KOTAK TTS/i.test(text);
  const isMatching = tSoal.includes("jodoh") || tSoal.includes("matching") || /Lembar Pasangan/i.test(text);

  let extraHtml = "";

  if (isScramble) {
    const matchScramble = text.match(/(?:KATA ACAK|SCRAMBLE)\s*:\s*([A-Za-z\s\-\,]+?)(?:\(|\n|$)/i);
    let letters = [];
    if (matchScramble) {
      letters = matchScramble[1].split(/[\s\-\,]+/).filter(l => l.length === 1 && /[A-Za-z]/.test(l));
    }
    if (letters.length === 0 && soal.kunci_jawaban) {
      letters = soal.kunci_jawaban.replace(/[^A-Za-z]/g, "").split("").sort(() => Math.random() - 0.5);
    }

    if (letters.length > 0) {
      const chips = letters.map(l => 
        `<span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold font-mono text-sm shadow-sm m-0.5">${l.toUpperCase()}</span>`
      ).join("");

      const count = letters.length;
      const boxes = Array(count).fill(0).map(() => 
        `<span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 border-2 border-dashed border-emerald-500/50 text-emerald-400 font-mono text-sm m-0.5 select-none">&nbsp;</span>`
      ).join("");

      extraHtml += `
        <div class="my-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 to-zinc-900/60 border border-amber-500/30 space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-amber-300">
            <span class="flex items-center gap-1.5">🔤 <b>Huruf-Huruf Acak:</b></span>
            <span class="text-[11px] text-zinc-400 font-mono">(${letters.length} Huruf)</span>
          </div>
          <div class="flex flex-wrap items-center gap-1">${chips}</div>
          <div class="pt-2 border-t border-zinc-800/80">
            <div class="text-[11px] text-zinc-400 mb-1.5 font-medium">Kotak Isian Huruf Siswa:</div>
            <div class="flex flex-wrap items-center gap-1">${boxes}</div>
          </div>
        </div>
      `;
    }
  } else if (isTts) {
    const isAcross = /MENDATAR|ACROSS/i.test(text);
    const isDown = /MENURUN|DOWN/i.test(text);
    const numLetterMatch = text.match(/\((\d+)\s*Huruf\)/i);
    const letterCount = numLetterMatch ? parseInt(numLetterMatch[1], 10) : (soal.kunci_jawaban ? soal.kunci_jawaban.replace(/[^A-Za-z]/g, "").length : 0);

    let directionBadge = "";
    if (isAcross) {
      directionBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-xs">➡️ MENDATAR (Across)</span>`;
    } else if (isDown) {
      directionBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 font-bold font-mono text-xs">⬇️ MENURUN (Down)</span>`;
    }

    let boxesHtml = "";
    if (letterCount > 0 && letterCount <= 25) {
      boxesHtml = Array(letterCount).fill(0).map((_, i) => 
        `<span class="relative inline-flex items-center justify-center w-8 h-8 rounded bg-zinc-950 border-2 border-cyan-500/60 text-white font-mono text-xs font-bold m-0.5 select-none shadow-inner">${i === 0 ? `<span class="absolute top-0.5 left-1 text-[8px] text-cyan-400/80 font-mono">${soal.nomor}</span>` : ''}&nbsp;</span>`
      ).join("");
    }

    extraHtml += `
      <div class="my-3 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-zinc-900/60 border border-cyan-500/30 space-y-2.5">
        <div class="flex items-center justify-between text-xs font-bold">
          <div class="flex items-center gap-2">${directionBadge || '<span class="text-cyan-300">📰 Teka-Teki Silang</span>'}</div>
          ${letterCount ? `<span class="text-[11px] text-zinc-400 font-mono">(${letterCount} Kotak Huruf)</span>` : ''}
        </div>
        ${boxesHtml ? `
          <div class="pt-1">
            <div class="text-[11px] text-zinc-400 mb-1.5 font-medium">Kotak TTS:</div>
            <div class="flex flex-wrap items-center gap-1">${boxesHtml}</div>
          </div>
        ` : ''}
      </div>
    `;
  } else if (isMatching) {
    extraHtml += `
      <div class="my-2.5 p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs font-mono text-violet-200 flex items-center gap-2">
        <span class="text-sm">🧩</span>
        <span><b>Panduan Siswa:</b> Tuliskan pasangan jawaban pada lembar jawab (contoh format: <b>1-B, 2-D, 3-A, 4-C</b>).</span>
      </div>
    `;
  }

  return extraHtml;
}

// HELPER RENDER KONTEN PERTANYAAN WEB (TERMASUK PEMISAHAN SUBPARTS & FORMULA KIMIA)
function renderQuestionContentForWeb(soal) {
  if (!soal) return "";
  const rawText = String(soal.pertanyaan || "").trim();

  // 1. Ekstrak tabel markdown jika ada
  const lines = rawText.split(/\r?\n/);
  let beforeLines = [];
  let tableLines = [];
  let afterLines = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableLine = line.includes("|") && (line.split("|").length >= 3);
    if (isTableLine) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) afterLines.push(lines[i]);
      else beforeLines.push(lines[i]);
    }
  }

  const hasTable = tableLines.length >= 2;
  const tableHtml = hasTable ? parseMarkdownTable(tableLines.join("\n")) : "";
  const mainText = hasTable ? (beforeLines.join("\n") + "\n" + afterLines.join("\n")).trim() : rawText;

  // 2. Parse sub-soal terstruktur (a), (b), (c)
  const parsed = parseStructuredQuestionContent(mainText);

  if (parsed.hasSubparts && (!soal.pilihan_jawaban || soal.pilihan_jawaban.length === 0)) {
    let out = [];

    if (parsed.stem) {
      out.push(`<div class="text-sm leading-relaxed text-zinc-100 mb-3">${formatChemistryForWebHtml(parsed.stem)}</div>`);
    }

    if (tableHtml) {
      out.push(`<div class="my-3 overflow-x-auto">${tableHtml}</div>`);
    }

    parsed.subparts.forEach(sub => {
      let cleanText = sub.text;
      let markBadge = "";
      const markMatch = cleanText.match(/(?:\[|\()(\d+)\s*(?:marks?|mark|skor|poin)?(?:\bin total\b)?(?:\]|\))$/i);
      if (markMatch) {
        const markVal = parseInt(markMatch[1], 10);
        markBadge = `<span class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold shrink-0">(${markVal})</span>`;
        cleanText = cleanText.substring(0, markMatch.index).trim();
      }

      const subPartsList = splitRomanSubparts(cleanText);
      let subBodyHtml = "";

      if (subPartsList.length > 1) {
        subBodyHtml = subPartsList.map(p => {
          if (!p.label) {
            return `<div class="text-sm text-zinc-200 leading-relaxed mb-1.5">${formatChemistryForWebHtml(p.text)}</div>`;
          }
          let rText = p.text;
          let rBadge = "";
          const rMatch = rText.match(/(?:\[|\()(\d+)\s*(?:marks?|mark|skor|poin)?(?:\bin total\b)?(?:\]|\))$/i);
          if (rMatch) {
            const rVal = parseInt(rMatch[1], 10);
            rBadge = `<span class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[11px] font-bold shrink-0">(${rVal})</span>`;
            rText = rText.substring(0, rMatch.index).trim();
          }
          return `
            <div class="flex items-start gap-2 my-1 pl-2">
              <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-violet-300 text-xs font-mono font-bold shrink-0">${p.label}</span>
              <div class="text-sm text-zinc-200 leading-relaxed flex-grow">${formatChemistryForWebHtml(rText)}</div>
              ${rBadge}
            </div>
          `;
        }).join("");
      } else {
        subBodyHtml = `<div class="text-sm text-zinc-200 leading-relaxed">${formatChemistryForWebHtml(cleanText)}</div>`;
      }

      out.push(`
        <div class="my-3 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm space-y-2">
          <div class="flex items-start gap-2.5">
            <span class="px-2.5 py-0.5 rounded-md bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold font-mono shrink-0">${sub.label}</span>
            <div class="flex-grow space-y-1">${subBodyHtml}</div>
            ${markBadge}
          </div>
          <div class="font-mono text-xs text-zinc-600 tracking-widest pl-8 select-none overflow-hidden whitespace-nowrap opacity-60">
            ........................................................................................................................................<br>
            ........................................................................................................................................
          </div>
        </div>
      `);
    });

    const totMatch = rawText.match(/(?:\[|\()(?:Total for Question \d+ = (\d+) marks?|Total:\s*(\d+)\s*marks?)(?:\]|\))/i);
    if (totMatch) {
      const tot = totMatch[1] || totMatch[2];
      out.push(`<div class="text-right text-xs font-bold text-zinc-400 mt-2 font-mono italic">(Total for Question ${soal.nomor} = ${tot} marks)</div>`);
    }

    return out.join("");
  } else {
    let html = `<div class="text-sm leading-relaxed text-zinc-100 mb-3">${formatChemistryForWebHtml(mainText)}</div>`;
    if (tableHtml) {
      html += `<div class="my-3 overflow-x-auto">${tableHtml}</div>`;
    }
    const uniqueVisuals = renderUniqueQuestionVisuals(mainText, soal);
    if (uniqueVisuals) {
      html += uniqueVisuals;
    }
    return html;
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
    if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    return;
  }

  // 1. Deteksi Teka-Teki Silang (TTS 2D)
  const ttsQuestions = displayedQuestions.filter(q => {
    const t = (q.tipe_soal || "").toLowerCase();
    return t.includes("tts") || t.includes("silang") || t.includes("crossword");
  });
  const nonTtsQuestions = displayedQuestions.filter(q => !ttsQuestions.includes(q));

  if (ttsQuestions.length > 0) {
    const layout = getOrBuildCrosswordLayout(currentPackage, activeParallelTab);
    if (layout) {
      const crosswordHtml = renderCrosswordSectionForWeb(layout, false);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = crosswordHtml;
      container.appendChild(tempDiv.firstElementChild || tempDiv);
    }
  }

  // 2. Render soal lainnya (Pilihan Ganda, Uraian, Menjodohkan, Scramble)
  nonTtsQuestions.forEach((soal) => {
    if (!soal) return;
    const isPinned = soal.is_pinned === true;
    const card = document.createElement("div");
    card.className = `question-item ${isPinned ? 'pinned-active' : ''}`;

    let optionsHtml = "";
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      const isPearsonCurriculum = (typeof currentPackage !== "undefined" && currentPackage && currentPackage.jenjang && ((currentPackage.jenjang.toLowerCase().includes("pearson")) || (currentPackage.jenjang.toLowerCase().includes("edexcel")))) || (document.getElementById("gradeSelect")?.value?.toLowerCase().includes("pearson")) || false;
      optionsHtml = soal.pilihan_jawaban.map((opt) => {
        const isCorrect = String(opt.label || "").toUpperCase() === String(soal.kunci_jawaban || "").toUpperCase();
        return `
          <div class="option-row ${isCorrect ? 'correct-answer' : ''}">
            ${isPearsonCurriculum ? '<span class="inline-block w-4 h-4 border border-zinc-500 rounded-sm mr-1.5 shrink-0 text-center text-[10px] leading-4 text-zinc-400"></span>' : ''}
            <span class="option-label">${opt.label}</span>
            <div class="flex-grow-1">${formatChemistryForWebHtml(opt.teks)} ${isCorrect ? '<b class="text-emerald-400 ms-2 font-mono">(Kunci Jawaban)</b>' : ''}</div>
          </div>
        `;
      }).join("");
      if (isPearsonCurriculum) {
        optionsHtml += `<div class="flex justify-end mt-1 text-xs font-mono font-bold text-sky-400">(1)</div>`;
      }
    } else {
      const hasSubparts = parseStructuredQuestionContent(soal.pertanyaan || "").hasSubparts;
      const tSoal = (soal.tipe_soal || "").toLowerCase();
      if (tSoal.includes("jodoh") || tSoal.includes("matching")) {
        optionsHtml = `
          <div class="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-violet-200 flex items-center gap-2 mb-2">
            <span class="text-base">🧩</span>
            <div><b>Format Menjodohkan:</b> Siswa menghubungkan konsep di Kolom A dengan pasangan yang tepat di Kolom B. Kunci jawaban dan lembar pasangan tersedia di bawah.</div>
          </div>
        `;
      } else if (tSoal.includes("scramble") || tSoal.includes("acak")) {
        optionsHtml = `
          <div class="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2 mb-2">
            <span class="text-base">🔤</span>
            <div><b>Format Scramble:</b> Siswa menyusun huruf-huruf acak menjadi istilah kimia yang tepat berdasarkan petunjuk konsep.</div>
          </div>
        `;
      } else if (!hasSubparts) {
        optionsHtml = `
          <div class="p-2.5 rounded-lg bg-violet-950/20 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2 mb-2">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-violet-400 shrink-0"></i>
            <span><b>Soal Uraian / Terstruktur:</b> Lembar jawab bertitik-titik disiapkan otomatis saat dicetak atau diekspor ke Word/Docs.</span>
          </div>
        `;
      }
    }

    const formattedQuestion = renderQuestionContentForWeb(soal);
    const svgHtml = soal.ilustrasi_svg ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) : "";

    const stepsList = Array.isArray(soal.pembahasan_langkah) 
      ? soal.pembahasan_langkah.filter(s => s && !s.toLowerCase().includes("mode fokus"))
      : [];
    const hasDetailedSteps = stepsList.length > 0;
    const stepsHtml = stepsList.map(st => `<li class="mb-1 text-zinc-200">${formatChemistryForWebHtml(st)}</li>`).join("");
    const tipsHtml = soal.tips_atau_jebakan 
      ? `<div class="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-xs"><b>💡 Tips & Miskonsepsi Siswa:</b> ${formatChemistryForWebHtml(soal.tips_atau_jebakan)}</div>` 
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
          <button type="button" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px]" onclick="editQuestionByNumber(${soal.nomor})">Edit</button>
          <button type="button" class="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 text-[10px]" onclick="regenerateQuestionByNumber(${soal.nomor})">Buat ulang</button>
          <span class="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">${soal.tingkat_kesulitan}</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">${soal.subtopik}</span>
        </div>
      </div>

      <div class="mb-3">${formattedQuestion}</div>
      ${svgHtml}
      <div class="space-y-1 mb-3">${optionsHtml}</div>

      <div class="pembahasan-box">
        <div class="flex items-center justify-between gap-2 mb-1.5 text-xs font-bold text-violet-300">
          <div class="flex items-center gap-2">
            <i data-lucide="key" class="w-4 h-4 text-emerald-400"></i>
            <span>Kunci Jawaban: <b class="text-emerald-400 text-sm">${formatAnswerKeyForWeb(soal.kunci_jawaban)}</b></span>
          </div>
          ${!hasDetailedSteps ? '<span class="text-[10px] text-zinc-400 italic bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">Mode Naskah Soal (Pembahasan dinonaktifkan)</span>' : ''}
        </div>
        ${hasDetailedSteps ? `
          <div class="text-xs font-semibold text-zinc-400 mb-1">Langkah-Langkah Penyelesaian:</div>
          <ul class="list-disc list-inside text-xs space-y-1 pl-1">${stepsHtml}</ul>
        ` : ''}
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

  // 1. Deteksi Teka-Teki Silang (TTS 2D)
  const ttsQuestions = displayedQuestions.filter(q => {
    const t = (q.tipe_soal || "").toLowerCase();
    return t.includes("tts") || t.includes("silang") || t.includes("crossword");
  });
  const nonTtsQuestions = displayedQuestions.filter(q => !ttsQuestions.includes(q));

  if (ttsQuestions.length > 0) {
    const layout = getOrBuildCrosswordLayout(currentPackage, activeParallelTab);
    if (layout) {
      const crosswordHtml = renderCrosswordSectionForWeb(layout, true);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = crosswordHtml;
      container.appendChild(tempDiv.firstElementChild || tempDiv);
      setTimeout(initStudentCrosswordNavigation, 60);
    }
  }

  // 2. Render soal lainnya
  nonTtsQuestions.forEach((soal) => {
    if (!soal) return;
    const card = document.createElement("div");
    card.className = "question-item";

    let inputHtml = "";
    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      inputHtml = soal.pilihan_jawaban.map((opt) => `
        <label class="option-row cursor-pointer hover:bg-zinc-800/60 block rounded-xl p-3 border border-zinc-800 transition-colors">
          <input type="radio" name="q_${soal.nomor}" value="${opt.label}" class="w-4 h-4 text-violet-600 focus:ring-violet-500 bg-zinc-950 border-zinc-700">
          <span class="option-label ml-2 font-bold text-violet-300">${opt.label}.</span>
          <span class="text-zinc-200 text-sm ml-1">${formatChemistryForWebHtml(opt.teks)}</span>
        </label>
      `).join("");
    } else {
      const tSoal = (soal.tipe_soal || "").toLowerCase();
      if (tSoal.includes("scramble") || tSoal.includes("acak")) {
        inputHtml = `
          <div class="my-2.5 p-3 rounded-xl bg-zinc-900/80 border border-amber-500/30 space-y-2">
            <label for="student_input_${soal.nomor}" class="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🔤</span>
              <span>Ketik kata hasil susunan huruf di sini:</span>
            </label>
            <input type="text" id="student_input_${soal.nomor}" 
                   class="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-white font-mono text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" 
                   placeholder="Contoh: STOIKIOMETRI">
          </div>
        `;
      } else if (tSoal.includes("jodoh") || tSoal.includes("matching")) {
        inputHtml = `
          <div class="my-2.5 p-3 rounded-xl bg-zinc-900/80 border border-violet-500/30 space-y-2">
            <label for="student_input_${soal.nomor}" class="block text-xs font-bold text-violet-300 flex items-center gap-1.5">
              <span>🧩</span>
              <span>Tuliskan pasangan jawaban (misal: 1-B, 2-D, 3-A, 4-C):</span>
            </label>
            <input type="text" id="student_input_${soal.nomor}" 
                   class="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-violet-500/50 text-white font-mono text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner" 
                   placeholder="1-B, 2-D, 3-A, 4-C">
          </div>
        `;
      } else {
        inputHtml = `
          <textarea id="student_input_${soal.nomor}" rows="4" 
                    class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed" 
                    placeholder="Tuliskan analisis dan langkah penyelesaian Anda di sini..."></textarea>
        `;
      }
    }

    const formattedQuestion = renderQuestionContentForWeb(soal);
    const svgHtml = soal.ilustrasi_svg ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) : "";

    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h5 class="font-bold text-white text-sm sm:text-base">Soal Nomor ${soal.nomor}</h5>
        <span class="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">${soal.tingkat_kesulitan}</span>
      </div>
      <div class="mb-3">${formattedQuestion}</div>
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

  // 1. Evaluasi Interaktif Teka-Teki Silang (TTS 2D)
  const ttsInputs = document.querySelectorAll('input[id^="tts_input_"]');
  if (ttsInputs.length > 0) {
    let ttsCorrect = 0;
    let ttsTotal = ttsInputs.length;
    ttsInputs.forEach(inp => {
      const userVal = (inp.value || "").trim().toUpperCase();
      const expected = (inp.dataset.letter || "").trim().toUpperCase();
      const parentBox = inp.closest('.tts-cell-box') || inp.parentElement;
      if (userVal && userVal === expected) {
        ttsCorrect++;
        inp.classList.remove("text-rose-400", "text-white");
        inp.classList.add("text-emerald-400");
        if (parentBox) {
          parentBox.classList.remove("border-zinc-600", "border-rose-500", "tts-cell-wrong");
          parentBox.classList.add("border-emerald-500", "tts-cell-correct");
        }
      } else {
        inp.classList.remove("text-emerald-400", "text-white");
        inp.classList.add("text-rose-400");
        if (parentBox) {
          parentBox.classList.remove("border-zinc-600", "border-emerald-500", "tts-cell-correct");
          parentBox.classList.add("border-rose-500", "tts-cell-wrong");
        }
      }
    });
    totalPG += ttsTotal;
    correct += ttsCorrect;
  }

  // 2. Evaluasi Soal Non-TTS
  questions.forEach((soal) => {
    if (!soal) return;
    const tSoal = (soal.tipe_soal || "").toLowerCase();
    if (tSoal.includes("tts") || tSoal.includes("silang") || tSoal.includes("crossword")) {
      return; // Sudah dievaluasi di atas via grid sel
    }
    const isUnique = tSoal.includes("scramble") || tSoal.includes("acak") || tSoal.includes("jodoh") || tSoal.includes("matching");

    if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
      totalPG++;
      const checkedRadio = document.querySelector(`input[name="q_${soal.nomor}"]:checked`);
      const feedbackDiv = document.getElementById(`feedback-${soal.nomor}`);
      if (feedbackDiv) {
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
          feedbackDiv.innerHTML = "⚠️ Anda belum menjawab soal ini.";
        }
      }
    } else if (isUnique) {
      totalPG++;
      const studentInput = document.getElementById(`student_input_${soal.nomor}`);
      const feedbackDiv = document.getElementById(`feedback-${soal.nomor}`);
      if (feedbackDiv) {
        feedbackDiv.classList.remove("hidden");
        if (studentInput && studentInput.value.trim()) {
          const userVal = studentInput.value.trim().toUpperCase().replace(/\s+/g, " ");
          const keyVal = (soal.kunci_jawaban || "").trim().toUpperCase().replace(/\s+/g, " ");
          const isMatchClean = userVal.replace(/[^A-Za-z0-9]/g, "") === keyVal.replace(/[^A-Za-z0-9]/g, "");

          if (isMatchClean) {
            correct++;
            feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs";
            feedbackDiv.innerHTML = `✅ <b>Jawaban Tepat!</b> (${studentInput.value.trim()})`;
          } else {
            feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs";
            feedbackDiv.innerHTML = `❌ <b>Kurang Tepat.</b> Jawaban Anda: ${studentInput.value.trim()} | Kunci Jawaban: <b>${soal.kunci_jawaban}</b>`;
          }
        } else {
          feedbackDiv.className = "mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs";
          feedbackDiv.innerHTML = "⚠️ Anda belum menjawab soal ini.";
        }
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
  try {
    const isPearson = (pkg.jenjang || "").toLowerCase().includes("pearson") || (pkg.jenjang || "").toLowerCase().includes("edexcel");
    const isNoStimulus = (pkg.stimulus_model || "").toLowerCase().includes("tanpa stimulus");
    const customTeacher = getCustomTeacherName();
    const customSchool = getCustomSchoolName();

    const headerTitleElem = document.getElementById("printHeaderTitle");
    if (headerTitleElem) {
      headerTitleElem.textContent = isPearson ? "PEARSON EDEXCEL INTERNATIONAL A-LEVEL ASSESSMENT" : "PENILAIAN HARIAN / ASESMEN SUMATIF KIMIA";
    }
    const metaElem = document.getElementById("printMetaText");
    if (metaElem) {
      metaElem.textContent = isPearson 
        ? `Subject: Chemistry | Level: ${pkg.jenjang || 'Pearson Edexcel A-Level'} | Topic: ${pkg.topik_utama || 'Chemistry'}`
        : `Mata Pelajaran: Kimia | Jenjang: ${pkg.jenjang || 'SMA'} | Topik: ${pkg.topik_utama || 'Kimia'}`;
    }

    const lblName = document.getElementById("printLblName");
    const lblNum = document.getElementById("printLblNum");
    const lblClass = document.getElementById("printLblClass");
    const lblDate = document.getElementById("printLblDate");
    if (lblName) lblName.textContent = isPearson ? "NAME" : "Nama Siswa";
    if (lblNum) lblNum.textContent = isPearson ? "STUDENT ID" : "Nomor Absen";
    if (lblClass) lblClass.textContent = isPearson ? "CLASS" : "Kelas / Fase";
    if (lblDate) lblDate.textContent = isPearson ? "DATE" : "Hari / Tanggal";

    const studentIdBox = document.getElementById("printStudentIdentityBox");
    if (studentIdBox) {
      if (isPearson) {
        studentIdBox.innerHTML = `
          <table style="width: 100%; border: 1.5pt solid #000; border-collapse: collapse; margin-top: 8pt; font-family: Arial, sans-serif;">
            <tr>
              <td style="padding: 6pt 8pt; border: 1pt solid #000; width: 45%; font-size: 9.5pt; vertical-align: top;">
                <b>Candidate surname:</b> ....................................................<br><br>
                <b>Other names:</b> ............................................................
              </td>
              <td style="padding: 6pt 8pt; border: 1pt solid #000; width: 25%; text-align: center; font-size: 9pt; vertical-align: top;">
                <b>Centre Number</b><br>
                <table align="center" style="margin: 4pt auto 0 auto; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                  </tr>
                </table>
              </td>
              <td style="padding: 6pt 8pt; border: 1pt solid #000; width: 30%; text-align: center; font-size: 9pt; vertical-align: top;">
                <b>Candidate Number</b><br>
                <table align="center" style="margin: 4pt auto 0 auto; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 6pt 8pt; background-color: #f8fafc; border-top: 1.5pt solid #000; font-size: 8.5pt; color: #334155; line-height: 1.35;">
                <b>Instructions to Candidates:</b> Answer <b>ALL</b> questions. • Use black ink or ball-point pen. • Fill in the boxes at the top of this page with your name, centre number and candidate number. • Show all stages in calculations and state the correct units.
              </td>
            </tr>
          </table>
        `;
      } else {
        studentIdBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <div>
              <span id="printLblName">Nama Siswa</span> : .....................................................<br>
              <span id="printLblNum">Nomor Absen</span>: .....................................................
            </div>
            <div>
              <span id="printLblClass">Kelas / Fase</span>: .....................................................<br>
              <span id="printLblDate">Hari / Tanggal</span>: .....................................................
            </div>
          </div>
        `;
      }
    }

    const qContainer = document.getElementById("printQuestionsContent");
    const sContainer = document.getElementById("printSolutionsContent");
    if (!qContainer || !sContainer) return;
    qContainer.innerHTML = "";
    sContainer.innerHTML = "";

    const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
    let questionsA = pkg.daftar_soal || [];
    let questionsB = pkg.daftar_soal_paket_b || [];

    if (exportSavedOnly && savedQuestions && savedQuestions.length > 0) {
      const pinnedA = questionsA.filter(q => q && q.is_pinned === true);
      const pinnedB = questionsB.length > 0 ? questionsB.filter(q => q && q.is_pinned === true) : [];
      if (pinnedA.length > 0 || pinnedB.length > 0) {
        questionsA = pinnedA;
        questionsB = pinnedB;
      } else {
        questionsA = savedQuestions;
        questionsB = [];
      }
    }

    // JAMINAN MUTLAK: Jangan biarkan questionsA kosong jika paket memiliki butir soal!
    if ((!questionsA || questionsA.length === 0) && pkg.daftar_soal && pkg.daftar_soal.length > 0) {
      questionsA = pkg.daftar_soal;
    }

    const renderPrintQuestions = (questions, labelPaket) => {
      const paperHead = isPearson ? 'EXAMINATION PAPER' : 'LEMBAR SOAL';
      let html = `<h4 style="margin: 14pt 0 8pt 0; text-decoration: underline; font-weight: bold; font-size: 11.5pt; color: #1e3a8a;">${paperHead} ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;

      const ttsQuestions = (questions || []).filter(q => {
        const t = (q.tipe_soal || "").toLowerCase();
        return t.includes("tts") || t.includes("silang") || t.includes("crossword");
      });
      const nonTtsQuestions = (questions || []).filter(q => !ttsQuestions.includes(q));

      if (ttsQuestions.length > 0) {
        const ttsItems = ttsQuestions.map(q => ({
          word: (q.kunci_jawaban || "").toUpperCase().replace(/[^A-Z]/g, ""),
          clue: cleanTtsClue(q.pertanyaan),
          soal: q
        }));
        const layout = generateCrosswordLayout(ttsItems, 80);
        if (layout) {
          html += renderCrosswordTableForWord(layout, true);
        }
      }

      if (nonTtsQuestions.length > 0) {
        if (ttsQuestions.length > 0) {
          html += `<div style="page-break-before: always; margin-top: 14pt;"><hr style="border: none; border-top: 1.5px solid #000;"/></div>`;
        }
        nonTtsQuestions.forEach((soal) => {
        if (!soal) return;

        const metaParts = [];
        if (soal.topik) metaParts.push(isPearson ? `Topic: ${soal.topik}` : `Elemen/Topik: ${soal.topik}`);
        if (soal.subtopik) metaParts.push(isPearson ? `Subtopic: ${soal.subtopik}` : `Subtopik: ${soal.subtopik}`);
        if (soal.tingkat_kesulitan) metaParts.push(isPearson ? `Level: ${soal.tingkat_kesulitan}` : `Tingkat Kesulitan: ${soal.tingkat_kesulitan}`);
        if (soal.tipe_soal) metaParts.push(isPearson ? `Type: ${soal.tipe_soal}` : `Bentuk: ${soal.tipe_soal}`);
        const metaText = metaParts.join(" · ");

        const parsed = splitQuestionContentForWord(soal, isNoStimulus);
        const isStructuredOrEssay = (soal.tipe_soal || "").toLowerCase().includes("uraian") ||
                                    (soal.tipe_soal || "").toLowerCase().includes("esai") ||
                                    (soal.tipe_soal || "").toLowerCase().includes("structured") ||
                                    isPearson ||
                                    (!soal.pilihan_jawaban || soal.pilihan_jawaban.length === 0);

        let optText = "";
        let promptTextHtml = "";
        if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
          promptTextHtml = `<div style="text-align: justify; line-height: 1.45; font-size: 10.5pt; margin: 4pt 0 4pt 0; color: #0f172a;">${parseMarkdownTable(parsed.prompt)}</div>`;
          optText = soal.pilihan_jawaban.map(o => `
            <div style="margin-left: 18pt; margin-top: 2.5pt; margin-bottom: 2.5pt; text-align: justify; line-height: 1.45;">
              <b>${o.label}.</b> ${o.teks}
            </div>
          `).join("");
        } else {
          promptTextHtml = formatPromptWithSubpartsAndDotsForWord(parsed.prompt, isStructuredOrEssay);
          optText = "";
        }

        const svgHtml = (soal.ilustrasi_svg && soal.ilustrasi_svg.includes("<svg")) 
          ? renderSvgIllustration(soal.ilustrasi_svg, soal.caption_ilustrasi) 
          : "";

        const hasStimulusBox = Boolean(!isNoStimulus && (parsed.stimulus || parsed.tableMarkdown));

        html += `
          <div style="margin-bottom: 14pt; page-break-inside: avoid;">
            <div style="font-size: 9pt; color: #475569; margin-bottom: 3pt; line-height: 1.35;">
              <b>${soal.nomor}.</b> ${metaText}
            </div>

            ${hasStimulusBox ? `
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8pt 12pt; margin: 4pt 0 6pt 0;">
                ${parsed.stimulus ? `<div style="text-align: justify; line-height: 1.45; margin-bottom: ${parsed.tableMarkdown ? '6pt' : '0'}; color: #1e293b; font-size: 10pt;">${parsed.stimulus}</div>` : ''}
                ${parsed.tableMarkdown ? parseMarkdownTable(parsed.tableMarkdown) : ''}
              </div>
            ` : ''}

            ${promptTextHtml}
            ${svgHtml}
            ${optText}
          </div>
        `;
      });
      }
      return html;
    };

    const renderPrintSolutions = (questions, labelPaket) => {
      const solHead = isPearson ? 'MARK SCHEME &amp; WORKED SOLUTIONS (For Teacher)' : 'KUNCI JAWABAN &amp; PEMBAHASAN (untuk guru)';
      let html = `<h4 style="margin: 16pt 0 8pt 0; text-decoration: underline; font-weight: bold; font-size: 11.5pt; color: #991b1b;">${solHead} ${labelPaket ? '(' + labelPaket + ')' : ''}</h4>`;
      
      const hasDetailedSteps = questions.some(q => q && Array.isArray(q.pembahasan_langkah) && q.pembahasan_langkah.length > 0 && !q.pembahasan_langkah[0].toLowerCase().includes("mode fokus"));

      if (!hasDetailedSteps) {
        let cells = questions.map(q => `
          <td style="border: 1px solid #cbd5e1; padding: 4pt 8pt; text-align: center; font-size: 10pt; background: #fff;">
            <b>No. ${q.nomor}</b><br><span style="font-weight: bold; font-size: 11pt; color: #15803d;">${formatChemistryForWordHtml(q.kunci_jawaban || '-')}</span>
          </td>
        `).join("");
        html += `
          <div style="margin: 6pt 0 12pt 0; page-break-inside: avoid;">
            <p style="font-size: 9pt; color: #64748b; margin-bottom: 4pt; font-style: italic;">*${isPearson ? 'Mark Scheme Summary Matrix (Exam Mode)' : 'Matriks Kunci Jawaban Singkat (Mode Naskah Soal)'}:</p>
            <table style="border-collapse: collapse; margin-top: 4pt; border: 1px solid #cbd5e1;">
              <tr>${cells}</tr>
            </table>
          </div>
        `;
        return html;
      }

      questions.forEach((soal) => {
        if (!soal) return;
        const stepsList = Array.isArray(soal.pembahasan_langkah) ? soal.pembahasan_langkah : [];
        const steps = stepsList.map(st => `<li>${formatChemistryForWordHtml(st)}</li>`).join("");
        const parsedKey = parseStructuredQuestionContent(soal.kunci_jawaban || "");
        const isMultiKey = parsedKey.hasSubparts && parsedKey.subparts.length > 0;
        const keyHtml = formatAnswerKeyForWordHtml(soal.kunci_jawaban);
        html += `
          <div style="margin-bottom: 10pt; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">${soal.nomor}. ${isPearson ? 'Key / Answer' : 'Kunci'}: ${isMultiKey ? '' : keyHtml}</div>
            ${isMultiKey ? `<div style="margin-left: 12pt; margin-top: 2pt; margin-bottom: 4pt;">${keyHtml}</div>` : ''}
            <div style="text-align: justify; line-height: 1.45; font-size: 10pt; margin: 2pt 0 4pt 0;">
              <b>${isPearson ? 'Mark Scheme &amp; Worked Solutions:' : 'Pembahasan:'}</b>
              <ul style="margin: 2pt 0 0 0; padding-left: 18pt;">${steps}</ul>
            </div>
            ${soal.tips_atau_jebakan ? `<div style="font-size: 9.5pt; font-style: italic; color: #475569; margin: 2pt 0 0 18pt; text-align: justify;">💡 ${isPearson ? 'Tip / Common Misconception' : 'Tips'}: ${formatChemistryForWordHtml(soal.tips_atau_jebakan)}</div>` : ''}
          </div>
        `;
      });
      return html;
    };

    const labelSetA = questionsB.length > 0 ? (isPearson ? "SET A" : "PAKET A") : "";
    const labelSetB = isPearson ? "SET B" : "PAKET B";

    qContainer.innerHTML = renderPrintQuestions(questionsA, labelSetA);
    sContainer.innerHTML = renderPrintSolutions(questionsA, labelSetA);

    if (questionsB.length > 0) {
      qContainer.innerHTML += `<div class="page-break"></div>` + renderPrintQuestions(questionsB, labelSetB);
      sContainer.innerHTML += `<div class="page-break"></div>` + renderPrintSolutions(questionsB, labelSetB);
    }

    // Render KaTeX untuk dokumen cetak
    const printSheet = document.getElementById("printExamSheet");
    if (window.renderMathInElement && printSheet) {
      renderMathInElement(printSheet, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  } catch (err) {
    console.error("Gagal me-render tata letak cetak PDF:", err);
  }
}

// PEMBERSIH LATEX UNTUK PLAIN TEXT
function cleanLatex(text) {
  if (!text) return "";
  let s = formatChemistryText(text);

  // Preservasi fungsi matematika
  s = s.replace(/\\log\\b/g, "log")
       .replace(/\\ln\\b/g, "ln")
       .replace(/\\sin\\b/g, "sin")
       .replace(/\\cos\\b/g, "cos")
       .replace(/\\tan\\b/g, "tan")
       .replace(/\\approx/g, "≈")
       .replace(/\\neq/g, "≠")
       .replace(/\\leq?/g, "≤")
       .replace(/\\geq?/g, "≥");

  // Bersihkan pecahan: \frac{a}{b} -> (a)/b
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/$2");

  // Bersihkan \text{...} berulang secara aman
  let loopCount = 0;
  while (/\\text\{[^{}]*\}/.test(s) && loopCount++ < 10) {
    s = s.replace(/\\text\{([^{}]*)\}/g, "$1");
  }
  s = s.replace(/\\text\{/g, "").replace(/\\text\b/g, "");

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
  const btnPrint = document.getElementById("btnPrintExam");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      if (!currentPackage) {
        alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
        return;
      }
      const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
      if (exportSavedOnly && (!savedQuestions || savedQuestions.length === 0)) {
        const chk = document.getElementById("chkExportSavedOnly");
        if (chk) chk.checked = false;
        alert("ℹ️ Catatan: Belum ada butir soal yang ditandai bintang (📌).\n\nSistem mencetak seluruh naskah soal agar lembar ujian tidak kosong.");
      }
      renderPrintLayout(currentPackage);
      setTimeout(() => {
        window.print();
      }, 350);
    });
  }

  // Modal Pilihan Ekspor Word A4 (Versi Siswa vs Versi Guru)
  const btnExportWord = document.getElementById("btnExportWord");
  if (btnExportWord) {
    btnExportWord.addEventListener("click", () => {
      if (!currentPackage) {
        alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
        return;
      }
      openWordExportModal();
    });
  }

  const btnConfirmWord = document.getElementById("btnConfirmWordExport");
  if (btnConfirmWord) {
    btnConfirmWord.addEventListener("click", () => {
      confirmWordExport();
    });
  }

  document.getElementById("btnExportExcelQuizizz").addEventListener("click", () => {
    if (!currentPackage) {
      alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
      return;
    }
    exportToQuizizzExcel(currentPackage);
  });

  document.getElementById("btnExportMarkdown").addEventListener("click", () => {
    if (!currentPackage) {
      alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
      return;
    }
    exportToMarkdownFile(currentPackage);
  });

  document.getElementById("btnExportJson").addEventListener("click", () => {
    if (!currentPackage) {
      alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
      return;
    }
    exportToJsonFile(currentPackage);
  });

  const btnSaveCloud = document.getElementById("btnSaveToCloudBank");
  if (btnSaveCloud) {
    btnSaveCloud.addEventListener("click", async () => {
      if (!currentPackage) return;
      const existingLabels = currentPackage.metadata && Array.isArray(currentPackage.metadata.labels) ? currentPackage.metadata.labels.join(", ") : "";
      const labels = prompt("Tambahkan label untuk pencarian bank soal (pisahkan dengan koma):", existingLabels);
      if (labels === null) return;
      currentPackage.metadata = Object.assign({}, currentPackage.metadata || {}, {
        labels: labels.split(",").map(function(tag) { return tag.trim(); }).filter(Boolean),
        topik_materi: currentPackage.topik_utama,
        kelas: currentPackage.jenjang,
        tingkat_kesulitan: currentPackage.daftar_soal && currentPackage.daftar_soal[0] ? currentPackage.daftar_soal[0].tingkat_kesulitan : "Campuran",
        model_stimulus: currentPackage.stimulus_model
      });
      const localSaved = saveCurrentPackageToLocalBank(labels);
      const gasUrl = getGasUrl();
      if (!gasUrl) {
        alert("⚠️ Backend Google Apps Script belum dikonfigurasi di config.js.");
        return;
      }

      btnSaveCloud.disabled = true;
      const oldHtml = btnSaveCloud.innerHTML;
      btnSaveCloud.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-purple-400"></i><span>Menyimpan...</span>`;
      if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();

      try {
        const token = getGeneratorAccessToken();
        const resp = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "simpanBankSoal",
            accessToken: token,
            teacherToken: token,
            dataSoal: currentPackage
          })
        });

        const result = await resp.json();
        if (result.status === "ok") {
          alert(`✅ BERHASIL DISIMPAN KE CLOUD!\n\nGoogle Spreadsheet Bank Soal berhasil diperbarui dan ditempatkan di folder Drive. ${localSaved ? 'Salinan lokal juga tersimpan di browser.' : 'Salinan lokal gagal disimpan karena ruang browser penuh.'}\n${result.spreadsheetUrl ? 'Buka spreadsheet: ' + result.spreadsheetUrl : ''}${result.driveFolderUrl ? '\nFolder Drive: ' + result.driveFolderUrl : ''}`);
        } else {
          alert(`❌ Gagal menyimpan ke Spreadsheet: ${result.message || 'Terjadi kesalahan di server GAS'}`);
        }
      } catch (err) {
        alert(`❌ Gagal menghubungi backend GAS: ${err.message}`);
      } finally {
        btnSaveCloud.disabled = false;
        btnSaveCloud.innerHTML = oldHtml;
        if (typeof window !== "undefined" && window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
      }
    });
  }
  const btnSaveDocs = document.getElementById("btnSaveGeneratedToDocs");
  let docsSaveRequestId = null;
  let docsSavePackageSignature = "";
  if (btnSaveDocs) btnSaveDocs.addEventListener("click", async function() {
    if (!currentPackage) return;
    const gasUrl = getGasUrl();
    if (!gasUrl) { alert("Backend Google Apps Script belum dikonfigurasi di config.js."); return; }
    const teacherToken = getGeneratorAccessToken() || localStorage.getItem("portal_generator_docs_token");
    if (!teacherToken) {
      alert("⚠️ Token akses guru belum diatur. Silakan masukkan token guru di pojok kanan atas.");
      return;
    }
    const signature = JSON.stringify(currentPackage);
    if (signature !== docsSavePackageSignature || !docsSaveRequestId) {
      docsSavePackageSignature = signature;
      docsSaveRequestId = "docs-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
    }
    btnSaveDocs.disabled = true;
    const oldText = btnSaveDocs.textContent;
    btnSaveDocs.textContent = "Menyimpan ke Docs…";
    try {
      // Siapkan data terformat khusus Google Docs (Unicode murni tanpa tag HTML)
      const docsPackage = JSON.parse(JSON.stringify(currentPackage));
      const cleanListDocs = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(q => {
          if (!q) return;
          const tSoal = (q.tipe_soal || "").toLowerCase();
          const isTts = tSoal.includes("tts") || tSoal.includes("silang") || tSoal.includes("crossword");
          q.pertanyaan = formatChemistryForGoogleDocsText(isTts ? cleanTtsClue(q.pertanyaan) : q.pertanyaan);
          if (Array.isArray(q.pilihan_jawaban)) {
            q.pilihan_jawaban.forEach(opt => {
              opt.teks = formatChemistryForGoogleDocsText(opt.teks);
            });
          }
          if (q.kunci_jawaban) {
            q.kunci_jawaban = isTts ? (q.kunci_jawaban || "").toUpperCase().replace(/[^A-Z]/g, "") : formatChemistryForGoogleDocsText(q.kunci_jawaban);
          }
          if (Array.isArray(q.pembahasan_langkah)) {
            q.pembahasan_langkah = q.pembahasan_langkah.map(st => formatChemistryForGoogleDocsText(st));
          }
          if (q.tips_atau_jebakan) {
            q.tips_atau_jebakan = formatChemistryForGoogleDocsText(q.tips_atau_jebakan);
          }
        });
      };
      cleanListDocs(docsPackage.daftar_soal);
      cleanListDocs(docsPackage.daftar_soal_paket_b);

      // Cek apakah ada soal TTS untuk di-render grid canvas PNG dan layout
      const allQ = docsPackage.daftar_soal || [];
      const ttsQ = allQ.filter(q => {
        const t = (q.tipe_soal || "").toLowerCase();
        return t.includes("tts") || t.includes("silang") || t.includes("crossword");
      });

      if (ttsQ.length > 0) {
        const ttsItems = ttsQ.map(q => ({
          word: (q.kunci_jawaban || "").toUpperCase().replace(/[^A-Z]/g, ""),
          clue: cleanTtsClue(q.pertanyaan),
          soal: q
        }));
        const layout = generateCrosswordLayout(ttsItems, 80);
        if (layout) {
          docsPackage.crosswordLayout = layout;
          docsPackage.crosswordPngBase64 = renderCrosswordToPngBase64(layout);
        }
      }

      const response = await fetch(gasUrl, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "buatGoogleDoc",
          teacherToken: teacherToken,
          accessToken: teacherToken,
          requestId: docsSaveRequestId,
          dataSoal: docsPackage
        })
      });
      const result = await response.json();
      if (result.status !== "ok") {
        throw new Error(result.message || "GAS gagal membuat Google Docs.");
      }
      docsSaveRequestId = null;
      docsSavePackageSignature = "";
      alert((result.alreadySaved ? "Dokumen sebelumnya ditemukan." : "Paket berhasil disimpan ke Google Docs.") + "\n" + (result.docUrl || ""));
      if (result.docUrl) window.open(result.docUrl, "_blank", "noopener");
    } catch (err) {
      alert("Gagal menyimpan ke Google Docs: " + err.message);
    } finally {
      btnSaveDocs.disabled = false;
      btnSaveDocs.textContent = oldText;
    }
  });

  const btnClear = document.getElementById("btnClearPackage");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (!currentPackage) {
        alert("ℹ️ Halaman sudah dalam keadaan kosong.");
        return;
      }
      const confirmClear = confirm(
        "⚠️ PERINGATAN PENTING:\n\n" +
        "Apakah Anda sudah mengunduh atau mencadangkan naskah soal ini (ke Word, Docs, atau Spreadsheet)?\n\n" +
        "Jika belum diunduh, seluruh butir soal yang telah dibuat di layar ini akan dihapus permanen.\n\n" +
        "Apakah Anda yakin ingin mengosongkan halaman untuk membuat naskah soal baru?"
      );
      if (!confirmClear) return;

      currentPackage = null;
      savedQuestions = [];
      filterSavedOnly = false;
      try {
        localStorage.removeItem(LAST_GENERATED_DRAFT_KEY);
      } catch (e) {}

      const resultsSection = document.getElementById("resultsSection");
      if (resultsSection) resultsSection.classList.add("hidden");

      const qContainer = document.getElementById("questionsContainer");
      if (qContainer) qContainer.innerHTML = "";

      const autoBadge = document.getElementById("autoBackupBadge");
      if (autoBadge) autoBadge.className = "hidden";

      updateSavedCountBadge();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

// EXCEL QUIZIZZ EXPORTER (.xlsx via SheetJS)
function exportToQuizizzExcel(pkg) {
  if (!window.XLSX) {
    alert("Library SheetJS (XLSX) sedang dimuat. Silakan coba lagi sesaat lagi.");
    return;
  }

  if (!pkg) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }

  try {
    const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
    let questionsA = pkg.daftar_soal || [];
    let questionsB = pkg.daftar_soal_paket_b || [];

    if (exportSavedOnly) {
      if (savedQuestions && savedQuestions.length > 0) {
        const pinnedA = questionsA.filter(q => q && q.is_pinned === true);
        const pinnedB = questionsB.length > 0 ? questionsB.filter(q => q && q.is_pinned === true) : [];
        if (pinnedA.length > 0 || pinnedB.length > 0) {
          questionsA = pinnedA;
          questionsB = pinnedB;
        } else {
          questionsA = savedQuestions;
          questionsB = [];
        }
      } else {
        const chk = document.getElementById("chkExportSavedOnly");
        if (chk) chk.checked = false;
        alert("ℹ️ Catatan: Belum ada butir soal yang ditandai bintang (📌).\n\nSeluruh butir soal diekspor ke Quizizz Excel agar file tidak kosong.");
        questionsA = pkg.daftar_soal || [];
        questionsB = pkg.daftar_soal_paket_b || [];
      }
    }

    if ((!questionsA || questionsA.length === 0) && pkg.daftar_soal && pkg.daftar_soal.length > 0) {
      questionsA = pkg.daftar_soal;
    }

    if (!questionsA || questionsA.length === 0) {
      alert("⚠️ Naskah soal tidak memiliki butir soal yang dapat diekspor. Silakan generate soal terlebih dahulu.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const prepareQuizizzRows = (questions) => {
      const rows = [
        ["Question Text", "Question Type", "Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Correct Answer", "Time in seconds", "Image Link", "Explanation"]
      ];

      (questions || []).forEach((q) => {
        if (!q) return;
        let opt1 = "", opt2 = "", opt3 = "", opt4 = "", opt5 = "";
        if (q.pilihan_jawaban) {
          q.pilihan_jawaban.forEach(o => {
            const l = String(o.label || "").toUpperCase();
            if (l === 'A') opt1 = cleanLatex(o.teks);
            else if (l === 'B') opt2 = cleanLatex(o.teks);
            else if (l === 'C') opt3 = cleanLatex(o.teks);
            else if (l === 'D') opt4 = cleanLatex(o.teks);
            else if (l === 'E') opt5 = cleanLatex(o.teks);
          });
        }

        let correctIdx = 1;
        const keyUpper = String(q.kunci_jawaban || "A").toUpperCase().trim();
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

    const fileName = `Quizizz_${(pkg.judul || "Asesmen_Kimia").replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (err) {
    alert("❌ Gagal mengekspor file Quizizz Excel: " + err.message);
  }
}

// HELPER PEMISAH KONTEN STIMULUS, TABEL, DAN PROMPT UNTUK WORD & PRINT
function splitQuestionContentForWord(soal, isNoStimulus = false) {
  if (!soal) return { stimulus: "", tableMarkdown: "", prompt: "" };
  const rawText = String(soal.pertanyaan || "").trim();
  const lines = rawText.split(/\r?\n/);
  let inTable = false;
  let beforeLines = [];
  let tableLines = [];
  let afterLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableLine = line.includes("|") && (line.split("|").length >= 3);
    if (isTableLine) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) {
        afterLines.push(lines[i]);
      } else {
        beforeLines.push(lines[i]);
      }
    }
  }

  const hasTable = tableLines.length >= 2;
  if (isNoStimulus) {
    return {
      stimulus: "",
      tableMarkdown: hasTable ? tableLines.join("\n") : "",
      prompt: rawText
    };
  }

  const stimulusText = soal.stimulus ? String(soal.stimulus).trim() : (hasTable ? beforeLines.join("\n").trim() : "");
  const tableMarkdown = hasTable ? tableLines.join("\n") : "";
  const promptText = hasTable ? afterLines.join("\n").trim() : (stimulusText ? afterLines.join("\n").trim() : rawText);

  return {
    stimulus: stimulusText,
    tableMarkdown: tableMarkdown,
    prompt: promptText || rawText
  };
}

/**
 * FORMATTER SUB-PERTANYAAN URAIAN TERSTRUKTUR & GARIS LEMBAR JAWAB UNTUK WORD
 * Mengubah baris sub-soal a), b), c) menjadi paragraf berbobot skor diikuti garis titik-titik
 * untuk tempat siswa menulis jawaban tangan secara langsung (sesuai format exam paper Pearson Edexcel).
 */
function formatPromptWithSubpartsAndDotsForWord(promptText, isStructuredOrEssay = false) {
  if (!promptText) return "";
  let formatted = formatChemistryForWordHtml(promptText);

  if (!isStructuredOrEssay) {
    return `<div style="text-align: justify; text-justify: inter-ideograph; line-height: 1.5; margin: 6pt 0 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">${formatted}</div>`;
  }

  const parsedSub = parseStructuredQuestionContent(promptText);

  // Garis lembar jawab presisi berbasis tabel agar TIDAK memicu zoom out 14% di WPS/Word
  const makeDottedLines = (linesCount = 2) => {
    let rows = [];
    for (let i = 0; i < linesCount; i++) {
      rows.push(`<tr><td style="border: none; border-bottom: 1pt dotted #475569; height: 18pt; padding: 0; font-size: 1pt; mso-line-height-rule: exactly; line-height: 18pt;">&nbsp;</td></tr>`);
    }
    return `
      <table cellpadding="0" cellspacing="0" style="width: 100%; border: none; border-collapse: collapse; margin-top: 4pt; margin-bottom: 8pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        ${rows.join("\n")}
      </table>
    `;
  };

  if (parsedSub.hasSubparts && parsedSub.subparts.length > 0) {
    let out = [];
    if (parsedSub.stem) {
      out.push(`<div style="margin-top: 4pt; margin-bottom: 4pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; text-align: justify; text-justify: inter-ideograph; line-height: 1.5;">${formatChemistryForWordHtml(parsedSub.stem)}</div>`);
    }
    parsedSub.subparts.forEach(sub => {
      let cleanText = sub.text;
      let markBadge = "";
      let linesCount = 2;

      // Cek apakah ada mark: [1 mark], [2 marks], dll
      const markMatch = cleanText.match(/(?:\[|\()(\d+)\s*(?:marks?|mark|skor|poin)?(?:\bin total\b)?(?:\]|\))$/i);
      if (markMatch) {
        const markVal = parseInt(markMatch[1], 10);
        markBadge = `<div style="text-align: right; font-weight: bold; font-size: 11pt; font-family: 'Times New Roman', Times, serif; color: #000000; margin-top: 2pt;">(${markVal})</div>`;
        cleanText = cleanText.substring(0, markMatch.index).trim();
        linesCount = markVal === 1 ? 2 : (markVal === 2 ? 4 : 6);
      }

      const romanParts = splitRomanSubparts(cleanText);
      if (romanParts.length > 1) {
        out.push(`<div style="margin-top: 6pt; margin-bottom: 2pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; text-align: justify; text-justify: inter-ideograph; line-height: 1.5;"><b>${sub.label}</b></div>`);
        romanParts.forEach(rp => {
          if (rp.label) {
            let rText = rp.text;
            let rBadge = "";
            let rLines = 2;
            const rMatch = rText.match(/(?:\[|\()(\d+)\s*(?:marks?|mark|skor|poin)?(?:\bin total\b)?(?:\]|\))$/i);
            if (rMatch) {
              const rVal = parseInt(rMatch[1], 10);
              rBadge = `<div style="text-align: right; font-weight: bold; font-size: 11pt; font-family: 'Times New Roman', Times, serif; color: #000000; margin-top: 2pt;">(${rVal})</div>`;
              rText = rText.substring(0, rMatch.index).trim();
              rLines = rVal === 1 ? 2 : (rVal === 2 ? 4 : 6);
            }
            out.push(`<div style="margin-top: 3pt; margin-bottom: 2pt; margin-left: 18pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; text-align: justify; text-justify: inter-ideograph; line-height: 1.5;"><b>${rp.label}</b> ${formatChemistryForWordHtml(rText)}</div>`);
            if (rBadge) out.push(rBadge);
            out.push(makeDottedLines(rLines));
          } else {
            out.push(`<div style="margin-top: 2pt; margin-bottom: 2pt; margin-left: 18pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; text-align: justify; text-justify: inter-ideograph; line-height: 1.5;">${formatChemistryForWordHtml(rp.text)}</div>`);
          }
        });
      } else {
        out.push(`<div style="margin-top: 6pt; margin-bottom: 2pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; text-align: justify; text-justify: inter-ideograph; line-height: 1.5;"><b>${sub.label}</b> ${formatChemistryForWordHtml(cleanText)}</div>`);
        if (markBadge) out.push(markBadge);
        out.push(makeDottedLines(linesCount));
      }
    });

    const totMatch = promptText.match(/(?:\[|\()(?:Total for Question \d+ = (\d+) marks?|Total:\s*(\d+)\s*marks?)(?:\]|\))/i);
    if (totMatch) {
      const tot = totMatch[1] || totMatch[2];
      out.push(`<div style="text-align: right; font-weight: bold; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000; margin-top: 6pt; margin-bottom: 12pt;">(Total for Question = ${tot} marks)</div>`);
    }

    return out.join("");
  } else {
    // Soal esai biasa tanpa subparts
    const bigDots = makeDottedLines(4);
    return `<div style="text-align: justify; text-justify: inter-ideograph; line-height: 1.5; margin: 6pt 0 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">${formatted}</div>` + bigDots;
  }
}

function openWordExportModal() {
  if (!currentPackage) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }
  const modal = document.getElementById("modalWordExport");
  if (modal) {
    modal.classList.remove("hidden");
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
}

function closeWordExportModal() {
  const modal = document.getElementById("modalWordExport");
  if (modal) modal.classList.add("hidden");
}

function confirmWordExport() {
  if (!currentPackage) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }
  const selected = document.querySelector('input[name="wordExportOption"]:checked');
  const mode = selected ? selected.value : 'guru';
  const btn = document.getElementById("btnConfirmWordExport");
  const oldHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-white"></i><span>Menyiapkan File Word...</span>`;
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }
  setTimeout(() => {
    try {
      exportToWordDocx(currentPackage, mode);
    } catch (err) {
      alert("❌ Gagal mengunduh file Word: " + err.message);
    } finally {
      if (btn) btn.innerHTML = oldHtml;
      if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
      closeWordExportModal();
    }
  }, 100);
}

// Pasang ke window agar selalu dapat dipanggil langsung dari onclick
window.openWordExportModal = openWordExportModal;
window.closeWordExportModal = closeWordExportModal;
window.confirmWordExport = confirmWordExport;

// HELPER CANVAS: Render Grid TTS 2D ke format Gambar PNG Base64 untuk Google Docs
function renderCrosswordToPngBase64(layout) {
  if (!layout || !layout.grid || !layout.width || !layout.height) return null;
  try {
    const canvas = document.createElement("canvas");
    const cellSize = 32;
    const pad = 20;
    canvas.width = layout.width * cellSize + pad * 2;
    canvas.height = layout.height * cellSize + pad * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background putih bersih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < layout.height; r++) {
      for (let c = 0; c < layout.width; c++) {
        const cell = layout.grid[r][c];
        if (cell) {
          const x = pad + c * cellSize;
          const y = pad + r * cellSize;

          // Kotak putih
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, y, cellSize, cellSize);

          // Garis border hitam tegas
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(x, y, cellSize, cellSize);

          // Nomor soal di pojok kiri atas
          if (cell.number) {
            ctx.fillStyle = "#000000";
            ctx.font = "bold 9px Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(String(cell.number), x + 3, y + 2.5);
          }
        }
      }
    }

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Gagal membuat canvas PNG crossword:", err);
    return null;
  }
}

// HELPER FORMAT KIMIA UNICODE MURNI UNTUK GOOGLE DOCS (TANPA TAG HTML, TANPA RAW LATEX)
function formatChemistryForGoogleDocsText(text) {
  if (!text) return "";
  let s = String(text);

  // Bersihkan persentase & koma desimal LaTeX
  s = s.replace(/\$\s*([0-9]+(?:\{,\}|,|\.)?[0-9]*)\s*(?:\\%|%)(?:\s*\$)?/g, (m, p1) => p1.replace(/\{,\}/g, ",") + "%");
  s = s.replace(/([0-9]+)\{,\}([0-9]+)/g, "$1,$2");
  s = s.replace(/\{,\}/g, ",");
  s = s.replace(/\\%/g, "%");

  // Bersihkan wrapper teks LaTeX
  let loop = 0;
  while (/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/.test(s) && loop++ < 10) {
    s = s.replace(/\\(?:text|mathrm|mathbf|ce|operatorname|textit|textbf|underline|mathit)\{([^{}]*)\}/g, "$1");
  }
  s = s.replace(/\\(?:text|mathrm|mathbf|ce)\b/g, "");

  // Pecahan \frac{num}{den}
  let fIdx, fSafety = 0;
  while ((fIdx = s.indexOf('\\frac')) !== -1 && fSafety++ < 20) {
    let p = fIdx + 5;
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') { s = s.replace('\\frac', ''); break; }
    let b1Start = p, depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let num = s.slice(b1Start + 1, p - 1);
    while (p < s.length && (s[p] === ' ' || s[p] === '\t')) p++;
    if (s[p] !== '{') break;
    let b2Start = p;
    depth = 1;
    p++;
    while (p < s.length && depth > 0) {
      if (s[p] === '{') depth++;
      else if (s[p] === '}') depth--;
      p++;
    }
    if (depth !== 0) break;
    let den = s.slice(b2Start + 1, p - 1);
    s = s.slice(0, fIdx) + '(' + num + ' / ' + den + ')' + s.slice(p);
  }

  const subMap = {
    '0':'₀', '1':'₁', '2':'₂', '3':'₃', '4':'₄', '5':'₅', '6':'₆', '7':'₇', '8':'₈', '9':'₉',
    '+':'₊', '-':'₋', '=':'₌', '(':'₍', ')':'₎',
    'a':'ₐ', 'e':'ₑ', 'h':'ₕ', 'i':'ᵢ', 'j':'ⱼ', 'k':'ₖ', 'l':'ₗ', 'm':'ₘ', 'n':'ₙ', 'o':'ₒ', 'p':'ₚ', 'r':'ᵣ', 's':'ₛ', 't':'ₜ', 'u':'ᵤ', 'v':'ᵥ', 'x':'ₓ'
  };

  const supMap = {
    '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹',
    '+':'⁺', '-':'⁻', '=':'⁼', '(':'⁽', ')':'⁾',
    'a':'ᵃ', 'b':'ᵇ', 'c':'ᶜ', 'd':'ᵈ', 'e':'ᵉ', 'f':'ᶠ', 'g':'ᵍ', 'h':'ʰ', 'i':'ⁱ', 'j':'ʲ',
    'k':'ᵏ', 'l':'ˡ', 'm':'ᵐ', 'n':'ⁿ', 'o':'ᵒ', 'p':'ᵖ', 'r':'ʳ', 's':'ˢ', 't':'ᵗ', 'u':'ᵘ',
    'v':'ᵛ', 'w':'ʷ', 'x':'ˣ', 'y':'ʸ', 'z':'ᶻ'
  };

  // Ubah HTML sub dan sup ke Unicode
  s = s.replace(/<sub>(.*?)<\/sub>/gi, (_, p1) => p1.split('').map(ch => subMap[ch] || ch).join(''));
  s = s.replace(/<sup>(.*?)<\/sup>/gi, (_, p1) => p1.split('').map(ch => supMap[ch] || ch).join(''));

  // LaTeX subscripts & superscripts
  s = s.replace(/_\{([^{}]+)\}/g, (_, p1) => p1.split('').map(ch => subMap[ch] || ch).join(''));
  s = s.replace(/_([0-9a-z\+\-])/g, (_, p1) => subMap[p1] || p1);

  s = s.replace(/\^\\circ\s*(?:C)?/g, "°C");
  s = s.replace(/\\circ\s*(?:C)?/g, "°C");
  s = s.replace(/\^\{([^{}]+)\}/g, (_, p1) => p1.split('').map(ch => supMap[ch] || ch).join(''));
  s = s.replace(/\^([0-9a-z\+\-])/g, (_, p1) => supMap[p1] || p1);

  // Panah & simbol
  s = s.replace(/\\rightleftharpoons/g, "⇌");
  s = s.replace(/\\longleftrightarrow/g, "⇌");
  s = s.replace(/\\leftrightarrow/g, "↔");
  s = s.replace(/\\longrightarrow/g, "→");
  s = s.replace(/\\rightarrow/g, "→");
  s = s.replace(/\\to\b/g, "→");
  s = s.replace(/\\leftarrow/g, "←");
  s = s.replace(/<=>/g, "⇌");
  s = s.replace(/->/g, "→");

  s = s.replace(/\\Delta\s*H/g, "ΔH");
  s = s.replace(/\\Delta/g, "Δ");
  s = s.replace(/\\alpha/g, "α");
  s = s.replace(/\\beta/g, "β");
  s = s.replace(/\\gamma/g, "γ");
  s = s.replace(/\\pm/g, "±");
  s = s.replace(/\\times/g, "×");
  s = s.replace(/\\cdot/g, "·");
  s = s.replace(/\\dots/g, "…");
  s = s.replace(/\\ldots/g, "…");
  s = s.replace(/\\approx/g, "≈");
  s = s.replace(/\\neq/g, "≠");
  s = s.replace(/\\leq?/g, "≤");
  s = s.replace(/\\geq?/g, "≥");
  s = s.replace(/\\infty/g, "∞");

  s = s.replace(/\\left\s*[\(\[\{]/g, "(");
  s = s.replace(/\\right\s*[\)\]\}]/g, ")");
  s = s.replace(/\\left\./g, "");
  s = s.replace(/\\right\./g, "");

  s = s.replace(/\\log\b/g, "log");
  s = s.replace(/\\ln\b/g, "ln");
  s = s.replace(/\\sin\b/g, "sin");
  s = s.replace(/\\cos\b/g, "cos");
  s = s.replace(/\\tan\b/g, "tan");

  s = s.replace(/\$\$/g, "");
  s = s.replace(/\$/g, "");
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");
  s = s.replace(/\\/g, "");
  s = s.replace(/[{}]/g, "");

  // Entitas HTML
  s = s.replace(/&deg;C/gi, "°C");
  s = s.replace(/&deg;/gi, "°");
  s = s.replace(/&times;/gi, "×");
  s = s.replace(/&plusmn;/gi, "±");
  s = s.replace(/&harr;/gi, "↔");
  s = s.replace(/&rarr;/gi, "→");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/&nbsp;/gi, " ");

  // Hapus semua sisa tag HTML
  s = s.replace(/<[^>]+>/g, "");

  return s.trim();
}

// HELPER FORMAT KHUSUS SOAL UNIK UNTUK WORD (MENJODOHKAN, SCRAMBLE, TTS)
function formatUniqueQuestionForWord(promptText, soal) {
  if (!promptText) return "";
  const tSoal = (soal.tipe_soal || "").toLowerCase();
  const isMatching = tSoal.includes("jodoh") || tSoal.includes("matching");
  const isScramble = tSoal.includes("scramble") || tSoal.includes("acak");
  const isTts = tSoal.includes("tts") || tSoal.includes("silang") || tSoal.includes("crossword");

  let cleanText = formatChemistryForWordHtml(isTts ? cleanTtsClue(promptText) : promptText);

  // Jika memuat tabel markdown, pisahkan dan render tabel Word
  const lines = promptText.split(/\r?\n/);
  let tableLines = [];
  let otherLines = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.includes("|") && l.split("|").length >= 3) {
      inTable = true;
      tableLines.push(l);
    } else {
      otherLines.push(lines[i]);
    }
  }

  let tableWordHtml = "";
  if (tableLines.length >= 2) {
    tableWordHtml = convertMarkdownTableToWordHtml(tableLines.join("\n"));
    cleanText = formatChemistryForWordHtml(otherLines.join("\n").trim());
  }

  if (isMatching) {
    return `
      <div style="text-align: justify; line-height: 1.5; margin: 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">
        ${cleanText}
      </div>
      ${tableWordHtml}
      <div style="margin-top: 8pt; margin-bottom: 8pt; padding: 6pt 10pt; background-color: #f8fafc; border: 1pt solid #cbd5e1; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">
        <b>Lembar Pasangan Jawaban Siswa:</b><br/>
        <div style="font-size: 12pt; letter-spacing: 2pt; margin-top: 4pt;">1 - ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp;&nbsp; 2 - ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp;&nbsp; 3 - ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp;&nbsp; 4 - ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
      </div>
    `;
  }

  if (isScramble) {
    const letterCount = (soal.kunci_jawaban || "").replace(/[^A-Za-z]/g, "").length || 8;
    const boxes = Array(letterCount).fill(0).map(() => 
      `<span style="display: inline-block; width: 22pt; height: 22pt; border: 1.5pt solid #000000; text-align: center; line-height: 22pt; margin: 2pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif;">&nbsp;</span>`
    ).join("");

    return `
      <div style="text-align: justify; line-height: 1.5; margin: 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">
        ${cleanText}
      </div>
      <div style="margin-top: 8pt; margin-bottom: 8pt; font-family: 'Times New Roman', Times, serif;">
        <div style="font-size: 10.5pt; color: #475569; margin-bottom: 3pt;">Kotak Isian Huruf Siswa:</div>
        <div style="line-height: 26pt;">${boxes}</div>
      </div>
    `;
  }

  if (isTts) {
    const letterCount = (soal.kunci_jawaban || "").replace(/[^A-Za-z]/g, "").length || 6;
    const boxes = Array(letterCount).fill(0).map((_, i) => 
      `<span style="display: inline-block; width: 22pt; height: 22pt; border: 1.5pt solid #000000; text-align: center; line-height: 22pt; margin: 2pt; font-size: 12pt; font-family: 'Times New Roman', Times, serif; position: relative;">${i === 0 ? `<sup style="font-size: 8pt;">${soal.nomor}</sup>` : '&nbsp;'}</span>`
    ).join("");

    return `
      <div style="text-align: justify; line-height: 1.5; margin: 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">
        ${cleanText}
      </div>
      <div style="margin-top: 8pt; margin-bottom: 8pt; font-family: 'Times New Roman', Times, serif;">
        <div style="font-size: 10.5pt; color: #475569; margin-bottom: 3pt;">Kotak Jawaban TTS:</div>
        <div style="line-height: 26pt;">${boxes}</div>
      </div>
    `;
  }

  return `<div style="text-align: justify; line-height: 1.5; margin: 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">${cleanText}</div>`;
}

// WORD EXPORTER (.doc / .docx - STANDAR UKURAN KERTAS A4 & FONT TIMES NEW ROMAN 12PT)
function exportToWordDocx(pkg, exportMode = 'guru') {
  if (!pkg) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }

  try {
    const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
    let listA = pkg.daftar_soal || [];
    let listB = pkg.daftar_soal_paket_b || [];

    if (exportSavedOnly) {
      if (savedQuestions && savedQuestions.length > 0) {
        const pinnedA = listA.filter(q => q && q.is_pinned === true);
        const pinnedB = listB.length > 0 ? listB.filter(q => q && q.is_pinned === true) : [];
        if (pinnedA.length > 0 || pinnedB.length > 0) {
          listA = pinnedA;
          listB = pinnedB;
        } else {
          listA = savedQuestions;
          listB = [];
        }
      } else {
        const chk = document.getElementById("chkExportSavedOnly");
        if (chk) chk.checked = false;
        alert("ℹ️ Catatan: Anda mencentang 'Hanya Ekspor Soal Ditandai' tetapi belum ada soal yang ditandai bintang (📌).\n\nSistem secara otomatis mengekspor seluruh butir soal yang telah dibuat agar file Word tidak kosong.");
        listA = pkg.daftar_soal || [];
        listB = pkg.daftar_soal_paket_b || [];
      }
    }

    if ((!listA || listA.length === 0) && pkg.daftar_soal && pkg.daftar_soal.length > 0) {
      listA = pkg.daftar_soal;
    }

    if (!listA || listA.length === 0) {
      alert("⚠️ Naskah soal tidak memiliki butir soal yang dapat diekspor. Silakan generate soal terlebih dahulu.");
      return;
    }

    const isPearson = (pkg.jenjang || "").toLowerCase().includes("pearson") || (pkg.jenjang || "").toLowerCase().includes("edexcel");
    const isNoStimulus = (pkg.stimulus_model || "").toLowerCase().includes("tanpa stimulus");
    const customTeacher = getCustomTeacherName();
    const customSchool = getCustomSchoolName();

    const formatWordQuestions = (questions) => {
      const ttsQuestions = (questions || []).filter(q => {
        const t = (q.tipe_soal || "").toLowerCase();
        return t.includes("tts") || t.includes("silang") || t.includes("crossword");
      });
      const nonTtsQuestions = (questions || []).filter(q => !ttsQuestions.includes(q));

      let renderedWordHtml = "";

      // 1. Render Lembar Teka-Teki Silang 2D (Foto 1)
      if (ttsQuestions.length > 0) {
        const ttsItems = ttsQuestions.map(q => ({
          word: (q.kunci_jawaban || "").toUpperCase().replace(/[^A-Z]/g, ""),
          clue: cleanTtsClue(q.pertanyaan),
          soal: q
        }));
        const layout = generateCrosswordLayout(ttsItems, 80);
        if (layout) {
          renderedWordHtml += renderCrosswordTableForWord(layout, exportMode === 'siswa');
        }
      }

      // 2. Render Soal Lainnya (Jika ada di Campuran)
      if (nonTtsQuestions.length > 0) {
        if (ttsQuestions.length > 0) {
          renderedWordHtml += `<div style="page-break-before: always; margin-top: 20pt;"><hr style="border: none; border-top: 2px solid #000;"/></div>`;
        }
        renderedWordHtml += nonTtsQuestions.map((soal) => {
        if (!soal) return "";

        // 1. Metadata Butir Soal (Elemen, Subtopik, Level)
        const metaParts = [];
        if (soal.topik) metaParts.push(isPearson ? `Topic: ${soal.topik}` : `Elemen/Topik: ${soal.topik}`);
        if (soal.subtopik) metaParts.push(isPearson ? `Subtopic: ${soal.subtopik}` : `Subtopik: ${soal.subtopik}`);
        if (soal.tingkat_kesulitan) metaParts.push(isPearson ? `Level: ${soal.tingkat_kesulitan}` : `Tingkat Kesulitan: ${soal.tingkat_kesulitan}`);
        if (soal.tipe_soal) metaParts.push(isPearson ? `Type: ${soal.tipe_soal}` : `Bentuk: ${soal.tipe_soal}`);
        const metaText = metaParts.join(" · ");

        // 2. Pemisahan Komponen Soal (Stimulus, Tabel Markdown, Pertanyaan)
        const parsed = splitQuestionContentForWord(soal, isNoStimulus);
        const isStructuredOrEssay = (soal.tipe_soal || "").toLowerCase().includes("uraian") ||
                                    (soal.tipe_soal || "").toLowerCase().includes("esai") ||
                                    (soal.tipe_soal || "").toLowerCase().includes("structured") ||
                                    isPearson ||
                                    (!soal.pilihan_jawaban || soal.pilihan_jawaban.length === 0);

        const tSoal = (soal.tipe_soal || "").toLowerCase();
        const isMatching = tSoal.includes("jodoh") || tSoal.includes("matching");
        const isScramble = tSoal.includes("scramble") || tSoal.includes("acak");
        const isUniqueType = isMatching || isScramble;

        // 3. Pilihan Jawaban vs Dotted Lines vs Format Soal Unik (Font Times New Roman 12pt)
        let opts = "";
        let promptHtml = "";
        if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
          promptHtml = `<div style="text-align: justify; text-justify: inter-ideograph; line-height: 1.5; margin: 6pt 0 6pt 0; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">${formatChemistryForWordHtml(parsed.prompt)}</div>`;
          opts = soal.pilihan_jawaban.map(o => `
            <div style="margin-left: 20pt; margin-top: 3pt; margin-bottom: 3pt; text-align: justify; text-justify: inter-ideograph; line-height: 1.5; font-size: 12pt; font-family: 'Times New Roman', Times, serif; color: #000000;">
              ${isPearson ? `<span style="font-family: 'Times New Roman', Times, serif; border: 1px solid #000; padding: 1pt 5pt; margin-right: 6pt; font-size: 10pt;">&nbsp;&nbsp;</span>` : ''}<b>${o.label}.</b> ${formatChemistryForWordHtml(o.teks)}
            </div>
          `).join("");
          if (isPearson) {
            opts += `<div style="text-align: right; font-weight: bold; font-size: 11pt; color: #000000; font-family: 'Times New Roman', Times, serif; margin-top: 2pt;">(1)</div>`;
          }
        } else if (isUniqueType) {
          promptHtml = formatUniqueQuestionForWord(parsed.prompt, soal);
          opts = "";
        } else {
          promptHtml = formatPromptWithSubpartsAndDotsForWord(parsed.prompt, isStructuredOrEssay);
          opts = "";
        }

        // 4. Ilustrasi SVG
        let svgWord = "";
        if (soal.ilustrasi_svg && soal.ilustrasi_svg.includes("<svg")) {
          let cleanSvg = soal.ilustrasi_svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
          if (!cleanSvg.includes("xmlns")) {
            cleanSvg = cleanSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          svgWord = `
            <div style="text-align: center; margin: 8pt auto;">
              ${cleanSvg}
              ${soal.caption_ilustrasi ? `<p style="font-size: 10pt; font-style: italic; color: #475569; margin-top: 3pt; text-align: center; font-family: 'Times New Roman', Times, serif;">Diagram: ${formatChemistryForWordHtml(soal.caption_ilustrasi)}</p>` : ''}
            </div>
          `;
        }

        const hasStimulusBox = Boolean(!isNoStimulus && (parsed.stimulus || parsed.tableMarkdown));

        return `
          <div style="margin-bottom: 16pt; page-break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
            <div style="font-size: 10pt; color: #475569; margin-bottom: 4pt; line-height: 1.35; font-family: 'Times New Roman', Times, serif;">
              <b>${soal.nomor}.</b> ${metaText}
            </div>

            ${hasStimulusBox ? `
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4pt; padding: 8pt 10pt; margin: 4pt 0 8pt 0; font-family: 'Times New Roman', Times, serif;">
                ${parsed.stimulus ? `<div style="text-align: justify; text-justify: inter-ideograph; line-height: 1.5; margin-bottom: ${parsed.tableMarkdown ? '6pt' : '0'}; color: #000000; font-size: 11.5pt; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(parsed.stimulus)}</div>` : ''}
                ${parsed.tableMarkdown ? convertMarkdownTableToWordHtml(parsed.tableMarkdown) : ''}
              </div>
            ` : ''}

            ${promptHtml}
            ${svgWord}
            ${opts}
          </div>
        `;
      }).join("");
      }

      if (isPearson) {
        let totalMarks = 0;
        (questions || []).forEach(soal => {
          if (!soal) return;
          if (soal.pilihan_jawaban && soal.pilihan_jawaban.length > 0) {
            totalMarks += 1;
          } else {
            const parsedSub = parseStructuredQuestionContent(soal.pertanyaan || "");
            if (parsedSub.hasSubparts && parsedSub.subparts.length > 0) {
              parsedSub.subparts.forEach(sub => {
                const markMatch = sub.text.match(/\s*(?:\[|\()(\d+)\s*(?:marks?|mark|m|poin|skor)?(?:\)|\/|\s*mark\]|\s*marks\])/i);
                totalMarks += markMatch ? parseInt(markMatch[1], 10) : 1;
              });
            } else {
              totalMarks += 1;
            }
          }
        });
        renderedWordHtml += `
          <div style="text-align: right; font-weight: bold; font-size: 12pt; margin-top: 18pt; padding-top: 6pt; border-top: 1.5pt solid #000000; font-family: 'Times New Roman', Times, serif; color: #000000;">
            TOTAL FOR PAPER = ${totalMarks} MARKS
          </div>
        `;
      }
      return renderedWordHtml;
    };

    const formatWordSolutions = (questions) => {
      const qList = questions || [];
      const hasDetailedSteps = qList.some(q => q && Array.isArray(q.pembahasan_langkah) && q.pembahasan_langkah.length > 0 && !q.pembahasan_langkah[0].toLowerCase().includes("mode fokus"));

      if (!hasDetailedSteps) {
        const chunkSize = 10;
        let tablesHtml = "";
        for (let i = 0; i < qList.length; i += chunkSize) {
          const chunk = qList.slice(i, i + chunkSize);
          const colWidth = (100 / Math.max(chunk.length, 1)).toFixed(1);
          const headers = chunk.map(q => `<th style="padding: 5pt 2pt; text-align: center; border: 1px solid #000000; font-size: 10pt; background-color: #f1f5f9; color: #000000; width: ${colWidth}%; font-family: 'Times New Roman', Times, serif;">No. ${q.nomor}</th>`).join("");
          const cells = chunk.map(q => `<td style="padding: 6pt 2pt; text-align: center; border: 1px solid #000000; font-size: 11pt; color: #000000; font-weight: bold; background-color: #ffffff; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(q.kunci_jawaban || '-')}</td>`).join("");
          tablesHtml += `
            <table cellpadding="0" cellspacing="0" style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 4pt; margin-bottom: 8pt; border: 1px solid #000000;">
              <tr>${headers}</tr>
              <tr>${cells}</tr>
            </table>
          `;
        }
        return `
          <div style="margin: 12pt 0; page-break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
            <p style="font-size: 10.5pt; color: #475569; margin-bottom: 6pt; font-style: italic; text-align: justify; text-justify: inter-ideograph; font-family: 'Times New Roman', Times, serif;">*${isPearson ? 'Mark Scheme Summary Matrix (Exam Mode)' : 'Matriks Kunci Jawaban Singkat (Mode Naskah Soal)'}:</p>
            ${tablesHtml}
          </div>
        `;
      }

      return qList.map((soal) => {
        if (!soal) return "";
        let steps = (Array.isArray(soal.pembahasan_langkah) ? soal.pembahasan_langkah : []).map(st => `<li>${formatChemistryForWordHtml(st)}</li>`).join("");
        const parsedKey = parseStructuredQuestionContent(soal.kunci_jawaban || "");
        const isMultiKey = parsedKey.hasSubparts && parsedKey.subparts.length > 0;
        const keyHtml = formatAnswerKeyForWordHtml(soal.kunci_jawaban);

        return `
          <div style="margin-bottom: 12pt; page-break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
            <div style="font-weight: bold; margin-bottom: 2pt; font-size: 12pt; color: #000000; text-align: justify; text-justify: inter-ideograph; font-family: 'Times New Roman', Times, serif;">
              ${soal.nomor}. ${isPearson ? 'Key / Answer' : 'Kunci'}: ${isMultiKey ? '' : keyHtml}
            </div>
            ${isMultiKey ? `<div style="margin-left: 12pt; margin-top: 2pt; margin-bottom: 4pt; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">${keyHtml}</div>` : ''}
            <div style="text-align: justify; text-justify: inter-ideograph; line-height: 1.5; font-size: 11pt; color: #000000; margin: 2pt 0 4pt 0; font-family: 'Times New Roman', Times, serif;">
              <b>${isPearson ? 'Mark Scheme &amp; Worked Solutions:' : 'Pembahasan:'}</b>
              <ul style="margin: 2pt 0 0 0; padding-left: 18pt; font-family: 'Times New Roman', Times, serif;">${steps}</ul>
            </div>
            ${soal.tips_atau_jebakan ? `
              <p style="font-size: 10.5pt; font-style: italic; color: #475569; margin: 2pt 0 0 18pt; text-align: justify; text-justify: inter-ideograph; font-family: 'Times New Roman', Times, serif;">
                💡 <b>${isPearson ? 'Tip / Common Misconception' : 'Tips'}:</b> ${formatChemistryForWordHtml(soal.tips_atau_jebakan)}
              </p>
            ` : ''}
          </div>
        `;
      }).join("");
    };

    const labelA = listB.length > 0 ? (isPearson ? ' (SET A)' : ' (PAKET A)') : '';
    const labelB = isPearson ? ' (SET B)' : ' (PAKET B)';
    const headSoal = isPearson ? 'EXAMINATION PAPER' : 'LEMBAR SOAL';
    const headSol = isPearson ? 'MARK SCHEME &amp; WORKED SOLUTIONS (For Teacher)' : 'KUNCI JAWABAN &amp; PEMBAHASAN (untuk guru)';

    let questionsPart = `<h3 style="color: #1e3a8a; font-size: 13pt; font-weight: bold; margin-bottom: 12pt; font-family: 'Times New Roman', Times, serif;">${headSoal}${labelA}</h3>` + formatWordQuestions(listA);
    let solutionsPart = `<h3 style="color: #991b1b; font-size: 13pt; font-weight: bold; margin: 18pt 0 12pt 0; text-align: left; border-top: 1.5px solid #000000; padding-top: 12pt; font-family: 'Times New Roman', Times, serif;">${headSol}${labelA}</h3>` + formatWordSolutions(listA);

    if (listB.length > 0) {
      questionsPart += `<div class="page-break"></div><h3 style="color: #1e3a8a; font-size: 13pt; font-weight: bold; margin-bottom: 12pt; font-family: 'Times New Roman', Times, serif;">${headSoal}${labelB}</h3>` + formatWordQuestions(listB);
      solutionsPart += `<div class="page-break"></div><h3 style="color: #991b1b; font-size: 13pt; font-weight: bold; margin: 18pt 0 12pt 0; text-align: left; border-top: 1.5px solid #000000; padding-top: 12pt; font-family: 'Times New Roman', Times, serif;">${headSol}${labelB}</h3>` + formatWordSolutions(listB);
    }

    let kisiPart = "";
    if (pkg.kisi_kisi_asesmen && pkg.kisi_kisi_asesmen.length > 0 && !exportSavedOnly) {
      let rows = pkg.kisi_kisi_asesmen.map(k => `
        <tr>
          <td style="padding: 4pt 6pt; text-align: center; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">${k.nomor}</td>
          <td style="padding: 4pt 6pt; border: 1px solid #000000; text-align: justify; text-justify: inter-ideograph; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(k.cp_tp)}</td>
          <td style="padding: 4pt 6pt; border: 1px solid #000000; text-align: justify; text-justify: inter-ideograph; font-family: 'Times New Roman', Times, serif;">${formatChemistryForWordHtml(k.indikator_soal)}</td>
          <td style="padding: 4pt 6pt; text-align: center; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">${k.level_kognitif}</td>
          <td style="padding: 4pt 6pt; text-align: center; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">${k.bentuk_soal}</td>
          <td style="padding: 4pt 6pt; text-align: center; font-weight: bold; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">${k.kunci_jawaban}</td>
          <td style="padding: 4pt 6pt; text-align: center; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">${k.skor || 10}</td>
        </tr>
      `).join("");

      kisiPart = `
        <div class="page-break"></div>
        <h3 style="color: #000000; text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 8pt; font-family: 'Times New Roman', Times, serif;">LAMPIRAN: MATRIKS KISI-KISI ASESMEN</h3>
        <table border="1" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif;">No</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; font-family: 'Times New Roman', Times, serif;">Capaian / Tujuan Pembelajaran</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; font-family: 'Times New Roman', Times, serif;">Indikator Butir Soal</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-family: 'Times New Roman', Times, serif;">Level</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-family: 'Times New Roman', Times, serif;">Bentuk</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-family: 'Times New Roman', Times, serif;">Kunci</th>
              <th style="border: 1px solid #000000; padding: 4pt 6pt; text-align: center; font-family: 'Times New Roman', Times, serif;">Skor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    const docContent = `<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="ProgId" content="Word.Document">
        <meta name="Generator" content="Microsoft Word 15">
        <meta name="Originator" content="Microsoft Word 15">
        <title>${pkg.judul || 'Paket Asesmen Kimia'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
            <w:ValidateAgainstSchemas/>
            <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
            <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
            <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
            <w:Compatibility>
              <w:BreakWrappedTables/>
              <w:SnapToGridInCell/>
              <w:WrapTextWithPunct/>
              <w:UseAsianBreakRules/>
              <w:DontGrowAutofit/>
              <w:SplitPgBreakAndParaMark/>
              <w:EnableOpenTypeFeatures/>
            </w:Compatibility>
            <w:BrowserLevel>MicrosoftInternetExplorer4</w:BrowserLevel>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          /* Pengaturan Halaman A4 & Margin Standar 1.91 cm */
          @page {
            size: 595.3pt 841.9pt; /* A4: 210mm x 297mm */
            margin: 54.0pt 54.0pt 54.0pt 54.0pt; /* 1.91 cm */
            mso-page-orientation: portrait;
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          @page Section1 {
            size: 595.3pt 841.9pt;
            margin: 54.0pt 54.0pt 54.0pt 54.0pt;
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
            width: 100%;
            max-width: 100%;
          }
          /* Pengaturan Standar Tipografi: Times New Roman 12pt */
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            text-align: justify;
            text-justify: inter-ideograph;
            margin: 0;
            padding: 0;
          }
          p, div, li, td, th {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            text-align: justify;
            text-justify: inter-ideograph;
          }
          p.MsoNormal, li.MsoNormal, div.MsoNormal {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            text-align: justify;
            text-justify: inter-ideograph;
            line-height: 1.5;
            margin-top: 0;
            margin-bottom: 6pt;
          }
          h1, h2, h3, h4 {
            font-family: 'Times New Roman', Times, serif;
          }
          h2 {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 4pt;
            color: #000000;
          }
          h3 {
            font-size: 13pt;
            font-weight: bold;
          }
          .meta {
            text-align: center;
            font-size: 10pt;
            color: #475569;
            margin-bottom: 14pt;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 8pt;
            font-style: italic;
            font-family: 'Times New Roman', Times, serif;
          }
          .page-break {
            page-break-before: always;
            mso-break-type: section-break;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 6pt 0;
            font-size: 11pt;
            font-family: 'Times New Roman', Times, serif;
          }
          th, td {
            border: 1px solid #000000;
            padding: 4pt 6pt;
            font-family: 'Times New Roman', Times, serif;
          }
          th {
            background-color: #f1f5f9;
            text-align: center;
            font-weight: bold;
            color: #000000;
          }
          sub {
            vertical-align: sub;
            font-size: 9pt;
            line-height: 0;
          }
          sup {
            vertical-align: super;
            font-size: 9pt;
            line-height: 0;
          }
          hr {
            border: none;
            border-top: 1.5px solid #000000;
            margin: 14pt 0;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${isPearson ? `
            <table style="width: 100%; border: 1.5pt solid #000000; border-collapse: collapse; margin-bottom: 14pt; font-family: 'Times New Roman', Times, serif;">
              <tr>
                <td style="padding: 6pt 8pt; border: 1pt solid #000000; width: 45%; font-family: 'Times New Roman', Times, serif; font-size: 11pt; vertical-align: top;">
                  <b>Candidate surname:</b> <span style="display:inline-block; border-bottom: 1pt solid #000; width: 130pt;">&nbsp;</span><br><br>
                  <b>Other names:</b> <span style="display:inline-block; border-bottom: 1pt solid #000; width: 155pt;">&nbsp;</span>
                </td>
                <td style="padding: 6pt 8pt; border: 1pt solid #000000; width: 25%; text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 10pt; vertical-align: top;">
                  <b>Centre Number</b><br>
                  <table align="center" style="margin: 4pt auto 0 auto; border-collapse: collapse;">
                    <tr>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
                <td style="padding: 6pt 8pt; border: 1pt solid #000000; width: 30%; text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 10pt; vertical-align: top;">
                  <b>Candidate Number</b><br>
                  <table align="center" style="margin: 4pt auto 0 auto; border-collapse: collapse;">
                    <tr>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                      <td style="border: 1pt solid #000; width: 14pt; height: 16pt;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8pt 10pt; background-color: #f8fafc; border-top: 1.5pt solid #000000; font-family: 'Times New Roman', Times, serif;">
                  <div style="font-size: 13pt; font-weight: bold; color: #000000; font-family: 'Times New Roman', Times, serif;">Pearson Edexcel International GCSE / Advanced Level</div>
                  <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a; margin-top: 2pt; font-family: 'Times New Roman', Times, serif;">Chemistry — ${(pkg.topik_utama || 'Examination Paper').toUpperCase()}</div>
                  <div style="font-size: 9.5pt; color: #334155; margin-top: 4pt; line-height: 1.35; font-family: 'Times New Roman', Times, serif;">
                    <b>Centre / School:</b> ${customSchool} &bull; <b>Teacher:</b> ${customTeacher}<br>
                    <b>Instructions:</b> Answer ALL questions. • Use black ink or ball-point pen. • Show all stages in calculations with correct units. • Calculators may be used.
                  </div>
                </td>
              </tr>
            </table>
          ` : `
            <table style="width: 100%; border: none; border-bottom: 2px solid #000000; margin-bottom: 14pt; padding-bottom: 6pt; font-family: 'Times New Roman', Times, serif;">
              <tr>
                <td style="border: none; padding: 0; vertical-align: top; width: 56%; font-family: 'Times New Roman', Times, serif;">
                  <div style="font-size: 13pt; font-weight: bold; color: #000000; letter-spacing: 0.5px;">${customSchool.toUpperCase()}</div>
                  <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a; margin-top: 2pt;">${(pkg.judul || 'ASESMEN &amp; DRILLING SOAL KIMIA').toUpperCase()}</div>
                  <div style="font-size: 10pt; color: #475569; margin-top: 2pt;">
                    Guru Pengampu: <b>${customTeacher}</b> | Mapel: Kimia | Jenjang: ${pkg.jenjang || 'SMA'} | Materi: ${pkg.topik_utama || 'Kimia'}${exportSavedOnly ? ' (Pilihan Guru)' : ''}
                  </div>
                </td>
                <td style="border: none; padding: 0; vertical-align: top; width: 44%; text-align: right; font-family: 'Times New Roman', Times, serif;">
                  <div style="font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.6; text-align: right; color: #000000;">
                    <b>NAMA :</b> <span style="display:inline-block; border-bottom: 1pt solid #000; width: 140pt;">&nbsp;</span><br>
                    <b>KELAS:</b> <span style="display:inline-block; border-bottom: 1pt solid #000; width: 140pt;">&nbsp;</span><br>
                    <b>TANGGAL:</b> <span style="display:inline-block; border-bottom: 1pt solid #000; width: 140pt;">&nbsp;</span>
                  </div>
                </td>
              </tr>
            </table>
          `}
          ${exportMode === 'siswa' 
            ? questionsPart 
            : (exportMode === 'kunci_saja' 
                ? (solutionsPart + (kisiPart ? `<div class="page-break"></div>` + kisiPart : ''))
                : (questionsPart + `<div class="page-break"></div>` + solutionsPart + (kisiPart ? `<div class="page-break"></div>` + kisiPart : ''))
              )
          }
        </div>
      </body>
      </html>`;

    const modeSuffix = exportMode === 'siswa' 
      ? '_Versi_Siswa_A4_TNR' 
      : (exportMode === 'kunci_saja' ? '_Kunci_Pembahasan_A4_TNR' : '_Lengkap_Guru_A4_TNR');

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
    const safeTitle = (pkg.judul || "Asesmen_Kimia")
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '_')
      .substring(0, 80);
    const fileName = `${safeTitle}${exportSavedOnly ? '_Pilihan' : ''}${modeSuffix}.doc`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("Cleanup blob URL error:", e);
      }
    }, 30000);
  } catch (err) {
    alert("❌ Gagal mengekspor dokumen Word: " + err.message);
  }
}

// MARKDOWN EXPORTER
function exportToMarkdownFile(pkg) {
  if (!pkg) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }

  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let questionsA = pkg.daftar_soal || [];
  let questionsB = pkg.daftar_soal_paket_b || [];

  if (exportSavedOnly) {
    if (savedQuestions && savedQuestions.length > 0) {
      const pinnedA = questionsA.filter(q => q && q.is_pinned === true);
      const pinnedB = questionsB.length > 0 ? questionsB.filter(q => q && q.is_pinned === true) : [];
      if (pinnedA.length > 0 || pinnedB.length > 0) {
        questionsA = pinnedA;
        questionsB = pinnedB;
      } else {
        questionsA = savedQuestions;
        questionsB = [];
      }
    } else {
      const chk = document.getElementById("chkExportSavedOnly");
      if (chk) chk.checked = false;
      alert("ℹ️ Catatan: Belum ada soal yang ditandai bintang (📌). Seluruh butir soal diekspor ke Markdown.");
      questionsA = pkg.daftar_soal || [];
      questionsB = pkg.daftar_soal_paket_b || [];
    }
  }

  if ((!questionsA || questionsA.length === 0) && pkg.daftar_soal && pkg.daftar_soal.length > 0) {
    questionsA = pkg.daftar_soal;
  }

  let lines = [
    `# ${pkg.judul || 'Asesmen Kimia'}${exportSavedOnly ? ' (Soal Pilihan Guru)' : ''}`,
    `**Jenjang:** ${pkg.jenjang} | **Topik Pokok:** ${pkg.topik_utama} | **Model:** ${pkg.stimulus_model || 'Kontekstual'}\n`,
    `---\n`,
    `## 📝 Lembar Soal (Paket A)\n`
  ];

  const formatMdList = (list) => {
    (list || []).forEach((soal) => {
      if (!soal) return;
      lines.push(`### Soal ${soal.nomor} (${soal.tingkat_kesulitan || 'Sedang'})`);
      lines.push(`*${soal.subtopik || 'Materi Esensial'}*\n`);
      lines.push(`${soal.pertanyaan}\n`);

      if (soal.pilihan_jawaban) {
        soal.pilihan_jawaban.forEach((o) => {
          lines.push(`- **${o.label}.** ${o.teks}`);
        });
        lines.push("");
      }

      lines.push("<details>");
      lines.push("<summary><b>🔍 Kunci Jawaban & Pembahasan</b></summary>\n");
      lines.push(`**Kunci Jawaban:** \`${soal.kunci_jawaban || '-'}\`\n`);
      lines.push("**Langkah Penyelesaian:**");
      if (Array.isArray(soal.pembahasan_langkah)) {
        soal.pembahasan_langkah.forEach((st) => lines.push(`- ${st}`));
      }
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
  a.download = `${(pkg.judul || "Asesmen_Kimia").replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON EXPORTER
function exportToJsonFile(pkg) {
  if (!pkg) {
    alert("⚠️ Data paket soal belum tersedia. Silakan buat soal terlebih dahulu.");
    return;
  }

  const exportSavedOnly = document.getElementById("chkExportSavedOnly")?.checked;
  let exportData = pkg;

  if (exportSavedOnly) {
    if (savedQuestions && savedQuestions.length > 0) {
      exportData = JSON.parse(JSON.stringify(pkg));
      const pinnedA = (exportData.daftar_soal || []).filter(q => q && q.is_pinned === true);
      const pinnedB = (exportData.daftar_soal_paket_b || []).filter(q => q && q.is_pinned === true);
      if (pinnedA.length > 0 || pinnedB.length > 0) {
        exportData.daftar_soal = pinnedA;
        if (exportData.daftar_soal_paket_b) exportData.daftar_soal_paket_b = pinnedB;
      } else {
        exportData.daftar_soal = savedQuestions;
        delete exportData.daftar_soal_paket_b;
      }
    } else {
      const chk = document.getElementById("chkExportSavedOnly");
      if (chk) chk.checked = false;
      alert("ℹ️ Catatan: Belum ada soal yang ditandai bintang (📌). Seluruh naskah diekspor ke JSON.");
    }
  }

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(pkg.judul || "Asesmen_Kimia").replace(/\s+/g, "_")}${exportSavedOnly ? '_Pilihan' : ''}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// State variables initialized at top of file
function readAIUsage() { try { const value=JSON.parse(localStorage.getItem(AI_USAGE_KEY)||"[]"); return Array.isArray(value)?value:[]; } catch(err) { return []; } }
function recordAIUsage(model, usage, promptText, outputText, status, startedAt) {
  const promptChars=String(promptText||"").length, outputChars=String(outputText||"").length;
  const hasUsage=usage && (Number.isFinite(Number(usage.promptTokens)) || Number.isFinite(Number(usage.promptTokenCount)) || Number.isFinite(Number(usage.prompt_tokens)));
  const promptTokens=hasUsage?Number(usage.promptTokens ?? usage.promptTokenCount ?? usage.prompt_tokens)||0:Math.ceil(promptChars/4);
  const outputTokens=hasUsage?Number(usage.outputTokens ?? usage.candidatesTokenCount ?? usage.completion_tokens)||0:Math.ceil(outputChars/4);
  const entry={at:new Date().toISOString(),model:String(model||"AI"),promptTokens:promptTokens,outputTokens:outputTokens,totalTokens:hasUsage?Number(usage.totalTokens ?? usage.totalTokenCount ?? usage.total_tokens)||(promptTokens+outputTokens):promptTokens+outputTokens,source:hasUsage?"aktual":"perkiraan",status:status||"berhasil",durationMs:Math.max(0,Date.now()-(startedAt||Date.now()))};
  const entries=readAIUsage(); entries.push(entry); try{localStorage.setItem(AI_USAGE_KEY,JSON.stringify(entries.slice(-300)));}catch(err){}
  renderAIUsageSummary(); return entry;
}
function renderAIUsageSummary() {
  const host=document.getElementById("aiUsageSummary"); if(!host)return; host.replaceChildren();
  const entries=readAIUsage();
  if(!entries.length){const empty=document.createElement("p");empty.className="text-sm text-zinc-400";empty.textContent="Belum ada riwayat pemakaian AI di browser ini.";host.appendChild(empty);return;}
  const totals=entries.reduce(function(a,e){a.calls++;a.prompt+=e.promptTokens||0;a.output+=e.outputTokens||0;a.actual+=e.source==="aktual"?1:0;a.failed+=e.status==="gagal"?1:0;return a;},{calls:0,prompt:0,output:0,actual:0,failed:0});
  const summary=document.createElement("div");summary.className="grid grid-cols-2 sm:grid-cols-4 gap-2";
  [["Permintaan",totals.calls],["Input token",totals.prompt.toLocaleString("id-ID")],["Output token",totals.output.toLocaleString("id-ID")],["Aktual / perkiraan",totals.actual+" / "+(totals.calls-totals.actual)]].forEach(function(item){const card=document.createElement("div");card.className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3";const label=document.createElement("p");label.className="text-[10px] text-zinc-400";label.textContent=item[0];const value=document.createElement("p");value.className="text-sm font-bold text-zinc-100 mt-1";value.textContent=item[1];card.append(label,value);summary.appendChild(card);});host.appendChild(summary);
  const byModel={};entries.forEach(function(e){const m=e.model||"AI";byModel[m]=byModel[m]||{calls:0,tokens:0,failed:0};byModel[m].calls++;byModel[m].tokens+=(e.totalTokens||0);if(e.status==="gagal")byModel[m].failed++;});
  Object.keys(byModel).forEach(function(model){const row=document.createElement("p");row.className="text-xs text-zinc-300";row.textContent=model+": "+byModel[model].calls+" permintaan, "+byModel[model].tokens.toLocaleString("id-ID")+" token "+(byModel[model].failed?", "+byModel[model].failed+" gagal":"");host.appendChild(row);});
  const recent=document.createElement("p");recent.className="text-[10px] text-zinc-500";recent.textContent="Menampilkan "+entries.length+" catatan terakhir (maksimal 300). Perkiraan token dihitung dari karakter bila API tidak mengirim usage.";host.appendChild(recent);
}
function initAIUsageTracker(){
  const modal=document.getElementById("aiUsageModal"), open=document.getElementById("btnShowAIUsage"), close=document.getElementById("btnCloseAIUsage"), clear=document.getElementById("btnClearAIUsage");
  if(open)open.addEventListener("click", openAIUsageModal);
  if(close)close.addEventListener("click", closeAIUsageModal);
  if(modal)modal.addEventListener("click", function(event){if(event.target===modal)closeAIUsageModal();});
  if(clear)clear.addEventListener("click", function(){if(!confirm("Hapus ringkasan pemakaian AI yang tersimpan pada browser ini?"))return;localStorage.removeItem(AI_USAGE_KEY);renderAIUsageSummary();});
}
function initQualityAndBankTools() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_QUESTION_BANK_KEY) || "[]");
    localQuestionBank = Array.isArray(stored) ? stored : [];
  } catch (err) { localQuestionBank = []; }

  ["btnOpenQuestionBank", "btnOpenQuestionBankFromConfig"].forEach(function(id) {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", openQuestionBank);
  });
  const modal = document.getElementById("questionBankModal");
  const close = document.getElementById("btnCloseQuestionBank");
  if (close) close.addEventListener("click", function() { modal.classList.add("hidden"); });
  if (modal) modal.addEventListener("click", function(event) {
    if (event.target === modal) modal.classList.add("hidden");
  });
  ["bankSearchInput", "bankTopicFilter", "bankGradeFilter", "bankDifficultyFilter"].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", scheduleQuestionBankRender);
      el.addEventListener("change", scheduleQuestionBankRender);
    }
  });
  const localTab = document.getElementById("btnBankLocal");
  const cloudTab = document.getElementById("btnBankCloud");
  if (localTab) localTab.addEventListener("click", function() { setQuestionBankSource("local"); });
  if (cloudTab) cloudTab.addEventListener("click", function() { setQuestionBankSource("cloud"); });
  const refresh = document.getElementById("btnRefreshQuestionBank");
  if (refresh) refresh.addEventListener("click", function() { renderQuestionBank(true); });
  const build = document.getElementById("btnBuildFromBank");
  if (build) build.addEventListener("click", buildPackageFromBankSelection);
  const importer = document.getElementById("bankImportJson");
  if (importer) importer.addEventListener("change", importQuestionBankJson);
  const cancelEdit = document.getElementById("btnCancelQuestionEdit");
  if (cancelEdit) cancelEdit.addEventListener("click", closeQuestionEditor);
  const saveEdit = document.getElementById("btnSaveQuestionEdit");
  if (saveEdit) saveEdit.addEventListener("click", saveEditedQuestion);
  const editorModal = document.getElementById("questionEditorModal");
  if (editorModal) editorModal.addEventListener("click", function(event) {
    if (event.target === editorModal) closeQuestionEditor();
  });  const audit = document.getElementById("btnRunQualityAudit");
  if (audit) audit.addEventListener("click", runStructuralQualityAudit);
  const calc = document.getElementById("btnAuditChemistry");
  if (calc) calc.addEventListener("click", runChemistryCalculationAudit);
  const localMath = document.getElementById("btnAuditLocalMath");
  if (localMath) localMath.addEventListener("click", runLocalArithmeticAudit);
  const duplicateCheck = document.getElementById("btnCheckDuplicates");
  if (duplicateCheck) duplicateCheck.addEventListener("click", runDuplicateQuestionAudit);
  initAIUsageTracker();
}
// initQualityAndBankTools handled in initializeAllComponents

function qualityText(container, text, tone) {
  const row = document.createElement("div");
  row.className = "rounded-lg border px-3 py-2 " + (tone === "ok"
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
    : tone === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-amber-500/25 bg-amber-500/10 text-amber-200");
  row.textContent = text;
  container.appendChild(row);
}
function normalizeAuditText(value) {
  return String(value || "").toLowerCase().replace(/\$[^$]*\$/g, " ")
    .replace(/<[^>]*>/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function looksLikeCalculationQuestion(question) {
  const text = normalizeAuditText(question && question.pertanyaan);
  return /\b(hitung|hitunglah|berapa|tentukan nilai|massa|mol|konsentrasi|molaritas|volume|ph|poh|entalpi|potensial|orde reaksi|laju reaksi|kalor|energi|ksp|ka|kb|mr|ar|faraday|elektrolisis|arus listrik|waktu reaksi|jumlah zat)\b/i.test(text);
}
function auditQuestionList(list, label, expectedCount, requireSolutions) {
  const issues = [];
  const questions = Array.isArray(list) ? list : [];
  if (Number.isFinite(expectedCount) && questions.length !== expectedCount) {
    issues.push({ tone: "warn", text: label + ": ada " + questions.length + " soal; diharapkan " + expectedCount + "." });
  }
  const seen = new Map();
  questions.forEach(function(q, i) {
    const number = q && q.nomor ? q.nomor : i + 1;
    if (!q || !String(q.pertanyaan || "").trim()) {
      issues.push({ tone: "error", text: label + " nomor " + number + ": pertanyaan kosong." });
      return;
    }
    const options = Array.isArray(q.pilihan_jawaban) ? q.pilihan_jawaban : [];
    const essay = /esai|uraian/i.test(String(q.tipe_soal || ""));
    if (!options.length && !essay) issues.push({ tone: "warn", text: label + " nomor " + number + ": opsi jawaban belum tersedia." });
    if (options.length) {
      const labels = options.map(function(opt) { return String(opt.label || "").trim().toUpperCase(); });
      if (options.length !== 5) issues.push({ tone: "warn", text: label + " nomor " + number + ": ada " + options.length + " opsi; standar paket ini A–E." });
      if (new Set(labels).size !== labels.length) issues.push({ tone: "error", text: label + " nomor " + number + ": label opsi berulang." });
      const key = String(q.kunci_jawaban || "").trim().toUpperCase();
      if (!key || options.filter(function(opt) { return String(opt.label || "").trim().toUpperCase() === key; }).length !== 1) {
        issues.push({ tone: "error", text: label + " nomor " + number + ": kunci tidak cocok dengan tepat satu opsi." });
      }
      const texts = options.map(function(opt) { return normalizeAuditText(opt.teks); });
      if (new Set(texts).size !== texts.length) issues.push({ tone: "warn", text: label + " nomor " + number + ": ada opsi dengan teks duplikat." });
    }
    const stem = normalizeAuditText(q.pertanyaan);
    if (stem && seen.has(stem)) issues.push({ tone: "warn", text: label + " nomor " + number + ": pertanyaan sama dengan nomor " + seen.get(stem) + "." });
    else if (stem) seen.set(stem, number);
    const explanation = Array.isArray(q.pembahasan_langkah) && q.pembahasan_langkah.some(function(step) { return String(step || "").trim(); });
    if (requireSolutions && !explanation) issues.push({ tone: "warn", text: label + " nomor " + number + ": pembahasan diminta tetapi belum diisi." });
  });
  return issues;
}
function getPackageQualityIssues(pkg) {
  if (!pkg) return [{ tone: "warn", text: "Belum ada paket soal untuk diperiksa." }];
  const issues = [];
  const settings = pkg.generator_settings || {};
  const count = Number(settings.requested_count);
  const retained = Number(settings.retained_count) || 0;
  issues.push.apply(issues, auditQuestionList(pkg.daftar_soal, "Paket A",
    Number.isFinite(count) ? count + retained : NaN, settings.requested_solutions === true));
  if (Array.isArray(pkg.daftar_soal_paket_b)) {
    issues.push.apply(issues, auditQuestionList(pkg.daftar_soal_paket_b, "Paket B",
      Number.isFinite(count) && settings.requested_parallel ? count : NaN, settings.requested_solutions === true));
    const allA = pkg.daftar_soal || [], b = pkg.daftar_soal_paket_b;
    const retained = Number(settings.retained_count) || 0;
    const a = allA.slice(retained);
    if (a.length !== b.length) issues.push({ tone: "warn", text: "Soal baru Paket A (" + a.length + ") dan Paket B (" + b.length + ") memiliki jumlah berbeda." });
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (normalizeAuditText(a[i].subtopik) !== normalizeAuditText(b[i].subtopik))
        issues.push({ tone: "warn", text: "Pasangan A–B nomor " + (i + 1) + ": subtopiknya berbeda." });
      if (normalizeAuditText(a[i].tingkat_kesulitan) !== normalizeAuditText(b[i].tingkat_kesulitan))
        issues.push({ tone: "warn", text: "Pasangan A–B nomor " + (i + 1) + ": label kesulitannya berbeda." });
      if (normalizeAuditText(a[i].pertanyaan) === normalizeAuditText(b[i].pertanyaan))
        issues.push({ tone: "error", text: "Pasangan A–B nomor " + (i + 1) + ": pertanyaannya identik." });
      const la = String(a[i].pertanyaan || "").length, lb = String(b[i].pertanyaan || "").length;
      if (Math.max(la, lb) / Math.max(1, Math.min(la, lb)) > 2.2)
        issues.push({ tone: "warn", text: "Pasangan A–B nomor " + (i + 1) + ": panjang stimulus jauh berbeda." });
    }
  }
  return issues;
}
function runStructuralQualityAudit() {
  const report = document.getElementById("qualityAuditReport");
  if (!report) return;
  report.replaceChildren();
  const issues = getPackageQualityIssues(currentPackage);
  if (!issues.length) {
    qualityText(report, "Struktur lolos pemeriksaan dasar. Ini belum membuktikan ketepatan ilmiah atau kesetaraan semantik.", "ok");
    return;
  }
  const errors = issues.filter(function(issue) { return issue.tone === "error"; }).length;
  qualityText(report, "Ditemukan " + errors + " masalah struktur dan " + (issues.length - errors) + " catatan untuk ditinjau.", errors ? "error" : "warn");
  issues.slice(0, 30).forEach(function(issue) { qualityText(report, issue.text, issue.tone); });
  if (issues.length > 30) qualityText(report, "Tampilan dibatasi; masih ada " + (issues.length - 30) + " catatan.", "warn");
}
function buildQuestionSchema() {
  return {
    type: "OBJECT",
    required: ["nomor", "tipe_soal", "topik", "subtopik", "tingkat_kesulitan", "pertanyaan", "pilihan_jawaban", "kunci_jawaban"],
    properties: {
      nomor: { type: "INTEGER" }, tipe_soal: { type: "STRING" }, topik: { type: "STRING" },
      subtopik: { type: "STRING" }, tingkat_kesulitan: { type: "STRING" }, pertanyaan: { type: "STRING" },
      ilustrasi_svg: { type: "STRING" }, caption_ilustrasi: { type: "STRING" },
      pilihan_jawaban: { type: "ARRAY", items: { type: "OBJECT", required: ["label", "teks"], properties: { label: { type: "STRING" }, teks: { type: "STRING" } } } },
      kunci_jawaban: { type: "STRING" }, pembahasan_langkah: { type: "ARRAY", items: { type: "STRING" } },
      tips_atau_jebakan: { type: "STRING" }
    }
  };
}
async function callConfiguredQuestionAI(prompt, schema, maxOutputTokens) {
  const startedAt = Date.now();
  const model = document.getElementById("modelSelect").value;
  const apiKey = localStorage.getItem("portal_gemini_api_key");
  const gasUrl = getGasUrl();
  const usagePrompt = prompt + "\n" + BASE_CHEMISTRY_PROMPT + "\n" + JSON.stringify(schema || {});
  try {
  if (apiKey && model.indexOf("gemini-") === 0) {
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: BASE_CHEMISTRY_PROMPT }] },
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, maxOutputTokens: maxOutputTokens || 4096 }
    };
    let usedModel = model;
    let response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody)
    });
    if (!response.ok && model === "gemini-3.7-flash" && [429, 503].includes(response.status)) {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody)
      });
      usedModel = "gemini-3.6-flash";
    }
    const result = await response.json().catch(function() { return {}; });
    if (!response.ok) throw new Error(result.error && result.error.message ? result.error.message : "Gemini HTTP " + response.status);
    const content = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts
      ? result.candidates[0].content.parts.map(function(part) { return part.text || ""; }).join("")
      : "";
    if (!content) throw new Error("Model tidak mengembalikan JSON.");
    const parsed = JSON.parse(content);
    recordAIUsage(usedModel, result.usageMetadata, usagePrompt, content, "berhasil", startedAt);
    return parsed;
  }
  const response = await fetch(gasUrl, {
    method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "panggilGemini", accessToken: getGeneratorAccessToken(), model: model, prompt: prompt, systemInstruction: BASE_CHEMISTRY_PROMPT, schema: schema, maxOutputTokens: maxOutputTokens || 4096 })
  });
  const result = await response.json();
  if (result.status === "error") throw new Error(result.message || result.error || "Backend AI gagal.");
  if (result.account) {
    window.currentUserAccount = result.account;
    setGeneratorAccountInfo(result.account);
    updateConnectionStatusUI();
  }
  if (result.data && typeof result.data === "object") { recordAIUsage(result.modelUsed || model, result.usage, usagePrompt, result.raw || JSON.stringify(result.data), "berhasil", startedAt); return result.data; }
  if (typeof result.raw === "string") { const parsed = JSON.parse(result.raw); recordAIUsage(result.modelUsed || model, result.usage, usagePrompt, result.raw, "berhasil", startedAt); return parsed; }
  throw new Error("Backend tidak mengembalikan objek JSON.");
  } catch (err) { recordAIUsage(model, null, usagePrompt, "", "gagal", startedAt); throw err; }
}
function getActiveQuestionList() {
  if (!currentPackage) return [];
  return activeParallelTab === "B" && Array.isArray(currentPackage.daftar_soal_paket_b)
    ? currentPackage.daftar_soal_paket_b : (currentPackage.daftar_soal || []);
}
function editQuestionByNumber(number) {
  const q = getActiveQuestionList().find(function(item) { return Number(item.nomor) === Number(number); });
  if (!q) return;
  editingQuestionRef = q;
  document.getElementById("editQuestionText").value = q.pertanyaan || "";
  document.getElementById("editOptionsText").value = (q.pilihan_jawaban || []).map(function(opt) { return opt.label + ". " + opt.teks; }).join("\n");
  document.getElementById("editAnswerKey").value = q.kunci_jawaban || "";
  document.getElementById("editQuestionTip").value = q.tips_atau_jebakan || "";
  document.getElementById("editExplanationText").value = (q.pembahasan_langkah || []).join("\n");
  document.getElementById("questionEditorModal").classList.remove("hidden");
}
function closeQuestionEditor() {
  const modal = document.getElementById("questionEditorModal");
  if (modal) modal.classList.add("hidden");
  editingQuestionRef = null;
}
function saveEditedQuestion() {
  if (!editingQuestionRef || !currentPackage) return;
  const stem = document.getElementById("editQuestionText").value.trim();
  const optionsText = document.getElementById("editOptionsText").value.trim();
  const key = document.getElementById("editAnswerKey").value.trim().toUpperCase();
  if (!stem) { alert("Pertanyaan tidak boleh kosong."); return; }
  const options = optionsText ? optionsText.split(/\r?\n/).map(function(line, index) {
    const match = line.trim().match(/^([A-E])[\s.):\-]+(.*)$/i);
    return { label: match ? match[1].toUpperCase() : String.fromCharCode(65 + index), teks: match ? match[2].trim() : line.trim() };
  }).filter(function(opt) { return opt.teks; }) : [];
  if (options.length && !options.some(function(opt) { return opt.label === key; })) {
    alert("Kunci jawaban harus cocok dengan salah satu opsi.");
    return;
  }
  editingQuestionRef.pertanyaan = stem;
  editingQuestionRef.pilihan_jawaban = options;
  editingQuestionRef.kunci_jawaban = key;
  editingQuestionRef.tips_atau_jebakan = document.getElementById("editQuestionTip").value.trim();
  editingQuestionRef.pembahasan_langkah = document.getElementById("editExplanationText").value.split(/\r?\n/).map(function(line) { return line.trim(); }).filter(Boolean);
  sanitizeQuizPackage(currentPackage);
  closeQuestionEditor();
  renderResults(currentPackage);
}
async function regenerateQuestionByNumber(number) {
  const list = getActiveQuestionList();
  const index = list.findIndex(function(item) { return Number(item.nomor) === Number(number); });
  if (index < 0) return;
  const old = list[index];
  const instruction = prompt("Apa yang ingin diperbaiki pada soal ini? (Opsional)");
  if (instruction === null) return;
  if (!confirm("Buat ulang soal " + number + " Paket " + activeParallelTab + " dengan model terpilih? Permintaan ini memakai token API.")) return;
  const promptText = "Buat ulang tepat satu soal kimia. Pertahankan materi, tipe, subtopik, dan tingkat kesulitan; buat butir baru yang berbeda. Ikuti aturan akurasi ilmiah dan notasi LaTeX. " +
    "Instruksi guru: " + (instruction || "Perbaiki mutu dan kejernihan.") + "\nSoal asal JSON: " + JSON.stringify(old) +
    "\nKembalikan satu objek JSON sesuai skema saja.";
  try {
    const replacement = await callConfiguredQuestionAI(promptText, buildQuestionSchema(), 4096);
    const normalized = normalizeAndValidateQuizPackage({
      judul: currentPackage.judul, jenjang: currentPackage.jenjang, topik_utama: currentPackage.topik_utama, daftar_soal: [replacement]
    }, { topic: currentPackage.topik_utama, grade: currentPackage.jenjang, includeSolutions: !!(old.pembahasan_langkah && old.pembahasan_langkah.length) });
    if (!normalized.daftar_soal.length) throw new Error("Model tidak menghasilkan soal pengganti.");
    const next = normalized.daftar_soal[0];
    next.nomor = old.nomor;
    next.is_pinned = old.is_pinned === true;
    list[index] = next;
    sanitizeQuizPackage(currentPackage);
    syncSavedQuestions();
    updateSavedCountBadge();
    renderResults(currentPackage);
  } catch (err) { alert("Gagal membuat ulang soal: " + err.message); }
}
function normalizeDuplicateQuestion(value) {
  return normalizeAuditText(String(value || "").replace(/\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/g, "$1").replace(/<[^>]*>/g, " "));
}
function duplicateSimilarity(a, b) {
  const left = normalizeDuplicateQuestion(a), right = normalizeDuplicateQuestion(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftWords = left.split(/\s+/), rightWords = right.split(/\s+/);
  if (Math.min(left.length, right.length) >= 45 && (left.includes(right) || right.includes(left))) return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  function shingles(words) { const set = new Set(); for (let i=0;i<words.length-1;i++) set.add(words[i]+" "+words[i+1]); return set; }
  const x=shingles(leftWords), y=shingles(rightWords); let intersection=0; x.forEach(function(v){if(y.has(v)) intersection++;});
  return x.size+y.size ? intersection/(x.size+y.size-intersection) : 0;
}
function runDuplicateQuestionAudit() {
  const report=document.getElementById("qualityAuditReport");
  if (!currentPackage) { qualityText(report,"Belum ada paket soal untuk dibandingkan.","warn"); return; }
  const candidates=[];
  (currentPackage.daftar_soal||[]).forEach(function(q){candidates.push({source:"Paket saat ini A",number:q.nomor,text:q.pertanyaan});});
  (currentPackage.daftar_soal_paket_b||[]).forEach(function(q){candidates.push({source:"Paket saat ini B",number:q.nomor,text:q.pertanyaan});});
  localQuestionBank.forEach(function(entry,pi){const pkg=entry.package||{};[["A",pkg.daftar_soal||[]],["B",pkg.daftar_soal_paket_b||[]]].forEach(function(group){group[1].forEach(function(q){candidates.push({source:"Bank lokal "+(pkg.topik_utama||"")+" "+group[0],number:q.nomor,text:q.pertanyaan});});});});
  cloudBankItems.forEach(function(item){(item.soalRingkas||[]).forEach(function(q){candidates.push({source:"Bank cloud "+(item.topik||""),number:q.nomor,text:q.pertanyaan});});});
  const currentCount=(currentPackage.daftar_soal||[]).length+(currentPackage.daftar_soal_paket_b||[]).length;
  const pairs=[];
  for(let i=0;i<currentCount;i++) for(let j=i+1;j<candidates.length;j++) {
    const score=duplicateSimilarity(candidates[i].text,candidates[j].text);
    if(score>=0.78) pairs.push({a:candidates[i],b:candidates[j],score:score});
  }
  pairs.sort(function(a,b){return b.score-a.score;});
  if(!pairs.length){qualityText(report,"Tidak ditemukan soal yang sama atau sangat mirip pada paket, bank lokal, dan hasil pencarian cloud yang sudah dimuat.","ok");return;}
  pairs.slice(0,25).forEach(function(pair){qualityText(report,"Kemiripan "+Math.round(pair.score*100)+"%: "+pair.a.source+" nomor "+pair.a.number+" ↔ "+pair.b.source+" nomor "+pair.b.number+". Periksa apakah ini duplikat atau memang variasi yang disengaja.",pair.score>=0.92?"error":"warn");});
  if(pairs.length>25) qualityText(report,"Ada "+pairs.length+" pasangan mirip; yang ditampilkan 25 teratas.","warn");
}
function normalizeArithmeticOperand(value) {
  let text = String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ");
  text = text.replace(/\\(?:left|right)\b/g, "").replace(/\\(?:,|;|!|quad|qquad)/g, " ");
  text = text.replace(/\{,\}/g, ",").replace(/(\d),(\d)/g, "$1.$2");
  text = text.replace(/\\(?:times|cdot|ast)/g, "*").replace(/[×·∙]/g, "*").replace(/\\div/g, "/").replace(/÷/g, "/").replace(/[−–]/g, "-");
  text = text.replace(/\\(?:approx|simeq|cong)/g, "=");
  text = text.replace(/\\(?:log|lg)\b/g, "log").replace(/\\ln\b/g, "ln").replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)");
  text = text.replace(/\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/g, function(_, inside) {
    return /^(?:mol|mmol|kmol|g|kg|mg|mL|L|cm|m|s|min|jam|A|C|K|°C|kJ|J|kPa|Pa|atm|V|M|mol\/L|g\/mol|L\/mol|%)$/i.test(inside.trim()) ? " " : inside;
  });
  for (let i = 0; i < 12; i++) {
    const next = text.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "(($1)/($2))");
    if (next === text) break;
    text = next;
  }
  text = text.replace(/\^\s*\{([^{}]+)\}/g, "^($1)").replace(/_\s*\{([^{}]+)\}/g, "($1)");
  text = text.replace(/\$|\\%/g, "").replace(/\u00a0/g, " ").trim();
  text = text.replace(/\s+(?:mol(?:\/L)?|mmol|kmol|g(?:\/mol)?|kg|mg|mL|L|cm(?:\^?3|³)?|m(?:\^?3|³)?|s|min|jam|A|C|K|°C|℃|kJ|J|kPa|Pa|atm|V|M|%)(?:\s*\/\s*(?:L|mol|s|min|jam))?\s*$/i, "").trim();
  return text;
}
function evaluateArithmeticExpression(value) {
  const source = normalizeArithmeticOperand(value);
  if (!source) return null;
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|log|ln|sqrt|[()+\-*/^]/gi);
  if (!tokens || tokens.join("").toLowerCase() !== source.replace(/\s+/g, "").toLowerCase()) return null;
  let position = 0;
  function peek() { return tokens[position]; }
  function consume(token) { if (peek() === token) { position++; return true; } return false; }
  function primary() {
    const token = peek();
    if (!token) throw new Error("operand missing");
    if (/^(log|ln|sqrt)$/i.test(token)) {
      position++;
      let val;
      if (consume("(")) { val = expression(); if (!consume(")")) throw new Error("close paren missing"); }
      else val = unary();
      if (token.toLowerCase() === "log") return Math.log10(val);
      if (token.toLowerCase() === "ln") return Math.log(val);
      return Math.sqrt(val);
    }
    if (consume("(")) { const val = expression(); if (!consume(")")) throw new Error("close paren missing"); return val; }
    if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) { position++; return Number(token); }
    throw new Error("unsupported token");
  }
  function power() { let val = primary(); if (consume("^")) val = Math.pow(val, unary()); return val; }
  function unary() { if (consume("+")) return unary(); if (consume("-")) return -unary(); return power(); }
  function term() { let val = unary(); while (peek() === "*" || peek() === "/") { const op = tokens[position++]; const rhs = unary(); val = op === "*" ? val * rhs : val / rhs; } return val; }
  function expression() { let val = term(); while (peek() === "+" || peek() === "-") { const op = tokens[position++]; const rhs = term(); val = op === "+" ? val + rhs : val - rhs; } return val; }
  try { const result = expression(); if (position !== tokens.length || !Number.isFinite(result)) return null; return result; } catch (err) { return null; }
}
function valuesFromExplanation(question) {
  const steps = Array.isArray(question && question.pembahasan_langkah) ? question.pembahasan_langkah : [];
  const checks = [];
  let finalValue = null;
  steps.forEach(function(step, stepIndex) {
    let line = String(step || "").replace(/\\(?:approx|simeq|cong)/g, "=");
    if (!line.includes("=")) return;
    const parts = line.split("=");
    const values = parts.map(evaluateArithmeticExpression);
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] !== null && values[i + 1] !== null) {
        const tolerance = Math.max(1e-8, Math.max(Math.abs(values[i]), Math.abs(values[i + 1])) * 1e-6);
        checks.push({ step: stepIndex + 1, left: values[i], right: values[i + 1], matches: Math.abs(values[i] - values[i + 1]) <= tolerance });
      }
    }
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i] !== null) { finalValue = values[i]; break; }
    }
  });
  return { checks: checks, finalValue: finalValue };
}
function keyedNumericOption(question) {
  const key = String(question && question.kunci_jawaban || "").trim().toUpperCase().match(/(?:^|\b)([A-E])(?:\b|[.)])/);
  const options = Array.isArray(question && question.pilihan_jawaban) ? question.pilihan_jawaban : [];
  if (!key) return null;
  const matches = options.filter(function(option) { return String(option.label || option.opsi || "").trim().toUpperCase() === key[1]; });
  return matches.length === 1 ? evaluateArithmeticExpression(matches[0].teks) : null;
}
function runLocalArithmeticAudit() {
  if (!currentPackage) return;
  const report = document.getElementById("qualityAuditReport");
  const button = document.getElementById("btnAuditLocalMath");
  const questions = (currentPackage.daftar_soal || []).map(function(q) { return { question: q, set: "A" }; })
    .concat((currentPackage.daftar_soal_paket_b || []).map(function(q) { return { question: q, set: "B" }; }))
    .filter(function(entry) { return looksLikeCalculationQuestion(entry.question); });
  if (!questions.length) { qualityText(report, "Tidak terdeteksi soal hitungan numerik untuk diperiksa.", "warn"); return; }
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "Mengecek angka…";
  qualityText(report, "Pemeriksaan berlangsung lokal tanpa panggilan API. Cek ini hanya mengevaluasi operasi angka yang tertulis pada pembahasan; tidak membuktikan rumus atau konsep kimia.", "warn");
  let checked = 0, mismatched = 0, unsupported = 0;
  questions.slice(0, 60).forEach(function(entry) {
    const q = entry.question;
    const result = valuesFromExplanation(q);
    const badCheck = result.checks.find(function(item) { return !item.matches; });
    const keyValue = keyedNumericOption(q);
    const keyComparisonAvailable = result.finalValue !== null && keyValue !== null;
    const keyMatches = keyComparisonAvailable && Math.abs(result.finalValue - keyValue) <= Math.max(1e-8, Math.max(Math.abs(result.finalValue), Math.abs(keyValue)) * 1e-6);
    const label = "Paket " + entry.set + " nomor " + (q.nomor || "?") + ": ";
    if (badCheck) {
      mismatched++;
      qualityText(report, label + "angka pada pembahasan tidak konsisten (" + badCheck.left + " ≠ " + badCheck.right + "). Periksa kembali langkah hitung.", "error");
    } else if (keyComparisonAvailable && !keyMatches) {
      mismatched++;
      qualityText(report, label + "hasil akhir pembahasan (" + result.finalValue + ") tidak sama dengan opsi kunci numerik (" + keyValue + "). Tinjau kunci dan pembahasan.", "error");
    } else if (keyComparisonAvailable && keyMatches) {
      checked++;
      qualityText(report, label + "ekspresi angka konsisten dan cocok dengan nilai pada opsi kunci (" + result.finalValue + "). Ketepatan rumus kimia tetap perlu ditinjau.", "ok");
    } else if (result.checks.length) {
      checked++;
      qualityText(report, label + "rantai aritmetika yang tertulis konsisten; hasil akhir atau opsi kunci tidak cukup jelas untuk dibandingkan.", "warn");
    } else {
      unsupported++;
      qualityText(report, label + "belum dapat diperiksa otomatis karena tidak ada persamaan numerik sederhana yang terbaca.", "warn");
    }
  });
  if (questions.length > 60) qualityText(report, "Pemeriksaan dibatasi pada 60 soal pertama agar halaman tetap responsif.", "warn");
  qualityText(report, "Ringkasan cek lokal: " + checked + " soal diperiksa, " + mismatched + " ketidaksesuaian, " + unsupported + " belum terbaca.", mismatched ? "error" : "ok");
  button.disabled = false;
  button.textContent = oldText;
}
async function runChemistryCalculationAudit() {
  if (!currentPackage) return;
  const report = document.getElementById("qualityAuditReport");
  const button = document.getElementById("btnAuditChemistry");
  const questions = (currentPackage.daftar_soal || []).concat(currentPackage.daftar_soal_paket_b || [])
    .filter(looksLikeCalculationQuestion).slice(0, 8);
  if (!questions.length) { qualityText(report, "Tidak terdeteksi soal hitungan untuk diverifikasi.", "warn"); return; }
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "AI sedang memeriksa…";
  qualityText(report, "Verifikasi mengirim " + questions.length + " soal, kunci, dan pembahasan ke model terpilih. Hasil AI adalah pemeriksaan bantu; tinjau ulang sebelum dibagikan. Pemakaian token/API dapat dikenakan biaya.", "warn");
  const schema = { type: "OBJECT", required: ["items"], properties: { items: { type: "ARRAY", items: {
    type: "OBJECT", required: ["nomor", "status", "kunci_seharusnya", "temuan", "saran"], properties: {
      nomor: { type: "INTEGER" }, status: { type: "STRING" }, kunci_seharusnya: { type: "STRING" }, temuan: { type: "STRING" }, saran: { type: "STRING" }
    }
  } } } };
  const compact = questions.map(function(q) {
    return { nomor: q.nomor, pertanyaan: q.pertanyaan, opsi: q.pilihan_jawaban, kunci: q.kunci_jawaban, pembahasan: q.pembahasan_langkah };
  });
  try {
    const result = await callConfiguredQuestionAI(
      "Verifikasi kunci setiap soal kimia secara independen. Selesaikan soal sendiri tanpa mengandalkan kunci atau pembahasan yang diberikan. Untuk hitungan, tampilkan alur singkat beserta satuan, periksa persamaan reaksi dan angka penting. Cocokkan hasil dengan semua opsi. Status harus tepat salah satu dari KUNCI_SESUAI, KUNCI_TIDAK_SESUAI, atau PERLU_TINJAU. Jangan menebak; jika data tidak cukup, pakai PERLU_TINJAU. Isi kunci_seharusnya dengan label opsi yang benar atau KOSONG jika tidak dapat dipastikan. Jangan mengubah soal. JSON {items:[{nomor,status,kunci_seharusnya,temuan,saran}]} saja. Data: " + JSON.stringify(compact),
      schema, Math.min(16384, 2048 + questions.length * 1600)
    );
    const items = Array.isArray(result.items) ? result.items : [];
    if (!items.length) qualityText(report, "Model tidak mengembalikan hasil verifikasi yang dapat dibaca.", "warn");
    items.forEach(function(item) {
      const status = String(item.status || "PERLU_TINJAU").trim().toUpperCase();
      const tone = status === "KUNCI_SESUAI" ? "ok" : (status === "KUNCI_TIDAK_SESUAI" ? "error" : "warn");
      qualityText(report, "Verifikasi kunci nomor " + item.nomor + ": " + status + (item.kunci_seharusnya ? " (saran kunci: " + item.kunci_seharusnya + ")" : "") + ". " + (item.temuan || "") + (item.saran ? " Saran: " + item.saran : ""), tone);
    });
  } catch (err) { qualityText(report, "Verifikasi kunci gagal: " + err.message, "error"); }
  finally { button.disabled = false; button.textContent = oldText; }
}
function persistLocalQuestionBank() {
  try {
    localQuestionBank = localQuestionBank.slice(0, 100);
    localStorage.setItem(LOCAL_QUESTION_BANK_KEY, JSON.stringify(localQuestionBank));
    return true;
  } catch (err) { alert("Bank lokal tidak dapat disimpan; ruang penyimpanan browser mungkin penuh."); return false; }
}
function saveCurrentPackageToLocalBank(labels) {
  if (!currentPackage) return;
  const clone = JSON.parse(JSON.stringify(currentPackage));
  clone.metadata = Object.assign({}, clone.metadata || {}, {
    labels: String(labels || "").split(",").map(function(tag) { return tag.trim(); }).filter(Boolean)
  });
  localQuestionBank.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), saved_at: new Date().toISOString(), package: clone });
  const saved = persistLocalQuestionBank();
  renderQuestionBankFilters();
  return saved;
}
function setBankOptions(select, values, label) {
  if (!select) return;
  const current = select.value;
  select.replaceChildren(new Option(label, ""));
  values.forEach(function(value) { select.add(new Option(value, value)); });
  if (values.includes(current)) select.value = current;
}
function renderQuestionBankFilters() {
  const packages = localQuestionBank.map(function(item) { return item.package; }).filter(Boolean);
  const getUnique = function(key) { return Array.from(new Set(packages.map(function(pkg) { return String(pkg[key] || "").trim(); }).filter(Boolean))).sort(); };
  setBankOptions(document.getElementById("bankTopicFilter"), getUnique("topik_utama"), "Semua materi");
  setBankOptions(document.getElementById("bankGradeFilter"), getUnique("jenjang"), "Semua jenjang");
  const difficulties = Array.from(new Set(packages.flatMap(function(pkg) { return (pkg.daftar_soal || []).map(function(q) { return q.tingkat_kesulitan; }); }).filter(Boolean))).sort();
  setBankOptions(document.getElementById("bankDifficultyFilter"), difficulties, "Semua kesulitan");
}
function openQuestionBank() {
  const modal = document.getElementById("questionBankModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderQuestionBankFilters();
  renderQuestionBank();
}
function scheduleQuestionBankRender() {
  if (questionBankSource !== "cloud") { renderQuestionBank(); return; }
  clearTimeout(cloudBankSearchTimer);
  cloudBankSearchTimer = setTimeout(function() { renderQuestionBank(); }, 350);
}
function setQuestionBankSource(source) {
  questionBankSource = source === "cloud" ? "cloud" : "local";
  const buildButton=document.getElementById("btnBuildFromBank"); if(buildButton)buildButton.classList.toggle("hidden",questionBankSource==="cloud");
  const importLabel=document.getElementById("bankImportJson"); if(importLabel&&importLabel.parentElement)importLabel.parentElement.classList.toggle("hidden",questionBankSource==="cloud");
  const local = document.getElementById("btnBankLocal"), cloud = document.getElementById("btnBankCloud");
  [local, cloud].forEach(function(btn) { if (!btn) return; const active = (btn === local) === (questionBankSource === "local"); btn.setAttribute("aria-pressed", active ? "true" : "false"); btn.className = active ? "px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold" : "px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"; });
  renderQuestionBank(true);
}
function renderQuestionBank(forceRefresh) {
  if (questionBankSource === "cloud") { renderCloudQuestionBank(!!forceRefresh); return; }
  const list = document.getElementById("questionBankList");
  const status = document.getElementById("bankStatusText");
  if (!list || !status) return;
  const searchEl = document.getElementById("bankSearchInput");
  const query = String(searchEl && searchEl.value || "").trim().toLowerCase();
  const topic = document.getElementById("bankTopicFilter").value;
  const grade = document.getElementById("bankGradeFilter").value;
  const difficulty = document.getElementById("bankDifficultyFilter").value;
  list.replaceChildren();
  const filtered = localQuestionBank.map(function(entry, index) { return { entry: entry, index: index, pkg: entry.package }; })
    .filter(function(row) { return row.pkg; })
    .filter(function(row) { return !topic || row.pkg.topik_utama === topic; })
    .filter(function(row) { return !grade || row.pkg.jenjang === grade; })
    .filter(function(row) { return !difficulty || (row.pkg.daftar_soal || []).some(function(q) { return q.tingkat_kesulitan === difficulty; }); })
    .filter(function(row) { return !query || JSON.stringify(row.pkg).toLowerCase().includes(query); });
  status.textContent = filtered.length + " paket ditampilkan dari " + localQuestionBank.length + " paket tersimpan pada browser ini.";
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400";
    empty.textContent = "Belum ada paket yang cocok. Simpan paket ke cloud (sekaligus bank lokal) atau impor berkas JSON.";
    list.appendChild(empty);
  }
  filtered.forEach(function(rowInfo) {
    const row = rowInfo, pkg = row.pkg, packageIndex = row.index;
    const card = document.createElement("section");
    card.className = "rounded-xl border border-zinc-800 bg-zinc-900/50 p-3";
    const top = document.createElement("div");
    top.className = "flex flex-wrap items-start justify-between gap-2";
    const details = document.createElement("div");
    const title = document.createElement("h4");
    title.className = "font-bold text-zinc-100 text-sm";
    title.textContent = pkg.judul || pkg.topik_utama || "Paket Kimia";
    const meta = document.createElement("p");
    meta.className = "text-[11px] text-zinc-400 mt-1";
    const tagList = pkg.metadata && Array.isArray(pkg.metadata.labels) ? pkg.metadata.labels.join(", ") : "";
    meta.textContent = (pkg.topik_utama || "Kimia") + " • " + (pkg.jenjang || "Jenjang belum diisi") + " • " +
      (row.entry.saved_at ? new Date(row.entry.saved_at).toLocaleDateString("id-ID") : "") + (tagList ? " • Label: " + tagList : "");
    details.append(title, meta);
    const actions = document.createElement("div");
    actions.className = "flex gap-2";
    const load = document.createElement("button");
    load.type = "button"; load.className = "px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[11px]";
    load.textContent = "Muat paket";
    load.addEventListener("click", function() { loadBankPackage(packageIndex); });
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "px-2.5 py-1 rounded bg-zinc-800 hover:bg-rose-900 text-zinc-300 text-[11px]";
    remove.textContent = "Hapus";
    remove.addEventListener("click", function() {
      if (!confirm("Hapus paket ini dari bank lokal browser?")) return;
      localQuestionBank.splice(packageIndex, 1);
      selectedBankQuestions.clear();
      persistLocalQuestionBank(); renderQuestionBankFilters(); renderQuestionBank();
    });
    actions.append(load, remove); top.append(details, actions); card.appendChild(top);
    [["A", pkg.daftar_soal || []], ["B", pkg.daftar_soal_paket_b || []]].forEach(function(group) {
      group[1].forEach(function(q, qi) {
        const label = document.createElement("label");
        label.className = "flex items-start gap-2 mt-2 rounded-lg border border-zinc-800/80 p-2 cursor-pointer hover:bg-zinc-800/50";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox"; checkbox.dataset.bankQuestion = "1";
        checkbox.dataset.packageIndex = String(packageIndex); checkbox.dataset.questionSet = group[0]; checkbox.dataset.questionIndex = String(qi);
        const key = packageIndex + ":" + group[0] + ":" + qi;
        checkbox.checked = selectedBankQuestions.has(key);
        checkbox.addEventListener("change", function() {
          if (checkbox.checked) selectedBankQuestions.add(key); else selectedBankQuestions.delete(key);
        });
        const text = document.createElement("span");
        text.className = "text-xs text-zinc-300";
        text.textContent = "Paket " + group[0] + ", nomor " + (q.nomor || qi + 1) + ": " + String(q.pertanyaan || "").slice(0, 220);
        label.append(checkbox, text); card.appendChild(label);
      });
    });
    list.appendChild(card);
  });
}
function getCloudBankTeacherToken() {
  const token = getGeneratorAccessToken() || localStorage.getItem("portal_generator_docs_token");
  if (token) return token;
  const promptToken = prompt("Masukkan token akses guru (atau token docs) untuk mengakses layanan cloud:");
  if (promptToken && promptToken.trim()) {
    setGeneratorAccessToken(promptToken.trim());
    return promptToken.trim();
  }
  return null;
}
function renderCloudQuestionBank(forceRefresh) {
  const list = document.getElementById("questionBankList"), status = document.getElementById("bankStatusText");
  if (!list || !status) return;
  const gasUrl = getGasUrl();
  if (!gasUrl) { status.textContent = "Backend GAS belum dikonfigurasi."; list.replaceChildren(); cloudBankItems = []; return; }
  const teacherToken=getCloudBankTeacherToken();
  if(!teacherToken){status.textContent="Pencarian bank cloud memerlukan token guru GAS.";list.replaceChildren();return;}
  const seq = ++cloudBankSearchSequence;
  const query = document.getElementById("bankSearchInput").value.trim();
  const filters = { q: query, topik: document.getElementById("bankTopicFilter").value, kelas: document.getElementById("bankGradeFilter").value, kesulitan: document.getElementById("bankDifficultyFilter").value, limit: 30 };
  list.replaceChildren(); status.textContent = "Mencari paket di Google Spreadsheet…";
  fetch(gasUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "cariBankSoal", teacherToken: teacherToken, filters: filters }) })
    .then(function(response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
    .then(function(result) {
      if (seq !== cloudBankSearchSequence) return;
      if (result.status === "error") throw new Error(result.message || "Pencarian bank cloud gagal.");
      cloudBankItems = Array.isArray(result.items) ? result.items : [];
      renderCloudBankCards(cloudBankItems, Number(result.total) || cloudBankItems.length);
    }).catch(function(err) { if (seq !== cloudBankSearchSequence) return; if(/token guru docs tidak valid/i.test(err.message)) localStorage.removeItem("portal_generator_docs_token"); cloudBankItems = []; list.replaceChildren(); status.textContent = "Bank cloud gagal dimuat: " + err.message; });
}
function renderCloudBankCards(items, total) {
  const list = document.getElementById("questionBankList"), status = document.getElementById("bankStatusText");
  if (!list || !status) return;
  setBankOptions(document.getElementById("bankTopicFilter"),Array.from(new Set(items.map(function(item){return item.topik;}).filter(Boolean))).sort(),"Semua materi");
  setBankOptions(document.getElementById("bankGradeFilter"),Array.from(new Set(items.map(function(item){return item.kelas;}).filter(Boolean))).sort(),"Semua jenjang");
  setBankOptions(document.getElementById("bankDifficultyFilter"),Array.from(new Set(items.map(function(item){return item.kesulitan;}).filter(Boolean))).sort(),"Semua kesulitan");
  list.replaceChildren();
  status.textContent = (items.length ? items.length + " paket ditemukan" : "Tidak ada paket cocok") + (total > items.length ? " dari " + total + " hasil. Persempit kata pencarian." : "") + " di bank cloud.";
  if (!items.length) { const empty = document.createElement("p"); empty.className = "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400"; empty.textContent = "Tidak ada paket yang cocok. Coba kata kunci atau filter lain."; list.appendChild(empty); return; }
  items.forEach(function(item) {
    const card = document.createElement("section"); card.className = "rounded-xl border border-zinc-800 bg-zinc-900/50 p-3";
    const head = document.createElement("div"); head.className = "flex items-start justify-between gap-3";
    const text = document.createElement("div");
    const title = document.createElement("h4"); title.className = "font-bold text-zinc-100 text-sm"; title.textContent = item.judul || item.topik || "Paket Kimia";
    const meta = document.createElement("p"); meta.className = "text-[11px] text-zinc-400 mt-1"; meta.textContent = [item.kelas || "Jenjang belum diisi", item.waktu || "", item.jumlah ? item.jumlah + " soal" : "", item.labels || ""].filter(Boolean).join(" • ");
    text.append(title, meta);
    const load = document.createElement("button"); load.type = "button"; load.className = "shrink-0 px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[11px]"; load.textContent = "Muat paket"; load.addEventListener("click", function() { loadCloudBankPackage(item.row, load); });
    head.append(text, load); card.appendChild(head);
    (item.soalRingkas || []).slice(0, 3).forEach(function(q) { const preview = document.createElement("p"); preview.className = "text-[11px] text-zinc-400 mt-2 border-t border-zinc-800 pt-2"; preview.textContent = "Soal " + q.nomor + ": " + q.pertanyaan; card.appendChild(preview); });
    list.appendChild(card);
  });
}
async function loadCloudBankPackage(row, button) {
  const oldText = button.textContent; button.disabled = true; button.textContent = "Memuat…";
  try {
    const teacherToken=getCloudBankTeacherToken(); if(!teacherToken) throw new Error("Pemuatan paket cloud memerlukan token guru GAS.");
    const response = await fetch(getGasUrl(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "ambilPaketBankSoal", teacherToken: teacherToken, row: row }) });
    const result = await response.json();
    if (!response.ok || result.status === "error" || !result.dataSoal) throw new Error(result.message || "Paket tidak dapat dibuka.");
    const pkg = normalizeAndValidateQuizPackage(result.dataSoal, { includeSolutions: true });
    if (!pkg.daftar_soal.length) throw new Error("Data paket cloud kosong atau formatnya tidak dikenali.");
    sanitizeQuizPackage(pkg); currentPackage = pkg; activeParallelTab = "A"; syncSavedQuestions(); updateSavedCountBadge(); renderResults(pkg);
    document.getElementById("questionBankModal").classList.add("hidden");
  } catch (err) { if(/token guru docs tidak valid/i.test(err.message))localStorage.removeItem("portal_generator_docs_token"); alert("Gagal memuat paket cloud: " + err.message); }
  finally { button.disabled = false; button.textContent = oldText; }
}
function loadBankPackage(index) {
  const entry = localQuestionBank[index];
  if (!entry || !entry.package) return;
  currentPackage = JSON.parse(JSON.stringify(entry.package));
  activeParallelTab = "A"; syncSavedQuestions(); updateSavedCountBadge(); renderResults(currentPackage);
  document.getElementById("questionBankModal").classList.add("hidden");
}
function buildPackageFromBankSelection() {
  const checked = Array.from(document.querySelectorAll('[data-bank-question="1"]:checked'));
  const questions = checked.map(function(box) {
    const entry = localQuestionBank[Number(box.dataset.packageIndex)];
    if (!entry || !entry.package) return null;
    const list = box.dataset.questionSet === "B" ? entry.package.daftar_soal_paket_b : entry.package.daftar_soal;
    const question = list && list[Number(box.dataset.questionIndex)];
    return question ? JSON.parse(JSON.stringify(question)) : null;
  }).filter(Boolean);
  if (!questions.length) { alert("Pilih setidaknya satu soal dari bank."); return; }
  const firstEntry = localQuestionBank[Number(checked[0].dataset.packageIndex)];
  currentPackage = JSON.parse(JSON.stringify(firstEntry.package));
  currentPackage.judul = "Paket Latihan Pilihan — " + (currentPackage.topik_utama || "Kimia");
  currentPackage.daftar_soal = questions.map(function(q, index) { q.nomor = index + 1; q.is_pinned = false; return q; });
  delete currentPackage.daftar_soal_paket_b; delete currentPackage.kisi_kisi_asesmen; delete currentPackage.generator_settings;
  selectedBankQuestions.clear();
  activeParallelTab = "A"; savedQuestions = []; updateSavedCountBadge(); renderResults(currentPackage);
  document.getElementById("questionBankModal").classList.add("hidden");
}
async function importQuestionBankJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const packages = Array.isArray(parsed) ? parsed : [parsed];
    let added = 0;
    packages.forEach(function(pkg) {
      const normalized = normalizeAndValidateQuizPackage(pkg, { includeSolutions: false });
      if (!normalized.daftar_soal.length) return;
      sanitizeQuizPackage(normalized);
      normalized.metadata = Object.assign({}, normalized.metadata || {}, { labels: ["impor JSON"] });
      localQuestionBank.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), saved_at: new Date().toISOString(), package: normalized });
      added++;
    });
    persistLocalQuestionBank(); renderQuestionBankFilters(); renderQuestionBank();
    document.getElementById("bankStatusText").textContent = added + " paket berhasil diimpor.";
  } catch (err) { alert("Berkas JSON tidak dapat dibaca: " + err.message); }
  finally { event.target.value = ""; }
}
