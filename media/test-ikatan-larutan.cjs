const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'ikatan-larutan-ready'),topics=require('./ikatan-larutan-data.cjs');
let checks=0;
function runtime(t){
 const els=new Map();
 class El{constructor(id='',value=''){this.id=id;this.value=String(value);this.options=[];this.textContent='';this._html='';if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}get selectedOptions(){return this.options.filter(o=>String(o.value)===String(this.value))}replaceChildren(...es){this.options=[];for(const e of es)this.add(e)}addEventListener(){}get innerHTML(){return this._html}set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]+)"/g))new El(m[1],m[2])}querySelectorAll(){return[]}hasAttribute(){return false}}
 ['controls','result','visual'].forEach(x=>new El(x));t.controls.forEach(([id,l,min,max,value])=>new El(id,value));
 const ctx=vm.createContext({document:{getElementById:id=>els.get(id),createElement:()=>new El(),querySelectorAll:()=>[],addEventListener(){}},Option:class{constructor(text,value){this.textContent=text;this.value=String(value)}},TOPIC:{sim:t.sim},window:{},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'ikatan-larutan-runtime.js'),'utf8'),ctx);vm.runInContext('setup()',ctx);
 const result=()=>els.get('result').textContent;
 assert.ok(result().length>10,t.id+' empty result');assert.ok(!/NaN|undefined|Infinity/.test(result()),t.id+' invalid result');
 const set=(id,v)=>{els.get(id).value=String(v);vm.runInContext('update()',ctx)};
 return {result,set,els,ctx};
}
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const t of topics){
 const r=runtime(t),calc=s=>vm.runInContext(s,r.ctx);
 if(t.sim==='bond'){assert.match(r.result(),/tidak menghantar/);r.set('phase','aq');assert.match(r.result(),/dapat bergerak/);r.set('material','metal');assert.match(r.result(),/tidak otomatis larut/)}
 if(t.sim==='lewis'){for(let i=0;i<5;i++){const m=calc(`molecules[${i}]`),v=calc(`lewisCheck(molecules[${i}],${m.order},${m.lp})`);assert.ok(v.correct);near(v.total,m.total);assert.ok(!calc(`lewisCheck(molecules[${i}],${m.order},${m.lp+1}).correct`))}}
 if(t.sim==='vsepr'){near(calc('molecules.length'),7);assert.equal(calc('molecules[1].bonds+molecules[1].lp'),4);assert.equal(calc('molecules[1].shape'),'bengkok');assert.equal(calc('molecules[6].coords.length'),6)}
 if(t.sim==='hybrid'){for(const [key,sigma,pi] of [['ethane',7,0],['ethene',5,1],['ethyne',3,2]]){r.set('hydrocarbon',key);assert.ok(r.result().includes(`${sigma} ikatan σ dan ${pi} ikatan π`))}}
 if(t.sim==='polarity'){near(calc('dipole(1,1,180).magnitude'),0);near(calc('dipole(1,1,90).magnitude'),Math.sqrt(2));near(calc('dipole(1,.5,180).magnitude'),.5);near(calc('dipole(0,0,104.5).magnitude'),0)}
 if(t.sim==='imf'){r.set('distance',2**(1/6));r.set('epsilon',2);assert.match(r.result(),/U\(r\)=-2/);r.set('distance',1);assert.match(r.result(),/U\(r\)=0/)}
 if(t.sim==='solution'){assert.match(r.result(),/1,4625 g/);assert.match(r.result(),/25 mL/);r.set('target',.5);r.set('stock',.1);assert.match(r.result(),/tidak dapat dicapai/)}
 if(t.sim==='electrolyte'){const x=calc('weakIon(.01)');near(x*x/(.01-x),1.8e-5,1e-12);assert.ok(calc('weakIon(.001)/.001 > weakIon(.01)/.01'));assert.ok(calc('weakIon(.001) < weakIon(.01)'))}
 if(t.sim==='ksp'){for(const k of [1e-12,1e-8,1e-4])for(const nu of [1,2]){const s=calc(`solubility(${k},${nu})`);near(s*(nu*s)**nu/k,1)}}
 if(t.sim==='precip'){near(calc('precipitate(.01,1.8e-10,1.8e-8)'),0);assert.ok(calc('precipitate(.01,8.3e-17,1e-10)/.01')>.999);const s=calc('commonIon(1.8e-10,.01)');near(s*(.01+s)/1.8e-10,1)}
 if(t.sim==='colligative'){const a=calc('colligative(6,60,1,1,1,298)'),b=calc('colligative(5.85,58.5,2,1,1,298)');near(a.n,.1);near(a.freeze,.186);near(a.boil,.0512);near(a.pi,.1*.082057*298);near(b.freeze,2*a.freeze);assert.ok(a.ratio<1&&a.ratio>0)}
 if(t.sim==='colloid'){near(calc('stokes(1000,1)/stokes(100,1)'),100);near(calc('stokes(100,10)/stokes(100,1)'),.1)}
 const valid=()=>{assert.ok(!/NaN|undefined|Infinity/.test(r.result()),t.id);assert.ok(!/NaN|undefined|Infinity/.test(r.els.get('visual').innerHTML),t.id+' visual')};
 for(const [id,label,min,max] of t.controls){r.set(id,min);valid();r.set(id,max);valid()}
 for(const [id,el] of r.els)for(const option of el.options){r.set(id,option.value);valid()}
 const html=fs.readFileSync(path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_11_Fase_F.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 const ids=[...html.split('<script')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const q of t.quiz)assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lkpd-3: '+t.lks[2]));
 console.log('PASS simulation, boundaries, syntax, quiz and AI rubric: '+t.id);checks++;
}
console.log('TOTAL '+checks+' topic checks passed. No live network/data writes.');

