import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const BASE=process.env.SF_BASE_URL||'http://127.0.0.1:4173/StereoTypeFighter/';
const seq=['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];
const url=()=>new URL('?qa=1',BASE).href;

async function boot(page){
  await page.goto(url());
  await page.waitForFunction(()=>window.SF?.roster().length===20,{timeout:20000});
  await expect(page.locator('#startButton')).toBeEnabled({timeout:20000});
}
async function begin(page,mode='local'){
  await boot(page);
  await page.locator('#modeSelect').selectOption(mode);
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.SF.snapshot().phase!=='off');
}
async function fight(page){await page.waitForFunction(()=>window.SF.snapshot().phase==='fight',{timeout:8000});}
async function snap(page){return page.evaluate(()=>window.SF.snapshot());}

let unexpected=[];
test.beforeEach(async({page})=>{
  unexpected=[];
  page.on('pageerror',e=>unexpected.push('pageerror: '+e.message));
  page.on('console',m=>m.type()==='error'&&unexpected.push('console: '+m.text()));
});
test.afterEach(async({},info)=>{
  if(info.title.includes('fighter asset failure')) return;
  expect(unexpected,'unexpected browser errors').toEqual([]);
});

test('production roster has 20 compact fighters, all sequences and six arenas',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.SF.test.loadAll());
  await page.waitForFunction(()=>window.SF.roster().every(f=>f.status==='ready'),{timeout:30000});
  const d=await page.evaluate(()=>({r:window.SF.roster(),s:window.SF.stages()}));
  expect(d.r).toHaveLength(20);
  expect(new Set(d.r.map(x=>x.id)).size).toBe(20);
  for(const f of d.r){
    expect(f.render).toBe('atlas');
    expect(f.renderMode).toBe('atlas');
    for(const s of seq)expect(f.frames[s],`${f.id}/${s}`).toBeGreaterThan(0);
  }
  expect(d.s).toHaveLength(6);
});

test('selector, mode, random stage and keyboard start remain playable',async({page})=>{
  await boot(page);
  await page.locator('[data-slot="1"]').click();
  await page.locator('.card').nth(3).click();
  await page.locator('[data-stage="random"]').click();
  await page.locator('#modeSelect').selectOption('training');
  const selection=await page.evaluate(()=>window.SF.selection());
  expect(selection.stage).toBe('random');
  expect(selection.mode).toBe('training');
  await page.evaluate(()=>document.activeElement?.blur());
  await page.keyboard.press('Enter');
  await expect(page.locator('#matchScreen')).toHaveClass(/active/);
});

test('movement, attacks, pause and rematch remain functional',async({page})=>{
  await begin(page);
  await fight(page);
  const x=(await snap(page)).people[0].x;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(140);
  await page.keyboard.up('KeyD');
  expect((await snap(page)).people[0].x).toBeGreaterThan(x);
  await page.evaluate(()=>window.SF.test.set({positions:[430,500]}));
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(220);
  expect((await snap(page)).people[1].hp).toBeLessThan(100);
  await page.locator('#pauseButton').click();
  expect((await snap(page)).paused).toBe(true);
  await page.locator('#resumeButton').click();
  expect((await snap(page)).paused).toBe(false);
});

test('fighter asset failure exposes a usable retry action',async({page})=>{
  let fail=true;
  await page.route('**/bimbo-babe-atlas.webp*',async route=>fail?(fail=false,route.abort()):route.continue());
  await boot(page);
  await page.locator('[data-id="bimbo-babe"]').click();
  await page.waitForFunction(()=>window.SF.roster().find(f=>f.id==='bimbo-babe')?.status==='error',{timeout:12000});
  await expect(page.locator('#liveAssertive')).toContainText('failed');
  await expect(page.locator('#startButton')).toBeEnabled();
  await expect(page.locator('#startButton')).toContainText(/Fight|Retry/);
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.SF.roster().find(f=>f.id==='bimbo-babe')?.status==='ready',{timeout:12000});
});

test('iPhone portrait selector has no horizontal overflow and reachable targets',async({browser})=>{
  const c=await browser.newContext({hasTouch:true,isMobile:true,deviceScaleFactor:3,viewport:{width:390,height:844}});
  const page=await c.newPage();
  await boot(page);
  const m=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    start:document.querySelector('#startButton').getBoundingClientRect(),
    card:document.querySelector('.card').getBoundingClientRect(),
    stage:document.querySelector('.stageCard').getBoundingClientRect()
  }));
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(m.start.height).toBeGreaterThanOrEqual(44);
  expect(m.card.width).toBeGreaterThan(50);
  expect(m.stage.width).toBeGreaterThan(100);
  await c.close();
});

