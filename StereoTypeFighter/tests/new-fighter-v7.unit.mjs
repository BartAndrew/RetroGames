import test from 'node:test';
import assert from 'node:assert/strict';
import {ROSTER} from '../roster-v7.js';
import {ACTION_IDS,buildHandoff} from '../tools/new-fighter-v7.mjs';
test('all 20 fighters have canonical reusable 31-state production contracts',async()=>{
 assert.equal(ROSTER.length,20);
 const ids=new Set;
 for(const f of ROSTER){
  const plan=await buildHandoff(f.id);
  assert.equal(plan.fighter_id,f.id);
  assert.equal(plan.animation.required_actions,31);
  assert.equal(plan.animation.actions.length,ACTION_IDS.length);
  assert.equal(plan.animation.required_frames,
    plan.animation.actions.reduce((s,a)=>s+a.frames_required,0));
  assert.equal(plan.story.scenes.length,2+2*plan.story.rivals.length);
  assert.equal(plan.combat.fps,60);
  assert.equal(plan.combat.special_name,f.special);
  assert.equal(plan.combat.super_name,f.superName);
  assert.equal(plan.animation.actions.find(a=>a.id==='super').move_name,f.moves.super.name);
  assert.ok(plan.story.scenes.every(s=>s.dialogue_lines>0));
  assert.ok(plan.animation.actions.every(a=>a.art_status==='candidate_only'));
  ids.add(plan.fighter_id);
 }
 assert.equal(ids.size,20);
});
test('Gym Bro inherits canon rather than a generic invented move kit',async()=>{
 const t=await buildHandoff('gym-bro');
 assert.equal(t.character_name,'Tyler');
 assert.equal(t.combat.hp,1100);
 assert.equal(t.combat.special_name,'Protein Shaker Blast');
 assert.equal(t.combat.super_name,'LEG DAY TSUNAMI');
 assert.deepEqual(t.combat.super_hits,[0,6,12,18,24]);
 assert.deepEqual(t.story.rivals,['bogan-tradie','yuppie','fat-gamer','cheerleader']);
 assert.equal(t.story.required_illustrations,10);
 assert.equal(t.animation.required_frames,120);
 assert.equal(t.animation.actions.find(a=>a.id==='hp').move_name,'Bicep Cross');
});
test('invalid fighter rejected without writing or inventing new canon',async()=>{
 await assert.rejects(buildHandoff('not-a-roster-fighter'),/Unknown fighter ID/);
});
