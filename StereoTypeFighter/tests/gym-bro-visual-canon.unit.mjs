// Fallback-art canon checks. These do not approve offline/generated sprite PNGs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { byId } from '../roster-v7.js';
import { drawRig, poseFor } from '../renderer-v7.js';

const gym = byId('gym-bro');
test('Gym Bro canonical identity, special and 60 Hz super settings remain consistent', () => {
  assert.equal(gym.nick, 'Tyler');
  assert.equal(gym.look.top, '#ffda21');
  assert.equal(gym.look.hat, 'backcap');
  assert.equal(gym.look.hatColor, '#0c0d12');
  assert.equal(gym.look.tank, true);
  assert.equal(gym.look.boots, '#f7f7fb');
  assert.equal(gym.look.prop, 'shaker');
  assert.equal(gym.hp, 1100);
  assert.equal(gym.special, 'Protein Shaker Blast');
  assert.equal(gym.superName, 'LEG DAY TSUNAMI');
  assert.deepEqual(gym.moves.super.hits, [0,6,12,18,24]);
  assert.equal(gym.moves.super.finisher.dmg, 24);
});

function canvasSpy() {
  const ops = [], gradient = () => ({ addColorStop(){} });
  const ctx = new Proxy({}, {
    get(_t,k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return gradient;
      return (...args)=>{ops.push([k,...args])};
    },
    set(_t,k,v) {ops.push(['set',k,v]);return true}
  });
  return {ctx,ops};
}
test('drawRig renders Gym Bro lettering, black cap and white socks without sprite assets', () => {
  const f = {def:gym, anim:'idle', animT:0, animP:0, state:'idle', vx:0};
  const {ctx,ops} = canvasSpy();
  assert.doesNotThrow(()=>drawRig(ctx,gym,f,poseFor(f)));
  assert.deepEqual(ops.filter(x=>x[0]==='fillText').map(x=>x[1]),['GYM','BRO']);
  assert.ok(ops.some(x=>x[0]==='set'&&x[1]==='fillStyle'&&x[2]==='#0c0d12'));
  assert.ok(ops.some(x=>x[0]==='set'&&x[1]==='strokeStyle'&&x[2]==='#f9f9f6'));
  assert.ok(ops.some(x=>x[0]==='set'&&x[1]==='strokeStyle'&&x[2]==='#f0f0f2'));
});
test('other fighters never inherit Gym Bro costume markings',()=>{
  const def=byId('yuppie'), f={def,anim:'idle',animT:0,animP:0,state:'idle',vx:0};
  const {ctx,ops}=canvasSpy();
  assert.doesNotThrow(()=>drawRig(ctx,def,f,poseFor(f)));
  assert.equal(ops.filter(x=>x[0]==='fillText').length,0);
});
