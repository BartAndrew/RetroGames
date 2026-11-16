// Gym Bro V7: zero-dependency, deterministic combat/story regression checks.
// Run from StereoTypeFighter: node tools/test-gym-bro-v7.mjs
import assert from 'node:assert/strict';
import { FPS, createMatch, stepMatch } from '../combat-v7.js';
import { ROSTER, byId } from '../roster-v7.js';
import { getScene, sceneId, ladderFor } from '../story-v7.js';

const gym = byId('gym-bro');
assert.ok(gym, 'Gym Bro missing from roster');
assert.equal(FPS, 60, 'The deterministic combat simulation must remain at 60 Hz');
assert.equal(gym.nick, 'Tyler');
assert.equal(gym.hp, 1100);
assert.equal(gym.speed, 0.94);
assert.equal(gym.jump, 13);
assert.equal(gym.special, 'Protein Shaker Blast');
assert.equal(gym.superName, 'LEG DAY TSUNAMI');
assert.equal(gym.specialSpec.kind, 'projectile');
assert.equal(gym.specialSpec.speed, 6.2);
assert.equal(gym.specialSpec.dmg, 13);
assert.equal(gym.moves.lp.name, 'Pump Jab');
assert.equal(gym.moves.hp.name, 'Bicep Cross');
assert.equal(gym.moves.hk.name, 'Quad Axe');
assert.equal(gym.moves.launcher.name, 'Deadlift Uppercut');
assert.equal(gym.moves.special.startup, 14);
assert.equal(gym.moves.special.recovery, 26);
assert.deepEqual(gym.moves.super.hits, [0, 6, 12, 18, 24]);
assert.equal(gym.moves.super.finisher.dmg, 24);

const rivals = ['bogan-tradie', 'yuppie', 'fat-gamer', 'cheerleader'];
assert.deepEqual(ladderFor('gym-bro', ROSTER), rivals, 'Four-fight story rival order changed');
const scenes = [sceneId.prologue('gym-bro')];
for (const rival of rivals) {
  scenes.push(sceneId.pre('gym-bro', rival), sceneId.post('gym-bro', rival));
}
scenes.push(sceneId.ending('gym-bro'));
for (const id of scenes) {
  const scene = getScene(id);
  assert.ok(scene, 'Missing scene '+id);
  assert.ok(scene.place && scene.mood, 'Missing place/mood '+id);
  assert.ok(Array.isArray(scene.lines) && scene.lines.length >= 4, 'Missing dialogue '+id);
  for (const line of scene.lines) {
    assert.ok(line.who && typeof line.text === 'string' && line.text.trim(), 'Invalid dialogue '+id);
  }
}
assert.match(getScene(sceneId.prologue('gym-bro')).lines[0].text, /Protein Shortage/);
assert.match(getScene(sceneId.ending('gym-bro')).lines[0].text, /real trophy/);