test('iPhone landscape supports simultaneous touch movement and attacks',async({browser})=>{
  const c=await browser.newContext({hasTouch:true,isMobile:true,deviceScaleFactor:3,viewport:{width:844,height:390}});
  const page=await c.newPage();
  await begin(page,'training');
  await expect(page.locator('#touchControls')).toBeVisible();
  const right=page.locator('[data-touch="right"]'),punch=page.locator('[data-touch="punch"]');
  const start=(await snap(page)).people[0].x;
  await right.dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch'});
  await punch.dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch'});
  await page.waitForTimeout(150);
  await punch.dispatchEvent('pointerup',{pointerId:12,pointerType:'touch'});
  await right.dispatchEvent('pointerup',{pointerId:11,pointerType:'touch'});
  const state=await snap(page);
  expect(state.people[0].x).toBeGreaterThan(start);
  expect(['punch','idle','walk','hurt','block']).toContain(state.people[0].state);
  const layout=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    visualHeight:window.visualViewport?.height||window.innerHeight,
    game:document.querySelector('#gameWrap').getBoundingClientRect(),
    buttons:[...document.querySelectorAll('#touchControls button')].map(b=>b.getBoundingClientRect())
  }));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.game.height).toBeGreaterThan(250);
  expect(layout.game.top).toBeGreaterThanOrEqual(-1);
  expect(layout.game.bottom).toBeLessThanOrEqual(layout.visualHeight+4);
  for(const b of layout.buttons){expect(b.width).toBeGreaterThanOrEqual(50);expect(b.height).toBeGreaterThanOrEqual(40);}
  await c.close();
});

test('iPad portrait and landscape layouts stay usable',async({browser})=>{
  for(const viewport of [{width:768,height:1024},{width:1024,height:768},{width:820,height:1180},{width:1180,height:820}]){
    const c=await browser.newContext({hasTouch:true,isMobile:true,deviceScaleFactor:2,viewport});
    const page=await c.newPage();
    await boot(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),`${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
    await page.locator('#modeSelect').selectOption('training');
    await page.locator('#startButton').click();
    await expect(page.locator('#touchControls')).toBeVisible();
    await c.close();
  }
});

test('Retina rendering raises backing resolution without changing logical combat space',async({browser})=>{
  const c=await browser.newContext({hasTouch:true,isMobile:true,deviceScaleFactor:3,viewport:{width:844,height:390}});
  const page=await c.newPage();
  await begin(page,'training');
  await page.waitForTimeout(100);
  const render=await page.evaluate(()=>({
    width:document.querySelector('#gameCanvas').width,
    height:document.querySelector('#gameCanvas').height,
    scale:document.querySelector('#gameCanvas').dataset.renderScale,
    enhancement:window.SFEnhancements
  }));
  expect(render.width).toBeGreaterThan(960);
  expect(render.width).toBeLessThanOrEqual(1920);
  expect(render.width/render.height).toBeCloseTo(16/9,2);
  expect(Number(render.scale)).toBeGreaterThan(1);
  expect(render.enhancement.simulationHz).toBe(60);
  await c.close();
});

test('desktop and mobile screenshots are generated for release review',async({browser},info)=>{
  await fs.mkdir('test-results/screenshots',{recursive:true});
  const desktopContext=await browser.newContext({viewport:{width:1440,height:900}});
  const desktop=await desktopContext.newPage();
  await boot(desktop);
  await desktop.screenshot({path:'test-results/screenshots/desktop-select.png',fullPage:true});
  await desktop.locator('#modeSelect').selectOption('training');
  await desktop.locator('#startButton').click();
  await desktop.screenshot({path:'test-results/screenshots/desktop-fight.png',fullPage:true});
  const mobileContext=await browser.newContext({hasTouch:true,isMobile:true,deviceScaleFactor:3,viewport:{width:844,height:390}});
  const mobile=await mobileContext.newPage();
  await begin(mobile,'training');
  await mobile.screenshot({path:'test-results/screenshots/iphone-landscape-fight.png'});
  for(const name of ['desktop-select','desktop-fight','iphone-landscape-fight'])await info.attach(name,{path:`test-results/screenshots/${name}.png`,contentType:'image/png'});
  await desktopContext.close();
  await mobileContext.close();
});
