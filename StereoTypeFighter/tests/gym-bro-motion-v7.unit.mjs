import test from 'node:test';
import assert from 'node:assert/strict';
import {poseFor} from '../renderer-v7.js';
import {byId} from '../roster-v7.js';
const def=byId('gym-bro');
const ids=['idle','walk','walkBack','dashF','dashB','crouch','block','blockLow','prejump','jumpUp','jumpApex','jumpDown','land','lp','lk','hp','hk','launcher','sweep','airP','airK','hurt','hurtLow','launched','knockdown','ko','getup','special','super','victory','intro'];
test('Gym Bro R16 has valid procedural motion for every canonical animation ID',()=>{
  assert.equal(ids.length,31);
  for(const anim of ids){
    for(const [animT,animP] of [[0,0],[11,0.24],[25,0.5],[50,0.83]]){
      const f={def,anim,animT,animP,moveT:animT,state:'attack',move:def.moves.super,vx:0};
      const pose=poseFor(f);
      for(const [key,value] of Object.entries(pose)){
        assert.ok(Number.isFinite(value),`${anim} ${key} at t=${animT}`);
      }
      assert.equal(Object.keys(pose).length,12);
    }
  }
});
test('Gym Bro attack active frames have distinct silhouettes and recover to guard',()=>{
  for(const anim of ['lp','lk','hp','hk','launcher','sweep','airP','airK','special']){
    const sample=p=>poseFor({def,anim,animP:p,animT:Math.floor(p*50),state:'attack'});
    const start=sample(0.1),contact=sample(0.4),end=sample(0.9);
    assert.notDeepEqual(start,contact,`missing hit keyframe for ${anim}`);
    assert.notDeepEqual(contact,end,`missing recover keyframe for ${anim}`);
  }
});
test('Gym Bro super visuals vary across its five canonical hit offsets',()=>{
  const poses=[16,22,28,34,40].map(t=>poseFor({def,anim:'super',animT:t,animP:t/85,moveT:t,move:def.moves.super}));
  assert.equal(new Set(poses.map(p=>JSON.stringify(p))).size,5);
  assert.deepEqual(def.moves.super.hits,[0,6,12,18,24]);
});
