(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'portalkimia.assessmentStudio.instruments.v1';
  const TOKEN_KEY = 'portalkimia.assessmentStudio.cloudToken.v1';
  const URL_KEY = 'portalkimia.assessmentStudio.cloudUrl.v1';
  const MODEL_KEY = 'portalkimia.assessmentStudio.geminiModel.v1';
  const PROVIDER_KEY = 'portalkimia.assessmentStudio.provider.v1';
  const labels = { diagnostik: 'Diagnostik', formatif: 'Formatif', sumatif: 'Sumatif' };
  let current = null;
  let moduleData = null;
  let toastTimer;

  function notify(message) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function readSaved() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  function persist(item) {
    const saved = readSaved();
    const idx = saved.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) saved[idx] = item; else saved.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 40)));
    renderSaved();
  }
  function gasUrl() { return String(localStorage.getItem(URL_KEY) || window.ASSESSMENT_CONFIG?.GAS_API_URL || window.PORTALKIMIA_CONFIG?.ASESMEN_API || '').trim(); }
  function gasToken() { return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('PORTALKIMIA_TEACHER_TOKEN') || localStorage.getItem('portalkimia_guru_token') || ''; }
  function setCloudStatus(text, connected) {
    if ($('cloudStatusText')) $('cloudStatusText').textContent = text;
    if ($('cloudStatusDot')) {
      $('cloudStatusDot').style.background = connected ? '#34d399' : '#f59e0b';
      $('cloudStatusDot').style.boxShadow = connected ? '0 0 9px rgba(52,211,153,.45)' : '0 0 9px rgba(245,158,11,.35)';
    }
  }
  async function gasRequest(payload) {
    if (!gasUrl()) throw new Error('URL GAS belum diatur. Buka Pengaturan cloud.');
    const response = await fetch(gasUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, token: gasToken() }) });
    if (!response.ok) throw new Error(`Backend merespons ${response.status}.`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Permintaan cloud gagal.');
    return result;
  }
  async function saveCloud(item) {
    if (!gasToken()) throw new Error('Token belum diatur. Buka Pengaturan cloud.');
    const result = await gasRequest({ action: 'save', instrument: item });
    setCloudStatus('Terhubung · cloud siap', true);
    return result;
  }
  async function loadCloud() {
    const result = await gasRequest({ action: 'list' });
    const saved = readSaved();
    (result.instruments || []).forEach((item) => {
      const index = saved.findIndex((entry) => entry.id === item.id);
      if (index < 0) saved.push(item); else if (new Date(item.updatedAt || 0) > new Date(saved[index].updatedAt || 0)) saved[index] = item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 40)));
    renderSaved(); setCloudStatus(`Cloud tersinkron · ${result.instruments?.length || 0} instrumen`, true);
    notify(`${result.instruments?.length || 0} instrumen dimuat dari Spreadsheet.`);
  }
  async function testCloud() {
    if (!gasUrl()) throw new Error('Isi URL Web App GAS terlebih dahulu.');
    const response = await fetch(`${gasUrl()}?action=ping`);
    const result = await response.json();
    if (!result.ok) throw new Error('Backend tidak mengembalikan status aktif.');
    setCloudStatus('Terhubung · cloud siap', true); return result;
  }
  function initCloudSettings() {
    $('gasUrlInput').value = gasUrl(); $('gasTokenInput').value = gasToken();
    $('openSettings').addEventListener('click', () => { $('gasUrlInput').value = gasUrl(); $('gasTokenInput').value = gasToken(); $('settingsModal').classList.remove('hidden'); });
    $('closeSettings').addEventListener('click', () => $('settingsModal').classList.add('hidden'));
    $('saveSettingsButton').addEventListener('click', () => {
      const url = $('gasUrlInput').value.trim();
      if (url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(url)) return notify('URL harus berupa URL Web App GAS yang berakhiran /exec.');
      window.ASSESSMENT_CONFIG.GAS_API_URL = url;
      localStorage.setItem(URL_KEY, url);
      localStorage.setItem(TOKEN_KEY, $('gasTokenInput').value.trim());
      setCloudStatus(url ? 'URL cloud diatur · belum diuji' : 'Lokal · cloud belum diatur', false);
      $('settingsModal').classList.add('hidden'); notify('Pengaturan cloud disimpan di browser ini.');
    });
    $('testCloudButton').addEventListener('click', async () => {
      window.ASSESSMENT_CONFIG.GAS_API_URL = $('gasUrlInput').value.trim();
      localStorage.setItem(URL_KEY, $('gasUrlInput').value.trim());
      localStorage.setItem(TOKEN_KEY, $('gasTokenInput').value.trim());
      try { await testCloud(); notify('Koneksi GAS berhasil.'); }
      catch (error) { setCloudStatus('Cloud belum terhubung', false); notify(error.message || 'Koneksi gagal.'); }
    });
    $('loadCloudButton').addEventListener('click', async () => { try { await loadCloud(); } catch (error) { setCloudStatus('Cloud belum terhubung', false); notify(error.message || 'Gagal memuat cloud.'); } });
    $('refreshUsageButton').addEventListener('click', loadUsage);
    const savedModel = localStorage.getItem(MODEL_KEY);
    if (savedModel && [...$('modelSelect').options].some((option) => option.value === savedModel)) $('modelSelect').value = savedModel;
    $('modelSelect').addEventListener('change', () => localStorage.setItem(MODEL_KEY, $('modelSelect').value));
    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (savedProvider === 'deepseek' || savedProvider === 'gemini') $('providerSelect').value = savedProvider;
    $('providerSelect').addEventListener('change', updateProviderUI);
    updateProviderUI();
    setCloudStatus(gasUrl() && gasToken() ? 'Cloud diatur · siap diuji' : 'Lokal · cloud belum diatur', false);
  }
  function updateProviderUI() {
    const deepseek = $('providerSelect').value === 'deepseek';
    $('geminiModelWrap').classList.toggle('hidden', deepseek);
    $('providerHelp').textContent = deepseek ? 'DeepSeek Flash memakai API berbayar dan kunci API yang diatur di GAS.' : 'Penggunaan mengikuti kuota dan kebijakan akun Google AI Studio.';
    $('tokenNote').textContent = deepseek ? 'DeepSeek Flash · thinking max · batas keluaran 393.216 token' : 'Gemini · JSON terstruktur · batas output 65.536 token';
    $('providerFooter').textContent = deepseek ? '✳ DeepSeek Flash · reasoning max · tanpa fallback lintas provider.' : '✳ Gemini · fallback hanya ke model Gemini.';
    $('generate').innerHTML = `Susun dengan ${deepseek ? 'DeepSeek Flash' : 'Gemini'} <span>→</span>`;
    localStorage.setItem(PROVIDER_KEY, $('providerSelect').value);
  }
  function providerName(provider) { return provider === 'deepseek' ? 'DeepSeek Flash' : 'Gemini'; }
  function moneyUsd(amount) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(Number(amount) || 0); }
  async function loadUsage() {
    try {
      const result = await gasRequest({ action: 'usage' });
      const total = result.total || {};
      $('usageSummary').innerHTML = `<span>${Number(total.totalTokens || 0).toLocaleString('id-ID')} token total</span><span>${moneyUsd(total.costEstimateUsd)} estimasi biaya DeepSeek</span><span>${(result.records || []).length} catatan</span>`;
      $('usageRows').innerHTML = (result.records || []).length ? result.records.map((record) => `<tr><td>${escapeHtml(new Date(record.timestamp).toLocaleString('id-ID'))}</td><td>${escapeHtml(providerName(record.provider))}<br><small>${escapeHtml(record.model)}</small></td><td>${escapeHtml(record.assessmentType)} · ${escapeHtml(record.topic)}</td><td>${record.promptTokens.toLocaleString('id-ID')}</td><td>${record.outputTokens.toLocaleString('id-ID')}</td><td>${record.reasoningTokens.toLocaleString('id-ID')}</td><td>${record.totalTokens.toLocaleString('id-ID')}</td><td>${record.provider === 'deepseek' ? moneyUsd(record.costEstimateUsd) : '—'}</td></tr>`).join('') : '<tr><td colspan="8">Belum ada pemakaian AI tercatat.</td></tr>';
      notify('Riwayat pemakaian diperbarui.');
    } catch (error) { notify('Gagal memuat riwayat pemakaian: ' + error.message); }
  }
  function showGenerationPreview(draft, provider) {
    const model = provider === 'deepseek' ? 'DeepSeek Flash · berbayar · reasoning max' : `${$('modelSelect').selectedOptions[0].text} · kuota Google`;
    const moduleTitle = draft.module?.title ? `Modul: ${draft.module.title}` : 'Tanpa data modul terimpor';
    const preview = `Provider/model: ${model}\nJenis asesmen: ${draft.typeLabel}\nTopik: ${draft.topic}\nTujuan: ${draft.objective}\nJumlah butir: ${draft.items.length}\nTeknik: ${draft.technique}\n${moduleTitle}`;
    return window.confirm(`Pratinjau sebelum generasi\n\n${preview}\n\n${provider === 'deepseek' ? 'Pemakaian DeepSeek berbayar. Estimasi akan dicatat setelah respons diterima.' : 'Gemini mengikuti kuota/plan akun Google.'}\n\nLanjutkan?`);
  }
  function newId() { return `as-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function dateLabel(iso) { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function showBuilder(type) {
    if (type) $('assessmentType').value = type;
    $('builderTitle').textContent = `Rancang asesmen ${labels[$('assessmentType').value].toLowerCase()}`;
    $('builder').classList.remove('hidden');
    $('result').classList.add('hidden');
    $('builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function objectiveSeed(type, topic) {
    const subject = topic || 'materi yang dipelajari';
    if (type === 'diagnostik') return `Mengidentifikasi pengetahuan awal, pemahaman konsep, dan kebutuhan belajar siswa tentang ${subject}.`;
    if (type === 'formatif') return `Siswa dapat menjelaskan dan menerapkan konsep ${subject} dengan tepat serta menggunakan umpan balik untuk memperbaiki pemahamannya.`;
    return `Siswa dapat menganalisis dan menerapkan konsep ${subject} untuk menyelesaikan masalah kontekstual dengan alasan ilmiah yang tepat.`;
  }
  function purposeFor(type) {
    return {
      diagnostik: { purpose: 'Memetakan pengetahuan prasyarat, miskonsepsi, kesiapan, dan kebutuhan belajar. Gunakan hasil untuk menyesuaikan titik awal, dukungan, atau pengelompokan; bukan untuk memberi nilai akhir.', followUp: 'Kelompokkan respons menjadi sudah siap, perlu penguatan prasyarat, dan perlu dukungan khusus. Tentukan pengantar atau materi prasyarat dari pola jawaban siswa.' },
      formatif: { purpose: 'Mengumpulkan bukti selama proses belajar agar guru dan siswa dapat menentukan langkah berikutnya. Fokus pada umpan balik yang bisa ditindaklanjuti.', followUp: 'Jika mayoritas siswa belum mencapai kriteria, lakukan pengajaran ulang dengan representasi lain. Jika sebagian sudah mencapai, berikan latihan bertahap atau pengayaan.' },
      sumatif: { purpose: 'Menilai ketercapaian tujuan setelah pembelajaran melalui bukti yang relevan. Tetapkan bobot atau rubrik dan gunakan hasil untuk pelaporan serta perencanaan tindak lanjut.', followUp: 'Rekap ketercapaian per tujuan, identifikasi kompetensi yang perlu diperkuat, lalu rencanakan remediasi atau pengayaan berdasarkan bukti.' }
    }[type];
  }
  function reviewInstrumentQuality(item) {
    const objective = String(item.objective || '').trim();
    const items = Array.isArray(item.items) ? item.items : [];
    const checks = [];
    const issues = [];
    checks.push(objective.length >= 12 ? 'Tujuan pembelajaran tersedia dan cukup spesifik.' : 'Tujuan pembelajaran perlu diperjelas.');
    if (objective.length < 12) issues.push('Tujuan pembelajaran kosong atau terlalu singkat.');
    const missing = items.filter((entry) => !String(entry.prompt || '').trim() || !String(entry.criteria || '').trim() || !String(entry.objective || '').trim());
    checks.push(missing.length ? `${missing.length} butir belum lengkap pada tugas, tujuan, atau kriteria.` : 'Setiap butir memiliki tugas, tujuan terukur, dan kriteria.');
    if (missing.length) issues.push('Lengkapi tujuan, tugas, dan kriteria pada semua butir.');
    const objectiveMismatch = items.filter((entry) => String(entry.objective || '').trim() && objective && !String(entry.objective).toLowerCase().includes(objective.toLowerCase().slice(0, 30)) && !objective.toLowerCase().includes(String(entry.objective).toLowerCase().slice(0, 30))).length;
    checks.push(objectiveMismatch ? `${objectiveMismatch} butir tampak memakai rumusan tujuan yang berbeda; cek keselarasan.` : 'Rumusan tujuan antarbutir tampak konsisten.');
    if (objectiveMismatch) issues.push('Pastikan tujuan tiap butir merupakan turunan dari tujuan pembelajaran utama.');
    const hasEvidence = items.every((entry) => String(entry.evidence || '').trim());
    checks.push(hasEvidence ? 'Bukti belajar dicantumkan pada seluruh butir.' : 'Bukti belajar belum dicantumkan pada semua butir.');
    if (!hasEvidence) issues.push('Tentukan bukti belajar yang dapat diamati/dikumpulkan untuk setiap butir.');
    const sumative = item.type === 'sumatif';
    const rubric = items.filter((entry) => /rubrik|skor|\b[0-3]\b|kriteria/i.test(String(entry.criteria || ''))).length;
    checks.push(sumative ? `${rubric}/${items.length} kriteria sumatif memuat petunjuk rubrik/skor; periksa level dan konsistensinya.` : 'Kriteria tersedia untuk ditinjau terhadap fungsi asesmen ini.');
    if (sumative && rubric < items.length) issues.push('Perjelas rubrik atau skala skor pada kriteria sumatif yang belum operasional.');
    return { checks, issues, checkedAt: new Date().toISOString() };
  }
  function recommendationFor(type, index) {
    if (type === 'diagnostik') return ['Jika banyak siswa belum mengenali konsep prasyarat, lakukan aktivasi pengetahuan awal dengan contoh konkret sebelum masuk materi baru.', 'Jika jawaban menunjukkan miskonsepsi yang sama, gunakan demonstrasi atau representasi pembanding lalu minta siswa menjelaskan perubahan pemahamannya.', 'Gunakan respons keyakinan dan kebutuhan untuk menyesuaikan dukungan, media, dan tempo; jangan menafsirkan keyakinan sebagai kemampuan.'][index % 3];
    if (type === 'formatif') return ['Berikan umpan balik spesifik pada konsep yang sudah tepat dan satu langkah berikutnya yang perlu diperbaiki.', 'Gunakan hasil untuk memilih antara pengajaran ulang singkat, latihan tambahan, atau tantangan pengayaan.', 'Minta siswa memperbaiki jawaban setelah menerima umpan balik agar pemantauan berlanjut menjadi perbaikan belajar.'][index % 3];
    return ['Gunakan rubrik atau bobot yang konsisten dan laporkan bukti ketercapaian sesuai tujuan yang diukur.', 'Jika kriteria belum tercapai, tentukan kompetensi spesifik untuk remediasi dan kesempatan menunjukkan kemajuan.', 'Jika kriteria sudah tercapai, sediakan tugas transfer atau pengayaan yang memperluas penerapan konsep.'][index % 3];
  }
  function criteriaForTechnique(type, technique, index) {
    if (type === 'diagnostik') return ['Catat konsep awal yang tepat, belum lengkap, dan miskonsepsi tanpa memberi skor sumatif.', 'Nilai penguasaan prasyarat dari proses yang tampak; tandai langkah yang memerlukan dukungan.', 'Pisahkan keyakinan diri dari bukti penguasaan konsep.', 'Gunakan pilihan siswa untuk merencanakan akses dan dukungan belajar.', 'Simpan kata-kata dan alasan siswa sebagai baseline sebelum pembelajaran.'][index % 5];
    const rubrics = {
      Observasi: 'Rubrik: ketepatan proses (0–2), penggunaan konsep/bukti (0–2), dan konsistensi perilaku yang diamati (0–2). Catat bukti faktual.',
      'Unjuk kerja': 'Rubrik: persiapan (0–2), ketepatan langkah (0–3), keselamatan bila relevan (0–2), hasil/interpretasi (0–3).',
      Proyek: 'Rubrik: akurasi konsep (0–3), kualitas produk (0–3), dokumentasi proses (0–2), dan komunikasi (0–2).',
      Presentasi: 'Rubrik: akurasi isi (0–3), dukungan bukti (0–3), alur/visual (0–2), dan respons terhadap pertanyaan (0–2).',
      'Refleksi diri': 'Kriteria: merujuk bukti pekerjaan, mengenali kekuatan/kesulitan, dan menetapkan langkah berikutnya yang spesifik.',
      'Penilaian diri': 'Kriteria: menggunakan rubrik yang sama, menyebut bukti konkret, menilai secara jujur, dan menentukan revisi.',
      Wawancara: 'Panduan: gunakan pertanyaan inti yang sama, catat alasan siswa, lalu kodekan pemahaman tepat, berkembang, atau miskonsepsi.',
      Diskusi: 'Rubrik: kontribusi relevan (0–2), alasan/bukti (0–3), menanggapi ide teman (0–2), dan revisi gagasan (0–3).'
    };
    return rubrics[technique] || 'Tentukan indikator yang dapat diamati, skala capaian, dan contoh bukti untuk setiap tingkat rubrik.';
  }
  function makeItems(type, count, topic, technique) {
    const bank = {
      diagnostik: [
        ['Peta pengetahuan awal', `Buat peta sederhana tentang konsep yang kamu ketahui terkait ${topic || 'materi ini'} dan jelaskan hubungan antar konsep.`, 'Keterhubungan konsep awal; tandai konsep tepat, belum lengkap, atau berpotensi miskonsepsi.'],
        ['Demonstrasi prasyarat', 'Tunjukkan cara menggunakan satu konsep prasyarat pada contoh sederhana, lalu jelaskan langkahmu.', 'Ketepatan proses prasyarat dan bagian yang memerlukan pemodelan ulang.'],
        ['Refleksi kesiapan', 'Pilih tingkat kesiapan 1–4 dan ceritakan pengalaman belajar yang membuatmu memilih tingkat tersebut.', 'Catat keyakinan dan kebutuhan dukungan terpisah dari penguasaan konsep.'],
        ['Pilihan dukungan', 'Pilih cara belajar yang paling membantumu (contoh, diagram, praktik, diskusi); jelaskan alasan pilihanmu.', 'Petakan preferensi dukungan sebagai bahan diferensiasi, bukan label kemampuan.'],
        ['Wawancara konsep', 'Jelaskan prediksimu untuk situasi pemantik yang berkaitan dengan materi, beserta alasan awalnya.', 'Gunakan alasan dan prediksi untuk mengidentifikasi gagasan awal dan miskonsepsi.']
      ],
      formatif: [
        ['Cek proses', 'Saat melakukan aktivitas, tunjukkan langkah yang sedang kamu kerjakan dan jelaskan alasan memilih langkah itu.', 'Umpan balik menyebut satu hal yang sudah tepat dan satu langkah perbaikan berikutnya.'],
        ['Praktik terbimbing', 'Lakukan satu prosedur atau tugas singkat terkait konsep yang dipelajari dan jelaskan hasil pengamatanmu.', 'Kriteria proses, keselamatan bila relevan, penggunaan bukti, dan penjelasan hasil.'],
        ['Diskusi pasangan', 'Bandingkan penjelasanmu dengan pasangan, temukan satu persamaan atau perbedaan, lalu revisi kesimpulanmu.', 'Amati kualitas alasan, penggunaan bukti, dan revisi setelah umpan balik.'],
        ['Refleksi belajar', 'Lengkapi: “Saya sudah bisa…, bukti saya…, saya masih perlu berlatih…”.', 'Respons mengarah pada strategi belajar atau pengajaran ulang yang spesifik.'],
        ['Penilaian diri', 'Gunakan kriteria yang disediakan untuk menilai pekerjaanmu dan tentukan satu perbaikan.', 'Penilaian diri menyebut bukti pada pekerjaan serta langkah perbaikan yang realistis.']
      ],
      sumatif: [
        ['Unjuk kerja', 'Lakukan demonstrasi atau prosedur terkait materi dan jelaskan keputusan yang kamu ambil selama proses.', 'Rubrik menilai persiapan, proses, penggunaan konsep, keselamatan bila relevan, dan penjelasan.'],
        ['Produk atau proyek', `Buat produk/proyek yang menunjukkan penerapan konsep ${topic || 'materi'} pada konteks yang ditentukan.`, 'Rubrik menilai akurasi konsep, kualitas produk, proses/bukti, dan komunikasi.'],
        ['Presentasi ilmiah', 'Sajikan hasil kerja atau investigasi, jelaskan bukti yang mendukung kesimpulan, lalu tanggapi pertanyaan.', 'Rubrik menilai organisasi, akurasi, dukungan bukti, visual, dan respons.'],
        ['Portofolio', 'Pilih bukti pekerjaan yang menunjukkan perkembangan pemahaman dan jelaskan alasan pemilihannya.', 'Kelengkapan bukti, refleksi perkembangan, dan keterkaitan dengan kriteria tujuan.'],
        ['Refleksi akhir', 'Evaluasi proses dan hasil belajar menggunakan kriteria; tetapkan satu target belajar berikutnya.', 'Refleksi mengacu pada bukti dan kriteria, serta menetapkan target yang dapat dilakukan.']
      ]
    };
    return Array.from({ length: count }, (_, i) => {
      const source = bank[type][i % bank[type].length];
      const sourceMeeting = moduleData?.selectedMeeting || moduleData?.meetings?.[0];
      const objectives = sourceMeeting?.itp ? sourceMeeting.itp.split(/\n+/).map((entry) => entry.replace(/^\s*(?:[-•]|\d+[.)])\s*/, '').trim()).filter(Boolean) : [];
      const mappedObjective = objectives.length ? objectives[i % objectives.length] : '';
      const level = type === 'diagnostik' ? ['Memahami (C2)', 'Memahami (C2)', 'Merefleksi', 'Merefleksi', 'Menganalisis (C4)'][i % 5]
        : type === 'formatif' ? ['Memahami (C2)', 'Mengaplikasi (C3)', 'Menganalisis (C4)', 'Merefleksi', 'Memahami (C2)'][i % 5]
          : ['Memahami (C2)', 'Mengaplikasi (C3)', 'Menganalisis (C4)', 'Mengevaluasi (C5)', 'Mencipta (C6)'][i % 5];
      const evidence = type === 'diagnostik' ? ['Peta konsep atau respons awal', 'Demonstrasi prasyarat', 'Refleksi dan tingkat keyakinan', 'Alasan memilih dukungan', 'Prediksi dan alasan awal'][i % 5]
        : technique === 'Observasi' ? 'Catatan ceklis/rubrik atas proses yang tampak'
          : technique === 'Unjuk kerja' ? 'Kinerja proses dan hasil demonstrasi'
            : technique === 'Proyek' ? 'Produk, dokumentasi proses, dan presentasi'
              : technique === 'Presentasi' ? 'Presentasi, media, dan respons terhadap pertanyaan'
                : technique === 'Refleksi diri' ? 'Catatan refleksi yang merujuk bukti pekerjaan'
                  : technique === 'Penilaian diri' ? 'Lembar penilaian diri dan bukti pada hasil kerja'
                    : technique === 'Wawancara' ? 'Respons lisan dan alasan siswa'
                      : 'Kontribusi diskusi, alasan, dan revisi gagasan';
      return { no: i + 1, objective: mappedObjective || `Tujuan pembelajaran: ${objectiveSeed(type, topic)}`, indicator: source[0], cognitiveLevel: level, evidence, prompt: source[1], criteria: technique === 'Tes tertulis' ? source[2] : criteriaForTechnique(type, technique, i), recommendation: recommendationFor(type, i), teacherReview: 'belum ditinjau', technique };
    });
  }
  async function generate() {
    const type = $('assessmentType').value, topic = $('topic').value.trim(), count = Math.max(1, Math.min(30, Number($('itemCount').value) || 5));
    if ($('technique').value === 'Soal tertulis') {
      current = {
        id: newId(), type, typeLabel: labels[type], grade: $('grade').value, phase: $('phase').value,
        subject: $('subject').value.trim() || 'Kimia', topic: topic || 'Materi pembelajaran',
        objective: $('objective').value.trim() || objectiveSeed(type, topic), technique: 'Soal tertulis',
        context: $('context').value.trim(), module: moduleData ? { title: moduleData.title, meeting: moduleData.selectedMeeting || null } : null,
        writtenTest: { count: Math.max(1, Number($('writtenCount').value) || 5), weightPercent: Math.max(0, Math.min(100, Number($('writtenWeight').value) || 0)), generator: 'Generator-Soal-Kimia' },
        purpose: purposeFor(type), reviewStatus: 'menunggu paket soal dari Generator Soal', items: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'written-test-reference'
      };
      renderResult(); $('result').classList.remove('hidden'); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    current = {
      id: newId(), type, typeLabel: labels[type], grade: $('grade').value, phase: $('phase').value,
      subject: $('subject').value.trim() || 'Kimia', topic: topic || 'Materi pembelajaran',
      objective: $('objective').value.trim() || objectiveSeed(type, topic), technique: $('technique').value,
      context: $('context').value.trim(), module: moduleData ? { title: moduleData.title, meeting: moduleData.selectedMeeting || null } : null,
      items: makeItems(type, count, topic, $('technique').value),
      purpose: purposeFor(type), reviewStatus: 'perlu ditinjau guru', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'template-local'
    };
    const draft = current;
    const generateButton = $('generate');
    const provider = $('providerSelect').value;
    if (!showGenerationPreview(draft, provider)) return;
    generateButton.disabled = true; generateButton.textContent = `${providerName(provider)} sedang menyusun…`;
    try {
      const generated = await gasRequest({ action: 'generate', provider, model: $('modelSelect').value, input: {
        type: draft.type, typeLabel: draft.typeLabel, grade: draft.grade, phase: draft.phase, subject: draft.subject, topic: draft.topic,
        objective: draft.objective, technique: draft.technique, context: draft.context, count: draft.items.length,
        moduleContext: moduleData?.selectedMeeting || null
      } });
      current = { ...generated.instrument, id: draft.id, module: draft.module, providerRequested: provider, providerUsed: generated.provider || provider, modelRequested: generated.requestedModel, modelUsed: generated.modelUsed, fallbackUsed: generated.fallbackUsed, fallbacksTried: generated.fallbacksTried, tokenUsage: generated.usage, costEstimate: generated.costEstimate, maxOutputTokens: generated.maxOutputTokens };
      setCloudStatus(`${providerName(provider)} · ${generated.modelUsed}${generated.fallbackUsed ? ' (fallback)' : ''}`, true);
      if (provider === 'deepseek') notify(`DeepSeek selesai · ${generated.usage?.totalTokens || 0} token · estimasi ${moneyUsd(generated.costEstimate?.amount)}.`);
    } catch (error) {
      current = draft;
      notify(`${providerName(provider)} tidak tersedia; memakai draf lokal. ${error.message}`);
      setCloudStatus(`${providerName(provider)} gagal · draf lokal digunakan`, false);
    } finally {
      generateButton.disabled = false; updateProviderUI();
    }
    renderResult(); $('result').classList.remove('hidden'); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderResult() {
    const item = current;
    if (item.technique === 'Soal tertulis' && !item.items?.length) { renderWrittenTestResult(item); return; }
    const rows = item.items.map((it, i) => `<tr><td>${i + 1}</td><td><textarea data-field="objective" data-index="${i}" rows="3">${escapeHtml(it.objective || '')}</textarea></td><td><input data-field="indicator" data-index="${i}" value="${escapeHtml(it.indicator)}"><select data-field="cognitiveLevel" data-index="${i}">${['Memahami (C2)','Mengaplikasi (C3)','Menganalisis (C4)','Mengevaluasi (C5)','Mencipta (C6)','Merefleksi'].map((level) => `<option${it.cognitiveLevel === level ? ' selected' : ''}>${level}</option>`).join('')}</select></td><td><textarea data-field="prompt" data-index="${i}" rows="3">${escapeHtml(it.prompt)}</textarea></td><td><textarea data-field="evidence" data-index="${i}" rows="3">${escapeHtml(it.evidence || '')}</textarea></td><td><textarea data-field="criteria" data-index="${i}" rows="3">${escapeHtml(it.criteria)}</textarea></td><td><select data-field="teacherReview" data-index="${i}"><option${it.teacherReview !== 'ditinjau' ? ' selected' : ''}>belum ditinjau</option><option${it.teacherReview === 'ditinjau' ? ' selected' : ''}>ditinjau</option></select><textarea data-field="recommendation" data-index="${i}" rows="3">${escapeHtml(it.recommendation || '')}</textarea><button class="regenerate-button" data-regenerate="${i}" type="button">↻ Buat ulang butir</button></td></tr>`).join('');
    const purpose = item.purpose || purposeFor(item.type);
    item.qualityReview = reviewInstrumentQuality(item);
    const quality = item.qualityReview;
    $('result').innerHTML = `<div class="result-toolbar"><div><h3>${escapeHtml(item.typeLabel)} · ${escapeHtml(item.topic)}</h3><div class="result-content text-xs text-zinc-400">Kelas ${escapeHtml(item.grade)} · Fase ${escapeHtml(item.phase)} · ${escapeHtml(item.subject)} · ${escapeHtml(item.technique)}</div><span class="review-pill">${escapeHtml(item.reviewStatus || 'perlu ditinjau guru')}</span>${item.modelUsed ? `<span class="model-pill">${escapeHtml(providerName(item.providerUsed))}: ${escapeHtml(item.modelUsed)}${item.fallbackUsed ? ' · fallback otomatis' : ''}${item.tokenUsage?.totalTokens ? ` · ${item.tokenUsage.totalTokens} token` : ''}${item.providerUsed === 'deepseek' && item.costEstimate ? ` · est. ${moneyUsd(item.costEstimate.amount)}` : ''}</span>` : ''}</div><div class="result-actions"><button data-action="save" class="inline-flex items-center gap-1.5"><i data-lucide="save" class="w-3.5 h-3.5 text-emerald-400"></i><span>Simpan</span></button><button data-action="word" class="inline-flex items-center gap-1.5"><i data-lucide="file-down" class="w-3.5 h-3.5 text-blue-400"></i><span>Word</span></button><button data-action="docs" class="inline-flex items-center gap-1.5"><i data-lucide="external-link" class="w-3.5 h-3.5 text-indigo-400"></i><span>Google Docs</span></button><button data-action="csv" class="inline-flex items-center gap-1.5"><i data-lucide="table" class="w-3.5 h-3.5 text-amber-400"></i><span>CSV</span></button><button data-action="json" class="inline-flex items-center gap-1.5"><i data-lucide="code" class="w-3.5 h-3.5 text-violet-400"></i><span>JSON</span></button></div></div><div class="result-content"><section class="quality-panel ${quality.issues.length ? 'needs-review' : 'quality-ok'}"><b>Pemeriksaan mutu instrumen · ${quality.issues.length ? `${quality.issues.length} hal perlu diperiksa` : 'pemeriksaan dasar lolos'}</b><ul>${quality.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}</ul>${quality.issues.length ? `<div class="quality-issues">${quality.issues.map((issue) => `<div>Perlu ditinjau: ${escapeHtml(issue)}</div>`).join('')}</div>` : ''}<small class="text-zinc-500">Ini pemeriksaan aturan dasar, bukan validasi pedagogis otomatis. Tinjau hasil sebagai guru.</small></section><section class="purpose-panel"><b>Fungsi asesmen ${escapeHtml(item.typeLabel.toLowerCase())}</b><p>${escapeHtml(purpose.purpose)}</p></section>${item.questionPackage ? `<div class="review-banner">Paket soal tertulis diimpor dari Generator Soal. Tinjau kunci/pembahasan dan petakan setiap butir ke tujuan pembelajaran yang tepat.</div>` : ''}<h4 class="text-sm font-bold text-white mt-4 mb-1">Tujuan pembelajaran</h4><textarea data-meta="objective" rows="2">${escapeHtml(item.objective)}</textarea>${item.context ? `<p class="mt-2 text-xs text-zinc-300"><b>Konteks:</b> ${escapeHtml(item.context)}</p>` : ''}${item.module ? `<p class="mt-1 text-xs text-zinc-300"><b>Sumber modul:</b> ${escapeHtml(item.module.title || 'Modul ajar')}${item.module.meeting ? ` · Pertemuan ${escapeHtml(item.module.meeting.number)}: ${escapeHtml(item.module.meeting.topic || '')}` : ''}</p>` : ''}<div class="review-banner mt-3">Tinjau kesesuaian isi, kunci/rubrik, tingkat kesulitan, dan bahasa sebelum digunakan. Status tinjauan tiap butir dapat ditandai pada kolom terakhir.</div><h4 class="text-sm font-bold text-white mt-4 mb-2">Pemetaan tujuan, butir, bukti, dan kriteria</h4><div class="table-scroll"><table class="instrument-table"><thead><tr><th>No.</th><th>Tujuan yang diukur</th><th>Indikator & tingkat kognitif</th><th>Butir / tugas</th><th>Bukti belajar</th><th>Kriteria keberhasilan</th><th>Tinjauan & tindak lanjut</th></tr></thead><tbody>${rows}</tbody></table></div><section class="followup-panel"><b>Saran tindak lanjut setelah hasil dibaca</b><p>${escapeHtml(purpose.followUp)}</p></section><p class="text-xs text-zinc-500 mt-2"><small>${item.modelUsed ? `Draf dibuat dengan ${escapeHtml(item.modelUsed)}. ` : 'Draf templat lokal. '}Periksa dan sesuaikan oleh guru sebelum digunakan.</small></p></div>`;
    $('result').querySelectorAll('[data-field]').forEach((control) => control.addEventListener('input', () => {
      const idx = Number(control.dataset.index), field = control.dataset.field; item.items[idx][field] = control.value; item.updatedAt = new Date().toISOString();
    }));
    $('result').querySelector('[data-meta="objective"]').addEventListener('input', (event) => { item.objective = event.target.value; item.updatedAt = new Date().toISOString(); });
    $('result').querySelectorAll('[data-regenerate]').forEach((button) => button.addEventListener('click', () => regenerateItem(Number(button.dataset.regenerate))));
    $('result').querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.action; syncResult();
      if (action === 'save') {
        persist(current);
        if (gasUrl() && gasToken()) saveCloud(current).then(() => notify('Instrumen tersimpan di perangkat ini dan Google Spreadsheet.')).catch((error) => notify(`Tersimpan lokal; cloud gagal: ${error.message}`));
        else notify('Instrumen disimpan di perangkat ini. Atur GAS untuk menyimpan ke cloud.');
      }
      if (action === 'json') exportJSON(current);
      if (action === 'csv') exportCSV(current);
      if (action === 'word') exportWord(current);
      if (action === 'docs') exportGoogleDocs(current);
    }));
  }
  function renderWrittenTestResult(item) {
    const purpose = item.purpose || purposeFor(item.type);
    $('result').innerHTML = `<div class="result-toolbar"><div><h3>${escapeHtml(item.typeLabel)} · Tes tertulis · ${escapeHtml(item.topic)}</h3><div class="result-content text-xs text-zinc-400">Kelas ${escapeHtml(item.grade)} · Fase ${escapeHtml(item.phase)} · ${escapeHtml(item.subject)}</div><span class="review-pill">${escapeHtml(item.reviewStatus || 'menunggu paket soal dari Generator Soal')}</span></div><div class="result-actions"><button data-action="save" class="inline-flex items-center gap-1.5"><i data-lucide="save" class="w-3.5 h-3.5 text-emerald-400"></i><span>Simpan Rencana</span></button><button data-action="word" class="inline-flex items-center gap-1.5"><i data-lucide="file-down" class="w-3.5 h-3.5 text-blue-400"></i><span>Word</span></button><button data-action="docs" class="inline-flex items-center gap-1.5"><i data-lucide="external-link" class="w-3.5 h-3.5 text-indigo-400"></i><span>Google Docs</span></button><button data-action="json" class="inline-flex items-center gap-1.5"><i data-lucide="code" class="w-3.5 h-3.5 text-violet-400"></i><span>JSON</span></button></div></div><div class="result-content"><section class="purpose-panel"><b>Rencana tes tertulis</b><p>${escapeHtml(purpose.purpose)}</p><p class="font-mono text-xs text-emerald-300 mt-2">${item.writtenTest?.count || 5} soal · Bobot ${item.writtenTest?.weightPercent ?? 100}% · ${escapeHtml(item.objective)}</p></section><div class="review-banner">Butir, kunci, dan pembahasan disusun di Generator Soal AI. Kembali setelah membuat paket, lalu impor JSON paket soal sebagai instrumen untuk menggabungkan bukti tes dengan asesmen pembelajaran.</div><button class="primary-button mt-2" data-action="open-questions"><i data-lucide="pen-tool" class="w-4 h-4"></i><span>Buka Generator Soal Kimia AI</span><i data-lucide="arrow-up-right" class="w-4 h-4"></i></button><section class="followup-panel mt-4"><b>Saran tindak lanjut</b><p>${escapeHtml(purpose.followUp)}</p></section></div>`;
    $('result').querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.action === 'save') {
        syncWrittenTest(); persist(current);
        if (gasUrl() && gasToken()) saveCloud(current).then(() => notify('Rencana tersimpan lokal dan ke Google Spreadsheet.')).catch((error) => notify(`Tersimpan lokal; cloud gagal: ${error.message}`));
        else notify('Rencana tes tertulis disimpan di perangkat ini. Atur GAS untuk sinkron cloud.');
      }
      if (button.dataset.action === 'json') { syncWrittenTest(); exportJSON(current); }
      if (button.dataset.action === 'word') { syncWrittenTest(); exportWord(current); }
      if (button.dataset.action === 'docs') { syncWrittenTest(); exportGoogleDocs(current); }
      if (button.dataset.action === 'open-questions') openQuestionGenerator();
    }));
  }
  function syncWrittenTest() {
    if (!current || current.technique !== 'Soal tertulis') return;
    current.writtenTest = { count: Math.max(1, Number($('writtenCount').value) || 5), weightPercent: Math.max(0, Math.min(100, Number($('writtenWeight').value) || 0)), generator: 'Generator-Soal-Kimia' };
    current.updatedAt = new Date().toISOString();
  }
  function openQuestionGenerator() {
    syncWrittenTest();
    const payload = {
      schema: 'portalkimia.assessment-to-questions.v1', source: 'Generator-Asesmen-AI',
      assessment: { type: current.type, grade: current.grade, phase: current.phase, subject: current.subject, topic: current.topic, objective: current.objective, questionCount: current.writtenTest.count, weightPercent: current.writtenTest.weightPercent, context: current.context }
    };
    try { localStorage.setItem('portalkimia_assessment_to_questions_v1', JSON.stringify(payload)); } catch (_) {}
    window.open('../Generator-Soal-Kimia/', '_blank', 'noopener');
    notify('Generator Soal dibuka. Jika perlu, ekspor rencana JSON untuk membawa konteks asesmen.');
  }
  async function regenerateItem(index) {
    syncResult();
    const existing = current.items[index];
    const button = $('result').querySelector('[data-regenerate="' + index + '"]');
    const provider = current.providerUsed || $('providerSelect').value;
    if (button) { button.disabled = true; button.textContent = providerName(provider) + '…'; }
    try {
      const result = await gasRequest({ action: 'generate', provider, model: $('modelSelect').value, input: {
        type: current.type, typeLabel: current.typeLabel, grade: current.grade, phase: current.phase, subject: current.subject,
        topic: current.topic, objective: existing.objective || current.objective, technique: current.technique, context: current.context,
        count: 1, instruction: 'Buat ulang hanya tugas butir ' + (index + 1) + '. Pertahankan indikator ' + existing.indicator + ' dan level ' + existing.cognitiveLevel + '. Variasikan tugas asal: ' + existing.prompt,
        moduleContext: current.module && current.module.meeting || null
      } });
      const fresh = result.instrument.items[0];
      current.items[index] = { ...fresh, no: index + 1, objective: existing.objective, indicator: existing.indicator, cognitiveLevel: existing.cognitiveLevel, teacherReview: 'belum ditinjau' };
      current.providerRequested = provider; current.providerUsed = result.provider || provider; current.modelRequested = result.requestedModel; current.modelUsed = result.modelUsed; current.fallbackUsed = result.fallbackUsed; current.tokenUsage = result.usage; current.costEstimate = result.costEstimate; current.maxOutputTokens = result.maxOutputTokens;
      notify('Butir dibuat ulang dengan ' + providerName(provider) + ' ' + result.modelUsed + '. Tinjau sebelum digunakan.');
    } catch (error) {
      const fresh = makeItems(current.type, current.items.length, current.topic, current.technique)[index];
      current.items[index] = { ...fresh, objective: existing.objective, indicator: existing.indicator, cognitiveLevel: existing.cognitiveLevel, teacherReview: 'belum ditinjau' };
      notify(providerName(provider) + ' gagal; butir lokal dibuat ulang. ' + error.message);
    }
    current.updatedAt = new Date().toISOString(); current.reviewStatus = 'perlu ditinjau guru';
    renderResult();
  }
  function syncResult() {
    if (!current) return;
    $('result').querySelectorAll('[data-field]').forEach((control) => { current.items[Number(control.dataset.index)][control.dataset.field] = control.value; });
    const obj = $('result').querySelector('[data-meta="objective"]'); if (obj) current.objective = obj.value;
  }
  function download(filename, data, type) {
    const blob = new Blob([data], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function safeName(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'instrumen'; }
  function exportJSON(item) { download(`${safeName(item.typeLabel)}-${safeName(item.topic)}.json`, JSON.stringify({ schema: 'portalkimia.assessment.v1', ...item }, null, 2), 'application/json'); }
  function documentHtml(item) {
    const purpose = item.purpose || purposeFor(item.type);
    const rows = (item.items || []).map((entry, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(entry.objective || item.objective)}</td><td>${escapeHtml(entry.indicator)}<br><small>${escapeHtml(entry.cognitiveLevel)}</small></td><td>${escapeHtml(entry.prompt)}</td><td>${escapeHtml(entry.evidence)}</td><td>${escapeHtml(entry.criteria)}</td><td>${escapeHtml(entry.recommendation)}<br><small>Status: ${escapeHtml(entry.teacherReview || 'belum ditinjau')}</small></td></tr>`).join('');
    const module = item.module ? `<p><b>Sumber modul:</b> ${escapeHtml(item.module.title || 'Modul ajar')}${item.module.meeting ? ` · Pertemuan ${escapeHtml(item.module.meeting.number)}: ${escapeHtml(item.module.meeting.topic || '')}` : ''}</p>` : '';
    const written = item.writtenTest ? `<p><b>Rencana tes tertulis:</b> ${item.writtenTest.count || 5} soal · bobot ${item.writtenTest.weightPercent ?? 100}% · paket soal dibuat melalui Generator Soal.</p>` : '';
    const table = item.items?.length ? `<h2>Pemetaan tujuan dan bukti belajar</h2><table><thead><tr><th>No.</th><th>Tujuan yang diukur</th><th>Indikator & tingkat kognitif</th><th>Butir / tugas untuk siswa</th><th>Bukti belajar</th><th>Kriteria keberhasilan / rubrik</th><th>Tinjauan & tindak lanjut</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>Instrumen ini berupa rencana tes tertulis. Butir dan kunci berada pada paket Generator Soal yang diimpor.</p>';
    const quality = item.qualityReview || reviewInstrumentQuality(item);
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(item.typeLabel)} — ${escapeHtml(item.topic)}</title><style>body{font:11pt Calibri,Arial,sans-serif;color:#222;line-height:1.45;margin:2cm}h1{font-size:19pt;margin-bottom:4pt;color:#25213b}h2{font-size:13pt;margin-top:20pt;color:#302954}p{text-align:justify;margin:5pt 0}.meta{color:#555;font-size:10pt}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:10pt 0 18pt;font-size:9pt}th,td{border:1px solid #8990a0;padding:6pt;vertical-align:top;text-align:justify;overflow-wrap:anywhere}th{background:#eae7f4;text-align:center;color:#29233f}tr{page-break-inside:avoid}small{color:#666}ul{padding-left:18pt}li{text-align:justify;margin:3pt 0}.notice{background:#f5f2fc;border-left:3px solid #7d6ab1;padding:8pt 10pt}</style></head><body><h1>Instrumen Asesmen ${escapeHtml(item.typeLabel)}</h1><p class="meta"><b>${escapeHtml(item.subject)}</b> · Kelas ${escapeHtml(item.grade)} · Fase ${escapeHtml(item.phase)} · Topik: ${escapeHtml(item.topic)}</p><p class="meta">Teknik: ${escapeHtml(item.technique)} · Status: ${escapeHtml(item.reviewStatus || 'perlu ditinjau guru')}</p>${module}<h2>Tujuan pembelajaran</h2><p>${escapeHtml(item.objective)}</p><h2>Fungsi asesmen</h2><p>${escapeHtml(purpose.purpose || '')}</p>${item.context ? `<h2>Konteks kelas</h2><p>${escapeHtml(item.context)}</p>` : ''}${written}${table}<h2>Tindak lanjut</h2><p>${escapeHtml(purpose.followUp || '')}</p>${quality ? `<h2>Catatan pemeriksaan mutu</h2><ul>${quality.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}${quality.issues.map((issue) => `<li>Perlu ditinjau: ${escapeHtml(issue)}</li>`).join('')}</ul>` : ''}<p class="meta"><small>Dokumen draf untuk ditinjau dan disesuaikan oleh guru sebelum digunakan.</small></p></body></html>`;
  }
  function exportGoogleDocs(item) {
    const html = documentHtml(item);
    const opened = window.open('https://docs.google.com/document/u/0/create', '_blank', 'noopener');
    download(`${safeName(item.typeLabel)}-${safeName(item.topic)}-Google-Docs.html`, html, 'text/html;charset=utf-8');
    notify(opened ? 'Google Docs dibuka dan file HTML rapi diunduh. Unggah melalui File → Open untuk mempertahankan tabel dan justify.' : 'Popup Google Docs diblokir. File HTML tetap diunduh; unggah melalui Google Docs → File → Open.');
  }
  function exportWord(item) {
    const html = documentHtml(item).replace('<head>', '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
    const wordHtml = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><title>${escapeHtml(item.typeLabel)} — ${escapeHtml(item.topic)}</title></head><body>${html.split('<body>')[1].split('</body>')[0]}</body></html>`;
    download(`${safeName(item.typeLabel)}-${safeName(item.topic)}.doc`, wordHtml, 'application/msword;charset=utf-8');
    notify('Dokumen Word diunduh dengan tabel dan paragraf justify. Buka di Word lalu simpan sebagai .docx bila diperlukan.');
  }
  function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
  function exportCSV(item) {
    const rows = [['Jenis asesmen', item.typeLabel], ['Mata pelajaran', item.subject], ['Kelas', item.grade], ['Fase', item.phase], ['Topik', item.topic], ['Tujuan', item.objective], ['Tujuan penggunaan', item.purpose?.purpose || purposeFor(item.type).purpose], ['Saran tindak lanjut', item.purpose?.followUp || purposeFor(item.type).followUp], [], ['No.', 'Tujuan yang diukur', 'Indikator', 'Tingkat kognitif', 'Butir / tugas', 'Bukti belajar', 'Kriteria keberhasilan', 'Tinjauan guru', 'Rekomendasi tindak lanjut']];
    item.items.forEach((it) => rows.push([it.no, it.objective, it.indicator, it.cognitiveLevel, it.prompt, it.evidence, it.criteria, it.teacherReview || 'belum ditinjau', it.recommendation || '']));
    download(`${safeName(item.typeLabel)}-${safeName(item.topic)}.csv`, '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  function renderSaved() {
    const list = readSaved();
    $('savedList').innerHTML = list.length ? list.slice(0, 5).map((item) => `<article class="saved-item"><span class="type-icon ${item.type === 'formatif' ? 'formative' : item.type === 'sumatif' ? 'summative' : 'diagnostic'}">${item.type === 'sumatif' ? '<i data-lucide="award" class="w-4 h-4"></i>' : item.type === 'formatif' ? '<i data-lucide="activity" class="w-4 h-4"></i>' : '<i data-lucide="search" class="w-4 h-4"></i>'}</span><div><b>${escapeHtml(item.typeLabel || labels[item.type] || 'Asesmen')} · ${escapeHtml(item.topic)}</b><small>Kelas ${escapeHtml(item.grade)} · ${item.items?.length || 0} butir · diperbarui ${dateLabel(item.updatedAt || item.createdAt)}</small></div><div class="item-actions"><button data-open="${escapeHtml(item.id)}" class="inline-flex items-center gap-1.5"><i data-lucide="folder-open" class="w-3.5 h-3.5 text-violet-400"></i><span>Buka</span></button><button data-export="${escapeHtml(item.id)}" class="inline-flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i><span>JSON</span></button></div></article>`).join('') : '<div class="empty-state">Belum ada instrumen tersimpan. Mulai dari salah satu jenis asesmen di atas.</div>';
    $('savedList').querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => {
      current = readSaved().find((entry) => entry.id === button.dataset.open); if (!current) return;
      $('assessmentType').value = current.type; $('grade').value = current.grade; $('phase').value = current.phase;
      $('subject').value = current.subject; $('topic').value = current.topic; $('objective').value = current.objective;
      $('technique').value = current.technique; $('context').value = current.context || ''; $('itemCount').value = current.items.length;
      if (current.modelRequested) $('modelSelect').value = current.modelRequested;
      if (current.providerRequested || current.providerUsed) $('providerSelect').value = current.providerRequested || current.providerUsed;
      updateProviderUI();
      showBuilder(current.type); renderResult(); $('result').classList.remove('hidden');
    }));
    $('savedList').querySelectorAll('[data-export]').forEach((button) => button.addEventListener('click', () => { const item = readSaved().find((entry) => entry.id === button.dataset.export); if (item) exportJSON(item); }));
  }
  function textValue(value) {
    if (value == null) return '';
    if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join('\n');
    if (typeof value === 'object') return Object.entries(value).map(([key, val]) => `${key}: ${textValue(val)}`).join('\n');
    return String(value).trim();
  }
  function firstValue(...values) { for (const value of values) { const out = textValue(value); if (out) return out; } return ''; }
  function normalizeModule(raw) {
    const data = raw.module || raw.modul || raw.data?.module || raw.data?.modul || raw.data || raw;
    const meetings = [];
    if (Array.isArray(data.pertemuan)) data.pertemuan.forEach((meeting, index) => meetings.push({
      number: index + 1, topic: firstValue(meeting.subTopik, meeting.subtopik, meeting.topik, meeting.topic),
      itp: firstValue(meeting.itp, meeting.tujuan, meeting.objective),
      assessment: firstValue(meeting.asesmen, meeting.assessment),
      activity: firstValue(meeting.aktivitas, meeting.activity, meeting.kegiatan),
      detail: meeting
    }));
    const entries = Object.entries(data);
    const meetingNumbers = new Set(entries.map(([key]) => { const match = key.match(/^(?:itp|asesmen|aktivitas|subTopik)(\d+)$/i); return match ? Number(match[1]) : 0; }).filter(Boolean));
    [...meetingNumbers].sort((a, b) => a - b).forEach((number) => meetings.push({
      number, topic: firstValue(data[`subTopik${number}`], data[`subtopik${number}`]),
      itp: firstValue(data[`itp${number}`]), assessment: firstValue(data[`asesmen${number}`]),
      activity: firstValue(data[`aktivitas${number}`]), detail: data
    }));
    const uniqueMeetings = [...new Map(meetings.map((meeting) => [meeting.number, meeting])).values()].sort((a, b) => a.number - b.number);
    const result = {
      title: firstValue(data.judul, data.namaModul, data.title, data.topik, data.aiTopik, data.topikMateri, data.materi),
      grade: firstValue(data.kelas, data.grade, data.aiKelas),
      subject: firstValue(data.mataPelajaran, data.mapel, data.subject) || 'Kimia',
      phase: firstValue(data.fase, data.phase),
      topic: firstValue(data.topik, data.aiTopik, data.topikMateri, data.materi, data.title),
      objective: firstValue(data.tujuan, data.tujuanPembelajaran, data.objectives, data.learningObjectives),
      meetings: uniqueMeetings,
      raw: data
    };
    if (!result.objective && uniqueMeetings.length) result.objective = uniqueMeetings.map((meeting) => meeting.itp).filter(Boolean).join('\n');
    if (!result.topic && uniqueMeetings.length) result.topic = uniqueMeetings.map((meeting) => meeting.topic).filter(Boolean).join(', ');
    return result;
  }
  function normalizeQuestionPackage(raw) {
    const pkg = raw.package || raw.questionPackage || raw.data?.package || raw;
    const assessmentPlan = raw.assessment || raw.handoff?.assessment || null;
    const questions = pkg.daftar_soal || pkg.questions || pkg.items;
    if (!Array.isArray(questions) || !questions.length) return null;
    const importedQuestions = questions.map((question, index) => ({
      no: index + 1,
      objective: textValue(question.cp_tp || question.tujuan || question.objective) || 'Tujuan pembelajaran perlu ditinjau dan dipetakan guru.',
      indicator: textValue(question.indikator_soal || question.indikator || question.indicator || question.topik) || 'Indikator dari paket Generator Soal',
      cognitiveLevel: textValue(question.level_kognitif || question.tingkat_kesulitan || question.cognitiveLevel || question.level) || 'Perlu ditinjau',
      prompt: textValue(question.pertanyaan || question.soal || question.question || question.text),
      evidence: textValue(question.kunci_jawaban || question.kunci || question.answer || question.jawaban)
        ? `Respons tertulis; kunci: ${textValue(question.kunci_jawaban || question.kunci || question.answer || question.jawaban)}` : 'Respons tertulis siswa',
      criteria: textValue(question.pembahasan_langkah || question.pembahasan || question.rubrik || question.explanation || question.rationale) || 'Tinjau kunci jawaban dan tetapkan kriteria penskoran.',
      technique: 'Tes tertulis', teacherReview: 'belum ditinjau', recommendation: 'Gunakan capaian per tujuan untuk menentukan penguatan atau pengayaan.'
    }));
    const title = textValue(pkg.judul || pkg.title);
    const topic = textValue(pkg.topik_utama || pkg.topik || pkg.topic || title || assessmentPlan?.topic || 'Paket soal tertulis');
    const gradeText = textValue(pkg.jenjang || pkg.kelas || pkg.grade || assessmentPlan?.grade || 'XI');
    const grade = gradeText.match(/XII|XI|X/i)?.[0]?.toUpperCase() || 'XI';
    const phase = textValue(pkg.fase || assessmentPlan?.phase || (grade === 'X' ? 'E' : 'F')).match(/[EF]/i)?.[0]?.toUpperCase() || 'F';
    return {
      id: newId(), type: assessmentPlan?.type || 'sumatif', typeLabel: labels[assessmentPlan?.type] || 'Sumatif', grade: assessmentPlan?.grade || grade, phase: assessmentPlan?.phase || phase, subject: assessmentPlan?.subject || textValue(pkg.mapel || pkg.mata_pelajaran) || 'Kimia',
      topic,
      objective: assessmentPlan?.objective || 'Petakan setiap butir ke tujuan pembelajaran yang sesuai sebelum menggunakan hasilnya.',
      technique: 'Soal tertulis', context: 'Diimpor dari Generator Soal Kimia AI.',
      purpose: purposeFor('sumatif'), reviewStatus: 'butir diimpor; menunggu tinjauan guru',
      writtenTest: { count: importedQuestions.length, weightPercent: assessmentPlan?.weightPercent ?? 100, generator: 'Generator-Soal-Kimia' },
      questionPackage: { title: textValue(pkg.judul || pkg.title), source: 'Generator-Soal-Kimia' },
      items: importedQuestions.map((question) => ({ ...question, objective: assessmentPlan?.objective || question.objective })),
      grade, phase,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'question-generator-import'
    };
  }
  function openQuestionGenerator() {
    syncWrittenTest();
    const payload = {
      schema: 'portalkimia.assessment-to-questions.v1', source: 'Generator-Asesmen-AI',
      assessment: { type: current.type, grade: current.grade, phase: current.phase, subject: current.subject, topic: current.topic, objective: current.objective, questionCount: current.writtenTest.count, weightPercent: current.writtenTest.weightPercent, context: current.context }
    };
    current.questionHandoff = payload;
    download(`${safeName(current.typeLabel)}-${safeName(current.topic)}-rencana-soal.json`, JSON.stringify(payload, null, 2), 'application/json');
    window.open('../Generator-Soal-Kimia/', '_blank', 'noopener');
    notify('Rencana asesmen diunduh untuk referensi; masukkan topik dan tujuan ke Generator Soal, lalu impor paket JSON hasilnya kembali.');
  }
  function importModuleData(data) {
    moduleData = normalizeModule(data);
    if (!moduleData.topic && !moduleData.objective && !moduleData.meetings.length) throw new Error('Berkas tidak berisi topik, tujuan pembelajaran, atau data pertemuan modul yang dikenali.');
    const meetings = moduleData.meetings;
    $('meetingWrap').classList.toggle('hidden', !meetings.length);
    $('moduleAssessmentWrap').classList.toggle('hidden', !meetings.length);
    $('moduleBadge').classList.remove('hidden');
    if (meetings.length) {
      $('meetingSelect').innerHTML = meetings.map((meeting) => `<option value="${meeting.number}">Pertemuan ${meeting.number}${meeting.topic ? ` · ${escapeHtml(meeting.topic)}` : ''}</option>`).join('');
      updateMeetingFields();
    } else {
      $('moduleAssessment').value = '';
      $('moduleActivities').value = '';
    }
    if (moduleData.grade) {
      const grade = moduleData.grade.match(/XII|XI|X/i)?.[0]?.toUpperCase(); if (grade) $('grade').value = grade;
    }
    if (moduleData.phase) { const phase = moduleData.phase.match(/[EF]/i)?.[0]?.toUpperCase(); if (phase) $('phase').value = phase; }
    $('subject').value = moduleData.subject; $('topic').value = moduleData.topic;
    $('objective').value = moduleData.objective;
    const summary = `Diimpor dari modul ajar${moduleData.title ? `: ${moduleData.title}` : ''}.`;
    $('context').value = [$('context').value.trim(), summary].filter(Boolean).join('\n');
    showBuilder('diagnostik'); notify('Data modul ajar sudah mengisi formulir asesmen.');
  }
  function updateMeetingFields() {
    if (!moduleData?.meetings?.length) return;
    const meeting = moduleData.meetings.find((item) => String(item.number) === $('meetingSelect').value) || moduleData.meetings[0];
    moduleData.selectedMeeting = meeting;
    $('moduleAssessment').value = meeting.assessment;
    $('moduleActivities').value = meeting.activity;
    if (meeting.itp) $('objective').value = meeting.itp;
    if (meeting.topic) $('topic').value = meeting.topic;
  }
  document.querySelectorAll('.assessment-card').forEach((button) => button.addEventListener('click', () => showBuilder(button.dataset.type)));
  $('assessmentType').addEventListener('change', () => { $('builderTitle').textContent = `Rancang asesmen ${labels[$('assessmentType').value].toLowerCase()}`; });
  $('technique').addEventListener('change', () => {
    const written = $('technique').value === 'Soal tertulis';
    $('writtenTestNotice').classList.toggle('hidden', !written);
    $('techniqueWrap').classList.toggle('hidden', written);
    $('generate').textContent = written ? 'Buat rencana tes ' : 'Susun instrumen ';
    const arrow = document.createElement('span'); arrow.textContent = written ? '↗' : '→'; $('generate').appendChild(arrow);
  });
  $('closeBuilder').addEventListener('click', () => $('builder').classList.add('hidden'));
  $('generate').addEventListener('click', generate);
  $('importButton').addEventListener('click', () => $('importFile').click());
  $('openQuestionGenerator').addEventListener('click', () => {
    const type = $('assessmentType').value;
    current = { type, typeLabel: labels[type], grade: $('grade').value, phase: $('phase').value, subject: $('subject').value || 'Kimia', topic: $('topic').value || 'Materi pembelajaran', objective: $('objective').value || objectiveSeed(type, $('topic').value), technique: 'Soal tertulis', context: $('context').value, writtenTest: { count: Number($('writtenCount').value) || 5, weightPercent: Number($('writtenWeight').value) || 100 } };
    if (current.topic && $('topic').value.trim()) openQuestionGenerator();
    else { $('technique').value = 'Soal tertulis'; $('technique').dispatchEvent(new Event('change')); notify('Pilih jenis asesmen dan lengkapi konteks sebelum membuka Generator Soal.'); }
  });
  $('launchQuestionBuilder').addEventListener('click', () => {
    if (!current || current.technique !== 'Soal tertulis') {
      const type = $('assessmentType').value;
      current = { type, typeLabel: labels[type], grade: $('grade').value, phase: $('phase').value, subject: $('subject').value || 'Kimia', topic: $('topic').value || 'Materi pembelajaran', objective: $('objective').value || objectiveSeed(type, $('topic').value), technique: 'Soal tertulis', context: $('context').value, writtenTest: { count: Number($('writtenCount').value) || 5, weightPercent: Number($('writtenWeight').value) || 100 } };
    }
    openQuestionGenerator();
  });
  $('importModuleButton').addEventListener('click', () => $('moduleFile').click());
  $('meetingSelect').addEventListener('change', updateMeetingFields);
  $('moduleFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { importModuleData(JSON.parse(await file.text())); }
    catch (error) { notify(error.message || 'Berkas modul tidak dapat dibaca.'); }
    event.target.value = '';
  });
  initCloudSettings();
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      if (raw.schema === 'portalkimia.assessment-to-questions.v1') {
        const handoff = raw.assessment;
        $('assessmentType').value = ['diagnostik','formatif','sumatif'].includes(handoff.type) ? handoff.type : 'sumatif';
        $('grade').value = handoff.grade || 'X'; $('phase').value = handoff.phase || 'E'; $('subject').value = handoff.subject || 'Kimia';
        $('topic').value = handoff.topic || ''; $('objective').value = handoff.objective || ''; $('context').value = handoff.context || '';
        $('questionHandoffNotice').classList.remove('hidden');
        showBuilder(handoff.type || 'sumatif'); notify('Rencana asesmen dimuat. Salin konteks ke Generator Soal saat menyusun paket.');
        event.target.value = ''; return;
      }
      const item = raw.items ? raw : raw.instrument || raw.data;
      const questionItem = normalizeQuestionPackage(raw);
      if (questionItem?.source === 'question-generator-import') {
        const handoff = raw.assessment || raw.handoff || null;
        if (handoff?.assessment) questionItem.questionHandoff = handoff;
      }
      const imported = item && Array.isArray(item.items) && ['diagnostik', 'formatif', 'sumatif'].includes(item.type) ? item : questionItem;
      if (!imported) throw new Error('Format instrumen atau paket soal tidak dikenali. Ekspor JSON dari Generator Soal lalu pilih berkas tersebut.');
      current = { ...imported, id: newId(), typeLabel: labels[imported.type], updatedAt: new Date().toISOString() };
      persist(current); $('assessmentType').value = current.type; $('grade').value = current.grade || 'X'; $('phase').value = current.phase || 'E';
      $('subject').value = current.subject || 'Kimia'; $('topic').value = current.topic || ''; $('objective').value = current.objective || '';
      $('technique').value = current.technique || 'Tes tertulis'; $('context').value = current.context || ''; $('itemCount').value = current.items.length;
      showBuilder(current.type); renderResult(); $('result').classList.remove('hidden'); notify('Instrumen berhasil diimpor.');
    } catch (error) { notify(error.message || 'Berkas tidak dapat dibaca.'); }
    event.target.value = '';
  });
  document.querySelectorAll('[data-link]').forEach((button) => button.addEventListener('click', () => {
    const target = button.dataset.link === 'module' ? '../Generator Modul Ajar/' : '../Generator-Soal-Kimia/';
    const message = `Tautan relatif: ${target} — pemindahan otomatis data asesmen belum disambungkan.`;
    notify(message);
  }));
  renderSaved();
})();
