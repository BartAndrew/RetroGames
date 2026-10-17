import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const $=s=>document.querySelector(s);
const canvas=$('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x151918);
scene.fog=new THREE.FogExp2(0x151918,.0095);

const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,600);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.minDistance=16;
controls.maxDistance=110;
controls.maxPolarAngle=Math.PI*.49;

scene.add(new THREE.HemisphereLight(0xc9d8dc,0x40382d,1.9));
const sun=new THREE.DirectionalLight(0xffecd0,3.5);
sun.position.set(-45,55,22);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
scene.add(sun);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);
world.allowSleep=true;
const groundBody=new CANNON.Body({mass:0,shape:new CANNON.Plane()});
groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
world.addBody(groundBody);

const C={
 asphalt:0x252826, concrete:0x777970, curb:0xa5a59c, orange:0xd66a27, orange2:0xff8a2a,
 steel:0x514c45, steelHot:0xffa03b, core:0x4a403a, slab:0xb87043, glass:0x78929b,
 building:0x697477, dark:0x202321, green:0x58715b, tree:0x476248, trunk:0x604a32,
 car:0x9c4f42, white:0xd9d7cf, yellow:0xe5c74a, red:0xb44337
};
const mat=(color,rough=.8,metal=.05,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
const mats={
 ground:mat(0x444743,.98),road:mat(C.asphalt,1),sidewalk:mat(C.concrete,.95),curb:mat(C.curb,.85),
 protected:mat(C.building,.72,.1),glass:mat(C.glass,.28,.18,{emissive:0x10191c}),
 facade:mat(C.orange,.62,.08,{transparent:true,opacity:.72,side:THREE.DoubleSide}),
 steel:mat(C.steel,.58,.35),steelHot:mat(C.steelHot,.5,.25,{emissive:0x5a1d00,emissiveIntensity:.35}),
 core:mat(C.core,.8,.08),slab:mat(C.slab,.84,.02),node:mat(0xffa62c,.35,.2,{emissive:0xff5b00,emissiveIntensity:1.5}),
 charge:mat(0x1b1b1a,.4,.55,{emissive:0xff431f,emissiveIntensity:.9}),tree:mat(C.tree,.9),trunk:mat(C.trunk,.95),
 lamp:mat(0x383b3b,.5,.55),lane:new THREE.MeshBasicMaterial({color:C.yellow}),safe:new THREE.MeshBasicMaterial({color:0x5aff89,transparent:true,opacity:.08,depthWrite:false})
};

const state={
 level:1,data:null,targetOrigin:new THREE.Vector3(18,0,18),charges:[],nodes:[],members:[],slabs:[],coreSegments:[],
 protected:[],bodies:[],debris:[],running:false,finished:false,mode:'charge',power:.7,delay:0,collateral:0,
 targetIntegrity:1,maxCharges:8,par:5,budget:24000,audio:true,xray:false,collapseTimers:[],failedNodes:new Set()
};
const seeded=seed=>{let s=(seed>>>0)||1;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function levelPreset(n){
 const names=['Frame School','Corner Cut','Core Lesson','Glass Canyon','Needle Fold','Twin Walls','The Leaner','Downtown Stack','Core Surgery','Zero Margin'];
 const archetypes=['perimeter frame','frame + core','frame + core','moment frame','frame + core','braced frame','offset core','tube frame','core + outriggers','tube + core'];
 const base=[
  [7,12,12,4,7],[9,12,10,5,8],[10,12,12,5,8],[12,11,11,6,9],[14,10,10,6,9],
  [13,12,11,6,10],[15,11,12,7,10],[17,11,11,7,11],[19,10,10,8,12],[21,10,10,8,12]
 ];
 if(n<=10){const b=base[n-1];return{floors:b[0],w:b[1],d:b[2],par:b[3],max:b[4],name:names[n-1],archetype:archetypes[n-1],difficulty:['ROOKIE','ROOKIE','CREW','CREW','PRO','PRO','EXPERT','EXPERT','MASTER','MASTER'][n-1],seed:n*2711};}
 const r=seeded(n*7919+31),floors=11+Math.floor(r()*15),w=9+r()*4,d=9+r()*4;
 const types=['frame + core','braced frame','tube frame','offset core','core + outriggers'];
 return{floors,w,d,par:Math.max(5,Math.round(floors*.38)),max:Math.max(8,Math.round(floors*.52)),name:'Procedural #'+n,archetype:types[Math.floor(r()*types.length)],difficulty:n<18?'EXPERT':'MASTER',seed:n*7919+31};
}

function box(group,w,h,d,x,y,z,material,cast=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;group.add(m);return m;
}
function cyl(group,r,h,x,y,z,material){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),material);m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;
}

