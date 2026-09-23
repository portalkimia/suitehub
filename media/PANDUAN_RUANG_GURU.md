# Ruang Guru, tugas, dan pengumpulan final

## Aktivasi sekali saja

1. Cadangkan kode GAS aktif. Ganti `Code.gs` dengan versi lokal baru. Kode di `teacher-backend.js` dan `submission-backend.js` sudah digabung; jangan menambahkannya lagi sebagai file GAS.
2. Tambahkan file HTML di Apps Script bernama **Guru**, lalu tempel isi `Guru.html`.
3. Pada **Project Settings → Script Properties**, tambahkan **TEACHER_PASSWORD** dengan kata sandi baru minimal 12 karakter. Jangan gunakan PIN lama portal, jangan menaruh kata sandi di HTML, dan jangan membagikannya kepada siswa. Akses baru diperiksa server, bukan status mode guru di localStorage.
4. Pertahankan `GEMINI_API_KEY` dan `GEMINI_MODELS`. Dari daftar fungsi di editor Apps Script, pilih **setupAnalisisAI**, lalu tekan **Run** sekali. Fungsi yang terlihat ini memeriksa bahwa pelaksananya adalah pemilik skrip; pekerjaan internal tetap memakai fungsi privat berakhiran garis bawah. Setup mengganti trigger lama dengan trigger privat baru tanpa membuat duplikat.
5. Perbarui deployment yang sama ke versi baru. Unggah `index.html`, `sw.js`, dan seluruh 14 HTML dalam `Media_Pembelajaran_Kimia_Drive` ke lokasi yang digunakan siswa. Kosongkan cache hosting bila perlu. Jangan mengunggah folder cadangan.
6. Buka tautan **Ruang Guru · Hasil & Tugas** pada katalog portal, atau buka URL deployment GAS dengan `?page=Guru`. Masuk menggunakan kata sandi pada langkah 3.

Pembaruan ini baru pada file lokal; deployment GAS/Drive/GitHub tidak diubah otomatis. HTML dan GAS harus diperbarui bersama. Pengumpulan lama tanpa ID tugas/kode pribadi tidak lagi diterima oleh server baru; data lama di sheet tetap tersedia untuk diperiksa. Jika hasil lama belum masuk antrean AI, jalankan fungsi **antrekanDataTersimpanUntukAI** dari editor sebagai pemilik skrip.

## Mengisi data siswa

- Buka **Data siswa**, lalu masukkan `Kelas|NIS|Nama`, satu siswa per baris. Contoh: `XII-1|001|Andi`. Maksimal 1.000 baris per impor.
- Data disimpan pada sheet `Daftar_Siswa`. Kombinasi kelas dan NIS menjadi identitas tetap: mengimpor kombinasi yang sama memperbarui nama tanpa membuat baris ganda.
- Gunakan **Nonaktifkan** untuk siswa yang pindah atau tidak lagi diajar. Riwayat serta peserta tugas lama tidak dihapus; siswa nonaktif tidak disertakan pada tugas baru.
- Gunakan dashboard untuk menambah, mengganti nama, atau menonaktifkan siswa. Kolom ID pada sheet dibentuk otomatis dan jangan diubah manual.

## Membuat dan membagikan tugas

- Buka **Manajemen tugas**. Isi judul, media, centang satu atau beberapa kelas, tentukan tenggat serta kebijakan terlambat. Waktu di formulir mengikuti zona waktu perangkat guru dan dikirim sebagai waktu UTC.
- Saat tugas disimpan, seluruh siswa aktif pada kelas terpilih otomatis masuk ke `Peserta_Tugas` dan memperoleh kode pribadi. Tekan **Simpan & sinkronkan peserta** lagi bila Anda baru menambahkan siswa ke kelas yang sudah memiliki tugas.
- Setelah menyimpan, salin ID tugas dan bagikan kode pribadi pada masing-masing siswa. Gunakan **Ekspor kode siswa** untuk administrasi; jangan membagikan seluruh daftar kode kepada kelas.
- Siswa membuka HTML media, mengisi ID tugas dan kode pribadi pada bagian atas, lalu menekan **Periksa tugas**. Nama, kelas, dan NIS diisi sesuai daftar peserta pada server.
- Tugas dapat dibuka/ditutup dan tenggatnya diperbarui. Media dan pilihan kelas dikunci setelah tugas dibuat agar hasil tidak tercampur; buat tugas baru untuk kombinasi berbeda.
- **Izinkan revisi** membuka satu versi baru bagi peserta yang sudah mengumpulkan. Tugas tetap harus terbuka dan tenggat/kebijakan terlambat tetap berlaku. Riwayat kiriman sebelumnya tetap disimpan.

