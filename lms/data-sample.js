/**
 * =========================================================================================
 * DATA AWAL (DEFAULT CONFIG & QUICK LINKS) - LMS PORTALKIMIA
 * =========================================================================================
 * Guru: Tito Vanzal, S.Pd. | Sekolah: SMA Progresif Bumi Shalawat | Wali Kelas: X3 Atlet
 * =========================================================================================
 */

const DEFAULT_SAMPLE_DATA = {
  // Profil Guru & Pengaturan
  guru: {
    nama: "Tito Vanzal, S.Pd.",
    nip: "-",
    mapel: "Kimia (Chemistry)",
    sekolah: "SMA Progresif Bumi Shalawat",
    kelasWali: "X3 Atlet",
    tahunAjaran: "2026/2027",
    semester: "Ganjil",
    kkmDefault: 75,
    gasWebAppUrl: ""
  },

  // Daftar Kelas Default
  kelasList: [
    { id: "KLS-01", nama: "X3 Atlet", isWaliKelas: true, deskripsi: "Kelas Binaan Wali Kelas" }
  ],

  // Data Awal Bersih
  siswa: [],
  presensiWali: [],
  jurnalKimia: [],
  presensiKimia: [],
  nilai: [],
  bintangLog: [],
  kelompokProyek: [],

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

  // Kategori Poin Bintang Keaktifan
  kategoriBintang: [
    { id: "KAT-1", label: "Menjawab Pertanyaan Guru di Kelas", poin: 1 },
    { id: "KAT-2", label: "Menyelesaikan Soal di Papan Tulis", poin: 2 },
    { id: "KAT-3", label: "Kerja Sama & Kerapian Praktikum Laboratorium", poin: 2 },
    { id: "KAT-4", label: "Tutor Sebaya Membantu Teman", poin: 3 },
    { id: "KAT-5", label: "Nilai Tertinggi / Sempurna (100) pada UH", poin: 3 }
  ],

  // Data Awal Struktural Organisasi Kelas Wali
  strukturalKelas: [
    { id: "STR-01", kelas: "X3 Atlet", jabatan: "Ketua Kelas", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Memimpin koordinasi kelas dan barisan" },
    { id: "STR-02", kelas: "X3 Atlet", jabatan: "Wakil Ketua Kelas", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Membantu tugas ketua kelas" },
    { id: "STR-03", kelas: "X3 Atlet", jabatan: "Sekretaris 1", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Pencatatan absensi dan agenda harian" },
    { id: "STR-04", kelas: "X3 Atlet", jabatan: "Bendahara 1", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Pengelolaan kas kelas dan perlengkapan" },
    { id: "STR-05", kelas: "X3 Atlet", jabatan: "Sie Kebersihan & Piket", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Mengawasi pelaksanaan jadwal piket harian" },
    { id: "STR-06", kelas: "X3 Atlet", jabatan: "Sie Rohani & Ketertiban", idSiswa: "", namaSiswa: "Belum Ditentukan", keterangan: "Memimpin doa bersama dan adab kelas" }
  ],

  // Data Awal Jadwal Piket (Senin s.d. Sabtu)
  jadwalPiket: {
    "Senin": [],
    "Selasa": [],
    "Rabu": [],
    "Kamis": [],
    "Jumat": [],
    "Sabtu": []
  },

  // Data Awal Buku Catatan Konseling & Pembinaan Siswa
  catatanKonseling: [],

  // Koleksi Quick Link Bermanfaat Pendidik & Guru Kimia (Lengkap & Terverifikasi)
  quickLinks: [
    {
      id: "QL-01",
      judul: "Platform Merdeka Mengajar (PMM)",
      url: "https://guru.kemdikbud.go.id",
      kategori: "Kemdikbud",
      deskripsi: "Portal resmi Kemendikbudristek untuk pelatihan mandiri, perangkat ajar, kurikulum merdeka, dan bukti karya guru.",
      icon: "graduation-cap",
      warna: "blue"
    },
    {
      id: "QL-02",
      judul: "PhET Interactive Simulations (Kimia)",
      url: "https://phet.colorado.edu/in/simulations/filter?subjects=chemistry",
      kategori: "Praktikum Virtual",
      deskripsi: "Laboratorium kimia virtual gratis (Kesetimbangan Kimia, Larutan Asam-Basa, Bentuk Molekul, Laju Reaksi).",
      icon: "flask-conical",
      warna: "emerald"
    },
    {
      id: "QL-03",
      judul: "MolView 3D Chemical Structure",
      url: "https://molview.org",
      kategori: "Media Ajar",
      deskripsi: "Pemodelan struktur molekul kimia 3D, visualisasi ikatan kimia, spektroskopi, dan kristalografi interaktif.",
      icon: "atom",
      warna: "purple"
    },
    {
      id: "QL-04",
      judul: "Ptable - Tabel Periodik Unsur Interaktif",
      url: "https://ptable.com/?lang=id",
      kategori: "Alat Kimia",
      deskripsi: "Tabel periodik unsur terlengkap dengan visualisasi konfigurasi elektron, sifat kimia fisika, isotop, dan wujud zat.",
      icon: "table",
      warna: "indigo"
    },
    {
      id: "QL-05",
      judul: "Canva for Education",
      url: "https://www.canva.com/education/",
      kategori: "Bahan Ajar",
      deskripsi: "Platform desain grafis untuk membuat LKPD (Lembar Kerja Peserta Didik), infografis kimia, dan presentasi kelas menarik.",
      icon: "palette",
      warna: "pink"
    },
    {
      id: "QL-06",
      judul: "Google Drive Guru",
      url: "https://drive.google.com",
      kategori: "Penyimpanan",
      deskripsi: "Penyimpanan cloud dokumen perangkat pembelajaran (Modul Ajar, ATP, CP, Bank Soal, dan Spreadsheet Nilai).",
      icon: "hard-drive",
      warna: "amber"
    },
    {
      id: "QL-07",
      judul: "Rapor Pendidikan Kemendikbud",
      url: "https://raporpendidikan.kemdikbud.go.id",
      kategori: "Administrasi",
      deskripsi: "Laporan indikator capaian mutu pendidikan, literasi, numerasi, dan karakter peserta didik satuan pendidikan.",
      icon: "file-text",
      warna: "teal"
    },
    {
      id: "QL-08",
      judul: "PubChem Chemistry Database (NCBI)",
      url: "https://pubchem.ncbi.nlm.nih.gov",
      kategori: "Referensi",
      deskripsi: "Basis data kimia dunia untuk melihat rumus struktur molekul, massa molar, bahaya zat (MSDS), dan sifat kimia resmi.",
      icon: "search",
      warna: "cyan"
    }
  ]
};