function clearLevel(){
 state.collapseTimers.forEach(clearTimeout);state.collapseTimers=[];
 state.bodies.forEach(b=>world.removeBody(b));state.bodies=[];state.debris=[];state.charges=[];state.nodes=[];state.members=[];state.slabs=[];state.coreSegments=[];state.protected=[];state.failedNodes.clear();
 ['city','level'].forEach(name=>{const o=scene.getObjectByName(name);if(o)scene.remove(o)});
}

function addRoadCity(seed){
 const r=seeded(seed),g=new THREE.Group();g.name='city';scene.add(g);
 box(g,120,.8,120,0,-.45,0,mats.ground,false);
 // road-first plan: two orthogonal streets. Buildings are spawned only inside four corner parcels.
 box(g,120,.07,14,0,.01,0,mats.road,false);box(g,14,.08,120,0,.015,0,mats.road,false);
 for(const z of[-7.5,7.5])box(g,120,.22,.6,0,.1,z,mats.curb,false);
 for(const x of[-7.5,7.5])box(g,.6,.22,120,x,.11,0,mats.curb,false);
 // sidewalks around each parcel
 const parcels=[[-28,-28],[-28,28],[28,-28],[28,28]];
 parcels.forEach(p=>box(g,39,.14,39,p[0],.05,p[1],mats.sidewalk,false));
 // lane markings
 for(let i=-54;i<=54;i+=8){box(g,3,.012,.16,i,.07,0,mats.lane,false);box(g,.16,.012,3,0,.075,i,mats.lane,false)}
 // crosswalks
 for(const s of[-1,1])for(let i=-5;i<=5;i+=2){box(g,1.1,.02,4.5,i,.08,s*10,mats.sidewalk,false);box(g,4.5,.02,1.1,s*10,.081,i,mats.sidewalk,false)}
 // street lights, trees, hydrants, parked cars
 const lightPts=[[-8,-16],[-8,16],[8,-16],[8,16],[-16,-8],[16,-8],[-16,8],[16,8],[-8,-42],[8,42],[-42,8],[42,-8]];
 lightPts.forEach((p,i)=>{cyl(g,.1,4.4,p[0],2.2,p[1],mats.lamp);box(g,.9,.08,.18,p[0]+(i%2?.35:-.35),4.2,p[1],mats.lamp);});
 const treePts=[[-44,-18],[-32,-18],[-18,-44],[-18,-32],[44,18],[32,18],[18,44],[18,32],[-44,18],[44,-18]];
 treePts.forEach(p=>{cyl(g,.18,1.7,p[0],.85,p[1],mats.trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,1),mats.tree);crown.position.set(p[0],2.2,p[1]);g.add(crown)});
 const cars=[[-15,-3,0],[-28,-3,0],[-41,3,Math.PI],[15,3,Math.PI],[31,3,Math.PI],[3,-20,Math.PI/2],[-3,-33,-Math.PI/2],[-3,27,-Math.PI/2]];
 cars.forEach((p,i)=>{const cg=new THREE.Group();const cm=mat([C.car,0x425d74,0x6d6d68,0xb7a14b][i%4],.45,.25);box(cg,3.5,.7,1.55,0,.55,0,cm);box(cg,1.9,.6,1.35,-.15,1.08,0,mats.glass);for(const x of[-1.1,1.1])for(const z of[-.7,.7])cyl(cg,.28,.18,x,.3,z,mat(0x111111,.8));cg.rotation.y=p[2];cg.position.set(p[0],0,p[1]);g.add(cg)});
 // distant cheap skyline outside playable block
 for(let i=0;i<42;i++){const side=i%4,along=-55+r()*110,dist=64+r()*18,w=5+r()*8,d=5+r()*8,h=8+r()*34;let x=0,z=0;if(side===0){x=along;z=-dist}else if(side===1){x=dist;z=along}else if(side===2){x=along;z=dist}else{x=-dist;z=along}box(g,w,h,d,x,h/2,z,mat(0x343b3d,.9,.04),false)}
 // protected buildings inside parcels, never roads
 const lots=[
  [-28,-28,[-38,-38,-20,-20]],[-28,28,[-38,18,-20,38]],[28,-28,[18,-38,38,-20]],[28,28,[18,18,38,38]]
 ];
 lots.forEach((lot,li)=>{
   const b=lot[2],targetParcel=li===3;
   const count=targetParcel?2:2+Math.floor(r()*2);
   for(let j=0;j<count;j++){
    let x=b[0]+5+r()*(b[2]-b[0]-10),z=b[1]+5+r()*(b[3]-b[1]-10);
    if(targetParcel && Math.hypot(x-state.targetOrigin.x,z-state.targetOrigin.z)<13){x=34;z=j?34:20}
    const w=6+r()*6,d=6+r()*6,f=4+Math.floor(r()*10);
    addProtected(g,x,z,w,d,f,li*4+j);
   }
 });
 // site fencing around the target lot
 for(let x=10;x<=26;x+=2){box(g,1.6,1.15,.08,x,.6,10,mat(0xc28b38,.7,.2));box(g,1.6,1.15,.08,x,.6,26,mat(0xc28b38,.7,.2))}
 for(let z=12;z<=24;z+=2){box(g,.08,1.15,1.6,10,.6,z,mat(0xc28b38,.7,.2));box(g,.08,1.15,1.6,26,.6,z,mat(0xc28b38,.7,.2))}
 // site office + excavator hint
 box(g,5,2.6,2.6,33,1.3,12,mat(0xd8d2bd,.8));box(g,2.2,.7,1.3,33,.45,16,mat(0xd5a43d,.6,.2));cyl(g,.45,.4,32.2,.28,15.45,mat(0x191919,.8));cyl(g,.45,.4,33.8,.28,15.45,mat(0x191919,.8));
}