## Perilaku pengumpulan final

1. Setiap pilihan evaluasi langsung dikunci di browser, termasuk setelah muat ulang pada konteks tugas yang sama. Tidak tersedia tombol mengulang; kunci, pembahasan, serta warna benar/salah tidak tampil selama pengerjaan.
2. Tombol kirim menampilkan konfirmasi final. Batal tidak mengirim atau menghapus jawaban.
3. Setelah OK, satu salinan jawaban final disimpan sementara untuk percobaan ulang jaringan. Pengiriman ulang memakai paket dan ID yang sama.
4. Hanya setelah bukti server diterima, draf materi, jawaban evaluasi lokal, dan paket tertunda dihapus. Bukti pengumpulan dan penanda final tetap disimpan agar halaman tidak mengirim lagi. Preferensi tema serta draf media lain tidak dihapus.
5. Server mengunci satu hasil per peserta, tugas, dan revisi. Mengganti ID kiriman, menghapus penyimpanan browser, atau mengganti perangkat tidak menambah baris maupun antrean AI untuk versi yang sama. Kode pribadi dipakai untuk memeriksa kembali bukti pada perangkat baru.
6. Bila jaringan gagal atau server menolak, jawaban tidak dihapus. Tekan kirim lagi atau periksa tugas kembali setelah koneksi pulih. Jangan membersihkan data browser ketika kiriman masih tertunda.

Kode pribadi merupakan identitas akses siswa: siapa pun yang memegangnya dapat memakai hak peserta tersebut. Evaluasi HTML ini mencegah pengulangan melalui antarmuka; kunci masih ada di sumber HTML, sehingga bukan sistem ujian berpengawasan atau penilaian yang kebal modifikasi perangkat. Skor final ditetapkan guru.

## Membaca dan memeriksa hasil

- **Hasil & pemeriksaan**: cari nama/NIS, filter kelas, tugas, dan status pemeriksaan.
- **Periksa**: lihat jawaban asli dan hasil AI berdampingan. Esai dan LKS ditampilkan per isian, bukan satu JSON panjang.
- Pilih **Disetujui**, **Dikoreksi**, atau **Perlu tindak lanjut**, lalu isi nilai akhir dan catatan guru. Setiap penyimpanan dicatat pada `Riwayat_Pemeriksaan`.
- **Antrekan / coba ulang AI** hanya tersedia untuk hasil yang belum masuk antrean atau gagal. Hasil AI yang sudah selesai tidak dianalisis ulang hanya karena siswa menekan kirim kembali.
- **Peserta & kontrol pengumpulan** menunjukkan siswa yang belum mengumpulkan versi aktif. **Ekspor rekap CSV** mengambil baris sesuai filter.
- Sesi guru berlaku maksimal empat jam, tersimpan di memori halaman, dan dicabut saat keluar atau kata sandi diganti. Pergantian kata sandi dilakukan lewat Script Properties.

Sheet tambahan dibuat saat dibutuhkan: `Daftar_Siswa`, `Daftar_Tugas`, `Peserta_Tugas`, `Pemeriksaan_Guru`, dan `Riwayat_Pemeriksaan`. Sheet jawaban asli dan `Analisis_AI` tetap digunakan.

## Pengujian lokal

Jalankan `node build-submissions.cjs`, `node test-submissions.cjs`, dan `node test-teacher.cjs`.
Pengujian browser tambahan: `node test-browser.cjs` (memerlukan Playwright dan Edge; jalur dapat ditentukan lewat `PLAYWRIGHT_MODULE` dan `BROWSER_PATH`). Semua uji memakai server/data tiruan; tidak menulis ke Sheets atau memanggil Gemini sungguhan.

Setelah deployment, gunakan satu tugas uji dengan identitas guru untuk memeriksa alur aktual, izin GAS, trigger AI, serta URL media yang digunakan siswa.
