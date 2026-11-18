import { test, expect } from '@playwright/test';

test('V8 game loads Gym Bro portrait and all six production sprite actions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v8.html');
 await page.waitForFunction(()=>window.SF8?.screen==='title' &&
   !!window.SF7_ART_STORE?.manifest?.['gym-bro']?.anims?.hk);
 const art=await page.evaluate(()=>({
   manifest:window.SF7_ART_STORE.manifest['gym-bro'],
   release:window.SF_RELEASE,
 }));
 expect(art.release.version).toBe('8.0');
 expect(art.manifest.path).toContain('/v8/');
 expect(Object.keys(art.manifest.anims).sort()).toEqual(['airK','airP','hk','intro','launcher','victory']);
 expect(art.manifest.anims.idle).toBeUndefined();
 await page.waitForFunction(()=>window.SF7_ART_STORE.portrait('gym-bro')?.naturalWidth===900);
 for(const url of [
  './art/v8/gym-bro/portrait.png',
  './art/v8/gym-bro/hk/03.png',
  './art/v8/gym-bro/launcher/04.png',
  './art/v8/gym-bro/airP/03.png',
  './art/v8/gym-bro/airK/02.png',
  './art/v8/gym-bro/intro/01.png',
  './art/v8/gym-bro/victory/02.png',
  './art/v8/scenes/prologue-gym-bro.png'
 ]){
   const response=await page.request.get(url);
   expect(response.status(),url).toBe(200);
   expect(response.headers()['content-type']||'').toMatch(/image\/png/);
 }
 await page.keyboard.press('Enter');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.SF8.screen==='cutscene'&&window.SF8.story?.id==='gym-bro');
 await page.waitForFunction(()=>window.SF7_ART_STORE.scene('./art/v8/scenes/prologue-gym-bro.png')?.naturalWidth===1600);
 expect(errors).toEqual([]);
});
test('Historical V7.2 ignores new V8 art and keeps the unified Gym Bro procedural rig',async({page})=>{
 await page.goto('./v7-2.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 const a=await page.evaluate(()=>window.SF7_ART_STORE.spec('gym-bro'));
 expect(a.path).toBe('art/{id}/{anim}/{n}.png');
 expect(a.anims.hk).toBeUndefined();
 expect(await page.evaluate(()=>window.SF_RELEASE?.version||null)).toBe(null);
});
