/*
 * Opsional: tambahkan script ini pada Generator Modul Ajar setelah app siap.
 * Tombol mengunduh draf yang sedang aktif sebagai JSON portabel untuk Generator Asesmen.
 * Tidak mengubah proses generate atau penyimpanan draf modul.
 */
(() => {
  const addExportButton = () => {
    if (document.getElementById('exportAssessmentModule')) return;
    const draft = document.getElementById('formModul');
    if (!draft) return;
    const button = document.createElement('button');
    button.id = 'exportAssessmentModule';
    button.type = 'button';
    button.textContent = 'Ekspor data untuk Generator Asesmen';
    button.className = 'btn btn-outline-success btn-sm';
    button.style.cssText = 'margin:8px 0;';
    button.addEventListener('click', () => {
      let data = {};
      try { data = JSON.parse(localStorage.getItem('draftModulKimia') || '{}'); } catch (_) {}
      const formData = new FormData(draft);
      for (const [key, value] of formData.entries()) if (value) data[key] = value;
      data.aiKelas = document.getElementById('aiKelas')?.value || data.aiKelas || '';
      data.aiTopik = document.getElementById('aiTopik')?.value || data.aiTopik || '';
      data.aiPertemuan = document.getElementById('aiPertemuan')?.value || data.aiPertemuan || '';
      data.judul = data.aiTopik || data.judul || 'Modul ajar';
      const payload = { schema: 'portalkimia.module.v1', exportedAt: new Date().toISOString(), module: data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `modul-ajar-${String(data.aiTopik || 'portalkimia').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const submitButton = draft.querySelector('button[type="submit"]');
    if (submitButton?.parentElement) submitButton.parentElement.appendChild(button);
    else draft.appendChild(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addExportButton, { once: true });
  else addExportButton();
})();