// Feed the same deterministic input sequence to independent 60 Hz simulations.
// The runner snapshots game state (not any nondeterministic draw/shake effects).
const opponent = byId('bogan-tradie');
const clean = Object.freeze({left:false,right:false,up:false,down:false,punch:false,kick:false,special:false,block:false});
function sample(f) {
  return {
    x:f.x,y:f.y,vx:f.vx,vy:f.vy,hp:f.hp,meter:f.meter,
    state:f.state,anim:f.anim,animT:f.animT,animP:f.animP,
    facing:f.facing,stun:f.stun,moveId:f.moveId,combo:f.combo,wins:f.wins,
  };
}
function run() {
  const m=createMatch([gym,opponent],{toWin:1});
  const timeline=[];
  for(let tick=0;tick<480;tick++){
    const p = {...clean};
    if(tick>=160 && tick<200)p.right=true;
    if([220,245,280,320].includes(tick))p.punch=true;
    if(tick===350)p.special=true;
    if(tick>=390 && tick<420)p.block=true;
    stepMatch(m,[p,clean]);
    timeline.push([m.tick,m.phase,m.phaseT,m.timer,m.round,sample(m.fighters[0]),sample(m.fighters[1]),
      m.projectiles.map(x=>({x:x.x,y:x.y,vx:x.vx,owner:x.owner,dmg:x.dmg}))]);
  }
  return timeline;
}
assert.deepEqual(run(),run(), 'Identical 60 Hz inputs diverged between simulations');
// Verify the actual engine action dispatch that uses the newly committed R8/R9
// sprite IDs. This tests gameplay state only, never authorizes sprite QA.
function readyMatch(){
  const match=createMatch([gym,opponent],{toWin:1});
  for(let t=0;t<120&&match.phase!=='fight';t++)stepMatch(match,[clean,clean]);
  assert.equal(match.phase,'fight','combat intro never reached fight phase');
  return match;
}
const inAir=readyMatch();
stepMatch(inAir,[{...clean,up:true},clean]);
for(let tick=0;tick<5;tick++)stepMatch(inAir,[clean,clean]);
assert.equal(inAir.fighters[0].state,'air','Tyler should be airborne before airP input');
stepMatch(inAir,[{...clean,punch:true},clean]);
assert.equal(inAir.fighters[0].moveId,'airP','Jump + punch must use airP');
assert.equal(inAir.fighters[0].anim,'airP','airP must drive the actual renderer ID');
assert.equal(gym.moves.airP.name,'Jump Punch');
const onGround=readyMatch();
stepMatch(onGround,[{...clean,down:true,punch:true},clean]);
assert.equal(onGround.fighters[0].moveId,'launcher','Down + punch must use canonical launcher');
assert.equal(onGround.fighters[0].anim,'launcher','launcher must drive the actual renderer ID');

const airborneKick=readyMatch();
stepMatch(airborneKick,[{...clean,up:true},clean]);
for(let t=0;t<5;t++) stepMatch(airborneKick,[clean,clean]);
assert.equal(airborneKick.fighters[0].state,'air');
stepMatch(airborneKick,[{...clean,kick:true},clean]);
assert.equal(airborneKick.fighters[0].moveId,'airK','Jump+kick must trigger airK');
assert.equal(airborneKick.fighters[0].anim,'airK','airK ID must drive the renderer');
const descent=readyMatch();
stepMatch(descent,[{...clean,up:true},clean]);
let sawDescending=false;
for(let t=0;t<80;t++) {
  stepMatch(descent,[clean,clean]);
  const f=descent.fighters[0];
  if(f.anim==='jumpDown' && f.y>0) {sawDescending=true;break;}
}
assert.equal(sawDescending,true,'Expected renderer jumpDown ID while descending');
// Four full 60 Hz engine matches against passive canonical opponents.
// Unlike the browser story-navigation smoke, these outcomes are *not injected*:
// a real projectile must damage the opponent and the normal match flow must
// decide the winner. This does not substitute for CPU AI or controller QA.
for (const rival of rivals) {
  const opp=byId(rival);
  assert.ok(opp,'Missing rival '+rival);
  const match=createMatch([gym,opp],{toWin:1});
  let everDamaged=false, won=false;
  for(let tick=0;tick<5000;tick++){
    const pressSpecial=match.phase==='fight' && tick%95===0;
    stepMatch(match,[{...clean,special:pressSpecial},clean]);
    if(match.fighters[1].hp<match.fighters[1].maxHp)everDamaged=true;
    if(match.phase==='over'){
      won=match.winner===0;
      break;
    }
  }
  assert.ok(everDamaged,'A real Protein Shaker Blast never damaged '+rival);
  assert.ok(won,'Did not finish a full 60 Hz passive-opponent match against '+rival);
  assert.ok(Number.isFinite(match.fighters[0].hp));
  assert.ok(Number.isFinite(match.fighters[1].hp));
}

console.log('PASS Gym Bro V7: canonical moves, 10 story scenes, four rivals, deterministic 480-tick simulation');
