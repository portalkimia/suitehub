const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');

const root = __dirname;
const gasPath = path.join(root, 'Code.gs');
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

console.log('\nAll ' + passed + ' multi-user token ledger tests passed successfully!');
