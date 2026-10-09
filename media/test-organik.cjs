const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'organik-ready'),topics=require('./organik-data.cjs');
let checks=0;
function runtime(t){
 const els=new Map();
 class El{constructor(id='',value=''){this.id=id;this.value=String(value);this.options=[];this.textContent='';this._html='';if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}get selectedOptions(){return this.options.filter(o=>String(o.value)===String(this.value))}replaceChildren(...es){this.options=[];for(const e of es)this.add(e)}addEventListener(){}get innerHTML(){return this._html}set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]+)"/g))new El(m[1],m[2])}querySelectorAll(){return[]}hasAttribute(){return false}}
 ['controls','result','visual'].forEach(x=>new El(x));t.controls.forEach(([id,l,min,max,value])=>new El(id,value));
 const ctx=vm.createContext({document:{getElementById:id=>els.get(id),createElement:()=>new El(),querySelectorAll:()=>[],addEventListener(){}},Option:class{constructor(text,value){this.textContent=text;this.value=String(value)}},TOPIC:{sim:t.sim},window:{},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'organik-runtime.js'),'utf8'),ctx);vm.runInContext('setup()',ctx);
 const result=()=>els.get('result').textContent;
 assert.ok(result().length>10,t.id+' empty result');assert.ok(!/NaN|undefined|Infinity/.test(result()),t.id+' invalid result');
 const set=(id,v)=>{els.get(id).value=String(v);vm.runInContext('update()',ctx)};
 return {result,set,els,ctx};
}
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
for(const t of topics){
 const r=runtime(t),calc=s=>vm.runInContext(s,r.ctx);
 if(t.sim==='isomer'){r.set('pair',3);assert.match(r.els.get('visual').innerHTML,/cis/);assert.match(r.result(),/C₄H₈/)}
 if(t.sim==='groups'){r.set('compound',2);assert.match(r.result(),/Aldehida/);r.set('compound',5);assert.match(r.result(),/Ester/);assert.match(r.result(),/Tidak/)}
 if(t.sim==='reaction'){near(calc('equilibrium(1,1,4)'),2/3);assert.ok(calc('equilibrium(1,2,4)')>2/3);for(const a of [.1,1,2])for(const b of [.1,1,4])for(const k of [.5,4,10]){const x=calc(`equilibrium(${a},${b},${k})`);assert.ok(x>0&&x<Math.min(a,b));near(x*x/((a-x)*(b-x)),k)}}
 if(t.sim==='aromatic'){for(const [p,name] of [[2,'orto'],[3,'meta'],[4,'para'],[5,'meta'],[6,'orto']]){r.set('position',p);assert.match(r.result(),new RegExp(name+'-dimetilbenzena'))}}
 if(t.sim==='polymer'){const a=calc('polymer(10,"addition")'),b=calc('polymer(10,"condensation")');near(a.mass,280);near(b.mass,738);near(b.water,9);near(b.input,b.mass+18*b.water)}
 if(t.sim==='carb'){r.set('sample','sucrose');assert.match(r.result(),/Benedict: negatif/);r.set('hydrolysis','yes');assert.match(r.result(),/Benedict: positif/);r.set('sample','starch');assert.match(r.result(),/tidak membentuk kompleks/);r.set('hydrolysis','no');assert.match(r.result(),/Iodin: biru/);r.set('sample','fructose');assert.match(r.result(),/Benedict: positif/)}
 if(t.sim==='protein'){for(let ph=0;ph<=14;ph+=.2){const f=calc(`glycine(${ph})`);near(f.plus+f.zero+f.minus,1);assert.ok(f.plus>=0&&f.zero>=0&&f.minus>=0)}const f=calc('glycine(5.97)');near(f.plus-f.minus,0);assert.ok(calc('glycine(1).plus')>.9);assert.ok(calc('glycine(12).minus')>.99)}
 if(t.sim==='enzyme'){near(calc('rate(2,2,60,0)'),30);near(calc('rate(2,2,60,2)'),15);near(calc('rate(0,2,60,2)'),0);assert.ok(calc('rate(1e8,2,60,2)')>59.99)}
 if(t.sim==='lipid'){r.set('mol',.5);r.set('double',3);assert.match(r.result(),/H₂=1,5 mol/);assert.match(r.result(),/NaOH=1,5 mol/);r.set('double',0);assert.match(r.result(),/H₂=0 mol/);assert.match(r.result(),/NaOH=1,5 mol/)}
 if(t.sim==='dna'){const d=calc('dna("ATGCCA")');assert.equal(d.complement,'TACGGT');assert.equal(d.reverse,'TGGCAT');near(d.gc,50);near(d.h,15);near(calc('dna("AAAAAA").h'),12);near(calc('dna("GCGCGC").h'),18)}
 const valid=()=>{assert.ok(!/NaN|undefined|Infinity/.test(r.result()),t.id);assert.ok(!/NaN|undefined|Infinity/.test(r.els.get('visual').innerHTML),t.id+' visual')};
 for(const [id,label,min,max] of t.controls){r.set(id,min);valid();r.set(id,max);valid()}
 for(const [id,el] of r.els)for(const option of el.options){r.set(id,option.value);valid()}
 const html=fs.readFileSync(path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_12_Fase_F.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 const ids=[...html.split('<script')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const q of t.quiz)assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lkpd-3: '+t.lks[2]));
 console.log('PASS simulation, boundaries, syntax, quiz and AI rubric: '+t.id);checks++;
}
console.log('TOTAL '+checks+' topic checks passed. No live network/data writes.');

