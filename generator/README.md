# Panduan Integrasi: Generator Modul Ajar AI
### Arsitektur: Frontend di GitHub Pages + Backend di Google Apps Script (GAS)

Dokumen ini menjelaskan cara mengoperasikan antarmuka **`index.html`** (bertema Obsidian) yang di-hosting di **GitHub Pages** dengan logika backend **`Code.gs`** yang berjalan di **Google Apps Script**.

---

## 🏗️ Mengapa Diperlukan Arsitektur Hybrid Ini?

Ketika `index.html` dijalankan di luar Google Apps Script (misalnya di GitHub Pages atau domain kustom):
- Pustaka bawaan `google.script.run` **tidak dapat diakses langsung**.
- Frontend berkomunikasi dengan `Code.gs` melalui **HTTP POST (REST API)** yang dikirim ke URL Web App Google Apps Script.
- Respons dikembalikan dalam format JSON terstandar dan secara otomatis dialihkan (HTTP 302 redirect handling).
- Untuk mencegah pembatasan **CORS (Cross-Origin Resource Sharing)**, request dikirim dengan header `Content-Type: text/plain;charset=utf-8` sehingga browser tidak memicu preflight `OPTIONS` yang sering gagal di server Apps Script.

---

## 🚀 Langkah 1: Pasang & Deploy Backend `Code.gs` di Google Apps Script

1. Buka [script.google.com](https://script.google.com/) dan masuk dengan akun Google Anda.
2. Buat proyek baru (*New project*), misalnya dengan nama **`Backend-Generator-Modul-Ajar`**.
3. Buka file **`Code.gs`** di editor, hapus kode lama, lalu **salin seluruh isi berkas `Code.gs`** dari folder ini.
4. Periksa konstanta di baris 14–17:
   - `TEMPLATE_ID_MODUL`: ID Google Docs template Modul Ajar lengkap Anda.
   - `TEMPLATE_ID_LESSON`: ID Google Docs template Lesson Plan Anda.
   - `FOLDER_ID`: ID folder Google Drive tujuan penyimpanan dokumen hasil cetak.
   - `GEMINI_API_KEY`: Kunci API Gemini Anda.
5. Klik **Deploy** (Terapkan) di kanan atas &rarr; pilih **New deployment** (Penerapan Baru).
6. Klik ikon roda gigi ⚙️ di sebelah *Select type* &rarr; pilih **Web app**.
7. Konfigurasikan form penerapan:
   - **Description:** `Backend v1.0 (GitHub Pages Compatible)`
   - **Execute as:** `Me (email Anda)`
   - **Who has access:** <strong style="color:green;">Anyone (Siapa saja)</strong> &mdash; ⚠️ *Sangat penting! Jika diset "Only myself", GitHub tidak dapat mengakses backend.*
8. Klik **Deploy**. Berikan izin otorisasi akses Google Drive, Dokumen, dan URLFetch jika diminta (*Review Permissions* &rarr; *Advanced* &rarr; *Go to Untitled Project (unsafe)* &rarr; *Allow*).
9. **Salin URL Web App** yang muncul (berakhiran `/exec`), contoh:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## 🌐 Langkah 2: Hubungkan `index.html` di GitHub Pages

1. Upload berkas `index.html` ke repositori GitHub Anda (misal pada branch `main` atau `gh-pages`).
2. Aktifkan **GitHub Pages** di menu **Settings &rarr; Pages** pada repositori Anda.
3. Buka halaman GitHub Pages yang telah terbit (contoh: `https://username.github.io/nama-repo/`).
4. Pada sudut kanan atas halaman, klik tombol **🔗 Backend GAS**.
5. Tempelkan URL Web App yang Anda salin pada **Langkah 1** ke dalam kotak input.
6. Klik tombol **Tes Koneksi (Ping)**:
   - Jika muncul pesan **✅ Terhubung! Latensi: ...ms**, koneksi telah berhasil!
7. Klik **Simpan & Hubungkan**. Pengaturan ini otomatis tersimpan di memori browser Anda (`localStorage`).

---

## ⚡ Fungsi yang Bekerja Secara Otomatis

1. **✨ Tombol "Generate Kerangka Otomatis":**
   - Mengirim permintaan ke backend GAS dengan aksi `panggilGemini`.
   - Menghubungi model AI `gemini-3.6-flash`.
   - Mengisi otomatis seluruh 14 ITP, 9 Pertemuan (Kegiatan Awal, 3 Fase Kegiatan Inti, Penutup), dan 8 Dimensi Profil Kelulusan.
2. **🖨️ Tombol "Proses Cetak Dokumen":**
   - Mengirim data formulir ke backend GAS dengan aksi `buatModul`.
   - Membuat salinan template Docs di Google Drive Anda, mengganti seluruh placeholder tag `{{...}}`.
   - Mengembalikan tautan **Buka Google Docs** dan **Unduh PDF** secara langsung di layar.
3. **💾 Fitur Auto-Save & Smart-Lock:**
   - Menyimpan draf ketikan Anda secara realtime ke `localStorage`.
   - Otomatis menyesuaikan formulir jika memilih jenis *Lesson Plan* (maksimal 2 pertemuan) vs *Modul Ajar* (hingga 9 pertemuan).
