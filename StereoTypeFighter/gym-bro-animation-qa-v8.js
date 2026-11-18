// Reusable animation QA: shows the actual V8 renderer and the canonical Gym Bro.
import { byId } from './roster-v7.js';
import { ArtStore, drawFighter } from './renderer-v7.js';
import { STAGE } from './combat-v7.js';
window.SF_RELEASE=Object.freeze({version:'8.0',channel:'qa',engine:'V7.2'});
const ACTIONS=['idle','walk','walkBack','dashF','dashB','crouch','block','blockLow',
  'prejump','jumpUp','jumpApex','jumpDown','land','lp','lk','hp','hk','launcher',
  'sweep','airP','airK','hurt','hurtLow','launched','knockdown','ko','getup',
  'special','super','victory','intro'];
const def=byId('gym-bro'),store=new ArtStore(),ctx=document.getElementById('preview').getContext('2d');
const $=id=>document.getElementById(id),selector=$('actionSelect'),grid=$('actionGrid');
let current=0,t=0,playing=true,last=0;
const escapeText=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const hasSprite=id=>!!store.spec('gym-bro')?.anims[id];
for(let i=0;i<ACTIONS.length;i++){
  const id=ACTIONS[i],option=document.createElement('option');
  option.value=id;option.textContent=id;selector.append(option);
  const btn=document.createElement('button');btn.type='button';btn.dataset.action=id;
  btn.innerHTML=escapeText(id)+'<span>loading</span>';
  btn.addEventListener('click',()=>choose(i));
  grid.append(btn);
}
function updateText(){
  const id=ACTIONS[current],entry=store.spec('gym-bro')?.anims[id];
  $('currentAction').textContent=id+' · '+(entry?'released sprite':'procedural rig');
  const loaded=entry?Array.from({length:entry.frames},(_,i)=>store.img('gym-bro',id,i+1)).filter(Boolean).length:0;
  $('status').textContent=entry
    ? ('Sprite '+loaded+' / '+entry.frames+' frames decoded, '+entry.fps+' FPS artwork · '+'60 Hz gameplay unchanged')
    : 'No approved sprite sequence for this action. Rendering canonical yellow-kit Gym Bro rig.';
  $('frame').textContent=Math.round(t)+' / 100';
  for(const btn of grid.querySelectorAll('button')){
    const anim=btn.dataset.action,e=store.spec('gym-bro')?.anims[anim];
    btn.classList.toggle('active',anim===id);
    const badge=btn.querySelector('span');
    badge.textContent=e?'Sprite '+e.frames+' frames':'Rig fallback';
  }
}
function choose(index){
  current=(index+ACTIONS.length)%ACTIONS.length;t=0;last=0;
  selector.value=ACTIONS[current];$('scrub').value=0;updateText();
}
selector.addEventListener('change',()=>choose(ACTIONS.indexOf(selector.value)));
$('prev').addEventListener('click',()=>choose(current-1));
$('next').addEventListener('click',()=>choose(current+1));
$('play').addEventListener('click',()=>{
  playing=!playing;$('play').textContent=playing?'Pause':'Play';last=0;
});
$('scrub').addEventListener('input',e=>{t=Number(e.target.value);updateText()});
addEventListener('keydown',e=>{
 if(e.code==='ArrowLeft'&&!['INPUT','SELECT'].includes(e.target?.tagName))choose(current-1);
 if(e.code==='ArrowRight'&&!['INPUT','SELECT'].includes(e.target?.tagName))choose(current+1);
});
function render(){
  ctx.clearRect(0,0,960,540);
  const back=ctx.createLinearGradient(0,0,0,540);back.addColorStop(0,'#111c31');back.addColorStop(1,'#263448');
  ctx.fillStyle=back;ctx.fillRect(0,0,960,540);
  ctx.strokeStyle='#415374';ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(0,STAGE.floorY+5);ctx.lineTo(960,STAGE.floorY+5);ctx.stroke();
  ctx.textAlign='left';ctx.font='700 18px system-ui';ctx.fillStyle='#ffdf56';
  ctx.fillText('GYM BRO — TYLER',34,43);ctx.fillStyle='#b4c1d8';
  ctx.font='14px system-ui';ctx.fillText('V8 REAL RENDERER',34,66);
  const id=ACTIONS[current],progress=t/100;
  const f={def,x:480,y:0,vx:0,vy:0,facing:1,state:id==='victory'?'victory':'attack',
    anim:id,animT:Math.floor(t*1.1),animP:progress,moveT:Math.floor(t),
    move:def.moves.super,freeze:0,invuln:0};
  if(['airP','airK','jumpUp','jumpApex','jumpDown','launched'].includes(id))f.y=75;
  drawFighter(ctx,f,store);
}
function loop(now){
  if(!last)last=now;
  if(playing){t=(t+Math.min((now-last)/1000*43,5))%101;$('scrub').value=Math.round(t)}
  last=now;
  render();
  requestAnimationFrame(loop);
}
await store.load('./art/manifest-v8.json');
const found=Object.keys(store.spec('gym-bro')?.anims||{});
$('summary').textContent=found.length+' sprite actions / '+(ACTIONS.length-found.length)+
  ' rig actions · '+found.reduce((n,a)=>n+store.spec('gym-bro').anims[a].frames,0)+
  ' released frames / 120 target frames';
choose(0);requestAnimationFrame(loop);
