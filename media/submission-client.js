/* PortalKimia submission client v2. Embedded by build-submissions.cjs so Drive HTML stays standalone. */
window.PortalSubmission = (() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwobr0k-44HFrf3B5YUroeEK-_U13AGVe2urQYDAmL0U43arTQHTvKjUEeM6CuZQvOE/exec';
  const PREFIX = 'portalkimia_pending_v2_';
  let busy = false;
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
      if (/^(password|file|hidden|button|submit|reset)$/i.test(el.type || '') || /^student-/.test(el.id)) return;
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
  async function post(payload, opaque) {
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
    if (busy) return;
    const btn = document.querySelector('[onclick*="submitToTeacherDatabase"], [onclick*="syncToPortalDatabase"]');
    busy = true;
    if (btn) btn.disabled = true;
    try {
      const content = collect(config, answers, questions);
      const fingerprint = JSON.stringify(content);
      const receiptKey = 'portalkimia_receipt_v2_' + config.id;
      const lastReceipt = JSON.parse(localStorage.getItem(receiptKey) || 'null');
      if (lastReceipt?.fingerprint === fingerprint) {
        notice('Jawaban ini sudah tersimpan. Bukti: ' + lastReceipt.receipt.submissionId, btn);
        return;
      }
      let payload;
      for (const key of Object.keys(localStorage).filter(k => k.startsWith(PREFIX))) {
        try { const pending = JSON.parse(localStorage.getItem(key)); if (pending.fingerprint === fingerprint) { payload = pending.payload; break; } } catch (_) {}
      }
      payload = payload || { ...content, submissionId: uuid(), receiptToken: uuid(), submittedAt: new Date().toISOString() };
      const storageKey = PREFIX + payload.submissionId;
      // Persist before network I/O; storage failure must not be reported as a successful save.
      localStorage.setItem(storageKey, JSON.stringify({ fingerprint, payload }));
      notice('Mengirim seluruh jawaban dan menunggu bukti penyimpanan...', btn);
      const receipt = await deliver(payload);
      localStorage.setItem(receiptKey, JSON.stringify({ fingerprint, receipt }));
      localStorage.removeItem(storageKey);
      notice('Tersimpan: ' + receipt.sheetName + '\nBukti pengumpulan: ' + receipt.submissionId, btn);
    } catch (e) {
      notice(e.message || 'Pengiriman belum berhasil. Isian tetap tersedia.', btn);
    } finally { busy = false; if (btn) btn.disabled = false; }
  }
  async function retryPending(config) {
    if (busy) return;
    busy = true;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
      for (const key of keys) {
        let pending;
        try { pending = JSON.parse(localStorage.getItem(key)); } catch (_) { continue; }
        if (pending?.payload?.mediaId !== config.id) continue;
        notice('Mencoba mengirim kembali jawaban yang tertunda...');
        try {
          const receipt = await deliver(pending.payload);
          localStorage.setItem('portalkimia_receipt_v2_' + config.id, JSON.stringify({ fingerprint: pending.fingerprint, receipt }));
          localStorage.removeItem(key);
          notice('Kiriman tertunda tersimpan. Bukti: ' + receipt.submissionId);
        } catch (e) { notice(e.message); break; }
      }
    } finally { busy = false; }
  }
  function install(config) {
    window.addEventListener('online', () => retryPending(config));
    // Explicit retry on a subsequent visit; no automatic transmission of merely saved drafts.
    const init = () => {
      try {
        if (Object.keys(localStorage).some(k => k.startsWith(PREFIX) && JSON.parse(localStorage.getItem(k))?.payload?.mediaId === config.id)) {
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
  return { collect, submit, install };
})();
