# LMS Guru Kimia & Wali Kelas (Responsive Desktop & Mobile)

Aplikasi Web LMS (Learning Management System) Pribadi yang dirancang khusus untuk mempermudah tugas ganda sebagai **Guru Kimia** dan **Wali Kelas**.

---

## 🌟 Fitur Utama

1. **Dashboard Rangkuman:**
   - Statistik kehadiran hari ini (Apel Pagi & Family Time).
   - Rata-rata nilai kimia dan persentase ketuntasan (KKM).
   - Leaderboard siswa teraktif (Bintang ⭐).
   - Grafik interaktif komposisi presensi dan distribusi nilai.

2. **Halaman Wali Kelas:**
   - Presensi **Apel Pagi** (Hadir, Terlambat, Sakit, Izin, Alpa + catatan).
   - Presensi **Family Time** (sebelum pulang) + evaluasi harian.
   - Tombol 1-klik *"Semua Hadir"* untuk kecepatan input di HP.

3. **Jurnal Pembelajaran Kimia:**
   - Catatan mengajar per tanggal & per kelas.
   - Topik/Materi Kimia, Aktivitas/Praktikum Lab, Refleksi Kendala, dan Tindak Lanjut.
   - Presensi khusus jam pelajaran Kimia per sesi.
   - Format siap cetak (*Official Teacher Report*).

4. **Penilaian Tugas & Ulangan Harian (UH):**
   - Rekap nilai tugas, ulangan harian, dan praktikum lab.
   - Standar KKM dinamis, indikator otomatis Tuntas/Remedial.
   - Ekspor rekap nilai ke format Excel (.xlsx).

5. **Poin Keaktifan Bintang (Gamifikasi ⭐):**
   - Pemberian apresiasi instan: Tanya Jawab (+1), Soal Papan Tulis (+1), Praktikum Lab (+2), Tutor Sebaya (+1).
   - Podium Klasemen / Leaderboard Top 3 Chemist.

6. **Penyimpanan & Sinkronisasi Google Drive:**
   - Terhubung langsung ke **Google Sheets** di Google Drive Anda.
   - Siap di-deploy sebagai **Google Apps Script Web App** (100% gratis).
   - Dukungan mode offline lokal (*LocalStorage*) dan Backup/Restore JSON.

---

## 📁 Struktur File

- `index.html` — Halaman utama Single Page Application (Responsive UI).
- `app.js` — Reactive logic, kalkulasi statistik, integrasi Google Drive.
- `data-sample.js` — Data awal realistis materi kimia SMA & kelas binaan.
- `styles.css` — Styling kustom, animasi bintang, dan aturan cetak dokumen resmi.
- `Code.gs` — Skrip backend Google Apps Script untuk Google Spreadsheet.
- `PANDUAN_GOOGLE_DRIVE.md` — Panduan langkah demi langkah 1 menit untuk menghubungkan ke Google Drive.
