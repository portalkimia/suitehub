# Pengamanan Backend Generator Modul Ajar

1. Tempel isi `Code.gs` terbaru ke proyek Google Apps Script Generator.
2. Buka **Project Settings > Script Properties** dan tambahkan `GEMINI_API_KEY` berisi API key Gemini yang baru.
3. Cabut API key lama di Google AI Studio karena sebelumnya pernah tersimpan di source code.
4. Jalankan fungsi `buatTokenAksesGuru_()` satu kali dari editor GAS. Salin token dari **Execution log** dan simpan di password manager.
5. Deploy ulang Web App pada deployment yang sama.
6. Di Generator, buka **Pengaturan Backend**, isi URL `/exec` dan token, lalu klik **Tes Koneksi**.
7. Jalankan `cekKonfigurasiKeamanan_()` bila ingin memeriksa konfigurasi tanpa menampilkan nilai rahasia.

Endpoint sekarang menolak permintaan tanpa token dan membatasi maksimal 20 proses per menit. Teks prompt AI yang sudah ada dipertahankan.
