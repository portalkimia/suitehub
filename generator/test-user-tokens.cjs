const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');

const root = __dirname;
const gasPath = fs.existsSync(path.join(root, 'Code.gs')) ? path.join(root, 'Code.gs') : path.join(root, '..', 'backup', 'generator', 'Code.gs');
const gas = fs.readFileSync(gasPath, 'utf8').replace(/\r\n/g, '\n');

function createHarness() {
  const props = new Map([
    ['GENERATOR_ACCESS_TOKEN', 'master-tito-secret'],
    ['GEMINI_API_KEY', 'test-gemini-key'],
    ['DEEPSEEK_API_KEY', 'test-deepseek-key']
  ]);
  const cache = new Map();
  let lockHeld = false;

  const context = {
    console, Date, Math, String, Number, Array, Object, JSON, RegExp, Error, isNaN, Boolean,
    Session: {
      getActiveUser: () => ({ getEmail: () => 'tito@example.test' }),
      getEffectiveUser: () => ({ getEmail: () => 'tito@example.test' })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => props.get(k) || null,
        setProperty: (k, v) => { props.set(k, String(v)); }
      })
    },
    CacheService: {
      getScriptCache: () => ({
        get: k => cache.get(k),
        put: (k, v) => cache.set(k, v)
      })
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (lockHeld) return false;
          lockHeld = true;
          return true;
        },
        releaseLock: () => { lockHeld = false; },
        hasLock: () => lockHeld
      })
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (a, b) => [...crypto.createHash('sha256').update(b).digest()],
      base64Decode: s => [...Buffer.from(s, 'base64')],
      getUuid: () => crypto.randomUUID(),
      sleep: () => {}
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  tujuan: "Murid mampu memahami elektrokimia",
                  itp1: "Memahami sel volta",
                  asesmen1: "LKPD simulasi virtual",
                  aktivitas1: "Praktikum virtual",
                  subTopik1: "Sel Volta",
                  ayat1: "q55-9",
                  zona1: "Teka-teki silang",
                  awal1: "Pendidik memastikan kerapian seragam dan berdoa",
                  memahami1: "Murid menyimak penjelasan",
                  mengaplikasi1: "Murid menguji larutan",
                  merefleksi1: "Murid menarik simpulan",
                  penutup1: "Pendidik menyampaikan rencana pertemuan berikutnya dan berdoa kafaratul majlis"
                })
              }
            }]
          })
        };
      }
    },
    Logger: { log: (msg) => console.log('GAS LOG: ' + String(msg).slice(0, 100)) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: text => ({ text, setMimeType() { return this; } })
    }
  };

  vm.createContext(context);
  vm.runInContext(gas, context);
  return { context, props };
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

// TEST 1: Master Token verification
test('Master Token has unlimited access', () => {
  const { context } = createHarness();
  assert.equal(context.isMasterToken_('master-tito-secret'), true);
  assert.equal(context.isMasterToken_('wrong-token'), false);
  assert.equal(context.pesanAksesTidakSah_('master-tito-secret'), '');
  const info = context.infoAksesToken_('master-tito-secret');
  assert.equal(info.valid, true);
  assert.equal(info.peran, 'master');
  assert.equal(info.saldo, 'Unlimited');
});

// TEST 2: Create colleague accounts
test('Tambah akun guru creates tokens with quota balance', () => {
  const { context } = createHarness();
  const accBudi = context.tambahAkunGuru('Pak Budi', 3);
  assert.equal(accBudi.status, 'ok');
  assert.equal(accBudi.nama, 'Pak Budi');
  assert.equal(accBudi.saldo, 3);
  assert.ok(accBudi.token.startsWith('TK-PAKBUDI-'));

  const accSiti = context.tambahAkunGuru('Bu Siti', 5, 'SITI-KIMIA-2026');
  assert.equal(accSiti.token, 'SITI-KIMIA-2026');
  assert.equal(accSiti.saldo, 5);

  assert.equal(context.pesanAksesTidakSah_(accBudi.token), '');
  assert.equal(context.pesanAksesTidakSah_(accSiti.token), '');
  assert.equal(context.pesanAksesTidakSah_('random-fake-token'), 'Akses ditolak. Token guru tidak valid.');

  const infoBudi = context.infoAksesToken_(accBudi.token);
  assert.equal(infoBudi.valid, true);
  assert.equal(infoBudi.peran, 'guru');
  assert.equal(infoBudi.saldo, 3);
});