function addProtected(group,x,z,w,d,floors,index){
 const h=floors*2.05;const mesh=box(group,w,h,d,x,h/2,z,mats.protected);
 const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0xaab7b9,transparent:true,opacity:.2}));edge.position.copy(mesh.position);group.add(edge);
 const rows=Math.max(2,Math.floor(floors*.7)),cols=Math.max(2,Math.floor(w/2.6));
 for(let ry=0;ry<rows;ry++)for(let cx=0;cx<cols;cx++){const win=new THREE.Mesh(new THREE.PlaneGeometry(.75,.58),mats.glass);win.position.set(x-w/2+.9+cx*(w-1.8)/Math.max(1,cols-1),1.2+ry*(h-2.4)/Math.max(1,rows-1),z+d/2+.01);group.add(win)}
 state.protected.push({x,z,w,d,h,index,damage:0});
 const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)),position:new CANNON.Vec3(x,h/2,z)});world.addBody(body);state.bodies.push(body);
}

function memberBetween(group,a,b,r,material,type,floor,nodeIds=[]){
 const dir=new THREE.Vector3().subVectors(b,a),len=dir.length(),mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,8),material);mesh.position.copy(mid);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 const member={mesh,a:a.clone(),b:b.clone(),type,floor,nodeIds,failed:false};state.members.push(member);return member;
}

