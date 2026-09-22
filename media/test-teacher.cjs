const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
class Range {
  constructor(s,r,c,n=1,m=1){Object.assign(this,{s,r,c,n,m});}
  getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.s.rows[this.r+i-1]?.[this.c+j-1]??''));}
  setValues(v){v.forEach((row,i)=>row.forEach((x,j)=>{this.s.rows[this.r+i-1]||=[];this.s.rows[this.r+i-1][this.c+j-1]=x;}));return this;}
  setWrap(){return this;}setFontWeight(){return this;}setBackground(){return this;}setFontColor(){return this;}
  createTextFinder(id){return {matchEntireCell(){return this;},useRegularExpression(){return this;},findNext:()=>{const i=this.getValues().findIndex(r=>r[0]===id);return i<0?null:{getRow:()=>this.r+i};}};}
}
class Sheet{constructor(){this.rows=[];this.cols=26;}getLastRow(){return this.rows.length;}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}getRange(...a){return new Range(this,...a);}getMaxColumns(){return this.cols;}insertColumnsAfter(_,n){this.cols+=n;}setFrozenRows(){}}
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
const task=api('saveTask',{task:{title:'Volta XII',mediaId:'sel-volta',className:'XII-1',open:true,allowLate:false,roster:'001|Andi\n002|Siti'}});
const dashboard=api('dashboard'),p=dashboard.participants[0];
function packet(){return {schemaVersion:3,mediaId:'sel-volta',materi:'Sel Volta',assignmentId:task['ID Pengumpulan'],studentAccessCode:p.code,assignmentRevision:0,submissionId:crypto.randomBytes(24).toString('hex'),receiptToken:crypto.randomBytes(24).toString('hex'),siswa:{nama:'Andi',kelas:'XII-1',nis:'001'},nilai:{skorKuis:80},jawaban:{kuis:[],esai:{essay1:'Oksidasi di anode'},lks:{'obs-v-1':'1.10'},refleksi:{}}};}
test('Visible AI setup wrapper allows only script owner',()=>{assert.equal(g.setupAnalisisAI().success,true);assert.equal(h.triggers.length,1);h.setActiveEmail('student@example.com');assert.throws(()=>g.setupAnalisisAI(),/pemilik skrip/);h.setActiveEmail('owner@example.com');});
test('No teacher data or mutation without server session',()=>{for(const action of ['dashboard','detail','saveTask','review','reopen','retryAI'])assert.equal(g.portalTeacherApi({action,id:p.id,token:'localStorage=true'}).success,false);});
test('Task roster created once; edits retain access codes',()=>{api('saveTask',{task:{id:task['ID Pengumpulan'],title:'Volta XII',mediaId:'sel-volta',className:'XII-1',open:true,roster:'001|Andi'}});assert.equal(api('dashboard').participants.length,2);assert.equal(api('dashboard').participants[0].code,p.code);});
test('Student credentials validate task and media, without exposing others',()=>{const r=g.portalStudentAccess(packet());assert.equal(r.name,'Andi');assert.equal(r.stored,false);assert.equal(r.nis,'001');const bad=packet();bad.mediaId='sel-elektrolisis';assert.equal(g.portalStudentAccess(bad).success,false);assert.equal(g.portalStudentAccess({}).success,false);assert.ok(!JSON.stringify(r).includes('Siti'));});
test('Server rejects missing assignment and false access code',()=>{let a=packet();delete a.assignmentId;assert.equal(g.simpanTugasSiswa(a).stored,false);a=packet();a.studentAccessCode='0'.repeat(24);assert.equal(g.simpanTugasSiswa(a).stored,false);});
let first;
test('Final answer deduplicates changed payload, new ID and second device',()=>{first=packet();assert.equal(g.simpanTugasSiswa(first).stored,true);const again=packet();again.jawaban.esai.essay1='different';const r=g.simpanTugasSiswa(again);assert.equal(r.alreadyFinal,true);assert.equal(r.canonicalSubmissionId,first.submissionId);assert.equal(h.sheets.get('RekapPengumpulan').getLastRow(),2);assert.equal(h.sheets.get('Analisis_AI').getLastRow(),2);assert.equal(g.portalStudentAccess(packet()).stored,true);});
test('Receipt retrieval requires original private token',()=>{assert.equal(g.pkSubmissionStatus_({submissionId:first.submissionId,receiptToken:first.receiptToken}).stored,true);assert.equal(g.pkSubmissionStatus_({submissionId:first.submissionId,receiptToken:'0'.repeat(48)}).stored,false);});
test('One AI analysis despite repeated submission',()=>{g.processAntreanAnalisisAI_();g.simpanTugasSiswa(packet());g.processAntreanAnalisisAI_();assert.equal(h.getCalls(),1);});
test('Teacher sees original answers and analysis; tokens excluded',()=>{const d=api('detail',{id:first.submissionId});assert.equal(d.answers.jawaban.esai.essay1,'Oksidasi di anode');assert.equal(d.analysis['Status AI'],'SELESAI');assert.equal(d.answers.receiptToken,undefined);assert.equal(d.answers.studentAccessCode,undefined);});
test('Teacher review saves final score and audit history',()=>{api('review',{id:first.submissionId,status:'Dikoreksi',score:78,note:'Perjelas alasan'});assert.equal(api('detail',{id:first.submissionId}).review['Nilai Akhir'],78);assert.equal(h.sheets.get('Riwayat_Pemeriksaan').getLastRow(),2);assert.equal(g.portalTeacherApi({action:'review',token,id:first.submissionId,status:'Disetujui',score:200}).success,false);});
test('Explicit revision preserves old submission and permits exactly one new version',()=>{api('reopen',{id:p.id});const a=packet();assert.equal(g.simpanTugasSiswa(a).stored,false);a.assignmentRevision=1;assert.equal(g.simpanTugasSiswa(a).stored,true);assert.equal(h.sheets.get('RekapPengumpulan').getLastRow(),3);assert.equal(g.simpanTugasSiswa({...a,submissionId:crypto.randomBytes(24).toString('hex')}).alreadyFinal,true);});
test('Closed task, deadline and late policy enforced at server',()=>{const student2=api('dashboard').participants[1];const a=packet();a.studentAccessCode=student2.code;
const edit=x=>api('saveTask',{task:{id:task['ID Pengumpulan'],title:'Volta XII',mediaId:'sel-volta',className:'XII-1',roster:'',...x}});
edit({open:false});assert.equal(g.simpanTugasSiswa(a).stored,false);edit({open:true,due:'2020-01-01T00:00:00Z',allowLate:false});assert.equal(g.simpanTugasSiswa(a).stored,false);edit({open:true,due:'2020-01-01T00:00:00Z',allowLate:true});assert.equal(g.simpanTugasSiswa(a).stored,true);assert.equal(api('dashboard').results[0].late,true);});
test('Password rotation and logout invalidate sessions',()=>{h.properties.TEACHER_PASSWORD='another-long-password';assert.equal(g.portalTeacherApi({action:'dashboard',token}).success,false);const l=g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD}).data.token;assert.equal(g.portalTeacherApi({action:'logout',token:l}).success,true);assert.equal(g.portalTeacherApi({action:'dashboard',token:l}).success,false);});
test('Repeated bad logins throttle',()=>{const other=harness();for(let i=0;i<5;i++)assert.equal(other.gas.portalTeacherApi({action:'login',password:'bad'}).success,false);assert.equal(other.gas.portalTeacherApi({action:'login',password:other.properties.TEACHER_PASSWORD}).success,false);});
for(const name of ['Guru.html','index.html'])test('Valid scripts: '+name,()=>{const html=fs.readFileSync(path.join(__dirname,name),'utf8');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
console.log('TOTAL '+checks+' teacher/task checks passed. No live writes.');
module.exports={harness};
