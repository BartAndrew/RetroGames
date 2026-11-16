import { test, expect } from '@playwright/test';

// These are real Git-committed R10 sprites, not synthetic review stand-ins.
// The V7.1 default manifest must remain unchanged until full approval.
test('R10 airK and jumpDown sprites load only behind opt-in flags', async ({page}) => {
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('./v7-1.html?gymBroAirK=1&gymBroJumpDown=1');
  await page.waitForFunction(()=>window.SF7_AIRK_R10_PREVIEW && window.SF7_JUMPDOWN_R10_PREVIEW);
  await page.waitForFunction(()=>{
    const s=window.SF7_ART_STORE;
    return Array.from({length:4},(_,i)=>s.img('gym-bro','airK',i+1)).every(Boolean) &&
           Array.from({length:2},(_,i)=>s.img('gym-bro','jumpDown',i+1)).every(Boolean);
  },null,{timeout:15000});
  const actual=await page.evaluate(()=>{
    const s=window.SF7_ART_STORE, spec=s.spec('gym-bro');
    return {
      airK:spec.anims.airK.frames,jumpDown:spec.anims.jumpDown.frames,
      airKSize:[s.img('gym-bro','airK',4).naturalWidth,s.img('gym-bro','airK',4).naturalHeight],
      jumpDownSize:[s.img('gym-bro','jumpDown',2).naturalWidth,s.img('gym-bro','jumpDown',2).naturalHeight],
      actionCount:Object.keys(spec.anims).length
    };
  });
  expect(actual).toEqual({airK:4,jumpDown:2,airKSize:[512,512],jumpDownSize:[512,512],actionCount:9});
  expect(errors).toEqual([]);
});
test('Unflagged V7.1 keeps original airK fallback and legacy jumpDown', async ({page})=>{
  await page.goto('./v7-1.html');
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
  const state=await page.evaluate(()=>({
    actions:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length,
    airK:window.SF7_ART_STORE.spec('gym-bro').anims.airK||null,
    jumpDown:window.SF7_ART_STORE.spec('gym-bro').anims.jumpDown.frames,
    flagged:!!window.SF7_AIRK_R10_PREVIEW || !!window.SF7_JUMPDOWN_R10_PREVIEW
  }));
  expect(state).toEqual({actions:7,airK:null,jumpDown:1,flagged:false});
});