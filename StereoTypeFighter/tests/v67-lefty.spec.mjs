import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const TOTAL=80;

async function boot(page){
  await page.goto('./?qa=1');
  await page.waitForFunction(()=>window.SF?.roster().length===20);
  await expect(page.locator('#startButton')).toBeEnabled({timeout:20000});
}

test('Lefty uses the V6.7 atlas and renders all upgraded animation frames',async({page},info)=>{
  await boot(page);
  await page.evaluate(()=>window.SF.test.loadAll());
  await page.waitForFunction(()=>window.SF.roster().find(f=>f.id==='lefty')?.status==='ready',{timeout:30000});
  const lefty=await page.evaluate(()=>window.SF.roster().find(f=>f.id==='lefty'));
  expect(lefty.render).toBe('atlas');
  expect(lefty.renderMode).toBe('atlas');
  expect(lefty.atlas).toContain('lefty-atlas-v67.avif');
  expect(Object.values(lefty.frames).reduce((a,b)=>a+b,0)).toBe(TOTAL);
  await page.locator('#modeSelect').selectOption('training');
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.SF.snapshot().phase==='fight',{timeout:8000});
  await fs.mkdir('test-results/screenshots',{recursive:true});
  const path='test-results/screenshots/lefty-v67-fight.png';
  await page.screenshot({path,fullPage:true});
  await info.attach('lefty-v67-fight',{path,contentType:'image/png'});
});
