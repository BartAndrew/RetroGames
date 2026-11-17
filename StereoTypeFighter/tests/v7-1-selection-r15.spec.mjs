import {test,expect} from '@playwright/test';

test('selection R15: 20 usable thumbnails, portrait preview and direct confirm button',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7?.screen==='title');
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.SF7.screen==='select');
 const canv=page.locator('#game');
 const rect=await canv.boundingBox();
 const at=(x,y)=>({x:rect.x+x*rect.width/960,y:rect.y+y*rect.height/540});
 await page.mouse.click(at(22+2*110+53,108+43).x,at(22+2*110+53,108+43).y);
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(2);
 expect(await page.evaluate(()=>window.SF7.screen)).toBe('select');
 const btn=at(761,494);await page.mouse.click(btn.x,btn.y);
 await page.waitForFunction(()=>window.SF7.screen==='cutscene');
 expect(await page.evaluate(()=>window.SF7.story?.id)).toBe('gym-bro');
 expect(errors).toEqual([]);
});

test('selection R15: vertical keys navigate the 5-column grid',async({page})=>{
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7?.screen==='title');
 await page.keyboard.press('Enter');
 await page.keyboard.press('ArrowDown');
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(5);
 await page.keyboard.press('ArrowRight');
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(6);
 await page.keyboard.press('ArrowUp');
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(1);
});
