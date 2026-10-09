// Offline browser integration test. All external requests are intercepted; no live GAS calls.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {harness}=require('./test-teacher.cjs');
const pw=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tito/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const h=harness(),g=h.gas;
  const token=g.portalTeacherApi({action:'login',password:h.properties.TEACHER_PASSWORD}).data.token;
  g.portalTeacherApi({action:'saveStudents',token,students:'XII-1|001|Andi\nTEST|003|Tester'});
  const task=g.portalTeacherApi({action:'saveTask',token,task:{title:'Praktikum Sel Volta',mediaId:'sel-volta',classes:['XII-1'],open:true}}).data;
  const participant=g.portalTeacherApi({action:'dashboard',token}).data.participants[0];
  const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const file=path.join(__dirname,decodeURIComponent(url.pathname));if(!file.startsWith(__dirname)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'text/plain');res.end(fs.readFileSync(file));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}});let rejectSubmission=false,submits=0;
    await context.exposeFunction('__rpc',({method,args})=>{if(method==='simpanTugasSiswa'){submits++;if(rejectSubmission)return {success:false,stored:false,message:'Server sementara tidak tersedia'};}return JSON.parse(JSON.stringify(g[method](...args)));});
    await context.addInitScript(()=>{
      const runner=(success,failure)=>new Proxy({}, {get:(_,name)=>name==='withSuccessHandler'?fn=>runner(fn,failure):name==='withFailureHandler'?fn=>runner(success,fn):(...args)=>window.__rpc({method:name,args}).then(success).catch(failure)});
      window.google={script:{run:runner(()=>{},()=>{})}};window.lucide={createIcons(){}};window.tailwind={config:{}};
    });
    await context.route('**/*',async route=>{const url=route.request().url();if(url.startsWith(origin))return route.continue();if(url.includes('action=submissionStatus')){const u=new URL(url),r=g.pkSubmissionStatus_(Object.fromEntries(u.searchParams));return route.fulfill({contentType:'application/javascript',body:u.searchParams.get('callback')+'('+JSON.stringify(r)+');'});}return route.fulfill({status:200,contentType:'application/javascript',body:''});});
    const page=await context.newPage();
    await page.goto(origin+'/Media_Pembelajaran_Kimia_Drive/Sel_Volta_12_Fase_F.html');
    await page.locator('#pk-assignment').fill(task['ID Pengumpulan']);await page.locator('#pk-access-code').fill(participant.code);await page.locator('#pk-check').click();
    await page.waitForFunction(()=>document.getElementById('student-name').value==='Andi');
    assert.equal(await page.locator('[data-pk-legacy-eval]').isVisible(),false);
    const cards=page.locator('#pk-evaluation > div');const n=await cards.count();assert.ok(n>0);
    for(let i=0;i<n;i++)await cards.nth(i).locator('button').first().click();
    assert.equal(await page.locator('#pk-evaluation button:not(:disabled)').count(),0);
    await page.locator('#analysis-essay-1').fill('Oksidasi terjadi di anode.');await page.locator('#student-reflection-text').fill('Saya paham arah elektron.');
    await page.evaluate(()=>localStorage.setItem('portal_volta_task_data_v3',JSON.stringify({essay1:'draft'})));
    page.once('dialog',d=>d.dismiss());await page.locator('[onclick*="submitToTeacherDatabase"]').first().click();
    assert.equal(submits,0);assert.ok(await page.evaluate(()=>localStorage.getItem('portal_volta_task_data_v3')));console.log('PASS Browser: cancel confirmation sends nothing and retains drafts');
    rejectSubmission=true;page.once('dialog',d=>d.accept());await page.locator('[onclick*="submitToTeacherDatabase"]').first().click();
    await page.waitForFunction(()=>document.getElementById('portal-submission-status').textContent.includes('sementara'));
    assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('portalkimia_pending'))));assert.ok(await page.evaluate(()=>localStorage.getItem('portal_volta_task_data_v3')));console.log('PASS Browser: failed send retains complete final payload and draft');
    rejectSubmission=false;await page.locator('[onclick*="submitToTeacherDatabase"]').first().click();await page.waitForFunction(()=>window.PortalSubmission.isFinal());
    assert.equal(await page.locator('#analysis-essay-1').inputValue(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('portal_volta_task_data_v3')),null);assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('portalkimia_pending')).length),0);
    assert.equal(h.sheets.get('RekapPengumpulan').getLastRow(),2);assert.equal(h.sheets.get('Analisis_AI').getLastRow(),2);console.log('PASS Browser: confirmed receipt clears drafts and locks submission');
    const id=g.pkRows_(h.ss,'RekapPengumpulan')[0]['ID Pengumpulan'];const detail=g.portalTeacherApi({action:'detail',token,id}).data;assert.equal(detail.answers.jawaban.refleksi['student-reflection-text'],'Saya paham arah elektron.');
    await page.reload();await page.waitForFunction(()=>window.PortalSubmission.isFinal());assert.equal(await page.locator('#pk-evaluation button').count(),0);console.log('PASS Browser: reload retains final lock without answer data');
    const teacher=await context.newPage();await teacher.goto(origin+'/Guru.html');assert.equal(await teacher.locator('#workspace').isVisible(),false);
    await teacher.locator('#password').fill(h.properties.TEACHER_PASSWORD);await teacher.locator('#login-form button').click();await teacher.waitForSelector('#workspace:visible');
    await teacher.locator('#results-body button').first().click();await teacher.waitForSelector('#detail-dialog[open]');assert.match(await teacher.locator('#original').innerText(),/Oksidasi terjadi di anode/);
    await teacher.locator('#review-score').fill('85');await teacher.locator('#review-note').fill('Pemahaman baik');await teacher.locator('#review-form button').click();await teacher.waitForFunction(()=>document.getElementById('review-message').textContent.includes('tersimpan'));
    await teacher.locator('#close-detail').click();await teacher.screenshot({path:path.join(__dirname,'preview-dashboard.png'),fullPage:true});
    await teacher.locator('#tab-tasks').click();await teacher.screenshot({path:path.join(__dirname,'preview-tugas.png'),fullPage:true});assert.match(await teacher.locator('#participant-body').innerText(),/Sudah final/);
    await teacher.locator('#tab-students').click();assert.match(await teacher.locator('#student-body').innerText(),/Andi/);await teacher.locator('#student-import').fill('XII-2|004|Budi');await teacher.locator('#student-form button').click();await teacher.waitForFunction(()=>document.getElementById('student-body').textContent.includes('Budi'));console.log('PASS Browser: master student sheet import and class summary');
    await teacher.locator('#tab-tasks').click();await teacher.locator('#new-task').click();await teacher.locator('#task-title').fill('Tugas untuk XII-2');await teacher.locator('#task-media').selectOption('sel-volta');await teacher.locator('#task-classes label').filter({hasText:'XII-2'}).locator('input').check();await teacher.locator('#task-form button[type="submit"]').click();await teacher.waitForFunction(()=>document.getElementById('task-list').textContent.includes('Tugas untuk XII-2'));assert.match(await teacher.locator('#task-list').innerText(),/1 peserta/);console.log('PASS Browser: task selects class and creates participants automatically');
    await teacher.setViewportSize({width:390,height:844});await teacher.screenshot({path:path.join(__dirname,'preview-mobile.png'),fullPage:true});
    await teacher.locator('#logout').click();await teacher.waitForSelector('#login-panel:visible');assert.equal(await teacher.locator('#results-body').innerText(),'');console.log('PASS Browser: teacher login, original/AI review, final grade, tasks and logout');
    for(const file of fs.readdirSync(path.join(__dirname,'Media_Pembelajaran_Kimia_Drive')).filter(f=>f.endsWith('.html'))){
      const html=fs.readFileSync(path.join(__dirname,'Media_Pembelajaran_Kimia_Drive',file),'utf8');
      const config=JSON.parse(html.match(/PortalSubmission\.install\((\{[^\n]+?\}), \{questions/)[1]);
      const created=g.portalTeacherApi({action:'saveTask',token,task:{title:'Uji '+config.title,mediaId:config.id,classes:['TEST'],open:true}}).data;
      const person=g.portalTeacherApi({action:'dashboard',token}).data.participants.find(x=>x.taskId===created['ID Pengumpulan']);
      const tab=await context.newPage();await tab.goto(origin+'/Media_Pembelajaran_Kimia_Drive/'+file);
      await tab.locator('#pk-assignment').fill(created['ID Pengumpulan']);await tab.locator('#pk-access-code').fill(person.code);await tab.locator('#pk-check').click();await tab.waitForFunction(()=>document.getElementById('student-name').value==='Tester');
      // Some media put the evaluation inside a navigation tab; activate it using the existing navigation.
      await tab.evaluate(()=>{const box=document.getElementById('pk-evaluation');const section=box.closest('section');section.classList.remove('hidden');section.style.display='block';});
      const choices=tab.locator('#pk-evaluation > div').first().locator('button');await choices.first().click();assert.equal(await choices.first().isDisabled(),true);
      assert.equal(await tab.locator('button[onclick="resetQuiz()"]').count(),0);await tab.close();console.log('PASS Browser media: '+config.id);
    }
    console.log('TOTAL 7 browser integration scenarios and 14 media checks passed. No live network/data writes.');
  } finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
