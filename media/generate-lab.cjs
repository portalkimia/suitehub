const fs=require('fs'),path=require('path'),vm=require('vm');
const topics=require('./lab-data.cjs');
const project=process.argv[2];if(!project)throw Error('Pass project path');
const out=path.join(__dirname,'lab-ready');fs.mkdirSync(out,{recursive:true});
const media=path.join(out,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru');fs.mkdirSync(media,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const runtime=fs.readFileSync(path.join(__dirname,'lab-runtime.js'),'utf8');
const logo=fs.readFileSync(path.join(project,'Stitch','Logo Portal Kimia','code.html'),'utf8').replace('<svg ','<svg width="42" height="42" aria-label="Logo PortalKimia" role="img" ');
const client=fs.readFileSync(path.join(project,'submission-client.js'),'utf8');
for(const t of topics){
 const key='chemportal_lab_'+t.id,config={id:t.id,title:t.title,draftKeys:[key,key+'_lab']};
 const questions=JSON.stringify(t.quiz,null,2);
 const controls=t.controls.map(([id,label,min,max,value,step])=>`<label for="${id}">${esc(label)}: <b data-value="${id}">${value}</b><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('');
 const answers=t.lks.map((x,i)=>`<label for="lkpd-${i+1}">${i+1}. ${esc(x)}<textarea data-answer id="lkpd-${i+1}" rows="4" placeholder="Tulis penalaran, data dan langkah perhitungan..."></textarea></label>`).join('');
 const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="pk-native-media" content="lab-v1"><title>${esc(t.title)} • PortalKimia</title>
<style>:root{color-scheme:dark;font:16px/1.7 Geist,system-ui,sans-serif;color:#fafafa;background:#09090b}*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1080px;margin:auto;padding:20px}header{display:flex;align-items:center;gap:12px}header small{display:block;color:#a1a1aa}nav{display:flex;gap:18px;flex-wrap:wrap}a{color:#c4b5fd}h1{font-size:clamp(25px,5vw,40px);line-height:1.2}h2{font-size:24px}h3{color:#c4b5fd}section{scroll-margin-top:20px;margin:24px 0;padding:24px;border:1px solid #27272a;border-radius:12px;background:#121215}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:20px}label{display:block;margin:14px 0}input,select,textarea{width:100%;padding:12px;margin-top:6px;background:#18181b;color:#fafafa;border:1px solid #52525b;border-radius:8px;font:inherit}input[type=range]{accent-color:#a78bfa;padding:0}button{font:inherit;padding:12px 18px;border:1px solid #a78bfa;border-radius:8px;background:#a78bfa;color:#09090b;cursor:pointer}button:disabled{opacity:.6;cursor:default}:focus-visible{outline:2px solid #a78bfa;outline-offset:3px}textarea{resize:vertical}p{overflow-wrap:anywhere}.hint,small{color:#a1a1aa}.big{font-size:36px;color:#34d399;text-align:center}.track{height:12px;background:#27272a;border-radius:10px;margin:6px 0 16px}.track i{display:block;height:100%;background:#a78bfa;border-radius:10px;transition:width .2s}svg{max-width:100%}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #52525b;text-align:left}#result{padding:16px;background:#18181b;border-radius:8px}footer{text-align:center}summary{cursor:pointer;color:#c4b5fd}@media(max-width:550px){section{padding:16px}main{padding:12px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}</style></head><body>
<header>${logo}<div><b>PortalKimia</b><small>Umum • Laboratorium Virtual • Paket Media Baru</small></div></header><main><p lang="ar" dir="rtl" style="text-align:center;font-size:24px">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p><h1>${esc(t.title)}</h1><p>${esc(t.intro)}</p><nav><a href="#tujuan">Tujuan</a><a href="#materi">Materi</a><a href="#simulasi">Simulasi</a><a href="#lkpd">LKPD</a><a href="#section-kuis">Evaluasi</a><a href="#pengumpulan">Pengumpulan</a></nav>
<section id="tujuan"><h2>Tujuan pembelajaran</h2><ul>${t.goals.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul><p class="hint">Alur belajar: pahami konsep → buat prediksi → ubah satu kondisi → catat bukti → jelaskan hasil. Terapkan kejujuran dalam mencatat data dan tanggung jawab dalam penggunaan ilmu.</p></section>
<section id="materi"><h2>Materi inti</h2><div class="grid">${t.lessons.map(([title,text])=>'<article><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></article>').join('')}</div></section>
<section id="simulasi"><h2>Meja praktikum virtual</h2><p>${esc(t.task)}</p><fieldset><legend>Persiapan percobaan</legend>${t.steps.map((s,i)=>'<label><input class="lab-step" id="lab-step-'+i+'" type="checkbox" style="width:auto"> '+esc(s)+'</label>').join('')}</fieldset><div class="grid"><div><div id="controls">${controls}</div><button type="button" id="lab-run">Jalankan percobaan</button><div id="lab-dose" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div><p id="lab-credit" role="status"></p></div><div><div id="visual"></div><p id="result" role="status" aria-live="polite"></p></div></div><button type="button" id="record">Salin pengamatan ini ke catatan LKPD</button><div id="lab-history" style="overflow-x:auto;max-height:420px;margin-top:16px"></div><p class="hint">Setiap percobaan masuk jurnal otomatis. Bandingkan sedikitnya dua kondisi sebelum menyimpulkan. Evaluasi dan pengiriman memakai tugas serta kode pribadi dari guru.</p></section>
<section id="lkpd"><h2>Laporan praktikum</h2><details><summary>Jurnal otomatis yang ikut dikirim</summary><textarea data-answer id="lks-journal" aria-label="Jurnal praktikum otomatis" readonly rows="8"></textarea></details><label for="lks-observasi">Catatan pengamatan dan perbandingan<textarea data-answer id="lks-observasi" rows="6" placeholder="Salin pengamatan lalu tambahkan perbandingan dan penjelasanmu..."></textarea></label>${answers}<label for="reflection">Refleksi: konsep yang berubah dalam pemahamanmu, bagian yang belum dikuasai, dan rencana belajar berikutnya.<textarea data-answer id="reflection" rows="3"></textarea></label><p id="draft-status" role="status" class="hint">Draf dan jurnal disimpan pada perangkat ini.</p></section>
<section id="section-kuis"><h2>Evaluasi pemahaman</h2><p>Siapkan jawaban sebelum memilih; pilihan evaluasi dikunci satu kali. Pembahasan tidak ditampilkan selama pengerjaan.</p><div id="pk-evaluation"></div></section>
<section id="pengumpulan"><h2>Pengumpulan final</h2><p>Nama dan kelas berasal dari daftar siswa setelah kode tugas diperiksa. Jawaban, catatan simulasi, dan refleksi dikirim bersama untuk pemeriksaan guru dan AI.</p><div class="grid"><label>Nama<input id="student-name" readonly></label><label>Kelas<input id="student-class" readonly></label><label>NIS/Absen<input id="student-nis" readonly></label><label>Tanggal<input id="student-date" readonly></label></div><button type="button" onclick="submitToTeacherDatabase()">Kirim jawaban final</button><p class="hint">Draf dihapus setelah server mengonfirmasi penyimpanan. Analisis AI adalah rekomendasi untuk ditinjau guru.</p></section></main><footer>Alhamdulillah • PortalKimia • Belajar dari konsep, bukti, dan penalaran.</footer>
<script>
const TOPIC=${JSON.stringify({sim:t.sim,selects:t.selects})};
const STORAGE_KEY=${JSON.stringify(key)};
const quizQuestions = ${questions};
let userAnswers=quizQuestions.map(()=>null);
function submitToTeacherDatabase() {
  if(labState.entries.length<2){document.getElementById('draft-status').textContent='Jalankan dan bandingkan sedikitnya dua percobaan sebelum mengirim laporan.';document.getElementById('simulasi').scrollIntoView();return;}
  const incomplete=[...document.querySelectorAll('[data-answer]')].some(e=>!e.value.trim());
  if(incomplete){document.getElementById('draft-status').textContent='Lengkapi catatan pengamatan, ketiga jawaban LKPD, dan refleksi sebelum mengirim.';document.getElementById('lkpd').scrollIntoView();return;}
  return PortalSubmission.submit(${JSON.stringify(config)},userAnswers,quizQuestions);
}
${runtime}
</script>
<!-- PK-SUBMISSION-V2-START -->
<script>
${client}
PortalSubmission.install(${JSON.stringify(config)}, {questions:quizQuestions,setAnswers:value=>{userAnswers=value;}});
</script>
<!-- PK-SUBMISSION-V2-END -->
</body></html>`;
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 fs.writeFileSync(path.join(media,t.file+'_Umum.html'),html);
}
let backend=fs.readFileSync(path.join(project,'submission-backend.js'),'utf8');
backend=backend.split('\n').filter(line=>!topics.some(t=>line.trimStart().startsWith(JSON.stringify(t.id)+':'))).join('\n');
const registrations=topics.map(t=>'  '+JSON.stringify(t.id)+': '+JSON.stringify('Tugas_'+t.id.replaceAll('-','_'))+',').join('\n');
const rubrics=topics.map(t=>'  '+JSON.stringify(t.id)+': '+JSON.stringify(t.rubric+' Batas simulasi: '+t.limits+' Pertanyaan LKPD: '+t.lks.map((q,i)=>'lkpd-'+(i+1)+': '+q).join(' | ')+' lks-journal berisi riwayat otomatis kondisi dan hasil, bukan jawaban penalaran siswa. Bandingkan penjelasan siswa dengan jurnal; jangan memberi nilai penalaran hanya karena jurnal terisi. lks-observasi berisi perbandingan; refleksi dinilai dari pemahaman dan rencana belajar, bukan keyakinan pribadi.')+',').join('\n');
backend=backend.replace('const PK_MEDIA = {','const PK_MEDIA = {\n'+registrations).replace('const PK_AI_RUBRICS = {','const PK_AI_RUBRICS = {\n'+rubrics);
fs.writeFileSync(path.join(out,'submission-backend.js'),backend);
let gas=fs.readFileSync(path.join(project,'Code.gs'),'utf8');
if(!gas.includes('// PK-BACKEND-V2-START'))throw Error('Backend marker missing');
gas=gas.replace(/\/\/ PK-BACKEND-V2-START[\s\S]*?\/\/ PK-BACKEND-V2-END/,'// PK-BACKEND-V2-START\n'+backend+'\n// PK-BACKEND-V2-END');new vm.Script(gas);fs.writeFileSync(path.join(out,'Code.gs'),gas);
let build=fs.readFileSync(path.join(project,'build-submissions.cjs'),'utf8');
// New standalone media already supply native evaluation and data adapters.
const anchor='    // Existing extra closing brace prevented Bohr/Kuantum scripts from running at all.';
const branch=`    if(s.includes('name="pk-native-media"') || /Hukum_Faraday/.test(file)) {
      const match=s.match(/PortalSubmission\\.install\\((\\{[^\\n]+?\\}), \\{questions/);
      if(!match)throw Error('Missing native media config: '+file);
      const nativeConfig=JSON.parse(match[1]);
      const nativeBlock='\\n<!-- PK-SUBMISSION-V2-START -->\\n<script>\\n'+client+'\\nPortalSubmission.install('+JSON.stringify(nativeConfig)+', {questions:quizQuestions,setAnswers:value=>{userAnswers=value;}});\\n</script>\\n<!-- PK-SUBMISSION-V2-END -->';
      s=s.replace(/<!-- PK-SUBMISSION-V2-START -->[\\s\\S]*?<!-- PK-SUBMISSION-V2-END -->/,()=>nativeBlock);
      for(const m of s.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi))new vm.Script(m[1]);
      write(full,s);continue;
    }
`;
if(!build.includes(anchor))throw Error('Build anchor missing');if(!build.includes('Missing native media config:'))build=build.replace(anchor,branch+anchor);new vm.Script(build);fs.writeFileSync(path.join(out,'build-submissions.cjs'),build);
fs.copyFileSync(__filename,path.join(out,'generate-lab.cjs'));fs.copyFileSync(path.join(__dirname,'lab-data.cjs'),path.join(out,'lab-data.cjs'));fs.copyFileSync(path.join(__dirname,'lab-runtime.js'),path.join(out,'lab-runtime.js'));
fs.writeFileSync(path.join(media,'PANDUAN_LABORATORIUM_UMUM.md'),'# Paket laboratorium virtual kategori Umum\n\n'+topics.map((t,i)=>`${i+1}. ${t.title} — ID media: ${t.id}`).join('\n')+'\n\nSetiap media memiliki materi, simulasi khusus, catatan pengamatan, 3 LKPD, refleksi, dan 5 soal evaluasi.\n\nAktivasi daring: unggah HTML ke folder Drive; sinkronkan folder Paket_Media_Baru secara langsung karena pemindai GAS saat ini tidak rekursif. Perbarui Code.gs pada Apps Script dan deploy versi baru. Pertahankan GEMINI_API_KEY serta GEMINI_MODELS yang sudah berjalan. Buat tugas untuk kelas melalui Ruang Guru. AI membaca rubrik dan konteks soal dari backend, tidak menerima identitas siswa melalui payload analisis yang disanitasi. Nilai AI perlu ditinjau guru.\n\nPengujian lokal tidak memanggil Gemini dan tidak menulis ke spreadsheet produksi. Tampilan browser dan pengiriman langsung ke deployment GAS/Gemini belum diuji.\n\nSeluruh berkas memakai akhiran _Umum.html sehingga pemindai GAS mengategorikan sebagai Semua Kelas (Umum). Tidak terikat kelas 10, 11, atau 12. Percobaan dapat diulang untuk belajar; evaluasi dan pengumpulan tetap dikunci. Jurnal menyimpan sampai 100 percobaan dan ikut diperiksa AI; sampel misterius memiliki anggaran 8 kredit.\n\nReferensi tambahan:\n- https://www.acs.org/education/policies/middle-and-high-school-chemistry/safety.html\n- https://openstax.org/books/chemistry-2e/pages/4-5-quantitative-chemical-analysis\n- https://openstax.org/books/chemistry-2e/pages/5-2-calorimetry\n\nReferensi konsep:\n- https://openstax.org/books/chemistry-2e/pages/18-1-periodicity\n- https://openstax.org/books/chemistry-2e/pages/19-2-coordination-chemistry-of-transition-metals\n- https://openstax.org/books/chemistry-2e/pages/20-3-aldehydes-ketones-carboxylic-acids-and-esters\n');
console.log('Generated '+topics.length+' media in '+media);








