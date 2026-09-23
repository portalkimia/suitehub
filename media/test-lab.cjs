const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'lab-ready'),topics=require('./lab-data.cjs'),source=fs.readFileSync(path.join(__dirname,'lab-runtime.js'),'utf8');
const model=vm.createContext({document:{addEventListener(){}},window:{}});vm.runInContext(source,model);
const calc=s=>vm.runInContext(s,model),near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const defaults=t=>Object.fromEntries(t.controls.map(c=>[c[0],c[4]]).concat(t.selects.map(s=>[s[0],s[2][0][0]])));
function evaluate(t,p){model.params=p;model.topicId=t.sim;const r=calc('evaluateLab(topicId,params)');assert.ok(r.summary.length>15,t.id);assert.ok(r.rows.length>0);for(const row of r.rows)if(typeof row[1]==='number')assert.ok(Number.isFinite(row[1]),t.id+' '+row[0]);const svg=calc('apparatus(evaluateLab(topicId,params))');assert.ok(!/NaN|undefined|Infinity/.test(svg),t.id+' visual');if(r.graph?.points){model.result=r;assert.ok(!/NaN|undefined|Infinity/.test(calc('chart(result.graph)')))}return r}
const row=(r,key)=>r.rows.find(x=>x[0]===key)?.[1];
let checks=0;
for(const t of topics){const p=defaults(t),r=evaluate(t,p),id=t.sim;
 if(id==='keselamatan'){assert.equal(row(r,'Keputusan sesuai'),'Ya');assert.equal(row(evaluate(t,{...p,action:'sink'}),'Keputusan sesuai'),'Belum')}
 if(id==='pengukuran'){near(row(r,'Pembacaan'),25);near(row(evaluate(t,{...p,scale:'.2'}),'Ketidakpastian skala ±'),.1)}
 if(id==='pemisahan'){near(row(r,'Target padat terkumpul'),9);assert.equal(evaluate(t,{...p,mixture:'salt'}).valid,false)}
 if(id==='larutan'){near(row(r,'NaCl ditimbang'),1.4625);near(row(evaluate(t,{...p,mode:'stock'}),'Stok0,5M dipipet'),50);near(row(evaluate(t,{...p,error:10}),'Konsentrasi aktual'),.025/.26)}
 if(id==='titrasi'){near(calc('titrationPH(25,false)'),7);near(calc('titrationPH(25,true)'),8.7219,1e-4);near(calc('titrationPH(12.5,true)'),4.7454,1e-4);near(row(evaluate(t,{...p,volume:26}),'C jika volume dianggap titik akhir'),.104)}
 if(id==='buffer'){near(row(r,'pH'),4.7449,1e-4);assert.ok(row(evaluate(t,{...p,added:12}),'pH')>12)}
 if(id==='kalorimetri'){near(row(r,'ΔT'),2850/438);near(row(r,'ΔH terukur'),-57);near(row(evaluate(t,{...p,loss:20}),'ΔH terukur'),-45.6)}
 if(id==='kinetika'){near(row(r,'[A] tersisa'),.5*Math.exp(-.02*30));assert.ok(row(evaluate(t,{...p,temp:320}),'k model')>.02)}
 if(id==='kesetimbangan'){const x=row(r,'FeSCN²⁺')/1000;near(x/(.001-x)**2,1000);assert.ok(row(evaluate(t,{...p,temp:320}),'K model')<1000)}
 if(id==='kelarutan'){near(row(r,'Cl⁻ mengendap'),0);near(row(r,'I⁻ mengendap'),99.9917)}
 if(id==='volta'){near(row(r,'E standar pasangan'),1.1);near(row(evaluate(t,{...p,left:'Ag',right:'Cu'}),'E standar pasangan'),.46);assert.equal(row(evaluate(t,{...p,bridge:'no'}),'Rangkaian berkelanjutan'),'Tidak')}
 if(id==='elektrolisis'){near(row(r,'Massa Cu katode'),600/96485/2*63.55);near(row(evaluate(t,{...p,anode:'inert'}),'O₂ anode'),600/96485/4)}
 if(id==='permanganometri'){near(row(r,'Ekuivalen'),25);near(row(evaluate(t,{...p,analyte:'oxalate'}),'Ekuivalen'),50)}
 if(id==='gravimetri'){near(row(r,'Kadar Cl terhitung'),20);near(row(evaluate(t,{...p,recovery:90}),'Kadar Cl terhitung'),18)}
 if(id==='spektro'){near(row(r,'Kadar asal terhitung'),20);near(row(evaluate(t,{...p,blank:'no'}),'Kadar asal terhitung'),21);near(row(evaluate(t,{...p,cuvette:'dirty'}),'Kadar asal terhitung'),22.5)}
 if(id==='kromatografi'){near(row(r,'Bercak A'),2.4);near(row(r,'Rf B'),.7);assert.equal(evaluate(t,{...p,baseline:'below'}).valid,false)}
 if(id==='gugus'){assert.match(row(evaluate(t,{...p,sample:'ketone',reagent:'dnph'}),'Hasil'),/Positif/);assert.match(row(evaluate(t,{...p,sample:'ketone',reagent:'tollens'}),'Hasil'),/Negatif/)}
 if(id==='esterifikasi'){near(row(r,'Batas ester setimbang model'),2/3);const c=evaluate(t,{...p,catalyst:'yes'});near(row(c,'Batas ester setimbang model'),2/3);assert.ok(row(c,'Ester terbentuk')>row(r,'Ester terbentuk'));near(row(c,'Ester terbentuk')+row(c,'Asam tersisa'),1)}
 if(id==='makanan'){assert.equal(evaluate(t,{...p,sample:'glucose',heat:'no'}).valid,false);assert.match(row(evaluate(t,{...p,sample:'mix',test:'biuret'}),'Hasil'),/Positif/)}
 if(id==='koloid'){assert.equal(row(evaluate(t,{...p,kind:'sol',salt:15}),'Koagulasi'),'Terjadi pada ambang model');assert.ok(row(evaluate(t,{...p,kind:'emulsion',emulsifier:'yes'}),'Fraksi emulsi bertahan model')>row(evaluate(t,{...p,kind:'emulsion',emulsifier:'no'}),'Fraksi emulsi bertahan model'))}
 if(id==='nyala'){assert.equal(row(evaluate(t,{...p,metal:'K',clean:'no'}),'Warna'),'kuning');assert.equal(row(evaluate(t,{...p,metal:'K'}),'Warna'),'lilac')}
 if(id==='halogen'){assert.equal(row(evaluate(t,{...p,oxidant:'0',halide:'1'}),'Penggantian'),'Ya');assert.equal(row(evaluate(t,{...p,oxidant:'2',halide:'1'}),'Penggantian'),'Tidak')}
 if(id==='air'){near(row(evaluate(t,{...p,sample:'two',test:'hardness'}),'EDTA0,010M untuk50mL'),10);assert.match(r.summary,/Tidak mengukur mikroba/)}
 if(id==='misteri'){for(const [sample,test]of[['A','benedict'],['B','chloride'],['C','iodine'],['D','acid']])assert.equal(row(evaluate(t,{sample,test}),'Hasil'),'Positif')}
 for(const [key,label,min,max]of t.controls){evaluate(t,{...p,[key]:min});evaluate(t,{...p,[key]:max})}
 // Exhaust all categorical combinations, including invalid experimental conditions.
 function combinations(i,params){if(i===t.selects.length){evaluate(t,params);return}const [key,,options]=t.selects[i];for(const [value]of options)combinations(i+1,{...params,[key]:value})}combinations(0,p);
 const html=fs.readFileSync(path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_Umum.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 assert.ok(html.includes('Umum • Laboratorium Virtual'));assert.ok(html.includes('id="lks-journal"'));assert.ok(!/Kelas XII|Fase F|_12_Fase_F/.test(html));
 for(const q of t.quiz){assert.equal(q.options.length,4);assert.ok(q.options[q.answer])}
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lks-journal berisi riwayat otomatis'));console.log('PASS laboratory model, controls, syntax, AI rubric and Umum metadata: '+t.id);checks++;
}
// Exercise actual GAS filename routing and portal grade normalization.
const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=gas.indexOf('const structuredMatch = rawName.match'),b=gas.indexOf('// TAHAP 2:',a),block=gas.slice(a,b).replace(/\/\/ =+\s*$/,'');
const classify=new vm.Script('(function(rawName){let cleanTitle="",grade="",detectedFromFilename=false;'+block+';return grade;})').runInNewContext();
const normalize=new vm.Script('('+index.slice(index.indexOf('function normalizeGradeKey('),index.indexOf('function getMaterialPedagogicalScore(')).trim()+')').runInNewContext();
for(const t of topics){const grade=classify(t.file+'_Umum.html');assert.equal(grade,'Semua Kelas (Umum)');assert.equal(normalize(grade).key,'umum')}console.log('PASS production GAS scan and portal category routing for all24labs');checks++;
// Minimal DOM exercises workflow, reload persistence, credit limit and final wipe.
function harness(topic,shared=new Map()){
 const els=new Map(),controlIds=topic.controls.map(x=>x[0]);let finalized=false;
 class El{constructor(id='',type=''){this.id=id;this.type=type;this.value='';this.textContent='';this.innerHTML='';this.disabled=false;this.checked=false;this.options=[];this.listeners={};if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e);if(this.id==='controls'&&e.children)for(const c of e.children){els.set(c.id,c);controlIds.push(c.id)}(this.children||=[]).push(e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}addEventListener(k,f){this.listeners[k]=f}hasAttribute(a){return a==='data-answer'&&['lks-journal','lks-observasi','lkpd-1','lkpd-2','lkpd-3','reflection'].includes(this.id)}}
 for(const id of ['controls','result','visual','student-date','lab-run','record','lab-dose','lab-credit','lab-history','lks-journal','lks-observasi','lkpd-1','lkpd-2','lkpd-3','reflection','draft-status'])new El(id);
 for(const [id,label,min,max,value]of topic.controls){const e=new El(id,'range');e.value=String(value);e.max=String(max)}
 const steps=Array.from({length:3},(_,i)=>new El('step'+i,'checkbox'));
 const document={getElementById:id=>els.get(id),createElement:type=>new El('',type==='select'?'select-one':type),addEventListener(){},querySelectorAll(selector){if(selector==='.lab-step')return steps;if(selector.startsWith('#controls'))return controlIds.map(id=>els.get(id));if(selector==='[data-answer]')return [...els.values()].filter(e=>e.hasAttribute('data-answer'));return[]}};
 const ctx=vm.createContext({document,TOPIC:{sim:topic.sim,selects:topic.selects},STORAGE_KEY:'test_'+topic.id,localStorage:{getItem:k=>shared.get(k)||null,setItem:(k,v)=>shared.set(k,v),removeItem:k=>shared.delete(k)},window:{PortalSubmission:{isFinal:()=>finalized}},Option:class{constructor(t,v){this.textContent=t;this.value=String(v)}},console});vm.runInContext(source,ctx);vm.runInContext('start()',ctx);
 return{els,steps,shared,run:()=>vm.runInContext('runExperiment()',ctx),count:()=>vm.runInContext('labState.entries.length',ctx),credits:()=>vm.runInContext('labState.credits',ctx),final(){finalized=true;vm.runInContext('clearFinalLab()',ctx)},ctx};
}
const mystery=topics.find(t=>t.sim==='misteri'),h=harness(mystery);h.run();assert.equal(h.count(),0);h.steps.forEach(s=>s.checked=true);h.run();assert.equal(h.count(),1);assert.equal(h.credits(),6);assert.ok(h.els.get('lks-journal').value.includes('Kondisi:'));
const reload=harness(mystery,h.shared);assert.equal(reload.count(),1);assert.equal(reload.credits(),6);reload.steps.forEach(s=>s.checked=true);for(let i=0;i<5;i++)reload.run();assert.equal(reload.count(),4);assert.equal(reload.credits(),0);reload.final();assert.equal(reload.count(),0);assert.equal(reload.els.get('lks-journal').value,'');assert.equal(reload.shared.has('test_'+mystery.id+'_lab'),false);reload.run();assert.equal(reload.count(),0);
console.log('PASS preparation gating, automatic journal, reload, mystery budget and final wipe');checks++;
const hh=harness(topics.find(t=>t.sim==='titrasi'));hh.steps.forEach(s=>s.checked=true);hh.els.get('lks-observasi').disabled=true;hh.run();assert.equal(hh.count(),0);hh.els.get('lks-observasi').disabled=false;hh.run();assert.equal(hh.count(),1);hh.els.get('volume').value='25';vm.runInContext('update()',hh.ctx);hh.els.get('record').onclick();assert.equal(hh.els.get('lks-observasi').value,'');hh.run();hh.els.get('record').onclick();assert.ok(hh.els.get('lks-observasi').value.includes('25'));console.log('PASS locked controls and stale observation prevention');checks++;
console.log('TOTAL '+checks+' laboratory checks passed. No live network/data writes.');
