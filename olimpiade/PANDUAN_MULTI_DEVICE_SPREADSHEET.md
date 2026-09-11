# 🌐 Panduan Integrasi Multi-Device Google Spreadsheet & Sistem Role
## PortalKimia Olimpiade — Cabang Pembinaan Talenta Sains

Dokumen ini memuat panduan lengkap untuk mengaktifkan fitur **Sinkronisasi Multi-Device Real-Time** menggunakan Google Spreadsheet + Google Apps Script (`Code.gs`) yang **otomatis membuat seluruh sheet dan header kolom**, serta petunjuk penggunaan **Sistem Role & Multi-Device Auto-Update**.

---

## 🔐 1. Sistem Role & Aksesibilitas Aman

PortalKimia Olimpiade dirancang aman untuk penggunaan di kelas, laboratorium, maupun proyektor sekolah:

| Role | Status Default | Kata Sandi | Hak Akses Utama |
|------|----------------|------------|-----------------|
| **Mode Siswa** | ✅ **Tampilan Utama (Default)** | *Tanpa Sandi* | • Eksplorasi Bank Soal kurasi (OSN/OMI/dll) dalam format List ringkas<br>• **Solusi & Kunci Terkunci** secara otomatis<br>• Akses Pratinjau Naskah & Tautan Google Drive<br>• Melihat Timeline Lomba, Jadwal Intensif, Pengumuman, dan riwayat juara tanpa menampilkan nilai mentah/rapor siswa |
| **Guru Pembimbing** | Perlu Verifikasi | `kimiahebat` | • Buka Kunci Jawaban & Pembahasan Lengkap ber-KaTeX<br>• Tambah, Edit, dan Hapus Soal, Link Drive, Jadwal Intensif, & Pengumuman<br>• Kelola Data Siswa, Level & Nilai Topik Kimia<br>• Ploting & Kelolosan Peserta Lomba (Tim & Individu)<br>• Smart Matching & Simulator Radar Sinergi Tim<br>• Analitik Titik Lemah, Heatmap & Cetak Laporan |
| **Admin Olimpiade** | Perlu Verifikasi | `admin123` | • Seluruh hak akses Guru Pembimbing<br>• Pengaturan Konfigurasi Sistem & Target Medali<br>• Pengaturan URL Backend Google Apps Script<br>• Manajemen Akun Pengguna & Backup Database JSON |

> 💡 **Fitur Keamanan Khusus**:
> - **Kunci Cepat (1-Click Lock)**: Ketika Guru/Admin selesai mengajar di proyektor kelas, cukup klik tombol **"Kunci Siswa"** di bar navigasi atas. Aplikasi langsung terkunci kembali ke **Mode Siswa** tanpa konfirmasi sandi.
> - **Tampilan Sandi Terlindungi**: Kolom sandi menggunakan input tipe tersembunyi (`type="password"`) dan tidak pernah dimunculkan di layar.

---

## 📊 2. Otomatisasi Sheet & Kolom di Google Spreadsheet

File `Code.gs` telah dilengkapi fungsi **`initSpreadsheetStructure(ss)`** yang secara otomatis:
1. Membuat seluruh 8 sheet jika belum tersedia.
2. Memberikan label warna khusus (*Tab Color*) pada setiap sheet agar estetik dan mudah dibedakan.
3. Menulis baris Header (Kolom 1) dengan desain modern: background gelap (`#18181b`), teks putih tebal, tinggi 35px, dan teks rata tengah.
4. Membekukan baris pertama (*Freeze Row 1*) agar header tetap terlihat saat di-scroll.
5. Mengatur lebar kolom secara proporsional sesuai kebutuhan isi data.
6. Menghapus sheet bawaan (*Sheet1*) yang kosong secara otomatis.

### Rincian 8 Sheet yang Dibuat Otomatis:

