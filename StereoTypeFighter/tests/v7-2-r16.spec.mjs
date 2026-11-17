import {test,expect} from '@playwright/test';
test('Gym Bro V7.2 boots selection and its unified rig movement without JS errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v7-2.html');
 await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro']);
 await page.keyboard.press('Enter');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('ArrowRight');
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(2);
 await page.keyboard.press('Enter');
 for(let i=0;i<9;i++){
   if(await page.evaluate(()=>window.SF7.screen)!=='cutscene') break;
   await page.keyboard.press('Escape');
   await page.waitForTimeout(60);
 }
 await page.waitForFunction(()=>window.SF7.screen==='match',null,{timeout:12000});
 expect(await page.evaluate(()=>window.SF7.match.fighters[0].def.id)).toBe('gym-bro');
 expect(errors).toEqual([]);
});
test('Gym Bro V7.2 selection responds to standard gamepad direction and confirm',async({page})=>{
 await page.addInitScript(()=>{
   window.__menuPad={axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__menuPad]});
 });
 await page.goto('./v7-2.html');
 await page.waitForFunction(()=>window.SF7?.screen==='title');
 await page.evaluate(()=>window.__menuPad.buttons[0].pressed=true);
 await page.waitForFunction(()=>window.SF7.screen==='select',{timeout:5000});
 await page.evaluate(()=>window.__menuPad.buttons[0].pressed=false);
 await page.waitForTimeout(100);
 await page.evaluate(()=>window.__menuPad.axes[0]=0.9);
 await page.waitForFunction(()=>window.SF7.cursor>0,{timeout:3000});
 await page.evaluate(()=>window.__menuPad.axes[0]=0);
 expect(await page.evaluate(()=>window.SF7.cursor)).toBeGreaterThan(0);
});
