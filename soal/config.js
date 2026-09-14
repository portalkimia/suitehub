/**
 * =========================================================================
 * KONFIGURASI BACKEND GENERATOR SOAL KIMIA AI (MULTI-DEVICE READY)
 * PortalKimia Suite | Tito Vanzal, S.Pd.
 * =========================================================================
 * Masukkan URL deployment Web App Google Apps Script Anda di sini jika ingin
 * mengaktifkan fitur Sinkronisasi Bank Soal Cloud, Penyimpanan Google Drive,
 * atau Proxy AI terpusat tanpa perlu input API Key di setiap perangkat.
 * =========================================================================
 */

window.SOAL_CONFIG = {
  // 1. URL Web App Backend Google Apps Script (Deploy -> New Deployment -> Web App)
  // Contoh: "https://script.google.com/macros/s/AKfycby.../exec"
  GAS_API_URL: "",

  // 2. Identitas Sekolah & Guru Pengampu
  SEKOLAH: "SMA Progresif Bumi Shalawat",
  GURU: "Tito Vanzal, S.Pd.",

  // 3. Mode Eksekusi Gemini AI:
  // - "direct" : Panggil langsung ke Google API menggunakan API Key di browser (kecepatan maksimal)
  // - "proxy"  : Panggil lewat backend Google Apps Script (aman tanpa input API Key di tiap gadget)
  // - "auto"   : Gunakan direct jika ada API Key di browser, atau fallback ke GAS jika kosong
  AI_EXECUTION_MODE: "auto",

  // 4. Integrasi Cloud Bank Soal (Google Spreadsheet)
  ENABLE_CLOUD_BANK: true
};

// Sinkronisasi otomatis jika diakses dari dalam PortalKimia Suite terpadu
if (typeof window !== 'undefined' && typeof window.PORTALKIMIA_CONFIG !== 'undefined' && window.PORTALKIMIA_CONFIG.SOAL_API) {
  window.SOAL_CONFIG.GAS_API_URL = window.PORTALKIMIA_CONFIG.SOAL_API;
}
