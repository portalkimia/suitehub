# Panduan Lengkap: Web Portal Bahan Ajar Berbasis Google Apps Script & Media Pembelajaran Kimia HTML

Selamat datang di sistem **Portal Kimia**, platform terpadu berbasis **Google Apps Script (GAS)** dan **HTML5 Interaktif** untuk mengelola bahan ajar Kimia (dan multi-pelajaran), menyajikan simulasi laboratorium virtual, serta mencatat pengumpulan tugas siswa secara otomatis ke Google Spreadsheet dan Email Guru.

---

## 📁 Struktur Berkas Proyek

Semua berkas proyek berada di folder lokal:
`C:\Users\Tito\.gemini\antigravity\scratch\portal-bahan-ajar\`

1. **`Code.gs`**: Kode backend Google Apps Script.
   - Terhubung langsung ke Google Spreadsheet ID: `1fFEdFx-J7nYSUpNLIpZVwsO2HpWtM8cqBCF0vn_I9ZI`.
   - Mengelola sheet `BahanAjar` (daftar materi portal) dan `TugasSiswa` (rekap nilai kuis, jawaban lab simulasi, dan refleksi).
   - Memiliki handler `doPost(e)` & `doGet(e)` yang menerima pengiriman data tugas dari file HTML manapun (Google Drive, lokal, web).
2. **`Index.html`**: Kode frontend web portal. Dilengkapi fitur pencarian langsung (Live Search), filter mata pelajaran (dengan prioritas Kimia), filter format file, dan **In-App Modal Viewer** (membaca PDF/PPT/HTML langsung di halaman web tanpa perlu download).
3. **`KonfigurasiBohr.html`** / **`konfigurasi-elektron-bohr/index.html`**: Media pembelajaran interaktif Konfigurasi Elektron Model Bohr (dilengkapi Auto-Save, Lab Simulasi Eksitasi-Emisi 3D, 12 Soal Kuis, 3 Soal Lab Essai, Refleksi, dan Pusat Pengumpulan Tugas).
4. **`KonfigurasiKuantum.html`** / **`konfigurasi-elektron-mekanika-kuantum/index.html`**: Media pembelajaran interaktif Konfigurasi Elektron Mekanika Kuantum Fase E (dilengkapi Auto-Save, Lab Simulasi Orbital & Bilangan Kuantum, 12 Soal Kuis, 3 Soal Lab Essai, Refleksi, dan Pusat Pengumpulan Tugas).

---

## 🚀 Langkah 1: Pengaturan Awal di Google Apps Script

1. Buka [Google Spreadsheet Anda](https://docs.google.com/spreadsheets/d/1fFEdFx-J7nYSUpNLIpZVwsO2HpWtM8cqBCF0vn_I9ZI/edit).
2. Pada menu atas Spreadsheet, klik **Extensions (Ekstensi)** > **Apps Script**.
3. Editor Google Apps Script akan terbuka.

---

## 📝 Langkah 2: Menyalin Kode ke Apps Script Editor

Di dalam editor Apps Script:

### A. Berkas `Code.gs`
1. Buka berkas default `Code.gs` di editor.
2. Hapus seluruh isinya, lalu tempelkan (*copy-paste*) seluruh kode dari file **`Code.gs`** lokal. (ID Spreadsheet sudah otomatis terkonfigurasi).

### B. Berkas HTML
1. Buat file HTML baru (`+` > **HTML**), beri nama `Index`, lalu salin seluruh isi `Index.html`.
2. Buat file HTML baru bernama `KonfigurasiBohr`, lalu salin isi `KonfigurasiBohr.html`.
3. Buat file HTML baru bernama `KonfigurasiKuantum`, lalu salin isi `KonfigurasiKuantum.html`.

---

## 🌐 Langkah 3: Publikasikan (Deploy) sebagai Web App

Agar file HTML yang dibuka dari Google Drive atau link mandiri dapat mengirim nilai dan jawaban langsung ke Google Spreadsheet:

1. Di pojok kanan atas Apps Script Editor, klik tombol biru **Deploy (Terapkan)** > pilih **New deployment (Penerapan baru)**.
2. Klik ikon gerigi ⚙️ di samping *Select type*, lalu pilih **Web app**.
3. Isi konfigurasi:
   - **Description**: `Versi 2 - Portal Kimia & Pengumpulan Tugas`
   - **Execute as (Jalankan sebagai)**: **`Me (email Anda)`**
   - **Who has access (Siapa yang memiliki akses)**: **`Anyone (Siapa saja)`** *(Penting: agar request dari siswa dapat diterima sistem)*.
4. Klik tombol **Deploy (Terapkan)**.
5. Salin **Web App URL** yang diberikan:
   `https://script.google.com/macros/s/AKfycbwobr0k-44HFrf3B5YUroeEK-_U13AGVe2urQYDAmL0U43arTQHTvKjUEeM6CuZQvOE/exec`
