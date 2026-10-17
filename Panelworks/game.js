(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const STAGES = ['referral','intake','estimate','parts','repair','paint','assembly','detail','ready','delivered'];
const LABEL = {referral:'NEW REFERRAL',intake:'INTAKE / QUEUED',estimate:'ESTIMATION',parts:'WAITING FOR PARTS',repair:'REMOVE & REPAIR',paint:'PREP & PAINT',assembly:'REASSEMBLY',detail:'DETAIL / QC',ready:'READY FOR COLLECTION',delivered:'COLLECTED'};
const SHORT = {referral:'REFERRALS',intake:'INTAKE',estimate:'ESTIMATE',parts:'PARTS HOLD',repair:'REPAIR',paint:'PREP/PAINT',assembly:'ASSEMBLY',detail:'DETAIL/QC',ready:'PICKUP'};
const CAP = {intake:8,estimate:2,parts:9,repair:3,paint:2,assembly:2,detail:2,ready:5};
const TARGET_WIP = 14;
const SKILLS = {estimate:'estimator',repair:'panel',paint:'painter',assembly:'assembler',detail:'detailer'};
const HUES = [0xe8a45b,0x6ea4ba,0xbf5a58,0x85a58a,0xc4c6ca,0x7c80b2,0xe5ca80,0x537d88];
const CARS = [['Toyota','Corolla'],['Ford','Ranger'],['Mazda','CX-5'],['Hyundai','Tucson'],['Toyota','RAV4'],['Kia','Sportage'],['Volkswagen','Golf'],['Honda','Civic'],['Tesla','Model 3'],['Subaru','Outback'],['BMW','X3'],['Nissan','Navara']];
const INSURERS = ['Southern Mutual','Pacific Cover','Apex Insurance'];
const POS = {referral:[-9,-9],intake:[-9,-9],estimate:[0,-9],parts:[9,-9],repair:[-9,0],paint:[0,0],assembly:[9,0],detail:[-9,9],ready:[0,9],delivered:[9,9]};
const BASE_CREW = [
{id:1,name:'Ella Thompson',role:'estimator',skill:0.92,wage:330},
{id:2,name:'Ben Walsh',role:'panel',skill:0.94,wage:390},
{id:3,name:'Jai Kumar',role:'panel',skill:0.84,wage:355},
{id:4,name:'Mei Chen',role:'painter',skill:0.94,wage:375},
{id:5,name:'Noah Park',role:'assembler',skill:0.88,wage:338},
{id:6,name:'Sara Nguyen',role:'detailer',skill:0.93,wage:318}
];
let S, selected, jobTab='all', view='job', running=false, speed=1, uiTimer=0, screen=null, mode='initialising', lastFrame=0, context=null;
const money=(n)=> (n<0?'−':'')+'$'+Math.round(Math.abs(n)).toLocaleString('en-AU');
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function rand(){S.seed=(Math.imul(S.seed,1664525)+1013904223)>>>0;return S.seed/4294967296;}
function pick(items){return items[Math.floor(rand()*items.length)];}
function nowDay(){return Math.floor(S.hours/8)+1;}
function log(msg){S.events.unshift({day:nowDay(),text:msg});S.events=S.events.slice(0,70);}
function openState(){
 const s={version:2,hours:0,cash:85000,seed:20261018,nextId:1,nextEmployee:7,trust:78,income:0,partsCost:0,wages:0,overhead:0,completed:0,cycleSum:0,declined:0,events:[],staff:BASE_CREW.map(x=>({...x})),capacity:{...CAP},jobs:[],milestones:0,autoplay:false,auto:true,reworksTotal:0,lateDeliveries:0,shiftStart:null,lastShiftReport:null};
 S=s;
 S.shiftStart=shiftSnapshot();
 for(let i=0;i<9;i++){const j=createReferral(false); if(i<7){j.stage=['estimate','parts','parts','repair','repair','paint','ready'][i]; j.partsState=i===1||i===2?'ordered':'received';j.partsETA=i===1?9:i===2?19:null;j.progress=i===0?0.5:(i===3||i===4||i===5?1.2:0);j.created=-rand()*3;j.estimated=i!==0;j.quote=quoteFor(j); j.partCost=Math.round(j.quote*(0.22+rand()*.14)); if(j.stage==='ready')j.notified=false; }}
 selected=S.jobs[0]?.id;
 log('Doors open. Review your insurer referrals and keep vehicles moving.');
 log('Foreman Assist enabled. Pause it for hands-on dispatch.');
 return s;
}
function quoteFor(j){return Math.round((1600+j.severity*1750+(j.brand==='BMW'||j.brand==='Tesla'?1450:0))/50)*50;}
function createReferral(record=true){
 const car=pick(CARS),sev=1+Math.floor(rand()*4);
 const j={id:S.nextId++,brand:car[0],model:car[1],severity:sev,insurer:pick(INSURERS),color:Math.floor(rand()*HUES.length),stage:'referral',created:nowDay(),quote:0,partCost:0,partsState:'none',partsETA:null,estimated:false,assigned:null,progress:0,rush:false,notified:false,collectETA:null,reworks:0,due:nowDay()+4+sev,loss:0,priority:0,qcPassed:false};
 j.quote=quoteFor(j);j.partCost=Math.round(j.quote*(0.23+rand()*.12));S.jobs.push(j);
 if(record)log('New referral: '+j.brand+' '+j.model+' • '+j.insurer+'.');
 return j;
}
function load(){
 try {const data=JSON.parse(localStorage.getItem('panelworks-save-v1'));if(data && (data.version===1||data.version===2) && Array.isArray(data.staff)&&Array.isArray(data.jobs)&&Number.isFinite(data.cash)&&typeof data.seed==='number'&&data.capacity){S=data;S.version=2;S.events=Array.isArray(S.events)?S.events:[];S.auto=S.auto!==false;S.reworksTotal=S.reworksTotal||0;S.lateDeliveries=S.lateDeliveries||0;S.capacity.intake=S.capacity.intake||8;S.shiftStart=S.shiftStart||shiftSnapshot();for(const j of S.jobs){j.priority=j.priority||0;j.qcPassed=j.qcPassed||false;}return true;}}catch(e){}
 openState();return false;
}
function save(silent=true){try{localStorage.setItem('panelworks-save-v1',JSON.stringify(S));if(!silent)log('Game saved locally.');}catch(e){if(!silent)log('Browser storage unavailable; progress will last until tab closes.');}}
function count(stage){return S.jobs.filter(j=>j.stage===stage).length;}
function activeWip(){return S.jobs.filter(j=>!['referral','declined','delivered'].includes(j.stage)).length;}
function shiftSnapshot(){return {cash:S.cash,income:S.income,partsCost:S.partsCost,wages:S.wages,overhead:S.overhead,completed:S.completed,trust:S.trust,reworksTotal:S.reworksTotal||0,lateDeliveries:S.lateDeliveries||0};}
function buildShiftReport(day){const p=S.shiftStart||shiftSnapshot();return {day,receipts:S.income-p.income,parts:S.partsCost-p.partsCost,payroll:S.wages-p.wages,overhead:S.overhead-p.overhead,cashChange:S.cash-p.cash,delivered:S.completed-p.completed,trustChange:S.trust-p.trust,reworks:(S.reworksTotal||0)-p.reworksTotal,late:(S.lateDeliveries||0)-p.lateDeliveries,wip:activeWip(),backlog:count('intake'),partsWaiting:count('parts')};}
function isBusy(id){return S.jobs.some(j=>j.assigned===id && j.progress<duration(j));}
function available(role){return S.staff.filter(e=>e.role===role&&!isBusy(e.id));}
function duration(j){return {estimate:1.5,repair:3.2+j.severity*4.2,paint:1.8+j.severity*2.0,assembly:1+j.severity*1.7,detail:1.2+j.severity*.6}[j.stage]||0;}
function targetStage(j){return ({estimate:'parts',parts:'repair',repair:'paint',paint:'assembly',assembly:'detail',detail:'ready'})[j.stage];}
function hasSpace(stage){return !S.capacity[stage] || count(stage)<S.capacity[stage];}
function transition(j,next){
 j.assigned=null;j.stage=next;j.progress=0;j.qcPassed=false;
 if(next==='parts'){j.estimated=true;log('Estimate approved for '+j.brand+' '+j.model+': '+money(j.quote)+'.');}
 if(next==='ready'){log('QC passed: '+j.brand+' '+j.model+' ready for customer collection.');}
 if(next==='repair'){log('Parts released to repair: '+j.brand+' '+j.model+'.');}
 if(next==='delivered'){
  const delay=Math.max(0,nowDay()-j.due);
  const penalty=Math.round(Math.min(j.quote*.25,delay*130));
  const billed=j.quote-penalty;
  j.loss=penalty;S.cash+=billed;S.income+=billed;S.completed++;if(delay)S.lateDeliveries=(S.lateDeliveries||0)+1;S.cycleSum+=Math.max(1,nowDay()-Math.floor(j.created));
  S.trust=clamp(S.trust+(delay?-.65:1.9),0,100);
  log('DELIVERED '+j.brand+' '+j.model+' • '+money(billed)+' received'+(penalty?' (late penalty '+money(penalty)+')':'')+'.');
  if(S.completed>=10 && S.milestones===0){S.milestones=1;log('★ Milestone unlocked: 10 vehicles delivered!');}
  if(S.completed>=25 && S.milestones===1){S.milestones=2;log('★ Milestone unlocked: 25 vehicles delivered!');}
  if(S.completed>=50 && S.milestones===2){S.milestones=3;log('★ Milestone unlocked: 50 vehicles delivered!');}
 }
}
function intake(j,accept){
 if(j.stage!=='referral')return;
 if(!accept){const penalty=activeWip()>=TARGET_WIP?0.5:2.2;j.stage='declined';S.declined++;S.trust=clamp(S.trust-penalty,0,100);log('Declined '+j.insurer+' referral. Insurer trust −'+penalty+' (capacity-aware).');return;}
 if(count('intake')>=S.capacity.intake){log('INTAKE AT CAPACITY: finish estimates before accepting more cars.');return;}
 j.stage='intake';S.trust=clamp(S.trust+.3,0,100);log('Accepted: '+j.brand+' '+j.model+'. Estimation queued.');
}
function orderParts(j,express){
 if(j.stage!=='parts')return;
 if(j.partsState==='none'){
  const cost=Math.round(j.partCost*(express?1.25:1));if(S.cash<cost){log('Not enough cash for parts on '+j.brand+' '+j.model+'.');return;}
  S.cash-=cost;S.partsCost+=cost;j.partsState='ordered';j.partsETA=S.hours+(express?4+rand()*4:10+rand()*18);
  log((express?'Express':'Standard')+' parts ordered for '+j.brand+' '+j.model+' • '+money(cost)+'.');
 } else if(express&&j.partsState==='ordered'){
  const expedite=Math.round(j.partCost*.18);
  if(S.cash<expedite){log('Insufficient cash to expedite parts.');return;}
  S.cash-=expedite;S.partsCost+=expedite;j.partsETA=Math.min(j.partsETA,S.hours+3+rand()*3);
  log('Parts expedited: '+j.brand+' '+j.model+' • '+money(expedite)+'.');
 }
}
function assign(j,id){
 const role=SKILLS[j.stage];if(!role || j.assigned!==null || j.progress>=duration(j))return false;
 const e=S.staff.find(e=>e.id===id);
 if(!e||e.role!==role||isBusy(e.id))return false;
 j.assigned=e.id;log(e.name+' assigned to '+j.brand+' '+j.model+' ('+SHORT[j.stage]+').');return true;
}
function release(j){j.assigned=null;}
function notify(j){if(j.stage!=='ready'||j.notified)return;j.notified=true;j.collectETA=S.hours+2+rand()*10;log('Customer contacted for '+j.brand+' '+j.model+'. Collection booked.');}
function expand(stage){
 const price={estimate:6000,repair:13000,paint:18000,assembly:8500,detail:6500,ready:3500}[stage];
 if(!price||S.cash<price){log('Not enough cash to expand '+SHORT[stage]+'.');return;}
 S.cash-=price;S.overhead+=price;S.capacity[stage]++;log('Expanded '+SHORT[stage]+': additional bay opened for '+money(price)+'.');
}
function hire(role){
 const fee=1000,wage={estimator:330,panel:370,painter:380,assembler:335,detailer:315}[role];
 if(!wage||S.cash<fee){log('Not enough cash to recruit new staff.');return;}
 const first=['Alex','Charlie','Jordan','Taylor','Morgan','Casey','Jamie','Riley','Avery','Sam'];const last=['Miller','Nguyen','Walker','Lee','Brown','Singh','Jones'];
 const e={id:S.nextEmployee++,name:pick(first)+' '+pick(last),role,skill:0.75+rand()*.24,wage:Math.round(wage*(0.92+rand()*.2))};
 S.cash-=fee;S.overhead+=fee;S.staff.push(e);log('Hired '+e.name+' ('+role+') • '+money(fee)+' recruitment.');
}
function train(id){
 const e=S.staff.find(x=>x.id===id);if(!e)return;
 if(e.skill>=.99){log(e.name+' is already fully qualified.');return;}
 const cost=1250;if(S.cash<cost){log('Not enough cash to train '+e.name+'.');return;}
 S.cash-=cost;S.overhead+=cost;e.skill=Math.min(.99,e.skill+.065);log('TRAINING COMPLETE: '+e.name+' skill now '+Math.round(e.skill*100)+'% for '+money(cost)+'.');
}
function fire(id){
 const e=S.staff.find(x=>x.id===id);if(!e)return;
 if(isBusy(id)){log('Finish '+e.name+"'s assigned work before releasing them.");return;}
 if(S.staff.filter(x=>x.role===e.role).length===1){log('Cannot release the last '+e.role+'.');return;}
 S.staff=S.staff.filter(x=>x.id!==id);log(e.name+' released from the roster.');
}
function manage(){
 // Admit already-accepted cars when estimation capacity frees up.
 for(const j of S.jobs.filter(x=>x.stage==='intake').sort((a,b)=>(b.priority||0)-(a.priority||0)||a.due-b.due))if(hasSpace('estimate'))transition(j,'estimate');
 for(const j of S.jobs.filter(x=>x.stage==='parts')){
  if(j.partsState==='none'&&S.auto)orderParts(j,false);
  if(j.partsState==='received'&&hasSpace('repair'))transition(j,'repair');
 }
 for(const j of S.jobs.filter(x=>SKILLS[x.stage])){
  if(j.progress>=duration(j)){
   const next=targetStage(j);
   if(next==='ready' && j.stage==='detail' && !j.qcPassed){
    j.qcPassed=true;
    if(rand()<Math.max(.025,.16-(S.staff.find(e=>e.id===j.assigned)?.skill||.82)*.11)+(j.rush?.09:0) && j.reworks<2){
     j.reworks++;S.reworksTotal=(S.reworksTotal||0)+1;S.trust=clamp(S.trust-2,0,100);log('QC REWORK: '+j.brand+' '+j.model+' returned to paint. Insurer trust −2.');
     if(hasSpace('paint')){transition(j,'paint');continue;}
     j.qcPassed=false;
    }
   }
   if(hasSpace(next))transition(j,next);
  }
 }
 for(const j of S.jobs.filter(x=>x.stage==='ready')){
  if(S.auto&&!j.notified)notify(j);
  if(j.notified&&S.hours>=j.collectETA&&S.auto)transition(j,'delivered');
 }
 if(S.auto)for(const j of S.jobs.filter(x=>SKILLS[x.stage]&&x.assigned===null&&x.progress<duration(x)).sort((a,b)=>(b.priority||0)-(a.priority||0)||a.due-b.due||a.id-b.id)){
  const staff=available(SKILLS[j.stage]);if(staff.length)assign(j,staff[0].id);
 }
}
function oneTick(h){
 if(!Number.isFinite(h)||h<=0)return;
 const oldDay=nowDay();S.hours+=h;
 for(const j of S.jobs){
  if(j.partsState==='ordered'&&j.partsETA!==null&&S.hours>=j.partsETA){j.partsState='received';j.partsETA=null;log('Parts received: '+j.brand+' '+j.model+'.');}
  if(j.assigned!==null && SKILLS[j.stage]){
   const e=S.staff.find(x=>x.id===j.assigned);
   if(e){let rate=(0.72+e.skill*.6)*(j.rush?1.4:1);j.progress=Math.min(duration(j),j.progress+h*rate);}
  }
 }
 manage();
 if(nowDay()>oldDay)for(let d=oldDay+1;d<=nowDay();d++){
  const payroll=S.staff.reduce((sum,e)=>sum+e.wage,0);const opEx=1120+(S.capacity.repair-3)*95+(S.capacity.paint-2)*130;
  S.cash-=payroll+opEx;S.wages+=payroll;S.overhead+=opEx;
  const late=S.jobs.filter(j=>!['declined','delivered','referral'].includes(j.stage)&&d>j.due).length;
  if(late)S.trust=clamp(S.trust-Math.min(late*.45,2),0,100);
  const leads=clamp(Math.floor(rand()*2+0.5+S.trust/75),0,3);
  for(let i=0;i<leads;i++)if(count('referral')<8)createReferral();
  for(const j of S.jobs.filter(j=>j.stage==='referral' && d-j.created>3)){j.stage='declined';S.trust=clamp(S.trust-.8,0,100);log('Unanswered referral expired. Insurer trust −0.8.');}
  S.lastShiftReport=buildShiftReport(d-1);S.shiftStart=shiftSnapshot();
  log('SHIFT '+(d-1)+' CLOSE • '+S.lastShiftReport.delivered+' collected • cash '+money(S.lastShiftReport.cashChange)+' • '+late+' overdue.');
 }
 if(S.cash < -18000){running=false;log('BANKRUPTCY WARNING: your site has run out of working capital.');}
 save();
}
function renderBoard(){
 let filtered=S.jobs.filter(j=> j.stage!=='delivered'&&j.stage!=='declined');
 if(jobTab==='referral')filtered=filtered.filter(j=>j.stage==='referral');
 if(jobTab==='active')filtered=filtered.filter(j=>!['referral','ready'].includes(j.stage));
 if(jobTab==='ready')filtered=filtered.filter(j=>j.stage==='ready');
 filtered.sort((a,b)=>(a.stage==='referral'? -1:0)-(b.stage==='referral'?-1:0)||(b.priority||0)-(a.priority||0)||a.due-b.due||a.id-b.id);
 $('queue-count').textContent=filtered.length+' JOBS';
 $('jobs').innerHTML=filtered.length?filtered.map(j=>{
 const completion=j.stage==='referral'?0:Math.max(0,Math.round(STAGES.indexOf(j.stage)/8*100));
 const late=nowDay()>j.due;
 return '<button class="job '+(j.id===selected?'selected':'')+'" data-job="'+j.id+'" type="button"><span class="job-row"><strong>'+j.brand+' '+j.model+'</strong><span class="stage-label '+j.stage+'">'+(late?'! ':'')+SHORT[j.stage]+'</span></span><small>#PW-'+String(j.id).padStart(3,'0')+' · '+j.insurer+' · DUE DAY '+j.due+'</small><span class="job-row"><span class="job-money">'+money(j.quote)+'</span><span class="muted">Damage '+['','LOW','MEDIUM','HIGH','SEVERE'][j.severity]+'</span></span><div class="progress"><span style="width:'+completion+'%"></span></div></button>';
 }).join(''):'<div class="empty">No jobs in this view. Try another tab or request a new referral.</div>';
}
function infoRow(label,value,cls){return '<div class="budget-row"><span>'+label+'</span><b class="'+(cls||'')+'">'+value+'</b></div>';}
function renderInspector(){
 const el=$('inspector-body');
 if(view==='crew'){
  el.innerHTML='<div class="section-label">YOUR ROSTER · '+S.staff.length+' STAFF</div>'+S.staff.map(e=>{
   const job=S.jobs.find(j=>j.assigned===e.id && j.progress<duration(j));
   return '<div class="crew-row"><div class="job-row"><strong>'+e.name+'</strong><span class="badge">'+Math.round(e.skill*100)+' SKILL</span></div><small>'+e.role.toUpperCase()+' · '+money(e.wage)+'/DAY · '+(job?('JOB #'+job.id):'AVAILABLE')+'</small><div style="margin-top:8px"><button data-act="fire" data-id="'+e.id+'" '+(job||S.staff.filter(x=>x.role===e.role).length<2?'disabled':'')+'>RELEASE STAFF</button></div></div>';
  }).join('')+'<div class="section-label" style="margin-top:19px">RECRUIT & EXPAND</div><label class="field">New employee role<select id="hire-role"><option value="panel">Panel technician</option><option value="estimator">Estimator</option><option value="painter">Spray painter</option><option value="assembler">Assembler</option><option value="detailer">Detail / QC</option></select></label><button class="primary" data-act="hire" style="width:100%">HIRE TEAM MEMBER · $1,000</button><p class="callout">Employees cost wages every shift, including idle time. More people only help when your bays can support them.</p>';
  return;
 }
 if(view==='finance'){
  const gp=S.income-S.partsCost-S.wages;const op=gp-S.overhead;
  el.innerHTML='<div class="section-label">REPAIR CENTRE P&L · TO DATE</div><div class="budget">'+infoRow('Repair revenue',money(S.income),'positive')+infoRow('Parts & consumables','−'+money(S.partsCost))+infoRow('Direct labour','−'+money(S.wages))+infoRow('GROSS PROFIT',money(gp),gp>=0?'positive':'negative')+infoRow('Facility overhead / investment','−'+money(S.overhead))+infoRow('OPERATING PROFIT',money(op),op>=0?'positive':'negative')+infoRow('Bank cash',money(S.cash),S.cash>=0?'positive':'negative')+'</div><div class="section-label">EXPAND PRODUCTION</div><label class="field">Add one workshop bay<select id="expand-stage"><option value="estimate">Estimation · $6,000</option><option value="repair">Remove & repair · $13,000</option><option value="paint">Prep / paint · $18,000</option><option value="assembly">Assembly · $8,500</option><option value="detail">Detail / QC · $6,500</option><option value="ready">Collection · $3,500</option></select></label><button class="primary" data-act="expand" style="width:100%">INVEST IN ANOTHER BAY</button><p class="callout">Cash pays for parts when ordered. Revenue comes in after customer handover. Gross profit excludes site overhead; operating profit includes it.</p>';
  return;
 }
 const j=S.jobs.find(x=>x.id===selected);
 if(!j||['delivered','declined'].includes(j.stage)){el.innerHTML='<p class="empty">Select an active job from the dispatch board, or visit Team / Finance to manage the workshop.</p>';return;}
 const worker=j.assigned!==null?S.staff.find(e=>e.id===j.assigned):null;
 let actions='';
 if(j.stage==='referral')actions='<button class="primary" data-act="accept">✓ ACCEPT INSURER JOB</button><button class="ghost danger" data-act="decline">✕ DECLINE REFERRAL (−TRUST)</button>';
 else if(j.stage==='parts'){
  if(j.partsState==='none')actions='<button class="primary" data-act="order">ORDER STANDARD PARTS</button><button data-act="express">EXPRESS PARTS (+25%)</button>';
  else if(j.partsState==='ordered')actions='<button data-act="express">⚡ EXPEDITE PARTS (+18%)</button>';
 }
 else if(j.stage==='ready')actions=!j.notified?'<button class="primary" data-act="contact">☎ CONTACT CUSTOMER</button>':'<button class="primary" data-act="collect">✓ COMPLETE VEHICLE HANDOVER</button>';
 else if(SKILLS[j.stage]){
   if(!worker&&j.progress<duration(j)){
    const people=available(SKILLS[j.stage]);
    actions='<label class="field">Assign available '+SKILLS[j.stage]+'<select id="assign-worker">'+(people.length?people.map(e=>'<option value="'+e.id+'">'+e.name+' · '+Math.round(e.skill*100)+' skill</option>').join(''):'<option value="">No staff available</option>')+'</select></label><button class="primary" data-act="assign" '+(!people.length?'disabled':'')+'>ASSIGN TECHNICIAN</button>';
   }
   if(j.stage!=='estimate')actions+='<button data-act="rush">'+(j.rush?'DISABLE RUSH REPAIR':'⚡ ENABLE RUSH (+ REWORK RISK)')+'</button>';
 }
 const details=j.stage==='parts'?(j.partsState==='none'?'Parts not yet ordered. Repair work is blocked.':j.partsState==='ordered'?'Parts in transit • ETA '+Math.ceil((j.partsETA-S.hours)/8*10)/10+' shop days.':'All parts delivered. Awaiting repair bay.'):(worker?worker.name+' · '+SKILLS[j.stage]+' assigned.':'Waiting for a free specialist or workshop bay.');
 const percent=SKILLS[j.stage]?Math.round(j.progress/Math.max(duration(j),.1)*100):0;
 el.innerHTML='<div class="section-label">REPAIR ORDER #PW-'+String(j.id).padStart(3,'0')+'</div><div class="car-title">'+j.brand+' '+j.model+'</div><div class="subline">'+j.insurer+'<br>Damage severity: '+['','Low','Moderate','High','Severe'][j.severity]+' · Due day '+j.due+'</div><div class="detail-grid"><div class="detail-cell"><label>Approved repair value</label><b class="highlight">'+money(j.quote)+'</b></div><div class="detail-cell"><label>Est. parts spend</label><b>'+money(j.partCost)+'</b></div><div class="detail-cell"><label>Current work stage</label><b>'+SHORT[j.stage]+'</b></div><div class="detail-cell"><label>Job progress</label><b>'+percent+'%</b></div></div><div class="stepper">'+['estimate','repair','paint','assembly','detail','ready'].map(x=>'<span class="'+(STAGES.indexOf(j.stage)>STAGES.indexOf(x)?'done':j.stage===x?'current':'')+'"></span>').join('')+'</div><div class="section-label">DISPATCH ACTION</div><p class="subline">'+details+(j.reworks?'<br>QC rework: '+j.reworks+' time(s).':'')+'</p><div class="action-stack">'+actions+'</div>'+(nowDay()>j.due?'<div class="callout">OVERDUE: delays reduce insurer trust and may reduce final payment.</div>':'');
}
function renderStats(){
 const op=S.income-S.partsCost-S.wages-S.overhead;
 $('cash').textContent=money(S.cash);$('profit').textContent=money(op);
 $('profit').className=op<0?'negative':'positive';
 $('cash').className=S.cash<0?'negative':'';
 $('trust').textContent=Math.round(S.trust)+'%';
 $('trust-status').textContent=S.trust>=75?'Preferred repairer':S.trust>=50?'Watch cycle time':'Referral volume falling';
 const active=S.jobs.filter(j=>!['referral','declined','delivered'].includes(j.stage));
 $('wip').textContent=active.length;$('wip-caption').textContent=count('ready')+' ready for pickup';
 $('delivered').textContent=S.completed;$('avgcycle').textContent=S.completed?(S.cycleSum/S.completed).toFixed(1)+'d average cycle time':'Target: under 6 days';
 $('day').textContent='DAY '+nowDay();
 $('clock').textContent=String(8+Math.floor(S.hours%8)).padStart(2,'0')+':'+String(Math.floor((S.hours%1)*60)).padStart(2,'0')+' · SHIFT';
 $('status-pill').textContent=running?'● WORKSHOP RUNNING':'● WORKSHOP PAUSED';
 $('play-btn').textContent=running?'Ⅱ PAUSE SHOP':'▶ RUN SHIFT';
 $('auto').checked=!!S.auto;
 $('mission').textContent=S.completed>=10?'MILESTONE ACHIEVED! '+S.completed+' vehicles delivered. Keep growing profitably.':'Deliver 10 vehicles. '+S.completed+'/10 delivered · Insurer trust '+Math.round(S.trust)+'%.';
 for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b.dataset.tab===jobTab));
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
 const stations=['estimate','parts','repair','paint','assembly','detail','ready'];
 $('bays').innerHTML=stations.map(st=>{const c=count(st),cap=S.capacity[st];return '<div class="bay"><div class="bay-row">'+SHORT[st]+' <small>'+c+'/'+cap+'</small></div><span><i style="width:'+Math.min(100,c/cap*100)+'%;background:'+(c>=cap?'#ffce62':'#46d7ba')+'"></i></span></div>';}).join('');
 $('log-count').textContent=S.events.length+' EVENTS';
 $('events').innerHTML=S.events.slice(0,12).map(e=>'<div class="event"><b>D'+e.day+'</b>'+e.text+'</div>').join('');
}
function drawUI(){renderStats();renderBoard();renderInspector();if(screen)screen.sync();}
function action(type,arg){
 const j=S.jobs.find(x=>x.id===selected);
 if(type==='accept'&&j)intake(j,true);if(type==='decline'&&j){intake(j,false);selected=S.jobs.find(x=>x.stage==='referral')?.id||S.jobs.find(x=>x.stage!=='delivered'&&x.stage!=='declined')?.id;}
 if(type==='order'&&j)orderParts(j,false);if(type==='express'&&j)orderParts(j,true);
 if(type==='assign'&&j){let id=Number($('assign-worker')?.value);assign(j,id);}
 if(type==='rush'&&j){j.rush=!j.rush;log((j.rush?'Rush repair ON':'Rush repair OFF')+' for #PW-'+j.id+'.');}
 if(type==='contact'&&j)notify(j);if(type==='collect'&&j&&j.notified)transition(j,'delivered');
 if(type==='expand')expand($('expand-stage')?.value);
 if(type==='hire')hire($('hire-role')?.value);
 if(type==='fire')fire(Number(arg));
 manage();save();drawUI();
}
function controls(){
 $('play-btn').addEventListener('click',()=>{running=!running;drawUI();});
 $('step-btn').addEventListener('click',()=>{for(let i=0;i<80;i++)oneTick(.1);drawUI();});
 document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
 $('auto').addEventListener('change',e=>{S.auto=e.target.checked;manage();save();drawUI();});
 $('generate-btn').addEventListener('click',()=>{if(count('referral')<8){const j=createReferral();selected=j.id;jobTab='referral';view='job';}else log('Your intake is full. Clear referrals first.');save();drawUI();});
 $('save-btn').addEventListener('click',()=>{save(false);drawUI();});
 $('reset-btn').addEventListener('click',()=>{if(confirm('Start a new Panelworks workshop? This replaces your saved game.')){openState();running=false;drawUI();save();}});
 $('jobs').addEventListener('click',e=>{const b=e.target.closest('[data-job]');if(!b)return;selected=Number(b.dataset.job);view='job';drawUI();});
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{jobTab=b.dataset.tab;drawUI();}));
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;drawUI();}));
 $('inspector-body').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)action(b.dataset.act,b.dataset.id);});
 $('help-btn').addEventListener('click',()=>{$('help').showModal();});$('close-help').addEventListener('click',()=>{$('help').close();});$('understood').addEventListener('click',()=>{$('help').close();});
 $('zoom-in').addEventListener('click',()=>screen?.zoom(-2));$('zoom-out').addEventListener('click',()=>screen?.zoom(2));$('orbit-reset').addEventListener('click',()=>screen?.reset());
 window.addEventListener('beforeunload',()=>save());
}
const canvas=$('workshop');
const COLORS={referral:'#c9a467',estimate:'#6e9db8',parts:'#cb9b4e',repair:'#6d9ea9',paint:'#b18ba5',assembly:'#83a7ae',detail:'#65bea9',ready:'#7fbb82'};
function initFallback(){
 mode='ISOMETRIC CANVAS';let ctx=canvas.getContext('2d');if(!ctx)return {sync(){},zoom(){},reset(){}};
 let factor=1;const stations=Object.keys(POS).filter(k=>k!=='delivered'&&k!=='intake');
 const hit=[];
 function frame(){
  const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(250,canvas.clientWidth),h=Math.max(300,canvas.clientHeight);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const unit=Math.min(w/57,h/36)*factor,ox=w/2,oy=h*.47;
  const proj=(x,z,y=0)=>[ox+(x-z)*unit*.90,oy+(x+z)*unit*.42-y*unit*.6];
  function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  for(let x=-18;x<20;x+=2){let a=proj(x,-17),b=proj(x,17);ctx.strokeStyle='#2f4a57';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  for(let z=-18;z<20;z+=2){let a=proj(-17,z),b=proj(17,z);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  hit.length=0;
  for(const stage of stations){
   const [x,z]=POS[stage], p=[proj(x-3.8,z-3.4),proj(x+3.8,z-3.4),proj(x+3.8,z+3.4),proj(x-3.8,z+3.4)];
   poly(p,'#233b47','#537381');
   const center=proj(x,z,0.12);ctx.textAlign='center';ctx.fillStyle='#ebf2f3';ctx.font='bold '+Math.max(9,10*factor)+'px sans-serif';ctx.fillText(SHORT[stage],center[0],center[1]-2.65*unit);
   ctx.fillStyle=COLORS[stage];ctx.fillRect(center[0]-24*factor,center[1]-2.40*unit,48*factor,3*factor);
  }
  for(const j of S.jobs.filter(j=>!['declined','delivered'].includes(j.stage))){
   const pos=POS[j.stage]||POS.referral,arr=S.jobs.filter(q=>q.stage===j.stage),idx=arr.indexOf(j),x=pos[0]+((idx%3)-1)*1.9,z=pos[1]+Math.floor(idx/3)*2-0.6;
   const P=proj(x,z),L=1.25*unit,W=.62*unit;
   poly([[P[0],P[1]-W],[P[0]+L,P[1]],[P[0],P[1]+W],[P[0]-L,P[1]]],j.id===selected?'#ffe08b':('#'+HUES[j.color].toString(16).padStart(6,'0')),'#07151d');
   const roof=proj(x,z,1.2);poly([[roof[0],roof[1]-W*.62],[roof[0]+L*.53,roof[1]],[roof[0],roof[1]+W*.62],[roof[0]-L*.53,roof[1]]],'#d6e7e7','#1d3846');
   hit.push({id:j.id,x:P[0],y:P[1],radius:Math.max(13,1.7*unit)});
  }
  $('scene-badge').textContent='ISOMETRIC WORKSHOP · FALLBACK MODE';
 }
 canvas.addEventListener('click',ev=>{const r=canvas.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top;const h=hit.filter(p=>Math.hypot(x-p.x,y-p.y)<p.radius).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];if(h){selected=h.id;view='job';drawUI();}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();factor=clamp(factor+(e.deltaY<0?.08:-.08),.6,1.8);frame();},{passive:false});
 frame();return {sync:frame,zoom(d){factor=clamp(factor+(d<0?.12:-.12),.6,1.8);frame();},reset(){factor=1;frame();}};
}
async function initThree(){
 let T;try{T=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');}catch(e){return initFallback();}
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){return initFallback();}
 mode='THREE.JS 3D'; renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0x122431);scene.fog=new T.Fog(0x122431,48,90);
 const camera=new T.PerspectiveCamera(43,1,.1,130);let theta=.78,phi=.91,radius=40;
 function updateCamera(){camera.position.set(radius*Math.sin(theta)*Math.sin(phi),radius*Math.cos(phi),radius*Math.cos(theta)*Math.sin(phi));camera.lookAt(0,0,0);}
 updateCamera();scene.add(new T.AmbientLight(0xffffff,.8));const sun=new T.DirectionalLight(0xffeedb,2.4);sun.position.set(-15,35,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27});scene.add(sun);
 const mat=(color,roughness=.82,opacity=1)=>new T.MeshStandardMaterial({color,roughness,transparent:opacity<1,opacity,metalness:.1});
 const floor=mat(0x1b3039),line=mat(0x405864),steel=mat(0x476e7d),dark=mat(0x10202b),stripe=mat(0xf0b74f),glass=mat(0x8dbfc6,.15,.5);
 function box(w,h,d,color,x,y,z,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='number'?mat(color):color);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 box(36,.5,35,0x19303c,0,-.35,0);
 for(let i=-17;i<=17;i+=2){box(.026,.015,34,0x34505b,i,-.08,0);box(34,.015,.026,0x34505b,0,-.075,i);}
 for(const [stage,p] of Object.entries(POS)){
  if(stage==='delivered'||stage==='intake')continue;
  const [x,z]=p;const color={referral:0xcea45b,estimate:0x6cacc0,parts:0xe0ae50,repair:0x7cbbce,paint:0xc49ab8,assembly:0x85b6bd,detail:0x4ccca9,ready:0x97ce7b}[stage];
  box(7.7,.16,7.3,0x304851,x,0,z);box(6.9,.04,6.5,0x213743,x,.1,z);
  for(const dx of [-3.45,3.45]){box(.12,.08,6.55,color,x+dx,.17,z);}
  box(6.8,.08,.12,color,x,.17,z-3.15);
  if(stage==='paint'){
   for(const sx of [-3.5,3.5]){box(.18,3,7,0x7da4ac,x+sx,1.4,z);}
   box(7,.1,7,glass,x,3,z);
   for(const dz of [-2.8,2.8])box(7,2.5,.1,glass,x,1.45,z+dz);
  }
  if(stage==='repair')for(const dx of [-2.3,2.3]){box(.24,.15,5.6,stripe,x+dx,.24,z);box(.4,.35,.5,steel,x+dx,.43,z+2.7);}
  if(stage==='parts')for(const sx of [-2.7,2.7])for(const dz of [-2.1,.2,2.4]){box(.9,1.2,1.3,0x536778,x+sx,.9,z+dz);box(.96,.09,1.4,stripe,x+sx,1.56,z+dz);}
  if(stage==='estimate'){box(1.5,.9,1,steel,x+2,.55,z-2);box(1.3,.08,1.2,stripe,x+2,1.05,z-2);}
  if(stage==='ready')box(2,.8,1,0x386354,x+2,.45,z-2);
  if(stage==='detail'){for(const sx of [-2.9,2.9])box(.35,.9,.35,0x4f9789,x+sx,.45,z+2.7);}
  function sign(label){
   const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
   ctx.fillStyle='#101f28';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#e0b45f';ctx.lineWidth=5;ctx.strokeRect(3,3,506,122);
   ctx.font='bold 49px Arial';ctx.textAlign='center';ctx.fillStyle='#ecf5f5';ctx.fillText(label,256,83);
   const t=new T.CanvasTexture(c);const s=new T.Mesh(new T.PlaneGeometry(5.6,1.4),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide}));
   s.rotation.x=-Math.PI/2;s.position.set(x,.27,z-3.85);scene.add(s);
  }
  sign(SHORT[stage]);
 }
 // Outer masonry walls and an entrance driveway around the workshop footprint.
 for(const x of [-18,18])box(.35,1.5,34,0x2a4451,x,.58,0);
 for(const z of [-17,17]){box(34,.5,.3,0x39525c,0,.13,z);}
 for(const x of [-15,-6,5,14])box(.3,2,.3,0xa9c3c9,x,1,17);
 box(8,.11,3.5,0x385361,-9,.05,-19.1);box(8,.11,3.5,0x385361,9,.05,19.1);
 const carMeshes=new Map();
 function makeCar(j){
  const g=new T.Group();
  let col=HUES[j.color]||HUES[0];const paint=mat(col,.35),windowMat=mat(0x193b4d,.18),tyre=mat(0x10191e),silver=mat(0xc1d3d4,.27);
  box(2.15,.65,3.6,paint,0,.60,0,g);box(1.75,.68,1.95,paint,0,1.16,-.2,g);
  box(1.6,.46,.08,windowMat,0,1.19,-1.18,g);box(1.65,.44,.08,windowMat,0,1.20,.83,g);
  for(const x of [-1.12,1.12])for(const z of [-1.2,1.2]){
   const tire=new T.Mesh(new T.CylinderGeometry(.37,.37,.24,12),tyre);tire.rotation.z=Math.PI/2;tire.position.set(x,.35,z);g.add(tire);
   const hub=new T.Mesh(new T.CylinderGeometry(.18,.18,.29,12),silver);hub.rotation.z=Math.PI/2;hub.position.set(x,.35,z);g.add(hub);
  }
  for(const x of [-.72,.72]){box(.45,.15,.09,0xffefb3,x,.58,-1.83,g);box(.42,.13,.07,0xe04d42,x,.58,1.84,g);}
  g.userData.job=j.id;g.traverse(o=>{o.userData.job=j.id;});scene.add(g);return g;
 }
 function syncCars(){
  const visible=S.jobs.filter(j=>!['declined','delivered'].includes(j.stage));
  const ids=new Set(visible.map(j=>j.id));
  for(const [id,g] of carMeshes)if(!ids.has(id)){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});carMeshes.delete(id);}
  for(const j of visible){
   let g=carMeshes.get(j.id);if(!g){g=makeCar(j);g.position.set(0,0,0);carMeshes.set(j.id,g);}
   const pos=POS[j.stage]||POS.referral,arr=visible.filter(q=>q.stage===j.stage),idx=arr.indexOf(j);
   const x=pos[0]+((idx%3)-1)*2.20,z=pos[1]+(Math.floor(idx/3)-.4)*1.9;
   g.userData.dest=new T.Vector3(x,0.1,z);
   const scale=j.id===selected?1.12:1;g.scale.setScalar(scale);
  }
 }
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();let dragging=false,lastX=0,lastY=0,distance=0;
 canvas.addEventListener('pointerdown',e=>{dragging=true;distance=0;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;distance+=Math.abs(dx)+Math.abs(dy);lastX=e.clientX;lastY=e.clientY;theta-=dx*.008;phi=clamp(phi+dy*.006,.3,1.5);updateCamera();});
 canvas.addEventListener('pointerup',e=>{dragging=false;if(distance>10)return;const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const intersects=raycaster.intersectObjects([...carMeshes.values()],true);if(intersects.length){let id=intersects[0].object.userData.job;if(id){selected=id;view='job';drawUI();}}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();radius=clamp(radius+e.deltaY*.022,23,70);updateCamera();},{passive:false});
 let previous=0;
 function animate(t){
  if(!canvas.isConnected)return;
  requestAnimationFrame(animate);
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  if(canvas.width!==Math.round(w*Math.min(devicePixelRatio||1,2))||canvas.height!==Math.round(h*Math.min(devicePixelRatio||1,2))){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const d=Math.min((t-previous)/16.67,3)||1;previous=t;
  for(const g of carMeshes.values()){if(g.userData.dest){g.position.lerp(g.userData.dest,clamp(.07*d,0,1));}}
  renderer.render(scene,camera);
 }
 requestAnimationFrame(animate);syncCars();$('scene-badge').textContent='3D WORKSHOP · LIVE DIGITAL FLOOR';
 return {sync:syncCars,zoom(d){radius=clamp(radius+d,23,70);updateCamera();},reset(){theta=.78;phi=.91;radius=40;updateCamera();}};
}
function loop(t){
 if(lastFrame===0)lastFrame=t;
 const elapsed=Math.min(750,t-lastFrame);lastFrame=t;
 if(running){const advance=elapsed/1000*.28*speed;const chunks=Math.max(1,Math.ceil(advance/.13));for(let k=0;k<chunks;k++)oneTick(advance/chunks);}
 if(t-uiTimer>1000){drawUI();uiTimer=t;}
 requestAnimationFrame(loop);
}
load();controls();drawUI();initThree().then(r=>{screen=r;drawUI();}).catch(()=>{screen=initFallback();drawUI();});requestAnimationFrame(loop);
})();