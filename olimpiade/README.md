# PortalKimia Olimpiade — Cabang Pembinaan Talenta & Sains Kimia

Cabang resmi dari ekosistem **PortalKimia Suite**, dirancang khusus untuk manajemen pembinaan olimpiade kimia (OSN-K, OSN-P, OSN Nasional, OMI, OKI UI, NCC UNAIR, hingga level IChO).

Dikembangkan oleh: **Tito Vanzal, S.Pd.**  
Afiliasi: **SMA Progresif Bumi Shalawat / PortalKimia Suite**  
© 2026 PortalKimia

---

## 🌟 Fitur Utama

### 🔐 1. Sistem Hak Akses Berbasis Role (Role-Based Access Control)
- **🔴 Admin**: Akses penuh ke seluruh modul, manajemen akun pengguna (tambah mentor/siswa), pengaturan nama sekolah, target medali, dan backup database.
- **🟡 Pembimbing**: Kelola bank soal + akses solusi & pembahasan lengkap, data siswa binaan, evaluasi tryout, absensi, ploting tim, dan analitik.
- **🟢 Siswa**: Akses terbatas untuk melihat bank soal (**pembahasan dan solusi terkunci** demi kejujuran belajar mandiri), agenda timeline lomba, dan detail pembinaan pribadi.
- **Simulasi Role Instan**: Tombol Role Switcher di header untuk beralih mode secara langsung.

### 📚 2. Manajemen Bank Soal & Pembahasan (KaTeX & Google Drive)
- Koleksi soal berstandar OSN dan IChO dengan formula matematika/reaksi kimia ter-render sempurna via **KaTeX**.
- **Integrasi Google Drive**: Setiap soal dapat ditautkan dengan file PDF naskah asli di Google Drive dengan modal pratinjau langsung maupun tombol buka di Google Drive.
- Multi-filter cerdas: 5 Bidang Kimia (*Fisik, Organik, Anorganik, Analitik, Biokimia*), Tingkat Kesulitan, Format Soal, dan Tahun Lomba.
- Ekspor Soal ke format: **JSON Database**, naskah siap kompilasi **LaTeX (.tex)**, dan Lembar Cetak Soal / Lembar Kunci Pembina.
- Form tambah soal interaktif dengan pratinjau rumus KaTeX langsung (*live preview*).

### 👥 3. Data Siswa, Tracking Progress & Absensi
- Profil siswa binaan lengkap dengan kelas, NISN, level bimbingan (*Pelatda Nasional, Squad OSN-P, Reguler OSN-K*), dan spesialisasi materi.
- Visualisasi Radar Penguasaan 5 Bidang Kimia dan Grafik Tren Nilai Tryout per siswa via Chart.js.
- Ceklis silabus materi yang dikuasai vs materi prioritas pendalaman.
- Rekap persentase absensi dan catatan evaluasi berkala oleh pembina.

### 🏆 4. Manajemen Lomba & Dokumen Ceklis
- Timeline tahapan lomba berjenjang: *Pendaftaran $\to$ Deadline $\to$ Penyisihan $\to$ Perempat Final $\to$ Semifinal $\to$ Final*.
- Notifikasi batas waktu pendaftaran (H-7, H-3, H-1) secara otomatis.
- **Dokumen Ceklis Administrasi**:
  - ✅ Checklist Proposal Kegiatan Lomba
  - ✅ Checklist ACC Proposal oleh Kesiswaan / Kepala Sekolah
  - ✅ Checklist Surat Izin & Dispensasi Peserta (dengan pencatatan nomor surat)
  - 📎 Guidebook & Juknis Lomba tersimpan via Google Drive
- **Sinkronisasi Kalender**:
  - Tombol 1-klik tambah agenda ke **Google Calendar**
  - Unduh berkas **.ICS** untuk Apple Calendar & Microsoft Outlook

### 🎯 5. Ploting & Strategi Tim (Smart Matching & Radar Simulation)
- **Smart Matching Engine**: Algoritma cerdas yang merekomendasikan 3 kombinasi anggota tim paling sinergis untuk menutupi kelemahan topik kimia satu sama lain.
- **Simulasi Radar Interaktif**: Uji formasi tim manual dengan visualisasi Radar Chart kekuatan gabungan, kalkulasi indeks sinergi (0-100%), dan deteksi *blind spot* jika ada topik di bawah nilai 75.
- **Deteksi Bentrok Jadwal**: Peringatan otomatis jika siswa yang dipilih telah terdaftar pada lomba lain dengan tanggal pelaksanaan yang bersamaan.
- **Histori Ploting**: Rekap formasi tim dari tahun ke tahun untuk evaluasi regenerasi talenta muda.

### 📊 6. Analitik & Pelaporan
- **Heatmap Keahlian Siswa**: Matriks visual tabel bergradasi warna memetakan seluruh siswa terhadap 5 cabang kimia.
- Grafik donat perolehan medali (Emas, Perak, Perunggu) dan tren prestasi tahun ke tahun.
- **Ekspor Excel (.xlsx)** via SheetJS untuk rekap nilai dan data siswa.
- **Cetak Laporan Rapat Koordinasi (PDF)** siap cetak dengan format resmi, kop sekolah, dan kolom tanda tangan Kepala Sekolah serta Koordinator.

### 🌓 7. Dual-Theme System
- Mendukung **Mode Gelap (Obsidian Dark)** dan **Mode Terang (Clean Light)** secara mulus dengan tombol toggle di header.

---

## 🚀 Cara Menjalankan

Aplikasi ini bersifat *zero-dependency* dan siap digunakan langsung tanpa build server:
1. Buka berkas `index.html` langsung di browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. Data awal otomatis termuat dari `data-sample.js` dan tersimpan di `localStorage` peramban Anda.
3. Untuk menghubungkan ke Google Spreadsheet, gunakan kode `Code.gs` sesuai panduan di dalamnya.