6. **Selesai!** Tautan di atas telah tertanam permanen (*hardcoded*) di dalam seluruh berkas media pembelajaran HTML (`KonfigurasiBohr.html`, `KonfigurasiKuantum.html`, dsb.). Anda tidak perlu lagi mengubah file HTML secara manual! Siapapun siswa yang membuka materi di Google Drive/lokal akan langsung otomatis terhubung ke Google Spreadsheet Anda saat menekan "Kirim ke Database Guru".

---

## ⚡ Langkah 4: Auto-Scan Folder Google Drive Sekali Klik (SANGAT PRAKTIS)

Anda **tidak perlu lagi menambahkan bahan ajar satu per satu**:

1. Di komputer Anda, buka folder:
   `C:\Users\Tito\.gemini\antigravity\scratch\portal-bahan-ajar\Media_Pembelajaran_Kimia_Drive\`
2. Buka Google Drive Anda, buat satu folder khusus, misalnya: `📁 Media Kimia Interaktif`.
3. Klik kanan folder Drive tersebut > **Bagikan (Share)** > ubah ke **"Siapa saja yang memiliki link dapat melihat"** > Salin Link Folder.
4. Upload semua file `.html` (atau PDF/PPT/Video) dari folder laptop Anda ke folder Google Drive tersebut.
5. Buka Web Portal Anda > klik tombol kuning **"Auto-Sync Drive"** di bilah atas:
   - Tempelkan link folder Google Drive Anda.
   - Klik **"Mulai Pindai &amp; Sinkronkan"**.
6. **Selesai!** Seluruh bahan ajar di dalam folder Google Drive akan otomatis terbaca judulnya, dideteksi formatnya (HTML/PDF/PPT/Video), dan langsung masuk rapi ke database Google Spreadsheet `BahanAjar` portal Anda!

---

## 💡 Panduan Lengkap Memasukkan Bahan Ajar (HTML, PDF, PPT, Video)

Selain menggunakan fitur **Auto-Sync Drive**, Anda juga tetap bisa menambah materi secara manual:
- **Cara A**: Lewat tombol hijau **"+ Tambah Bahan Ajar"** langsung di Web Portal.
- **Cara B**: Langsung ketik baris baru di Google Spreadsheet pada sheet `BahanAjar`.

---

### 🌐 Khusus Bahan Ajar "HTML Interaktif" (Bagaimana Cara Kerjanya?)

Pertanyaan umum yang sering muncul: *"Jika hanya menulis `?page=media-kimia`, bukankah itu hanya membuka file MediaInteraktif bawaan? Bagaimana kalau saya punya materi HTML baru lainnya?"*

**Pemahaman Anda 100% Benar!** 
`?page=media-kimia` memang khusus untuk membuka file bawaan `MediaInteraktif.html`. 

Lalu, bagaimana jika di kemudian hari Anda ingin memasukkan media HTML interaktif yang **baru (kedua, ketiga, dst.)**? Ada **2 cara mudah**:

#### Opsi 1: Cukup Upload ke Google Drive (SANGAT PRAKTIS & DIREKOMENDASIKAN)
*Anda TIDAK PERLU membuka kode Apps Script lagi setiap kali punya materi HTML baru!*
1. Siapkan file `.html` materi Anda di komputer.
2. Buka **Google Drive**, lalu upload file `.html` tersebut.
3. Klik kanan file di Google Drive > **Bagikan (Share)** > ubah ke **"Siapa saja yang memiliki link dapat melihat"** > Salin Link.
4. Buka Web Portal Anda > klik **"+ Tambah Bahan Ajar"**:
   - **Format**: Pilih `HTML`
   - **Link URL**: Tempelkan link Google Drive tadi (contoh: `https://drive.google.com/file/d/1XyZ.../view?usp=sharing`).
