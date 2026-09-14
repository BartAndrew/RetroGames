import test from 'node:test';
import assert from 'node:assert/strict';
import {Arena} from '../arena-v6.js';
const canvas={getContext:()=>({})};
const asset=(id,speed=1,defense=1)=>({status:'ready',def:{id,name:id,speed,defense,accent:'#ffd36b',style:'Balanced',special:'Test Special'},frames:{idle:[{}],walk:[{}],jump:[{}],crouch:[{}],punch:[{}],kick:[{}],special:[{}],hurt:[{}],block:[{}],fall:[{}],getup:[{}],victory:[{}]}});
const make=(mode='local',seed=42)=>{const a=new Arena(canvas,()=>{},()=>{},()=>{},()=>{});a.start(mode,[asset('douchebag-dave'),asset('yuppie')],'normal','neon-laneway-beatdown',seed);a.phase='fight';a.phaseTick=0;a.people[0].x=430;a.people[1].x=500;return a};
const tap=(a,side,action)=>{a.setVirtual(side,action,true);a.update();a.setVirtual(side,action,false)};
const run=(a,n)=>{for(let i=0;i<n;i++)a.update()};

test('same-frame punches trade symmetrically',()=>{const a=make();tap(a,0,'punch');a.setVirtual(1,'punch',true); // P2 edge is still available next frame
// restart action setup on exactly the same simulation frame
const b=make();b.setVirtual(0,'punch',true);b.setVirtual(1,'punch',true);b.update();b.setVirtual(0,'punch',false);b.setVirtual(1,'punch',false);run(b,7);assert.ok(b.people[0].hp<100,'P1 should be hit');assert.ok(b.people[1].hp<100,'P2 should be hit');assert.equal(b.people[0].hp,b.people[1].hp)});

test('simultaneous KO is a draw and awards no round point',()=>{const a=make();a.people.forEach(f=>f.hp=7);a.setVirtual(0,'punch',true);a.setVirtual(1,'punch',true);a.update();a.setVirtual(0,'punch',false);a.setVirtual(1,'punch',false);run(a,7);assert.equal(a.phase,'roundover');assert.equal(a.roundReason,'double-ko');assert.deepEqual(a.wins,[0,0]);assert.equal(a.winner,-1)});

test('clock freezes during hit-stop',()=>{const a=make();a.setVirtual(0,'punch',true);a.update();a.setVirtual(0,'punch',false);while(!a.freeze&&a.phase==='fight')a.update();const before=a.remaining,freeze=a.freeze;assert.ok(freeze>0);a.update();assert.equal(a.remaining,before);assert.equal(a.freeze,freeze-1)});

test('ground normals cannot start while airborne',()=>{const a=make();const f=a.people[0];f.y=350;f.vy=-2;a.setVirtual(0,'punch',true);a.update();a.setVirtual(0,'punch',false);assert.equal(f.action,null)});

test('training has unlimited clock, full meter and immediate reset',()=>{const a=make('training');assert.equal(a.remaining,3600);assert.deepEqual(a.people.map(f=>f.meter),[100,100]);run(a,120);assert.equal(a.remaining,3600);a.people[0].hp=12;a.resetTraining();assert.deepEqual(a.people.map(f=>f.hp),[100,100]);assert.deepEqual(a.people.map(f=>f.meter),[100,100])});

test('seeded CPU produces deterministic decisions',()=>{const a=make('cpu',12345),b=make('cpu',12345);run(a,240);run(b,240);const project=s=>({remaining:s.remaining,people:s.people.map(p=>({x:+p.x.toFixed(3),y:+p.y.toFixed(3),state:p.state,hp:p.hp,meter:p.meter,attack:p.action}))});assert.deepEqual(project(a.snapshot()),project(b.snapshot()))});
