#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const GAME=path.resolve(HERE,'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback};
const SITE=path.resolve(arg('--site',path.join(GAME,'.production')));
const SEQ=['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];
const OUT_CELL=[160,112],COLS=8;

const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const patch=await readJson(path.join(GAME,'tools/roster-v6.json'));
const v66=await readJson(path.join(GAME,'tools/roster-v66.json'));
const sources=new Map([...patch.replace,...patch.add].map(x=>[x.id,x]));
const targets=v66.filter(x=>x.atlas);

function sequenceOffsets(counts){let cursor=0;return Object.fromEntries(SEQ.map(name=>{const start=cursor;cursor+=counts[name]||0;return[name,start]}));}
function blend(a,b,t){if(t<=0)return Buffer.from(a);if(t>=1)return Buffer.from(b);const out=Buffer.allocUnsafe(a.length);for(let i=0;i<a.length;i++)out[i]=Math.round(a[i]*(1-t)+b[i]*t);return out;}
async function extractRaw(image,index,cell,cols){const[cw,ch]=cell,left=(index%cols)*cw,top=Math.floor(index/cols)*ch;const{data,info}=await image.clone().extract({left,top,width:cw,height:ch}).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.channels!==4)throw Error('Expected RGBA atlas frame');return data;}
async function upscaleFrame(raw,sourceCell){const[sw,sh]=sourceCell,[tw,th]=OUT_CELL,fitH=Math.min(th,Math.round(sh*(tw/sw))),resized=await sharp(raw,{raw:{width:sw,height:sh,channels:4}}).resize(tw,fitH,{fit:'fill',kernel:'lanczos3'}).raw().toBuffer(),canvas=Buffer.alloc(tw*th*4),top=th-fitH;for(let y=0;y<fitH;y++)resized.copy(canvas,((top+y)*tw)*4,y*tw*4,(y+1)*tw*4);return canvas;}
for(const target of targets){const source=sources.get(target.id);if(!source?.atlas||!source.atlasCell||!source.atlasCounts)throw Error(`${target.id}: V6 source atlas metadata unavailable`);const sourcePath=path.resolve(GAME,source.atlas.replace(/^\.\//,'')),image=sharp(sourcePath),offsets=sequenceOffsets(source.atlasCounts),frames=[];for(const name of SEQ){const sourceCount=source.atlasCounts[name]||0,targetCount=target.atlasCounts[name]||0;if(!sourceCount||!targetCount)throw Error(`${target.id}/${name}: missing source or target frames`);const sourceFrames=[];for(let i=0;i<sourceCount;i++)sourceFrames.push(await extractRaw(image,offsets[name]+i,source.atlasCell,source.atlasColumns||8));for(let i=0;i<targetCount;i++){const p=targetCount===1?0:(i/(targetCount-1))*(sourceCount-1),lo=Math.floor(p),hi=Math.min(sourceCount-1,Math.ceil(p)),mixed=blend(sourceFrames[lo],sourceFrames[hi],p-lo);frames.push(await upscaleFrame(mixed,source.atlasCell));}}const rows=Math.ceil(frames.length/COLS),width=COLS*OUT_CELL[0],height=rows*OUT_CELL[1],composites=frames.map((data,i)=>({input:data,raw:{width:OUT_CELL[0],height:OUT_CELL[1],channels:4},left:(i%COLS)*OUT_CELL[0],top:Math.floor(i/COLS)*OUT_CELL[1]})),outDir=path.join(SITE,'assets/characters/v66');await fs.mkdir(outDir,{recursive:true});await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).webp({lossless:true,effort:5}).toFile(path.join(outDir,target.atlas));console.log(`Built ${target.id}: ${frames.length} interpolated V6.6 frames -> ${target.atlas}`);}
