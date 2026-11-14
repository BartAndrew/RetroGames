// Original lightweight V7 comparison effects. Inspired by PixelFX's procedural approach;
// no third-party PixelFX code or artwork has been copied.
import { STAGE } from './combat-v7.js';
import { signatureFor, signatureName, motifPath } from './signatures-v7.js';
const sparks=[];
const rings=[];
const labels=[];
let serial=0;
const hex=(s)=>/^#[0-9a-f]{6}$/i.test(s||'')?s:'#ffffff';
const r01=(seed)=>{let n=(seed*1664525+1013904223)>>>0;return n/4294967296};
function burst(x,y,c,n=16,power=1,kind='impact',motif='sparks') {
 const seed=++serial*1013;
 for(let i=0;i<n;i++){
  const a=Math.PI*2*(i/n+r01(seed+i)*.16), speed=(1.4+r01(seed+i*17)*5)*power;
  sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-.8,c,
   max:12+Math.floor(r01(seed+i*31)*12),life:12+Math.floor(r01(seed+i*31)*12),
   size:2+Math.floor(r01(seed+i*41)*4),kind,motif});
 }
 rings.push({x,y,c,life:13,max:13,r:8+power*15});
}
export function addRemixFx(events,match){
 if(!match)return;
 for(const e of events) {
  const victim=match.fighters[e.who];
  const f=['hit','counter','block'].includes(e.type)&&victim?match.fighters[1-e.who]:victim||match.fighters[0];
  const sig=signatureFor(f?.def),c=hex(f?.def?.accent);
  const x=e.x??f?.x??480, y=STAGE.floorY-(e.y??(f?.y+75)??75);
  if(['hit','counter','projectileHit'].includes(e.type)){
   burst(x,y,e.type==='counter'?'#ffe078':c,e.type==='counter'?30:20,1+(e.power||0),'impact',sig.motif);
   if(e.type==='counter')labels.push({x,y:y-30,c:'#ffe078',text:'COUNTER',life:36});
  }else if(e.type==='block'){burst(x,y,'#78d7ff',9,.6,'guard',sig.motif)}
  else if(e.type==='slam'){burst(x,STAGE.floorY,'#f0c9a0',24,1.7,'dust')}
  else if(e.type==='land'){burst(x,STAGE.floorY,'#b0a5ba',8,.55,'dust')}
  else if(e.type==='spawn'){
   burst(f.x+f.facing*40,STAGE.floorY-f.y-85,c,17,1.15,'special',sig.motif);
   labels.push({x:f.x,y:STAGE.floorY-f.y-145,c,text:signatureName(f.def),life:46});
  }else if(e.type==='superFlash'){
   burst(f.x,STAGE.floorY-f.y-90,c,45,2,'super',sig.motif);
   labels.push({x:480,y:126,c,text:signatureName(f.def,'super'),life:70});
  }else if(e.type==='cancel')burst(f.x+f.facing*44,STAGE.floorY-f.y-75,c,10,.75,'cancel',sig.motif);
 }
 if(sparks.length>650)sparks.splice(0,sparks.length-650);
}
export function clearRemixFx(){sparks.length=0;rings.length=0;labels.length=0;}
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
  const c=hex(f.def.accent),cx=f.x,fy=STAGE.floorY-f.y,sig=signatureFor(f.def);
  if(f.state==='attack'&&f.move){
   const t=f.animP||0;
   if(t>.18&&t<.67){
    const reach=f.moveId==='hk'||f.moveId==='lk'?95:76;
    const x=cx+f.facing*(40+reach*t*.5),y=fy-(f.moveId==='sweep'?32:82);
    ctx.save();ctx.translate(x,y);ctx.scale(f.facing,1);ctx.strokeStyle=c;
    ctx.lineCap='round';ctx.lineWidth=5+Math.sin(t*Math.PI)*7;ctx.globalAlpha=.65;
    ctx.shadowColor=c;ctx.shadowBlur=15;ctx.beginPath();
    if(sig.motion==='wave'||sig.motion==='pulse'){for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(-13-j*14,0,20+reach*t*.24+j*13,-1.2,1.1);ctx.stroke()}}
    else if(sig.motion==='glitch'){for(let j=0;j<5;j++)ctx.fillRect(-20+j*12,Math.sin(match.tick+j*7)*15,20-j*2,3)}
    else if(sig.motion==='spin'||sig.motion==='orbit'){ctx.arc(-13,0,34+reach*t*.23,0,Math.PI*2);ctx.stroke()}
    else {ctx.arc(-13,0,34+reach*t*.23,-1.2,1.1);ctx.stroke()}
    ctx.restore();
   }
  }
  if(f.anim==='super'){
   const pulse=.6+.4*Math.sin(match.tick*.18);
   ctx.globalAlpha=.3*pulse;ctx.strokeStyle=c;ctx.lineWidth=3;
   for(let i=0;i<3;i++){const a=match.tick*.07+i*Math.PI*2/3,rx=cx+Math.cos(a)*62,ry=fy-82+Math.sin(a)*38;
    ctx.beginPath();ctx.arc(cx,fy-80,48+i*18+match.tick%13,0,Math.PI*2);ctx.stroke();
    ctx.save();ctx.translate(rx,ry);ctx.rotate(a);ctx.fillStyle=c;motifPath(ctx,sig.motif,9);ctx.fill();ctx.restore()}
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
  else {ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(Math.atan2(s.vy,s.vx));
   motifPath(ctx,s.motif||'sparks',s.size*1.5);if(s.motif==='waves'||s.motif==='slashes'){ctx.strokeStyle=s.c;ctx.lineWidth=2;ctx.stroke()}else ctx.fill();ctx.restore()}
 }
 ctx.restore();
 for(const l of labels){ctx.save();ctx.globalAlpha=Math.min(1,l.life/16);ctx.textAlign='center';ctx.font='900 25px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#0a0a18';ctx.strokeText(l.text,l.x,l.y);ctx.fillStyle=l.c;ctx.fillText(l.text,l.x,l.y);ctx.restore()}
 ctx.save();ctx.fillStyle='rgba(5,8,18,.76)';ctx.fillRect(8,8,194,25);ctx.font='bold 12px system-ui';ctx.fillStyle='#7fe0d2';ctx.fillText('V7.1 SIGNATURE FX · TEST',17,25);ctx.restore();
}
