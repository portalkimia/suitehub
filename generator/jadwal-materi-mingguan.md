# Jadwal Materi Berdasarkan Tanggal (3 Jenjang Kelas: 10, 11, 12) — Generator Modul Ajar & Lesson Plan

Setiap hari **Kamis pukul 18.30 WIB**, otomasi akan memeriksa **Tanggal (`YYYY-MM-DD`)** pada tabel di bawah ini dan membuat **3 dokumen Word (`.docx`) sekaligus** untuk **Kelas 10**, **Kelas 11**, dan **Kelas 12**.

---

## 💡 3 Pilihan Mode Media (Isi pada Kolom `Mode Media / Bahan Rujukan`)

Anda bebas memilih salah satu dari **3 mode** berikut untuk setiap kelas/pertemuan (bahkan dalam 1 minggu boleh berbeda-beda antar kelas, atau Pertemuan 1 pakai media sedangkan Pertemuan 2 tanpa media):

1. **`Katalog PortalKimia`** *(atau tulis judul medianya)*  
   - **Kapan dipakai:** Jika materi tersebut sudah ada medianya di katalog PortalKimia (`portal_media_manifest.json` / folder `Portal-Bahan-Ajar-Kimia`).  
   - **Cara kerja:** Langkah kegiatan (`Memahami`, `Mengaplikasi`, `Merefleksi`), LKPD, dan kuis otomatis diselaraskan dengan simulator & fitur asli di dalam media HTML Anda.
2. **`File: <nama-berkas>`** *(simpan berkasnya di folder `bahan-rujukan/` atau `Portal-Bahan-Ajar-Kimia/`)*  
   - **Kapan dipakai:** Jika Anda baru saja membuat media `.html` baru, LKM `.docx`/`.pdf`, atau catatan materi yang belum masuk ke manifest katalog.  
   - **Cara kerja:** Agen akan membaca isi berkas tersebut secara langsung dan menyusun Lesson Plan sesuai isi media/berkas baru Anda.
3. **`Tanpa Media`** *(atau tulis media umum, misal: `Tanpa Media (LKPD Cetak & Diskusi)` / `Canva & Papan Tulis`)*  
   - **Kapan dipakai:** Ketika minggu itu Anda **belum/tidak membuat media interaktif khusus**.  
   - **Cara kerja:** Agen **tidak akan mencantumkan simulator PortalKimia**, melainkan menyusun kegiatan pembelajaran tatap muka yang realistis (diskusi kelompok, analisis studi kasus/fenomena kontekstual, pengerjaan LKPD cetak/tertulis, dan kuis formatif singkat di kelas) sesuai sintaks model pembelajaran yang dipilih.

> **Tips Campuran Antar-Pertemuan:**  
> Jika 1 Lesson Plan berisi 2 pertemuan tetapi Anda hanya punya 1 media, cukup tulis:  
> `P1: Katalog PortalKimia | P2: Tanpa Media (Diskusi & Latihan Soal)`

---

## Rincian Materi per Tanggal (3 Jenjang Kelas)

| Tanggal (Kamis) | Jenjang Kelas | Topik / Materi | Model Pembelajaran | Jumlah Pertemuan | Mode Media / Bahan Rujukan | Jenis Dokumen | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-11-05** | **Kelas 10 (Fase E)** | Struktur Atom & Konfigurasi Elektron | Discovery Learning | 2 | `Katalog PortalKimia` | Lesson Plan | SELESAI (`2026-11-05_Lesson-Plan_Kelas-10_Struktur-Atom.docx`) |
| **2026-11-05** | **Kelas 11 (Fase F)** | Laju Reaksi & Faktor-Faktor yang Mempengaruhi | Problem-Based Learning (PBL) | 2 | `Katalog PortalKimia` | Lesson Plan | SELESAI (`2026-11-05_Lesson-Plan_Kelas-11_Laju-Reaksi.docx`) |
| **2026-11-05** | **Kelas 12 (Fase F)** | Sel Volta & Potensial Elektrode | Project-Based Learning (PjBL) | 2 | `Katalog PortalKimia` | Lesson Plan | SELESAI (`2026-11-05_Lesson-Plan_Kelas-12_Sel-Volta.docx`) |
| **2026-11-12** | **Kelas 10 (Fase E)** | Sistem Periodik Unsur & Sifat Keperiodikan | Inkuiri Terbimbing | 2 | `Katalog PortalKimia` | Lesson Plan | BELUM DIBUAT |
| **2026-11-12** | **Kelas 11 (Fase F)** | Kesetimbangan Kimia & Pergeseran Kesetimbangan | Problem-Based Learning (PBL) | 2 | `P1: Katalog PortalKimia \| P2: Tanpa Media` | Lesson Plan | BELUM DIBUAT |
| **2026-11-12** | **Kelas 12 (Fase F)** | Sel Elektrolisis & Hukum Faraday | Discovery Learning | 2 | `Tanpa Media (LKPD Cetak & Diskusi)` | Lesson Plan | BELUM DIBUAT |
| **2026-11-19** | **Kelas 10 (Fase E)** | Ikatan Kimia (Ion, Kovalen, Logam) | Cooperative Learning | 2 | `Katalog PortalKimia` | Lesson Plan | BELUM DIBUAT |
| **2026-11-19** | **Kelas 11 (Fase F)** | Tetapan Kesetimbangan (Kc dan Kp) | Discovery Learning | 2 | `Tanpa Media (Diskusi & Latihan Soal)` | Lesson Plan | BELUM DIBUAT |
| **2026-11-19** | **Kelas 12 (Fase F)** | Korosi & Pencegahan Korosi | STEM | 2 | `Katalog PortalKimia` | Lesson Plan | BELUM DIBUAT |

---

## Format Penyimpanan Hasil (`generated-plans/`)
Setiap eksekusi akan menghasilkan 3 paket dokumen **Microsoft Word (`.docx`)** siap cetak menggunakan template yang sesuai (`template-lesson-plan.docx` atau `template-modul-ajar.docx`):
1. `YYYY-MM-DD_Lesson-Plan_Kelas-10_<Topik>.docx` *(atau `_Modul-Ajar_`)*
2. `YYYY-MM-DD_Lesson-Plan_Kelas-11_<Topik>.docx` *(atau `_Modul-Ajar_`)*
3. `YYYY-MM-DD_Lesson-Plan_Kelas-12_<Topik>.docx` *(atau `_Modul-Ajar_`)*
