import { test, expect } from '@playwright/test';

test('V8.0 is the default playable game and Gym Bro can be selected',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await expect(page.locator('.version')).toContainText('V8.0');
 await page.waitForFunction(()=>window.SF8?.screen==='title'&&window.SF7_ART_STORE?.manifest?.['gym-bro']);
 expect(await page.evaluate(()=>window.SF_RELEASE.version)).toBe('8.0');
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.SF8.screen==='select');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('ArrowRight');
 expect(await page.evaluate(()=>window.SF8.cursor)).toBe(2);
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.SF8.screen==='cutscene');
 expect(await page.evaluate(()=>window.SF8.story?.id)).toBe('gym-bro');
 expect(errors).toEqual([]);
});
test('V8 direct route works and V7.2 historical page still loads',async({page})=>{
 await page.goto('./v8.html');
 await expect(page.locator('.version')).toContainText('V8.0');
 await page.waitForFunction(()=>window.SF8?.screen==='title');
 await page.goto('./v7-2.html');
 await expect(page.locator('.version')).toContainText('V7.2');
 await page.waitForFunction(()=>window.SF7?.screen==='title');
});
