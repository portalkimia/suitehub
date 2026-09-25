# Pemeriksaan dan keandalan Generator (v2)

- Isi CP dan sumber/versinya pada formulir. Pemeriksa otomatis menampilkan kelengkapan serta bukti istilah yang menghubungkan CP, tujuan, ITP, aktivitas, asesmen dan pertemuan. Hasilnya adalah bantuan tinjauan, bukan pengesahan semantik kurikulum.
- Pustaka awal memuat QS. Ar-Rahman 55:9 dan kutipan awal Sahih al-Bukhari 1. Teks, bahasa terjemahan, konteks, sumber, dan tanggal verifikasi ditampilkan. Kutipan hadis memiliki terjemahan sumber berbahasa Inggris. AI tidak diminta menulis teks/terjemahan agama baru; server mengisi kolom ayat dari pustaka yang dipilih. Kolom kutipan dikunci di antarmuka. Perluasan pustaka harus melalui pemeriksaan sumber.
- PDF/gambar maksimal 5 MB, teks/HTML/Markdown maksimal 1 MB. Ekstensi, MIME dan tanda pengenal biner diperiksa di browser dan GAS. Jangan unggah data pribadi siswa. Persetujuan privasi wajib untuk pembuatan AI maupun Co-Pilot; ini bukan deteksi/redaksi data pribadi otomatis.
- Isi dokumen yang sama mempertahankan requestId di browser. GAS menyimpan status permintaan, sidik isi, dan ID file. Retry mengembalikan dokumen yang sama. Jika eksekusi berhenti setelah menyalin template, file dipulihkan berdasarkan nama unik requestId. Jangan menghapus Script Properties GEN_DOC_* atau mengganti nama file yang masih diproses. Penghapusan data browser atau penggunaan perangkat lain menghasilkan ID permintaan baru.
- Template diperiksa sebelum penyalinan: Topik/Kelas/Tujuan wajib, bagian ITP/pertemuan terisi harus memiliki placeholder, placeholder tidak dikenal ditolak. CP dan SumberCP diisi pada form sebagai konteks instruksi dan pemeriksaan keselarasan (tidak menggunakan placeholder cetak). Placeholder pada header/footer perlu dipindahkan ke badan dokumen. Pemeriksaan sisa placeholder dijalankan sebelum dokumen dinyatakan selesai.
- Salin Code.gs dan index.html terbaru ke proyek GAS bila memakai antarmuka GAS. Untuk GitHub Pages unggah frontend dari folder generator. Deploy GAS ke versi baru pada deployment yang sama. API key dan token yang sudah ada tetap dapat digunakan.
- Jalankan `periksaTemplateGenerator()` langsung dari editor GAS untuk menguji dua template asli. Tanpa argumen, fungsi ini memverifikasi bahwa pengguna aktif sama dengan pemilik eksekusi. Fungsi juga dapat dipanggil frontend dengan token guru. Alternatif internal `periksaTemplateGenerator_()` tetap tersedia. Fungsi pembuat token bernama `buatTokenAksesGuru_()`; token lama tidak perlu diganti.

## Pengujian

Jalankan `node test-generator.cjs` dari folder Generator. Pengujian meliputi sintaks, keutuhan prompt, manifest dan tautan lokal, placeholder, respons AI, keselarasan, unggahan, autentikasi, retry pembuatan dokumen, dan pemulihan setelah gagal. Drive/Gemini menggunakan tiruan sehingga tes tidak menghabiskan kuota atau membuat file sungguhan.

`node test-generator-browser.cjs` menjalankan uji browser. Memerlukan Playwright dan Microsoft Edge; koneksi eksternal ditiru. Template Drive dan deployment GAS sesungguhnya perlu diuji setelah pembaruan deployment.

## Sumber pustaka

- https://quran.com/id/ar-rahman/9
- https://sunnah.com/bukhari:1
