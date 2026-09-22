// Source for build-submissions.cjs. Deploy generated Code.gs only.
const PK_MEDIA = {
  'sel-volta': 'Tugas_Sel_Volta',
  'sel-elektrolisis': 'Tugas_Sel_Elektrolisis',
  'konfigurasi-bohr': 'Tugas_Konfigurasi_Bohr',
  'konfigurasi-kuantum': 'Tugas_Konfigurasi_Kuantum',
  'bilangan-kuantum': 'Tugas_Bilangan_Kuantum',
  'periode-golongan': 'Tugas_Periode_Golongan',
  'sejarah-spu': 'Tugas_Sejarah_SPU',
  'sifat-keperiodikan': 'Tugas_Sifat_Keperiodikan',
  'konsep-redoks': 'Tugas_Konsep_Redoks',
  'redoks-biloks': 'Tugas_Redoks_Biloks',
  'redoks-setengah-reaksi': 'Tugas_Redoks_Setengah_Reaksi',
  'hidrokarbon': 'Tugas_Hidrokarbon',
  'korosi': 'Tugas_Korosi',
  'laboratorium-kimia': 'Tugas_Laboratorium_Kimia'
};
function pkHash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(function(b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function pkMediaId_(data) {
  if (data.mediaId) return String(data.mediaId);
  const title = String(data.materi || '').toLowerCase();
  const rules = [['volta','sel-volta'], ['elektrolisis','sel-elektrolisis'], ['bohr','konfigurasi-bohr'],
    ['bilangan kuantum','bilangan-kuantum'], ['mekanika kuantum','konfigurasi-kuantum'],
    ['periode','periode-golongan'], ['sejarah','sejarah-spu'], ['keperiodikan','sifat-keperiodikan'],
    ['setengah reaksi','redoks-setengah-reaksi'], ['penyetaraan','redoks-biloks'], ['redoks','konsep-redoks'],
    ['hidrokarbon','hidrokarbon'], ['korosi','korosi'], ['laboratorium','laboratorium-kimia']];
  for (let i = 0; i < rules.length; i++) if (title.indexOf(rules[i][0]) !== -1) return rules[i][1];
  return 'lain-' + pkHash_(title).slice(0, 12);
}
function pkNormalize_(input) {
  const data = input || {};
  const student = data.siswa || {};
  const answers = data.jawaban || {};
  const essays = Object.assign({}, answers.esai || {});
  Object.keys(data).forEach(function(k) { if (/^ess?ay\d+$|^esai\d+$/.test(k)) essays[k] = data[k]; });
  return {
    mediaId: pkMediaId_(data), materi: data.materi || data.mediaId || 'Kimia',
    nama: student.nama || data.nama || data.name || '', kelas: student.kelas || data.kelas || data.class || '',
    nis: student.nis || data.nis || '', skor: data.nilai ? data.nilai.skorKuis : data.skor,
    kuis: answers.kuis || data.kuis || data.answers || [], esai: essays,
    lks: answers.lks || data.tableObs || data.lkpd || {},
    refleksi: answers.refleksi || data.refleksi || data.reflection || '',
    isianLain: answers.isianLain || {}, laporan: data.laporanTeks || '',
    version: data.schemaVersion || 1, mediaVersion: data.mediaVersion || 'legacy'
  };
}
function pkSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function pkHeaders_(sheet, names) {
  let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String) : [];
  names.forEach(function(name) { if (headers.indexOf(name) === -1) headers.push(name); });
  if (headers.length > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  return headers;
}
function pkFind_(sheet, id) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const column = headers.indexOf('ID Pengumpulan') + 1;
  if (!column) return null;
  const match = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).useRegularExpression(false).findNext();
  if (!match) return null;
  const row = sheet.getRange(match.getRow(), 1, 1, headers.length).getValues()[0];
  const out = {};
  headers.forEach(function(h, i) { out[h] = row[i]; });
  return out;
}
function pkSafe_(v) {
  // User answers remain literal text, including strings beginning with '='.
  return typeof v === 'string' && /^[=+@\-]/.test(v) ? "'" + v : v;
}
function pkParts_(record, name, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value == null ? '' : value);
  if (!text.length) { record[name] = ''; return; }
  for (let i = 0; i < text.length; i += 40000) record[name + (i ? ' (lanjutan ' + (i / 40000 + 1) + ')' : '')] = text.slice(i, i + 40000);
}
function pkFields_(record, prefix, values) {
  if (!values || typeof values !== 'object') { pkParts_(record, prefix, values || ''); return; }
  Object.keys(values).forEach(function(key) { pkParts_(record, prefix + ' | ' + key, values[key]); });
}
function pkWrite_(sheet, record) {
  const headers = pkHeaders_(sheet, Object.keys(record));
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([headers.map(function(h) {
    return pkSafe_(Object.prototype.hasOwnProperty.call(record, h) ? record[h] : '');
  })]).setWrap(true);
}
function pkReceipt_(record) {
  return { success: true, stored: true, submissionId: record['ID Pengumpulan'], sheetName: record['Sheet Detail'], message: 'Seluruh jawaban tersimpan.' };
}
function simpanTugasSiswa(data) {
  const lock = LockService.getScriptLock();
  try {
    data = data || {};
    const raw = JSON.stringify(data);
    if (raw.length > 400000) throw new Error('Jawaban terlalu panjang. Kiriman belum disimpan; jawaban tetap ada di perangkat.');
    const d = pkNormalize_(data);
    if (!String(d.nama).trim() || !String(d.kelas).trim()) throw new Error('Nama dan kelas wajib diisi.');
    if (!/^[a-z0-9-]{1,64}$/.test(d.mediaId)) throw new Error('ID media tidak valid.');
    const id = data.submissionId || Utilities.getUuid();
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(id)) throw new Error('ID pengumpulan tidak valid.');
    const token = String(data.receiptToken || '');
    if (Number(data.schemaVersion) >= 2 && !/^[a-f0-9]{48}$/.test(token)) throw new Error('Token bukti pengumpulan tidak valid.');
    if (d.skor !== undefined && (!isFinite(Number(d.skor)) || Number(d.skor) < 0 || Number(d.skor) > 100)) throw new Error('Nilai kuis tidak valid.');
    lock.waitLock(25000);
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const index = pkSheet_(ss, 'RekapPengumpulan');
    const digest = pkHash_(raw);
    const existing = pkFind_(index, id);
    if (existing) {
      if (existing['Hash Data'] !== digest) throw new Error('ID pengumpulan sudah dipakai untuk jawaban lain.');
      return pkReceipt_(existing);
    }
    const sheetName = PK_MEDIA[d.mediaId] || ('Tugas_' + d.mediaId.replace(/-/g, '_'));
    const details = pkSheet_(ss, sheetName);
    const previous = pkFind_(details, id);
    if (previous && previous['Hash Data'] !== digest) throw new Error('ID pengumpulan bertabrakan.');
    const time = previous ? previous['Waktu Pengumpulan'] : new Date();
    const common = {
      'ID Pengumpulan': id, 'Waktu Pengumpulan': time, 'ID Media': d.mediaId, 'Materi': d.materi,
      'Nama': d.nama, 'Kelas': d.kelas, 'NIS / Absen': String(d.nis), 'Nilai Kuis': d.skor === undefined ? '' : Number(d.skor),
      'Versi Format': d.version, 'Versi Media': d.mediaVersion, 'Sheet Detail': sheetName,
      'Hash Data': digest, 'Hash Bukti': token ? pkHash_(token) : ''
    };
    if (!previous) {
      const detail = Object.assign({}, common);
      pkParts_(detail, 'Jawaban Kuis', d.kuis);
      pkFields_(detail, 'Esai', d.esai);
      pkFields_(detail, 'LKS', d.lks);
      pkFields_(detail, 'Refleksi', d.refleksi);
      pkFields_(detail, 'Isian Lain', d.isianLain);
      pkParts_(detail, 'Laporan Lengkap', d.laporan);
      pkParts_(detail, 'Data JSON Lengkap', raw);
      pkWrite_(details, detail);
      SpreadsheetApp.flush();
    }
    // Written last: a receipt implies both the detail and index have been persisted.
    pkWrite_(index, common);
    SpreadsheetApp.flush();
    return pkReceipt_(common);
  } catch (err) {
    return { success: false, stored: false, message: 'Belum tersimpan lengkap: ' + err.message };
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}
function pkSubmissionStatus_(params) {
  const id = String(params.submissionId || '');
  const token = String(params.receiptToken || '');
  const pending = { success: true, stored: false, submissionId: id };
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(id) || !/^[a-f0-9]{48}$/.test(token)) return pending;
  try {
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const record = pkFind_(ss.getSheetByName('RekapPengumpulan'), id);
    return record && record['Hash Bukti'] === pkHash_(token) ? pkReceipt_(record) : pending;
  } catch (_) { return pending; }
}
function pkStatusOutput_(params) {
  const result = JSON.stringify(pkSubmissionStatus_(params)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const callback = String(params.callback || '');
  if (/^pkReceipt_[a-f0-9]{48}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + result + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}
