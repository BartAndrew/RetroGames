import { test, expect } from '@playwright/test';
import path from 'node:path';

// This imports *synthetic* 512px/1600px PNG test fixtures via a real browser ZIP.
// It validates upload/decompression/checksum/manifest switching, NOT art quality.
test('V7.1 Art Lab loads an entire local ZIP without changing deterministic combat',async({page})=>{
  test.setTimeout(110_000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('./v7-1-art-lab.html');
  await page.waitForFunction(()=>window.SF7_ART_STORE?.manifest?.['gym-bro'],null,{timeout:15000});
  const before=await page.evaluate(()=>({
    count:Object.keys(window.SF7_ART_STORE.manifest['gym-bro'].anims).length,
    hp:window.SF7_ART_STORE.spec('gym-bro').anims.hp,
    tick:window.SF7.tick
  }));
  expect(before.count).toBe(7);
  expect(before.hp).toBeUndefined();

  await page.locator('#artPackFile').setInputFiles(
    path.join(process.cwd(),'tests','_tmp_gym_bro_synthetic.zip')
  );
  await page.waitForFunction(()=>window.SF7_ART_LAB_STATUS?.loaded===true,null,{timeout:95000});
  const loaded=await page.evaluate(()=>({
    state:window.SF7_ART_LAB_STATUS,
    count:Object.keys(window.SF7_ART_STORE.manifest['gym-bro'].anims).length,
    punch:window.SF7_ART_STORE.img('gym-bro','hp',1)?.naturalWidth,
    portrait:window.SF7_ART_STORE.portrait('gym-bro')?.naturalHeight,
    prologue:window.SF7_ART_STORE.scene('./art/scenes/prologue-gym-bro.png')?.naturalWidth,
    tick:window.SF7.tick
  }));
  expect(loaded.count).toBe(31);
  expect(loaded.punch).toBe(512);
  expect(loaded.portrait).toBe(1200);
  expect(loaded.prologue).toBe(1600);
  expect(loaded.tick).toBeGreaterThan(before.tick);
  expect(loaded.state).toMatchObject({frames:120,scenes:10,enabled:true});

  await page.locator('#useCandidate').uncheck();
  const reset=await page.evaluate(()=>({
    count:Object.keys(window.SF7_ART_STORE.manifest['gym-bro'].anims).length,
    mode:window.SF7_ART_LAB_STATUS.enabled
  }));
  expect(reset).toMatchObject({count:7,mode:false});
  await page.locator('#useCandidate').check();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>window.SF7.screen)).toBe('select');
  expect(errors).toEqual([]);
});
