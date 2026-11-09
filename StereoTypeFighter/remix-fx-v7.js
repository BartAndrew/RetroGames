// Original lightweight V7 comparison effects. Inspired by PixelFX's procedural approach;
// no third-party PixelFX code or artwork has been copied.
import { STAGE } from './combat-v7.js';
const sparks=[];
const rings=[];
const labels=[];
let serial=0;
const hex=(s)=>/^#[0-9a-f]{6}$/i.test(s||'')?s:'#ffffff';
const r01=(seed)=>{let n=(seed*1664525+1013904223)>>>0;return n/4294967296};
function burst(x,y,c,n=16,power=1,kind='impact') {
 const seed=++serial*1013;
 for(let i=0;i<n;i++){
  const a=Math.PI*2*(i/n+r01(seed+i)*.16), speed=(1.4+r01(seed+i*17)*5)*power;
  sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-.8,c,
   max:12+Math.floor(r01(seed+i*31)*12),life:12+Math.floor(r01(seed+i*31)*12),
   size:2+Math.floor(r01(seed+i*41)*4),kind});
 }
 rings.push({x,y,c,life:13,max:13,r:8+power*15});
}
export function addRemixFx(events,match){
 if(!match)return;
 for(const e of events) {
  const f=match.fighters[e.who]||match.fighters[0],c=hex(f?.def?.accent);
  const x=e.x??f?.x??480, y=STAGE.floorY-(e.y??(f?.y+75)??75);
  if(['hit','counter','projectileHit'].includes(e.type)){
   burst(x,y,e.type==='counter'?'#ffe078':c,e.type==='counter'?30:20,1+(e.power||0));
   if(e.type==='counter')labels.push({x,y:y-30,c:'#ffe078',text:'COUNTER',life:36});
  }else if(e.type==='block'){burst(x,y,'#78d7ff',9,.6)}
  else if(e.type==='slam'){burst(x,STAGE.floorY,'#f0c9a0',24,1.7,'dust')}
  else if(e.type==='land'){burst(x,STAGE.floorY,'#b0a5ba',8,.55,'dust')}
  else if(e.type==='spawn'){
   burst(f.x+f.facing*40,STAGE.floorY-85,c,17,1.15);
  }else if(e.type==='superFlash'){
   burst(f.x,STAGE.floorY-f.y-90,c,45,2);
   labels.push({x:480,y:126,c,text:e.name||'SUPER',life:70});
  }else if(e.type==='cancel')burst(f.x+f.facing*44,STAGE.floorY-f.y-75,c,10,.75);
 }
 if(sparks.length>650)sparks.splice(0,sparks.length-650);
}
export function advanceRemixFx(){
 for(const s of sparks){s.x+=s.vx;s.y+=s.vy;s.vx*=.965;s.vy=s.vy*.96+.12;s.life--}
 for(const r of rings)r.life--;
 for(const l of labels){l.life--;l.y-=.26}
 for(const a of [sparks,rings,labels])for(let i=a.length-1;i>=0;i--)if(a[i].life<=0)a.splice(i,1);
}
export function drawRemixFx(ctx,match){
 if(!match)return;
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 for(const f of match.fighters){
  const c=hex(f.def.accent),cx=f.x,fy=STAGE.floorY-f.y;
  if(f.state==='attack'&&f.move){
   const t=f.animP||0;
   if(t>.18&&t<.67){
    const reach=f.moveId==='hk'||f.moveId==='lk'?95:76;
    const x=cx+f.facing*(40+reach*t*.5),y=fy-(f.moveId==='sweep'?32:82);
    ctx.save();ctx.translate(x,y);ctx.scale(f.facing,1);ctx.strokeStyle=c;
    ctx.lineCap='round';ctx.lineWidth=5+Math.sin(t*Math.PI)*7;ctx.globalAlpha=.65;
    ctx.shadowColor=c;ctx.shadowBlur=15;ctx.beginPath();
    ctx.arc(-13,0,34+reach*t*.23,-1.2,1.1);ctx.stroke();ctx.restore();
   }
  }
  if(f.anim==='super'){
   const pulse=.6+.4*Math.sin(match.tick*.18);
   ctx.globalAlpha=.3*pulse;ctx.strokeStyle=c;ctx.lineWidth=3;
   for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(cx,fy-80,55+i*18+match.tick%13,0,Math.PI*2);ctx.stroke()}
  }
  if(f.state==='dash'||(f.state==='air'&&Math.abs(f.vx)>2.5)){
   ctx.globalAlpha=.35;ctx.fillStyle=c;
   for(let i=1;i<=3;i++)ctx.fillRect(cx-i*Math.sign(f.vx||f.facing)*15-3,fy-30+i*8,12-i*2,4);
  }
 }
 for(const r of rings){const t=1-r.life/r.max;ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=r.c;ctx.lineWidth=5*(1-t)+1;ctx.beginPath();ctx.arc(r.x,r.y,r.r+t*35,0,Math.PI*2);ctx.stroke()}
 for(const s of sparks){
  ctx.globalAlpha=Math.min(1,s.life/s.max)*.9;ctx.fillStyle=s.c;
  if(s.kind==='dust')ctx.fillRect(Math.round(s.x),Math.round(s.y),s.size*2,2);
  else {ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(Math.atan2(s.vy,s.vx));ctx.fillRect(0,-s.size/2,s.size*3,s.size);ctx.restore()}
 }
 ctx.restore();
 for(const l of labels){ctx.save();ctx.globalAlpha=Math.min(1,l.life/16);ctx.textAlign='center';ctx.font='900 25px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#0a0a18';ctx.strokeText(l.text,l.x,l.y);ctx.fillStyle=l.c;ctx.fillText(l.text,l.x,l.y);ctx.restore()}
 ctx.save();ctx.fillStyle='rgba(5,8,18,.76)';ctx.fillRect(8,8,194,25);ctx.font='bold 12px system-ui';ctx.fillStyle='#7fe0d2';ctx.fillText('V7 FX REMIX · TEST BUILD',17,25);ctx.restore();
}
