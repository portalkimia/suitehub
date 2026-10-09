const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
class Range {
  constructor(s,r,c,n=1,m=1){Object.assign(this,{s,r,c,n,m});}
  getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.s.rows[this.r+i-1]?.[this.c+j-1]??''));}
  setValues(v){v.forEach((row,i)=>row.forEach((x,j)=>{this.s.rows[this.r+i-1]||=[];this.s.rows[this.r+i-1][this.c+j-1]=x;}));return this;}
  setWrap(){return this;}setFontWeight(){return this;}setBackground(){return this;}setFontColor(){return this;}
  createTextFinder(id){return {matchEntireCell(){return this;},useRegularExpression(){return this;},findNext:()=>{const i=this.getValues().findIndex(r=>r[0]===id);return i<0?null:{getRow:()=>this.r+i};}};}
}
class Sheet{constructor(){this.rows=[];this.cols=26;}getLastRow(){return this.rows.length;}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}getRange(...a){return new Range(this,...a);}getMaxColumns(){return this.cols;}insertColumnsAfter(_,n){this.cols+=n;}deleteRow(n){this.rows.splice(n-1,1);}setFrozenRows(){}}
function harness(){
  const sheets=new Map(),properties={TEACHER_PASSWORD:'a-long-test-password',GEMINI_API_KEY:'test'},cache=new Map();
  let activeEmail='owner@example.com';const triggers=[];
  const ss={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s;}};
  const lock={held:false,waitLock(){assert.equal(this.held,false);this.held=true;},hasLock(){return this.held;},releaseLock(){this.held=false;}};
  let calls=0;
  const gas=vm.createContext({console,Date,SpreadsheetApp:{openById:()=>ss,getActiveSpreadsheet:()=>ss,flush(){}},LockService:{getScriptLock:()=>lock},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k]||null,setProperty:(k,v)=>properties[k]=v})},
    Session:{getActiveUser:()=>({getEmail:()=>activeEmail}),getEffectiveUser:()=>({getEmail:()=>'owner@example.com'})},
    ScriptApp:{getProjectTriggers:()=>triggers.slice(),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),newTrigger:name=>({timeBased(){return this;},everyMinutes(){return this;},create(){triggers.push({getHandlerFunction:()=>name});}})},
    CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>Array.from(crypto.createHash('sha256').update(String(s)).digest()),getUuid:()=>crypto.randomUUID()},
    ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:text=>({text,setMimeType(){return this;}})},
    UrlFetchApp:{fetch:()=>{calls++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({skorRekomendasi:80,kelengkapanLks:90,statusPemahaman:'BAIK',ringkasan:'Baik',miskonsepsi:[],umpanBalikSiswa:'Periksa arah elektron',saranGuru:'Tinjau',penilaianEsai:[],catatanLks:[]})}]}}]})};}}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'Code.gs'),'utf8'),gas);
  return {gas,ss,sheets,properties,cache,getCalls:()=>calls,setActiveEmail:value=>activeEmail=value,triggers};
}
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const h=harness(),g=h.gas;
const login=g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD});assert.equal(login.success,true);const token=login.data.token;
const api=(action,x={})=>{const r=g.portalTeacherApi({action,token,...x});assert.equal(r.success,true,r.message);return r.data;};
api('saveStudents',{students:'XII-1|001|Andi\nXII-1|002|Siti\nXII-2|001|Rina'});
const task=api('saveTask',{task:{title:'Volta XII',mediaId:'sel-volta',classes:['XII-1'],open:true,allowLate:false}});
const dashboard=api('dashboard'),p=dashboard.participants[0];
function packet(){return {schemaVersion:3,mediaId:'sel-volta',materi:'Sel Volta',assignmentId:task['ID Pengumpulan'],studentAccessCode:p.code,assignmentRevision:0,submissionId:crypto.randomBytes(24).toString('hex'),receiptToken:crypto.randomBytes(24).toString('hex'),siswa:{nama:'Andi',kelas:'XII-1',nis:'001'},nilai:{skorKuis:80},jawaban:{kuis:[],esai:{essay1:'Oksidasi di anode'},lks:{'obs-v-1':'1.10'},refleksi:{}}};}
test('Visible AI setup wrapper allows only script owner',()=>{assert.equal(g.setupAnalisisAI().success,true);assert.equal(h.triggers.length,1);h.setActiveEmail('student@example.com');assert.throws(()=>g.setupAnalisisAI(),/pemilik skrip/);h.setActiveEmail('owner@example.com');});
test('No teacher data or mutation without server session',()=>{for(const action of ['dashboard','detail','saveStudents','setStudentActive','saveTask','review','reopen','retryAI'])assert.equal(g.portalTeacherApi({action,id:p.id,token:'localStorage=true'}).success,false);});
test('Fast login returns the results view while roster and task participants load on demand',()=>{
  const fresh=harness(),fg=fresh.gas,password=fresh.properties.TEACHER_PASSWORD,auth=fg.portalTeacherApi({action:'login',password}).data.token;
  const call=(action,x={})=>fg.portalTeacherApi({action,token:auth,...x});
  assert.equal(call('saveStudents',{students:'X-3|101|Citra Siswa'}).success,true);
  const task=call('saveTask',{task:{title:'Tugas Cepat',mediaId:'sel-volta',classes:['X-3'],open:true}}).data;
  const combined=fg.portalTeacherApi({action:'loginDashboard',password});
  assert.equal(combined.success,true);assert.ok(combined.data.token);assert.equal(combined.data.dashboard.students.length,0);assert.equal(combined.data.dashboard.participants.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(combined.data.dashboard.classes)),['X-3']);
  const token=combined.data.token;
  const taskData=fg.portalTeacherApi({action:'taskData',token});assert.equal(taskData.success,true);assert.equal(taskData.data.length,1);assert.ok(taskData.data[0].finalKey);
  const studentData=fg.portalTeacherApi({action:'studentData',token});assert.equal(studentData.success,true);assert.equal(studentData.data.length,1);
  assert.equal(fg.portalTeacherApi({action:'dashboardFast',token}).data.tasks[0]['ID Pengumpulan'],task['ID Pengumpulan']);
});
test('Master students upsert by class/NIS and can be deactivated without deletion',()=>{let d=api('dashboard');assert.equal(d.students.length,3);assert.equal(JSON.stringify(d.classes),JSON.stringify(['XII-1','XII-2']));api('saveStudents',{students:'XII-1|001|Andi Baru'});d=api('dashboard');assert.equal(d.students.length,3);assert.equal(d.students.find(s=>s.nis==='001'&&s.className==='XII-1').name,'Andi Baru');const rina=d.students.find(s=>s.className==='XII-2');api('setStudentActive',{id:rina.id,active:false});d=api('dashboard');assert.equal(d.students.find(s=>s.id===rina.id).active,false);assert.equal(JSON.stringify(d.classes),JSON.stringify(['XII-1']));});
test('Task edits can change classes and class code before submissions',()=>{const fresh=harness(),fg=fresh.gas,auth=fg.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token,call=(action,x={})=>{const r=fg.portalTeacherApi({action,token:auth,...x});assert.equal(r.success,true,r.message);return r.data;};call('saveStudents',{students:'X|001|Ayu\nY|002|Bima'});const t=call('saveTask',{task:{title:'Tugas X',mediaId:'sel-volta',classes:['X'],open:true}});const edited=call('saveTask',{task:{id:t['ID Pengumpulan'],title:'Tugas Y',mediaId:'sel-elektrolisis',classes:['Y'],classCodes:{Y:'KODE-Y-02'},open:true}});assert.equal(edited['ID Media'],'sel-elektrolisis');assert.deepEqual(JSON.parse(edited['Kelas JSON']),['Y']);assert.deepEqual(JSON.parse(JSON.stringify(call('dashboard').participants.map(x=>x.className))),['Y']);assert.equal(call('dashboard').participants[0].code,'KODE-Y-02');});
test('Student credentials validate task and media, without exposing others',()=>{const r=g.portalStudentAccess(packet());assert.equal(r.name,'Andi Baru');assert.equal(r.stored,false);assert.equal(r.nis,'001');const bad=packet();bad.mediaId='sel-elektrolisis';assert.equal(g.portalStudentAccess(bad).success,false);assert.equal(g.portalStudentAccess({}).success,false);assert.ok(!JSON.stringify(r).includes('Siti'));});
test('Server rejects missing assignment and false access code',()=>{let a=packet();delete a.assignmentId;assert.equal(g.simpanTugasSiswa(a).stored,false);a=packet();a.studentAccessCode='0'.repeat(24);assert.equal(g.simpanTugasSiswa(a).stored,false);});
let first;
test('Final answer deduplicates changed payload, new ID and second device',()=>{first=packet();assert.equal(g.simpanTugasSiswa(first).stored,true);const again=packet();again.jawaban.esai.essay1='different';const r=g.simpanTugasSiswa(again);assert.equal(r.alreadyFinal,true);assert.equal(r.canonicalSubmissionId,first.submissionId);assert.equal(h.sheets.get('RekapPengumpulan').getLastRow(),2);assert.equal(h.sheets.get('Analisis_AI').getLastRow(),2);assert.equal(g.portalStudentAccess(packet()).stored,true);});
test('Task edits preserve collected work and lock only destructive changes',()=>{
  const fresh=harness(),fg=fresh.gas,auth=fg.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token,call=(action,x={})=>fg.portalTeacherApi({action,token:auth,...x});
  assert.equal(call('saveStudents',{students:'X|001|Ayu\nY|001|Bima'}).success,true);
  const t=call('saveTask',{task:{title:'Tugas X',mediaId:'sel-volta',classes:['X'],open:true,classCodes:{X:'KODE-X-01'}}}).data;
  const access=fg.portalStudentAccess({classCode:'KODE-X-01',studentName:'Ayu',mediaId:'sel-volta'});
  const submission={schemaVersion:3,mediaId:'sel-volta',materi:'Sel Volta',assignmentId:t['ID Pengumpulan'],studentAccessCode:access.studentAccessCode,assignmentRevision:0,submissionId:crypto.randomBytes(24).toString('hex'),receiptToken:crypto.randomBytes(24).toString('hex'),siswa:{nama:'Ayu',kelas:'X',nis:'001'},nilai:{skorKuis:80},jawaban:{kuis:[],esai:{},lks:{},refleksi:{}}};
  assert.equal(fg.simpanTugasSiswa(submission).stored,true);
  assert.equal(call('saveTask',{task:{id:t['ID Pengumpulan'],title:'Tugas X',mediaId:'sel-elektrolisis',classes:['X'],open:true}}).success,false,'Media change must be blocked after submission');
  assert.equal(call('saveTask',{task:{id:t['ID Pengumpulan'],title:'Tugas X',mediaId:'sel-volta',classes:['Y'],open:true}}).success,false,'Submitted class removal must be blocked');
  const edited=call('saveTask',{task:{id:t['ID Pengumpulan'],title:'Tugas X revisi',mediaId:'sel-volta',classes:['X','Y'],classCodes:{X:'KODE-X-02'},open:true}});
  assert.equal(edited.success,true,edited.message);assert.equal(edited.data.Judul,'Tugas X revisi');
  assert.equal(fg.portalStudentAccess({classCode:'KODE-X-02',studentName:'Ayu',mediaId:'sel-volta'}).success,true);
  assert.equal(fg.portalStudentAccess({classCode:'KODE-X-01',studentName:'Ayu',mediaId:'sel-volta'}).success,false);
});
test('Receipt retrieval requires original private token',()=>{assert.equal(g.pkSubmissionStatus_({submissionId:first.submissionId,receiptToken:first.receiptToken}).stored,true);assert.equal(g.pkSubmissionStatus_({submissionId:first.submissionId,receiptToken:'0'.repeat(48)}).stored,false);});
test('One AI analysis despite repeated submission',()=>{g.processAntreanAnalisisAI_();g.simpanTugasSiswa(packet());g.processAntreanAnalisisAI_();assert.equal(h.getCalls(),1);});
test('Teacher sees original answers and analysis; tokens excluded',()=>{const d=api('detail',{id:first.submissionId});assert.equal(d.answers.jawaban.esai.essay1,'Oksidasi di anode');assert.equal(d.analysis['Status AI'],'SELESAI');assert.equal(d.answers.receiptToken,undefined);assert.equal(d.answers.studentAccessCode,undefined);});
test('Teacher review saves final score and audit history',()=>{api('review',{id:first.submissionId,status:'Dikoreksi',score:78,note:'Perjelas alasan'});assert.equal(api('detail',{id:first.submissionId}).review['Nilai Akhir'],78);assert.equal(h.sheets.get('Riwayat_Pemeriksaan').getLastRow(),2);assert.equal(g.portalTeacherApi({action:'review',token,id:first.submissionId,status:'Disetujui',score:200}).success,false);});
test('Explicit revision preserves old submission and permits exactly one new version',()=>{api('reopen',{id:p.id});const a=packet();assert.equal(g.simpanTugasSiswa(a).stored,false);a.assignmentRevision=1;assert.equal(g.simpanTugasSiswa(a).stored,true);assert.equal(h.sheets.get('RekapPengumpulan').getLastRow(),3);assert.equal(g.simpanTugasSiswa({...a,submissionId:crypto.randomBytes(24).toString('hex')}).alreadyFinal,true);});
test('Closed task, deadline and late policy enforced at server',()=>{const student2=api('dashboard').participants[1];const a=packet();a.studentAccessCode=student2.code;a.siswa={nama:student2.name,kelas:student2.className,nis:student2.nis};
const edit=x=>api('saveTask',{task:{id:task['ID Pengumpulan'],title:'Volta XII',mediaId:'sel-volta',classes:['XII-1'],...x}});
edit({open:false});assert.equal(g.simpanTugasSiswa(a).stored,false);edit({open:true,due:'2020-01-01T00:00:00Z',allowLate:false});assert.equal(g.simpanTugasSiswa(a).stored,false);edit({open:true,due:'2020-01-01T00:00:00Z',allowLate:true});assert.equal(g.simpanTugasSiswa(a).stored,true);assert.equal(api('dashboard').results[0].late,true);});
test('Password rotation and logout invalidate sessions',()=>{h.properties.TEACHER_PASSWORD='another-long-password';assert.equal(g.portalTeacherApi({action:'dashboard',token}).success,false);const l=g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD}).data.token;assert.equal(g.portalTeacherApi({action:'logout',token:l}).success,true);assert.equal(g.portalTeacherApi({action:'dashboard',token:l}).success,false);});
test('Repeated bad logins throttle',()=>{const other=harness();for(let i=0;i<5;i++)assert.equal(other.gas.portalTeacherApi({action:'login',password:'bad'}).success,false);assert.equal(other.gas.portalTeacherApi({action:'login',password:other.properties.TEACHER_PASSWORD}).success,false);});
test('Class code generated, queryable by student with just classCode and studentName, enforces 1 submission per student per media',()=>{
  const freshLogin = g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD});
  const tToken = freshLogin.data.token;
  const tApi = (action,x={}) => { const r=g.portalTeacherApi({action,token:tToken,...x}); assert.equal(r.success,true,r.message); return r.data; };
  tApi('saveStudents',{students:'XI-A|001|Budi Santoso'});
  const newTask = tApi('saveTask',{task:{title:'Laju Reaksi XI',mediaId:'sel-volta',classes:['XI-A'],open:true}});
  const dash = tApi('dashboard');
  const t = dash.tasks.find(x=>x['ID Pengumpulan']===newTask['ID Pengumpulan']);
  assert.ok(t.classCodes['XI-A'], 'Class code for XI-A must exist');
  assert.match(t.classCodes['XI-A'], /^KIM-XIA-[0-9A-F]{4}$/);
  
  const access = g.portalStudentAccess({classCode:t.classCodes['XI-A'],studentName:'Budi Santoso',mediaId:'sel-volta'});
  assert.equal(access.success, true);
  assert.equal(access.className, 'XI-A');
  assert.equal(access.assignmentId, newTask['ID Pengumpulan']);

  const customTask = tApi('saveTask',{task:{title:'Kode Pilihan Guru',mediaId:'sel-volta',classes:['XI-A'],open:true,classCodes:{'XI-A':'XI-A-2026'}}});
  assert.equal(customTask.classCodes['XI-A'],'XI-A-2026');
  assert.equal(g.portalStudentAccess({classCode:'XI-A-2026',studentName:'Budi Santoso',mediaId:'sel-volta'}).success,true);
  assert.equal(g.portalTeacherApi({action:'saveTask',token:tToken,task:{title:'Kode Bentrok',mediaId:'sel-volta',classes:['XI-A'],open:true,classCodes:{'XI-A':'XI-A-2026'}}}).success,false);
  assert.equal(g.portalTeacherApi({action:'saveTask',token:tToken,task:{title:'Kode Tidak Valid',mediaId:'sel-volta',classes:['XI-A'],open:true,classCodes:{'XI-A':'abc!'}}}).success,false);
  console.log('PASS Custom class code: saved, student access works, invalid/duplicate codes rejected');

  tApi('archiveTask',{id:customTask['ID Pengumpulan']});
  assert.equal(tApi('dashboard').tasks.find(x=>x['ID Pengumpulan']===customTask['ID Pengumpulan']).Status,'NONAKTIF');
  const reusedTask=tApi('saveTask',{task:{title:'Kode Dipakai Ulang',mediaId:'sel-volta',classes:['XI-A'],open:true,classCodes:{'XI-A':'XI-A-2026'}}});
  const reusedAccess=g.portalStudentAccess({classCode:'XI-A-2026',studentName:'Budi Santoso',mediaId:'sel-volta'});
  assert.equal(reusedAccess.assignmentId,reusedTask['ID Pengumpulan']);
  assert.equal(g.portalStudentAccess({classCode:'XI-A-2026',studentName:'Budi Santoso',mediaId:'sel-volta',assignmentId:customTask['ID Pengumpulan']}).success,false);
  console.log('PASS Archived task keeps history, disables its code, and permits safe reuse');

  const sub1 = {
    schemaVersion: 3, mediaId: 'sel-volta', materi: 'Sel Volta',
    assignmentId: newTask['ID Pengumpulan'], studentAccessCode: t.classCodes['XI-A'],
    assignmentRevision: 0, submissionId: crypto.randomBytes(24).toString('hex'),
    receiptToken: crypto.randomBytes(24).toString('hex'),
    siswa: { nama: 'Budi Santoso', kelas: 'XI-A', nis: '001' },
    nilai: { skorKuis: 90 }, jawaban: { kuis: [], esai: {}, lks: {}, refleksi: {} }
  };
  const res1 = g.simpanTugasSiswa(sub1);
  assert.equal(res1.stored, true);

  const sub2 = { ...sub1, submissionId: crypto.randomBytes(24).toString('hex'), jawaban: { esai: { q1: 'beda' } } };
  const res2 = g.simpanTugasSiswa(sub2);
  assert.equal(res2.alreadyFinal, true);
  assert.equal(res2.canonicalSubmissionId, sub1.submissionId);
  assert.equal(g.portalTeacherApi({action:'deleteTask',token:tToken,id:newTask['ID Pengumpulan']}).success,false,'Tasks with submissions cannot be deleted');

  const accessAgain = g.portalStudentAccess({classCode:t.classCodes['XI-A'],studentName:'Budi Santoso',mediaId:'sel-volta'});
  assert.equal(accessAgain.stored, true);
});
test('Task without submissions can be deleted and its code reused',()=>{
  const fresh=harness(),fg=fresh.gas,auth=fg.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token;
  const call=(action,x={})=>fg.portalTeacherApi({action,token:auth,...x});
  assert.equal(call('saveStudents',{students:'X|01|Siswa'}).success,true);
  const t=call('saveTask',{task:{title:'Hapus Aman',mediaId:'sel-volta',classes:['X'],open:true,classCodes:{X:'KODE-X-01'}}}).data;
  assert.equal(call('deleteTask',{id:t['ID Pengumpulan']}).data.deleted,true);
  assert.equal(call('dashboard').data.tasks.length,0);assert.equal(call('dashboard').data.participants.length,0);
  assert.equal(call('saveTask',{task:{title:'Kode Baru',mediaId:'sel-volta',classes:['X'],open:true,classCodes:{X:'KODE-X-01'}}}).success,true);
});
test('Valid class code accepts unlisted or mistyped names and teacher can confirm identity',()=>{
  const fresh=harness(),fg=fresh.gas,auth=fg.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token;
  const call=(action,x={})=>fg.portalTeacherApi({action,token:auth,...x});
  assert.equal(call('saveStudents',{students:'XI-A|001|Andi Santoso'}).success,true);
  const task=call('saveTask',{task:{title:'Tugas Nama Typo',mediaId:'sel-volta',classes:['XI-A'],open:true,classCodes:{'XI-A':'KODE-XIA-01'}}}).data;
  const access=fg.portalStudentAccess({classCode:'KODE-XIA-01',studentName:'Andi Sntoso',mediaId:'sel-volta'});
  assert.equal(access.success,true);assert.equal(access.name,'Andi Sntoso');assert.equal(access.nis,'BELUM-DIVERIFIKASI');
  const packet={schemaVersion:3,mediaId:'sel-volta',materi:'Sel Volta',assignmentId:task['ID Pengumpulan'],studentAccessCode:access.studentAccessCode,assignmentRevision:access.revision,submissionId:crypto.randomBytes(24).toString('hex'),receiptToken:crypto.randomBytes(24).toString('hex'),siswa:{nama:access.name,kelas:access.className,nis:access.nis},nilai:{skorKuis:87},jawaban:{kuis:[],esai:{},lks:{},refleksi:{}}};
  assert.equal(fg.simpanTugasSiswa(packet).stored,true);
  const submissionId=fg.pkRows_(fresh.ss,'RekapPengumpulan')[0]['ID Pengumpulan'];
  let result=call('dashboard').data.results.find(r=>r.id===submissionId);assert.equal(result.name,'Andi Sntoso');assert.equal(result.identityConfirmed,false);assert.equal(result.quiz,87);
  assert.equal(call('review',{id:submissionId,status:'Disetujui',score:87,note:'Identitas dicocokkan dengan daftar kelas.',studentName:'Andi Santoso',nis:'001',identityConfirmed:true}).success,true);
  result=call('dashboard').data.results.find(r=>r.id===submissionId);assert.equal(result.name,'Andi Santoso');assert.equal(result.nis,'001');assert.equal(result.identityConfirmed,true);assert.equal(result.finalScore,87);
  const participant=call('dashboard').data.participants.find(p=>p.submitted&&p.name==='Andi Santoso');assert.ok(participant,'Participant identity should sync with teacher correction');
});
test('Dashboard collapses class spelling variants and excludes dirty result values from class filters',()=>{
  const fresh=harness(),fg=fresh.gas,auth=fg.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token;
  const call=(action,x={})=>fg.portalTeacherApi({action,token:auth,...x});
  assert.equal(call('saveStudents',{students:'X-3|101|Citra Siswa\nX3 / Fase E|102|Dina Siswa'}).success,true);
  const task=call('saveTask',{task:{title:'Tugas Kelas X-3',mediaId:'sel-volta',classes:['X-3'],open:true}}).data;
  const access=fg.portalStudentAccess({classCode:task.classCodes['X-3'],studentName:'Citra Siswa',mediaId:'sel-volta'});
  const packet={schemaVersion:3,mediaId:'sel-volta',materi:'Sel Volta',assignmentId:task['ID Pengumpulan'],studentAccessCode:access.studentAccessCode,assignmentRevision:0,submissionId:crypto.randomBytes(24).toString('hex'),receiptToken:crypto.randomBytes(24).toString('hex'),siswa:{nama:access.name,kelas:access.className,nis:access.nis},nilai:{skorKuis:80},jawaban:{kuis:[],esai:{},lks:{},refleksi:{}}};
  assert.equal(fg.simpanTugasSiswa(packet).stored,true);
  const row=fresh.sheets.get('RekapPengumpulan').rows[1],headers=fresh.sheets.get('RekapPengumpulan').rows[0],classCol=headers.indexOf('Kelas');row[classCol]='2026-03-09T17:00:00.000Z';
  const dashboard=call('dashboard').data;
  assert.deepEqual(JSON.parse(JSON.stringify(dashboard.classes)),['X-3']);
  assert.equal(dashboard.results[0].className,'X-3');
});
test('Current media catalog exactly matches integrated local pages',()=>{
  const expected=[];
  for(const [dir,prefix] of [['Media_Pembelajaran_Kimia_Drive',''],['.','Praktikum Virtual · ']]){
    for(const file of fs.readdirSync(path.join(__dirname,dir)).filter(f=>f.endsWith('.html')&&(dir==='Media_Pembelajaran_Kimia_Drive'||f.startsWith('Lab_')))){
      const html=fs.readFileSync(path.join(__dirname,dir,file),'utf8'),match=html.match(/PortalSubmission\.install\(\s*(\{[^\n]+?\})\s*,/);
      if(!match)continue;const config=JSON.parse(match[1]);let title=String(config.title).replace(/\s*&bull;\s*PortalKimia\s*/ig,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
      if(prefix)title=prefix+title;if(title.length>110)title=title.slice(0,107).trimEnd()+'…';expected.push({id:config.id,title});
    }
  }
  assert.equal(new Set(expected.map(x=>x.id)).size,expected.length,'Integrated media IDs must be unique');
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('PK_ACTIVE_MEDIA',g))),expected);
  const mediaAllowlist=vm.runInContext('PK_MEDIA',g);
  for(const item of expected)assert.ok(mediaAllowlist[item.id],`Backend must accept ${item.id}`);
  const dashboard=fs.readFileSync(path.join(__dirname,'Guru.html'),'utf8'),fallback=dashboard.match(/const fallbackMediaCatalog = (\[[\s\S]*?\n    \]);/);
  assert.ok(fallback,'Dashboard fallback catalog must exist');assert.deepEqual(JSON.parse(fallback[1]),expected);
  const fresh=g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD}).data;
  const response=g.portalTeacherApi({action:'dashboard',token:fresh.token});assert.equal(response.success,true);
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.media)),expected);
});
test('Cloud catalogue settings persist across devices and require server teacher authorization',()=>{
  const fresh=harness(),g=fresh.gas;
  const changes={'material:pdf-test':{title:'Sel Elektrolisis',grade:'Kelas 12',chapterOverride:{id:'k12-bab1',name:'Redoks & Elektrokimia',gradeKey:'kelas-12',order:301}},'chapter:k12-bab1':'Bab Elektrokimia',learningOrder:['pdf-test','sel-volta']};
  assert.equal(g.portalTeacherApi({action:'saveCatalogSettings',changes,token:'localStorage=true'}).success,false);
  const token=g.portalTeacherApi({action:'login',password:fresh.properties.TEACHER_PASSWORD}).data.token;
  const saved=g.portalTeacherApi({action:'saveCatalogSettings',token,changes});assert.equal(saved.success,true);assert.equal(saved.data.saved,true);
  const read=JSON.parse(JSON.stringify(g.portalCatalogSettings()));assert.equal(read.success,true);assert.deepEqual(read.data,changes);
  const repeat=g.portalTeacherApi({action:'saveCatalogSettings',token,changes:{'chapter:k12-bab1':'Bab Baru'}});assert.equal(repeat.success,true);
  assert.equal(g.portalCatalogSettings().data['chapter:k12-bab1'],'Bab Baru');assert.equal(g.portalCatalogSettings().data['material:pdf-test'].grade,'Kelas 12');
  assert.equal(g.portalTeacherApi({action:'saveCatalogSettings',token,changes:{password:'do-not-store'}}).success,false);
});
for(const name of ['Guru.html','index.html'])test('Valid scripts: '+name,()=>{const html=fs.readFileSync(path.join(__dirname,name),'utf8');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
console.log('TOTAL '+checks+' teacher/task checks passed. No live writes.');
module.exports={harness};
