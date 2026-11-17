#!/usr/bin/env python3
"""R8: conservative Gym Bro Deadlift Uppercut source-sheet extraction.
Preserves original story/move definitions. Records any incomplete source pose explicitly.
"""
from PIL import Image,ImageDraw,ImageFilter
import io,json,hashlib,zipfile,datetime,sys,argparse
from pathlib import Path
import numpy as np,cv2
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True,help='Unmodified 1536x1024 R8 uppercut source-sheet PNG')
parser.add_argument('--base-pack',type=Path,required=True,help='R7_QA candidate ZIP')
parser.add_argument('--out',type=Path,required=True,help='Output R8 candidate ZIP')
args=parser.parse_args()
SOURCE=args.source
INPUT=args.base_pack
OUTPUT=args.out
ROOT=OUTPUT.parent

SHEET=Image.open(SOURCE).convert('RGB')
assert SHEET.size==(1536,1024)

def clean_cell(ind):
    x=(ind%3)*512; y=(ind//3)*512
    crop=np.array(SHEET.crop((x+6,y+6,x+506,y+506)))
    # Chroma key magenta + anti-aliased spill. Smooth alpha for curved outline.
    f=crop.astype('float32')
    r,g,b=f[:,:,0],f[:,:,1],f[:,:,2]
    # The bg is near #ff00ff with chromatic compression at edges.
    is_pink=(r>140)&(b>140)&(g<185)&(r>b*.70)&(b>r*.65)
    # Include magenta border contamination by saturation, preserve skin/shirt/shorts.
    pink_strength=np.clip((np.minimum(r,b)-g-48)/90,0,1)
    alpha=(255*(1-pink_strength)).astype('uint8')
    alpha[is_pink & (pink_strength>.85)]=0
    # Background removal alone can leave white grid residue. Border remains excluded.
    mask=(alpha>36).astype(np.uint8)
    count,labels,stats,centroids=cv2.connectedComponentsWithStats(mask,8)
    good=np.zeros(mask.shape,np.uint8)
    sizes=sorted(range(1,count),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)
    if sizes:
        # Keep primary body and connected clothing; reject stray large islands.
        good[labels==sizes[0]]=255
    else: raise Exception('No foreground in frame '+str(ind))
    # If an isolated legitimate fist or shoe belongs to the pose, that pose must be
    # reviewed separately, not silently kept as a disconnected animation.
    alpha=cv2.bitwise_and(alpha,good)
    alpha=cv2.GaussianBlur(alpha,(3,3),.55)
    alpha[alpha<18]=0
    # Decontaminate magenta from edge colours where transparency is partial.
    aa=alpha.astype('float32')/255
    dst=f.copy()
    for ch,bg in [(0,255),(1,0),(2,255)]:
        dst[:,:,ch]=np.clip((f[:,:,ch]-(1-aa)*bg)/np.maximum(aa,0.01),0,255)
    rgba=np.dstack([dst.astype('uint8'),alpha])
    original=Image.fromarray(rgba,'RGBA')
    bounds=original.getchannel('A').getbbox()
    if not bounds: raise Exception('empty frame')
    # Keep actual motion silhouettes and consistent centered ground alignment.
    im=original.crop(bounds)
    w,h=im.size
    scale=min(395/max(1,h),410/max(1,w),1.40)
    im=im.resize((int(round(w*scale)),int(round(h*scale))),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(512,512),(0,0,0,0))
    out.alpha_composite(im,(256-im.width//2,470-im.height))
    return out,bounds

def sha(x):return hashlib.sha256(x).hexdigest()

with zipfile.ZipFile(INPUT) as src:
    data={x:src.read(x) for x in src.namelist()}
report=json.loads(data['QA_REPORT.json'])
provenance=json.loads(data['PROVENANCE.json'])
changes=[]
review=[]
for ind in range(6):
    action='launcher'; n=ind+1
    path=f'art/gym-bro/{action}/{n:02d}.png'
    before_sha=sha(data[path])
    im,bounds=clean_cell(ind)
    if ind==3:
        # Source panel 04 clipped the raised fist. Complete it from Tyler's own
        # right fist in source panel 03, not a duplicate fighter/placeholder.
        fist=np.array(SHEET.crop((1024+373,77,1024+424,148))).astype('float32')
        rr,gg,bb=fist[:,:,0],fist[:,:,1],fist[:,:,2]
        pink=np.clip((np.minimum(rr,bb)-gg-42)/85,0,1)
        aa=(255*(1-pink)).astype('uint8');aa[aa<20]=0
        patch=Image.fromarray(np.dstack([fist.astype('uint8'),aa]),'RGBA')
        patch=patch.crop(patch.getchannel('A').getbbox())
        patch=patch.resize((34,48),Image.Resampling.LANCZOS)
        # The already aligned R8 torso has its forearm endpoint at ~[330,75].
        # Overlay wrist-to-wrist with a small margin; feet/scale stay unchanged.
        im.alpha_composite(patch,(312,29))
        bounds=(bounds[0],-25,bounds[2],bounds[3])
    fg=np.array(im.getchannel('A'))
    alpha_bbox=im.getchannel('A').getbbox()
    # If a keypose is clipped in the *original source*, this cannot be fixed by padding.
    source_clipped=(ind==3)
    output=io.BytesIO();im.save(output,'PNG',optimize=True)
    png=output.getvalue();data[path]=png
    item=provenance['actions'][action][ind]
    item['sha256_file']=sha(png)
    item['source_revision']='R8 dedicated uppercut sheet (source image preserved)'
    item['source_panel_index']=ind+1
    item['source_boundary_clipping_review']=source_clipped
    # Existing metadata schema varies between revisions; rewrite only known keys.
    if 'source' in item:item['source']=SOURCE.name
    frame_record=report['animations'][action][ind]
    frame_record.update({'name':path,'bytes':len(png),'sha256':sha(png),'alpha_bbox':list(alpha_bbox)})
    changes.append({'path':path,'sha256_before':before_sha,'sha256_after':sha(png),'source_bbox':bounds,
                    'runtime_bbox':alpha_bbox,'source_clipped_fist_requires_replacement':source_clipped})
    if ind==3:review.append({'severity':'manual-review','action':'launcher','frame':'04.png','issue':'Uppercut apex raised fist reconstructed from same character source 03. Inspect elbow/wrist seam before approval.'})
report['revision']='R8 - dedicated uppercut six keyposes, apex repaired with consistent identity hand graft'
report['production_status']='NOT APPROVED: R8 candidate. Other damaged actions and scene quality still unresolved.'
report['replacements']=report.get('replacements',[])+changes
report['issues']=[x for x in report['issues'] if not(x.get('action')=='launcher' and x.get('frame') in ('05.png','06.png'))]+review
report['manual_review_items']=len(report['issues'])
report['silhouette_review']['review_items']=[x for x in report['silhouette_review']['review_items'] if x['file'] not in ('art/gym-bro/launcher/05.png','art/gym-bro/launcher/06.png')]
# The entire launcher action stays blocked until the clipped frame 04 is replaced.
report['blocked_actions']=list(report.get('blocked_actions') or report['silhouette_review']['actions_held_back'])
report['qa_note_r8']='Six high-detail keyposes generated, including a same-identity fist reconstruction on uppercut apex 04. Entire launcher group remains held back until manual motion/edge review.'
provenance['revision']='R8: 6 fresh uppercut poses, apex repaired from original fist source, active manifest unchanged'
data['PROVENANCE.json']=json.dumps(provenance,indent=2).encode()
data['QA_REPORT.json']=json.dumps(report,indent=2).encode()
with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,blob in data.items():z.writestr(name,blob)
print('R8',OUTPUT.stat().st_size,sha(OUTPUT.read_bytes()),'entries',len(data),'findings',report['manual_review_items'])
for c in changes:print(c)
# Review board transparent-on-dark; no labels embedded in runtime frames.
board=Image.new('RGB',(6*220,250),'#202a39');draw=ImageDraw.Draw(board)
for i in range(6):
 with Image.open(io.BytesIO(data[f'art/gym-bro/launcher/{i+1:02d}.png'])) as im:
  im.thumbnail((212,212));back=Image.new('RGBA',im.size,(30,42,60,255));back.alpha_composite(im)
  board.paste(back.convert('RGB'),(i*220,0))
 draw.text((i*220+10,221),f'launcher/{i+1:02d}'+(' *' if i==3 else ''),fill='white')
board.save(ROOT/'GymBro_V7.1_R8_Launcher_Review.jpg',quality=92)
(ROOT/'GymBro_V7.1_R8_Change_Report.json').write_text(json.dumps({'changes':changes,'qa_status':report['production_status'],'remaining':report['issues']},indent=2))