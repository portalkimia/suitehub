/**
 * =========================================================================
 * KONFIGURASI PUSAT GENERATOR ASESMEN AI (MULTI-DEVICE READY)
 * PortalKimia Suite | Tito Vanzal, S.Pd.
 * =========================================================================
 * File konfigurasi ini otomatis tersinkron dengan PortalKimia Suite Hub.
 * Saat diakses dari dalam SuiteHub Mode Guru, backend GAS dan Token Guru
 * akan terhubung otomatis tanpa perlu pengaturan manual berulang kali.
 * =========================================================================
 */

window.ASSESSMENT_CONFIG = {
  // 1. URL Web App Google Apps Script khusus Generator Asesmen
  // Jika deploy tersendiri, isi URL Web App GAS Anda di sini:
  GAS_API_URL: "",

  // 2. Mode Penyimpanan
  STORAGE_MODE: "local-and-cloud",

  // 3. Metadata Guru & Sekolah Pengampu
  SEKOLAH: "SMA Progresif Bumi Shalawat",
  GURU: "Tito Vanzal, S.Pd.",
  ROLE: "Guru Kimia"
};

// Sinkronisasi dinamis jika diakses dari dalam PortalKimia Suite terpadu
if (typeof window !== 'undefined' && typeof window.PORTALKIMIA_CONFIG !== 'undefined') {
  if (window.PORTALKIMIA_CONFIG.ASESMEN_API) {
    window.ASSESSMENT_CONFIG.GAS_API_URL = window.PORTALKIMIA_CONFIG.ASESMEN_API;
  }
}
