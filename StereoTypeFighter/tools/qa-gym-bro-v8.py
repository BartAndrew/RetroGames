#!/usr/bin/env python3
"""Preflight Gym Bro V8 art archived in GitHub before production activation.
Produces small review JPGs plus report; never updates the live art manifest.
Run from repository root: python3 StereoTypeFighter/tools/qa-gym-bro-v8.py
Requires Pillow.
"""
from __future__ import annotations
import hashlib, json
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
SOURCES=ROOT/'source-art/gym-bro-v7-1/branch-candidates'
OUTPUT=ROOT/'source-art/gym-bro-v7-1/qa-v8'
ACTIONS={'airP':4,'airK':4,'hk':6,'launcher':6,'intro':4,'victory':4}
OUTPUT.mkdir(parents=True,exist_ok=True)

def check_frame(path):
    data=path.read_bytes()
    with Image.open(path) as im:
        im.load()
        if im.size != (512,512) or im.mode != 'RGBA':
            raise ValueError(f'not a 512x512 RGBA image: {path}')
        alpha=im.getchannel('A')
        bounds=alpha.getbbox()
        if not bounds or bounds[3]<450 or bounds[2]>511 or bounds[0]<1:
            raise ValueError(f'clipped/misaligned: {path} {bounds}')
        if alpha.getextrema()!=(0,255):
            raise ValueError(f'alpha is not transparent and opaque: {path}')
        raw=im.resize((128,128), Image.Resampling.NEAREST).getchannel('A')
        pixels=raw.tobytes()
        seen=bytearray(len(pixels)); sizes=[]
        for i,a in enumerate(pixels):
            if a<64 or seen[i]:continue
            todo=deque([i]);seen[i]=1;size=0
            while todo:
                p=todo.popleft();size+=1
                y,x=divmod(p,128)
                for j in (p-128,p+128,p-1,p+1):
                    if j<0 or j>=len(pixels):continue
                    ny,nx=divmod(j,128)
                    if abs(nx-x)+abs(ny-y)!=1 or pixels[j]<64 or seen[j]:continue
                    seen[j]=1;todo.append(j)
            sizes.append(size)
        loss=1-max(sizes)/sum(sizes) if sizes else 1
        if loss>0.075:raise ValueError(f'detached fragments: {path} {loss:.1%}')
        rgba=im.copy()
    return dict(path=str(path.relative_to(ROOT)),sha256=hashlib.sha256(data).hexdigest(),
                size=[512,512],mode='RGBA',bbox=list(bounds),
                detached_fraction=round(loss,5),bytes=len(data),frame=rgba)

def montage(frames,name,cols=4):
    tw,th=230,248
    rows=(len(frames)+cols-1)//cols
    out=Image.new('RGB',(cols*tw,rows*th),(12,15,25))
    draw=ImageDraw.Draw(out)
    for i,entry in enumerate(frames):
        cell=entry['frame'].copy()
        cell.thumbnail((tw-22,th-30), Image.Resampling.LANCZOS)
        x=(i%cols)*tw+(tw-cell.width)//2
        y=(i//cols)*th+(th-30-cell.height)//2
        out.paste(cell,(x,y),cell)
        draw.text(((i%cols)*tw+12,(i//cols)*th+th-20),
                  f"{entry['action']} {entry['index']:02d}",fill=(235,240,250))
    out.save(OUTPUT/(name+'.jpg'),'JPEG',quality=77,optimize=True)

report={'fighter':'gym-bro','version':'8.0','approved_by_automation':False,
        'source':'source-art/gym-bro-v7-1/branch-candidates',
        'actions':{},'image_checks':[],'review_images':[]}
all_frames=[]
for action,n in ACTIONS.items():
    files=[];sha_seen=set()
    for i in range(1,n+1):
        path=SOURCES/'gym-bro'/action/f'{i:02d}.png'
        entry=check_frame(path)
        if entry['sha256'] in sha_seen:raise ValueError(f'byte-identical frames in {action}')
        sha_seen.add(entry['sha256'])
        entry['action']=action;entry['index']=i
        files.append(entry)
        all_frames.append(entry)
    montage(files,'preview-'+action,cols=min(4,len(files)))
    report['actions'][action]={'frames':n,'technical_validation':'passed',
      'manual_motion_review':'pending','paths':[v['path'] for v in files]}
    report['image_checks']+= [{k:v for k,v in f.items() if k!='frame'} for f in files]
montage(all_frames,'preview-all-actions',cols=7)

for label,name in [('portrait','gym-bro/portrait.png'),('prologue','scenes/prologue-gym-bro.png')]:
    path=SOURCES/name
    with Image.open(path) as im:
        im.load()
        w,h=im.size
        small=im.convert('RGB')
        small.thumbnail((950,850), Image.Resampling.LANCZOS)
        preview=f'preview-{label}.jpg'
        small.save(OUTPUT/preview,'JPEG',quality=76,optimize=True)
        report['review_images'].append({'kind':label,'path':str(path.relative_to(ROOT)),
          'preview':str((OUTPUT/preview).relative_to(ROOT)), 'dimensions':[w,h],
          'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
          'visual_identity_review':'pending'})
(OUTPUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: checked',len(report['image_checks']),'transparent sprite PNGs across',len(ACTIONS),'complete actions')
print('Generated candidate contact sheets, portrait and prologue review thumbnails (NOT production approval)')
