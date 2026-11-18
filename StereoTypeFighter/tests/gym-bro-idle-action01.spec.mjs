import { test, expect } from '@playwright/test';
test('Action 01 six Idle sprites play in order and wrap through actual V8 renderer',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v8.html');
 await page.waitForFunction(()=>{
  const s=window.SF7_ART_STORE;
  return s?.manifest?.['gym-bro']?.anims?.idle?.frames===6 &&
    Array.from({length:6},(_,i)=>s.img('gym-bro','idle',i+1)).every(Boolean);
 },null,{timeout:15000});
 const sequence=await page.evaluate(async()=>{
  const {drawFighter}=await import('./renderer-v7.js');
  const {byId}=await import('./roster-v7.js');
  const def=byId('gym-bro'),ctx=document.createElement('canvas').getContext('2d');
  const original=ctx.drawImage.bind(ctx);let sources=[];
  ctx.drawImage=(img,...args)=>{sources.push(img?.src||'');return original(img,...args)};
  return [0,9,18,27,36,45,54].map(t=>{
   sources=[];
   drawFighter(ctx,{def,x:400,y:0,vx:0,vy:0,facing:1,state:'idle',
     anim:'idle',animT:t,animP:0,move:null,freeze:0,invuln:0},window.SF7_ART_STORE);
   const match=sources.find(u=>u.includes('/art/v8/gym-bro/idle/'));
   return match?.split('/').pop()||null;
  });
 });
 expect(sequence).toEqual(['01.png','02.png','03.png','04.png','05.png','06.png','01.png']);
 expect(errors).toEqual([]);
});
test('Action 01 is visible in Gym Bro QA gallery; Walk remains a rig fallback',async({page})=>{
 await page.goto('./gym-bro-animation-qa-v8.html');
 await expect(page.locator('#summary')).toContainText('7 sprite actions');
 await expect(page.locator('#summary')).toContainText('24 rig actions');
 await expect(page.locator('#summary')).toContainText('34 released frames');
 await expect(page.locator('#currentAction')).toContainText('idle · released sprite');
 await page.locator('[data-action="walk"]').click();
 await expect(page.locator('#currentAction')).toContainText('walk · procedural rig');
});
