# Template Paket Prompt Rujukan Bahan Ajar (100% Faktual, Lengkap, & Student-Centered)

Format di bawah ini dirancang khusus agar **100% terbaca oleh mesin ekstraktor deterministik di `Code.gs` dan `index.html`** (`ekstrakAyatDariBahanAjar_`, `susunInstruksiAyatPerPertemuan_`, `harmonisasiOutputAI_`, `normalizeAI_`, serta `terapkanMetadataEkstraksiKeForm`), menyajikan isi berkas media secara **lengkap tanpa pemotongan**, **bebas karangan/halusinasi**, dan **mentransformasikan materi ceramah menjadi aktivitas Student-Centered**.

Salin hasil berformat di bawah ini ke kolom **Prompt Tambahan / Rujukan Bahan Ajar (`#aiBahanAjar`)** pada aplikasi Generator Modul Ajar:

```text
[BERKAS EKSTRAKSI: Nama_File_1.pptx, Nama_File_2.pdf]
Topik Utama: [Topik Utama Materi Pembelajaran Sesuai Isi Media]
Kelas: [10 / 11 / 12]
INSTRUKSI KHUSUS MEDIA & BAHAN AJAR (ANTI-MENGARANG & STUDENT-CENTERED MAKSIMAL):
- PENTING (DILARANG MENGARANG): Rujukan di bawah ini adalah isi faktual dari berkas media yang diunggah guru. DILARANG KERAS mengarang simulasi, praktikum, tabel pengamatan, atau kuis yang tidak tertulis di bawah ini!
- TRANSFORMASI STUDENT-CENTERED: Walaupun media berupa slide/PDF materi paparan, rancang langkah pembelajaran (awal, memahami, mengaplikasi, merefleksi, penutup) yang 100% berpusat pada murid (murid aktif menelaah slide/halaman materi, berdiskusi membedah konsep/rumus/contoh soal yang ada di media, dan mempresentasikan temuannya) secara MENDETAIL dan MAKSIMAL.
- Gunakan "Ayat Pertemuan 1" -> field "ayat1", "Ayat Pertemuan 2" -> field "ayat2", dst. lengkap dengan Teks Arab, Terjemahan Indonesia, dan keterkaitan materi.
- Rancang Asesmen (1 Diagnostik Awal + Formatif sesuai latihan/contoh nyata yang ada di media tanpa observasi sikap).

[MEDIA PERTEMUAN 1]
Berkas Sumber: [Nama Berkas Pertemuan 1] ([Jenis Media Faktual: Slide Presentasi PPT / Modul Bacaan PDF / Media HTML])
Sub-Topik Pertemuan 1: [Sub-Topik Spesifik Pertemuan 1 Sesuai Media]
Ayat Pertemuan 1: QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [1-2 kalimat kaitan ilmiah/tadabbur dengan sub-topik Pertemuan 1]
Tujuan Pembelajaran Rujukan: Murid mampu [rumusan tujuan pembelajaran spesifik berdasarkan isi nyata media pertemuan 1]
Pemanfaatan Digital: [Deskripsi jujur media digital yang digunakan pada pertemuan 1]
Karakteristik Faktual Media Pertemuan 1: [Penjelasan jujur apa yang ADA dan TIDAK ADA di dalam berkas media]

--- 1. PENGANTAR / KONTEKS PEMANTIK YANG TERTULIS DI MEDIA (BAHAN APERSEPSI) ---
[Pengantar, latar belakang, atau contoh pembuka yang benar-benar tertulis di bagian awal media, beserta cara menjadikannya pertanyaan pemantik diskusi murid]

--- 2. INTEGRASI NILAI KEISLAMAN & AYAT/HADITS ---
QS. [Nama Surah]: [Nomor Ayat] - [Teks Arab Lengkap Berharakat] ("[Terjemahan Bahasa Indonesia]") — [Penjelasan tadabbur sains sesuai materi pertemuan 1]

--- 3. ISI LENGKAP MATERI PER SLIDE / HALAMAN (100% FAKTUAL DARI MEDIA) ---
[Rincian lengkap dan mendetail seluruh konsep, definisi, rumus, tabel, bagan, contoh soal, dan latihan soal dari setiap Slide/Halaman pada media pertemuan 1 tanpa pemotongan dan tanpa tambahan karangan]

--- 4. SKENARIO TRANSFORMASI STUDENT-CENTERED (MEMAHAMI, MENGAPLIKASI, MEREFLEKSI BERBASIS ISI MEDIA) ---
- Aktivitas Memahami (Student-Centered): [Skenario murid secara berkelompok menelaah dan membedah konsep/rumus/bagan pada Slide/Halaman media dengan scaffolding guru]
- Aktivitas Mengaplikasi (Student-Centered): [Skenario murid berdiskusi memecahkan contoh soal/kasus/latihan nyata yang tertulis pada Slide/Halaman media dan mempresentasikan argumennya]
- Aktivitas Merefleksi (Student-Centered): [Skenario murid menyimpulkan benang merah materi dari slide/halaman media dan melakukan verifikasi konsep bersama guru]

--- 5. ACUAN TUGAS & EVALUASI FORMATIF (SESUAI ISI MEDIA TANPA OBSERVASI SIKAP) ---
- Acuan Formatif 1 (Diskusi / Kerja Kelompok Murid): [Rujukan tugas diskusi konsep/analisis contoh soal yang ada di media]
- Acuan Formatif 2 (Latihan / Evaluasi Mandiri): [Rincian soal latihan/evaluasi dari materi yang tertulis di media]
```

> **Catatan Jika Lebih dari 1 Pertemuan:**
> Lanjutkan di bawahnya dengan blok `[MEDIA PERTEMUAN 2]`, `Sub-Topik Pertemuan 2: ...`, `Ayat Pertemuan 2: ...`, dst. sesuai jumlah pertemuan.
