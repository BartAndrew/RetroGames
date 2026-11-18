// No-browser rendering contract: exercises the actual V8 renderer with a
// Canvas2D spy. Complements Playwright's asset decode and gameplay smoke tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

globalThis.window={
  location:{pathname:'/StereoTypeFighter/v8.html',search:''},
  SF_RELEASE:{version:'8.0'}
};
const {drawFighter,drawMatch}=await import('../renderer-v7.js');
const {byId}=await import('../roster-v7.js');
const {createMatch}=await import('../combat-v7.js');
const manifest=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../art/manifest-v8.json',import.meta.url)),'utf8'));
const def=byId('gym-bro'), spriteActions=['airK','airP','hk','intro','launcher','victory'];
const allActions=['idle','walk','walkBack','dashF','dashB','crouch','block','blockLow','prejump','jumpUp','jumpApex','jumpDown','land',
  'lp','lk','hp','hk','launcher','sweep','airP','airK','hurt','hurtLow','launched','knockdown','ko','getup','special','super','victory','intro'];

function spyContext(){
 const urls=[],calls=[];
 const gradient=()=>({addColorStop(){}});
 const ctx=new Proxy({},{
   get(_target,key){
     if(key==='createLinearGradient'||key==='createRadialGradient')return gradient;
     if(key==='drawImage')return (img)=>{urls.push(img?.src||'')};
     return (...args)=>{calls.push([key,...args])};
   },
   set(){return true}
 });
 return {ctx,urls,calls};
}
const store={
 has:id=>id==='gym-bro',
 spec:id=>manifest[id],
 img:(id,anim,n)=>({
   src:`https://example.org/StereoTypeFighter/art/v8/${id}/${anim}/${String(n).padStart(2,'0')}.png`,
   width:512,height:512
 })
};
function fighter(anim){
 return{def,x:420,y:0,vx:0,vy:0,facing:1,freeze:0,invuln:0,
   state:'attack',anim,animT:25,animP:.48,moveT:25,move:def.moves.super};
}

test('actual V8 drawFighter routes exactly six sprite actions; remaining 25 render as rig',()=>{
 assert.equal(allActions.length,31);
 assert.equal(spriteActions.length,6);
 const used=[];
 for(const anim of allActions){
   const spy=spyContext();
   assert.doesNotThrow(()=>drawFighter(spy.ctx,fighter(anim),store),anim);
   const paths=spy.urls.filter(x=>x.includes('/art/v8/gym-bro/'));
   if(paths.length)used.push(anim);
   if(spriteActions.includes(anim)){
     assert.ok(paths.length>=1,anim+' must use a V8 PNG sprite');
     assert.ok(paths.every(p=>p.includes('/'+anim+'/')),anim+' cannot borrow unrelated action art');
   }else{
     assert.equal(paths.length,0,anim+' must render procedural rig, not unapproved PNGs');
     assert.ok(spy.calls.some(call=>call[0]==='stroke'),anim+' rig should draw an articulated silhouette');
   }
 }
 assert.deepEqual(used.sort(),spriteActions);
});

test('drawMatch uses Intro sprites during round lead-in without mutating fighter combat state',()=>{
 const m=createMatch([def,byId('yuppie')]);
 m.phaseT=65;
 const snapshot=JSON.stringify({state:m.fighters[0].state,anim:m.fighters[0].anim,
   moveT:m.fighters[0].moveT,phase:m.phase,phaseT:m.phaseT});
 const spy=spyContext();
 drawMatch(spy.ctx,m,store,{chip:[]});
 assert.ok(spy.urls.some(u=>u.includes('/gym-bro/intro/03.png')),'round 65 should draw intro sprite 03');
 assert.equal(JSON.stringify({state:m.fighters[0].state,anim:m.fighters[0].anim,
   moveT:m.fighters[0].moveT,phase:m.phase,phaseT:m.phaseT}),snapshot,
   'visual intro cannot change combat state or timing');
 m.phase='fight';const next=spyContext();
 drawMatch(next.ctx,m,store,{chip:[]});
 assert.ok(!next.urls.some(u=>u.includes('/gym-bro/intro/')),'no intro art while fighting');
});
