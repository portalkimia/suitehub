const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const client = fs.readFileSync(path.join(root, 'submission-client.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'submission-backend.js'), 'utf8');
const rules = [
  [/Sel_?Volta/i, 'sel-volta', 'Sel Volta'], [/Sel_?Elektrolisis/i, 'sel-elektrolisis', 'Sel Elektrolisis'],
  [/Bohr/i, 'konfigurasi-bohr', 'Konfigurasi Elektron Model Bohr'],
  [/Bilangan_?Kuantum/i, 'bilangan-kuantum', 'Bilangan Kuantum'],
  [/Konfigurasi.*Kuantum/i, 'konfigurasi-kuantum', 'Konfigurasi Elektron Mekanika Kuantum'],
  [/Periode/i, 'periode-golongan', 'Periode dan Golongan'], [/Sejarah/i, 'sejarah-spu', 'Sejarah Perkembangan SPU'],
  [/Sifat/i, 'sifat-keperiodikan', 'Sifat Keperiodikan Unsur'],
  [/Setengah_Reaksi/i, 'redoks-setengah-reaksi', 'Penyetaraan Redoks Metode Setengah Reaksi'],
  [/Penyetaraan/i, 'redoks-biloks', 'Penyetaraan Redoks Metode Biloks'],
  [/Konsep_Redoks/i, 'konsep-redoks', 'Konsep Redoks dan Bilangan Oksidasi'],
  [/Hidrokarbon/i, 'hidrokarbon', 'Senyawa Hidrokarbon'], [/Korosi/i, 'korosi', 'Korosi Logam'],
  [/MediaInteraktif|media_interaktif|Laboratorium/i, 'laboratorium-kimia', 'Laboratorium Kimia Virtual']
];
const changed = [];
function write(file, content) {
  if (fs.readFileSync(file, 'utf8') !== content) { fs.writeFileSync(file, content, 'utf8'); changed.push(path.relative(root,file)); }
}
function replaceFunction(s, name, replacement) {
  const regex = new RegExp('^([ \\t]*)function '+name+'\\([^)]*\\) \\{[\\s\\S]*?^\\1\\}', 'm');
  if (!regex.test(s)) throw new Error('Function missing: '+name);
  return s.replace(regex, replacement);
}
for (const dir of ['', 'Media_Pembelajaran_Kimia_Drive', 'File Spark']) {
  for (const file of fs.readdirSync(path.join(root, dir)).filter(f => /\.html$/i.test(f) && f !== 'index.html')) {
    const full = path.join(root, dir, file);
    let s = fs.readFileSync(full, 'utf8');
    // Existing extra closing brace prevented Bohr/Kuantum scripts from running at all.
    s = s.replace(/(function (?:updateThemeIcons|safeRenderIcons)\(\) \{[\s\S]*?^    \})\r?\n    \}(?=\r?\n\r?\n    (?:function toggleFullscreen|\/\/ ==================== SCROLL))/m, '$1');
    s = s.replace(/(function selectBohrConceptNode\(key\) \{[\s\S]*?^    \})\r?\n    \}(?=\r?\n\r?\n    \/\/ ==================== SHELL)/m, '$1');
    const rule = rules.find(r => r[0].test(file));
    if (!rule) throw new Error('Unknown media: '+file);
    const config = { id: rule[1], title: rule[2] };
    s = s.replace(/\n?<!-- PK-SUBMISSION-V2-START -->[\s\S]*?<!-- PK-SUBMISSION-V2-END -->\n?/g, '');
    const answers = /\blet userQuizAnswers\b/.test(s) ? 'userQuizAnswers' : /\blet userAnswers\b/.test(s) ? 'userAnswers' : 'quizAnswers';
    const questions = /\bconst QUIZ_QUESTIONS\b/.test(s) ? 'QUIZ_QUESTIONS' : /\bconst quizData\b/.test(s) ? 'quizData' : 'quizQuestions';
    const call = 'return PortalSubmission.submit('+JSON.stringify(config)+', '+answers+', '+questions+');';
    const hadSubmit = /function submitToTeacherDatabase\(/.test(s);
    const hadSync = /function syncToPortalDatabase\(/.test(s);
    if (hadSubmit) s = replaceFunction(s, 'submitToTeacherDatabase', '    function submitToTeacherDatabase() {\n      '+call+'\n    }');
    if (hadSync) s = replaceFunction(s, 'syncToPortalDatabase', '    function syncToPortalDatabase() {\n      '+call+'\n    }');
    let extra = '';
    if (!hadSubmit && !hadSync) {
      // These media had a local quiz but no database submission controls.
      extra = '<section data-pk-submit style="max-width:900px;margin:24px auto;padding:20px;border:1px solid #8b5cf6;border-radius:16px">'+
        '<h2>Pengumpulan Hasil Belajar</h2><p>Isi identitas untuk menyimpan hasil kuis dan isian kegiatan.</p>'+
        '<label>Nama <input id="student-name" autocomplete="name" style="color:#111;background:#fff;padding:8px;margin:8px"></label>'+
        '<label>Kelas <input id="student-class" style="color:#111;background:#fff;padding:8px;margin:8px"></label>'+
        '<label>NIS / Absen <input id="student-nis" style="color:#111;background:#fff;padding:8px;margin:8px"></label>'+
        '<button id="btn-submit-db" type="button" onclick="submitToTeacherDatabase()" style="padding:12px;background:#7c3aed;color:#fff;border-radius:8px">Kirim ke Database Guru</button></section>\n';
    }
    // Preserve the added form across rebuilds; only add once.
    if (s.includes('data-pk-submit')) extra = '';
    if (hadSubmit && !/<input\b[^>]*\bid="student-name"/i.test(s)) {
      const identity = '<fieldset data-pk-identity style="padding:16px;margin:16px;border:1px solid #8b5cf6;border-radius:12px"><legend>Identitas Siswa</legend>'+
        '<label>Nama <input id="student-name" oninput="triggerAutoSave()" style="color:#111;background:#fff;padding:8px;margin:8px"></label>'+
        '<label>Kelas <input id="student-class" oninput="triggerAutoSave()" style="color:#111;background:#fff;padding:8px;margin:8px"></label>'+
        '<label>NIS / Absen <input id="student-nis" oninput="triggerAutoSave()" style="color:#111;background:#fff;padding:8px;margin:8px"></label></fieldset>';
      s = s.replace(/(<section\b[^>]*id="section-tugas"[^>]*>)/i, '$1'+identity);
      if (!s.includes('data-pk-identity')) throw new Error('Cannot insert identity: '+file);
    }
    const adapter = (!hadSubmit && !hadSync) ? '\nfunction submitToTeacherDatabase() { '+call+' }\n' : '';
    const block = '\n<!-- PK-SUBMISSION-V2-START -->\n<script>\n'+client+adapter+'\nPortalSubmission.install('+JSON.stringify(config)+');\n</script>\n<!-- PK-SUBMISSION-V2-END -->\n';
    s = s.replace(/<\/body>/i, extra+block+'</body>');
    for (const match of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], {filename:file});
    write(full, s);
  }
}
const gasPath = path.join(root, 'Code.gs');
let gas = fs.readFileSync(gasPath, 'utf8');
gas = gas.replace(/\n?\/\/ PK-BACKEND-V2-START[\s\S]*?\/\/ PK-BACKEND-V2-END\n?/g, '\n');
if (/function simpanTugasSiswa\(/.test(gas)) gas = replaceFunction(gas, 'simpanTugasSiswa', '// Submission implementation is generated at the end of this file.');
if (!gas.includes("action === 'submissionStatus'")) gas = gas.replace("  // API Action Handler untuk Pengumpulan Tugas", "  if (action === 'submissionStatus') return pkStatusOutput_(e.parameter);\n\n  // API Action Handler untuk Pengumpulan Tugas");
// Form-wrapped legacy POSTs must be unpacked before normalization.
if (!gas.includes('PK unwrap data')) gas = gas.replace('    // Jika berupa request sinkronisasi folder Google Drive', "    // PK unwrap data: older media submit an action/data form.\n    if (payload.data && typeof payload.data === 'string') payload = JSON.parse(payload.data);\n\n    // Jika berupa request sinkronisasi folder Google Drive");
gas = gas.trimEnd()+'\n// PK-BACKEND-V2-START\n'+backend+'\n// PK-BACKEND-V2-END\n';
new vm.Script(gas, {filename:'Code.gs'});
write(gasPath, gas);
const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8').replace("'portal-kimia-v5'", "'portal-kimia-v6-submissions'");
if (!sw.includes("'./SelVolta.html'")) sw = sw.replace("  './KonfigurasiBohr.html'", "  './KonfigurasiBohr.html',\n  './SelVolta.html',\n  './SelElektrolisis.html'");
write(swPath, sw);
console.log('Updated '+changed.length+' files: '+changed.join(', '));
