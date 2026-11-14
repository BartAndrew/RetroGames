import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER } from '../roster-v7.js';
import { SIGNATURES, signatureFor, signatureName, motifPath } from '../signatures-v7.js';
import { addRemixFx, advanceRemixFx, drawRemixFx } from '../remix-fx-v7.js';

test('all 20 V7 characters receive individual signature profiles',()=>{
  assert.equal(ROSTER.length,20);
  assert.equal(new Set(ROSTER.map(f=>f.id)).size,20);
  assert.deepEqual(Object.keys(SIGNATURES).sort(),ROSTER.map(f=>f.id).sort());
  for(const f of ROSTER){
    const s=signatureFor(f);
    assert.ok(s.motif&&s.motion&&s.label,f.id);
    assert.equal(signatureName(f),f.special);
    assert.equal(signatureName(f,'super'),f.superName);
  }
});
function stubCtx(){
  let calls=0;
  const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...args)=>{calls++;return undefined}},set(t,k,v){t[k]=v;return true}});
  return {ctx,count:()=>calls};
}
function mockMatch(a,b){
  return {tick:50,fighters:[a,b]};
}
test('all visual motifs draw without DOM or GPU dependencies',()=>{
  for(const s of Object.values(SIGNATURES)){
    const {ctx,count}=stubCtx();
    motifPath(ctx,s.motif,8);
    assert.ok(count()>0,s.motif);
  }
});
test('roster wide attack, special, super and impact VFX render safely',()=>{
  const {ctx,count}=stubCtx();
  for(let i=0;i<ROSTER.length;i++){
    const def=ROSTER[i],other=ROSTER[(i+1)%ROSTER.length];
    const match=mockMatch({def,side:0,x:180,y:0,facing:1,vx:3,anim:'super',animP:.45,state:'attack',move:{},moveId:'special'},
      {def:other,side:1,x:240,y:0,facing:-1,vx:-3,anim:'hurt',animP:.2,state:'hit',move:null,moveId:null});
    addRemixFx([{type:'hit',who:1,x:240,y:85,power:0.5},{type:'spawn',who:0},
      {type:'superFlash',who:0},{type:'block',who:1,x:240,y:80},
      {type:'cancel',who:0},{type:'slam',who:1,x:240},{type:'land',who:0,x:180}],match);
    advanceRemixFx();
    drawRemixFx(ctx,match);
  }
  assert.ok(count()>500,'Expected many generated draw instructions');
});
