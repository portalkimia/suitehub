/**
 * PORTALKIMIA OLIMPIADE - DATA SAMPLE & INITIAL STATE
 * Comprehensive Indonesian Chemistry Olympiad Dataset
 * Tito Vanzal, S.Pd. - SMA Progresif Bumi Shalawat / PortalKimia Suite
 */

window.PORTALKIMIA_DEMO_DATA = {
  // 1. Akun Pengguna & Hak Akses
  users: [
    {
      id: "usr-admin-1",
      nama: "Tito Vanzal, S.Pd.",
      email: "tito.vanzal@portalkimia.org",
      role: "admin",
      jabatan: "Koordinator Olimpiade Kimia & Admin Sistem",
      avatar: "TV"
    },
    {
      id: "usr-mentor-1",
      nama: "Dr. Ahmad Rasyid, M.Si.",
      email: "rasyid.chem@gmail.com",
      role: "pembimbing",
      jabatan: "Pelatih Ahli Kimia Organik & Biokimia",
      avatar: "AR"
    },
    {
      id: "usr-mentor-2",
      nama: "Siti Nurul Hidayah, S.Si.",
      email: "nurul.kimia@gmail.com",
      role: "pembimbing",
      jabatan: "Pembina Kimia Fisik & Analitik",
      avatar: "SN"
    },
    {
      id: "usr-student-1",
      nama: "Muhammad Zaidan Al-Faris",
      email: "zaidan.siswa@portalkimia.org",
      role: "siswa",
      jabatan: "Siswa Binaan - Spesialis Kimia Fisik",
      avatar: "MZ"
    }
  ],

  // 2. Daftar Pembimbing & Pelatih
  pembimbing: [
    {
      id: "mentor-1",
      nama: "Tito Vanzal, S.Pd.",
      spesialisasi: "Strategi Umum & Kimia Anorganik",
      kontak: "0812-3456-7890",
      jadwal: "Senin & Rabu, 15:30 - 17:30 WIB",
      totalSesi: 32,
      status: "Aktif",
      siswaBinaanCount: 8
    },
    {
      id: "mentor-2",
      nama: "Dr. Ahmad Rasyid, M.Si.",
      spesialisasi: "Kimia Organik, Stereokimia & Spektroskopi NMR/IR",
      kontak: "0813-9876-5432",
      jadwal: "Kamis, 15:30 - 18:00 WIB",
      totalSesi: 24,
      status: "Aktif",
      siswaBinaanCount: 5
    },
    {
      id: "mentor-3",
      nama: "Siti Nurul Hidayah, S.Si.",
      spesialisasi: "Kimia Fisik, Termodinamika & Kinetika Kimia",
      kontak: "0857-1122-3344",
      jadwal: "Jumat, 13:30 - 15:30 WIB",
      totalSesi: 20,
      status: "Aktif",
      siswaBinaanCount: 6
    }
  ],

  // 3. Data Siswa Binaan Olimpiade
  siswa: [
    {
      id: "sis-01",
      nama: "Muhammad Zaidan Al-Faris",
      namaPanggilan: "Zaidan",
      nisn: "0078921101",
      levelKelas: "11",
      kelasAsal: "XI-MIPA 1",
      kelas: "XI-MIPA 1",
      level: "Kelas 11",
      tempatLahir: "Sidoarjo",
      tanggalLahir: "2009-04-12",
      bidangUtama: "Kimia Fisik",
      bidangSekunder: "Kimia Analitik",
      pembimbingId: "mentor-3",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-zaidan/view",
      foto: "https://drive.google.com/file/d/sample-foto-zaidan/view",
      berkasPendaftaran: "https://drive.google.com/drive/folders/sample-berkas-zaidan",
      ratingTopik: { fisik: 94, organik: 82, anorganik: 86, analitik: 90, biokimia: 78 },
      skorRata: 86.0,
      kehadiran: { hadir: 28, izin: 2, sakit: 0, total: 30, persentase: 93.3 },
      riwayatLomba: [
        { nama: "OSN-K Kimia 2025", tahun: 2025, babak: "Kabupaten/Kota", capaian: "Juara 1 (Lolos Provinsi)" },
        { nama: "OSN-P Kimia 2025", tahun: 2025, babak: "Provinsi", capaian: "Medali Perak (Lolos Nasional)" },
        { nama: "OKI Universitas Indonesia 2025", tahun: 2025, babak: "Final", capaian: "Juara 3 Nasional" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 88 },
        { nama: "Tryout 2 - Termodinamika & Kinetika", tanggal: "2026-02-05", skor: 95 },
        { nama: "Tryout 3 - Kesetimbangan Fasa & Larutan", tanggal: "2026-02-28", skor: 92 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 91 }
      ],
      materiDikuasai: ["Hukum Termodinamika I & II", "Kinetika Reaksi Orde Lanjut", "Elektrokimia Nernst", "Titrasi Asam Basa Kompleks"],
      materiPerluPendalaman: ["Stereokimia Kompleks Oktahedral", "Siklus Metabolisme Glukosa"],
      catatan: "Kemampuan analisis grafik kinetika sangat tajam. Perlu memperkuat mekanisme reaksi organik polisiklik."
    },
    {
      id: "sis-02",
      nama: "Alya Zahra Salsabila",
      namaPanggilan: "Alya",
      nisn: "0076543219",
      levelKelas: "11",
      kelasAsal: "XI-MIPA 2",
      kelas: "XI-MIPA 2",
      level: "Kelas 11",
      tempatLahir: "Surabaya",
      tanggalLahir: "2009-08-25",
      bidangUtama: "Kimia Organik",
      bidangSekunder: "Biokimia",
      pembimbingId: "mentor-2",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-alya/view",
      foto: "https://drive.google.com/file/d/sample-foto-alya/view",
      berkasPendaftaran: "https://drive.google.com/drive/folders/sample-berkas-alya",
      ratingTopik: { fisik: 76, organik: 96, anorganik: 80, analitik: 84, biokimia: 92 },
      skorRata: 85.6,
      kehadiran: { hadir: 29, izin: 1, sakit: 0, total: 30, persentase: 96.7 },
      riwayatLomba: [
        { nama: "OSN-K Kimia 2025", tahun: 2025, babak: "Kabupaten/Kota", capaian: "Juara 2 (Lolos Provinsi)" },
        { nama: "National Chemistry Challenge UNAIR 2025", tahun: 2025, babak: "Final", capaian: "Medali Emas (Tim)" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 82 },
        { nama: "Tryout 2 - Mekanisme Reaksi Organik", tanggal: "2026-02-05", skor: 98 },
        { nama: "Tryout 3 - Spektroskopi IR & H-NMR", tanggal: "2026-02-28", skor: 94 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 89 }
      ],
      materiDikuasai: ["Sintesis Organik Multistep", "Reaksi Substitusi Nukleofilik", "Penentuan Struktur via NMR/MS", "Kinetika Michaelis-Menten"],
      materiPerluPendalaman: ["Persamaan Schrödinger & Bilangan Kuantum", "Diagram Frost & Latimer"],
      catatan: "Intuisi retrosintesis sangat luar biasa. Siap diturunkan untuk nomor lomba esai organik."
    },
    {
      id: "sis-03",
      nama: "Fadhil Arya Pratama",
      namaPanggilan: "Fadhil",
      nisn: "0081234567",
      levelKelas: "10",
      kelasAsal: "X-MIPA 1",
      kelas: "X-MIPA 1",
      level: "Kelas 10",
      tempatLahir: "Malang",
      tanggalLahir: "2010-02-14",
      bidangUtama: "Belum Ditentukan",
      bidangSekunder: "Kimia Fisik",
      pembimbingId: "mentor-1",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-fadhil/view",
      foto: "https://drive.google.com/file/d/sample-foto-fadhil/view",
      berkasPendaftaran: "",
      ratingTopik: { fisik: 85, organik: 72, anorganik: 94, analitik: 86, biokimia: 70 },
      skorRata: 81.4,
      kehadiran: { hadir: 27, izin: 2, sakit: 1, total: 30, persentase: 90.0 },
      riwayatLomba: [
        { nama: "Olimpiade Kimia ITB Junior 2025", tahun: 2025, babak: "Semifinal", capaian: "Peringkat 7 Jawa Timur" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 86 },
        { nama: "Tryout 2 - Teori Medan Kristal & Kompleks", tanggal: "2026-02-05", skor: 93 },
        { nama: "Tryout 3 - Kimia Unsur Transisi", tanggal: "2026-02-28", skor: 90 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 84 }
      ],
      materiDikuasai: ["Teori Medan Kristal (CFT)", "Karakteristik Unsur Blok d & f", "Struktur Kisi Kristal Logam", "Kaidah 18 Elektron"],
      materiPerluPendalaman: ["Stereokimia Karbohidrat", "Biomolekul Asam Nukleat"],
      catatan: "Siswa kelas X dengan bakat anorganik sangat tinggi. Calon aset jangka panjang untuk 2 tahun ke depan."
    },
    {
      id: "sis-04",
      nama: "Nabila Putri Anggraini",
      namaPanggilan: "Nabila",
      nisn: "0079988776",
      levelKelas: "11",
      kelasAsal: "XI-MIPA 3",
      kelas: "XI-MIPA 3",
      level: "Kelas 11",
      tempatLahir: "Gresik",
      tanggalLahir: "2009-11-03",
      bidangUtama: "Kimia Analitik",
      bidangSekunder: "Kimia Fisik",
      pembimbingId: "mentor-3",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-nabila/view",
      foto: "https://drive.google.com/file/d/sample-foto-nabila/view",
      berkasPendaftaran: "https://drive.google.com/drive/folders/sample-berkas-nabila",
      ratingTopik: { fisik: 82, organik: 78, anorganik: 80, analitik: 95, biokimia: 75 },
      skorRata: 82.0,
      kehadiran: { hadir: 30, izin: 0, sakit: 0, total: 30, persentase: 100.0 },
      riwayatLomba: [
        { nama: "OSN-K Kimia 2025", tahun: 2025, babak: "Kabupaten/Kota", capaian: "Juara 3 (Lolos Provinsi)" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 90 },
        { nama: "Tryout 2 - Titrasi Kompleksometri & Pengendapan", tanggal: "2026-02-05", skor: 96 },
        { nama: "Tryout 3 - Spektrofotometri UV-Vis & AAS", tanggal: "2026-02-28", skor: 92 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 86 }
      ],
      materiDikuasai: ["Titrasi EDTA & Kesadahan", "Hukum Lambert-Beer", "Kromatografi Gas & HPLC", "Perhitungan Kesetimbangan Larutan Buffer"],
      materiPerluPendalaman: ["Reaksi Radikal Bebas Organik", "Polimerisasi Sintetik"],
      catatan: "Sangat teliti dalam angka signifikansi dan perhitungan stoikiometri analitik. Kehadiran 100% sempurna."
    },
    {
      id: "sis-05",
      nama: "Rifqi Aditya Wardana",
      namaPanggilan: "Rifqi",
      nisn: "0085544332",
      levelKelas: "10",
      kelasAsal: "X-MIPA 2",
      kelas: "X-MIPA 2",
      level: "Kelas 10",
      tempatLahir: "Mojokerto",
      tanggalLahir: "2010-05-19",
      bidangUtama: "Belum Ditentukan",
      bidangSekunder: "Kimia Organik",
      pembimbingId: "mentor-2",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-rifqi/view",
      foto: "https://drive.google.com/file/d/sample-foto-rifqi/view",
      berkasPendaftaran: "",
      ratingTopik: { fisik: 70, organik: 84, anorganik: 74, analitik: 78, biokimia: 93 },
      skorRata: 79.8,
      kehadiran: { hadir: 26, izin: 3, sakit: 1, total: 30, persentase: 86.7 },
      riwayatLomba: [
        { nama: "Lomba Cepat Tepat Kimia Universitas Negeri Surabaya 2025", tahun: 2025, babak: "Semifinal", capaian: "Finalis" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 78 },
        { nama: "Tryout 2 - Struktur Protein & Asam Amino", tanggal: "2026-02-05", skor: 92 },
        { nama: "Tryout 3 - Katabolisme & Anabolisme", tanggal: "2026-02-28", skor: 88 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 81 }
      ],
      materiDikuasai: ["Struktur & Ikatan Peptida", "Kinetika Inhibisi Enzim", "Glikolisis & Siklus Krebs", "Isomer Optis Asam Amino"],
      materiPerluPendalaman: ["Hukum Hess & Termokimia Lanjut", "Teori Ikatan Valensi Orbital Molekul"],
      catatan: "Pemahaman biokimia setara mahasiswa tingkat dua. Perlu dorongan lebih untuk latihan soal kimia fisik."
    },
    {
      id: "sis-06",
      nama: "Kurnia Dewi Lestari",
      namaPanggilan: "Kurnia",
      nisn: "0071122334",
      levelKelas: "12",
      kelasAsal: "XII-MIPA 1",
      kelas: "XII-MIPA 1",
      level: "Kelas 12",
      tempatLahir: "Sidoarjo",
      tanggalLahir: "2008-10-10",
      bidangUtama: "Kimia Fisik",
      bidangSekunder: "Kimia Anorganik",
      pembimbingId: "mentor-1",
      kartuPelajar: "https://drive.google.com/file/d/sample-kartu-pelajar-kurnia/view",
      foto: "https://drive.google.com/file/d/sample-foto-kurnia/view",
      berkasPendaftaran: "https://drive.google.com/drive/folders/sample-berkas-kurnia",
      ratingTopik: { fisik: 89, organik: 75, anorganik: 88, analitik: 81, biokimia: 72 },
      skorRata: 81.0,
      kehadiran: { hadir: 28, izin: 2, sakit: 0, total: 30, persentase: 93.3 },
      riwayatLomba: [
        { nama: "OSN-K Kimia 2025", tahun: 2025, babak: "Kabupaten/Kota", capaian: "Peringkat 5 Kabupaten" }
      ],
      riwayatEvaluasi: [
        { nama: "Tryout 1 - Dasar Stoikiometri", tanggal: "2026-01-12", skor: 84 },
        { nama: "Tryout 2 - Termokimia & Energi Bebas Gibbs", tanggal: "2026-02-05", skor: 89 },
        { nama: "Tryout 3 - Sel Galvani & Potensial Standar", tanggal: "2026-02-28", skor: 91 },
        { nama: "Simulasi OSN-K 2026", tanggal: "2026-03-08", skor: 83 }
      ],
      materiDikuasai: ["Perhitungan Delta G, Delta H, Delta S", "Hukum Raoult & Sifat Koligatif", "Potensial Sel Redoks"],
      materiPerluPendalaman: ["Reaksi Penataan Ulang Karbokation", "Biosintesis Lemak"],
      catatan: "Sangat gigih dan selalu aktif bertanya saat sesi bimbingan sore."
    }
  ],

  // 4. Bank Naskah Paket Soal & Arsip Olimpiade (Google Drive Linked & Komprehensif)
  soal: [
    {
      id: "soal-01",
      nomor: 1,
      tahun: 2025,
      sumber: "OSN-K Kimia",
      penyelenggara: "BPTI Kemendikbudristek",
      bidang: "Semua Bidang (Komprehensif)",
      subtopik: "PAKET NASKAH SOAL SELEKSI OSN-K KIMIA 2025",
      kesulitan: "Dasar (Kabupaten)",
      jenis: "Pilihan Ganda Lengkap",
      tags: ["Semua Bidang", "OSN-K", "30 Butir Soal", "Seleksi Kabupaten"],
      teksSoal: "Bundel naskah paket lengkap Seleksi Olimpiade Sains Nasional Tingkat Kabupaten/Kota (OSN-K) Kimia 2025. Terdiri dari 30 butir soal pilihan ganda komprehensif yang mencakup Termodinamika, Kinetika, Struktur Atom, Senyawa Organik, Kimia Anorganik, dan Larutan Penyangga.",
      opsi: null,
      kunciJawaban: "Kunci Jawaban 30 Butir Soal Terlampir di Halaman Akhir Naskah",
      pembahasan: "Solusi dan langkah perhitungan sistematis untuk 30 butir soal OSN-K 2025 tertera lengkap pada naskah dokumen PDF resmi Google Drive.",
      googleDriveUrl: "https://drive.google.com/file/d/1XyZ9SampleOsnKimia2025Soal/view?usp=sharing",
      googleDriveName: "Naskah_Lengkap_OSN_K_Kimia_2025.pdf"
    },
    {
      id: "soal-02",
      nomor: 2,
      tahun: 2025,
      sumber: "OSN Nasional Kimia",
      penyelenggara: "BPTI Kemendikbudristek",
      bidang: "Semua Bidang (Komprehensif)",
      subtopik: "SOAL SEMIFINAL OSN KIMIA 2025",
      kesulitan: "Tinggi (Nasional)",
      jenis: "Paket Terpadu (PG & Esai)",
      tags: ["Semua Bidang", "OSN Nasional", "Semifinal", "Komprehensif"],
      teksSoal: "Bundel naskah paket soal Semifinal Olimpiade Sains Nasional (OSN) Bidang Kimia Tingkat Nasional 2025. Naskah memadukan soal pilihan ganda analitis dan esai terstruktur tingkat tinggi yang menguji pemahaman teori medan kristal, mekanisme reaksi perisiklik, kinetika kompleks, dan biokimia membran sel.",
      opsi: null,
      kunciJawaban: "Solusi Lengkap Pembina Tersedia",
      pembahasan: "Pembahasan mendalam babak semifinal tingkat nasional beserta rubrik penilaian resmi pembina tersedia di dalam berkas dokumen Google Drive.",
      googleDriveUrl: "https://drive.google.com/file/d/1XyZ8SampleOsnPKimia2025Esai/view?usp=sharing",
      googleDriveName: "SOAL_SEMIFINAL_OSN_KIMIA_2025.pdf"
    },
    {
      id: "soal-03",
      nomor: 3,
      tahun: 2024,
      sumber: "OSN-P Kimia",
      penyelenggara: "Balai Pengembangan Talenta Indonesia",
      bidang: "Semua Bidang (Komprehensif)",
      subtopik: "NASKAH SOAL ESAI TERSTRUKTUR OSN-P KIMIA 2024",
      kesulitan: "Menengah (Provinsi)",
      jenis: "Esai Terstruktur",
      tags: ["Semua Bidang", "OSN-P", "Esai Terstruktur", "Tingkat Provinsi"],
      teksSoal: "Kumpulan 7 soal uraian esai terstruktur seleksi OSN Tingkat Provinsi (OSN-P) Kimia 2024 beserta naskah petunjuk pengerjaan peserta dan lembar jawaban analitis.",
      opsi: null,
      kunciJawaban: "Rubrik Penilaian 7 Nomor Soal Esai",
      pembahasan: "Uraian langkah kerja per nomor, diagram orbital, dan mekanisme reaksi organologam tercantum lengkap pada dokumen Google Drive.",
      googleDriveUrl: "https://drive.google.com/file/d/1XyZ7OsnNasionalAnorganik2024/view?usp=sharing",
      googleDriveName: "Naskah_Esai_OSN_P_Kimia_2024.pdf"
    },
    {
      id: "soal-04",
      nomor: 4,
      tahun: 2024,
      sumber: "IChO Internasional",
      penyelenggara: "International Chemistry Olympiad Committee",
      bidang: "Semua Bidang (Komprehensif)",
      subtopik: "KUMPULAN SOAL TEORI IChO KE-56 (RIYADH 2024)",
      kesulitan: "Master (Internasional)",
      jenis: "Paket Terpadu (PG & Esai)",
      tags: ["Semua Bidang", "IChO", "Internasional", "Master Level"],
      teksSoal: "Naskah soal resmi kompetisi International Chemistry Olympiad (IChO 56th Riyadh) dalam edisi terjemahan Bahasa Indonesia. Berisi 9 soal teori komprehensif tingkat mahir dengan subtopik nanokimia, sintesis total bahan alam, dan katalis fotoredoks.",
      opsi: null,
      kunciJawaban: "Official Solutions IChO Committee",
      pembahasan: "Solusi resmi berbahasa Inggris dan terjemahan analisis konsep tersedia lengkap di direktori Google Drive.",
      googleDriveUrl: "https://drive.google.com/file/d/1XyZ6OmiKimia2024Analitik/view?usp=sharing",
      googleDriveName: "IChO_56_Official_Theory_Problems.pdf"
    },
    {
      id: "soal-05",
      nomor: 5,
      tahun: 2025,
      sumber: "OMI (Olimpiade Madrasah)",
      penyelenggara: "Kementerian Agama RI",
      bidang: "Semua Bidang (Komprehensif)",
      subtopik: "PAKET SOAL SELEKSI NASIONAL OMI KIMIA 2025",
      kesulitan: "Tinggi (Nasional)",
      jenis: "Paket Terpadu (PG & Esai)",
      tags: ["Semua Bidang", "OMI", "Kemenag", "Seleksi Nasional"],
      teksSoal: "Paket latihan dan naskah uji kompetensi Olimpiade Madrasah Indonesia (OMI) bidang Kimia Terintegrasi tingkat nasional tahun 2025.",
      opsi: null,
      kunciJawaban: "Kunci Jawaban Terlampir",
      pembahasan: "Langkah penyelesaian dan keterkaitan integrasi keilmuan tercantum pada berkas PDF di Google Drive.",
      googleDriveUrl: "https://drive.google.com/file/d/1XyZ5OkiUiBiokimia2025/view?usp=sharing",
      googleDriveName: "Paket_Soal_OMI_Kimia_Nasional_2025.pdf"
    }
  ],

  // 5. Data Kompetisi & Timeline Lomba Kimia 2026
  lomba: [
    {
      id: "lmb-01",
      nama: "Olimpiade Sains Nasional Kimia (OSN-K & OSN-P) 2026",
      penyelenggara: "Balai Pengembangan Talenta Indonesia (BPTI) Kemendikbudristek",
      tahun: 2026,
      klasifikasi: "Individu",
      kuotaSekolah: 5,
      pesertaIds: ["sis-01", "sis-02", "sis-03", "sis-04", "sis-06"],
      statusPendaftaran: "Verified",
      timeline: {
        pendaftaranBuka: "2026-02-15",
        deadlineDaftar: "2026-03-25",
        penyisihan: "2026-04-18",
        perempatFinal: "2026-05-15",
        semifinal: "2026-06-20",
        final: "2026-08-10"
      },
      biaya: {
        pendaftaran: 0,
        transportasi: 1200000,
        akomodasi: 2500000,
        catatan: "Dibiayai APBN / BOS Sekolah"
      },
      dokumenCeklis: {
        proposalDibuat: true,
        proposalAcc: true,
        suratIzinDibuat: true,
        nomorSuratIzin: "421.3/104/SMA-PBS/III/2026",
        guidebookUrl: "https://drive.google.com/file/d/1OSN2026GuidebookPedomanTeknis/view?usp=sharing",
        guidebookName: "Pedoman_Silabus_OSN_Kimia_SMA_2026.pdf"
      },
      syaratPendaftaran: [
        { teks: "Scan Asli Kartu Pelajar (PDF/JPG)", checked: true },
        { teks: "Pas Foto 3x4 Latar Merah/Biru", checked: true },
        { teks: "Surat Rekomendasi Kepala Sekolah / Kesiswaan", checked: true },
        { teks: "Surat Pakta Integritas Peserta OSN", checked: true },
        { teks: "Bukti Unggah Data Siswa di Portal BPTI", checked: false }
      ],
      hasilBabak: [
        { babak: "Simulasi Sekolah", skorRata: 87.2, statusLolos: true, catatan: "5 Peserta terpilih lolos seleksi internal" }
      ]
    },
    {
      id: "lmb-02",
      nama: "Olimpiade Kimia Indonesia (OKI) FMIPA Universitas Indonesia 2026",
      penyelenggara: "Departemen Kimia FMIPA Universitas Indonesia",
      tahun: 2026,
      klasifikasi: "Tim (3 Orang)",
      kuotaSekolah: 2,
      pesertaIds: ["sis-01", "sis-02", "sis-04"], // Tim A
      statusPendaftaran: "Submitted",
      timeline: {
        pendaftaranBuka: "2026-03-01",
        deadlineDaftar: "2026-04-10",
        penyisihan: "2026-05-02",
        perempatFinal: "2026-05-16",
        semifinal: "2026-05-30",
        final: "2026-06-06"
      },
      biaya: {
        pendaftaran: 350000,
        transportasi: 2400000,
        akomodasi: 3200000,
        catatan: "Kompetisi Tim Tingkat Nasional Offline di Depok"
      },
      dokumenCeklis: {
        proposalDibuat: true,
        proposalAcc: true,
        suratIzinDibuat: false,
        nomorSuratIzin: "Sedang diproses kesiswaan",
        guidebookUrl: "https://drive.google.com/file/d/1OKIUI2026GuidebookResmi/view?usp=sharing",
        guidebookName: "Guidebook_Lomba_Kimia_OKI_UI_2026.pdf"
      },
      syaratPendaftaran: [
        { teks: "Scan Kartu Pelajar 3 Anggota Tim", checked: true },
        { teks: "Pas Foto 3x4 Seluruh Anggota", checked: true },
        { teks: "Surat Rekomendasi Sekolah Resmi", checked: false },
        { teks: "Bukti Transfer Biaya Pendaftaran Rp350.000", checked: true },
        { teks: "Follow Instagram @okifmipa_ui", checked: true },
        { teks: "Unggah Twibbon & Repost Poster ke Feed & Story", checked: false }
      ],
      hasilBabak: []
    },
    {
      id: "lmb-03",
      nama: "National Chemistry Challenge (NCC) HIMAKI UNAIR 2026",
      penyelenggara: "Himpunan Mahasiswa Kimia Universitas Airlangga",
      tahun: 2026,
      klasifikasi: "Tim (2 Orang)",
      kuotaSekolah: 2,
      pesertaIds: ["sis-02", "sis-05"],
      statusPendaftaran: "Paid",
      timeline: {
        pendaftaranBuka: "2026-03-05",
        deadlineDaftar: "2026-04-05",
        penyisihan: "2026-04-26",
        perempatFinal: "2026-05-09",
        semifinal: "2026-05-23",
        final: "2026-05-24"
      },
      biaya: {
        pendaftaran: 200000,
        transportasi: 400000,
        akomodasi: 0,
        catatan: "Lokasi Surabaya / Transportasi Lokal"
      },
      dokumenCeklis: {
        proposalDibuat: true,
        proposalAcc: true,
        suratIzinDibuat: true,
        nomorSuratIzin: "421.3/095/SMA-PBS/III/2026",
        guidebookUrl: "https://drive.google.com/file/d/1NCCUnair2026Guidebook/view?usp=sharing",
        guidebookName: "Panduan_NCC_UNAIR_2026_Terbaru.pdf"
      },
      syaratPendaftaran: [
        { teks: "Scan Kartu Pelajar Asli (2 Orang)", checked: true },
        { teks: "Pas Foto Berwarna 3x4", checked: true },
        { teks: "Bukti Pembayaran Registrasi Rp200.000", checked: true },
        { teks: "Follow Akun Instagram @ncc_unair", checked: true },
        { teks: "Tag 5 Teman di Kolom Komentar Postingan Lomba", checked: true }
      ],
      hasilBabak: []
    }
  ],

  // 6. Riwayat Ploting Tim Tahun Sebelumnya
  riwayatPloting: [
    {
      tahun: 2024,
      lomba: "OKI UI 2024",
      namaTim: "Tim Kimia Phoenix",
      anggota: ["Ahmad Baihaqi (Alumni)", "Muhammad Zaidan Al-Faris", "Siti Rahmawati (Alumni)"],
      capaian: "Semifinalis Top 10 Nasional"
    },
    {
      tahun: 2025,
      lomba: "NCC UNAIR 2025",
      namaTim: "Tim Kimia Katalis Emas",
      anggota: ["Muhammad Zaidan Al-Faris", "Alya Zahra Salsabila"],
      capaian: "Juara 1 (Medali Emas)"
    },
    {
      tahun: 2025,
      lomba: "Olimpiade Kimia ITB 2025",
      namaTim: "Tim Orbital Alpha",
      anggota: ["Alya Zahra Salsabila", "Nabila Putri Anggraini", "Fadhil Arya Pratama"],
      capaian: "Finalis Peringkat 4"
    }
  ],

  // 7. Papan Pengumuman Pembinaan (Mading Digital)
  pengumuman: [
    {
      id: "pgm-01",
      judul: "Technical Meeting (TM) OSN-K Kimia 2026 Tingkat Kabupaten",
      isi: "Technical Meeting resmi akan diselenggarakan via Zoom pada Kamis, 26 Maret 2026 pukul 13.00 WIB. Seluruh siswa kontingen dan pembina wajib bergabung dari Ruang Lab Komputer 1.",
      tanggal: "2026-03-20",
      penulis: "Tito Vanzal, S.Pd. (Koordinator)",
      prioritas: "Urgent",
      pinned: true,
      tautan: "https://zoom.us/j/sample-tm-osnk2026"
    },
    {
      id: "pgm-02",
      judul: "Pembagian Modul Bimbingan KaTeX & Kalkulator Saintifik Resmi",
      isi: "Buku kumpulan naskah soal IChO/OSN 10 tahun terakhir dan kalkulator saintifik resmi CASIO fx-991EX dapat diambil di Meja Pembina Kimia mulai Jumat sore.",
      tanggal: "2026-03-18",
      penulis: "Dr. Ahmad Rasyid, M.Si.",
      prioritas: "Penting",
      pinned: false,
      tautan: ""
    },
    {
      id: "pgm-03",
      judul: "Simulasi Ujian Tryout Mandiri 4 (Kimia Anorganik & Kompleks)",
      isi: "Naskah soal latihan mandiri sudah tersedia di tab Bank Soal. Harap dikerjakan sebelum sesi bimbingan intensif hari Sabtu.",
      tanggal: "2026-03-15",
      penulis: "Siti Nurul Hidayah, S.Si.",
      prioritas: "Info",
      pinned: false,
      tautan: ""
    }
  ],

  // 8. Agenda Jadwal Intensif Bimbingan / Pelatda
  jadwalIntensif: [
    {
      id: "jdw-01",
      judul: "Termodinamika Kimia Lanjut, Kinetika Reaksi & Hukum Hess",
      tanggal: "2026-03-21",
      hari: "Sabtu",
      jamMulai: "08:00",
      jamSelesai: "11:30",
      pengisi: "Dr. Ahmad Rasyid, M.Si.",
      bidang: "Kimia Fisik",
      lokasi: "Laboratorium Kimia Dasar & Ruang Olimpiade",
      linkOnline: "",
      keterangan: "Membawa kalkulator saintifik & tabel periodik. Pembahasan soal nomor 1-15 naskah OSN 2024.",
      status: "Akan Datang"
    },
    {
      id: "jdw-02",
      judul: "Stereokimia, Reaksi Substitusi/Eliminasi & Sintesis Senyawa Organik",
      tanggal: "2026-03-24",
      hari: "Selasa",
      jamMulai: "15:30",
      jamSelesai: "17:30",
      pengisi: "Tito Vanzal, S.Pd.",
      bidang: "Kimia Organik",
      lokasi: "Ruang Diskusi Talenta Sains (Gedung B Lt. 2)",
      linkOnline: "",
      keterangan: "Fokus mekanisme reaksi karbokation, penataan ulang, dan proyeksi Fischer.",
      status: "Akan Datang"
    },
    {
      id: "jdw-03",
      judul: "Titrasi Kompleksometri, Spektrofotometri & Analisis Kation/Anion",
      tanggal: "2026-03-28",
      hari: "Sabtu",
      jamMulai: "08:30",
      jamSelesai: "11:30",
      pengisi: "Siti Nurul Hidayah, S.Si.",
      bidang: "Kimia Analitik",
      lokasi: "Laboratorium Kimia Analitik",
      linkOnline: "",
      keterangan: "Praktikum mini identifikasi warna endapan dan perhitungan kadar sampel bijih besi.",
      status: "Akan Datang"
    }
  ],

  // 9. Pengaturan Sistem & Metadata
  settings: {
    namaSekolah: "SMA Progresif Bumi Shalawat",
    namaAplikasi: "PortalKimia Olimpiade",
    versi: "2.4.0-Olympiad",
    tahunAjaran: "2025/2026",
    targetMedaliNasional: 3,
    koordinator: "Tito Vanzal, S.Pd.",
    googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycb-OlympiadSampleAPI/exec",
    themeMode: "dark"
  }
};

