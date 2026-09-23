const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const client = fs.readFileSync(path.join(root, 'submission-client.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'submission-backend.js'), 'utf8');
const teacherBackend = fs.readFileSync(path.join(root, 'teacher-backend.js'), 'utf8');
const rules = [
  [/Hukum_?Faraday/i, 'faraday-elektrolisis', 'Hukum Faraday dan Perhitungan Elektrolisis'],
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
for (const dir of ['', 'Media_Pembelajaran_Kimia_Drive', 'Media_Pembelajaran_Kimia_Drive/Paket_Media_Baru', 'File Spark']) {
  if (!fs.existsSync(path.join(root, dir))) continue;
  for (const file of fs.readdirSync(path.join(root, dir)).filter(f => /\.html$/i.test(f) && !['index.html','Guru.html'].includes(f))) {
    const full = path.join(root, dir, file);
    let s = fs.readFileSync(full, 'utf8');
    if(s.includes('name="pk-native-media"') || /Hukum_Faraday/.test(file)) {
      const match=s.match(/PortalSubmission\.install\((\{[^\n]+?\}), \{questions/);
      let nativeConfig = null;
      if (match) {
        try { nativeConfig = JSON.parse(match[1]); } catch (_) {}
      }
      if (!nativeConfig) {
        const metaMatch = s.match(/<meta\s+name="pk-native-media"\s+content="([^"]+)"/i);
        const titleMatch = s.match(/<title>([^<]+)<\/title>/i);
        const id = metaMatch ? metaMatch[1] : path.basename(file, '.html').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const title = titleMatch ? titleMatch[1].split('•')[0].split('·')[0].trim() : file;
        nativeConfig = { id: id, title: title };
      }
      const questions = s.includes('quizQuestions') ? 'quizQuestions' : (s.includes('soalKuis') ? 'soalKuis' : '[]');
      const answers = s.includes('userAnswers') ? 'userAnswers' : (s.includes('jawabanSiswa') ? 'jawabanSiswa' : 'window.__dummyAnswers');
      const nativeBlock='\n<!-- PK-SUBMISSION-V2-START -->\n<script>\n'+client+'\nPortalSubmission.install('+JSON.stringify(nativeConfig)+', {questions:'+questions+',setAnswers:value=>{'+answers+'=value;}});\n</script>\n<!-- PK-SUBMISSION-V2-END -->';
      if (s.includes('<!-- PK-SUBMISSION-V2-START -->')) {
        s=s.replace(/<!-- PK-SUBMISSION-V2-START -->[\s\S]*?<!-- PK-SUBMISSION-V2-END -->/,()=>nativeBlock);
      } else {
        s=s.replace(/<\/body>/i, nativeBlock+'\n</body>');
      }
      for(const m of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
      write(full,s);continue;
    }
    // Existing extra closing brace prevented Bohr/Kuantum scripts from running at all.
    s = s.replace(/(function (?:updateThemeIcons|safeRenderIcons)\(\) \{[\s\S]*?^    \})\r?\n    \}(?=\r?\n\r?\n    (?:function toggleFullscreen|\/\/ ==================== SCROLL))/m, '$1');
    s = s.replace(/(function selectBohrConceptNode\(key\) \{[\s\S]*?^    \})\r?\n    \}(?=\r?\n\r?\n    \/\/ ==================== SHELL)/m, '$1');
    const rule = rules.find(r => r[0].test(file));
    const config = rule ? { id: rule[1], title: rule[2] } : { id: path.basename(file, '.html').toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: path.basename(file, '.html').replace(/_/g, ' ') };
    s = s.replace(/\n?<!-- PK-SUBMISSION-V2-START -->[\s\S]*?<!-- PK-SUBMISSION-V2-END -->\n?/g, '');
    const draftKeys = [...s.matchAll(/localStorage\.(?:setItem|removeItem)\(['"]([^'"]+)['"]/g)].map(m=>m[1]).filter(k=>!/theme|portalkimia|pk_/.test(k));
    const storageConstant=s.match(/const STORAGE_KEY\s*=\s*['"]([^'"]+)['"]/);
    if(storageConstant)draftKeys.push(storageConstant[1]);
    config.draftKeys=[...new Set(draftKeys)];
    // Guard delayed autosaves as well as immediate ones, without touching theme preferences.
    s=s.replace(/(?<!if \(!window\.PortalSubmission\?\.isFinal\(\)\) )localStorage\.setItem\((['"])([^'"]+)\1/g,(whole,quote,key)=>config.draftKeys.includes(key)?'if (!window.PortalSubmission?.isFinal()) '+whole:whole);
    s=s.replace(/(?<!if \(!window\.PortalSubmission\?\.isFinal\(\)\) )localStorage\.setItem\(STORAGE_KEY/g,'if (!window.PortalSubmission?.isFinal()) localStorage.setItem(STORAGE_KEY');
    if(/function resetQuiz\(/.test(s))s=replaceFunction(s,'resetQuiz','    function resetQuiz() {\n      return; // Evaluasi final tidak dapat diulang oleh siswa.\n    }');
    s=s.replace(/<button\b[^>]*onclick="resetQuiz\([^"\n]*"[^>]*>[\s\S]*?<\/button>/g,'');
    if(!s.includes('data-pk-legacy-eval')) {
      let found=false;
      s=s.replace(/(<section\b[^>]*id="(?:section-kuis|tab-quiz|tab-kuis)"[^>]*>)([\s\S]*?)(<\/section>)/,(_,start,body,end)=>{found=true;return start+'<div data-pk-legacy-eval hidden inert>'+body+'</div><div id="pk-evaluation"></div>'+end;});
      if(!found)throw new Error('Evaluation section missing: '+file);
      s=s.replace('</head>','<style>[data-pk-legacy-eval]{display:none!important}</style>\n</head>');
    }
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
    const block = '\n<!-- PK-SUBMISSION-V2-START -->\n<script>\n'+client+adapter+'\nPortalSubmission.install('+JSON.stringify(config)+', {questions:'+questions+',setAnswers:value=>{'+answers+'=value;}});\n</script>\n<!-- PK-SUBMISSION-V2-END -->\n';
    s = s.replace(/<\/body>/i, extra+block+'</body>');
    for (const match of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], {filename:file});
    write(full, s);
  }
}
const gasPath = path.join(root, 'Code.gs');
let gas = fs.readFileSync(gasPath, 'utf8');
gas = gas.replace(/\n?\/\/ PK-BACKEND-V2-START[\s\S]*?\/\/ PK-BACKEND-V2-END\n?/g, '\n');
gas = gas.replace(/\n?\/\/ PK-TEACHER-START[\s\S]*?\/\/ PK-TEACHER-END\n?/g, '\n');
if (/function simpanTugasSiswa\(/.test(gas)) gas = replaceFunction(gas, 'simpanTugasSiswa', '// Submission implementation is generated at the end of this file.');
if (!gas.includes("action === 'submissionStatus'")) gas = gas.replace("  // API Action Handler untuk Pengumpulan Tugas", "  if (action === 'submissionStatus') return pkStatusOutput_(e.parameter);\n\n  // API Action Handler untuk Pengumpulan Tugas");
// Form-wrapped legacy POSTs must be unpacked before normalization.
if (!gas.includes('PK unwrap data')) gas = gas.replace('    // Jika berupa request sinkronisasi folder Google Drive', "    // PK unwrap data: older media submit an action/data form.\n    if (payload.data && typeof payload.data === 'string') payload = JSON.parse(payload.data);\n\n    // Jika berupa request sinkronisasi folder Google Drive");
if(!gas.includes("payload.action === 'studentAccess'"))gas=gas.replace('    // Default: Simpan data tugas',"    if (payload.action === 'studentAccess') return ContentService.createTextOutput(JSON.stringify(portalStudentAccess(payload))).setMimeType(ContentService.MimeType.JSON);\n\n    // Default: Simpan data tugas");
if(!gas.includes("page === 'Guru'"))gas=gas.replace("  if (action === 'submissionStatus')", "  if (page === 'Guru') return HtmlService.createHtmlOutputFromFile('Guru').setTitle('Ruang Guru · PortalKimia').addMetaTag('viewport', 'width=device-width, initial-scale=1');\n\n  if (action === 'submissionStatus')");
gas = gas.trimEnd()+'\n// PK-BACKEND-V2-START\n'+backend+'\n// PK-BACKEND-V2-END\n// PK-TEACHER-START\n'+teacherBackend+'\n// PK-TEACHER-END\n';
new vm.Script(gas, {filename:'Code.gs'});
write(gasPath, gas);
const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8').replace(/const CACHE_NAME = '[^']+';/, "const CACHE_NAME = 'portal-kimia-v7-final';");
sw=sw.replace(/const STATIC_ASSETS = \[[\s\S]*?\];/,"const STATIC_ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];");
write(swPath, sw);
console.log('Updated '+changed.length+' files: '+changed.join(', '));


