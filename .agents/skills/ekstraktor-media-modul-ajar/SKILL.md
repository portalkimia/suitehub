---
name: ekstraktor-media-modul-ajar
description: >-
  Membaca, mengekstrak, dan memadatkan media pembelajaran eksternal berupa PPT/PPTX, PDF, atau HTML
  menjadi Paket Prompt Pedagogis Ringkas untuk kolom Bahan Ajar Generator Modul Ajar agar menghemat
  beban token DeepSeek API hingga 85% serta memastikan Ayat Al-Qur'an per pertemuan terbaca otomatis.
  Gunakan skill ini saat pengguna memberikan berkas .ppt, .pptx, .pdf, atau .html eksternal atau meminta
  bantuan membuat prompt bahan ajar dari media pembelajaran untuk Generator Modul Ajar.
---

# Ekstraktor Media Eksternal Generator Modul Ajar (Hemat Token DeepSeek API)

Skill ini berfungsi sebagai **Pra-Pemroses (Pre-Processor) Cerdas** untuk Generator Modul Ajar.
Karena **DeepSeek API (`deepseek-flash`)** di Google Apps Script tidak dapat menerima lampiran biner `.pdf` atau `.pptx` secara langsung dan memiliki batas waktu eksekusi *UrlFetchApp* 60 detik, pengiriman teks mentah berukuran puluhan ribu karakter akan membebani DeepSeek API.

Skill ini membaca berkas **PPT/PPTX, PDF, atau HTML** milik guru (baik 1 berkas maupun beberapa berkas untuk Pertemuan 1, Pertemuan 2, dst.), melengkapi **Ayat Al-Qur'an / Hadits per pertemuan** beserta teks Arab dan terjemahannya, lalu menghasilkan **Paket Prompt Pedagogis Ringkas (`~1.500–2.500` karakter/pertemuan)** yang 100% kompatibel dengan parser deterministik di `Code.gs` dan `index.html`.

---

## Langkah Kerja Agen (Wajib Diikuti Berurutan)

### Langkah 1: Ekstraksi Isi Berkas Media (`.pptx`, `.ppt`, `.html`, `.pdf`)

1. **Jalankan Skrip Ekstraktor Bawaan** untuk berkas `.pptx`, `.ppt`, `.html`, `.htm`, atau `.pdf`:
   ```powershell
   node "C:\Users\Tito\.gemini\config\skills\ekstraktor-media-modul-ajar\scripts\ekstrak_media.cjs" "<path_berkas_1>" ["<path_berkas_2>" ...]
   ```
   - Skrip [ekstrak_media.cjs](./scripts/ekstrak_media.cjs) mengekstrak seluruh slide XML `.pptx` (`ppt/slides/slide*.xml` dan *speaker notes*) menggunakan `zlib` bawaan Node.js tanpa perlu instalasi paket tambahan, mengekstrak bagian-bagian pedagogis `.html`, serta mendekode stream teks `.pdf`.
2. **Khusus Berkas `.pdf` (Multimodal / Font Khusus / Pindaian)**:
   - Jika output skrip memberi tanda `[CATATAN EKSTRAKTOR: PDF menggunakan encoding font khusus/halaman pindaian]` atau teks PDF belum terbaca utuh, **gunakan tool `read_file` bawaan Gemini** langsung pada path berkas `.pdf` tersebut untuk membaca teks, rumus, tabel, dan ayat secara presisi.

---

### Langkah 2: Verifikasi & Pelengkapan Ayat Al-Qur'an Per Pertemuan

Parser `ekstrakAyatDariBahanAjar_` di `Code.gs` dan `ekstrakAyatDariBahanAjarClient` di `index.html` memetakan ayat secara otomatis ke `ayat1`, `ayat2`, dst. Oleh karena itu:
1. Periksa apakah di setiap pertemuan sudah terdapat **Ayat Al-Qur'an atau Hadits**.
2. **Jika di dalam PPT/PDF/HTML hanya tertulis nama surah dan nomor ayat** (misal: `QS. Al-Mulk: 3-4`) atau **jika belum ada ayat sama sekali** pada media tersebut:
   - **WAJIB lengkapi langsung** di dalam hasil ekstraksi dengan format utuh:
     `Ayat Pertemuan N: QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [1-2 kalimat keterkaitan ilmiah dengan sub-topik Pertemuan N]`
   - Dengan melengkapi teks Arab dan terjemahannya di tahap ini, **DeepSeek API tidak perlu mengarang ayat dari nol** dan `normalizeAI_` di `Code.gs` dijamin 100% mempertahankan ayat tersebut.

---

### Langkah 3: Susun Paket Prompt Pedagogis Ringkas (Siap Tempel ke `#aiBahanAjar`)

Susun hasil akhir mengikuti format baku pada [template_prompt_deepseek.md](./resources/template_prompt_deepseek.md):
- Gunakan penanda `[BERKAS EKSTRAKSI: ...]` di bagian paling atas (agar terdeteksi oleh `isUploadedReferenceActive()` pada `index.html`).
- Gunakan header `[MEDIA PERTEMUAN 1]`, `[MEDIA PERTEMUAN 2]`, dst.
- Cantumkan baris `Sub-Topik Pertemuan N: ...` dan `Ayat Pertemuan N: ...` tepat di bawah `[MEDIA PERTEMUAN N]`.
- Sertakan 6 sub-bagian ringkas per pertemuan:
  1. `--- 1. STIMULUS FENOMENA NYATA (APERSEPSI) ---`
  2. `--- 2. INTEGRASI NILAI KEISLAMAN & AYAT/HADITS ---`
  3. `--- 3. FITUR SIMULASI / KEGIATAN INTI (MEMAHAMI & MENGAPLIKASI) ---`
  4. `--- 4. LEMBAR KERJA PESERTA DIDIK (LKPD) & TABEL PENGAMATAN ---`
  5. `--- 5. EVALUASI / KUIS FORMATIF ---`
  6. `--- 6. INTISARI MATERI PERTEMUAN N (TERKOMPRESI HEMAT TOKEN) ---`
- **Batasi ukuran**: Pastikan setiap pertemuan dipadatkan menjadi **1.500 – 2.500 karakter** (tidak menyertakan sampah kode HTML/CSS atau pengulangan teks slide), sehingga beban token DeepSeek API berkurang 80–90% dan waktu *generate* menjadi jauh lebih cepat.

---

### Langkah 4: Penyajian Output kepada Pengguna

Tampilkan hasil akhir di dalam satu blok kode Markdown (```` ```text ... ``` ````) yang mudah disalin (*one-click copy*) oleh guru untuk ditempelkan langsung ke kolom **Prompt Tambahan / Rujukan Bahan Ajar (`#aiBahanAjar`)** di Generator Modul Ajar.
