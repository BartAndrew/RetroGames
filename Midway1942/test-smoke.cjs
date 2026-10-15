/* Dependency-free Node smoke test for Midway 1942 gameplay and render loop.
   Run: node Midway1942/test-smoke.cjs */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const elements=new Map(),globals={};let queue=[],gameTime=0;
function grad(){return {addColorStop(){}}}
const graphics=new Proxy({
  createLinearGradient:grad,createRadialGradient:grad,createPattern:()=>({}),
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},
  closePath(){},fill(){},stroke(){},ellipse(){},arc(){},quadraticCurveTo(){},
  translate(){},rotate(){},scale(){},fillText(){},putImageData(){}
},{get(o,k){return Object.prototype.hasOwnProperty.call(o,k)?o[k]:o[k]??null},set(o,k,v){o[k]=v;return true}});
function element(id){if(elements.has(id))return elements.get(id);const handlers={};const e={id,style:{},hidden:false,textContent:"",innerHTML:"",handlers,attrs:{},classList:{add(){},remove(){}},addEventListener(n,f){(handlers[n]??=[]).push(f)},setAttribute(n,v){this.attrs[n]=v},getBoundingClientRect(){return {left:0,top:0,width:720,height:960}},setPointerCapture(){},getContext(){return graphics}};elements.set(id,e);return e}
const dom={getElementById:element,createElement(){return {width:0,height:0,getContext(){return graphics}}}};
const storage=new Map(),browser={addEventListener(n,f){(globals[n]??=[]).push(f)}},sandbox={
 document:dom,window:browser,console,performance:{now:()=>0},
 matchMedia:()=>({matches:false}),
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
 requestAnimationFrame:fn=>queue.push(fn),Uint8ClampedArray,Math
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"game.js"),"utf8"),sandbox,{filename:"game.js",timeout:10000});
assert.equal(queue.length,1,"game starts a rendering loop");
function tick(frames){for(let i=0;i<frames;i++){gameTime+=1000/60;assert(queue.length,"animation frame scheduled");queue.shift()(gameTime)}}
function emit(name,key){for(const f of globals[name]||[])f({key,repeat:false,preventDefault(){}})}
tick(2);assert.equal(element("score").textContent,"000000","initial score");
element("startButton").handlers.click[0]();assert.equal(element("overlay").hidden,true,"start hides menu");
emit("keydown"," ");tick(150);emit("keyup"," ");
assert.equal(element("healthBar").style.width.endsWith("%"),true,"health HUD is live");
assert.equal(element("bombs").textContent,"◈ 03","initial ordnance");
emit("keydown","x");assert.equal(element("bombs").textContent,"◈ 02","screen bomb decrements");
emit("keydown","z");assert.equal(element("loops").textContent,"× 02","roll decrements");
emit("keydown","p");assert.equal(element("overlay").hidden,false,"pause shows overlay");
element("startButton").handlers.click[0]();assert.equal(element("overlay").hidden,true,"resume hides overlay");
tick(75);assert.equal(queue.length,1,"animation continues after game activity");
console.log("Midway1942 smoke test passed: render, launch, combat, bomb, roll, pause, resume.");
