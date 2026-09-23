const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.join(__dirname,'fisik-ready'),topics=require('./fisik-data.cjs');
let checks=0;
function runtime(t){
 const els=new Map();
 class El{constructor(id='',value=''){this.id=id;this.value=String(value);this.options=[];this.textContent='';this._html='';if(id)els.set(id,this)}append(e){if(e.id)els.set(e.id,e)}add(e){this.options.push(e);if(this.options.length===1)this.value=e.value}get selectedOptions(){return this.options.filter(o=>String(o.value)===String(this.value))}replaceChildren(...es){this.options=[];for(const e of es)this.add(e)}addEventListener(){}get innerHTML(){return this._html}set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]+)"/g))new El(m[1],m[2])}querySelectorAll(){return[]}hasAttribute(){return false}}
 ['controls','result','visual'].forEach(x=>new El(x));t.controls.forEach(([id,l,min,max,value])=>new El(id,value));
 const ctx=vm.createContext({document:{getElementById:id=>els.get(id),createElement:()=>new El(),querySelectorAll:()=>[],addEventListener(){}},Option:class{constructor(text,value){this.textContent=text;this.value=String(value)}},TOPIC:{sim:t.sim},window:{},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'fisik-runtime.js'),'utf8'),ctx);vm.runInContext('setup()',ctx);
 const result=()=>els.get('result').textContent;
 assert.ok(result().length>10,t.id+' empty result');assert.ok(!/NaN|undefined|Infinity/.test(result()),t.id+' invalid result');
 const set=(id,v)=>{els.get(id).value=String(v);vm.runInContext('update()',ctx)};
 return {result,set,els,ctx};
}
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
for(const t of topics){
 const r=runtime(t),calc=s=>vm.runInContext(s,r.ctx);
 if(t.sim==='calor'){assert.match(r.result(),/−|-/);assert.match(r.result(),/41,8/);r.set('delta',-5);assert.match(r.result(),/Endoterm/);r.set('delta',0);assert.match(r.result(),/Tidak ada/)}
 if(t.sim==='hess'){assert.match(r.result(),/-393,5/);assert.match(r.result(),/-183/);r.set('direction',-1);r.set('factor',2);assert.match(r.result(),/787/)}
 if(t.sim==='arrhenius'){const k=t=>1e7*Math.exp(-50000/(8.314*t));assert.ok(k(310)>k(300));r.set('temperature',310);assert.match(r.result(),/s⁻¹/)}
 if(t.sim==='rate'){near(calc('concentration(1,.05,1,20)'),Math.exp(-1));near(calc('concentration(1,.05,0,100)'),0);near(calc('concentration(1,.05,2,20)'),.5);r.set('order',2);assert.match(r.result(),/t½=20 s/)}
 if(t.sim==='equilibrium'){const e=calc('eqSolve(1,1,0,4)');near(e.c/e.a/e.b,4);near(e.a+e.c,1);const e2=calc('eqSolve(.1,.1,2,.1)');assert.ok(e2.x<0);near(e2.c/e2.a/e2.b,.1)}
 if(t.sim==='shift'){const a=calc('gasEq(5,298)'),b=calc('gasEq(2,298)'),c=calc('gasEq(5,320)');near(a.k,.1);assert.ok(b.b<a.b);assert.ok(c.k>a.k);near((a.b/5)**2/(a.a/5),a.k)}
 if(t.sim==='ph'){near(calc('strongPH(.01)'),2,1e-8);near(calc('strongPH(1e-8)'),6.978294,1e-5);near(calc('strongPH(0)'),7);near(calc('strongPH(-.01)'),12,1e-8);assert.ok(calc('acidPH(.01,1e-5)')>2);r.set('kind','weak-base');assert.ok(/pH=/.test(r.result()))}
 if(t.sim==='titration'){near(calc('titration(25,false)'),7);near(calc('titration(12.5,true)'),4.7454,.002);near(calc('titration(25,true)'),8.7219,.002);assert.ok(calc('titration(40,true)')>12);let prev=-Infinity;for(let v=0;v<=50;v+=.25){const p=calc('titration('+v+',true)');assert.ok(p>=prev);prev=p}r.set('kind','weak');r.set('vb',25);assert.match(r.result(),/Tepat ekuivalen/)}
 if(t.sim==='buffer'){near(calc('acidPH(.2,1.8e-5,.1)'),4.7449,.002);r.set('added',25);assert.match(r.result(),/Kapasitas/);r.set('added',-25);assert.ok(!/NaN|Infinity/.test(r.result()))}
 if(t.sim==='hydrolysis'){near(calc('acidPH(.1,1.8e-5,.1)'),8.8724,.002);near(calc('acidPH(.1,1e-14/1.8e-5)'),5.1276,.002);r.set('kind','acetate');assert.match(r.result(),/OH/)}
 // Exercise every numeric control at both endpoints against runtime regressions.
 for(const [id,label,min,max] of t.controls){r.set(id,min);assert.ok(!/NaN|undefined|Infinity/.test(r.result()),t.id+' min '+id);r.set(id,max);assert.ok(!/NaN|undefined|Infinity/.test(r.result()),t.id+' max '+id)}
 const html=fs.readFileSync(path.join(root,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru',t.file+'_11_Fase_F.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 const gas=fs.readFileSync(path.join(root,'Code.gs'),'utf8');assert.ok(gas.includes(t.rubric));assert.ok(gas.includes('lkpd-3: '+t.lks[2]));
 console.log('PASS model, boundaries, conservation, syntax and AI rubric: '+t.id);checks++;
}
console.log('TOTAL '+checks+' topic checks passed. No live network/data writes.');

