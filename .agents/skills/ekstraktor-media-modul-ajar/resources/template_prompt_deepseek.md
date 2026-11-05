# Template Paket Prompt Rujukan Bahan Ajar (5 Bagian, Adaptif, & Kompatibel `Code.gs`)

Format di bawah ini dirancang agar **100% terbaca oleh mesin parser deterministik di `Code.gs` dan `index.html`** (`ekstrakAyatDariBahanAjar_`, `susunInstruksiAyatPerPertemuan_`, `harmonisasiOutputAI_`, `normalizeAI_`, serta `terapkanMetadataEkstraksiKeForm`), menyajikan isi berkas media secara **lengkap dengan rumus Unicode ilmiah**, **bebas tanda `-`/`—` yang merusak RTL**, serta **memuat Diagnostik Awal + Formatif 1 & 2**.

Salin hasil berformat di bawah ini ke kolom **Prompt Tambahan / Rujukan Bahan Ajar (`#aiBahanAjar`)** pada aplikasi Generator Modul Ajar:

```text
[BERKAS EKSTRAKSI: Nama_File_1.pptx, Nama_File_2.pdf]
Topik Utama: <Topik Utama Materi Pembelajaran>
Kelas: <10 / 11 / 12>
Alokasi Waktu: <Misal: 2 Pertemuan x 2 JP (2 x 45 menit)>
INSTRUKSI KHUSUS MEDIA & BAHAN AJAR:
1. Seluruh konsep, rumus, data, contoh, dan soal pada Bagian 3 berasal dari berkas media guru. Jangan menambahkan simulasi, praktikum, tabel pengamatan, atau kuis yang tidak tercantum pada rincian pertemuan di bawah ini.
2. Gunakan "Ayat Pertemuan 1" untuk mengisi field "ayat1", "Ayat Pertemuan 2" untuk mengisi field "ayat2", dan seterusnya secara utuh.
3. Susun langkah pembelajaran mengikuti kerangka Pembelajaran Mendalam (Deep Learning: Memahami, Mengaplikasi, Merefleksi) yang berpusat pada murid sesuai Bagian 4 secara mendetail.
4. Susun tabel ITP dan Asesmen merujuk pada Bagian 5 (Baris 1 wajib Asesmen Diagnostik Awal, diikuti Asesmen Formatif 1 dan Formatif 2 setiap pertemuan tanpa asesmen observasi sikap).

[MEDIA PERTEMUAN 1]
Berkas Sumber: <Nama Berkas Pertemuan 1> | Cakupan: <Slide/Halaman yang dipelajari pada Pertemuan 1>
Sub-Topik Pertemuan 1: <Sub-Topik Spesifik Pertemuan 1>
Ayat Pertemuan 1: <QS. Nama Surah Ayat Nomor atau HR. Perawi (Derajat)> | <Teks Arab Lengkap Berharakat> | Artinya: "<Terjemahan Bahasa Indonesia>" | Keterkaitan Materi: <1 sampai 2 kalimat kaitan ilmiah/tadabbur dengan sub-topik Pertemuan 1>
Tujuan Pembelajaran Rujukan: Murid mampu <rumusan tujuan pembelajaran spesifik pertemuan 1>
Pemanfaatan Digital: <Deskripsi faktual media digital yang digunakan pada pertemuan 1>
Karakteristik Faktual Media Pertemuan 1: <Tipe Media (Materi Paparan / Media Interaktif) beserta daftar jujur komponen yang ada dan tidak ada di dalam berkas>

[BAGIAN 1: PENGANTAR, MATERI PRASYARAT, & PEMANTIK APERSEPSI]
1. Materi Prasyarat: <Konsep prasyarat yang perlu dikuasai murid>
2. Konteks Pengantar dari Media: <Pengantar atau contoh pembuka yang tertulis di bagian awal media pertemuan 1>
3. Pertanyaan Pemantik Diskusi Awal: <2 pertanyaan pemantik berbasis pengantar media>

[BAGIAN 2: INTEGRASI NILAI KEISLAMAN & AYAT/HADITS]
<QS. Nama Surah Ayat Nomor atau HR. Perawi (Derajat)> | <Teks Arab Lengkap Berharakat> | Artinya: "<Terjemahan Bahasa Indonesia>" | Keterkaitan Materi: <Penjelasan tadabbur sains sesuai materi pertemuan 1>

[BAGIAN 3: EKSTRAKSI LENGKAP MATERI PER SLIDE / HALAMAN (FAKTUAL DARI MEDIA)]
<Rincian lengkap dan terurut seluruh konsep, definisi, rumus (format Unicode ilmiah seperti H₂O, Mg²⁺, ΔH, →, ⇌ tanpa LaTeX), tabel pipa (| Kolom 1 | Kolom 2 |), deskripsi faktual gambar/grafik, penanda [Tidak terbaca pada Slide/Halaman X] jika buram, contoh soal, serta soal latihan beserta [Kunci & Pembahasan Rujukan]>

[BAGIAN 4: SKENARIO PEMBELAJARAN MENDALAM (DEEP LEARNING: STUDENT-CENTERED)]
1. Fase Memahami (Mindful & Meaningful Exploration): <Skenario murid secara berkelompok menelaah dan membedah konsep/rumus/bagan/simulasi pada Slide/Halaman media dengan scaffolding pendidik>
2. Fase Mengaplikasi (Collaborative Problem Solving): <Skenario murid berdiskusi memecahkan contoh soal/kasus/LKPD/latihan nyata yang tertulis pada Slide/Halaman media dan mempresentasikan argumennya>
3. Fase Merefleksi (Synthesis & Confirmation): <Skenario murid menyimpulkan benang merah materi dari slide/halaman media dan melakukan verifikasi konsep bersama pendidik>

[BAGIAN 5: ACUAN ASESMEN DIAGNOSTIK AWAL & FORMATIF (TANPA OBSERVASI SIKAP)]
1. Asesmen Diagnostik Awal (Acuan Baris 1 Tabel ITP & Kegiatan Awal): <Tanya-jawab singkat mengecek penguasaan materi prasyarat beserta 2 contoh pertanyaan diagnostik>
2. Asesmen Formatif 1 (Unjuk Kerja Kelompok / Diskusi Konsep / LKPD): <Rujukan penilaian diskusi konsep/analisis contoh soal/LKPD yang ada di media>
3. Asesmen Formatif 2 (Evaluasi Mandiri / Latihan Soal): <Rincian penilaian soal latihan/evaluasi pemahaman konsep dari materi pertemuan 1>
```

> **Catatan Jika Lebih dari 1 Pertemuan:**
> Lanjutkan di bawahnya dengan blok `[MEDIA PERTEMUAN 2]`, `Sub-Topik Pertemuan 2: ...`, `Ayat Pertemuan 2: ...`, serta `[BAGIAN 1]` s.d. `[BAGIAN 5]` sesuai jumlah pertemuan.
