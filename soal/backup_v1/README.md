# ⚗️ Generator Soal Kimia AI — PortalKimia Suite

Aplikasi web modern berbasis peramban (*client-side web application*) untuk menyusun paket soal kimia (Pilihan Ganda & Esai) secara instan, presisi, dan terstruktur sesuai standar Kurikulum Merdeka, UTBK-SNBT, dan Olimpiade Kimia menggunakan **Google Gemini API** (`gemini-3.7-flash` & `gemini-3.6-flash`).

---

## 🌟 Keunggulan Versi Website

1. **Tanpa Instalasi Server / Python:** Cukup klik dua kali `index.html` atau `Buka-Aplikasi.bat`, aplikasi langsung berjalan penuh di browser Anda (Chrome, Edge, Safari).
2. **Model AI Pilihan Terkini:**
   - **`gemini-3.7-flash`**: Flagship AI model saat ini untuk penalaran kimia kompleks, stoikiometri bertingkat, dan soal HOTS.
   - **`gemini-3.6-flash`**: Cepat dan hemat untuk penyusunan latihan soal standar dan harian.
3. **Notasi Kimia & Rumus LaTeX (KaTeX):** Rumus molekul ($\text{H}_2\text{SO}_4$), ion ($\text{Fe}^{3+}$), reaksi kimia, dan entalpi ($\Delta H$) otomatis dirender rapi dan tajam.
4. **Distraktor Logis & Bebas Halusinasi:** Opsi pengecoh pada pilihan ganda dibuat berdasarkan miskonsepsi umum siswa (bukan angka acak).
5. **Mode Guru vs Siswa:**
   - **Mode Guru**: Tampilan soal lengkap dengan kunci jawaban dan pembahasan langkah demi langkah.
   - **Mode Siswa**: Lembar ujian interaktif yang bisa dikerjakan langsung dengan evaluasi skor otomatis.
6. **Ekspor Serbaguna:**
   - 🖨️ **Cetak / Simpan PDF**: Dilengkapi layout naskah ujian resmi (Kop ujian sekolah, identitas siswa, dan pemisah halaman untuk lembar pembahasan).
   - 📄 **Microsoft Word (.doc / .docx)**: Format dokumen yang siap dicetak/diedit guru.
   - 📝 **Markdown**: Untuk dokumentasi teks dengan rumus matematika.
   - 🗄️ **JSON**: Format data terstruktur untuk LMS (Moodle / Quizizz / Google Forms).

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Peluncur Cepat
Klik dua kali file **`Buka-Aplikasi.bat`** di folder ini.

### Cara 2: Buka Langsung di Peramban
Klik kanan file **`index.html`** → pilih **Open with** → **Google Chrome** atau **Microsoft Edge**.

### Cara 3: Hosting Gratis di GitHub Pages / Vercel
Karena aplikasi ini 100% *client-side*, Anda dapat mengunggah folder ini ke repositori GitHub dan mengaktifkan **GitHub Pages**, atau menghubungkannya ke **Vercel / Netlify** untuk diakses guru dan siswa di mana saja melalui HP/Laptop.

---

## 🔑 Pengaturan API Key

1. Klik tombol **Set API Key** di pojok kanan atas aplikasi.
2. Masukkan API Key Gemini Anda (dapatkan gratis di [Google AI Studio](https://aistudio.google.com/)).
3. API Key akan tersimpan secara lokal dan aman di browser Anda (`localStorage`).

---

## 📂 Struktur Berkas

```
Generator-Soal-Kimia/
├── index.html        # Halaman antarmuka web (Obsidian Dark Theme & KaTeX)
├── app.js            # Engine JavaScript, integrasi Gemini 3.6/3.7 Flash, & kuis interaktif
├── styles.css        # Desain CSS Obsidian Dark & Stylesheet Cetak Ujian
├── Code.gs           # Backend Google Apps Script opsional (integrasi Google Docs & Drive)
├── Buka-Aplikasi.bat # Peluncur cepat 1-klik di Windows
└── README.md         # Dokumentasi panduan penggunaan
```
