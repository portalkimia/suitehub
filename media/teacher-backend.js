// Private helpers end in _ so they cannot be invoked through google.script.run.
function pkOwnerOnly_() {
  const active = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  const owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!active || !owner || active !== owner) throw new Error('Fungsi setup hanya dapat dijalankan pemilik skrip dari editor Apps Script.');
}
// Visible in the Apps Script Run menu; access is still checked on the server.
function setupAnalisisAI() { pkOwnerOnly_(); return setupAnalisisAI_(); }
function antrekanDataTersimpanUntukAI() { pkOwnerOnly_(); return antrekanDataTersimpanUntukAI_(); }
function pkDb_() { return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }
function pkRows_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  return values.slice(1).map(function(row) { const out = {}; values[0].forEach(function(k, i) { out[k] = row[i]; }); return out; });
}
function pkLocked_(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try { const result = fn(); SpreadsheetApp.flush(); return result; } finally { lock.releaseLock(); }
}
function pkPasswordVersion_() {
  const password = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD') || '';
  if (password.length < 12) throw new Error('Guru perlu mengatur TEACHER_PASSWORD minimal 12 karakter di Script Properties.');
  return pkHash_(password);
}
function pkTeacherAuth_(token) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) throw new Error('Silakan masuk sebagai guru.');
  const version = CacheService.getScriptCache().get('pk_teacher_' + pkHash_(token));
  if (!version || version !== pkPasswordVersion_()) throw new Error('Sesi guru berakhir. Silakan masuk kembali.');
}
function pkLogin_(password) {
  return pkLocked_(function() {
    const cache = CacheService.getScriptCache();
    if (cache.get('pk_login_block')) throw new Error('Terlalu banyak percobaan. Tunggu satu menit.');
    const expected = pkPasswordVersion_();
    if (pkHash_(String(password || '')) !== expected) {
      const count = Number(cache.get('pk_login_fail') || 0) + 1;
      cache.put('pk_login_fail', String(count), 60);
      if (count >= 5) cache.put('pk_login_block', '1', 60);
      throw new Error('Kata sandi guru tidak sesuai.');
    }
    cache.remove('pk_login_fail');
    const token = pkHash_(Utilities.getUuid() + Utilities.getUuid());
    cache.put('pk_teacher_' + pkHash_(token), expected, 14400);
    return { token: token };
  });
}
// Only authenticated actions can read student data or change assignments/reviews.
function portalTeacherApi(request) {
  try {
    request = request || {};
    if (request.action === 'login') return { success: true, data: pkLogin_(request.password) };
    pkTeacherAuth_(request.token);
    let data;
    if (request.action === 'logout') { CacheService.getScriptCache().remove('pk_teacher_' + pkHash_(request.token)); data = {}; }
    else if (request.action === 'dashboard') data = pkDashboard_();
    else if (request.action === 'detail') data = pkTeacherDetail_(String(request.id || ''));
    else if (request.action === 'saveTask') data = pkLocked_(function() { return pkSaveTask_(request.task || {}); });
    else if (request.action === 'review') data = pkLocked_(function() { return pkSaveReview_(request); });
    else if (request.action === 'reopen') data = pkLocked_(function() { return pkReopen_(String(request.id || '')); });
    else if (request.action === 'retryAI') data = pkLocked_(function() { return pkRetryAi_(String(request.id || '')); });
    else throw new Error('Aksi guru tidak dikenal.');
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (e) { return { success: false, message: e.message }; }
}
function pkDashboard_() {
  const ss = pkDb_();
  const ai = {}; pkRows_(ss, 'Analisis_AI').forEach(function(r) { ai[r['ID Pengumpulan']] = r; });
  const reviews = {}; pkRows_(ss, 'Pemeriksaan_Guru').forEach(function(r) { reviews[r['ID Pengumpulan']] = r; });
  const results = pkRows_(ss, 'RekapPengumpulan').map(function(r) {
    const a = ai[r['ID Pengumpulan']] || {}, v = reviews[r['ID Pengumpulan']] || {};
    return { id: r['ID Pengumpulan'], taskId: r['ID Tugas'] || '', task: r['Judul Tugas'] || 'Pengumpulan lama',
      name: r.Nama, className: r.Kelas, nis: r['NIS / Absen'], media: r.Materi, time: r['Waktu Pengumpulan'],
      quiz: r['Nilai Kuis'], late: r['Terlambat'] === true, revision: r.Revisi || 0,
      aiStatus: a['Status AI'] || 'BELUM_DIANTREKAN', aiScore: a['Skor Rekomendasi AI'] === undefined ? '' : a['Skor Rekomendasi AI'],
      summary: a['Ringkasan AI'] || '', misconception: a.Miskonsepsi || '', model: a['Model AI'] || '', error: a['Pesan Error'] || '',
      review: v.Status || 'Belum diperiksa', finalScore: v['Nilai Akhir'] === undefined ? '' : v['Nilai Akhir'] };
  });
  const participants = pkRows_(ss, 'Peserta_Tugas').map(function(p) {
    const finalKey = pkFinalKey_(p);
    const submitted = pkRowsCachedFinal_(results, p);
    return { id: p['ID Pengumpulan'], taskId: p['ID Tugas'], name: p.Nama, nis: p['NIS / Absen'], className: p.Kelas,
      code: p['Kode Akses'], revision: p.Revisi || 0, submitted: submitted, finalKey: finalKey };
  });
  return { results: results.reverse(), tasks: pkRows_(ss, 'Daftar_Tugas'), participants: participants,
    media: Object.keys(PK_MEDIA).map(function(id) { return { id: id, title: PK_MEDIA[id].replace(/^Tugas_/, '').replace(/_/g, ' ') }; }) };
}
function pkRowsCachedFinal_(results, p) {
  return results.some(function(r) { return r.taskId === p['ID Tugas'] && String(r.nis) === String(p['NIS / Absen']) && Number(r.revision) === Number(p.Revisi || 0); });
}
function pkTeacherDetail_(id) {
  const ss = pkDb_(), index = pkFind_(ss.getSheetByName('RekapPengumpulan'), id);
  if (!index) throw new Error('Pengumpulan tidak ditemukan.');
  const record = pkFind_(ss.getSheetByName(index['Sheet Detail']), id);
  let answers = {};
  if (record) { try { answers = JSON.parse(pkJoinParts_(record, 'Data JSON Lengkap')); } catch (_) { answers = { laporanTeks: pkJoinParts_(record, 'Laporan Lengkap') }; } }
  // Never return receipt credentials to the dashboard.
  delete answers.receiptToken; delete answers.studentAccessCode;
  const a = pkFind_(ss.getSheetByName('Analisis_AI'), id) || {};
  const analysis = {}; ['Status AI', 'Model AI', 'Skor Rekomendasi AI', 'Kelengkapan LKS (%)', 'Status Pemahaman', 'Ringkasan AI', 'Miskonsepsi', 'Umpan Balik Siswa', 'Saran Guru', 'Detail Penilaian JSON', 'Waktu Analisis', 'Pesan Error'].forEach(function(k) { analysis[k] = a[k] === undefined ? '' : a[k]; });
  return { id: id, name: index.Nama, className: index.Kelas, media: index.Materi, answers: answers, analysis: analysis,
    review: pkFind_(ss.getSheetByName('Pemeriksaan_Guru'), id) || {} };
}
function pkSaveTask_(task) {
  const ss = pkDb_();
  const existing = task.id ? pkFind_(ss.getSheetByName('Daftar_Tugas'), task.id) : null;
  if (task.id && !existing) throw new Error('Tugas tidak ditemukan.');
  const id = existing ? existing['ID Pengumpulan'] : Utilities.getUuid();
  const title = String(task.title || '').trim().slice(0, 160), className = String(task.className || '').trim().slice(0, 80);
  if (!title || !className || !PK_MEDIA[task.mediaId]) throw new Error('Isi judul, kelas, dan media.');
  if (existing && (existing['ID Media'] !== task.mediaId || existing.Kelas !== className)) throw new Error('Media dan kelas tugas yang sudah dibuat tidak dapat diganti. Buat tugas baru.');
  const due = task.due ? new Date(task.due) : null;
  if (due && !isFinite(due.getTime())) throw new Error('Tenggat tidak valid.');
  const roster = String(task.roster || '').trim().split(/\r?\n/).filter(Boolean).map(function(line) {
    const cells = line.split('|').map(function(s) { return s.trim(); });
    if (cells.length !== 2 || !/^[a-zA-Z0-9._-]{1,40}$/.test(cells[0]) || !cells[1]) throw new Error('Daftar siswa: gunakan NIS|Nama pada setiap baris.');
    return { nis: cells[0], name: cells[1].slice(0, 120) };
  });
  if (!existing && !roster.length) throw new Error('Isi daftar siswa agar tiap siswa memperoleh kode pribadi.');
  if (roster.length > 200) throw new Error('Maksimal 200 siswa per tugas.');
  const seen = {}; roster.forEach(function(p) { if (seen[p.nis]) throw new Error('NIS duplikat: ' + p.nis); seen[p.nis] = true; });
  const record = { 'ID Pengumpulan': id, 'Judul': title, 'ID Media': task.mediaId, 'Kelas': className,
    'Tenggat': due ? due.toISOString() : '', 'Terbuka': task.open === true, 'Izinkan Terlambat': task.allowLate === true,
    'Diperbarui': new Date() };
  pkUpdate_(pkSheet_(ss, 'Daftar_Tugas'), id, record);
  roster.forEach(function(p) {
    const participantId = pkHash_(id + '|' + p.nis);
    if (pkFind_(ss.getSheetByName('Peserta_Tugas'), participantId)) return;
    pkWrite_(pkSheet_(ss, 'Peserta_Tugas'), { 'ID Pengumpulan': participantId, 'ID Tugas': id, 'Nama': p.name,
      'NIS / Absen': p.nis, 'Kelas': className, 'Kode Akses': pkHash_(Utilities.getUuid()).slice(0, 24), 'Revisi': 0 });
  });
  return record;
}
function pkFinalKey_(p) { return pkHash_(p['ID Pengumpulan'] + '|' + Number(p.Revisi || 0)); }
function pkParticipant_(ss, data) {
  const task = pkFind_(ss.getSheetByName('Daftar_Tugas'), String(data.assignmentId || ''));
  if (!task) throw new Error('Masukkan ID tugas dan kode pribadi dari guru.');
  const code = String(data.studentAccessCode || '').trim();
  if (!/^[a-f0-9]{24}$/.test(code)) throw new Error('Kode pengumpulan tidak valid.');
  const participant = pkRows_(ss, 'Peserta_Tugas').find(function(p) { return p['ID Tugas'] === data.assignmentId && p['Kode Akses'] === code; });
  if (!participant) throw new Error('Kode pengumpulan tidak sesuai dengan tugas.');
  if (task['ID Media'] !== data.mediaId) throw new Error('Media ini tidak sesuai dengan tugas.');
  return { task: task, participant: participant, finalKey: pkFinalKey_(participant) };
}
function pkFinalRecord_(ss, key) {
  return pkRows_(ss, 'RekapPengumpulan').find(function(r) { return r['Kunci Final'] === key; }) || null;
}
function pkCheckTask_(ss, data) {
  const access = pkParticipant_(ss, data), task = access.task;
  const previous = pkFinalRecord_(ss, access.finalKey);
  if (previous) return Object.assign(access, { previous: previous });
  if (task.Terbuka !== true) throw new Error('Pengumpulan tugas sudah ditutup oleh guru.');
  const late = task.Tenggat && Date.now() > new Date(task.Tenggat).getTime();
  if (late && task['Izinkan Terlambat'] !== true) throw new Error('Tenggat pengumpulan telah berakhir.');
  if (Number(data.assignmentRevision) !== Number(access.participant.Revisi || 0)) throw new Error('Izin revisi berubah. Periksa tugas kembali.');
  return Object.assign(access, { late: !!late });
}
function portalStudentAccess(data) {
  try {
    const ss = pkDb_(), access = pkParticipant_(ss, data), p = access.participant, t = access.task;
    const previous = pkFinalRecord_(ss, access.finalKey);
    return { success: true, title: t.Judul, name: p.Nama, className: p.Kelas, nis: p['NIS / Absen'],
      revision: Number(p.Revisi || 0), due: t.Tenggat || '', open: t.Terbuka === true,
      allowLate: t['Izinkan Terlambat'] === true, stored: !!previous, submissionId: previous ? previous['ID Pengumpulan'] : '' };
  } catch (e) { return { success: false, message: e.message }; }
}
function pkSaveReview_(request) {
  const ss = pkDb_();
  if (!pkFind_(ss.getSheetByName('RekapPengumpulan'), request.id)) throw new Error('Pengumpulan tidak ditemukan.');
  if (['Disetujui', 'Dikoreksi', 'Perlu tindak lanjut'].indexOf(request.status) < 0) throw new Error('Status pemeriksaan tidak valid.');
  const score = request.score === '' ? '' : Number(request.score);
  if (score !== '' && (!isFinite(score) || score < 0 || score > 100)) throw new Error('Nilai akhir harus 0–100.');
  const record = { 'ID Pengumpulan': request.id, 'Status': request.status, 'Nilai Akhir': score,
    'Catatan Guru': String(request.note || '').slice(0, 5000), 'Diperiksa': new Date() };
  pkUpdate_(pkSheet_(ss, 'Pemeriksaan_Guru'), request.id, record);
  pkWrite_(pkSheet_(ss, 'Riwayat_Pemeriksaan'), record);
  return record;
}
function pkReopen_(id) {
  const ss = pkDb_(), p = pkFind_(ss.getSheetByName('Peserta_Tugas'), id);
  if (!p) throw new Error('Peserta tidak ditemukan.');
  if (!pkFinalRecord_(ss, pkFinalKey_(p))) throw new Error('Peserta belum mengumpulkan versi ini.');
  pkUpdate_(ss.getSheetByName('Peserta_Tugas'), id, { 'Revisi': Number(p.Revisi || 0) + 1 });
  return { revision: Number(p.Revisi || 0) + 1 };
}
function pkRetryAi_(id) {
  const ss = pkDb_(), row = pkFind_(ss.getSheetByName('Analisis_AI'), id);
  if (!row) {
    const detail = pkFind_(ss.getSheetByName('RekapPengumpulan'), id);
    if (!detail) throw new Error('Pengumpulan tidak ditemukan.');
    const raw = pkFind_(ss.getSheetByName(detail['Sheet Detail']), id);
    pkQueueAnalysis_(ss, id, new Date(), pkNormalize_(JSON.parse(pkJoinParts_(raw, 'Data JSON Lengkap'))));
  } else {
    if (['GAGAL', 'COBA_LAGI'].indexOf(row['Status AI']) < 0) throw new Error('Hanya analisis gagal yang dapat dicoba ulang.');
    pkUpdate_(ss.getSheetByName('Analisis_AI'), id, { 'Status AI': 'MENUNGGU', 'Percobaan': 0, 'Pesan Error': '' });
  }
  return { queued: true };
}