| No | Nama Sheet | Warna Tab | Jumlah Kolom | Deskripsi Data |
|---|---|---|---|---|
| 1 | **`Bank_Soal`** | 🔵 Biru (#2563eb) | 17 Kolom | ID, Judul, Kategori, Subtopik, Tingkat, Sumber, Tahun, Teks Soal, Rumus KaTeX, Opsi A-E, Kunci, Pembahasan, Tautan Drive, dll. |
| 2 | **`Data_Siswa`** | 🟢 Hijau (#059669) | 14 Kolom | ID, NISN, Nama Lengkap, Kelas, Status Binaan, No HP, Wali, Rating Topik (JSON), Riwayat Lomba (JSON), dll. |
| 3 | **`Agenda_Lomba`** | 🟣 Ungu (#7c3aed) | 13 Kolom | ID, Nama Lomba, Penyelenggara, Tingkat, Kategori Tim/Individu, Biaya Pendaftaran, Total Biaya, Peserta Aktif, Peserta Gugur, Timeline (JSON). |
| 4 | **`Jadwal_Intensif`** | 🟠 Oranye (#d97706) | 13 Kolom | ID, Judul Sesi, Tanggal, Jam Mulai, Jam Selesai, Ruang/Lokasi, Guru Pengisi, Materi Topik, Peserta Terploting, Link Materi, Keterangan. |
| 5 | **`Pengumuman`** | 🔴 Merah (#e11d48) | 9 Kolom | ID, Judul Pengumuman, Tanggal, Isi Pesan, Prioritas (Info/Penting/Urgent), Status Pin, Sasaran Role (Siswa/Guru/Semua), Penulis. |
| 6 | **`Pembimbing`** | 🩵 Cyan (#0891b2) | 9 Kolom | ID, NIP, Nama Pembimbing, Bidang Keahlian (Organik/Anorganik/Fisik/Analitik/Biokimia), No HP, Email, Catatan. |
| 7 | **`Pengaturan_Sistem`** | 🔘 Abu-abu (#475569) | 4 Kolom | Key, Value, Keterangan, Terakhir Diperbarui (Nama Sekolah, Koordinator, Target Medali, Tahun Ajaran, dll). |
| 8 | **`Log_Aktivitas`** | ⚫ Gelap (#18181b) | 4 Kolom | Waktu, Pelaku (Role), Aksi, Keterangan Perubahan Data (Audit Trail). |

---

## ⚡ 3. Menu Kustom di Toolbar Google Sheets

Begitu Anda membuka Spreadsheet yang telah dipasangi `Code.gs`, akan muncul menu khusus di bilah atas:
`🏆 PortalKimia Olimpiade` yang berisi opsi:
- **`⚙️ Inisialisasi Seluruh Sheet & Kolom Otomatis`**: Memeriksa, membuat sheet yang belum ada, dan memformat seluruh kolom header secara otomatis.
- **`☁️ Pindai Folder Google Drive (Bank Soal)`**: Memindai file `.html` naskah soal di folder Google Drive Anda dan menyusunnya otomatis ke dalam `Bank_Soal`.
- **`ℹ️ Cek Status & Informasi API`**: Menampilkan dialog informasi status database, total baris tiap sheet, dan endpoint API.

---

## ☁️ 4. Panduan Deploy Backend Google Apps Script (`Code.gs`)

### Langkah 1: Buat Google Spreadsheet Baru
1. Kunjungi [Google Sheets](https://sheets.new) di browser Anda.
2. Beri judul file, contoh: `Database PortalKimia Olimpiade`.
3. Anda tidak perlu membuat sheet secara manual, skrip akan mengaturnya.

### Langkah 2: Pasang Skrip `Code.gs`
1. Di Google Sheets, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh baris kode contoh `function myFunction() {}`.
3. Buka file `Code.gs` yang ada di folder aplikasi `PortalKimia-Olimpiade`.
4. Salin seluruh kodenya dan tempelkan ke editor Apps Script.
5. Klik ikon **Simpan (Save)** atau tekan `Ctrl + S`.
6. (*Opsional*) Pilih fungsi `onOpen` atau `initSpreadsheetStructure` di dropdown run, lalu klik **Jalankan (Run)** untuk melihat seluruh sheet dan kolom terbentuk seketika.

### Langkah 3: Deploy sebagai Web App (Penerapan Baru)
1. Klik tombol biru **Terapkan (Deploy)** di kanan atas > pilih **Penerapan Baru (New Deployment)**.
2. Klik ikon gerigi (roda gigi) di sebelah kiri *Pilih jenis (Select type)* > pilih **Aplikasi Web (Web App)**.
3. Konfigurasikan:
   - **Deskripsi**: `Backend PortalKimia Olimpiade Multi-Device`
   - **Jalankan sebagai (Execute as)**: **Saya (email Anda)**
   - **Siapa yang memiliki akses (Who has access)**: **Siapa saja (Anyone)** *(Wajib agar website dari berbagai device dapat membaca & menulis data)*
4. Klik **Terapkan (Deploy)**.
5. Saat diminta otorisasi (*Authorization Required*):
   - Klik **Tinjau Izin (Review Permissions)** > Pilih akun Google Anda.
   - Klik teks kecil **Advanced (Lanjutan)** di kiri bawah > klik **Buka (tidak aman) / Go to ... (unsafe)**.
   - Klik **Izinkan (Allow)**.
6. Salin **URL Aplikasi Web (Web App URL)** yang berakhiran `/exec`.

---

## 🔗 5. Menghubungkan URL ke Website PortalKimia Olimpiade

1. Buka aplikasi `index.html` di browser Anda.
2. Masuk ke **Mode Admin** (pilih *Admin Olimpiade* di pojok kanan atas, masukkan password `admin123`).
3. Buka menu **Pengaturan Sistem**.
4. Pada kolom **URL Web App Google Apps Script (Backend Multi-Device)**, tempelkan URL `/exec` yang tadi Anda salin.
5. Klik tombol **Tes & Sync** untuk verifikasi koneksi dan inisialisasi cloud.
6. Klik tombol **Simpan Konfigurasi**.

---

## 🔄 6. Cara Kerja Sinkronisasi Multi-Device Otomatis

Aplikasi telah dilengkapi arsitektur sinkronisasi multi-device yang sangat responsif:

1. **Auto-Fetch Saat Dibuka (Initial Load)**:
   - Begitu halaman website dibuka di laptop, PC laboratorium, tablet, atau HP siswa, aplikasi langsung memanggil `doGet` ke Spreadsheet untuk memuat data termutakhir.
2. **Auto-Polling Setiap 45 Detik (Background Refresh)**:
   - Di latar belakang, aplikasi memeriksa pembaruan spreadsheet setiap 45 detik tanpa mengganggu sesi belajar siswa atau mengetik guru (aman dan tidak me-refresh form yang sedang dibuka).
3. **Deteksi Perpindahan Tab / Jendela Aktif (`visibilitychange` & `focus`)**:
   - Jika guru atau siswa membuka tab lain lalu kembali ke tab PortalKimia Olimpiade, data akan otomatis diperbarui seketika dari Spreadsheet.
4. **Push Otomatis Saat Ada Perubahan Data (`saveData()`)**:
   - Setiap kali Guru/Admin menambah soal, mengedit jadwal, memperbarui status kelolosan lomba, atau memposting pengumuman baru, data langsung dikirim via `POST` ke Spreadsheet.
5. **Format JSON Pintar (Serialization & Deserialization)**:
   - Kolom yang berisi data bersarang (seperti daftar opsi pilihan ganda, rating topik per cabang kimia, timeline lomba, dan pembagian tim) otomatis diubah menjadi string JSON rapi saat disimpan ke Spreadsheet, dan di-decode kembali menjadi objek JavaScript murni saat dibaca oleh website.

---

## 🧪 7. Cadangan Manual (JSON Backup)

Menu **Pengaturan Sistem** juga menyediakan:
- **Unduh Cadangan Lengkap (JSON)**: Menyimpan seluruh database lokal ke satu file `.json`.
- **Pulihkan dari Berkas (JSON)**: Memulihkan database kapan pun dibutuhkan dengan 1 klik.
- **Kosongkan Seluruh Tampilan & Data**: Membersihkan data agar siap digunakan untuk uji coba mandiri atau memulai tahun ajaran baru.
- **Muat Data Sampel Bawaan (Demo)**: Mengisi kembali contoh soal ber-KaTeX, siswa binaan, dan agenda lomba untuk demonstrasi.

---
*PortalKimia Olimpiade — Tim Pengembang PortalKimia Suite & Pembina Talenta Sains*  
*Koordinator: Tito Vanzal, S.Pd.*
