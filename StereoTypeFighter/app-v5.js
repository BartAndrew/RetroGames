import {loadFighter,drawSprite,sequences,pose} from './sprites-v5.js';
import {Arena,CONTROL} from './arena-v5.js';
const $=id=>document.getElementById(id);
const selectScreen=$('selectScreen'),matchScreen=$('matchScreen'),grid=$('fighterGrid');
const assets=new Map();let roster=[],selected=['douchebag-dave','bimbo-babe'],slot=0,mode='cpu',muted=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame=0,labTick=0,labPlaying=true,labWasPaused=false,audio;
try{const saved=JSON.parse(localStorage.getItem('sf-v5')||'{}');if(typeof saved.muted==='boolean')muted=saved.muted;if(typeof saved.reduced==='boolean')reduced=saved.reduced;}catch{}
function save(){try{localStorage.setItem('sf-v5',JSON.stringify({muted,reduced}));}catch{}}
function sound(freq=300,duration=.03){if(muted)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.value=.045;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.stop(audio.currentTime+duration);}catch{}}
const arena=new Arena($('gameCanvas'),updateHUD,sound);
function settings(){arena.reduced=reduced;document.body.classList.toggle('reduced',reduced);$('motionButton').textContent='REDUCED MOTION: '+(reduced?'ON':'OFF');$('motionButton').setAttribute('aria-pressed',String(reduced));$('muteButton').textContent='SOUND '+(muted?'OFF':'ON');$('muteButton').setAttribute('aria-pressed',String(muted));}
function ready(id){return assets.get(id)?.status==='ready';}
function choose(id,target=slot){selected[target]=id;slot=target;sync();sound(370,.025);}
function sync(){
 for(let i=0;i<2;i++){
  const def=roster.find(f=>f.id===selected[i]);if(!def)continue;
  const p=$('preview'+i);p.classList.toggle('active',slot===i);p.querySelector('.slot-head').setAttribute('aria-pressed',String(slot===i));p.querySelector('em').textContent=slot===i?'SELECTING':'CHANGE';p.querySelector('h2').textContent=def.name;p.querySelector('.country').textContent=def.country;p.querySelector('.archetype').textContent=def.style;p.querySelector('.bio').textContent=def.bio;p.querySelector('.signature strong').textContent=def.special;
  p.querySelectorAll('meter')[0].value=def.speed||1;p.querySelectorAll('meter')[1].value=def.defense||1;
 }
 for(const b of grid.children){const id=b.dataset.id;b.classList.toggle('chosen1',selected[0]===id);b.classList.toggle('chosen2',selected[1]===id);b.querySelector('[data-badge="0"]').hidden=selected[0]!==id;b.querySelector('[data-badge="1"]').hidden=selected[1]!==id;b.setAttribute('aria-pressed',String(selected[slot]===id));}
 $('assignLabel').textContent='ASSIGNING TO P'+(slot+1);
 $('summaryNames').textContent=selected.map(id=>roster.find(d=>d.id===id)?.name||'Loading').join('  / VS /  ');
 const allReady=selected.every(ready);$('startButton').disabled=!allReady;$('startButton').textContent=allReady?(mode==='training'?'START PRACTICE  \u2197':"LET'S FIGHT  \u2197"):'LOADING ARTWORK...';
 $('opponentLabel').textContent=mode==='cpu'?'CPU OPPONENT':mode==='training'?'TRAINING PARTNER':'PLAYER 2';
 $('difficultyLabel').hidden=mode!=='cpu';$('rulesLabel').textContent=mode==='training'?'Unlimited practice':'First to 2 rounds';$('rulesLabel').nextElementSibling.textContent=mode==='training'?'Full special meter':'60 second clock';
 const good=roster.filter(d=>ready(d.id)).length,bad=roster.filter(d=>assets.get(d.id)?.status==='error');
 $('countLabel').textContent=roster.length+' FIGHTERS';$('loadStatus').textContent=bad.length?'Artwork unavailable: '+bad.map(d=>d.name).join(', ')+'. Other fighters can still play.':good===roster.length?good+' fighters ready. Pick an opponent as well as your fighter.':`Preparing artwork: ${good} / ${roster.length}. Selected fighters become playable as soon as they are ready.`;
 $('retryButton').hidden=!bad.length;
}
function makeCards(){
 grid.replaceChildren();
 for(const def of roster){
  const b=document.createElement('button');b.type='button';b.className='fighter-card';b.dataset.id=def.id;b.setAttribute('aria-label',def.name+' - '+def.style);
  const c=document.createElement('canvas');c.width=140;c.height=140;c.setAttribute('aria-hidden','true');
  const name=document.createElement('strong');name.textContent=def.name;
  const badges=document.createElement('span');badges.className='badges';for(let i=0;i<2;i++){const badge=document.createElement('b');badge.textContent='P'+(i+1);badge.dataset.badge=i;badges.append(badge);}
  const loading=document.createElement('span');loading.className='loading';loading.textContent='LOADING';b.append(c,name,badges,loading);b.onclick=()=>choose(def.id);grid.append(b);
  const o=document.createElement('option');o.value=def.id;o.textContent=def.name;$('labFighter').append(o);
 }
 sync();
}
async function prepare(def){
 assets.set(def.id,{status:'loading',def});
 const b=grid.querySelector(`[data-id="${def.id}"]`);
 try{
  const asset=await loadFighter(def);assets.set(def.id,asset);const cx=b.querySelector('canvas').getContext('2d');cx.imageSmoothingEnabled=false;cx.drawImage(asset.portrait,0,0);b.querySelector('.loading').hidden=true;b.classList.remove('failed');
 }catch(e){assets.set(def.id,{status:'error',def,error:e.message});b.querySelector('.loading').textContent='ART UNAVAILABLE';b.classList.add('failed');console.warn(def.id+': '+e.message);}
 sync();
}
function start(){
 if(!selected.every(ready))return;
 sound(550,.06);arena.start(mode,selected.map(id=>assets.get(id)),$('difficulty').value);
 selectScreen.hidden=true;matchScreen.hidden=false;$('practiceHint').hidden=mode!=='training';$('pauseButton').focus();window.scrollTo({top:0,behavior:'instant'});
}
function menu(){arena.stop();matchScreen.hidden=true;selectScreen.hidden=false;$('pauseOverlay').hidden=true;$('resultOverlay').hidden=true;sync();$('startButton').focus();}
function updateHUD(game){
 if(!game.people)return;
 game.people.forEach((f,i)=>{
  $('name'+i).textContent=f.asset.def.name;
  const node=document.querySelector('.health.p'+(i+1)),bar=node.querySelector('.bar');bar.setAttribute('aria-valuenow',String(f.hp));bar.firstElementChild.style.width=f.hp+'%';node.querySelector('.hype i').style.width=f.meter+'%';node.querySelector('.round-dots').textContent=(game.wins[i]>=1?'\u25cf':'\u25cb')+' '+(game.wins[i]>=2?'\u25cf':'\u25cb');
 });
 $('clock').textContent=game.mode==='training'?'\u221e':String(Math.ceil(game.remaining/60)).padStart(2,'0');$('roundLabel').textContent=game.mode==='training'?'PRACTICE':'ROUND '+game.round;$('modeLabel').textContent=game.mode==='cpu'?'VS CPU / '+game.difficulty.toUpperCase():game.mode==='local'?'LOCAL 2 PLAYER':'PRACTICE';
 $('pauseOverlay').hidden=!game.paused;$('pauseButton').textContent=game.paused?'RESUME (P)':'PAUSE (P)';
 const isOver=game.phase==='matchover';const newlyOver=isOver&&$('resultOverlay').hidden;$('resultOverlay').hidden=!isOver;
 if(isOver){$('resultTitle').textContent=(game.people[game.wins[0]>=2?0:1].asset.def.name)+' takes the match';if(newlyOver)$('rematchButton').focus();}
}
function preview(){
 for(let i=0;i<2;i++){
  const c=$('preview'+i).querySelector('canvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  ctx.strokeStyle='#283041';ctx.beginPath();ctx.ellipse(150,230,88,10,0,0,Math.PI*2);ctx.stroke();
  const a=assets.get(selected[i]);if(a?.status==='ready')drawSprite(ctx,a,'idle',reduced?0:frame,150,229,2,i?-1:1);
  else{ctx.fillStyle='#9ba6ba';ctx.textAlign='center';ctx.font='11px monospace';ctx.fillText(a?.status==='error'?'Artwork unavailable':'Preparing fighter...',150,145);}
 }
}
function drawLab(){
 const a=assets.get($('labFighter').value);if(a?.status!=='ready'){$('labInfo').textContent='This artwork is not ready.';return;}
 const seq=$('labSequence').value,group=a.frames[seq]||a.frames.idle,index=Math.floor(labTick/10)%group.length,f=group[index],c=$('labCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#0c1120';ctx.fillRect(0,0,640,320);ctx.strokeStyle='#253249';ctx.beginPath();ctx.moveTo(0,290);ctx.lineTo(640,290);ctx.moveTo(320,0);ctx.lineTo(320,320);ctx.stroke();ctx.imageSmoothingEnabled=false;
 const scale=f.scale*2.5;ctx.drawImage(f.canvas,320-f.px*scale,290-f.py*scale,f.canvas.width*scale,f.canvas.height*scale);
 $('labInfo').textContent=a.def.name+' / '+seq.toUpperCase()+' / FRAME '+(index+1)+' OF '+group.length+' / grounded pivot';$('labNotes').textContent=a.def.notes||'Cropped from this fighter\'s own sheet. Preview shows the available source poses; the match controls when each sequence starts and ends.';
}
function openDialog(dialog){labWasPaused=arena.paused;if(arena.phase!=='off'&&!arena.paused)arena.pause(true);dialog.showModal();}
for(const dialog of [$('helpDialog'),$('labDialog')])dialog.addEventListener('close',()=>{if(arena.phase!=='off'&&!labWasPaused)arena.pause(false);});
$('helpButton').onclick=()=>openDialog($('helpDialog'));
$('labButton').onclick=()=>{$('labFighter').value=selected[slot];labTick=0;openDialog($('labDialog'));drawLab();};
for(const seq of sequences){const o=document.createElement('option');o.value=seq;o.textContent=seq.toUpperCase();$('labSequence').append(o);}
$('labFighter').onchange=$('labSequence').onchange=()=>{labTick=0;drawLab();};
$('labPlay').onclick=()=>{labPlaying=!labPlaying;$('labPlay').textContent=labPlaying?'PAUSE':'PLAY';$('labPlay').setAttribute('aria-pressed',String(labPlaying));};
$('labStep').onclick=()=>{labPlaying=false;labTick=Math.floor(labTick/10)*10+10;$('labPlay').textContent='PLAY';$('labPlay').setAttribute('aria-pressed','false');drawLab();};
$('muteButton').onclick=()=>{muted=!muted;settings();save();};$('motionButton').onclick=()=>{reduced=!reduced;settings();save();};settings();
$('startButton').onclick=start;$('backButton').onclick=()=>{arena.pause(true);$('menuButton').focus();};$('pauseButton').onclick=()=>{arena.pause();if(arena.paused)$('resumeButton').focus();};$('resumeButton').onclick=()=>{arena.pause(false);$('pauseButton').focus();};$('menuButton').onclick=$('resultMenu').onclick=menu;$('rematchButton').onclick=start;
for(const b of document.querySelectorAll('[data-slot]'))b.onclick=()=>{slot=Number(b.dataset.slot);sync();};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>{mode=b.dataset.mode;for(const el of document.querySelectorAll('[data-mode]'))el.setAttribute('aria-pressed',String(el===b));sync();};
$('randomButton').onclick=()=>{const pool=roster.filter(d=>ready(d.id));if(pool.length)choose(pool[Math.floor(Math.random()*pool.length)].id);};
$('fighterSearch').oninput=()=>{const query=$('fighterSearch').value.trim().toLowerCase();let count=0;for(const b of grid.children){b.hidden=!b.textContent.toLowerCase().includes(query);if(!b.hidden)count++;}$('noResults').hidden=count>0;};
$('retryButton').onclick=()=>{roster.filter(d=>assets.get(d.id)?.status==='error').forEach(prepare);};
const combatKeys=new Set(CONTROL.flatMap(c=>Object.values(c)));
addEventListener('keydown',e=>{
 if($('helpDialog').open||$('labDialog').open)return;
 if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
 if(arena.phase!=='off'){
  if(e.code==='Tab'&&(arena.paused||arena.phase==='matchover')){e.preventDefault();const ids=arena.paused?['resumeButton','menuButton']:['rematchButton','resultMenu'];const current=ids.indexOf(document.activeElement.id);$(ids[(current+1)%ids.length]).focus();return;}
  if(combatKeys.has(e.code)||e.code==='Space')e.preventDefault();
  if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){e.preventDefault();arena.pause();if(arena.paused)$('resumeButton').focus();else $('pauseButton').focus();return;}
  if(e.code==='KeyR'&&mode==='training'&&!e.repeat){arena.reset();return;}
  if(e.code==='Enter'&&arena.phase==='matchover'){e.preventDefault();start();return;}
  arena.key(e.code,true);
 }else{
  if(e.code==='Digit1'||e.code==='Digit2'){slot=e.code==='Digit1'?0:1;sync();}
  if(e.code==='Enter'&&!e.repeat&&e.target.tagName!=='BUTTON'){e.preventDefault();start();}
  const isP2=e.code.startsWith('Arrow'),offset={KeyA:-1,ArrowLeft:-1,KeyD:1,ArrowRight:1,KeyW:-6,ArrowUp:-6,KeyS:6,ArrowDown:6}[e.code];
  if(offset!==undefined){e.preventDefault();const target=isP2?1:0;const ids=[...grid.children].filter(b=>!b.hidden).map(b=>b.dataset.id);if(ids.length){const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;const delta=Math.abs(offset)===6?Math.sign(offset)*columns:offset;choose(ids[(Math.max(0,ids.indexOf(selected[target]))+delta+ids.length)%ids.length],target);}}
 }
});
addEventListener('keyup',e=>arena.key(e.code,false));
addEventListener('blur',()=>{arena.keys.clear();arena.pressed.clear();if(arena.phase==='fight'||arena.phase==='intro')arena.pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&arena.phase!=='off')arena.pause(true);});
for(const b of document.querySelectorAll('[data-key]')){
 b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);arena.key(b.dataset.key,true);};
 b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>arena.key(b.dataset.key,false);
}
let last=performance.now(),acc=0;
function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){frame++;arena.update();if($('labDialog').open&&labPlaying)labTick++;acc-=1000/60;}if(!selectScreen.hidden)preview();else arena.draw();if($('labDialog').open)drawLab();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
try{
 const response=await fetch(new URL('./tools/roster-v5.json',import.meta.url));if(!response.ok)throw new Error('Roster request failed ('+response.status+')');roster=await response.json();
 if(!Array.isArray(roster)||roster.length<2||new Set(roster.map(d=>d.id)).size!==roster.length)throw new Error('Invalid roster');
 makeCards();
 // Load selected fighters first. Yield between extractions so the menu stays responsive.
 const order=[...roster].sort((a,b)=>Number(selected.includes(b.id))-Number(selected.includes(a.id)));
 for(const def of order){await prepare(def);await new Promise(r=>setTimeout(r,0));}
}catch(e){$('loadStatus').textContent='Unable to load the game: '+e.message+'. Refresh to retry.';$('startButton').disabled=true;console.error(e);}
// Read-only diagnostics; tests add no cheats to normal gameplay.
window.SF={version:'5.1',snapshot:()=>arena.snapshot(),roster:()=>roster.map(d=>({id:d.id,name:d.name,status:assets.get(d.id)?.status,frames:assets.get(d.id)?.frames?Object.fromEntries(Object.entries(assets.get(d.id).frames).map(([k,v])=>[k,v.length])):{}})),selection:()=>({ids:[...selected],mode,slot})};
if(new URLSearchParams(location.search).has('test'))window.SF_TEST={arena,assets,roster};