function addTargetStructure(group,data){
 const ox=state.targetOrigin.x,oz=state.targetOrigin.z,floorH=2.15;
 const nx=3,nz=3,dx=data.w/(nx-1),dz=data.d/(nz-1);
 const nodeAt=(f,ix,iz)=>state.nodes.find(n=>n.f===f&&n.ix===ix&&n.iz===iz);
 // vertices and vertical columns
 for(let f=0;f<=data.floors;f++)for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
   const p=new THREE.Vector3(ox-data.w/2+ix*dx,f*floorH,oz-data.d/2+iz*dz);
   const node={id:'n-'+f+'-'+ix+'-'+iz,f,ix,iz,pos:p,charge:null,failed:false,capacity:(ix===1&&iz===1?2.3:1),core:ix===1&&iz===1};
   const nm=new THREE.Mesh(new THREE.SphereGeometry(node.core?.22:.16,10,8),node.core?mats.steelHot.clone():mats.node.clone());nm.position.copy(p);nm.visible=false;nm.userData.nodeId=node.id;group.add(nm);node.mesh=nm;state.nodes.push(node);
 }
 for(let f=0;f<data.floors;f++)for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
   const a=nodeAt(f,ix,iz),b=nodeAt(f+1,ix,iz);memberBetween(group,a.pos,b.pos,ix===1&&iz===1?.15:.1,ix===1&&iz===1?mats.steelHot:mats.steel,'column',f,[a.id,b.id]);
 }
 // floor beams + thin slabs
 for(let f=1;f<=data.floors;f++){
   for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz-1;iz++){const a=nodeAt(f,ix,iz),b=nodeAt(f,ix,iz+1);memberBetween(group,a.pos,b.pos,.075,mats.steel,'beam',f,[a.id,b.id])}
   for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx-1;ix++){const a=nodeAt(f,ix,iz),b=nodeAt(f,ix+1,iz);memberBetween(group,a.pos,b.pos,.075,mats.steel,'beam',f,[a.id,b.id])}
   for(let ix=0;ix<nx-1;ix++)for(let iz=0;iz<nz-1;iz++){
     const x=ox-data.w/2+dx/2+ix*dx,z=oz-data.d/2+dz/2+iz*dz;
     const mesh=box(group,dx-.12,.12,dz-.12,x,f*floorH-.06,z,mats.slab);
     const slab={mesh,f,ix,iz,w:dx-.12,d:dz-.12,h:.12,body:null,detached:false,hitProtected:false};state.slabs.push(slab);
   }
 }
 // core: stylised central spine, stronger than perimeter
 const coreW=Math.max(1.9,data.w*.22),coreD=Math.max(1.9,data.d*.22);
 for(let f=0;f<data.floors;f++){const y=f*floorH+floorH/2;const core=box(group,coreW,floorH-.18,coreD,ox,y,oz,mats.core);core.userData.core=true;state.coreSegments.push({mesh:core,f,failed:false,w:coreW,d:coreD,h:floorH-.18,body:null,hitProtected:false})}
 // façade panels are visual only
 const facadeGroup=new THREE.Group();facadeGroup.name='facade';group.add(facadeGroup);
 for(let f=0;f<data.floors;f++){const y=f*floorH+floorH*.5;
  for(let i=0;i<nx-1;i++){const x=ox-data.w/2+dx/2+i*dx;box(facadeGroup,dx-.18,floorH-.22,.05,x,y,oz-data.d/2-.02,mats.facade,false);box(facadeGroup,dx-.18,floorH-.22,.05,x,y,oz+data.d/2+.02,mats.facade,false)}
  for(let i=0;i<nz-1;i++){const z=oz-data.d/2+dz/2+i*dz;box(facadeGroup,.05,floorH-.22,dz-.18,ox-data.w/2-.02,y,z,mats.facade,false);box(facadeGroup,.05,floorH-.22,dz-.18,ox+data.w/2+.02,y,z,mats.facade,false)}
 }
 const zone=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(data.w,data.d)*.78,Math.max(data.w,data.d)*.78,.04,48),mats.safe);zone.position.set(ox,.045,oz);group.add(zone);
 setEngineeringView(false);
}

