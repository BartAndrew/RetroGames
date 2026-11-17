import {test,expect} from '@playwright/test';

test('R13 victory artwork decodes only behind the opt-in preview flag',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v7-1.html?gymBroVictory=1');
 await page.waitForFunction(()=>window.SF7_VICTORY_R13_PREVIEW===true,null,{timeout:15000});
 await page.waitForFunction(()=>Array.from({length:4},(_,i)=>window.SF7_ART_STORE.img('gym-bro','victory',i+1)).every(im=>im?.naturalWidth===512));
 const state=await page.evaluate(()=>({
   count:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length,
   frames:window.SF7_ART_STORE.spec('gym-bro').anims.victory.frames,
   size:[window.SF7_ART_STORE.img('gym-bro','victory',4).naturalWidth,window.SF7_ART_STORE.img('gym-bro','victory',4).naturalHeight]
 }));
 expect(state).toEqual({count:8,frames:4,size:[512,512]});
 expect(errors).toEqual([]);
});

test('Default V7.1 retains its original rig fallback for victory',async({page})=>{
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 const state=await page.evaluate(()=>({
   flags:!!window.SF7_VICTORY_R13_PREVIEW,
   victory:window.SF7_ART_STORE.spec('gym-bro').anims.victory||null,
   count:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length
 }));
 expect(state).toEqual({flags:false,victory:null,count:7});
});

test('R13 frame viewer steps real Git-committed victory PNGs',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./gym-bro-v7-art-qa.html?r13=1');
 await page.waitForFunction(()=>document.querySelector('#anim')?.value==='victory');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/victory/01.png'));
 expect(await page.locator('#counter').textContent()).toContain('1 / 4');
 await page.locator('#next').click();
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('art/gym-bro/victory/02.png'));
 expect(await page.locator('#counter').textContent()).toContain('2 / 4');
 expect(errors).toEqual([]);
});
