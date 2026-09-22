const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert/strict');
let tests = 0;
function test(name, fn) { fn(); tests++; console.log('PASS '+name); }
class Range {
  constructor(sheet,r,c,n=1,m=1) { Object.assign(this,{sheet,r,c,n,m}); }
  getValues() { return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.sheet.rows[this.r+i-1]?.[this.c+j-1] ?? '')); }
  setValues(values) {
    if (this.sheet.fail) { this.sheet.fail=false; throw Error('Simulated write failure'); }
    values.forEach((row,i)=>row.forEach((v,j)=>{ this.sheet.rows[this.r+i-1] ||= []; this.sheet.rows[this.r+i-1][this.c+j-1]=v; })); return this;
  }
  setFontWeight(){return this;} setBackground(){return this;} setFontColor(){return this;} setWrap(){return this;}
  createTextFinder(id) { const self=this; return { matchEntireCell(){return this;},useRegularExpression(){return this;},findNext(){
    const i=self.getValues().findIndex(row=>row[0]===id); return i<0?null:{getRow:()=>self.r+i};
  }}; }
}
class Sheet {
  constructor(name){this.name=name;this.rows=[];this.cols=26;}
  getLastRow(){return this.rows.length;} getLastColumn(){return this.rows.reduce((m,r)=>Math.max(m,r.length),0);}
  getRange(...args){return new Range(this,...args);} getMaxColumns(){return this.cols;}
  insertColumnsAfter(_,n){this.cols+=n;} setFrozenRows(){}
}
const sheets = new Map();
const ss = { getSheetByName:n=>sheets.get(n), insertSheet:n=>{const s=new Sheet(n);sheets.set(n,s);return s;} };
ss.insertSheet('TugasSiswa').rows=[['OLD'],['KEEP']];
ss.insertSheet('BahanAjar').rows=[['MATERIAL'],['KEEP']];
const lock={held:false,waitLock(){assert.equal(this.held,false);this.held=true;},hasLock(){return this.held;},releaseLock(){this.held=false;}};
const gas=vm.createContext({console,SpreadsheetApp:{openById:()=>ss,getActiveSpreadsheet:()=>ss,flush(){}},LockService:{getScriptLock:()=>lock},
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>Array.from(crypto.createHash('sha256').update(s).digest()),getUuid:()=>crypto.randomUUID()},
  ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:text=>({text,setMimeType(type){this.type=type;return this;}})} });