// TEST 3: Quota deduction & blocking when exhausted
test('Quota is deducted on generate and blocks with exact error when 0', () => {
  const { context } = createHarness();
  const acc = context.tambahAkunGuru('Pak Joko', 2);
  const token = acc.token;

  // Initial check: saldo 2
  assert.doesNotThrow(() => context.praPeriksaKuota_(token, 'deepseek'));
  
  // First generate: deduct 1 -> saldo 1
  context.pascaKurangiKuota_(token, 'deepseek');
  assert.equal(context.cariAkunByToken_(token).saldo, 1);
  assert.equal(context.cariAkunByToken_(token).terpakai, 1);

  // Second generate: deduct 1 -> saldo 0
  assert.doesNotThrow(() => context.praPeriksaKuota_(token, 'deepseek'));
  context.pascaKurangiKuota_(token, 'deepseek');
  assert.equal(context.cariAkunByToken_(token).saldo, 0);
  assert.equal(context.cariAkunByToken_(token).terpakai, 2);

  // Third attempt: saldo is 0 -> MUST throw exact error message!
  assert.throws(
    () => context.praPeriksaKuota_(token, 'deepseek'),
    /Token Penggunaan AI Berbayar anda habis, hubungi U Tito/
  );

  // In panggilGemini: should return error object with exact error
  const reqData = {
    topik: 'Elektrokimia',
    kelas: '12',
    pertemuan: 1,
    jenisDokumen: 'Modul Ajar',
    aiProvider: 'deepseek'
  };
  const resStr = context.panggilGemini(reqData, token);
  const res = JSON.parse(resStr);
  assert.equal(res.error, 'Token Penggunaan AI Berbayar anda habis, hubungi U Tito');
});

// TEST 4: Admin functions (tambah, kurangi, atur, lihat, hapus)
test('Admin management functions modify balances correctly', () => {
  const { context } = createHarness();
  context.tambahAkunGuru('Pak Budi', 5);

  // Tambah saldo +5 -> 10
  const t = context.tambahSaldoGuru('Pak Budi', 5);
  assert.equal(t.saldoBaru, 10);

  // Kurangi saldo -3 -> 7
  const k = context.kurangiSaldoGuru('Pak Budi', 3);
  assert.equal(k.saldoBaru, 7);

  // Atur saldo exact 15
  const a = context.aturSaldoGuru('Pak Budi', 15);
  assert.equal(a.saldoBaru, 15);

  // Lihat semua akun
  const list = context.lihatSemuaAkunGuru();
  assert.equal(list.length, 1);
  assert.equal(list[0].nama, 'Pak Budi');
  assert.equal(list[0].saldo, 15);

  // Hapus akun
  const h = context.hapusAkunGuru('Pak Budi');
  assert.equal(h.status, 'ok');
  assert.equal(context.lihatSemuaAkunGuru().length, 0);
});

// TEST 5: doPost HTTP API integration
test('doPost handles ping and admin actions with role enforcement', () => {
  const { context } = createHarness();
  const acc = context.tambahAkunGuru('Bu Dewi', 4);

  // Ping with Master Token
  const pingMaster = JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({ action: 'ping', accessToken: 'master-tito-secret' }) }
  }).text);
  assert.equal(pingMaster.status, 'ok');
  assert.equal(pingMaster.peran, 'master');
  assert.equal(pingMaster.saldo, 'Unlimited');

  // Ping with Guru Token
  const pingGuru = JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({ action: 'ping', accessToken: acc.token }) }
  }).text);
  assert.equal(pingGuru.status, 'ok');
  assert.equal(pingGuru.peran, 'guru');
  assert.equal(pingGuru.nama, 'Bu Dewi');
  assert.equal(pingGuru.saldo, 4);

  // Admin action with Master Token succeeds
  const adminAdd = JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({
      action: 'adminTambahAkun',
      accessToken: 'master-tito-secret',
      nama: 'Pak Hendra',
      saldoAwal: 8
    }) }
  }).text);
  assert.equal(adminAdd.status, 'ok');
  assert.equal(adminAdd.nama, 'Pak Hendra');
  assert.equal(adminAdd.saldo, 8);

  // Admin action with Guru Token is REJECTED
  const adminDeny = JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({
      action: 'adminTambahAkun',
      accessToken: acc.token,
      nama: 'Hacker',
      saldoAwal: 100
    }) }
  }).text);
  assert.equal(adminDeny.code, 'FORBIDDEN');
});