function setEngineeringView(on){
 state.xray=on;const level=scene.getObjectByName('level');if(!level)return;
 const facade=level.getObjectByName('facade');if(facade)facade.children.forEach(m=>{m.material.opacity=on?.12:.72;m.material.depthWrite=!on});
 state.members.forEach(m=>{m.mesh.visible=on||m.type==='column';m.mesh.material=on?mats.steelHot:mats.steel});
 state.coreSegments.forEach(c=>{c.mesh.material.transparent=on;c.mesh.material.opacity=on?.32:1});
 state.nodes.forEach(n=>{n.mesh.visible=!state.running&&!n.charge&&(on||state.mode==='charge')});
 $('#xrayBtn').classList.toggle('active',on);
}

function loadLevel(n){
 clearLevel();state.level=n;state.data=levelPreset(n);state.running=false;state.finished=false;state.collateral=0;state.targetIntegrity=1;state.maxCharges=state.data.max;state.par=state.data.par;state.budget=state.maxCharges*3000;
 addRoadCity(state.data.seed);const level=new THREE.Group();level.name='level';scene.add(level);addTargetStructure(level,state.data);
 resetCamera();updateHUD();setEngineeringView(false);$('#resultModal').classList.remove('open');
 $('#levelLabel').textContent='CONTRACT '+String(n).padStart(2,'0');$('#levelName').textContent=state.data.name;$('#difficulty').textContent=state.data.difficulty;$('#structureType').textContent=state.data.archetype.toUpperCase();
 $('#brief').textContent=n<3?'Read the frame, sever the right joints and let gravity do the work.':n<7?'Use the frame and core together. A balanced loss of support folds the building inward.':'Sequence structural failures to keep the collapse inside the site boundary.';
 $('#best').textContent=localStorage.getItem('dm-best-'+n)||'—';
}
function resetCamera(){const h=(state.data?.floors||8)*2.15;camera.position.set(state.targetOrigin.x+34,Math.max(25,h*.78),state.targetOrigin.z+38);controls.target.set(state.targetOrigin.x,Math.min(h*.46,22),state.targetOrigin.z);controls.update()}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function pickNode(e){
 if(state.running||state.finished||state.mode!=='charge')return;
 const rect=canvas.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(state.nodes.map(n=>n.mesh),false);if(!hits.length)return;
 const id=hits[0].object.userData.nodeId,node=state.nodes.find(n=>n.id===id);if(!node)return;
 if(node.charge){removeCharge(node);return}if(state.charges.length>=state.maxCharges){toast('Charge limit reached');return}addCharge(node);
}
canvas.addEventListener('click',pickNode);

function addCharge(node){
 const g=new THREE.Group();const pack=box(g,.38,.5,.2,0,0,0,mats.charge);const lamp=new THREE.PointLight(0xff5a20,.65,2);lamp.position.set(0,.1,.15);g.add(lamp);g.position.copy(node.pos);scene.getObjectByName('level').add(g);
 const c={node,mesh:g,power:state.power,delay:state.delay};node.charge=c;state.charges.push(c);node.mesh.visible=false;updateHUD();forecast();
}
function removeCharge(node){const c=node.charge;if(!c)return;scene.getObjectByName('level').remove(c.mesh);state.charges=state.charges.filter(x=>x!==c);node.charge=null;node.mesh.visible=state.xray;updateHUD();forecast()}

function forecast(){
 if(!state.charges.length){$('#failureRisk').textContent='LOW';return}
 const avgFloor=state.charges.reduce((s,c)=>s+c.node.f,0)/state.charges.length;
 const spread=Math.hypot(
   state.charges.reduce((s,c)=>s+(c.node.pos.x-state.targetOrigin.x),0)/state.charges.length,
   state.charges.reduce((s,c)=>s+(c.node.pos.z-state.targetOrigin.z),0)/state.charges.length
 );
 const core=state.charges.filter(c=>c.node.core).length;
 const score=state.charges.length*1.2+(state.data.floors-avgFloor)*.12+core*.8-spread*.08;
 $('#failureRisk').textContent=score>8?'HIGH':score>5?'MED':'LOW';
}

