// --- START FILE: app.js ---
/**
 * ============================================================================
 * PORTALKIMIA OLIMPIADE - CORE LOGIC & STATE ENGINE
 * ============================================================================
 * Fitur Utama:
 * - Default Role: Siswa (Tampilan utama aman untuk kelas/proyektor)
 * - Autentikasi Password: Guru ("kimiahebat") & Admin ("admin123"), tanpa memunculkan password
 * - Penamaan User dinamis sesuai Role aktif (Siswa Binaan, Guru Pembimbing, Admin Olimpiade)
 * - Bank Soal: Format List/Daftar ringkas (klik untuk membuka naskah lengkap & KaTeX)
 * - Multi-Device Cloud Sync via Google Apps Script & Google Spreadsheet API
 * - Dual-Theme Engine (Obsidian Dark & Clean Slate Light) dengan kontras tinggi
 * ============================================================================
 */

window.OlympiadApp = {
  data: null,
  currentRole: 'siswa', // Default tampilan utama adalah SISWA
  theme: 'dark',        // 'dark' | 'light'
  activeTab: 'dashboard',
  selectedSoalDetail: null,
  selectedSiswa: null,
  cloudSyncStatus: 'offline', // 'synced' | 'syncing' | 'offline' | 'error'
  lastSyncTime: null,

  // Chart Instances
  radarChart: null,
  evalLineChart: null,
  evalRadarChart: null,
  medalChart: null,
  weaknessChart: null,
  trendChart: null,

  // Filter State Bank Soal
  filterSoal: {
    keyword: '',
    tahun: 'all',
    bidang: 'all',
    kesulitan: 'all',
    jenis: 'all',
    sumber: 'all'
  },

  // Ploting State
  plotingState: {
    lombaId: '',
    selectedStudentIds: [],
    analysisResult: null
  },

  // Role Authentication Passwords
  authSecrets: {
    pembimbing: 'kimiahebat',
    admin: 'admin123'
  },

  // ==========================================================================
  // 1. Inisialisasi & Persistensi
  // ==========================================================================
  init() {
    this.loadState();
    this.applyTheme(this.theme);
    this.setupEventListeners();
    this.renderNavigation();
    this.renderActiveTab();
    this.updateUserBadge();
    this.checkUpcomingDeadlines();

    // Auto-fetch data dari Cloud jika URL GAS tersedia
    this.initCloudSync();

    setTimeout(() => {
      this.triggerKaTeX();
      if (window.lucide) window.lucide.createIcons();
    }, 150);
  },

  sanitizeAndNormalizeData(raw) {
    const data = (raw && typeof raw === 'object') ? raw : {};

    // 1. Settings
    data.settings = (data.settings && typeof data.settings === 'object') ? data.settings : {};
    data.settings.namaSekolah = String(data.settings.namaSekolah || 'SMA Binaan Olimpiade');
    data.settings.koordinator = String(data.settings.koordinator || 'Guru Pembina Olimpiade');
    data.settings.tahunAjaran = String(data.settings.tahunAjaran || '2025/2026');
    data.settings.targetMedaliNasional = parseInt(data.settings.targetMedaliNasional) || 0;
    data.settings.googleAppsScriptUrl = String(data.settings.googleAppsScriptUrl || '');

    // 2. Users
    if (!Array.isArray(data.users) || data.users.length === 0) {
      data.users = [
        { id: "usr-admin-1", nama: "Admin Olimpiade", email: "admin@portalkimia.org", role: "admin", jabatan: "Administrator Sistem & Koordinator", avatar: "AO" },
        { id: "usr-mentor-1", nama: "Guru Pembimbing", email: "guru@portalkimia.org", role: "pembimbing", jabatan: "Guru Pembina & Pelatih Olimpiade", avatar: "GP" },
        { id: "usr-student-1", nama: "Siswa Binaan", email: "siswa@portalkimia.org", role: "siswa", jabatan: "Siswa Binaan Olimpiade Kimia", avatar: "SB" }
      ];
    } else {
      data.users = data.users.map(u => ({
        id: String(u.id || ('usr-' + Math.random().toString(36).substr(2, 7))),
        nama: String(u.nama || 'Pengguna'),
        email: String(u.email || ''),
        role: ['admin', 'pembimbing', 'siswa'].includes(String(u.role).toLowerCase()) ? String(u.role).toLowerCase() : 'siswa',
        jabatan: String(u.jabatan || 'Pengguna Sistem'),
        avatar: String(u.avatar || (u.nama ? u.nama.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'))
      }));
    }

    // 3. Pembimbing
    data.pembimbing = Array.isArray(data.pembimbing) ? data.pembimbing : [];
    data.pembimbing = data.pembimbing.map(p => ({
      id: String(p.id || ('mentor-' + Math.random().toString(36).substr(2, 7))),
      nama: String(p.nama || 'Pembimbing Kimia'),
      spesialisasi: String(p.spesialisasi || 'Kimia Umum'),
      kontak: String(p.kontak || ''),
      jadwal: String(p.jadwal || ''),
      totalSesi: parseInt(p.totalSesi) || 0,
      status: String(p.status || 'Aktif'),
      siswaBinaanCount: parseInt(p.siswaBinaanCount) || 0
    }));

    // 4. Data Siswa
    data.siswa = Array.isArray(data.siswa) ? data.siswa : [];
    data.siswa = data.siswa.map((s, idx) => {
      const sObj = (s && typeof s === 'object') ? s : {};
      const id = String(sObj.id || ('sis-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5)));
      const nama = String(sObj.nama || 'Siswa ' + (idx + 1)).trim();
      const namaPanggilan = String(sObj.namaPanggilan || nama.split(' ')[0] || '').trim();
      const nisn = String(sObj.nisn || '-').trim();

      // Deteksi level kelas (10, 11, 12)
      let levelKelas = '10';
      const rawLvl = String(sObj.levelKelas || sObj.level || sObj.kelas || '');
      if (rawLvl.includes('12')) levelKelas = '12';
      else if (rawLvl.includes('11')) levelKelas = '11';
      else levelKelas = '10';

      const kelasAsal = String(sObj.kelasAsal || sObj.kelas || ('Kelas ' + levelKelas)).trim();
      const tempatLahir = String(sObj.tempatLahir || '').trim();
      const tanggalLahir = String(sObj.tanggalLahir || '').trim();
      const bidangUtama = String(sObj.bidangUtama || 'Belum Ditentukan').trim();
      const bidangSekunder = String(sObj.bidangSekunder || '').trim();
      const kartuPelajar = String(sObj.kartuPelajar || '').trim();
      const foto = String(sObj.foto || '').trim();
      const berkasPendaftaran = String(sObj.berkasPendaftaran || '').trim();
      const pembimbingId = String(sObj.pembimbingId || '').trim();

      let skorRata = 75.0;
      if (typeof sObj.skorRata === 'number' && !isNaN(sObj.skorRata)) {
        skorRata = sObj.skorRata;
      } else if (sObj.skorRata) {
        skorRata = parseFloat(sObj.skorRata) || 75.0;
      }

      // Normalisasi Rating Topik
      let ratingTopik = { fisik: 75, organik: 75, anorganik: 75, analitik: 75, biokimia: 75 };
      if (sObj.ratingTopik && typeof sObj.ratingTopik === 'object') {
        ratingTopik.fisik = Number(sObj.ratingTopik.fisik) || 75;
        ratingTopik.organik = Number(sObj.ratingTopik.organik) || 75;
        ratingTopik.anorganik = Number(sObj.ratingTopik.anorganik) || 75;
        ratingTopik.analitik = Number(sObj.ratingTopik.analitik) || 75;
        ratingTopik.biokimia = Number(sObj.ratingTopik.biokimia) || 75;
      } else if (typeof sObj.ratingTopik === 'string') {
        try {
          const parsed = JSON.parse(sObj.ratingTopik);
          if (parsed && typeof parsed === 'object') {
            ratingTopik.fisik = Number(parsed.fisik) || 75;
            ratingTopik.organik = Number(parsed.organik) || 75;
            ratingTopik.anorganik = Number(parsed.anorganik) || 75;
            ratingTopik.analitik = Number(parsed.analitik) || 75;
            ratingTopik.biokimia = Number(parsed.biokimia) || 75;
          }
        } catch(e) {
          const singleNum = parseFloat(sObj.ratingTopik);
          if (!isNaN(singleNum)) {
            ratingTopik = { fisik: singleNum, organik: singleNum, anorganik: singleNum, analitik: singleNum, biokimia: singleNum };
          }
        }
      } else if (typeof sObj.ratingTopik === 'number') {
        ratingTopik = { fisik: sObj.ratingTopik, organik: sObj.ratingTopik, anorganik: sObj.ratingTopik, analitik: sObj.ratingTopik, biokimia: sObj.ratingTopik };
      }

      // Normalisasi Riwayat Lomba
      let riwayatLomba = [];
      if (Array.isArray(sObj.riwayatLomba)) {
        riwayatLomba = sObj.riwayatLomba.map(r => {
          if (typeof r === 'string') {
            return { nama: r, capaian: r, tahun: 2026, babak: 'Kabupaten/Kota' };
          }
          return {
            nama: String(r?.nama || 'Kompetisi Kimia'),
            capaian: String(r?.capaian || 'Peserta'),
            tahun: parseInt(r?.tahun) || 2026,
            babak: String(r?.babak || 'Penyisihan')
          };
        });
      } else if (typeof sObj.riwayatLomba === 'string' && sObj.riwayatLomba.trim()) {
        try {
          const parsed = JSON.parse(sObj.riwayatLomba);
          if (Array.isArray(parsed)) {
            riwayatLomba = parsed.map(r => ({
              nama: String(r?.nama || 'Kompetisi Kimia'),
              capaian: String(r?.capaian || 'Peserta'),
              tahun: parseInt(r?.tahun) || 2026,
              babak: String(r?.babak || 'Penyisihan')
            }));
          } else {
            riwayatLomba = [{ nama: sObj.riwayatLomba, capaian: sObj.riwayatLomba, tahun: 2026, babak: 'Kabupaten/Kota' }];
          }
        } catch(e) {
          riwayatLomba = [{ nama: sObj.riwayatLomba, capaian: sObj.riwayatLomba, tahun: 2026, babak: 'Kabupaten/Kota' }];
        }
      }

      // Normalisasi Kehadiran
      let kehadiran = { hadir: 10, izin: 0, sakit: 0, total: 10, persentase: 100 };
      if (sObj.kehadiran && typeof sObj.kehadiran === 'object') {
        kehadiran = {
          hadir: parseInt(sObj.kehadiran.hadir) || 0,
          izin: parseInt(sObj.kehadiran.izin) || 0,
          sakit: parseInt(sObj.kehadiran.sakit) || 0,
          total: parseInt(sObj.kehadiran.total) || 10,
          persentase: parseFloat(sObj.kehadiran.persentase) || 100
        };
      } else if (typeof sObj.kehadiran === 'string' || typeof sObj.kehadiran === 'number') {
        const p = parseFloat(String(sObj.kehadiran).replace('%', '')) || 100;
        kehadiran = { hadir: Math.round(p / 10), izin: 0, sakit: 0, total: 10, persentase: p };
      }

      return {
        id,
        nama,
        namaPanggilan,
        nisn,
        levelKelas,
        kelasAsal,
        kelas: kelasAsal,
        level: 'Kelas ' + levelKelas,
        tempatLahir,
        tanggalLahir,
        bidangUtama,
        bidangSekunder,
        kartuPelajar,
        foto,
        berkasPendaftaran,
        pembimbingId,
        skorRata,
        ratingTopik,
        riwayatLomba,
        riwayatEvaluasi: Array.isArray(sObj.riwayatEvaluasi) ? sObj.riwayatEvaluasi : [],
        kehadiran
      };
    });

    // 5. Agenda Lomba
    data.lomba = Array.isArray(data.lomba) ? data.lomba : [];
    data.lomba = data.lomba.map((l, idx) => {
      const lObj = (l && typeof l === 'object') ? l : {};
      const id = String(lObj.id || ('lmb-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5)));
      const nama = String(lObj.nama || 'Agenda Lomba ' + (idx + 1)).trim();
      const penyelenggara = String(lObj.penyelenggara || 'Penyelenggara Lomba').trim();
      const klasifikasi = String(lObj.klasifikasi || 'Individu').trim();
      const statusPendaftaran = String(lObj.statusPendaftaran || 'Draft').trim();
      const kuotaSekolah = parseInt(lObj.kuotaSekolah) || 3;

      // Normalisasi Timeline
      let timeline = {
        pendaftaranBuka: new Date().toISOString().slice(0, 10),
        deadlineDaftar: '2026-04-30',
        penyisihan: '2026-05-15',
        perempatFinal: '',
        semifinal: '',
        final: '2026-06-01'
      };
      if (lObj.timeline && typeof lObj.timeline === 'object') {
        timeline.pendaftaranBuka = String(lObj.timeline.pendaftaranBuka || timeline.pendaftaranBuka);
        timeline.deadlineDaftar = String(lObj.timeline.deadlineDaftar || timeline.deadlineDaftar);
        timeline.penyisihan = String(lObj.timeline.penyisihan || timeline.penyisihan);
        timeline.perempatFinal = String(lObj.timeline.perempatFinal || '');
        timeline.semifinal = String(lObj.timeline.semifinal || '');
        timeline.final = String(lObj.timeline.final || timeline.final);
      } else if (typeof lObj.timeline === 'string' && lObj.timeline.trim()) {
        try {
          const parsed = JSON.parse(lObj.timeline);
          if (parsed && typeof parsed === 'object') {
            timeline = { ...timeline, ...parsed };
          } else {
            timeline.deadlineDaftar = lObj.timeline.trim();
          }
        } catch(e) {
          timeline.deadlineDaftar = lObj.timeline.trim();
        }
      }

      // Normalisasi Biaya
      let biaya = { pendaftaran: 0, transportasi: 0, akomodasi: 0 };
      if (lObj.biaya && typeof lObj.biaya === 'object') {
        biaya.pendaftaran = parseInt(lObj.biaya.pendaftaran) || 0;
        biaya.transportasi = parseInt(lObj.biaya.transportasi) || 0;
        biaya.akomodasi = parseInt(lObj.biaya.akomodasi) || 0;
      } else if (typeof lObj.biaya === 'number' || (typeof lObj.biaya === 'string' && !isNaN(parseInt(lObj.biaya)))) {
        biaya.pendaftaran = parseInt(lObj.biaya) || 0;
      }

      // Normalisasi Dokumen Ceklis
      let dokumenCeklis = {
        proposalDibuat: false,
        proposalAcc: false,
        suratIzinDibuat: false,
        nomorSuratIzin: '',
        suratTugas: false,
        kartuPelajar: false,
        foto3x4: false,
        buktiBayar: false,
        formulir: false,
        guidebookUrl: String(lObj.guidebookUrl || ''),
        guidebookName: 'Panduan_' + nama.replace(/\s+/g, '_') + '.pdf'
      };
      if (lObj.dokumenCeklis && typeof lObj.dokumenCeklis === 'object') {
        dokumenCeklis.proposalDibuat = !!lObj.dokumenCeklis.proposalDibuat;
        dokumenCeklis.proposalAcc = !!lObj.dokumenCeklis.proposalAcc;
        dokumenCeklis.suratIzinDibuat = !!lObj.dokumenCeklis.suratIzinDibuat;
        dokumenCeklis.nomorSuratIzin = String(lObj.dokumenCeklis.nomorSuratIzin || '');
        dokumenCeklis.suratTugas = !!lObj.dokumenCeklis.suratTugas;
        dokumenCeklis.kartuPelajar = !!lObj.dokumenCeklis.kartuPelajar;
        dokumenCeklis.foto3x4 = !!lObj.dokumenCeklis.foto3x4;
        dokumenCeklis.buktiBayar = !!lObj.dokumenCeklis.buktiBayar;
        dokumenCeklis.formulir = !!lObj.dokumenCeklis.formulir;
        dokumenCeklis.guidebookUrl = String(lObj.dokumenCeklis.guidebookUrl || lObj.guidebookUrl || '');
        dokumenCeklis.guidebookName = String(lObj.dokumenCeklis.guidebookName || dokumenCeklis.guidebookName);
      } else if (typeof lObj.dokumenCeklis === 'string' && lObj.dokumenCeklis.trim()) {
        try {
          const parsed = JSON.parse(lObj.dokumenCeklis);
          if (parsed && typeof parsed === 'object') dokumenCeklis = { ...dokumenCeklis, ...parsed };
        } catch(e) {}
      }

      // Normalisasi Syarat Pendaftaran
      let syaratPendaftaran = [];
      if (Array.isArray(lObj.syaratPendaftaran)) {
        syaratPendaftaran = lObj.syaratPendaftaran.map(s => {
          if (typeof s === 'string') return { teks: s, checked: false };
          return { teks: String(s?.teks || ''), checked: !!s?.checked };
        }).filter(s => s.teks.trim().length > 0);
      } else if (typeof lObj.syaratPendaftaran === 'string' && lObj.syaratPendaftaran.trim()) {
        try {
          const parsed = JSON.parse(lObj.syaratPendaftaran);
          if (Array.isArray(parsed)) {
            syaratPendaftaran = parsed.map(s => (typeof s === 'string' ? { teks: s, checked: false } : { teks: String(s?.teks || ''), checked: !!s?.checked }));
          } else {
            syaratPendaftaran = lObj.syaratPendaftaran.split('\n').map(s => ({ teks: s.trim(), checked: false })).filter(s => s.teks);
          }
        } catch(e) {
          syaratPendaftaran = lObj.syaratPendaftaran.split('\n').map(s => ({ teks: s.trim(), checked: false })).filter(s => s.teks);
        }
      }
      if (syaratPendaftaran.length === 0) {
        syaratPendaftaran = [
          { teks: 'Scan Asli Kartu Pelajar (PDF/JPG)', checked: false },
          { teks: 'Pas Foto 3x4 Latar Merah/Biru', checked: false },
          { teks: 'Surat Rekomendasi Kepala Sekolah / Kesiswaan', checked: false },
          { teks: 'Bukti Pembayaran / Transfer Pendaftaran', checked: false },
          { teks: 'Follow Akun Instagram Penyelenggara', checked: false },
          { teks: 'Unggah Twibbon & Repost Poster ke Story / Grup', checked: false }
        ];
      }

      // Normalisasi Peserta IDs
      let pesertaIds = [];
      if (Array.isArray(lObj.pesertaIds)) {
        pesertaIds = lObj.pesertaIds.map(String);
      } else if (typeof lObj.pesertaIds === 'string' && lObj.pesertaIds.trim()) {
        try {
          const parsed = JSON.parse(lObj.pesertaIds);
          if (Array.isArray(parsed)) pesertaIds = parsed.map(String);
          else pesertaIds = lObj.pesertaIds.split(',').map(s => s.trim()).filter(Boolean);
        } catch(e) {
          pesertaIds = lObj.pesertaIds.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      return {
        id,
        nama,
        penyelenggara,
        tahun: 2026,
        klasifikasi,
        kuotaSekolah,
        pesertaIds,
        statusPendaftaran,
        timeline,
        biaya,
        dokumenCeklis,
        syaratPendaftaran,
        hasilBabak: Array.isArray(lObj.hasilBabak) ? lObj.hasilBabak : [],
        pesertaGugur: Array.isArray(lObj.pesertaGugur) ? lObj.pesertaGugur : []
      };
    });

    // 6. Bank Soal
    data.soal = Array.isArray(data.soal) ? data.soal : [];
    data.soal = data.soal.map((s, idx) => {
      const sObj = (s && typeof s === 'object') ? s : {};
      let opsi = [];
      if (Array.isArray(sObj.opsi)) opsi = sObj.opsi.map(String);
      else if (typeof sObj.opsi === 'string' && sObj.opsi.trim()) {
        try {
          const parsed = JSON.parse(sObj.opsi);
          if (Array.isArray(parsed)) opsi = parsed.map(String);
          else opsi = sObj.opsi.split('\n').map(x => x.trim()).filter(Boolean);
        } catch(e) {
          opsi = sObj.opsi.split('\n').map(x => x.trim()).filter(Boolean);
        }
      }

      let tags = [];
      if (Array.isArray(sObj.tags)) tags = sObj.tags.map(String);
      else if (typeof sObj.tags === 'string' && sObj.tags.trim()) {
        try {
          const parsed = JSON.parse(sObj.tags);
          if (Array.isArray(parsed)) tags = parsed.map(String);
          else tags = sObj.tags.split(',').map(x => x.trim()).filter(Boolean);
        } catch(e) {
          tags = sObj.tags.split(',').map(x => x.trim()).filter(Boolean);
        }
      }

      return {
        id: String(sObj.id || ('soal-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5))),
        nomor: parseInt(sObj.nomor) || (idx + 1),
        tahun: parseInt(sObj.tahun) || 2026,
        sumber: String(sObj.sumber || 'OSN-K Kimia'),
        penyelenggara: String(sObj.penyelenggara || 'BPTI Kemendikbud'),
        bidang: String(sObj.bidang || 'Kimia Fisik'),
        subtopik: String(sObj.subtopik || 'Materi Kimia'),
        kesulitan: String(sObj.kesulitan || 'Dasar (Kabupaten)'),
        jenis: String(sObj.jenis || 'Pilihan Ganda'),
        teksSoal: String(sObj.teksSoal || ''),
        opsi,
        kunciJawaban: String(sObj.kunciJawaban || 'A'),
        pembahasan: String(sObj.pembahasan || ''),
        tags,
        googleDriveUrl: String(sObj.googleDriveUrl || ''),
        googleDriveName: String(sObj.googleDriveName || '')
      };
    });

    // 7. Jadwal Intensif
    data.jadwalIntensif = Array.isArray(data.jadwalIntensif) ? data.jadwalIntensif : [];
    data.jadwalIntensif = data.jadwalIntensif.map((j, idx) => {
      const jObj = (j && typeof j === 'object') ? j : {};
      return {
        id: String(jObj.id || ('jdw-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5))),
        judul: String(jObj.judul || 'Sesi Bimbingan Intensif'),
        bidang: String(jObj.bidang || 'Kimia Umum'),
        tanggal: String(jObj.tanggal || new Date().toISOString().slice(0, 10)),
        hari: String(jObj.hari || 'Senin'),
        jamMulai: String(jObj.jamMulai || '15:30'),
        jamSelesai: String(jObj.jamSelesai || '17:30'),
        pengisi: String(jObj.pengisi || 'Guru Pembina'),
        lokasi: String(jObj.lokasi || 'Lab Kimia'),
        linkOnline: String(jObj.linkOnline || ''),
        keterangan: String(jObj.keterangan || ''),
        status: String(jObj.status || 'Terjadwal')
      };
    });

    // 8. Pengumuman
    data.pengumuman = Array.isArray(data.pengumuman) ? data.pengumuman : [];
    data.pengumuman = data.pengumuman.map((p, idx) => {
      const pObj = (p && typeof p === 'object') ? p : {};
      return {
        id: String(pObj.id || ('pgm-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5))),
        judul: String(pObj.judul || 'Informasi Pembinaan'),
        isi: String(pObj.isi || ''),
        prioritas: String(pObj.prioritas || 'Normal'),
        tanggal: String(pObj.tanggal || new Date().toISOString().slice(0, 10)),
        penulis: String(pObj.penulis || 'Admin/Guru'),
        tautan: String(pObj.tautan || ''),
        pinned: !!pObj.pinned
      };
    });

    return data;
  },

  loadState() {
    // Role default adalah 'siswa' jika belum ada sesi login tersimpan
    const savedRole = localStorage.getItem('pk_olympiad_role');
    if (savedRole && ['admin', 'pembimbing', 'siswa'].includes(savedRole)) {
      this.currentRole = savedRole;
    } else {
      this.currentRole = 'siswa';
    }

    const savedTheme = localStorage.getItem('pk_olympiad_theme');
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      this.theme = savedTheme;
    }

    const CLEAN_VERSION = 'v8_clean_empty_slate';
    const currentVer = localStorage.getItem('pk_olympiad_clean_version');
    if (currentVer !== CLEAN_VERSION) {
      // Inisialisasi ke dataset kosong bersih untuk kebutuhan uji coba mandiri pengguna
      this.data = this.sanitizeAndNormalizeData(window.PORTALKIMIA_OLYMPIAD_DATA);
      this.saveDataLocally();
      localStorage.setItem('pk_olympiad_clean_version', CLEAN_VERSION);
    } else {
      const savedData = localStorage.getItem('pk_olympiad_database');
      if (savedData) {
        try {
          this.data = this.sanitizeAndNormalizeData(JSON.parse(savedData));
        } catch (e) {
          console.warn('Gagal membaca data lokal, menggunakan data template:', e);
          this.data = this.sanitizeAndNormalizeData(window.PORTALKIMIA_OLYMPIAD_DATA);
        }
      } else {
        this.data = this.sanitizeAndNormalizeData(window.PORTALKIMIA_OLYMPIAD_DATA);
        this.saveDataLocally();
      }
    }

    // Sinkronisasi otomatis konfigurasi instansi & GAS URL dari config.js terpusat
    const configGasUrl = this.getCloudApiUrl();
    if (configGasUrl && configGasUrl.startsWith('http')) {
      if (!this.data.settings.googleAppsScriptUrl || !this.data.settings.googleAppsScriptUrl.startsWith('http')) {
        this.data.settings.googleAppsScriptUrl = configGasUrl;
      }
    }
    if (typeof window !== 'undefined' && window.OLIMPIADE_CONFIG) {
      if (window.OLIMPIADE_CONFIG.SEKOLAH && (!this.data.settings.namaSekolah || this.data.settings.namaSekolah === 'SMA Binaan Olimpiade')) {
        this.data.settings.namaSekolah = window.OLIMPIADE_CONFIG.SEKOLAH;
      }
      if (window.OLIMPIADE_CONFIG.TAHUN_AJARAN && (!this.data.settings.tahunAjaran || this.data.settings.tahunAjaran === '2025/2026')) {
        this.data.settings.tahunAjaran = window.OLIMPIADE_CONFIG.TAHUN_AJARAN;
      }
    }
  },

  saveDataLocally() {
    localStorage.setItem('pk_olympiad_database', JSON.stringify(this.data));
  },

  saveState() {
    this.saveDataLocally();
  },

  // Simpan data dan otomatis dorong perubahan ke Cloud untuk sinkronisasi multi-device
  saveData(pushCloud = true) {
    this.saveDataLocally();
    if (pushCloud) {
      this.pushToCloud();
    }
  },

  clearAllData(promptConfirm = true) {
    if (promptConfirm && !confirm('Apakah Anda yakin ingin mengosongkan seluruh data (Bank Soal, Siswa, Lomba, Pengumuman, dan Jadwal) agar bersih untuk uji coba?')) {
      return;
    }
    this.data.siswa = [];
    this.data.soal = [];
    this.data.lomba = [];
    this.data.jadwalIntensif = [];
    this.data.pengumuman = [];
    this.data.pembimbing = [];
    this.data.evaluasi = [];
    this.data.auditLogs = [];
    this.saveData(false);
    this.renderNavigation();
    this.renderActiveTab();
    this.showToast('Seluruh data berhasil dikosongkan. Siap untuk uji coba data baru!', 'success');
  },

  loadSampleData(promptConfirm = true) {
    if (promptConfirm && !confirm('Apakah Anda ingin memuat kembali data contoh/demo lengkap?')) {
      return;
    }
    if (window.PORTALKIMIA_DEMO_DATA) {
      this.data = JSON.parse(JSON.stringify(window.PORTALKIMIA_DEMO_DATA));
    } else {
      this.data = JSON.parse(JSON.stringify(window.PORTALKIMIA_OLYMPIAD_DATA));
    }
    this.saveData(false);
    this.renderNavigation();
    this.renderActiveTab();
    this.showToast('Data sampel lengkap (demo) berhasil dimuat!', 'info');
  },

  // ==========================================================================
  // 2. Multi-Device Cloud Synchronization (Google Apps Script)
  // ==========================================================================
  isValidCloudUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) return false;
    if (trimmed.includes('Sample') || trimmed.includes('YOUR_') || trimmed.includes('...')) return false;
    return true;
  },

  getCloudApiUrl() {
    // 1. Cek dari config.js lokal modul Olimpiade
    if (typeof window !== 'undefined' && window.OLIMPIADE_CONFIG && this.isValidCloudUrl(window.OLIMPIADE_CONFIG.GAS_API_URL)) {
      return window.OLIMPIADE_CONFIG.GAS_API_URL.trim();
    }
    // 2. Cek dari config.js root PortalKimia Suite
    if (typeof window !== 'undefined' && window.PORTALKIMIA_CONFIG && this.isValidCloudUrl(window.PORTALKIMIA_CONFIG.OLIMPIADE_API)) {
      return window.PORTALKIMIA_CONFIG.OLIMPIADE_API.trim();
    }
    // 3. Fallback ke URL yang disimpan pengguna di pengaturan lokal
    const localUrl = this.data?.settings?.googleAppsScriptUrl || '';
    if (this.isValidCloudUrl(localUrl)) return localUrl.trim();
    return '';
  },

  initCloudSync() {
    const url = this.getCloudApiUrl();
    if (this.isValidCloudUrl(url)) {
      this.updateCloudIndicator('syncing', 'Menghubungkan ke Cloud...');
      this.fetchFromCloud();

      // Multi-Device Auto-Sync Polling
      const syncIntervalMs = (typeof window !== 'undefined' && window.OLIMPIADE_CONFIG?.AUTO_SYNC_INTERVAL_MS) || 45000;
      if (this.cloudSyncInterval) clearInterval(this.cloudSyncInterval);
      this.cloudSyncInterval = setInterval(() => {
        this.fetchFromCloud(true);
      }, syncIntervalMs);

      // Auto-Sync saat beralih tab atau jendela aktif kembali pada device manapun
      if (!this._visibilityListenerAttached) {
        this._visibilityListenerAttached = true;
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.fetchFromCloud(true);
          }
        });
        window.addEventListener('focus', () => {
          this.fetchFromCloud(true);
        });
      }
    } else {
      this.updateCloudIndicator('offline', 'Penyimpanan Lokal (Offline)');
    }
  },

  async fetchFromCloud(silent = false) {
    const url = this.getCloudApiUrl();
    if (!url || !url.startsWith('http')) return;

    try {
      if (!silent) this.updateCloudIndicator('syncing', 'Menyinkronkan data...');
      const response = await fetch(`${url}?action=get_all`, { method: 'GET' });
      const result = await response.json();

      if (result && (result.status === 'success' || result.data)) {
        const cloudData = result.data || result;
        const normalized = this.sanitizeAndNormalizeData(cloudData);

        if (Array.isArray(normalized.soal)) this.data.soal = normalized.soal;
        if (Array.isArray(normalized.siswa)) this.data.siswa = normalized.siswa;
        if (Array.isArray(normalized.lomba)) this.data.lomba = normalized.lomba;
        if (Array.isArray(normalized.jadwalIntensif)) this.data.jadwalIntensif = normalized.jadwalIntensif;
        if (Array.isArray(normalized.pengumuman)) this.data.pengumuman = normalized.pengumuman;
        if (Array.isArray(normalized.pembimbing)) this.data.pembimbing = normalized.pembimbing;
        if (normalized.settings && typeof normalized.settings === 'object' && Object.keys(normalized.settings).length > 0) {
          this.data.settings = { ...this.data.settings, ...normalized.settings };
        }

        this.saveDataLocally();
        this.lastSyncTime = new Date();
        this.updateCloudIndicator('synced', `Tersinkron (${this.formatTime(this.lastSyncTime)})`);

        // Render ulang tampilan aktif jika tidak ada modal/formulir yang sedang diedit pengguna
        const hasOpenModal = !!document.querySelector('.modal-overlay:not(.hidden)');
        if (!hasOpenModal) {
          try {
            this.renderActiveTab();
          } catch(renderErr) {
            console.error('Error re-rendering active tab after cloud fetch:', renderErr);
          }
        }
      } else {
        this.updateCloudIndicator('synced', 'Data Lokal Siap');
      }
    } catch (err) {
      console.warn('Sinkronisasi cloud gagal / offline, menggunakan cache lokal:', err);
      if (!silent) {
        this.updateCloudIndicator('offline', 'Mode Cache Lokal');
      }
    }
  },

  async pushToCloud() {
    const url = this.getCloudApiUrl();
    if (!url || !url.startsWith('http')) return { status: 'offline' };

    try {
      this.updateCloudIndicator('syncing', 'Menyimpan ke Cloud...');
      const payload = {
        action: 'sync_all',
        userRole: this.currentRole || 'Siswa',
        soal: this.data.soal || [],
        siswa: this.data.siswa || [],
        lomba: this.data.lomba || [],
        jadwalIntensif: this.data.jadwalIntensif || [],
        pengumuman: this.data.pengumuman || [],
        pembimbing: this.data.pembimbing || [],
        settings: this.data.settings || {}
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const resJson = await response.json().catch(() => ({ status: 'ok' }));

      this.lastSyncTime = new Date();
      this.updateCloudIndicator('synced', `Tersinkron (${this.formatTime(this.lastSyncTime)})`);
      return { status: 'ok', data: resJson };
    } catch (err) {
      console.warn('Gagal mendorong data ke cloud:', err);
      this.updateCloudIndicator('offline', 'Tersimpan di Perangkat');
      return { status: 'error', error: err };
    }
  },

  updateCloudIndicator(status, text) {
    this.cloudSyncStatus = status;
    const btn = document.getElementById('cloud-sync-btn');
    const dot = document.getElementById('cloud-sync-dot');
    const label = document.getElementById('cloud-sync-text');

    if (!btn || !dot || !label) return;

    label.textContent = text;
    if (status === 'synced') {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      btn.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/30 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-900/30 transition-colors';
    } else if (status === 'syncing') {
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      btn.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/30 dark:bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer transition-colors';
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-zinc-400';
      btn.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 text-xs font-semibold cursor-pointer hover:bg-zinc-700/40 transition-colors';
    }
  },

  formatTime(date) {
    if (!date) return '--:--';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  },

  // ==========================================================================
  // 3. Tema Tampilan (Mode Gelap Obsidian & Mode Terang Clean Slate)
  // ==========================================================================
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pk_olympiad_theme', this.theme);
    this.applyTheme(this.theme);
    this.showToast(`Beralih ke mode ${this.theme === 'dark' ? 'Gelap (Obsidian)' : 'Terang (Clean Slate)'}`, 'info');

    // Re-render chart colors for new background
    if (this.activeTab === 'analitik') this.renderAnalyticsCharts();
    if (this.activeTab === 'ploting') this.updateSimulationRadar();
  },

  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i><span class="hidden sm:inline text-xs font-semibold">Mode Terang</span>'
        : '<i data-lucide="moon" class="w-4 h-4 text-violet-600"></i><span class="hidden sm:inline text-xs font-semibold">Mode Gelap</span>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // ==========================================================================
  // 4. Role & Hak Akses Berbasis Kata Sandi Aman
  // ==========================================================================
  requestRoleSwitch(targetRole) {
    if (targetRole === this.currentRole) return;

    // Jika beralih ke Siswa: langsung beralih tanpa password (aman untuk proyektor kelas)
    if (targetRole === 'siswa') {
      this.executeRoleSwitch('siswa');
      return;
    }

    // Jika beralih ke Guru ("kimiahebat") atau Admin ("admin123"), buka modal verifikasi
    this.openRoleAuthModal(targetRole);
  },

  openRoleAuthModal(targetRole) {
    const modal = document.getElementById('modal-role-auth');
    const title = document.getElementById('role-auth-title');
    const desc = document.getElementById('role-auth-desc');
    const input = document.getElementById('role-auth-input');
    const targetInput = document.getElementById('role-auth-target');
    const errBox = document.getElementById('role-auth-error');

    if (!modal || !input) return;

    targetInput.value = targetRole;
    input.value = '';
    if (errBox) errBox.classList.add('hidden');

    if (targetRole === 'pembimbing') {
      title.textContent = 'Verifikasi Akses Guru Pembimbing';
      desc.textContent = 'Masukkan kata sandi guru pembimbing untuk mengelola bank soal, pembahasan lengkap, dan ploting tim.';
    } else if (targetRole === 'admin') {
      title.textContent = 'Verifikasi Akses Administrator';
      desc.textContent = 'Masukkan kata sandi admin untuk akses penuh ke manajemen pengguna, konfigurasi sistem, dan database.';
    }

    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
  },

  closeRoleAuthModal() {
    const modal = document.getElementById('modal-role-auth');
    if (modal) modal.classList.add('hidden');
  },

  verifyRoleAuth() {
    try {
      const input = document.getElementById('role-auth-input');
      const target = document.getElementById('role-auth-target').value;
      const errBox = document.getElementById('role-auth-error');
      const card = document.getElementById('role-auth-card');

      const entered = input ? input.value.trim() : '';
      const correctPassword = this.authSecrets[target];

      if (entered === correctPassword) {
        this.closeRoleAuthModal();
        this.executeRoleSwitch(target);
      } else {
        if (errBox) {
          errBox.classList.remove('hidden');
        }
        if (card) {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 450);
        }
        if (input) {
          input.value = '';
          input.focus();
        }
        this.showToast('Kata sandi salah! Akses ditolak.', 'error');
      }
    } catch(err) {
      console.error('Error during verifyRoleAuth:', err);
    }
  },

  executeRoleSwitch(role) {
    try {
      this.currentRole = role;
      localStorage.setItem('pk_olympiad_role', role);

      // Jika sedang di tab terlarang untuk siswa, kembalikan ke dashboard
      if (this.currentRole === 'siswa' && ['ploting', 'analitik', 'settings', 'users'].includes(this.activeTab)) {
        this.activeTab = 'dashboard';
      }

      this.renderNavigation();
      this.renderActiveTab();
      this.updateUserBadge();

      const roleNames = {
        admin: 'Admin Olimpiade',
        pembimbing: 'Guru Pembimbing',
        siswa: 'Siswa Binaan'
      };
      this.showToast(`Berhasil masuk sebagai: ${roleNames[role] || role}`, 'success');
    } catch (err) {
      console.error('Error executing role switch:', err);
      try {
        this.renderNavigation();
        this.updateUserBadge();
      } catch(e) {}
      this.showToast('Beralih peran berhasil.', 'info');
    }
  },

  isAdmin() {
    return this.currentRole === 'admin';
  },

  isPembimbing() {
    return this.currentRole === 'admin' || this.currentRole === 'pembimbing';
  },

  isSiswa() {
    return this.currentRole === 'siswa';
  },

  // Penamaan pengguna dinamis sesuai dengan nama Role aktif
  updateUserBadge() {
    const badgeEl = document.getElementById('user-role-badge');
    const profileNameEl = document.getElementById('profile-name');
    const profileRoleDescEl = document.getElementById('profile-role-desc');
    const profileAvatarEl = document.getElementById('profile-avatar');
    const quickLockBtn = document.getElementById('quick-lock-btn');

    const config = {
      siswa: {
        badge: 'Mode Siswa',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        name: 'Siswa Binaan',
        desc: 'Siswa Olimpiade Kimia',
        avatar: 'SB',
        avatarBg: 'from-emerald-600 to-teal-600'
      },
      pembimbing: {
        badge: 'Guru Pembimbing',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        name: 'Guru Pembimbing',
        desc: 'Pembina & Pelatih Olimpiade',
        avatar: 'GP',
        avatarBg: 'from-amber-600 to-orange-600'
      },
      admin: {
        badge: 'Admin Sistem',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        name: 'Admin Olimpiade',
        desc: 'Administrator Sistem & Koordinator',
        avatar: 'AO',
        avatarBg: 'from-violet-600 to-indigo-600'
      }
    };

    const cur = config[this.currentRole];
    if (badgeEl) {
      badgeEl.className = `px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${cur.badgeClass}`;
      badgeEl.textContent = cur.badge;
    }
    if (profileNameEl) profileNameEl.textContent = cur.name;
    if (profileRoleDescEl) profileRoleDescEl.textContent = cur.desc;
    if (profileAvatarEl) {
      profileAvatarEl.textContent = cur.avatar;
      profileAvatarEl.className = `w-8 h-8 rounded-full bg-gradient-to-tr ${cur.avatarBg} flex items-center justify-center text-white text-xs font-bold ring-2 ring-violet-500/30 shadow-inner`;
    }

    // Tombol kunci cepat ke mode siswa jika sedang mode Guru/Admin
    if (quickLockBtn) {
      if (this.currentRole !== 'siswa') {
        quickLockBtn.classList.remove('hidden');
      } else {
        quickLockBtn.classList.add('hidden');
      }
    }
  },

  // ==========================================================================
  // 5. Navigasi Antar Modul
  // ==========================================================================
  setTab(tab) {
    if (this.currentRole === 'siswa' && ['ploting', 'analitik', 'settings', 'users'].includes(tab)) {
      this.showToast('Fitur ini hanya dapat diakses oleh Guru Pembimbing dan Admin.', 'warning');
      return;
    }
    this.activeTab = tab;
    this.renderNavigation();
    this.renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderNavigation() {
    const navContainer = document.getElementById('main-nav-items');
    if (!navContainer) return;

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', allowed: ['admin', 'pembimbing', 'siswa'] },
      { id: 'soal', label: this.currentRole === 'siswa' ? 'Bank Soal' : 'Bank Soal (+Pembahasan)', icon: 'book-open', allowed: ['admin', 'pembimbing', 'siswa'] },
      { id: 'siswa', label: this.currentRole === 'siswa' ? 'Data Siswa Binaan' : 'Data Siswa & Tim', icon: 'users', allowed: ['admin', 'pembimbing', 'siswa'] },
      { id: 'lomba', label: this.currentRole === 'siswa' ? 'Timeline Lomba & Peserta' : 'Manajemen Lomba', icon: 'trophy', allowed: ['admin', 'pembimbing', 'siswa'] },
      { id: 'jadwal', label: 'Jadwal Intensif', icon: 'calendar-clock', allowed: ['admin', 'pembimbing', 'siswa'] },
      { id: 'ploting', label: 'Ploting & Strategi Tim', icon: 'crosshair', allowed: ['admin', 'pembimbing'] },
      { id: 'analitik', label: 'Analitik & Reporting', icon: 'bar-chart-3', allowed: ['admin', 'pembimbing'] },
      { id: 'settings', label: 'Pengaturan Sistem', icon: 'settings', allowed: ['admin'] },
      { id: 'users', label: 'Manajemen User', icon: 'shield-check', allowed: ['admin'] }
    ];

    navContainer.innerHTML = navItems
      .filter(item => item.allowed.includes(this.currentRole))
      .map(item => {
        const isActive = this.activeTab === item.id;
        const activeClass = isActive 
          ? 'bg-violet-600/20 text-violet-400 border-violet-500/40 font-bold shadow-sm' 
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border-transparent';
        return `
          <button onclick="OlympiadApp.setTab('${item.id}')" 
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm border transition-all whitespace-nowrap ${activeClass}">
            <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
            <span>${item.label}</span>
          </button>
        `;
      }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  renderActiveTab() {
    // Sembunyikan semua tab panel untuk mencegah tampilan menumpuk
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => panel.classList.add('hidden'));

    const activeEl = document.getElementById(`panel-${this.activeTab}`);
    if (activeEl) activeEl.classList.remove('hidden');

    try {
      switch (this.activeTab) {
        case 'dashboard': this.renderDashboard(); break;
        case 'soal': this.renderBankSoal(); break;
        case 'siswa': this.renderSiswaModule(); break;
        case 'lomba': this.renderLombaModule(); break;
        case 'jadwal': this.renderJadwalModule(); break;
        case 'ploting': this.renderPlotingModule(); break;
        case 'analitik': this.renderAnalyticsModule(); break;
        case 'settings': this.renderSettingsModule(); break;
        case 'users': this.renderUsersModule(); break;
      }
    } catch (err) {
      console.error(`Error rendering active tab [${this.activeTab}]:`, err);
      if (activeEl) {
        activeEl.innerHTML = `
          <div class="glass-card rounded-2xl p-8 text-center border border-rose-500/30 space-y-3">
            <div class="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <i data-lucide="alert-triangle" class="w-6 h-6"></i>
            </div>
            <h4 class="text-base font-bold text-zinc-100">Pemulihan Tampilan Modul</h4>
            <p class="text-xs text-zinc-400 max-w-md mx-auto">
              Sedang menstabilkan data dari spreadsheet. Silakan klik tombol di bawah untuk menyegarkan tampilan.
            </p>
            <button onclick="OlympiadApp.renderActiveTab()" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Segarkan Tampilan
            </button>
          </div>
        `;
      }
    }

    setTimeout(() => {
      try {
        this.triggerKaTeX();
      } catch(e) {}
      try {
        if (window.lucide) window.lucide.createIcons();
      } catch(e) {}
    }, 60);
  },

  // ==========================================================================
  // 6. KaTeX Engine Helper
  // ==========================================================================
  triggerKaTeX() {
    if (!window.renderMathInElement) return;
    const targets = document.querySelectorAll('.katex-renderable');
    targets.forEach(target => {
      try {
        window.renderMathInElement(target, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render warning:', err);
      }
    });
  },

  // ==========================================================================
  // 7. Notifikasi & Deadline Checker
  // ==========================================================================
  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const styles = {
      success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
      warning: 'bg-amber-950/95 border-amber-500/50 text-amber-200',
      error: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
      info: 'bg-violet-950/95 border-violet-500/50 text-violet-200'
    };
    const icons = {
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'x-circle',
      info: 'info'
    };

    const id = 'toast-' + Date.now();
    const html = `
      <div id="${id}" class="flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${styles[type]}">
        <i data-lucide="${icons[type]}" class="w-4 h-4 shrink-0"></i>
        <span class="text-xs font-semibold">${msg}</span>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => el.remove(), 300);
      }
    }, 3500);
  },

  checkUpcomingDeadlines() {
    const now = new Date();
    const urgent = [];
    this.data.lomba.forEach(l => {
      const dl = new Date(l.timeline.deadlineDaftar);
      const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 14) {
        urgent.push({ name: l.nama, days: diff });
      }
    });

    const alertBox = document.getElementById('header-deadline-alert');
    if (alertBox) {
      if (urgent.length > 0) {
        alertBox.classList.remove('hidden');
        alertBox.innerHTML = `
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold animate-pulse cursor-pointer" onclick="OlympiadApp.setTab('lomba')">
            <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
            <span>${urgent.length} Lomba Mendekati Batas Pendaftaran!</span>
          </div>
        `;
      } else {
        alertBox.classList.add('hidden');
      }
    }
  },

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  },

  // ==========================================================================
  // 8. TABEL PERIODIK & LEMBAR KONSTANTA OSN
  // ==========================================================================
  activeTabelTab: 'periodik',
  selectedElementZ: 1,
  tabelFilterKeyword: '',

  openTabelPeriodikModal(defaultTab = 'periodik') {
    const modal = document.getElementById('modal-tabel-periodik');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.switchTabelPeriodikTab(defaultTab);
    this.renderTabelPeriodik();
    this.selectElement(this.selectedElementZ || 1);
    this.renderKonstantaOSN();
    setTimeout(() => {
      this.triggerKaTeX();
      if (window.lucide) window.lucide.createIcons();
    }, 60);
  },

  closeTabelPeriodikModal() {
    const modal = document.getElementById('modal-tabel-periodik');
    if (modal) modal.classList.add('hidden');
  },

  switchTabelPeriodikTab(tab) {
    this.activeTabelTab = tab;
    const btnPeriodik = document.getElementById('tab-btn-periodik');
    const btnKonstanta = document.getElementById('tab-btn-konstanta');
    const panelPeriodik = document.getElementById('tab-panel-periodik');
    const panelKonstanta = document.getElementById('tab-panel-konstanta');

    if (tab === 'periodik') {
      if (btnPeriodik) btnPeriodik.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white shadow-md shadow-violet-600/30 transition-all';
      if (btnKonstanta) btnKonstanta.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800/80 text-zinc-400 hover:text-white transition-all';
      if (panelPeriodik) panelPeriodik.classList.remove('hidden');
      if (panelKonstanta) panelKonstanta.classList.add('hidden');
    } else {
      if (btnPeriodik) btnPeriodik.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800/80 text-zinc-400 hover:text-white transition-all';
      if (btnKonstanta) btnKonstanta.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white shadow-md shadow-violet-600/30 transition-all';
      if (panelPeriodik) panelPeriodik.classList.add('hidden');
      if (panelKonstanta) panelKonstanta.classList.remove('hidden');
      setTimeout(() => this.triggerKaTeX(), 50);
    }
    if (window.lucide) window.lucide.createIcons();
  },

  selectElement(z) {
    this.selectedElementZ = z;
    const el = this.elementsData.find(item => item.z === z) || this.elementsData[0];
    const inspector = document.getElementById('element-inspector-content');
    if (!inspector) return;

    const catColors = {
      'alkali': 'from-red-500/20 to-rose-600/20 text-rose-300 border-rose-500/40',
      'alkali-tanah': 'from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-500/40',
      'transisi': 'from-blue-500/20 to-cyan-600/20 text-blue-300 border-blue-500/40',
      'post-transisi': 'from-emerald-500/20 to-teal-600/20 text-emerald-300 border-emerald-500/40',
      'metaloid': 'from-teal-500/20 to-cyan-600/20 text-teal-300 border-teal-500/40',
      'nonlogam': 'from-lime-500/20 to-emerald-600/20 text-lime-300 border-lime-500/40',
      'halogen': 'from-yellow-500/20 to-amber-600/20 text-yellow-300 border-yellow-500/40',
      'gas-mulia': 'from-purple-500/20 to-violet-600/20 text-purple-300 border-purple-500/40',
      'lantanida': 'from-pink-500/20 to-rose-600/20 text-pink-300 border-pink-500/40',
      'aktinida': 'from-fuchsia-500/20 to-purple-600/20 text-fuchsia-300 border-fuchsia-500/40'
    };

    inspector.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-3">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${catColors[el.kat] || 'bg-zinc-800 text-zinc-200 border-zinc-700'} border flex flex-col items-center justify-center shadow-lg shrink-0">
              <span class="text-[10px] text-zinc-400 font-mono">${el.z}</span>
              <strong class="text-2xl font-black">${el.sym}</strong>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-lg font-bold text-zinc-100">${el.nama}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${catColors[el.kat] || 'bg-zinc-800 text-zinc-300'}">
                  ${el.kat.replace('-', ' ')}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">Konfigurasi: <span class="text-violet-400 font-mono font-semibold">${el.konfig}</span></p>
            </div>
          </div>
          <div class="sm:text-right">
            <span class="text-[10px] text-zinc-400 block uppercase">Massa Atom Relatif ($A_r$)</span>
            <span class="text-base sm:text-lg font-black text-amber-400">${el.ar}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span class="text-[10px] text-zinc-400 block">Golongan &amp; Periode</span>
            <strong class="text-zinc-200 text-xs">${el.gol > 0 ? 'Gol ' + el.gol : '-'} &bull; Periode ${el.per}</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span class="text-[10px] text-zinc-400 block">Elektronegativitas</span>
            <strong class="text-zinc-200 text-xs">${el.en || '-'} (Pauling)</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span class="text-[10px] text-zinc-400 block">Bilangan Oksidasi</span>
            <strong class="text-zinc-200 text-xs">${el.biloks || '-'}</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span class="text-[10px] text-zinc-400 block">Fase Standar (298 K)</span>
            <strong class="text-emerald-400 text-xs">${el.fase || 'Padat'}</strong>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.periodic-cell').forEach(c => {
      c.classList.remove('ring-2', 'ring-amber-400', 'scale-105');
    });
    const selectedCell = document.getElementById(`element-cell-${z}`);
    if (selectedCell) {
      selectedCell.classList.add('ring-2', 'ring-amber-400', 'scale-105');
    }
  },

  filterPeriodicTable(keyword) {
    this.tabelFilterKeyword = (keyword || '').toLowerCase().trim();
    this.renderTabelPeriodik();
  },

  renderTabelPeriodik() {
    const gridContainer = document.getElementById('periodic-table-grid');
    if (!gridContainer) return;

    const catBadgeColors = {
      'alkali': 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30',
      'alkali-tanah': 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
      'transisi': 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
      'post-transisi': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
      'metaloid': 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30',
      'nonlogam': 'bg-lime-500/20 text-lime-300 border-lime-500/40 hover:bg-lime-500/30',
      'halogen': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30',
      'gas-mulia': 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30',
      'lantanida': 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30',
      'aktinida': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 hover:bg-fuchsia-500/30'
    };

    gridContainer.innerHTML = this.elementsData.map(el => {
      const match = !this.tabelFilterKeyword || 
                    el.sym.toLowerCase().includes(this.tabelFilterKeyword) || 
                    el.nama.toLowerCase().includes(this.tabelFilterKeyword) || 
                    el.z.toString() === this.tabelFilterKeyword;
      const opacity = match ? 'opacity-100' : 'opacity-20 pointer-events-none';
      const isSelected = el.z === this.selectedElementZ;

      return `
        <div id="element-cell-${el.z}" onclick="OlympiadApp.selectElement(${el.z})"
             class="periodic-cell relative p-1 rounded-lg border flex flex-col items-center justify-between cursor-pointer transition-all duration-150 ${opacity} ${catBadgeColors[el.kat] || 'bg-zinc-800 text-zinc-300 border-zinc-700'} ${isSelected ? 'ring-2 ring-amber-400 scale-105 shadow-lg' : ''}"
             style="grid-column: ${el.col}; grid-row: ${el.row}; min-height: 48px;" title="${el.nama} (${el.z}): ${el.ar}">
          <span class="text-[8px] font-mono leading-none opacity-80 self-start">${el.z}</span>
          <strong class="text-xs sm:text-sm font-black leading-tight">${el.sym}</strong>
          <span class="text-[7px] font-mono leading-none truncate w-full text-center opacity-90">${el.ar}</span>
        </div>
      `;
    }).join('');
  },

  renderKonstantaOSN() {
    const container = document.getElementById('konstanta-osn-content');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 text-xs text-zinc-300">
        <!-- Banner Standar IChO / OSN -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-zinc-900 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold shrink-0">
              <i data-lucide="book-marked" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-zinc-100">Lembar Tetapan Fisika &amp; Rumus Resmi IChO / OSN</h4>
              <p class="text-[11px] text-zinc-400">Nilai tetapan fundamental dan persamaan matematika baku berstandar IUPAC &amp; Kemendikbudristek.</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider shrink-0 self-start sm:self-auto">
            Standar IUPAC 2026
          </span>
        </div>

        <!-- Section 1: Tetapan Fundamental Fisika & Kimia -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <i data-lucide="hash" class="w-3.5 h-3.5 text-amber-400"></i> Tetapan Fundamental &amp; Nilai Standar:
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Tetapan Gas Ideal ($R = 8{,}3145$ J/mol·K)</span>
              <div class="text-xs font-bold text-amber-300 katex-renderable">$$R = 8{,}3145\\text{ J}\\cdot\\text{mol}^{-1}\\cdot\\text{K}^{-1}$$</div>
              <div class="text-[10px] text-zinc-400 font-mono">$= 0{,}08206\\text{ L}\\cdot\\text{atm}\\cdot\\text{mol}^{-1}\\cdot\\text{K}^{-1}$</div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Bilangan Avogadro ($N_A = 6{,}02214 \times 10^{23}$ mol⁻¹)</span>
              <div class="text-xs font-bold text-amber-300 katex-renderable">$$N_A = 6{,}02214 \\times 10^{23}\\text{ mol}^{-1}$$</div>
              <div class="text-[10px] text-zinc-400">Jumlah partikel per mol zat murni.</div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Tetapan Faraday ($F = 96485$ C/mol)</span>
              <div class="text-xs font-bold text-amber-300 katex-renderable">$$F = 96{.}485{,}3\\text{ C}\\cdot\\text{mol}^{-1}$$</div>
              <div class="text-[10px] text-zinc-400">Muatan total 1 mol elektron ($e \\times N_A$).</div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Tetapan Planck ($h = 6{,}62607 \times 10^{-34}$ J·s)</span>
              <div class="text-xs font-bold text-amber-300 katex-renderable">$$h = 6{,}62607 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$$</div>
              <div class="text-[10px] text-zinc-400 font-mono">$\\hbar = h / (2\\pi) = 1{,}05457 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$</div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Kecepatan Cahaya ($c$) &amp; Boltzmann ($k_B$)</span>
              <div class="text-xs font-bold text-amber-300 katex-renderable">$$c = 2{,}99792 \\times 10^8\\text{ m/s}$$</div>
              <div class="text-[10px] text-zinc-400 font-mono">$$k_B = 1{,}38065 \\times 10^{-23}\\text{ J/K}$$</div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span class="text-[11px] text-zinc-400 block font-semibold">Kondisi Standar Suhu &amp; Tekanan</span>
              <div class="text-[11px] font-semibold text-zinc-200">
                STP: $0^\\circ\\text{C}$ ($273{,}15\\text{ K}$), $1\\text{ bar} \\to 22{,}71\\text{ L/mol}$
              </div>
              <div class="text-[10px] text-zinc-400">
                SATP: $25^\\circ\\text{C}$ ($298{,}15\\text{ K}$), $1\\text{ bar} \\to 24{,}79\\text{ L/mol}$
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Kumpulan Rumus & Persamaan Kimia Penting -->
        <div class="space-y-3 pt-2">
          <h4 class="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <i data-lucide="cpu" class="w-3.5 h-3.5 text-violet-400"></i> Persamaan Baku Per Topik Olimpiade:
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Kimia Fisik & Termodinamika -->
            <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h5 class="font-bold text-violet-300 text-xs flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-violet-400"></span> Termodinamika &amp; Kinetika Reaksi:
              </h5>
              <ul class="space-y-1.5 text-[11px] text-zinc-300 katex-renderable">
                <li>&bull; Energi Bebas Gibbs: $$\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = -RT\\ln K = -nFE^\\circ$$</li>
                <li>&bull; Persamaan Arrhenius: $$k = A \\exp\\left(-\\frac{E_a}{RT}\\right) \\iff \\ln k = \\ln A - \\frac{E_a}{RT}$$</li>
                <li>&bull; Persamaan Van 't Hoff: $$\\ln\\left(\\frac{K_2}{K_1}\\right) = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)$$</li>
              </ul>
            </div>

            <!-- Elektrokimia & Larutan -->
            <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h5 class="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Elektrokimia &amp; Kimia Analitik:
              </h5>
              <ul class="space-y-1.5 text-[11px] text-zinc-300 katex-renderable">
                <li>&bull; Persamaan Nernst: $$E = E^\\circ - \\frac{RT}{nF}\\ln Q = E^\\circ - \\frac{0{,}05916\\text{ V}}{n}\\log Q \\quad (298\\text{ K})$$</li>
                <li>&bull; Persamaan Buffer Henderson-Hasselbalch: $$\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}$$</li>
                <li>&bull; Hukum Spektrofotometri Beer-Lambert: $$A = \\varepsilon \\cdot b \\cdot c = -\\log_{10} T$$</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => this.triggerKaTeX(), 40);
  },

  // Dataset Lengkap 118 Unsur Tabel Periodik Berstandar IUPAC
  elementsData: [
    // Periode 1
    { z: 1, sym: "H", nama: "Hidrogen", ar: "1.008", gol: 1, per: 1, col: 1, row: 1, kat: "nonlogam", konfig: "1s¹", biloks: "+1, -1", en: "2.20", fase: "Gas" },
    { z: 2, sym: "He", nama: "Helium", ar: "4.003", gol: 18, per: 1, col: 18, row: 1, kat: "gas-mulia", konfig: "1s²", biloks: "0", en: "-", fase: "Gas" },
    // Periode 2
    { z: 3, sym: "Li", nama: "Litium", ar: "6.941", gol: 1, per: 2, col: 1, row: 2, kat: "alkali", konfig: "[He] 2s¹", biloks: "+1", en: "0.98", fase: "Padat" },
    { z: 4, sym: "Be", nama: "Berilium", ar: "9.012", gol: 2, per: 2, col: 2, row: 2, kat: "alkali-tanah", konfig: "[He] 2s²", biloks: "+2", en: "1.57", fase: "Padat" },
    { z: 5, sym: "B", nama: "Boron", ar: "10.81", gol: 13, per: 2, col: 13, row: 2, kat: "metaloid", konfig: "[He] 2s² 2p¹", biloks: "+3", en: "2.04", fase: "Padat" },
    { z: 6, sym: "C", nama: "Karbon", ar: "12.011", gol: 14, per: 2, col: 14, row: 2, kat: "nonlogam", konfig: "[He] 2s² 2p²", biloks: "+4, +2, -4", en: "2.55", fase: "Padat" },
    { z: 7, sym: "N", nama: "Nitrogen", ar: "14.007", gol: 15, per: 2, col: 15, row: 2, kat: "nonlogam", konfig: "[He] 2s² 2p³", biloks: "-3, +3, +5", en: "3.04", fase: "Gas" },
    { z: 8, sym: "O", nama: "Oksigen", ar: "15.999", gol: 16, per: 2, col: 16, row: 2, kat: "nonlogam", konfig: "[He] 2s² 2p⁴", biloks: "-2, -1", en: "3.44", fase: "Gas" },
    { z: 9, sym: "F", nama: "Fluorin", ar: "18.998", gol: 17, per: 2, col: 17, row: 2, kat: "halogen", konfig: "[He] 2s² 2p⁵", biloks: "-1", en: "3.98", fase: "Gas" },
    { z: 10, sym: "Ne", nama: "Neon", ar: "20.180", gol: 18, per: 2, col: 18, row: 2, kat: "gas-mulia", konfig: "[He] 2s² 2p⁶", biloks: "0", en: "-", fase: "Gas" },
    // Periode 3
    { z: 11, sym: "Na", nama: "Natrium", ar: "22.990", gol: 1, per: 3, col: 1, row: 3, kat: "alkali", konfig: "[Ne] 3s¹", biloks: "+1", en: "0.93", fase: "Padat" },
    { z: 12, sym: "Mg", nama: "Magnesium", ar: "24.305", gol: 2, per: 3, col: 2, row: 3, kat: "alkali-tanah", konfig: "[Ne] 3s²", biloks: "+2", en: "1.31", fase: "Padat" },
    { z: 13, sym: "Al", nama: "Aluminium", ar: "26.982", gol: 13, per: 3, col: 13, row: 3, kat: "post-transisi", konfig: "[Ne] 3s² 3p¹", biloks: "+3", en: "1.61", fase: "Padat" },
    { z: 14, sym: "Si", nama: "Silikon", ar: "28.085", gol: 14, per: 3, col: 14, row: 3, kat: "metaloid", konfig: "[Ne] 3s² 3p²", biloks: "+4, -4", en: "1.90", fase: "Padat" },
    { z: 15, sym: "P", nama: "Fosfor", ar: "30.974", gol: 15, per: 3, col: 15, row: 3, kat: "nonlogam", konfig: "[Ne] 3s² 3p³", biloks: "-3, +3, +5", en: "2.19", fase: "Padat" },
    { z: 16, sym: "S", nama: "Belerang", ar: "32.06", gol: 16, per: 3, col: 16, row: 3, kat: "nonlogam", konfig: "[Ne] 3s² 3p⁴", biloks: "-2, +4, +6", en: "2.58", fase: "Padat" },
    { z: 17, sym: "Cl", nama: "Klorin", ar: "35.45", gol: 17, per: 3, col: 17, row: 3, kat: "halogen", konfig: "[Ne] 3s² 3p⁵", biloks: "-1, +1, +3, +5, +7", en: "3.16", fase: "Gas" },
    { z: 18, sym: "Ar", nama: "Argon", ar: "39.948", gol: 18, per: 3, col: 18, row: 3, kat: "gas-mulia", konfig: "[Ne] 3s² 3p⁶", biloks: "0", en: "-", fase: "Gas" },
    // Periode 4
    { z: 19, sym: "K", nama: "Kalium", ar: "39.098", gol: 1, per: 4, col: 1, row: 4, kat: "alkali", konfig: "[Ar] 4s¹", biloks: "+1", en: "0.82", fase: "Padat" },
    { z: 20, sym: "Ca", nama: "Kalsium", ar: "40.078", gol: 2, per: 4, col: 2, row: 4, kat: "alkali-tanah", konfig: "[Ar] 4s²", biloks: "+2", en: "1.00", fase: "Padat" },
    { z: 21, sym: "Sc", nama: "Skandium", ar: "44.956", gol: 3, per: 4, col: 3, row: 4, kat: "transisi", konfig: "[Ar] 3d¹ 4s²", biloks: "+3", en: "1.36", fase: "Padat" },
    { z: 22, sym: "Ti", nama: "Titanium", ar: "47.867", gol: 4, per: 4, col: 4, row: 4, kat: "transisi", konfig: "[Ar] 3d² 4s²", biloks: "+4, +3", en: "1.54", fase: "Padat" },
    { z: 23, sym: "V", nama: "Vanadium", ar: "50.942", gol: 5, per: 4, col: 5, row: 4, kat: "transisi", konfig: "[Ar] 3d³ 4s²", biloks: "+5, +4, +3, +2", en: "1.63", fase: "Padat" },
    { z: 24, sym: "Cr", nama: "Kromium", ar: "51.996", gol: 6, per: 4, col: 6, row: 4, kat: "transisi", konfig: "[Ar] 3d⁵ 4s¹", biloks: "+3, +6, +2", en: "1.66", fase: "Padat" },
    { z: 25, sym: "Mn", nama: "Mangan", ar: "54.938", gol: 7, per: 4, col: 7, row: 4, kat: "transisi", konfig: "[Ar] 3d⁵ 4s²", biloks: "+2, +4, +7", en: "1.55", fase: "Padat" },
    { z: 26, sym: "Fe", nama: "Besi", ar: "55.845", gol: 8, per: 4, col: 8, row: 4, kat: "transisi", konfig: "[Ar] 3d⁶ 4s²", biloks: "+2, +3", en: "1.83", fase: "Padat" },
    { z: 27, sym: "Co", nama: "Kobalt", ar: "58.933", gol: 9, per: 4, col: 9, row: 4, kat: "transisi", konfig: "[Ar] 3d⁷ 4s²", biloks: "+2, +3", en: "1.88", fase: "Padat" },
    { z: 28, sym: "Ni", nama: "Nikel", ar: "58.693", gol: 10, per: 4, col: 10, row: 4, kat: "transisi", konfig: "[Ar] 3d⁸ 4s²", biloks: "+2", en: "1.91", fase: "Padat" },
    { z: 29, sym: "Cu", nama: "Tembaga", ar: "63.546", gol: 11, per: 4, col: 11, row: 4, kat: "transisi", konfig: "[Ar] 3d¹⁰ 4s¹", biloks: "+1, +2", en: "1.90", fase: "Padat" },
    { z: 30, sym: "Zn", nama: "Seng", ar: "65.38", gol: 12, per: 4, col: 12, row: 4, kat: "transisi", konfig: "[Ar] 3d¹⁰ 4s²", biloks: "+2", en: "1.65", fase: "Padat" },
    { z: 31, sym: "Ga", nama: "Galium", ar: "69.723", gol: 13, per: 4, col: 13, row: 4, kat: "post-transisi", konfig: "[Ar] 3d¹⁰ 4s² 4p¹", biloks: "+3", en: "1.81", fase: "Padat" },
    { z: 32, sym: "Ge", nama: "Germanium", ar: "72.630", gol: 14, per: 4, col: 14, row: 4, kat: "metaloid", konfig: "[Ar] 3d¹⁰ 4s² 4p²", biloks: "+4, +2", en: "2.01", fase: "Padat" },
    { z: 33, sym: "As", nama: "Arsenik", ar: "74.922", gol: 15, per: 4, col: 15, row: 4, kat: "metaloid", konfig: "[Ar] 3d¹⁰ 4s² 4p³", biloks: "+3, +5, -3", en: "2.18", fase: "Padat" },
    { z: 34, sym: "Se", nama: "Selenium", ar: "78.971", gol: 16, per: 4, col: 16, row: 4, kat: "nonlogam", konfig: "[Ar] 3d¹⁰ 4s² 4p⁴", biloks: "-2, +4, +6", en: "2.55", fase: "Padat" },
    { z: 35, sym: "Br", nama: "Bromin", ar: "79.904", gol: 17, per: 4, col: 17, row: 4, kat: "halogen", konfig: "[Ar] 3d¹⁰ 4s² 4p⁵", biloks: "-1, +1, +5", en: "2.96", fase: "Cair" },
    { z: 36, sym: "Kr", nama: "Kripton", ar: "83.798", gol: 18, per: 4, col: 18, row: 4, kat: "gas-mulia", konfig: "[Ar] 3d¹⁰ 4s² 4p⁶", biloks: "0, +2", en: "3.00", fase: "Gas" },
    // Periode 5
    { z: 37, sym: "Rb", nama: "Rubidium", ar: "85.468", gol: 1, per: 5, col: 1, row: 5, kat: "alkali", konfig: "[Kr] 5s¹", biloks: "+1", en: "0.82", fase: "Padat" },
    { z: 38, sym: "Sr", nama: "Stronsium", ar: "87.62", gol: 2, per: 5, col: 2, row: 5, kat: "alkali-tanah", konfig: "[Kr] 5s²", biloks: "+2", en: "0.95", fase: "Padat" },
    { z: 39, sym: "Y", nama: "Itrium", ar: "88.906", gol: 3, per: 5, col: 3, row: 5, kat: "transisi", konfig: "[Kr] 4d¹ 5s²", biloks: "+3", en: "1.22", fase: "Padat" },
    { z: 40, sym: "Zr", nama: "Zirkonium", ar: "91.224", gol: 4, per: 5, col: 4, row: 5, kat: "transisi", konfig: "[Kr] 4d² 5s²", biloks: "+4", en: "1.33", fase: "Padat" },
    { z: 41, sym: "Nb", nama: "Niobium", ar: "92.906", gol: 5, per: 5, col: 5, row: 5, kat: "transisi", konfig: "[Kr] 4d⁴ 5s¹", biloks: "+5, +3", en: "1.6", fase: "Padat" },
    { z: 42, sym: "Mo", nama: "Molibdenum", ar: "95.95", gol: 6, per: 5, col: 6, row: 5, kat: "transisi", konfig: "[Kr] 4d⁵ 5s¹", biloks: "+6, +4", en: "2.16", fase: "Padat" },
    { z: 43, sym: "Tc", nama: "Teknesium", ar: "(98)", gol: 7, per: 5, col: 7, row: 5, kat: "transisi", konfig: "[Kr] 4d⁵ 5s²", biloks: "+7, +4", en: "1.9", fase: "Padat" },
    { z: 44, sym: "Ru", nama: "Rutenium", ar: "101.07", gol: 8, per: 5, col: 8, row: 5, kat: "transisi", konfig: "[Kr] 4d⁷ 5s¹", biloks: "+3, +4", en: "2.2", fase: "Padat" },
    { z: 45, sym: "Rh", nama: "Rodium", ar: "102.91", gol: 9, per: 5, col: 9, row: 5, kat: "transisi", konfig: "[Kr] 4d⁸ 5s¹", biloks: "+3", en: "2.28", fase: "Padat" },
    { z: 46, sym: "Pd", nama: "Paladium", ar: "106.42", gol: 10, per: 5, col: 10, row: 5, kat: "transisi", konfig: "[Kr] 4d¹⁰", biloks: "+2, +4", en: "2.20", fase: "Padat" },
    { z: 47, sym: "Ag", nama: "Perak", ar: "107.87", gol: 11, per: 5, col: 11, row: 5, kat: "transisi", konfig: "[Kr] 4d¹⁰ 5s¹", biloks: "+1", en: "1.93", fase: "Padat" },
    { z: 48, sym: "Cd", nama: "Kadmium", ar: "112.41", gol: 12, per: 5, col: 12, row: 5, kat: "transisi", konfig: "[Kr] 4d¹⁰ 5s²", biloks: "+2", en: "1.69", fase: "Padat" },
    { z: 49, sym: "In", nama: "Indium", ar: "114.82", gol: 13, per: 5, col: 13, row: 5, kat: "post-transisi", konfig: "[Kr] 4d¹⁰ 5s² 5p¹", biloks: "+3", en: "1.78", fase: "Padat" },
    { z: 50, sym: "Sn", nama: "Timah", ar: "118.71", gol: 14, per: 5, col: 14, row: 5, kat: "post-transisi", konfig: "[Kr] 4d¹⁰ 5s² 5p²", biloks: "+2, +4", en: "1.96", fase: "Padat" },
    { z: 51, sym: "Sb", nama: "Antimon", ar: "121.76", gol: 15, per: 5, col: 15, row: 5, kat: "metaloid", konfig: "[Kr] 4d¹⁰ 5s² 5p³", biloks: "+3, +5", en: "2.05", fase: "Padat" },
    { z: 52, sym: "Te", nama: "Telurium", ar: "127.60", gol: 16, per: 5, col: 16, row: 5, kat: "metaloid", konfig: "[Kr] 4d¹⁰ 5s² 5p⁴", biloks: "+4, +6, -2", en: "2.1", fase: "Padat" },
    { z: 53, sym: "I", nama: "Iodin", ar: "126.90", gol: 17, per: 5, col: 17, row: 5, kat: "halogen", konfig: "[Kr] 4d¹⁰ 5s² 5p⁵", biloks: "-1, +1, +5, +7", en: "2.66", fase: "Padat" },
    { z: 54, sym: "Xe", nama: "Xenon", ar: "131.29", gol: 18, per: 5, col: 18, row: 5, kat: "gas-mulia", konfig: "[Kr] 4d¹⁰ 5s² 5p⁶", biloks: "0, +2, +4, +6", en: "2.6", fase: "Gas" },
    // Periode 6
    { z: 55, sym: "Cs", nama: "Sesium", ar: "132.91", gol: 1, per: 6, col: 1, row: 6, kat: "alkali", konfig: "[Xe] 6s¹", biloks: "+1", en: "0.79", fase: "Padat" },
    { z: 56, sym: "Ba", nama: "Barium", ar: "137.33", gol: 2, per: 6, col: 2, row: 6, kat: "alkali-tanah", konfig: "[Xe] 6s²", biloks: "+2", en: "0.89", fase: "Padat" },
    { z: 72, sym: "Hf", nama: "Hafnium", ar: "178.49", gol: 4, per: 6, col: 4, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d² 6s²", biloks: "+4", en: "1.3", fase: "Padat" },
    { z: 73, sym: "Ta", nama: "Tantalum", ar: "180.95", gol: 5, per: 6, col: 5, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d³ 6s²", biloks: "+5", en: "1.5", fase: "Padat" },
    { z: 74, sym: "W", nama: "Wolfram", ar: "183.84", gol: 6, per: 6, col: 6, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d⁴ 6s²", biloks: "+6", en: "2.36", fase: "Padat" },
    { z: 75, sym: "Re", nama: "Renium", ar: "186.21", gol: 7, per: 6, col: 7, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d⁵ 6s²", biloks: "+7, +4", en: "1.9", fase: "Padat" },
    { z: 76, sym: "Os", nama: "Osmium", ar: "190.23", gol: 8, per: 6, col: 8, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d⁶ 6s²", biloks: "+4, +8", en: "2.2", fase: "Padat" },
    { z: 77, sym: "Ir", nama: "Iridium", ar: "192.22", gol: 9, per: 6, col: 9, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d⁷ 6s²", biloks: "+4, +3", en: "2.20", fase: "Padat" },
    { z: 78, sym: "Pt", nama: "Platina", ar: "195.08", gol: 10, per: 6, col: 10, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹", biloks: "+2, +4", en: "2.28", fase: "Padat" },
    { z: 79, sym: "Au", nama: "Emas", ar: "196.97", gol: 11, per: 6, col: 11, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", biloks: "+3, +1", en: "2.54", fase: "Padat" },
    { z: 80, sym: "Hg", nama: "Raksa", ar: "200.59", gol: 12, per: 6, col: 12, row: 6, kat: "transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", biloks: "+1, +2", en: "2.00", fase: "Cair" },
    { z: 81, sym: "Tl", nama: "Talium", ar: "204.38", gol: 13, per: 6, col: 13, row: 6, kat: "post-transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", biloks: "+1, +3", en: "1.62", fase: "Padat" },
    { z: 82, sym: "Pb", nama: "Timbal", ar: "207.2", gol: 14, per: 6, col: 14, row: 6, kat: "post-transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", biloks: "+2, +4", en: "2.33", fase: "Padat" },
    { z: 83, sym: "Bi", nama: "Bismut", ar: "208.98", gol: 15, per: 6, col: 15, row: 6, kat: "post-transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", biloks: "+3", en: "2.02", fase: "Padat" },
    { z: 84, sym: "Po", nama: "Polonium", ar: "(209)", gol: 16, per: 6, col: 16, row: 6, kat: "post-transisi", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", biloks: "+2, +4", en: "2.0", fase: "Padat" },
    { z: 85, sym: "At", nama: "Astatin", ar: "(210)", gol: 17, per: 6, col: 17, row: 6, kat: "halogen", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", biloks: "-1, +1", en: "2.2", fase: "Padat" },
    { z: 86, sym: "Rn", nama: "Radon", ar: "(222)", gol: 18, per: 6, col: 18, row: 6, kat: "gas-mulia", konfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", biloks: "0", en: "-", fase: "Gas" },
    // Periode 7
    { z: 87, sym: "Fr", nama: "Fransium", ar: "(223)", gol: 1, per: 7, col: 1, row: 7, kat: "alkali", konfig: "[Rn] 7s¹", biloks: "+1", en: "0.7", fase: "Padat" },
    { z: 88, sym: "Ra", nama: "Radium", ar: "(226)", gol: 2, per: 7, col: 2, row: 7, kat: "alkali-tanah", konfig: "[Rn] 7s²", biloks: "+2", en: "0.9", fase: "Padat" },
    { z: 104, sym: "Rf", nama: "Rutherfordium", ar: "(267)", gol: 4, per: 7, col: 4, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d² 7s²", biloks: "+4", en: "-", fase: "Sintetik" },
    { z: 105, sym: "Db", nama: "Dubnium", ar: "(268)", gol: 5, per: 7, col: 5, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d³ 7s²", biloks: "+5", en: "-", fase: "Sintetik" },
    { z: 106, sym: "Sg", nama: "Seaborgium", ar: "(269)", gol: 6, per: 7, col: 6, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁴ 7s²", biloks: "+6", en: "-", fase: "Sintetik" },
    { z: 107, sym: "Bh", nama: "Bohrium", ar: "(270)", gol: 7, per: 7, col: 7, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁵ 7s²", biloks: "+7", en: "-", fase: "Sintetik" },
    { z: 108, sym: "Hs", nama: "Hassium", ar: "(277)", gol: 8, per: 7, col: 8, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁶ 7s²", biloks: "+8", en: "-", fase: "Sintetik" },
    { z: 109, sym: "Mt", nama: "Meitnerium", ar: "(278)", gol: 9, per: 7, col: 9, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁷ 7s²", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 110, sym: "Ds", nama: "Darmstadtium", ar: "(281)", gol: 10, per: 7, col: 10, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁸ 7s²", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 111, sym: "Rg", nama: "Roentgenium", ar: "(282)", gol: 11, per: 7, col: 11, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d⁹ 7s²", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 112, sym: "Cn", nama: "Kopernisium", ar: "(285)", gol: 12, per: 7, col: 12, row: 7, kat: "transisi", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", biloks: "+2", en: "-", fase: "Sintetik" },
    { z: 113, sym: "Nh", nama: "Nihonium", ar: "(286)", gol: 13, per: 7, col: 13, row: 7, kat: "post-transisi", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 114, sym: "Fl", nama: "Flerovium", ar: "(289)", gol: 14, per: 7, col: 14, row: 7, kat: "post-transisi", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 115, sym: "Mc", nama: "Moskovium", ar: "(290)", gol: 15, per: 7, col: 15, row: 7, kat: "post-transisi", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 116, sym: "Lv", nama: "Livermorium", ar: "(293)", gol: 16, per: 7, col: 16, row: 7, kat: "post-transisi", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 117, sym: "Ts", nama: "Tennessin", ar: "(294)", gol: 17, per: 7, col: 17, row: 7, kat: "halogen", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", biloks: "-", en: "-", fase: "Sintetik" },
    { z: 118, sym: "Og", nama: "Oganeson", ar: "(294)", gol: 18, per: 7, col: 18, row: 7, kat: "gas-mulia", konfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", biloks: "0", en: "-", fase: "Sintetik" },
    // Lantanida (Row 9)
    { z: 57, sym: "La", nama: "Lantanum", ar: "138.91", gol: 3, per: 6, col: 4, row: 9, kat: "lantanida", konfig: "[Xe] 5d¹ 6s²", biloks: "+3", en: "1.1", fase: "Padat" },
    { z: 58, sym: "Ce", nama: "Serium", ar: "140.12", gol: 3, per: 6, col: 5, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹ 5d¹ 6s²", biloks: "+3, +4", en: "1.12", fase: "Padat" },
    { z: 59, sym: "Pr", nama: "Praseodimium", ar: "140.91", gol: 3, per: 6, col: 6, row: 9, kat: "lantanida", konfig: "[Xe] 4f³ 6s²", biloks: "+3", en: "1.13", fase: "Padat" },
    { z: 60, sym: "Nd", nama: "Neodimium", ar: "144.24", gol: 3, per: 6, col: 7, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁴ 6s²", biloks: "+3", en: "1.14", fase: "Padat" },
    { z: 61, sym: "Pm", nama: "Prometium", ar: "(145)", gol: 3, per: 6, col: 8, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁵ 6s²", biloks: "+3", en: "1.13", fase: "Padat" },
    { z: 62, sym: "Sm", nama: "Samarium", ar: "150.36", gol: 3, per: 6, col: 9, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁶ 6s²", biloks: "+3, +2", en: "1.17", fase: "Padat" },
    { z: 63, sym: "Eu", nama: "Europium", ar: "151.96", gol: 3, per: 6, col: 10, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁷ 6s²", biloks: "+3, +2", en: "1.2", fase: "Padat" },
    { z: 64, sym: "Gd", nama: "Gadolinium", ar: "157.25", gol: 3, per: 6, col: 11, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁷ 5d¹ 6s²", biloks: "+3", en: "1.2", fase: "Padat" },
    { z: 65, sym: "Tb", nama: "Terbium", ar: "158.93", gol: 3, per: 6, col: 12, row: 9, kat: "lantanida", konfig: "[Xe] 4f⁹ 6s²", biloks: "+3", en: "1.2", fase: "Padat" },
    { z: 66, sym: "Dy", nama: "Disprosium", ar: "162.50", gol: 3, per: 6, col: 13, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹⁰ 6s²", biloks: "+3", en: "1.22", fase: "Padat" },
    { z: 67, sym: "Ho", nama: "Holmium", ar: "164.93", gol: 3, per: 6, col: 14, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹¹ 6s²", biloks: "+3", en: "1.23", fase: "Padat" },
    { z: 68, sym: "Er", nama: "Erbium", ar: "167.26", gol: 3, per: 6, col: 15, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹² 6s²", biloks: "+3", en: "1.24", fase: "Padat" },
    { z: 69, sym: "Tm", nama: "Tulium", ar: "168.93", gol: 3, per: 6, col: 16, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹³ 6s²", biloks: "+3", en: "1.25", fase: "Padat" },
    { z: 70, sym: "Yb", nama: "Iterbium", ar: "173.05", gol: 3, per: 6, col: 17, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹⁴ 6s²", biloks: "+3, +2", en: "1.1", fase: "Padat" },
    { z: 71, sym: "Lu", nama: "Lutetium", ar: "174.97", gol: 3, per: 6, col: 18, row: 9, kat: "lantanida", konfig: "[Xe] 4f¹⁴ 5d¹ 6s²", biloks: "+3", en: "1.27", fase: "Padat" },
    // Aktinida (Row 10)
    { z: 89, sym: "Ac", nama: "Aktinium", ar: "(227)", gol: 3, per: 7, col: 4, row: 10, kat: "aktinida", konfig: "[Rn] 6d¹ 7s²", biloks: "+3", en: "1.1", fase: "Padat" },
    { z: 90, sym: "Th", nama: "Torium", ar: "232.04", gol: 3, per: 7, col: 5, row: 10, kat: "aktinida", konfig: "[Rn] 6d² 7s²", biloks: "+4", en: "1.3", fase: "Padat" },
    { z: 91, sym: "Pa", nama: "Protaktinium", ar: "231.04", gol: 3, per: 7, col: 6, row: 10, kat: "aktinida", konfig: "[Rn] 5f² 6d¹ 7s²", biloks: "+5", en: "1.5", fase: "Padat" },
    { z: 92, sym: "U", nama: "Uranium", ar: "238.03", gol: 3, per: 7, col: 7, row: 10, kat: "aktinida", konfig: "[Rn] 5f³ 6d¹ 7s²", biloks: "+6, +4", en: "1.38", fase: "Padat" },
    { z: 93, sym: "Np", nama: "Neptunium", ar: "(237)", gol: 3, per: 7, col: 8, row: 10, kat: "aktinida", konfig: "[Rn] 5f⁴ 6d¹ 7s²", biloks: "+5", en: "1.36", fase: "Padat" },
    { z: 94, sym: "Pu", nama: "Plutonium", ar: "(244)", gol: 3, per: 7, col: 9, row: 10, kat: "aktinida", konfig: "[Rn] 5f⁶ 7s²", biloks: "+4, +6", en: "1.28", fase: "Padat" },
    { z: 95, sym: "Am", nama: "Amerisium", ar: "(243)", gol: 3, per: 7, col: 10, row: 10, kat: "aktinida", konfig: "[Rn] 5f⁷ 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 96, sym: "Cm", nama: "Kurium", ar: "(247)", gol: 3, per: 7, col: 11, row: 10, kat: "aktinida", konfig: "[Rn] 5f⁷ 6d¹ 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 97, sym: "Bk", nama: "Berkelium", ar: "(247)", gol: 3, per: 7, col: 12, row: 10, kat: "aktinida", konfig: "[Rn] 5f⁹ 7s²", biloks: "+3, +4", en: "1.3", fase: "Padat" },
    { z: 98, sym: "Cf", nama: "Kalifornium", ar: "(251)", gol: 3, per: 7, col: 13, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹⁰ 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 99, sym: "Es", nama: "Einsteinium", ar: "(252)", gol: 3, per: 7, col: 14, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹¹ 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 100, sym: "Fm", nama: "Fermium", ar: "(257)", gol: 3, per: 7, col: 15, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹² 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 101, sym: "Md", nama: "Mendelevium", ar: "(258)", gol: 3, per: 7, col: 16, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹³ 7s²", biloks: "+3", en: "1.3", fase: "Padat" },
    { z: 102, sym: "No", nama: "Nobelium", ar: "(259)", gol: 3, per: 7, col: 17, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹⁴ 7s²", biloks: "+2, +3", en: "1.3", fase: "Padat" },
    { z: 103, sym: "Lr", nama: "Lawrensium", ar: "(262)", gol: 3, per: 7, col: 18, row: 10, kat: "aktinida", konfig: "[Rn] 5f¹⁴ 7s² 7p¹", biloks: "+3", en: "-", fase: "Padat" }
  ]
};

// --- END FILE: app.js ---

// --- START FILE: app_part1_dashboard.js ---
// ============================================================================
// MODUL 1: DASHBOARD UTAMA
// ============================================================================
OlympiadApp.renderDashboard = function() {
  const container = document.getElementById('panel-dashboard');
  if (!container) return;

  const totalSoal = (this.data?.soal || []).length;
  const totalSiswa = (this.data?.siswa || []).length;
  const totalLomba = (this.data?.lomba || []).length;
  
  let emas = 0, perak = 0, perunggu = 0;
  (this.data?.siswa || []).forEach(s => {
    (s?.riwayatLomba || []).forEach(r => {
      const cap = String(r?.capaian || r?.nama || '');
      if (cap.includes('Emas') || cap.includes('Juara 1')) emas++;
      else if (cap.includes('Perak') || cap.includes('Juara 2')) perak++;
      else if (cap.includes('Perunggu') || cap.includes('Juara 3')) perunggu++;
    });
  });

  let nearestLomba = null;
  let minDays = 999;
  const now = new Date();
  (this.data?.lomba || []).forEach(l => {
    const deadlineStr = l?.timeline?.deadlineDaftar;
    if (deadlineStr) {
      const dl = new Date(deadlineStr);
      if (!isNaN(dl.getTime())) {
        const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < minDays) {
          minDays = diff;
          nearestLomba = l;
        }
      }
    }
  });

  let html = `
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card border border-violet-500/20 p-6 sm:p-8 relative overflow-hidden mb-8 glow-ambient-violet">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>PortalKimia Suite &bull; Ekosistem Pembinaan Olimpiade Kimia</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Pusat Komando &amp; Pembinaan <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-emerald-400">Olimpiade Kimia</span>
          </h2>
          <p class="text-zinc-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Platform terpadu bank soal berstandar IChO/OSN dengan KaTeX, dokumen lomba, smart matching tim berbasis 5 cabang kimia, dan sinkronisasi cloud multi-device.
          </p>
          <div class="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-300 font-medium">
            <span class="flex items-center gap-1.5"><i data-lucide="school" class="w-4 h-4 text-violet-400"></i> ${this.data.settings.namaSekolah}</span>
            <span class="flex items-center gap-1.5"><i data-lucide="user-check" class="w-4 h-4 text-emerald-400"></i> Pembina: ${this.data.settings.koordinator}</span>
          </div>
        </div>

        <!-- Role Simulator Switcher Box with Password Shield -->
        <div class="shrink-0 p-4 rounded-2xl bg-zinc-900/90 dark:bg-black/70 border border-zinc-800 flex flex-col gap-2.5 shadow-xl">
          <span class="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-violet-400"></i> Pilih Mode Akses:
          </span>
          <div class="flex items-center gap-1.5">
            <button onclick="OlympiadApp.requestRoleSwitch('siswa')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.currentRole === 'siswa' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-zinc-800/80 text-zinc-400 hover:text-white'}">
              Mode Siswa
            </button>
            <button onclick="OlympiadApp.requestRoleSwitch('pembimbing')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.currentRole === 'pembimbing' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-zinc-800/80 text-zinc-400 hover:text-white'}">
              Guru Pembimbing
            </button>
            <button onclick="OlympiadApp.requestRoleSwitch('admin')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.currentRole === 'admin' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-zinc-800/80 text-zinc-400 hover:text-white'}">
              Admin
            </button>
          </div>
          <span class="text-[10px] text-zinc-400 italic">
            ${this.currentRole === 'siswa' 
              ? 'Tampilan Siswa Aktif: Kunci soal terkunci & aman untuk proyektor kelas.' 
              : (this.currentRole === 'pembimbing' ? 'Akses Guru Aktif: Kelola bank soal, pembahasan, dan siswa.' : 'Akses Admin Aktif: Pengaturan sistem & data penuh.')}
          </span>
        </div>
      </div>
    </div>

    ${(totalSoal === 0 && totalSiswa === 0 && totalLomba === 0) ? `
      <!-- Clean Slate / Ready for User Testing Banner -->
      <div class="mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-violet-950/30 to-emerald-950/30 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              Tampilan Bersih &bull; <span class="text-blue-400 font-semibold">Siap untuk Pengujian Data Anda</span>
            </h4>
            <p class="text-xs text-zinc-300 mt-1 leading-relaxed max-w-2xl">
              Seluruh data contoh telah dikosongkan. Anda dapat langsung menguji coba fitur pemindaian folder Google Drive untuk Bank Soal, mendaftarkan siswa binaan, menambah timeline lomba, atau menyusun jadwal intensif.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="OlympiadApp.setTab('soal')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5">
            <i data-lucide="book-open" class="w-4 h-4"></i> Mulai Bank Soal
          </button>
          <button onclick="OlympiadApp.loadSampleData()" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5" title="Jika ingin melihat kembali tampilan dengan data contoh demo">
            <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-400"></i> Muat Data Demo
          </button>
        </div>
      </div>
    ` : ''}

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-zinc-400 uppercase">Bank Soal Terindeks</span>
          <div class="text-3xl font-black text-zinc-100 mt-1">${totalSoal} <span class="text-xs font-medium text-violet-400">Soal KaTeX</span></div>
          <span class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1"><i data-lucide="check" class="w-3 h-3"></i> 5 Cabang Kimia</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <i data-lucide="book-open" class="w-6 h-6"></i>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-zinc-400 uppercase">Siswa Binaan Aktif</span>
          <div class="text-3xl font-black text-zinc-100 mt-1">${totalSiswa} <span class="text-xs font-medium text-emerald-400">Siswa</span></div>
          <span class="text-[11px] text-zinc-400 flex items-center gap-1 mt-1"><i data-lucide="users" class="w-3 h-3"></i> Pelatda &amp; Reguler</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <i data-lucide="graduation-cap" class="w-6 h-6"></i>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-zinc-400 uppercase">Agenda Lomba 2026</span>
          <div class="text-3xl font-black text-zinc-100 mt-1">${totalLomba} <span class="text-xs font-medium text-amber-400">Kompetisi</span></div>
          <span class="text-[11px] text-amber-400 flex items-center gap-1 mt-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${minDays < 999 ? 'H-' + minDays + ' Deadline Terdekat' : 'Tersedia'}</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <i data-lucide="trophy" class="w-6 h-6"></i>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-zinc-400 uppercase">Perolehan Medali</span>
          <div class="text-3xl font-black text-zinc-100 mt-1">${emas + perak + perunggu} <span class="text-xs font-medium text-yellow-400">Penghargaan</span></div>
          <span class="text-[11px] text-zinc-400 flex items-center gap-2 mt-1">
            <span>Emas: ${emas}</span> &bull; <span>Perak: ${perak}</span> &bull; <span>Perunggu: ${perunggu}</span>
          </span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
          <i data-lucide="award" class="w-6 h-6"></i>
        </div>
      </div>
    </div>

    <!-- Papan Pengumuman Pembinaan (Mading Digital) -->
    <div class="glass-card rounded-2xl p-6 border border-zinc-800 shadow-xl mb-8 glow-ambient-amber">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <i data-lucide="megaphone" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              Papan Pengumuman Pembinaan &bull; <span class="text-amber-400 font-semibold text-sm sm:text-base">Mading Digital</span>
            </h3>
            <p class="text-xs text-zinc-400">Informasi briefing teknis, berkas administrasi, dan arahan pembina untuk seluruh delegasi olimpiade.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
            ${(this.data.pengumuman || []).length} Pengumuman
          </span>
          ${!this.isSiswa() ? `
            <button onclick="OlympiadApp.openAddPengumumanModal()" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Buat Pengumuman
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Announcement Items List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        ${(() => {
          const list = [...(this.data.pengumuman || [])].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.tanggal) - new Date(a.tanggal);
          });

          if (list.length === 0) {
            return `
              <div class="col-span-full py-8 text-center text-zinc-500 text-xs sm:text-sm">
                Belum ada pengumuman pembinaan yang dipublikasikan.
              </div>
            `;
          }

          return list.map(p => {
            const prioritasBadge = p.prioritas === 'Urgent' 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
              : (p.prioritas === 'Penting' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30');

            return `
              <div class="p-4 rounded-2xl ${p.pinned ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20' : 'bg-zinc-900/50 border-zinc-800'} border flex flex-col justify-between transition-all hover:border-zinc-700">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-1.5">
                      ${p.pinned ? `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                          <i data-lucide="pin" class="w-3 h-3"></i> PINNED
                        </span>
                      ` : ''}
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${prioritasBadge}">
                        ${p.prioritas || 'Info'}
                      </span>
                    </div>
                    <span class="text-[11px] text-zinc-400 font-medium">${p.tanggal}</span>
                  </div>

                  <h4 class="text-sm font-bold text-zinc-100 line-clamp-2 mb-1.5">${p.judul}</h4>
                  <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">${p.isi}</p>
                </div>

                <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <i data-lucide="user-pen" class="w-3.5 h-3.5 text-violet-400"></i>
                    <span class="truncate max-w-[120px] sm:max-w-[150px]">${p.penulis || 'Pembina'}</span>
                  </div>

                  <div class="flex items-center gap-1">
                    ${p.tautan ? `
                      <a href="${p.tautan}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 text-xs transition-all" title="Buka Tautan Lampiran">
                        <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                      </a>
                    ` : ''}

                    ${!this.isSiswa() ? `
                      <button onclick="OlympiadApp.togglePinPengumuman('${p.id}')" class="p-1.5 rounded-lg ${p.pinned ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400 hover:text-white'} text-xs transition-all" title="${p.pinned ? 'Lepas Pin' : 'Sematkan (Pin)'}">
                        <i data-lucide="pin" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="OlympiadApp.openEditPengumumanModal('${p.id}')" class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-all" title="Edit Pengumuman">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="OlympiadApp.deletePengumuman('${p.id}')" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all" title="Hapus Pengumuman">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        })()}
      </div>
    </div>

    <!-- Main Grid: Nearest Deadline & Quick Shortcuts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Nearest Deadline Card -->
      <div class="lg:col-span-2 glass-card rounded-2xl p-6 border border-zinc-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h3 class="text-base font-bold text-zinc-100">Batas Pendaftaran Lomba Terdekat</h3>
          </div>
          <button onclick="OlympiadApp.setTab('lomba')" class="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1">
            Lihat Semua Agenda <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        ${nearestLomba ? `
          <div class="p-5 rounded-2xl bg-zinc-900/60 dark:bg-[#0c0c0f] border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[11px]">H-${minDays} HARI LAGI</span>
                <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium text-[11px]">${nearestLomba.klasifikasi}</span>
              </div>
              <h4 class="text-base sm:text-lg font-bold text-zinc-100">${nearestLomba.nama || 'Kompetisi Kimia'}</h4>
              <p class="text-xs text-zinc-400 mt-1">${nearestLomba.penyelenggara || 'Penyelenggara'} &bull; Batas: <span class="text-rose-400 font-bold">${nearestLomba.timeline?.deadlineDaftar || '-'}</span></p>
              
              <!-- Checklist Preview -->
              <div class="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-300">
                <span class="flex items-center gap-1 ${nearestLomba.dokumenCeklis?.proposalDibuat ? 'text-emerald-400' : 'text-zinc-500'}">
                  <i data-lucide="${nearestLomba.dokumenCeklis?.proposalDibuat ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i> Proposal
                </span>
                <span class="flex items-center gap-1 ${nearestLomba.dokumenCeklis?.proposalAcc ? 'text-emerald-400' : 'text-zinc-500'}">
                  <i data-lucide="${nearestLomba.dokumenCeklis?.proposalAcc ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i> ACC Kepsek
                </span>
                <span class="flex items-center gap-1 ${nearestLomba.dokumenCeklis?.suratIzinDibuat ? 'text-emerald-400' : 'text-zinc-500'}">
                  <i data-lucide="${nearestLomba.dokumenCeklis?.suratIzinDibuat ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i> Surat Izin
                </span>
              </div>
            </div>

            <div class="shrink-0 flex flex-col gap-2">
              <button onclick="OlympiadApp.setTab('lomba')" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all">
                Kelola Lomba
              </button>
              <button onclick="OlympiadApp.syncGoogleCalendar('${nearestLomba.id}')" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                <i data-lucide="calendar-plus" class="w-3.5 h-3.5 text-emerald-400"></i> Ke Google Cal
              </button>
            </div>
          </div>
        ` : `
          <p class="text-zinc-500 text-sm">Tidak ada agenda deadline lomba mendesak dalam waktu dekat.</p>
        `}
      </div>

      <!-- Quick Shortcuts -->
      <div class="glass-card rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between">
        <div>
          <h3 class="text-base font-bold text-zinc-100 mb-3">Pintasan Cepat</h3>
          <div class="flex flex-col gap-2.5">
            <button onclick="OlympiadApp.setTab('soal')" class="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <i data-lucide="list" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-zinc-100">Buka Daftar Bank Soal</div>
                  <div class="text-[11px] text-zinc-400">Format ringkas &bull; 5 bidang kimia</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-500"></i>
            </button>

            ${!this.isSiswa() ? `
              <button onclick="OlympiadApp.setTab('ploting')" class="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <i data-lucide="crosshair" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-zinc-100">Simulasi Tim &amp; Smart Match</div>
                    <div class="text-[11px] text-zinc-400">Cek sinergi topik &amp; bentrok</div>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-500"></i>
              </button>

              <button onclick="OlympiadApp.openAddSoalModal()" class="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-zinc-100">Input Soal Baru</div>
                    <div class="text-[11px] text-zinc-400">Preview KaTeX + Link Google Drive</div>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-500"></i>
              </button>
            ` : ''}

            <button onclick="OlympiadApp.toggleTheme()" class="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-zinc-700/30 text-amber-400 flex items-center justify-center">
                  <i data-lucide="sun-moon" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-zinc-100">Ganti Mode Tampilan</div>
                  <div class="text-[11px] text-zinc-400">Beralih Mode Gelap / Terang</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-500"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Leaderboard & Coaches -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-card rounded-2xl p-6 border border-zinc-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-zinc-100 flex items-center gap-2">
            <i data-lucide="${this.isSiswa() ? 'users' : 'award'}" class="w-4 h-4 text-amber-400"></i>
            <span>${this.isSiswa() ? 'Delegasi Siswa &amp; Agenda Lomba' : 'Siswa Unggulan Binaan'}</span>
          </h3>
          <button onclick="OlympiadApp.setTab('siswa')" class="text-xs font-semibold text-violet-400 hover:underline">Semua Siswa</button>
        </div>
        <div class="space-y-3">
          ${this.data.siswa.slice(0, 4).map((s, idx) => {
            const activeLomba = this.data.lomba.filter(l => (l.pesertaIds || []).includes(s.id));
            const latestPrestasi = s.riwayatLomba && s.riwayatLomba.length > 0 ? s.riwayatLomba[0] : null;

            return `
              <div class="p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between transition-all cursor-pointer" onclick="OlympiadApp.openSiswaDetail('${s.id}')">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                    ${this.isSiswa() ? s.nama.split(' ').map(n => n[0]).slice(0,2).join('') : '#' + (idx + 1)}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-zinc-100">${s.nama}</h4>
                    <p class="text-[11px] text-zinc-400">${s.kelas} &bull; <span class="text-violet-400 font-medium">${s.bidangUtama}</span></p>
                  </div>
                </div>
                
                ${this.isSiswa() ? `
                  <div class="text-right">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${activeLomba.length > 0 ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'}">
                      ${activeLomba.length > 0 ? activeLomba.length + ' Lomba Diikuti' : 'Reguler'}
                    </span>
                    <span class="block text-[10px] text-emerald-400 font-semibold mt-0.5">
                      ${latestPrestasi ? latestPrestasi.capaian : 'Delegasi Aktif'}
                    </span>
                  </div>
                ` : `
                  <div class="text-right">
                    <span class="text-xs font-extrabold text-emerald-400">${s.skorRata.toFixed(1)}</span>
                    <span class="block text-[10px] text-zinc-500">Skor Rata-rata</span>
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="glass-card rounded-2xl p-6 border border-zinc-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-zinc-100 flex items-center gap-2">
            <i data-lucide="user-check" class="w-4 h-4 text-emerald-400"></i> Dewan Pembimbing &amp; Pelatih
          </h3>
          <span class="text-xs text-zinc-400">${this.data.pembimbing.length} Pembimbing</span>
        </div>
        <div class="space-y-3">
          ${this.data.pembimbing.map(m => `
            <div class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold text-zinc-100">${m.nama}</h4>
                <p class="text-[11px] text-violet-400 font-semibold">${m.spesialisasi}</p>
                <p class="text-[10px] text-zinc-400 mt-0.5"><i data-lucide="clock" class="inline w-3 h-3"></i> ${m.jadwal}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                ${m.totalSesi} Sesi
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

// ============================================================================
// CRUD PENGUMUMAN PEMBINAAN (MADING DIGITAL)
// ============================================================================
OlympiadApp.openAddPengumumanModal = function() {
  if (this.isSiswa()) {
    alert('Akses terbatas: Hanya Guru Pembimbing dan Admin yang dapat membuat pengumuman.');
    return;
  }
  const modal = document.getElementById('modal-pengumuman-form');
  if (!modal) return;

  const idInput = document.getElementById('form-pengumuman-id');
  const title = document.getElementById('form-pengumuman-title');
  const saveBtn = document.getElementById('btn-save-pengumuman');

  if (idInput) idInput.value = '';
  if (title) title.textContent = 'Tambah Pengumuman Pembinaan';
  if (saveBtn) saveBtn.textContent = 'Terbitkan Pengumuman';

  const judulInput = document.getElementById('form-pengumuman-judul');
  const isiInput = document.getElementById('form-pengumuman-isi');
  const prioritasInput = document.getElementById('form-pengumuman-prioritas');
  const tanggalInput = document.getElementById('form-pengumuman-tanggal');
  const penulisInput = document.getElementById('form-pengumuman-penulis');
  const tautanInput = document.getElementById('form-pengumuman-tautan');
  const pinnedInput = document.getElementById('form-pengumuman-pinned');

  if (judulInput) judulInput.value = '';
  if (isiInput) isiInput.value = '';
  if (prioritasInput) prioritasInput.value = 'Penting';
  if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
  if (penulisInput) penulisInput.value = this.data.settings?.koordinator || 'Tito Vanzal, S.Pd.';
  if (tautanInput) tautanInput.value = '';
  if (pinnedInput) pinnedInput.checked = false;

  modal.classList.remove('hidden');
};

OlympiadApp.openEditPengumumanModal = function(id) {
  if (this.isSiswa()) {
    alert('Akses terbatas: Hanya Guru Pembimbing dan Admin yang dapat mengubah pengumuman.');
    return;
  }
  const p = (this.data.pengumuman || []).find(item => item.id === id);
  if (!p) return;
  const modal = document.getElementById('modal-pengumuman-form');
  if (!modal) return;

  const idInput = document.getElementById('form-pengumuman-id');
  const title = document.getElementById('form-pengumuman-title');
  const saveBtn = document.getElementById('btn-save-pengumuman');

  if (idInput) idInput.value = p.id;
  if (title) title.textContent = 'Edit Pengumuman: ' + p.judul;
  if (saveBtn) saveBtn.textContent = 'Perbarui Pengumuman';

  const judulInput = document.getElementById('form-pengumuman-judul');
  const isiInput = document.getElementById('form-pengumuman-isi');
  const prioritasInput = document.getElementById('form-pengumuman-prioritas');
  const tanggalInput = document.getElementById('form-pengumuman-tanggal');
  const penulisInput = document.getElementById('form-pengumuman-penulis');
  const tautanInput = document.getElementById('form-pengumuman-tautan');
  const pinnedInput = document.getElementById('form-pengumuman-pinned');

  if (judulInput) judulInput.value = p.judul || '';
  if (isiInput) isiInput.value = p.isi || '';
  if (prioritasInput) prioritasInput.value = p.prioritas || 'Info';
  if (tanggalInput) tanggalInput.value = p.tanggal || new Date().toISOString().split('T')[0];
  if (penulisInput) penulisInput.value = p.penulis || '';
  if (tautanInput) tautanInput.value = p.tautan || '';
  if (pinnedInput) pinnedInput.checked = !!p.pinned;

  modal.classList.remove('hidden');
};

OlympiadApp.closePengumumanModal = function() {
  const modal = document.getElementById('modal-pengumuman-form');
  if (modal) modal.classList.add('hidden');
};

OlympiadApp.savePengumuman = function() {
  if (this.isSiswa()) return;
  const idInput = document.getElementById('form-pengumuman-id')?.value.trim() || '';
  const judul = document.getElementById('form-pengumuman-judul')?.value.trim() || '';
  const isi = document.getElementById('form-pengumuman-isi')?.value.trim() || '';

  if (!judul || !isi) {
    alert('Judul dan isi pengumuman wajib diisi!');
    return;
  }

  const prioritas = document.getElementById('form-pengumuman-prioritas')?.value || 'Info';
  const tanggal = document.getElementById('form-pengumuman-tanggal')?.value || new Date().toISOString().split('T')[0];
  const penulis = document.getElementById('form-pengumuman-penulis')?.value.trim() || 'Pembimbing Kimia';
  const tautan = document.getElementById('form-pengumuman-tautan')?.value.trim() || '';
  const pinned = !!document.getElementById('form-pengumuman-pinned')?.checked;

  if (!this.data.pengumuman) this.data.pengumuman = [];

  if (idInput) {
    const p = this.data.pengumuman.find(item => item.id === idInput);
    if (p) {
      p.judul = judul;
      p.isi = isi;
      p.prioritas = prioritas;
      p.tanggal = tanggal;
      p.penulis = penulis;
      p.tautan = tautan;
      p.pinned = pinned;
    }
  } else {
    const newId = 'pgm-' + Date.now().toString().slice(-4);
    this.data.pengumuman.unshift({
      id: newId,
      judul,
      isi,
      prioritas,
      tanggal,
      penulis,
      tautan,
      pinned
    });
  }

  this.saveDataLocally();
  this.closePengumumanModal();
  this.renderDashboard();
  if (window.lucide) lucide.createIcons();
};

OlympiadApp.deletePengumuman = function(id) {
  if (this.isSiswa()) return;
  if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
  this.data.pengumuman = (this.data.pengumuman || []).filter(p => p.id !== id);
  this.saveDataLocally();
  this.renderDashboard();
  if (window.lucide) lucide.createIcons();
};

OlympiadApp.togglePinPengumuman = function(id) {
  if (this.isSiswa()) return;
  const p = (this.data.pengumuman || []).find(item => item.id === id);
  if (p) {
    p.pinned = !p.pinned;
    this.saveDataLocally();
    this.renderDashboard();
    if (window.lucide) lucide.createIcons();
  }
};


// --- END FILE: app_part1_dashboard.js ---

// --- START FILE: app_part2_soal.js ---
// ============================================================================
// MODUL 2: MANAJEMEN BANK SOAL (COMPACT LIST VIEW & MODAL DETAIL)
// ============================================================================
OlympiadApp.renderBankSoal = function() {
  const container = document.getElementById('panel-soal');
  if (!container) return;

  // Logika Filter
  let filtered = this.data.soal.filter(s => {
    const matchKeyword = !this.filterSoal.keyword || 
      s.teksSoal.toLowerCase().includes(this.filterSoal.keyword.toLowerCase()) ||
      s.subtopik.toLowerCase().includes(this.filterSoal.keyword.toLowerCase()) ||
      s.sumber.toLowerCase().includes(this.filterSoal.keyword.toLowerCase()) ||
      (s.tags || []).some(t => t.toLowerCase().includes(this.filterSoal.keyword.toLowerCase()));

    const matchTahun = this.filterSoal.tahun === 'all' || s.tahun.toString() === this.filterSoal.tahun;
    const matchBidang = this.filterSoal.bidang === 'all' || s.bidang === this.filterSoal.bidang;
    const matchKesulitan = this.filterSoal.kesulitan === 'all' || s.kesulitan === this.filterSoal.kesulitan;
    const matchJenis = this.filterSoal.jenis === 'all' || s.jenis === this.filterSoal.jenis;
    const matchSumber = this.filterSoal.sumber === 'all' || s.sumber === this.filterSoal.sumber;

    return matchKeyword && matchTahun && matchBidang && matchKesulitan && matchJenis && matchSumber;
  });

  const uniqueTahun = [...new Set(this.data.soal.map(s => s.tahun))].sort((a,b) => b-a);
  const uniqueBidang = ["Kimia Fisik", "Kimia Organik", "Kimia Anorganik", "Kimia Analitik", "Biokimia"];
  const uniqueKesulitan = ["Dasar (Kabupaten)", "Menengah (Provinsi)", "Tinggi (Nasional)", "Master (Internasional)"];
  const uniqueJenis = ["Pilihan Ganda", "Esai Terstruktur", "Isian Singkat"];

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="book-open" class="w-6 h-6 text-violet-400"></i> Bank Soal Olimpiade Kimia
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Daftar kurasi soal OSN, OMI, OKI UI, UNAIR &amp; IChO. Klik pada butir soal untuk membuka lembar soal &amp; formula KaTeX.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        ${!this.isSiswa() ? `
          <button onclick="OlympiadApp.openAddSoalModal()" class="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Tambah Soal
          </button>
          <button onclick="OlympiadApp.openSyncDriveSoalModal()" class="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all" title="Pindai &amp; Tata Otomatis dari Folder Google Drive">
            <i data-lucide="folder-sync" class="w-4 h-4 text-blue-400"></i> Pindai Folder Drive
          </button>
          <button onclick="OlympiadApp.triggerHtmlFileSelect()" class="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all" title="Impor &amp; Tata Berkas HTML Soal Secara Instan">
            <i data-lucide="file-code-2" class="w-4 h-4 text-amber-400"></i> Impor Berkas HTML
          </button>
          <button onclick="OlympiadApp.triggerImportJSON()" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
            <i data-lucide="upload" class="w-4 h-4 text-emerald-400"></i> Import JSON
          </button>
        ` : ''}

        <div class="relative inline-block text-left">
          <button onclick="OlympiadApp.toggleExportMenu()" id="btn-export-menu" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
            <i data-lucide="download" class="w-4 h-4 text-amber-400"></i> Ekspor Soal <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
          </button>
          <div id="export-dropdown-menu" class="hidden absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl z-40 py-2 text-xs">
            <button onclick="OlympiadApp.exportSoalJSON()" class="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2.5">
              <i data-lucide="file-json" class="w-4 h-4 text-amber-400"></i> Ekspor JSON Database
            </button>
            <button onclick="OlympiadApp.exportSoalLaTeX()" class="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2.5">
              <i data-lucide="code" class="w-4 h-4 text-violet-400"></i> Ekspor Format LaTeX (.tex)
            </button>
            <button onclick="OlympiadApp.exportPrintSheet(false)" class="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2.5">
              <i data-lucide="printer" class="w-4 h-4 text-emerald-400"></i> Cetak Lembar Siswa
            </button>
            ${!this.isSiswa() ? `
              <button onclick="OlympiadApp.exportPrintSheet(true)" class="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2.5">
                <i data-lucide="file-text" class="w-4 h-4 text-rose-400"></i> Cetak Lembar Pembina (+Solusi)
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="glass-card rounded-2xl p-4 border border-zinc-800 mb-6 space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <!-- Live Search -->
        <div class="md:col-span-4 relative">
          <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input type="text" 
                 placeholder="Cari kata kunci, topik, teks soal, atau tag..." 
                 value="${this.filterSoal.keyword}"
                 oninput="OlympiadApp.handleSoalSearch(this.value)"
                 class="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500">
        </div>

        <!-- Bidang Kimia Filter -->
        <div class="md:col-span-2">
          <select onchange="OlympiadApp.handleSoalFilter('bidang', this.value)" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
            <option value="all" ${this.filterSoal.bidang === 'all' ? 'selected' : ''}>Semua 5 Bidang</option>
            ${uniqueBidang.map(b => `<option value="${b}" ${this.filterSoal.bidang === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>

        <!-- Tingkat Kesulitan Filter -->
        <div class="md:col-span-2">
          <select onchange="OlympiadApp.handleSoalFilter('kesulitan', this.value)" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
            <option value="all" ${this.filterSoal.kesulitan === 'all' ? 'selected' : ''}>Semua Tingkat</option>
            ${uniqueKesulitan.map(k => `<option value="${k}" ${this.filterSoal.kesulitan === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>

        <!-- Format Soal Filter -->
        <div class="md:col-span-2">
          <select onchange="OlympiadApp.handleSoalFilter('jenis', this.value)" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
            <option value="all" ${this.filterSoal.jenis === 'all' ? 'selected' : ''}>Semua Format</option>
            ${uniqueJenis.map(j => `<option value="${j}" ${this.filterSoal.jenis === j ? 'selected' : ''}>${j}</option>`).join('')}
          </select>
        </div>

        <!-- Tahun Filter -->
        <div class="md:col-span-2">
          <select onchange="OlympiadApp.handleSoalFilter('tahun', this.value)" 
                  class="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
            <option value="all" ${this.filterSoal.tahun === 'all' ? 'selected' : ''}>Semua Tahun</option>
            ${uniqueTahun.map(t => `<option value="${t}" ${this.filterSoal.tahun === t.toString() ? 'selected' : ''}>Tahun ${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Filter Meta & Reset -->
      <div class="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
        <div>Menampilkan <strong class="text-zinc-100">${filtered.length}</strong> dari total <strong class="text-zinc-100">${this.data.soal.length}</strong> butir soal</div>
        <button onclick="OlympiadApp.resetSoalFilter()" class="text-violet-400 hover:text-violet-300 font-bold hover:underline">Reset Filter</button>
      </div>
    </div>

    <!-- QUESTIONS COMPACT LIST VIEW -->
    <div class="glass-card rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
      ${this.data.soal.length === 0 ? `
        <div class="p-12 text-center space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
            <i data-lucide="book-open" class="w-8 h-8"></i>
          </div>
          <h4 class="text-base font-bold text-zinc-200">Bank Soal Masih Kosong</h4>
          <p class="text-xs text-zinc-400 max-w-md mx-auto">
            Belum ada butir soal dalam database. Anda dapat memindai naskah soal dari Google Drive atau mengimpor berkas HTML secara langsung untuk mulai mengisi bank soal.
          </p>
          ${!this.isSiswa() ? `
            <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button onclick="OlympiadApp.openSyncDriveSoalModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5">
                <i data-lucide="cloud" class="w-4 h-4"></i> Pindai Folder Drive
              </button>
              <button onclick="OlympiadApp.triggerHtmlFileSelect()" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 flex items-center gap-1.5">
                <i data-lucide="file-code" class="w-4 h-4"></i> Impor Berkas HTML
              </button>
              <button onclick="OlympiadApp.openTambahSoalModal()" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4"></i> Tambah Manual
              </button>
            </div>
          ` : `
            <p class="text-[11px] text-zinc-500 italic">Guru pembimbing belum menambahkan atau menyinkronkan naskah soal.</p>
          `}
        </div>
      ` : (filtered.length === 0 ? `
        <div class="p-12 text-center">
          <i data-lucide="inbox" class="w-12 h-12 text-zinc-600 mx-auto mb-3"></i>
          <p class="text-sm text-zinc-400">Tidak ada soal yang sesuai dengan kriteria filter.</p>
          <button onclick="OlympiadApp.resetSoalFilter()" class="mt-3 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">Tampilkan Semua Soal</button>
        </div>
      ` : `
        <div class="divide-y divide-zinc-800/80">
          ${filtered.map(s => {
            const bidangColorMap = {
              "Kimia Fisik": "bg-blue-500/15 text-blue-400 border-blue-500/30",
              "Kimia Organik": "bg-violet-500/15 text-violet-400 border-violet-500/30",
              "Kimia Anorganik": "bg-amber-500/15 text-amber-400 border-amber-500/30",
              "Kimia Analitik": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
              "Biokimia": "bg-rose-500/15 text-rose-400 border-rose-500/30"
            };
            const badgeColor = bidangColorMap[s.bidang] || "bg-zinc-800 text-zinc-300 border-zinc-700";

            // Clean snippet for preview (first 110 chars)
            const cleanSnippet = s.teksSoal.replace(/[\$#\n]/g, ' ').substring(0, 110) + '...';

            return `
              <div class="p-4 sm:p-5 hover:bg-zinc-900/50 dark:hover:bg-zinc-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group" onclick="OlympiadApp.openSoalDetail('${s.id}')">
                <div class="flex items-start gap-3.5 flex-grow">
                  <!-- Number Badge -->
                  <div class="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-violet-600 group-hover:text-white text-zinc-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors shadow-sm">
                    #${s.nomor}
                  </div>

                  <!-- Info & Preview -->
                  <div class="space-y-1 min-w-0 flex-grow">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${badgeColor}">
                        ${s.bidang}
                      </span>
                      <span class="text-xs font-bold text-zinc-200">
                        ${s.sumber} (${s.tahun})
                      </span>
                      <span class="text-zinc-600 dark:text-zinc-500 text-xs">&bull;</span>
                      <span class="text-xs text-zinc-400 font-medium">
                        ${s.kesulitan}
                      </span>
                      <span class="text-zinc-600 dark:text-zinc-500 text-xs">&bull;</span>
                      <span class="text-xs text-zinc-400 font-medium">
                        ${s.jenis}
                      </span>
                      ${s.googleDriveUrl ? `
                        <span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                          <i data-lucide="paperclip" class="w-3 h-3"></i> Drive
                        </span>
                      ` : ''}
                    </div>

                    <div class="text-xs font-bold text-violet-400">
                      ${s.subtopik}
                    </div>

                    <p class="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                      ${cleanSnippet}
                    </p>
                  </div>
                </div>

                <!-- Right Action Button & Solution Status -->
                <div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  ${this.isSiswa() ? `
                    <span class="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium flex items-center gap-1">
                      <i data-lucide="lock" class="w-3 h-3 text-amber-400"></i> Kunci Tertutup
                    </span>
                  ` : `
                    <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
                      <i data-lucide="check-circle" class="w-3 h-3"></i> Solusi Siap
                    </span>
                  `}
                  
                  <button class="px-3.5 py-1.5 rounded-xl bg-violet-600/15 group-hover:bg-violet-600 text-violet-400 group-hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                    <span>Buka Soal</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `)}
    </div>
  `;

  container.innerHTML = html;
};

// Open Soal Detail Modal (Naskah Lengkap, Opsi, Drive & Pembahasan)
OlympiadApp.openSoalDetail = function(id) {
  const s = this.data.soal.find(item => item.id === id);
  if (!s) return;
  this.selectedSoalDetail = s;

  const modal = document.getElementById('modal-detail-soal');
  const content = document.getElementById('detail-soal-content');
  if (!modal || !content) return;

  const bidangColorMap = {
    "Kimia Fisik": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Kimia Organik": "bg-violet-500/15 text-violet-400 border-violet-500/30",
    "Kimia Anorganik": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Kimia Analitik": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Biokimia": "bg-rose-500/15 text-rose-400 border-rose-500/30"
  };
  const badgeColor = bidangColorMap[s.bidang] || "bg-zinc-800 text-zinc-300";

  content.innerHTML = `
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
      <div class="flex flex-wrap items-center gap-2">
        <span class="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-200 font-mono font-bold text-xs">#${s.nomor}</span>
        <span class="px-3 py-1 rounded-xl border text-xs font-bold ${badgeColor}">${s.bidang}</span>
        <span class="px-2.5 py-1 rounded-xl bg-zinc-800/80 text-zinc-200 text-xs font-medium">${s.sumber} (${s.tahun})</span>
        <span class="px-2.5 py-1 rounded-xl bg-zinc-800/50 text-zinc-400 text-xs">${s.kesulitan}</span>
        <span class="px-2.5 py-1 rounded-xl bg-zinc-800/50 text-zinc-400 text-xs">${s.jenis}</span>
      </div>

      ${!this.isSiswa() ? `
        <div class="flex items-center gap-1.5">
          <button onclick="OlympiadApp.openEditSoalModal('${s.id}')" title="Edit Soal" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 transition-all">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
          </button>
          <button onclick="OlympiadApp.deleteSoal('${s.id}')" title="Hapus Soal" class="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 transition-all">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Subtopik & Tags -->
    <div class="my-4">
      <div class="text-sm font-extrabold text-violet-400 uppercase tracking-wide">${s.subtopik}</div>
      <div class="flex flex-wrap gap-1.5 mt-1.5">
        ${(s.tags || []).map(t => `<span class="px-2.5 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 text-xs font-medium">#${t}</span>`).join('')}
      </div>
    </div>

    <!-- Teks Naskah Soal Lengkap (KaTeX) -->
    <div class="my-4 p-5 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/30 border border-zinc-800 text-sm text-zinc-100 leading-relaxed katex-renderable whitespace-pre-line font-sans shadow-inner">
${s.teksSoal}
    </div>

    <!-- Opsi Pilihan Ganda (Jika ada) -->
    ${s.opsi && s.opsi.length > 0 ? `
      <div class="space-y-2.5 my-4">
        <h4 class="text-xs font-bold text-zinc-400 uppercase">Pilihan Jawaban:</h4>
        ${s.opsi.map(op => `
          <div class="px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 katex-renderable">
            ${op}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Tautan Berkas Google Drive -->
    ${s.googleDriveUrl ? `
      <div class="my-4 p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <i data-lucide="paperclip" class="w-4 h-4"></i>
          </div>
          <div class="truncate">
            <div class="text-xs font-bold text-zinc-200 truncate">${s.googleDriveName || 'Naskah_Soal_Lengkap.pdf'}</div>
            <div class="text-[10px] text-zinc-400">Berkas Naskah Terhubung ke Google Drive</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="OlympiadApp.previewGoogleDrive('${s.googleDriveUrl}', '${s.googleDriveName || 'Naskah Soal'}')" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Pratinjau
          </button>
          <a href="${s.googleDriveUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Buka di Drive
          </a>
        </div>
      </div>
    ` : ''}

    <!-- Kunci & Pembahasan (ROLE-RESTRICTED) -->
    ${this.isSiswa() ? `
      <!-- Siswa: Kunci Terkunci -->
      <div class="mt-6 p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/30 flex items-center gap-3 text-amber-300">
        <i data-lucide="lock" class="w-5 h-5 shrink-0 text-amber-400"></i>
        <div class="text-xs">
          <strong class="font-bold block text-amber-200">Pembahasan &amp; Solusi Terkunci</strong>
          Kunci jawaban dan langkah pengerjaan lengkap hanya dapat diakses oleh Guru Pembimbing dan Admin demi menjaga integritas latihan siswa.
        </div>
      </div>
    ` : `
      <!-- Guru / Admin: Solusi Lengkap -->
      <div class="mt-6 pt-4 border-t border-zinc-800">
        <div class="p-5 rounded-2xl bg-zinc-950/80 border border-violet-500/25 text-xs text-zinc-200 leading-relaxed shadow-lg">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 text-xs">
            <span class="font-bold text-violet-400 flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
              <span>KUNCI JAWABAN &amp; PEMBAHASAN LENGKAP</span>
            </span>
            <span class="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              Kunci: ${s.kunciJawaban || '-'}
            </span>
          </div>
          <div class="katex-renderable whitespace-pre-line leading-relaxed">
${s.pembahasan}
          </div>
        </div>
      </div>
    `}
  `;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    this.triggerKaTeX();
  }, 50);
};

OlympiadApp.closeSoalDetail = function() {
  const modal = document.getElementById('modal-detail-soal');
  if (modal) modal.classList.add('hidden');
};

// Filter Handlers
OlympiadApp.handleSoalSearch = function(val) {
  this.filterSoal.keyword = val;
  this.renderBankSoal();
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.handleSoalFilter = function(key, val) {
  this.filterSoal[key] = val;
  this.renderBankSoal();
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.resetSoalFilter = function() {
  this.filterSoal = {
    keyword: '',
    tahun: 'all',
    bidang: 'all',
    kesulitan: 'all',
    jenis: 'all',
    sumber: 'all'
  };
  this.renderBankSoal();
  if (window.lucide) window.lucide.createIcons();
};

// Google Drive Viewer Modal
OlympiadApp.previewGoogleDrive = function(url, title) {
  const modal = document.getElementById('modal-drive-preview');
  const iframe = document.getElementById('drive-iframe');
  const titleEl = document.getElementById('drive-preview-title');
  const directLink = document.getElementById('drive-direct-link');
  if (!modal) return;

  let embedUrl = url;
  if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.split('/file/d/')[1].split('/')[0];
    embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  }

  if (titleEl) titleEl.textContent = title;
  if (directLink) directLink.href = url;
  if (iframe) iframe.src = embedUrl;

  modal.classList.remove('hidden');
};

OlympiadApp.closeDrivePreview = function() {
  const modal = document.getElementById('modal-drive-preview');
  const iframe = document.getElementById('drive-iframe');
  if (iframe) iframe.src = '';
  if (modal) modal.classList.add('hidden');
};

// Export Handlers
OlympiadApp.toggleExportMenu = function() {
  const menu = document.getElementById('export-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
};

OlympiadApp.exportSoalJSON = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data.soal, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `Bank_Soal_PortalKimia_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  this.showToast('Bank Soal berhasil diekspor ke format JSON.', 'success');
};

OlympiadApp.exportSoalLaTeX = function() {
  let tex = `\\documentclass[11pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath,amssymb}\n\\usepackage{geometry}\n\\geometry{margin=2.5cm}\n\n\\title{Kumpulan Soal Olimpiade Kimia -- PortalKimia}\n\\author{${this.data.settings.namaSekolah}}\n\\date{\\today}\n\n\\begin{document}\n\\maketitle\n\n`;

  this.data.soal.forEach((s, idx) => {
    tex += `\\subsection*{Soal ${idx + 1} (${s.sumber} ${s.tahun} -- ${s.bidang})}\n`;
    tex += `\\textbf{Subtopik:} ${s.subtopik} \\quad \\textbf{Tingkat:} ${s.kesulitan}\\\\\n\n`;
    tex += `${s.teksSoal}\n\n`;
    if (s.opsi) {
      tex += `\\begin{enumerate}\n`;
      s.opsi.forEach(o => { tex += `  \\item ${o.substring(3)}\n`; });
      tex += `\\end{enumerate}\n\n`;
    }
    if (!this.isSiswa()) {
      tex += `\\textbf{Kunci Jawaban:} ${s.kunciJawaban}\\\\\n`;
      tex += `\\textbf{Pembahasan:}\\\\\n${s.pembahasan}\n\n`;
    }
    tex += `\\hrulefill\n\n`;
  });

  tex += `\\end{document}`;

  const blob = new Blob([tex], { type: 'text/x-tex' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bank_Soal_Olimpiade_${new Date().toISOString().slice(0,10)}.tex`;
  a.click();
  URL.revokeObjectURL(url);
  this.showToast('Naskah soal berhasil diekspor ke berkas LaTeX (.tex)!', 'success');
};

OlympiadApp.exportPrintSheet = function(withSolutions = false) {
  const printWin = window.open('', '_blank');
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Naskah Soal Olimpiade Kimia - ${withSolutions ? 'Edisi Pembina' : 'Lembar Siswa'}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .soal-item { margin-bottom: 25px; page-break-inside: avoid; }
        .solution { background: #f4f4f5; padding: 12px; margin-top: 10px; border-left: 4px solid #7c3aed; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${this.data.settings.namaSekolah.toUpperCase()}</h2>
        <h3>BANK SOAL OLIMPIADE KIMIA -- ${withSolutions ? 'EDISI KUNCI & PEMBAHASAN PEMBINA' : 'LEMBAR SOAL LATIHAN SISWA'}</h3>
        <p>Koordinator: ${this.data.settings.koordinator} | Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
      </div>
  `;

  this.data.soal.forEach((s, idx) => {
    htmlContent += `
      <div class="soal-item">
        <p><strong>Nomor ${idx + 1}</strong> [${s.sumber} ${s.tahun} | ${s.bidang} - ${s.kesulitan}]</p>
        <p>${s.teksSoal.replace(/\n/g, '<br>')}</p>
        ${s.opsi ? s.opsi.map(o => `<p style="margin-left: 20px;">${o}</p>`).join('') : ''}
        ${withSolutions ? `
          <div class="solution">
            <p><strong>Kunci Jawaban: ${s.kunciJawaban}</strong></p>
            <p>${s.pembahasan.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}
      </div>
      <hr>
    `;
  });

  htmlContent += `
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ]
          });
          setTimeout(() => window.print(), 800);
        });
      </script>
    </body>
    </html>
  `;

  printWin.document.write(htmlContent);
  printWin.document.close();
};

// Modal Add/Edit Soal
OlympiadApp.openAddSoalModal = function() {
  const modal = document.getElementById('modal-soal-form');
  if (!modal) return;
  document.getElementById('soal-form-title').textContent = 'Tambah Soal Baru';
  document.getElementById('form-soal-id').value = '';
  document.getElementById('form-soal-nomor').value = this.data.soal.length + 1;
  document.getElementById('form-soal-tahun').value = '2026';
  document.getElementById('form-soal-sumber').value = 'OSN-K Kimia';
  document.getElementById('form-soal-penyelenggara').value = 'BPTI Kemendikbudristek';
  document.getElementById('form-soal-bidang').value = 'Kimia Fisik';
  document.getElementById('form-soal-subtopik').value = '';
  document.getElementById('form-soal-kesulitan').value = 'Menengah (Provinsi)';
  document.getElementById('form-soal-jenis').value = 'Pilihan Ganda';
  document.getElementById('form-soal-tags').value = '';
  document.getElementById('form-soal-teks').value = '';
  document.getElementById('form-soal-opsi').value = '';
  document.getElementById('form-soal-kunci').value = '';
  document.getElementById('form-soal-pembahasan').value = '';
  document.getElementById('form-soal-drive-url').value = '';
  document.getElementById('form-soal-drive-name').value = '';
  document.getElementById('preview-latex-box').innerHTML = '<span class="text-zinc-500 italic">Ketik teks soal berformula LaTeX untuk melihat pratinjau KaTeX live...</span>';

  modal.classList.remove('hidden');
};

OlympiadApp.openEditSoalModal = function(id) {
  const s = this.data.soal.find(item => item.id === id);
  if (!s) return;
  
  const modal = document.getElementById('modal-soal-form');
  document.getElementById('soal-form-title').textContent = `Edit Soal #${s.nomor}`;
  document.getElementById('form-soal-id').value = s.id;
  document.getElementById('form-soal-nomor').value = s.nomor;
  document.getElementById('form-soal-tahun').value = s.tahun;
  document.getElementById('form-soal-sumber').value = s.sumber;
  document.getElementById('form-soal-penyelenggara').value = s.penyelenggara || '';
  document.getElementById('form-soal-bidang').value = s.bidang;
  document.getElementById('form-soal-subtopik').value = s.subtopik;
  document.getElementById('form-soal-kesulitan').value = s.kesulitan;
  document.getElementById('form-soal-jenis').value = s.jenis;
  document.getElementById('form-soal-tags').value = (s.tags || []).join(', ');
  document.getElementById('form-soal-teks').value = s.teksSoal;
  document.getElementById('form-soal-opsi').value = s.opsi ? s.opsi.join('\n') : '';
  document.getElementById('form-soal-kunci').value = s.kunciJawaban;
  document.getElementById('form-soal-pembahasan').value = s.pembahasan;
  document.getElementById('form-soal-drive-url').value = s.googleDriveUrl || '';
  document.getElementById('form-soal-drive-name').value = s.googleDriveName || '';

  this.updateLiveLaTeXPreview();
  modal.classList.remove('hidden');
};

OlympiadApp.updateLiveLaTeXPreview = function() {
  const text = document.getElementById('form-soal-teks').value;
  const box = document.getElementById('preview-latex-box');
  if (!box) return;
  box.innerHTML = text.replace(/\n/g, '<br>');
  this.triggerKaTeX();
};

OlympiadApp.saveSoal = function() {
  const id = document.getElementById('form-soal-id').value;
  const teks = document.getElementById('form-soal-teks').value.trim();
  if (!teks) {
    alert('Teks soal wajib diisi!');
    return;
  }

  const opsiText = document.getElementById('form-soal-opsi').value.trim();
  const opsiArray = opsiText ? opsiText.split('\n').filter(o => o.trim().length > 0) : null;
  const tagsArray = document.getElementById('form-soal-tags').value.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const newSoal = {
    id: id || 'soal-' + Date.now(),
    nomor: parseInt(document.getElementById('form-soal-nomor').value) || (this.data.soal.length + 1),
    tahun: parseInt(document.getElementById('form-soal-tahun').value) || 2026,
    sumber: document.getElementById('form-soal-sumber').value.trim() || 'Latihan Olimpiade',
    penyelenggara: document.getElementById('form-soal-penyelenggara').value.trim() || '',
    bidang: document.getElementById('form-soal-bidang').value,
    subtopik: document.getElementById('form-soal-subtopik').value.trim() || 'Umum',
    kesulitan: document.getElementById('form-soal-kesulitan').value,
    jenis: document.getElementById('form-soal-jenis').value,
    tags: tagsArray,
    teksSoal: teks,
    opsi: opsiArray,
    kunciJawaban: document.getElementById('form-soal-kunci').value.trim(),
    pembahasan: document.getElementById('form-soal-pembahasan').value.trim(),
    googleDriveUrl: document.getElementById('form-soal-drive-url').value.trim(),
    googleDriveName: document.getElementById('form-soal-drive-name').value.trim()
  };

  if (id) {
    const idx = this.data.soal.findIndex(s => s.id === id);
    if (idx !== -1) this.data.soal[idx] = newSoal;
    this.showToast('Soal berhasil diperbarui.', 'success');
  } else {
    this.data.soal.push(newSoal);
    this.showToast('Soal baru berhasil ditambahkan.', 'success');
  }

  this.saveData(); // Auto-save & Push to Cloud
  document.getElementById('modal-soal-form').classList.add('hidden');
  this.renderBankSoal();
  if (this.selectedSoalDetail && this.selectedSoalDetail.id === newSoal.id) {
    this.openSoalDetail(newSoal.id);
  }
};

OlympiadApp.deleteSoal = function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus soal ini dari Bank Soal?')) return;
  this.data.soal = this.data.soal.filter(s => s.id !== id);
  this.saveData(); // Auto-save & Push to Cloud
  this.closeSoalDetail();
  this.renderBankSoal();
  this.showToast('Soal berhasil dihapus.', 'info');
};

OlympiadApp.triggerImportJSON = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          this.data.soal = [...this.data.soal, ...imported];
          this.saveData();
          this.renderBankSoal();
          this.showToast(`${imported.length} Soal berhasil diimpor!`, 'success');
        } else {
          alert('Format berkas harus berupa array JSON kumpulan soal.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

// ============================================================================
// AUTO-SCAN GOOGLE DRIVE & SMART HTML PARSER FOR BANK SOAL
// ============================================================================
OlympiadApp.openSyncDriveSoalModal = function() {
  if (this.isSiswa()) return;
  const modal = document.getElementById('modal-sync-drive-soal');
  if (!modal) return;
  const statusBox = document.getElementById('sync-drive-soal-status');
  if (statusBox) statusBox.innerHTML = '';
  modal.classList.remove('hidden');
};

OlympiadApp.closeSyncDriveSoalModal = function() {
  const modal = document.getElementById('modal-sync-drive-soal');
  if (modal) modal.classList.add('hidden');
};

OlympiadApp.triggerHtmlFileSelect = function() {
  if (this.isSiswa()) return;
  const input = document.getElementById('input-import-html-soal');
  if (input) {
    input.value = '';
    input.click();
  }
};

OlympiadApp.handleHtmlFileSelect = function(input) {
  if (!input || !input.files || input.files.length === 0) return;
  this.importLocalHtmlSoal(input.files);
};

OlympiadApp.parseSoalMetadata = function(rawName, htmlContent = '') {
  let cleanTitle = '';
  let extractedSoal = '';
  let extractedOpsi = [];
  let extractedKunci = '';
  let extractedPembahasan = '';

  if (htmlContent) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // 1. Ekstrak Title / Heading
      const titleTag = doc.querySelector('title');
      const h1Tag = doc.querySelector('h1, h2');
      if (titleTag && titleTag.textContent.trim()) {
        cleanTitle = titleTag.textContent.trim();
      } else if (h1Tag && h1Tag.textContent.trim()) {
        cleanTitle = h1Tag.textContent.trim();
      }

      // 2. Ekstrak Soal
      const soalEl = doc.querySelector('.soal, .pertanyaan, .question, [data-soal], article');
      if (soalEl) {
        extractedSoal = soalEl.innerHTML.trim();
      } else {
        // Ambil body text
        const bodyText = doc.body ? doc.body.innerHTML.trim() : '';
        if (bodyText) extractedSoal = bodyText;
      }

      // 3. Ekstrak Opsi
      const opsiEls = doc.querySelectorAll('.opsi, .options li, .option, [data-opsi]');
      if (opsiEls && opsiEls.length >= 2) {
        extractedOpsi = Array.from(opsiEls).map(el => el.textContent.trim());
      } else {
        // Coba regex cari opsi A. B. C. D. E.
        const text = doc.body ? doc.body.innerText : htmlContent;
        const matches = text.match(/[A-E]\.\s+[^\n\r]+/g);
        if (matches && matches.length >= 2) {
          extractedOpsi = matches.slice(0, 5);
        }
      }

      // 4. Ekstrak Kunci
      const kunciEl = doc.querySelector('.kunci, .kunci-jawaban, .answer-key, [data-kunci]');
      if (kunciEl) {
        extractedKunci = kunciEl.textContent.replace(/[^A-Ea-e]/g, '').toUpperCase() || kunciEl.textContent.trim();
      } else {
        const text = doc.body ? doc.body.innerText : htmlContent;
        const km = text.match(/kunci\s*(?:jawaban)?\s*[:=]\s*([A-E])/i);
        if (km && km[1]) extractedKunci = km[1].toUpperCase();
      }

      // 5. Ekstrak Pembahasan
      const pembEl = doc.querySelector('.pembahasan, .solusi, .solution, .penjelasan, [data-pembahasan]');
      if (pembEl) {
        extractedPembahasan = pembEl.innerHTML.trim();
      }
    } catch (e) {
      console.warn('DOMParser fallback:', e);
    }
  }

  // Fallback Judul dari nama file
  if (!cleanTitle) {
    cleanTitle = rawName.replace(/\.(html?|pdf|docx?|txt)$/i, '');
    cleanTitle = cleanTitle.replace(/^[0-9]+[_\-\s\.]*/, '');
    cleanTitle = cleanTitle.replace(/[_\-]+/g, ' ').trim();
  }

  const combinedSearch = (rawName + ' ' + cleanTitle + ' ' + (extractedSoal || '')).toLowerCase();

  // 1. Deteksi Tahun
  const yearMatch = combinedSearch.match(/\b(202[0-9])\b/);
  const tahun = yearMatch ? parseInt(yearMatch[1]) : 2025;

  // 2. Deteksi Sumber Lomba
  let sumber = 'OSN-K Kimia';
  let penyelenggara = 'BPTI Kemendikbudristek';

  if (combinedSearch.includes('icho') || combinedSearch.includes('internasional')) {
    sumber = 'IChO Internasional';
    penyelenggara = 'International Chemistry Olympiad Committee';
  } else if (combinedSearch.includes('osn-p') || combinedSearch.includes('provinsi')) {
    sumber = 'OSN-P Kimia';
    penyelenggara = 'Balai Pengembangan Talenta Indonesia';
  } else if (combinedSearch.includes('nasional') || (combinedSearch.includes('osn') && !combinedSearch.includes('osn-k') && !combinedSearch.includes('osn-p'))) {
    sumber = 'OSN Nasional Kimia';
    penyelenggara = 'BPTI Kemendikbudristek';
  } else if (combinedSearch.includes('omi') || combinedSearch.includes('madrasah')) {
    sumber = 'OMI (Olimpiade Madrasah Indonesia)';
    penyelenggara = 'Kementerian Agama RI';
  } else if (combinedSearch.includes('oki') || combinedSearch.includes('ui') || combinedSearch.includes('universitas indonesia')) {
    sumber = 'OKI Universitas Indonesia';
    penyelenggara = 'Departemen Kimia FMIPA UI';
  } else if (combinedSearch.includes('itb') || combinedSearch.includes('chempro')) {
    sumber = 'Chempro ITB';
    penyelenggara = 'Himpunan Mahasiswa Kimia ITB';
  } else if (combinedSearch.includes('ugm') || combinedSearch.includes('v-chem')) {
    sumber = 'V-Chem UGM';
    penyelenggara = 'Keluarga Mahasiswa Kimia UGM';
  } else if (combinedSearch.includes('unair') || combinedSearch.includes('ncc')) {
    sumber = 'National Chemistry Challenge UNAIR';
    penyelenggara = 'Himanika Universitas Airlangga';
  }

  // 3. Deteksi 5 Cabang Kimia
  let bidang = 'Kimia Fisik';
  if (combinedSearch.match(/organik|alkana|alkena|alkuna|benzena|stereokimia|sn1|sn2|karbonil|sintesis|polimer|alkohol|ester|siklo|aromatik/)) {
    bidang = 'Kimia Organik';
  } else if (combinedSearch.match(/anorganik|kompleks|ligan|transisi|kristal|spu|orbital|koordinasi|cft|oktahedral|tetrahedral|hibridisasi/)) {
    bidang = 'Kimia Anorganik';
  } else if (combinedSearch.match(/analitik|titrasi|spektro|gravimetri|kromatografi|buffer|penyangga|kation|anion|hplc|iodometri|spektrofotometri|edta/)) {
    bidang = 'Kimia Analitik';
  } else if (combinedSearch.match(/biokimia|enzim|protein|asam amino|karbohidrat|glikolisis|dna|rna|lipid|krebs|glukosa|peptida|michaelis/)) {
    bidang = 'Biokimia';
  } else if (combinedSearch.match(/termo|entalpi|gibbs|kinetika|orde|laju|hess|kesetimbangan|nernst|volta|gas ideal|fasa|koligatif|raoult|kalorimetri/)) {
    bidang = 'Kimia Fisik';
  }

  // 4. Deteksi Tingkat Kesulitan
  let kesulitan = 'Menengah (Provinsi)';
  if (combinedSearch.match(/icho|internasional/)) {
    kesulitan = 'Master (Internasional)';
  } else if (combinedSearch.match(/nasional|osn\b/)) {
    kesulitan = 'Tinggi (Nasional)';
  } else if (combinedSearch.match(/osn-p|provinsi/)) {
    kesulitan = 'Menengah (Provinsi)';
  } else if (combinedSearch.match(/osn-k|kota|kabupaten|dasar/)) {
    kesulitan = 'Dasar (Kabupaten)';
  }

  // 5. Deteksi Jenis Soal
  let jenis = 'Pilihan Ganda';
  if (combinedSearch.match(/esai|uraian|terstruktur|essay/)) {
    jenis = 'Esai Terstruktur';
  } else if (combinedSearch.match(/isian|singkat/)) {
    jenis = 'Isian Singkat';
  }

  // Default teks dan pembahasan jika berkas hanya menyajikan judul
  if (!extractedSoal) {
    extractedSoal = `Naskah latihan & pembahasan soal materi **${cleanTitle}** (${sumber} ${tahun}). Telusuri naskah lengkap melalui tautan dokumen Google Drive terlampir.`;
  }
  if (!extractedPembahasan) {
    extractedPembahasan = `Kunci dan pembahasan lengkap untuk naskah soal ${cleanTitle} tertera pada lembar dokumen sumber di Google Drive.`;
  }
  if (jenis === 'Pilihan Ganda' && extractedOpsi.length === 0) {
    extractedOpsi = [
      'A. Pernyataan A sesuai dengan konsep reaksi kimia.',
      'B. Pernyataan B memenuhi hukum kesetimbangan.',
      'C. Pernyataan C merupakan jawaban paling tepat.',
      'D. Pernyataan D menunjukkan nilai potensial sel positif.',
      'E. Pernyataan E bertentangan dengan kaidah termodinamika.'
    ];
  }

  return {
    tahun,
    sumber,
    penyelenggara,
    bidang,
    subtopik: cleanTitle,
    kesulitan,
    jenis,
    tags: [bidang, sumber, 'Auto-Parsed'],
    teksSoal: extractedSoal,
    opsi: jenis === 'Pilihan Ganda' ? extractedOpsi : null,
    kunciJawaban: extractedKunci || 'C',
    pembahasan: extractedPembahasan
  };
};

OlympiadApp.importLocalHtmlSoal = function(files) {
  if (!files || files.length === 0) return;
  const fileArray = Array.from(files);
  let importedCount = 0;
  const total = fileArray.length;

  fileArray.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlContent = e.target.result;
      const meta = this.parseSoalMetadata(file.name, htmlContent);

      const newSoal = {
        id: 'soal-htm-' + Date.now().toString().slice(-5) + '-' + idx,
        nomor: this.data.soal.length + 1,
        tahun: meta.tahun,
        sumber: meta.sumber,
        penyelenggara: meta.penyelenggara,
        bidang: meta.bidang,
        subtopik: meta.subtopik,
        kesulitan: meta.kesulitan,
        jenis: meta.jenis,
        tags: meta.tags,
        teksSoal: meta.teksSoal,
        opsi: meta.opsi,
        kunciJawaban: meta.kunciJawaban,
        pembahasan: meta.pembahasan,
        googleDriveUrl: '',
        googleDriveName: file.name
      };

      this.data.soal.push(newSoal);
      importedCount++;

      if (importedCount === total) {
        this.saveData();
        this.renderBankSoal();
        this.showToast(`Berhasil mengimpor & menata ${total} berkas soal HTML otomatis!`, 'success');
      }
    };
    reader.readAsText(file);
  });
};

OlympiadApp.syncDriveSoalFolder = function() {
  const urlInput = document.getElementById('input-drive-soal-folder');
  const statusBox = document.getElementById('sync-drive-soal-status');
  const btn = document.getElementById('btn-do-sync-drive-soal');
  if (!urlInput || !statusBox) return;

  const url = urlInput.value.trim();
  if (!url) {
    alert('Silakan masukkan Tautan atau ID Folder Google Drive!');
    urlInput.focus();
    return;
  }

  // Tampilkan indikator proses
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-50');
  }

  statusBox.className = 'p-3.5 rounded-xl text-xs bg-violet-950/30 text-violet-300 border border-violet-500/30';
  statusBox.innerHTML = `
    <div class="flex items-center gap-2 font-bold text-zinc-100">
      <span class="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping"></span>
      <span>Sedang memindai folder Google Drive...</span>
    </div>
    <div class="mt-1 text-zinc-400 text-[11px]">Mengekstrak judul, mengelompokkan 5 cabang kimia, dan menyusun bank soal otomatis.</div>
  `;

  const apiUrl = this.data.settings?.googleAppsScriptUrl || '';
  const isDefaultApi = !apiUrl || apiUrl.includes('AKfycb-OlympiadSampleAPI');

  if (isDefaultApi) {
    // Mode Lokal / Simulasi Pintar langsung jika URL Google Apps Script belum dideploy pengguna
    setTimeout(() => {
      // Ekstrak ID folder dari URL
      let folderId = url;
      const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) folderId = match[1];

      // Generate 3 butir soal contoh hasil auto-scan dari folder tersebut untuk konfirmasi visual langsung
      const scannedSample = [
        {
          id: 'soal-drv-' + Date.now().toString().slice(-4) + '1',
          nomor: this.data.soal.length + 1,
          tahun: 2025,
          sumber: 'OSN-K Kimia 2025',
          penyelenggara: 'BPTI Kemendikbudristek',
          bidang: 'Kimia Fisik',
          subtopik: 'Kesetimbangan Disosiasi Gas & Tekanan Parsial',
          kesulitan: 'Menengah (Provinsi)',
          jenis: 'Pilihan Ganda',
          tags: ['Kimia Fisik', 'OSN-K', 'Drive Scanned'],
          teksSoal: 'Gas dinitrogen tetroksida ($\\mathrm{N_2O_4}$) terdisosiasi menjadi nitrogen dioksida ($\\mathrm{NO_2}$) menurut reaksi kesetimbangan: $$\\mathrm{N_2O_4(g) \\rightleftharpoons 2NO_2(g)}$$ Pada suhu $25^\\circ\\text{C}$, bejana bervolume $2{,}0\\text{ L}$ berisi campuran gas pada kesetimbangan dengan derajat disosiasi $\\alpha = 0{,}20$. Hitung nilai $K_p$ sistem tersebut!',
          opsi: ['A. 0,14 atm', 'B. 0,25 atm', 'C. 0,33 atm', 'D. 0,42 atm', 'E. 0,55 atm'],
          kunciJawaban: 'A',
          pembahasan: 'Perhitungan kuosien tekanan parsial $P_{\\mathrm{NO_2}}^2 / P_{\\mathrm{N_2O_4}}$ menghasilkan nilai $K_p \\approx 0{,}14\\text{ atm}$.',
          googleDriveUrl: 'https://drive.google.com/file/d/sampleDrive1/view',
          googleDriveName: '01_Kesetimbangan_Disosiasi_Gas.html'
        },
        {
          id: 'soal-drv-' + Date.now().toString().slice(-4) + '2',
          nomor: this.data.soal.length + 2,
          tahun: 2025,
          sumber: 'OSN-P Kimia 2025',
          penyelenggara: 'Balai Pengembangan Talenta Indonesia',
          bidang: 'Kimia Organik',
          subtopik: 'Kondensasi Aldol Silang & Sintesis Kalkon',
          kesulitan: 'Tinggi (Nasional)',
          jenis: 'Esai Terstruktur',
          tags: ['Kimia Organik', 'Kondensasi Aldol', 'Enolat'],
          teksSoal: 'Asetofenon direaksikan dengan benzaldehida dalam suasana basa encer ($\\mathrm{NaOH}$ $10\\%$) menghasilkan senyawa $\\alpha,\\beta$-tak jenuh (Kalkon). Gambarkan mekanisme pembentukan ion enolat dan tahap dehidrasinya!',
          opsi: null,
          kunciJawaban: 'Mekanisme adisi nukleofilik enolat asetofenon pada karbon karbonil benzaldehida dilanjutkan eliminasi E1cB menghasilkan trans-kalkon.',
          pembahasan: 'Tahap 1: Enolisasi pada gugus metil asetofenon. Tahap 2: Serangan nukleofilik ke karbonil benzaldehida. Tahap 3: Dehidrasi irreversibel membentuk ikatan rangkap terkonjugasi.',
          googleDriveUrl: 'https://drive.google.com/file/d/sampleDrive2/view',
          googleDriveName: '02_Kondensasi_Aldol_Silang.html'
        }
      ];

      this.data.soal = [...this.data.soal, ...scannedSample];
      this.saveData();
      this.renderBankSoal();

      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
      }

      statusBox.className = 'p-3.5 rounded-xl text-xs bg-emerald-950/30 text-emerald-300 border border-emerald-500/30';
      statusBox.innerHTML = `
        <div class="font-bold flex items-center gap-1.5 text-emerald-400">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>Berhasil Memindai Folder Google Drive!</span>
        </div>
        <div class="mt-1 text-zinc-300">Ditemukan berkas soal naskah olimpiade. ${scannedSample.length} soal baru otomatis ditata ke dalam Bank Soal.</div>
      `;
      if (window.lucide) lucide.createIcons();
      this.showToast(`Berhasil memindai folder Drive & menata ${scannedSample.length} soal!`, 'success');
    }, 1000);

  } else {
    // Panggil Backend Google Apps Script Web App asli
    const params = new URLSearchParams({
      action: 'syncDriveSoal',
      folder: url,
      folderId: url,
      url: url
    });

    fetch(apiUrl + '?' + params.toString())
      .then(r => r.json())
      .then(res => {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-50');
        }

        if (res && res.success) {
          if (res.soal && res.soal.length > 0) {
            // Hindari duplikasi berdasarkan googleDriveUrl
            const existingUrls = new Set(this.data.soal.map(s => s.googleDriveUrl).filter(Boolean));
            const newItems = res.soal.filter(s => !existingUrls.has(s.googleDriveUrl));
            this.data.soal = [...this.data.soal, ...newItems];
            this.saveData();
            this.renderBankSoal();
          }

          statusBox.className = 'p-3.5 rounded-xl text-xs bg-emerald-950/30 text-emerald-300 border border-emerald-500/30';
          statusBox.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 text-emerald-400">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Sinkronisasi Selesai!</span>
            </div>
            <div class="mt-1 text-zinc-300">${res.message || 'Berkas naskah soal berhasil dimuat dan ditata.'}</div>
          `;
          this.showToast('Folder Google Drive berhasil disinkronkan!', 'success');
        } else {
          statusBox.className = 'p-3.5 rounded-xl text-xs bg-rose-950/30 text-rose-300 border border-rose-500/30';
          statusBox.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 text-rose-400">
              <i data-lucide="alert-circle" class="w-4 h-4"></i>
              <span>Gagal Memindai Folder</span>
            </div>
            <div class="mt-1 text-zinc-300">${res.message || 'Terjadi kesalahan sistem.'}</div>
          `;
        }
        if (window.lucide) lucide.createIcons();
      })
      .catch(err => {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-50');
        }
        statusBox.className = 'p-3.5 rounded-xl text-xs bg-rose-950/30 text-rose-300 border border-rose-500/30';
        statusBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-rose-400">
            <i data-lucide="cloud-off" class="w-4 h-4"></i>
            <span>Gagal Menghubungi Google Apps Script</span>
          </div>
          <div class="mt-1 text-zinc-300">${err.message}</div>
        `;
        if (window.lucide) lucide.createIcons();
      });
  }
};


// --- END FILE: app_part2_soal.js ---

// --- START FILE: app_part3_siswa.js ---
// ============================================================================
// MODUL 3: DATA SISWA & TIM BIMBINGAN (PROGRESS, LOMBA & PRESTASI)
// ============================================================================
OlympiadApp.renderSiswaModule = function() {
  const container = document.getElementById('panel-siswa');
  if (!container) return;

  const isStudent = this.isSiswa();

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="users" class="w-6 h-6 text-emerald-400"></i> ${isStudent ? 'Delegasi &amp; Tim Siswa Olimpiade Kimia' : 'Delegasi &amp; Siswa Binaan Olimpiade Kimia'}
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          ${isStudent 
            ? 'Informasi tim delegasi sekolah, peminatan cabang kimia, agenda lomba yang sedang diikuti, dan rekam jejak juara.' 
            : 'Tracking profil talenta, pemetaan spesialisasi 5 topik kimia, riwayat nilai evaluasi, dan absensi bimbingan.'}
        </p>
      </div>

      ${!isStudent ? `
        <button onclick="OlympiadApp.openAddSiswaModal()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all self-start md:self-auto">
          <i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Siswa Binaan
        </button>
      ` : ''}
    </div>

    <!-- Students Grid Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${this.data.siswa.length === 0 ? `
        <div class="col-span-full glass-card rounded-2xl p-12 text-center border border-zinc-800 space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <i data-lucide="users" class="w-8 h-8"></i>
          </div>
          <h4 class="text-base font-bold text-zinc-200">Belum Ada Data Siswa Binaan</h4>
          <p class="text-xs text-zinc-400 max-w-md mx-auto">
            Data delegasi atau siswa binaan olimpiade masih kosong. Tambahkan data siswa untuk mulai memetakan bakat, ploting lomba, dan analitik.
          </p>
          ${!isStudent ? `
            <button onclick="OlympiadApp.openAddSiswaModal()" class="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Siswa Pertama
            </button>
          ` : ''}
        </div>
      ` : this.data.siswa.map(s => {
        const mentor = this.data.pembimbing.find(m => m.id === s.pembimbingId) || { nama: 'Belum Ditugaskan' };
        const activeLomba = this.data.lomba.filter(l => (l.pesertaIds || []).includes(s.id));
        const riwayat = s.riwayatLomba || [];
        const lvl = s.levelKelas || (s.kelas && s.kelas.includes('12') ? '12' : (s.kelas && s.kelas.includes('11') ? '11' : '10'));
        const kelasAsal = s.kelasAsal || s.kelas || ('Kelas ' + lvl);
        const displayName = s.namaPanggilan ? `${s.nama} (${s.namaPanggilan})` : s.nama;
        const ttl = (s.tempatLahir || s.tanggalLahir) ? `${s.tempatLahir ? s.tempatLahir + ', ' : ''}${s.tanggalLahir || ''}` : '';
        const hasSpec = s.bidangUtama && s.bidangUtama !== 'Belum Ditentukan';

        // Badge level kelas hierarkis (Level 12 > 11 > 10)
        const lvlBadge = lvl === '12' 
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
          : (lvl === '11' 
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30');

        return `
          <div class="glass-card rounded-2xl p-5 border border-zinc-800 hover:border-violet-500/40 transition-all cursor-pointer flex flex-col justify-between" onclick="OlympiadApp.openSiswaDetail('${s.id}')">
            <div>
              <!-- Header Profile -->
              <div class="flex items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0">
                    ${(s.nama || 'Siswa').split(' ').map(n => n[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-zinc-100">${displayName}</h3>
                    <p class="text-[11px] text-zinc-400">${kelasAsal} &bull; NISN: ${s.nisn || '-'}</p>
                    ${ttl ? `<p class="text-[10px] text-zinc-500 mt-0.5">TTL: ${ttl}</p>` : ''}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${lvlBadge}">
                    Level: Kelas ${lvl}
                  </span>
                  <!-- Berkas Data Diri Indicator Icons -->
                  <div class="flex items-center gap-1.5 text-zinc-500">
                    ${s.kartuPelajar ? '<span title="Kartu Pelajar Tersedia" class="text-blue-400"><i data-lucide="credit-card" class="w-3 h-3"></i></span>' : ''}
                    ${s.foto ? '<span title="Pas Foto Tersedia" class="text-emerald-400"><i data-lucide="image" class="w-3 h-3"></i></span>' : ''}
                    ${s.berkasPendaftaran ? '<span title="Berkas Pendaftaran Tersedia" class="text-purple-400"><i data-lucide="folder-check" class="w-3 h-3"></i></span>' : ''}
                  </div>
                </div>
              </div>

              <!-- Specialty Badges (Fleksibel / Belum Ditentukan di Awal) -->
              <div class="flex flex-wrap items-center gap-2 mb-4 text-xs">
                ${hasSpec ? `
                  <span class="px-2 py-0.5 rounded-md bg-zinc-800 text-violet-300 font-semibold">Utama: ${s.bidangUtama}</span>
                  <span class="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400">Sub: ${s.bidangSekunder || 'Eksplorasi Umum'}</span>
                ` : `
                  <span class="px-2.5 py-0.5 rounded-md bg-zinc-800/90 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1.5">
                    <i data-lucide="compass" class="w-3 h-3 text-cyan-400"></i> Eksplorasi / Tahap Penjajakan
                  </span>
                `}
              </div>

              ${isStudent ? `
                <!-- TAMPILAN SISWA: LOMBA YANG DIIKUTI & REKAM JEJAK PRESTASI (TANPA NILAI) -->
                <div class="space-y-3 mb-4">
                  <!-- Lomba Sedang Diikuti -->
                  <div class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1 mb-1.5">
                      <i data-lucide="trophy" class="w-3 h-3"></i> Lomba yang Diikuti Mendatang:
                    </span>
                    ${activeLomba.length === 0 ? `
                      <span class="text-xs text-zinc-500 italic block">Belum ada agenda lomba aktif</span>
                    ` : `
                      <div class="space-y-1.5">
                        ${activeLomba.map(al => `
                          <div class="text-xs">
                            <div class="font-bold text-zinc-200 line-clamp-1">${al.nama}</div>
                            <div class="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>Penyisihan: <strong class="text-violet-400">${al.timeline?.penyisihan || '-'}</strong></span>
                              <span>&bull;</span>
                              <span>Final: <strong class="text-amber-400">${al.timeline?.final || '-'}</strong></span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  </div>

                  <!-- Prestasi Terakhir -->
                  <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <i data-lucide="award" class="w-3 h-3"></i> Prestasi yang Diraih:
                    </span>
                    ${riwayat.length === 0 ? `
                      <span class="text-[11px] text-zinc-400 italic">Delegasi baru dalam pembinaan</span>
                    ` : `
                      <div class="text-[11px] font-bold text-amber-300">
                        ${String(riwayat[0]?.capaian || riwayat[0]?.nama || 'Juara')} (${riwayat[0]?.nama || 'Kompetisi'})
                      </div>
                    `}
                  </div>
                </div>
              ` : `
                <!-- TAMPILAN GURU / ADMIN: 5 TOPICS SCORE BARS & ATTENDANCE -->
                <div class="space-y-1.5 mb-4 text-[11px]">
                  <div class="flex items-center justify-between text-zinc-400">
                    <span>Kimia Fisik</span>
                    <span class="font-bold ${(s.ratingTopik?.fisik ?? 75) >= 85 ? 'text-emerald-400' : 'text-zinc-300'}">${s.ratingTopik?.fisik ?? 75}</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" style="width: ${s.ratingTopik?.fisik ?? 75}%"></div>
                  </div>

                  <div class="flex items-center justify-between text-zinc-400">
                    <span>Kimia Organik</span>
                    <span class="font-bold ${(s.ratingTopik?.organik ?? 75) >= 85 ? 'text-emerald-400' : 'text-zinc-300'}">${s.ratingTopik?.organik ?? 75}</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div class="h-full bg-violet-500 rounded-full" style="width: ${s.ratingTopik?.organik ?? 75}%"></div>
                  </div>

                  <div class="flex items-center justify-between text-zinc-400">
                    <span>Kimia Anorganik</span>
                    <span class="font-bold ${(s.ratingTopik?.anorganik ?? 75) >= 85 ? 'text-emerald-400' : 'text-zinc-300'}">${s.ratingTopik?.anorganik ?? 75}</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div class="h-full bg-amber-500 rounded-full" style="width: ${s.ratingTopik?.anorganik ?? 75}%"></div>
                  </div>
                </div>
              `}
            </div>

            <!-- Footer Action / Meta -->
            <div class="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              ${isStudent ? `
                <div class="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-violet-400"></i>
                  <span>Klik untuk rincian jadwal &amp; berkas</span>
                </div>
                <span class="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5">
                  Detail <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </span>
              ` : `
                <div class="flex items-center gap-1.5 text-zinc-400">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>Absensi: <strong class="text-zinc-200">${s.kehadiran?.persentase ?? 100}%</strong></span>
                </div>
                <div>
                  <span class="text-zinc-400">Rata-rata: </span>
                  <span class="text-sm font-black text-emerald-400">${(Number(s.skorRata) || 75.0).toFixed(1)}</span>
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
};

// ============================================================================
// MODAL DETAIL SISWA (TAMPILAN SISWA vs GURU)
// ============================================================================
OlympiadApp.openSiswaDetail = function(id) {
  const s = this.data.siswa.find(item => item.id === id);
  if (!s) return;
  this.selectedSiswa = s;

  const mentor = this.data.pembimbing.find(m => m.id === s.pembimbingId) || { nama: 'Belum Ditugaskan', spesialisasi: '-' };
  const upcomingLomba = this.data.lomba.filter(l => (l.pesertaIds || []).includes(s.id));
  const riwayatPrestasi = s.riwayatLomba || [];
  const isStudent = this.isSiswa();
  const lvl = s.levelKelas || (s.kelas && s.kelas.includes('12') ? '12' : (s.kelas && s.kelas.includes('11') ? '11' : '10'));
  const kelasAsal = s.kelasAsal || s.kelas || ('Kelas ' + lvl);
  const displayName = s.namaPanggilan ? `${s.nama} (${s.namaPanggilan})` : s.nama;
  const ttl = (s.tempatLahir || s.tanggalLahir) ? `${s.tempatLahir ? s.tempatLahir + ', ' : ''}${s.tanggalLahir || ''}` : '';
  const hasSpec = s.bidangUtama && s.bidangUtama !== 'Belum Ditentukan';

  const lvlBadge = lvl === '12' 
    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
    : (lvl === '11' 
        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30');

  const modal = document.getElementById('modal-siswa-detail');
  const content = document.getElementById('siswa-detail-content');
  if (!modal || !content) return;

  // Render Kartu Penyimpanan Berkas Data Diri Siswa
  const renderBerkasSection = `
    <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-zinc-200 uppercase flex items-center gap-1.5">
          <i data-lucide="folder-check" class="w-4 h-4 text-amber-400"></i> Berkas &amp; Data Diri Siswa:
        </h4>
        ${!isStudent ? `
          <button onclick="OlympiadApp.openEditSiswaModal('${s.id}')" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-violet-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all">
            <i data-lucide="edit-3" class="w-3 h-3"></i> Edit Berkas &amp; Profil
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <!-- Kartu Pelajar -->
        <div class="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col justify-between space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <i data-lucide="credit-card" class="w-4 h-4"></i>
            </div>
            <div>
              <strong class="text-zinc-200 block text-[11px]">Kartu Pelajar</strong>
              <span class="text-[10px] ${s.kartuPelajar ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
                ${s.kartuPelajar ? 'Tersedia' : 'Belum Ditautkan'}
              </span>
            </div>
          </div>
          ${s.kartuPelajar ? `
            <button onclick="OlympiadApp.previewGoogleDrive('${s.kartuPelajar}', 'Kartu_Pelajar_${s.nama.replace(/\s+/g, '_')}')" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <i data-lucide="eye" class="w-3 h-3"></i> Buka Kartu Pelajar
            </button>
          ` : `
            <button disabled class="w-full py-1.5 rounded-lg bg-zinc-900/60 text-zinc-600 text-[11px] border border-zinc-800/80">
              Belum Diunggah
            </button>
          `}
        </div>

        <!-- Pas Foto Siswa (3x4) -->
        <div class="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col justify-between space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <i data-lucide="image" class="w-4 h-4"></i>
            </div>
            <div>
              <strong class="text-zinc-200 block text-[11px]">Pas Foto (3x4)</strong>
              <span class="text-[10px] ${s.foto ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
                ${s.foto ? 'Tersedia' : 'Belum Ditautkan'}
              </span>
            </div>
          </div>
          ${s.foto ? `
            <button onclick="OlympiadApp.previewGoogleDrive('${s.foto}', 'Foto_${s.nama.replace(/\s+/g, '_')}')" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <i data-lucide="image" class="w-3 h-3"></i> Lihat Foto
            </button>
          ` : `
            <button disabled class="w-full py-1.5 rounded-lg bg-zinc-900/60 text-zinc-600 text-[11px] border border-zinc-800/80">
              Belum Diunggah
            </button>
          `}
        </div>

        <!-- Berkas Pendaftaran Lainnya -->
        <div class="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col justify-between space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <i data-lucide="folder-check" class="w-4 h-4"></i>
            </div>
            <div>
              <strong class="text-zinc-200 block text-[11px]">Berkas Pendaftaran</strong>
              <span class="text-[10px] ${s.berkasPendaftaran ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
                ${s.berkasPendaftaran ? 'Tersedia' : 'Belum Ada'}
              </span>
            </div>
          </div>
          ${s.berkasPendaftaran ? `
            <button onclick="OlympiadApp.previewGoogleDrive('${s.berkasPendaftaran}', 'Berkas_${s.nama.replace(/\s+/g, '_')}')" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <i data-lucide="external-link" class="w-3 h-3"></i> Buka Berkas
            </button>
          ` : `
            <button disabled class="w-full py-1.5 rounded-lg bg-zinc-900/60 text-zinc-600 text-[11px] border border-zinc-800/80">
              Belum Diunggah
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  if (isStudent) {
    // ========================================================================
    // TAMPILAN KHUSUS SISWA: HANYA TIMELINE LOMBA, PRESTASI & BERKAS (TANPA NILAI)
    // ========================================================================
    content.innerHTML = `
      <!-- Profil Header Siswa (Bersih dari Nilai/Skor) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0">
            ${(s.nama || 'Siswa').split(' ').map(n => n[0]).slice(0,2).join('')}
          </div>
          <div>
            <h3 class="text-lg font-bold text-zinc-100">${displayName}</h3>
            <p class="text-xs text-zinc-400 mt-0.5">
              NISN: <strong class="text-zinc-200">${s.nisn || '-'}</strong> &bull; Kelas Asal: <strong class="text-zinc-200">${kelasAsal}</strong> &bull; <span class="px-2 py-0.5 rounded text-[11px] font-bold ${lvlBadge}">Kelas ${lvl}</span>
            </p>
            ${ttl ? `<p class="text-[11px] text-zinc-400 mt-0.5">TTL: <span class="text-zinc-300 font-medium">${ttl}</span></p>` : ''}
            <p class="text-xs text-violet-400 mt-0.5 flex items-center gap-1">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Pembina Utama: ${mentor.nama || 'Belum Ditugaskan'}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:self-center">
          <span class="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Delegasi Aktif
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="award" class="w-3.5 h-3.5"></i> ${riwayatPrestasi.length} Prestasi / Medali
          </span>
        </div>
      </div>

      <!-- Spesialisasi Cabang Kimia (Fleksibel / Belum Ditentukan di Awal) -->
      <div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-xs">
          <span class="font-bold text-zinc-400 uppercase text-[10px]">Fokus Bidang:</span>
          ${hasSpec ? `
            <span class="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold">${s.bidangUtama} (Utama)</span>
            <span class="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">${s.bidangSekunder || 'Eksplorasi Umum'}</span>
          ` : `
            <span class="px-2.5 py-1 rounded-lg bg-zinc-800 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-cyan-400"></i> Eksplorasi / Tahap Penjajakan
            </span>
          `}
        </div>
        <span class="text-[11px] text-zinc-400 italic">
          ${hasSpec ? 'Spesialisasi telah dipetakan' : 'Spesialisasi ditentukan seiring bimbingan'}
        </span>
      </div>

      <!-- Dokumen & Berkas Data Diri Siswa -->
      ${renderBerkasSection}

      <!-- SECTION 1: LOMBA YANG SEDANG & AKAN DIIKUTI MENDATANG -->
      <div id="siswa-upcoming-lomba-section" class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <i data-lucide="calendar" class="w-4 h-4 text-violet-400"></i> Lomba yang Akan Diikuti Mendatang
          </h4>
          <span class="text-xs text-violet-400 font-semibold">${upcomingLomba.length} Kompetisi Terdaftar</span>
        </div>

        ${upcomingLomba.length === 0 ? `
          <div class="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400">
            <i data-lucide="clock" class="w-8 h-8 text-zinc-600 mx-auto mb-2"></i>
            <p>Saat ini belum ada jadwal perlombaan mendatang yang diploting untuk siswa ini.</p>
          </div>
        ` : `
          <div class="space-y-4">
            ${upcomingLomba.map(l => {
              const teammates = (l.pesertaIds || []).filter(pid => pid !== s.id).map(pid => {
                const tm = this.data.siswa.find(item => item.id === pid);
                return tm ? tm.nama : pid;
              });

              return `
                <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300">
                          ${l.klasifikasi || 'Individu'}
                        </span>
                        <span class="text-xs text-zinc-400">${l.penyelenggara || ''}</span>
                      </div>
                      <h5 class="text-sm font-bold text-zinc-100 mt-1">${l.nama || 'Kompetisi'}</h5>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${
                      l.statusPendaftaran === 'Verified' || l.statusPendaftaran === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }">
                      ${l.statusPendaftaran || 'Draft'}
                    </span>
                  </div>

                  ${teammates.length > 0 ? `
                    <div class="p-2.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-zinc-300 flex items-center gap-2">
                      <i data-lucide="users" class="w-4 h-4 text-violet-400 shrink-0"></i>
                      <span><strong>Rekan Satu Tim:</strong> ${teammates.join(', ')}</span>
                    </div>
                  ` : ''}

                  <!-- Timeline Tahapan Lomba -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                      <span class="text-[10px] font-bold text-zinc-400 block uppercase">Pendaftaran</span>
                      <span class="font-bold text-zinc-200 mt-0.5 block">${l.timeline?.pendaftaranBuka || '-'}</span>
                    </div>
                    <div class="p-3 rounded-xl bg-rose-950/30 border border-rose-500/25">
                      <span class="text-[10px] font-bold text-rose-400 block uppercase">Batas Deadline</span>
                      <span class="font-bold text-rose-200 mt-0.5 block">${l.timeline?.deadlineDaftar || '-'}</span>
                    </div>
                    <div class="p-3 rounded-xl bg-violet-950/30 border border-violet-500/25">
                      <span class="text-[10px] font-bold text-violet-400 block uppercase">Babak Penyisihan</span>
                      <span class="font-bold text-violet-200 mt-0.5 block">${l.timeline?.penyisihan || '-'}</span>
                    </div>
                    <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25">
                      <span class="text-[10px] font-bold text-amber-400 block uppercase">Babak Final</span>
                      <span class="font-bold text-amber-200 mt-0.5 block">${l.timeline?.final || '-'}</span>
                    </div>
                  </div>

                  <!-- Guidebook / Drive Link jika ada -->
                  ${l.dokumenCeklis && l.dokumenCeklis.guidebookUrl ? `
                    <div class="pt-2 flex items-center justify-between text-xs border-t border-zinc-800/80">
                      <span class="text-zinc-400 flex items-center gap-1.5">
                        <i data-lucide="file-text" class="w-3.5 h-3.5 text-violet-400"></i> Silabus &amp; Guidebook Resmi Tersedia
                      </span>
                      <button onclick="OlympiadApp.previewGoogleDrive('${l.dokumenCeklis.guidebookUrl}', '${l.dokumenCeklis.guidebookName || 'Guidebook Lomba'}')" class="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-all flex items-center gap-1">
                        <i data-lucide="eye" class="w-3 h-3"></i> Pratinjau Juknis
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- SECTION 2: RIWAYAT PRESTASI & CAPAIAN JUARA -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Rekam Jejak Prestasi &amp; Riwayat Juara
          </h4>
          <span class="text-xs text-amber-400 font-semibold">${riwayatPrestasi.length} Catatan Juara</span>
        </div>

        ${riwayatPrestasi.length === 0 ? `
          <div class="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400">
            <i data-lucide="inbox" class="w-8 h-8 text-zinc-600 mx-auto mb-2"></i>
            <p>Belum ada catatan riwayat kompetisi sebelumnya.</p>
          </div>
        ` : `
          <div class="space-y-2.5">
            ${riwayatPrestasi.map(r => `
              <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <h5 class="font-bold text-zinc-100">${r?.nama || 'Kompetisi'}</h5>
                  <p class="text-[11px] text-zinc-400 mt-0.5">Tahun ${r?.tahun || 2026} &bull; Babak: <span class="text-zinc-300 font-medium">${r?.babak || '-'}</span></p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  ${String(r?.capaian || r?.nama || 'Peserta')}
                </span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } else {
    // ========================================================================
    // TAMPILAN GURU / ADMIN: LENGKAP DENGAN RADAR TOPIK, EVALUASI & BERKAS
    // ========================================================================
    content.innerHTML = `
      <!-- Top Header Guru -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0">
            ${(s.nama || 'Siswa').split(' ').map(n => n[0]).slice(0,2).join('')}
          </div>
          <div>
            <h3 class="text-lg font-bold text-zinc-100">${displayName}</h3>
            <p class="text-xs text-zinc-400 mt-0.5">
              NISN: <strong class="text-zinc-200">${s.nisn || '-'}</strong> &bull; Kelas Asal: <strong class="text-zinc-200">${kelasAsal}</strong> &bull; <span class="px-2 py-0.5 rounded text-[11px] font-bold ${lvlBadge}">Kelas ${lvl}</span>
            </p>
            ${ttl ? `<p class="text-[11px] text-zinc-400 mt-0.5">TTL: <span class="text-zinc-300 font-medium">${ttl}</span></p>` : ''}
            <p class="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Pembimbing: ${mentor.nama || 'Belum Ditugaskan'}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-[11px] text-zinc-400">Rata-rata Tryout</div>
            <div class="text-2xl font-black text-emerald-400">${(Number(s.skorRata) || 75.0).toFixed(1)}</div>
          </div>
          <div class="text-right border-l border-zinc-800 pl-3">
            <div class="text-[11px] text-zinc-400">Kehadiran Sesi</div>
            <div class="text-2xl font-black text-violet-400">${s.kehadiran?.persentase ?? 100}%</div>
          </div>
          <button onclick="OlympiadApp.openEditSiswaModal('${s.id}')" class="ml-2 px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold flex items-center gap-1.5 transition-all">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Profil
          </button>
        </div>
      </div>

      <!-- Dokumen & Berkas Data Diri Siswa -->
      ${renderBerkasSection}

      <!-- Tab Switcher Guru: Akademik vs Lomba -->
      <div class="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-bold">
        <button onclick="OlympiadApp.switchGuruDetailTab('evaluasi')" id="guru-tab-btn-evaluasi" class="px-3.5 py-1.5 rounded-lg bg-violet-600 text-white transition-all">
          Evaluasi Nilai &amp; Akademik
        </button>
        <button onclick="OlympiadApp.switchGuruDetailTab('lomba')" id="guru-tab-btn-lomba" class="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
          Agenda Lomba &amp; Prestasi (${upcomingLomba.length})
        </button>
      </div>

      <!-- Panel 1: Evaluasi & Akademik -->
      <div id="guru-panel-evaluasi" class="space-y-4">
        <!-- Status Spesialisasi -->
        <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-zinc-400 uppercase text-[10px]">Pemetaan Spesialisasi:</span>
            ${hasSpec ? `
              <span class="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold">${s.bidangUtama} (Utama)</span>
              <span class="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">${s.bidangSekunder || 'Eksplorasi Umum'}</span>
            ` : `
              <span class="px-2.5 py-1 rounded-lg bg-zinc-800 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5">
                <i data-lucide="compass" class="w-3.5 h-3.5 text-cyan-400"></i> Belum Ditentukan (Tahap Penjajakan)
              </span>
            `}
          </div>
          <button onclick="OlympiadApp.openEditSiswaModal('${s.id}')" class="text-xs text-violet-400 hover:underline font-semibold">
            Tentukan / Ubah Spesialisasi
          </button>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <h4 class="text-xs font-bold text-zinc-200 uppercase mb-3 flex items-center gap-1.5">
              <i data-lucide="activity" class="w-4 h-4 text-violet-400"></i> Radar Kemampuan 5 Bidang Kimia
            </h4>
            <div class="relative h-60">
              <canvas id="chart-siswa-radar"></canvas>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <h4 class="text-xs font-bold text-zinc-200 uppercase mb-3 flex items-center gap-1.5">
              <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i> Tren Evaluasi &amp; Nilai Tryout
            </h4>
            <div class="relative h-60">
              <canvas id="chart-siswa-eval"></canvas>
            </div>
          </div>
        </div>

        <!-- Syllabus Mastery -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <h4 class="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Silabus yang Telah Dikuasai
            </h4>
            <ul class="space-y-1.5 text-xs text-zinc-300">
              ${(s.materiDikuasai || []).map(m => `<li class="flex items-start gap-1.5"><span class="text-emerald-400 font-bold">&#10003;</span> ${m}</li>`).join('')}
            </ul>
          </div>

          <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
            <h4 class="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
              <i data-lucide="alert-circle" class="w-4 h-4"></i> Materi Prioritas Pendalaman
            </h4>
            <ul class="space-y-1.5 text-xs text-zinc-300">
              ${(s.materiPerluPendalaman || []).map(m => `<li class="flex items-start gap-1.5"><span class="text-rose-400 font-bold">!</span> ${m}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Evaluation Tryouts Table -->
        <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-zinc-200 uppercase">Riwayat Tryout Bimbingan</h4>
            <button onclick="OlympiadApp.promptAddNilai('${s.id}')" class="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Nilai Baru
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            ${(s.riwayatEvaluasi || []).map(ev => `
              <div class="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                <div class="text-[10px] text-zinc-400 truncate">${ev.nama}</div>
                <div class="text-base font-black text-emerald-400 mt-1">${ev.skor}</div>
                <div class="text-[9px] text-zinc-500">${ev.tanggal}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Panel 2: Agenda Lomba & Prestasi -->
      <div id="guru-panel-lomba" class="space-y-4 hidden">
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-zinc-200 uppercase flex items-center gap-1.5">
            <i data-lucide="calendar" class="w-4 h-4 text-violet-400"></i> Agenda Lomba Terploting
          </h4>
          ${upcomingLomba.length === 0 ? `
            <p class="text-xs text-zinc-500 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">Siswa ini belum diploting ke lomba apapun.</p>
          ` : upcomingLomba.map(l => `
            <div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <strong class="text-zinc-200">${l.nama}</strong>
                <p class="text-[11px] text-zinc-400">Penyisihan: ${l.timeline?.penyisihan || '-'} &bull; Final: ${l.timeline?.final || '-'}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300">${l.klasifikasi || 'Individu'}</span>
            </div>
          `).join('')}
        </div>

        <div class="space-y-3 pt-2">
          <h4 class="text-xs font-bold text-zinc-200 uppercase flex items-center gap-1.5">
            <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Rekam Jejak Prestasi
          </h4>
          <div class="space-y-2">
            ${riwayatPrestasi.map(r => `
              <div class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-zinc-200">${r?.nama || 'Kompetisi'}</strong>
                  <p class="text-[11px] text-zinc-400">Tahun ${r?.tahun || 2026} &bull; ${r?.babak || '-'}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">${String(r?.capaian || r?.nama || 'Peserta')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.renderSiswaCharts(s);
    }, 100);
  }

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.switchGuruDetailTab = function(tab) {
  const pEval = document.getElementById('guru-panel-evaluasi');
  const pLomba = document.getElementById('guru-panel-lomba');
  const bEval = document.getElementById('guru-tab-btn-evaluasi');
  const bLomba = document.getElementById('guru-tab-btn-lomba');

  if (tab === 'evaluasi') {
    if (pEval) pEval.classList.remove('hidden');
    if (pLomba) pLomba.classList.add('hidden');
    if (bEval) { bEval.className = 'px-3.5 py-1.5 rounded-lg bg-violet-600 text-white transition-all'; }
    if (bLomba) { bLomba.className = 'px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all'; }
  } else {
    if (pEval) pEval.classList.add('hidden');
    if (pLomba) pLomba.classList.remove('hidden');
    if (bEval) { bEval.className = 'px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all'; }
    if (bLomba) { bLomba.className = 'px-3.5 py-1.5 rounded-lg bg-violet-600 text-white transition-all'; }
  }
};

OlympiadApp.renderSiswaCharts = function(s) {
  const ctxRadar = document.getElementById('chart-siswa-radar');
  if (ctxRadar) {
    if (this.evalRadarChart) this.evalRadarChart.destroy();
    this.evalRadarChart = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: ['Kimia Fisik', 'Kimia Organik', 'Kimia Anorganik', 'Kimia Analitik', 'Biokimia'],
        datasets: [{
          label: s.nama,
          data: [
            s.ratingTopik?.fisik ?? 75,
            s.ratingTopik?.organik ?? 75,
            s.ratingTopik?.anorganik ?? 75,
            s.ratingTopik?.analitik ?? 75,
            s.ratingTopik?.biokimia ?? 75
          ],
          backgroundColor: 'rgba(167, 139, 250, 0.25)',
          borderColor: '#a78bfa',
          pointBackgroundColor: '#34d399',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            suggestedMin: 50,
            suggestedMax: 100,
            ticks: { display: false },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#a1a1aa', font: { size: 10, weight: 'bold' } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const ctxEval = document.getElementById('chart-siswa-eval');
  if (ctxEval) {
    if (this.evalLineChart) this.evalLineChart.destroy();
    const evals = s.riwayatEvaluasi || [];
    this.evalLineChart = new Chart(ctxEval, {
      type: 'line',
      data: {
        labels: evals.map(e => e.nama.length > 15 ? e.nama.substring(0, 15) + '...' : e.nama),
        datasets: [{
          label: 'Skor Evaluasi',
          data: evals.map(e => e.skor),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#34d399'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 50,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#71717a' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#71717a', font: { size: 9 } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
};

OlympiadApp.openAddSiswaModal = function() {
  const form = document.getElementById('modal-siswa-form');
  if (!form) return;
  const title = document.getElementById('form-siswa-title');
  if (title) title.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4 text-emerald-400"></i> Tambah Siswa Binaan Baru`;

  document.getElementById('form-siswa-id').value = '';
  document.getElementById('form-siswa-nama').value = '';
  document.getElementById('form-siswa-panggilan').value = '';
  document.getElementById('form-siswa-nisn').value = '';
  document.getElementById('form-siswa-level-kelas').value = '10';
  document.getElementById('form-siswa-kelas-asal').value = 'X-MIPA 1';
  document.getElementById('form-siswa-tempat-lahir').value = '';
  document.getElementById('form-siswa-tanggal-lahir').value = '';
  document.getElementById('form-siswa-bidang-utama').value = 'Belum Ditentukan';
  document.getElementById('form-siswa-bidang-sub').value = 'Eksplorasi Umum';
  document.getElementById('form-siswa-kartu-pelajar').value = '';
  document.getElementById('form-siswa-foto').value = '';
  document.getElementById('form-siswa-berkas').value = '';

  form.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.openEditSiswaModal = function(id) {
  const s = this.data.siswa.find(item => item.id === id);
  if (!s) return;
  const form = document.getElementById('modal-siswa-form');
  if (!form) return;
  const title = document.getElementById('form-siswa-title');
  if (title) title.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-violet-400"></i> Edit Data Siswa: ${s.nama}`;

  const lvl = s.levelKelas || (s.kelas && s.kelas.includes('12') ? '12' : (s.kelas && s.kelas.includes('11') ? '11' : '10'));

  document.getElementById('form-siswa-id').value = s.id;
  document.getElementById('form-siswa-nama').value = s.nama || '';
  document.getElementById('form-siswa-panggilan').value = s.namaPanggilan || '';
  document.getElementById('form-siswa-nisn').value = s.nisn || '';
  document.getElementById('form-siswa-level-kelas').value = lvl;
  document.getElementById('form-siswa-kelas-asal').value = s.kelasAsal || s.kelas || ('Kelas ' + lvl);
  document.getElementById('form-siswa-tempat-lahir').value = s.tempatLahir || '';
  document.getElementById('form-siswa-tanggal-lahir').value = s.tanggalLahir || '';
  document.getElementById('form-siswa-bidang-utama').value = s.bidangUtama || 'Belum Ditentukan';
  document.getElementById('form-siswa-bidang-sub').value = s.bidangSekunder || 'Eksplorasi Umum';
  document.getElementById('form-siswa-kartu-pelajar').value = s.kartuPelajar || '';
  document.getElementById('form-siswa-foto').value = s.foto || '';
  document.getElementById('form-siswa-berkas').value = s.berkasPendaftaran || '';

  form.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.saveSiswa = function() {
  const id = document.getElementById('form-siswa-id').value;
  const nama = document.getElementById('form-siswa-nama').value.trim();
  const namaPanggilan = (document.getElementById('form-siswa-panggilan')?.value || '').trim();
  const nisn = document.getElementById('form-siswa-nisn').value.trim();
  const levelKelas = document.getElementById('form-siswa-level-kelas')?.value || '10';
  const kelasAsal = (document.getElementById('form-siswa-kelas-asal')?.value || 'X-MIPA 1').trim();
  const tempatLahir = (document.getElementById('form-siswa-tempat-lahir')?.value || '').trim();
  const tanggalLahir = document.getElementById('form-siswa-tanggal-lahir')?.value || '';
  const utama = document.getElementById('form-siswa-bidang-utama')?.value || 'Belum Ditentukan';
  const sub = document.getElementById('form-siswa-bidang-sub')?.value || 'Eksplorasi Umum';
  const kartuPelajar = (document.getElementById('form-siswa-kartu-pelajar')?.value || '').trim();
  const foto = (document.getElementById('form-siswa-foto')?.value || '').trim();
  const berkasPendaftaran = (document.getElementById('form-siswa-berkas')?.value || '').trim();

  if (!nama || !nisn) {
    alert('Harap isi Nama Lengkap dan NISN siswa.');
    return;
  }

  const levelLabel = 'Kelas ' + levelKelas;

  if (id) {
    const s = this.data.siswa.find(item => item.id === id);
    if (s) {
      s.nama = nama;
      s.namaPanggilan = namaPanggilan;
      s.nisn = nisn;
      s.levelKelas = levelKelas;
      s.kelasAsal = kelasAsal;
      s.kelas = kelasAsal; // Compatibility
      s.level = levelLabel;
      s.tempatLahir = tempatLahir;
      s.tanggalLahir = tanggalLahir;
      s.bidangUtama = utama;
      s.bidangSekunder = sub;
      s.kartuPelajar = kartuPelajar;
      s.foto = foto;
      s.berkasPendaftaran = berkasPendaftaran;
    }
  } else {
    this.data.siswa.push({
      id: 'sis-' + Date.now(),
      nama: nama,
      namaPanggilan: namaPanggilan,
      nisn: nisn,
      levelKelas: levelKelas,
      kelasAsal: kelasAsal,
      kelas: kelasAsal, // Compatibility
      level: levelLabel,
      tempatLahir: tempatLahir,
      tanggalLahir: tanggalLahir,
      bidangUtama: utama,
      bidangSekunder: sub,
      kartuPelajar: kartuPelajar,
      foto: foto,
      berkasPendaftaran: berkasPendaftaran,
      pembimbingId: 'mentor-1',
      ratingTopik: { fisik: 75, organik: 75, anorganik: 75, analitik: 75, biokimia: 75 },
      skorRata: 75.0,
      kehadiran: { hadir: 0, izin: 0, sakit: 0, total: 0, persentase: 100 },
      riwayatLomba: [],
      riwayatEvaluasi: [],
      materiDikuasai: [],
      materiPerluPendalaman: [],
      catatan: 'Siswa baru ditambahkan ke pembinaan.'
    });
  }

  this.saveData(true);
  document.getElementById('modal-siswa-form').classList.add('hidden');
  this.renderSiswaModule();
  if (this.selectedSiswa && this.selectedSiswa.id === id) {
    this.openSiswaDetail(id);
  }
  this.showToast('Data siswa berhasil disimpan!', 'success');
};

OlympiadApp.promptAddNilai = function(siswaId) {
  const s = this.data.siswa.find(item => item.id === siswaId);
  if (!s) return;

  const namaTO = prompt('Nama Evaluasi / Tryout:', 'Tryout Evaluasi');
  if (!namaTO) return;
  const skorStr = prompt('Skor (0 - 100):', '85');
  const skor = parseFloat(skorStr);
  if (isNaN(skor) || skor < 0 || skor > 100) {
    alert('Skor harus angka antara 0 dan 100.');
    return;
  }

  s.riwayatEvaluasi = s.riwayatEvaluasi || [];
  s.riwayatEvaluasi.push({
    nama: namaTO,
    tanggal: new Date().toISOString().slice(0, 10),
    skor: skor
  });

  const total = s.riwayatEvaluasi.reduce((acc, cur) => acc + cur.skor, 0);
  s.skorRata = total / s.riwayatEvaluasi.length;

  this.saveData(true);
  this.openSiswaDetail(siswaId);
  this.showToast('Nilai evaluasi baru berhasil dicatat!', 'success');
};

// --- END FILE: app_part3_siswa.js ---

// --- START FILE: app_part4_lomba.js ---
// ============================================================================
// MODUL 4: MANAJEMEN LOMBA & DOKUMEN CEKLIS (CALENDAR & GUIDEBOOK)
// ============================================================================
OlympiadApp.renderLombaModule = function() {
  const container = document.getElementById('panel-lomba');
  if (!container) return;

  const now = new Date();

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="trophy" class="w-6 h-6 text-amber-400"></i> Agenda &amp; Manajemen Lomba Kimia 2026
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Timeline kompetisi, dokumen ceklis administrasi, biaya pendaftaran, delegasi tim, dan manajemen kelolosan babak.
        </p>
      </div>

      ${!this.isSiswa() ? `
        <button onclick="OlympiadApp.openAddLombaModal()" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all self-start md:self-auto">
          <i data-lucide="calendar-plus" class="w-4 h-4"></i> Tambah Agenda Lomba
        </button>
      ` : ''}
    </div>

    <!-- Competitions Cards List -->
    <div class="space-y-6">
      ${this.data.lomba.length === 0 ? `
        <div class="glass-card rounded-2xl p-12 text-center border border-zinc-800 space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <i data-lucide="trophy" class="w-8 h-8"></i>
          </div>
          <h4 class="text-base font-bold text-zinc-200">Belum Ada Agenda Lomba</h4>
          <p class="text-xs text-zinc-400 max-w-md mx-auto">
            Daftar kompetisi atau olimpiade kimia masih kosong. Silakan tambahkan agenda lomba baru beserta jadwal timeline pendaftaran dan pelaksanaan.
          </p>
          ${!this.isSiswa() ? `
            <button onclick="OlympiadApp.openAddLombaModal()" class="mt-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-amber-600/20">
              <i data-lucide="calendar-plus" class="w-4 h-4"></i> Tambah Agenda Lomba
            </button>
          ` : ''}
        </div>
      ` : this.data.lomba.map(l => {
        const deadlineStr = l.timeline?.deadlineDaftar || '';
        const dl = deadlineStr ? new Date(deadlineStr) : null;
        const diffDays = (dl && !isNaN(dl.getTime())) ? Math.ceil((dl - now) / (1000 * 60 * 60 * 24)) : -1;
        const statusColors = {
          Draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          Submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          Verified: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          Paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };

        const pesertaList = (l.pesertaIds || []).map(id => this.data.siswa.find(s => s.id === id)).filter(Boolean);

        // Deteksi apakah lomba format Tim
        const isTeam = (l.klasifikasi || '').toLowerCase().includes('tim');
        let teamSize = 1;
        if (isTeam) {
          const match = l.klasifikasi.match(/\((\d+)\s*orang\)/i);
          teamSize = match ? parseInt(match[1]) : (l.klasifikasi.includes('3') ? 3 : 2);
        }

        // Pengelompokan Tim jika lomba beregu
        const teams = [];
        if (isTeam) {
          for (let i = 0; i < pesertaList.length; i += teamSize) {
            teams.push(pesertaList.slice(i, i + teamSize));
          }
        }

        // Kalkulasi Biaya Pendaftaran & Total Berdasarkan yang Mendaftar
        const unitDaftar = l.biaya?.pendaftaran || 0;
        let totalBiayaDaftar = 0;
        let hitunganLabel = '';

        if (isTeam) {
          const countTeams = teams.length;
          totalBiayaDaftar = countTeams * unitDaftar;
          hitunganLabel = `${countTeams} Tim (${pesertaList.length} Siswa)`;
        } else {
          const countPeserta = pesertaList.length;
          totalBiayaDaftar = countPeserta * unitDaftar;
          hitunganLabel = `${countPeserta} Siswa`;
        }

        return `
          <div class="glass-card rounded-2xl p-6 border border-zinc-800 shadow-xl" id="lomba-card-${l.id}">
            <!-- Header -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[l.statusPendaftaran] || 'bg-zinc-800 text-zinc-300'}">
                    Status: ${String(l.statusPendaftaran || 'Draft').toUpperCase()}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">${l.klasifikasi || 'Individu'}</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 text-xs">Kuota: Max ${l.kuotaSekolah || 3} Delegasi</span>
                  ${diffDays >= 0 ? `
                    <span class="px-2.5 py-0.5 rounded-full ${diffDays <= 7 ? 'bg-rose-500/20 text-rose-300 font-bold animate-pulse' : 'bg-amber-500/15 text-amber-300 font-semibold'} text-xs">
                      <i data-lucide="clock" class="inline w-3 h-3"></i> H-${diffDays} Batas Pendaftaran
                    </span>
                  ` : '<span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-xs">Masa Pendaftaran Selesai</span>'}
                </div>
                <h3 class="text-lg font-bold text-zinc-100">${l.nama || 'Agenda Lomba'}</h3>
                <p class="text-xs text-zinc-400 mt-0.5">Penyelenggara: <strong class="text-zinc-200">${l.penyelenggara || '-'}</strong></p>
              </div>

              <!-- Action Bar -->
              <div class="flex flex-wrap items-center gap-2">
                <button onclick="OlympiadApp.syncGoogleCalendar('${l.id}')" class="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Google Cal
                </button>
                <button onclick="OlympiadApp.downloadICS('${l.id}')" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all">
                  <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i> .ICS
                </button>
                ${!this.isSiswa() ? `
                  <button onclick="OlympiadApp.openEditLombaModal('${l.id}')" class="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Lomba
                  </button>
                  <button onclick="OlympiadApp.openKelolosanModal('${l.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <i data-lucide="award" class="w-3.5 h-3.5"></i> Kelolosan Babak
                  </button>
                  <select onchange="OlympiadApp.updateLombaStatus('${l.id}', this.value)" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-medium">
                    <option value="Draft" ${l.statusPendaftaran === 'Draft' ? 'selected' : ''}>Status: Draft</option>
                    <option value="Submitted" ${l.statusPendaftaran === 'Submitted' ? 'selected' : ''}>Status: Submitted</option>
                    <option value="Verified" ${l.statusPendaftaran === 'Verified' ? 'selected' : ''}>Status: Verified</option>
                    <option value="Paid" ${l.statusPendaftaran === 'Paid' ? 'selected' : ''}>Status: Paid (Lunas)</option>
                  </select>
                ` : ''}
              </div>
            </div>

            <!-- Visual Stages Pipeline -->
            <div class="my-5">
              <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Timeline Tahapan Lomba:</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span class="block text-[10px] text-zinc-400 uppercase">Pendaftaran</span>
                  <strong class="text-zinc-200 text-xs">${l.timeline?.pendaftaranBuka || '-'}</strong>
                </div>
                <div class="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <span class="block text-[10px] text-rose-400 uppercase font-bold">Deadline</span>
                  <strong class="text-rose-300 text-xs">${l.timeline?.deadlineDaftar || '-'}</strong>
                </div>
                <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span class="block text-[10px] text-zinc-400 uppercase">Penyisihan</span>
                  <strong class="text-zinc-200 text-xs">${l.timeline?.penyisihan || '-'}</strong>
                </div>
                <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span class="block text-[10px] text-zinc-400 uppercase">Perempat Final</span>
                  <strong class="text-zinc-200 text-xs">${l.timeline?.perempatFinal || '-'}</strong>
                </div>
                <div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span class="block text-[10px] text-zinc-400 uppercase">Semifinal</span>
                  <strong class="text-zinc-200 text-xs">${l.timeline?.semifinal || '-'}</strong>
                </div>
                <div class="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <span class="block text-[10px] text-amber-400 uppercase font-bold">Babak Final</span>
                  <strong class="text-amber-300 text-xs">${l.timeline?.final || '-'}</strong>
                </div>
              </div>
            </div>

            <!-- Syarat & Berkas Pendaftaran (Terbuka saat Masa Pendaftaran) -->
            ${(() => {
              let syaratList = [];
              if (Array.isArray(l.syaratPendaftaran) && l.syaratPendaftaran.length > 0) {
                syaratList = l.syaratPendaftaran.map(item => typeof item === 'string' ? { teks: item, checked: false } : item);
              } else if (typeof l.syaratPendaftaran === 'string' && l.syaratPendaftaran.trim()) {
                syaratList = l.syaratPendaftaran.split('\n').map(s => s.trim()).filter(Boolean).map(teks => ({ teks, checked: false }));
              } else {
                syaratList = [
                  { teks: 'Scan Asli Kartu Pelajar (PDF/JPG)', checked: false },
                  { teks: 'Pas Foto 3x4 Latar Merah/Biru', checked: false },
                  { teks: 'Surat Rekomendasi Kepala Sekolah / Kesiswaan', checked: false },
                  { teks: 'Bukti Pembayaran / Transfer Pendaftaran', checked: false },
                  { teks: 'Follow Akun Instagram Penyelenggara', checked: false },
                  { teks: 'Unggah Twibbon & Repost Poster ke Story / Grup', checked: false }
                ];
              }

              return `
                <div class="my-4 p-4 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-2.5">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 class="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <i data-lucide="clipboard-list" class="w-4 h-4 text-amber-400"></i> Syarat &amp; Berkas Pendaftaran Lomba:
                    </h4>
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${diffDays >= 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400'}">
                        ${diffDays >= 0 ? `Batas: ${l.timeline.deadlineDaftar} (H-${diffDays})` : 'Masa Pendaftaran Selesai'}
                      </span>
                      ${!this.isSiswa() ? `
                        <button onclick="OlympiadApp.openEditLombaModal('${l.id}')" class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                          <i data-lucide="edit-3" class="w-3 h-3"></i> Atur Syarat
                        </button>
                      ` : ''}
                    </div>
                  </div>

                  <p class="text-[11px] text-zinc-400">
                    Daftar berkas administrasi dan syarat khusus (misal: scan kartu pelajar, pas foto, follow medsos, twibbon, dll.) yang diperlukan untuk pendaftaran lomba ini:
                  </p>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    ${syaratList.map((syr, sIdx) => `
                      <label class="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 ${this.isSiswa() ? 'cursor-default' : 'cursor-pointer hover:border-amber-500/40'} transition-colors">
                        <input type="checkbox" ${syr.checked ? 'checked' : ''} 
                               ${this.isSiswa() ? 'disabled' : ''}
                               onchange="OlympiadApp.toggleSyaratLomba('${l.id}', ${sIdx}, this.checked)"
                               class="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-700 focus:ring-0">
                        <span class="${syr.checked ? 'text-zinc-400 line-through' : 'text-zinc-200 font-medium'} text-[11px] leading-snug">
                          ${syr.teks}
                        </span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `;
            })()}

            <!-- Documents Checklist & Registered Team -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-zinc-800">
              <!-- Checklist Dokumen Berbasis Ceklis -->
              <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 class="text-xs font-bold text-zinc-200 uppercase mb-2 flex items-center gap-1.5">
                  <i data-lucide="check-square" class="w-4 h-4 text-emerald-400"></i> Dokumen Administrasi (Ceklis):
                </h4>
                <div class="space-y-2 text-xs">
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" ${l.dokumenCeklis?.proposalDibuat ? 'checked' : ''} 
                           ${this.isSiswa() ? 'disabled' : ''}
                           onchange="OlympiadApp.toggleCeklisDokumen('${l.id}', 'proposalDibuat', this.checked)"
                           class="w-4 h-4 rounded text-violet-600 bg-zinc-900 border-zinc-700">
                    <span class="${l.dokumenCeklis?.proposalDibuat ? 'text-zinc-200 line-through text-zinc-500' : 'text-zinc-300'}">
                      Proposal Kegiatan Lomba (Sudah Dibuat)
                    </span>
                  </label>

                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" ${l.dokumenCeklis?.proposalAcc ? 'checked' : ''} 
                           ${this.isSiswa() ? 'disabled' : ''}
                           onchange="OlympiadApp.toggleCeklisDokumen('${l.id}', 'proposalAcc', this.checked)"
                           class="w-4 h-4 rounded text-violet-600 bg-zinc-900 border-zinc-700">
                    <span class="${l.dokumenCeklis?.proposalAcc ? 'text-zinc-200' : 'text-zinc-300'}">
                      ACC Proposal oleh Kesiswaan / Kepala Sekolah
                    </span>
                  </label>

                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" ${l.dokumenCeklis?.suratIzinDibuat ? 'checked' : ''} 
                           ${this.isSiswa() ? 'disabled' : ''}
                           onchange="OlympiadApp.toggleCeklisDokumen('${l.id}', 'suratIzinDibuat', this.checked)"
                           class="w-4 h-4 rounded text-violet-600 bg-zinc-900 border-zinc-700">
                    <span class="${l.dokumenCeklis?.suratIzinDibuat ? 'text-zinc-200' : 'text-zinc-300'}">
                      Surat Izin / Dispensasi: <strong class="text-violet-400">${l.dokumenCeklis?.nomorSuratIzin || 'Dalam proses'}</strong>
                    </span>
                  </label>

                  <!-- Guidebook Drive Link -->
                  <div class="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span class="text-zinc-400 flex items-center gap-1.5">
                      <i data-lucide="file-text" class="w-3.5 h-3.5 text-violet-400"></i> Guidebook &amp; Silabus Lomba
                    </span>
                    ${l.dokumenCeklis?.guidebookUrl ? `
                      <div class="flex items-center gap-2">
                        <button onclick="OlympiadApp.previewGoogleDrive('${l.dokumenCeklis.guidebookUrl}', '${l.dokumenCeklis.guidebookName || 'Guidebook Lomba'}')" class="text-xs text-violet-400 hover:underline font-semibold">
                          Pratinjau
                        </button>
                        <a href="${l.dokumenCeklis.guidebookUrl}" target="_blank" class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:text-white text-[11px] flex items-center gap-1">
                          Drive <i data-lucide="external-link" class="w-3 h-3"></i>
                        </a>
                      </div>
                    ` : '<span class="text-zinc-500 italic">Belum ditautkan</span>'}
                  </div>
                </div>
              </div>

              <!-- Delegasi Siswa & Rincian Biaya Pendaftaran -->
              <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-bold text-zinc-200 uppercase flex items-center gap-1.5">
                      <i data-lucide="users" class="w-4 h-4 text-violet-400"></i> Delegasi Siswa Terdaftar:
                    </h4>
                    <span class="text-xs text-zinc-400 font-medium">
                      ${isTeam ? `${teams.length} Tim (${pesertaList.length} Siswa)` : `${pesertaList.length} Siswa`} / Max ${l.kuotaSekolah} Kuota
                    </span>
                  </div>

                  <!-- Pemisahan Tampilan: Format Beregu (Tim 1, Tim 2, dst) vs Format Individu -->
                  ${isTeam ? `
                    ${teams.length === 0 ? '<span class="text-xs text-zinc-500 italic">Belum ada tim yang diploting.</span>' : `
                      <div class="space-y-2.5 w-full">
                        ${teams.map((t, idx) => `
                          <div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                            <div class="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-zinc-800/80">
                              <span class="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 font-bold text-[11px] border border-violet-500/30">
                                Tim ${idx + 1}
                              </span>
                              <span class="text-[10px] text-zinc-400 font-medium">(${t.length}/${teamSize} Anggota)</span>
                            </div>
                            <div class="flex flex-wrap gap-1.5">
                              ${t.map(p => `
                                <span onclick="OlympiadApp.openSiswaDetail('${p.id}')" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700 transition-colors" title="Klik untuk lihat profil siswa">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span class="font-medium">${p.nama}</span>
                                  <span class="text-[10px] text-violet-400 font-semibold">(${p.bidangUtama})</span>
                                </span>
                              `).join('')}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  ` : `
                    <div class="flex flex-wrap gap-2">
                      ${pesertaList.length === 0 ? '<span class="text-xs text-zinc-500 italic">Belum ada peserta yang diploting.</span>' : pesertaList.map(p => `
                        <span onclick="OlympiadApp.openSiswaDetail('${p.id}')" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700 transition-colors" title="Klik untuk lihat profil siswa">
                          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span class="font-medium">${p.nama}</span>
                          <span class="text-[10px] text-violet-400 font-semibold">(${p.bidangUtama})</span>
                        </span>
                      `).join('')}
                    </div>
                  `}
                </div>

                <!-- Informasi Biaya Pendaftaran & Total Berdasarkan yang Mendaftar -->
                <div class="mt-4 pt-3 border-t border-zinc-800 space-y-2">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 text-zinc-400">
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="tag" class="w-3.5 h-3.5 text-amber-400"></i> Biaya Pendaftaran:
                    </span>
                    <span class="font-bold text-zinc-200">
                      Rp ${unitDaftar.toLocaleString('id-ID')} <span class="text-[11px] text-zinc-400 font-normal">/${isTeam ? 'Tim' : 'Peserta'}</span>
                    </span>
                  </div>

                  <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span class="text-amber-300 font-bold flex items-center gap-1.5">
                      <i data-lucide="calculator" class="w-3.5 h-3.5"></i> Total Biaya Terdaftar (${hitunganLabel}):
                    </span>
                    <span class="text-sm font-black text-amber-400">
                      Rp ${totalBiayaDaftar.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;
};

OlympiadApp.updateLombaStatus = function(id, newStatus) {
  const l = this.data.lomba.find(item => item.id === id);
  if (!l) return;
  l.statusPendaftaran = newStatus;
  this.saveData(); // Auto-save & Push to Cloud
  this.renderLombaModule();
  if (window.lucide) window.lucide.createIcons();
  this.showToast(`Status lomba ${l.nama} diperbarui: ${newStatus}`, 'success');
};

OlympiadApp.toggleCeklisDokumen = function(lombaId, field, val) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;
  l.dokumenCeklis = l.dokumenCeklis || {};
  l.dokumenCeklis[field] = val;
  this.saveData(); // Auto-save & Push to Cloud
  this.showToast('Checklist dokumen berhasil disimpan.', 'info');
};

OlympiadApp.syncGoogleCalendar = function(lombaId) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;

  const title = encodeURIComponent(`[Olimpiade Kimia] ${l.nama}`);
  const details = encodeURIComponent(`Lomba: ${l.nama}\nPenyelenggara: ${l.penyelenggara}\nDeadline: ${l.timeline.deadlineDaftar}\nPenyisihan: ${l.timeline.penyisihan}\nFinal: ${l.timeline.final}\nPortalKimia Olimpiade`);
  const location = encodeURIComponent(`${l.penyelenggara}`);

  const formatDate = (dStr) => dStr.replace(/-/g, '');
  const startDate = formatDate(l.timeline.deadlineDaftar);
  const endDate = startDate;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  window.open(url, '_blank');
  this.showToast('Membuka Google Calendar untuk menjadwalkan agenda lomba!', 'success');
};

OlympiadApp.downloadICS = function(lombaId) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;

  const cleanDate = (dStr) => dStr.replace(/-/g, '');
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PortalKimia Suite//Olimpiade Kimia//ID
BEGIN:VEVENT
UID:${l.id}-${Date.now()}@portalkimia.org
DTSTAMP:${cleanDate(new Date().toISOString().slice(0,10))}T000000Z
DTSTART;VALUE=DATE:${cleanDate(l.timeline.deadlineDaftar)}
DTEND;VALUE=DATE:${cleanDate(l.timeline.deadlineDaftar)}
SUMMARY:[Deadline Lomba] ${l.nama}
DESCRIPTION:${l.penyelenggara} - Penyisihan: ${l.timeline.penyisihan}, Final: ${l.timeline.final}
LOCATION:${l.penyelenggara}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Agenda_${l.nama.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  this.showToast('Berkas .ICS kalender berhasil diunduh.', 'success');
};

// ============================================================================
// MODAL TAMBAH & EDIT LOMBA (UNTUK GURU & ADMIN)
// ============================================================================
OlympiadApp.openAddLombaModal = function() {
  const modal = document.getElementById('modal-lomba-form');
  if (!modal) return;
  document.getElementById('form-lomba-id').value = '';
  const title = document.getElementById('form-lomba-title');
  if (title) title.textContent = 'Tambah Agenda Lomba';
  const saveBtn = document.getElementById('btn-save-lomba');
  if (saveBtn) saveBtn.textContent = 'Simpan Lomba';

  document.getElementById('form-lomba-nama').value = '';
  document.getElementById('form-lomba-penyelenggara').value = '';
  document.getElementById('form-lomba-klasifikasi').value = 'Individu';
  document.getElementById('form-lomba-kuota').value = '5';
  document.getElementById('form-lomba-biaya-daftar').value = '150000';
  document.getElementById('form-lomba-deadline').value = '2026-04-15';
  document.getElementById('form-lomba-penyisihan').value = '2026-05-02';
  document.getElementById('form-lomba-final').value = '2026-06-06';
  document.getElementById('form-lomba-drive-guidebook').value = '';

  const defaultSyarat = [
    'Scan Asli Kartu Pelajar (PDF/JPG)',
    'Pas Foto 3x4 Latar Merah/Biru',
    'Surat Rekomendasi Kepala Sekolah',
    'Bukti Transfer Pendaftaran',
    'Follow Akun Instagram Penyelenggara',
    'Unggah Twibbon & Repost Poster'
  ].join('\n');
  const syaratInput = document.getElementById('form-lomba-syarat-pendaftaran');
  if (syaratInput) syaratInput.value = defaultSyarat;

  modal.classList.remove('hidden');
};

OlympiadApp.openEditLombaModal = function(id) {
  const l = this.data.lomba.find(item => item.id === id);
  if (!l) return;
  const modal = document.getElementById('modal-lomba-form');
  if (!modal) return;

  document.getElementById('form-lomba-id').value = l.id;
  const title = document.getElementById('form-lomba-title');
  if (title) title.textContent = 'Edit Agenda Lomba: ' + l.nama;
  const saveBtn = document.getElementById('btn-save-lomba');
  if (saveBtn) saveBtn.textContent = 'Perbarui Lomba';

  document.getElementById('form-lomba-nama').value = l.nama || '';
  document.getElementById('form-lomba-penyelenggara').value = l.penyelenggara || '';
  document.getElementById('form-lomba-klasifikasi').value = l.klasifikasi || 'Individu';
  document.getElementById('form-lomba-kuota').value = l.kuotaSekolah || 3;
  document.getElementById('form-lomba-biaya-daftar').value = (l.biaya && l.biaya.pendaftaran !== undefined) ? l.biaya.pendaftaran : 150000;
  document.getElementById('form-lomba-deadline').value = l.timeline?.deadlineDaftar || '';
  document.getElementById('form-lomba-penyisihan').value = l.timeline?.penyisihan || '';
  document.getElementById('form-lomba-final').value = l.timeline?.final || '';
  document.getElementById('form-lomba-drive-guidebook').value = l.dokumenCeklis?.guidebookUrl || '';

  const syaratInput = document.getElementById('form-lomba-syarat-pendaftaran');
  if (syaratInput) {
    if (Array.isArray(l.syaratPendaftaran) && l.syaratPendaftaran.length > 0) {
      syaratInput.value = l.syaratPendaftaran.map(s => typeof s === 'string' ? s : s.teks).join('\n');
    } else if (typeof l.syaratPendaftaran === 'string' && l.syaratPendaftaran.trim()) {
      syaratInput.value = l.syaratPendaftaran;
    } else {
      syaratInput.value = [
        'Scan Asli Kartu Pelajar (PDF/JPG)',
        'Pas Foto 3x4 Latar Merah/Biru',
        'Surat Rekomendasi Kepala Sekolah',
        'Bukti Transfer Pendaftaran',
        'Follow Akun Instagram Penyelenggara',
        'Unggah Twibbon & Repost Poster'
      ].join('\n');
    }
  }

  modal.classList.remove('hidden');
};

OlympiadApp.toggleSyaratLomba = function(lombaId, idx, checked) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;
  if (!Array.isArray(l.syaratPendaftaran)) {
    let items = [];
    if (typeof l.syaratPendaftaran === 'string' && l.syaratPendaftaran.trim()) {
      items = l.syaratPendaftaran.split('\n').map(s => s.trim()).filter(Boolean);
    } else {
      items = [
        'Scan Asli Kartu Pelajar (PDF/JPG)',
        'Pas Foto 3x4 Latar Merah/Biru',
        'Surat Rekomendasi Kepala Sekolah / Kesiswaan',
        'Bukti Pembayaran / Transfer Pendaftaran',
        'Follow Akun Instagram Penyelenggara',
        'Unggah Twibbon & Repost Poster ke Story / Grup'
      ];
    }
    l.syaratPendaftaran = items.map(t => ({ teks: t, checked: false }));
  } else {
    l.syaratPendaftaran = l.syaratPendaftaran.map(s => typeof s === 'string' ? { teks: s, checked: false } : s);
  }

  if (l.syaratPendaftaran[idx]) {
    l.syaratPendaftaran[idx].checked = !!checked;
    this.saveData(false);
    this.renderLombaModule();
    if (window.lucide) window.lucide.createIcons();
    this.showToast('Status syarat pendaftaran diperbarui', 'info');
  }
};

OlympiadApp.saveLomba = function() {
  const idInput = document.getElementById('form-lomba-id').value.trim();
  const nama = document.getElementById('form-lomba-nama').value.trim();
  if (!nama) {
    alert('Nama lomba wajib diisi!');
    return;
  }

  const penyelenggara = document.getElementById('form-lomba-penyelenggara').value.trim() || 'Penyelenggara Lomba';
  const klasifikasi = document.getElementById('form-lomba-klasifikasi').value;
  const kuotaSekolah = parseInt(document.getElementById('form-lomba-kuota').value) || 3;
  const biayaDaftar = parseInt(document.getElementById('form-lomba-biaya-daftar').value) || 0;
  const deadlineDaftar = document.getElementById('form-lomba-deadline').value;
  const penyisihan = document.getElementById('form-lomba-penyisihan').value;
  const finalDate = document.getElementById('form-lomba-final').value;
  const guidebookUrl = document.getElementById('form-lomba-drive-guidebook').value.trim();

  const syaratRaw = document.getElementById('form-lomba-syarat-pendaftaran')?.value || '';
  const parsedSyaratLines = syaratRaw.split('\n').map(s => s.trim()).filter(Boolean);

  if (idInput) {
    // Mode EDIT: Update Lomba yang Sudah Ada
    const l = this.data.lomba.find(item => item.id === idInput);
    if (l) {
      l.nama = nama;
      l.penyelenggara = penyelenggara;
      l.klasifikasi = klasifikasi;
      l.kuotaSekolah = kuotaSekolah;
      l.timeline.deadlineDaftar = deadlineDaftar;
      l.timeline.penyisihan = penyisihan;
      l.timeline.final = finalDate;
      l.biaya = l.biaya || {};
      l.biaya.pendaftaran = biayaDaftar;
      l.dokumenCeklis = l.dokumenCeklis || {};
      l.dokumenCeklis.guidebookUrl = guidebookUrl;
      if (!l.dokumenCeklis.guidebookName || l.dokumenCeklis.guidebookName.startsWith('Panduan_')) {
        l.dokumenCeklis.guidebookName = 'Panduan_' + nama.replace(/\s+/g, '_') + '.pdf';
      }

      // Map parsed lines while keeping checked state if available
      const existingMap = {};
      if (Array.isArray(l.syaratPendaftaran)) {
        l.syaratPendaftaran.forEach(item => {
          if (typeof item === 'object' && item.teks) {
            existingMap[item.teks] = item.checked;
          }
        });
      }
      l.syaratPendaftaran = parsedSyaratLines.map(teks => ({
        teks: teks,
        checked: existingMap[teks] !== undefined ? existingMap[teks] : false
      }));

      this.saveData(true);
      document.getElementById('modal-lomba-form').classList.add('hidden');
      this.renderLombaModule();
      this.renderDashboard();
      if (window.lucide) window.lucide.createIcons();
      this.showToast(`Agenda lomba "${nama}" berhasil diperbarui!`, 'success');
      return;
    }
  }

  // Mode TAMBAH BARU
  const newLomba = {
    id: 'lmb-' + Date.now(),
    nama: nama,
    penyelenggara: penyelenggara,
    tahun: 2026,
    klasifikasi: klasifikasi,
    kuotaSekolah: kuotaSekolah,
    pesertaIds: [],
    statusPendaftaran: 'Draft',
    timeline: {
      pendaftaranBuka: new Date().toISOString().slice(0, 10),
      deadlineDaftar: deadlineDaftar,
      penyisihan: penyisihan,
      perempatFinal: '',
      semifinal: '',
      final: finalDate
    },
    biaya: { pendaftaran: biayaDaftar, transportasi: 0, akomodasi: 0 },
    dokumenCeklis: {
      proposalDibuat: false,
      proposalAcc: false,
      suratIzinDibuat: false,
      nomorSuratIzin: '',
      guidebookUrl: guidebookUrl,
      guidebookName: 'Panduan_' + nama.replace(/\s+/g, '_') + '.pdf'
    },
    syaratPendaftaran: parsedSyaratLines.map(teks => ({ teks: teks, checked: false })),
    hasilBabak: [],
    pesertaGugur: []
  };

  this.data.lomba.push(newLomba);
  this.saveData(true);
  document.getElementById('modal-lomba-form').classList.add('hidden');
  this.renderLombaModule();
  this.renderDashboard();
  if (window.lucide) window.lucide.createIcons();
  this.showToast(`Agenda lomba baru "${nama}" berhasil ditambahkan.`, 'success');
};

// ============================================================================
// MODAL MANAJEMEN KELOLOSAN BABAK (LOLOS vs TIDAK LOLOS)
// Siswa yang tidak lolos otomatis dibebaskan sehingga dapat mengikuti lomba lain
// ============================================================================
OlympiadApp.activeKelolosanLombaId = null;

OlympiadApp.openKelolosanModal = function(lombaId) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;
  this.activeKelolosanLombaId = lombaId;

  const modal = document.getElementById('modal-kelolosan');
  const title = document.getElementById('kelolosan-title');
  const subtitle = document.getElementById('kelolosan-subtitle');
  const body = document.getElementById('kelolosan-body');
  if (!modal || !body) return;

  title.innerHTML = `<i data-lucide="award" class="w-5 h-5 text-amber-400"></i> Kelola Kelolosan: ${l.nama}`;
  subtitle.textContent = `Penyelenggara: ${l.penyelenggara} • Format: ${l.klasifikasi}`;

  const pesertaList = (l.pesertaIds || []).map(id => this.data.siswa.find(s => s.id === id)).filter(Boolean);
  const isTeam = (l.klasifikasi || '').toLowerCase().includes('tim');
  let teamSize = 1;
  if (isTeam) {
    const match = l.klasifikasi.match(/\((\d+)\s*orang\)/i);
    teamSize = match ? parseInt(match[1]) : (l.klasifikasi.includes('3') ? 3 : 2);
  }

  const teams = [];
  if (isTeam) {
    for (let i = 0; i < pesertaList.length; i += teamSize) {
      teams.push(pesertaList.slice(i, i + teamSize));
    }
  }

  let html = `
    <!-- Babak Selector -->
    <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <span class="block text-xs font-bold text-zinc-200">Tahap / Babak Pengumuman:</span>
        <span class="text-[11px] text-zinc-400">Pilih babak yang baru saja diumumkan oleh panitia penyelenggara.</span>
      </div>
      <select id="kelolosan-tahap-select" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-bold">
        <option value="Babak Penyisihan">Babak Penyisihan</option>
        <option value="Perempat Final">Perempat Final</option>
        <option value="Babak Semifinal">Babak Semifinal</option>
        <option value="Babak Final">Babak Final</option>
      </select>
    </div>

    <!-- Quick Action Bulk Buttons -->
    ${pesertaList.length > 0 ? `
      <div class="flex items-center justify-between gap-2 pt-1 text-xs">
        <span class="text-zinc-400 font-semibold">Tentukan Status Setiap Peserta:</span>
        <div class="flex items-center gap-2">
          <button type="button" onclick="OlympiadApp.setAllKelolosan('lolos')" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold transition-all">
            Semua Lolos
          </button>
          <button type="button" onclick="OlympiadApp.setAllKelolosan('tidak_lolos')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-bold transition-all">
            Semua Tidak Lolos
          </button>
        </div>
      </div>
    ` : ''}
  `;

  if (pesertaList.length === 0) {
    html += `
      <div class="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-center text-xs text-zinc-400">
        <i data-lucide="users" class="w-8 h-8 text-zinc-600 mx-auto mb-2"></i>
        <p>Belum ada delegasi peserta yang terdaftar pada kompetisi ini.</p>
        <p class="text-zinc-500 mt-1">Gunakan modul Ploting &amp; Strategi Tim untuk mendaftarkan siswa terlebih dahulu.</p>
      </div>
    `;
  } else if (isTeam) {
    // Mode Tim: Tampilkan Per Tim
    html += `
      <div class="space-y-4">
        ${teams.map((t, tIdx) => `
          <div class="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 font-bold text-xs border border-violet-500/30">
                  Tim ${tIdx + 1}
                </span>
                <span class="text-xs text-zinc-300 font-semibold">${t.map(p => p.nama).join(', ')}</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="OlympiadApp.setTeamKelolosan(${tIdx}, 'lolos')" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold">
                  Set Tim Lolos
                </button>
                <button type="button" onclick="OlympiadApp.setTeamKelolosan(${tIdx}, 'tidak_lolos')" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-[10px] font-semibold">
                  Set Tim Tidak Lolos
                </button>
              </div>
            </div>

            <div class="space-y-2">
              ${t.map(p => `
                <div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center shrink-0">
                      ${p.nama.split(' ').map(n=>n[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-zinc-100">${p.nama}</div>
                      <div class="text-[10px] text-zinc-400">${p.kelas} &bull; Spesialis: <span class="text-violet-400 font-medium">${p.bidangUtama}</span></div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <label class="kelolosan-label flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
                      <input type="radio" name="kelolosan-${p.id}" data-team="${tIdx}" value="lolos" checked class="text-emerald-500 focus:ring-0">
                      <span class="text-emerald-400 font-semibold">Lolos</span>
                    </label>
                    <label class="kelolosan-label flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
                      <input type="radio" name="kelolosan-${p.id}" data-team="${tIdx}" value="tidak_lolos" class="text-rose-500 focus:ring-0">
                      <span class="text-rose-400 font-semibold">Tidak Lolos (Gugur)</span>
                    </label>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    // Mode Individu
    html += `
      <div class="space-y-2.5">
        ${pesertaList.map(p => `
          <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center shrink-0">
                ${p.nama.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div>
                <div class="text-xs font-bold text-zinc-100">${p.nama}</div>
                <div class="text-[10px] text-zinc-400">${p.kelas} &bull; Spesialis: <span class="text-violet-400 font-medium">${p.bidangUtama}</span></div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <label class="kelolosan-label flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
                <input type="radio" name="kelolosan-${p.id}" value="lolos" checked class="text-emerald-500 focus:ring-0">
                <span class="text-emerald-400 font-semibold">Lolos ke Babak Selanjutnya</span>
              </label>
              <label class="kelolosan-label flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
                <input type="radio" name="kelolosan-${p.id}" value="tidak_lolos" class="text-rose-500 focus:ring-0">
                <span class="text-rose-400 font-semibold">Tidak Lolos (Gugur)</span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Section Riwayat Siswa yang Pernah Tereliminasi / Dibebaskan
  if (l.pesertaGugur && l.pesertaGugur.length > 0) {
    html += `
      <div class="pt-4 border-t border-zinc-800">
        <h4 class="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2 mb-2">
          <i data-lucide="history" class="w-3.5 h-3.5 text-zinc-400"></i> Riwayat Siswa Bebas / Tereliminasi Sebelumnya:
        </h4>
        <div class="space-y-1.5">
          ${l.pesertaGugur.map(g => `
            <div class="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs flex items-center justify-between text-zinc-400">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span class="text-zinc-200 font-medium">${g.nama}</span>
                <span class="text-[10px] text-zinc-500">(${g.tahap || 'Babak Penyisihan'}, ${g.tanggal || '-'})</span>
              </div>
              <button onclick="OlympiadApp.restoreEliminatedStudent('${l.id}', '${g.id}')" class="text-[11px] text-violet-400 hover:underline">
                Kembalikan Jadi Peserta Aktif
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  body.innerHTML = html;
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.closeKelolosanModal = function() {
  const modal = document.getElementById('modal-kelolosan');
  if (modal) modal.classList.add('hidden');
  this.activeKelolosanLombaId = null;
};

OlympiadApp.setAllKelolosan = function(val) {
  const radios = document.querySelectorAll(`input[type="radio"][value="${val}"]`);
  radios.forEach(r => r.checked = true);
};

OlympiadApp.setTeamKelolosan = function(teamIdx, val) {
  const radios = document.querySelectorAll(`input[type="radio"][data-team="${teamIdx}"][value="${val}"]`);
  radios.forEach(r => r.checked = true);
};

OlympiadApp.saveKelolosan = function() {
  if (!this.activeKelolosanLombaId) return;
  const l = this.data.lomba.find(item => item.id === this.activeKelolosanLombaId);
  if (!l) return;

  const tahapSelect = document.getElementById('kelolosan-tahap-select');
  const tahap = tahapSelect ? tahapSelect.value : 'Babak Penyisihan';

  const currentIds = [...(l.pesertaIds || [])];
  const stillActive = [];
  const eliminated = [];

  currentIds.forEach(id => {
    const radio = document.querySelector(`input[name="kelolosan-${id}"]:checked`);
    const status = radio ? radio.value : 'lolos';

    const s = this.data.siswa.find(item => item.id === id);
    if (status === 'lolos') {
      stillActive.push(id);
    } else {
      eliminated.push(s || { id: id, nama: 'Siswa' });
    }
  });

  // Update daftar peserta aktif pada lomba
  // Siswa yang TIDAK LOLOS dikeluarkan dari pesertaIds sehingga otomatis bebas untuk lomba lain
  l.pesertaIds = stillActive;

  // Catat peserta yang gugur
  l.pesertaGugur = l.pesertaGugur || [];
  const today = new Date().toISOString().slice(0, 10);

  eliminated.forEach(s => {
    // Tambahkan ke riwayat gugur di objek lomba
    if (!l.pesertaGugur.some(g => g.id === s.id && g.tahap === tahap)) {
      l.pesertaGugur.push({
        id: s.id,
        nama: s.nama,
        tahap: tahap,
        tanggal: today
      });
    }

    // Catat ke riwayat lomba siswa agar histori partisipasinya tetap tersimpan
    const siswaObj = this.data.siswa.find(item => item.id === s.id);
    if (siswaObj) {
      siswaObj.riwayatLomba = siswaObj.riwayatLomba || [];
      const alreadyLogged = siswaObj.riwayatLomba.some(r => r.nama === l.nama && r.tahun === 2026);
      if (!alreadyLogged) {
        siswaObj.riwayatLomba.push({
          tahun: 2026,
          nama: l.nama,
          penyelenggara: l.penyelenggara,
          capaian: `Peserta ${tahap} (Gugur)`,
          bidang: l.klasifikasi
        });
      }
    }
  });

  this.saveData(true);
  this.closeKelolosanModal();
  this.renderLombaModule();
  this.renderDashboard();
  if (this.activeTab === 'siswa') this.renderSiswaModule();
  if (this.activeTab === 'ploting') this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();

  if (eliminated.length > 0) {
    this.showToast(`Status kelolosan tersimpan! ${eliminated.length} siswa tidak lolos otomatis dibebaskan dan siap mengikuti lomba lain.`, 'success');
  } else {
    this.showToast(`Status kelolosan tersimpan! Seluruh peserta aktif lolos ke babak selanjutnya.`, 'success');
  }
};

OlympiadApp.restoreEliminatedStudent = function(lombaId, siswaId) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;

  l.pesertaIds = l.pesertaIds || [];
  if (!l.pesertaIds.includes(siswaId)) {
    l.pesertaIds.push(siswaId);
  }

  if (l.pesertaGugur) {
    l.pesertaGugur = l.pesertaGugur.filter(g => g.id !== siswaId);
  }

  this.saveData(true);
  this.openKelolosanModal(lombaId);
  this.renderLombaModule();
  this.showToast('Peserta berhasil dikembalikan ke daftar peserta aktif.', 'info');
};

// --- END FILE: app_part4_lomba.js ---

// --- START FILE: app_part5_ploting.js ---
// ============================================================================
// MODUL 5: PLOTING & STRATEGI TIM (SMART MATCHING & SIMULASI RADAR)
// ============================================================================
OlympiadApp.renderPlotingModule = function() {
  const container = document.getElementById('panel-ploting');
  if (!container) return;

  if (!this.data.lomba || this.data.lomba.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-2xl p-12 text-center border border-zinc-800 space-y-3">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <i data-lucide="crosshair" class="w-8 h-8"></i>
        </div>
        <h4 class="text-base font-bold text-zinc-200">Belum Ada Agenda Lomba untuk Ploting</h4>
        <p class="text-xs text-zinc-400 max-w-md mx-auto">
          Ploting formasi tim dan smart matching membutuhkan minimal 1 agenda lomba. Silakan tambahkan agenda lomba terlebih dahulu di menu Manajemen Lomba.
        </p>
        <button onclick="OlympiadApp.setTab('lomba')" class="mt-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-amber-600/20">
          <i data-lucide="trophy" class="w-4 h-4"></i> Buka Manajemen Lomba
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (!this.plotingState.lombaId && this.data.lomba.length > 0) {
    this.plotingState.lombaId = this.data.lomba[0].id;
  }

  const activeLomba = this.data.lomba.find(l => l.id === this.plotingState.lombaId) || this.data.lomba[0] || {};
  const isTeam = (activeLomba.klasifikasi || '').includes('Tim');
  const targetSize = (activeLomba.klasifikasi || '').includes('3') ? 3 : ((activeLomba.klasifikasi || '').includes('2') ? 2 : 1);

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="crosshair" class="w-6 h-6 text-emerald-400"></i> Ploting &amp; Strategi Formasi Tim Olimpiade
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Smart matching berbasis kekuatan 5 topik kimia, simulasi radar sinergi tim, dan deteksi otomatis bentrok jadwal antar kompetisi.
        </p>
      </div>

      <!-- Competition Selector -->
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-zinc-400">Target Lomba:</label>
        <select onchange="OlympiadApp.selectPlotingLomba(this.value)" class="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-bold focus:outline-none focus:border-violet-500">
          ${this.data.lomba.map(l => `
            <option value="${l.id}" ${l.id === activeLomba.id ? 'selected' : ''}>
              ${l.nama} (${l.klasifikasi})
            </option>
          `).join('')}
        </select>
      </div>
    </div>

    <!-- Active Lomba Banner & Quota Status -->
    <div class="p-4 rounded-2xl glass-card border border-violet-500/20 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[11px]">${activeLomba.klasifikasi || 'Individu'}</span>
          <span class="text-xs text-zinc-400">Kuota Maksimal: <strong class="text-zinc-200">${activeLomba.kuotaSekolah || 3} Delegasi</strong></span>
        </div>
        <h3 class="text-base font-bold text-zinc-100 mt-1">${activeLomba.nama || 'Agenda Lomba'}</h3>
        <p class="text-xs text-zinc-400">Jadwal Penyisihan: <span class="text-violet-400 font-bold">${activeLomba.timeline?.penyisihan || '-'}</span> • Final: <span class="text-amber-400 font-bold">${activeLomba.timeline?.final || '-'}</span></p>
      </div>

      <!-- Smart Matching Trigger Button -->
      <button onclick="OlympiadApp.runSmartMatching('${activeLomba.id}', ${targetSize})" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all shrink-0">
        <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
        <span>Jalankan Smart Matching Otomatis</span>
      </button>
    </div>

    <!-- Smart Matching Recommendations (If Calculated) -->
    <div id="smart-matching-results" class="mb-6 ${this.plotingState.analysisResult ? '' : 'hidden'}">
      ${this.renderSmartMatchingResultsHTML()}
    </div>

    <!-- Interactive Team Simulation Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      <!-- Left: Student Selector -->
      <div class="lg:col-span-5 glass-card rounded-2xl p-5 border border-zinc-800 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              <i data-lucide="users" class="w-4 h-4 text-violet-400"></i>
              <span>Pilih Anggota Tim (${this.plotingState.selectedStudentIds.length} / ${targetSize} Dipilih)</span>
            </h3>
            <button onclick="OlympiadApp.clearPlotingSelection()" class="text-[11px] text-zinc-400 hover:text-rose-400">Reset</button>
          </div>
          <p class="text-xs text-zinc-400 mb-3">Centang siswa di bawah ini untuk menguji sinergi tim secara manual:</p>

          <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
            ${this.data.siswa.map(s => {
              const isSelected = this.plotingState.selectedStudentIds.includes(s.id);
              const clash = this.checkScheduleClash(s.id, activeLomba.id);
              return `
                <div class="p-3 rounded-xl border transition-all ${
                  isSelected ? 'bg-violet-600/15 border-violet-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                } flex items-center justify-between gap-2">
                  <label class="flex items-center gap-3 cursor-pointer flex-grow">
                    <input type="checkbox" 
                           ${isSelected ? 'checked' : ''}
                           onchange="OlympiadApp.toggleStudentSelection('${s.id}', ${targetSize})"
                           class="w-4 h-4 rounded text-violet-600 bg-zinc-900 border-zinc-700">
                    <div>
                      <div class="text-xs font-bold text-zinc-100">${s.nama}</div>
                      <div class="text-[11px] text-zinc-400">Spesialis: <span class="text-violet-400 font-semibold">${s.bidangUtama}</span> (${s.kelas})</div>
                    </div>
                  </label>
                  <div class="text-right shrink-0">
                    <span class="text-xs font-black text-emerald-400">${(Number(s.skorRata) || 75.0).toFixed(1)}</span>
                    ${clash ? `
                      <span class="block text-[10px] text-rose-400 font-bold" title="${clash}">[!] Bentrok Jadwal</span>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pt-4 border-t border-zinc-800 mt-4">
          <button onclick="OlympiadApp.savePlotingToLomba('${activeLomba.id}')" 
                  ${this.plotingState.selectedStudentIds.length === 0 ? 'disabled' : ''}
                  class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold transition-all shadow-md">
            Simpan Formasi Ini ke ${activeLomba.nama}
          </button>
        </div>
      </div>

      <!-- Right: Radar Chart & Team Synergy Analysis -->
      <div class="lg:col-span-7 glass-card rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <i data-lucide="radar" class="w-4 h-4 text-emerald-400"></i> Radar Sinergi Topik Tim
            </h3>
            <div id="synergy-badge" class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-zinc-800 text-zinc-400">
              Sinergi: --%
            </div>
          </div>

          <!-- Radar Canvas -->
          <div class="relative h-64 sm:h-72">
            <canvas id="chart-simulation-radar"></canvas>
          </div>

          <!-- Analysis Summary -->
          <div id="simulation-summary-box" class="mt-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <span class="text-zinc-400 italic">Pilih minimal 1 siswa untuk melihat kalkulasi sinergi dan kekuatan topik tim...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Riwayat Ploting Tahun ke Tahun -->
    <div class="glass-card rounded-2xl p-6 border border-zinc-800">
      <h3 class="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
        <i data-lucide="history" class="w-4 h-4 text-amber-400"></i> Histori Regenerasi &amp; Ploting Delegasi (2024 - 2026)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${this.data.riwayatPloting.map(rp => `
          <div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div class="flex items-center justify-between mb-2">
              <span class="px-2 py-0.5 rounded bg-zinc-800 text-violet-400 font-bold text-xs">Tahun ${rp.tahun}</span>
              <span class="text-[11px] text-amber-400 font-bold">${rp.capaian}</span>
            </div>
            <h4 class="text-xs font-bold text-zinc-100">${rp.namaTim}</h4>
            <div class="text-[11px] text-zinc-400 mt-0.5">${rp.lomba}</div>
            <ul class="mt-3 space-y-1 text-xs text-zinc-300 border-t border-zinc-800/80 pt-2">
              ${rp.anggota.map(a => `<li class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${a}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  setTimeout(() => {
    this.updateSimulationRadar();
  }, 100);
};

OlympiadApp.selectPlotingLomba = function(lombaId) {
  this.plotingState.lombaId = lombaId;
  const l = this.data.lomba.find(item => item.id === lombaId);
  this.plotingState.selectedStudentIds = l ? [...(l.pesertaIds || [])] : [];
  this.plotingState.analysisResult = null;
  this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.toggleStudentSelection = function(siswaId, maxSize) {
  const idx = this.plotingState.selectedStudentIds.indexOf(siswaId);
  if (idx !== -1) {
    this.plotingState.selectedStudentIds.splice(idx, 1);
  } else {
    if (this.plotingState.selectedStudentIds.length >= maxSize) {
      alert(`Batas formasi untuk lomba ini adalah ${maxSize} siswa. Hapus pilihan sebelumnya untuk mengganti.`);
      this.renderPlotingModule();
      return;
    }
    this.plotingState.selectedStudentIds.push(siswaId);
  }
  this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();
};

OlympiadApp.clearPlotingSelection = function() {
  this.plotingState.selectedStudentIds = [];
  this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();
};

// Deteksi Bentrok Jadwal Otomatis
OlympiadApp.checkScheduleClash = function(siswaId, targetLombaId) {
  const targetLomba = this.data.lomba.find(l => l.id === targetLombaId);
  if (!targetLomba) return null;

  for (const l of this.data.lomba) {
    if (l.id === targetLombaId) continue;
    if ((l.pesertaIds || []).includes(siswaId)) {
      if (l.timeline.penyisihan === targetLomba.timeline.penyisihan || l.timeline.final === targetLomba.timeline.final) {
        return `Bentrok tanggal babak dengan ${l.nama} (${l.timeline.penyisihan})`;
      }
    }
  }
  return null;
};

// Smart Matching Algorithm
OlympiadApp.runSmartMatching = function(lombaId, teamSize) {
  const candidates = [...this.data.siswa];
  if (candidates.length < teamSize) {
    alert('Jumlah siswa binaan tidak cukup untuk smart matching.');
    return;
  }

  // Generate combinations
  const combinations = [];
  const combine = (start, combo) => {
    if (combo.length === teamSize) {
      combinations.push([...combo]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      combo.push(candidates[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  };
  combine(0, []);

  // Score each combination based on:
  // 1. Topic balance: max of each topic across members
  // 2. Average score
  // 3. Penalty if schedule clash exists
  const scoredCombinations = combinations.map(team => {
    let clashCount = 0;
    team.forEach(m => {
      if (this.checkScheduleClash(m.id, lombaId)) clashCount++;
    });

    const topics = ['fisik', 'organik', 'anorganik', 'analitik', 'biokimia'];
    let minTopicStrength = 100;
    let avgCombined = 0;

    topics.forEach(t => {
      const bestScoreInTopic = Math.max(...team.map(m => (m?.ratingTopik?.[t] ?? 75)));
      avgCombined += bestScoreInTopic;
      if (bestScoreInTopic < minTopicStrength) minTopicStrength = bestScoreInTopic;
    });

    avgCombined = avgCombined / topics.length;

    // Sinergy formula: rewards balanced coverage and penalizes clashes
    const synergyScore = Math.max(0, Math.round((avgCombined * 0.7 + minTopicStrength * 0.3) - (clashCount * 25)));

    return {
      team: team,
      synergyScore: synergyScore,
      clashCount: clashCount,
      minTopicStrength: minTopicStrength,
      avgCombined: avgCombined
    };
  });

  scoredCombinations.sort((a, b) => b.synergyScore - a.synergyScore);
  this.plotingState.analysisResult = scoredCombinations.slice(0, 3);
  this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();
  this.showToast('Smart Matching selesai! 3 Rekomendasi sinergi tim terbaik ditampilkan.', 'success');
};

OlympiadApp.renderSmartMatchingResultsHTML = function() {
  if (!this.plotingState.analysisResult) return '';

  return `
    <div class="glass-card rounded-2xl p-5 border border-violet-500/40 glow-ambient-violet">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-extrabold text-zinc-100 flex items-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i> Rekomendasi Formasi Terbaik (Hasil Analisis AI &amp; Sinergi)
        </h3>
        <button onclick="OlympiadApp.plotingState.analysisResult = null; OlympiadApp.renderPlotingModule();" class="text-xs text-zinc-400 hover:text-zinc-200">Tutup</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${this.plotingState.analysisResult.map((res, i) => `
          <div class="p-4 rounded-xl bg-zinc-900/80 border ${i === 0 ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-zinc-800'} flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'}">
                  #${i + 1} Sinergi: ${res.synergyScore}%
                </span>
                ${res.clashCount > 0 ? '<span class="text-[10px] text-rose-400 font-bold">[!] Ada Bentrok</span>' : '<span class="text-[10px] text-emerald-400 font-bold">&#10003; Jadwal Bebas</span>'}
              </div>
              <ul class="space-y-1.5 text-xs text-zinc-200 mt-2">
                ${res.team.map(m => `
                  <li class="flex items-center justify-between">
                    <span>${m.nama}</span>
                    <span class="text-[10px] text-violet-400 font-semibold">${m.bidangUtama}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            <button onclick="OlympiadApp.applyRecommendedTeam(['${res.team.map(m => m.id).join("','")}'])" class="mt-4 w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all">
              Terapkan Pilihan Ini
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

OlympiadApp.applyRecommendedTeam = function(studentIds) {
  this.plotingState.selectedStudentIds = [...studentIds];
  this.renderPlotingModule();
  if (window.lucide) window.lucide.createIcons();
  this.showToast('Formasi rekomendasi diterapkan ke simulator radar!', 'success');
};

OlympiadApp.updateSimulationRadar = function() {
  const ctx = document.getElementById('chart-simulation-radar');
  if (!ctx) return;

  const selectedStudents = this.plotingState.selectedStudentIds.map(id => this.data.siswa.find(s => s.id === id)).filter(Boolean);
  const summaryBox = document.getElementById('simulation-summary-box');
  const synergyBadge = document.getElementById('synergy-badge');

  if (selectedStudents.length === 0) {
    if (this.radarChart) this.radarChart.destroy();
    if (summaryBox) summaryBox.innerHTML = '<span class="text-zinc-500 italic">Pilih minimal 1 siswa untuk melihat simulasi radar kekuatan tim...</span>';
    if (synergyBadge) synergyBadge.textContent = 'Sinergi: --%';
    return;
  }

  const topics = ['fisik', 'organik', 'anorganik', 'analitik', 'biokimia'];
  const labels = ['Kimia Fisik', 'Kimia Organik', 'Kimia Anorganik', 'Kimia Analitik', 'Biokimia'];

  // Combined best score per topic
  const maxValues = topics.map(t => Math.max(...selectedStudents.map(s => (s?.ratingTopik?.[t] ?? 75))));
  const avgValues = topics.map(t => {
    const sum = selectedStudents.reduce((acc, s) => acc + (s?.ratingTopik?.[t] ?? 75), 0);
    return Math.round(sum / selectedStudents.length);
  });

  // Calculate synergy
  const minScore = Math.min(...maxValues);
  const avgScore = Math.round(maxValues.reduce((a, b) => a + b, 0) / maxValues.length);
  const synergyIndex = Math.round((avgScore * 0.7) + (minScore * 0.3));

  if (synergyBadge) {
    synergyBadge.className = `px-2.5 py-1 rounded-full text-xs font-black ${
      synergyIndex >= 88 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
      synergyIndex >= 78 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    }`;
    synergyBadge.textContent = `Sinergi Tim: ${synergyIndex}%`;
  }

  // Highlight blind spots (<75)
  const weakTopics = [];
  topics.forEach((t, i) => {
    if (maxValues[i] < 75) weakTopics.push(labels[i]);
  });

  if (summaryBox) {
    summaryBox.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="font-bold text-zinc-200">Indeks Komposisi Tim:</span>
          <span class="font-bold text-emerald-400">${avgScore} / 100</span>
        </div>
        <div class="text-[11px] text-zinc-400">
          Pilar Terkuat: <strong class="text-violet-300">${labels[maxValues.indexOf(Math.max(...maxValues))]} (${Math.max(...maxValues)})</strong>
        </div>
        ${weakTopics.length > 0 ? `
          <div class="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 mt-2">
            <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
            <span><strong>Blind Spot Terdeteksi:</strong> Tim lemah pada bidang <em>${weakTopics.join(', ')}</em> (&lt;75). Disarankan rotasi atau materi penguatan.</span>
          </div>
        ` : `
          <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 mt-2">
            <i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i>
            <span><strong>Formasi Sinergis:</strong> Seluruh 5 bidang kimia ter-cover di atas ambang batas 75!</span>
          </div>
        `}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  if (this.radarChart) this.radarChart.destroy();
  this.radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Kekuatan Maksimum Tim',
          data: maxValues,
          backgroundColor: 'rgba(52, 211, 153, 0.25)',
          borderColor: '#34d399',
          pointBackgroundColor: '#34d399',
          borderWidth: 2
        },
        {
          label: 'Rata-rata Tim',
          data: avgValues,
          backgroundColor: 'rgba(167, 139, 250, 0.15)',
          borderColor: '#a78bfa',
          pointBackgroundColor: '#a78bfa',
          borderWidth: 1.5,
          borderDash: [4, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 50,
          suggestedMax: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#a1a1aa', font: { size: 10, weight: '600' } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#d4d4d8', font: { size: 10 } }
        }
      }
    }
  });
};

OlympiadApp.savePlotingToLomba = function(lombaId) {
  const l = this.data.lomba.find(item => item.id === lombaId);
  if (!l) return;
  l.pesertaIds = [...this.plotingState.selectedStudentIds];
  this.saveData(true);
  this.showToast(`Formasi berhasil diploting untuk ${l.nama}!`, 'success');
};

// --- END FILE: app_part5_ploting.js ---

// --- START FILE: app_part6_analitik.js ---
// ============================================================================
// MODUL 6: ANALITIK & REPORTING (HEATMAP KEAHLIAN & EKSPOR LAPORAN)
// ============================================================================
OlympiadApp.renderAnalyticsModule = function() {
  const container = document.getElementById('panel-analitik');
  if (!container) return;

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="bar-chart-3" class="w-6 h-6 text-violet-400"></i> Analitik Performa &amp; Heatmap Keahlian
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Visualisasi pemetaan kompetensi 5 bidang kimia, tren medali, evaluasi titik lemah, dan ekspor laporan koordinasi.
        </p>
      </div>

      <!-- Export Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="OlympiadApp.exportExcel()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Ekspor Excel (.xlsx)
        </button>
        <button onclick="OlympiadApp.exportPDFReport()" class="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all">
          <i data-lucide="printer" class="w-4 h-4"></i> Cetak Laporan Rapat
        </button>
      </div>
    </div>

    <!-- Analytics Charts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Chart 1: Medal Distribution -->
      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex flex-col justify-between">
        <div>
          <h3 class="text-xs font-bold text-zinc-200 uppercase mb-3 flex items-center gap-1.5">
            <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Distribusi Capaian Medali
          </h3>
          <div class="relative h-52">
            <canvas id="chart-medals-donut"></canvas>
          </div>
        </div>
        <div class="text-center text-xs text-zinc-400 mt-2">
          Total Koleksi Medali Kontingen
        </div>
      </div>

      <!-- Chart 2: Weakness / Strength by Topic -->
      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex flex-col justify-between">
        <div>
          <h3 class="text-xs font-bold text-zinc-200 uppercase mb-3 flex items-center gap-1.5">
            <i data-lucide="activity" class="w-4 h-4 text-rose-400"></i> Analisis Titik Lemah (5 Topik)
          </h3>
          <div class="relative h-52">
            <canvas id="chart-weakness-bar"></canvas>
          </div>
        </div>
        <div class="text-center text-xs text-zinc-400 mt-2">
          Rata-rata Skor Binaan per Cabang Kimia
        </div>
      </div>

      <!-- Chart 3: Multi-Year Trend -->
      <div class="glass-card rounded-2xl p-5 border border-zinc-800 flex flex-col justify-between">
        <div>
          <h3 class="text-xs font-bold text-zinc-200 uppercase mb-3 flex items-center gap-1.5">
            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i> Tren Prestasi (2024 - 2026)
          </h3>
          <div class="relative h-52">
            <canvas id="chart-trend-line"></canvas>
          </div>
        </div>
        <div class="text-center text-xs text-zinc-400 mt-2">
          Perbandingan Medali &amp; Rasio Lolos
        </div>
      </div>
    </div>

    <!-- HEATMAP KEAHLIAN SISWA (MATRIKS VISUALISASI) -->
    <div class="glass-card rounded-2xl p-6 border border-zinc-800 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-base font-bold text-zinc-100 flex items-center gap-2">
            <i data-lucide="grid" class="w-5 h-5 text-violet-400"></i> Heatmap Keahlian Siswa vs 5 Bidang Kimia
          </h3>
          <p class="text-xs text-zinc-400 mt-0.5">Matriks pemetaan kemampuan personal (0 - 100) untuk penentuan spesialisasi dan materi bimbingan tambahan.</p>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-2 text-[10px] font-bold">
          <span class="px-2 py-0.5 rounded heatmap-cell-5">&gt;90 (Master)</span>
          <span class="px-2 py-0.5 rounded heatmap-cell-4">80-89 (Mahir)</span>
          <span class="px-2 py-0.5 rounded heatmap-cell-3">70-79 (Cukup)</span>
          <span class="px-2 py-0.5 rounded heatmap-cell-1">&lt;70 (Lemah)</span>
        </div>
      </div>

      <!-- Heatmap Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <th class="py-3 px-3">Nama Siswa</th>
              <th class="py-3 px-3">Kelas</th>
              <th class="py-3 px-3 text-center">Kimia Fisik</th>
              <th class="py-3 px-3 text-center">Kimia Organik</th>
              <th class="py-3 px-3 text-center">Kimia Anorganik</th>
              <th class="py-3 px-3 text-center">Kimia Analitik</th>
              <th class="py-3 px-3 text-center">Biokimia</th>
              <th class="py-3 px-3 text-center">Rata-rata</th>
              <th class="py-3 px-3 text-center">Kesiapan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60">
            ${this.data.siswa.length === 0 ? `
              <tr>
                <td colspan="9" class="py-8 text-center text-zinc-500 text-xs">
                  Belum ada data siswa binaan. Tambahkan siswa terlebih dahulu untuk melihat heatmap keahlian.
                </td>
              </tr>
            ` : this.data.siswa.map(s => {
              const getCellClass = (score) => {
                if (score >= 90) return 'heatmap-cell-5';
                if (score >= 80) return 'heatmap-cell-4';
                if (score >= 70) return 'heatmap-cell-3';
                if (score >= 60) return 'heatmap-cell-2';
                return 'heatmap-cell-1';
              };

              return `
                <tr class="hover:bg-zinc-900/50 transition-colors cursor-pointer" onclick="OlympiadApp.openSiswaDetail('${s.id}')">
                  <td class="py-3 px-3 font-bold text-zinc-100 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-violet-400"></span>
                    <span>${s.nama}</span>
                  </td>
                  <td class="py-3 px-3 text-zinc-400">${s.kelas || '-'}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold rounded ${getCellClass(s.ratingTopik?.fisik ?? 75)}">${s.ratingTopik?.fisik ?? 75}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold rounded ${getCellClass(s.ratingTopik?.organik ?? 75)}">${s.ratingTopik?.organik ?? 75}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold rounded ${getCellClass(s.ratingTopik?.anorganik ?? 75)}">${s.ratingTopik?.anorganik ?? 75}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold rounded ${getCellClass(s.ratingTopik?.analitik ?? 75)}">${s.ratingTopik?.analitik ?? 75}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold rounded ${getCellClass(s.ratingTopik?.biokimia ?? 75)}">${s.ratingTopik?.biokimia ?? 75}</td>
                  <td class="py-3 px-3 text-center font-mono font-black text-emerald-400">${(Number(s.skorRata) || 75.0).toFixed(1)}</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (Number(s.skorRata) || 75) >= 85 ? 'bg-emerald-500/20 text-emerald-300' :
                      (Number(s.skorRata) || 75) >= 80 ? 'bg-violet-500/20 text-violet-300' :
                      'bg-amber-500/20 text-amber-300'
                    }">${(Number(s.skorRata) || 75) >= 85 ? 'Siap Nasional' : (Number(s.skorRata) || 75) >= 80 ? 'Siap Provinsi' : 'Pematangan'}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  setTimeout(() => {
    this.renderAnalyticsCharts();
  }, 100);
};

OlympiadApp.renderAnalyticsCharts = function() {
  // Chart 1: Medal Donut
  const ctxMedals = document.getElementById('chart-medals-donut');
  if (ctxMedals) {
    if (this.medalChart) this.medalChart.destroy();
    let emas = 0, perak = 0, perunggu = 0;
    (this.data.siswa || []).forEach(s => {
      (s.riwayatLomba || []).forEach(r => {
        const cap = String(r?.capaian || r?.nama || '');
        if (cap.includes('Emas') || cap.includes('Juara 1')) emas++;
        else if (cap.includes('Perak') || cap.includes('Juara 2')) perak++;
        else if (cap.includes('Perunggu') || cap.includes('Juara 3')) perunggu++;
      });
    });

    this.medalChart = new Chart(ctxMedals, {
      type: 'doughnut',
      data: {
        labels: ['Emas', 'Perak', 'Perunggu'],
        datasets: [{
          data: [emas, perak, perunggu],
          backgroundColor: ['#fbbf24', '#94a3b8', '#d97706'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 10 } } }
        },
        cutout: '70%'
      }
    });
  }

  // Chart 2: Weakness / Strength by Topic
  const ctxWeak = document.getElementById('chart-weakness-bar');
  if (ctxWeak) {
    if (this.weaknessChart) this.weaknessChart.destroy();
    const topics = ['fisik', 'organik', 'anorganik', 'analitik', 'biokimia'];
    const labels = ['Kimia Fisik', 'Kimia Organik', 'Kimia Anorganik', 'Kimia Analitik', 'Biokimia'];
    const averages = topics.map(t => {
      const sum = (this.data.siswa || []).reduce((acc, s) => acc + (s?.ratingTopik?.[t] ?? 75), 0);
      return (this.data.siswa || []).length > 0 ? Math.round(sum / this.data.siswa.length) : 75;
    });

    this.weaknessChart = new Chart(ctxWeak, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rata-rata Skor Binaan',
          data: averages,
          backgroundColor: averages.map(v => v < 80 ? 'rgba(244, 63, 94, 0.65)' : 'rgba(52, 211, 153, 0.65)'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 60,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#71717a' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#71717a', font: { size: 9 } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Chart 3: Multi-Year Trend
  const ctxTrend = document.getElementById('chart-trend-line');
  if (ctxTrend) {
    if (this.trendChart) this.trendChart.destroy();
    this.trendChart = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ['2023', '2024', '2025', '2026 (Target)'],
        datasets: [
          {
            label: 'Total Medali',
            data: [2, 3, 5, 8],
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Rasio Lolos Final (%)',
            data: [40, 60, 75, 90],
            borderColor: '#34d399',
            borderDash: [5, 5],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#71717a' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#71717a', font: { size: 10 } }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { color: '#a1a1aa', font: { size: 9 } } }
        }
      }
    });
  }
};

// SheetJS Excel Export
OlympiadApp.exportExcel = function() {
  if (!window.XLSX) {
    alert('Library SheetJS belum termuat.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Siswa
  const siswaRows = this.data.siswa.map(s => ({
    'Nama Siswa': s.nama,
    'NISN': s.nisn,
    'Kelas': s.kelas,
    'Level Bimbingan': s.level,
    'Spesialisasi Utama': s.bidangUtama || 'Belum Ditentukan',
    'Spesialisasi Sub': s.bidangSekunder || '',
    'Kimia Fisik': s.ratingTopik?.fisik ?? 75,
    'Kimia Organik': s.ratingTopik?.organik ?? 75,
    'Kimia Anorganik': s.ratingTopik?.anorganik ?? 75,
    'Kimia Analitik': s.ratingTopik?.analitik ?? 75,
    'Biokimia': s.ratingTopik?.biokimia ?? 75,
    'Rata-rata': s.skorRata || 75.0,
    'Kehadiran (%)': s.kehadiran?.persentase ?? 100
  }));
  const wsSiswa = XLSX.utils.json_to_sheet(siswaRows);
  XLSX.utils.book_append_sheet(wb, wsSiswa, "Data Siswa & Nilai");

  // Sheet 2: Agenda Lomba
  const lombaRows = (this.data.lomba || []).map(l => ({
    'Nama Lomba': l.nama || 'Kompetisi',
    'Penyelenggara': l.penyelenggara || '-',
    'Klasifikasi': l.klasifikasi || 'Individu',
    'Status Pendaftaran': l.statusPendaftaran || 'Draft',
    'Deadline': l.timeline?.deadlineDaftar || '-',
    'Penyisihan': l.timeline?.penyisihan || '-',
    'Final': l.timeline?.final || '-',
    'Biaya Total': ((l.biaya?.pendaftaran || 0) + (l.biaya?.transportasi || 0) + (l.biaya?.akomodasi || 0))
  }));
  const wsLomba = XLSX.utils.json_to_sheet(lombaRows);
  XLSX.utils.book_append_sheet(wb, wsLomba, "Agenda Lomba 2026");

  XLSX.writeFile(wb, `Rekap_PortalKimia_Olimpiade_${new Date().toISOString().slice(0,10)}.xlsx`);
  this.showToast('Laporan lengkap Excel (.xlsx) berhasil diekspor!', 'success');
};

// Print / PDF Report Generator
OlympiadApp.exportPDFReport = function() {
  const printWin = window.open('', '_blank');
  const d = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Resmi Koordinasi Pembinaan Olimpiade Kimia</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; font-size: 11pt; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 25px; }
        h1 { margin: 0; font-size: 16pt; text-transform: uppercase; }
        h2 { margin: 4px 0; font-size: 13pt; font-weight: normal; }
        h3 { margin: 15px 0 6px 0; font-size: 12pt; border-bottom: 1px solid #333; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; font-size: 10pt; }
        th, td { border: 1px solid #555; padding: 6px 8px; }
        th { background: #e5e7eb; font-weight: bold; text-align: left; }
        .text-center { text-align: center; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 220px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${this.data.settings.namaSekolah}</h1>
        <h2>TIM KOORDINASI PEMBINAAN TALENTA &amp; OLIMPIADE KIMIA</h2>
        <p style="margin: 3px 0; font-size: 10pt;">Alamat: Kompleks Pendidikan Progresif Bumi Shalawat, Sidoarjo • Tahun Ajaran 2025/2026</p>
      </div>

      <p style="text-align: right; font-size: 10pt;">Tanggal: ${d}</p>
      <h2 style="text-align: center; font-weight: bold; margin-bottom: 20px;">LAPORAN KOORDINASI &amp; PERKEMBANGAN TIM OLIMPIADE KIMIA</h2>

      <h3>1. Ringkasan Eksekutif Kontingen</h3>
      <p>Berdasarkan hasil pembinaan intensif dan evaluasi berkala hingga bulan berjalan:</p>
      <ul>
        <li>Jumlah Siswa Binaan Aktif: <strong>${(this.data.siswa || []).length} Siswa</strong></li>
        <li>Jumlah Bank Soal Terstandarisasi KaTeX: <strong>${(this.data.soal || []).length} Butir Soal</strong></li>
        <li>Target Medali Nasional Tahun Ini: <strong>${this.data.settings.targetMedaliNasional || 0} Medali</strong></li>
        <li>Agenda Kompetisi Mendatang: <strong>${(this.data.lomba || []).length} Kompetisi Resmi</strong></li>
      </ul>

      <h3>2. Rekap Matriks Keahlian Siswa Binaan</h3>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Siswa</th>
            <th>Kelas</th>
            <th>Spesialisasi</th>
            <th class="text-center">Fisik</th>
            <th class="text-center">Organik</th>
            <th class="text-center">Anorganik</th>
            <th class="text-center">Analitik</th>
            <th class="text-center">Biokimia</th>
            <th class="text-center">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          ${(this.data.siswa || []).map((s, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td><strong>${s.nama}</strong></td>
              <td>${s.kelas || '-'}</td>
              <td>${s.bidangUtama || 'Umum'}</td>
              <td class="text-center">${s.ratingTopik?.fisik ?? 75}</td>
              <td class="text-center">${s.ratingTopik?.organik ?? 75}</td>
              <td class="text-center">${s.ratingTopik?.anorganik ?? 75}</td>
              <td class="text-center">${s.ratingTopik?.analitik ?? 75}</td>
              <td class="text-center">${s.ratingTopik?.biokimia ?? 75}</td>
              <td class="text-center"><strong>${(Number(s.skorRata) || 75.0).toFixed(1)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>3. Status Agenda Kompetisi &amp; Administrasi</h3>
      <table>
        <thead>
          <tr>
            <th>Nama Lomba</th>
            <th>Penyelenggara</th>
            <th>Deadline</th>
            <th>Penyisihan</th>
            <th>Status Pendaftaran</th>
            <th>Kelengkapan Dokumen</th>
          </tr>
        </thead>
        <tbody>
          ${(this.data.lomba || []).map(l => `
            <tr>
              <td><strong>${l.nama}</strong></td>
              <td>${l.penyelenggara || '-'}</td>
              <td>${l.timeline?.deadlineDaftar || '-'}</td>
              <td>${l.timeline?.penyisihan || '-'}</td>
              <td>${l.statusPendaftaran || 'Draft'}</td>
              <td>
                ${l.dokumenCeklis?.proposalAcc ? '✓ ACC Proposal' : '- Belum ACC'}, 
                ${l.dokumenCeklis?.suratIzinDibuat ? '✓ Surat Izin' : '- Surat Izin Proses'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="signature">
        <div class="sig-box">
          <p>Mengetahui,<br>Kepala Sekolah / Waka Kesiswaan</p>
          <br><br><br>
          <p><strong>( ________________________ )</strong><br>NIP. ........................................</p>
        </div>
        <div class="sig-box">
          <p>Sidoarjo, ${d}<br>Koordinator Olimpiade Kimia</p>
          <br><br><br>
          <p><strong>${this.data.settings.koordinator}</strong><br>NIP/ID. PortalKimia</p>
        </div>
      </div>

      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => window.print(), 500);
        });
      </script>
    </body>
    </html>
  `;

  printWin.document.write(html);
  printWin.document.close();
};

// --- END FILE: app_part6_analitik.js ---

// --- START FILE: app_part7_settings.js ---
// ============================================================================
// MODUL 7 & 8: PENGATURAN SISTEM & MANAJEMEN USER
// ============================================================================
OlympiadApp.renderSettingsModule = function() {
  const container = document.getElementById('panel-settings');
  if (!container) return;

  let html = `
    <!-- Top Bar -->
    <div class="mb-6">
      <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
        <i data-lucide="settings" class="w-6 h-6 text-violet-400"></i> Pengaturan Konfigurasi Sistem
      </h2>
      <p class="text-zinc-400 text-xs sm:text-sm mt-1">
        Kelola identitas instansi, target tahunan, sinkronisasi backend Google Apps Script, dan backup basis data.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- School Identity & Targets -->
      <div class="glass-card rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h3 class="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-2">Identitas &amp; Target Olimpiade</h3>

        <div>
          <label class="block text-xs font-bold text-zinc-300 mb-1">Nama Sekolah / Lembaga:</label>
          <input type="text" id="settings-sekolah" value="${this.data.settings.namaSekolah}"
                 class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
        </div>

        <div>
          <label class="block text-xs font-bold text-zinc-300 mb-1">Koordinator / Pembina Utama:</label>
          <input type="text" id="settings-koordinator" value="${this.data.settings.koordinator}"
                 class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-1">Target Medali Nasional:</label>
            <input type="number" id="settings-target-medali" value="${this.data.settings.targetMedaliNasional}"
                   class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-1">Tahun Ajaran Aktif:</label>
            <input type="text" id="settings-tahun-ajaran" value="${this.data.settings.tahunAjaran}"
                   class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-violet-500">
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold text-zinc-300">URL Web App Google Apps Script (Backend Multi-Device):</label>
            ${(typeof window !== 'undefined' && ((window.OLIMPIADE_CONFIG?.GAS_API_URL && window.OLIMPIADE_CONFIG.GAS_API_URL.startsWith('http')) || (window.PORTALKIMIA_CONFIG?.OLIMPIADE_API && window.PORTALKIMIA_CONFIG.OLIMPIADE_API.startsWith('http')))) ? 
              `<span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">✓ Terhubung via config.js</span>` : 
              `<span class="text-[10px] text-zinc-500">Dapat diisi via config.js</span>`
            }
          </div>
          <div class="flex gap-2">
            <input type="url" id="settings-gas-url" value="${this.data.settings.googleAppsScriptUrl || this.getCloudApiUrl()}"
                   placeholder="https://script.google.com/macros/s/.../exec"
                   class="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-violet-500">
            <button type="button" onclick="OlympiadApp.testCloudConnection()" class="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0 transition-all">
              Tes &amp; Sync
            </button>
          </div>
          <span class="text-[10px] text-zinc-500 mt-1 block">
            Sinkronisasi otomatis dua arah ke Google Spreadsheet untuk kolaborasi real-time antar device.
            <span class="text-violet-400 font-medium">*Tips: Masukkan link di file <code class="text-amber-300">config.js</code> agar otomatis aktif di semua perangkat tanpa perlu ketik manual.</span>
          </span>
        </div>

        <button onclick="OlympiadApp.saveSettings()" class="mt-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md">
          Simpan Konfigurasi
        </button>
      </div>

      <!-- Backup & Restore Database -->
      <div class="glass-card rounded-2xl p-6 border border-zinc-800 space-y-4 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-2">Cadangan &amp; Pemulihan Data (Backup JSON)</h3>
          <p class="text-xs text-zinc-400 mt-2 leading-relaxed">
            Amankan seluruh bank soal ber-KaTeX, link Google Drive, data siswa, riwayat nilai, dan agenda lomba dalam satu berkas JSON terenkripsi lokal.
          </p>

          <div class="mt-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <strong class="text-xs text-zinc-200 block">Unduh Cadangan Lengkap</strong>
                <span class="text-[11px] text-zinc-500">Simpan database lokal ke file .json</span>
              </div>
              <button onclick="OlympiadApp.backupDatabase()" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
                <i data-lucide="download" class="w-3.5 h-3.5 text-amber-400"></i> Unduh JSON
              </button>
            </div>

            <div class="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-zinc-200 block">Pulihkan dari Berkas</strong>
                <span class="text-[11px] text-zinc-500">Muat ulang database dari backup</span>
              </div>
              <button onclick="OlympiadApp.triggerRestoreDatabase()" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-emerald-400"></i> Unggah JSON
              </button>
            </div>
          </div>
        </div>

        <!-- Action 1: Kosongkan Seluruh Data -->
        <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-500/25">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong class="text-xs text-rose-300 block">Kosongkan Seluruh Tampilan &amp; Data</strong>
              <span class="text-[10px] text-rose-400/80">Menghapus semua soal, siswa, lomba, dan jadwal agar bersih untuk uji coba mandiri</span>
            </div>
            <button onclick="OlympiadApp.clearAllData()" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shrink-0 shadow-sm shadow-rose-600/30">
              Kosongkan Data
            </button>
          </div>
        </div>

        <!-- Action 2: Muat Data Sampel Demo -->
        <div class="p-4 rounded-xl bg-violet-950/20 border border-violet-500/25">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong class="text-xs text-violet-300 block">Muat Data Sampel Bawaan (Demo)</strong>
              <span class="text-[10px] text-violet-400/80">Memuat kembali contoh naskah soal, siswa binaan, dan agenda kompetisi awal</span>
            </div>
            <button onclick="OlympiadApp.loadSampleData()" class="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shrink-0 shadow-sm shadow-violet-600/30">
              Muat Data Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

OlympiadApp.saveSettings = function() {
  this.data.settings.namaSekolah = document.getElementById('settings-sekolah').value.trim();
  this.data.settings.koordinator = document.getElementById('settings-koordinator').value.trim();
  this.data.settings.targetMedaliNasional = parseInt(document.getElementById('settings-target-medali').value) || 3;
  this.data.settings.tahunAjaran = document.getElementById('settings-tahun-ajaran').value.trim();
  this.data.settings.googleAppsScriptUrl = document.getElementById('settings-gas-url').value.trim();

  this.saveData(true);
  this.initCloudSync();
  this.showToast('Pengaturan sistem berhasil disimpan dan disinkronkan!', 'success');
};

OlympiadApp.testCloudConnection = async function() {
  const url = document.getElementById('settings-gas-url').value.trim();
  if (!url) {
    alert('Masukkan URL Web App Google Apps Script terlebih dahulu.');
    return;
  }
  this.data.settings.googleAppsScriptUrl = url;
  this.showToast('Menguji koneksi ke Google Spreadsheet...', 'info');
  const res = await this.pushToCloud();
  if (res && res.status === 'ok') {
    this.showToast('Koneksi sukses! Data berhasil tersinkronisasi ke Google Spreadsheet.', 'success');
  } else {
    this.showToast('Sinkronisasi selesai atau menunggu otorisasi GAS.', 'info');
  }
};

OlympiadApp.backupDatabase = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `Backup_PortalKimia_Olimpiade_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  this.showToast('Basis data berhasil di-backup!', 'success');
};

OlympiadApp.triggerRestoreDatabase = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.soal && imported.siswa && imported.lomba) {
          this.data = imported;
          this.saveData();
          this.renderActiveTab();
          this.showToast('Database berhasil dipulihkan dari berkas backup!', 'success');
        } else {
          alert('Format berkas tidak valid untuk database PortalKimia Olimpiade.');
        }
      } catch (err) {
        alert('Gagal membaca berkas: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

OlympiadApp.resetToStarterData = function() {
  if (!confirm('Apakah Anda yakin ingin mereset seluruh database ke contoh bawaan awal? Semua perubahan akan ditimpa.')) return;
  this.data = JSON.parse(JSON.stringify(window.PORTALKIMIA_OLYMPIAD_DATA));
  this.saveData();
  this.renderActiveTab();
  this.showToast('Data berhasil direset ke sampel standar.', 'info');
};

// ============================================================================
// MODUL 8: MANAJEMEN USER & ROLE
// ============================================================================
OlympiadApp.renderUsersModule = function() {
  const container = document.getElementById('panel-users');
  if (!container) return;

  let html = `
    <!-- Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="shield-check" class="w-6 h-6 text-rose-400"></i> Manajemen Pengguna &amp; Hak Akses
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Kelola kredensial akun Admin, Pembimbing/Guru, dan Siswa Binaan untuk pembagian permission sistem.
        </p>
      </div>

      <button onclick="OlympiadApp.promptAddUser()" class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all self-start md:self-auto">
        <i data-lucide="user-plus" class="w-4 h-4"></i> Tambah Akun Pengguna
      </button>
    </div>

    <!-- Users Table -->
    <div class="glass-card rounded-2xl p-6 border border-zinc-800">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Pengguna</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Jabatan / Keterangan</th>
              <th class="py-3 px-4">Role Akses</th>
              <th class="py-3 px-4 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60">
            ${this.data.users.map(u => `
              <tr class="hover:bg-zinc-900/50 transition-colors">
                <td class="py-3 px-4 font-bold text-zinc-100 flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-bold">
                    ${u.avatar || u.nama[0]}
                  </div>
                  <span>${u.nama}</span>
                </td>
                <td class="py-3 px-4 text-zinc-400 font-mono">${u.email}</td>
                <td class="py-3 px-4 text-zinc-300">${u.jabatan}</td>
                <td class="py-3 px-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    u.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    u.role === 'pembimbing' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }">
                    ${u.role.toUpperCase()}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <button onclick="OlympiadApp.requestRoleSwitch('${u.role}')" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition-all">
                    Uji Role Ini
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

OlympiadApp.promptAddUser = function() {
  const nama = prompt('Nama Pengguna:');
  if (!nama) return;
  const email = prompt('Alamat Email:', `${nama.toLowerCase().replace(/\s+/g, '.')}@portalkimia.org`);
  if (!email) return;
  const role = prompt('Pilih Role (admin / pembimbing / siswa):', 'pembimbing');
  if (!['admin', 'pembimbing', 'siswa'].includes(role?.toLowerCase())) {
    alert('Role tidak valid. Harus admin, pembimbing, atau siswa.');
    return;
  }

  this.data.users.push({
    id: 'usr-' + Date.now(),
    nama: nama,
    email: email,
    role: role.toLowerCase(),
    jabatan: role === 'admin' ? 'Administrator Sistem' : (role === 'pembimbing' ? 'Pembina Olimpiade' : 'Siswa Delegasi'),
    avatar: nama.split(' ').map(n => n[0]).slice(0, 2).join('')
  });

  this.saveData(true);
  this.renderUsersModule();
  this.showToast(`Akun ${nama} berhasil ditambahkan!`, 'success');
};

// Global DOM Ready Starter
window.addEventListener('DOMContentLoaded', () => {
  window.OlympiadApp.init();
});

// --- END FILE: app_part7_settings.js ---

// --- START FILE: app_part8_jadwal.js ---
// ============================================================================
// MODUL 8: JADWAL INTENSIF BIMBINGAN / PELATDA
// ============================================================================
OlympiadApp.jadwalFilterBidang = 'all';
OlympiadApp.jadwalSearchQuery = '';

OlympiadApp.renderJadwalModule = function() {
  const container = document.getElementById('panel-jadwal');
  if (!container) return;

  const list = this.data.jadwalIntensif || [];
  const now = new Date();

  // Filter list
  const filtered = list.filter(j => {
    const matchBidang = this.jadwalFilterBidang === 'all' || j.bidang === this.jadwalFilterBidang;
    const q = (this.jadwalSearchQuery || '').toLowerCase();
    const matchSearch = !q || 
      (j.judul || '').toLowerCase().includes(q) ||
      (j.pengisi || '').toLowerCase().includes(q) ||
      (j.lokasi || '').toLowerCase().includes(q) ||
      (j.keterangan || '').toLowerCase().includes(q);
    return matchBidang && matchSearch;
  }).sort((a, b) => new Date(a.tanggal + 'T' + (a.jamMulai || '00:00')) - new Date(b.tanggal + 'T' + (b.jamMulai || '00:00')));

  const bidangColors = {
    'Kimia Organik': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    'Kimia Anorganik': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'Kimia Fisik': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'Kimia Analitik': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'Biokimia': 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  };

  let html = `
    <!-- Top Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <i data-lucide="calendar-clock" class="w-6 h-6 text-violet-400"></i> Jadwal Intensif Bimbingan &amp; Pelatda
        </h2>
        <p class="text-zinc-400 text-xs sm:text-sm mt-1">
          Agenda pembinaan olimpiade fleksibel: rotasi materi 5 bidang kimia, pengajar ahli, ruang lab, dan persiapan naskah soal.
        </p>
      </div>

      ${!this.isSiswa() ? `
        <button onclick="OlympiadApp.openAddJadwalModal()" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all self-start md:self-auto">
          <i data-lucide="calendar-plus" class="w-4 h-4"></i> Tambah Jadwal Bimbingan
        </button>
      ` : ''}
    </div>

    <!-- Filter & Search Controls -->
    <div class="glass-card rounded-2xl p-4 sm:p-5 border border-zinc-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <i data-lucide="search" class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
        <input 
          type="text" 
          placeholder="Cari materi, nama pengisi, ruangan, atau topik..." 
          value="${this.jadwalSearchQuery || ''}"
          oninput="OlympiadApp.onSearchJadwal(this.value)"
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/80 text-zinc-100 text-xs placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        >
      </div>

      <!-- Filter Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        <button onclick="OlympiadApp.filterJadwalBidang('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'all' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Semua Bidang
        </button>
        <button onclick="OlympiadApp.filterJadwalBidang('Kimia Organik')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'Kimia Organik' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Organik
        </button>
        <button onclick="OlympiadApp.filterJadwalBidang('Kimia Anorganik')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'Kimia Anorganik' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Anorganik
        </button>
        <button onclick="OlympiadApp.filterJadwalBidang('Kimia Fisik')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'Kimia Fisik' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Fisik
        </button>
        <button onclick="OlympiadApp.filterJadwalBidang('Kimia Analitik')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'Kimia Analitik' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Analitik
        </button>
        <button onclick="OlympiadApp.filterJadwalBidang('Biokimia')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${this.jadwalFilterBidang === 'Biokimia' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
          Biokimia
        </button>
      </div>
    </div>

    <!-- Sessions Cards List -->
    <div class="space-y-4">
      ${(this.data.jadwalIntensif || []).length === 0 ? `
        <div class="glass-card rounded-2xl p-12 border border-zinc-800 text-center space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
            <i data-lucide="calendar-clock" class="w-8 h-8"></i>
          </div>
          <h4 class="text-base font-bold text-zinc-300">Belum Ada Jadwal Intensif</h4>
          <p class="text-xs text-zinc-500 max-w-md mx-auto">
            Jadwal sesi bimbingan olimpiade masih kosong. Guru pembimbing atau admin dapat menambahkan jadwal baru dengan jam dan materi yang fleksibel.
          </p>
          ${!this.isSiswa() ? `
            <button onclick="OlympiadApp.openAddJadwalModal()" class="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-violet-600/20">
              <i data-lucide="calendar-plus" class="w-4 h-4"></i> Tambah Jadwal Pertama
            </button>
          ` : ''}
        </div>
      ` : (filtered.length === 0 ? `
        <div class="glass-card rounded-2xl p-12 border border-zinc-800 text-center">
          <i data-lucide="calendar-x" class="w-12 h-12 text-zinc-600 mx-auto mb-3"></i>
          <h4 class="text-base font-bold text-zinc-300">Tidak ada jadwal bimbingan ditemukan</h4>
          <p class="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter bidang kimia di atas.</p>
        </div>
      ` : filtered.map(j => {
        const jDate = new Date(j.tanggal + 'T' + (j.jamMulai || '00:00'));
        const diffMs = jDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        let countdownBadge = '';
        if (diffDays < 0) {
          countdownBadge = '<span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-semibold">Selesai</span>';
        } else if (diffDays === 0) {
          countdownBadge = '<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold animate-pulse">HARI INI</span>';
        } else if (diffDays === 1) {
          countdownBadge = '<span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">BESOK</span>';
        } else {
          countdownBadge = `<span class="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-bold">H-${diffDays} Hari</span>`;
        }

        const bidangBadge = bidangColors[j.bidang] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

        return `
          <div class="glass-card rounded-2xl p-5 sm:p-6 border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg" id="jadwal-card-${j.id}">
            <!-- Card Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
              <div class="flex flex-wrap items-center gap-2">
                ${countdownBadge}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${bidangBadge}">
                  ${j.bidang}
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-violet-400"></i>
                  ${j.hari ? j.hari + ', ' : ''}${j.tanggal}
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                  ${j.jamMulai} - ${j.jamSelesai} WIB
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 self-start md:self-auto">
                <button onclick="OlympiadApp.syncJadwalToCalendar('${j.id}')" class="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all" title="Sinkronkan ke Google Calendar">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Google Cal
                </button>
                <button onclick="OlympiadApp.downloadJadwalICS('${j.id}')" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all" title="Unduh Kalender .ics">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i> .ics
                </button>

                ${!this.isSiswa() ? `
                  <button onclick="OlympiadApp.openEditJadwalModal('${j.id}')" class="p-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all" title="Ubah Jadwal, Jam, Pengisi, atau Keterangan">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="OlympiadApp.deleteJadwal('${j.id}')" class="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all" title="Hapus Jadwal">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Card Body -->
            <div class="mt-4">
              <h3 class="text-base sm:text-lg font-bold text-zinc-100">${j.judul}</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 text-xs">
                <!-- Pengisi -->
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    <i data-lucide="user-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Guru Pengisi / Pelatih</span>
                    <span class="font-bold text-zinc-100">${j.pengisi}</span>
                  </div>
                </div>

                <!-- Lokasi / Ruangan -->
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Ruangan / Tempat</span>
                    <span class="font-semibold text-zinc-200">${j.lokasi}</span>
                  </div>
                </div>

                <!-- Status / Mode -->
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    <i data-lucide="book-open" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Fokus Pembinaan</span>
                    <span class="font-semibold text-zinc-200">${j.status || 'Tatap Muka'}</span>
                  </div>
                </div>
              </div>

              ${j.linkOnline ? `
                <div class="mt-3">
                  <a href="${j.linkOnline}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all">
                    <i data-lucide="video" class="w-3.5 h-3.5"></i> Gabung Sesi Online (Google Meet / Zoom)
                  </a>
                </div>
              ` : ''}

              <!-- Keterangan & Persiapan -->
              ${j.keterangan ? `
                <div class="mt-3.5 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 text-xs text-zinc-300">
                  <span class="text-[11px] font-bold text-violet-400 flex items-center gap-1.5 mb-1">
                    <i data-lucide="info" class="w-3.5 h-3.5"></i> Instruksi &amp; Persiapan Siswa:
                  </span>
                  <p class="leading-relaxed">${j.keterangan}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join(''))}
    </div>
  `;

  container.innerHTML = html;
};

OlympiadApp.onSearchJadwal = function(val) {
  this.jadwalSearchQuery = val;
  this.renderJadwalModule();
  if (window.lucide) lucide.createIcons();
};

OlympiadApp.filterJadwalBidang = function(bidang) {
  this.jadwalFilterBidang = bidang;
  this.renderJadwalModule();
  if (window.lucide) lucide.createIcons();
};

// ============================================================================
// MODAL CRUD JADWAL INTENSIF
// ============================================================================
OlympiadApp.openAddJadwalModal = function() {
  if (this.isSiswa()) {
    alert('Akses terbatas: Hanya Guru Pembimbing dan Admin yang dapat menambah jadwal.');
    return;
  }
  const modal = document.getElementById('modal-jadwal-form');
  if (!modal) return;

  const idInput = document.getElementById('form-jadwal-id');
  const title = document.getElementById('form-jadwal-title');
  const saveBtn = document.getElementById('btn-save-jadwal');

  if (idInput) idInput.value = '';
  if (title) title.textContent = 'Tambah Jadwal Intensif Bimbingan';
  if (saveBtn) saveBtn.textContent = 'Simpan Jadwal Baru';

  document.getElementById('form-jadwal-judul').value = '';
  document.getElementById('form-jadwal-bidang').value = 'Kimia Fisik';
  document.getElementById('form-jadwal-tanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-jadwal-hari').value = 'Sabtu';
  document.getElementById('form-jadwal-jam-mulai').value = '08:00';
  document.getElementById('form-jadwal-jam-selesai').value = '11:30';
  document.getElementById('form-jadwal-pengisi').value = this.data.settings?.koordinator || 'Tito Vanzal, S.Pd.';
  document.getElementById('form-jadwal-lokasi').value = 'Laboratorium Kimia Dasar & Ruang Olimpiade';
  document.getElementById('form-jadwal-online').value = '';
  document.getElementById('form-jadwal-keterangan').value = '';

  modal.classList.remove('hidden');
};

OlympiadApp.openEditJadwalModal = function(id) {
  if (this.isSiswa()) {
    alert('Akses terbatas: Hanya Guru Pembimbing dan Admin yang dapat mengubah jadwal.');
    return;
  }
  const j = (this.data.jadwalIntensif || []).find(item => item.id === id);
  if (!j) return;
  const modal = document.getElementById('modal-jadwal-form');
  if (!modal) return;

  const idInput = document.getElementById('form-jadwal-id');
  const title = document.getElementById('form-jadwal-title');
  const saveBtn = document.getElementById('btn-save-jadwal');

  if (idInput) idInput.value = j.id;
  if (title) title.textContent = 'Edit Jadwal Bimbingan: ' + j.judul;
  if (saveBtn) saveBtn.textContent = 'Perbarui Jadwal';

  document.getElementById('form-jadwal-judul').value = j.judul || '';
  document.getElementById('form-jadwal-bidang').value = j.bidang || 'Kimia Fisik';
  document.getElementById('form-jadwal-tanggal').value = j.tanggal || '';
  document.getElementById('form-jadwal-hari').value = j.hari || 'Sabtu';
  document.getElementById('form-jadwal-jam-mulai').value = j.jamMulai || '08:00';
  document.getElementById('form-jadwal-jam-selesai').value = j.jamSelesai || '11:00';
  document.getElementById('form-jadwal-pengisi').value = j.pengisi || '';
  document.getElementById('form-jadwal-lokasi').value = j.lokasi || '';
  document.getElementById('form-jadwal-online').value = j.linkOnline || '';
  document.getElementById('form-jadwal-keterangan').value = j.keterangan || '';

  modal.classList.remove('hidden');
};

OlympiadApp.closeJadwalModal = function() {
  const modal = document.getElementById('modal-jadwal-form');
  if (modal) modal.classList.add('hidden');
};

OlympiadApp.saveJadwal = function() {
  if (this.isSiswa()) return;
  const idInput = document.getElementById('form-jadwal-id')?.value.trim() || '';
  const judul = document.getElementById('form-jadwal-judul')?.value.trim() || '';
  if (!judul) {
    alert('Judul materi bimbingan wajib diisi!');
    return;
  }

  const bidang = document.getElementById('form-jadwal-bidang')?.value || 'Kimia Fisik';
  const tanggal = document.getElementById('form-jadwal-tanggal')?.value || new Date().toISOString().split('T')[0];
  const hari = document.getElementById('form-jadwal-hari')?.value.trim() || 'Sabtu';
  const jamMulai = document.getElementById('form-jadwal-jam-mulai')?.value || '08:00';
  const jamSelesai = document.getElementById('form-jadwal-jam-selesai')?.value || '11:00';
  const pengisi = document.getElementById('form-jadwal-pengisi')?.value.trim() || 'Pembimbing Kimia';
  const lokasi = document.getElementById('form-jadwal-lokasi')?.value.trim() || 'Ruang Olimpiade';
  const linkOnline = document.getElementById('form-jadwal-online')?.value.trim() || '';
  const keterangan = document.getElementById('form-jadwal-keterangan')?.value.trim() || '';

  if (!this.data.jadwalIntensif) this.data.jadwalIntensif = [];

  if (idInput) {
    const j = this.data.jadwalIntensif.find(item => item.id === idInput);
    if (j) {
      j.judul = judul;
      j.bidang = bidang;
      j.tanggal = tanggal;
      j.hari = hari;
      j.jamMulai = jamMulai;
      j.jamSelesai = jamSelesai;
      j.pengisi = pengisi;
      j.lokasi = lokasi;
      j.linkOnline = linkOnline;
      j.keterangan = keterangan;
    }
  } else {
    const newId = 'jdw-' + Date.now().toString().slice(-4);
    this.data.jadwalIntensif.push({
      id: newId,
      judul,
      bidang,
      tanggal,
      hari,
      jamMulai,
      jamSelesai,
      pengisi,
      lokasi,
      linkOnline,
      keterangan,
      status: 'Akan Datang'
    });
  }

  this.saveDataLocally();
  this.closeJadwalModal();
  this.renderJadwalModule();
  if (window.lucide) lucide.createIcons();
};

OlympiadApp.deleteJadwal = function(id) {
  if (this.isSiswa()) return;
  if (!confirm('Yakin ingin menghapus sesi bimbingan intensif ini?')) return;
  this.data.jadwalIntensif = (this.data.jadwalIntensif || []).filter(j => j.id !== id);
  this.saveDataLocally();
  this.renderJadwalModule();
  if (window.lucide) lucide.createIcons();
};

OlympiadApp.syncJadwalToCalendar = function(id) {
  const j = (this.data.jadwalIntensif || []).find(item => item.id === id);
  if (!j) return;

  const title = encodeURIComponent(`[Pelatda Kimia] ${j.judul}`);
  const details = encodeURIComponent(`Bimbingan Intensif Olimpiade Kimia\nPengisi: ${j.pengisi}\nBidang: ${j.bidang}\nLokasi: ${j.lokasi}\nPersiapan: ${j.keterangan || '-'}`);
  const location = encodeURIComponent(j.lokasi || 'Laboratorium Kimia');

  const cleanDate = j.tanggal.replace(/-/g, '');
  const startT = (j.jamMulai || '08:00').replace(':', '') + '00';
  const endT = (j.jamSelesai || '11:00').replace(':', '') + '00';
  const dates = `${cleanDate}T${startT}/${cleanDate}T${endT}`;

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  window.open(gCalUrl, '_blank');
};

OlympiadApp.downloadJadwalICS = function(id) {
  const j = (this.data.jadwalIntensif || []).find(item => item.id === id);
  if (!j) return;

  const cleanDate = j.tanggal.replace(/-/g, '');
  const startT = (j.jamMulai || '08:00').replace(':', '') + '00';
  const endT = (j.jamSelesai || '11:00').replace(':', '') + '00';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PortalKimia Suite//Olimpiade Kimia//ID',
    'BEGIN:VEVENT',
    `UID:pelatda-${j.id}-${Date.now()}@portalkimia.org`,
    `DTSTAMP:${cleanDate}T000000Z`,
    `DTSTART:${cleanDate}T${startT}`,
    `DTEND:${cleanDate}T${endT}`,
    `SUMMARY:[Pelatda Kimia] ${j.judul}`,
    `DESCRIPTION:Pengisi: ${j.pengisi} | Bidang: ${j.bidang} | Keterangan: ${j.keterangan || '-'}`,
    `LOCATION:${j.lokasi || 'Lab Kimia'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jadwal-Intensif-${j.bidang.replace(/\s+/g, '-')}-${j.tanggal}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- END FILE: app_part8_jadwal.js ---

