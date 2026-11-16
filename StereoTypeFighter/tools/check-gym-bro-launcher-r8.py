#!/usr/bin/env python3
"""Verify six real, binary-committed Gym Bro Deadlift Uppercut frames.

Do not confuse this technical check with final artistic approval or a full-match test.
Usage: python tools/check-gym-bro-launcher-r8.py
"""
from __future__ import annotations
import hashlib,json,sys
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1] if 'tools' in Path(__file__).parts else Path.cwd()
ART=ROOT/'art/gym-bro/launcher'
findings=[]
rows=[]
seen={}

def component_sizes(mask,size=128):
    visited=bytearray(len(mask));all_sizes=[]
    for p in range(len(mask)):
        if not mask[p] or visited[p]: continue
        visited[p]=1;q=deque([p]);area=0
        while q:
            z=q.popleft();area+=1;x,y=z%size,z//size
            for ny in range(max(0,y-1),min(size-1,y+1)+1):
                for nx in range(max(0,x-1),min(size-1,x+1)+1):
                    dst=ny*size+nx
                    if mask[dst] and not visited[dst]:visited[dst]=1;q.append(dst)
        all_sizes.append(area)
    return sorted(all_sizes,reverse=True)

for n in range(1,7):
    filename=f'{n:02d}.png';path=ART/filename
    if not path.is_file():findings.append(f'missing: {path}');continue
    data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
    with Image.open(path) as img:
        img.load()
        if img.format!='PNG' or img.mode!='RGBA' or img.size!=(512,512):
            findings.append(f'{filename}: expected 512x512 RGBA PNG');continue
        alpha=img.getchannel('A');bbox=alpha.getbbox()
        if not bbox or alpha.getextrema()!=(0,255):findings.append(f'{filename}: invalid alpha');continue
        if bbox[0]<10 or bbox[1]<10 or bbox[2]>502 or bbox[3]>475:
            findings.append(f'{filename}: possible boundary clip {bbox}')
        if not 465<=bbox[3]<=471:findings.append(f'{filename}: grounded-foot drift y={bbox[3]}')
        pixels=img.load();contaminated=0;visible=0
        for yy in range(bbox[1],bbox[3]):
            for xx in range(bbox[0],bbox[2]):
                r,g,b,a=pixels[xx,yy]
                if a>100:
                    visible+=1
                    if r>180 and b>180 and g<120: contaminated+=1
        magenta=contaminated/max(visible,1)
        if magenta>.005:findings.append(f'{filename}: magenta halo {magenta:.3%}')
        small=alpha.resize((128,128),Image.Resampling.NEAREST)
        size=component_sizes(bytearray(1 if v>50 else 0 for v in small.getdata()))
        other=sum(size[1:]) / sum(size) if size else 1.
        if other>.07:findings.append(f'{filename}: detached foreground {other:.2%}')
        if sha in seen:findings.append(f'{filename}: byte duplicate of {seen[sha]}')
        seen[sha]=filename
        rows.append({'frame':n,'file':str(path.relative_to(ROOT)),'sha256':sha,
                     'bbox':list(bbox),'detached_fraction':round(other,4),
                     'magenta_fraction':round(magenta,5),'bytes':len(data)})

if len(rows)!=6:findings.append('six frames required')
report={'fighter':'gym-bro','action':'launcher','source_revision':'R8',
        'frames_checked':len(rows),'technical_findings':findings,
        'warning':'Passing these checks does not approve combat motion, transitions, identity or release.',
        'frames':rows}
out=ART/'R8_TECHNICAL_QA.json'
out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f'Gym Bro launcher R8: {len(rows)}/6 real frames, {len(findings)} technical findings')
for x in findings:print('FAIL',x)
sys.exit(1 if findings else 0)