function updateHUD(){
 $('#chargeCount').textContent=state.charges.length+' / '+state.maxCharges;$('#budget').textContent='$'+Math.round(state.budget/1000)+'k';$('#par').textContent=state.par;
 $('#targetStat').textContent=Math.round(state.targetIntegrity*100)+'%';$('#targetMeter').style.width=state.targetIntegrity*100+'%';$('#collateralStat').textContent='$'+Math.round(state.collateral).toLocaleString();$('#collateralMeter').style.width=clamp(state.collateral/600,0,100)+'%';
 const used=state.charges.reduce((s,c)=>s+c.power,0),score=Math.max(0,Math.round(10000-used*360-state.collateral*.03));$('#score').textContent=score.toLocaleString();
 $('#efficiency').textContent=(state.charges.length?clamp(Math.round(state.par/state.charges.length*100),35,100):100)+'%';$('#safety').textContent=state.collateral===0?'A+':state.collateral<10000?'B':state.collateral<30000?'C':'F';$('#detonate').disabled=!state.charges.length||state.running;
}

function failNode(node,power){
 if(node.failed)return;node.failed=true;state.failedNodes.add(node.id);node.mesh.material=mat(0xff3928,.5,.1,{emissive:0xff1200,emissiveIntensity:1.2});
 state.members.filter(m=>m.nodeIds.includes(node.id)&&!m.failed).forEach(m=>{m.failed=true;m.mesh.material=mat(0x2c2623,.9);m.mesh.scale.set(.18,.18,.18)});
 spawnBurst(node.pos,power);
}
function spawnBurst(pos,power){const group=scene.getObjectByName('level'),count=6+Math.round(power*7);for(let i=0;i<count;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05+Math.random()*.08,6,5),new THREE.MeshBasicMaterial({color:i%2?0xc6b39b:0xff8a2a,transparent:true,opacity:.9}));m.position.copy(pos);m.userData.vel=new THREE.Vector3((Math.random()-.5)*power*1.8,Math.random()*power*1.6,(Math.random()-.5)*power*1.8);m.userData.life=.4+Math.random()*.45;m.userData.particle=true;group.add(m)}}

function detachSlab(slab,inward=.18){
 if(slab.detached)return;slab.detached=true;
 const p=slab.mesh.position,shape=new CANNON.Box(new CANNON.Vec3(slab.w/2,slab.h/2,slab.d/2)),body=new CANNON.Body({mass:Math.max(10,slab.w*slab.d*3.5),shape,position:new CANNON.Vec3(p.x,p.y,p.z),linearDamping:.18,angularDamping:.2});
 world.addBody(body);state.bodies.push(body);slab.body=body;state.debris.push(slab);
 const dir=new THREE.Vector3(state.targetOrigin.x-p.x,0,state.targetOrigin.z-p.z).normalize();body.applyImpulse(new CANNON.Vec3(dir.x*inward*55,-3,dir.z*inward*55),body.position);body.angularVelocity.set((Math.random()-.5)*.7,(Math.random()-.5)*.15,(Math.random()-.5)*.7);
}
function detachCore(seg,inward=.1){
 if(seg.failed)return;seg.failed=true;const p=seg.mesh.position,shape=new CANNON.Box(new CANNON.Vec3(seg.w/2,seg.h/2,seg.d/2)),body=new CANNON.Body({mass:80,shape,position:new CANNON.Vec3(p.x,p.y,p.z),linearDamping:.2,angularDamping:.24});world.addBody(body);state.bodies.push(body);seg.body=body;state.debris.push(seg);const dir=new THREE.Vector3(state.targetOrigin.x-p.x,0,state.targetOrigin.z-p.z).normalize();body.applyImpulse(new CANNON.Vec3(dir.x*inward*30,-4,dir.z*inward*30),body.position);
}

