/**
 * =========================================================================
 * KONFIGURASI PUSAT PORTALKIMIA SUITE (MULTI-DEVICE READY)
 * =========================================================================
 * Masukkan URL deployment Web App Google Apps Script Anda SEKALI di bawah ini.
 * Setelah file ini diunggah ke GitHub, SEMUA perangkat (HP, Laptop, Tablet, PC Sekolah)
 * akan OTOMATIS langsung terhubung tanpa perlu konfigurasi manual satu per satu!
 * =========================================================================
 */

window.PORTALKIMIA_CONFIG = {
  // 1. URL Web App Backend Portal Utama (Spreadsheet Daftar Cabang)
  PORTAL_API: "https://script.google.com/macros/s/AKfycby-KXmx5xmk914MwIW4RtfR0LxOfwdrj1jx8jx3lTjE7PgdGIvJGiirl3sT0WajOnNrnA/exec", 

  // 2. URL Web App Backend LMS & Wali Kelas (Presensi, Nilai, Data Siswa)
  LMS_API: "https://script.google.com/macros/s/AKfycbwhHSF2V_rUkObqGcQ0aGfy58g2eIe73VPgAIbyEKn2Oxw8m7FVIyu2oVKHzyLGsu2q/exec",    

  // 3. URL Web App Backend Generator Modul Ajar AI (Gemini Docs Generator)
  GENERATOR_API: "https://script.google.com/macros/s/AKfycbwB18ndUY8Dv4Iz1JMzM030T9AexXj-SY-O5KBMn5AwFfCv1HIj7Ic5BzbOvToEfCg/exec",

  // 4. URL Web App Backend Media Pembelajaran Kimia (Pengiriman Tugas/Jawaban & Google Drive Media)
  MEDIA_API: "https://script.google.com/macros/s/AKfycbwobr0k-44HFrf3B5YUroeEK-_U13AGVe2urQYDAmL0U43arTQHTvKjUEeM6CuZQvOE/exec"
    
  // 5. URL Web App Backend PortalKimia Olimpiade (Bank Soal, Ploting Tim, Data Siswa & Agenda Lomba)
  // Masukkan URL Google Apps Script Olimpiade Anda di sini:
  OLIMPIADE_API: "https://script.google.com/macros/s/AKfycbwnsrR8vyTLo8mu_urbIfjGApBabcj-NdvCBpNMiOIwQCwXo5UdT7Heq_Z36KxLeAgNLA/exec"
};
