// Run after npm run build, with Playwright available on NODE_PATH.
// CHROME_PATH can point to an installed Chrome executable.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const build = path.resolve(__dirname, '../build');
const header = 'short_name,full_name,course_name,course_type,course_credit_hours,course_days_of_the_week,course_start_time,course_end_time,course_instructor,course_location,course_max_enroll,course_enrolled,course_start_date,course_end_date,semester,course_level,course_section,description,raw_precoreqs,offer_frequency,prerequisites,corequisites,school';
const row = (id, section, semester='FALL 2024') => `${id},Computer Science,Computer Science,LEC,4,MWF,09:00AM,09:50AM,Prof Example,DCC 308,100,80,2024-08-01,2024-12-01,${semester},1000,${section},Intro course,,Fall/Spring,[],[],Computer Science`;
const csv = [header,row('CSCI-1100','01'),row('CSCI-1100','02'),row('CSCI-1100','01','SPRING 2025'),...Array.from({length:20},(_,i)=>row(`TEST-${1000+i}`,'01'))].join('\n');
const server = http.createServer((req,res)=>{
 const url = new URL(req.url,'http://localhost');
 let file=path.join(build,url.pathname);
 if(!file.startsWith(build+path.sep)) {res.writeHead(403).end();return;}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) file=path.join(build,'index.html');
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const results = { failures: 0, checks: 0 };
 try {
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]) {
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,permissions:['clipboard-read','clipboard-write']});
  await context.route('**/fall-2024.csv',r=>r.fulfill({body:csv,contentType:'text/csv'}));
  await context.route('**/api/session',r=>r.fulfill({json:{success:true,message:'Test sign-in succeeded'}}));
  const page=await context.newPage();page.setDefaultTimeout(7000);
  const cdp=await context.newCDPSession(page);
  async function check(name,fn){results.checks++;try{await fn();console.log(`PASS ${viewport.width}x${viewport.height} ${name}`);}catch(e){results.failures++;console.error(`FAIL ${viewport.width}x${viewport.height} ${name}: ${e.message}`);}}
  async function swipe(x,y,dx,dy){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
  }
  async function openMenu(){await page.getByRole('button',{name:'Open navigation menu'}).tap();await page.getByRole('dialog').waitFor();await page.waitForTimeout(250);}
  async function closed(){await page.getByRole('dialog').waitFor({state:'hidden'});}
  async function goto(route='/'){await page.goto(base+route);await page.getByLabel('Semester').selectOption('FALL 2024');}
  await goto();
  await check('drawer close, backdrop, theme, scroll lock',async()=>{
   await openMenu();const y=await page.evaluate(()=>window.scrollY);
   await swipe(10,250,0,-160);assert.equal(await page.evaluate(()=>window.scrollY),y);
   const toggle=page.getByRole('button',{name:'Toggle theme'});const before=await toggle.getAttribute('aria-pressed');await toggle.tap();assert.notEqual(await toggle.getAttribute('aria-pressed'),before);
   await page.getByRole('button',{name:'Close navigation menu'}).tap();await closed();
   await openMenu();await page.touchscreen.tap(8,180);await closed();
  });
  await check('every drawer destination is reachable by tap',async()=>{
   for(const [label,route] of [['Login','/login'],['4-Year Plan','/planner'],['Professors','/professors'],['Profile','/profile'],['Schedule','/']]){
    await openMenu();await page.getByRole('dialog').getByRole('link',{name:label,exact:true}).tap();await closed();assert.equal(new URL(page.url()).pathname,route);
   }
  });
  await goto();
  await check('search results swipe without selecting; outside tap dismisses',async()=>{
   await page.getByRole('combobox').first().tap();
   const scroll=page.locator('[role="listbox"] .overscroll-contain');await scroll.waitFor();await scroll.scrollIntoViewIfNeeded();
   const r=await scroll.boundingBox();await swipe(r.x+r.width/2,r.y+Math.min(r.height-20,140),0,-90);
   assert.ok(await scroll.evaluate(e=>e.scrollTop)>0);assert.ok(await page.getByText('No classes selected yet.').count());
   await page.getByRole('heading',{name:'Your Schedule'}).tap();assert.equal(await page.getByRole('listbox').count(),0);
  });
  await check('search clear target, add course, change section',async()=>{
   const input=page.getByRole('combobox').first();await input.tap();await input.fill('CSCI-1100');
   const clear=page.getByRole('button',{name:'Clear search'});const box=await clear.boundingBox();assert.ok(box.width>=44&&box.height>=44,`Clear search target is ${box.width}x${box.height}`);
   await clear.tap();assert.equal(await input.inputValue(),'');await input.fill('CSCI-1100');
   await page.getByRole('option').filter({hasText:'CSCI-1100 -'}).tap();await page.getByRole('heading',{name:'Your Schedule'}).tap();
   await page.getByRole('heading',{name:/CSCI-1100/}).tap();await page.getByRole('button',{name:/LEC 02/}).tap();
   assert.ok(await page.getByText('Selected: LEC-02').count());
  });
  // Ensure later checks have a course even when a target-size assertion failed.
  if(await page.getByText('No classes selected yet.').count()){
   await page.getByRole('combobox').first().fill('CSCI-1100');await page.getByRole('option').filter({hasText:'CSCI-1100 -'}).tap();await page.getByRole('heading',{name:'Your Schedule'}).tap();
  }
  await check('calendar horizontal swipe and page vertical swipe',async()=>{
   const calendar=page.getByRole('region',{name:'Scrollable weekly calendar'});await calendar.scrollIntoViewIfNeeded();
   const r=await calendar.boundingBox();const y=Math.max(50,Math.min(viewport.height-60,r.y+100));
   await swipe(Math.min(viewport.width-30,r.x+r.width-20),y,-200,0);
   if(viewport.width<780)assert.ok(await calendar.evaluate(e=>e.scrollLeft)>0);
   const before=await page.evaluate(()=>window.scrollY);await swipe(viewport.width/2,viewport.height-60,0,-160);assert.ok(await page.evaluate(()=>window.scrollY)>before);
  });
  for(const finals of [false,true]){
   if(finals)await page.locator('footer').getByRole('link',{name:'finals',exact:true}).tap();
   await check(`${finals?'finals':'schedule'} copy, PNG and ICS exports`,async()=>{
    await page.getByRole('button',{name:finals?'Copy finals text':'Copy text',exact:true}).tap();await page.getByRole('button',{name:'Copied',exact:true}).waitFor();
    for(const type of ['PNG','ICS']){
     const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:`Export ${finals?'finals ':''}${type}`,exact:true}).tap()]);
     assert.ok(download.suggestedFilename().toLowerCase().endsWith('.'+type.toLowerCase()));assert.equal(await download.failure(),null);
    }
   });
   await check(`${finals?'finals':'schedule'} PDF opens populated print page`,async()=>{
    // Avoid opening an OS print dialog while still verifying print invocation.
    await page.evaluate(()=>{const open=window.open.bind(window);window.open=(...args)=>{const popup=open(...args);if(popup)popup.print=()=>{popup.__printCalled=true;};return popup;};});
    const [popup]=await Promise.all([page.waitForEvent('popup'),page.getByRole('button',{name:`Export ${finals?'finals ':''}PDF`,exact:true}).tap()]);
    try {await popup.waitForLoadState();assert.ok((await popup.locator('body').innerText()).includes('CSCI-1100'));assert.equal(await popup.evaluate(()=>window.__printCalled),true);assert.equal(await popup.evaluate(()=>window.opener),null);}finally{await popup.close();}
   });
  }
  await check('semester selection and course removal',async()=>{
   await page.locator('footer').getByRole('link',{name:'schedule',exact:true}).tap();
   await page.getByLabel('Semester').selectOption('SPRING 2025');await page.getByText('No classes selected yet.').waitFor();
   await page.getByLabel('Semester').selectOption('FALL 2024');
   await page.getByRole('button',{name:'Remove CSCI-1100',exact:true}).tap();await page.getByText('No classes selected yet.').waitFor();
  });
  await goto('/professors');
  await check('professor search and detail link',async()=>{
   const input=page.getByRole('searchbox',{name:'Search professors'});await input.tap();await input.fill('Example');
   assert.ok(Number(await input.evaluate(e=>getComputedStyle(e).fontSize.replace('px','')))>=16,'Small input text may trigger mobile focus zoom');
   await page.locator('main').getByRole('link').filter({hasText:'Prof Example'}).tap();await page.getByRole('heading',{name:'Prof Example'}).waitFor();
  });
  await goto('/login');
  await check('login fields and submission with mocked server',async()=>{
   await page.getByLabel('Email',{exact:true}).tap();await page.getByLabel('Email',{exact:true}).fill('mobile@example.test');await page.getByLabel('Password',{exact:true}).tap();await page.getByLabel('Password',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Log in',exact:true}).tap();await page.getByText('Test sign-in succeeded').waitFor();
  });
  await goto('/planner');
  await check('planner add/remove and catalog swipe',async()=>{
   await page.getByLabel('Course',{exact:true}).selectOption('PHIL-2140');await page.getByLabel('Term',{exact:true}).selectOption('SUMMER 2025');await page.getByRole('button',{name:'Add course',exact:true}).tap();await page.getByRole('button',{name:'Remove PHIL-2140 from SUMMER 2025'}).tap();
   const catalog=page.locator('.grid-flow-col');await catalog.scrollIntoViewIfNeeded();const r=await catalog.boundingBox();await swipe(viewport.width-30,Math.min(viewport.height-30,r.y+30),-200,0);assert.ok(await catalog.evaluate(e=>e.scrollLeft)>0);
  });
  await context.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 console.log(`${results.checks-results.failures}/${results.checks} checks passed`);process.exitCode=results.failures?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
