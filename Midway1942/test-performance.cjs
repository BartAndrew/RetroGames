'use strict';
const assert=require('node:assert/strict');
const{Clock,Budget,resolution,MODES}=require('./performance.js'),{Engine}=require('./core.js');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('render pixel budgets hold on desktop, Retina, ultrawide and mobile',()=>{for(const[w,h,d]of[[1440,900,1],[1920,1080,2],[3840,2160,2],[5120,1440,2],[390,844,3]])for(const mode of Object.keys(MODES)){const r=resolution(w,h,d,mode);assert(r.width*r.height<=MODES[mode].pixels);assert(r.width<=MODES[mode].maxWidth);assert(r.height<=MODES[mode].maxHeight);assert(r.width>0&&r.height>0);}});
test('120Hz simulation keeps equal time at 30,60,120,144Hz displays',()=>{for(const hz of[30,60,120,144]){let steps=0,time=0;const c=new Clock();for(let n=0;n<hz*2;n++)c.advance(1/hz,dt=>{steps++;time+=dt;});assert.equal(steps,240);assert(Math.abs(time-2)<1e-8);assert.equal(c.dropped,0);}});
test('200ms render stalls do not silently slow gameplay',()=>{let steps=0;const c=new Clock();c.advance(.2,()=>steps++);assert.equal(steps,24);assert.equal(c.dropped,0);});
test('long gaps have bounded catch-up and explicit dropped time',()=>{let steps=0;const c=new Clock();c.advance(3,()=>steps++);assert.equal(steps,30);assert.equal(c.dropped,2.75);c.reset();assert.equal(c.remainder,0);});
test('auto quality reduces resolution; manual modes remain fixed',()=>{const b=new Budget();for(let i=0;i<60;i++)b.sample(1/30);assert(b.scale<1);b.setMode('quality');for(let i=0;i<120;i++)b.sample(1/20);assert.equal(b.scale,1);});
test('adaptive degradation is bounded and particles have budgets',()=>{const b=new Budget();for(let i=0;i<1600;i++)b.sample(.05);assert.equal(b.scale,.5);assert(b.particleLimit>=36);const r=resolution(3840,2160,2,'auto',b.scale);assert(r.width*r.height<400000);});
test('pointer reaches a nearby target without easing lag or overshoot',()=>{const e=new Engine();e.start();const x=e.player.x,y=e.player.y;e.update(.04,{target:{x:x+20,y}});assert.equal(e.player.x,x+20);assert.equal(e.player.y,y);e.update(.04,{target:{x:x+20,y}});assert.equal(e.player.x,x+20);});
test('keyboard travel is refresh-independent with a slower precision mode',()=>{for(const hz of[30,60,120,144]){const e=new Engine({width:4000});e.start();const x=e.player.x,c=new Clock();for(let i=0;i<hz;i++)c.advance(1/hz,dt=>e.update(dt,{x:1}));assert(Math.abs(e.player.x-x-520)<1e-6);}const e=new Engine();e.start();const x=e.player.x;e.update(.04,{x:1,focus:true});assert(Math.abs(e.player.x-x-8.4)<1e-6);});
console.log('Midway performance: '+passed+' regression checks passed.');
