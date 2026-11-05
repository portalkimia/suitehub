---
name: ekstraktor-media-modul-ajar
description: >-
  Membaca dan mengekstrak media pembelajaran eksternal berupa PPT/PPTX, PDF, atau HTML
  menjadi Paket Prompt Rujukan Bahan Ajar yang lengkap, 100% faktual sesuai isi media (anti-mengarang),
  dan mentransformasikan materi paparan/ceramah menjadi skenario pembelajaran Student-Centered
  serta memastikan Ayat Al-Qur'an per pertemuan terbaca otomatis pada Generator Modul Ajar.
  Gunakan skill ini saat pengguna memberikan berkas .ppt, .pptx, .pdf, atau .html eksternal atau meminta
  bantuan membuat prompt bahan ajar dari media pembelajaran untuk Generator Modul Ajar.
---

# Ekstraktor Media Eksternal Generator Modul Ajar (Konversi File ke Teks Lengkap, Anti-Mengarang, & Student-Centered)

Skill ini berfungsi sebagai **Pra-Pemroses (Pre-Processor) Cerdas** untuk Generator Modul Ajar.
Karena **DeepSeek API (`deepseek-flash`)** di Google Apps Script tidak dapat menerima lampiran biner `.pdf` atau `.pptx` secara langsung, skill ini mengambil alih pembacaan berkas biner (`.pdf`, `.pptx`, `.ppt`, `.html`) menjadi teks terstruktur yang **lengkap, mendetail, dan 100% faktual sesuai isi media** (tanpa memotong isi materi dan tanpa mengarang fitur di luar media), sekaligus mentransformasikan materi paparan/ceramah menjadi rancangan aktivitas **Student-Centered** dan memetakan **Ayat Al-Qur'an per pertemuan** secara otomatis.

---

## Prinsip Utama (Wajib Ditaati)

1. **Makna "Hemat Token" adalah Konversi File ke Teks Lengkap (Bukan Memotong Materi)**:
   - Jangan memangkas isi materi menjadi ringkasan dangkal. Ekstrak seluruh sub-bab, definisi, konsep, rumus/persamaan, tabel, contoh soal, dan latihan yang tertulis di setiap halaman/slide PDF/PPT/HTML secara **maksimal dan mendetail**.
2. **100% Anti-Mengarang (Strict Grounding pada Isi Media)**:
   - **DILARANG KERAS** mengarang adanya simulasi interaktif, laboratorium virtual, praktikum, tabel pengamatan eksperimen, fenomena di luar teks, atau kuis interaktif jika tidak tertulis di dalam berkas media!
   - Hanya tuliskan fitur yang benar-benar ada di dalam media. Jika media berupa slide/PDF materi paparan tanpa simulasi, nyatakan secara jujur dan jangan mengarang seolah-olah ada simulasi.
3. **Transformasi Materi Ceramah menjadi Skenario *Student-Centered***:
   - Meskipun media yang diunggah terkesan seperti materi untuk ceramah satu arah, rancang skenario penyampaiannya agar **berpusat pada murid (*Student-Centered*)** pada fase `Memahami` (murid secara berkelompok menelaah/membedah konsep & rumus pada slide/halaman media dengan *scaffolding* guru), `Mengaplikasi` (murid berdiskusi memecahkan contoh soal/kasus/latihan nyata yang tertulis di media dan mempresentasikannya), dan `Merefleksi` (murid menyimpulkan dan memverifikasi pemahaman bersama guru).

---

## Langkah Kerja Agen (Wajib Diikuti Berurutan)

### Langkah 1: Ekstraksi Isi Berkas Media (`.pptx`, `.ppt`, `.html`, `.pdf`)

1. **Jalankan Skrip Ekstraktor Bawaan** untuk berkas `.pptx`, `.ppt`, `.html`, `.htm`, atau `.pdf`:
   ```powershell
   node "C:\Users\Tito\.gemini\config\skills\ekstraktor-media-modul-ajar\scripts\ekstrak_media.cjs" "<path_berkas_1>" ["<path_berkas_2>" ...]
   ```
   - Skrip [ekstrak_media.cjs](./scripts/ekstrak_media.cjs) mengekstrak seluruh slide XML `.pptx` (`ppt/slides/slide*.xml` dan *speaker notes*), mengekstrak bagian-bagian `.html`, serta mendekode stream teks `.pdf` secara lengkap.
2. **Khusus Berkas `.pdf` (Multimodal / Font Khusus / Pindaian)**:
   - Gunakan tool `read_file` bawaan Gemini langsung pada path berkas `.pdf` tersebut untuk membaca seluruh halaman, teks, rumus, tabel, contoh soal, dan ayat secara presisi tanpa ada yang terlewat.

---

### Langkah 2: Verifikasi & Pelengkapan Ayat Al-Qur'an Per Pertemuan

Parser `ekstrakAyatDariBahanAjar_` di `Code.gs` dan `ekstrakAyatDariBahanAjarClient` di `index.html` memetakan ayat secara otomatis ke `ayat1`, `ayat2`, dst. Oleh karena itu:
1. Periksa apakah di setiap pertemuan sudah terdapat **Ayat Al-Qur'an atau Hadits**.
2. **Jika di dalam PPT/PDF/HTML hanya tertulis nama surah dan nomor ayat** atau **jika belum ada ayat sama sekali** pada media tersebut:
   - **WAJIB lengkapi langsung** di dalam hasil ekstraksi dengan format utuh satu baris:
     `Ayat Pertemuan N: QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [1-2 kalimat keterkaitan ilmiah dengan sub-topik Pertemuan N]`

---

### Langkah 3: Susun Paket Prompt Rujukan Bahan Ajar Lengkap (Siap Tempel ke `#aiBahanAjar`)

Susun hasil akhir mengikuti format baku pada [template_prompt_deepseek.md](./resources/template_prompt_deepseek.md) dan [instruksi_gem_gemini_app.md](./resources/instruksi_gem_gemini_app.md):
- Gunakan penanda `[BERKAS EKSTRAKSI: ...]`, `Topik Utama:`, dan `Kelas:` di bagian paling atas.
- Gunakan header `[MEDIA PERTEMUAN 1]`, `[MEDIA PERTEMUAN 2]`, dst.
- Cantumkan baris `Sub-Topik Pertemuan N: ...` dan `Ayat Pertemuan N: ...` tepat di bawah `[MEDIA PERTEMUAN N]`.
- Sertakan 5 sub-bagian lengkap per pertemuan:
  1. `--- 1. PENGANTAR / KONTEKS PEMANTIK YANG TERTULIS DI MEDIA (BAHAN APERSEPSI) ---`
  2. `--- 2. INTEGRASI NILAI KEISLAMAN & AYAT/HADITS ---`
  3. `--- 3. ISI LENGKAP MATERI PER SLIDE / HALAMAN (100% FAKTUAL DARI MEDIA) ---`
  4. `--- 4. SKENARIO TRANSFORMASI STUDENT-CENTERED (MEMAHAMI, MENGAPLIKASI, MEREFLEKSI BERBASIS ISI MEDIA) ---`
  5. `--- 5. ACUAN TUGAS & EVALUASI FORMATIF (SESUAI ISI MEDIA TANPA OBSERVASI SIKAP) ---`

---

### Langkah 4: Penyajian Output kepada Pengguna

Tampilkan hasil akhir di dalam satu blok kode Markdown (```` ```text ... ``` ````) yang mudah disalin (*one-click copy*) oleh guru untuk ditempelkan langsung ke kolom **Prompt Tambahan / Rujukan Bahan Ajar (`#aiBahanAjar`)** di Generator Modul Ajar.