// TEST 6: ITP & Formatif Consolidation (TEPAT 2 BARIS FORMATIF: LKPD & KUIS)
test('ITP & Asesmen: Baris 1 memuat Diagnostik Awal, Baris 2 dst memuat Formatif seluruh media tanpa memotong baris kosong', () => {
  const { context } = createHarness();
  
  // Kasus 1: Output mentah AI yang memecah 5 baris formatif (1a s.d. 1d LKPD, 2a Kuis)
  const fragmentedAI = {
    topik: 'Korosi Logam dan Pencegahannya',
    tujuan: 'Murid mampu menganalisis proses korosi...',
    itp1: 'Menganalisis fenomena korosi pada paku besi dalam berbagai medium',
    asesmen1: 'Formatif 1a (LKPD): Pengamatan dan pencatatan hasil simulasi',
    aktivitas1: 'Pengamatan virtual dan pengisian tabel korosi (20 menit)',
    itp2: 'Mengidentifikasi faktor-faktor yang mempercepat korosi',
    asesmen2: 'Formatif 1b (LKPD): Analisis data hasil simulasi',
    aktivitas2: 'Diskusi kelompok menganalisis data tabel (15 menit)',
    itp3: 'Menjelaskan mekanisme reaksi redoks perkaratan besi',
    asesmen3: 'Formatif 1c (LKPD): Penjelasan reaksi redoks',
    aktivitas3: 'Diskusi reaksi redoks korosi (20 menit)',
    itp4: 'Merumuskan cara pencegahan korosi',
    asesmen4: 'Formatif 1d (LKPD): Solusi pencegahan',
    aktivitas4: 'Penentuan metode pencegahan (15 menit)',
    itp5: 'Menyelesaikan kuis evaluasi interaktif pada media PortalKimia',
    asesmen5: 'Formatif 2a (Kuis): Skor kuis evaluasi interaktif media',
    aktivitas5: 'Pengerjaan kuis interaktif mandiri pada media (20 menit)',
    subTopik1: 'Korosi', ayat1: 'q55-9', zona1: 'Fun game', awal1: 'Murid bersiap',
    memahami1: 'Murid memahami', mengaplikasi1: 'Murid mengaplikasi', merefleksi1: 'Murid merefleksi', penutup1: 'Simpulan',
    listAsesmen: '1. Diagnostik awal\n2. Formatif 1 (LKPD)\n3. Lembar observasi sikap dan keaktifan\n4. Formatif 2 (Kuis)'
  };

  const rawJson = JSON.stringify(fragmentedAI);
  const normalizedStr = context.harmonisasiOutputAI_(rawJson, 1);
  const normalized = JSON.parse(normalizedStr);

  // 1. Baris 1: WAJIB Asesmen Diagnostik Awal
  assert.ok(/diagnostik/i.test(normalized.asesmen1), 'asesmen1 harus berupa Asesmen Diagnostik Awal');
  assert.ok(/prasyarat|diagnostik|kesiapan/i.test(normalized.itp1), 'itp1 harus memuat indikator prasyarat');
  assert.ok(/prasyarat|diagnostik/i.test(normalized.aktivitas1), 'aktivitas1 harus memuat aktivitas diagnostik awal');

  // 2. Baris 2: Formatif 1 (LKPD) - Bersih dari embel-embel 1a
  assert.ok(normalized.asesmen2.startsWith('Formatif 1'), 'asesmen2 harus Formatif 1');
  assert.ok(!normalized.asesmen2.includes('Formatif 1a'), 'asesmen2 bersih dari 1a');

  // 3. Baris 3: Formatif 2 (Kuis) - Otomatis mengambil baris kuis dan bersih dari 2a
  assert.ok(normalized.asesmen3.startsWith('Formatif 2'), 'asesmen3 harus Formatif 2');
  assert.ok(!normalized.asesmen3.includes('Formatif 2a'), 'asesmen3 bersih dari 2a');
  assert.ok(/kuis/i.test(normalized.itp3), 'itp3 memuat indikator kuis');
  assert.ok(/kuis/i.test(normalized.aktivitas3), 'aktivitas3 memuat aktivitas kuis');

  // 4. Baris 4 s.d. 14: WAJIB KOSONG STRING "" (tanpa menghapus baris tabel di Google Docs)
  for (let r = 4; r <= 14; r++) {
    assert.equal(normalized['itp' + r], '', 'itp' + r + ' harus kosong');
    assert.equal(normalized['asesmen' + r], '', 'asesmen' + r + ' harus kosong');
    assert.equal(normalized['aktivitas' + r], '', 'aktivitas' + r + ' harus kosong');
  }

  // 5. Observasi terhapus dari listAsesmen dan memuat Diagnostik Awal
  assert.ok(!/observasi/i.test(normalized.listAsesmen));
  assert.ok(/diagnostik/i.test(normalized.listAsesmen));
  assert.ok(/diagnostik|prasyarat/i.test(normalized.awal1));

  // KASUS 2: Media hanya memuat 1 tugas (misal hanya LKPD, tanpa kuis) -> TEPAT 1 FORMATIF
  const singleTaskAI = {
    topik: 'Larutan Elektrolit',
    tujuan: 'Murid mampu menganalisis daya hantar...',
    itp1: 'Menyelidiki daya hantar listrik larutan melalui simulator',
    asesmen1: 'Formatif 1: Pengisian lembar kerja data uji daya hantar',
    aktivitas1: 'Simulasi uji larutan dan pencatatan tabel data (30 menit)',
    subTopik1: 'Elektrolit', ayat1: 'q55-9', zona1: 'Fun game', awal1: 'Murid bersiap',
    memahami1: 'Murid memahami', mengaplikasi1: 'Murid mengaplikasi', merefleksi1: 'Murid merefleksi', penutup1: 'Simpulan',
    listAsesmen: 'Formatif: Pengisian LKPD'
  };

  const normSingle = JSON.parse(context.harmonisasiOutputAI_(JSON.stringify(singleTaskAI), 1));
  // Baris 1: Diagnostik Awal
  assert.ok(/diagnostik/i.test(normSingle.asesmen1));
  // Baris 2: Formatif 1
  assert.ok(normSingle.asesmen2.startsWith('Formatif 1'));
  // Baris 3 sampai 14 WAJIB kosong jika hanya 1 tugas
  for (let r = 3; r <= 14; r++) {
    assert.equal(normSingle['itp' + r], '', 'Baris ' + r + ' harus kosong pada 1 tugas');
    assert.equal(normSingle['asesmen' + r], '', 'Asesmen ' + r + ' harus kosong pada 1 tugas');
    assert.equal(normSingle['aktivitas' + r], '', 'Aktivitas ' + r + ' harus kosong pada 1 tugas');
  }
  assert.ok(/diagnostik/i.test(normSingle.listAsesmen));
  assert.ok(/diagnostik|prasyarat/i.test(normSingle.awal1));

  // KASUS 3: Guru menampilkan 2 Media (Media 1 & Media 2 masing-masing memuat tugas LKPD & Kuis) -> 4 FORMATIF MUNCUL
  const multiMediaAI = {
    topik: 'Reaksi Redoks dan Elektrokimia',
    tujuan: 'Murid mampu menganalisis reaksi redoks dan sel elektrokimia...',
    itp1: 'Mengidentifikasi konsep prasyarat bilangan oksidasi',
    asesmen1: 'Diagnostik Awal: Tanya-jawab terstruktur materi prasyarat',
    aktivitas1: 'Review materi prasyarat (10 menit)',
    itp2: 'Menganalisis reaksi redoks spontan pada simulasi Media 1',
    asesmen2: 'Formatif 1 (LKPD): Pengisian tabel pengamatan reaksi redoks Media 1',
    aktivitas2: 'Eksplorasi simulator Media 1 (30 menit)',
    itp3: 'Mengevaluasi pemahaman konsep redoks Media 1',
    asesmen3: 'Formatif 2 (Kuis): Skor kuis interaktif Media 1',
    aktivitas3: 'Pengerjaan kuis Media 1 (15 menit)',
    itp4: 'Menyelidiki potensial sel Volta pada simulasi Media 2',
    asesmen4: 'Formatif 3 (LKPD): Pengisian tabel data potensial sel Media 2',
    aktivitas4: 'Eksplorasi simulator Media 2 (30 menit)',
    itp5: 'Mengevaluasi aplikasi sel Volta Media 2',
    asesmen5: 'Formatif 4 (Kuis): Skor kuis evaluasi interaktif Media 2',
    aktivitas5: 'Pengerjaan kuis Media 2 (15 menit)',
    subTopik1: 'Redoks', subTopik2: 'Sel Volta',
    ayat1: 'q55-9', ayat2: 'q55-9', zona1: 'Game', zona2: 'Game',
    awal1: 'Murid bersiap', awal2: 'Murid bersiap',
    memahami1: 'Murid memahami', memahami2: 'Murid memahami',
    mengaplikasi1: 'Murid mengaplikasi', mengaplikasi2: 'Murid mengaplikasi',
    merefleksi1: 'Murid merefleksi', merefleksi2: 'Murid merefleksi',
    penutup1: 'Simpulan', penutup2: 'Simpulan',
    listAsesmen: '1. Diagnostik Awal\n2. Formatif 1\n3. Formatif 2\n4. Formatif 3\n5. Formatif 4'
  };

  const normMulti = JSON.parse(context.harmonisasiOutputAI_(JSON.stringify(multiMediaAI), 2));
  assert.ok(/diagnostik/i.test(normMulti.asesmen1), 'Baris 1 harus Diagnostik Awal');
  assert.ok(normMulti.asesmen2.startsWith('Formatif 1'), 'Baris 2 harus Formatif 1 Media 1');
  assert.ok(normMulti.asesmen3.startsWith('Formatif 2'), 'Baris 3 harus Formatif 2 Media 1');
  assert.ok(normMulti.asesmen4.startsWith('Formatif 3'), 'Baris 4 harus Formatif 3 Media 2');
  assert.ok(normMulti.asesmen5.startsWith('Formatif 4'), 'Baris 5 harus Formatif 4 Media 2');
  for (let r = 6; r <= 14; r++) {
    assert.equal(normMulti['itp' + r], '', 'Baris ' + r + ' harus kosong pada 2 media');
  }
});