/**
 * Clean & Empty Slate Template for User Testing
 */
window.PORTALKIMIA_OLYMPIAD_DATA = {
  users: [
    {
      id: "usr-admin-1",
      nama: "Admin Olimpiade",
      email: "admin@portalkimia.org",
      role: "admin",
      jabatan: "Administrator Sistem & Koordinator",
      avatar: "AO"
    },
    {
      id: "usr-mentor-1",
      nama: "Guru Pembimbing",
      email: "guru@portalkimia.org",
      role: "pembimbing",
      jabatan: "Guru Pembina & Pelatih Olimpiade",
      avatar: "GP"
    },
    {
      id: "usr-student-1",
      nama: "Siswa Binaan",
      email: "siswa@portalkimia.org",
      role: "siswa",
      jabatan: "Siswa Binaan Olimpiade Kimia",
      avatar: "SB"
    }
  ],
  pembimbing: [],
  siswa: [],
  soal: [],
  lomba: [],
  jadwalIntensif: [],
  pengumuman: [],
  evaluasi: [],
  auditLogs: [],
  settings: {
    namaSekolah: "SMA Binaan Olimpiade",
    koordinator: "Guru Pembina Olimpiade",
    tahunAjaran: "2025/2026",
    targetMedaliNasional: 0,
    googleSpreadsheetId: "",
    googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycb-OlympiadSampleAPI/exec",
    autoSyncInterval: 5,
    notificationsEnabled: true,
    lastBackupDate: new Date().toISOString().split('T')[0]
  }
};
