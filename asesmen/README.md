# Generator Asesmen AI — PortalKimia

Generator asesmen untuk instrumen diagnostik, formatif, sumatif, dan non-tes SMA. Frontend statis dapat di-host pada GitHub Pages; Google Apps Script menyediakan API dan penyimpanan Google Spreadsheet.

## Menjalankan

Buka `index.html` dengan Chrome atau Edge. Tidak ada proses build atau instalasi.

## Deploy Google Apps Script dan Spreadsheet

1. Buat proyek Apps Script baru di akun Google yang akan memiliki Spreadsheet.
2. Ganti isi `Code.gs` dengan berkas `Code.gs` pada folder ini.
3. Di editor Apps Script, jalankan fungsi `setupAssessmentSpreadsheet()` satu kali dan setujui izin. Lihat **Execution log** untuk URL Spreadsheet yang dibuat.
4. Buka **Project Settings → Script Properties** dan buat `ASSESSMENT_ACCESS_TOKEN` dengan token acak panjang (minimal 32 karakter). Jangan masukkan token ke repositori GitHub.
5. Tambahkan Script Property `GEMINI_API_KEY` dengan API key Google AI Studio. API key hanya digunakan di GAS, jangan ditaruh di GitHub atau browser.
6. (Opsional) Untuk DeepSeek, tambahkan Script Property `DEEPSEEK_API_KEY`. Kunci hanya digunakan di GAS. Tanpa properti ini, pilihan DeepSeek akan menghasilkan pesan konfigurasi yang jelas.
7. Pilih **Deploy → New deployment → Web app**; **Execute as: Me**, akses **Anyone**. Deploy dan salin URL yang berakhiran `/exec`.
8. Upload isi folder ini ke repositori GitHub, lalu aktifkan **Settings → Pages** untuk branch/folder yang diinginkan. `index.html` berada di root paket, jadi folder ini dapat menjadi root GitHub Pages atau diletakkan dalam subfolder situs.
9. Buka situs GitHub Pages, klik ⚙ di header, masukkan URL `/exec` dan token, lalu **Uji koneksi**. Simpan instrumen untuk menulis ke Spreadsheet; **Muat cloud** untuk menyinkronkan hingga 100 instrumen terbaru ke browser.

`config.js` boleh menyimpan URL Web App karena URL bukan rahasia. Token hanya tersimpan pada `localStorage` browser; jangan mengisi `config.js` dengan token. Endpoint ping publik tidak membuka data; operasi `save` dan `list` memerlukan token. Jika mengubah `Code.gs`, deploy versi baru dari pengelolaan deployment.

Spreadsheet dibuat dengan tab `Instrumen_Asesmen`. Setiap baris memuat ID, jenis, topik, kelas, waktu perubahan, dan JSON instrumen. Penyimpanan menggunakan ID untuk memperbarui baris yang sudah ada. Backend membatasi payload instrumen sampai 180 KB.

## Fitur prototipe

- Formulir tujuan, kelas/fase, materi, teknik, jumlah butir, serta konteks.
- Draf butir asesmen per jenis yang dapat disunting beserta kriteria keberhasilan.
- Penyimpanan lokal dan cloud Spreadsheet, buka kembali, impor/ekspor JSON, ekspor CSV, Word, serta dokumen kompatibel Google Docs.
- Antarmuka jalur kerja menuju Generator Modul Ajar dan Generator Soal yang ada.
- Pemetaan setiap butir ke tujuan pembelajaran, indikator, tingkat kognitif, bukti belajar, dan kriteria keberhasilan.
- Alur diagnostik, formatif, dan sumatif dengan tujuan penggunaan dan rekomendasi tindak lanjut yang berbeda.
- Penanda tinjauan guru, pengeditan per butir, dan pembuatan ulang butir dengan Gemini.
- Pilihan provider Gemini (mengikuti kuota/plan Google) atau DeepSeek Flash (API berbayar), dengan pemilihan model Gemini.
- Fallback Gemini hanya ke model Gemini. DeepSeek memakai konfigurasi penalaran maksimum dan pagu keluaran tersendiri; kegagalan DeepSeek tidak berpindah ke Gemini.
- Tampilan provider, model, dan penggunaan token yang dilaporkan API; riwayat pemakaian disimpan ke tab `AI_Pemakaian`.
- Pratinjau provider, topik, tujuan, jumlah butir, dan biaya berbayar sebelum generasi dimulai.
- Pemeriksaan mutu dasar untuk kelengkapan tujuan/butir/bukti, konsistensi tujuan, serta rubrik sumatif.
- Instrumen non-tes: observasi, unjuk kerja, proyek, presentasi, refleksi diri, penilaian diri, wawancara, dan diskusi.
- Jalur tes tertulis merujuk Generator Soal Kimia; paket ekspor JSON dapat diimpor kembali ke pustaka instrumen.

## Integrasi data Generator Modul Ajar

