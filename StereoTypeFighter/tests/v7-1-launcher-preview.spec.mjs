import {test,expect} from '@playwright/test';

// Verifies six real, Git-committed launcher sprites load in the running V7.1
// renderer. R8 remains preview-only; all original game versions stay intact.
test('Gym Bro R8 launcher PNGs are served, decoded and opt-in only',async({page})=>{
 const exceptions=[];
 page.on('pageerror',e=>exceptions.push(e.message));
 await page.goto('./v7-1.html?gymBroLauncher=1');
 await page.waitForFunction(()=>window.SF7_LAUNCHER_R8_PREVIEW===true);
 await page.waitForFunction(()=>{
   const a=window.SF7_ART_STORE;
   return Array.from({length:6},(_,i)=>a.img('gym-bro','launcher',i+1)).every(Boolean);
 },null,{timeout:15000});
 const result=await page.evaluate(()=>{
   const a=window.SF7_ART_STORE;
   return {
     frames:a.spec('gym-bro').anims.launcher.frames,
     naturalSizes:Array.from({length:6},(_,i)=>{
       const x=a.img('gym-bro','launcher',i+1);return [x.naturalWidth,x.naturalHeight];
     }),
     otherActions:Object.keys(a.spec('gym-bro').anims).length,
   };
 });
 expect(result.frames).toBe(6);
 expect(result.naturalSizes).toEqual(Array.from({length:6},()=>[512,512]));
 expect(result.otherActions).toBe(8);
 expect(exceptions).toEqual([]);
});
test('Stable V7.1 without flag keeps original rig fallback for launcher',async({page})=>{
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 const state=await page.evaluate(()=>({
   registered:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length,
   launcher:window.SF7_ART_STORE.spec('gym-bro').anims.launcher,
   flag:!!window.SF7_LAUNCHER_R8_PREVIEW
 }));
 expect(state.registered).toBe(7);
 expect(state.launcher).toBeUndefined();
 expect(state.flag).toBe(false);
});
