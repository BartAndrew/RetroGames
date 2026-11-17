// V7.1 art-lab ZIP loader. Offline candidate images are *preview-only* and never sent to a server.
// Combat hitboxes, frame data and story dialogue are unchanged.
const REQUIRED = {
  idle:6,walk:6,walkBack:6,dashF:3,dashB:3,crouch:2,block:2,blockLow:2,
  prejump:1,jumpUp:2,jumpApex:1,jumpDown:2,land:1,lp:5,lk:5,hp:6,hk:6,
  launcher:6,sweep:6,airP:4,airK:4,hurt:2,hurtLow:2,launched:3,
  knockdown:2,ko:1,getup:5,special:6,super:12,victory:4,intro:4
};
const RIVALS = ['bogan-tradie','yuppie','fat-gamer','cheerleader'];
const SCENES = ['prologue-gym-bro','ending-gym-bro'].concat(
  RIVALS.flatMap(id => ['pre-gym-bro-'+id,'post-gym-bro-'+id])
);
const $ = id => document.getElementById(id);
const status = (message, isError=false) => {
  $('artPackStatus').textContent = message;
  $('artPackStatus').style.color = isError ? '#ff978d' : '#d7fca5';
};
const pad = n => String(n).padStart(2,'0');
const decoder = new TextDecoder();
const MAX_ARCHIVE = 64*1024*1024, MAX_FILE = 15*1024*1024;
let installed=null;

