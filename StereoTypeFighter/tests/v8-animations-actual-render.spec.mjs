import { test, expect } from '@playwright/test';

const ACTIONS = [
  'idle','walk','walkBack','dashF','dashB','crouch','block','blockLow',
  'prejump','jumpUp','jumpApex','jumpDown','land','lp','lk','hp','hk',
  'launcher','sweep','airP','airK','hurt','hurtLow','launched',
  'knockdown','ko','getup','special','super','victory','intro'
];
const SPRITES = ['airK','airP','hk','idle','intro','launcher','victory'];

test('real V8 renderer draws sprites for seven actions and visible rig for the other 24', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./v8.html');
  await page.waitForFunction(()=>{
    const s=window.SF7_ART_STORE, a=s?.manifest?.['gym-bro']?.anims;
    return !!a && Object.entries(a).every(([action,v])=>
      Array.from({length:v.frames},(_,i)=>s.img('gym-bro',action,i+1)).every(Boolean));
  },null,{timeout:15000});
  const result=await page.evaluate(async()=>{
    const { drawFighter } = await import('./renderer-v7.js');
    const { byId } = await import('./roster-v7.js');
    const def=byId('gym-bro'), store=window.SF7_ART_STORE;
    const c=document.createElement('canvas');c.width=960;c.height=540;
    const ctx=c.getContext('2d');
    const original=ctx.drawImage.bind(ctx);
    let sources=[];
    ctx.drawImage=(img,...args)=>{sources.push(img?.src||'');return original(img,...args);};
    const actions=["idle","walk","walkBack","dashF","dashB","crouch","block","blockLow","prejump","jumpUp","jumpApex","jumpDown","land","lp","lk","hp","hk","launcher","sweep","airP","airK","hurt","hurtLow","launched","knockdown","ko","getup","special","super","victory","intro"];
    const statuses=[];
    for(const anim of actions){
      sources=[];ctx.clearRect(0,0,960,540);
      const f={def,x:380,y:0,vx:0,vy:0,facing:1,freeze:0,invuln:0,
        state:'attack',anim,animT:30,animP:0.48,moveT:30,move:def.moves.super};
      drawFighter(ctx,f,store);
      statuses.push({anim,sprite:sources.some(src=>src.includes('/art/v8/gym-bro/'+anim+'/')),
        spriteSources:sources.filter(src=>src.includes('/art/v8/gym-bro/'))});
    }
    return {statuses,loaded:Object.values(store.spec('gym-bro').anims)
      .reduce((n,v)=>n+v.frames,0)};
  });
  expect(result.statuses).toHaveLength(31);
  expect(result.loaded).toBe(34);
  const used=result.statuses.filter(s=>s.sprite).map(s=>s.anim).sort();
  expect(used).toEqual(SPRITES);
  expect(result.statuses.filter(s=>!s.sprite)).toHaveLength(24);
  expect(errors).toEqual([]);
});

test('the real 100-tick round intro displays Gym Bro intro frames, without modifying combat state',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./v8.html');
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro'] && window.SF7_ART_STORE.img('gym-bro','intro',3),null,{timeout:15000});
  const result=await page.evaluate(async()=>{
    const { drawMatch } = await import('./renderer-v7.js');
    const { createMatch } = await import('./combat-v7.js');
    const { byId } = await import('./roster-v7.js');
    const store=window.SF7_ART_STORE;
    const m=createMatch([byId('gym-bro'),byId('yuppie')]);
    m.phaseT=65;
    const before={state:m.fighters[0].state,anim:m.fighters[0].anim,t:m.fighters[0].animT};
    const c=document.createElement('canvas');c.width=960;c.height=540;
    const ctx=c.getContext('2d'),original=ctx.drawImage.bind(ctx);
    const urls=[];
    ctx.drawImage=(img,...args)=>{urls.push(img?.src||'');return original(img,...args);};
    drawMatch(ctx,m,store,{chip:[]});
    const after={state:m.fighters[0].state,anim:m.fighters[0].anim,t:m.fighters[0].animT};
    return {before,after,urls:urls.filter(x=>x.includes('/art/v8/gym-bro/intro/'))};
  });
  expect(result.before).toEqual(result.after);
  expect(result.before.state).toBe('idle');
  expect(result.urls.length).toBeGreaterThan(0);
  expect(result.urls.some(s=>s.includes('/intro/03.png'))).toBeTruthy();
  expect(errors).toEqual([]);
});

test('V8 diagnostic gallery presents all 31 actions and shows which seven have art',async({page})=>{
  await page.goto('./gym-bro-animation-qa-v8.html');
  await expect(page.locator('[data-action]')).toHaveCount(31);
  await expect(page.locator('#summary')).toContainText('7 sprite');
  await expect(page.locator('#summary')).toContainText('24 rig');
  await page.locator('[data-action="hk"]').click();
  await expect(page.locator('#currentAction')).toContainText('hk');
  await page.locator('[data-action="idle"]').click();
  await expect(page.locator('#currentAction')).toContainText('idle');
});
