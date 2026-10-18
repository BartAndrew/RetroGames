'use strict';
const {chromium}=require('../StereoTypeFighter/node_modules/@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../_site'),out=path.join(__dirname,'test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
 let server,browser;const errors=[],checks=[];let base=process.argv[2];
 try{
  if(!base){server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404).end();return}const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(res)}catch(_){res.writeHead(400).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/DemolitionMan/'}
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto(base+'?qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.DemolitionQA?.ready(),{timeout:45000});
  await page.screenshot({path:path.join(out,'demolition-start.png')});checks.push('webgl-ready');
  await page.locator('#startBtn').click();
  await page.locator('#xrayBtn').click();assert.equal(await page.evaluate(()=>DemolitionQA.snapshot().xray),true);checks.push('xray');
  await page.waitForTimeout(300);let snap=await page.evaluate(()=>DemolitionQA.snapshot());
  assert(snap.vehiclePositions.length>0&&snap.pedestrianPositions.length>0);
  await page.waitForTimeout(350);const move=await page.evaluate(()=>DemolitionQA.snapshot());
  assert.notDeepEqual(move.vehiclePositions,snap.vehiclePositions);assert.notDeepEqual(move.pedestrianPositions,snap.pedestrianPositions);checks.push('living-city');
  for(const b of snap.protected){assert(Math.abs(b.x)-b.w/2>=7-0.01||Math.abs(b.z)-b.d/2>=7-0.01,'protected building intersects road')}checks.push('roads-clear');
  await page.evaluate(()=>DemolitionQA.loadLevel(1));await page.locator('#startCard').evaluate(el=>el.classList.remove('open'));
  await page.evaluate(()=>DemolitionQA.place(5,1,1));assert.equal((await page.evaluate(()=>DemolitionQA.snapshot())).chargeCount,1);
  assert(await page.evaluate(()=>DemolitionQA.remove(5,1,1)));assert.equal((await page.evaluate(()=>DemolitionQA.snapshot())).chargeCount,0);checks.push('charge-toggle');
  await page.evaluate(()=>DemolitionQA.place(5,1,1));
  await page.screenshot({path:path.join(out,'demolition-planned.png')});
  await page.evaluate(()=>DemolitionQA.detonate());
  await page.waitForTimeout(2800);
  snap=await page.evaluate(()=>DemolitionQA.snapshot());assert(snap.detached>0,'upper floor failed to detach');checks.push('upper-floor-collapse');
  await page.screenshot({path:path.join(out,'demolition-collapse.png')});
  await page.evaluate(()=>DemolitionQA.reset());snap=await page.evaluate(()=>DemolitionQA.snapshot());assert.equal(snap.detached,0);assert.equal(snap.chargeCount,0);checks.push('reset');
  await page.evaluate(()=>DemolitionQA.loadLevel(11));const generated=await page.evaluate(()=>DemolitionQA.snapshot());await page.evaluate(()=>DemolitionQA.loadLevel(11));assert.deepEqual((await page.evaluate(()=>DemolitionQA.snapshot())).protected,generated.protected);checks.push('seeded-levels');
  const phone=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(base+'?qa=1',{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>window.DemolitionQA?.ready(),{timeout:45000});await phone.locator('#startBtn').tap();assert(await phone.locator('#detonate').isVisible());await phone.screenshot({path:path.join(out,'demolition-mobile.png')});checks.push('mobile');
  assert.deepEqual(errors,[]);console.log('Demolition Man QA passed: '+checks.join(', '));
  fs.writeFileSync(path.join(out,'demolition-report.json'),JSON.stringify({checks,errors},null,2));
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
