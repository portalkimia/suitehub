/**
 * =========================================================================================
 * LMS GURU KIMIA & WALI KELAS - CLIENT REACTIVE ENGINE (app.js) - v6.0
 * =========================================================================================
 * Guru: Tito Vanzal, S.Pd. | Sekolah: SMA Progresif Bumi Shalawat | Kelas Wali: X3 Atlet
 * =========================================================================================
 */

// Safe Memory + LocalStorage Bridge (Compatible with Google Apps Script iframe sandbox)
const memoryStorage = {};
const safeStorage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return memoryStorage[key] || null;
  },
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {}
    memoryStorage[key] = String(value);
  },
  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    delete memoryStorage[key];
  }
};

// Non-reactive storage for Chart.js instances to prevent Alpine Proxy interference
const lmsChartInstances = {
  kehadiran: null,
  nilai: null
};

document.addEventListener('alpine:init', () => {
  Alpine.data('lmsApp', () => ({
    // Navigation State
    currentTab: 'dashboard',
    mobileMenuOpen: false,
    
    // Theme State (Dark / Light Mode)
    darkMode: false,

    // Cloud & Storage State
    syncStatus: 'synced',
    syncMessage: 'Tersimpan lokal & siap sync Google Drive',
    lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    isGasEnvironment: typeof google !== 'undefined' && typeof google.script !== 'undefined',
    gasWebAppUrl: (typeof window !== 'undefined' && window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.LMS_API) || 'https://script.google.com/macros/s/AKfycbwhHSF2V_rUkObqGcQ0aGfy58g2eIe73VPgAIbyEKn2Oxw8m7FVIyu2oVKHzyLGsu2q/exec',
    
    // Core Data
    guru: {
      nama: "Tito Vanzal, S.Pd.",
      nip: "-",
      mapel: "Kimia (Chemistry)",
      sekolah: "SMA Progresif Bumi Shalawat",
      kelasWali: "X3 Atlet",
      tahunAjaran: "2026/2027",
      semester: "Ganjil",
      kkmDefault: 75,
      gasWebAppUrl: (typeof window !== 'undefined' && window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.LMS_API) || 'https://script.google.com/macros/s/AKfycbwhHSF2V_rUkObqGcQ0aGfy58g2eIe73VPgAIbyEKn2Oxw8m7FVIyu2oVKHzyLGsu2q/exec'
    },
    kelasList: [
      { id: "KLS-01", nama: "X3 Atlet", isWaliKelas: true, deskripsi: "Kelas Binaan Wali Kelas" }
    ],
    tagihanDefinisi: [], // Menyimpan daftar kolom tugas & UH yang pernah dibuat agar tidak hilang
    siswa: [],
    presensiWali: [],
    jurnalKimia: [],
    presensiKimia: [],
    nilai: [],
    bintangLog: [],
    kategoriBintang: [],
    quickLinks: [],

    // WALI KELAS HUB STATE (Dashboard, Struktur, Piket, Konseling)
    waliSubTab: 'dashboard', // 'dashboard' | 'presensi' | 'struktur' | 'piket' | 'konseling'
    strukturalKelas: [],
    jadwalPiket: {
      "Senin": [],
      "Selasa": [],
      "Rabu": [],
      "Kamis": [],
      "Jumat": [],
      "Sabtu": []
    },
    catatanKonseling: [],
    piketHariFilter: 'Senin',
    konselingPrivacyMode: true, // Default disamarkan demi privasi saat di depan siswa
    konselingFilter: {
      siswaId: 'Semua',
      kategori: 'Semua',
      status: 'Semua',
      search: ''
    },

    // Modal & Form: Struktur Organisasi Kelas
    modalStrukturOpen: false,
    formStruktur: {
      id: '',
      jabatan: '',
      idSiswa: '',
      namaSiswa: '',
      keterangan: '',
      kelas: 'X3 Atlet'
    },

    // Modal & Form: Catatan Konseling & Pembinaan
    modalKonselingOpen: false,
    formKonseling: {
      id: '',
      idSiswa: '',
      namaSiswa: '',
      kelas: 'X3 Atlet',
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'Akademik',
      catatan: '',
      tindakLanjut: '',
      status: 'Dalam Pemantauan'
    },

    // Modal & Drag/Drop State: Jadwal Piket
    piketDragItem: null,
    piketDragOverHari: null,
    modalEditPiketOpen: false,
    formEditPiket: {
      idSiswa: '',
      namaSiswa: '',
      fromHari: 'Senin',
      toHari: 'Selasa'
    },

    // Daftar 9 Status Presensi Wali Kelas Resmi
    waliStatusOptions: [
      { id: 'Hadir', label: 'Hadir', bg: 'bg-emerald-600', text: 'text-white' },
      { id: 'Sakit', label: 'Sakit', bg: 'bg-blue-600', text: 'text-white' },
      { id: 'Izin', label: 'Izin', bg: 'bg-purple-600', text: 'text-white' },
      { id: 'Tahfidz', label: 'Tahfidz', bg: 'bg-teal-600', text: 'text-white' },
      { id: 'PTV', label: 'PTV', bg: 'bg-indigo-600', text: 'text-white' },
      { id: 'Organtri', label: 'Organtri', bg: 'bg-amber-600', text: 'text-white' },
      { id: 'Di Rumah', label: 'Di Rumah', bg: 'bg-cyan-600', text: 'text-white' },
      { id: 'Terlambat', label: 'Terlambat', bg: 'bg-yellow-500', text: 'text-slate-900' },
      { id: 'Tanpa Keterangan', label: 'Tanpa Keterangan', bg: 'bg-rose-600', text: 'text-white' }
    ],

    // Filter & Form States
    waliKelasFilter: {
      tanggal: new Date().toISOString().split('T')[0],
      sesi: 'Apel Pagi',
      kelas: 'X3 Atlet'
    },
    
    jurnalFilter: {
      kelas: 'Semua',
      search: '',
      tanggalAwal: '',
      tanggalAkhir: ''
    },

    nilaiFilter: {
      kelas: 'X3 Atlet',
      kategori: 'Semua',
      search: ''
    },

    bintangFilter: {
      kelas: 'X3 Atlet',
      search: ''
    },

    siswaFilter: {
      kelas: 'Semua',
      peminatan: 'Semua',
      search: ''
    },

    quickLinkFilter: {
      kategori: 'Semua',
      search: ''
    },

    // KELOMPOK BELAJAR & PROYEK KIMIA (Smart Heterogeneous Group Generator)
    kelompokProyek: [],
    groupFilter: {
      kelas: 'Semua',
      status: 'Semua',
      search: ''
    },
    formGroupGenerator: {
      kelas: 'X3 Atlet',
      judulProyek: '',
      mode: 'jumlahKelompok', // 'jumlahKelompok' | 'maxAnggota'
      jumlahKelompok: 6,
      maxAnggota: 5,
      tagihanKolom: '',
      deskripsi: ''
    },
    activeDraftProject: null,
    groupDragMember: null, // { fromGroupId, member }
    groupDragOverGroupId: null,
    unassignedMultiSelect: [],
    targetGroupForMultiAssign: '',
    unassignedSearchQuery: '',
    modalAddMemberToGroupOpen: false,
    selectedGroupForMemberAdd: null,
    modalEditGroupNameOpen: false,
    formEditGroupName: { id: '', namaKelompok: '', tema: '', icon: '' },
    modalNilaiKelompokOpen: false,
    selectedGroupForGrading: null,
    formNilaiKelompok: {
      projectId: '',
      groupId: '',
      namaKelompok: '',
      tagihanTerkait: '',
      nilaiKelompok: 85,
      catatanKelompok: '',
      anggotaNilai: []
    },

    // 7 Kategori Peminatan Siswa Lengkap
    peminatanList: [
      { id: 'Prima', label: '📚 Prima (Regular)', icon: '📚' },
      { id: 'Atlet', label: '🏆 Atlet (Basket / Futsal)', icon: '🏆' },
      { id: 'COC', label: '⚡ COC (Clash of Champions / Sains)', icon: '⚡' },
      { id: 'CTP', label: '🌐 CTP (Cambridge Training Program)', icon: '🌐' },
      { id: 'ITPP', label: '🎯 ITPP (International Test Prep)', icon: '🎯' },
      { id: 'ICP', label: '💎 ICP (International Class Program)', icon: '💎' },
      { id: 'IUPP', label: '🚀 IUPP (International Univ Prep)', icon: '🚀' }
    ],

    // Helper Badge Peminatan
    getPeminatanBadge(pem) {
      const p = String(pem || 'Prima').trim();
      switch (p.toUpperCase()) {
        case 'ATLET':
          return { label: 'Atlet', icon: '🏆', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
        case 'COC':
          return { label: 'COC', icon: '⚡', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800' };
        case 'CTP':
          return { label: 'CTP', icon: '🌐', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' };
        case 'ITPP':
          return { label: 'ITPP', icon: '🎯', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800' };
        case 'ICP':
          return { label: 'ICP', icon: '💎', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800' };
        case 'IUPP':
          return { label: 'IUPP', icon: '🚀', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
        case 'PRIMA':
        default:
          return { label: 'Prima', icon: '📚', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      }
    },

    // RANDOM STUDENT PICKER (Spin & Pick) STATE
    modalPickerOpen: false,
    pickerFullscreen: false,
    pickerFilter: {
      kelas: 'Semua',
      peminatan: 'Semua',
      gender: 'Semua',
      noRepeat: true,
      sound: true
    },
    pickedHistory: [], // IDs of picked students in current session
    isPicking: false,
    pickerCandidate: null,
    pickerResult: null,
    pickerTimerDuration: 30,
    pickerTimerRemaining: 0,
    pickerTimerRunning: false,
    pickerTimerInterval: null,

    // JADWAL KELAS & JADWAL MENGAJAR STATE
    jamPelajaran: {},  // will be populated by getDefaultJamPelajaran() in init
    jadwalKelas: [],   // [{hari, jamKe, mapel, guru}]
    jadwalMengajar: [], // [{hari, jamKe, tipeTugas, kelas, lantai}]
    jadwalKelasHariFilter: '',  // auto-set to current day in init
    jadwalMengajarHariFilter: '', // auto-set to current day in init
    modalJadwalKelasEditOpen: false,
    formJadwalKelas: { hari: '', jamMulai: 1, jamSelesai: 1, mapel: '', guru: '', isEdit: false },
    modalJadwalMengajarEditOpen: false,
    formJadwalMengajar: { hari: '', jamMulai: 1, jamSelesai: 1, tipeTugas: 'Mengajar', kelas: '', mapel: 'Kimia', lantai: 'Lantai 2', isEdit: false },
    modalSettingJamOpen: false,
    settingJamHari: 'Senin',

    // IMPOR JADWAL aSc TIMETABLES & AI VISION SCANNER STATE
    modalImporJadwalOpen: false,
    formImporJadwal: {
      target: 'mengajar',      // 'mengajar' | 'kelas'
      targetKelas: 'X3 Atlet', // kelas target saat target === 'kelas'
      inputMode: 'ai',         // 'ai' | 'paste' | 'file' | 'preset'
      rawText: '',
      fileName: '',
      replaceAll: true
    },
    imporJadwalStep: 'input',  // 'input' | 'preview'
    imporJadwalPreview: [],    // [{ hari, jamKe, waktu, mapel, guru, kelas, tipeTugas, lantai }]
    geminiApiKey: '',
    showApiKeyInput: false,
    isTestingGeminiApi: false,
    geminiApiTestStatus: null, // 'success' | 'error' | null
    geminiApiTestMessage: '',
    isScanningAi: false,
    scanAiProgress: '',
    scanAiFile: { name: '', size: '', base64: '', mimeType: '', previewUrl: '' },
    scanAiError: '',

    // KALKULATOR CEPAT KIMIA STATE
    chemTab: 'molar', // 'molar' | 'koligatif' | 'stoikiometri' | 'ph'
    calcMr: { formula: 'H2SO4', result: null },
    calcKoligatif: {
      jenis: 'didih', // 'didih' | 'beku' | 'uap' | 'osmotik'
      massaT: 18,
      mrT: 180,
      massaP: 500,
      pelarut: 'Air',
      p0: 23.76,
      temp: 25,
      vol: 500,
      tipeElektrolit: 'non', // 'non' | 'kuat' | 'lemah'
      ionN: 2,
      alpha: 1.0,
      result: null
    },
    calcStoikiometri: {
      mode: 'pengenceran', // 'pengenceran' | 'pencampuran' | 'mol_massa' | 'persen_molaritas'
      m1: 2,
      v1: 50,
      m2: 0.5,
      v2: '',
      targetSolve: 'v2', // 'v2' | 'm2' | 'v1' | 'm1'
      massa: 4,
      mr: 40,
      mol: 0.1,
      volGas: 2.24,
      kondisiGas: 'stp',
      persen: 37,
      massaJenis: 1.19,
      result: null
    },
    calcPH: {
      tipe: 'asam_kuat', // 'asam_kuat' | 'basa_kuat' | 'asam_lemah' | 'basa_lemah' | 'buffer_asam' | 'buffer_basa' | 'hidrolisis_asam' | 'hidrolisis_basa'
      konsentrasi: 0.01,
      valensi: 1,
      ka: 0.000018,
      kb: 0.000018,
      molAsam: 0.05,
      molBasa: 0.05,
      molGaram: 0.05,
      volTotal: 100,
      valensiGaram: 1,
      result: null
    },

    // PUSAT MODUL, LKPD & BANK VIDEO PRAKTIKUM STATE
    mediaPembelajaran: [],
    mediaBabFilter: 'Semua Bab',
    mediaTipeFilter: 'Semua Tipe',
    mediaSearchQuery: '',
    modalMediaEditOpen: false,
    formMedia: {
      id: '',
      bab: 'Sifat Koligatif Larutan',
      tipe: 'Video Praktikum',
      judul: '',
      deskripsi: '',
      url: '',
      isEdit: false
    },
    modalProyektorOpen: false,
    activeProyektorMedia: null,

    // Modals
    modalJurnalOpen: false,
    modalJurnalDetail: null,
    formJurnal: {
      id: '',
      tanggal: new Date().toISOString().split('T')[0],
      kelas: 'X3 Atlet',
      jamKe: '1 - 2',
      pertemuanKe: 1,
      materi: '',
      aktivitas: '',
      refleksi: '',
      tindakLanjut: '',
      presensi: []
    },

    modalTagihanBaruOpen: false,
    formTagihanBaru: {
      kelas: 'X3 Atlet',
      kategori: 'Tugas',
      judulMateri: '',
      kkm: 75
    },

    modalEditTagihanOpen: false,
    formEditTagihan: {
      kelas: 'X3 Atlet',
      oldJudul: '',
      newJudul: '',
      newKategori: 'Tugas',
      newKkm: 75
    },

    modalBintangOpen: false,
    selectedSiswaBintang: null,
    formBintang: {
      kategori: 'Menjawab Pertanyaan Guru di Kelas',
      poin: 1,
      alasan: ''
    },

    modalSiswaOpen: false,
    formSiswa: {
      id: '',
      nisn: '',
      nama: '',
      namaPanggilan: '',
      kelas: 'X3 Atlet',
      peminatan: 'Atlet',
      gender: 'L',
      noHp: '',
      noHpOrtu: '',
      status: 'Aktif'
    },

    modalKelasOpen: false,
    formKelas: {
      id: '',
      nama: '',
      deskripsi: '',
      isWaliKelas: false
    },

    modalQuickLinkOpen: false,
    formQuickLink: {
      id: '',
      judul: '',
      url: '',
      kategori: 'Umum',
      deskripsi: '',
      icon: 'link-2',
      warna: 'blue'
    },

    modalPasteOpen: false,
    pasteRawText: '',
    pasteKelasTarget: 'X3 Atlet',

    // PWA (PROGRESSIVE WEB APP) STATE
    deferredPwaPrompt: null,
    canInstallPwa: false,

    // TRANSISI TAHUN AJARAN & RESET DATA STATE
    modalResetTahunAjaranOpen: false,
    formResetTahunAjaran: {
      tahunBaru: '2026/2027',
      semesterBaru: 'Ganjil',
      resetSiswa: true,
      resetNilai: true,
      resetJurnal: true,
      resetPresensiWali: true,
      resetBintang: true,
      resetKelompok: true,
      resetKonseling: true,
      resetPiket: true,
      resetJadwal: false,
      resetMedia: false,
      backupDownloaded: false,
      confirmKeyword: ''
    },

    // Toast Notification
    toast: {
      show: false,
      message: '',
      type: 'success'
    },

    get chartKehadiran() {
      const ctx = typeof document !== 'undefined' ? document.getElementById('chartKehadiran') : null;
      return ctx && typeof Chart !== 'undefined' ? Chart.getChart(ctx) || lmsChartInstances.kehadiran : lmsChartInstances.kehadiran;
    },
    get chartNilai() {
      const ctx = typeof document !== 'undefined' ? document.getElementById('chartNilai') : null;
      return ctx && typeof Chart !== 'undefined' ? Chart.getChart(ctx) || lmsChartInstances.nilai : lmsChartInstances.nilai;
    },

    // Initializer
    init() {
      this.initTheme();
      this.waliKelasFilter.tanggal = this.getTodayDateString();
      this.formKonseling.tanggal = this.getTodayDateString();
      this.loadLocalData();
      
      // PWA Install Prompt Listener & Service Worker Registration
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPwaPrompt = e;
        this.canInstallPwa = true;
      });

      window.addEventListener('appinstalled', () => {
        this.canInstallPwa = false;
        this.deferredPwaPrompt = null;
        this.showToast('🎉 LMS Kimia berhasil diinstall ke layar utama!', 'success');
      });

      // Pastikan seluruh siswa memiliki namaPanggilan (auto-generate default jika kosong)
      if (this.siswa && Array.isArray(this.siswa)) {
        let modifiedSiswa = false;
        this.siswa.forEach(s => {
          if (!s.namaPanggilan || String(s.namaPanggilan).trim() === '') {
            s.namaPanggilan = this.generateDefaultNickname(s.nama);
            modifiedSiswa = true;
          }
        });
        if (modifiedSiswa) {
          this.saveLocalData();
        }
      }

      if (!this.jamPelajaran || Object.keys(this.jamPelajaran).length === 0 || !this.jamPelajaran['Senin'] || this.jamPelajaran['Senin'].length < 11 || this.jamPelajaran['Senin'][0].label !== 'Morning Roll Call') {
        this.jamPelajaran = this.getDefaultJamPelajaran();
        this.saveLocalData();
      }
      const todayName = this.getCurrentDayName();
      this.jadwalKelasHariFilter = todayName !== 'Minggu' ? todayName : 'Senin';
      this.jadwalMengajarHariFilter = todayName !== 'Minggu' ? todayName : 'Senin';
      this.geminiApiKey = localStorage.getItem('LMS_GEMINI_API_KEY') || '';

      // Auto-load most recent active group project if available
      if (!this.activeDraftProject && this.kelompokProyek && this.kelompokProyek.length > 0) {
        const activeProj = this.kelompokProyek.find(p => p.status === 'Aktif') || this.kelompokProyek[0];
        if (activeProj) {
          this.activeDraftProject = JSON.parse(JSON.stringify(activeProj));
          if (activeProj.groups && activeProj.groups.length > 0) {
            this.targetGroupForMultiAssign = activeProj.groups[0].id;
          }
        }
      }

      this.initLucideIcons();
      this.calcMrFormula();
      this.calculateKoligatif();
      this.calculateStoikiometri();
      this.calculatePH();
      this.$nextTick(() => {
        this.initCharts();
        this.checkGasEnvironment();
      });

      // Auto-sync multi-perangkat saat tab kembali aktif atau dibuka di perangkat lain (tablet/HP)
      let lastAutoFetch = Date.now();
      const triggerSilentSync = () => {
        if (Date.now() - lastAutoFetch > 15000 && this.gasWebAppUrl && this.syncStatus !== 'syncing') {
          lastAutoFetch = Date.now();
          this.fetchDataFromGoogleDrive(true);
        }
      };
      window.addEventListener('focus', triggerSilentSync);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          triggerSilentSync();
        }
      });

      this.$watch('currentTab', () => {
        this.$nextTick(() => {
          this.initLucideIcons();
          if (this.currentTab === 'dashboard') {
            this.updateCharts();
          }
        });
      });

      this.$watch('chemTab', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('mediaBabFilter', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('mediaTipeFilter', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('nilaiFilter.kelas', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('nilaiFilter.kategori', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('quickLinkFilter.kategori', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('waliSubTab', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('waliKelasFilter.tanggal', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('waliKelasFilter.sesi', () => {
        this.$nextTick(() => this.initLucideIcons());
      });

      this.$watch('waliKelasFilter.kelas', () => {
        this.$nextTick(() => this.initLucideIcons());
      });
    },

    getTodayDateString() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // =========================================================================
    // THEME (DARK / LIGHT MODE)
    // =========================================================================
    initTheme() {
      const savedTheme = safeStorage.getItem('LMS_THEME');
      if (savedTheme === 'light') {
        this.darkMode = false;
        document.documentElement.classList.remove('dark');
      } else {
        // Obsidian Dark Mode as default
        this.darkMode = true;
        document.documentElement.classList.add('dark');
      }
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
        safeStorage.setItem('LMS_THEME', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        safeStorage.setItem('LMS_THEME', 'light');
      }
      this.initLucideIcons();
      this.updateCharts();
    },

    // =========================================================================
    // LOCAL DATA STORAGE
    // =========================================================================
    loadLocalData() {
      const saved = safeStorage.getItem('LMS_KIMIA_REAL_DATA_V6');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.guru = parsed.guru || this.guru;
          this.guru.nama = "Tito Vanzal, S.Pd.";
          this.guru.sekolah = "SMA Progresif Bumi Shalawat";
          this.guru.kelasWali = parsed.guru?.kelasWali || "X3 Atlet";
          if (!this.guru.tahunAjaran || this.guru.tahunAjaran === "2025/2026") {
            this.guru.tahunAjaran = "2026/2027";
          }
          
          this.kelasList = parsed.kelasList && parsed.kelasList.length > 0 ? parsed.kelasList : this.kelasList;
          this.tagihanDefinisi = (parsed.tagihanDefinisi || []).filter(t => {
            if (!t.judulMateri) return false;
            const j = t.judulMateri.toLowerCase().trim();
            const GARBAGE = ['nilai angka', 'nilai', 'tanggal', 'jumlah bintang', 'kkm', 'status', 'id nilai', 'id siswa', 'nama siswa', 'kelas', 'kategori', 'catatan guru', 'catatan', 'waktu input', 'waktu', 'no', 'nisn', 'nis', 'peminatan', 'gender', 'l/p', 'jk', 'no hp', 'sesi', 'hadir', 'alasan', 'jabatan', 'jumlah', 'bintang', 'murobbi', 'no hp murobbi'];
            return !GARBAGE.includes(j) && j.length >= 2;
          });
          
          // DEDUPLIKASI KETAT SISWA DARI LOCAL STORAGE
          if (parsed.siswa && Array.isArray(parsed.siswa)) {
            const studentMap = new Map();
            parsed.siswa.forEach(s => {
              const key = (s.nama || '').toLowerCase().trim() + '|||' + (s.kelas || '').toLowerCase().trim();
              if (s.nama && !studentMap.has(key)) {
                studentMap.set(key, s);
              }
            });
            this.siswa = Array.from(studentMap.values());
            this.siswa.forEach((s, idx) => {
              if (!s.id || s.id.startsWith('SIS-')) {
                s.id = 'SIS-' + (idx + 1).toString().padStart(3, '0');
              }
              if (!s.namaPanggilan || String(s.namaPanggilan).trim() === '') {
                s.namaPanggilan = this.generateDefaultNickname(s.nama);
              }
            });
          } else {
            this.siswa = [];
          }

          // DEDUPLIKASI KETAT PRESENSI WALI DARI LOCAL STORAGE (Data terbawah / terbaru selalu menang)
          if (parsed.presensiWali && Array.isArray(parsed.presensiWali)) {
            const presensiMap = new Map();
            parsed.presensiWali.forEach(p => {
              const tgl = this.normalizeDateString(p.tanggal);
              const nSesi = this.normalizeStr(p.sesi || '') || 'apelpagi';
              const normSesi = nSesi.includes('family') ? 'familytime' : 'apelpagi';
              const cleanName = this.normalizeStr(p.namaSiswa || p.nama || '');
              const cleanId = this.normalizeStr(p.idSiswa || '');
              const sIdent = cleanName || cleanId;
              if (sIdent && tgl) {
                const key = tgl + '|||' + normSesi + '|||' + sIdent;
                presensiMap.set(key, {
                  ...p,
                  tanggal: tgl,
                  sesi: p.sesi || (normSesi === 'familytime' ? 'Family Time' : 'Apel Pagi'),
                  status: p.status || 'Hadir'
                });
              }
            });
            this.presensiWali = Array.from(presensiMap.values());
          } else {
            this.presensiWali = [];
          }

          this.jurnalKimia = parsed.jurnalKimia || [];
          this.presensiKimia = parsed.presensiKimia || [];
          
          // DEDUPLIKASI KETAT NILAI DARI LOCAL STORAGE
          if (parsed.nilai && Array.isArray(parsed.nilai)) {
            const GARBAGE_N = ['nilai angka', 'nilai', 'tanggal', 'jumlah bintang', 'kkm', 'status', 'id nilai', 'id siswa', 'nama siswa', 'kelas', 'kategori', 'catatan guru', 'catatan', 'waktu input', 'waktu', 'no', 'nisn', 'nis', 'peminatan', 'gender', 'l/p', 'jk', 'no hp', 'sesi', 'hadir', 'alasan', 'jabatan', 'jumlah', 'bintang', 'murobbi', 'no hp murobbi'];
            const nilaiMap = new Map();
            parsed.nilai.forEach(n => {
              const jLower = (n.judulMateri || '').toLowerCase().trim();
              if (GARBAGE_N.includes(jLower) || jLower.length < 2) return; // skip sampah
              const key = (n.namaSiswa || n.idSiswa || '').toLowerCase().trim() + '_' + jLower + '_' + (n.kelas || '').toLowerCase().trim();
              if (key.trim() && !nilaiMap.has(key)) {
                nilaiMap.set(key, n);
              }
            });
            this.nilai = Array.from(nilaiMap.values());
          } else {
            this.nilai = [];
          }

          this.bintangLog = parsed.bintangLog || [];
          this.kategoriBintang = parsed.kategoriBintang || (window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.kategoriBintang : []);
          
          // Data Wali Kelas Hub
          this.strukturalKelas = parsed.strukturalKelas || (window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.strukturalKelas : []);
          this.jadwalPiket = parsed.jadwalPiket || (window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.jadwalPiket : { "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [], "Sabtu": [] });
          this.catatanKonseling = parsed.catatanKonseling || (window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.catatanKonseling : []);

          // Data Kelompok Proyek Kimia
          this.kelompokProyek = parsed.kelompokProyek || [];

          // Pastikan 8 Quick Link terisi penuh
          if (!parsed.quickLinks || parsed.quickLinks.length === 0) {
            this.quickLinks = window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.quickLinks : [];
          } else {
            this.quickLinks = parsed.quickLinks;
          }
          this.jamPelajaran = parsed.jamPelajaran || {};
          this.jadwalKelas = parsed.jadwalKelas || [];
          this.jadwalMengajar = parsed.jadwalMengajar || [];
          this.mediaPembelajaran = (parsed.mediaPembelajaran && parsed.mediaPembelajaran.length > 0) ? parsed.mediaPembelajaran : this.getDefaultMediaPembelajaran();

          const centralApiUrl = (typeof window !== 'undefined' && window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.LMS_API) || 'https://script.google.com/macros/s/AKfycbwhHSF2V_rUkObqGcQ0aGfy58g2eIe73VPgAIbyEKn2Oxw8m7FVIyu2oVKHzyLGsu2q/exec';
          this.gasWebAppUrl = (this.guru.gasWebAppUrl && this.guru.gasWebAppUrl.trim()) ? this.guru.gasWebAppUrl.trim() : centralApiUrl;
          this.guru.gasWebAppUrl = this.gasWebAppUrl;
          
          if (this.kelasList.length > 0) {
            this.waliKelasFilter.kelas = this.guru.kelasWali || this.kelasList[0].nama;
            this.nilaiFilter.kelas = this.waliKelasFilter.kelas;
            this.bintangFilter.kelas = this.waliKelasFilter.kelas;
            this.groupFilter.kelas = 'Semua';
            this.formGroupGenerator.kelas = this.waliKelasFilter.kelas;
          }
          return;
        } catch (e) {
          console.error("Gagal parse local data", e);
        }
      }

      if (window.DEFAULT_SAMPLE_DATA) {
        this.guru = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.guru));
        this.kelasList = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.kelasList));
        this.tagihanDefinisi = [];
        this.siswa = [];
        this.presensiWali = [];
        this.jurnalKimia = [];
        this.presensiKimia = [];
        this.nilai = [];
        this.bintangLog = [];
        this.kategoriBintang = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.kategoriBintang));
        this.strukturalKelas = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.strukturalKelas || []));
        this.jadwalPiket = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.jadwalPiket || { "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [], "Sabtu": [] }));
        this.catatanKonseling = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.catatanKonseling || []));
        this.kelompokProyek = [];
        this.quickLinks = JSON.parse(JSON.stringify(window.DEFAULT_SAMPLE_DATA.quickLinks || []));
        this.mediaPembelajaran = this.getDefaultMediaPembelajaran();
        const centralApiUrl = (typeof window !== 'undefined' && window.PORTALKIMIA_CONFIG && window.PORTALKIMIA_CONFIG.LMS_API) || 'https://script.google.com/macros/s/AKfycbwhHSF2V_rUkObqGcQ0aGfy58g2eIe73VPgAIbyEKn2Oxw8m7FVIyu2oVKHzyLGsu2q/exec';
        this.gasWebAppUrl = (this.guru.gasWebAppUrl && this.guru.gasWebAppUrl.trim()) ? this.guru.gasWebAppUrl.trim() : centralApiUrl;
        this.guru.gasWebAppUrl = this.gasWebAppUrl;
        this.waliKelasFilter.kelas = 'X3 Atlet';
        this.nilaiFilter.kelas = 'X3 Atlet';
        this.bintangFilter.kelas = 'X3 Atlet';
        this.groupFilter.kelas = 'Semua';
        this.formGroupGenerator.kelas = 'X3 Atlet';
        this.saveLocalData();
      }
    },

    saveLocalData() {
      const dataToSave = {
        guru: this.guru,
        kelasList: this.kelasList,
        tagihanDefinisi: this.tagihanDefinisi,
        siswa: this.siswa,
        presensiWali: this.presensiWali,
        jurnalKimia: this.jurnalKimia,
        presensiKimia: this.presensiKimia,
        nilai: this.nilai,
        bintangLog: this.bintangLog,
        kategoriBintang: this.kategoriBintang,
        strukturalKelas: this.strukturalKelas,
        jadwalPiket: this.jadwalPiket,
        catatanKonseling: this.catatanKonseling,
        kelompokProyek: this.kelompokProyek,
        quickLinks: this.quickLinks,
        jadwalKelas: this.jadwalKelas,
        jadwalMengajar: this.jadwalMengajar,
        jamPelajaran: this.jamPelajaran,
        mediaPembelajaran: this.mediaPembelajaran
      };
      safeStorage.setItem('LMS_KIMIA_REAL_DATA_V6', JSON.stringify(dataToSave));
    },

    initLucideIcons() {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3500);
    },

    // =========================================================================
    // GOOGLE DRIVE & SPREADSHEET SYNC
    // =========================================================================
    // Normalization Helpers untuk Pencocokan Data Lintas Perangkat
    normalizeStr(s) {
      return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    },

    normalizeDateString(d) {
      if (!d) return '';
      const s = String(d).split('T')[0].trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const parts = s.split(/[\/\-\.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return parts[0] + '-' + parts[1].padStart(2, '0') + '-' + parts[2].padStart(2, '0');
        }
        if (parts[2].length === 4) {
          return parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
        }
      }
      return s;
    },

    isSameDate(d1, d2) {
      if (!d1 || !d2) return false;
      return this.normalizeDateString(d1) === this.normalizeDateString(d2);
    },

    isSameStudent(s1, s2) {
      if (!s1 || !s2) return false;
      const id1 = String(s1.idSiswa || s1.id || '').trim().toLowerCase();
      const id2 = String(s2.idSiswa || s2.id || '').trim().toLowerCase();
      if (id1 && id2 && id1 === id2) return true;
      const nisn1 = String(s1.nisn || '').trim();
      const nisn2 = String(s2.nisn || '').trim();
      if (nisn1 && nisn2 && nisn1 === nisn2 && nisn1.length > 3) return true;
      const n1 = this.normalizeStr(s1.namaSiswa || s1.nama);
      const n2 = this.normalizeStr(s2.namaSiswa || s2.nama);
      if (!n1 || !n2) return false;
      if (n1 === n2) return true;
      if ((n1.includes(n2) || n2.includes(n1)) && Math.min(n1.length, n2.length) >= 5) {
        return true;
      }
      return false;
    },

    isSameTask(t1, t2) {
      const k1 = this.normalizeStr(t1);
      const k2 = this.normalizeStr(t2);
      return k1 && k2 && k1 === k2;
    },

    isSameClass(c1, c2) {
      const k1 = this.normalizeStr(c1);
      const k2 = this.normalizeStr(c2);
      return k1 && k2 && (k1 === k2 || k1.includes(k2) || k2.includes(k1));
    },

    checkGasEnvironment() {
      if (this.isGasEnvironment) {
        this.syncStatus = 'synced';
        this.syncMessage = 'Terhubung langsung ke Google Spreadsheet';
        this.fetchDataFromGoogleDrive();
      } else if (this.gasWebAppUrl) {
        this.syncStatus = 'synced';
        this.syncMessage = 'URL Google Web App aktif';
        this.fetchDataFromGoogleDrive();
      }
    },

    fetchDataFromGoogleDrive(silent = false) {
      this.syncStatus = 'syncing';

      if (this.isGasEnvironment) {
        google.script.run
          .withSuccessHandler((res) => {
            this.handleFetchedCloudData(res, silent);
          })
          .withFailureHandler((err) => {
            this.syncStatus = 'error';
            if (!silent) this.showToast('Gagal memuat data dari Spreadsheet: ' + err, 'error');
            else console.warn('Silent sync error:', err);
          })
          .handleAction('getAllData', {});
      } else if (this.gasWebAppUrl) {
        const cleanUrl = this.gasWebAppUrl.trim().replace(/\/+$/, '');
        const fetchUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'action=getAllData&_t=' + new Date().getTime();

        fetch(fetchUrl)
          .then(res => res.json())
          .then(data => {
            if (data && data.status === 'success' && data.data) {
              this.handleFetchedCloudData(data.data, silent);
            } else {
              this.syncStatus = 'error';
              if (!silent) this.showToast('Respon dari Google Web App: ' + (data ? data.message : ''), 'error');
            }
          })
          .catch(err => {
            this.syncStatus = 'error';
            if (!silent) this.showToast('Gagal koneksi ke Web App Google: ' + err, 'error');
            else console.warn('Silent sync connection error:', err);
          });
      } else {
        this.syncStatus = 'synced';
      }
    },

    handleFetchedCloudData(data, silent = false) {
      if (data) {
        try {
          this.syncDataFromCloudPayload(data);
        } catch (err) {
          console.error('Error saat sinkronisasi payload:', err);
        }
        const countSiswa = (data.siswa && data.siswa.length) || 0;
        const countJurnal = (data.jurnalKimia && data.jurnalKimia.length) || 0;
        const countNilai = (data.nilai && data.nilai.length) || 0;
        
        if (!silent) {
          if (countSiswa > 0 || countJurnal > 0 || countNilai > 0) {
            this.showToast(`Berhasil menarik ${countSiswa} siswa, ${this.kelasList.length} kelas, ${countNilai} data nilai dari Spreadsheet!`, 'success');
          } else {
            this.showToast('Spreadsheet terhubung. Belum ada baris data siswa yang ditemukan pada sheet.', 'info');
          }
        }
      }
      this.syncStatus = 'synced';
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },

    syncDataFromCloudPayload(data) {
      if (data.guru) {
        this.guru.nama = "Tito Vanzal, S.Pd.";
        this.guru.sekolah = "SMA Progresif Bumi Shalawat";
        this.guru.kelasWali = data.guru.kelasWali || "X3 Atlet";
      }

      if (data.geminiApiKey && String(data.geminiApiKey).trim() !== '') {
        this.geminiApiKey = String(data.geminiApiKey).trim();
        localStorage.setItem('LMS_GEMINI_API_KEY', this.geminiApiKey);
      }

      if (data.siswa && Array.isArray(data.siswa) && data.siswa.length > 0) {
        // DEDUPLIKASI KETAT SISWA
        const studentMap = new Map();
        data.siswa.forEach(s => {
          const key = (s.nama || '').toLowerCase().trim() + '|||' + (s.kelas || '').toLowerCase().trim();
          if (s.nama && !studentMap.has(key)) {
            studentMap.set(key, s);
          }
        });
        this.siswa = Array.from(studentMap.values());
        this.siswa.forEach((s, idx) => {
          if (!s.id || s.id.startsWith('SIS-')) {
            s.id = 'SIS-' + (idx + 1).toString().padStart(3, '0');
          }
          if (!s.namaPanggilan || String(s.namaPanggilan).trim() === '') {
            s.namaPanggilan = this.generateDefaultNickname(s.nama);
          }
        });

        const uniqueKelasSet = new Set();
        this.siswa.forEach(s => {
          if (s.kelas && s.kelas.trim()) {
            uniqueKelasSet.add(s.kelas.trim());
          }
        });

        if (!uniqueKelasSet.has('X3 Atlet')) {
          uniqueKelasSet.add('X3 Atlet');
        }

        if (data.kelasList && data.kelasList.length > 0) {
          this.kelasList = data.kelasList;
        } else {
          this.kelasList = Array.from(uniqueKelasSet).map((kNama, idx) => ({
            id: 'KLS-' + (idx + 1).toString().padStart(2, '0'),
            nama: kNama,
            deskripsi: 'Kelas Pembelajaran',
            isWaliKelas: (kNama === 'X3 Atlet' || idx === 0)
          }));
        }

        if (this.kelasList.length > 0) {
          if (!this.kelasList.find(k => k.nama === this.waliKelasFilter.kelas)) {
            this.waliKelasFilter.kelas = 'X3 Atlet';
          }
          if (!this.kelasList.find(k => k.nama === this.nilaiFilter.kelas)) {
            this.nilaiFilter.kelas = this.kelasList[0].nama;
          }
          if (!this.kelasList.find(k => k.nama === this.bintangFilter.kelas)) {
            this.bintangFilter.kelas = this.kelasList[0].nama;
          }
        }
      }

      // SINKRONISASI NILAI LENGKAP DUA ARAH
      if (data.nilai && Array.isArray(data.nilai)) {
        // Daftar nama kolom spreadsheet yang BUKAN nama tagihan (pasti sampah kalau muncul sebagai judulMateri)
        const GARBAGE_TAGIHAN = ['nilai angka', 'nilai', 'tanggal', 'jumlah bintang', 'kkm', 'status', 'id nilai', 'id siswa', 'nama siswa', 'kelas', 'kategori', 'catatan guru', 'catatan', 'waktu input', 'waktu', 'no', 'nisn', 'nis', 'peminatan', 'gender', 'l/p', 'jk', 'no hp', 'sesi', 'hadir', 'alasan', 'jabatan', 'jumlah', 'bintang', 'murobbi', 'no hp murobbi'];
        const isGarbageTagihan = (judul) => {
          if (!judul) return true;
          const j = judul.toLowerCase().trim();
          return GARBAGE_TAGIHAN.includes(j) || j.length < 2;
        };

        const mergedNilaiMap = new Map();
        
        // 1. Muat data lokal yang ada
        this.nilai.forEach(item => {
          if (isGarbageTagihan(item.judulMateri)) return; // skip sampah lokal
          const key = this.normalizeStr(item.namaSiswa || item.idSiswa) + '|||' + this.normalizeStr(item.judulMateri) + '|||' + this.normalizeStr(item.kelas);
          if (key.replace(/\|/g, '').trim()) mergedNilaiMap.set(key, item);
        });

        // 2. Timpa dengan data dari Cloud Google Sheets (Data Cloud adalah sumber utama)
        data.nilai.forEach(item => {
          if (isGarbageTagihan(item.judulMateri)) return; // skip sampah dari cloud
          const key = this.normalizeStr(item.namaSiswa || item.idSiswa) + '|||' + this.normalizeStr(item.judulMateri) + '|||' + this.normalizeStr(item.kelas);
          const itemKat = item.kategori || item.jenisTagihan || 'Tugas';
          if (key.replace(/\|/g, '').trim()) {
            mergedNilaiMap.set(key, {
              ...item,
              kategori: itemKat,
              jenisTagihan: itemKat,
              nilai: (item.nilai !== '' && item.nilai !== null && !isNaN(Number(item.nilai))) ? Number(item.nilai) : ''
            });
          }
        });

        this.nilai = Array.from(mergedNilaiMap.values());

        // 3. Rekam SEMUA kolom tagihan dari cloud ke tagihanDefinisi agar muncul di semua perangkat
        data.nilai.forEach(n => {
          if (isGarbageTagihan(n.judulMateri)) return; // skip sampah
          if (n.judulMateri && n.kelas) {
            const exists = this.tagihanDefinisi.find(t => 
              this.isSameTask(t.judulMateri, n.judulMateri) && 
              this.isSameClass(t.kelas, n.kelas)
            );
            const nKat = n.kategori || n.jenisTagihan || 'Tugas';
            if (!exists) {
              this.tagihanDefinisi.push({
                judulMateri: n.judulMateri.trim(),
                kategori: nKat,
                kkm: Number(n.kkm) || 75,
                kelas: n.kelas.trim()
              });
            } else if (!exists.kategori || exists.kategori !== nKat) {
              exists.kategori = nKat;
            }
          }
        });

        // 4. Bersihkan tagihanDefinisi dari sampah yang terlanjur masuk
        this.tagihanDefinisi = this.tagihanDefinisi.filter(t => !isGarbageTagihan(t.judulMateri));
      }

      if (data.jurnalKimia && Array.isArray(data.jurnalKimia)) {
        this.jurnalKimia = data.jurnalKimia;
      }
      if (data.presensiWali && Array.isArray(data.presensiWali)) {
        const normDate = (d) => this.normalizeDateString(d);
        const normStr = (s) => this.normalizeStr(s);
        const presensiMap = new Map();

        // 1. Muat data dari cloud spreadsheet (data terbawah / input terbaru selalu menimpa entri lama)
        data.presensiWali.forEach(p => {
          const tgl = normDate(p.tanggal);
          const nSesi = normStr(p.sesi || '') || 'apelpagi';
          const normSesi = nSesi.includes('family') ? 'familytime' : 'apelpagi';
          
          const matchedSiswa = this.siswa.find(s => this.isSameStudent(s, p));
          const sIdent = matchedSiswa ? normStr(matchedSiswa.nama) : (normStr(p.namaSiswa || p.nama) || normStr(p.idSiswa));
          
          if (sIdent && tgl) {
            const key = tgl + '|||' + normSesi + '|||' + sIdent;
            presensiMap.set(key, {
              ...p,
              tanggal: tgl,
              sesi: p.sesi || (normSesi === 'familytime' ? 'Family Time' : 'Apel Pagi'),
              status: p.status || 'Hadir',
              namaSiswa: matchedSiswa ? matchedSiswa.nama : (p.namaSiswa || p.nama),
              idSiswa: matchedSiswa ? matchedSiswa.id : (p.idSiswa || ''),
              kelas: (matchedSiswa ? matchedSiswa.kelas : p.kelas) || 'X3 Atlet'
            });
          }
        });

        // 2. Pertahankan entri lokal HANYA jika siswa tersebut belum ada sama sekali di cloud pada tanggal & sesi tersebut
        this.presensiWali.forEach(p => {
          const tgl = normDate(p.tanggal);
          const nSesi = normStr(p.sesi || '') || 'apelpagi';
          const normSesi = nSesi.includes('family') ? 'familytime' : 'apelpagi';
          const matchedSiswa = this.siswa.find(s => this.isSameStudent(s, p));
          const sIdent = matchedSiswa ? normStr(matchedSiswa.nama) : (normStr(p.namaSiswa || p.nama) || normStr(p.idSiswa));
          
          if (sIdent && tgl) {
            const key = tgl + '|||' + normSesi + '|||' + sIdent;
            if (!presensiMap.has(key)) {
              presensiMap.set(key, p);
            }
          }
        });

        this.presensiWali = Array.from(presensiMap.values());
        this.saveLocalData();
        this.$nextTick(() => {
          this.updateCharts();
        });
      }
      if (data.presensiKimia && Array.isArray(data.presensiKimia)) {
        this.presensiKimia = data.presensiKimia;
      }
      if (data.bintangLog && Array.isArray(data.bintangLog)) {
        this.bintangLog = data.bintangLog;
      }

      if (data.strukturalKelas && Array.isArray(data.strukturalKelas) && data.strukturalKelas.length > 0) {
        this.strukturalKelas = data.strukturalKelas;
      }
      if (data.jadwalPiket && typeof data.jadwalPiket === 'object') {
        this.jadwalPiket = data.jadwalPiket;
      }
      if (data.catatanKonseling && Array.isArray(data.catatanKonseling) && data.catatanKonseling.length > 0) {
        this.catatanKonseling = data.catatanKonseling;
      }
      if (data.kelompokProyek && Array.isArray(data.kelompokProyek) && data.kelompokProyek.length > 0) {
        this.kelompokProyek = data.kelompokProyek;
      }
      if (data.jadwalKelas && Array.isArray(data.jadwalKelas) && data.jadwalKelas.length > 0) {
        this.jadwalKelas = data.jadwalKelas;
      }
      if (data.jadwalMengajar && Array.isArray(data.jadwalMengajar) && data.jadwalMengajar.length > 0) {
        this.jadwalMengajar = data.jadwalMengajar;
      }
      if (data.jamPelajaran && typeof data.jamPelajaran === 'object' && Object.keys(data.jamPelajaran).length > 0) {
        const hasValidSenin = Array.isArray(data.jamPelajaran['Senin']) && data.jamPelajaran['Senin'].length >= 11;
        if (hasValidSenin) {
          this.jamPelajaran = data.jamPelajaran;
        } else if (!this.jamPelajaran || !this.jamPelajaran['Senin'] || this.jamPelajaran['Senin'].length < 11) {
          this.jamPelajaran = this.getDefaultJamPelajaran();
        }
      }

      if (data.quickLinks && Array.isArray(data.quickLinks) && data.quickLinks.length > 0) {
        this.quickLinks = data.quickLinks;
      } else if (!this.quickLinks || this.quickLinks.length === 0) {
        this.quickLinks = window.DEFAULT_SAMPLE_DATA ? window.DEFAULT_SAMPLE_DATA.quickLinks : [];
      }

      if (data.mediaPembelajaran && Array.isArray(data.mediaPembelajaran) && data.mediaPembelajaran.length > 0) {
        this.mediaPembelajaran = data.mediaPembelajaran;
      } else if (!this.mediaPembelajaran || this.mediaPembelajaran.length === 0) {
        this.mediaPembelajaran = this.getDefaultMediaPembelajaran();
      }

      this.saveLocalData();
      this.recalculateStarPoints();
    },

    syncToGoogleDrive(action, payload, successCallback) {
      this.saveLocalData();
      this.syncStatus = 'syncing';

      if (this.isGasEnvironment) {
        google.script.run
          .withSuccessHandler((res) => {
            this.syncStatus = 'synced';
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            if (successCallback) successCallback(res);
          })
          .withFailureHandler((err) => {
            this.syncStatus = 'error';
            this.showToast('Sync Google Sheets bermasalah: ' + err, 'error');
          })
          .handleAction(action, payload);
      } else if (this.gasWebAppUrl) {
        const cleanUrl = this.gasWebAppUrl.trim().replace(/\/+$/, '');
        fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: action, data: payload })
        })
        .then(() => {
          this.syncStatus = 'synced';
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          if (successCallback) successCallback();
        })
        .catch(err => {
          this.syncStatus = 'error';
          console.error(err);
        });
      } else {
        this.syncStatus = 'synced';
        this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (successCallback) successCallback();
      }
    },

    saveGasUrl() {
      this.guru.gasWebAppUrl = this.gasWebAppUrl.trim();
      this.saveLocalData();
      this.showToast('URL Google Apps Script berhasil disimpan!', 'success');
      this.fetchDataFromGoogleDrive();
    },

    // =========================================================================
    // IMPORT CEPAT: COPY PASTE DARI SPREADSHEET / EXCEL
    // =========================================================================
    openModalPaste() {
      this.pasteRawText = '';
      this.pasteKelasTarget = this.waliKelasFilter.kelas || 'X3 Atlet';
      this.modalPasteOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    parseAndImportPastedText() {
      if (!this.pasteRawText.trim()) {
        this.showToast('Tempelkan (Paste) data teks dari Spreadsheet terlebih dahulu!', 'error');
        return;
      }

      const lines = this.pasteRawText.trim().split(/\r?\n/);
      let countAdded = 0;
      const targetKelas = this.pasteKelasTarget.trim() || 'X3 Atlet';

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        
        const cols = line.includes('\t') ? line.split('\t') : (line.includes(';') ? line.split(';') : line.split(','));
        const cleanCols = cols.map(c => c.trim().replace(/^["']|["']$/g, ''));

        const headerTest = cleanCols.map(c => c.toLowerCase());
        if (headerTest.includes('nama') || headerTest.includes('nama siswa') || headerTest.includes('nisn') || headerTest.includes('no')) {
          return;
        }

        let nama = '';
        let kodeSiswa = '';
        let nisn = '';
        let gender = 'L';
        let noHp = '';
        let noHpOrtu = '';
        let kelas = targetKelas;

        cleanCols.forEach((cell) => {
          const val = cell.trim();
          if (!val) return;

          if (/^[LP]$/i.test(val) || /^laki|^perempuan/i.test(val)) {
            gender = val.toUpperCase().startsWith('P') ? 'P' : 'L';
          } else if (/^[a-zA-Z0-9]+-[0-9]+$/i.test(val) || /^X[0-9]-[0-9]+/i.test(val)) {
            kodeSiswa = val;
          } else if (/^\d{8,12}$/.test(val) && !nisn) {
            nisn = val;
          } else if (/^08\d{8,13}$/.test(val)) {
            if (!noHp) noHp = val; else noHpOrtu = val;
          } else if (val.length > 1 && !/^[LP]$/i.test(val) && !/^\d+$/.test(val)) {
            if (!nama) {
              nama = val;
            }
          }
        });

        if (!nama && cleanCols.length >= 2) {
          const candidates = cleanCols.filter(c => c.length > 2 && !/^[LP]$/i.test(c) && !/^\d+$/.test(c));
          if (candidates.length > 0) {
            nama = candidates[candidates.length - 1];
          }
        }

        if (nama && nama.length > 1) {
          const sId = kodeSiswa || ('SIS-' + (this.siswa.length + 1).toString().padStart(3, '0'));
          const sNisn = nisn || kodeSiswa || String(1000 + this.siswa.length + idx + 1);

          this.siswa.push({
            id: sId,
            nisn: sNisn,
            nama: nama,
            kelas: kelas,
            gender: gender,
            noHp: noHp,
            noHpOrtu: noHpOrtu,
            status: 'Aktif',
            totalBintang: 0
          });
          countAdded++;
        }
      });

      if (!this.kelasList.find(k => k.nama === targetKelas)) {
        this.kelasList.push({
          id: 'KLS-' + (this.kelasList.length + 1).toString().padStart(2, '0'),
          nama: targetKelas,
          deskripsi: 'Kelas Pembelajaran',
          isWaliKelas: (targetKelas === 'X3 Atlet')
        });
      }

      this.saveLocalData();
      this.syncToGoogleDrive('saveSiswa', this.siswa, () => {
        this.showToast(`Berhasil mengimpor ${countAdded} siswa ke kelas ${targetKelas}!`, 'success');
      });

      this.modalPasteOpen = false;
    },

    // =========================================================================
    // DASHBOARD COMPUTED
    // =========================================================================
    getDashboardStats() {
      const activeWaliKelas = (this.waliKelasFilter.kelas || this.guru.kelasWali || 'X3 Atlet').trim();
      const waliSiswa = this.siswa.filter(s => s.kelas && this.isSameClass(s.kelas, activeWaliKelas));
      const today = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());

      let hadirApel = 0;
      let absenApel = 0;
      let telatApel = 0;

      waliSiswa.forEach(s => {
        const found = this.presensiWali.slice().reverse().find(p => {
          if (!this.isSameDate(p.tanggal, today)) return false;
          const nSesi = this.normalizeStr(p.sesi || '') || 'apelpagi';
          if (nSesi.includes('family')) return false; // Bukan Apel Pagi
          if (p.kelas && !this.isSameClass(p.kelas, activeWaliKelas)) return false;
          return this.isSameStudent(s, p);
        });

        if (found) {
          const st = String(found.status || '').trim();
          if (['Hadir', 'Tahfidz', 'PTV', 'Organtri'].includes(st)) {
            hadirApel++;
          } else if (st === 'Terlambat') {
            telatApel++;
          } else if (['Sakit', 'Izin', 'Di Rumah', 'Tanpa Keterangan', 'Alpa'].includes(st)) {
            absenApel++;
          }
        }
      });

      let hadirFamily = 0;
      waliSiswa.forEach(s => {
        const found = this.presensiWali.slice().reverse().find(p => {
          if (!this.isSameDate(p.tanggal, today)) return false;
          const nSesi = this.normalizeStr(p.sesi || '');
          if (!nSesi.includes('family')) return false; // Bukan Family Time
          if (p.kelas && !this.isSameClass(p.kelas, activeWaliKelas)) return false;
          return this.isSameStudent(s, p);
        });

        if (found) {
          const st = String(found.status || '').trim();
          if (['Hadir', 'Tahfidz', 'PTV', 'Organtri', 'Terlambat'].includes(st)) {
            hadirFamily++;
          }
        }
      });

      const allNilai = this.nilai.map(n => Number(n.nilai)).filter(n => !isNaN(n) && n !== '');
      const avgNilai = allNilai.length > 0 ? (allNilai.reduce((a, b) => a + b, 0) / allNilai.length).toFixed(1) : '-';

      const topSiswa = [...this.siswa].sort((a, b) => (b.totalBintang || 0) - (a.totalBintang || 0))[0];

      return {
        totalWaliSiswa: waliSiswa.length,
        hadirApel,
        absenApel,
        telatApel,
        hadirFamily,
        totalJurnal: this.jurnalKimia.length,
        avgNilai,
        topStudent: topSiswa && (topSiswa.totalBintang > 0) ? topSiswa.nama : 'Belum Ada',
        topStars: topSiswa ? (topSiswa.totalBintang || 0) : 0,
        activeKelasWali: activeWaliKelas
      };
    },

    // =========================================================================
    // 1. WALI KELAS: 9 STATUS PRESENSI RESMI
    // =========================================================================
    setAsPrimaryWaliKelas(kelasNama) {
      this.guru.kelasWali = kelasNama;
      this.kelasList.forEach(k => {
        k.isWaliKelas = (k.nama === kelasNama);
      });
      this.saveLocalData();
      this.showToast(`Kelas ${kelasNama} dijadikan Kelas Wali Utama!`, 'success');
    },

    getSiswaWaliPresensiList() {
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');

      const siswaKelas = this.siswa.filter(s => s.kelas && this.isSameClass(s.kelas, kelas));

      return siswaKelas.map(s => {
        const found = this.presensiWali.slice().reverse().find(p => {
          if (!this.isSameDate(p.tanggal, tgl)) return false;
          const nSesi = this.normalizeStr(p.sesi || '') || 'apelpagi';
          const pIsFamily = nSesi.includes('family');
          if (isFamily !== pIsFamily) return false;
          if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
          return this.isSameStudent(s, p);
        });
        return {
          idSiswa: s.id,
          nisn: s.nisn,
          nama: s.nama,
          namaPanggilan: s.namaPanggilan || '',
          peminatan: s.peminatan || '',
          gender: s.gender,
          kelas: s.kelas,
          status: found ? found.status : 'Belum Presensi',
          keterangan: found ? (found.keterangan || '') : ''
        };
      });
    },

    setWaliStatus(idSiswa, status) {
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const s = this.siswa.find(x => x.id === idSiswa);
      const namaSiswa = s ? s.nama : '';

      let existingIndex = this.presensiWali.findIndex(p => {
        if (!this.isSameDate(p.tanggal, tgl)) return false;
        const pIsFamily = this.normalizeStr(p.sesi || '').includes('family');
        if (isFamily !== pIsFamily) return false;
        if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
        return this.isSameStudent({ id: idSiswa, nama: namaSiswa }, p);
      });
      
      if (existingIndex >= 0) {
        this.presensiWali[existingIndex].status = status;
        this.presensiWali[existingIndex].idSiswa = idSiswa;
        this.presensiWali[existingIndex].namaSiswa = namaSiswa;
        this.presensiWali[existingIndex].kelas = kelas;
        this.presensiWali[existingIndex].tanggal = tgl;
      } else {
        this.presensiWali.push({
          id: 'PW-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
          tanggal: tgl,
          sesi: sesi,
          kelas: kelas,
          idSiswa: idSiswa,
          namaSiswa: namaSiswa,
          status: status,
          keterangan: ''
        });
      }

      this.saveLocalData();
      this.updateCharts();
      this.syncToGoogleDrive('savePresensiWali', this.presensiWali);
    },

    updateWaliKeterangan(idSiswa, keterangan) {
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const s = this.siswa.find(x => x.id === idSiswa);
      const namaSiswa = s ? s.nama : '';

      let existingIndex = this.presensiWali.findIndex(p => {
        if (!this.isSameDate(p.tanggal, tgl)) return false;
        const pIsFamily = this.normalizeStr(p.sesi || '').includes('family');
        if (isFamily !== pIsFamily) return false;
        if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
        return this.isSameStudent({ id: idSiswa, nama: namaSiswa }, p);
      });

      if (existingIndex >= 0) {
        this.presensiWali[existingIndex].keterangan = keterangan;
        this.presensiWali[existingIndex].kelas = kelas;
        this.presensiWali[existingIndex].tanggal = tgl;
      } else {
        this.presensiWali.push({
          id: 'PW-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
          tanggal: tgl,
          sesi: sesi,
          kelas: kelas,
          idSiswa: idSiswa,
          namaSiswa: namaSiswa,
          status: 'Hadir',
          keterangan: keterangan
        });
      }
      this.saveLocalData();
      this.syncToGoogleDrive('savePresensiWali', this.presensiWali);
    },

    markAllWaliPresent() {
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const siswaKelas = this.siswa.filter(s => s.kelas && this.isSameClass(s.kelas, kelas));

      if (siswaKelas.length === 0) {
        this.showToast(`Belum ada siswa di kelas ${kelas}. Silakan tarik data spreadsheet atau tambah siswa.`, 'info');
        return;
      }

      siswaKelas.forEach(s => {
        let existing = this.presensiWali.find(p => {
          if (!this.isSameDate(p.tanggal, tgl)) return false;
          const pIsFamily = this.normalizeStr(p.sesi || '').includes('family');
          if (isFamily !== pIsFamily) return false;
          if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
          return this.isSameStudent(s, p);
        });
        if (existing) {
          existing.status = 'Hadir';
          existing.kelas = kelas;
          existing.tanggal = tgl;
        } else {
          this.presensiWali.push({
            id: 'PW-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
            tanggal: tgl,
            sesi: sesi,
            kelas: kelas,
            idSiswa: s.id,
            namaSiswa: s.nama,
            status: 'Hadir',
            keterangan: ''
          });
        }
      });

      this.saveLocalData();
      this.updateCharts();
      this.syncToGoogleDrive('savePresensiWali', this.presensiWali);
      this.showToast(`Semua siswa ${kelas} ditandai HADIR untuk ${sesi}!`, 'success');
    },

    copyStatusFromApelPagi() {
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();

      const apelRecords = this.presensiWali.filter(p => 
        this.isSameDate(p.tanggal, tgl) && 
        !this.normalizeStr(p.sesi || '').includes('family') && 
        (!p.kelas || this.isSameClass(p.kelas, kelas))
      );

      if (apelRecords.length === 0) {
        this.showToast('Belum ada data presensi Apel Pagi pada tanggal ini untuk disalin.', 'info');
        return;
      }

      apelRecords.forEach(ar => {
        let existingIndex = this.presensiWali.findIndex(p => {
          if (!this.isSameDate(p.tanggal, tgl)) return false;
          const pIsFamily = this.normalizeStr(p.sesi || '').includes('family');
          if (!pIsFamily) return false;
          if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
          return this.isSameStudent({ id: ar.idSiswa, nama: ar.namaSiswa }, p);
        });

        if (existingIndex >= 0) {
          this.presensiWali[existingIndex].status = ar.status;
          this.presensiWali[existingIndex].keterangan = ar.keterangan;
        } else {
          this.presensiWali.push({
            id: 'PW-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
            tanggal: tgl,
            sesi: 'Family Time',
            kelas: kelas,
            idSiswa: ar.idSiswa,
            namaSiswa: ar.namaSiswa,
            status: ar.status,
            keterangan: ar.keterangan || ''
          });
        }
      });

      this.saveLocalData();
      this.updateCharts();
      this.syncToGoogleDrive('savePresensiWali', this.presensiWali);
      this.showToast(`Status presensi dari Apel Pagi (${apelRecords.length} siswa) berhasil disalin ke Family Time!`, 'success');
    },

    saveAndSyncWaliPresensi() {
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();

      const currentList = this.presensiWali.filter(p => 
        this.isSameDate(p.tanggal, tgl) && 
        (this.normalizeStr(p.sesi || '').includes('family') === isFamily) && 
        (!p.kelas || this.isSameClass(p.kelas, kelas))
      );

      if (currentList.length === 0) {
        this.showToast('Belum ada data presensi untuk disimpan', 'info');
        return;
      }

      this.syncToGoogleDrive('savePresensiWali', currentList, () => {
        this.showToast(`Presensi ${sesi} ${kelas} (${tgl}) berhasil disimpan ke Spreadsheet!`, 'success');
      });
    },

    getWaliRecapStats() {
      const kelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const tgl = this.normalizeDateString(this.waliKelasFilter.tanggal || this.getTodayDateString());
      const sesi = (this.waliKelasFilter.sesi || 'Apel Pagi').trim();
      const isFamily = this.normalizeStr(sesi).includes('family');
      const siswaKelas = this.siswa.filter(s => s.kelas && this.isSameClass(s.kelas, kelas));
      const total = siswaKelas.length;

      let hadir = 0, sakit = 0, izin = 0, tahfidz = 0, ptv = 0, organtri = 0, dirumah = 0, telat = 0, tanpaket = 0, belum = 0;

      siswaKelas.forEach(s => {
        const found = this.presensiWali.slice().reverse().find(p => {
          if (!this.isSameDate(p.tanggal, tgl)) return false;
          const nSesi = this.normalizeStr(p.sesi || '') || 'apelpagi';
          const pIsFamily = nSesi.includes('family');
          if (isFamily !== pIsFamily) return false;
          if (p.kelas && !this.isSameClass(p.kelas, kelas)) return false;
          return this.isSameStudent(s, p);
        });
        const st = found ? String(found.status || '').trim() : 'Belum Presensi';
        if (st === 'Hadir') hadir++;
        else if (st === 'Sakit') sakit++;
        else if (st === 'Izin') izin++;
        else if (st === 'Tahfidz') tahfidz++;
        else if (st === 'PTV') ptv++;
        else if (st === 'Organtri') organtri++;
        else if (st === 'Di Rumah') dirumah++;
        else if (st === 'Terlambat') telat++;
        else if (st === 'Tanpa Keterangan' || st === 'Alpa') tanpaket++;
        else belum++;
      });

      const aktifHadir = hadir + telat + tahfidz + ptv + organtri;
      const persentase = total > 0 ? Math.round((aktifHadir / total) * 100) : 0;

      return { total, hadir, sakit, izin, tahfidz, ptv, organtri, dirumah, telat, tanpaket, belum, persentase, activeSesi: sesi };
    },

    // =========================================================================
    // WALI KELAS HUB: STRUKTUR ORGANISASI KELAS
    // =========================================================================
    getStrukturalByKelas() {
      const activeKelas = this.waliKelasFilter.kelas || 'X3 Atlet';
      return this.strukturalKelas.filter(s => s.kelas === activeKelas);
    },

    openModalAddStruktur() {
      this.formStruktur = {
        id: 'STR-' + new Date().getTime(),
        jabatan: '',
        idSiswa: '',
        namaSiswa: '',
        keterangan: '',
        kelas: this.waliKelasFilter.kelas || 'X3 Atlet'
      };
      this.modalStrukturOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    openModalEditStruktur(st) {
      this.formStruktur = { ...st };
      this.modalStrukturOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveStruktur() {
      if (!this.formStruktur.jabatan.trim()) {
        this.showToast('Nama jabatan struktural wajib diisi!', 'error');
        return;
      }

      const s = this.siswa.find(x => x.id === this.formStruktur.idSiswa);
      this.formStruktur.namaSiswa = s ? s.nama : (this.formStruktur.namaSiswa || 'Belum Ditentukan');

      const idx = this.strukturalKelas.findIndex(st => st.id === this.formStruktur.id);
      if (idx >= 0) {
        this.strukturalKelas[idx] = { ...this.formStruktur };
      } else {
        this.strukturalKelas.push({ ...this.formStruktur });
      }

      this.saveLocalData();
      this.syncToGoogleDrive('saveStrukturKelas', this.strukturalKelas, () => {
        this.showToast('Struktur kelas berhasil disimpan!', 'success');
      });
      this.modalStrukturOpen = false;
    },

    deleteStruktur(id) {
      const target = this.strukturalKelas.find(st => st.id === id);
      const nama = target ? target.jabatan : 'jabatan';
      if (confirm(`Yakin ingin menghapus ${nama}?`)) {
        this.strukturalKelas = this.strukturalKelas.filter(st => st.id !== id);
        this.saveLocalData();
        this.syncToGoogleDrive('saveStrukturKelas', this.strukturalKelas, () => {
          this.showToast('Jabatan berhasil dihapus', 'info');
        });
      }
    },

    // =========================================================================
    // WALI KELAS HUB: JADWAL PIKET (SENIN S.D. SABTU)
    // =========================================================================
    getPiketList(hari) {
      if (!this.jadwalPiket || !this.jadwalPiket[hari]) {
        return [];
      }
      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim().toLowerCase();
      return this.jadwalPiket[hari].filter(p => !p.kelas || (p.kelas || '').trim().toLowerCase() === activeKelas);
    },

    getAvailableSiswaForPiket() {
      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim().toLowerCase();
      const assignedIds = new Set();
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      days.forEach(d => {
        if (this.jadwalPiket && this.jadwalPiket[d]) {
          this.jadwalPiket[d].forEach(p => {
            if (!p.kelas || (p.kelas || '').trim().toLowerCase() === activeKelas) {
              if (p.idSiswa) assignedIds.add(String(p.idSiswa).trim());
            }
          });
        }
      });

      return this.siswa.filter(s => 
        (s.kelas || '').trim().toLowerCase() === activeKelas && !assignedIds.has(String(s.id).trim())
      );
    },

    getPiketStats() {
      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim().toLowerCase();
      const totalSiswa = this.siswa.filter(s => (s.kelas || '').trim().toLowerCase() === activeKelas).length;
      const available = this.getAvailableSiswaForPiket().length;
      const assigned = totalSiswa - available;
      return {
        totalSiswa,
        assigned,
        available
      };
    },

    getTodayDayName() {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayIdx = new Date().getDay();
      return days[dayIdx] || 'Senin';
    },

    getTodayPiketStudents() {
      const hariIni = this.getTodayDayName();
      return this.getPiketList(hariIni);
    },

    addSiswaToPiket(hari, idSiswa) {
      if (!idSiswa) return;
      if (!this.jadwalPiket[hari]) this.jadwalPiket[hari] = [];
      const s = this.siswa.find(x => String(x.id).trim() === String(idSiswa).trim());
      if (!s) return;

      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const activeKelasLower = activeKelas.toLowerCase();

      // Pastikan 1 siswa hanya di 1 hari: hapus dari seluruh hari lain terlebih dahulu
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      days.forEach(d => {
        if (this.jadwalPiket[d]) {
          this.jadwalPiket[d] = this.jadwalPiket[d].filter(p => !(String(p.idSiswa).trim() === String(idSiswa).trim() && (!p.kelas || (p.kelas || '').trim().toLowerCase() === activeKelasLower)));
        }
      });

      this.jadwalPiket[hari].push({
        idSiswa: s.id,
        namaSiswa: s.nama,
        kelas: activeKelas
      });

      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalPiket', this.jadwalPiket, () => {
        this.showToast(`${s.nama} ditugaskan piket hari ${hari}`, 'success');
      });
    },

    removeSiswaFromPiket(hari, idSiswa) {
      if (!this.jadwalPiket[hari]) return;
      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim().toLowerCase();
      this.jadwalPiket[hari] = this.jadwalPiket[hari].filter(p => !(String(p.idSiswa).trim() === String(idSiswa).trim() && (!p.kelas || (p.kelas || '').trim().toLowerCase() === activeKelas)));
      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalPiket', this.jadwalPiket, () => {
        this.showToast(`Siswa dihapus dari piket ${hari}`, 'info');
      });
    },

    openModalEditPiket(hari, p) {
      this.formEditPiket = {
        idSiswa: p.idSiswa,
        namaSiswa: p.namaSiswa,
        fromHari: hari,
        toHari: hari
      };
      this.modalEditPiketOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveEditPiket() {
      if (!this.formEditPiket.idSiswa) return;
      if (this.formEditPiket.fromHari === this.formEditPiket.toHari) {
        this.modalEditPiketOpen = false;
        return;
      }
      this.moveSiswaPiket(this.formEditPiket.fromHari, this.formEditPiket.toHari, this.formEditPiket.idSiswa);
      this.modalEditPiketOpen = false;
    },

    moveSiswaPiket(fromHari, toHari, idSiswa) {
      if (!idSiswa || fromHari === toHari) return;
      const activeKelas = (this.waliKelasFilter.kelas || 'X3 Atlet').trim();
      const activeKelasLower = activeKelas.toLowerCase();
      
      const s = this.siswa.find(x => String(x.id).trim() === String(idSiswa).trim());
      const nama = s ? s.nama : (this.jadwalPiket[fromHari]?.find(x => String(x.idSiswa).trim() === String(idSiswa).trim())?.namaSiswa || 'Siswa');

      // Hapus dari semua hari di kelas ini
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      days.forEach(d => {
        if (this.jadwalPiket[d]) {
          this.jadwalPiket[d] = this.jadwalPiket[d].filter(p => !(String(p.idSiswa).trim() === String(idSiswa).trim() && (!p.kelas || (p.kelas || '').trim().toLowerCase() === activeKelasLower)));
        }
      });

      // Tambahkan ke toHari
      if (!this.jadwalPiket[toHari]) this.jadwalPiket[toHari] = [];
      this.jadwalPiket[toHari].push({
        idSiswa: idSiswa,
        namaSiswa: nama,
        kelas: activeKelas
      });

      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalPiket', this.jadwalPiket, () => {
        this.showToast(`${nama} berhasil dipindahkan ke hari ${toHari}!`, 'success');
      });
    },

    // Drag & Drop Handlers
    onPiketDragStart(event, hari, piketItem) {
      this.piketDragItem = { fromHari: hari, idSiswa: piketItem.idSiswa, namaSiswa: piketItem.namaSiswa };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify(this.piketDragItem));
      }
    },

    onPiketDragOver(event, hari) {
      if (this.piketDragItem && this.piketDragItem.fromHari !== hari) {
        this.piketDragOverHari = hari;
      }
    },

    onPiketDragLeave(event, hari) {
      if (this.piketDragOverHari === hari) {
        this.piketDragOverHari = null;
      }
    },

    onPiketDrop(event, targetHari) {
      const data = this.piketDragItem;
      this.piketDragOverHari = null;
      if (!data || !data.idSiswa) return;
      
      if (data.fromHari === targetHari) {
        this.piketDragItem = null;
        return;
      }
      
      this.moveSiswaPiket(data.fromHari, targetHari, data.idSiswa);
      this.piketDragItem = null;
    },

    // =========================================================================
    // WALI KELAS HUB: BUKU CATATAN KONSELING & PEMBINAAN SISWA
    // =========================================================================
    getFilteredKonselingList() {
      const activeKelas = this.waliKelasFilter.kelas || 'X3 Atlet';
      return this.catatanKonseling.filter(c => {
        const matchKelas = (c.kelas === activeKelas);
        const matchSiswa = (this.konselingFilter.siswaId === 'Semua' || c.idSiswa === this.konselingFilter.siswaId);
        const matchKat = (this.konselingFilter.kategori === 'Semua' || c.kategori === this.konselingFilter.kategori);
        const matchStatus = (this.konselingFilter.status === 'Semua' || c.status === this.konselingFilter.status);
        const matchSearch = !this.konselingFilter.search ||
          (c.namaSiswa && c.namaSiswa.toLowerCase().includes(this.konselingFilter.search.toLowerCase())) ||
          (c.catatan && c.catatan.toLowerCase().includes(this.konselingFilter.search.toLowerCase())) ||
          (c.tindakLanjut && c.tindakLanjut.toLowerCase().includes(this.konselingFilter.search.toLowerCase()));
        return matchKelas && matchSiswa && matchKat && matchStatus && matchSearch;
      }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    },

    openModalAddKonseling(preselectedSiswa = null) {
      const activeKelas = this.waliKelasFilter.kelas || 'X3 Atlet';
      this.formKonseling = {
        id: 'KONS-' + new Date().getTime(),
        idSiswa: preselectedSiswa ? preselectedSiswa.id : (this.siswa.filter(s => s.kelas === activeKelas)[0]?.id || ''),
        namaSiswa: preselectedSiswa ? preselectedSiswa.nama : (this.siswa.filter(s => s.kelas === activeKelas)[0]?.nama || ''),
        kelas: activeKelas,
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'Akademik',
        catatan: '',
        tindakLanjut: '',
        status: 'Dalam Pemantauan'
      };
      this.modalKonselingOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    openModalEditKonseling(c) {
      this.formKonseling = { ...c };
      this.modalKonselingOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveKonseling() {
      if (!this.formKonseling.idSiswa && !this.formKonseling.namaSiswa) {
        this.showToast('Pilih siswa binaan terlebih dahulu!', 'error');
        return;
      }
      if (!this.formKonseling.catatan.trim()) {
        this.showToast('Uraian catatan konseling/pembinaan wajib diisi!', 'error');
        return;
      }

      const s = this.siswa.find(x => x.id === this.formKonseling.idSiswa);
      if (s) this.formKonseling.namaSiswa = s.nama;

      const idx = this.catatanKonseling.findIndex(c => c.id === this.formKonseling.id);
      if (idx >= 0) {
        this.catatanKonseling[idx] = { ...this.formKonseling };
      } else {
        this.catatanKonseling.unshift({ ...this.formKonseling });
      }

      this.saveLocalData();
      this.syncToGoogleDrive('saveCatatanKonseling', this.catatanKonseling, () => {
        this.showToast('Catatan konseling berhasil disimpan!', 'success');
      });
      this.modalKonselingOpen = false;
    },

    toggleKonselingPrivacyMode() {
      this.konselingPrivacyMode = !this.konselingPrivacyMode;
      this.showToast(this.konselingPrivacyMode ? '🔒 Mode Privasi Aktif (Catatan Disamarkan)' : '👁️ Mode Privasi Nonaktif (Catatan Ditampilkan)', 'info');
      this.$nextTick(() => this.initLucideIcons());
    },

    getTopBintangKelas(kelas) {
      const targetKelas = kelas || this.waliKelasFilter.kelas || 'X3 Atlet';
      const siswaKelas = this.siswa.filter(s => s.kelas && s.kelas.toLowerCase().trim() === targetKelas.toLowerCase().trim());
      if (siswaKelas.length === 0) return { totalStars: 0, topStudent: '' };
      const totalStars = siswaKelas.reduce((acc, s) => acc + (Number(s.totalBintang) || 0), 0);
      const sorted = [...siswaKelas].sort((a, b) => (Number(b.totalBintang) || 0) - (Number(a.totalBintang) || 0));
      const topStudent = sorted[0]?.totalBintang > 0 ? `${sorted[0].nama} (${sorted[0].totalBintang}★)` : '';
      return { totalStars, topStudent };
    },

    getTopBintangListByKelas(kelas) {
      const targetKelas = kelas || this.waliKelasFilter.kelas || 'X3 Atlet';
      const siswaKelas = this.siswa.filter(s => s.kelas && s.kelas.toLowerCase().trim() === targetKelas.toLowerCase().trim());
      return [...siswaKelas].sort((a, b) => (Number(b.totalBintang) || 0) - (Number(a.totalBintang) || 0));
    },

    deleteKonseling(id) {
      if (confirm('Yakin ingin menghapus catatan konseling ini?')) {
        this.catatanKonseling = this.catatanKonseling.filter(c => c.id !== id);
        this.saveLocalData();
        this.syncToGoogleDrive('deleteCatatanKonseling', { id }, () => {
          this.showToast('Catatan konseling berhasil dihapus', 'info');
        });
      }
    },

    // =========================================================================
    // 2. JURNAL PEMBELAJARAN KIMIA
    // =========================================================================
    getFilteredJurnal() {
      return this.jurnalKimia.filter(j => {
        const matchKelas = this.jurnalFilter.kelas === 'Semua' || j.kelas === this.jurnalFilter.kelas;
        const matchSearch = !this.jurnalFilter.search || 
          j.materi.toLowerCase().includes(this.jurnalFilter.search.toLowerCase()) ||
          j.aktivitas.toLowerCase().includes(this.jurnalFilter.search.toLowerCase());
        const matchTglAwal = !this.jurnalFilter.tanggalAwal || j.tanggal >= this.jurnalFilter.tanggalAwal;
        const matchTglAkhir = !this.jurnalFilter.tanggalAkhir || j.tanggal <= this.jurnalFilter.tanggalAkhir;
        return matchKelas && matchSearch && matchTglAwal && matchTglAkhir;
      }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    },

    openModalNewJurnal() {
      const defaultKelas = this.kelasList.length > 0 ? this.kelasList[0].nama : 'X3 Atlet';
      const siswaKelas = this.siswa.filter(s => s.kelas === defaultKelas);
      
      this.formJurnal = {
        id: 'JK-' + new Date().getTime(),
        tanggal: new Date().toISOString().split('T')[0],
        kelas: defaultKelas,
        jamKe: '1 - 2',
        pertemuanKe: (this.jurnalKimia.filter(j => j.kelas === defaultKelas).length + 1),
        materi: '',
        aktivitas: '',
        refleksi: '',
        tindakLanjut: '',
        presensi: siswaKelas.map(s => ({
          idSiswa: s.id,
          namaSiswa: s.nama,
          namaPanggilan: s.namaPanggilan || this.generateDefaultNickname(s.nama),
          status: 'Hadir',
          catatan: ''
        }))
      };

      this.modalJurnalOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    onJurnalKelasChange() {
      const selectedKelas = this.formJurnal.kelas;
      const siswaKelas = this.siswa.filter(s => s.kelas === selectedKelas);
      this.formJurnal.pertemuanKe = (this.jurnalKimia.filter(j => j.kelas === selectedKelas).length + 1);
      this.formJurnal.presensi = siswaKelas.map(s => ({
        idSiswa: s.id,
        namaSiswa: s.nama,
        namaPanggilan: s.namaPanggilan || this.generateDefaultNickname(s.nama),
        status: 'Hadir',
        catatan: ''
      }));
    },

    markAllJurnalPresent() {
      this.formJurnal.presensi.forEach(p => p.status = 'Hadir');
    },

    saveJurnal() {
      if (!this.formJurnal.materi.trim()) {
        this.showToast('Mohon isi Topik / Materi Pembelajaran Kimia!', 'error');
        return;
      }

      const hadirCount = this.formJurnal.presensi.filter(p => p.status === 'Hadir').length;
      const totalCount = this.formJurnal.presensi.length;

      const newJurnal = {
        id: this.formJurnal.id,
        tanggal: this.formJurnal.tanggal,
        kelas: this.formJurnal.kelas,
        jamKe: this.formJurnal.jamKe,
        pertemuanKe: Number(this.formJurnal.pertemuanKe),
        materi: this.formJurnal.materi,
        aktivitas: this.formJurnal.aktivitas,
        refleksi: this.formJurnal.refleksi,
        tindakLanjut: this.formJurnal.tindakLanjut,
        presensiHadir: hadirCount,
        presensiTotal: totalCount
      };

      this.formJurnal.presensi.forEach(p => {
        this.presensiKimia.push({
          id: 'PK-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
          idJurnal: newJurnal.id,
          tanggal: newJurnal.tanggal,
          kelas: newJurnal.kelas,
          idSiswa: p.idSiswa,
          namaSiswa: p.namaSiswa,
          namaPanggilan: p.namaPanggilan || this.generateDefaultNickname(p.namaSiswa),
          status: p.status,
          catatan: p.catatan || ''
        });
      });

      this.jurnalKimia.unshift(newJurnal);
      this.saveLocalData();

      this.syncToGoogleDrive('saveJurnalKimia', {
        ...newJurnal,
        presensiSiswa: this.formJurnal.presensi
      }, () => {
        this.showToast(`Jurnal Pembelajaran Kimia ${newJurnal.kelas} berhasil disimpan ke Spreadsheet!`, 'success');
      });

      this.modalJurnalOpen = false;
    },

    deleteJurnal(id) {
      const jurnal = this.jurnalKimia.find(j => j.id === id);
      const nama = jurnal ? jurnal.materi : 'ini';
      
      if (confirm(`Apakah Anda yakin ingin menghapus jurnal "${nama}"?`)) {
        this.jurnalKimia = this.jurnalKimia.filter(j => j.id !== id);
        this.presensiKimia = this.presensiKimia.filter(p => p.idJurnal !== id);
        this.saveLocalData();
        this.showToast('Jurnal pembelajaran berhasil dihapus', 'info');
      }
    },

    viewJurnalDetail(jurnal) {
      const presensi = this.presensiKimia.filter(p => p.idJurnal === jurnal.id).map(p => {
        const student = this.siswa.find(s => String(s.id).trim() === String(p.idSiswa).trim() || (s.nama && s.nama.toLowerCase().trim() === String(p.namaSiswa).toLowerCase().trim()));
        return {
          ...p,
          namaPanggilan: p.namaPanggilan || (student ? student.namaPanggilan : '') || this.generateDefaultNickname(p.namaSiswa)
        };
      });
      this.modalJurnalDetail = {
        ...jurnal,
        presensiList: presensi
      };
      this.$nextTick(() => this.initLucideIcons());
    },

    printJurnal() {
      window.print();
    },

    // =========================================================================
    // 3. PENILAIAN TUGAS & UH (INPUT LANGSUNG DI TABEL & EDIT/HAPUS KOLOM)
    // =========================================================================
    getDistinctTagihan() {
      const kelas = this.nilaiFilter.kelas || 'X3 Atlet';
      const kategori = this.nilaiFilter.kategori || 'Semua';
      
      const map = new Map();

      // 1. Masukkan dari tagihanDefinisi
      this.tagihanDefinisi.forEach(t => {
        if (this.isSameClass(t.kelas, kelas)) {
          const tKat = t.kategori || 'Tugas';
          if (kategori === 'Semua' || tKat.toUpperCase() === kategori.toUpperCase()) {
            map.set(this.normalizeStr(t.judulMateri), {
              judulMateri: t.judulMateri.trim(),
              kategori: tKat,
              kkm: Number(t.kkm) || 75,
              kelas: t.kelas
            });
          }
        }
      });

      // 2. Masukkan dari this.nilai
      this.nilai.forEach(n => {
        if (this.isSameClass(n.kelas, kelas) && n.judulMateri && n.judulMateri.trim()) {
          const nKat = n.kategori || n.jenisTagihan || 'Tugas';
          if (kategori === 'Semua' || nKat.toUpperCase() === kategori.toUpperCase()) {
            const key = this.normalizeStr(n.judulMateri);
            if (!map.has(key)) {
              map.set(key, {
                judulMateri: n.judulMateri.trim(),
                kategori: nKat,
                kkm: Number(n.kkm) || 75,
                kelas: n.kelas
              });
            }
          }
        }
      });

      return Array.from(map.values());
    },

    getMatrixNilai() {
      const kelas = this.nilaiFilter.kelas || 'X3 Atlet';
      const siswaKelas = this.siswa.filter(s => this.isSameClass(s.kelas, kelas));
      const tagihanList = this.getDistinctTagihan();

      return siswaKelas.map(s => {
        const nilaiMap = {};
        let totalNilai = 0;
        let countNilai = 0;

        tagihanList.forEach(t => {
          const found = this.nilai.find(n => 
            this.isSameStudent(n, s) && 
            this.isSameTask(n.judulMateri, t.judulMateri) && 
            this.isSameClass(n.kelas, kelas)
          );
          if (found && found.nilai !== '' && found.nilai !== null && !isNaN(Number(found.nilai))) {
            nilaiMap[t.judulMateri] = {
              id: found.id,
              nilai: Number(found.nilai),
              status: found.status
            };
            totalNilai += Number(found.nilai);
            countNilai++;
          } else {
            nilaiMap[t.judulMateri] = { id: null, nilai: '-', status: 'Belum' };
          }
        });

        const rataRata = countNilai > 0 ? (totalNilai / countNilai).toFixed(1) : '-';

        return {
          idSiswa: s.id,
          nisn: s.nisn,
          nama: s.nama,
          namaPanggilan: s.namaPanggilan || '',
          nilaiTagihan: nilaiMap,
          rataRata: rataRata
        };
      });
    },

    openModalTambahTugas() {
      this.formTagihanBaru = {
        kelas: this.nilaiFilter.kelas || 'X3 Atlet',
        kategori: 'Tugas',
        judulMateri: 'Tugas ' + (this.getDistinctTagihan().filter(t => t.kategori === 'Tugas').length + 1),
        kkm: this.guru.kkmDefault || 75
      };
      this.modalTagihanBaruOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    openModalTambahUH() {
      this.formTagihanBaru = {
        kelas: this.nilaiFilter.kelas || 'X3 Atlet',
        kategori: 'UH',
        judulMateri: 'UH ' + (this.getDistinctTagihan().filter(t => t.kategori === 'UH').length + 1),
        kkm: this.guru.kkmDefault || 75
      };
      this.modalTagihanBaruOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    createTagihanKolomBaru() {
      if (!this.formTagihanBaru.judulMateri.trim()) {
        this.showToast('Judul tagihan wajib diisi!', 'error');
        return;
      }

      const kelas = this.formTagihanBaru.kelas;
      const judul = this.formTagihanBaru.judulMateri.trim();
      const kat = this.formTagihanBaru.kategori;
      const kkm = Number(this.formTagihanBaru.kkm) || 75;

      // Simpan ke tagihanDefinisi agar tidak hilang
      if (!this.tagihanDefinisi.find(t => this.isSameTask(t.judulMateri, judul) && this.isSameClass(t.kelas, kelas))) {
        this.tagihanDefinisi.push({
          judulMateri: judul,
          kategori: kat,
          kkm: kkm,
          kelas: kelas
        });
      }

      const siswaKelas = this.siswa.filter(s => this.isSameClass(s.kelas, kelas));
      
      const newItems = siswaKelas.map(s => ({
        id: 'NIL-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
        idSiswa: s.id,
        namaSiswa: s.nama,
        kelas: kelas,
        kategori: kat,
        judulMateri: judul,
        nilai: '',
        kkm: kkm,
        status: 'Belum'
      }));

      this.nilai.push(...newItems);
      this.saveLocalData();
      
      if (newItems.length > 0) {
        this.syncToGoogleDrive('saveNilai', newItems);
      }

      this.showToast(`Kolom "${judul}" berhasil dibuat! Silakan langsung ketik nilai siswa di tabel.`, 'success');
      this.modalTagihanBaruOpen = false;
    },

    // FITUR BARU: EDIT TUGAS & EDIT UH (NAMA, KATEGORI, KKM)
    openModalEditTagihan(t) {
      this.formEditTagihan = {
        kelas: t.kelas,
        oldJudul: t.judulMateri,
        newJudul: t.judulMateri,
        newKategori: t.kategori,
        newKkm: t.kkm || 75
      };
      this.modalEditTagihanOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveEditTagihan() {
      const { kelas, oldJudul, newJudul, newKategori, newKkm } = this.formEditTagihan;
      if (!newJudul.trim()) {
        this.showToast('Judul kolom tidak boleh kosong!', 'error');
        return;
      }

      const cleanJudul = newJudul.trim();
      const numKkm = Number(newKkm) || 75;

      // 1. Update tagihanDefinisi
      const def = this.tagihanDefinisi.find(t => this.isSameTask(t.judulMateri, oldJudul) && this.isSameClass(t.kelas, kelas));
      if (def) {
        def.judulMateri = cleanJudul;
        def.kategori = newKategori;
        def.kkm = numKkm;
      }

      // 2. Update array nilai
      this.nilai.forEach(n => {
        if (this.isSameClass(n.kelas, kelas) && this.isSameTask(n.judulMateri, oldJudul)) {
          n.judulMateri = cleanJudul;
          n.kategori = newKategori;
          n.kkm = numKkm;
          if (n.nilai !== '' && n.nilai !== null && !isNaN(Number(n.nilai))) {
            n.status = Number(n.nilai) >= numKkm ? 'Tuntas' : 'Remedial';
          }
        }
      });

      this.saveLocalData();

      // Sync ke Google Spreadsheet
      this.syncToGoogleDrive('updateTagihanKolom', {
        kelas,
        oldJudul,
        newJudul: cleanJudul,
        newKategori,
        newKkm: numKkm
      }, () => {
        this.showToast(`Kolom "${cleanJudul}" berhasil diperbarui!`, 'success');
      });

      this.modalEditTagihanOpen = false;
    },

    updateNilaiCell(idSiswa, namaSiswa, judulMateri, kategori, kkm, value) {
      const kelas = this.nilaiFilter.kelas || 'X3 Atlet';
      const numericVal = value === '' ? '' : Number(value);
      const kkmVal = Number(kkm) || 75;

      let found = this.nilai.find(n => 
        this.isSameStudent(n, { id: idSiswa, idSiswa: idSiswa, nama: namaSiswa, namaSiswa: namaSiswa }) && 
        this.isSameTask(n.judulMateri, judulMateri) && 
        this.isSameClass(n.kelas, kelas)
      );

      if (found) {
        found.nilai = numericVal;
        found.kategori = kategori || found.kategori || 'Tugas';
        found.jenisTagihan = found.kategori;
        found.status = (numericVal !== '' && numericVal >= kkmVal) ? 'Tuntas' : (numericVal === '' ? 'Belum' : 'Remedial');
      } else {
        found = {
          id: 'NIL-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
          idSiswa: idSiswa,
          namaSiswa: namaSiswa,
          kelas: kelas,
          kategori: kategori || 'Tugas',
          jenisTagihan: kategori || 'Tugas',
          judulMateri: judulMateri,
          nilai: numericVal,
          kkm: kkmVal,
          status: (numericVal !== '' && numericVal >= kkmVal) ? 'Tuntas' : (numericVal === '' ? 'Belum' : 'Remedial')
        };
        this.nilai.push(found);
      }

      this.saveLocalData();
      this.syncToGoogleDrive('saveNilai', [found], () => {
        this.showToast(`Nilai ${namaSiswa} (${judulMateri}) berhasil disimpan ke Google Sheets!`, 'success');
      });
    },

    deleteTagihanKolom(judulMateri) {
      const kelas = this.nilaiFilter.kelas || 'X3 Atlet';
      if (confirm(`Hapus seluruh kolom nilai "${judulMateri}" di kelas ${kelas}?`)) {
        this.nilai = this.nilai.filter(n => !(this.isSameTask(n.judulMateri, judulMateri) && this.isSameClass(n.kelas, kelas)));
        this.tagihanDefinisi = this.tagihanDefinisi.filter(t => !(this.isSameTask(t.judulMateri, judulMateri) && this.isSameClass(t.kelas, kelas)));
        this.saveLocalData();
        
        this.syncToGoogleDrive('deleteTagihanKolom', { kelas, judulMateri }, () => {
          this.showToast(`Kolom "${judulMateri}" berhasil dihapus`, 'info');
        });
      }
    },

    pushAllNilaiToCloud() {
      if (!this.nilai || this.nilai.length === 0) {
        this.showToast('Tidak ada data nilai lokal untuk diunggah.', 'warning');
        return;
      }
      
      if (!confirm(`Tindakan ini akan mengunggah seluruh ${this.nilai.length} data nilai lokal Anda (di browser ini) ke Google Sheets.\n\nGunakan ini jika nilai lokal Anda belum tersinkronisasi.\n\nLanjutkan?`)) return;
      
      this.syncStatus = 'syncing';
      this.syncToGoogleDrive('saveNilai', this.nilai, () => {
        this.showToast(`Berhasil push ${this.nilai.length} nilai lokal ke Spreadsheet!`, 'success');
      });
    },

    exportNilaiToExcel() {
      if (typeof XLSX === 'undefined') {
        this.showToast('Library Excel belum termuat', 'error');
        return;
      }

      const matrix = this.getMatrixNilai();
      const tagihan = this.getDistinctTagihan();

      const excelData = matrix.map((row, idx) => {
        const item = {
          'No': idx + 1,
          'NISN': row.nisn,
          'Nama Siswa': row.nama
        };

        tagihan.forEach(t => {
          item[t.judulMateri] = row.nilaiTagihan[t.judulMateri] ? row.nilaiTagihan[t.judulMateri].nilai : '-';
        });

        item['Rata-Rata'] = row.rataRata;
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Nilai Kimia ${this.nilaiFilter.kelas}`);
      XLSX.writeFile(wb, `Rekap_Nilai_Kimia_${this.nilaiFilter.kelas}_${new Date().toISOString().split('T')[0]}.xlsx`);

      this.showToast('Rekap Nilai berhasil diunduh ke Excel!', 'success');
    },

    // =========================================================================
    // 4. BINTANG KEAKTIFAN
    // =========================================================================
    getSiswaBintangList() {
      const kelas = (this.bintangFilter.kelas || 'X3 Atlet').trim();
      const search = (this.bintangFilter.search || '').toLowerCase().trim();
      let list = this.siswa
        .filter(s => s.kelas && s.kelas.trim().toLowerCase() === kelas.toLowerCase())
        .sort((a, b) => (b.totalBintang || 0) - (a.totalBintang || 0));
      
      if (search) {
        list = list.filter(s => 
          (s.nama && s.nama.toLowerCase().includes(search)) ||
          (s.nisn && s.nisn.includes(search))
        );
      }
      return list;
    },

    getBintangStats() {
      const kelas = (this.bintangFilter.kelas || 'X3 Atlet').trim();
      const siswaKelas = this.siswa.filter(s => s.kelas && s.kelas.trim().toLowerCase() === kelas.toLowerCase());
      const totalBintang = siswaKelas.reduce((acc, s) => acc + (Number(s.totalBintang) || 0), 0);
      const topSiswa = [...siswaKelas].sort((a, b) => (b.totalBintang || 0) - (a.totalBintang || 0))[0];
      const avg = siswaKelas.length > 0 ? (totalBintang / siswaKelas.length).toFixed(1) : '0';
      return {
        totalSiswa: siswaKelas.length,
        totalBintang,
        topName: topSiswa && (topSiswa.totalBintang > 0) ? topSiswa.nama : 'Belum Ada',
        topStars: topSiswa ? (topSiswa.totalBintang || 0) : 0,
        avgStars: avg
      };
    },

    getLeaderboardTop5() {
      const kelas = (this.bintangFilter.kelas || 'X3 Atlet').trim();
      return this.siswa
        .filter(s => s.kelas && s.kelas.trim().toLowerCase() === kelas.toLowerCase())
        .sort((a, b) => (b.totalBintang || 0) - (a.totalBintang || 0))
        .slice(0, 5);
    },

    openModalBeriBintang(siswa) {
      this.selectedSiswaBintang = siswa;
      this.formBintang = {
        kategori: 'Menjawab Pertanyaan Guru di Kelas',
        poin: 1,
        alasan: ''
      };
      this.modalBintangOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    quickAddBintang(siswa, poin = 1) {
      this.selectedSiswaBintang = siswa;
      this.formBintang.poin = poin;
      this.formBintang.kategori = 'Keaktifan Pembelajaran Kimia';
      this.formBintang.alasan = 'Aktif berpartisipasi dalam pembelajaran';
      this.submitBintang();
    },

    quickReduceBintang(siswa) {
      if (!siswa.totalBintang || siswa.totalBintang <= 0) {
        this.showToast(`Bintang ${siswa.nama} sudah 0`, 'info');
        return;
      }
      siswa.totalBintang = Math.max(0, (siswa.totalBintang || 0) - 1);
      
      const logItem = {
        id: 'STAR-' + new Date().getTime(),
        tanggal: this.getTodayDateString(),
        kelas: siswa.kelas,
        idSiswa: siswa.id,
        namaSiswa: siswa.nama,
        jumlah: -1,
        kategori: 'Penyesuaian Bintang',
        alasan: 'Pengurangan 1 poin keaktifan'
      };

      this.bintangLog.unshift(logItem);
      this.saveLocalData();
      this.syncToGoogleDrive('addBintang', logItem, () => {
        this.showToast(`-1 Bintang untuk ${siswa.nama}`, 'info');
      });
    },

    submitBintang() {
      if (!this.selectedSiswaBintang) return;

      const s = this.selectedSiswaBintang;
      const poin = Number(this.formBintang.poin) || 1;
      
      s.totalBintang = (s.totalBintang || 0) + poin;

      const logItem = {
        id: 'STAR-' + new Date().getTime(),
        tanggal: this.getTodayDateString(),
        kelas: s.kelas,
        idSiswa: s.id,
        namaSiswa: s.nama,
        jumlah: poin,
        kategori: this.formBintang.kategori,
        alasan: this.formBintang.alasan || 'Keaktifan Pembelajaran Kimia'
      };

      this.bintangLog.unshift(logItem);
      this.saveLocalData();

      this.syncToGoogleDrive('addBintang', logItem, () => {
        this.showToast(`+${poin} Bintang diberikan kepada ${s.nama}!`, 'success');
      });

      this.modalBintangOpen = false;
    },

    recalculateStarPoints() {
      const map = {};
      this.bintangLog.forEach(l => {
        map[l.idSiswa] = (map[l.idSiswa] || 0) + Number(l.jumlah || 1);
      });
      this.siswa.forEach(s => {
        if (map[s.id] !== undefined) {
          s.totalBintang = map[s.id];
        }
      });
      this.saveLocalData();
    },

    // =========================================================================
    // 4A. JADWAL KELAS & JADWAL MENGAJAR (SCHEDULE ENGINE)
    // =========================================================================
    getDefaultJamPelajaran() {
      const senKam = [
        { type: 'kegiatan', label: 'Morning Roll Call', mulai: '06:45', selesai: '07:00' },
        { type: 'pelajaran', jam: 1, mulai: '07:00', selesai: '07:40' },
        { type: 'pelajaran', jam: 2, mulai: '07:40', selesai: '08:20' },
        { type: 'pelajaran', jam: 3, mulai: '08:20', selesai: '09:00' },
        { type: 'pelajaran', jam: 4, mulai: '09:00', selesai: '09:40' },
        { type: 'istirahat', label: 'Break (R)', mulai: '09:40', selesai: '10:00' },
        { type: 'pelajaran', jam: 5, mulai: '10:00', selesai: '10:40' },
        { type: 'pelajaran', jam: 6, mulai: '10:40', selesai: '11:20' },
        { type: 'pelajaran', jam: 7, mulai: '11:20', selesai: '12:00' },
        { type: 'pelajaran', jam: 8, mulai: '12:00', selesai: '12:30' },
        { type: 'kegiatan', label: 'Family Time', mulai: '12:30', selesai: '12:45' },
        { type: 'kegiatan', label: 'Jamaah Duhur', mulai: '12:45', selesai: '13:05' }
      ];
      const jumat = [
        { type: 'kegiatan', label: 'Morning Roll Call', mulai: '06:45', selesai: '07:00' },
        { type: 'pelajaran', jam: 1, mulai: '07:00', selesai: '07:40' },
        { type: 'pelajaran', jam: 2, mulai: '07:40', selesai: '08:20' },
        { type: 'pelajaran', jam: 3, mulai: '08:20', selesai: '09:00' },
        { type: 'pelajaran', jam: 4, mulai: '09:00', selesai: '09:40' },
        { type: 'istirahat', label: 'Break (R)', mulai: '09:40', selesai: '10:00' },
        { type: 'kegiatan', label: 'Sholat Jumat', mulai: '11:30', selesai: '12:30' }
      ];
      const sabtu = [
        { type: 'kegiatan', label: 'Morning Roll Call', mulai: '06:45', selesai: '07:00' },
        { type: 'pelajaran', jam: 1, mulai: '07:00', selesai: '07:40' },
        { type: 'pelajaran', jam: 2, mulai: '07:40', selesai: '08:20' },
        { type: 'pelajaran', jam: 3, mulai: '08:20', selesai: '09:00' },
        { type: 'pelajaran', jam: 4, mulai: '09:00', selesai: '09:40' },
        { type: 'istirahat', label: 'Break (R)', mulai: '09:40', selesai: '10:00' }
      ];
      return {
        'Senin': JSON.parse(JSON.stringify(senKam)),
        'Selasa': JSON.parse(JSON.stringify(senKam)),
        'Rabu': JSON.parse(JSON.stringify(senKam)),
        'Kamis': JSON.parse(JSON.stringify(senKam)),
        'Jumat': JSON.parse(JSON.stringify(jumat)),
        'Sabtu': JSON.parse(JSON.stringify(sabtu)),
      };
    },

    getCurrentDayName() {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[new Date().getDay()];
    },

    getCurrentTimeStr() {
      const now = new Date();
      return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    },

    getCurrentLesson() {
      const hari = this.getCurrentDayName();
      if (hari === 'Minggu') return { status: 'libur', label: 'Hari Libur' };
      const slots = this.jamPelajaran[hari];
      if (!slots || slots.length === 0) return { status: 'kosong', label: 'Tidak ada jadwal' };
      const nowStr = this.getCurrentTimeStr();
      for (const slot of slots) {
        if (nowStr >= slot.mulai && nowStr < slot.selesai) {
          if (slot.type === 'istirahat') {
            return { status: 'istirahat', label: slot.label || 'Istirahat', mulai: slot.mulai, selesai: slot.selesai };
          }
          if (slot.type === 'kegiatan') {
            return { status: 'kegiatan', label: slot.label || 'Kegiatan', mulai: slot.mulai, selesai: slot.selesai };
          }
          const entry = this.jadwalKelas.find(j => j.hari === hari && j.jamKe === slot.jam);
          if (entry) {
            return { status: 'belajar', jam: slot.jam, mulai: slot.mulai, selesai: slot.selesai, mapel: entry.mapel, guru: entry.guru };
          }
          return { status: 'kosong_jam', jam: slot.jam, mulai: slot.mulai, selesai: slot.selesai, label: 'Belum diisi jadwal' };
        }
      }
      const lastSlot = slots[slots.length - 1];
      if (nowStr >= lastSlot.selesai) {
        return { status: 'selesai', label: 'Pelajaran sudah selesai hari ini' };
      }
      return { status: 'belum', label: 'Pelajaran belum dimulai', firstSlot: slots[0] };
    },

    getTodayTeachingSchedule() {
      const hari = this.getCurrentDayName();
      if (hari === 'Minggu') return [];
      const slots = this.jamPelajaran[hari] || [];
      return this.jadwalMengajar
        .filter(j => j.hari === hari)
        .map(j => {
          const slot = slots.find(s => s.type === 'pelajaran' && s.jam === j.jamKe);
          return { ...j, mulai: slot ? slot.mulai : '?', selesai: slot ? slot.selesai : '?' };
        })
        .sort((a, b) => a.jamKe - b.jamKe);
    },

    getJadwalSlotsMerged(hari, type) {
      const slots = this.jamPelajaran[hari] || [];
      const source = type === 'kelas' ? this.jadwalKelas : this.jadwalMengajar;
      return slots.map(slot => {
        if (slot.type === 'istirahat' || slot.type === 'kegiatan') {
          return { ...slot, entry: null };
        }
        const entry = source.find(j => j.hari === hari && j.jamKe === slot.jam);
        return { ...slot, entry: entry || null };
      });
    },

    getLessonSlotsForDay(hari) {
      const slots = this.jamPelajaran[hari] || [];
      return slots.filter(s => s.type === 'pelajaran');
    },

    openEditJadwalKelas(hari, jamKe, existing) {
      this.formJadwalKelas.hari = hari;
      this.formJadwalKelas.jamMulai = jamKe;
      this.formJadwalKelas.jamSelesai = jamKe;
      this.formJadwalKelas.mapel = existing ? existing.mapel : '';
      this.formJadwalKelas.guru = existing ? existing.guru : '';
      this.formJadwalKelas.isEdit = !!existing;
      this.modalJadwalKelasEditOpen = true;
    },

    saveJadwalKelasCell() {
      const { hari, jamMulai, jamSelesai, mapel, guru } = this.formJadwalKelas;
      if (!mapel.trim()) { this.showToast('Nama mata pelajaran wajib diisi', 'error'); return; }
      const minJam = Math.min(Number(jamMulai) || 1, Number(jamSelesai) || 1);
      const maxJam = Math.max(Number(jamMulai) || 1, Number(jamSelesai) || 1);
      
      for (let j = minJam; j <= maxJam; j++) {
        const idx = this.jadwalKelas.findIndex(item => item.hari === hari && item.jamKe === j);
        if (idx >= 0) {
          this.jadwalKelas[idx].mapel = mapel.trim();
          this.jadwalKelas[idx].guru = guru.trim();
        } else {
          this.jadwalKelas.push({ hari, jamKe: j, mapel: mapel.trim(), guru: guru.trim() });
        }
      }
      this.modalJadwalKelasEditOpen = false;
      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalKelas', this.jadwalKelas);
      const msg = minJam === maxJam ? `Jadwal Jam ke-${minJam} berhasil disimpan!` : `Jadwal Jam ke-${minJam} s.d. ${maxJam} berhasil disimpan!`;
      this.showToast(msg, 'success');
    },

    deleteJadwalKelasCell(hari, jamKe) {
      this.jadwalKelas = this.jadwalKelas.filter(j => !(j.hari === hari && j.jamKe === jamKe));
      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalKelas', this.jadwalKelas);
      this.showToast('Jadwal dihapus', 'info');
    },

    openEditJadwalMengajar(hari, jamKe, existing) {
      this.formJadwalMengajar.hari = hari;
      this.formJadwalMengajar.jamMulai = jamKe;
      this.formJadwalMengajar.jamSelesai = jamKe;
      this.formJadwalMengajar.tipeTugas = existing?.tipeTugas || (existing?.lantai ? 'Piket Lantai' : 'Mengajar');
      this.formJadwalMengajar.kelas = existing?.kelas || (this.kelasList[0]?.nama || 'X3 Atlet');
      this.formJadwalMengajar.mapel = existing?.mapel || 'Kimia';
      this.formJadwalMengajar.lantai = existing?.lantai || 'Lantai 2';
      this.formJadwalMengajar.isEdit = !!existing;
      this.modalJadwalMengajarEditOpen = true;
    },

    saveJadwalMengajarCell() {
      const { hari, jamMulai, jamSelesai, tipeTugas, kelas, mapel, lantai } = this.formJadwalMengajar;
      if (tipeTugas === 'Mengajar' && !kelas.trim()) {
        this.showToast('Pilih atau isi kelas yang diajar', 'error');
        return;
      }
      if (tipeTugas === 'Piket Lantai' && !lantai.trim()) {
        this.showToast('Isi keterangan lantai piket', 'error');
        return;
      }
      const minJam = Math.min(Number(jamMulai) || 1, Number(jamSelesai) || 1);
      const maxJam = Math.max(Number(jamMulai) || 1, Number(jamSelesai) || 1);
      
      for (let j = minJam; j <= maxJam; j++) {
        const idx = this.jadwalMengajar.findIndex(item => item.hari === hari && item.jamKe === j);
        const record = {
          hari,
          jamKe: j,
          tipeTugas: tipeTugas || 'Mengajar',
          kelas: tipeTugas === 'Mengajar' ? kelas.trim() : '',
          mapel: tipeTugas === 'Mengajar' ? (mapel.trim() || 'Kimia') : 'Piket Koridor Lantai',
          lantai: tipeTugas === 'Piket Lantai' ? lantai.trim() : ''
        };
        if (idx >= 0) {
          this.jadwalMengajar[idx] = record;
        } else {
          this.jadwalMengajar.push(record);
        }
      }
      this.modalJadwalMengajarEditOpen = false;
      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalMengajar', this.jadwalMengajar);
      const msg = minJam === maxJam ? `Jadwal Jam ke-${minJam} berhasil disimpan!` : `Jadwal Jam ke-${minJam} s.d. ${maxJam} berhasil disimpan!`;
      this.showToast(msg, 'success');
    },

    deleteJadwalMengajarCell(hari, jamKe) {
      this.jadwalMengajar = this.jadwalMengajar.filter(j => !(j.hari === hari && j.jamKe === jamKe));
      this.saveLocalData();
      this.syncToGoogleDrive('saveJadwalMengajar', this.jadwalMengajar);
      this.showToast('Jadwal dihapus', 'info');
    },

    addJamSlot(hari) {
      if (!this.jamPelajaran[hari]) this.jamPelajaran[hari] = [];
      const slots = this.jamPelajaran[hari];
      const lastSlot = slots.length > 0 ? slots[slots.length - 1] : null;
      const maxJam = slots.filter(s => s.type === 'pelajaran').length;
      const newMulai = lastSlot ? lastSlot.selesai : '07:00';
      const [h, m] = newMulai.split(':').map(Number);
      const endMin = m + 40;
      const newSelesai = String(h + Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');
      slots.push({ type: 'pelajaran', jam: maxJam + 1, mulai: newMulai, selesai: newSelesai });
      this.saveLocalData();
      this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
    },

    addIstirahatSlot(hari) {
      if (!this.jamPelajaran[hari]) this.jamPelajaran[hari] = [];
      const slots = this.jamPelajaran[hari];
      const lastSlot = slots.length > 0 ? slots[slots.length - 1] : null;
      const newMulai = lastSlot ? lastSlot.selesai : '09:40';
      const [h, m] = newMulai.split(':').map(Number);
      const endMin = m + 20;
      const newSelesai = String(h + Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');
      slots.push({ type: 'istirahat', label: 'Istirahat', mulai: newMulai, selesai: newSelesai });
      this.saveLocalData();
      this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
    },

    addKegiatanSlot(hari) {
      if (!this.jamPelajaran[hari]) this.jamPelajaran[hari] = [];
      const slots = this.jamPelajaran[hari];
      const lastSlot = slots.length > 0 ? slots[slots.length - 1] : null;
      const newMulai = lastSlot ? lastSlot.selesai : '12:30';
      const [h, m] = newMulai.split(':').map(Number);
      const endMin = m + 15;
      const newSelesai = String(h + Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');
      slots.push({ type: 'kegiatan', label: 'Kegiatan', mulai: newMulai, selesai: newSelesai });
      this.saveLocalData();
      this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
    },

    removeJamSlot(hari, index) {
      if (!this.jamPelajaran[hari]) return;
      this.jamPelajaran[hari].splice(index, 1);
      // Re-number lesson slots
      let jamCounter = 1;
      this.jamPelajaran[hari].forEach(s => {
        if (s.type === 'pelajaran') { s.jam = jamCounter++; }
      });
      this.saveLocalData();
      this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
    },

    updateJamSlotTime(hari, index, field, value) {
      if (this.jamPelajaran[hari] && this.jamPelajaran[hari][index]) {
        this.jamPelajaran[hari][index][field] = value;
        this.saveLocalData();
        this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
      }
    },

    resetJamPelajaran() {
      this.jamPelajaran = this.getDefaultJamPelajaran();
      this.saveLocalData();
      this.syncToGoogleDrive('saveJamPelajaran', this.jamPelajaran);
      this.showToast('Jam pelajaran direset ke default!', 'info');
    },

    countJadwalKelasForDay(hari) {
      return this.jadwalKelas.filter(j => j.hari === hari).length;
    },

    countJadwalMengajarForDay(hari) {
      return this.jadwalMengajar.filter(j => j.hari === hari).length;
    },

    // =========================================================================
    // 4A-2. aSc TIMETABLES IMPORT ENGINE (JADWAL GURU & JADWAL KELAS)
    // =========================================================================
    openModalImporJadwal(target) {
      this.formImporJadwal.target = target || 'mengajar';
      this.formImporJadwal.targetKelas = this.waliKelasFilter?.kelas || this.guru?.kelasWali || 'X3 Atlet';
      this.formImporJadwal.inputMode = 'ai';
      this.formImporJadwal.rawText = '';
      this.formImporJadwal.fileName = '';
      this.formImporJadwal.replaceAll = true;
      this.isScanningAi = false;
      this.scanAiProgress = '';
      this.scanAiError = '';
      this.scanAiFile = { name: '', size: '', base64: '', mimeType: '', previewUrl: '' };
      this.imporJadwalStep = 'input';
      this.imporJadwalPreview = [];
      this.modalImporJadwalOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveGeminiApiKey(key) {
      if (key !== undefined) {
        this.geminiApiKey = key.trim();
      }
      localStorage.setItem('LMS_GEMINI_API_KEY', this.geminiApiKey);
      this.showApiKeyInput = false;
      this.showToast('Kunci Gemini API berhasil disimpan!', 'success');
    },

    async testGeminiApiConnection() {
      let apiKey = (this.geminiApiKey || '').trim();
      
      // Jika belum ada di state lokal, coba tarik otomatis dari Code.gs
      if (!apiKey && this.gasWebAppUrl) {
        try {
          this.isTestingGeminiApi = true;
          this.geminiApiTestMessage = 'Memeriksa kunci API dari server Spreadsheet...';
          const cleanUrl = this.gasWebAppUrl.trim().replace(/\/+$/, '');
          const configRes = await fetch(cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'action=getGeminiConfig&_t=' + new Date().getTime());
          const configJson = await configRes.json();
          if (configJson && configJson.data && configJson.data.geminiApiKey) {
            apiKey = configJson.data.geminiApiKey.trim();
            this.geminiApiKey = apiKey;
            localStorage.setItem('LMS_GEMINI_API_KEY', apiKey);
          }
        } catch (e) {
          console.warn('Gagal cek config dari gasWebAppUrl:', e);
        }
      }

      if (!apiKey) {
        this.isTestingGeminiApi = false;
        this.geminiApiTestStatus = 'error';
        this.geminiApiTestMessage = 'API Key belum diatur! Masukkan API Key di kotak bawah atau isi di Code.gs.';
        this.showToast('Kunci Gemini API belum diisi!', 'error');
        this.showApiKeyInput = true;
        return;
      }

      this.isTestingGeminiApi = true;
      this.geminiApiTestStatus = null;
      this.geminiApiTestMessage = 'Menghubungi server Google Gemini AI...';

      // Prioritas model resmi yang terverifikasi aktif untuk Vision & Multimodal
      const models = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];
      let lastError = null;
      let connectedModel = null;
      const startTime = Date.now();

      for (const model of models) {
        try {
          this.geminiApiTestMessage = `Menguji respon model ${model}...`;
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Ping test connection. Balas satu kata: SIAP" }] }]
            })
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `HTTP ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            connectedModel = model;
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`Pengujian model ${model} gagal:`, err);
        }
      }

      const elapsed = Date.now() - startTime;
      this.isTestingGeminiApi = false;

      if (connectedModel) {
        this.geminiApiTestStatus = 'success';
        this.geminiApiTestMessage = `Koneksi Berhasil! Model aktif: ${connectedModel} (${elapsed}ms) • Siap memindai PDF & Foto Jadwal!`;
        this.showToast(`🎉 Koneksi AI Gemini Sukses! (${connectedModel})`, 'success');
      } else {
        this.geminiApiTestStatus = 'error';
        const msg = (lastError && lastError.message) || 'Tidak dapat terhubung ke Google AI';
        this.geminiApiTestMessage = `Gagal terkoneksi ke AI Gemini: ${msg}`;
        this.showToast(`Gagal koneksi AI: ${msg}`, 'error');
      }
    },

    handleScheduleMediaUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
      const isImg = file.type.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');

      if (!isPdf && !isImg) {
        this.showToast('Mohon pilih berkas PDF (.pdf) atau gambar foto (.png, .jpg, .jpeg)', 'error');
        return;
      }

      const mimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');
      const sizeStr = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';

      this.scanAiFile = {
        name: file.name,
        size: sizeStr,
        base64: '',
        mimeType: mimeType,
        previewUrl: isImg ? URL.createObjectURL(file) : ''
      };
      this.scanAiError = '';

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        this.scanAiFile.base64 = base64Data;
      };
      reader.onerror = () => {
        this.showToast('Gagal membaca file lokal', 'error');
      };
      reader.readAsDataURL(file);
    },

    async scanScheduleWithGemini() {
      if (!this.scanAiFile.base64) {
        this.showToast('Pilih berkas PDF atau foto jadwal terlebih dahulu', 'error');
        return;
      }

      const target = this.formImporJadwal.target;
      const targetKelas = this.formImporJadwal.targetKelas || 'X3 Atlet';
      const teacherName = this.guru?.nama || 'Tito Vanzal, S.Pd.';

      // 1. Cek apakah ada API key di state/localStorage, jika tidak coba tarik otomatis dari Code.gs via Google Web App
      let apiKey = (this.geminiApiKey || '').trim();
      if (!apiKey && this.gasWebAppUrl) {
        try {
          this.scanAiProgress = 'Menghubungkan ke Code.gs Google Drive untuk memeriksa API Key...';
          const cleanUrl = this.gasWebAppUrl.trim().replace(/\/+$/, '');
          const configRes = await fetch(cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'action=getGeminiConfig&_t=' + new Date().getTime());
          const configJson = await configRes.json();
          if (configJson && configJson.data && configJson.data.geminiApiKey) {
            apiKey = configJson.data.geminiApiKey.trim();
            this.geminiApiKey = apiKey;
            localStorage.setItem('LMS_GEMINI_API_KEY', apiKey);
          }
        } catch (e) {
          console.warn('Gagal cek config dari gasWebAppUrl:', e);
        }
      }

      // 2. Jika di dalam lingkungan Google Apps Script bawaan (google.script.run), jalankan backend Code.gs langsung
      if (this.isGasEnvironment) {
        this.isScanningAi = true;
        this.scanAiProgress = 'Menghubungi backend Code.gs untuk memindai dokumen dengan Gemini AI...';
        this.scanAiError = '';
        
        google.script.run
          .withSuccessHandler((res) => {
            if (res && res.items && Array.isArray(res.items)) {
              this.processAiExtractedSchedule(res.items, target, targetKelas, teacherName);
            } else {
              this.scanAiError = 'Tidak ada sesi jadwal yang ditemukan.';
              this.isScanningAi = false;
            }
          })
          .withFailureHandler((err) => {
            this.scanAiError = (err && err.message) || err.toString();
            this.isScanningAi = false;
            this.showToast('Gagal memindai: ' + this.scanAiError, 'error');
          })
          .handleAction('scanScheduleWithGemini', {
            base64: this.scanAiFile.base64,
            mimeType: this.scanAiFile.mimeType,
            target: target,
            targetKelas: targetKelas,
            teacherName: teacherName,
            apiKey: apiKey
          });
        return;
      }

      // 3. Jika API key belum ada di Code.gs maupun client
      if (!apiKey) {
        this.showToast('Mohon isi GEMINI_API_KEY di Code.gs atau masukkan API Key di kotak bawah', 'error');
        this.showApiKeyInput = true;
        return;
      }

      this.isScanningAi = true;
      this.scanAiProgress = 'AI Gemini sedang memindai tabel dan membaca baris jadwal aSc Timetables...';
      this.scanAiError = '';

      const promptText = `Anda adalah asisten cerdas ahli pembaca data jadwal sekolah Indonesia dari sistem aSc Timetables.
Tugas Anda adalah mengekstrak jadwal pelajaran mingguan dari dokumen/gambar aSc Timetables ini menjadi JSON ARRAY murni.

Informasi Target:
- Jenis Impor: "${target === 'mengajar' ? 'JADWAL MENGAJAR GURU & PIKET' : 'JADWAL KELAS SISWA'}"
- Nama Guru Pengguna: "${teacherName}" (Kode Guru di aSc biasanya inisial seperti C9 atau serupa)
- Kelas Target: "${targetKelas}"

Aturan Pembacaan Kolom & Baris:
1. Hari Sekolah: Cari kolom hari ("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu").
2. Jam Pelajaran: Cari nomor jam ke- 1 sampai 8 (abaikan Morning Roll Call, Istirahat / Break R, Family Time, dan Jamaah Duhur jika tidak ada KBM).
3. Untuk Target "mengajar":
   - Ekstrak seluruh jam mengajar guru kimia (${teacherName} / kode guru C9) di semua kelas.
   - Deteksi Tugas Piket: jika ada sel berisi kata "Picket" atau "Piket" (misal: "Picket Kantin", "Picket Lantai 3", dsb), set tipeTugas: "Piket Lantai", mapel: "Picket", lantai: keterangan ruang/koridor/kantin, kelas: "".
   - Jika mengajar biasa: set tipeTugas: "Mengajar", mapel: nama mata pelajaran (misal "Chemistry" atau "PISA" atau "Kimia"), kelas: nama kelas (misal "XII Cp", "XII ICP 2F", "X5 COC2", "X15 IUPP COC 1"), lantai: "".
4. Untuk Target "kelas":
   - Ekstrak seluruh mata pelajaran dan guru untuk kelas ${targetKelas}.
   - set mapel: nama mata pelajaran, guru: nama atau inisial guru pengampu, kelas: "${targetKelas}".

Format Output: WAJIB HANYA berupa JSON Array valid dengan skema objek persis seperti berikut (tanpa markdown blok pembungkus):
[
  {
    "hari": "Senin",
    "jamKe": 1,
    "tipeTugas": "Mengajar",
    "mapel": "PISA",
    "kelas": "X5 COC2",
    "guru": "${teacherName}",
    "lantai": ""
  },
  {
    "hari": "Senin",
    "jamKe": 5,
    "tipeTugas": "Piket Lantai",
    "mapel": "Picket",
    "kelas": "",
    "guru": "${teacherName}",
    "lantai": "Kantin"
  }
]`;

      try {
        const models = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];
        let resultData = null;
        let lastError = null;

        for (const model of models) {
          try {
            this.scanAiProgress = `AI Gemini (${model}) sedang menganalisis tata letak tabel...`;
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const payload = {
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: this.scanAiFile.mimeType,
                        data: this.scanAiFile.base64
                      }
                    },
                    {
                      text: promptText
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1
              }
            };

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              const errBody = await response.json().catch(() => ({}));
              throw new Error(errBody.error?.message || `HTTP ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textOutput) {
              throw new Error('Respons AI tidak mengandung teks hasil analisis.');
            }

            let parsed = null;
            try {
              parsed = JSON.parse(textOutput);
            } catch (pErr) {
              const jsonMatch = textOutput.match(/\[\s*\{[\s\S]*\}\s*\]/);
              if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('Format JSON dari AI tidak valid: ' + pErr.message);
              }
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
              resultData = parsed;
              break;
            }
          } catch (modelErr) {
            lastError = modelErr;
            console.warn(`Model ${model} gagal:`, modelErr);
          }
        }

        if (!resultData || resultData.length === 0) {
          throw lastError || new Error('Tidak ada data jadwal yang berhasil diekstrak dari berkas tersebut.');
        }

        this.processAiExtractedSchedule(resultData, target, targetKelas, teacherName);
      } catch (err) {
        this.scanAiError = err.message || 'Terjadi kesalahan saat memindai jadwal.';
        this.showToast('Gagal memindai: ' + this.scanAiError, 'error');
        this.isScanningAi = false;
        this.scanAiProgress = '';
      }
    },

    processAiExtractedSchedule(resultData, target, targetKelas, teacherName) {
      const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
      this.imporJadwalPreview = resultData.map(item => {
        const hari = item.hari || 'Senin';
        const jamKe = parseInt(item.jamKe, 10) || 1;
        const slot = (this.jamPelajaran[hari] || []).find(s => s.type === 'pelajaran' && s.jam === jamKe);
        const waktuStr = slot ? `${slot.mulai} - ${slot.selesai}` : `Jam ke-${jamKe}`;
        const isPiket = item.tipeTugas === 'Piket Lantai' || /picket|piket/i.test(item.mapel || '');

        return {
          hari: hari,
          jamKe: jamKe,
          waktu: waktuStr,
          tipeTugas: isPiket ? 'Piket Lantai' : 'Mengajar',
          mapel: isPiket ? 'Picket' : (item.mapel || (target === 'mengajar' ? 'Kimia' : 'Mapel')),
          kelas: isPiket ? '' : (item.kelas || (target === 'mengajar' ? '-' : targetKelas)),
          guru: item.guru || (target === 'mengajar' ? teacherName : '-'),
          lantai: isPiket ? (item.lantai || 'Koridor / Kantin') : ''
        };
      }).sort((a, b) => {
        return ((dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99)) || (a.jamKe - b.jamKe);
      });

      this.isScanningAi = false;
      this.scanAiProgress = '';
      this.imporJadwalStep = 'preview';
      this.showToast(`✨ Hebat! AI Gemini berhasil mengekstrak ${this.imporJadwalPreview.length} sesi jadwal dari berkas PDF/Foto!`, 'success');
      this.$nextTick(() => this.initLucideIcons());
    },

    handleScheduleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.formImporJadwal.fileName = file.name;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (typeof XLSX === 'undefined') {
            this.showToast('Pustaka SheetJS belum siap', 'error');
            return;
          }
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          this.parseAscTimetable(matrix, this.formImporJadwal.target, this.formImporJadwal.targetKelas);
        } catch (err) {
          this.showToast('Gagal membaca file Excel/CSV: ' + err.message, 'error');
        }
      };

      reader.readAsArrayBuffer(file);
    },

    processPastedScheduleText() {
      if (!this.formImporJadwal.rawText.trim()) {
        this.showToast('Tempelkan teks atau salinan tabel jadwal terlebih dahulu', 'error');
        return;
      }
      this.parseAscTimetable(this.formImporJadwal.rawText, this.formImporJadwal.target, this.formImporJadwal.targetKelas);
    },

    parseAscTimetable(rawInput, target, targetKelas) {
      target = target || this.formImporJadwal.target || 'mengajar';
      targetKelas = targetKelas || this.formImporJadwal.targetKelas || (this.waliKelasFilter?.kelas || 'X3 Atlet');

      let matrix = [];
      if (Array.isArray(rawInput)) {
        matrix = rawInput;
      } else if (typeof rawInput === 'string') {
        const lines = rawInput.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        matrix = lines.map(l => {
          if (l.includes('\t')) return l.split('\t').map(c => c.trim());
          if (l.includes(';')) return l.split(';').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (l.includes(',')) return l.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          return [l];
        });
      }

      if (!matrix || matrix.length === 0) {
        this.showToast('Data jadwal tidak ditemukan / kosong', 'error');
        return;
      }

      const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayEnToId = { 'monday': 'Senin', 'tuesday': 'Selasa', 'wednesday': 'Rabu', 'thursday': 'Kamis', 'friday': 'Jumat', 'saturday': 'Sabtu' };

      // 1. Cari baris header hari
      let headerRowIdx = -1;
      let dayColMap = {}; // { colIdx: 'Senin', ... }

      for (let r = 0; r < Math.min(matrix.length, 12); r++) {
        const row = matrix[r];
        let foundDays = 0;
        const tempMap = {};
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toLowerCase().trim();
          for (const d of dayNames) {
            if (val === d.toLowerCase() || val.startsWith(d.toLowerCase())) {
              tempMap[c] = d;
              foundDays++;
              break;
            }
          }
          for (const [en, id] of Object.entries(dayEnToId)) {
            if (val === en || val.startsWith(en)) {
              tempMap[c] = id;
              foundDays++;
              break;
            }
          }
        }
        if (foundDays >= 3) {
          headerRowIdx = r;
          dayColMap = tempMap;
          break;
        }
      }

      const parsedItems = [];

      // A. Jika format matriks aSc Timetable terdeteksi
      if (headerRowIdx >= 0 && Object.keys(dayColMap).length >= 3) {
        for (let r = headerRowIdx + 1; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          // Cek nomor jam dari kolom pertama atau kedua
          let jamKe = null;
          for (let c = 0; c < Math.min(row.length, 3); c++) {
            if (dayColMap[c]) continue; // ini kolom hari
            const cellVal = String(row[c] || '').trim();
            const numMatch = cellVal.match(/^\b([1-8])\b/);
            if (numMatch) {
              jamKe = parseInt(numMatch[1], 10);
              break;
            }
            if (cellVal.includes('07:00') || cellVal.includes('7:00')) { jamKe = 1; break; }
            if (cellVal.includes('07:40') || cellVal.includes('7:40')) { jamKe = 2; break; }
            if (cellVal.includes('08:20') || cellVal.includes('8:20')) { jamKe = 3; break; }
            if (cellVal.includes('09:00') || cellVal.includes('9:00')) { jamKe = 4; break; }
            if (cellVal.includes('10:00')) { jamKe = 5; break; }
            if (cellVal.includes('10:40')) { jamKe = 6; break; }
            if (cellVal.includes('11:20')) { jamKe = 7; break; }
            if (cellVal.includes('12:00')) { jamKe = 8; break; }
          }

          if (jamKe === null || jamKe < 1 || jamKe > 8) continue; // baris jeda istirahat / roll call

          // Ambil isi sel untuk setiap hari
          for (const [colIdxStr, hari] of Object.entries(dayColMap)) {
            const colIdx = parseInt(colIdxStr, 10);
            const rawCell = String(row[colIdx] || '').trim();
            if (!rawCell || rawCell === '-' || rawCell === '.') continue;

            const lines = rawCell.split(/\r?\n|<br\s*\/?>/i).map(l => l.trim()).filter(l => l.length > 0 && l !== '-');
            if (lines.length === 0) continue;

            // Dapatkan rentang waktu dari jamPelajaran
            const slotInfo = (this.jamPelajaran[hari] || []).find(s => s.type === 'pelajaran' && s.jam === jamKe);
            const waktuStr = slotInfo ? `${slotInfo.mulai} - ${slotInfo.selesai}` : `Jam ke-${jamKe}`;

            if (target === 'mengajar') {
              const isPiket = lines.some(l => /picket|piket/i.test(l));
              if (isPiket) {
                const subDetail = lines.filter(l => !/picket|piket|c9/i.test(l)).join(' • ');
                parsedItems.push({
                  hari,
                  jamKe,
                  waktu: waktuStr,
                  tipeTugas: 'Piket Lantai',
                  mapel: 'Picket',
                  kelas: '',
                  lantai: subDetail || 'Piket Koridor',
                  guru: this.guru.nama
                });
              } else {
                const mapelName = lines[0];
                const cleanLines = lines.slice(1).filter(l => !/^(c9)$/i.test(l));
                const targetKelasStr = cleanLines.join(' ') || targetKelas;
                parsedItems.push({
                  hari,
                  jamKe,
                  waktu: waktuStr,
                  tipeTugas: 'Mengajar',
                  mapel: mapelName || 'Kimia',
                  kelas: targetKelasStr,
                  lantai: '',
                  guru: this.guru.nama
                });
              }
            } else {
              // Target: Jadwal Kelas Siswa
              const mapelName = lines[0];
              let guruName = lines.length > 1 ? lines.slice(1).join(' ') : '-';
              if (/athlete/i.test(mapelName)) guruName = 'Guru Olahraga / Tim Atlet';
              parsedItems.push({
                hari,
                jamKe,
                waktu: waktuStr,
                mapel: mapelName,
                guru: guruName,
                kelas: targetKelas
              });
            }
          }
        }
      } else {
        // B. Fallback: Format baris demi baris (Hari, Jam, Mapel, Guru/Kelas)
        for (const row of matrix) {
          if (row.length < 3) continue;
          let foundHari = null;
          for (const d of dayNames) {
            if (row.some(c => String(c).toLowerCase().includes(d.toLowerCase()))) {
              foundHari = d;
              break;
            }
          }
          if (!foundHari) continue;

          let jamKe = null;
          for (const c of row) {
            const m = String(c).match(/\b([1-8])\b/);
            if (m) { jamKe = parseInt(m[1], 10); break; }
          }
          if (!jamKe) continue;

          const nonHariJam = row.filter(c => !String(c).toLowerCase().includes(foundHari.toLowerCase()) && !String(c).match(/^\b[1-8]\b$/));
          if (nonHariJam.length === 0) continue;

          const slotInfo = (this.jamPelajaran[foundHari] || []).find(s => s.type === 'pelajaran' && s.jam === jamKe);
          const waktuStr = slotInfo ? `${slotInfo.mulai} - ${slotInfo.selesai}` : `Jam ke-${jamKe}`;

          if (target === 'mengajar') {
            const isPiket = nonHariJam.some(c => /picket|piket/i.test(c));
            parsedItems.push({
              hari: foundHari,
              jamKe,
              waktu: waktuStr,
              tipeTugas: isPiket ? 'Piket Lantai' : 'Mengajar',
              mapel: isPiket ? 'Picket' : (nonHariJam[0] || 'Kimia'),
              kelas: isPiket ? '' : (nonHariJam[1] || targetKelas),
              lantai: isPiket ? (nonHariJam.filter(c => !/picket|piket/i.test(c)).join(' ') || 'Piket Koridor') : '',
              guru: this.guru.nama
            });
          } else {
            parsedItems.push({
              hari: foundHari,
              jamKe,
              waktu: waktuStr,
              mapel: nonHariJam[0] || 'Mapel',
              guru: nonHariJam[1] || '-',
              kelas: targetKelas
            });
          }
        }
      }

      if (parsedItems.length === 0) {
        this.showToast('Gagal mengenali format jadwal aSc. Pastikan tabel memiliki nama hari (Senin-Sabtu) dan jam ke-1 s.d. 8.', 'error');
        return;
      }

      this.imporJadwalPreview = parsedItems.sort((a, b) => {
        const order = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
        return (order[a.hari] - order[b.hari]) || (a.jamKe - b.jamKe);
      });
      this.imporJadwalStep = 'preview';
      this.showToast(`✨ Berhasil mendeteksi ${parsedItems.length} sesi jadwal aSc Timetables!`, 'success');
      this.$nextTick(() => this.initLucideIcons());
    },

    applyImportedSchedule() {
      if (!this.imporJadwalPreview || this.imporJadwalPreview.length === 0) {
        this.showToast('Tidak ada data jadwal untuk diterapkan', 'error');
        return;
      }

      const target = this.formImporJadwal.target;
      const replaceAll = this.formImporJadwal.replaceAll;

      if (target === 'mengajar') {
        if (replaceAll) {
          const importedDays = new Set(this.imporJadwalPreview.map(p => p.hari));
          this.jadwalMengajar = this.jadwalMengajar.filter(j => !importedDays.has(j.hari));
        }
        for (const item of this.imporJadwalPreview) {
          const existIdx = this.jadwalMengajar.findIndex(j => j.hari === item.hari && j.jamKe === item.jamKe);
          const record = {
            hari: item.hari,
            jamKe: item.jamKe,
            tipeTugas: item.tipeTugas,
            kelas: item.kelas,
            mapel: item.mapel,
            lantai: item.lantai
          };
          if (existIdx >= 0) {
            this.jadwalMengajar[existIdx] = record;
          } else {
            this.jadwalMengajar.push(record);
          }
        }
        this.saveLocalData();
        this.syncToGoogleDrive('saveJadwalMengajar', this.jadwalMengajar);
        this.showToast(`🎉 Berhasil mengimpor ${this.imporJadwalPreview.length} sesi Jadwal Mengajar Guru!`, 'success');
      } else {
        // Target: Jadwal Kelas Siswa
        if (replaceAll) {
          const importedDays = new Set(this.imporJadwalPreview.map(p => p.hari));
          this.jadwalKelas = this.jadwalKelas.filter(j => !importedDays.has(j.hari));
        }
        for (const item of this.imporJadwalPreview) {
          const existIdx = this.jadwalKelas.findIndex(j => j.hari === item.hari && j.jamKe === item.jamKe);
          const record = {
            hari: item.hari,
            jamKe: item.jamKe,
            mapel: item.mapel,
            guru: item.guru
          };
          if (existIdx >= 0) {
            this.jadwalKelas[existIdx] = record;
          } else {
            this.jadwalKelas.push(record);
          }
        }
        this.saveLocalData();
        this.syncToGoogleDrive('saveJadwalKelas', this.jadwalKelas);
        this.showToast(`🎉 Berhasil mengimpor ${this.imporJadwalPreview.length} sesi Jadwal Kelas Siswa!`, 'success');
      }

      this.modalImporJadwalOpen = false;
      this.imporJadwalStep = 'input';
      this.imporJadwalPreview = [];
      this.$nextTick(() => this.initLucideIcons());
    },

    loadSchedulePresetFromPhoto(target) {
      target = target || this.formImporJadwal.target || 'mengajar';
      let items = [];
      if (target === 'mengajar') {
        items = this.getPresetJadwalMengajarTito();
      } else {
        items = this.getPresetJadwalKelasX3();
      }
      this.imporJadwalPreview = items.map(item => {
        const slot = (this.jamPelajaran[item.hari] || []).find(s => s.type === 'pelajaran' && s.jam === item.jamKe);
        return {
          ...item,
          waktu: slot ? `${slot.mulai} - ${slot.selesai}` : `Jam ke-${item.jamKe}`,
          kelas: item.kelas || this.formImporJadwal.targetKelas || 'X3 Atlet',
          guru: item.guru || this.guru.nama
        };
      });
      this.imporJadwalStep = 'preview';
      this.showToast(`⚡ Jadwal sesuai foto aSc Timetables berhasil dimuat (${this.imporJadwalPreview.length} sesi)!`, 'info');
      this.$nextTick(() => this.initLucideIcons());
    },

    downloadAscTemplateExcel(target) {
      target = target || this.formImporJadwal.target || 'mengajar';
      if (typeof XLSX === 'undefined') {
        this.showToast('Pustaka SheetJS belum siap', 'error');
        return;
      }
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const headers = ['JAM', 'WAKTU', ...days];
      const rows = [headers];

      const slots = [
        { jam: 'MORNING ROLL CALL', waktu: '06:45 - 07:00' },
        { jam: 1, waktu: '07:00 - 07:40' },
        { jam: 2, waktu: '07:40 - 08:20' },
        { jam: 3, waktu: '08:20 - 09:00' },
        { jam: 4, waktu: '09:00 - 09:40' },
        { jam: 'Break (R)', waktu: '09:40 - 10:00' },
        { jam: 5, waktu: '10:00 - 10:40' },
        { jam: 6, waktu: '10:40 - 11:20' },
        { jam: 7, waktu: '11:20 - 12:00' },
        { jam: 8, waktu: '12:00 - 12:30' },
        { jam: 'FAMILY TIME', waktu: '12:30 - 12:45' },
        { jam: 'JAMAAH DUHUR', waktu: '12:45 - 13:05' }
      ];

      slots.forEach(s => {
        const row = [s.jam, s.waktu];
        days.forEach(() => row.push(''));
        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
      XLSX.writeFile(wb, `Template_aSc_Timetables_${target === 'mengajar' ? 'Guru' : 'Kelas'}.xlsx`);
      this.showToast('📁 Template Excel aSc Timetables berhasil diunduh!', 'success');
    },

    getPresetJadwalMengajarTito() {
      return [
        // SENIN
        { hari: 'Senin', jamKe: 1, tipeTugas: 'Mengajar', kelas: 'X5 COC2', mapel: 'PISA', lantai: '' },
        { hari: 'Senin', jamKe: 2, tipeTugas: 'Mengajar', kelas: 'X5 COC2', mapel: 'PISA', lantai: '' },
        { hari: 'Senin', jamKe: 5, tipeTugas: 'Mengajar', kelas: 'XII Cp', mapel: 'Chemistry', lantai: '' },
        { hari: 'Senin', jamKe: 6, tipeTugas: 'Mengajar', kelas: 'XII Cp', mapel: 'Chemistry', lantai: '' },
        { hari: 'Senin', jamKe: 7, tipeTugas: 'Mengajar', kelas: 'XII Cp', mapel: 'Chemistry', lantai: '' },
        // SELASA
        { hari: 'Selasa', jamKe: 1, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'XII IUPP CHINA / XI IUPP CHINA' },
        { hari: 'Selasa', jamKe: 2, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'XII IUPP CHINA / XI IUPP CHINA' },
        { hari: 'Selasa', jamKe: 3, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Piket C9' },
        { hari: 'Selasa', jamKe: 4, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Piket C9' },
        { hari: 'Selasa', jamKe: 5, tipeTugas: 'Mengajar', kelas: 'XII ICP 2F', mapel: 'Chemistry', lantai: '' },
        { hari: 'Selasa', jamKe: 6, tipeTugas: 'Mengajar', kelas: 'XII ICP 2F', mapel: 'Chemistry', lantai: '' },
        { hari: 'Selasa', jamKe: 7, tipeTugas: 'Mengajar', kelas: 'X3 ATLET', mapel: 'Chemistry', lantai: '' },
        { hari: 'Selasa', jamKe: 8, tipeTugas: 'Mengajar', kelas: 'X3 ATLET', mapel: 'Chemistry', lantai: '' },
        // RABU
        { hari: 'Rabu', jamKe: 1, tipeTugas: 'Mengajar', kelas: 'X15 IUPP COC 1', mapel: 'OSN/OPSI', lantai: '' },
        { hari: 'Rabu', jamKe: 2, tipeTugas: 'Mengajar', kelas: 'X15 IUPP COC 1', mapel: 'OSN/OPSI', lantai: '' },
        { hari: 'Rabu', jamKe: 3, tipeTugas: 'Mengajar', kelas: 'E2s / M7 / B1', mapel: 'OSN/OPSI', lantai: '' },
        { hari: 'Rabu', jamKe: 4, tipeTugas: 'Mengajar', kelas: 'G5s / P5s / B2', mapel: 'OSN/OPSI', lantai: '' },
        { hari: 'Rabu', jamKe: 5, tipeTugas: 'Mengajar', kelas: 'XII ICP 2F', mapel: 'Chemistry', lantai: '' },
        { hari: 'Rabu', jamKe: 6, tipeTugas: 'Mengajar', kelas: 'XII ICP 2F', mapel: 'Chemistry', lantai: '' },
        // KAMIS
        { hari: 'Kamis', jamKe: 1, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 4M' },
        { hari: 'Kamis', jamKe: 2, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 4M' },
        { hari: 'Kamis', jamKe: 3, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 1W' },
        { hari: 'Kamis', jamKe: 4, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 1W' },
        { hari: 'Kamis', jamKe: 8, tipeTugas: 'Mengajar', kelas: 'X3 ATLET', mapel: 'Chemistry', lantai: '' },
        // JUMAT
        { hari: 'Jumat', jamKe: 1, tipeTugas: 'Mengajar', kelas: 'XII Cp', mapel: 'Chemistry', lantai: '' },
        { hari: 'Jumat', jamKe: 2, tipeTugas: 'Mengajar', kelas: 'XII Cp', mapel: 'Chemistry', lantai: '' },
        { hari: 'Jumat', jamKe: 3, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 2M' },
        { hari: 'Jumat', jamKe: 4, tipeTugas: 'Piket Lantai', kelas: '', mapel: 'Picket', lantai: 'Koridor 2M' }
      ];
    },

    getPresetJadwalKelasX3() {
      return [
        // SENIN
        { hari: 'Senin', jamKe: 1, mapel: 'PISA', guru: 'P2' },
        { hari: 'Senin', jamKe: 2, mapel: 'PISA', guru: 'P2' },
        { hari: 'Senin', jamKe: 3, mapel: 'Ins', guru: 'IN / BK7' },
        { hari: 'Senin', jamKe: 4, mapel: 'Ins', guru: 'IN / BK7' },
        { hari: 'Senin', jamKe: 5, mapel: 'Physics', guru: 'P7' },
        { hari: 'Senin', jamKe: 6, mapel: 'Physics', guru: 'P7' },
        { hari: 'Senin', jamKe: 7, mapel: 'Economics', guru: 'E5s' },
        { hari: 'Senin', jamKe: 8, mapel: 'Economics', guru: 'E5s' },
        // SELASA
        { hari: 'Selasa', jamKe: 1, mapel: 'Sociology', guru: 'S2' },
        { hari: 'Selasa', jamKe: 2, mapel: 'Sociology', guru: 'S2' },
        { hari: 'Selasa', jamKe: 3, mapel: 'Biology', guru: 'B4s' },
        { hari: 'Selasa', jamKe: 4, mapel: 'Biology', guru: 'B4s' },
        { hari: 'Selasa', jamKe: 5, mapel: 'Geography', guru: 'G3s' },
        { hari: 'Selasa', jamKe: 6, mapel: 'Geography', guru: 'G3s' },
        { hari: 'Selasa', jamKe: 7, mapel: 'Chemistry', guru: 'Tito Vanzal S.Pd. (C9)' },
        { hari: 'Selasa', jamKe: 8, mapel: 'Chemistry', guru: 'Tito Vanzal S.Pd. (C9)' },
        // RABU
        { hari: 'Rabu', jamKe: 1, mapel: 'General Maths', guru: 'M8' },
        { hari: 'Rabu', jamKe: 2, mapel: 'General Maths', guru: 'M8' },
        { hari: 'Rabu', jamKe: 3, mapel: 'General Maths', guru: 'M8' },
        { hari: 'Rabu', jamKe: 4, mapel: 'English Reguler', guru: 'EN1s' },
        { hari: 'Rabu', jamKe: 5, mapel: 'Fine Arts', guru: 'A1s' },
        { hari: 'Rabu', jamKe: 6, mapel: 'Fine Arts', guru: 'A1s' },
        { hari: 'Rabu', jamKe: 7, mapel: 'Nihongo', guru: 'N4' },
        { hari: 'Rabu', jamKe: 8, mapel: 'Nihongo', guru: 'N4' },
        // KAMIS
        { hari: 'Kamis', jamKe: 1, mapel: 'English Reguler', guru: 'EN1s' },
        { hari: 'Kamis', jamKe: 2, mapel: 'English Reguler', guru: 'EN1s' },
        { hari: 'Kamis', jamKe: 3, mapel: 'Informatics/CAI', guru: 'IC1s' },
        { hari: 'Kamis', jamKe: 4, mapel: 'Informatics/CAI', guru: 'IC1s' },
        { hari: 'Kamis', jamKe: 5, mapel: 'Bahasa Indonesia', guru: 'BI4' },
        { hari: 'Kamis', jamKe: 6, mapel: 'Bahasa Indonesia', guru: 'BI4' },
        { hari: 'Kamis', jamKe: 7, mapel: 'Bahasa Indonesia', guru: 'BI4' },
        { hari: 'Kamis', jamKe: 8, mapel: 'Chemistry', guru: 'Tito Vanzal S.Pd. (C9)' },
        // JUMAT
        { hari: 'Jumat', jamKe: 1, mapel: 'Sports', guru: 'SP5s' },
        { hari: 'Jumat', jamKe: 2, mapel: 'Sports (Athlete)', guru: 'SP5s' },
        { hari: 'Jumat', jamKe: 3, mapel: 'Pancasila TWK', guru: 'WK1s' },
        { hari: 'Jumat', jamKe: 4, mapel: 'Pancasila TWK', guru: 'WK1s' },
        // SABTU
        { hari: 'Sabtu', jamKe: 1, mapel: 'History', guru: 'H3s' },
        { hari: 'Sabtu', jamKe: 2, mapel: 'History', guru: 'H3s' },
        { hari: 'Sabtu', jamKe: 3, mapel: 'SEP', guru: 'Tim SEP' },
        { hari: 'Sabtu', jamKe: 4, mapel: 'SEP', guru: 'Tim SEP' }
      ];
    },

    // =========================================================================
    // 4B. RANDOM STUDENT PICKER (SPIN & PICK IN CLASSROOM)
    // =========================================================================
    openPickerModal() {
      this.modalPickerOpen = true;
      if (this.nilaiFilter && this.nilaiFilter.kelas && this.nilaiFilter.kelas !== 'Semua') {
        this.pickerFilter.kelas = this.nilaiFilter.kelas;
      } else if (this.waliKelasFilter && this.waliKelasFilter.kelas) {
        this.pickerFilter.kelas = this.waliKelasFilter.kelas;
      } else {
        this.pickerFilter.kelas = 'Semua';
      }
      this.stopPickerTimer();
      this.$nextTick(() => {
        this.initLucideIcons();
      });
    },

    getPickerPool() {
      return this.siswa.filter(s => {
        const matchKelas = this.pickerFilter.kelas === 'Semua' || this.isSameClass(s.kelas, this.pickerFilter.kelas);
        const matchPeminatan = this.pickerFilter.peminatan === 'Semua' || (s.peminatan || 'Prima').toUpperCase() === this.pickerFilter.peminatan.toUpperCase();
        const matchGender = this.pickerFilter.gender === 'Semua' || s.gender === this.pickerFilter.gender;
        const matchRepeat = !this.pickerFilter.noRepeat || !this.pickedHistory.includes(s.id);
        return matchKelas && matchPeminatan && matchGender && matchRepeat;
      });
    },

    getTotalPickerPoolCount() {
      return this.siswa.filter(s => {
        const matchKelas = this.pickerFilter.kelas === 'Semua' || this.isSameClass(s.kelas, this.pickerFilter.kelas);
        const matchPeminatan = this.pickerFilter.peminatan === 'Semua' || (s.peminatan || 'Prima').toUpperCase() === this.pickerFilter.peminatan.toUpperCase();
        const matchGender = this.pickerFilter.gender === 'Semua' || s.gender === this.pickerFilter.gender;
        return matchKelas && matchPeminatan && matchGender;
      }).length;
    },

    startSpinPicker() {
      const pool = this.getPickerPool();
      if (pool.length === 0) {
        this.showToast('Semua siswa yang memenuhi filter sudah terpilih! Silakan reset riwayat.', 'error');
        this.playAudioTone('timeup');
        return;
      }

      this.isPicking = true;
      this.pickerResult = null;
      this.stopPickerTimer();

      const allEligible = pool;
      let counter = 0;
      const totalSteps = 26 + Math.floor(Math.random() * 8);
      let currentDelay = 40;

      const step = () => {
        counter++;
        const randomIndex = Math.floor(Math.random() * allEligible.length);
        this.pickerCandidate = allEligible[randomIndex];

        if (this.pickerFilter.sound) {
          this.playAudioTone('tick');
        }

        if (counter < totalSteps) {
          if (counter > totalSteps - 10) {
            currentDelay += 35;
          } else if (counter > totalSteps - 18) {
            currentDelay += 14;
          } else {
            currentDelay += 2;
          }
          setTimeout(step, currentDelay);
        } else {
          // Final Winner Selection
          const winnerIndex = Math.floor(Math.random() * allEligible.length);
          const winner = allEligible[winnerIndex];
          this.pickerCandidate = winner;
          this.pickerResult = winner;
          this.isPicking = false;

          if (this.pickerFilter.noRepeat && !this.pickedHistory.includes(winner.id)) {
            this.pickedHistory.push(winner.id);
          }

          if (this.pickerFilter.sound) {
            this.playAudioTone('win');
          }

          this.triggerConfetti();

          this.$nextTick(() => {
            this.initLucideIcons();
          });
        }
      };

      setTimeout(step, currentDelay);
    },

    resetPickerHistory() {
      this.pickedHistory = [];
      this.pickerResult = null;
      this.pickerCandidate = null;
      this.stopPickerTimer();
      this.showToast('Daftar riwayat siswa terpilih telah direset!', 'info');
    },

    awardStarToPicked() {
      if (!this.pickerResult) return;
      this.quickAddBintang(this.pickerResult, 1);
      if (this.pickerFilter.sound) {
        this.playAudioTone('star');
      }
      this.triggerConfetti();
    },

    startPickerTimer(seconds = 30) {
      this.stopPickerTimer();
      this.pickerTimerDuration = seconds;
      this.pickerTimerRemaining = seconds;
      this.pickerTimerRunning = true;

      this.pickerTimerInterval = setInterval(() => {
        if (this.pickerTimerRemaining > 0) {
          this.pickerTimerRemaining--;
          if (this.pickerTimerRemaining <= 5 && this.pickerTimerRemaining > 0 && this.pickerFilter.sound) {
            this.playAudioTone('tick');
          }
          if (this.pickerTimerRemaining === 0) {
            this.stopPickerTimer();
            if (this.pickerFilter.sound) {
              this.playAudioTone('timeup');
            }
            this.showToast('Waktu menjawab habis!', 'info');
          }
        } else {
          this.stopPickerTimer();
        }
      }, 1000);
    },

    stopPickerTimer() {
      if (this.pickerTimerInterval) {
        clearInterval(this.pickerTimerInterval);
        this.pickerTimerInterval = null;
      }
      this.pickerTimerRunning = false;
    },

    playAudioTone(type) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === 'tick') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.035);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
        } else if (type === 'win') {
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.6);
          });
        } else if (type === 'star') {
          [587.33, 880, 1174.66].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.22, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.45);
          });
        } else if (type === 'timeup') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(140, now + 0.35);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
        }
      } catch (e) {}
    },

    triggerConfetti() {
      try {
        const canvas = document.getElementById('pickerConfettiCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || window.innerWidth;
        canvas.height = canvas.offsetHeight || window.innerHeight;

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#e11d48'];
        const particles = [];
        for (let i = 0; i < 65; i++) {
          particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 40,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.75) * 15,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1,
            gravity: 0.32
          });
        }

        const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let active = false;

          particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.014;

            if (p.opacity > 0) {
              active = true;
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation * Math.PI) / 180);
              ctx.fillStyle = p.color;
              ctx.globalAlpha = Math.max(0, p.opacity);
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
              ctx.restore();
            }
          });

          if (active) {
            requestAnimationFrame(render);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };

        render();
      } catch (e) {}
    },

    // =========================================================================
    // 4C. KALKULATOR CEPAT KIMIA (CHEMISTRY QUICK SOLVERS)
    // =========================================================================
    PERIODIC_TABLE: {
      'H': { name: 'Hidrogen', ar: 1.008 },
      'He': { name: 'Helium', ar: 4.003 },
      'Li': { name: 'Litium', ar: 6.941 },
      'Be': { name: 'Berilium', ar: 9.012 },
      'B': { name: 'Boron', ar: 10.811 },
      'C': { name: 'Karbon', ar: 12.011 },
      'N': { name: 'Nitrogen', ar: 14.007 },
      'O': { name: 'Oksigen', ar: 15.999 },
      'F': { name: 'Fluorin', ar: 18.998 },
      'Ne': { name: 'Neon', ar: 20.180 },
      'Na': { name: 'Natrium', ar: 22.990 },
      'Mg': { name: 'Magnesium', ar: 24.305 },
      'Al': { name: 'Aluminium', ar: 26.982 },
      'Si': { name: 'Silikon', ar: 28.085 },
      'P': { name: 'Fosfor', ar: 30.974 },
      'S': { name: 'Belerang (Sulfur)', ar: 32.06 },
      'Cl': { name: 'Klorin', ar: 35.45 },
      'Ar': { name: 'Argon', ar: 39.948 },
      'K': { name: 'Kalium', ar: 39.098 },
      'Ca': { name: 'Kalsium', ar: 40.078 },
      'Sc': { name: 'Skandium', ar: 44.956 },
      'Ti': { name: 'Titanium', ar: 47.867 },
      'V': { name: 'Vanadium', ar: 50.942 },
      'Cr': { name: 'Kromium', ar: 51.996 },
      'Mn': { name: 'Mangan', ar: 54.938 },
      'Fe': { name: 'Besi (Ferrum)', ar: 55.845 },
      'Co': { name: 'Kobalt', ar: 58.933 },
      'Ni': { name: 'Nikel', ar: 58.693 },
      'Cu': { name: 'Tembaga (Cuprum)', ar: 63.546 },
      'Zn': { name: 'Seng (Zinc)', ar: 65.38 },
      'Ga': { name: 'Galium', ar: 69.723 },
      'Ge': { name: 'Germanium', ar: 72.630 },
      'As': { name: 'Arsen', ar: 74.922 },
      'Se': { name: 'Selenium', ar: 78.971 },
      'Br': { name: 'Bromin', ar: 79.904 },
      'Kr': { name: 'Kripton', ar: 83.798 },
      'Rb': { name: 'Rubidium', ar: 85.468 },
      'Sr': { name: 'Stronsium', ar: 87.62 },
      'Y': { name: 'Itrium', ar: 88.906 },
      'Zr': { name: 'Zirkonium', ar: 91.224 },
      'Nb': { name: 'Niobium', ar: 92.906 },
      'Mo': { name: 'Molibdenum', ar: 95.95 },
      'Tc': { name: 'Teknesium', ar: 98.0 },
      'Ru': { name: 'Rutenium', ar: 101.07 },
      'Rh': { name: 'Rodium', ar: 102.91 },
      'Pd': { name: 'Paladium', ar: 106.42 },
      'Ag': { name: 'Perak (Argentum)', ar: 107.87 },
      'Cd': { name: 'Kadmium', ar: 112.41 },
      'In': { name: 'Indium', ar: 114.82 },
      'Sn': { name: 'Timah (Stannum)', ar: 118.71 },
      'Sb': { name: 'Antimon', ar: 121.76 },
      'Te': { name: 'Telurium', ar: 127.60 },
      'I': { name: 'Iodin', ar: 126.90 },
      'Xe': { name: 'Xenon', ar: 131.29 },
      'Cs': { name: 'Sesium', ar: 132.91 },
      'Ba': { name: 'Barium', ar: 137.33 },
      'La': { name: 'Lantanum', ar: 138.91 },
      'Ce': { name: 'Serium', ar: 140.12 },
      'Pr': { name: 'Praseodimium', ar: 140.91 },
      'Nd': { name: 'Neodimium', ar: 144.24 },
      'Sm': { name: 'Samarium', ar: 150.36 },
      'Eu': { name: 'Europium', ar: 151.96 },
      'Gd': { name: 'Gadolinium', ar: 157.25 },
      'Tb': { name: 'Terbium', ar: 158.93 },
      'Dy': { name: 'Disprosium', ar: 162.50 },
      'Ho': { name: 'Holmium', ar: 164.93 },
      'Er': { name: 'Erbium', ar: 167.26 },
      'Tm': { name: 'Tulium', ar: 168.93 },
      'Yb': { name: 'Iterbium', ar: 173.05 },
      'Lu': { name: 'Lutesium', ar: 174.97 },
      'Hf': { name: 'Hafnium', ar: 178.49 },
      'Ta': { name: 'Tantalum', ar: 180.95 },
      'W': { name: 'Tungsten (Wolfram)', ar: 183.84 },
      'Re': { name: 'Renium', ar: 186.21 },
      'Os': { name: 'Osmium', ar: 190.23 },
      'Ir': { name: 'Iridium', ar: 192.22 },
      'Pt': { name: 'Platina', ar: 195.08 },
      'Au': { name: 'Emas (Aurum)', ar: 196.97 },
      'Hg': { name: 'Raksa (Hydrargyrum)', ar: 200.59 },
      'Tl': { name: 'Talium', ar: 204.38 },
      'Pb': { name: 'Timbal (Plumbum)', ar: 207.2 },
      'Bi': { name: 'Bismut', ar: 208.98 },
      'Po': { name: 'Polonium', ar: 209.0 },
      'At': { name: 'Astatin', ar: 210.0 },
      'Rn': { name: 'Radon', ar: 222.0 },
      'Fr': { name: 'Fransium', ar: 223.0 },
      'Ra': { name: 'Radium', ar: 226.0 },
      'Ac': { name: 'Aktinium', ar: 227.0 },
      'Th': { name: 'Torium', ar: 232.04 },
      'Pa': { name: 'Protaktinium', ar: 231.04 },
      'U': { name: 'Uranium', ar: 238.03 }
    },

    parseChemicalFormula(str) {
      if (!str || !str.trim()) return null;
      let clean = str.trim().replace(/\s+/g, '').replace(/•|·|\*/g, '.');
      
      const parts = clean.split('.');
      const mainPart = parts[0];
      const hydratePart = parts.length > 1 ? parts.slice(1).join('.') : null;
      
      const elementCounts = {};

      const parseSubFormula = (formula, outerMultiplier = 1) => {
        const stack = [{}];
        let i = 0;
        while (i < formula.length) {
          const char = formula[i];
          if (char === '(' || char === '[') {
            stack.push({});
            i++;
          } else if (char === ')' || char === ']') {
            i++;
            let multiplier = '';
            while (i < formula.length && /\d/.test(formula[i])) {
              multiplier += formula[i];
              i++;
            }
            const mult = multiplier ? parseInt(multiplier, 10) : 1;
            const top = stack.pop();
            const target = stack[stack.length - 1];
            for (const elem in top) {
              target[elem] = (target[elem] || 0) + top[elem] * mult;
            }
          } else if (/[A-Z]/.test(char)) {
            let elem = char;
            i++;
            if (i < formula.length && /[a-z]/.test(formula[i])) {
              elem += formula[i];
              i++;
            }
            let countStr = '';
            while (i < formula.length && /\d/.test(formula[i])) {
              countStr += formula[i];
              i++;
            }
            const count = countStr ? parseInt(countStr, 10) : 1;
            const target = stack[stack.length - 1];
            target[elem] = (target[elem] || 0) + count;
          } else {
            i++;
          }
        }
        const topResult = stack.pop() || {};
        for (const elem in topResult) {
          elementCounts[elem] = (elementCounts[elem] || 0) + topResult[elem] * outerMultiplier;
        }
      };

      try {
        parseSubFormula(mainPart, 1);

        if (hydratePart) {
          let hydrateMult = 1;
          let hydrateFormula = hydratePart;
          const match = hydratePart.match(/^(\d+)(.*)$/);
          if (match) {
            hydrateMult = parseInt(match[1], 10);
            hydrateFormula = match[2];
          }
          parseSubFormula(hydrateFormula, hydrateMult);
        }

        let totalMr = 0;
        const breakdown = [];
        for (const elem in elementCounts) {
          const count = elementCounts[elem];
          const data = this.PERIODIC_TABLE[elem] || { name: elem, ar: 0 };
          const mass = count * data.ar;
          totalMr += mass;
          breakdown.push({
            symbol: elem,
            name: data.name,
            ar: data.ar,
            count: count,
            mass: parseFloat(mass.toFixed(3))
          });
        }

        if (totalMr === 0) return null;

        breakdown.forEach(b => {
          b.percent = parseFloat(((b.mass / totalMr) * 100).toFixed(2));
        });

        breakdown.sort((a, b) => b.mass - a.mass);

        return {
          formula: clean,
          totalMr: parseFloat(totalMr.toFixed(3)),
          totalMrRounded: Math.round(totalMr),
          breakdown: breakdown
        };
      } catch (e) {
        console.error("Formula parsing error:", e);
        return null;
      }
    },

    calcMrFormula() {
      const res = this.parseChemicalFormula(this.calcMr.formula);
      this.calcMr.result = res;
    },

    calculateKoligatif() {
      const { jenis, massaT, mrT, massaP, pelarut, p0, temp, vol, tipeElektrolit, ionN, alpha } = this.calcKoligatif;
      const mt = parseFloat(massaT) || 0;
      const mr = parseFloat(mrT) || 1;
      const mp = parseFloat(massaP) || 1;
      const v = parseFloat(vol) || 1;
      const tC = parseFloat(temp) || 25;
      const T = tC + 273.15;
      
      let i = 1;
      const n = parseInt(ionN, 10) || 2;
      const a = parseFloat(alpha) || 1.0;
      if (tipeElektrolit === 'kuat') {
        i = n;
      } else if (tipeElektrolit === 'lemah') {
        i = 1 + (n - 1) * a;
      } else {
        i = 1;
      }

      const molT = mt / mr;
      const molalitas = (mt / mr) * (1000 / mp);
      const molaritas = (mt / mr) * (1000 / v);

      let Kb = 0.52;
      let Kf = 1.86;
      let pMurni = parseFloat(p0) || 23.76;
      let mrPelarut = 18;
      let tDidihMurni = 100;
      let tBekuMurni = 0;

      if (pelarut === 'Benzena') {
        Kb = 2.53; Kf = 5.12; mrPelarut = 78; tDidihMurni = 80.1; tBekuMurni = 5.5; pMurni = 95.1;
      } else if (pelarut === 'Asam Asetat') {
        Kb = 3.07; Kf = 3.90; mrPelarut = 60; tDidihMurni = 118.1; tBekuMurni = 16.6; pMurni = 15.6;
      }

      let delta = 0;
      let finalVal = 0;
      let satuan = '';
      let steps = [];

      if (jenis === 'didih') {
        delta = molalitas * Kb * i;
        finalVal = tDidihMurni + delta;
        satuan = '°C';
        steps = [
          `1. Hitung Mol Zat Terlarut: n = massa / Mr = ${mt} g / ${mr} = ${molT.toFixed(4)} mol`,
          `2. Hitung Molalitas (m): m = (massa_t / Mr) × (1000 / P) = (${mt} / ${mr}) × (1000 / ${mp}) = ${molalitas.toFixed(4)} m`,
          `3. Faktor van 't Hoff (i): i = ${i}`,
          `4. Kenaikan Titik Didih: ΔTb = m × Kb × i = ${molalitas.toFixed(4)} × ${Kb} × ${i} = ${delta.toFixed(4)} °C`,
          `5. Titik Didih Larutan: Tb = Tb° + ΔTb = ${tDidihMurni} + ${delta.toFixed(4)} = ${finalVal.toFixed(4)} °C`
        ];
      } else if (jenis === 'beku') {
        delta = molalitas * Kf * i;
        finalVal = tBekuMurni - delta;
        satuan = '°C';
        steps = [
          `1. Hitung Mol Zat Terlarut: n = massa / Mr = ${mt} g / ${mr} = ${molT.toFixed(4)} mol`,
          `2. Hitung Molalitas (m): m = (massa_t / Mr) × (1000 / P) = (${mt} / ${mr}) × (1000 / ${mp}) = ${molalitas.toFixed(4)} m`,
          `3. Faktor van 't Hoff (i): i = ${i}`,
          `4. Penurunan Titik Beku: ΔTf = m × Kf × i = ${molalitas.toFixed(4)} × ${Kf} × ${i} = ${delta.toFixed(4)} °C`,
          `5. Titik Beku Larutan: Tf = Tf° - ΔTf = ${tBekuMurni} - ${delta.toFixed(4)} = ${finalVal.toFixed(4)} °C`
        ];
      } else if (jenis === 'uap') {
        const molP = mp / mrPelarut;
        const totalMolPartikel = (molT * i) + molP;
        const Xt = totalMolPartikel > 0 ? (molT * i) / totalMolPartikel : 0;
        delta = pMurni * Xt;
        finalVal = pMurni - delta;
        satuan = 'mmHg';
        steps = [
          `1. Mol Terlarut Efektif: nt × i = (${mt} / ${mr}) × ${i} = ${(molT * i).toFixed(4)} mol`,
          `2. Mol Pelarut: np = massa_p / Mr_p = ${mp} / ${mrPelarut} = ${molP.toFixed(4)} mol`,
          `3. Fraksi Mol Terlarut: Xt = (nt × i) / ((nt × i) + np) = ${(molT * i).toFixed(4)} / ${totalMolPartikel.toFixed(4)} = ${Xt.toFixed(4)}`,
          `4. Penurunan Tekanan Uap: ΔP = P° × Xt = ${pMurni} × ${Xt.toFixed(4)} = ${delta.toFixed(4)} mmHg`,
          `5. Tekanan Uap Larutan: P = P° - ΔP = ${pMurni} - ${delta.toFixed(4)} = ${finalVal.toFixed(4)} mmHg`
        ];
      } else if (jenis === 'osmotik') {
        const R = 0.082;
        delta = molaritas * R * T * i;
        finalVal = delta;
        satuan = 'atm';
        steps = [
          `1. Hitung Molaritas (M): M = (massa_t / Mr) × (1000 / V_mL) = (${mt} / ${mr}) × (1000 / ${v}) = ${molaritas.toFixed(4)} M`,
          `2. Suhu Mutlak: T = ${tC}°C + 273.15 = ${T.toFixed(2)} K`,
          `3. Faktor van 't Hoff (i): i = ${i}`,
          `4. Tekanan Osmotik: π = M × R × T × i = ${molaritas.toFixed(4)} × 0.082 × ${T.toFixed(2)} × ${i} = ${finalVal.toFixed(4)} atm`
        ];
      }

      this.calcKoligatif.result = {
        jenis,
        delta: parseFloat(delta.toFixed(4)),
        finalVal: parseFloat(finalVal.toFixed(4)),
        satuan,
        molalitas: parseFloat(molalitas.toFixed(4)),
        molaritas: parseFloat(molaritas.toFixed(4)),
        iVal: i,
        steps
      };
    },

    calculateStoikiometri() {
      const { mode, m1, v1, m2, v2, targetSolve, massa, mr, mol, persen, massaJenis } = this.calcStoikiometri;
      let result = { mode, steps: [] };

      if (mode === 'pengenceran') {
        const numM1 = parseFloat(m1) || 0;
        const numV1 = parseFloat(v1) || 0;
        const numM2 = parseFloat(m2) || 0;
        const numV2 = parseFloat(v2) || 0;

        if (targetSolve === 'v2' && numM1 && numV1 && numM2) {
          const calcV2 = (numM1 * numV1) / numM2;
          const vAir = calcV2 - numV1;
          result.mainVal = parseFloat(calcV2.toFixed(2));
          result.satuan = 'mL';
          result.extra = `Tambahkan Air: ${parseFloat(vAir.toFixed(2))} mL`;
          result.steps = [
            `Rumus: M1 × V1 = M2 × V2`,
            `V2 = (M1 × V1) / M2 = (${numM1} × ${numV1}) / ${numM2} = ${result.mainVal} mL`,
            `Volume Air yang perlu ditambahkan = V2 - V1 = ${result.mainVal} - ${numV1} = ${parseFloat(vAir.toFixed(2))} mL`
          ];
        } else if (targetSolve === 'm2' && numM1 && numV1 && numV2) {
          const calcM2 = (numM1 * numV1) / numV2;
          result.mainVal = parseFloat(calcM2.toFixed(4));
          result.satuan = 'M';
          result.steps = [
            `Rumus: M1 × V1 = M2 × V2`,
            `M2 = (M1 × V1) / V2 = (${numM1} × ${numV1}) / ${numV2} = ${result.mainVal} M`
          ];
        } else if (targetSolve === 'v1' && numM2 && numV2 && numM1) {
          const calcV1 = (numM2 * numV2) / numM1;
          result.mainVal = parseFloat(calcV1.toFixed(2));
          result.satuan = 'mL';
          result.steps = [
            `Rumus: M1 × V1 = M2 × V2`,
            `V1 = (M2 × V2) / M1 = (${numM2} × ${numV2}) / ${numM1} = ${result.mainVal} mL`
          ];
        } else if (targetSolve === 'm1' && numM2 && numV2 && numV1) {
          const calcM1 = (numM2 * numV2) / numV1;
          result.mainVal = parseFloat(calcM1.toFixed(4));
          result.satuan = 'M';
          result.steps = [
            `Rumus: M1 × V1 = M2 × V2`,
            `M1 = (M2 × V2) / V1 = (${numM2} × ${numV2}) / ${numV1} = ${result.mainVal} M`
          ];
        }
      } else if (mode === 'pencampuran') {
        const numM1 = parseFloat(m1) || 0;
        const numV1 = parseFloat(v1) || 0;
        const numM2 = parseFloat(m2) || 0;
        const numV2 = parseFloat(v2) || 0;
        const totalMol = (numM1 * numV1) + (numM2 * numV2);
        const totalV = numV1 + numV2;
        const mCampuran = totalV > 0 ? totalMol / totalV : 0;
        result.mainVal = parseFloat(mCampuran.toFixed(4));
        result.satuan = 'M';
        result.steps = [
          `Mol Larutan 1 = M1 × V1 = ${numM1} × ${numV1} = ${(numM1 * numV1).toFixed(2)} mmol`,
          `Mol Larutan 2 = M2 × V2 = ${numM2} × ${numV2} = ${(numM2 * numV2).toFixed(2)} mmol`,
          `Total Mol = ${totalMol.toFixed(2)} mmol`,
          `Volume Total = V1 + V2 = ${numV1} + ${numV2} = ${totalV} mL`,
          `M_campuran = Total Mol / Total Volume = ${totalMol.toFixed(2)} / ${totalV} = ${result.mainVal} M`
        ];
      } else if (mode === 'persen_molaritas') {
        const p = parseFloat(persen) || 0;
        const rho = parseFloat(massaJenis) || 1;
        const mMass = parseFloat(mr) || 1;
        const calcM = (p * rho * 10) / mMass;
        result.mainVal = parseFloat(calcM.toFixed(4));
        result.satuan = 'M';
        result.steps = [
          `Rumus Cepat: M = (% × ρ × 10) / Mr`,
          `M = (${p} × ${rho} × 10) / ${mMass} = ${result.mainVal} M`
        ];
      } else if (mode === 'mol_massa') {
        const mMass = parseFloat(mr) || 1;
        const numMassa = parseFloat(massa) || 0;
        const numMol = numMassa / mMass;
        const numPartikel = numMol * 6.022e23;
        const numVGasSTP = numMol * 22.4;
        const numVGasRTP = numMol * 24.0;
        result.mainVal = parseFloat(numMol.toFixed(4));
        result.satuan = 'mol';
        result.massa = numMassa;
        result.partikel = numPartikel.toExponential(3);
        result.volSTP = parseFloat(numVGasSTP.toFixed(3));
        result.volRTP = parseFloat(numVGasRTP.toFixed(3));
        result.steps = [
          `1. Mol: n = massa / Mr = ${numMassa} / ${mMass} = ${result.mainVal} mol`,
          `2. Jumlah Partikel (N): n × L = ${result.mainVal} × 6.022×10²³ = ${result.partikel} partikel`,
          `3. Volume Gas STP (0°C, 1 atm): n × 22.4 L = ${result.volSTP} Liter`,
          `4. Volume Gas RTP (25°C, 1 atm): n × 24.0 L = ${result.volRTP} Liter`
        ];
      }

      this.calcStoikiometri.result = result;
    },

    calculatePH() {
      const { tipe, konsentrasi, valensi, ka, kb, molAsam, molBasa, molGaram, volTotal, valensiGaram } = this.calcPH;
      const M = parseFloat(konsentrasi) || 0.01;
      const val = parseInt(valensi, 10) || 1;
      const valG = parseInt(valensiGaram, 10) || 1;
      const Ka = parseFloat(ka) || 1.8e-5;
      const Kb = parseFloat(kb) || 1.8e-5;
      const Kw = 1.0e-14;
      const nAsam = parseFloat(molAsam) || 0.05;
      const nBasa = parseFloat(molBasa) || 0.05;
      const nGaram = parseFloat(molGaram) || 0.05;
      const Vtot = parseFloat(volTotal) || 100;

      let hPlus = 0;
      let ohMin = 0;
      let ph = 7;
      let poh = 7;
      let steps = [];

      if (tipe === 'asam_kuat') {
        hPlus = val * M;
        ph = -Math.log10(hPlus);
        poh = 14 - ph;
        steps = [
          `[H⁺] = valensi × Ma = ${val} × ${M} = ${hPlus.toExponential(2)} M`,
          `pH = -log[H⁺] = -log(${hPlus.toExponential(2)}) = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'basa_kuat') {
        ohMin = val * M;
        poh = -Math.log10(ohMin);
        ph = 14 - poh;
        steps = [
          `[OH⁻] = valensi × Mb = ${val} × ${M} = ${ohMin.toExponential(2)} M`,
          `pOH = -log[OH⁻] = -log(${ohMin.toExponential(2)}) = ${poh.toFixed(2)}`,
          `pH = 14 - pOH = 14 - ${poh.toFixed(2)} = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'asam_lemah') {
        hPlus = Math.sqrt(Ka * M);
        ph = -Math.log10(hPlus);
        poh = 14 - ph;
        const alpha = Math.sqrt(Ka / M);
        steps = [
          `[H⁺] = √(Ka × Ma) = √(${Ka.toExponential(2)} × ${M}) = ${hPlus.toExponential(2)} M`,
          `Derajat Ionisasi (α) = √(Ka / Ma) = ${(alpha * 100).toFixed(2)}%`,
          `pH = -log[H⁺] = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'basa_lemah') {
        ohMin = Math.sqrt(Kb * M);
        poh = -Math.log10(ohMin);
        ph = 14 - poh;
        const alpha = Math.sqrt(Kb / M);
        steps = [
          `[OH⁻] = √(Kb × Mb) = √(${Kb.toExponential(2)} × ${M}) = ${ohMin.toExponential(2)} M`,
          `Derajat Ionisasi (α) = √(Kb / Mb) = ${(alpha * 100).toFixed(2)}%`,
          `pOH = -log[OH⁻] = ${poh.toFixed(2)}`,
          `pH = 14 - pOH = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'buffer_asam') {
        hPlus = Ka * (nAsam / (nGaram * valG));
        ph = -Math.log10(hPlus);
        poh = 14 - ph;
        steps = [
          `Komponen: Asam Lemah (${nAsam} mol) + Garam/Basa Konjugasi (${nGaram} mol × val ${valG})`,
          `[H⁺] = Ka × (mol Asam / (mol Garam × val)) = ${Ka.toExponential(2)} × (${nAsam} / ${(nGaram * valG)}) = ${hPlus.toExponential(2)} M`,
          `pH = -log[H⁺] = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'buffer_basa') {
        ohMin = Kb * (nBasa / (nGaram * valG));
        poh = -Math.log10(ohMin);
        ph = 14 - poh;
        steps = [
          `Komponen: Basa Lemah (${nBasa} mol) + Garam/Asam Konjugasi (${nGaram} mol × val ${valG})`,
          `[OH⁻] = Kb × (mol Basa / (mol Garam × val)) = ${Kb.toExponential(2)} × (${nBasa} / ${(nGaram * valG)}) = ${ohMin.toExponential(2)} M`,
          `pOH = -log[OH⁻] = ${poh.toFixed(2)}`,
          `pH = 14 - pOH = ${ph.toFixed(2)}`
        ];
      } else if (tipe === 'hidrolisis_asam') {
        const M_garam = (nGaram / Vtot) * 1000;
        hPlus = Math.sqrt((Kw / Kb) * M_garam * valG);
        ph = -Math.log10(hPlus);
        poh = 14 - ph;
        steps = [
          `Jenis Garam: Asam Kuat + Basa Lemah (Terhidrolisis Kation, Sifat Asam)`,
          `[Garam] = (${nGaram} mol / ${Vtot} mL) × 1000 = ${M_garam.toFixed(4)} M`,
          `[H⁺] = √((Kw / Kb) × [Garam] × val) = √((10⁻¹⁴ / ${Kb.toExponential(2)}) × ${M_garam.toFixed(4)} × ${valG}) = ${hPlus.toExponential(2)} M`,
          `pH = -log[H⁺] = ${ph.toFixed(2)} (pH < 7)`
        ];
      } else if (tipe === 'hidrolisis_basa') {
        const M_garam = (nGaram / Vtot) * 1000;
        ohMin = Math.sqrt((Kw / Ka) * M_garam * valG);
        poh = -Math.log10(ohMin);
        ph = 14 - poh;
        steps = [
          `Jenis Garam: Asam Lemah + Basa Kuat (Terhidrolisis Anion, Sifat Basa)`,
          `[Garam] = (${nGaram} mol / ${Vtot} mL) × 1000 = ${M_garam.toFixed(4)} M`,
          `[OH⁻] = √((Kw / Ka) × [Garam] × val) = √((10⁻¹⁴ / ${Ka.toExponential(2)}) × ${M_garam.toFixed(4)} × ${valG}) = ${ohMin.toExponential(2)} M`,
          `pOH = -log[OH⁻] = ${poh.toFixed(2)}`,
          `pH = 14 - pOH = ${ph.toFixed(2)} (pH > 7)`
        ];
      }

      let sifat = 'Netral';
      let trayekColor = '#10b981';
      if (ph < 3) { sifat = 'Sangat Asam'; trayekColor = '#ef4444'; }
      else if (ph < 6.8) { sifat = 'Asam'; trayekColor = '#f97316'; }
      else if (ph >= 6.8 && ph <= 7.2) { sifat = 'Netral'; trayekColor = '#10b981'; }
      else if (ph <= 11) { sifat = 'Basa'; trayekColor = '#3b82f6'; }
      else { sifat = 'Sangat Basa'; trayekColor = '#8b5cf6'; }

      this.calcPH.result = {
        tipe,
        ph: parseFloat(ph.toFixed(2)),
        poh: parseFloat(poh.toFixed(2)),
        hPlus: hPlus.toExponential(2),
        ohMin: ohMin.toExponential(2),
        sifat,
        trayekColor,
        steps
      };
    },

    // =========================================================================
    // 4D. PUSAT MODUL, LKPD & BANK VIDEO PRAKTIKUM
    // =========================================================================
    getDefaultMediaPembelajaran() {
      return [
        {
          id: 'MED-01',
          bab: 'Sifat Koligatif Larutan',
          tipe: 'Video Praktikum',
          judul: 'Praktikum Penurunan Titik Beku & Pembuatan Es Puter Kimia',
          deskripsi: 'Demonstrasi eksperimen efek penambahan garam dapur (NaCl) pada es batu untuk menurunkan titik beku adonan es puter.',
          url: 'https://www.youtube.com/watch?v=F3_lWbE5k3I',
          embedId: 'F3_lWbE5k3I'
        },
        {
          id: 'MED-02',
          bab: 'Sifat Koligatif Larutan',
          tipe: 'LKPD',
          judul: 'LKPD Penyelidikan Tekanan Osmotik pada Sel Tumbuhan (Kentang)',
          deskripsi: 'Lembar kerja siswa untuk mengamati proses osmosis dan plasmolisis sel kentang dalam berbagai konsentrasi larutan sukrosa.',
          url: 'https://docs.google.com/document/d/1example_lkpd_koligatif',
          embedId: ''
        },
        {
          id: 'MED-03',
          bab: 'Reaksi Redoks & Elektrokimia',
          tipe: 'Video Praktikum',
          judul: 'Praktikum Sel Volta dari Buah-buahan Asam (Jeruk Nipis & Kentang)',
          deskripsi: 'Uji beda potensial listrik (Voltase) menggunakan elektroda seng (Zn) dan tembaga (Cu) pada buah jeruk.',
          url: 'https://www.youtube.com/watch?v=kYJzC_rWp1A',
          embedId: 'kYJzC_rWp1A'
        },
        {
          id: 'MED-04',
          bab: 'Reaksi Redoks & Elektrokimia',
          tipe: 'Modul / PPT',
          judul: 'Slide Presentasi: Penyetaraan Redoks Metode PBO & Setengah Reaksi',
          deskripsi: 'Slide rangkuman komprehensif aturan penentuan biloks dan langkah praktis penyetaraan suasana asam dan basa.',
          url: 'https://docs.google.com/presentation/d/1example_ppt_redoks',
          embedId: ''
        },
        {
          id: 'MED-05',
          bab: 'Asam Basa & Titrasi',
          tipe: 'Video Praktikum',
          judul: 'Video Demonstrasi: Titrasi Asam Kuat (HCl) dengan Basa Kuat (NaOH)',
          deskripsi: 'Teknik buret yang presisi, pembacaan meniskus, dan penentuan titik akhir titrasi indikator PP berwarna merah muda seulas.',
          url: 'https://www.youtube.com/watch?v=rKNGvGf0oP0',
          embedId: 'rKNGvGf0oP0'
        },
        {
          id: 'MED-06',
          bab: 'Asam Basa & Titrasi',
          tipe: 'Panduan Lab',
          judul: 'SOP & Petunjuk Praktikum: Identifikasi Asam Basa Indikator Alami',
          deskripsi: 'Panduan keselamatan kerja lab (MSDS) dan prosedur pembuatan ekstrak kunyit, kol ungu, dan kembang sepatu.',
          url: 'https://docs.google.com/document/d/1example_sop_asam_basa',
          embedId: ''
        },
        {
          id: 'MED-07',
          bab: 'Larutan Penyangga & Hidrolisis',
          tipe: 'LKPD',
          judul: 'LKPD Eksperimen: Uji Daya Tahan pH Larutan Buffer vs Bukan Buffer',
          deskripsi: 'Lembar kerja pengukuran ketahanan pH saat ditambahkan sedikit asam kuat (HCl 0.1 M) dan basa kuat (NaOH 0.1 M).',
          url: 'https://docs.google.com/document/d/1example_lkpd_buffer',
          embedId: ''
        },
        {
          id: 'MED-08',
          bab: 'Termokimia',
          tipe: 'Video Praktikum',
          judul: 'Praktikum Penentuan Perubahan Entalpi Kalorimeter Sederhana',
          deskripsi: 'Pengukuran kalor reaksi netralisasi HCl + NaOH menggunakan kalorimeter cangkir styrofoam.',
          url: 'https://www.youtube.com/watch?v=JuWtBRwvJ5Q',
          embedId: 'JuWtBRwvJ5Q'
        },
        {
          id: 'MED-09',
          bab: 'Sistem Koloid',
          tipe: 'Video Praktikum',
          judul: 'Eksperimen Efek Tyndall & Pembuatan Koloid (Agar-agar & Emulsi)',
          deskripsi: 'Visualisasi hamburan berkas cahaya laser pada larutan sejati vs koloid vs suspensi serta cara pembuatan koloid.',
          url: 'https://www.youtube.com/watch?v=q9X1U7Y8n6U',
          embedId: 'q9X1U7Y8n6U'
        },
        {
          id: 'MED-10',
          bab: 'Laju Reaksi',
          tipe: 'LKPD',
          judul: 'LKPD Pengaruh Konsentrasi & Suhu terhadap Laju Reaksi Na2S2O3 + HCl',
          deskripsi: 'Lembar investigasi waktu hilangnya tanda silang (X) pada kertas di bawah labu Erlenmeyer.',
          url: 'https://docs.google.com/document/d/1example_lkpd_laju_reaksi',
          embedId: ''
        }
      ];
    },

    extractYouTubeId(url) {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = String(url).match(regExp);
      return (match && match[2].length === 11) ? match[2] : '';
    },

    openMediaModal(existing) {
      if (existing) {
        this.formMedia = {
          id: existing.id,
          bab: existing.bab || 'Sifat Koligatif Larutan',
          tipe: existing.tipe || 'Video Praktikum',
          judul: existing.judul || '',
          deskripsi: existing.deskripsi || '',
          url: existing.url || '',
          isEdit: true
        };
      } else {
        this.formMedia = {
          id: '',
          bab: this.mediaBabFilter !== 'Semua Bab' ? this.mediaBabFilter : 'Sifat Koligatif Larutan',
          tipe: this.mediaTipeFilter !== 'Semua Tipe' ? this.mediaTipeFilter : 'Video Praktikum',
          judul: '',
          deskripsi: '',
          url: '',
          isEdit: false
        };
      }
      this.modalMediaEditOpen = true;
    },

    saveMedia() {
      const { id, bab, tipe, judul, deskripsi, url, isEdit } = this.formMedia;
      if (!judul.trim()) {
        this.showToast('Judul materi / video wajib diisi', 'error');
        return;
      }
      const embedId = this.extractYouTubeId(url);
      if (isEdit && id) {
        const idx = this.mediaPembelajaran.findIndex(m => m.id === id);
        if (idx >= 0) {
          this.mediaPembelajaran[idx] = {
            ...this.mediaPembelajaran[idx],
            bab,
            tipe,
            judul: judul.trim(),
            deskripsi: deskripsi.trim(),
            url: url.trim(),
            embedId
          };
        }
      } else {
        this.mediaPembelajaran.unshift({
          id: 'MED-' + new Date().getTime(),
          bab,
          tipe,
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          url: url.trim(),
          embedId
        });
      }
      this.modalMediaEditOpen = false;
      this.saveLocalData();
      this.syncToGoogleDrive('saveMediaPembelajaran', this.mediaPembelajaran);
      this.showToast('Media pembelajaran berhasil disimpan!', 'success');
    },

    deleteMedia(id) {
      if (confirm('Apakah Anda yakin ingin menghapus materi/video ini?')) {
        this.mediaPembelajaran = this.mediaPembelajaran.filter(m => m.id !== id);
        this.saveLocalData();
        this.syncToGoogleDrive('saveMediaPembelajaran', this.mediaPembelajaran);
        this.showToast('Media pembelajaran telah dihapus', 'info');
      }
    },

    openProyektor(media) {
      this.activeProyektorMedia = media;
      this.modalProyektorOpen = true;
    },

    closeProyektor() {
      this.modalProyektorOpen = false;
      this.activeProyektorMedia = null;
    },

    getFilteredMediaList() {
      return this.mediaPembelajaran.filter(m => {
        const matchBab = this.mediaBabFilter === 'Semua Bab' || m.bab === this.mediaBabFilter;
        const matchTipe = this.mediaTipeFilter === 'Semua Tipe' || m.tipe === this.mediaTipeFilter;
        const q = (this.mediaSearchQuery || '').trim().toLowerCase();
        const matchQuery = !q || (m.judul && m.judul.toLowerCase().includes(q)) || (m.deskripsi && m.deskripsi.toLowerCase().includes(q)) || (m.bab && m.bab.toLowerCase().includes(q));
        return matchBab && matchTipe && matchQuery;
      });
    },

    getMediaCountByBab(bab) {
      if (bab === 'Semua Bab') return this.mediaPembelajaran.length;
      return this.mediaPembelajaran.filter(m => m.bab === bab).length;
    },

    // =========================================================================
    // 5. KELOMPOK BELAJAR & PROYEK KIMIA (HETEROGENEOUS GROUP ENGINE & GRADING)
    // =========================================================================
    getFilteredKelompokProyek() {
      const kelas = (this.groupFilter.kelas || 'Semua').trim().toLowerCase();
      const status = (this.groupFilter.status || 'Semua').trim().toLowerCase();
      const search = (this.groupFilter.search || '').toLowerCase().trim();

      return (this.kelompokProyek || []).filter(p => {
        if (!p) return false;
        const pKelas = (p.kelas || '').trim().toLowerCase();
        const pStatus = (p.status || 'Aktif').trim().toLowerCase();
        
        const matchKelas = kelas === 'semua' || pKelas === kelas;
        const matchStatus = status === 'semua' || pStatus.includes(status) || (status === 'aktif' && pStatus === 'aktif');
        const matchSearch = !search || 
          (p.judulProyek && p.judulProyek.toLowerCase().includes(search)) || 
          (p.deskripsi && p.deskripsi.toLowerCase().includes(search)) ||
          (p.kelas && p.kelas.toLowerCase().includes(search)) ||
          (p.groups && p.groups.some(g => (g.namaKelompok && g.namaKelompok.toLowerCase().includes(search)) || (g.anggota && g.anggota.some(a => a.namaSiswa && a.namaSiswa.toLowerCase().includes(search)))));
        return matchKelas && matchStatus && matchSearch;
      });
    },

    syncActiveDraftToKelompokProyek() {
      if (!this.activeDraftProject) return;
      const idx = this.kelompokProyek.findIndex(p => p.id === this.activeDraftProject.id);
      if (idx >= 0) {
        this.kelompokProyek[idx] = JSON.parse(JSON.stringify(this.activeDraftProject));
      } else {
        this.kelompokProyek.unshift(JSON.parse(JSON.stringify(this.activeDraftProject)));
      }
      this.saveLocalData();
    },

    getSiswaWithMetrics(kelasTarget) {
      const target = (kelasTarget || 'X3 Atlet').trim().toLowerCase();
      const siswaList = this.siswa.filter(s => (s.kelas || '').trim().toLowerCase() === target);
      
      return siswaList.map(s => {
        const stars = Number(s.totalBintang) || 0;
        
        const studentGrades = this.nilai.filter(n => 
          ((n.idSiswa && n.idSiswa === s.id) || (n.namaSiswa && n.namaSiswa.toLowerCase().trim() === s.nama.toLowerCase().trim())) &&
          n.nilai !== '' && n.nilai !== null && !isNaN(Number(n.nilai))
        ).map(n => Number(n.nilai));
        
        const avgScore = studentGrades.length > 0 
          ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) 
          : 75;
        
        // Composite score: nilai akademik + bintang * 4
        const compositeScore = avgScore + (stars * 4);
        const peminatan = s.peminatan || (s.kelas && s.kelas.toLowerCase().includes('atlet') ? 'Atlet' : 'Prima');
        
        return {
          idSiswa: s.id,
          nisn: s.nisn,
          namaSiswa: s.nama,
          namaPanggilan: s.namaPanggilan || this.generateDefaultNickname(s.nama),
          kelas: s.kelas,
          gender: s.gender || 'L',
          peminatan: peminatan,
          bintang: stars,
          rataRataNilai: avgScore,
          compositeScore: compositeScore
        };
      });
    },

    // Helper Tema Kelompok Kimia Edukatif
    getChemicalThemes() {
      return [
        { name: 'Kation', icon: '⚡', color: 'emerald', tagline: 'Ion Bermuatan Positif' },
        { name: 'Anion', icon: '🔋', color: 'cyan', tagline: 'Ion Bermuatan Negatif' },
        { name: 'Proton', icon: '⚛️', color: 'blue', tagline: 'Inti Atom Stabil' },
        { name: 'Elektron', icon: '💫', color: 'purple', tagline: 'Partikel Penentu Ikatan' },
        { name: 'Neutron', icon: '🛡️', color: 'amber', tagline: 'Penyeimbang Inti Atom' },
        { name: 'Kovalen', icon: '🤝', color: 'indigo', tagline: 'Berbagi Pasangan Elektron' },
        { name: 'Valensi', icon: '🌟', color: 'rose', tagline: 'Elektron Kulit Terluar' },
        { name: 'Isotop', icon: '🔬', color: 'teal', tagline: 'Nuklida Sejajar' },
        { name: 'Polimer', icon: '🔗', color: 'orange', tagline: 'Rantai Senyawa Kuat' },
        { name: 'Katalis', icon: '🔥', color: 'red', tagline: 'Pemercepat Reaksi' },
        { name: 'Alkalis', icon: '💧', color: 'sky', tagline: 'Basa Kuat Reaktif' },
        { name: 'Halogen', icon: '💎', color: 'emerald', tagline: 'Pembentuk Garam Murni' }
      ];
    },

    getUnassignedStudentsInDraft() {
      if (!this.activeDraftProject) return [];
      const targetClass = this.activeDraftProject.kelas;
      const allClassStudents = this.getSiswaWithMetrics(targetClass);
      
      const assignedIds = new Set();
      (this.activeDraftProject.groups || []).forEach(g => {
        (g.anggota || []).forEach(a => {
          if (a.idSiswa) assignedIds.add(a.idSiswa);
        });
      });

      const q = (this.unassignedSearchQuery || '').toLowerCase().trim();
      return allClassStudents.filter(s => {
        const notAssigned = !assignedIds.has(s.idSiswa);
        const matchQ = !q || 
          s.namaSiswa.toLowerCase().includes(q) || 
          (s.namaPanggilan && s.namaPanggilan.toLowerCase().includes(q)) || 
          (s.peminatan && s.peminatan.toLowerCase().includes(q));
        return notAssigned && matchQ;
      });
    },

    createManualGroupProject() {
      const targetClass = this.formGroupGenerator.kelas || (this.kelasList[0]?.nama || 'X3 Atlet');
      const allStudents = this.getSiswaWithMetrics(targetClass);

      if (allStudents.length === 0) {
        this.showToast(`Tidak ada data siswa terdaftar di kelas ${targetClass}!`, 'error');
        return;
      }

      let numGroups = 4;
      if (this.formGroupGenerator.mode === 'jumlahKelompok') {
        numGroups = Math.max(1, Math.min(allStudents.length, Number(this.formGroupGenerator.jumlahKelompok) || 4));
      } else {
        const maxPerGroup = Math.max(2, Math.min(allStudents.length, Number(this.formGroupGenerator.maxAnggota) || 4));
        numGroups = Math.max(1, Math.ceil(allStudents.length / maxPerGroup));
      }

      const themes = this.getChemicalThemes();
      const groups = [];
      for (let i = 0; i < numGroups; i++) {
        const theme = themes[i % themes.length];
        groups.push({
          id: 'GRP-' + (i + 1),
          nomor: i + 1,
          namaKelompok: `Kelompok ${i + 1} (${theme.name})`,
          tema: theme.name,
          icon: theme.icon,
          color: theme.color,
          nilaiKelompok: 85,
          catatanKelompok: '',
          anggota: []
        });
      }

      const defaultJudul = this.formGroupGenerator.judulProyek.trim() || `Tugas Kelompok Kimia - ${this.getTodayDateString()}`;
      this.activeDraftProject = {
        id: 'KLP-' + new Date().getTime(),
        kelas: targetClass,
        judulProyek: defaultJudul,
        tanggal: this.getTodayDateString(),
        deskripsi: this.formGroupGenerator.deskripsi || 'Pembagian kelompok manual (ditentukan oleh guru / siswa)',
        status: 'Aktif',
        tagihanTerkait: this.formGroupGenerator.tagihanKolom.trim() || defaultJudul,
        groups: groups
      };

      this.unassignedMultiSelect = [];
      this.targetGroupForMultiAssign = groups[0]?.id || '';
      
      // Auto-save immediately so it is recorded in archive
      this.syncActiveDraftToKelompokProyek();
      this.syncToGoogleDrive('saveKelompokProject', this.activeDraftProject);

      this.showToast(`✍️ Mode Kelompok Manual aktif! ${numGroups} kelompok disiapkan & tersimpan di arsip.`, 'info');
      this.$nextTick(() => {
        this.initLucideIcons();
        const el = document.getElementById('active-draft-workspace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    addNewGroupToDraft() {
      if (!this.activeDraftProject) return;
      if (!this.activeDraftProject.groups) this.activeDraftProject.groups = [];
      
      const themes = this.getChemicalThemes();
      const nextNum = this.activeDraftProject.groups.length + 1;
      const theme = themes[(nextNum - 1) % themes.length];

      this.activeDraftProject.groups.push({
        id: 'GRP-' + new Date().getTime(),
        nomor: nextNum,
        namaKelompok: `Kelompok ${nextNum} (${theme.name})`,
        tema: theme.name,
        icon: theme.icon,
        color: theme.color,
        nilaiKelompok: 85,
        catatanKelompok: '',
        anggota: []
      });

      if (!this.targetGroupForMultiAssign && this.activeDraftProject.groups.length > 0) {
        this.targetGroupForMultiAssign = this.activeDraftProject.groups[0].id;
      }

      this.syncActiveDraftToKelompokProyek();
      this.showToast(`Kelompok ${nextNum} berhasil ditambahkan!`, 'success');
      this.$nextTick(() => this.initLucideIcons());
    },

    removeGroupFromDraft(groupId) {
      if (!this.activeDraftProject || !this.activeDraftProject.groups) return;
      const targetGroup = this.activeDraftProject.groups.find(g => g.id === groupId);
      if (!targetGroup) return;

      const memberCount = targetGroup.anggota.length;
      if (memberCount > 0) {
        if (!confirm(`Hapus ${targetGroup.namaKelompok}? ${memberCount} anggota di dalamnya akan kembali ke daftar siswa belum terbagi.`)) {
          return;
        }
      }

      this.activeDraftProject.groups = this.activeDraftProject.groups.filter(g => g.id !== groupId);
      // Renumber remaining groups
      this.activeDraftProject.groups.forEach((g, idx) => {
        g.nomor = idx + 1;
      });

      if (this.targetGroupForMultiAssign === groupId) {
        this.targetGroupForMultiAssign = this.activeDraftProject.groups[0]?.id || '';
      }

      this.syncActiveDraftToKelompokProyek();
      this.showToast(`${targetGroup.namaKelompok} dihapus`, 'info');
    },

    addStudentToGroup(groupId, student) {
      if (!this.activeDraftProject || !this.activeDraftProject.groups) return;
      const group = this.activeDraftProject.groups.find(g => g.id === groupId);
      if (!group) return;

      // Make sure student is not in any other group
      this.activeDraftProject.groups.forEach(g => {
        g.anggota = g.anggota.filter(a => a.idSiswa !== student.idSiswa);
      });

      const isFirst = group.anggota.length === 0;
      const hasLaptop = group.anggota.some(a => a.bawaLaptop);

      group.anggota.push({
        ...student,
        peran: isFirst ? 'Ketua Kelompok' : 'Anggota',
        bawaLaptop: !hasLaptop, // Jika kelompok belum memiliki penanggung jawab laptop, otomatis aktifkan
        nilaiIndividu: 85,
        catatanIndividu: ''
      });

      this.syncActiveDraftToKelompokProyek();
      this.showToast(`${student.namaSiswa} dimasukkan ke ${group.namaKelompok}`, 'success');
    },

    removeStudentFromGroup(groupId, studentId) {
      if (!this.activeDraftProject || !this.activeDraftProject.groups) return;
      const group = this.activeDraftProject.groups.find(g => g.id === groupId);
      if (!group) return;

      const student = group.anggota.find(a => a.idSiswa === studentId);
      group.anggota = group.anggota.filter(a => a.idSiswa !== studentId);
      
      // If group had a leader removed, reassign leader to first member if exists
      if (group.anggota.length > 0 && !group.anggota.some(a => a.peran === 'Ketua Kelompok')) {
        group.anggota[0].peran = 'Ketua Kelompok';
      }

      this.syncActiveDraftToKelompokProyek();
      this.showToast(`${student ? student.namaSiswa : 'Siswa'} dikeluarkan dari kelompok`, 'info');
    },

    toggleSelectUnassigned(studentId) {
      const idx = this.unassignedMultiSelect.indexOf(studentId);
      if (idx >= 0) {
        this.unassignedMultiSelect.splice(idx, 1);
      } else {
        this.unassignedMultiSelect.push(studentId);
      }
    },

    selectAllUnassigned(checked) {
      if (checked) {
        this.unassignedMultiSelect = this.getUnassignedStudentsInDraft().map(s => s.idSiswa);
      } else {
        this.unassignedMultiSelect = [];
      }
    },

    assignSelectedStudentsToGroup() {
      if (!this.targetGroupForMultiAssign) {
        this.showToast('Pilih kelompok tujuan terlebih dahulu', 'error');
        return;
      }
      if (this.unassignedMultiSelect.length === 0) {
        this.showToast('Centang minimal satu siswa terlebih dahulu', 'error');
        return;
      }

      const targetGroup = this.activeDraftProject.groups.find(g => g.id === this.targetGroupForMultiAssign);
      if (!targetGroup) return;

      const unassignedList = this.getUnassignedStudentsInDraft();
      let addedCount = 0;

      this.unassignedMultiSelect.forEach(sId => {
        const student = unassignedList.find(s => s.idSiswa === sId);
        if (student) {
          const isFirst = targetGroup.anggota.length === 0;
          const hasLaptop = targetGroup.anggota.some(a => a.bawaLaptop);
          targetGroup.anggota.push({
            ...student,
            peran: isFirst ? 'Ketua Kelompok' : 'Anggota',
            bawaLaptop: !hasLaptop,
            nilaiIndividu: 85,
            catatanIndividu: ''
          });
          addedCount++;
        }
      });

      this.unassignedMultiSelect = [];
      this.syncActiveDraftToKelompokProyek();
      this.showToast(`✨ ${addedCount} siswa berhasil dimasukkan ke ${targetGroup.namaKelompok}!`, 'success');
    },

    openModalAddMemberToGroup(group) {
      this.selectedGroupForMemberAdd = group;
      this.unassignedSearchQuery = '';
      this.modalAddMemberToGroupOpen = true;
    },

    addSelectedMemberFromModal(student) {
      if (!this.selectedGroupForMemberAdd) return;
      this.addStudentToGroup(this.selectedGroupForMemberAdd.id, student);
    },

    openModalEditGroupName(group) {
      this.selectedGroupForEdit = group;
      this.formEditGroupName = {
        id: group.id,
        namaKelompok: group.namaKelompok,
        tema: group.tema || '',
        icon: group.icon || '⚗️'
      };
      this.modalEditGroupNameOpen = true;
    },

    saveGroupNameEdit() {
      if (!this.selectedGroupForEdit) return;
      if (!this.formEditGroupName.namaKelompok.trim()) {
        this.showToast('Nama kelompok wajib diisi', 'error');
        return;
      }

      this.selectedGroupForEdit.namaKelompok = this.formEditGroupName.namaKelompok.trim();
      this.selectedGroupForEdit.tema = this.formEditGroupName.tema.trim();
      this.selectedGroupForEdit.icon = this.formEditGroupName.icon.trim() || '⚗️';
      
      this.modalEditGroupNameOpen = false;
      this.syncActiveDraftToKelompokProyek();
      this.showToast('Nama kelompok diperbarui!', 'success');
    },

    generateHeterogeneousGroups() {
      const targetClass = this.formGroupGenerator.kelas || (this.kelasList[0]?.nama || 'X3 Atlet');
      const allStudents = this.getSiswaWithMetrics(targetClass);

      if (allStudents.length === 0) {
        this.showToast(`Tidak ada data siswa terdaftar di kelas ${targetClass}!`, 'error');
        return;
      }

      const total = allStudents.length;
      let numGroups = 4;

      if (this.formGroupGenerator.mode === 'jumlahKelompok') {
        numGroups = Math.max(2, Math.min(total, Number(this.formGroupGenerator.jumlahKelompok) || 4));
      } else {
        const maxPerGroup = Math.max(2, Math.min(total, Number(this.formGroupGenerator.maxAnggota) || 4));
        numGroups = Math.max(2, Math.ceil(total / maxPerGroup));
      }

      // Daftar Nama & Tema Kelompok Kimia Edukatif
      const chemicalGroupThemes = this.getChemicalThemes();

      const groups = [];
      for (let i = 0; i < numGroups; i++) {
        const theme = chemicalGroupThemes[i % chemicalGroupThemes.length];
        groups.push({
          id: 'GRP-' + (i + 1),
          nomor: i + 1,
          namaKelompok: `Kelompok ${i + 1} (${theme.name})`,
          tema: theme.name,
          icon: theme.icon,
          color: theme.color,
          nilaiKelompok: 85,
          catatanKelompok: '',
          anggota: []
        });
      }

      // Pisahkan siswa berdasarkan Peminatan (Non-Prima / Spesialisasi vs Prima)
      const sortWithJitter = (list) => {
        return [...list].sort((a, b) => {
          const jitter = (Math.random() - 0.5) * 2;
          return (b.compositeScore - a.compositeScore) + jitter;
        });
      };

      // 1. Dapatkan daftar peminatan spesialisasi (Non-Prima)
      const specializedPeminatanOrder = ['Atlet', 'COC', 'CTP', 'ITPP', 'ICP', 'IUPP'];
      
      let groupIdx = 0;
      let step = 1;

      // Distribusikan tiap kategori spesialisasi bergiliran secara serpentine agar tersebar merata antar kelompok
      specializedPeminatanOrder.forEach(pem => {
        const studentsInPem = sortWithJitter(allStudents.filter(s => (s.peminatan || '').toUpperCase() === pem.toUpperCase()));
        studentsInPem.forEach(student => {
          groups[groupIdx].anggota.push({
            ...student,
            peran: groups[groupIdx].anggota.length === 0 ? 'Ketua Kelompok' : 'Anggota',
            nilaiIndividu: 85,
            catatanIndividu: ''
          });

          if (step === 1) {
            if (groupIdx === numGroups - 1) step = -1;
            else groupIdx++;
          } else {
            if (groupIdx === 0) step = 1;
            else groupIdx--;
          }
        });
      });

      // 2. Siswa Prima & Peminatan Lainnya didistribusikan untuk mengisi dan menyeimbangkan jumlah kelompok
      const remainingStudents = sortWithJitter(allStudents.filter(s => !specializedPeminatanOrder.some(p => p.toUpperCase() === (s.peminatan || '').toUpperCase())));
      remainingStudents.forEach(student => {
        let minCount = Math.min(...groups.map(g => g.anggota.length));
        let candidateGroups = groups.filter(g => g.anggota.length === minCount);
        let targetGroup = (candidateGroups && candidateGroups.length > 0) ? candidateGroups[groupIdx % candidateGroups.length] : groups[groupIdx % numGroups];
        
        targetGroup.anggota.push({
          ...student,
          peran: targetGroup.anggota.length === 1 && !targetGroup.anggota.some(a => a.peran === 'Ketua Kelompok') ? 'Ketua Kelompok' : 'Anggota',
          bawaLaptop: false,
          nilaiIndividu: 85,
          catatanIndividu: ''
        });

        groupIdx = (groupIdx + 1) % numGroups;
      });

      // Tetapkan Ketua & Penanggung Jawab Laptop default (1 siswa per kelompok)
      groups.forEach(g => {
        if (g.anggota.length > 0) {
          g.anggota[0].peran = 'Ketua Kelompok';
          // Siswa kedua (atau pertama jika cuma 1) ditugaskan membawa laptop
          const laptopIdx = g.anggota.length > 1 ? 1 : 0;
          g.anggota.forEach((a, idx) => {
            a.bawaLaptop = (idx === laptopIdx);
          });
        }
      });

      // Tetapkan activeDraftProject
      const defaultJudul = this.formGroupGenerator.judulProyek.trim() || `Tugas Kelompok Kimia - ${this.getTodayDateString()}`;
      this.activeDraftProject = {
        id: 'KLP-' + new Date().getTime(),
        kelas: targetClass,
        judulProyek: defaultJudul,
        tanggal: this.getTodayDateString(),
        deskripsi: this.formGroupGenerator.deskripsi || 'Pembagian kelompok heterogen cerdas (seimbang keaktifan bintang, nilai & peminatan)',
        status: 'Aktif',
        tagihanTerkait: this.formGroupGenerator.tagihanKolom.trim() || defaultJudul,
        groups: groups
      };

      this.unassignedMultiSelect = [];
      this.targetGroupForMultiAssign = groups[0]?.id || '';
      
      // Auto-save immediately so it is recorded in archive
      this.syncActiveDraftToKelompokProyek();
      this.syncToGoogleDrive('saveKelompokProject', this.activeDraftProject);

      this.showToast(`✨ Berhasil membentuk ${numGroups} kelompok heterogen untuk kelas ${targetClass}!`, 'success');
      this.$nextTick(() => {
        this.initLucideIcons();
        const el = document.getElementById('active-draft-workspace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    getGroupAnalytics(group) {
      if (!group || !group.anggota || group.anggota.length === 0) {
        return { count: 0, peminatanSummary: '0 Anggota', avgStars: '0', avgScore: 0, laptopCount: 0 };
      }
      const count = group.anggota.length;
      const pemCounts = {};
      let laptopCount = 0;
      group.anggota.forEach(a => {
        const p = a.peminatan || 'Prima';
        pemCounts[p] = (pemCounts[p] || 0) + 1;
        if (a.bawaLaptop) laptopCount++;
      });

      const summaryParts = Object.keys(pemCounts).map(k => `${pemCounts[k]} ${k}`);
      const totalStars = group.anggota.reduce((acc, a) => acc + (Number(a.bintang) || 0), 0);
      const totalScore = group.anggota.reduce((acc, a) => acc + (Number(a.rataRataNilai) || 75), 0);
      return {
        count,
        pemCounts,
        peminatanSummary: summaryParts.join(' • '),
        avgStars: (totalStars / count).toFixed(1),
        avgScore: Math.round(totalScore / count),
        laptopCount
      };
    },

    saveActiveDraftGroups() {
      if (!this.activeDraftProject || !this.activeDraftProject.groups || this.activeDraftProject.groups.length === 0) {
        this.showToast('Belum ada kelompok yang dibentuk!', 'error');
        return;
      }

      this.syncActiveDraftToKelompokProyek();
      this.syncToGoogleDrive('saveKelompokProject', this.activeDraftProject, () => {
        this.showToast(`Proyek Kelompok "${this.activeDraftProject.judulProyek}" berhasil disimpan & disinkronkan!`, 'success');
      });
    },

    openDraftFromSavedProject(project) {
      this.activeDraftProject = JSON.parse(JSON.stringify(project));
      this.formGroupGenerator.kelas = project.kelas;
      this.formGroupGenerator.judulProyek = project.judulProyek;
      this.formGroupGenerator.tagihanKolom = project.tagihanTerkait;
      this.unassignedMultiSelect = [];
      this.targetGroupForMultiAssign = project.groups && project.groups.length > 0 ? project.groups[0].id : '';
      this.showToast(`Membuka proyek: ${project.judulProyek}`, 'info');
      this.$nextTick(() => {
        this.initLucideIcons();
        const el = document.getElementById('active-draft-workspace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    copyGroupProjectText(project) {
      const p = project || this.activeDraftProject;
      if (!p || !p.groups || p.groups.length === 0) {
        this.showToast('Belum ada data kelompok untuk disalin', 'error');
        return;
      }

      let text = `🧪 *DAFTAR PEMBAGIAN KELOMPOK KIMIA*\n`;
      text += `📌 *Proyek / Tugas:* ${p.judulProyek}\n`;
      text += `🏫 *Kelas:* ${p.kelas} | 📅 *Tanggal:* ${p.tanggal}\n`;
      if (p.tagihanTerkait) text += `📝 *Tagihan Nilai:* ${p.tagihanTerkait}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      p.groups.forEach((g, idx) => {
        const laptopSummary = (g.anggota || []).filter(a => a.bawaLaptop).map(a => a.namaPanggilan ? `${a.namaPanggilan} (${a.namaSiswa})` : a.namaSiswa).join(', ') || 'Belum ditentukan';
        text += `🔹 *${g.namaKelompok}* ${g.icon || '⚗️'} (Tema: ${g.tema || '-'})\n`;
        text += `   💻 *PJ Laptop:* ${laptopSummary}\n`;
        if (g.anggota && g.anggota.length > 0) {
          g.anggota.forEach((m, mIdx) => {
            let tags = [];
            if (m.peran === 'Ketua Kelompok') tags.push('👑 Ketua');
            if (m.bawaLaptop) tags.push('💻 Bawa Laptop');
            const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
            const namaDisp = m.namaPanggilan && m.namaPanggilan.toLowerCase() !== m.namaSiswa.toLowerCase()
              ? `${m.namaSiswa} (${m.namaPanggilan})`
              : m.namaSiswa;
            text += `   ${mIdx + 1}. ${namaDisp}${tagStr} (${m.peminatan || 'Prima'})\n`;
          });
        } else {
          text += `   _(Belum ada anggota)_\n`;
        }
        text += `\n`;
      });

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('📋 Daftar kelompok berhasil disalin ke clipboard!', 'success');
        }).catch(() => {
          this.fallbackCopyText(text);
        });
      } else {
        this.fallbackCopyText(text);
      }
    },

    fallbackCopyText(text) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showToast('📋 Daftar kelompok berhasil disalin ke clipboard!', 'success');
      } catch (e) {
        this.showToast('Gagal menyalin otomatis', 'error');
      }
    },

    disbandGroupProject(project) {
      if (!project) return;
      if (confirm(`Yakin ingin membubarkan kelompok untuk "${project.judulProyek}"?\n\nCATATAN AMAN: Nilai tugas siswa yang telah masuk ke modul Penilaian TIDAK AKAN TERHAPUS.`)) {
        project.status = 'Selesai / Dibubarkan';
        const idx = this.kelompokProyek.findIndex(p => p.id === project.id);
        if (idx >= 0) {
          this.kelompokProyek[idx].status = 'Selesai / Dibubarkan';
        }
        if (this.activeDraftProject && this.activeDraftProject.id === project.id) {
          this.activeDraftProject.status = 'Selesai / Dibubarkan';
        }
        this.saveLocalData();
        this.syncToGoogleDrive('saveKelompokProject', project, () => {
          this.showToast('Kelompok telah dibubarkan (Seluruh nilai individu tetap aman)', 'warning');
        });
      }
    },

    deleteGroupProjectPermanently(project) {
      if (!project) return;
      if (confirm(`Hapus permanen arsip "${project.judulProyek}" dari daftar kelompok?\n\n(Nilai siswa di menu Penilaian tetap tersimpan aman)`)) {
        this.kelompokProyek = this.kelompokProyek.filter(p => p.id !== project.id);
        if (this.activeDraftProject && this.activeDraftProject.id === project.id) {
          this.activeDraftProject = null;
        }
        this.saveLocalData();
        this.syncToGoogleDrive('deleteKelompokProject', { id: project.id }, () => {
          this.showToast('Arsip kelompok berhasil dihapus', 'info');
        });
      }
    },

    // PENILAIAN KELOMPOK KE INDIVIDU
    openModalNilaiKelompok(project, group) {
      this.selectedGroupForGrading = group;
      const tagihanJudul = (project?.tagihanTerkait || project?.judulProyek || 'Tugas Kelompok Kimia').trim();
      
      const anggotaNilaiList = group.anggota.map(m => {
        // Cek apakah siswa sudah memiliki nilai individu untuk tagihan ini di this.nilai
        const existingRecord = this.nilai.find(n => 
          n.kelas === (project.kelas || this.formGroupGenerator.kelas) &&
          n.namaSiswa.toLowerCase().trim() === m.namaSiswa.toLowerCase().trim() &&
          n.judulMateri.toLowerCase().trim() === tagihanJudul.toLowerCase().trim()
        );
        
        return {
          idSiswa: m.idSiswa,
          namaSiswa: m.namaSiswa,
          peminatan: m.peminatan,
          peran: m.peran,
          bawaLaptop: m.bawaLaptop || false,
          nilaiIndividu: existingRecord ? existingRecord.nilai : (m.nilaiIndividu || group.nilaiKelompok || 85),
          catatanIndividu: existingRecord?.catatan || m.catatanIndividu || ''
        };
      });

      this.formNilaiKelompok = {
        projectId: project.id,
        groupId: group.id,
        namaKelompok: group.namaKelompok,
        tagihanTerkait: tagihanJudul,
        nilaiKelompok: group.nilaiKelompok || 85,
        catatanKelompok: group.catatanKelompok || '',
        anggotaNilai: anggotaNilaiList
      };

      this.modalNilaiKelompokOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    applyGradeToAllMembers(score) {
      const val = Math.max(0, Math.min(100, Number(score) || 0));
      this.formNilaiKelompok.nilaiKelompok = val;
      this.formNilaiKelompok.anggotaNilai.forEach(an => {
        an.nilaiIndividu = val;
      });
      this.showToast(`Nilai ${val} diterapkan ke seluruh anggota`, 'info');
    },

    saveAndInjectGroupGrade() {
      const { projectId, groupId, tagihanTerkait, nilaiKelompok, catatanKelompok, anggotaNilai } = this.formNilaiKelompok;
      const project = this.activeDraftProject;
      if (!project) return;

      const group = project.groups.find(g => g.id === groupId);
      if (group) {
        group.nilaiKelompok = Number(nilaiKelompok) || 85;
        group.catatanKelompok = catatanKelompok;
        
        // Perbarui nilai di kartu anggota kelompok aktif
        anggotaNilai.forEach(an => {
          const m = group.anggota.find(a => a.idSiswa === an.idSiswa);
          if (m) {
            m.nilaiIndividu = Number(an.nilaiIndividu) || 85;
            m.catatanIndividu = an.catatanIndividu || '';
          }
        });
      }

      // Pastikan tagihanDefinisi mencatat kolom tagihan ini
      const targetKelas = project.kelas || 'X3 Atlet';
      const existingTagihan = this.tagihanDefinisi.find(t => 
        t.kelas === targetKelas && 
        t.judulMateri.toLowerCase().trim() === tagihanTerkait.toLowerCase().trim()
      );
      if (!existingTagihan) {
        this.tagihanDefinisi.push({
          judulMateri: tagihanTerkait.trim(),
          kategori: 'Tugas',
          kkm: 75,
          kelas: targetKelas
        });
      }

      // INJEKSI OTOMATIS KE PENILAIAN INDIVIDU SISWA (this.nilai)
      anggotaNilai.forEach(an => {
        const studentScore = Number(an.nilaiIndividu) || 85;
        const studentStatus = studentScore >= 75 ? 'Tuntas' : 'Remedial';

        const existingNilaiIdx = this.nilai.findIndex(n => 
          n.kelas === targetKelas &&
          n.namaSiswa.toLowerCase().trim() === an.namaSiswa.toLowerCase().trim() &&
          n.judulMateri.toLowerCase().trim() === tagihanTerkait.toLowerCase().trim()
        );

        if (existingNilaiIdx >= 0) {
          this.nilai[existingNilaiIdx].nilai = studentScore;
          this.nilai[existingNilaiIdx].status = studentStatus;
          this.nilai[existingNilaiIdx].catatan = an.catatanIndividu || `Nilai Proyek: ${group?.namaKelompok || ''}`;
        } else {
          this.nilai.push({
            id: 'NIL-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
            idSiswa: an.idSiswa || '',
            namaSiswa: an.namaSiswa,
            kelas: targetKelas,
            jenisTagihan: 'Tugas',
            judulMateri: tagihanTerkait.trim(),
            nilai: studentScore,
            kkm: 75,
            status: studentStatus,
            catatan: an.catatanIndividu || `Nilai Proyek: ${group?.namaKelompok || ''}`
          });
        }
      });

      // Simpan project & nilai ke storage + Google Drive
      this.saveActiveDraftGroups();
      this.saveLocalData();
      this.syncToGoogleDrive('saveNilai', this.nilai, () => {
        this.showToast(`🎉 Nilai kelompok berhasil dimasukkan ke nilai tugas individu seluruh anggota!`, 'success');
      });

      this.modalNilaiKelompokOpen = false;
    },

    // DRAG & DROP ANGGOTA ANTAR KELOMPOK DAN UNASSIGNED POOL
    onGroupMemberDragStart(event, fromGroupId, member) {
      this.groupDragMember = { fromGroupId, member };
      event.dataTransfer.setData('text/plain', JSON.stringify({ fromGroupId, memberId: member.idSiswa }));
      event.dataTransfer.effectAllowed = 'move';
    },

    onUnassignedStudentDragStart(event, student) {
      this.groupDragMember = { fromGroupId: 'UNASSIGNED', member: student };
      event.dataTransfer.setData('text/plain', JSON.stringify({ fromGroupId: 'UNASSIGNED', memberId: student.idSiswa }));
      event.dataTransfer.effectAllowed = 'move';
    },

    onGroupDragOver(event, groupId) {
      this.groupDragOverGroupId = groupId;
    },

    onGroupDragLeave(event, groupId) {
      if (this.groupDragOverGroupId === groupId) {
        this.groupDragOverGroupId = null;
      }
    },

    onGroupDrop(event, targetGroupId) {
      this.groupDragOverGroupId = null;
      if (!this.groupDragMember) return;

      const { fromGroupId, member } = this.groupDragMember;
      if (fromGroupId === targetGroupId) {
        this.groupDragMember = null;
        return;
      }

      const project = this.activeDraftProject;
      if (!project || !project.groups) return;

      if (targetGroupId === 'UNASSIGNED') {
        // Dragged to Unassigned Pool -> Remove from group
        if (fromGroupId !== 'UNASSIGNED') {
          const fromGroup = project.groups.find(g => g.id === fromGroupId);
          if (fromGroup) {
            fromGroup.anggota = fromGroup.anggota.filter(a => a.idSiswa !== member.idSiswa);
            if (fromGroup.anggota.length > 0 && !fromGroup.anggota.some(a => a.peran === 'Ketua Kelompok')) {
              fromGroup.anggota[0].peran = 'Ketua Kelompok';
            }
            this.showToast(`${member.namaSiswa} dikeluarkan dari ${fromGroup.namaKelompok}`, 'info');
          }
        }
      } else {
        // Dragged to a target Group
        const targetGroup = project.groups.find(g => g.id === targetGroupId);
        if (targetGroup) {
          if (fromGroupId !== 'UNASSIGNED') {
            const fromGroup = project.groups.find(g => g.id === fromGroupId);
            if (fromGroup) {
              fromGroup.anggota = fromGroup.anggota.filter(a => a.idSiswa !== member.idSiswa);
              if (fromGroup.anggota.length > 0 && !fromGroup.anggota.some(a => a.peran === 'Ketua Kelompok')) {
                fromGroup.anggota[0].peran = 'Ketua Kelompok';
              }
            }
          }
          const isFirst = targetGroup.anggota.length === 0;
          const hasLaptop = targetGroup.anggota.some(a => a.bawaLaptop);
          targetGroup.anggota.push({
            ...member,
            peran: isFirst ? 'Ketua Kelompok' : (member.peran || 'Anggota'),
            bawaLaptop: member.bawaLaptop !== undefined ? member.bawaLaptop : !hasLaptop,
            nilaiIndividu: member.nilaiIndividu || 85,
            catatanIndividu: member.catatanIndividu || ''
          });
          this.showToast(`${member.namaSiswa} dimasukkan ke ${targetGroup.namaKelompok}`, 'info');
        }
      }

      this.syncActiveDraftToKelompokProyek();
      this.groupDragMember = null;
    },

    toggleMemberPeran(group, member) {
      if (member.peran === 'Ketua Kelompok') {
        member.peran = 'Anggota';
      } else {
        member.peran = 'Ketua Kelompok';
      }
      this.syncActiveDraftToKelompokProyek();
      this.showToast(`${member.namaSiswa} diubah menjadi ${member.peran}`, 'info');
    },

    toggleMemberLaptop(group, member) {
      member.bawaLaptop = !member.bawaLaptop;
      this.syncActiveDraftToKelompokProyek();
      if (member.bawaLaptop) {
        this.showToast(`💻 ${member.namaSiswa} ditugaskan membawa Laptop`, 'info');
      } else {
        this.showToast(`Tugas membawa laptop untuk ${member.namaSiswa} dinonaktifkan`, 'info');
      }
    },

    // Helper pintar untuk mengekstrak nama panggilan alami (default) jika belum diisi
    generateDefaultNickname(fullName) {
      if (!fullName) return '';
      const clean = String(fullName).trim().replace(/\s+/g, ' ');
      const words = clean.split(' ').filter(w => w.length > 0);
      if (words.length === 0) return '';
      if (words.length === 1) return words[0];

      const prefixList = ['ahmad', 'achmad', 'muhammad', 'mohammad', 'moch', 'moch.', 'm.', 'm', 'raden', 'tubagus', 'siti', 'nur', 'muh.', 'muh'];
      const firstLower = words[0].toLowerCase().replace(/\./g, '');
      
      // Jika kata pertama adalah awalan gelar / nama religius dan ada kata kedua, ambil kata kedua
      if (prefixList.includes(firstLower) && words.length > 1) {
        return words[1];
      }
      
      // Default: ambil kata pertama
      return words[0];
    },

    // Helper untuk mendapatkan nama panggilan siswa (dengan fallback cerdas)
    getStudentShortName(s) {
      if (!s) return '';
      if (typeof s === 'string') return this.generateDefaultNickname(s);
      const panggilan = s.namaPanggilan ? String(s.namaPanggilan).trim() : '';
      if (panggilan) return panggilan;
      const nama = String(s.nama || s.namaSiswa || '').trim();
      return this.generateDefaultNickname(nama);
    },

    // Helper untuk menampilkan nama siswa (dengan nama panggilan jika ada)
    getStudentDisplayName(s) {
      if (!s) return '';
      if (typeof s === 'string') return s;
      const nama = String(s.nama || s.namaSiswa || '').trim();
      const panggilan = this.getStudentShortName(s);
      if (panggilan && panggilan.toLowerCase() !== nama.toLowerCase()) {
        return `${panggilan} (${nama})`;
      }
      return nama;
    },

    // =========================================================================
    // 6. MANAJEMEN SISWA & KELAS (7 KATEGORI PEMINATAN: PRIMA, ATLET, COC, CTP, ITPP, ICP, IUPP)
    // =========================================================================
    getFilteredSiswa() {
      return this.siswa.filter(s => {
        if (!s) return false;
        const matchKelas = this.siswaFilter.kelas === 'Semua' || s.kelas === this.siswaFilter.kelas;
        const sPem = (s.peminatan || 'Prima').trim();
        const matchPeminatan = this.siswaFilter.peminatan === 'Semua' || sPem.toUpperCase() === this.siswaFilter.peminatan.toUpperCase();
        const q = (this.siswaFilter.search || '').toLowerCase().trim();
        const matchSearch = !q ||
          (s.nama && s.nama.toLowerCase().includes(q)) ||
          (s.namaPanggilan && s.namaPanggilan.toLowerCase().includes(q)) ||
          (s.nisn && s.nisn.toLowerCase().includes(q)) ||
          sPem.toLowerCase().includes(q);
        return matchKelas && matchPeminatan && matchSearch;
      });
    },

    openModalAddSiswa() {
      this.formSiswa = {
        id: 'SIS-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nisn: '',
        nama: '',
        namaPanggilan: '',
        kelas: this.siswaFilter.kelas !== 'Semua' ? this.siswaFilter.kelas : (this.kelasList[0]?.nama || 'X3 Atlet'),
        peminatan: 'Prima',
        gender: 'L',
        noHp: '',
        noHpOrtu: '',
        status: 'Aktif',
        totalBintang: 0
      };
      this.modalSiswaOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    editSiswa(s) {
      this.formSiswa = { 
        ...s,
        nama: s.nama || '',
        namaPanggilan: s.namaPanggilan || '',
        nisn: s.nisn || '',
        kelas: s.kelas || 'X3 Atlet',
        peminatan: s.peminatan || (s.kelas && s.kelas.toLowerCase().includes('atlet') ? 'Atlet' : 'Prima'),
        gender: s.gender || 'L',
        noHp: s.noHp || '',
        noHpOrtu: s.noHpOrtu || '',
        status: s.status || 'Aktif',
        totalBintang: s.totalBintang || 0
      };
      this.modalSiswaOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveSiswa() {
      if (!this.formSiswa.nama || !this.formSiswa.nama.trim()) {
        this.showToast('Nama Siswa wajib diisi!', 'error');
        return;
      }

      this.formSiswa.nama = this.formSiswa.nama.trim();
      this.formSiswa.namaPanggilan = (this.formSiswa.namaPanggilan || '').trim();
      this.formSiswa.nisn = (this.formSiswa.nisn || '').trim();
      this.formSiswa.kelas = (this.formSiswa.kelas || 'X3 Atlet').trim();
      this.formSiswa.peminatan = (this.formSiswa.peminatan || 'Prima').trim();
      this.formSiswa.noHp = (this.formSiswa.noHp || '').trim();
      this.formSiswa.noHpOrtu = (this.formSiswa.noHpOrtu || '').trim();

      // Cari indeks siswa yang ada berdasarkan ID atau (Nama + Kelas)
      let existingIndex = -1;
      if (this.formSiswa.id) {
        existingIndex = this.siswa.findIndex(s => s.id === this.formSiswa.id);
      }
      if (existingIndex === -1 && this.formSiswa.nama) {
        existingIndex = this.siswa.findIndex(s => 
          s.nama && s.nama.toLowerCase().trim() === this.formSiswa.nama.toLowerCase().trim() &&
          s.kelas && s.kelas.toLowerCase().trim() === this.formSiswa.kelas.toLowerCase().trim()
        );
      }

      if (existingIndex >= 0) {
        const oldStudent = this.siswa[existingIndex];
        this.siswa[existingIndex] = {
          ...oldStudent,
          ...this.formSiswa,
          id: oldStudent.id || this.formSiswa.id
        };
      } else {
        const newId = this.formSiswa.id || ('SIS-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
        this.siswa.push({
          ...this.formSiswa,
          id: newId,
          totalBintang: this.formSiswa.totalBintang || 0
        });
      }

      // Deduplikasi ketat seluruh array this.siswa berdasarkan (Nama + Kelas)
      const cleanMap = new Map();
      this.siswa.forEach((s, idx) => {
        if (s && s.nama && s.nama.trim()) {
          const key = s.nama.toLowerCase().trim() + '|||' + (s.kelas || 'X3 Atlet').toLowerCase().trim();
          if (!cleanMap.has(key)) {
            cleanMap.set(key, {
              ...s,
              id: s.id || ('SIS-' + (idx + 1).toString().padStart(3, '0'))
            });
          }
        }
      });
      this.siswa = Array.from(cleanMap.values());

      this.saveLocalData();
      this.syncToGoogleDrive('saveSiswa', this.siswa, () => {
        this.showToast(`Data Siswa ${this.formSiswa.nama} berhasil disimpan!`, 'success');
      });

      this.modalSiswaOpen = false;
    },

    deleteSiswa(id) {
      if (confirm('Yakin ingin menghapus data siswa ini?')) {
        this.siswa = this.siswa.filter(s => s.id !== id);
        this.saveLocalData();
        this.syncToGoogleDrive('saveSiswa', this.siswa, () => {
          this.showToast('Data Siswa berhasil dihapus', 'info');
        });
      }
    },

    openModalAddKelas() {
      this.formKelas = {
        id: 'KLS-' + (this.kelasList.length + 1).toString().padStart(2, '0'),
        nama: '',
        deskripsi: '',
        isWaliKelas: false
      };
      this.modalKelasOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveKelas() {
      if (!this.formKelas.nama.trim()) {
        this.showToast('Nama Kelas wajib diisi!', 'error');
        return;
      }

      const namaClean = this.formKelas.nama.trim();
      const existing = this.kelasList.find(k => k.nama.toLowerCase() === namaClean.toLowerCase());
      
      if (existing) {
        this.showToast(`Kelas ${namaClean} sudah terdaftar!`, 'error');
        return;
      }

      const newKelas = {
        id: this.formKelas.id,
        nama: namaClean,
        deskripsi: this.formKelas.deskripsi || 'Kelas Pembelajaran',
        isWaliKelas: this.formKelas.isWaliKelas
      };

      if (this.formKelas.isWaliKelas) {
        this.guru.kelasWali = namaClean;
        this.kelasList.forEach(k => k.isWaliKelas = false);
      }

      this.kelasList.push(newKelas);
      this.saveLocalData();
      this.showToast(`Kelas baru "${namaClean}" berhasil ditambahkan!`, 'success');
      this.modalKelasOpen = false;
    },

    deleteKelas(namaKelas) {
      if (this.kelasList.length <= 1) {
        this.showToast('Minimal harus ada 1 kelas terdaftar', 'error');
        return;
      }

      const countSiswa = this.siswa.filter(s => s.kelas === namaKelas).length;
      if (confirm(`Apakah Anda yakin ingin menghapus kelas "${namaKelas}"? (${countSiswa} siswa terdaftar di kelas ini)`)) {
        this.kelasList = this.kelasList.filter(k => k.nama !== namaKelas);
        if (this.guru.kelasWali === namaKelas) {
          this.guru.kelasWali = this.kelasList[0].nama;
        }
        if (this.waliKelasFilter.kelas === namaKelas) {
          this.waliKelasFilter.kelas = this.kelasList[0].nama;
        }
        this.saveLocalData();
        this.showToast(`Kelas "${namaKelas}" berhasil dihapus`, 'info');
      }
    },

    // =========================================================================
    // 6. QUICK LINKS
    // =========================================================================
    getFilteredQuickLinks() {
      return this.quickLinks.filter(l => {
        const matchCat = this.quickLinkFilter.kategori === 'Semua' || l.kategori === this.quickLinkFilter.kategori;
        const matchSearch = !this.quickLinkFilter.search ||
          l.judul.toLowerCase().includes(this.quickLinkFilter.search.toLowerCase()) ||
          l.url.toLowerCase().includes(this.quickLinkFilter.search.toLowerCase()) ||
          (l.deskripsi && l.deskripsi.toLowerCase().includes(this.quickLinkFilter.search.toLowerCase()));
        return matchCat && matchSearch;
      });
    },

    getQuickLinkCategories() {
      const cats = new Set(['Semua']);
      this.quickLinks.forEach(l => {
        if (l.kategori) cats.add(l.kategori);
      });
      return Array.from(cats);
    },

    openModalAddQuickLink() {
      this.formQuickLink = {
        id: 'QL-' + new Date().getTime(),
        judul: '',
        url: 'https://',
        kategori: 'Pendidikan',
        deskripsi: '',
        icon: 'link-2',
        warna: 'emerald'
      };
      this.modalQuickLinkOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    editQuickLink(l) {
      this.formQuickLink = { ...l };
      this.modalQuickLinkOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    saveQuickLink() {
      if (!this.formQuickLink.judul.trim() || !this.formQuickLink.url.trim()) {
        this.showToast('Judul dan URL Link wajib diisi!', 'error');
        return;
      }

      let url = this.formQuickLink.url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      this.formQuickLink.url = url;

      const idx = this.quickLinks.findIndex(l => l.id === this.formQuickLink.id);
      if (idx >= 0) {
        this.quickLinks[idx] = { ...this.formQuickLink };
      } else {
        this.quickLinks.unshift({ ...this.formQuickLink });
      }

      this.saveLocalData();
      this.syncToGoogleDrive('saveQuickLinks', this.quickLinks, () => {
        this.showToast(`Link "${this.formQuickLink.judul}" berhasil disimpan ke Google Sheets!`, 'success');
      });
      this.modalQuickLinkOpen = false;
    },

    deleteQuickLink(id) {
      const target = this.quickLinks.find(l => l.id === id);
      const nama = target ? target.judul : 'ini';
      if (confirm(`Yakin ingin menghapus tautan "${nama}"?`)) {
        this.quickLinks = this.quickLinks.filter(l => l.id !== id);
        this.saveLocalData();
        this.syncToGoogleDrive('saveQuickLinks', this.quickLinks, () => {
          this.showToast(`Tautan "${nama}" berhasil dihapus dari Google Sheets`, 'info');
        });
      }
    },

    // =========================================================================
    // BACKUP, RESTORE, TRANSISI TAHUN AJARAN & PWA
    // =========================================================================
    installPwaApp() {
      if (this.deferredPwaPrompt) {
        this.deferredPwaPrompt.prompt();
        this.deferredPwaPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            this.canInstallPwa = false;
          }
          this.deferredPwaPrompt = null;
        });
      } else {
        this.showToast('📱 Untuk menginstall: buka menu titik tiga browser di pojok kanan atas, lalu klik "Tambahkan ke Layar Utama" / "Install App"', 'info');
      }
    },

    exportBackupJSON() {
      const guruName = (this.guru?.nama || 'Guru_Kimia').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const ta = (this.guru?.tahunAjaran || '2026-2027').replace(/\//g, '-');
      const tgl = new Date().toISOString().split('T')[0];

      const data = {
        app: "LMS-PortalKimia",
        version: "7.0",
        exportedAt: new Date().toISOString(),
        metadata: {
          guru: this.guru,
          tahunAjaran: this.guru.tahunAjaran || '2026/2027',
          semester: this.guru.semester || 'Ganjil'
        },
        guru: this.guru,
        kelasList: this.kelasList,
        tagihanDefinisi: this.tagihanDefinisi,
        siswa: this.siswa,
        presensiWali: this.presensiWali,
        jurnalKimia: this.jurnalKimia,
        presensiKimia: this.presensiKimia,
        nilai: this.nilai,
        bintangLog: this.bintangLog,
        kelompokProyek: this.kelompokProyek,
        catatanKonseling: this.catatanKonseling,
        jadwalPiket: this.jadwalPiket,
        strukturKelas: this.strukturKelas,
        jadwalKelas: this.jadwalKelas,
        jadwalMengajar: this.jadwalMengajar,
        jamPelajaran: this.jamPelajaran,
        quickLinks: this.quickLinks,
        mediaPembelajaran: this.mediaPembelajaran
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_LMS_PortalKimia_${guruName}_${ta}_${tgl}.json`;
      a.click();
      this.showToast('📁 File Backup JSON lengkap berhasil diunduh!', 'success');
      return true;
    },

    importBackupJSON(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && (parsed.guru || parsed.metadata)) {
            if (parsed.guru) this.guru = parsed.guru;
            if (parsed.kelasList) this.kelasList = parsed.kelasList;
            if (parsed.tagihanDefinisi) this.tagihanDefinisi = parsed.tagihanDefinisi;
            if (parsed.siswa) this.siswa = parsed.siswa;
            if (parsed.presensiWali) this.presensiWali = parsed.presensiWali;
            if (parsed.jurnalKimia) this.jurnalKimia = parsed.jurnalKimia;
            if (parsed.presensiKimia) this.presensiKimia = parsed.presensiKimia;
            if (parsed.nilai) this.nilai = parsed.nilai;
            if (parsed.bintangLog) this.bintangLog = parsed.bintangLog;
            if (parsed.kelompokProyek) this.kelompokProyek = parsed.kelompokProyek;
            if (parsed.catatanKonseling) this.catatanKonseling = parsed.catatanKonseling;
            if (parsed.jadwalPiket) this.jadwalPiket = parsed.jadwalPiket;
            if (parsed.strukturKelas) this.strukturKelas = parsed.strukturKelas;
            if (parsed.jadwalKelas) this.jadwalKelas = parsed.jadwalKelas;
            if (parsed.jadwalMengajar) this.jadwalMengajar = parsed.jadwalMengajar;
            if (parsed.jamPelajaran) this.jamPelajaran = parsed.jamPelajaran;
            if (parsed.quickLinks) this.quickLinks = parsed.quickLinks;
            if (parsed.mediaPembelajaran) this.mediaPembelajaran = parsed.mediaPembelajaran;

            this.saveLocalData();
            this.showToast('🎉 Database lengkap berhasil dipulihkan dari file backup!', 'success');
            setTimeout(() => location.reload(), 800);
          } else {
            this.showToast('Format file JSON tidak valid', 'error');
          }
        } catch (err) {
          this.showToast('Gagal membaca file JSON: ' + err, 'error');
        }
      };
      reader.readAsText(file);
    },

    openModalResetTahunAjaran() {
      // Hitung saran tahun ajaran berikutnya
      const currentTA = this.guru.tahunAjaran || '2026/2027';
      let nextTA = '2027/2028';
      const parts = currentTA.split('/');
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        nextTA = `${Number(parts[0]) + 1}/${Number(parts[1]) + 1}`;
      }

      this.formResetTahunAjaran = {
        tahunBaru: nextTA,
        semesterBaru: 'Ganjil',
        resetSiswa: true,
        resetNilai: true,
        resetJurnal: true,
        resetPresensiWali: true,
        resetBintang: true,
        resetKelompok: true,
        resetKonseling: true,
        resetPiket: true,
        resetJadwal: false,
        resetMedia: false,
        backupDownloaded: false,
        confirmKeyword: ''
      };
      this.modalResetTahunAjaranOpen = true;
      this.$nextTick(() => this.initLucideIcons());
    },

    downloadBackupBeforeReset() {
      this.exportBackupJSON();
      this.formResetTahunAjaran.backupDownloaded = true;
      this.showToast('✅ File cadangan telah diunduh. Sekarang Anda dapat melanjutkan reset.', 'info');
    },

    executeResetTahunAjaran() {
      if (!this.formResetTahunAjaran.backupDownloaded) {
        this.showToast('⚠️ Wajib unduh file backup terlebih dahulu untuk mencegah kehilangan data!', 'error');
        return;
      }
      if (this.formResetTahunAjaran.confirmKeyword.trim().toUpperCase() !== 'RESET') {
        this.showToast('Ketik kata "RESET" pada kotak konfirmasi untuk melanjutkan.', 'error');
        return;
      }

      const f = this.formResetTahunAjaran;

      // Update Guru Profile Academic Year & Semester
      this.guru.tahunAjaran = f.tahunBaru.trim();
      this.guru.semester = f.semesterBaru;

      // Selective Reset
      if (f.resetSiswa) this.siswa = [];
      if (f.resetNilai) {
        this.nilai = [];
        this.tagihanDefinisi = [];
      }
      if (f.resetJurnal) {
        this.jurnalKimia = [];
        this.presensiKimia = [];
      }
      if (f.resetPresensiWali) this.presensiWali = [];
      if (f.resetBintang) this.bintangLog = [];
      if (f.resetKelompok) {
        this.kelompokProyek = [];
        this.activeDraftProject = null;
      }
      if (f.resetKonseling) this.catatanKonseling = [];
      if (f.resetPiket) this.jadwalPiket = {};
      if (f.resetJadwal) {
        this.jadwalKelas = [];
        this.jadwalMengajar = [];
      }
      if (f.resetMedia) this.mediaPembelajaran = [];

      this.saveLocalData();

      this.syncToGoogleDrive('resetTahunAjaran', {
        tahunAjaran: this.guru.tahunAjaran,
        semester: this.guru.semester
      }, () => {
        this.showToast(`🎉 Transisi ke Tahun Ajaran Baru (${f.tahunBaru} - Semester ${f.semesterBaru}) Berhasil!`, 'success');
      });

      this.modalResetTahunAjaranOpen = false;
      setTimeout(() => location.reload(), 1000);
    },

    clearAllData() {
      if (confirm('Kosongkan data siswa dan nilai saat ini untuk menarik ulang dari Spreadsheet / Paste baru?')) {
        this.siswa = [];
        this.presensiWali = [];
        this.jurnalKimia = [];
        this.presensiKimia = [];
        this.nilai = [];
        this.bintangLog = [];
        this.tagihanDefinisi = [];
        this.saveLocalData();
        this.showToast('Daftar siswa & nilai dikosongkan. Siap untuk ditarik / dipaste ulang.', 'info');
      }
    },

    // =========================================================================
    // CHARTS
    // =========================================================================
    initCharts() {
      try {
        if (typeof Chart === 'undefined') return;

        const isDark = this.darkMode;
        const textColor = isDark ? '#a1a1aa' : '#475569';
        const gridColor = isDark ? '#27272a' : '#e2e8f0';

        const ctx1 = document.getElementById('chartKehadiran');
        if (ctx1) {
          const old1 = Chart.getChart(ctx1) || lmsChartInstances.kehadiran;
          if (old1 && typeof old1.destroy === 'function') {
            old1.destroy();
          }

          const stats = this.getWaliRecapStats();
          const chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels: ['Hadir', 'Tahfidz', 'PTV', 'Organtri', 'Terlambat', 'Sakit', 'Izin', 'Di Rumah', 'Tanpa Keterangan'],
              datasets: [{
                data: [stats.hadir, stats.tahfidz, stats.ptv, stats.organtri, stats.telat, stats.sakit, stats.izin, stats.dirumah, stats.tanpaket],
                backgroundColor: ['#10b981', '#14b8a6', '#6366f1', '#f59e0b', '#eab308', '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: textColor } }
              },
              cutout: '65%'
            }
          });
          try { Object.seal(chart1); } catch (e) {}
          lmsChartInstances.kehadiran = chart1;
        }

        const ctx2 = document.getElementById('chartNilai');
        if (ctx2) {
          const old2 = Chart.getChart(ctx2) || lmsChartInstances.nilai;
          if (old2 && typeof old2.destroy === 'function') {
            old2.destroy();
          }

          const allNilai = this.nilai.map(n => Number(n.nilai)).filter(n => !isNaN(n) && n !== '');
          const range1 = allNilai.filter(n => n >= 90).length;
          const range2 = allNilai.filter(n => n >= 75 && n < 90).length;
          const range3 = allNilai.filter(n => n < 75).length;

          const chart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
              labels: ['Sangat Baik (90-100)', 'Tuntas (75-89)', 'Remedial (<75)'],
              datasets: [{
                label: 'Jumlah Nilai Siswa',
                data: [range1, range2, range3],
                backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
                borderRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { beginAtZero: true, ticks: { stepSize: 2, color: textColor }, grid: { color: gridColor } }
              }
            }
          });
          try { Object.seal(chart2); } catch (e) {}
          lmsChartInstances.nilai = chart2;
        }
      } catch (err) {
        console.warn('Gagal inisialisasi chart:', err);
      }
    },

    updateCharts() {
      try {
        if (typeof Chart === 'undefined') return;

        const isDark = this.darkMode;
        const textColor = isDark ? '#a1a1aa' : '#475569';
        const gridColor = isDark ? '#27272a' : '#e2e8f0';

        const ctx1 = document.getElementById('chartKehadiran');
        const chart1 = ctx1 ? (Chart.getChart(ctx1) || lmsChartInstances.kehadiran) : lmsChartInstances.kehadiran;
        if (chart1 && chart1.data && chart1.data.datasets && chart1.data.datasets[0]) {
          const stats = this.getWaliRecapStats();
          chart1.data.datasets[0].data = [stats.hadir, stats.tahfidz, stats.ptv, stats.organtri, stats.telat, stats.sakit, stats.izin, stats.dirumah, stats.tanpaket];
          if (chart1.options && chart1.options.plugins && chart1.options.plugins.legend && chart1.options.plugins.legend.labels) {
            chart1.options.plugins.legend.labels.color = textColor;
          }
          chart1.update();
        }

        const ctx2 = document.getElementById('chartNilai');
        const chart2 = ctx2 ? (Chart.getChart(ctx2) || lmsChartInstances.nilai) : lmsChartInstances.nilai;
        if (chart2 && chart2.data && chart2.data.datasets && chart2.data.datasets[0]) {
          const allNilai = this.nilai.map(n => Number(n.nilai)).filter(n => !isNaN(n) && n !== '');
          const range1 = allNilai.filter(n => n >= 90).length;
          const range2 = allNilai.filter(n => n >= 75 && n < 90).length;
          const range3 = allNilai.filter(n => n < 75).length;
          chart2.data.datasets[0].data = [range1, range2, range3];
          if (chart2.options && chart2.options.scales) {
            if (chart2.options.scales.x && chart2.options.scales.x.ticks) {
              chart2.options.scales.x.ticks.color = textColor;
              chart2.options.scales.x.grid.color = gridColor;
            }
            if (chart2.options.scales.y && chart2.options.scales.y.ticks) {
              chart2.options.scales.y.ticks.color = textColor;
              chart2.options.scales.y.grid.color = gridColor;
            }
          }
          chart2.update();
        }
      } catch (err) {
        console.warn('Gagal update chart:', err);
      }
    }
  }));
});