5. *Keajaiban Sistem Kita:* Sistem backend Apps Script (`drive-html`) secara otomatis akan menyedot kode HTML dari Drive tersebut dan menampilkannya sebagai halaman interaktif langsung di portal siswa!

#### Opsi 2: Jika Ingin Menambahkannya di Dalam Editor Apps Script
Jika Anda lebih suka menaruh file kodenya di dalam Apps Script (seperti `MediaInteraktif`):
1. Buka editor Google Apps Script.
2. Di panel kiri, klik tombol **`+`** > pilih **HTML**.
3. Beri nama file baru (misalnya: `Stoikiometri` atau `LarutanAsam`).
4. Tempelkan kodingan HTML materi Anda di file tersebut, lalu klik Save (Ikon Disket).
5. Pada form Web Portal atau Google Spreadsheet:
   - **Format**: Pilih `HTML`
   - **Link URL**: Cukup ketik nama filenya dengan awalan `?page=`, contoh:
     ```text
     ?page=Stoikiometri
     ```
   Sistem backend kami sekarang sudah dibuat otomatis: akan langsung mencari dan membuka file HTML sesuai nama yang Anda ketikkan!

#### Opsi 3: Menggunakan Web Edukasi Online (PhET, Wordwall, Quizizz)
Jika materinya berupa link web dari platform luar:
- Cukup salin URL websitenya (misal: simulasi PhET Kimia `https://phet.colorado.edu/sims/html/...`).
- Pada form pilih Format: `HTML`, lalu tempelkan link tersebut.

---

### 📄 Panduan Format Bahan Ajar Lainnya:

| Tipe Bahan Ajar | Format Input | Cara Pengambilan Link |
| :--- | :--- | :--- |
| **Dokumen PDF** | `PDF` | Upload file PDF ke Google Drive > Klik kanan > **Share (Bagikan)** > Atur ke **"Anyone with the link (Siapa saja yang memiliki link)"** > Salin Link. Sistem otomatis mengubahnya ke mode preview pembaca tanpa download. |
| **Slide Presentasi (PPT)** | `PPT` | Buka presentasi di Google Slides (atau upload file `.pptx` ke Google Drive) > Bagikan dengan izin publik > Salin link. Siswa dapat langsung melihat slide dan berpindah halaman di dalam portal. |
| **Video Pembelajaran** | `VIDEO` | Masukkan link video YouTube biasa (misal: `https://www.youtube.com/watch?v=...`). Sistem otomatis memutarnya dengan pemutar aman bebas pelacak iklan. |

---

## 🧪 Mengembangkan & Menambah Mata Pelajaran Lain

Meskipun **Kimia** diatur sebagai mata pelajaran utama, sistem dirancang fleksibel:
- **Di Google Spreadsheet / Form Input**: Pada kolom **Mata Pelajaran**, Anda dapat menuliskan mapel apa saja, misalnya: *Fisika, Biologi, Matematika, Kimia Terapan, IPA Terpadu*, dll.
- **Di Web Portal**: Dropdown filter mata pelajaran dan badge otomatis mengenali mata pelajaran tersebut dan mengelompokkannya secara instan.

---

## 🖥️ Menguji Coba Secara Offline / Lokal di Komputer Anda

Sebelum diunggah ke Google Apps Script, Anda juga bisa langsung mencoba tampilan web portal dan media pembelajaran kimia di komputer Anda:
1. Masuk ke folder: `C:\Users\Tito\.gemini\antigravity\scratch\portal-bahan-ajar\`
2. Klik dua kali file **`Index.html`** untuk melihat Web Portal.
3. Klik dua kali file **`media_interaktif_kimia.html`** untuk mencoba laboratorium kimia interaktif (simulasi Bohr, tabel periodik, dan uji pH).
