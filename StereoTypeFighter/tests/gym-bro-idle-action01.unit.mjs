import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const dir=fileURLToPath(new URL('../art/v8/gym-bro/idle/',import.meta.url));
test('Action 01 Idle has six distinct 512x512 alpha sprites with planted feet',async()=>{
 const spec=JSON.parse(await fs.readFile(new URL('../art/manifest-v8.json',import.meta.url),'utf8'))['gym-bro'];
 assert.deepEqual(spec.anims.idle,{frames:6,fps:7,loop:true});
 assert.deepEqual(spec.anchor,[256,470]);
 const seen=new Set;
 for(let i=1;i<=6;i++){
  const name=path.join(dir,String(i).padStart(2,'0')+'.png'),buf=await fs.readFile(name);
  const hash=createHash('sha256').update(buf).digest('hex');
  assert.ok(!seen.has(hash),'duplicate Idle frame '+i);seen.add(hash);
  const metadata=await sharp(buf).metadata();
  assert.deepEqual([metadata.width,metadata.height,metadata.channels,metadata.hasAlpha],[512,512,4,true],name);
  const {data,info}=await sharp(buf).raw().toBuffer({resolveWithObject:true});
  let minX=512,minY=512,maxX=-1,maxY=-1,opaque=0,clear=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
   const a=data[(y*512+x)*info.channels+3];
   if(a===0)clear++;
   if(a<=64)continue;
   if(a>=244)opaque++;
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  assert.equal(maxY+1,470,'foot anchor for frame '+i);
  assert.ok(minY>=70&&minY<=101,'head registration for frame '+i);
  assert.ok(minX>=100&&maxX<=420,'centred fighter for frame '+i);
  assert.ok(opaque>38000&&clear>205000,'invalid alpha silhouette for frame '+i);
 }
 assert.equal(seen.size,6);
});
