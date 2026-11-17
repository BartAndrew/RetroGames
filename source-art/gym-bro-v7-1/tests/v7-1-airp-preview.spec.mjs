import {test,expect} from '@playwright/test';

// R9 preview is deliberately opt-in. Do not confuse frame loading with
// release approval; canonical combat simulation remains unchanged.
test('Gym Bro R9 airP loads four committed PNGs in the real V7.1 renderer',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v7-1.html?gymBroAirP=1');
 await page.waitForFunction(()=>window.SF7_AIRP_R9_PREVIEW===true);
 await page.waitForFunction(()=>{
  const store=window.SF7_ART_STORE;
  return Array.from({length:4},(_,i)=>store.img('gym-bro','airP',i+1)).every(Boolean);
 },null,{timeout:15000});
 const result=await page.evaluate(()=>{
  const store=window.SF7_ART_STORE;
  const definition=store.spec('gym-bro');
  return {
   count:Object.keys(definition.anims).length,
   frames:definition.anims.airP.frames,
   sizes:Array.from({length:4},(_,i)=>{
     const img=store.img('gym-bro','airP',i+1);
     return [img.naturalWidth,img.naturalHeight];
   }),
   launcher:definition.anims.launcher,
  };
 });
 expect(result.frames).toBe(4);
 expect(result.sizes).toEqual(Array.from({length:4},()=>[512,512]));
 expect(result.count).toBe(8);
 expect(result.launcher).toBeUndefined();
 expect(errors).toEqual([]);
});

test('Gym Bro unflagged V7.1 retains original rig fallback for R9 airP',async({page})=>{
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 const result=await page.evaluate(()=>({
  active:Object.keys(window.SF7_ART_STORE.spec('gym-bro').anims).length,
  airP:window.SF7_ART_STORE.spec('gym-bro').anims.airP,
  flag:!!window.SF7_AIRP_R9_PREVIEW,
 }));
 expect(result).toMatchObject({active:7,flag:false});
 expect(result.airP).toBeUndefined();
});