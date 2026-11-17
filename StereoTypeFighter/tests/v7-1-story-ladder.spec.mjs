import {test,expect} from '@playwright/test';

// Story/navigation regression only: winning match states are deliberately
// injected so the four-fight cinematic ladder can be checked quickly.
// This is NOT a substitute for complete combat or controller playtesting.
test('Gym Bro V7.1 preserves every rival, pre/post-fight scene and ending',async({page})=>{
  test.setTimeout(85000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('./v7-1.html');
  await page.waitForFunction(()=>window.SF7?.screen==='title');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.SF7.screen==='select');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');

  const rivals=['bogan-tradie','yuppie','fat-gamer','cheerleader'];
  const seen=[];
  async function advanceTo(target){
    for(let i=0;i<15;i++){
      const screen=await page.evaluate(()=>window.SF7.screen);
      if(screen===target)return;
      if(screen!=='cutscene')throw Error('Unexpected game screen '+screen+' while expecting '+target);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
    throw Error('Did not reach '+target+' after skipping canonical scenes');
  }

  for(let round=0;round<rivals.length;round++){
    await advanceTo('match');
    const state=await page.evaluate(()=>({
      fighter:window.SF7.match.fighters[0].def.id,
      rival:window.SF7.match.fighters[1].def.id,
      step:window.SF7.story.step,
      cut:window.SF7.screen
    }));
    expect(state.fighter).toBe('gym-bro');
    expect(state.rival).toBe(rivals[round]);
    expect(state.step).toBe(round);
    seen.push(state.rival);

    // Simulate a completed player-win only to test the scene/result navigation.
    await page.evaluate(()=>{
      const m=window.SF7.match;
      m.phase='over';m.winner=0;m.roundWinner=0;
    });
    await page.waitForFunction(()=>window.SF7.screen==='cutscene',{timeout:5000});
    await advanceTo('result');
    const result=await page.evaluate(()=>window.SF7.result);
    expect(result.playerWon).toBe(true);
    expect(result.winner.id).toBe('gym-bro');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  }

  await advanceTo('title');
  expect(await page.evaluate(()=>window.SF7.story)).toBeNull();
  expect(seen).toEqual(rivals);
  expect(errors).toEqual([]);
});