// TEST 7: Pemisahan Poin Langkah Pembelajaran (Tidak Bergabung dalam 1 Paragraf)
test('Langkah pembelajaran (awal, memahami, mengaplikasi, merefleksi, penutup) terpisah per baris baru (\n)', () => {
  const { context } = createHarness();
  
  // Simulasi output AI yang menyatukan poin dalam satu paragraf bertumpuk (kasus screenshot pengguna)
  const mergedStepsAI = {
    topik: 'Sifat Keperiodikan Unsur',
    tujuan: 'Murid mampu menganalisis keteraturan sifat periodik unsur',
    itp1: 'Menganalisis keteraturan jari-jari atom dan energi ionisasi melalui simulasi SPU',
    asesmen1: 'Formatif 1 (LKPD): Pengisian tabel perbandingan sifat keperiodikan unsur',
    aktivitas1: 'Eksplorasi simulator dan analisis tren SPU (30 menit)',
    subTopik1: 'Tren Sifat Periodik',
    ayat1: 'q55-9',
    zona1: 'Ice breaking tebak unsur',
    awal1: "1) Pendidik menginstruksikan murid untuk merapikan lingkungan kelas dan memakai atribut sekolah dengan benar. 2) Murid membuka sesi pembelajaran dengan berdoa. 3) Pendidik memeriksa presensi murid, lalu murid menyiapkan alat tulis, buku catatan, dan memastikan kesiapan perangkat digital kelompok. 4) Asesmen diagnostik awal: murid memperhatikan dan merespons pendidik terkait review materi sebelumnya. 5) Motivasi: pendidik menampilkan media. 6) Murid menyimak hikmah ayat. 7) Murid memperhatikan tujuan pembelajaran. 8) Pendidik menyampaikan pokok materi dengan peta konsep.",
    memahami1: "a) Murid melakukan eksplorasi konsep esensial dan peta konsep pada menu materi Media Pembelajaran Interaktif PortalKimia dengan bimbingan pendidik. b) Murid mencermati narasi tren dalam satu golongan dan tren satu periode. c) Murid mengidentifikasi variabel penyelidikan yaitu nomor atom Z dan jari-jari atom.",
    mengaplikasi1: "1. Murid menjalankan simulator uji larutan HCl 0.1 M dan buffer pH 7.4. 2. Murid mencatat data pengamatan ke dalam tabel digital.",
    merefleksi1: "- Murid mengaitkan konsep SPU dengan aplikasi material di industri. - Murid menuliskan refleksi di lembar catatan.",
    penutup1: "1) Murid bersama pendidik menyimpulkan pembelajaran. 2) Pendidik memberikan apresiasi. 3) Pendidik menyampaikan rencana pembelajaran berikutnya yaitu Ikatan Kimia. 4) Murid membaca hamdalah dan do'a kafaratul majlis untuk menutup kegiatan pembelajaran.",
    listAsesmen: "1. Asesmen Diagnostik Awal 2. Formatif 1 (LKPD) 3. Formatif 2 (Kuis)"
  };

  const normalized = JSON.parse(context.harmonisasiOutputAI_(JSON.stringify(mergedStepsAI), 1));

  // 1. Kegiatan Awal terpisah menjadi 8 baris terpisah
  const linesAwal = normalized.awal1.split('\n').filter(Boolean);
  assert.equal(linesAwal.length, 8, 'Awal1 harus terpisah menjadi 8 baris, bukan 1 paragraf');
  assert.ok(linesAwal[0].startsWith('1)'));
  assert.ok(linesAwal[1].startsWith('2)'));
  assert.ok(linesAwal[7].startsWith('8)'));

  // 2. Kegiatan Memahami terpisah menjadi 3 baris terpisah (a), b), c))
  const linesMemahami = normalized.memahami1.split('\n').filter(Boolean);
  assert.equal(linesMemahami.length, 3, 'Memahami1 harus terpisah menjadi 3 baris');
  assert.ok(linesMemahami[0].startsWith('a)'));
  assert.ok(linesMemahami[1].startsWith('b)'));
  assert.ok(linesMemahami[2].startsWith('c)'));

  // 3. Mengaplikasi: desimal kimia (0.1 M, pH 7.4) tidak boleh terbelah salah
  const linesMengaplikasi = normalized.mengaplikasi1.split('\n').filter(Boolean);
  assert.equal(linesMengaplikasi.length, 2, 'Mengaplikasi1 harus terpisah 2 poin angka');
  assert.ok(linesMengaplikasi[0].includes('0.1 M'));
  assert.ok(linesMengaplikasi[0].includes('pH 7.4'));

  // 4. Penutup terpisah per nomor
  const linesPenutup = normalized.penutup1.split('\n').filter(Boolean);
  assert.ok(linesPenutup.length >= 4, 'Penutup harus terpisah minimal 4 baris');
  assert.ok(linesPenutup[linesPenutup.length - 1].includes('kafaratul majlis'));

  // 5. listAsesmen terpisah per baris
  const linesAsesmen = normalized.listAsesmen.split('\n').filter(Boolean);
  assert.equal(linesAsesmen.length, 3, 'listAsesmen harus terpisah menjadi 3 baris');
});

