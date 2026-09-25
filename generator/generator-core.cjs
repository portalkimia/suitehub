/* Shared deterministic validation, embedded in HTML and GAS by build-generator-v2.py. */
var GeneratorCore = (function () {
  'use strict';
  var prefixes=['subTopik','ayat','zona','awal','memahami','mengaplikasi','merefleksi','penutup'];
  var strings=['topik','kelas','waktu','tujuan','model','strategi','metode','kemitraan','lingkungan','digital','listAsesmen','dapus','lampiran'];
  var bools=['keimanan','penalaran','kolaborasi','kesehatan','kewargaan','kreativitas','kemandirian','komunikasi'];
  function keys() { var result=strings.slice(); for(var i=1;i<=14;i++) ['itp','asesmen','aktivitas'].forEach(function(p){result.push(p+i);}); for(var j=1;j<=9;j++) prefixes.forEach(function(p){result.push(p+j);}); return result; }
  function validateAI(raw, mode, count, number) {
    var data=typeof raw==='string'?JSON.parse(raw):raw;
    if(!data || Array.isArray(data) || typeof data!=='object') throw Error('Respons AI harus berupa objek JSON.');
    if(data.error) throw Error(String(data.error));
    var allowed=keys().concat(bools), required=[];
    if(mode==='pertemuan') { if(!Number.isInteger(Number(number))||number<1||number>9) throw Error('Nomor pertemuan tidak valid.'); allowed=prefixes.map(function(p){return p+number;}); required=allowed; }
    else if(mode==='itp') {allowed=keys().filter(function(k){return /^(itp|asesmen|aktivitas)\d+$/.test(k);}); required=['itp1','asesmen1','aktivitas1'];}
    else { if(!Number.isInteger(Number(count))||count<1||count>9) throw Error('Jumlah pertemuan tidak valid.'); required=['tujuan','itp1','asesmen1','aktivitas1']; for(var j=1;j<=count;j++) prefixes.forEach(function(p){required.push(p+j);}); }
    var result={}; Object.keys(data).forEach(function(k){
      if(allowed.indexOf(k)<0) throw Error('Field AI tidak dikenal: '+k);
      if(bools.indexOf(k)>=0) {if(typeof data[k]!=='boolean') throw Error('Profil harus boolean: '+k);}
      else if(typeof data[k]!=='string'||data[k].length>20000||/\[Isi\b/i.test(data[k])) throw Error('Isian AI tidak valid: '+k);
      result[k]=data[k];
    });
    required.forEach(function(k){if(typeof result[k]!=='string'||!result[k].trim()) throw Error('Respons AI belum lengkap: '+k);});
    return result;
  }
  function canonical(value) { if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']'; if(value&&typeof value==='object') return '{'+Object.keys(value).filter(function(k){return k!=='requestId';}).sort().map(function(k){return JSON.stringify(k)+':'+canonical(value[k]);}).join(',')+'}'; return JSON.stringify(value); }
  function validateFile(name,mime,bytes) {
    var ext=String(name||'').split('.').pop().toLowerCase();
    var types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',txt:'text/plain',md:'text/markdown',html:'text/html',htm:'text/html'};
    if(!types[ext]) throw Error('Jenis berkas tidak didukung.');
    var text=['txt','md','html','htm'].indexOf(ext)>=0, limit=text?1024*1024:5*1024*1024;
    if(!bytes||!bytes.length||bytes.length>limit) throw Error(text?'Berkas teks maksimal 1 MB.':'PDF/gambar maksimal 5 MB.');
    if(mime&&mime!==types[ext]&&!(text&&(mime==='text/plain'||mime==='text/markdown'))) throw Error('Jenis MIME tidak sesuai ekstensi berkas.');
    var b=Array.from(bytes).map(function(x){return x&255;}), head=String.fromCharCode.apply(null,b.slice(0,12));
    if(ext==='pdf'&&!head.startsWith('%PDF-')) throw Error('Tanda pengenal PDF tidak valid.');
    if(ext==='png'&&b.slice(0,8).join(',')!=='137,80,78,71,13,10,26,10') throw Error('Tanda pengenal PNG tidak valid.');
    if((ext==='jpg'||ext==='jpeg')&&!(b[0]===255&&b[1]===216&&b[2]===255)) throw Error('Tanda pengenal JPEG tidak valid.');
    if(ext==='webp'&&!(head.startsWith('RIFF')&&head.slice(8)==='WEBP')) throw Error('Tanda pengenal WebP tidak valid.');
    if(text&&b.indexOf(0)>=0) throw Error('Berkas teks mengandung data biner.');
    return types[ext];
  }
  function validateManifest(items) {
    if(!Array.isArray(items)||!items.length) throw Error('Katalog harus berupa daftar.');
    var ids=new Set(); items.forEach(function(m){if(!m||typeof m.id!=='string'||ids.has(m.id)||typeof m.title!=='string'||!m.title.trim()) throw Error('ID/judul katalog tidak valid atau duplikat.'); ids.add(m.id);
      if(typeof m.url!=='string'||!/^\.\.\/media\/[A-Za-z0-9_./-]+\.html$/.test(m.url)||m.url.slice(9).includes('..')) throw Error('URL katalog tidak aman.');
      if(['10','11','12','Umum'].indexOf(m.grade)<0||['Media Pembelajaran','Praktikum Virtual'].indexOf(m.category)<0) throw Error('Kategori katalog tidak valid.');
    }); return items;
  }
  function placeholders(text) { return Array.from(new Set(String(text).match(/\{\{[^{}]+\}\}/g)||[])); }
  function templateCheck(text) {
    var fixed=['Nama','Topik','Kelas','Waktu','Tujuan','Model','Strategi','Metode','Kemitraan','Lingkungan','Digital','ListAsesmen','Dapus','Lampiran','Keimanan','Penalaran','Kolaborasi','Kesehatan','Kewargaan','Kreativitas','Kemandirian','Komunikasi'];
    var found=placeholders(text), unknown=found.filter(function(p){var k=p.slice(2,-2);return fixed.indexOf(k)<0&&!/^(ITP|Asesmen|Aktivitas)([1-9]|1[0-4])$/.test(k)&&!/^(SubTopik|Ayat|Zona|Awal|Memahami|Mengaplikasi|Merefleksi|Penutup)[1-9]$/.test(k);});
    var missing=['Topik','Kelas','Tujuan'].filter(function(k){return found.indexOf('{{'+k+'}}')<0;});
    return {unknown:unknown,missing:missing,valid:!unknown.length&&!missing.length};
  }
  return {validateAI:validateAI,canonical:canonical,validateFile:validateFile,validateManifest:validateManifest,placeholders:placeholders,templateCheck:templateCheck};
})();
if(typeof module!=='undefined') module.exports=GeneratorCore;
