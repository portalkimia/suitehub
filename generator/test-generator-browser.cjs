const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright');}catch(e){playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}const {chromium}=playwright;
const root=process.argv[2]||(fs.existsSync(path.join(__dirname,'generator-core.cjs'))?__dirname:path.join(__dirname,'generator_v2'));
(async()=>{
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0].slice(1);const file=path.join(root,name);if(!file.startsWith(path.resolve(root))||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',name.endsWith('.json')?'application/json':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();const errors=[],posts=[];let response={docUrl:'https://docs.google.com/document/d/testDoc/edit',pdfUrl:'https://docs.google.com/document/d/testDoc/export?format=pdf'};
 page.on('pageerror',err=>errors.push(err.message));page.on('dialog',dialog=>dialog.dismiss());
 await page.addInitScript(()=>{window.bootstrap={Modal:class{show(){}hide(){}static getInstance(){return {hide(){}};}},Collapse:class{show(){}}};});
 await page.route('**/*',async route=>{const url=route.request().url();if(url.startsWith('http://127.0.0.1:'))return route.continue();if(url.startsWith('https://script.google.com/')){posts.push(JSON.parse(route.request().postData()));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)});}return route.fulfill({status:200,body:''});});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.querySelectorAll('#gridKartuMedia article').length===93);
 assert.equal(await page.locator('#referenceId option').count(),2);assert.equal(await page.locator('[name=cp]').count(),1);
 await page.evaluate(()=>aturFilterKatalog('Praktikum Virtual'));assert.equal(await page.locator('#gridKartuMedia article').count(),18);
 await page.evaluate(()=>{portalMediaCatalog[0].title='<img src=x onerror="window.injected=true">';aturFilterKatalog('Semua');document.getElementById('cariMediaInput').value='<img';renderDaftarMediaPortal();});
 assert.equal(await page.locator('#gridKartuMedia img').count(),0);assert.ok((await page.locator('#gridKartuMedia').textContent()).includes('<img'));assert.equal(await page.evaluate(()=>window.injected),undefined);
 await page.evaluate(()=>{localStorage.setItem('generatorAccessToken','test-token');document.getElementById('aiPertemuan').value='1';document.querySelector('[name=topik]').value='Larutan';document.querySelector('[name=kelas]').value='11';document.querySelector('[name=cp]').value='Konsentrasi larutan';document.querySelector('[name=cpSource]').value='CP sekolah';prosesData();});
 await page.waitForFunction(()=>!document.getElementById('tombolSubmit').disabled);assert.equal(posts[0].dataForm.referenceId,'q55-9');assert.equal(posts[0].dataForm.cp,'Konsentrasi larutan');const first=posts[0].dataForm.requestId;assert.ok(first);
 await page.evaluate(()=>prosesData());await page.waitForFunction(()=>!document.getElementById('tombolSubmit').disabled);assert.equal(posts[1].dataForm.requestId,first);
 await page.reload();await page.waitForFunction(()=>document.querySelectorAll('#referenceId option').length===2);assert.equal(await page.evaluate(()=>getGeneratorAccessToken()),'test-token');
 // Repeat content after reload must keep the id even without successful draft autosave.
 await page.evaluate(()=>{document.querySelector('[name=topik]').value='Larutan';document.querySelector('[name=kelas]').value='11';document.querySelector('[name=cp]').value='Konsentrasi larutan';document.querySelector('[name=cpSource]').value='CP sekolah';document.getElementById('aiPertemuan').value='1';prosesData();});await page.waitForFunction(()=>!document.getElementById('tombolSubmit').disabled);assert.equal(posts[2].dataForm.requestId,first);
 response={error:'<img src=x onerror="window.injected=true">'};await page.evaluate(()=>prosesData());await page.waitForFunction(()=>!document.getElementById('tombolSubmit').disabled);assert.equal(await page.locator('#areaHasil img').count(),0);assert.ok((await page.locator('#areaHasil').textContent()).includes('<img'));
 await page.evaluate(()=>tampilkanHasilCetak({docUrl:'javascript:alert(1)',pdfUrl:'https://evil.example/x'}));assert.equal(await page.locator('#areaHasil a').count(),0);
 await page.evaluate(async()=>{await prosesFile(new File(['fake PDF'],'test.pdf',{type:'application/pdf'}));});assert.equal(await page.evaluate(()=>window.currentUploadedFile),null);
 await page.evaluate(async()=>{await prosesFile(new File(['%PDF-1.4 valid header'],'test.pdf',{type:'application/pdf'}));});assert.equal(await page.evaluate(()=>window.currentUploadedFile.mimeType),'application/pdf');assert.equal(await page.locator('#privacyConsent').isChecked(),false);
 const before=posts.length;await page.evaluate(()=>mintaBantuanAI());assert.equal(posts.length,before);
 await page.evaluate(()=>{document.querySelector('[name=itp1]').value='Menghitung konsentrasi';document.querySelector('[name=aktivitas1]').value='Menghitung konsentrasi';document.querySelector('[name=asesmen1]').value='';periksaKeselarasan();});assert.ok((await page.locator('#alignmentReport').textContent()).includes('Asesmen kosong'));
 assert.deepEqual(errors,[]);console.log('PASS Browser: 93 catalog cards, filters, library/CP controls, persistent token, stable requestId + reload, XSS payloads inert, safe links, upload signature, privacy gate, alignment report.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});