test('Gaya bahasa pedagogis (Anti-Duplikasi TQA) terdefinisi dan disuntikkan ke instruksi AI', () => {
  const { context } = createHarness();

  // 1. Verifikasi kelima gaya bahasa mengembalikan pedoman yang sesuai
  const gayaSaintifik = context.pedomanGayaTeks_('saintifik');
  assert.ok(gayaSaintifik.includes('GAYA SAINTIFIK-EKSPLANATIF'), 'Gaya saintifik harus memuat pedoman riset & presisi');

  const gayaReflektif = context.pedomanGayaTeks_('reflektif');
  assert.ok(gayaReflektif.includes('GAYA REFLEKTIF-KONSEPTUAL'), 'Gaya reflektif harus memuat pedoman meaningful learning');

  const gayaPraktis = context.pedomanGayaTeks_('praktis');
  assert.ok(gayaPraktis.includes('GAYA PRAKTIS-KOLABORATIF'), 'Gaya praktis harus memuat pedoman aksi dan tim');

  const gayaDiferensiasi = context.pedomanGayaTeks_('diferensiasi');
  assert.ok(gayaDiferensiasi.includes('GAYA DIFERENSIASI-EKSPLORATIF'), 'Gaya diferensiasi harus memuat pedoman scaffolding');

  const gayaOtomatis = context.pedomanGayaTeks_('otomatis');
  assert.ok(gayaOtomatis.includes('GAYA OTOMATIS BERAGAM'), 'Gaya otomatis harus memuat variasi leksikal tinggi');

  // Default fallback ketika parameter kosong/null
  const gayaDefault = context.pedomanGayaTeks_(null);
  assert.ok(gayaDefault.includes('GAYA OTOMATIS BERAGAM'), 'Gaya default harus otomatis beragam');

  // 2. Verifikasi instructionSafety_ menyertakan pedoman gaya narasi
  const safetyReflektif = context.instructionSafety_({ gayaTeks: 'reflektif' });
  assert.ok(safetyReflektif.includes('GAYA REFLEKTIF-KONSEPTUAL'), 'instructionSafety_ harus menyertakan pedoman reflektif');

  const safetyDefault = context.instructionSafety_({});
  assert.ok(safetyDefault.includes('GAYA OTOMATIS BERAGAM'), 'instructionSafety_ default harus menyertakan gaya otomatis');
});

