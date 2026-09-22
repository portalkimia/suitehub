/* PortalKimia submission client v2. Embedded by build-submissions.cjs so Drive HTML stays standalone. */
window.PortalSubmission = (() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwobr0k-44HFrf3B5YUroeEK-_U13AGVe2urQYDAmL0U43arTQHTvKjUEeM6CuZQvOE/exec';
  const PREFIX = 'portalkimia_pending_v2_';
  let busy = false;
  let active = null, configNow = null, adapters = null, finalized = false;
  let quizState = [], questionsNow = [];
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const value = id => (document.getElementById(id)?.value || '').trim();
  const plain = text => {
    const el = document.createElement('div');
    el.innerHTML = String(text || '');
    return el.textContent.trim();
  };
  function uuid() {
    if (!window.crypto?.getRandomValues) throw new Error('Peramban tidak mendukung ID pengiriman aman. Gunakan Chrome/Edge terbaru.');
    return Array.from(crypto.getRandomValues(new Uint8Array(24)), x => x.toString(16).padStart(2, '0')).join('');
  }
  function collect(config, answers, questions) {
    const siswa = { nama: value('student-name'), kelas: value('student-class'), nis: value('student-nis'), tanggal: value('student-date') };
    if (!siswa.nama || !siswa.kelas) throw new Error('Isi nama dan kelas sebelum mengirim.');
    const jawaban = { kuis: [], esai: {}, lks: {}, refleksi: {}, isianLain: {} };
    let correct = 0;
    questions.forEach((q, i) => {
      const selected = answers[i] ?? null;
      const key = q.answer ?? q.correct ?? q.ans;
      const options = q.options || q.opts || [];
      const benar = selected !== null && selected === key;
      if (benar) correct++;
      jawaban.kuis.push({ nomor: i + 1, pertanyaan: plain(q.question || q.q), pilihan: selected, jawaban: selected === null ? '' : plain(options[selected]), benar });
    });
    // Canonical IDs collapse synchronized mobile/desktop copies without losing blank/zero values.
    document.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
      if (/^(password|file|hidden|button|submit|reset)$/i.test(el.type || '') || /^(student-(name|class|nis|date)$|pk-)/.test(el.id)) return;
      const id = el.id.replace(/^mob-/, '');
      const v = /^(checkbox|radio)$/.test(el.type) ? (el.checked ? el.value : '') : el.value;
      const group = /essay|esai/i.test(id) ? jawaban.esai : /^(obs-|lks-|lkpd-)/.test(id) ? jawaban.lks : /reflec|refleksi|^ref-/.test(id) ? jawaban.refleksi : jawaban.isianLain;
      if (!(id in group) || v !== '') group[id] = v;
    });
    if (typeof currentStarRating !== 'undefined') jawaban.refleksi.rating = currentStarRating;
    const score = questions.length ? Math.round(correct / questions.length * 100) : 0;
    return { schemaVersion: 2, mediaId: config.id, materi: config.title, mediaVersion: 'submission-v2', siswa,
      nilai: { skorKuis: score, benar: correct, total: questions.length }, jawaban,
      laporanTeks: [config.title, siswa.nama + ' | ' + siswa.kelas, 'Nilai kuis: ' + score,
        ...['esai', 'lks', 'refleksi'].map(k => k.toUpperCase() + '\n' + Object.entries(jawaban[k]).map(([id, v]) => id + ': ' + v).join('\n'))].join('\n\n') };
  }
  function notice(message, anchor) {
    let el = document.getElementById('portal-submission-status');
    if (!el) {
      el = document.createElement('p');
      el.id = 'portal-submission-status';
      el.setAttribute('role', 'status');
      el.style.cssText = 'padding:12px;border:1px solid #8b5cf6;border-radius:10px;font-size:13px;white-space:pre-wrap';
      (anchor?.parentElement || document.body).appendChild(el);
    }
    el.textContent = message;
  }
  function status(payload) {
    // Receipt-only JSONP: no answers or student identity travel in the URL.
    return new Promise((resolve, reject) => {
      const name = 'pkReceipt_' + uuid();
      const script = document.createElement('script');
      const cleanup = () => { clearTimeout(timer); script.remove(); delete window[name]; };
      const timer = setTimeout(() => { cleanup(); reject(new Error('Konfirmasi server belum diterima.')); }, 12000);
      window[name] = data => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error('Konfirmasi server belum dapat diakses.')); };
      script.src = ENDPOINT + '?action=submissionStatus&submissionId=' + encodeURIComponent(payload.submissionId) + '&receiptToken=' + encodeURIComponent(payload.receiptToken) + '&callback=' + name;
      document.head.appendChild(script);
    });
  }
  function confirmed(result, payload) {
    return result?.success === true && result.stored === true && result.submissionId === payload.submissionId;
  }
  function rpc(method, payload) {
    return new Promise((resolve, reject) => {
      const timer=setTimeout(()=>reject(new Error('Server belum merespons. Coba kembali; jawaban belum dihapus.')),20000);
      const done=fn=>value=>{clearTimeout(timer);fn(value);};
      google.script.run.withSuccessHandler(done(resolve)).withFailureHandler(done(reject))[method](payload);
    });
  }
  async function post(payload, opaque) {
    if (!opaque && window.google?.script?.run) {
      return rpc('simpanTugasSiswa',payload);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', mode: opaque ? 'no-cors' : 'cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(payload), signal: controller.signal });
      return opaque ? null : await response.json();
    } finally { clearTimeout(timer); }
  }
  async function deliver(payload) {
    let response;
    try { response = await post(payload, false); } catch (_) { /* Verify before an idempotent retry. */ }
    if (confirmed(response, payload)) return response;
    if (response?.success === false) throw new Error(response.message || 'Server menolak kiriman.');
    for (let attempt = 0; attempt < 3; attempt++) {
      try { const receipt = await status(payload); if (confirmed(receipt, payload)) return receipt; } catch (_) {}
      if (attempt === 0) { try { await post(payload, true); } catch (_) {} }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    throw new Error('Penyimpanan belum terkonfirmasi. Jawaban tetap tersimpan di perangkat; tekan kirim lagi setelah koneksi pulih.');
  }
  async function submit(config, answers, questions) {
    if (busy || finalized) return;
    const btn = document.querySelector('[onclick*="submitToTeacherDatabase"], [onclick*="syncToPortalDatabase"]');
    busy = true;
    if (btn) btn.disabled = true;
    try {
      if (!active) throw new Error('Periksa ID tugas dan kode pribadi terlebih dahulu.');
      const key = contextKey();
      let pending = Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).map(read).find(p => p?.context === key);
      if (!pending && quizState.some(x => x === null)) throw new Error('Jawab seluruh soal evaluasi sebelum mengirim.');
      if (!pending && !window.confirm('Kirim jawaban FINAL?\n\nPastikan seluruh LKS, esai, dan evaluasi sudah lengkap. Setelah OK, jawaban dikunci. Draf di browser akan dihapus hanya setelah server memastikan jawaban tersimpan. Perubahan berikutnya memerlukan izin guru.')) return;
      let payload = pending?.payload;
      if (!payload) {
        const content = collect(config, quizState.length ? quizState : answers, questions);
        const seed = active.assignmentId + '|' + active.studentAccessCode + '|' + active.revision;
        const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), x=>x.toString(16).padStart(2,'0')).join('').slice(0,48);
        payload = { ...content, schemaVersion: 3, mediaVersion: 'submission-v3-final', assignmentId: active.assignmentId,
          studentAccessCode: active.studentAccessCode, assignmentRevision: active.revision,
          submissionId: await digest(seed), receiptToken: await digest('receipt|' + seed), submittedAt: new Date().toISOString() };
      }
      const storageKey = PREFIX + payload.submissionId;
      localStorage.setItem(storageKey, JSON.stringify({ context: key, payload }));
      freeze(true);
      notice('Mengirim seluruh jawaban dan menunggu bukti penyimpanan...', btn);
      const receipt = await deliver(payload);
      finish(receipt, payload, config);
    } catch (e) {
      notice(e.message || 'Pengiriman belum berhasil. Isian tetap tersedia.', btn);
    } finally { busy = false; if (btn && !finalized) btn.disabled = false; }
  }
  async function retryPending(config) {
    if (busy) return;
    busy = true;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
      for (const key of keys) {
        let pending;
        try { pending = JSON.parse(localStorage.getItem(key)); } catch (_) { continue; }
        if (pending?.payload?.mediaId !== config.id || !pending.payload.assignmentId) continue;
        notice('Mencoba mengirim kembali jawaban yang tertunda...');
        try {
          const receipt = await deliver(pending.payload);
          // Only clean the currently loaded task; other pending tasks retain independent receipts.
          localStorage.setItem('pk_final_' + pending.context, JSON.stringify({ submissionId: receipt.canonicalSubmissionId || receipt.submissionId }));
          localStorage.removeItem(key);
          if ((active && pending.context === contextKey()) || (!active && pending.context === localStorage.getItem('pk_context_'+config.id))) {
            active = {assignmentId:pending.payload.assignmentId,studentAccessCode:pending.payload.studentAccessCode,revision:pending.payload.assignmentRevision};
            finish(receipt, pending.payload, config);
          }
          else notice('Kiriman tertunda tersimpan. Bukti: ' + receipt.submissionId);
        } catch (e) { notice(e.message); break; }
      }
    } finally { busy = false; }
  }
  function contextKey() { return configNow.id + '|' + active.assignmentId + '|' + active.studentAccessCode + '|' + active.revision; }
  function freeze(locked) {
    document.querySelectorAll('input,textarea,select').forEach(el => { if (!el.id.startsWith('pk-')) el.disabled = locked; });
    renderEvaluation();
  }
  function clearDrafts(config) {
    (config.draftKeys || []).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('portalkimia_receipt_v2_' + config.id); // Old receipt contained a full answer fingerprint.
    if (active) localStorage.removeItem('pk_quiz_' + contextKey());
    document.querySelectorAll('input,textarea').forEach(el => { if (!el.id.startsWith('pk-') && !/^(button|submit|range|color)$/.test(el.type)) { el.value=''; if(el.type==='checkbox'||el.type==='radio')el.checked=false; } });
    quizState = questionsNow.map(()=>null);
    if (adapters) adapters.setAnswers(quizState.slice());
  }
  function finish(receipt, payload, config) {
    const context = config.id+'|'+payload.assignmentId+'|'+payload.studentAccessCode+'|'+payload.assignmentRevision;
    // Keep only the receipt/lock, never the answer fingerprint.
    localStorage.setItem('pk_final_' + context, JSON.stringify({ submissionId: receipt.canonicalSubmissionId || receipt.submissionId }));
    finalized = true;
    Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).forEach(k=>{const p=read(k)?.payload;if(p?.mediaId===config.id&&p.assignmentId===payload.assignmentId&&p.studentAccessCode===payload.studentAccessCode&&Number(p.assignmentRevision)===Number(payload.assignmentRevision))localStorage.removeItem(k);});
    clearDrafts(config); freeze(true);
    document.querySelectorAll('[onclick*="submitToTeacherDatabase"],[onclick*="syncToPortalDatabase"]').forEach(b=>{b.disabled=true;b.textContent='Jawaban sudah final';});
    notice('Tersimpan dan dikunci. Draf jawaban pada perangkat telah dihapus.\nBukti: '+(receipt.canonicalSubmissionId || receipt.submissionId));
  }
  async function checkAccess(config) {
    if (busy) return;
    const assignmentId = value('pk-assignment'), studentAccessCode = value('pk-access-code');
    busy=true;
    try {
      const body={assignmentId,studentAccessCode,mediaId:config.id};
      const response = window.google?.script?.run ? await rpc('portalStudentAccess',body) : await (await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'studentAccess',...body}),signal:AbortSignal.timeout(20000)})).json();
      if (!response?.success) throw Error(response?.message || 'Tugas belum dapat diperiksa.');
      const previousContext=localStorage.getItem('pk_context_'+config.id);
      active={assignmentId,studentAccessCode,revision:response.revision}; finalized=false;
      if(previousContext&&previousContext!==contextKey())clearDrafts(config);
      localStorage.setItem('pk_context_'+config.id,contextKey());
      if(response.stored){finish({submissionId:response.submissionId},{assignmentId,studentAccessCode,assignmentRevision:response.revision},config);return;}
      if(!response.open || (response.due && Date.now()>new Date(response.due).getTime()&&!response.allowLate)){active=null;freeze(true);throw Error('Pengumpulan ditutup atau tenggat telah berakhir. Hubungi guru.');}
      for(const [id,v] of [['student-name',response.name],['student-class',response.className],['student-nis',response.nis]]){const e=document.getElementById(id);if(e)e.value=v;}
      const saved=read('pk_quiz_'+contextKey());
      quizState=Array.isArray(saved)&&saved.length===questionsNow.length?saved:questionsNow.map(()=>null);
      adapters?.setAnswers(quizState.slice());
      const pending=Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).map(read).find(p=>p?.context===contextKey());
      freeze(!!pending);
      document.querySelectorAll('[onclick*="submitToTeacherDatabase"],[onclick*="syncToPortalDatabase"]').forEach(b=>{b.disabled=false;b.textContent=pending?'Coba kirim ulang jawaban final':'Kirim jawaban final';});
      notice(response.title+' · '+response.name+' · '+response.className+'\n'+(pending?'Jawaban final menunggu konfirmasi. Tekan kirim untuk mencoba ulang.':'Evaluasi hanya satu kesempatan. Tidak ada kunci jawaban sebelum pengumpulan.'));
      renderEvaluation();
    } catch(e){notice(e.message || 'Gagal memeriksa tugas. Jawaban belum dihapus.');}finally{busy=false;}
  }
  function renderEvaluation() {
    const host=document.getElementById('pk-evaluation'); if(!host)return;
    host.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Evaluasi · satu kesempatan';heading.style.fontWeight='700';host.appendChild(heading);
    const info=document.createElement('p');info.textContent=finalized?'Jawaban evaluasi sudah tersimpan dan dikunci.':!active?'Periksa ID tugas dan kode pribadi di bagian atas halaman sebelum menjawab.':'Setiap pilihan langsung dikunci. Kunci dan pembahasan tidak ditampilkan saat pengerjaan.';host.appendChild(info);
    if(!active||finalized)return;
    const pending=Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).map(read).some(p=>p?.context===contextKey());
    questionsNow.forEach((q,i)=>{
      const card=document.createElement('div');card.style.cssText='padding:16px;margin:12px 0;border:1px solid #94a3b8;border-radius:12px';
      const title=document.createElement('p');title.textContent=(i+1)+'. '+plain(q.question||q.q);card.appendChild(title);
      (q.options||q.opts||[]).forEach((option,j)=>{
        const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+j)+'. '+plain(option)+(quizState[i]===j?' ✓ Dipilih':'');
        b.style.cssText='display:block;text-align:left;width:100%;padding:10px;margin-top:7px;border:1px solid #94a3b8;border-radius:8px;background:'+(quizState[i]===j?'#d1fae5':'#fff')+';color:#163d36';
        b.disabled=pending || (quizState[i]!==null&&quizState[i]!==undefined);
        b.onclick=()=>{if(finalized||pending||quizState[i]!==null)return;const next=quizState.slice();next[i]=j;try{localStorage.setItem('pk_quiz_'+contextKey(),JSON.stringify(next));quizState=next;adapters?.setAnswers(next.slice());renderEvaluation();}catch(_){notice('Penyimpanan browser tidak tersedia. Pilihan belum dikunci; kosongkan ruang perangkat.');}};
        card.appendChild(b);
      });host.appendChild(card);
    });
  }
  function install(config, hooks) {
    configNow=config;adapters=hooks;questionsNow=hooks?hooks.questions:[];quizState=questionsNow.map(()=>null);
    window.addEventListener('online', () => retryPending(config));
    // Explicit retry on a subsequent visit; no automatic transmission of merely saved drafts.
    const init = () => {
      const accessBox=document.createElement('section');accessBox.style.cssText='padding:20px;margin:20px;border:2px solid #0f766e;border-radius:14px;background:#effcf8;color:#123d36';
      accessBox.innerHTML='<h2 style="font-weight:bold">Tugas dari guru</h2><p>Gunakan kode pribadi Anda. Pengumpulan final hanya satu kali.</p><label>ID tugas <input id="pk-assignment" autocomplete="off" style="padding:8px;border:1px solid #94a3b8;color:#123d36;background:white;margin:8px"></label><label>Kode pribadi <input id="pk-access-code" type="password" autocomplete="off" style="padding:8px;border:1px solid #94a3b8;color:#123d36;background:white;margin:8px"></label><button id="pk-check" type="button" style="padding:10px;background:#0f766e;color:white;border-radius:8px">Periksa tugas</button>';
      document.body.prepend(accessBox);document.getElementById('pk-check').onclick=()=>checkAccess(config);
      // Retain the local final marker across reloads; checking a new task/revision unlocks it.
      const last=localStorage.getItem('pk_context_'+config.id);
      if(last&&read('pk_final_'+last)){finalized=true;clearDrafts(config);freeze(true);notice('Pengumpulan terakhir sudah final. Periksa tugas untuk membuka tugas lain atau revisi dari guru.');}
      renderEvaluation();
      try {
        if (Object.keys(localStorage).some(k => k.startsWith(PREFIX) && read(k)?.payload?.mediaId === config.id && read(k)?.payload?.assignmentId)) {
          notice('Ada pengumpulan yang belum terkonfirmasi.');
          const button = document.createElement('button');
          button.type = 'button'; button.textContent = 'Kirim ulang pengumpulan tertunda';
          button.style.cssText = 'padding:10px;background:#7c3aed;color:white;border-radius:8px';
          button.onclick = () => retryPending(config);
          document.getElementById('portal-submission-status').appendChild(button);
        }
      } catch (_) {}
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
  return { collect, submit, install, isFinal:()=>finalized, checkAccess, retryPending };
})();
