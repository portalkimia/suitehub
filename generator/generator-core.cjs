/* Shared deterministic validation, embedded in HTML and GAS by build-generator-v2.py. */
var GeneratorCore = (function () {
  'use strict';
  var library = [
    {id:'q55-9',reference:'QS. Ar-Rahman 55:9',arabic:'وَأَقِيمُوا۟ ٱلْوَزْنَ بِٱلْقِسْطِ وَلَا تُخْسِرُوا۟ ٱلْمِيزَانَ',translation:'Dan tegakkanlah keseimbangan itu dengan adil dan janganlah kamu mengurangi keseimbangan itu.',language:'Indonesia',source:'https://quran.com/id/ar-rahman/9',verifiedOn:'2026-09-24',scope:'Ayat lengkap; refleksi keadilan dan kejujuran pengukuran, bukan penjelasan hukum kesetimbangan kimia.'},
    {id:'bukhari-1',reference:'Sahih al-Bukhari 1 (kutipan awal)',arabic:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',translation:'The reward of deeds depends upon the intentions',language:'English (teks sumber)',source:'https://sunnah.com/bukhari:1',verifiedOn:'2026-09-24',scope:'Kutipan awal hadis sahih, bukan hadis lengkap. Refleksi niat belajar; bukan klaim ilmiah.'}
  ];
  var prefixes=['subTopik','ayat','zona','awal','memahami','mengaplikasi','merefleksi','penutup'];
  var strings=['topik','kelas','waktu','tujuan','model','strategi','metode','kemitraan','lingkungan','digital','listAsesmen','dapus','lampiran'];
  var bools=['keimanan','penalaran','kolaborasi','kesehatan','kewargaan','kreativitas','kemandirian','komunikasi'];
  function reference(id) { return library.filter(function(x){return x.id===id;})[0] || null; }
  function citation(id) { var r=reference(id); if(!r) return ''; return r.reference+'\n'+r.arabic+'\nTerjemahan ('+r.language+'): '+r.translation+'\nSumber: '+r.source+'\nCatatan konteks: '+r.scope; }
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
  function tokens(s) { var stop=['murid','mampu','siswa','dengan','untuk','dalam','yang','dan','atau','pada','dari','secara','melalui','guru','kegiatan','hasil','konsep']; return String(s||'').toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(function(t){return stop.indexOf(t)<0;})||[]; }
  function evidence(a,b) { var x=tokens(a), y=tokens(b); return Array.from(new Set(x.filter(function(t){return y.indexOf(t)>=0;}))); }
  function alignment(data) {
    var issues=[], rows=[], cp=String(data.cp||'').trim(), tujuan=String(data.tujuan||'').trim();
    if(!cp) issues.push('CP belum diisi dari dokumen kurikulum yang digunakan.');
    if(!data.cpSource) issues.push('Sumber/versi CP belum diisi.');
    if(!tujuan) issues.push('Tujuan pembelajaran belum diisi.');
    if(cp&&tujuan&&!evidence(cp,tujuan).length) issues.push('Hubungan CP → tujuan belum terdeteksi dari istilah yang sama; tinjau manual.');
    var count=Number(data.pertemuan)||1;
    for(var j=1;j<=count;j++) if(!data['memahami'+j]||!data['mengaplikasi'+j]||!data['merefleksi'+j]) issues.push('Kegiatan pertemuan '+j+' belum lengkap.');
    for(var i=1;i<=14;i++) {
      var itp=data['itp'+i], activity=data['aktivitas'+i], assess=data['asesmen'+i];
      if(!itp&&!activity&&!assess) continue;
      var notes=[], linked=[];
      if(!itp) notes.push('ITP kosong'); if(!activity) notes.push('Aktivitas kosong'); if(!assess) notes.push('Asesmen kosong');
      var tpEvidence=evidence(tujuan,itp), actEvidence=evidence(itp,activity), assEvidence=evidence(itp,assess);
      if(itp&&!tpEvidence.length) notes.push('Tujuan → ITP perlu ditinjau');
      if(itp&&activity&&!actEvidence.length) notes.push('ITP → aktivitas perlu ditinjau');
      if(itp&&assess&&!assEvidence.length) notes.push('ITP → asesmen perlu ditinjau');
      for(var p=1;p<=count;p++) if(evidence(itp,[data['memahami'+p],data['mengaplikasi'+p],data['merefleksi'+p]].join(' ')).length) linked.push(p);
      if(!linked.length) notes.push('Belum terhubung ke kegiatan pertemuan');
      rows.push({itp:i,tujuan:tpEvidence,aktivitas:actEvidence,asesmen:assEvidence,pertemuan:linked,notes:notes});
    }
    if(!rows.length) issues.push('Belum ada ITP, aktivitas, dan asesmen yang dapat diperiksa.');
    return {issues:issues,rows:rows,method:'Pemeriksaan kelengkapan dan kesamaan istilah; bukan penilaian semantik atau pengesahan kurikulum.'};
  }
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
    var fixed=['Nama','Topik','Kelas','Waktu','Tujuan','Model','Strategi','Metode','Kemitraan','Lingkungan','Digital','ListAsesmen','Dapus','Lampiran','Keimanan','Penalaran','Kolaborasi','Kesehatan','Kewargaan','Kreativitas','Kemandirian','Komunikasi','CP','SumberCP'];
    var found=placeholders(text), unknown=found.filter(function(p){var k=p.slice(2,-2);return fixed.indexOf(k)<0&&!/^(ITP|Asesmen|Aktivitas)([1-9]|1[0-4])$/.test(k)&&!/^(SubTopik|Ayat|Zona|Awal|Memahami|Mengaplikasi|Merefleksi|Penutup)[1-9]$/.test(k);});
    var missing=['Topik','Kelas','Tujuan'].filter(function(k){return found.indexOf('{{'+k+'}}')<0;});
    return {unknown:unknown,missing:missing,valid:!unknown.length&&!missing.length};
  }
  return {library:library,reference:reference,citation:citation,validateAI:validateAI,canonical:canonical,alignment:alignment,validateFile:validateFile,validateManifest:validateManifest,placeholders:placeholders,templateCheck:templateCheck};
})();
if(typeof module!=='undefined') module.exports=GeneratorCore;
