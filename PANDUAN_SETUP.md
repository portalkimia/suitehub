# Panduan Setup Backend Google Spreadsheet & Apps Script (GAS)
## PortalKimia Suite — Ekosistem Digital Terintegrasi

Panduan ini memandu Anda menghubungkan **Frontend PortalKimia Suite** (`index.html`) ke **Google Spreadsheet** menggunakan **Google Apps Script** (`Code.gs`) sebagai backend API.

---

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama file Spreadsheet, misalnya: **`Database_PortalKimia_Suite`**.
3. (Opsional) Beri nama sheet tab pertama: **`Daftar_Cabang`**.

---

### Langkah 2: Pasang Kode Apps Script (`Code.gs`)
1. Di menu atas Spreadsheet, klik **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh isi default pada file `Code.gs`.
3. Buka file [Code.gs](file:///C:/Users/Tito/Desktop/PortalKimia-Suite/Code.gs) yang sudah ada di folder ini, salin seluruh kodenya, lalu tempel (*paste*) ke editor Apps Script.
4. Klik ikon **Simpan (Save)** 💾 (atau tekan `Ctrl + S`).

---

### Langkah 3: Inisialisasi Database (Jalankan `setupDatabase`)
1. Pada dropdown fungsi di bagian atas editor Apps Script, pilih fungsi **`setupDatabase`**.
2. Klik tombol **Jalankan (Run)** ▶.
3. Google akan meminta **Tinjau Izin (Review Permissions)**:
   - Pilih akun Google Anda.
   - Klik **Lanjutan (Advanced)** > klik **Buka Database_PortalKimia_Suite (tidak aman)**.
   - Klik **Izinkan (Allow)**.
4. Setelah selesai, buka kembali tab Spreadsheet Anda. Tabel database dengan header rapi dan 13 kolom (termasuk kolom **`Roles`** untuk hak akses Siswa, Guru, Admin) serta 3 data cabang awal sudah terbuat otomatis!
   > 💡 **Catatan untuk Spreadsheet Lama:** Jika Anda sudah memiliki spreadsheet sebelumnya, fungsi `setupDatabase` (atau saat portal diakses) akan **secara otomatis menambahkan kolom `Roles`** tanpa menghapus data cabang Anda yang lama.

---

### Langkah 4: Deploy sebagai Web App (PENTING)
Agar file `index.html` di GitHub Pages / lokal bisa berkomunikasi dengan Spreadsheet:
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Terapkan (Deploy)** > **Penerapan baru (New deployment)**.
2. Klik ikon gerigi ⚙ di sebelah *Pilih jenis*, lalu pilih **Aplikasi web (Web app)**.
3. Konfigurasikan seperti berikut:
   - **Deskripsi:** `API PortalKimia v1`
   - **Jalankan sebagai (Execute as):** `Saya (email Anda)` *(Execute as: Me)*
   - **Yang memiliki akses (Who has access):** `Siapa saja` *(Anyone)*  
     *(⚠️ Wajib pilih **Anyone** agar frontend dapat mengirimkan permintaan tanpa terhalang autentikasi)*
4. Klik **Terapkan (Deploy)**.
5. Salin **URL Aplikasi Web (Web App URL)** yang berakhiran `/exec`.  
   *Contoh format URL:* `https://script.google.com/macros/s/AKfycbw.../exec`

---

### Langkah 5: Hubungkan ke `index.html`
Ada 2 cara mudah menghubungkan URL Web App tersebut ke web Anda:

#### Cara A: Langsung dari Web (Tanpa Edit Kodingan)
1. Buka file `index.html` di browser Anda (klik ganda file `index.html`).
2. Klik teks **"Konfigurasi API"** di footer bawah atau klik tombol status **"Mode Lokal / Demo"** di header atas.
3. Tempelkan URL Web App GAS Anda, lalu klik **"Simpan & Muat Ulang"**.
4. Status akan berubah menjadi hijau **"Terkoneksi Spreadsheet"**!

#### Cara B: Tulis Langsung di Kode `index.html`
Buka file `index.html` dengan teks editor (Notepad / VS Code), cari baris konfigurasi:
```javascript
const CONFIG = {
  GAS_API_URL: "https://script.google.com/macros/s/PASTE_URL_ANDA_DI_SINI/exec",
};
```
Ganti string kosong dengan URL Web App Anda. Simpan file.

---

### Langkah 6: Menguji Fitur Tambah Cabang
1. Buka `index.html`.
2. Klik tombol **"+ Tautkan Website"** pada kartu terakhir (*Hubungkan Cabang Baru*).
3. Isi formulir:
   - Judul, Tag Kategori, URL Website, Deskripsi, Fitur (Chips), Tema Warna, dan Ikon.
4. Klik **"Simpan ke Spreadsheet"**.
5. Data akan langsung terkirim dan tersimpan di baris baru Google Spreadsheet Anda, serta kartu website baru langsung muncul di dasbor!

---

### Langkah 7: Publikasi ke GitHub Pages
1. Buat repositori baru di GitHub Anda (misal: `portalkimia-suite`).
2. Unggah file `index.html` ke repositori tersebut.
3. Buka tab **Settings** repositori > **Pages** > pada *Branch* pilih `main` / `root` > **Save**.
4. Website Portal Anda kini dapat diakses secara online oleh guru dan siswa di mana saja!
