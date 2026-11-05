---
name: ekstraktor-media-modul-ajar
description: >-
  Membaca dan mengekstrak media pembelajaran eksternal (PPT/PPTX, PDF, atau HTML) menjadi
  Paket Prompt Rujukan Bahan Ajar 5 Bagian (Pengantar & Prasyarat, Integrasi Ayat/Hadits,
  Ekstraksi Lengkap Per Slide/Halaman dengan Rumus Unicode, Skenario Pembelajaran Mendalam
  Deep Learning Student-Centered, serta Acuan Asesmen Diagnostik Awal & Formatif) yang bebas
  karangan fiktif, memeriksa potensi miskonsepsi di media, dan 100% kompatibel dengan parser
  Generator Modul Ajar. Gunakan skill ini saat pengguna memberikan berkas .ppt, .pptx, .pdf,
  atau .html eksternal atau meminta pembuatan prompt bahan ajar untuk Generator Modul Ajar.
---

# Ekstraktor Media Pedagogis Generator Modul Ajar

Skill ini berfungsi sebagai **Pra-Pemroses (Pre-Processor) Cerdas** yang membaca berkas media pembelajaran eksternal (`.pdf`, `.pptx`, `.ppt`, `.html`) menjadi teks terstruktur 5 Bagian yang lengkap, faktual, dan siap ditempelkan ke kolom `#aiBahanAjar` pada aplikasi Generator Modul Ajar.

---

## Alur Kerja Agen (Wajib Diikuti Berurutan)

### Langkah 1: Baca Berkas Media & Deteksi Potensi Miskonsepsi

1. **Jalankan Skrip Ekstraktor Bawaan** untuk berkas `.pptx`, `.ppt`, `.html`, `.htm`, atau `.pdf`:
   ```powershell
   node "C:\Users\Tito\.gemini\config\skills\ekstraktor-media-modul-ajar\scripts\ekstrak_media.cjs" "<path_berkas_1>" ["<path_berkas_2>" ...]
   ```
2. **Khusus Berkas `.pdf` atau Gambar Slide**:
   - Gunakan tool `read_file` langsung pada path berkas `.pdf` agar seluruh halaman, rumus, tabel, grafik, dan teks pindaian terbaca utuh.
   - Jika terdapat bagian buram/terpotong yang tidak terbaca, tandai secara jujur dengan `[Tidak terbaca pada Slide/Halaman X: ...]` (dilarang menebak).
3. **Pemeriksaan Akurasi Ilmiah & Potensi Miskonsepsi**:
   - Periksa apakah di dalam slide/PDF terdapat kekeliruan konsep, salah ketik rumus, atau kesalahan hitungan yang dapat memicu miskonsepsi pada murid.
   - **Wajib sampaikan komentar temuan miskonsepsi di luar blok kode prompt** (sebelum menghasilkan prompt) beserta nomor slide/halamannya agar guru dapat memperbaiki berkas medianya. Di dalam blok prompt, tuliskan konsep yang sudah diluruskan secara ilmiah.

---

### Langkah 2: Klarifikasi Pra-Ekstraksi (Jika Informasi Belum Lengkap)

Jika pengguna belum menyebutkan lengkap **(1) Kelas (10/11/12)**, **(2) Jumlah Pertemuan (beserta pemetaan berkasnya jika >1 berkas)**, dan **(3) Alokasi Waktu (JP per pertemuan)**:
1. Sampaikan terlebih dahulu **Ringkasan Isi Berkas** dan **Komentar Cek Miskonsepsi** (jika ada).
2. **Tanyakan konfirmasi ketiga hal tersebut kepada guru** (sambil memberikan rekomendasi pembagian pertemuan yang ideal berdasarkan kepadatan sub-topik/jumlah slide) sebelum menghasilkan blok kode prompt akhir.
3. Jika pengguna sudah menyebutkan Kelas, Jumlah Pertemuan, dan Alokasi Waktu sejak awal, langsung lanjutkan ke Langkah 3.

---

### Langkah 3: Penyusunan Paket Prompt Rujukan Bahan Ajar (5 Bagian)

Susun hasil akhir mengikuti struktur baku pada [template_prompt_deepseek.md](./resources/template_prompt_deepseek.md) dan [instruksi_gem_gemini_app.md](./resources/instruksi_gem_gemini_app.md):

