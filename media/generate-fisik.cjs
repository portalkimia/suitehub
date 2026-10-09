const fs=require('fs'),path=require('path'),vm=require('vm');
const topics=require('./fisik-data.cjs');
const project=process.argv[2];if(!project)throw Error('Pass project path');
const out=path.join(__dirname,'fisik-ready');fs.mkdirSync(out,{recursive:true});
const media=path.join(out,'Media_Pembelajaran_Kimia_Drive','Paket_Media_Baru');fs.mkdirSync(media,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const runtime=fs.readFileSync(path.join(__dirname,'fisik-runtime.js'),'utf8');
const logo=fs.readFileSync(path.join(project,'Stitch','Logo Portal Kimia','code.html'),'utf8').replace('<svg ','<svg width="42" height="42" aria-label="Logo PortalKimia" role="img" ');
const client=fs.readFileSync(path.join(project,'submission-client.js'),'utf8');
for(const t of topics){
 const key='chemportal_fisik_'+t.id,config={id:t.id,title:t.title,draftKeys:[key]};
 const questions=JSON.stringify(t.quiz,null,2);
 const controls=t.controls.map(([id,label,min,max,value,step])=>`<label for="${id}">${esc(label)}: <b data-value="${id}">${value}</b><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('');
 const answers=t.lks.map((x,i)=>`<label for="lkpd-${i+1}">${i+1}. ${esc(x)}<textarea data-answer id="lkpd-${i+1}" rows="4" placeholder="Tulis penalaran, data dan langkah perhitungan..."></textarea></label>`).join('');
 const html=`<!DOCTYPE html><html class="dark scroll-smooth" lang="id"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<meta name="pk-native-media" content="${t.id}-v1">
<title>${esc(t.title)} â€¢ PortalKimia</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&amp;family=Amiri:ital,wght@0,400;0,700;1,400&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<style>
    @layer base {
      html, body { margin: 0; padding: 0; }
      body { overscroll-behavior: auto; }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #09090b; }
    ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
    .light ::-webkit-scrollbar-thumb { background: #d4d4d8; }
    .font-arabic { font-family: 'Amiri', serif; }
    
    /* Control overrides */
    #controls label { display: block; font-weight: 500; margin-bottom: 12px; font-size: 12px; color: #a1a1aa; }
    #controls label b { color: #fafafa; margin-left: 4px; font-family: monospace; }
    .light #controls label b { color: #18181b; }
    #controls input[type=range] { width: 100%; margin-top: 6px; accent-color: #a78bfa; }
</style>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "surface-bright": "#18181b",
            "inverse-on-surface": "#09090b",
            "on-error": "#1a0000",
            "on-background": "#fafafa",
            "secondary-container": "#27272a",
            "surface-container": "#121215",
            "on-error-container": "#fca5a5",
            "primary": "#a78bfa",
            "primary-fixed-dim": "#c4b5fd",
            "outline": "#52525b",
            "on-secondary-container": "#a1a1aa",
            "on-primary-container": "#ede9fe",
            "on-surface-variant": "#a1a1aa",
            "inverse-primary": "#5b21b6",
            "secondary-fixed": "#a1a1aa",
            "secondary-fixed-dim": "#71717a",
            "tertiary-fixed-dim": "#6ee7b7",
            "tertiary": "#34d399",
            "on-surface": "#fafafa",
            "primary-container": "#7c3aed",
            "on-secondary-fixed-variant": "#3f3f46",
            "primary-fixed": "#ede9fe",
            "on-tertiary-container": "#bbf7d0",
            "on-secondary-fixed": "#18181b",
            "on-primary": "#0a0012",
            "on-primary-fixed-variant": "#5b21b6",
            "surface-container-highest": "#1e1e22",
            "background": "#09090b",
            "on-tertiary": "#001a12",
            "tertiary-container": "#065f46",
            "inverse-surface": "#fafafa",
            "surface-container-low": "#0f0f12",
            "surface-tint": "#a78bfa",
            "secondary": "#71717a",
            "surface-variant": "#18181b",
            "surface-container-high": "#18181b",
            "surface": "#0c0c0f",
            "tertiary-fixed": "#bbf7d0",
            "error-container": "#3b1111",
            "on-secondary": "#09090b",
            "on-tertiary-fixed-variant": "#047857",
            "error": "#ef4444",
            "on-primary-fixed": "#2e1065",
            "on-tertiary-fixed": "#003318",
            "surface-container-lowest": "#09090b",
            "outline-variant": "#27272a",
            "surface-dim": "#0c0c0f"
          },
          fontFamily: {
            headline: ["Geist"],
            display: ["Geist"],
            body: ["Geist"],
            label: ["Geist"]
          }
        }
      }
    };
</script>
<script>
(function() {
  try {
    const saved = localStorage.getItem('chemportal_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
function toggleAppTheme() {
  const html = document.documentElement;
  if(html.classList.contains('dark')) {
    html.classList.remove('dark');
    html.classList.add('light');
    localStorage.setItem('chemportal_theme', 'light');
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
    localStorage.setItem('chemportal_theme', 'dark');
  }
}
</script>
</head>
<body class="bg-background font-body text-on-surface antialiased min-h-screen py-8 px-4 sm:px-6 transition-colors duration-200">

<!-- STICKY HEADER -->
<header class="fixed top-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-md border-b border-outline-variant/60 shadow-sm transition-colors">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center text-primary">${logo}</div>
      <div class="font-headline font-bold text-sm text-on-surface tracking-tight hidden sm:block">PortalKimia</div>
    </div>
    
    <!-- Quick Nav -->
    <nav class="hidden md:flex items-center gap-1 text-xs font-medium">
      <a href="#tujuan" class="px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Tujuan</a>
      <a href="#materi" class="px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Materi</a>
      <a href="#simulasi" class="px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-primary font-bold">Simulator</a>
      <a href="#lks" class="px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">LKPD</a>
      <a href="#kuis" class="px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Evaluasi</a>
    </nav>

    <!-- Theme Switcher -->
    <button onclick="toggleAppTheme()" class="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
      <span class="material-symbols-outlined text-[18px]">light_mode</span>
    </button>
  </div>
</header>

<main class="w-full max-w-4xl mx-auto space-y-6 pt-10">

<!-- BAGIAN 1: PEMBUKA & IDENTITAS MATERI -->
<header class="bg-surface-container rounded-2xl border border-outline-variant/60 p-5 sm:p-6 shadow-xl relative overflow-hidden">
<div class="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
<div class="absolute -bottom-20 -left-20 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>

<div class="text-center pb-5 border-b border-outline-variant/40 relative z-10">
  <div class="inline-block p-1 px-4 mb-2 rounded-full bg-surface-container-high/80 border border-primary/20 backdrop-blur-sm">
    <p class="font-arabic text-2xl sm:text-3xl text-primary font-normal tracking-wide text-center leading-relaxed">
      Ø¨Ù Ø³Ù’Ù…Ù  Ø§Ù„Ù„Ù‘Ù°Ù‡Ù  Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…Ù°Ù†Ù  Ø§Ù„Ø±ÙŽÙ‘Ø­Ù ÙŠÙ’Ù…Ù 
    </p>
  </div>
  <p class="text-[11px] font-mono text-on-surface-variant italic">"Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"</p>
</div>

<div class="pt-5 flex flex-col gap-4 relative z-10">
  <div class="flex flex-wrap items-center justify-between gap-2.5">
    <div class="flex items-center gap-2">
      <span class="p-1.5 rounded-lg bg-primary/15 text-primary">
        <span class="material-symbols-outlined text-lg leading-none">auto_stories</span>
      </span>
      <span class="text-xs font-semibold tracking-wider uppercase text-primary">PortalKimia Digital â€” Media Modul</span>
    </div>
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-tertiary/30 text-tertiary text-[11px] font-mono font-medium">
      Kurikulum Merdeka
    </span>
  </div>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">${esc(t.title)}</h1>
    <p class="text-xs sm:text-sm text-on-surface-variant mt-1">${esc(t.intro)}</p>
  </div>
</div>
</header>

<!-- BAGIAN 2: TUJUAN PEMBELAJARAN -->
<section id="tujuan" class="bg-surface-container rounded-2xl border border-outline-variant/60 p-5 sm:p-6 shadow-xl space-y-4">
  <div class="flex items-center gap-2">
    <span class="p-1.5 rounded-lg bg-primary/15 text-primary">
      <span class="material-symbols-outlined text-lg leading-none">task_alt</span>
    </span>
    <h2 class="text-sm uppercase tracking-wider font-semibold text-on-surface">Tujuan Pembelajaran</h2>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    ${t.goals.map((g, i) => `
    <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant/40 flex gap-3 items-start">
      <span class="w-6 h-6 shrink-0 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold flex items-center justify-center">${i+1}</span>
      <p class="text-xs text-on-surface-variant leading-relaxed">${esc(g)}</p>
    </div>
    `).join('')}
  </div>
</section>

<!-- BAGIAN 3: MATERI INTI -->
<section id="materi" class="bg-surface-container rounded-2xl border border-outline-variant/60 p-5 sm:p-6 shadow-xl space-y-4">
  <div class="flex items-center gap-2">
    <span class="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
      <span class="material-symbols-outlined text-lg leading-none">menu_book</span>
    </span>
    <h2 class="text-sm uppercase tracking-wider font-semibold text-on-surface">Materi Konseptual</h2>
  </div>
  <div class="grid grid-cols-1 gap-4">
    ${t.lessons.map(([title, text]) => `
    <div class="bg-surface-container-high rounded-xl p-4 border border-outline-variant/50 space-y-2">
      <h3 class="text-xs font-semibold text-on-surface flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>${esc(title)}
      </h3>
      <p class="text-[11px] text-on-surface-variant leading-relaxed">${esc(text)}</p>
    </div>
    `).join('')}
  </div>
</section>

<!-- BAGIAN 4: SIMULATOR -->
<section id="simulasi" class="bg-surface-container rounded-2xl border border-tertiary/25 p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tertiary/20 via-tertiary to-primary/40"></div>
  
  <div class="flex items-center gap-2 mb-2">
    <span class="p-1.5 rounded-lg bg-tertiary/15 text-tertiary">
      <span class="material-symbols-outlined text-lg leading-none">science</span>
    </span>
    <div>
      <h2 class="text-sm uppercase tracking-wider font-semibold text-tertiary">Laboratorium Virtual</h2>
      <p class="text-[11px] text-on-surface-variant">Eksplorasi Interaktif</p>
    </div>
  </div>
  
  <p class="text-xs text-on-surface-variant mb-4">${esc(t.task)}</p>
  
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-4 p-4 rounded-xl bg-surface-container-high border border-outline-variant/50 flex flex-col gap-4">
      <div class="text-[10px] font-mono uppercase text-tertiary font-bold tracking-wider mb-1">Panel Kontrol</div>
      <div id="controls" class="space-y-4">${controls}</div>
      <button type="button" id="record" class="mt-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
        <span class="material-symbols-outlined text-sm">edit_note</span> Catat Data ke LKPD
      </button>
    </div>
    <div class="lg:col-span-8 flex flex-col gap-4">
      <div class="relative w-full h-64 sm:h-72 rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col items-center justify-center p-3 border border-outline-variant/50">
        <div id="visual" class="w-full h-full flex items-center justify-center"></div>
      </div>
      <p id="result" role="status" aria-live="polite" class="p-3 rounded-lg bg-surface-container-high border border-outline-variant/40 font-mono text-[11px] text-on-surface text-center"></p>
    </div>
  </div>
</section>

<!-- BAGIAN 5: LKPD -->
<section id="lks" class="bg-surface-container rounded-2xl border border-outline-variant/60 p-5 sm:p-6 shadow-xl space-y-4">
  <div class="flex items-center gap-2">
    <span class="p-1.5 rounded-lg bg-primary/15 text-primary">
      <span class="material-symbols-outlined text-lg leading-none">assignment</span>
    </span>
    <h2 class="text-sm uppercase tracking-wider font-semibold text-on-surface">Lembar Kerja Peserta Didik (LKPD)</h2>
  </div>
  
  <div class="space-y-4">
    <div class="bg-surface-container-high rounded-xl p-4 border border-outline-variant/50">
      <label for="lks-observasi" class="block text-xs font-semibold text-on-surface mb-2">Data Observasi Simulator</label>
      <textarea data-answer id="lks-observasi" rows="4" class="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono" placeholder="Gunakan tombol 'Catat Data' pada Simulator..."></textarea>
    </div>
    
    ${t.lks.map((x, i) => `
    <div class="bg-surface-container-high rounded-xl p-4 border border-outline-variant/50">
      <label for="lkpd-${i+1}" class="block text-xs font-semibold text-on-surface mb-2">${i+1}. ${esc(x)}</label>
      <textarea data-answer id="lkpd-${i+1}" rows="3" class="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body"></textarea>
    </div>
    `).join('')}
    
    <div class="bg-surface-container-high rounded-xl p-4 border border-outline-variant/50">
      <label for="reflection" class="block text-xs font-semibold text-on-surface mb-2">Refleksi Pemahaman</label>
      <textarea data-answer id="reflection" rows="2" class="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body"></textarea>
    </div>
  </div>
</section>

<!-- BAGIAN 6: EVALUASI KUIS -->
<section id="kuis" class="bg-surface-container rounded-2xl border border-tertiary/25 p-5 sm:p-6 shadow-xl space-y-4">
  <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
    <div class="flex items-center gap-2">
      <span class="p-1.5 rounded-lg bg-tertiary/15 text-tertiary">
        <span class="material-symbols-outlined text-lg leading-none">quiz</span>
      </span>
      <div>
        <h2 class="text-sm uppercase tracking-wider font-semibold text-on-surface">Uji Evaluasi Pemahaman</h2>
        <p class="text-[11px] text-on-surface-variant">Pilihan Ganda</p>
      </div>
    </div>
  </div>
  <div id="pk-evaluation" class="w-full"></div>
</section>

<!-- BAGIAN 7: PENGIRIMAN -->
<section id="pengumpulan" class="bg-surface-container rounded-2xl border border-primary/30 p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
  <div class="flex items-center gap-2 mb-2">
    <span class="p-1.5 rounded-lg bg-primary/15 text-primary">
      <span class="material-symbols-outlined text-lg leading-none">send</span>
    </span>
    <div>
      <h2 class="text-sm uppercase tracking-wider font-semibold text-primary">Pengumpulan &amp; Analisis Guru</h2>
      <p class="text-[11px] text-on-surface-variant">Data Otomatis dari Portal Sekolah</p>
    </div>
  </div>
  
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    <div><label class="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Nama</label><input id="student-name" readonly class="w-full px-2 py-1.5 text-xs rounded-lg bg-surface-container-high border border-outline-variant/50 text-on-surface font-mono"></div>
    <div><label class="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Kelas</label><input id="student-class" readonly class="w-full px-2 py-1.5 text-xs rounded-lg bg-surface-container-high border border-outline-variant/50 text-on-surface font-mono"></div>
    <div><label class="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">NIS</label><input id="student-nis" readonly class="w-full px-2 py-1.5 text-xs rounded-lg bg-surface-container-high border border-outline-variant/50 text-on-surface font-mono"></div>
    <div><label class="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Tanggal</label><input id="student-date" readonly class="w-full px-2 py-1.5 text-xs rounded-lg bg-surface-container-high border border-outline-variant/50 text-on-surface font-mono"></div>
  </div>
  
  <p id="draft-status" role="status" class="text-[10px] font-mono text-primary mb-4 flex items-center gap-1.5">
    <span class="material-symbols-outlined text-[14px]">save</span> Draf teks disimpan otomatis di perangkat.
  </p>
  
  <div class="flex justify-center">
    <button type="button" onclick="submitToTeacherDatabase()" class="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
      <span class="material-symbols-outlined text-[18px]">rocket_launch</span> Kirim Jawaban Final
    </button>
  </div>
</section>

</main>

<footer class="mt-10 bg-surface-container-lowest border-t border-outline-variant py-6 px-4 text-center text-[10px] text-on-surface-variant font-mono">
  <p>Alhamdulillah â€¢ PortalKimia Digital â€¢ Media Interaktif Pembelajaran</p>
</footer>

<script>
  const TOPIC=${JSON.stringify({sim:t.sim})};
  const STORAGE_KEY=${JSON.stringify(key)};
  const quizQuestions = ${questions};
  let userAnswers=quizQuestions.map(()=>null);
  function submitToTeacherDatabase() {
    const incomplete=[...document.querySelectorAll('[data-answer]')].some(e=>!e.value.trim());
    if(incomplete){
      document.getElementById('draft-status').innerHTML='<span class="text-error font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">error</span>Lengkapi catatan pengamatan, jawaban LKPD, dan refleksi sebelum mengirim.</span>';
      return;
    }
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
 fs.writeFileSync(path.join(media,t.file+'_11_Fase_F.html'),html);
}
let backend=fs.readFileSync(path.join(project,'submission-backend.js'),'utf8');
backend=backend.split('\n').filter(line=>!topics.some(t=>line.trimStart().startsWith(JSON.stringify(t.id)+':'))).join('\n');
const registrations=topics.map(t=>'  '+JSON.stringify(t.id)+': '+JSON.stringify('Tugas_'+t.id.replaceAll('-','_'))+',').join('\n');
const rubrics=topics.map(t=>'  '+JSON.stringify(t.id)+': '+JSON.stringify(t.rubric+' Pertanyaan LKPD: '+t.lks.map((q,i)=>'lkpd-'+(i+1)+': '+q).join(' | ')+' lks-observasi berisi kondisi dan hasil simulasi; refleksi dinilai dari pemahaman dan rencana belajar, bukan keyakinan pribadi.')+',').join('\n');
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
fs.copyFileSync(__filename,path.join(out,'generate-fisik.cjs'));fs.copyFileSync(path.join(__dirname,'fisik-data.cjs'),path.join(out,'fisik-data.cjs'));fs.copyFileSync(path.join(__dirname,'fisik-runtime.js'),path.join(out,'fisik-runtime.js'));
fs.writeFileSync(path.join(media,'PANDUAN_PAKET_FISIK_ASAMBASA.md'),'# Paket termokimia, kinetika, kesetimbangan dan asam-basa\n\n'+topics.map((t,i)=>`${i+1}. ${t.title} — ID media: ${t.id}`).join('\n')+'\n\nSetiap media memiliki materi, simulasi khusus, catatan pengamatan, 3 LKPD, refleksi, dan 5 soal evaluasi.\n\nAktivasi daring: unggah HTML ke folder Drive; sinkronkan folder Paket_Media_Baru secara langsung karena pemindai GAS saat ini tidak rekursif. Perbarui Code.gs pada Apps Script dan deploy versi baru. Pertahankan GEMINI_API_KEY serta GEMINI_MODELS yang sudah berjalan. Buat tugas untuk kelas melalui Ruang Guru. AI membaca rubrik dan konteks soal dari backend, tidak menerima identitas siswa melalui payload analisis yang disanitasi. Nilai AI perlu ditinjau guru.\n\nPengujian lokal tidak memanggil Gemini dan tidak menulis ke spreadsheet produksi.\n');
console.log('Generated '+topics.length+' media in '+media);

