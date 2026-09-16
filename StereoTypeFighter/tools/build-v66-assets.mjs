#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
import sharp from 'sharp';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const GAME=path.resolve(HERE,'..');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>=0?process.argv[i+1]:d};
const SITE=path.resolve(arg('--site',path.join(GAME,'.production')));
const CELL=192,COLS=8,REF_W=1536,REF_H=1024;
const SEQ=['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const exists=async p=>{try{await fs.access(p);return true}catch{return false}};
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]??0};

const HD_PANELS={
  idle:[4,267,505,383,12], walk:[515,267,1021,383,10],
  jump:[4,416,681,527,16], crouch:[690,416,1023,527,8], block:[1034,416,1531,527,8],
  punch:[4,560,461,666,8], kick:[948,560,1531,666,12],
  special:[4,704,782,810,20], hurt:[790,704,1131,810,8], fall:[1139,704,1531,810,10],
  getup:[4,844,629,946,12], victory:[639,844,1531,946,16]
};
const HD_CORE={
  lefty:{source:'Lefty.png',panels:HD_PANELS},
  agenda:{source:'Agenda.png',panels:HD_PANELS},
  'gym-bro':{source:'GymBro.png',panels:HD_PANELS},
  'bogan-tradie':{source:'Bogan.png',panels:HD_PANELS}
};