function supportForSlab(slab){
 const f=slab.f-1;const corners=[[slab.ix,slab.iz],[slab.ix+1,slab.iz],[slab.ix,slab.iz+1],[slab.ix+1,slab.iz+1]];
 let supports=0;corners.forEach(c=>{const n=state.nodes.find(n=>n.f===f&&n.ix===c[0]&&n.iz===c[1]);if(n&&!n.failed)supports+=n.core?1.45:1});
 const coreBelow=state.nodes.find(n=>n.f===f&&n.ix===1&&n.iz===1);if(coreBelow&&!coreBelow.failed&&slab.ix<=1&&slab.iz<=1)supports+=.6;
 return supports;
}
function cascadeStep(step){
 let newly=0;
 for(const slab of state.slabs){
   if(slab.detached||slab.f>step+2)continue;
   const support=supportForSlab(slab),threshold=slab.f<3?2.5:2.25;
   if(support<threshold){detachSlab(slab,.12+Math.max(0,threshold-support)*.1);newly++;}
 }
 // unsupported columns above failed joints progressively buckle
 const currentFailed=[...state.nodes].filter(n=>n.failed);
 currentFailed.forEach(n=>{
   if(n.f>=state.data.floors)return;
   const above=state.nodes.find(x=>x.f===n.f+1&&x.ix===n.ix&&x.iz===n.iz);
   if(above&&!above.failed){
     const neighboring=state.nodes.filter(x=>x.f===n.f&&Math.abs(x.ix-n.ix)+Math.abs(x.iz-n.iz)===1&&!x.failed).length;
     if(neighboring<2 || n.core){above.failed=true;state.failedNodes.add(above.id);state.members.filter(m=>m.nodeIds.includes(above.id)&&!m.failed).forEach(m=>{m.failed=true;m.mesh.scale.set(.18,.18,.18)});newly++;}
   }
 });
 for(const seg of state.coreSegments){const n=state.nodes.find(x=>x.f===seg.f&&x.core);if(n?.failed&&seg.f<=step+1)detachCore(seg,.08)}
 if(newly&&state.audio)beep(45+Math.random()*15,.08,.035,'triangle');
 updateIntegrity();
}

function updateIntegrity(){
 const attached=state.slabs.filter(s=>!s.detached).length+state.coreSegments.filter(s=>!s.failed).length;
 const total=state.slabs.length+state.coreSegments.length;state.targetIntegrity=attached/total;updateHUD();
}

function detonate(){
 if(!state.charges.length||state.running)return;state.running=true;setEngineeringView(true);updateHUD();toast('STRUCTURAL SEQUENCE ARMED');
 const ordered=[...state.charges].sort((a,b)=>a.delay-b.delay);
 ordered.forEach(c=>{const t=setTimeout(()=>{failNode(c.node,c.power);if(state.audio)beep(72,.09,.08,'sawtooth');},c.delay*420);state.collapseTimers.push(t)});
 const maxDelay=Math.max(...ordered.map(c=>c.delay));
 for(let s=0;s<state.data.floors+4;s++){const t=setTimeout(()=>cascadeStep(s),700+maxDelay*420+s*260);state.collapseTimers.push(t)}
 state.collapseTimers.push(setTimeout(finishSimulation,4600+maxDelay*420+state.data.floors*260));
}

