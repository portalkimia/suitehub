const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'lanjutan-ready'),topics=require('./lanjutan-data.cjs');
let checks=0;
function runtime(t){
 const els=new Map();
 class El{constructor(id='',value=''){this.id=id;this.value=String(value);this.options=[];this.textContent='';this._html='';if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}get selectedOptions(){return this.options.filter(o=>String(o.value)===String(this.value))}replaceChildren(...es){this.options=[];for(const e of es)this.add(e)}addEventListener(){}get innerHTML(){return this._html}set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]+)"/g))new El(m[1],m[2])}querySelectorAll(){return[]}hasAttribute(){return false}}
 ['controls','result','visual'].forEach(x=>new El(x));t.controls.forEach(([id,l,min,max,value])=>new El(id,value));
 const ctx=vm.createContext({document:{getElementById:id=>els.get(id),createElement:()=>new El(),querySelectorAll:()=>[],addEventListener(){}},Option:class{constructor(text,value){this.textContent=text;this.value=String(value)}},TOPIC:{sim:t.sim},window:{},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'lanjutan-runtime.js'),'utf8'),ctx);vm.runInContext('setup()',ctx);
 const result=()=>els.get('result').textContent;
 assert.ok(result().length>10,t.id+' empty result');assert.ok(!/NaN|undefined|Infinity/.test(result()),t.id+' invalid result');
 const set=(id,v)=>{els.get(id).value=String(v);vm.runInContext('update()',ctx)};
 return {result,set,els,ctx};
}
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const t of topics){
 const r=runtime(t),calc=s=>vm.runInContext(s,r.ctx);
 if(t.sim==='oil'){near(calc('oilPosition(69,30,350)'),.878125);near(calc('oilPosition(287,30,350)'),.196875);r.set('top',100);assert.match(r.result(),/Tetap uap/);r.set('boiling',287);r.set('bottom',200);assert.match(r.result(),/belum tervaporisasi/)}
 if(t.sim==='fuel'){const x=calc('combustion(8,11.4)');near(x.o2,1.25);near(x.co2mass,35.2);for(let n=1;n<=12;n++){const x=calc(`combustion(${n},14*${n}+2)`);near(x.co2*44+x.water*18,14*n+2+x.o2*32)}r.set('oxygen',50);assert.match(r.result(),/aktual tidak dihitung/)}
 if(t.sim==='families'){r.set('oxidant',0);r.set('halide',1);assert.match(r.result(),/Cl₂ \+ 2Br⁻ → 2Cl⁻ \+ Br₂/);r.set('oxidant',2);assert.match(r.result(),/Tidak ada penggantian/)}
 if(t.sim==='period3'){r.set('oxide','Al2O3');r.set('reagent',3);assert.match(r.result(),/6H⁺/);r.set('reagent',4);assert.match(r.result(),/Al\(OH\)₄/);r.set('oxide','SiO2');r.set('reagent',2);assert.match(r.result(),/Tidak langsung/)}
 if(t.sim==='transition'){near(calc('hund(5)'),5);near(calc('hund(6)'),4);near(calc('hund(10)'),0);r.set('ion',8);assert.match(r.result(),/Diamagnetik/);r.set('ion',4);assert.match(r.result(),/5,9161/)}
 if(t.sim==='complex'){near(calc('complexes[1].q-complexes[1].lq'),2);near(calc('complexes[2].count'),3);near(calc('complexes[2].donors'),6);assert.equal(calc('complexes[4].labels[0]===complexes[4].labels[1]'),true);assert.equal(calc('complexes[5].labels[0]===complexes[5].labels[2]'),true)}
 if(t.sim==='alcohol'){r.set('condition',4);assert.match(r.result(),/Asam etanoat/);r.set('compound',1);assert.match(r.result(),/Propanon/);r.set('compound',2);assert.match(r.result(),/Tidak teroksidasi/)}
 if(t.sim==='carbonyl'){r.set('test','tollens');assert.match(r.result(),/Positif/);r.set('compound',1);assert.match(r.result(),/Negatif/);r.set('test','reduction');assert.match(r.result(),/Propan-2-ol/)}
 if(t.sim==='ester'){r.set('conversion',60);assert.match(r.result(),/sisa=0,4 mol/);assert.match(r.result(),/asam etanoat=0,6 mol/);r.set('medium','base');assert.match(r.result(),/natrium etanoat=0,6 mol/);assert.match(r.result(),/NaOH dikonsumsi=0,6/)}
 if(t.sim==='halo'){r.set('elimination',30);assert.match(r.result(),/etanol=0,7 mol/);assert.match(r.result(),/etena=0,3 mol/);assert.match(r.result(),/Br⁻=1 mol/)}
 if(t.sim==='redox'){const x=calc('titrate(25,.02,25)');near(x.feLeft,0);near(x.mnExcess,0);near(x.equivalent,25);near(x.estimate,.1);near(calc('titrate(25,.02,26).estimate'),.104);for(let v=0;v<=60;v++){const x=calc(`titrate(25,.02,${v})`);near(x.feLeft+x.fe3,.0025);near(x.fe3/5+x.mnExcess,.02*v/1000)}}
 if(t.sim==='gravimetry'){near(calc('gravimetric(100,0).percent'),20);near(calc('gravimetric(90,0).percent'),18);near(calc('gravimetric(100,.05).percent'),20+5*35.45/143.32);assert.ok(calc('gravimetric(90,0).measured')<calc('gravimetric(100,0).measured'))}
 if(t.sim==='calibration'){const x=calc('regress(standards(0))');near(x.m,.1);near(x.b,.02);near(x.r2,1);near((.42-x.b)/x.m*5,20);assert.ok(calc('regress(standards(.1)).r2')<1);r.set('absorbance',1.1);assert.match(r.result(),/ekstrapolasi/);r.set('absorbance',0);assert.match(r.result(),/negatif/)}
 if(t.sim==='decay'){const x=calc('decay(1e6,5,10)');near(x.remain,250000);near(x.activity,Math.LN2/5*250000);near(calc('decay(2e6,5,10).fraction'),.25);near(calc('decay(1e6,5,0).remain'),1e6)}
 if(t.sim==='nuclear'){const cases=calc('nuclear');for(const c of cases){const sum=arr=>arr.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]);assert.deepEqual(sum(c[1]),sum(c[2]))}r.set('defect',.01);assert.match(r.result(),/9,315 MeV/);r.set('defect',-.01);assert.match(r.result(),/perlu energi/)}
 const valid=()=>{assert.ok(!/NaN|undefined|Infinity/.test(r.result()),t.id);assert.ok(!/NaN|undefined|Infinity/.test(r.els.get('visual').innerHTML),t.id+' visual')};
 for(const [id,label,min,max] of t.controls){r.set(id,min);valid();r.set(id,max);valid()}
 for(const [id,el] of r.els)for(const option of el.options){r.set(id,option.value);valid()}
 const html=fs.readFileSync(path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_12_Fase_F.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 const ids=[...html.split('<script')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const q of t.quiz){assert.equal(q.options.length,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length)}
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lkpd-3: '+t.lks[2]));
 console.log('PASS simulation, boundaries, syntax, quiz and AI rubric: '+t.id);checks++;
}
console.log('TOTAL '+checks+' topic checks passed. No live network/data writes.');

