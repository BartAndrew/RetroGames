import { test, expect } from '@playwright/test';

// Simulated standard Gamepad API in real Chromium.
// This validates the actual V7.1 input-mapping logic, not a physical gamepad.
test('Gym Bro V7.1 standard gamepad controls drive movement and aerial attacks', async ({page})=>{
  test.setTimeout(85000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.__qaPad={
      id:'CI synthetic standard controller',
      connected:true,
      mapping:'standard',
      axes:[0,0,0,0],
      buttons:Array.from({length:18},()=>({pressed:false,value:0}))
    };
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__qaPad]});
  });
  await page.goto('./v7-1.html?gymBroAirK=1&gymBroJumpDown=1');
  await page.waitForFunction(()=>window.SF7?.screen==='title');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  for(let i=0;i<9;i++){
    if(await page.evaluate(()=>window.SF7.screen)!=='cutscene')break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(()=>window.SF7?.screen==='match',null,{timeout:10000});
  await page.waitForFunction(()=>window.SF7.match.phase==='fight',null,{timeout:10000});
  const start=await page.evaluate(()=>window.SF7.match.fighters[0].x);
  await page.evaluate(()=>window.__qaPad.axes[0]=0.85);
  await page.waitForTimeout(200);
  await page.evaluate(()=>window.__qaPad.axes[0]=0);
  const moved=await page.evaluate(()=>window.SF7.match.fighters[0].x);
  expect(moved).toBeGreaterThan(start);
  // Standard controller button 2 => Punch.
  await page.evaluate(()=>window.__qaPad.buttons[2].pressed=true);
  await page.waitForFunction(()=>window.SF7.match.fighters[0].moveId==='lp',null,{timeout:1500});
  await page.evaluate(()=>window.__qaPad.buttons[2].pressed=false);
  await page.waitForTimeout(570);
  // Standard D-pad up (button 12), then button 0 => aerial kick.
  await page.evaluate(()=>window.__qaPad.buttons[12].pressed=true);
  await page.waitForTimeout(70);
  await page.evaluate(()=>window.__qaPad.buttons[12].pressed=false);
  await page.waitForFunction(()=>window.SF7.match.fighters[0].state==='air',null,{timeout:2000});
  await page.evaluate(()=>window.__qaPad.buttons[0].pressed=true);
  await page.waitForFunction(()=>window.SF7.match.fighters[0].moveId==='airK',null,{timeout:1500});
  await page.evaluate(()=>window.__qaPad.buttons[0].pressed=false);
  const actual=await page.evaluate(()=>({
    moveId:window.SF7.match.fighters[0].moveId,
    anim:window.SF7.match.fighters[0].anim,
    health:window.SF7.match.fighters.map(f=>f.hp),
    tick:window.SF7.match.tick,
  }));
  expect(actual.moveId).toBe('airK');
  expect(actual.anim).toBe('airK');
  expect(actual.tick).toBeGreaterThan(0);
  expect(actual.health.every(Number.isFinite)).toBe(true);
  expect(errors).toEqual([]);
});
