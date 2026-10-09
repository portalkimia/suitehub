const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'kelas10-ready'),topics=require('./kelas10-data.cjs');
let checks=0;
function runtime(t){
 const els=new Map();
 class El{constructor(id='',value=''){this.id=id;this.value=String(value);this.options=[];this.textContent='';this._html='';if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}get selectedOptions(){return this.options.filter(o=>String(o.value)===String(this.value))}replaceChildren(...es){this.options=[];for(const e of es)this.add(e)}addEventListener(){}get innerHTML(){return this._html}set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]+)"/g))new El(m[1],m[2])}querySelectorAll(){return[]}hasAttribute(){return false}}
 ['controls','result','visual'].forEach(x=>new El(x));t.controls.forEach(([id,l,min,max,value])=>new El(id,value));
 const ctx=vm.createContext({document:{getElementById:id=>els.get(id),createElement:()=>new El(),querySelectorAll:()=>[],addEventListener(){}},Option:class{constructor(text,value){this.textContent=text;this.value=String(value)}},TOPIC:{sim:t.sim},window:{},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'kelas10-runtime.js'),'utf8'),ctx);vm.runInContext('setup()',ctx);
 const result=()=>els.get('result').textContent;
 assert.ok(result().length>10,t.id+' empty result');assert.ok(!/NaN|undefined|Infinity/.test(result()),t.id+' invalid result');
 const set=(id,v)=>{els.get(id).value=String(v);vm.runInContext('update()',ctx)};
 return {result,set,els};
}
for(const t of topics){
 const r=runtime(t);
 if(t.sim==='experiment'){assert.match(r.result(),/576/);r.set('temp',60);assert.match(r.result(),/360/)}
 if(t.sim==='green'){assert.match(r.result(),/E-factor 5/);assert.match(r.result(),/PMI 6/)}
 if(t.sim==='atom'){assert.match(r.result(),/35,5/);r.set('charge',2);assert.match(r.result(),/elektron=4/);r.set('p',1);assert.match(r.result(),/negatif/)}
 if(t.sim==='laws'){assert.match(r.result(),/air 9 g/);assert.match(r.result(),/sisa H 1 g/)}
 if(t.sim==='mole'){assert.match(r.result(),/= 1 mol/);r.set('substance','44|CO₂|molekul|yes');r.set('mass',44);assert.match(r.result(),/22,4 L/)}
 if(t.sim==='limiting'){assert.match(r.result(),/tepat stoikiometris/);assert.match(r.result(),/teoritis 36 g; aktual 28,8 g/);r.set('purity',50);assert.match(r.result(),/H₂ pembatas/);assert.match(r.result(),/teoritis 18 g/)}
 if(t.sim==='waste'){assert.match(r.result(),/tersisa 2\.500 mg/);assert.match(r.result(),/akhir 25 mg/);r.set('dilution',5);assert.match(r.result(),/akhir 5 mg/);assert.match(r.result(),/tersisa 2\.500 mg/)}
 if(t.sim==='nano'){assert.match(r.result(),/0,6 nm/);assert.match(r.result(),/600 µm/);assert.match(r.result(),/25 kg CO/)}
 if(t.sim==='formula'){r.set('cation',3);r.set('anion',4);assert.match(r.result(),/Al₂\(SO₄\)₃/);assert.match(r.result(),/2×\(\+3\) \+ 3×\(−2\)/)}
 if(t.sim==='balance'){r.set('coeff0',2);r.set('coeff2',2);assert.match(r.result(),/Setara dan paling sederhana/);r.set('reaction',1);r.set('coeff1',2);r.set('coeff3',2);assert.match(r.result(),/Setara dan paling sederhana/);r.set('reaction',2);r.set('coeff0',4);r.set('coeff1',3);r.set('coeff2',2);assert.match(r.result(),/Setara dan paling sederhana/);r.set('coeff0',0);assert.match(r.result(),/Gunakan koefisien/)}
 if(t.sim==='safety'){r.set('decision',1);assert.match(r.result(),/Tepat/);r.set('scenario',2);r.set('decision',0);assert.match(r.result(),/Perlu diperbaiki/);r.set('decision',2);assert.match(r.result(),/Tepat/)}
 if(t.sim==='particles'){r.set('kind','mix');r.set('state','gas');assert.match(r.result(),/Campuran/);assert.match(r.els.get('visual').innerHTML,/<circle/)}
 const file=path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_10_Fase_E.html'),html=fs.readFileSync(file,'utf8');
 const ids=[...html.split('<script>')[0].matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,t.id+' duplicate ids');
 for(const q of t.quiz){assert.ok(q.options[q.answer]);assert.equal(new Set(q.options).size,q.options.length)}
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(JSON.stringify(t.id)+':'));assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lkpd-3: '+t.lks[2]));
 console.log('PASS simulation, numeric cases, HTML structure and AI rubric: '+t.id);checks++;
}
console.log('TOTAL '+checks+' topic checks passed; no browser or external writes.');

