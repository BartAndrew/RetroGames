import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const TOTAL=140;

async function boot(page){
  await page.goto('./?qa=1');
  await page.waitForFunction(()=>window.SF?.roster().length===20);
  await expect(page.locator('#startButton')).toBeEnabled({timeout:20000});
}

test('Lefty uses the V6.8 high-detail reference atlas and renders all mapped animation frames',async({page},info)=>{
  await boot(page);
  await page.evaluate(()=>window.SF.test.loadAll());
  await page.waitForFunction(()=>window.SF.roster().find(f=>f.id==='lefty')?.status==='ready',{timeout:30000});
  const lefty=await page.evaluate(()=>window.SF.roster().find(f=>f.id==='lefty'));
  expect(lefty.render).toBe('atlas');
  expect(lefty.renderMode).toBe('atlas');
  expect(lefty.atlas).toContain('assets/characters/v66/lefty-v68-atlas.webp');
  expect(lefty.atlasCell).toEqual([128,128]);
  expect(lefty.atlasColumns).toBe(8);
  expect(lefty.spriteScale).toBeCloseTo(1.45,2);
  expect(Object.values(lefty.frames).reduce((a,b)=>a+b,0)).toBe(TOTAL);
  await page.locator('#modeSelect').selectOption('training');
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.SF.snapshot().phase==='fight',{timeout:8000});
  await fs.mkdir('test-results/screenshots',{recursive:true});
  const path='test-results/screenshots/lefty-v68-fight.png';
  await page.screenshot({path,fullPage:true});
  await info.attach('lefty-v68-fight',{path,contentType:'image/png'});
});