const crop=(sheet,sw,x,y,w,h)=>{const out=Buffer.alloc(w*h*4);for(let yy=0;yy<h;yy++){const src=((y+yy)*sw+x)*4;sheet.copy(out,yy*w*4,src,src+w*4)}return out};
const scalePanel=(r,w,h)=>{const sx=w/REF_W,sy=h/REF_H;return[Math.round(r[0]*sx),Math.round(r[1]*sy),Math.round(r[2]*sx),Math.round(r[3]*sy),r[4]]};
function cuts(panel,w,h,n){const occ=new Float64Array(w);for(let x=0;x<w;x++)for(let y=2;y<h-2;y++){const p=(y*w+x)*4,a=panel[p+3],lum=Math.max(panel[p],panel[p+1],panel[p+2]);if(a>32&&lum>42)occ[x]++}const out=[0],step=w/n;for(let i=1;i<n;i++){const center=i*step;let best=Math.round(center),score=Infinity;for(let x=Math.max(out[i-1]+8,Math.round(center-step*.32));x<Math.min(w-8,Math.round(center+step*.32));x++){const s=occ[x-1]+occ[x]+occ[x+1]+Math.abs(x-center)*.04;if(s<score){score=s;best=x}}out.push(best)}out.push(w);return out}
function morph(mask,w,h,d){const out=new Uint8Array(mask.length);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let v=d?0:1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)d?v|=mask[(y+dy)*w+x+dx]:v&=mask[(y+dy)*w+x+dx];out[y*w+x]=v}return out}
function silhouette(data,w,h){
  let alphaCount=0;for(let p=0;p<w*h;p++)if(data[p*4+3]>32&&data[p*4+3]<250)alphaCount++;
  const mask=new Uint8Array(w*h);
  if(alphaCount>w*h*.02){for(let p=0;p<w*h;p++)mask[p]=data[p*4+3]>32?1:0;return morph(mask,w,h,true)}
  for(let y=0;y<h;y++){
    const side=[[],[],[],[],[],[]];
    for(let dx=0;dx<3;dx++)for(let dy=-2;dy<=2;dy++){const yy=Math.max(0,Math.min(h-1,y+dy));for(let c=0;c<3;c++){side[c].push(data[(yy*w+dx)*4+c]);side[c+3].push(data[(yy*w+w-1-dx)*4+c])}}
    const bg=side.map(median);
    for(let x=0;x<w;x++){let dist=0,p=(y*w+x)*4;for(let c=0;c<3;c++)dist+=Math.abs(data[p+c]-(bg[c]+(bg[c+3]-bg[c])*x/Math.max(1,w-1)));mask[y*w+x]=dist>50?1:0}
  }
  const closed=morph(morph(mask,w,h,true),w,h,false),seen=new Uint8Array(w*h),q=new Int32Array(w*h);let tail=0;
  const add=p=>{if(!closed[p]&&!seen[p]){seen[p]=1;q[tail++]=p}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
  for(let head=0;head<tail;head++){const p=q[head],x=p%w,y=Math.floor(p/w);if(x)add(p-1);if(x<w-1)add(p+1);if(y)add(p-w);if(y<h-1)add(p+w)}
  for(let p=0;p<closed.length;p++)closed[p]=seen[p]?0:1;
  const visited=new Uint8Array(w*h),result=new Uint8Array(w*h);let largest=0;
  for(let p=0;p<closed.length;p++)if(closed[p]&&!visited[p]){const pts=[p];visited[p]=1;for(let i=0;i<pts.length;i++){const a=pts[i],x=a%w,y=Math.floor(a/w);for(const b of[x?a-1:-1,x<w-1?a+1:-1,y?a-w:-1,y<h-1?a+w:-1])if(b>=0&&closed[b]&&!visited[b]){visited[b]=1;pts.push(b)}}largest=Math.max(largest,pts.length);if(pts.length>=14)for(const q of pts)result[q]=1}
  if(largest<24)throw Error('Could not isolate sprite silhouette');return morph(result,w,h,true)
}
function trim(data,w,h){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r<l)throw Error('Empty sprite frame');const tw=r-l+1,th=b-t+1,out=Buffer.alloc(tw*th*4);for(let yy=0;yy<th;yy++)data.copy(out,yy*tw*4,((t+yy)*w+l)*4,((t+yy)*w+r+1)*4);return{data:out,w:tw,h:th}}
function isolate(data,w,h){const m=silhouette(data,w,h),out=Buffer.from(data);for(let p=0;p<m.length;p++)out[p*4+3]=m[p]?255:0;return trim(out,w,h)}
function inPoly(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!=(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi||1e-6)+xi)c=!c}return c}
function matte(sheet,sw,r){const[x,y,w,h,polys]=r,raw=crop(sheet,sw,x,y,w,h),out=Buffer.from(raw);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){let inside=false;for(const p of polys)if(p.length&&inPoly(xx+.5,yy+.5,p)){inside=true;break}out[(yy*w+xx)*4+3]=inside?255:0}return trim(out,w,h)}
function split(sheet,sw,r){const[l,t,rr,b,n]=r,w=rr-l,h=b-t,panel=crop(sheet,sw,l,t,w,h),c=cuts(panel,w,h,n),frames=[];for(let i=0;i<n;i++){const x=c[i],fw=c[i+1]-x;frames.push(isolate(crop(panel,w,x,0,fw,h),fw,h))}return frames}
async function fitFrame(f){const max=CELL-12,scale=Math.min(1,max/f.w,max/f.h);if(scale>=.999)return f;const width=Math.max(1,Math.round(f.w*scale)),height=Math.max(1,Math.round(f.h*scale)),data=await sharp(f.data,{raw:{width:f.w,height:f.h,channels:4}}).resize(width,height,{kernel:'lanczos3'}).raw().toBuffer();return{data,w:width,h:height}}
function place(f,i){return{input:f.data,raw:{width:f.w,height:f.h,channels:4},left:(i%COLS)*CELL+Math.floor((CELL-f.w)/2),top:Math.floor(i/COLS)*CELL+CELL-f.h-6}}
async function loadMattes(){try{const m=await import(pathToFileURL(path.join(GAME,'matte-v5.js')).href);return JSON.parse(gunzipSync(Buffer.from(m.encodedMattes,'base64')).toString('utf8'))}catch{return{}}}
async function sourcePath(source){const candidates=[path.join(GAME,'Characters',source),path.join(GAME,source)];for(const p of candidates)if(await exists(p))return p;throw Error(`Missing Characters source ${source}`)}
async function build(geo,mattes,out){
  const input=await sourcePath(geo.source),{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width<600||info.height<400)throw Error(`${geo.id}: source sheet too small ${info.width}x${info.height}`);
  const groups={},nativeReference=info.width===REF_W&&info.height===REF_H;
  for(const s of SEQ){
    if(!geo.panels?.[s])throw Error(`${geo.id}: missing ${s} panel`);
    const panel=scalePanel(geo.panels[s],info.width,info.height);
    const stored=mattes?.[geo.id]?.[s];
    const raw=nativeReference&&stored?.length?stored.map(r=>matte(data,info.width,r)):split(data,info.width,panel);
    groups[s]=[];for(const f of raw)groups[s].push(await fitFrame(f));
    if(geo.orders?.[s])groups[s]=geo.orders[s].map(i=>groups[s][i]);
  }
  const flat=SEQ.flatMap(s=>groups[s]),rows=Math.ceil(flat.length/COLS);
  await fs.mkdir(path.dirname(out),{recursive:true});
  await sharp({create:{width:COLS*CELL,height:rows*CELL,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(flat.map(place)).webp({quality:90,alphaQuality:100,effort:5,smartSubsample:true}).toFile(out);
  return Object.fromEntries(SEQ.map(s=>[s,groups[s].length]));
}

const v66=await json(path.join(GAME,'tools/roster-v66.json'));
const base=await json(path.join(GAME,'tools/roster-v5.json'));
const geometry=new Map(base.filter(x=>x.source&&x.panels).map(x=>[x.id,{...x}]));
for(const [id,g] of Object.entries(HD_CORE))geometry.set(id,{id,...g});
if(v66.length!==20||new Set(v66.map(x=>x.id)).size!==20)throw Error('Expected 20 fighters');
const mattes=await loadMattes(),generated=path.join(SITE,'assets/characters/v70'),production=[];
for(const def of v66){const geo=geometry.get(def.id);if(!geo)throw Error(`${def.id}: no Characters source geometry`);const file=`${def.id}-atlas.webp`,counts=await build(geo,mattes,path.join(generated,file)),frames=Object.values(counts).reduce((a,b)=>a+b,0);production.push({...def,render:'atlas',atlas:`./assets/characters/v70/${file}`,atlasCell:[CELL,CELL],atlasColumns:COLS,atlasCounts:counts,motionRate:def.motionRate||1.5});console.log(`Built ${def.id}: ${frames} source-art frames -> ${file}`)}
await fs.mkdir(path.join(SITE,'tools'),{recursive:true});
await fs.writeFile(path.join(SITE,'tools/roster-runtime-v66.json'),JSON.stringify(production,null,2)+'\n');
console.log('Stereotype Fighters production roster: 20 fighters built from Characters source sheets.');
