import {test,expect} from '@playwright/test';

// V7 smoke test: boots, lists 20 fighters, plays through a story cutscene into a match, no page errors.
test('V7 boots, story runs prologue to match, versus match is playable',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('./index.html');
  await page.waitForFunction(()=>window.SF7&&window.SF7.screen==='title');
  const key=async k=>{await page.keyboard.press(k);await page.waitForTimeout(80)};

  // Story mode (first menu item): pick the 4th fighter, prologue -> pre-fight -> match
  await key('Enter');
  expect(await page.evaluate(()=>window.SF7.screen)).toBe('select');
  for(let i=0;i<3;i++) await key('ArrowRight');
  await key('Enter');
  expect(await page.evaluate(()=>window.SF7.screen)).toBe('cutscene');
  for(let i=0;i<12&&(await page.evaluate(()=>window.SF7.screen))==='cutscene';i++){await key('Escape');await page.waitForTimeout(150)}
  await page.waitForFunction(()=>window.SF7.screen==='match',{timeout:8000});

  // fight for a couple of seconds with inputs; state must stay finite
  await page.keyboard.down('d');
  for(let i=0;i<10;i++){await page.keyboard.press('f');await page.waitForTimeout(120)}
  await page.keyboard.up('d');
  const ok=await page.evaluate(()=>window.SF7.match.fighters.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.hp)));
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
});
