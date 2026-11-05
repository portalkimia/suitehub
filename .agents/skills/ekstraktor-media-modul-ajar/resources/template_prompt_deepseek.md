# Template Paket Prompt Pedagogis Ringkas (Kompatibel `Code.gs` & Hemat Token DeepSeek)

Format di bawah ini dirancang khusus agar **100% terbaca oleh mesin ekstraktor deterministik di `Code.gs` dan `index.html`** (`ekstrakAyatDariBahanAjar_`, `susunInstruksiAyatPerPertemuan_`, `harmonisasiOutputAI_`, `normalizeAI_`, serta `ekstrakAyatDariBahanAjarClient`), sekaligus memangkas ukuran karakter hingga **85% lebih hemat token** dibanding unggahan mentah.

Salin hasil berformat di bawah ini ke kolom **Prompt Tambahan / Rujukan Bahan Ajar (`#aiBahanAjar`)** pada aplikasi Generator Modul Ajar:

```text
[BERKAS EKSTRAKSI: Nama_File_1.pptx, Nama_File_2.pdf]
INSTRUKSI KHUSUS MEDIA & BAHAN AJAR (MODE HEMAT TOKEN DEEPSEEK):
- Rujukan di bawah ini telah diekstraksi dan dipadatkan dari media pembelajaran per pertemuan.
- Gunakan "Ayat Pertemuan 1" -> field "ayat1", "Ayat Pertemuan 2" -> field "ayat2", dst.
- Pemanfaatan Digital (digital): Sebutkan media yang digunakan secara fleksibel (misal: Slide Presentasi Interaktif / Canva / Media HTML Interaktif / LKPD Digital / Liveworksheets).

[MEDIA PERTEMUAN 1]
Berkas Sumber: [Nama Berkas Pertemuan 1] ([Jenis Media: PPTX / PDF / HTML Interaktif])
Sub-Topik Pertemuan 1: [Sub-Topik Spesifik Pertemuan 1]
Ayat Pertemuan 1: QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [1-2 kalimat kaitan ilmiah/tadabbur dengan sub-topik Pertemuan 1]
Tujuan Pembelajaran Rujukan: Murid mampu [rumusan tujuan pembelajaran spesifik pertemuan 1]

--- 1. STIMULUS FENOMENA NYATA (APERSEPSI) ---
[Ringkasan 2-3 kalimat fenomena kontekstual / masalah nyata di awal pertemuan 1]

--- 2. INTEGRASI NILAI KEISLAMAN & AYAT/HADITS ---
QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [Penjelasan tadabbur sains sesuai materi pertemuan 1]

--- 3. FITUR SIMULASI / KEGIATAN INTI (MEMAHAMI & MENGAPLIKASI) ---
- Memahami: [Ringkasan eksplorasi konsep / slide / visualisasi pada media pertemuan 1]
- Mengaplikasi: [Ringkasan aktivitas eksperimen virtual / latihan terstruktur / analisis kasus pada media pertemuan 1]

--- 4. LEMBAR KERJA PESERTA DIDIK (LKPD) & TABEL PENGAMATAN ---
[Ringkasan tugas diskusi kelompok / tabel pengamatan / latihan soal kolaboratif pada media pertemuan 1]

--- 5. EVALUASI / KUIS FORMATIF ---
[Ringkasan kuis interaktif / soal latihan evaluasi mandiri pada media pertemuan 1]

--- 6. INTISARI MATERI PERTEMUAN 1 (TERKOMPRESI HEMAT TOKEN) ---
[Poin-poin padat konsep kunci, rumus, atau klasifikasi materi pada pertemuan 1, maksimal 1.000 - 1.500 karakter]
```

> **Catatan Jika Lebih dari 1 Pertemuan:**
> Lanjutkan di bawahnya dengan blok `[MEDIA PERTEMUAN 2]`, `Sub-Topik Pertemuan 2: ...`, `Ayat Pertemuan 2: ...`, dst. sesuai jumlah pertemuan.
