/* Midway Evolution 2.1.0 - deterministic frame clock and bounded render budget. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.MidwayPerformance=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STEP=1/120,MAX_GAP=.25,MAX_STEPS=30;
const MODES=Object.freeze({auto:{pixels:1500000,maxWidth:1800,maxHeight:1200,dpr:1.25,particles:160},performance:{pixels:850000,maxWidth:1280,maxHeight:900,dpr:1,particles:72},quality:{pixels:3000000,maxWidth:2560,maxHeight:1600,dpr:2,particles:240}});
function resolution(width,height,deviceScale=1,mode='auto',adaptive=1){const p=MODES[mode]||MODES.auto;const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);const ratio=Math.min(Math.max(.1,deviceScale||1),p.dpr,Math.sqrt(p.pixels/(w*h)),p.maxWidth/w,p.maxHeight/h)*Math.max(.5,Math.min(1,adaptive));return{width:Math.max(1,Math.floor(w*ratio)),height:Math.max(1,Math.floor(h*ratio)),ratio};}
class Clock{
 constructor(){this.remainder=0;this.dropped=0;}
 reset(){this.remainder=0;}
 advance(seconds,update){const elapsed=Math.max(0,Number(seconds)||0);this.dropped+=Math.max(0,elapsed-MAX_GAP);this.remainder+=Math.min(MAX_GAP,elapsed);let steps=0;while(this.remainder+1e-9>=STEP&&steps<MAX_STEPS){update(STEP);this.remainder=Math.max(0,this.remainder-STEP);steps++;}return steps;}
}
class Budget{
 constructor(mode='auto'){this.mode=MODES[mode]?mode:'auto';this.scale=1;this.elapsed=0;this.frames=0;this.cooldown=0;this.fps=0;this.frameMs=0;}
 setMode(mode){this.mode=MODES[mode]?mode:'auto';this.scale=1;this.elapsed=this.frames=0;this.cooldown=2;}
 sample(seconds){if(!(seconds>0)||seconds>.5)return false;this.cooldown=Math.max(0,this.cooldown-seconds);this.elapsed+=seconds;this.frames++;if(this.elapsed<1)return false;this.fps=this.frames/this.elapsed;this.frameMs=1000/this.fps;this.elapsed=this.frames=0;if(this.mode==='auto'&&this.fps<48&&this.cooldown===0&&this.scale>.5){this.scale=Math.max(.5,this.scale*.8);this.cooldown=3;return true;}return false;}
 get particleLimit(){return Math.round(MODES[this.mode].particles*this.scale);}
}
return{STEP,MAX_GAP,MAX_STEPS,MODES,resolution,Clock,Budget};
});
