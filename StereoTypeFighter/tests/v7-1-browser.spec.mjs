import { test, expect } from '@playwright/test';

// True browser smoke: new standalone V7.1 entry, canonical Gym Bro selection,
// story prologue and fight, keyboard controls and basic render stability.
test('V7.1 Gym Bro story prologue and fight boot with no JS exceptions', async ({ page }) => {
 const errors=[];
 page.on('pageerror', e=>errors.push(String(e)));
 await page.goto('./v7-1.html');
 await page.waitForFunction(()=>window.SF7?.screen==='title');
 expect(await page.title()).toContain('V7.1');
 await page.keyboard.press('Enter'); // Story mode
 expect(await page.evaluate(()=>window.SF7.screen)).toBe('select');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('ArrowRight');
 expect(await page.evaluate(()=>window.SF7.cursor)).toBe(2);
 await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>window.SF7.screen)).toBe('cutscene');
 // Advance canonical prologue and pre-fight dialogue without rewriting any lines.
 for(let i=0;i<8;i++){
   if(await page.evaluate(()=>window.SF7.screen)!=='cutscene')break;
   await page.keyboard.press('Escape');
   await page.waitForTimeout(100);
 }
 await page.waitForFunction(()=>window.SF7?.screen==='match',null,{timeout:10000});
 const initial=await page.evaluate(()=>({ids:window.SF7.match.fighters.map(f=>f.def.id),tick:window.SF7.match.tick}));
 expect(initial.ids[0]).toBe('gym-bro');
 expect(initial.ids[1]).toBe('bogan-tradie');
 // Allow the 60 Hz clock to transition out of the intro.
 await page.waitForFunction(()=>window.SF7.match.phase==='fight',null,{timeout:10000});
 await page.keyboard.down('d');
 await page.keyboard.press('f');
 await page.keyboard.press('g');
 await page.keyboard.press('h');
 await page.waitForTimeout(1400);
 await page.keyboard.up('d');
 const state=await page.evaluate(()=>({
   tick:window.SF7.match.tick,
   values:window.SF7.match.fighters.map(f=>[f.x,f.hp,f.meter]),
   canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],
 }));
 expect(state.tick).toBeGreaterThan(initial.tick);
 expect(state.canvas).toEqual([960,540]);
 expect(state.values.flat().every(Number.isFinite)).toBe(true);
 expect(errors).toEqual([]);
});
