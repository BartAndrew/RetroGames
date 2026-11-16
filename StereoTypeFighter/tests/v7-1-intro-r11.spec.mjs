import { test, expect } from '@playwright/test';

test('R11 Gym Bro intro files load only with explicit opt-in flag',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v7-1.html?gymBroIntro=1');
 await page.waitForFunction(()=>window.SF7_INTRO_R11_PREVIEW===true,null,{timeout:15000});
 await page.waitForFunction(()=>{
   const s=window.SF7_ART_STORE;
   return Array.from({length:4},(_,i)=>s.img('gym-bro','intro',i+1)).every(x=>x?.naturalWidth===512);
 },null,{timeout:15000});
 const data=await page.evaluate(()=>{
   const s=window.SF7_ART_STORE;
   return {frames:s.spec('gym-bro').anims.intro.frames,actions:Object.keys(s.spec('gym-bro').anims).length,
     size:[s.img('gym-bro','intro',4).naturalWidth,s.img('gym-bro','intro',4).naturalHeight]};
 });
 expect(data).toEqual({frames:4,actions:8,size:[512,512]});
 expect(errors).toEqual([]);
});

test('Default V7.1 leaves Gym Bro intro on the original fallback',async({page})=>{
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 const state=await page.evaluate(()=>({enabled:!!window.SF7_INTRO_R11_PREVIEW,
   actions:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length,
   intro:window.SF7_ART_STORE.spec('gym-bro').anims.intro||null}));
 expect(state).toEqual({enabled:false,actions:7,intro:null});
});

test('R11 QA viewer can step actual Git-committed intro PNGs',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./gym-bro-v7-art-qa.html?r11=1');
 await page.waitForFunction(()=>document.querySelector('#anim')?.value==='intro');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/intro/01.png'));
 expect(await page.locator('#counter').textContent()).toContain('1 / 4');
 await page.locator('#next').click();
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/intro/02.png'));
 expect(await page.locator('#counter').textContent()).toContain('2 / 4');
 expect(errors).toEqual([]);
});
