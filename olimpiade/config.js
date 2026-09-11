/**
 * =========================================================================
 * KONFIGURASI BACKEND PORTALKIMIA OLIMPIADE (MULTI-DEVICE READY)
 * =========================================================================
 * Masukkan URL deployment Web App Google Apps Script Anda SEKALI di bawah ini.
 * Setelah file ini diisi dan di-push ke GitHub, SEMUA perangkat (HP, Laptop, PC)
 * akan OTOMATIS langsung tersambung ke Google Spreadsheet tanpa perlu mengetik
 * ulang link GAS di menu pengaturan!
 * =========================================================================
 */

window.OLIMPIADE_CONFIG = {
  // 1. URL Web App Backend Google Apps Script (Deploy -> New Deployment -> Web App)
  // Contoh: "https://script.google.com/macros/s/AKfycby.../exec"
  GAS_API_URL: "",

  // 2. Identitas Sekolah & Binaan
  SEKOLAH: "SMA Progresif Bumi Shalawat",
  TAHUN_AJARAN: "2026/2027",
  PEMBINA_DEFAULT: "Tito Vanzal, S.Pd.",

  // 3. Konfigurasi Sinkronisasi Multi-Device
  AUTO_SYNC_INTERVAL_MS: 45000, // Sinkronisasi otomatis di latar belakang setiap 45 detik
  AUTO_SYNC_ON_TAB_FOCUS: true  // Otomatis tarik data saat tab dibuka/aktif kembali
};

// Sinkronisasi otomatis jika diakses dari dalam PortalKimia Suite terpadu
if (typeof window !== 'undefined' && typeof window.PORTALKIMIA_CONFIG !== 'undefined' && window.PORTALKIMIA_CONFIG.OLIMPIADE_API) {
  window.OLIMPIADE_CONFIG.GAS_API_URL = window.PORTALKIMIA_CONFIG.OLIMPIADE_API;
}
