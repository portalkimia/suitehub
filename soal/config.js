/**
 * =========================================================================
 * KONFIGURASI BACKEND GENERATOR SOAL KIMIA AI (MULTI-DEVICE READY)
 * PortalKimia Suite | Tito Vanzal, S.Pd.
 * =========================================================================
 */

window.SOAL_CONFIG = {
  // URL Web App Backend Google Apps Script (Tersinkron dengan config.js Suite)
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbx5znz66Ye57dVVgoqiD5_QUlhbr8ap7ve81iJqeFNjLaVVRaTwpUzDMipXfE5bQbSSMQ/exec",

  // Identitas Sekolah & Guru Pengampu
  SEKOLAH: "SMA Progresif Bumi Shalawat",
  GURU: "Tito Vanzal, S.Pd.",

  // Mode Eksekusi: Proxy GAS terpusat (API Key tersimpan aman di server GAS)
  AI_EXECUTION_MODE: "proxy",

  // Integrasi Cloud Bank Soal (Google Spreadsheet)
  ENABLE_CLOUD_BANK: true
};

// Sinkronisasi dinamis jika diakses dari dalam PortalKimia Suite terpadu
if (typeof window !== 'undefined' && typeof window.PORTALKIMIA_CONFIG !== 'undefined' && window.PORTALKIMIA_CONFIG.SOAL_API) {
  window.SOAL_CONFIG.GAS_API_URL = window.PORTALKIMIA_CONFIG.SOAL_API;
}
