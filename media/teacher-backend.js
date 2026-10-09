// Private helpers end in _ so they cannot be invoked through google.script.run.
const PK_ACTIVE_MEDIA = [];
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
    if (request.action === 'loginDashboard') {
      const login = pkLogin_(request.password);
      return { success: true, data: { token: login.token, dashboard: pkDashboardFast_() } };
    }
    pkTeacherAuth_(request.token);
    let data;
    if (request.action === 'logout') { CacheService.getScriptCache().remove('pk_teacher_' + pkHash_(request.token)); data = {}; }
    else if (request.action === 'saveCatalogSettings') data = pkLocked_(function() { return pkSaveCatalogSettings_(request.changes || {}); });
    else if (request.action === 'dashboardFast') data = pkDashboardFast_();
    else if (request.action === 'taskData') data = pkTaskData_();
    else if (request.action === 'studentData') data = pkStudentData_();
    else if (request.action === 'dashboard') data = pkDashboard_();
    else if (request.action === 'detail') data = pkTeacherDetail_(String(request.id || ''));
    else if (request.action === 'saveStudents') data = pkLocked_(function() { return pkSaveStudents_(request.students || ''); });
    else if (request.action === 'setStudentActive') data = pkLocked_(function() { return pkSetStudentActive_(String(request.id || ''), request.active === true); });
    else if (request.action === 'saveTask') data = pkLocked_(function() { return pkSaveTask_(request.task || {}); });
    else if (request.action === 'archiveTask') data = pkLocked_(function() { return pkArchiveTask_(String(request.id || '')); });
    else if (request.action === 'deleteTask') data = pkLocked_(function() { return pkDeleteTask_(String(request.id || '')); });
    else if (request.action === 'review') data = pkLocked_(function() { return pkSaveReview_(request); });
    else if (request.action === 'reopen') data = pkLocked_(function() { return pkReopen_(String(request.id || '')); });
    else if (request.action === 'retryAI') data = pkLocked_(function() { return pkRetryAi_(String(request.id || '')); });
    else throw new Error('Aksi guru tidak dikenal.');
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (e) { return { success: false, message: e.message }; }
}
function pkDashboardFast_() {
  const ss = pkDb_();
  const roster = pkRows_(ss, 'Daftar_Siswa'), taskRows = pkRows_(ss, 'Daftar_Tugas');
  const resolveClass = pkBuildClassResolver_(roster, [], taskRows);
  const ai = {}; pkRows_(ss, 'Analisis_AI').forEach(function(r) { ai[r['ID Pengumpulan']] = r; });
  const reviews = {}; pkRows_(ss, 'Pemeriksaan_Guru').forEach(function(r) { reviews[r['ID Pengumpulan']] = r; });
  const results = pkRows_(ss, 'RekapPengumpulan').map(function(r) {
    const a = ai[r['ID Pengumpulan']] || {}, v = reviews[r['ID Pengumpulan']] || {};
    return { id: r['ID Pengumpulan'], taskId: r['ID Tugas'] || '', task: r['Judul Tugas'] || 'Pengumpulan lama',
      name: r.Nama, className: resolveClass(r.Kelas, r.Nama, r['NIS / Absen'], r['ID Tugas']), nis: String(r['NIS / Absen'] || '').replace(/^'/, ''), identityConfirmed: pkIdentityConfirmed_(r, v), media: r.Materi, time: r['Waktu Pengumpulan'],
      quiz: r['Nilai Kuis'], late: r['Terlambat'] === true, revision: r.Revisi || 0,
      aiStatus: a['Status AI'] || 'BELUM_DIANTREKAN', aiScore: a['Skor Rekomendasi AI'] === undefined ? '' : a['Skor Rekomendasi AI'],
      summary: a['Ringkasan AI'] || '', misconception: a.Miskonsepsi || '', model: a['Model AI'] || '', error: a['Pesan Error'] || '',
      review: v.Status || 'Belum diperiksa', finalScore: v['Nilai Akhir'] === undefined ? '' : v['Nilai Akhir'] };
  });
  const tasks = pkRows_(ss, 'Daftar_Tugas').map(function(t) {
    let classCodes = {}; try { classCodes = JSON.parse(t['Kode Kelas JSON'] || '{}'); } catch (_) {}
    const submissionCount = results.reduce(function(n, r) { return n + (String(r.taskId) === String(t['ID Pengumpulan']) ? 1 : 0); }, 0);
    return Object.assign({}, t, { classCodes: classCodes, submissionCount: submissionCount });
  });
  const classes = pkUniqueClassNames_(roster.filter(function(s) { return s.Aktif === true || String(s.Aktif).toUpperCase() === 'TRUE'; }).map(function(s) { return s.Kelas; }));
  if (results.some(function(r) { return r.className === 'Belum terpetakan'; })) classes.push('Belum terpetakan');
  return { results: results.reverse(), tasks: tasks, participants: [], students: [], classes: classes,
    media: PK_ACTIVE_MEDIA };
}
function pkTaskData_() {
  const ss = pkDb_(), results = pkRows_(ss, 'RekapPengumpulan').map(function(r) {
    return { taskId: r['ID Tugas'] || '', name: r.Nama, className: r.Kelas, nis: r['NIS / Absen'], revision: r.Revisi || 0 };
  });
  return pkRows_(ss, 'Peserta_Tugas').map(function(p) {
    const finalKey = pkFinalKey_(p), submitted = pkRowsCachedFinal_(results, p);
    return { id: p['ID Pengumpulan'], taskId: p['ID Tugas'], name: p.Nama, nis: p['NIS / Absen'], className: p.Kelas,
      code: p['Kode Akses'], revision: p.Revisi || 0, submitted: submitted, finalKey: finalKey };
  });
}
function pkStudentData_() {
  return pkRows_(pkDb_(), 'Daftar_Siswa').map(function(s) { return { id: s['ID Pengumpulan'], nis: s['NIS / Absen'], name: s.Nama,
    className: s.Kelas, active: s.Aktif === true || String(s.Aktif).toUpperCase() === 'TRUE' }; });
}
function pkDashboard_() {
  const ss = pkDb_();
  const rosterRows = pkRows_(ss, 'Daftar_Siswa'), participantRows = pkRows_(ss, 'Peserta_Tugas'), taskRows = pkRows_(ss, 'Daftar_Tugas');
  const resolveClass = pkBuildClassResolver_(rosterRows, participantRows, taskRows);
  const ai = {}; pkRows_(ss, 'Analisis_AI').forEach(function(r) { ai[r['ID Pengumpulan']] = r; });
  const reviews = {}; pkRows_(ss, 'Pemeriksaan_Guru').forEach(function(r) { reviews[r['ID Pengumpulan']] = r; });
  const results = pkRows_(ss, 'RekapPengumpulan').map(function(r) {
    const a = ai[r['ID Pengumpulan']] || {}, v = reviews[r['ID Pengumpulan']] || {};
    return { id: r['ID Pengumpulan'], taskId: r['ID Tugas'] || '', task: r['Judul Tugas'] || 'Pengumpulan lama',
      name: r.Nama, className: resolveClass(r.Kelas, r.Nama, r['NIS / Absen'], r['ID Tugas']), nis: String(r['NIS / Absen'] || '').replace(/^'/, ''), identityConfirmed: pkIdentityConfirmed_(r, v), media: r.Materi, time: r['Waktu Pengumpulan'],
      quiz: r['Nilai Kuis'], late: r['Terlambat'] === true, revision: r.Revisi || 0,
      aiStatus: a['Status AI'] || 'BELUM_DIANTREKAN', aiScore: a['Skor Rekomendasi AI'] === undefined ? '' : a['Skor Rekomendasi AI'],
      summary: a['Ringkasan AI'] || '', misconception: a.Miskonsepsi || '', model: a['Model AI'] || '', error: a['Pesan Error'] || '',
      review: v.Status || 'Belum diperiksa', finalScore: v['Nilai Akhir'] === undefined ? '' : v['Nilai Akhir'] };
  });
  const tasks = pkRows_(ss, 'Daftar_Tugas').map(function(t) {
    let classCodes = {};
    if (t['Kode Kelas JSON']) {
      try { classCodes = JSON.parse(t['Kode Kelas JSON']); } catch (_) {}
    }
    const submissionCount = results.reduce(function(total, r) { return total + (String(r.taskId || '') === String(t['ID Pengumpulan']) ? 1 : 0); }, 0);
    return Object.assign({}, t, { classCodes: classCodes, submissionCount: submissionCount });
  });
  const participants = participantRows.map(function(p) {
    const finalKey = pkFinalKey_(p);
    const submitted = pkRowsCachedFinal_(results, p);
    return { id: p['ID Pengumpulan'], taskId: p['ID Tugas'], name: p.Nama, nis: p['NIS / Absen'], className: p.Kelas,
      code: p['Kode Akses'], revision: p.Revisi || 0, submitted: submitted, finalKey: finalKey };
  });
  const students = rosterRows.map(function(s) { return { id: s['ID Pengumpulan'], nis: s['NIS / Absen'], name: s.Nama,
    className: s.Kelas, active: s.Aktif === true || String(s.Aktif).toUpperCase() === 'TRUE' }; });
  const classes = pkUniqueClassNames_(students.filter(function(s) { return s.active; }).map(function(s) { return s.className; }));
  if (results.some(function(r) { return r.className === 'Belum terpetakan'; })) classes.push('Belum terpetakan');
  return { results: results.reverse(), tasks: tasks, participants: participants, students: students, classes: classes,
    media: PK_ACTIVE_MEDIA };
}
function pkClassBaseKey_(value) {
  return String(value || '').toLowerCase().replace(/\bfase\s*[ef]\b/gi, '').replace(/[^a-z0-9]/g, '');
}
function pkUniqueClassNames_(names) {
  const seen = {}, output = [];
  (names || []).forEach(function(name) {
    const clean = String(name || '').trim(), key = pkClassBaseKey_(clean);
    if (clean && !seen[key]) { seen[key] = true; output.push(clean); }
  });
  return output.sort();
}
function pkBuildClassResolver_(roster, participants, tasks) {
  return function(rawClass, name, nis, taskId) {
    const normName = String(name || '').trim().toLowerCase(), normNis = String(nis || '').replace(/^'/, '').trim();
    const identityMatch = function(row) { return (normNis && String(row['NIS / Absen'] || '').replace(/^'/, '').trim() === normNis) ||
      (normName && String(row.Nama || row.name || '').trim().toLowerCase() === normName); };
    const participant = (participants || []).find(function(p) { return String(p['ID Tugas']) === String(taskId || '') && identityMatch(p); });
    if (participant) return String(participant.Kelas || '').trim() || 'Belum terpetakan';
    const student = (roster || []).find(identityMatch);
    if (student) return String(student.Kelas || '').trim() || 'Belum terpetakan';
    const key = pkClassBaseKey_(rawClass), known = (roster || []).find(function(s) { return pkClassBaseKey_(s.Kelas) === key; });
    if (known) return String(known.Kelas || '').trim();
    return rawClass && !/^\d{4}-\d\d-\d\dT/.test(String(rawClass)) ? String(rawClass).trim() : 'Belum terpetakan';
  };
}
function pkRowsCachedFinal_(results, p) {
  const normName = String(p.Nama || p.name || '').toLowerCase().trim();
  const cls = String(p.Kelas || p.className || '').trim();
  return results.some(function(r) {
    const matchTask = r.taskId === p['ID Tugas'] || r.taskId === p.taskId;
    const matchClass = !cls || String(r.className || '').trim() === cls;
    const matchName = String(r.name || '').toLowerCase().trim() === normName;
    const matchNis = p['NIS / Absen'] && String(r.nis) === String(p['NIS / Absen']);
    const matchRev = Number(r.revision || 0) === Number(p.Revisi || p.revision || 0);
    return matchTask && matchRev && (matchName || matchNis) && matchClass;
  });
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
function pkIdentityConfirmed_(record, review) {
  return record && (record['Identitas Dikonfirmasi'] === true || String(record['Identitas Dikonfirmasi']).toUpperCase() === 'TRUE') ||
    review && (review['Identitas Dikonfirmasi'] === true || String(review['Identitas Dikonfirmasi']).toUpperCase() === 'TRUE') || false;
}
function pkStudentId_(className, nis) { return pkHash_(String(className).toLowerCase() + '|' + String(nis).toLowerCase()); }
function pkSaveStudents_(text) {
  const ss = pkDb_(), lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error('Isi data siswa dengan format Kelas|NIS|Nama.');
  if (lines.length > 1000) throw new Error('Maksimal 1.000 siswa dalam satu impor.');
  const seen = {}, records = lines.map(function(line, index) {
    const cells = line.split('|').map(function(s) { return s.trim(); });
    if (cells.length !== 3 || !cells[0] || !/^[a-zA-Z0-9._-]{1,40}$/.test(cells[1]) || !cells[2]) throw new Error('Baris ' + (index + 1) + ': gunakan Kelas|NIS|Nama.');
    const className = cells[0].slice(0, 80), nis = cells[1], name = cells[2].slice(0, 120), id = pkStudentId_(className, nis);
    if (seen[id]) throw new Error('Siswa duplikat pada baris ' + (index + 1) + ': ' + className + ' / ' + nis);
    seen[id] = true; return { id: id, className: className, nis: nis, name: name };
  });
  const sheet = pkSheet_(ss, 'Daftar_Siswa');
  records.forEach(function(s) { pkUpdate_(sheet, s.id, { 'ID Pengumpulan': s.id, 'NIS / Absen': s.nis, 'Nama': s.name, 'Kelas': s.className, 'Aktif': true, 'Diperbarui': new Date() }); });
  const participantSheet = ss.getSheetByName('Peserta_Tugas');
  if (participantSheet) {
    const byIdentity = {};
    records.forEach(function(s) { byIdentity[String(s.className).toLowerCase() + '|' + String(s.nis)] = s.name; });
    pkRows_(ss, 'Peserta_Tugas').forEach(function(p) {
      const key = String(p.Kelas || '').toLowerCase() + '|' + String(p['NIS / Absen'] || '');
      if (byIdentity[key] && byIdentity[key] !== p.Nama) pkUpdate_(participantSheet, p['ID Pengumpulan'], { 'Nama': byIdentity[key] });
    });
  }
  return { saved: records.length };
}
function pkSetStudentActive_(id, active) {
  const ss = pkDb_(), sheet = ss.getSheetByName('Daftar_Siswa'), student = pkFind_(sheet, id);
  if (!student) throw new Error('Siswa tidak ditemukan.');
  pkUpdate_(sheet, id, { 'Aktif': active, 'Diperbarui': new Date() });
  return { id: id, active: active };
}
function pkTaskClasses_(task) {
  if (Array.isArray(task.classes)) return task.classes;
  if (task['Kelas JSON']) { try { return JSON.parse(task['Kelas JSON']); } catch (_) {} }
  return String(task.className || task.Kelas || '').split(',');
}
function pkClassCodeClean_(cls) {
  return String(cls || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
function pkDeleteRowsByValue_(sheet, columnName, value) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const column = headers.indexOf(columnName);
  if (column < 0) return 0;
  const values = sheet.getRange(2, column + 1, sheet.getLastRow() - 1, 1).getValues();
  const rows = [];
  values.forEach(function(row, index) { if (String(row[0]) === String(value)) rows.push(index + 2); });
  rows.reverse().forEach(function(row) { sheet.deleteRow(row); });
  return rows.length;
}
function pkArchiveTask_(id) {
  const ss = pkDb_(), sheet = pkSheet_(ss, 'Daftar_Tugas'), task = pkFind_(sheet, id);
  if (!task) throw new Error('Tugas tidak ditemukan.');
  if (task.Status !== 'NONAKTIF') pkUpdate_(sheet, id, { 'Status': 'NONAKTIF', 'Terbuka': false, 'Diperbarui': new Date() });
  return Object.assign({}, task, { 'Status': 'NONAKTIF', 'Terbuka': false });
}
function pkDeleteTask_(id) {
  const ss = pkDb_(), sheet = pkSheet_(ss, 'Daftar_Tugas'), task = pkFind_(sheet, id);
  if (!task) throw new Error('Tugas tidak ditemukan.');
  const hasResults = pkRows_(ss, 'RekapPengumpulan').some(function(r) { return String(r['ID Tugas'] || '') === id; });
  if (hasResults) throw new Error('Tugas sudah memiliki hasil. Arsipkan tugas agar rekap dan analisis tetap tersimpan.');
  pkDeleteRowsByValue_(pkSheet_(ss, 'Peserta_Tugas'), 'ID Tugas', id);
  pkDeleteRowsByValue_(sheet, 'ID Pengumpulan', id);
  return { id: id, deleted: true };
}
function pkMakeClassCode_(taskId, className) {
  const clean = pkClassCodeClean_(className);
  const hash = pkHash_(taskId + '|' + className).slice(0, 4).toUpperCase();
  return ('KIM-' + (clean || 'KLS') + '-' + hash).slice(0, 24);
}

function pkSaveTask_(task) {
  const ss = pkDb_();
  const existing = task.id ? pkFind_(ss.getSheetByName('Daftar_Tugas'), task.id) : null;
  if (task.id && !existing) throw new Error('Tugas tidak ditemukan.');
  const id = existing ? existing['ID Pengumpulan'] : Utilities.getUuid();
  const title = String(task.title || '').trim().slice(0, 160);
  const classes = Array.from(new Set(pkTaskClasses_(task).map(function(x) { return String(x).trim().slice(0, 80); }).filter(Boolean))).sort();
  if (!title || !classes.length || !PK_MEDIA[task.mediaId]) throw new Error('Isi judul, pilih minimal satu kelas, dan pilih media.');
  const activeStudents = pkRows_(ss, 'Daftar_Siswa').filter(function(s) { return (s.Aktif === true || String(s.Aktif).toUpperCase() === 'TRUE') && classes.indexOf(String(s.Kelas)) >= 0; });
  if (!activeStudents.length) throw new Error('Kelas yang dipilih belum memiliki siswa aktif pada Daftar_Siswa.');
  const savedClasses = existing ? pkTaskClasses_(existing).map(String).sort() : [];
  const taskResults = existing ? pkRows_(ss, 'RekapPengumpulan').filter(function(r) { return String(r['ID Tugas'] || '') === id; }) : [];
  if (existing && existing['ID Media'] !== task.mediaId && taskResults.length) throw new Error('Media tidak dapat diganti karena tugas ini sudah memiliki hasil pengumpulan.');
  const removedClasses = savedClasses.filter(function(c) { return classes.indexOf(c) < 0; });
  if (removedClasses.length) {
    const participants = pkRows_(ss, 'Peserta_Tugas').filter(function(p) { return String(p['ID Tugas']) === id && removedClasses.indexOf(String(p.Kelas)) >= 0; });
    const submitted = participants.some(function(p) {
      const name = String(p.Nama || '').trim().toLowerCase(), nis = String(p['NIS / Absen'] || '').trim();
      return taskResults.some(function(r) {
        const sameClass = String(r.Kelas || '').trim() === String(p.Kelas || '').trim();
        return sameClass && ((nis && String(r['NIS / Absen'] || '').replace(/^'/, '').trim() === nis) ||
          (name && String(r.Nama || '').trim().toLowerCase() === name));
      });
    });
    if (submitted) throw new Error('Kelas tidak dapat dihapus karena sudah memiliki hasil siswa. Kelas lain dan peserta tanpa hasil tetap dapat diubah.');
  }
  const due = task.due ? new Date(task.due) : null;
  if (due && !isFinite(due.getTime())) throw new Error('Tenggat tidak valid.');

  let oldClassCodes = {};
  if (existing && existing['Kode Kelas JSON']) {
    try { oldClassCodes = JSON.parse(existing['Kode Kelas JSON']); } catch (_) {}
  }
  let classCodes = {};
  classes.forEach(function(c) {
    const requested = String(task.classCodes && task.classCodes[c] || '').trim().toUpperCase();
    if (requested && !/^[A-Z0-9_-]{6,24}$/.test(requested)) throw new Error('Kode kelas harus 6–24 karakter dan hanya berisi huruf, angka, tanda hubung, atau garis bawah.');
    if (requested) classCodes[c] = requested;
    else if (oldClassCodes[c]) classCodes[c] = String(oldClassCodes[c]).toUpperCase();
    if (!classCodes[c]) {
      classCodes[c] = pkMakeClassCode_(id, c);
    }
  });
  const codeValues = Object.keys(classCodes).map(function(c) { return String(classCodes[c]).trim().toUpperCase(); });
  if (new Set(codeValues).size !== codeValues.length) throw new Error('Setiap kelas dalam tugas ini harus memakai kode yang berbeda.');
  pkRows_(ss, 'Daftar_Tugas').forEach(function(other) {
    if (String(other['ID Pengumpulan']) === id || other.Status === 'NONAKTIF') return;
    let otherCodes = [];
    try { otherCodes = Object.values(JSON.parse(other['Kode Kelas JSON'] || '{}')); } catch (_) {}
    if (!otherCodes.length && other['Kode Kelas']) otherCodes = String(other['Kode Kelas']).split(',');
    if (otherCodes.some(function(code) { return codeValues.indexOf(String(code).trim().toUpperCase()) >= 0; })) {
      throw new Error('Kode kelas sudah digunakan pada tugas lain. Pilih kode yang berbeda.');
    }
  });

  const record = { 'ID Pengumpulan': id, 'Judul': title, 'ID Media': task.mediaId, 'Kelas': classes.join(', '), 'Kelas JSON': JSON.stringify(classes),
    'Kode Kelas JSON': JSON.stringify(classCodes), 'Kode Kelas': Object.values(classCodes).join(', '),
    'Tenggat': due ? due.toISOString() : '', 'Terbuka': task.open === true, 'Izinkan Terlambat': task.allowLate === true,
    'Diperbarui': new Date() };
  pkUpdate_(pkSheet_(ss, 'Daftar_Tugas'), id, record);
  if (removedClasses.length) {
    const participantSheet = pkSheet_(ss, 'Peserta_Tugas');
    pkRows_(ss, 'Peserta_Tugas').filter(function(p) { return String(p['ID Tugas']) === id && removedClasses.indexOf(String(p.Kelas)) >= 0; }).forEach(function(p) {
      pkDeleteRowsByValue_(participantSheet, 'ID Pengumpulan', p['ID Pengumpulan']);
    });
  }
  activeStudents.forEach(function(p) {
    const participantId = pkHash_(id + '|' + p.Kelas + '|' + p['NIS / Absen']);
    const participantSheet = pkSheet_(ss, 'Peserta_Tugas'), previous = pkFind_(participantSheet, participantId);
    const code = classCodes[p.Kelas] || pkMakeClassCode_(id, p.Kelas);
    if (previous) { pkUpdate_(participantSheet, participantId, { 'Nama': p.Nama, 'NIS / Absen': p['NIS / Absen'], 'Kelas': p.Kelas, 'Kode Akses': code }); return; }
    pkWrite_(participantSheet, { 'ID Pengumpulan': participantId, 'ID Tugas': id, 'Nama': p.Nama,
      'NIS / Absen': p['NIS / Absen'], 'Kelas': p.Kelas, 'Kode Akses': code, 'Revisi': 0 });
  });
  return Object.assign(record, { 'Jumlah Peserta': activeStudents.length, classCodes: classCodes });
}
function pkFinalKey_(p) { return pkHash_(p['ID Pengumpulan'] + '|' + Number(p.Revisi || 0)); }
function pkValidateCode_(code, p, task) {
  if (!code) return false;
  const upperCode = String(code).trim().toUpperCase();
  if (p && String(p['Kode Akses'] || '').trim().toUpperCase() === upperCode) return true;
  if (task && task['Kode Kelas JSON']) {
    try {
      const map = JSON.parse(task['Kode Kelas JSON']);
      if (p && p.Kelas && map[p.Kelas]) {
        return String(map[p.Kelas]).trim().toUpperCase() === upperCode;
      }
      return Object.values(map).some(function(v) { return String(v).trim().toUpperCase() === upperCode; });
    } catch (_) {}
  }
  if (task && String(task['Kode Kelas'] || '').trim().toUpperCase().includes(upperCode)) return true;
  return false;
}
function pkParticipant_(ss, data) {
  data = data || {};
  let task = null;
  const code = String(data.classCode || data.studentAccessCode || '').trim();
  if (!code || !/^[a-zA-Z0-9._-]{6,40}$/.test(code)) throw new Error('Kode pengumpulan tidak valid.');

  if (data.assignmentId) {
    task = pkFind_(ss.getSheetByName('Daftar_Tugas'), String(data.assignmentId));
  }

  // If not found by assignmentId, search task by classCode
  if (!task) {
    const tasks = pkRows_(ss, 'Daftar_Tugas');
    task = tasks.find(function(t) {
      if (t.Status === 'NONAKTIF') return false;
      if (t['Kode Kelas JSON']) {
        try {
          const map = JSON.parse(t['Kode Kelas JSON']);
          return Object.values(map).some(function(v) { return String(v).toUpperCase() === code.toUpperCase(); });
        } catch (_) {}
      }
      return String(t['Kode Kelas'] || '').toUpperCase().includes(code.toUpperCase());
    }) || null;
  }

  if (!task) throw new Error('ID tugas atau kode kelas tidak ditemukan.');
  if (task.Status === 'NONAKTIF') throw new Error('Tugas ini sudah dinonaktifkan.');
  if (task['ID Media'] !== data.mediaId) throw new Error('Media ini tidak sesuai dengan tugas.');

  const participants = pkRows_(ss, 'Peserta_Tugas').filter(function(p) { return p['ID Tugas'] === task['ID Pengumpulan']; });
  let participant = null;

  const studentName = String(data.studentName || data.name || (data.siswa && data.siswa.nama) || '').trim().toLowerCase();
  const studentNis = String(data.nis || (data.siswa && data.siswa.nis) || '').trim();

  // Match by student name / NIS and verify code
  if (studentName || studentNis) {
    const matched = participants.filter(function(p) {
      if (studentNis && String(p['NIS / Absen']) === studentNis) return true;
      if (studentName) {
        const pName = String(p.Nama || '').toLowerCase().trim();
        return pName === studentName || pName.startsWith(studentName) || studentName.startsWith(pName);
      }
      return false;
    });
    participant = matched.find(function(p) {
      return pkValidateCode_(code, p, task);
    }) || null;
  }

  // Fallback: match by code directly if unique
  if (!participant && !studentName && !studentNis) {
    participant = participants.find(function(p) {
      return String(p['Kode Akses'] || '').toUpperCase() === code.toUpperCase();
    });
  }

  // If studentName provided and code is a valid class code, auto-create participant row
  if (!participant && studentName) {
    let targetClass = '';
    if (task['Kode Kelas JSON']) {
      try {
        const map = JSON.parse(task['Kode Kelas JSON']);
        for (const [cls, cCode] of Object.entries(map)) {
          if (String(cCode).toUpperCase() === code.toUpperCase()) { targetClass = cls; break; }
        }
      } catch (_) {}
    }
    if (!targetClass && task['Kode Kelas']) {
      if (String(task['Kode Kelas']).trim().toUpperCase() === code.toUpperCase()) {
        const classes = pkTaskClasses_(task);
        if (classes.length === 1) targetClass = classes[0];
      }
    }
    if (targetClass) {
      const pId = pkHash_(task['ID Pengumpulan'] + '|' + targetClass + '|' + studentName);
      const pSheet = pkSheet_(ss, 'Peserta_Tugas');
      const newP = {
        'ID Pengumpulan': pId, 'ID Tugas': task['ID Pengumpulan'], 'Nama': data.studentName || studentName,
        'NIS / Absen': String(data.nis || (data.siswa && data.siswa.nis) || 'BELUM-DIVERIFIKASI'),
        'Kelas': targetClass, 'Kode Akses': code.toUpperCase(), 'Revisi': 0
      };
      pkWrite_(pSheet, newP);
      participant = newP;
    }
  }

  if (!participant) throw new Error('Kode pengumpulan tidak sesuai dengan tugas.');
  return { task: task, participant: participant, finalKey: pkFinalKey_(participant) };
}
function pkFinalRecord_(ss, key, participant, mediaId) {
  const rows = pkRows_(ss, 'RekapPengumpulan');
  const byKey = rows.find(function(r) { return r['Kunci Final'] === key; });
  if (byKey) return byKey;

  // Deduplicate strictly based on Nama Siswa per Media (and Kelas):
  if (participant) {
    const normName = String(participant.Nama || '').toLowerCase().trim();
    const cls = String(participant.Kelas || '').trim();
    const rev = Number(participant.Revisi || 0);
    const byName = rows.find(function(r) {
      const sameMedia = (!mediaId || r['ID Media'] === mediaId || r['ID Tugas'] === participant['ID Tugas']);
      const sameName = String(r.Nama || '').toLowerCase().trim() === normName;
      const sameClass = !cls || String(r.Kelas || '').trim() === cls;
      const sameRev = Number(r.Revisi || 0) === rev;
      return sameMedia && sameName && sameClass && sameRev;
    });
    if (byName) return byName;
  }
  return null;
}
function pkCheckTask_(ss, data) {
  const access = pkParticipant_(ss, data), task = access.task;
  const previous = pkFinalRecord_(ss, access.finalKey, access.participant, task['ID Media']);
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
    const previous = pkFinalRecord_(ss, access.finalKey, p, t['ID Media']);
    return { success: true, title: t.Judul, name: p.Nama, className: p.Kelas, nis: p['NIS / Absen'],
      revision: Number(p.Revisi || 0), due: t.Tenggat || '', open: t.Terbuka === true,
      allowLate: t['Izinkan Terlambat'] === true, stored: !!previous, submissionId: previous ? previous['ID Pengumpulan'] : '',
      assignmentId: t['ID Pengumpulan'], studentAccessCode: p['Kode Akses'] };
  } catch (e) { return { success: false, message: e.message }; }
}
function pkSaveReview_(request) {
  const ss = pkDb_();
  const resultSheet = ss.getSheetByName('RekapPengumpulan'), submitted = pkFind_(resultSheet, request.id);
  if (!submitted) throw new Error('Pengumpulan tidak ditemukan.');
  if (['Disetujui', 'Dikoreksi', 'Perlu tindak lanjut'].indexOf(request.status) < 0) throw new Error('Status pemeriksaan tidak valid.');
  const score = request.score === '' ? '' : Number(request.score);
  if (score !== '' && (!isFinite(score) || score < 0 || score > 100)) throw new Error('Nilai akhir harus 0–100.');
  const record = { 'ID Pengumpulan': request.id, 'Status': request.status, 'Nilai Akhir': score,
    'Catatan Guru': String(request.note || '').slice(0, 5000), 'Diperiksa': new Date() };
  if (request.identityConfirmed === true) {
    const verifiedName = String(request.studentName || '').trim().slice(0, 120), verifiedNis = String(request.nis || '').trim().slice(0, 40);
    if (!verifiedName || !verifiedNis) throw new Error('Nama dan NIS harus diisi untuk mengonfirmasi identitas siswa.');
    pkUpdate_(resultSheet, request.id, { 'Nama': verifiedName, 'NIS / Absen': verifiedNis, 'Identitas Dikonfirmasi': true });
    record['Identitas Dikonfirmasi'] = true; record['Nama Terverifikasi'] = verifiedName; record['NIS Terverifikasi'] = verifiedNis;
    const participants = pkRows_(ss, 'Peserta_Tugas');
    const p = participants.find(function(x) { return String(x['ID Tugas']) === String(submitted['ID Tugas']) && String(x.Kelas) === String(submitted.Kelas) &&
      (String(x.Nama || '').trim().toLowerCase() === String(submitted.Nama || '').trim().toLowerCase() || String(x['NIS / Absen'] || '') === String(submitted['NIS / Absen'] || '')); });
    if (p) pkUpdate_(pkSheet_(ss, 'Peserta_Tugas'), p['ID Pengumpulan'], { 'Nama': verifiedName, 'NIS / Absen': verifiedNis });
  }
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

// Public catalogue presentation metadata only; student information is never included.
function portalCatalogSettings() {
  try { return { success: true, data: pkReadCatalogSettings_() }; }
  catch (e) { return { success: false, message: e.message }; }
}
function pkReadCatalogSettings_() {
  const result = {};
  pkRows_(pkDb_(), 'Pengaturan_Katalog').forEach(function(row) {
    const key = String(row['ID Pengumpulan'] || '');
    if (/^(material:|chapter:|learningOrder$|chapterOrder$)/.test(key)) {
      try { result[key] = JSON.parse(row['Pengaturan JSON']); } catch (_) {}
    }
  });
  return result;
}
function pkSaveCatalogSettings_(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes) || JSON.stringify(changes).length > 300000) throw new Error('Pengaturan katalog tidak valid atau terlalu besar.');
  const records = Object.keys(changes).map(function(key) {
    if (!/^(material:[a-zA-Z0-9_-]{1,160}|chapter:[a-zA-Z0-9_-]{1,160}|learningOrder|chapterOrder)$/.test(key)) throw new Error('Kunci pengaturan katalog tidak valid.');
    const value = changes[key];
    if (key.indexOf('chapter:') === 0 && (typeof value !== 'string' || !value.trim() || value.length > 180)) throw new Error('Judul bab tidak valid.');
    if (/Order$/.test(key) && (!Array.isArray(value) || value.some(function(id) { return typeof id !== 'string' && typeof id !== 'number'; }))) throw new Error('Urutan katalog tidak valid.');
    if (key.indexOf('material:') === 0) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Metadata media tidak valid.');
      const allowed = ['title','grade','format','topic','subject','url','description','thumbnail','chapterOverride'];
      if (Object.keys(value).some(function(field) { return allowed.indexOf(field) === -1; })) throw new Error('Kolom metadata media tidak valid.');
    }
    const json = JSON.stringify(value);
    if (json.length > 40000) throw new Error('Satu pengaturan katalog terlalu panjang.');
    return { 'ID Pengumpulan': key, 'Pengaturan JSON': json, 'Diubah': new Date() };
  });
  const sheet = pkSheet_(pkDb_(), 'Pengaturan_Katalog');
  records.forEach(function(record) { pkUpdate_(sheet, record['ID Pengumpulan'], record); });
  return { saved: true, count: records.length };
}