1. **Batas Fakta Media vs Transformasi Pedagogis**:
   - **Fakta Media (100% Sesuai Berkas)**: Ekstrak seluruh materi, definisi, teori, rumus, tabel, contoh soal, dan latihan soal secara lengkap tanpa pemotongan. Dilarang mengklaim adanya simulasi, praktikum, tabel pengamatan, atau kuis interaktif jika tidak ada di dalam berkas media.
   - **Transformasi Pedagogis**: Rumuskan Tujuan Pembelajaran, pertanyaan pemantik & diagnostik awal, skenario **Pembelajaran Mendalam (*Deep Learning*: Memahami, Mengaplikasi, Merefleksi)** yang berpusat pada murid (*Student-Centered*), serta lengkapi `[Kunci & Pembahasan Rujukan]` untuk soal latihan di media yang belum memiliki jawaban.
   - **Adaptif terhadap Jenis Media**: Jika media berupa materi paparan/ceramah, transformasikan menjadi telaah konsep dan diskusi pemecahan masalah kolaboratif oleh murid. Jika media sudah memiliki simulasi/LKPD/kuis bawaan, pertahankan dan integrasikan fitur asli tersebut secara utuh.
2. **Aturan Ayat Al-Qur'an & Hadits Per Pertemuan**:
   - Jika di dalam media sudah ada ayat/hadits, wajib gunakan ayat/hadits dari media tersebut.
   - Jika belum ada di media, pilihkan 1 Ayat Al-Qur'an (boleh ayat kauniyah/sains yang relevan) atau Hadits (wajib mencantumkan perawi & berderajat Shahih/Hasan) tanpa perlu memberi label pembeda di dalam prompt.
   - Verifikasi keakuratan rasm dan harakat teks Arab, lalu tuliskan pada baris `Ayat Pertemuan N:` dalam **satu baris utuh menggunakan pemisah pipa (`|`)** tanpa tanda `-` atau `—` di sekitar teks Arab.
3. **Format Rumus, Tabel, & Kerapian Teks**:
   - Gunakan **Unicode ilmiah** (`H₂O`, `SO₄²⁻`, `Mg²⁺`, `ΔH`, `→`, `⇌`, `×`, `°C`) tanpa sintaks LaTeX (`$...$`, `\frac{}{}`).
   - Sajikan tabel dengan pemisah pipa (`| Kolom 1 | Kolom 2 |`).
   - Hindari penggunaan tanda `—` dan kurangi penggunaan `-` yang tidak perlu.
4. **Struktur 5 Bagian Per Pertemuan**:
   - `[BAGIAN 1: PENGANTAR, MATERI PRASYARAT, & PEMANTIK APERSEPSI]`
   - `[BAGIAN 2: INTEGRASI NILAI KEISLAMAN & AYAT/HADITS]`
   - `[BAGIAN 3: EKSTRAKSI LENGKAP MATERI PER SLIDE / HALAMAN (FAKTUAL DARI MEDIA)]`
   - `[BAGIAN 4: SKENARIO PEMBELAJARAN MENDALAM (DEEP LEARNING: STUDENT-CENTERED)]`
   - `[BAGIAN 5: ACUAN ASESMEN DIAGNOSTIK AWAL & FORMATIF FLEKSIBEL (SIAP RUBRIK, TANPA OBSERVASI SIKAP)]` (Memuat Diagnostik Awal serta Formatif 1..N yang jenis tagihannya fleksibel mengikuti isi nyata media—tidak memaksakan LKPD/Simulasi jika tidak ada—dilengkapi `(Kriteria Rubrik: [2-3 aspek penilaian objektif])` untuk mempermudah pembuatan rubrik penilaian guru).

---

### Langkah 4: Pemeriksaan Mandiri (*Self-Check*) & Penyajian Output

Sebelum menampilkan hasil akhir:
- Pastikan komentar cek miskonsepsi (jika ada) ditampilkan **di luar** blok kode.
- Sajikan Paket Prompt di dalam satu blok kode Markdown (```` ```text ... ``` ````). Jika jumlah pertemuan > 2 dan materi sangat panjang (mendekati batas `#aiBahanAjar` 60.000 karakter), pecah per blok pertemuan agar tidak terpotong.
