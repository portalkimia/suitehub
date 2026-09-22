# Pengumpulan tugas v2

## Mengaktifkan

1. Cadangkan kode GAS yang sedang aktif, lalu ganti isi `Code.gs` di editor Apps Script dengan `Code.gs` dari folder ini. Fungsi pengelolaan materi tetap disertakan. Jangan menambahkan `submission-backend.js` sebagai file GAS kedua: fungsinya sudah digabung ke `Code.gs`.
2. Pilih Deploy → Manage deployments → Edit → New version → Deploy pada deployment yang sama. URL lama tetap dipakai oleh media. Jangan menjalankan `setupInitialSheet()`, karena fungsi setup lama mengosongkan sheet BahanAjar.
3. Ganti HTML media di tempat yang digunakan siswa, termasuk salinan Drive. Untuk hosting lokal/Pages, sertakan `sw.js` baru. Setiap HTML sudah membawa kode pengiriman sehingga tidak perlu mengunggah JavaScript tambahan ke Drive.
4. Uji dengan identitas `UJI GURU`: isi tabel LKS, semua esai, refleksi, serta kuis. Tekan kirim dan tunggu bukti pengumpulan. Periksa ID yang sama di RekapPengumpulan dan sheet Tugas media terkait. Uji ulang saat jaringan putus dan pulih.

Perubahan lokal belum mengubah deployment GAS atau file di Drive/GitHub. Sampai langkah 1–3 dilakukan, sistem online masih menggunakan versi lama.

## Penyimpanan

- `TugasSiswa` lama tetap utuh. Pengumpulan baru masuk ke `RekapPengumpulan` dan sheet `Tugas_*` berdasarkan ID media.
- Sel Volta menyimpan 50 isian pengamatan (10 sel × 5 kolom), empat esai, refleksi, dan detail jawaban kuis.
- Elektrolisis menyimpan delapan LKPD. Media lain menyimpan setiap isian LKS, esai, dan refleksi sesuai ID pertanyaan, termasuk input dinamis dan versi ponsel.
- Kolom bertambah ketika ada jenis jawaban baru; kolom dan baris lama tidak dihapus. Isian simulasi lain disimpan terpisah.
- `Data JSON Lengkap` menyimpan paket asli. Teks panjang dipecah ke kolom lanjutan bernomor, tidak dipotong. Gabungkan bagian sesuai nomor untuk membaca kembali JSON. Paket di atas 400.000 karakter ditolak dengan pesan jelas dan tetap berada di perangkat.
- `Hash Data` dan `Hash Bukti` dipakai untuk pemeriksaan kiriman. Status pengiriman hanya membocorkan bukti simpan, bukan identitas/jawaban siswa.
- Nilai kuis berasal dari perhitungan media; fitur ini belum merupakan penilaian anti-manipulasi server atau koreksi esai otomatis.

## Pengiriman dan percobaan ulang

- POST mengirim jawaban lengkap. Tidak ada pengiriman jawaban siswa melalui URL GET.
- Bila respons POST tidak dapat dibaca, media mengecek bukti lewat endpoint `submissionStatus`. Status berhasil hanya muncul setelah detail dan rekap tersimpan.
- Kiriman tertunda tetap disimpan di browser. Saat koneksi kembali, kiriman yang pernah diajukan dicoba ulang; pada kunjungan berikutnya tersedia tombol kirim ulang.
- ID yang sama tidak menghasilkan baris ganda. Kiriman dengan jawaban yang berubah mendapat ID baru. Kegagalan sesudah detail tersimpan dapat diperbaiki lewat percobaan ulang tanpa menduplikasi detail.
- Jangan bersihkan penyimpanan browser sebelum kiriman tertunda terkonfirmasi. Menyimpan draf lokal saja tidak otomatis mengirim data.
- Format lama (`essay1`, `lkpd`, `tableObs`, `laporanTeks`, `reflection`, `answers`) masih diterima GAS. Laporan teks versi lama disimpan apa adanya; kolom terstruktur memerlukan HTML baru.

## Jawaban lama yang hilang

Data yang dahulu diabaikan GAS tidak dapat dipulihkan dari sheet. Untuk Sel Volta, minta siswa membuka alamat media yang sama pada browser/perangkat yang sama; bila autosave masih tersedia, jawaban dapat dimuat lalu dikirim kembali melalui versi baru. Hindari tombol reset/bersihkan data. Cadangkan laporan lewat email atau salinan teks jika diperlukan.

## Pemeliharaan

Ubah `submission-client.js` dan `submission-backend.js`, lalu jalankan `node build-submissions.cjs` untuk memperbarui HTML mandiri dan Code.gs. Jalankan `node test-submissions.cjs` sebelum memasang hasilnya.

Penambahan media: beri ID tetap pada daftar `rules` di build-submissions.cjs dan nama sheet pada `PK_MEDIA` di submission-backend.js. Gunakan ID isian konsisten (`essay-*`, `lks-*`, `lkpd-*`, `ref-*`). Pengambilan jawaban membaca formulir saat tombol kirim ditekan, bukan menunggu autosave.