function detectCollateral(){
 for(const item of state.debris){
   if(!item.body||item.hitProtected)continue;const p=item.body.position;
   for(const b of state.protected){const iw=item.w||2,id=item.d||2;if(p.y>0&&p.y<b.h+1&&Math.abs(p.x-b.x)<b.w/2+iw*.3&&Math.abs(p.z-b.z)<b.d/2+id*.3){item.hitProtected=true;const v=item.body.velocity,impact=Math.max(650,Math.hypot(v.x,v.y,v.z)*620);state.collateral+=impact;toast('COLLATERAL DAMAGE -$'+Math.round(impact).toLocaleString());updateHUD();break}}
 }
}
function finishSimulation(){
 if(!state.running)return;state.running=false;state.finished=true;updateIntegrity();
 const destroyed=1-state.targetIntegrity,chargeCost=state.charges.reduce((s,c)=>s+c.power*400,0);
 let score=Math.round(10000-chargeCost-state.collateral*.035-state.charges.length*120-Math.max(0,state.charges.length-state.par)*250-Math.max(0,.72-destroyed)*5200);score=Math.max(0,score);
 const pass=destroyed>.68&&state.collateral<65000,grade=!pass?'F':score>=9000?'S':score>=7900?'A':score>=6500?'B':score>=5000?'C':'D',stars=grade==='S'||grade==='A'?3:grade==='B'||grade==='C'?2:pass?1:0;
 $('#grade').textContent=grade;$('#resultBadge').textContent=pass?'CONTRACT COMPLETE':'CONTRACT FAILED';$('#resultTitle').textContent=!pass?(destroyed<=.68?'Structure Still Standing':'Collateral Breach'):(state.collateral===0?'House of Cards':'Controlled Collapse');
 $('#resultText').textContent=pass?Math.round(destroyed*100)+'% structural collapse. '+(state.collateral===0?'Protected property untouched.':'Some collateral was recorded.'):'Revise the structural plan and try a better support-loss pattern.';
 $('#finalScore').textContent=score.toLocaleString();$('#finalCharges').textContent=state.charges.length;$('#finalCollateral').textContent='$'+Math.round(state.collateral).toLocaleString();$('#stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#nextBtn').style.display=pass?'block':'none';
 const key='dm-best-'+state.level,prev=+(localStorage.getItem(key)||0);if(score>prev){localStorage.setItem(key,score);$('#best').textContent=score.toLocaleString()}
 localStorage.setItem('dm-level',Math.max(+(localStorage.getItem('dm-level')||1),pass?state.level+1:state.level));$('#resultModal').classList.add('open');
}
function beep(freq=80,dur=.1,vol=.05,type='sine'){try{const ctx=beep.ctx||(beep.ctx=new (AudioContext||webkitAudioContext)()),o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur)}catch{}}
let toastTimer;function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1300)}

function animate(){
 requestAnimationFrame(animate);const dt=Math.min(.033,animate.last?(performance.now()-animate.last)/1000:.016);animate.last=performance.now();
 if(state.running||state.finished){world.step(1/60,dt,3);state.debris.forEach(d=>{if(d.body){d.mesh.position.copy(d.body.position);d.mesh.quaternion.copy(d.body.quaternion)}});detectCollateral()}
 const level=scene.getObjectByName('level');if(level){for(const p of[...level.children])if(p.userData.particle){p.userData.life-=dt;p.position.addScaledVector(p.userData.vel,dt);p.userData.vel.y-=2.4*dt;p.material.opacity=clamp(p.userData.life,0,1);if(p.userData.life<=0)level.remove(p)}}
 state.nodes.forEach(n=>{if(n.mesh.visible&&!n.failed)n.mesh.scale.setScalar(1+Math.sin(performance.now()*.004+n.f)*.16)});
 controls.update();renderer.render(scene,camera);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();

$('#power').addEventListener('input',e=>{state.power=+e.target.value/100;$('#powerLabel').textContent=e.target.value+'%'});
$('#delay').addEventListener('input',e=>{state.delay=+e.target.value;$('#delayLabel').textContent=state.delay*420+' ms';document.querySelectorAll('.sequence i').forEach((x,i)=>x.classList.toggle('active',i<=state.delay))});
for(let i=0;i<5;i++){const x=document.createElement('i');$('#sequence').append(x)}$('#sequence i').classList.add('active');
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;if(state.mode==='inspect')setEngineeringView(true);toast(state.mode==='inspect'?'ENGINEERING VIEW':'CHARGE MODE')});
$('#xrayBtn').onclick=()=>setEngineeringView(!state.xray);$('#detonate').onclick=detonate;$('#reset').onclick=()=>loadLevel(state.level);$('#cameraBtn').onclick=resetCamera;
$('#soundBtn').onclick=()=>{state.audio=!state.audio;$('#soundBtn').textContent=state.audio?'♪':'×';toast(state.audio?'SOUND ON':'SOUND OFF')};$('#helpBtn').onclick=()=>$('#helpModal').classList.add('open');$('#closeHelp').onclick=$('#closeHelp2').onclick=()=>$('#helpModal').classList.remove('open');
$('#startBtn').onclick=()=>{$('#startCard').classList.remove('open');toast('CONTRACT ACTIVE')};$('#retryBtn').onclick=()=>loadLevel(state.level);$('#nextBtn').onclick=()=>loadLevel(state.level+1);

loadLevel(+(localStorage.getItem('dm-level')||1));animate();