1. Salin berkas `integrasi-modul-ajar.js` ke folder Generator Modul Ajar dan tambahkan `<script src="integrasi-modul-ajar.js"></script>` sebelum `</body>` di `index.html`. Script ini menambahkan tombol ekspor draf aktif ke JSON tanpa mengubah proses pembuatan modul atau data tersimpan.
2. Klik **Ekspor data untuk Generator Asesmen**. JSON memuat `schema: portalkimia.module.v1` serta draf `draftModulKimia`.
3. Di Generator Asesmen, klik **Impor data modul**. Topik, kelas, fase (jika tersedia), tujuan dan data tiap pertemuan akan dipetakan ke formulir. Pilih pertemuan untuk melihat ITP, asesmen, dan aktivitasnya.
4. Susun instrumen; ekspor asesmen menggunakan `schema: portalkimia.assessment.v1`.

Impor menerima draf berformat pasangan kunci Modul Ajar seperti `aiTopik`, `aiKelas`, `tujuan`, `itp1`, `asesmen1`, dan `aktivitas1`, serta bentuk JSON terstruktur. Pemindahan data melalui berkas ini juga bekerja lintas perangkat. Format fase/kelas tetap mengikuti informasi yang tersedia pada draf sumber.

Provider default adalah Gemini 3.8 Flash. Pengguna dapat memilih model awal; bila terjadi error, GAS mencoba model lain berurutan: Gemini 3.5 Flash, 3.1 Flash-Lite, 3.5 Flash-Lite, 3.6 Flash, lalu 3.7 Flash. Untuk error 429/503/5xx, backend mencoba ulang sekali sebelum berpindah ke model Gemini berikutnya. Gemini menggunakan pagu output hingga 65.536 token.

DeepSeek Flash adalah pilihan terpisah dan berbayar. Backend memakai `deepseek-flash`, mengaktifkan thinking dengan `reasoning_effort: max`, mode JSON, dan batas `max_tokens` 393.216 sesuai batas endpoint Chat Completions. Ini adalah pagu maksimum yang diizinkan untuk satu permintaan; jumlah token yang benar-benar dipakai bergantung pada panjang hasil dan dilaporkan API. DeepSeek dicoba ulang satu kali jika responsnya gagal/invalid dan tidak pernah otomatis beralih provider. Jika semua upaya gagal, aplikasi mempertahankan draf templat lokal. Token aktual yang dilaporkan API ditampilkan di hasil bila tersedia. Lihat [dokumentasi Chat Completions DeepSeek](https://api-docs.deepseek.com/api/create-chat-completion/) dan [panduan JSON Output](https://api-docs.deepseek.com/guides/json_mode/). Status “ditinjau” merupakan penanda manual, bukan validasi otomatis; guru tetap perlu memeriksa kesesuaian dan rubrik.

Riwayat penggunaan AI disimpan di tab `AI_Pemakaian` pada Spreadsheet backend dan dapat dilihat dari bagian **Token dan biaya API**. Estimasi DeepSeek memakai harga per-juta token input/output dari tabel harga model, mencatat input cache jika tersedia, serta menghindari hitung ganda token penalaran yang sudah termasuk token keluaran. Harga DeepSeek bervariasi berdasarkan peak/off-peak dan cache; estimasi di aplikasi memakai tarif puncak input tanpa cache dan tarif puncak output sebagai pendekatan konservatif. Verifikasi tagihan akhir di dashboard DeepSeek dan perbarui konstanta harga di `Code.gs` jika diperlukan. Biaya Gemini tidak dihitung karena dapat bergantung pada kuota/plan akun. Pratinjau sebelum generasi hanya meminta konfirmasi; pemeriksaan mutu merupakan validasi aturan dasar lokal, bukan keputusan pedagogis otomatis.

Ekspor dokumen menghasilkan tabel pemetaan instrumen dengan kolom yang konsisten, paragraf justify, judul, metadata kelas/topik, tujuan, fungsi asesmen, dan tindak lanjut. Tombol **Ekspor Word** mengunduh `.doc` berbasis HTML yang dapat dibuka di Microsoft Word; gunakan **Save As** di Word untuk menyimpan sebagai `.docx`. Tombol **Google Docs** mengunduh HTML yang telah diformat untuk diunggah atau dibuka di Google Docs. File tidak dibuat otomatis di Drive karena situs GitHub Pages tidak meminta akses OAuth Google. Tombol cetak browser dihapus.

Soal tertulis tidak dibuat ulang di Generator Asesmen. Pilih teknik **Soal tertulis** atau tombol Generator Soal; Generator Asesmen mengunduh berkas rencana JSON dan membuka Generator Soal. Rencana JSON dapat diimpor di Generator Asesmen untuk memulihkan konteks, tetapi Generator Soal belum membaca berkas itu otomatis—salin topik dan tujuan ke kolomnya. Setelah membuat paket, unduh lewat tombol JSON Generator Soal dan impor berkas tersebut dari **Pustaka instrumen**. Butir hasil impor tetap perlu ditinjau dan dipetakan ke tujuan yang tepat.
