# 📖 PANDUAN LENGKAP PENGGUNAAN & INTEGRASI GOOGLE DRIVE (v3.0)

## LMS Guru Kimia & Wali Kelas

Aplikasi LMS ini dibuat secara khusus untuk membantu pekerjaan Anda sebagai **Guru Mata Pelajaran Kimia** dan **Wali Kelas**.

---

## 1. CARA MENJALANKAN DI LAPTOP (OFFLINE / LOKAL)
1. Buka folder `LMS-Guru-Kimia` di Desktop Anda.
2. Klik ganda (**Double Click**) pada berkas `index.html`.
3. Aplikasi web akan langsung terbuka di browser Anda (Google Chrome, Edge, Safari, dll).

---

## 2. CARA MENGHUBUNGKAN KE GOOGLE DRIVE & GOOGLE SPREADSHEET

Agar seluruh data Anda (Data Siswa yang diinput manual di Spreadsheet, Presensi, Jurnal Kimia, Nilai, dan Poin Bintang) tersimpan di Google Drive dan bisa dibuka dari HP kapan saja, ikuti 4 langkah mudah berikut:

### Langkah 1: Buat Spreadsheet di Google Drive
1. Buka **Google Drive** Anda (https://drive.google.com).
2. Buat Google Spreadsheet baru, beri nama misalnya: `Database LMS Kimia - Tito`.

### Langkah 2: Membuka Editor Apps Script
1. Di dalam Google Spreadsheet Anda, klik menu atas: **Ekstensi (Extensions)** > **Apps Script**.
2. Anda akan diarahkan ke halaman editor kode Google Apps Script.

### Langkah 3: Memasukkan Kode Program
1. **Di bagian `Code.gs`**:
   - Hapus semua tulisan di dalamnya.
   - Buka berkas `Code.gs` dari folder di Desktop Anda, lalu **Copy (Salin)** dan **Paste (Tempel)** ke editor Apps Script.
2. **Membuat File `index.html`**:
   - Di panel kiri editor Apps Script, klik ikon tambah **(+)** di samping *Files*, lalu pilih **HTML**.
   - Beri nama file: `index` (otomatis menjadi `index.html`).
   - Buka berkas `index.html` dari folder di Desktop Anda, lalu **Copy Semua (Ctrl+A lalu Ctrl+C)** dan **Paste** ke file `index.html` di Apps Script tersebut.
3. Klik tombol **Simpan (Ikon Disket / Ctrl+S)**.

### Langkah 4: Publikasikan sebagai Web App (Bisa dibuka di Laptop & HP)
1. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas > pilih **Penerapan Baru (New deployment)**.
2. Klik ikon gerigi ⚙️ di samping *Select type* > pilih **Aplikasi web (Web app)**.
3. Atur konfigurasi:
   - **Deskripsi:** `LMS Kimia v3`
   - **Jalankan sebagai (Execute as):** `Saya (email Anda)`
   - **Siapa yang memiliki akses (Who has access):** `Siapa saja (Anyone)`
4. Klik **Terapkan (Deploy)** dan berikan izin otorisasi Google akun Anda (*Klik Advanced > Go to Untitled project (unsafe) > Allow*).
5. Anda akan mendapatkan **URL Aplikasi Web** (misal: `https://script.google.com/macros/s/.../exec`).
6. **Selesai!** Link tersebut bisa Anda simpan di bookmark laptop atau HP Anda.

---

## 3. PANDUAN PENGISIAN DATA SISWA & KELAS SECARA MANUAL DI SPREADSHEET

Sistem backend (v3.0) sekarang **sangat cerdas dan fleksibel**. Anda bisa mengetik data siswa secara manual di Google Spreadsheet:

1. Buat / buka sheet bernama `Data_Siswa` atau `Siswa`.
2. Buat baris judul (header) di baris pertama:
   | ID Siswa | NISN | Nama Siswa | Kelas | Jenis Kelamin | No HP Siswa | No HP Ortu |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | SIS-001 | 0051234567 | Ahmad Fauzi | XI MIPA 1 | L | 081234567890 | 081298765432 |
   | SIS-002 | 0052345678 | Annisa Putri | XI MIPA 1 | P | 081345678901 | 081398765433 |
   | SIS-003 | 0053456789 | Budi Santoso | XI MIPA 2 | L | 081456789012 | 081498765434 |
3. **Penting:** Kolom **Kelas** akan otomatis dibaca oleh LMS menjadi daftar pilihan kelas di semua menu (Wali Kelas, Jurnal, Penilaian, dan Bintang).
4. Setelah selesai mengisi di Google Spreadsheet, buka web LMS Anda lalu klik tombol:
   👉 **"Tarik & Sinkronkan Data dari Google Spreadsheet"** (di header atau menu Pengaturan).
5. Seluruh data siswa dan kelas akan langsung terisi secara otomatis di web LMS Anda!

---

## 4. DAFTAR 9 STATUS PRESENSI RESMI WALI KELAS

Pada menu **Wali Kelas**, tersedia 9 pilihan status presensi lengkap dengan rekapitulasi kehadiran:
1. 🟢 **Hadir**
2. 🔵 **Sakit**
3. 🟣 **Izin**
4. 🩵 **Tahfidz**
5. 🔷 **PTV**
6. 🟠 **Organtri**
7. 🌐 **Di Rumah**
8. 🟡 **Terlambat**
9. 🔴 **Tanpa Keterangan**