// TEST 9: Deteksi Token Master vs Token Guru & File Unggahan (Sanitasi Branding PortalKimia)
test('Deteksi Token: Master mempertahankan PortalKimia, Token Guru & File Eksternal diubah jadi Media HTML Interaktif', () => {
  const { context } = createHarness();
  const accGuru = context.tambahAkunGuru('Pak Joko', 5);
  const teacherToken = accGuru.token;
  const masterToken = 'master-tito-secret';

  const rawWithPortal = JSON.stringify({
    topik: 'Termokimia',
    digital: 'Modul Interaktif: Media Pembelajaran Interaktif PortalKimia berbasis web',
    itp1: 'Mengidentifikasi reaksi eksoterm dan endoterm pada media PortalKimia',
    asesmen1: 'Formatif 1 (LKPD): Pengamatan kalorimeter pada fitur PortalKimia',
    aktivitas1: 'Eksplorasi simulasi interaktif pada aplikasi PortalKimia (20 menit)',
    memahami1: 'Murid menyimak materi pada katalog internal PortalKimia',
    listAsesmen: 'Formatif: Kuis interaktif PortalKimia',
    lampiran: 'Lembar aktivitas peserta didik'
  });

  // 1. Master Token tanpa unggahan eksternal -> PortalKimia DIPERTAHANKAN
  const resMaster = JSON.parse(context.harmonisasiOutputAI_(rawWithPortal, 1, masterToken));
  assert.ok(resMaster.digital.includes('PortalKimia'), 'Master token harus mempertahankan PortalKimia');
  assert.ok(resMaster.itp2.includes('PortalKimia'), 'itp2 pada master token harus mempertahankan PortalKimia');
  assert.ok(resMaster.memahami1.includes('PortalKimia'), 'memahami1 pada master token harus mempertahankan PortalKimia');

  // 2. Token Guru (Rekan Guru) -> PortalKimia WAJIB DIUBAH menjadi Media HTML Interaktif
  const resGuru = JSON.parse(context.harmonisasiOutputAI_(rawWithPortal, 1, teacherToken));
  assert.ok(!resGuru.digital.includes('PortalKimia'), 'Token guru TIDAK BOLEH mengandung kata PortalKimia');
  assert.ok(resGuru.digital.includes('Media Pembelajaran HTML Interaktif'), 'Digital harus diubah jadi Media Pembelajaran HTML Interaktif');
  assert.ok(!resGuru.itp2.includes('PortalKimia'), 'itp2 guru bebas PortalKimia');
  assert.ok(resGuru.itp2.includes('HTML Interaktif'), 'itp2 guru memuat HTML Interaktif');
  assert.ok(!resGuru.asesmen2.includes('PortalKimia'), 'asesmen2 guru bebas PortalKimia');
  assert.ok(!resGuru.aktivitas2.includes('PortalKimia'), 'aktivitas2 guru bebas PortalKimia');
  assert.ok(!resGuru.memahami1.includes('PortalKimia'), 'memahami1 guru bebas PortalKimia');
  assert.ok(resGuru.memahami1.includes('katalog media HTML interaktif'), 'katalog diubah jadi katalog media HTML interaktif');
  assert.ok(!resGuru.listAsesmen.includes('PortalKimia'), 'listAsesmen guru bebas PortalKimia');

  // 3. Master Token TETAPI ada BERKAS RUJUKAN EKSTERNAL (Upload HTML Sendiri) -> WAJIB DIUBAH jadi Media HTML Interaktif
  const rawWithUpload = JSON.stringify({
    topik: 'Termokimia',
    digital: 'Modul Interaktif: Media Pembelajaran Interaktif PortalKimia berbasis web',
    itp1: 'Mengidentifikasi reaksi eksoterm pada media PortalKimia',
    lampiran: '[BERKAS RUJUKAN EKSTERNAL GURU: termokimia-mandiri.html]'
  });
  const resUploadMaster = JSON.parse(context.harmonisasiOutputAI_(rawWithUpload, 1, masterToken));
  assert.ok(!resUploadMaster.digital.includes('PortalKimia'), 'File upload eksternal TIDAK BOLEH mengandung kata PortalKimia bahkan untuk master');
  assert.ok(resUploadMaster.digital.includes('Media Pembelajaran HTML Interaktif'), 'File upload diubah jadi Media Pembelajaran HTML Interaktif');
});

