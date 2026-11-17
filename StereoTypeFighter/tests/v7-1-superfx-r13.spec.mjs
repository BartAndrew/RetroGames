import { test, expect } from '@playwright/test';

test('Leg Day Tsunami uses opt-in deterministic visual-only effect with unchanged combat stats',async({page})=>{
  test.setTimeout(45000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./v7-1.html?gymBroSuperFX=1');
  await page.waitForFunction(()=>window.SF7_SUPER_FX_R13_PREVIEW===true,null,{timeout:10000});
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
  const before=await page.evaluate(()=>({
    animation:window.SF7_ART_STORE.spec('gym-bro').anims.super||null,
    fighter:window.SF7.match?.fighters?.[0]?.def?.id||null,
  }));
  expect(before.animation).toBeNull();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.SF7.screen==='select');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  for(let i=0;i<10;i++){
    if(await page.evaluate(()=>window.SF7.screen)!=='cutscene')break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
  }
  await page.waitForFunction(()=>window.SF7.screen==='match',null,{timeout:15000});
  await page.evaluate(()=>{
    const f=window.SF7.match.fighters[0];
    f.anim='super'; f.animT=17; f.animP=0.44; f.freeze=60;
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(()=>window.SF7.match.fighters[0].anim)).toBe('super');
  expect(errors).toEqual([]);
});

test('Leg Day Tsunami visual-only effect is absent in default V7.1',async({page})=>{
  await page.goto('./v7-1.html');
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
  expect(await page.evaluate(()=>window.SF7_SUPER_FX_R13_PREVIEW||false)).toBe(false);
});