vm.runInContext(fs.readFileSync(path.join(__dirname,'Code.gs'),'utf8'),gas);
const id=()=>crypto.randomBytes(24).toString('hex');
function packet(mediaId='sel-volta') {return {schemaVersion:2,mediaId,materi:mediaId,submissionId:id(),receiptToken:id(),siswa:{nama:'UJI',kelas:'XII-1',nis:'001'},nilai:{skorKuis:75},jawaban:{kuis:[{pilihan:0}],esai:{essay4:'Esai keempat'},lks:{'obs-v-1':'0'},refleksi:{catatan:'Sudah paham'}}};}
function rowRecord(name,row=1){const s=sheets.get(name);return Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row][i]]));}
test('Volta saves all sections, raw JSON and index',()=>{
  const p=packet();const res=gas.simpanTugasSiswa(p);assert.equal(res.stored,true);
  const row=rowRecord('Tugas_Sel_Volta');assert.equal(row['Esai | essay4'],'Esai keempat');assert.equal(row['LKS | obs-v-1'],'0');
  assert.deepEqual(JSON.parse(row['Data JSON Lengkap']),p);assert.equal(row['NIS / Absen'],'001');
  assert.equal(gas.pkSubmissionStatus_({submissionId:p.submissionId,receiptToken:p.receiptToken}).stored,true);
  assert.equal(gas.pkSubmissionStatus_({submissionId:p.submissionId,receiptToken:id()}).stored,false);
  const count=sheets.get('RekapPengumpulan').rows.length;
  assert.equal(gas.simpanTugasSiswa(p).stored,true);assert.equal(sheets.get('RekapPengumpulan').rows.length,count);
  p.jawaban.esai.essay4='changed';assert.equal(gas.simpanTugasSiswa(p).success,false);
});
test('Old records untouched',()=>{
  assert.deepEqual(sheets.get('TugasSiswa').rows,[['OLD'],['KEEP']]);assert.deepEqual(sheets.get('BahanAjar').rows,[['MATERIAL'],['KEEP']]);
});
test('Eight Elektrolisis LKPD answers and legacy aliases retained',()=>{
  const p={materi:'Sel Elektrolisis',name:'Legacy',class:'XII',nis:'002',skor:0,lkpd:Array.from({length:8},(_,i)=>'LKPD '+i),reflection:'Legacy reflection',answers:[0,1],laporanTeks:'Complete report'};
  const r=gas.simpanTugasSiswa(p);assert.equal(r.stored,true);const row=rowRecord('Tugas_Sel_Elektrolisis');
  assert.equal(row['LKS | 7'],'LKPD 7');assert.equal(row['Refleksi'],'Legacy reflection');assert.equal(row['Laporan Lengkap'],'Complete report');assert.equal(row['Nilai Kuis'],0);
});
test('Long raw JSON and long answers are split without truncation',()=>{
  const p=packet('konfigurasi-bohr');p.jawaban.esai.long='x'.repeat(90000);assert.equal(gas.simpanTugasSiswa(p).stored,true);
  const r=rowRecord('Tugas_Konfigurasi_Bohr');assert.equal(r['Esai | long'].length,40000);
  assert.equal(r['Esai | long']+r['Esai | long (lanjutan 2)']+r['Esai | long (lanjutan 3)'],p.jawaban.esai.long);
  const raw=r['Data JSON Lengkap']+r['Data JSON Lengkap (lanjutan 2)']+r['Data JSON Lengkap (lanjutan 3)'];assert.deepEqual(JSON.parse(raw),p);
});
test('New fields extend headers without changing previous values',()=>{
  const p=packet('sel-volta');p.jawaban.esai.newQuestion='new';assert.equal(gas.simpanTugasSiswa(p).stored,true);
  assert.equal(rowRecord('Tugas_Sel_Volta',1)['Esai | essay4'],'Esai keempat');assert.equal(rowRecord('Tugas_Sel_Volta',2)['Esai | newQuestion'],'new');
});
test('Partial index write can be retried without duplicate detail',()=>{
  const p=packet('korosi');sheets.get('RekapPengumpulan').fail=true;
  assert.equal(gas.simpanTugasSiswa(p).success,false);assert.equal(sheets.get('Tugas_Korosi').rows.length,2);
  assert.equal(gas.pkSubmissionStatus_({submissionId:p.submissionId,receiptToken:p.receiptToken}).stored,false);
  assert.equal(gas.simpanTugasSiswa(p).stored,true);assert.equal(sheets.get('Tugas_Korosi').rows.length,2);
});
test('Formula-like answers remain literal and JSON is exact',()=>{
  const p=packet('hidrokarbon');p.jawaban.esai.a='=IMPORTXML("x")';gas.simpanTugasSiswa(p);
  const r=rowRecord('Tugas_Hidrokarbon');assert.ok(r['Esai | a'].startsWith("'="));assert.equal(JSON.parse(r['Data JSON Lengkap']).jawaban.esai.a,p.jawaban.esai.a);
});
test('Invalid packets do not create successful records',()=>{
  const p=packet();p.siswa.nama='';assert.equal(gas.simpanTugasSiswa(p).success,false);
  p.siswa.nama='UJI';p.jawaban.esai.huge='x'.repeat(400001);assert.equal(gas.simpanTugasSiswa(p).success,false);
});
test('POST supports JSON and old action/data form',()=>{
  let p=packet('konsep-redoks');let result=gas.doPost({postData:{contents:JSON.stringify(p)}});assert.equal(JSON.parse(result.text).stored,true);
  p=packet('redoks-biloks');result=gas.doPost({postData:{contents:'action=submitTask&data=...'},parameter:{action:'submitTask',data:JSON.stringify(p)}});assert.equal(JSON.parse(result.text).stored,true);
});
test('Receipt callback restricted; no student details in status',()=>{
  const p=packet();gas.simpanTugasSiswa(p);
  const res=gas.doGet({parameter:{action:'submissionStatus',submissionId:p.submissionId,receiptToken:p.receiptToken,callback:'pkReceipt_'+id()}});
  assert.equal(res.type,'js');assert.ok(!res.text.includes('UJI'));assert.ok(!res.text.includes('Esai keempat'));
  const bad=gas.pkStatusOutput_({callback:'alert(1)'});assert.equal(bad.type,'json');
});
function element(id,value='',type='text') {return {id,value,type,textContent:'',disabled:false,style:{},setAttribute(){},appendChild(){},remove(){},parentElement:null};}
function clientContext(fields=[],fetchImpl=async()=>({json:async()=>({success:false,message:'server rejected'})})) {
  const els=new Map(fields.map(e=>[e.id,e]));const button=element('btn-submit-db');els.set(button.id,button);
  const storage={};Object.defineProperties(storage,{getItem:{value:k=>storage[k]??null},setItem:{value:(k,v)=>{storage[k]=v;}},removeItem:{value:k=>{delete storage[k];}}});
  const doc={readyState:'loading',addEventListener(){},getElementById:id=>els.get(id),querySelector:()=>button,
    querySelectorAll:()=>fields,body:{appendChild:el=>els.set(el.id,el)},head:{appendChild(script){
      const url=new URL(script.src);const response=gas.pkSubmissionStatus_(Object.fromEntries(url.searchParams));
      queueMicrotask(()=>ctx[url.searchParams.get('callback')](response));
    }},createElement(tag){const el=element('');Object.defineProperty(el,'innerHTML',{set(v){el.textContent=String(v).replace(/<[^>]*>/g,'');}});return el;}};
  button.parentElement=doc.body;
  const ctx=vm.createContext({document:doc,localStorage:storage,crypto:crypto.webcrypto,fetch:fetchImpl,AbortController,console,URL,
    setTimeout:(fn,ms)=>setTimeout(fn,ms===1500?0:ms),clearTimeout,addEventListener(){}});ctx.window=ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname,'submission-client.js'),'utf8'),ctx);
  return {ctx,els,storage};
}
const files=[];
for(const dir of ['','Media_Pembelajaran_Kimia_Drive','File Spark'])for(const f of fs.readdirSync(path.join(__dirname,dir)))if(f.endsWith('.html')&&f!=='index.html')files.push(path.join(__dirname,dir,f));
for(const file of files) test('Complete payload and syntax: '+path.relative(__dirname,file),()=>{
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1],{filename:file});
  const config=JSON.parse(html.match(/PortalSubmission\.install\((\{[^\n]+\})\)/)[1]);
  const ids=[...new Set([...html.matchAll(/<(?:input|textarea|select)\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]))];
  const fields=[];
  for(const field of ids){
    if(field.includes('${'))for(let i=1;i<=10;i++)fields.push(element(field.replace(/\$\{[^}]+\}/g,i),'answer-'+i));
    else fields.push(element(field,'value-'+field));
  }
  assert.ok(ids.includes('student-name'), 'Identity missing');assert.ok(ids.includes('student-class'));
  const {ctx}=clientContext(fields);
  const q=html.match(/const (quizQuestions|quizData|QUIZ_QUESTIONS)\s*=\s*(\[[\s\S]*?^\s*\];)/m);
  assert.ok(q,'Quiz definition missing');const questions=vm.runInNewContext(q[2].replace(/;$/,''));
  const answers=questions.map(q=>q.answer??q.correct??q.ans);
  const payload=ctx.PortalSubmission.collect(config,answers,questions);
  assert.equal(payload.nilai.skorKuis,100);assert.equal(payload.jawaban.kuis.length,questions.length);
  for(const field of fields.filter(e=>!e.id.startsWith('student-')))assert.ok(Object.values(payload.jawaban).some(group=>group && Object.hasOwn(group,field.id.replace(/^mob-/,''))),field.id+' lost');
  payload.submissionId=id();payload.receiptToken=id();
  const result=gas.simpanTugasSiswa(payload);assert.equal(result.stored,true);
  if(config.id==='sel-volta'){assert.equal(Object.keys(payload.jawaban.esai).length,4);assert.equal(Object.keys(payload.jawaban.lks).length,50);}
  if(config.id==='sel-elektrolisis')assert.equal(Object.keys(payload.jawaban.lks).length,8);
});
(async()=>{
  const fields=[element('student-name','UJI'),element('student-class','XII'),element('analysis-essay-4','four'),element('obs-v-1','0'),element('mob-obs-v-1','')];
  const config={id:'sel-volta',title:'Sel Volta'},questions=[{q:'q',options:['a'],answer:0}];
  let sends=0;
  const c=clientContext(fields,async(_,o)=>{sends++;return {json:async()=>gas.simpanTugasSiswa(JSON.parse(o.body))};});
  await c.ctx.PortalSubmission.submit(config,[0],questions);
  assert.ok(c.els.get('portal-submission-status').textContent.startsWith('Tersimpan:'));assert.equal(Object.keys(c.storage).filter(k=>k.startsWith('portalkimia_pending')).length,0);
  await c.ctx.PortalSubmission.submit(config,[0],questions);assert.equal(sends,1);tests++;console.log('PASS confirmed save and repeated click deduplication');
  const rejected=clientContext(fields);await rejected.ctx.PortalSubmission.submit(config,[0],questions);
  assert.equal(Object.keys(rejected.storage).filter(k=>k.startsWith('portalkimia_pending')).length,1);assert.equal(rejected.els.get('portal-submission-status').textContent,'server rejected');tests++;console.log('PASS server failure retains pending answers');
  const opaque=clientContext(fields,async(_,o)=>{gas.simpanTugasSiswa(JSON.parse(o.body));throw Error('Response blocked by CORS');});
  await opaque.ctx.PortalSubmission.submit(config,[0],questions);assert.ok(opaque.els.get('portal-submission-status').textContent.startsWith('Tersimpan:'));tests++;console.log('PASS unreadable POST verified through receipt');
  const offline=clientContext(fields,async()=>{throw Error('Offline');});await offline.ctx.PortalSubmission.submit(config,[0],questions);
  assert.equal(Object.keys(offline.storage).filter(k=>k.startsWith('portalkimia_pending')).length,1);assert.ok(!offline.els.get('portal-submission-status').textContent.startsWith('Tersimpan:'));tests++;console.log('PASS unconfirmed offline send never reports success');
  console.log('TOTAL '+tests+' checks passed. No live Sheets/Drive writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