class LocalZip {
  constructor(buffer) {
    this.buffer=buffer; this.view=new DataView(buffer); this.entries=new Map();
    const v=this.view, len=v.byteLength;
    let end=-1;
    for(let i=len-22;i>=Math.max(0,len-66000);i--){
      if(v.getUint32(i,true)===0x06054b50){end=i;break}
    }
    if(end<0)throw Error('ZIP end-of-central-directory not found');
    const count=v.getUint16(end+10,true), dir=v.getUint32(end+16,true);
    if(count<130||count>160)throw Error('Unexpected number of files in artwork ZIP');
    let off=dir, total=0;
    for(let i=0;i<count;i++){
      if(v.getUint32(off,true)!==0x02014b50)throw Error('Invalid ZIP directory entry');
      const method=v.getUint16(off+10,true), size=v.getUint32(off+24,true),
            packed=v.getUint32(off+20,true), nameLen=v.getUint16(off+28,true),
            extra=v.getUint16(off+30,true), comment=v.getUint16(off+32,true),
            local=v.getUint32(off+42,true);
      const name=decoder.decode(new Uint8Array(buffer,off+46,nameLen));
      if(!name||name[0]==='/'||name.includes('..')||name.includes('\\')||this.entries.has(name))
        throw Error('Invalid ZIP member: '+name);
      if((method!==8&&method!==0)||size>MAX_FILE)throw Error('Unsupported ZIP file: '+name);
      total+=size;
      if(total>280*1024*1024)throw Error('ZIP uncompressed size exceeds safety limit');
      this.entries.set(name,{method,size,packed,local});
      off+=46+nameLen+extra+comment;
      if(off>len)throw Error('Invalid ZIP directory boundaries');
    }
  }
  async bytes(name){
    const e=this.entries.get(name);
    if(!e)throw Error('Missing required ZIP item: '+name);
    const v=this.view,l=e.local;
    if(v.getUint32(l,true)!==0x04034b50)throw Error('Invalid file header: '+name);
    const p=l+30+v.getUint16(l+26,true)+v.getUint16(l+28,true);
    if(p+e.packed>this.buffer.byteLength)throw Error('Truncated ZIP item: '+name);
    const chunk=this.buffer.slice(p,p+e.packed);
    let bytes;
    if(e.method===0)bytes=new Uint8Array(chunk);
    else{
      if(typeof DecompressionStream!=='function')throw Error('Browser does not support ZIP decompression');
      const stream=new Blob([chunk]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes=new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if(bytes.byteLength!==e.size)throw Error('Invalid decompressed size: '+name);
    return bytes;
  }
  async json(name){return JSON.parse(decoder.decode(await this.bytes(name)))}
}
async function hash(bytes){
  const buffer=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
}
async function checkedImage(bytes,path,expected,expectedHash,objects){
  if(expectedHash&&await hash(bytes)!==expectedHash)throw Error('SHA-256 mismatch: '+path);
  if(bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)
    throw Error('Not a PNG: '+path);
  const objectURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  objects.push(objectURL);
  const img=new Image();
  img.src=objectURL;
  await img.decode();
  if(expected && (img.naturalWidth!==expected[0]||img.naturalHeight!==expected[1]))
    throw Error('Incorrect image size: '+path);
  img.ok=true;
  return img;
}
function setEnabled(on){
  if(!installed)return;
  const store=window.SF7_ART_STORE;
  if(on){
    store.manifest['gym-bro']=installed.spec;
    store.manifest.scenes=true;
    for(const [k,img] of installed.images){
      const fighterFrame=/^art\/gym-bro\/([^/]+)\/\d+\.png$/.exec(k);
      // Unapproved silhouettes must use the actual engine rig, never a broken PNG.
      // The truthy sentinel prevents ArtStore.img from trying a missing network URL.
      const blocked=fighterFrame&&installed.blockedActions.includes(fighterFrame[1]);
      store.imgs.set(k,blocked ? {ok:false} : img);
    }
  }else{
    store.manifest['gym-bro']=installed.previousSpec;
    store.manifest.scenes=installed.previousScenes;
    for(const k of installed.images.keys()){
      if(installed.previousImages.has(k))store.imgs.set(k,installed.previousImages.get(k));
      else store.imgs.delete(k);
    }
  }
  window.SF7_ART_LAB_STATUS={loaded:true,enabled:on,frames:120,scenes:10,
    candidateActions:31-installed.blockedActions.length,blockedActions:installed.blockedActions,
    origin:'local ZIP, not deployed'};
  $('useCandidate').checked=on;
  status(on ? 'Previewing '+(31-installed.blockedActions.length)+' candidate actions. '+
    installed.blockedActions.length+' actions withheld for rig fallback due to silhouette QA; NOT APPROVED.'
    : 'Original V7.1 rig/art fallback restored.');
}
async function accept(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.zip')||file.size>MAX_ARCHIVE)throw Error('Choose the Gym Bro candidate ZIP (maximum 64 MB)');
  if(!window.SF7_ART_STORE||!window.SF7_ART_STORE.manifest)throw Error('The game is not initialised yet');
  const objects=[];
  try{
    status('Reading local ZIP and verifying the 31-action manifest...');
    const zip=new LocalZip(await file.arrayBuffer());
    const [candidate,provenance,sceneProof,review]=await Promise.all([
      zip.json('art/manifest-v7-1-candidate.json'),
      zip.json('PROVENANCE.json'),zip.json('STORY_PROVENANCE.json'),
      zip.json('QA_REPORT.json')
    ]);
    if(review.fighter!=='gym-bro')throw Error('Invalid Gym Bro artwork QA metadata');
    // Older ZIPs without a current silhouette review fail closed: their frames are
    // checksum-valid but not eligible to replace the engine rig.
    const blockedActions=Array.isArray(review.blocked_actions)
      ? Array.from(new Set(review.blocked_actions))
      : Object.keys(REQUIRED);
    if(blockedActions.some(id=>!Object.prototype.hasOwnProperty.call(REQUIRED,id)))
      throw Error('Unrecognized blocked action in QA metadata');
    const spec=candidate['gym-bro'];
    if(!spec||provenance.fighter!=='gym-bro'||candidate.scenes!==true)
      throw Error('This ZIP is not a Gym Bro V7.1 candidate pack');
    const actions=Object.keys(spec.anims);
    if(actions.length!==31||Object.keys(REQUIRED).some(id=>spec.anims[id]?.frames!==REQUIRED[id]))
      throw Error('Required 31 actions and their exact frame counts do not match the canonical template');
    const images=new Map();
    let done=0;
    for(const [id,count] of Object.entries(REQUIRED)){
      const proof=provenance.actions[id];
      if(!Array.isArray(proof)||proof.length!==count)throw Error('Missing provenance: '+id);
      for(let n=1;n<=count;n++){
        const path='art/gym-bro/'+id+'/'+pad(n)+'.png';
        const bytes=await zip.bytes(path);
        images.set(path,await checkedImage(bytes,path,[512,512],proof[n-1].sha256_file,objects));
        done++;
      }
      status('Verified and decoded '+done+' / 120 individual gameplay frames...');
    }
    for(const id of SCENES){
      const name=id+'.png',path='art/scenes/'+name;
      const bytes=await zip.bytes(path);
      images.set('./'+path,await checkedImage(bytes,path,[1600,900],sceneProof[name]?.sha256,objects));
    }
    const portrait=await zip.bytes('art/gym-bro/portrait.png');
    images.set('art/gym-bro/portrait.png',await checkedImage(portrait,'portrait',[900,1200],null,objects));
    const hero=await zip.bytes('art/gym-bro/hero.png');
    const heroImg=await checkedImage(hero,'hero',null,null,objects);
    const store=window.SF7_ART_STORE;
    if(installed){
      setEnabled(false);
      for(const url of installed.objects)URL.revokeObjectURL(url);
    }
    installed={
      spec,images,objects,blockedActions,
      previousSpec:store.manifest['gym-bro'],previousScenes:store.manifest.scenes,
      previousImages:new Map(Array.from(images.keys(),k=>[k,store.imgs.get(k)]).filter(([,value])=>value))
    };
    $('artHero').src=heroImg.src;
    $('artHero').hidden=false;
    $('useCandidate').disabled=false;
    setEnabled(true);
    return 132;
  }catch(e){
    for(const url of objects)URL.revokeObjectURL(url);
    throw e;
  }
}
$('artPackFile').addEventListener('change',async()=>{
  const input=$('artPackFile');
  input.disabled=true;
  try{await accept(input.files?.[0])}
  catch(e){status(e.message,true)}
  finally{input.disabled=false;input.value=''}
});
$('useCandidate').addEventListener('change',()=>setEnabled($('useCandidate').checked));
window.addEventListener('beforeunload',()=>{if(installed)for(const url of installed.objects)URL.revokeObjectURL(url)});
status('Load the candidate ZIP to preview all 120 frames and ten scenes without uploading anything.');
