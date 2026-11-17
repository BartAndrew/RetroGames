import { test, expect } from '@playwright/test';

// Uses actual Git-committed R12 high-kick PNGs, never a synthetic asset fixture.
test('Gym Bro R12 Quad Axe high-kick animation only loads with opt-in', async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./v7-1.html?gymBroHK=1');
  await page.waitForFunction(()=>window.SF7_HK_R12_PREVIEW===true,null,{timeout:15000});
  await page.waitForFunction(()=>{
    const s=window.SF7_ART_STORE;
    return s?.manifest?.['gym-bro'] && Array.from({length:6},(_,i)=>s.img('gym-bro','hk',i+1)).every(x=>x?.naturalWidth===512);
  },null,{timeout:15000});
  const info=await page.evaluate(()=>{
    const s=window.SF7_ART_STORE, spec=s.spec('gym-bro');
    return {frames:spec.anims.hk.frames, actions:Object.keys(spec.anims).length,
      last:[s.img('gym-bro','hk',6).naturalWidth,s.img('gym-bro','hk',6).naturalHeight]};
  });
  expect(info).toEqual({frames:6,actions:8,last:[512,512]});
  expect(errors).toEqual([]);
});

test('R12 off preserves original art and deterministic engine',async({page})=>{
  await page.goto('./v7-1.html');
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
  const state=await page.evaluate(()=>({on:!!window.SF7_HK_R12_PREVIEW,
    hk:window.SF7_ART_STORE.spec('gym-bro').anims.hk||null,
    registered:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length}));
  expect(state).toEqual({on:false,hk:null,registered:7});
});

test('R12 QA viewer steps high-kick frames and handles facing flip',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./gym-bro-v7-art-qa.html?r12=1');
  await page.waitForFunction(()=>document.querySelector('#anim')?.value==='hk');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/hk/01.png'));
  expect(await page.locator('#counter').textContent()).toContain('1 / 6');
  await page.locator('#next').click();
  await page.locator('#next').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/hk/03.png'));
  expect(await page.locator('#counter').textContent()).toContain('3 / 6');
  await page.locator('#flip').check();
  expect(await page.locator('#flip').isChecked()).toBe(true);
  expect(errors).toEqual([]);
});
