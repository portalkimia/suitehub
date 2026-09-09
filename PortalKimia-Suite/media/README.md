# Portal Bahan Ajar Kimia & Sains

Portal pembelajaran interaktif berbasis web yang memuat modul kimia, laboratorium sains virtual, dan materi multimedia pembelajaran interaktif (Fase E & Fase F).

🌐 **Dihosting via GitHub Pages**  
📊 **Database & Rekap Nilai**: Google Sheets API via Google Apps Script  

---

## 🌟 Fitur Utama
- **Modul Interaktif**:
  - Konfigurasi Elektron Model Bohr (Fase E) + Lab Simulasi & Kuis
  - Konfigurasi Elektron Model Mekanika Kuantum + Simulasi Orbital 3D
  - Laboratorium Kimia Virtual & Media Interaktif Terpadu
- **Pencarian Cepat & Filter Multi-Format**: Filter berdasarkan Mata Pelajaran (Kimia, Fisika, Biologi, Matematika), Jenjang Kelas (10, 11, 12), dan Format (HTML, PDF, PPT, Video).
- **Mode Guru / Admin**:
  - Login Admin (PIN: `guru123` / `tito123`)
  - Tambah, edit, dan hapus bahan ajar
  - Auto-sync dengan Google Sheets
- **Penyimpanan Ganda**: Bekerja online langsung terhubung ke Google Sheets, dan otomatis memiliki cadangan lokal (*offline local storage*).

---

## 🚀 Cara Menjalankan di GitHub Pages
1. Buat repository baru di [GitHub](https://github.com/new) (misalnya nama: `portal-kimia`).
2. Upload semua file dalam folder ini ke repository tersebut.
3. Buka menu **Settings** > **Pages** di repository GitHub Anda.
4. Pada bagian **Build and deployment** > **Branch**, pilih branch `main` (folder `/root`), lalu klik **Save**.
5. Tunggu sekitar 1 menit, web portal Anda akan aktif di:  
   `https://<username-github>.github.io/<nama-repo>/`
