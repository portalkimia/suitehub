# Panduan Generator Modul Ajar & Lesson Plan AI (Obsidian Edition)
### Arsitektur: Frontend di GitHub Pages + Backend di Google Apps Script (GAS)

Aplikasi **Generator Administrasi Kimia AI** dirancang khusus untuk guru Kimia SMA (Kurikulum Merdeka) karya **Tito Vanzal, S.Pd.** Aplikasi ini menggabungkan antarmuka Obsidian High-Contrast Dark di GitHub Pages dengan backend Google Apps Script yang tangguh, terhubung langsung ke Google Drive dan Google Docs Template.

---

## 🌟 6 Fitur Baru & Unggulan

### 1. 🏷️ Quick Tags Materi Kimia
- Tombol materi siap pakai yang dikelompokkan berdasarkan fase:
  - **Fase E (Kelas 10)**: Hakikat Kimia, Struktur Atom Bohr, Mekanika Kuantum, SPU, Ikatan Kimia, Stoikiometri, Kimia Hijau.
  - **Fase F (Kelas 11)**: Bentuk Molekul, Termokimia, Laju Reaksi, Kesetimbangan, Asam Basa & Titrasi, Penyangga, Hidrolisis, Ksp, Koloid.
  - **Fase F (Kelas 12)**: Sifat Koligatif, Redoks, Sel Volta, Sel Elektrolisis, Kimia Unsur, Senyawa Karbon, Makromolekul.
- Sekali klik langsung mengisi kolom **Topik**, **Kelas**, dan mengaitkan media interaktif jika tersedia.

### 2. 🎯 Pilihan Cepat Model Pembelajaran
- Pilihan model pembelajaran Kurikulum Merdeka yang sinkron dengan perancangan sintaks AI:
  - **Problem-Based Learning (PBL)**
  - **Project-Based Learning (PjBL)**
  - **Discovery Learning**
  - **Inkuiri Terbimbing (Inquiry Learning)**
  - **Cooperative Learning** (Jigsaw, STAD, TGT, Think-Pair-Share, NHT)
  - **STEM** (Science, Technology, Engineering, & Mathematics)
  - *Otomatis / AI* (AI memilihkan model paling ideal secara pedagogis jika dikosongi)
- Langkah inti (Memahami, Mengaplikasi, Merefleksi) dirancang otomatis mengikuti alur sintaks model yang dipilih.

### 3. 🚀 Integrasi & Sinkronisasi Media PortalKimia
- Terhubung langsung dengan 8 simulasi interaktif dari suite **Portal-Bahan-Ajar-Kimia**:
  1. *Sejarah Perkembangan SPU* (`SejarahSPU.html`)
  2. *Penentuan Periode dan Golongan Unsur* (`PeriodeGolongan.html`)
  3. *Bilangan Kuantum & Orbital 3D* (`BilanganKuantum.html`)
  4. *Konfigurasi Elektron Mekanika Kuantum* (`KonfigurasiKuantum.html`)
  5. *Konfigurasi Elektron Model Bohr* (`KonfigurasiBohr.html`)
  6. *Virtual Lab Titrasi Asam Basa* (`Laboratorium_Kimia_Virtual.html`)
  7. *Simulasi Interaktif Sel Volta* (`SelVolta.html`)
  8. *Simulasi Interaktif Sel Elektrolisis* (`SelElektrolisis.html`)
- **Sinkronisasi Dinamis**: Dilengkapi tombol `🔄 Sinkronkan Media` yang membaca file `portal_media_manifest.json` serta memori `localStorage` (`chemportal_materials`). Jika Anda menambahkan media baru pada Portal Media, materi di generator akan langsung diperbarui secara otomatis.

### 4. 📂 Upload / Drag & Drop Berkas (Multimodal)
- Kotak unggah berkas rujukan yang mendukung:
  - Berkas interaktif `.html` (diekstraksi teks dan konten pembelajarannya secara otomatis di browser).
  - Berkas teks/LKM `.txt` / `.md`.
  - Dokumen `.pdf` dan foto diagram `.png/.jpg/.webp` (dikirim sebagai Base64 ke Gemini Multimodal API).
- **Rantai Model Cerdas**: Berkas dianalisis menggunakan `gemini-3.7-flash` atau `gemini-3.6-flash`. Jika server Google mengalami lonjakan trafik (*high demand*), sistem secara otomatis beralih ke model alternatif cadangan tanpa menghentikan proses guru.

### 5. ⏳ Animasi Progress Bertahap
- Animasi status dinamis dengan bilah progres berkilau (*shimmering progress bar*) yang memberikan umpan balik pedagogis secara *real-time*:
  1. 🔍 *Menganalisis Kurikulum Merdeka & Capaian Pembelajaran...* (15%)
  2. ⚙️ *Menyelaraskan Sintaks Model Pembelajaran...* (38%)
  3. 📖 *Mencocokkan Integrasi Nilai Qur'ani & Profil Lulusan...* (62%)
  4. 🧪 *Merumuskan Fase Inti (Memahami, Mengaplikasi, Merefleksi) & ITP...* (84%)
  5. ✨ *Memvalidasi Skema JSON & Menyiapkan Formulir...* (96%)

### 6. ✨ Micro AI Co-Pilot ("Poles Bagian Ini Saja")
- Tombol khusus pada masing-masing kartu **Pertemuan 1–9** dan kartu **ITP**.
- Memungkinkan guru memperbaiki narasi pertemuan tertentu (misalnya menambah praktikum virtual lab, memperkuat HOTS, atau memperdalam refleksi Qur'ani) **tanpa mereset atau menghapus isian pertemuan lainnya**.

---

## 🛡️ Rantai Model AI (Multi-Model Fallback Chain)

Backend `Code.gs` telah dikonfigurasi dengan urutan prioritas otomatis:

1. **Prioritas 1 (Model Utama): `gemini-3.7-flash`**
   - Menggunakan generasi model Gemini 3.7 Flash mutakhir untuk penalaran pedagogis paling komprehensif.
2. **Prioritas 2 (Cadangan 1): `gemini-3.6-flash`**
   - Digunakan otomatis jika model 3.7 sedang mengalami lonjakan beban (*high demand*).
3. **Prioritas 3 (Cadangan 2): `gemini-flash-lite-latest`**
   - Model generasi Flash-Lite terbaru dengan kecepatan inferensi luar biasa (~1 detik) dan bebas antre.
4. **Prioritas 4 (Cadangan 3): `gemini-3.1-flash-lite`**
   - Jaring pengaman terakhir dengan kestabilan tinggi.

---

## 🚀 Cara Menerapkan ke Google Apps Script

Bila Anda sudah pernah men-deploy `Code.gs` sebelumnya:
1. Buka proyek Anda di [script.google.com](https://script.google.com/).
2. Buka file **`Code.gs`**, timpa seluruh isinya dengan kode terbaru dari berkas `Code.gs` di repositori ini.
3. Klik tombol biru **Deploy** (Terapkan) di pojok kanan atas &rarr; pilih **Manage deployments** (Kelola penerapan).
4. Klik ikon pensil ✏️ (**Edit**) pada deployment aktif Anda.
5. Pada bagian **Version**, pilih **New version** (Versi baru).
6. Pastikan **Who has access** tetap diset ke **Anyone (Siapa saja)**.
7. Klik **Deploy**.

> [!NOTE]
> URL Web App Anda tetap sama persis, sehingga Anda **tidak perlu mengubah URL** di antarmuka GitHub Pages.