// TEST 10: Format Teks: Pembersihan Bold/Asterisks & Pencegahan Pemotongan Notasi Kimia (2, 8, 1)
test('Format Teks: Poin langkah pembelajaran bebas dari asterisks markdown bold dan notasi kimia (2, 8, 1) tidak terpotong', () => {
  const { context } = createHarness();

  // 1. Notasi kimia seperti konfigurasi elektron (2, 8, 1) tidak boleh terpotong salah
  const rawWithChemical = "4) Setiap murid mengerjakan kuis interaktif formatif pada media/Liveworksheets yang memuat soal tren sifat dan soal HOTS, misalnya memprediksi jenis ikatan antara unsur X (2, 8, 1) dengan unsur Y (2, 8, 7). 5) Murid menyusun tabel perbandingan empat sifat keperiodikan untuk Na, Mg, Cl, dan Ar pada buku tulis/LKPD digital sebagai bentuk sintesis pemahaman.";
  const separated = context.pisahkanPoinBarisBaru_(rawWithChemical);
  const lines = separated.split('\n');
  assert.equal(lines.length, 2, 'Harus terpisah menjadi tepat 2 baris (poin 4 dan poin 5)');
  assert.ok(lines[0].includes('(2, 8, 1) dengan unsur Y (2, 8, 7)'), 'Notasi kimia (2, 8, 1) harus utuh di baris poin 4');
  assert.ok(lines[1].startsWith('5) Murid'), 'Poin 5 harus dimulai dengan 5) Murid');

  // 2. Pembersihan markdown asterisks bold (**teks**) di harmonisasiOutputAI_
  const rawAsterisks = JSON.stringify({
    topik: '**Ikatan Kimia**',
    memahami1: '**1)** Murid mengamati **animasi transfer elektron**.',
    mengaplikasi1: '2) Murid **menggambarkan struktur Lewis** ionik.',
    tujuan: 'Murid mampu memahami **ikatan ion dan kovalen**.'
  });
  const resClean = JSON.parse(context.harmonisasiOutputAI_(rawAsterisks, 1));
  assert.equal(resClean.topik, 'Ikatan Kimia');
  assert.equal(resClean.memahami1, '1) Murid mengamati animasi transfer elektron.');
  assert.equal(resClean.mengaplikasi1, '2) Murid menggambarkan struktur Lewis ionik.');
  assert.ok(!resClean.tujuan.includes('**'));

  // 3. Verifikasi fungsi normalisasiFormatTeksDokumen_
  let boldResetCount = 0;
  const mockTableDoc = {
    getBody: () => ({
      getTables: () => [{
        getNumRows: () => 2,
        getRow: (r) => ({
          getNumCells: () => 1,
          getCell: (c) => ({
            getNumChildren: () => 3,
            getChild: (ch) => ({
              getType: () => 'PARAGRAPH',
              getText: () => ch === 0 ? 'Fase 2: Mengaplikasi' : (ch === 1 ? '1) Murid melakukan pengamatan' : '2) Murid menyusun laporan'),
              editAsText: () => ({
                setBold: (b) => { if (b === false) boldResetCount++; }
              })
            })
          })
        })
      }]
    })
  };
  context.DocumentApp = { ElementType: { PARAGRAPH: 'PARAGRAPH' } };
  context.normalisasiFormatTeksDokumen_(mockTableDoc);
  assert.equal(boldResetCount, 2, 'Kedua poin narasi langkah pembelajaran harus direset setBold(false), sedangkan judul fase dipertahankan');
});

console.log('\nAll ' + passed + ' multi-user token ledger tests passed successfully!');


