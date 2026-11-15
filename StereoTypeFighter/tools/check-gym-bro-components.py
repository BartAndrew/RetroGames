#!/usr/bin/env python3
"""Flag disconnected large foreground regions in Gym Bro candidate PNG ZIPs.

This is an advisory visual-inspection gate: disconnected limbs, stray cropped
figures and VFX baked into sprite frames are all grounds for artist review.
Usage:
  python tools/check-gym-bro-components.py candidate.zip --report report.json
  python tools/check-gym-bro-components.py candidate.zip --strict
"""
import argparse
import io
import json
import zipfile
from collections import deque
from pathlib import Path
from PIL import Image

def analyze(raw):
    with Image.open(io.BytesIO(raw)) as im:
        if im.size != (512,512) or im.mode != 'RGBA':
            return {'error':'expected 512x512 RGBA'}
        mask=bytearray(int(x)>50 for x in im.getchannel('A').resize((128,128),Image.Resampling.NEAREST).getdata())
    visited=bytearray(len(mask))
    components=[]
    for index in range(len(mask)):
        if not mask[index] or visited[index]:
            continue
        visited[index]=1
        queue=deque([index])
        size=0
        while queue:
            pos=queue.popleft()
            size+=1
            x,y=pos%128,pos//128
            for ny in range(max(0,y-1),min(127,y+1)+1):
                for nx in range(max(0,x-1),min(127,x+1)+1):
                    dst=ny*128+nx
                    if mask[dst] and not visited[dst]:
                        visited[dst]=1
                        queue.append(dst)
        components.append(size)
    components.sort(reverse=True)
    total=sum(components)
    detached=round((total-components[0])/total,3) if total else 1.
    return {'components':len(components),'detached_fraction':detached,
            'other_large_components':[n for n in components[1:] if n>=30]}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('archive',type=Path)
    p.add_argument('--report',type=Path)
    p.add_argument('--strict',action='store_true')
    args=p.parse_args()
    findings=[]
    inspected=0
    with zipfile.ZipFile(args.archive) as z:
        for name in sorted(z.namelist()):
            if not (name.startswith('art/gym-bro/') and name.endswith('.png') and len(name.split('/'))==4):
                continue
            inspected+=1
            item=analyze(z.read(name))
            if item.get('error') or (item['detached_fraction']>0.07 and item['other_large_components']):
                findings.append({'path':name,**item})
    report={'fighter':'gym-bro','archive':args.archive.name,
            'frames_inspected':inspected,'potentially_fragmented_frames':len(findings),
            'threshold':'detached fraction >7%, secondary component >=30 px at 128x128',
            'findings':findings,
            'disclaimer':'This only flags likely defects. False positives from separately rendered VFX require manual review; absence of flags does not imply character approval.'}
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('Gym Bro silhouette QA:',inspected,'frames;',len(findings),'need review')
    for item in findings:
        print(item['path'],item.get('detached_fraction'),item.get('other_large_components'))
    if args.strict and (inspected!=120 or findings):
        raise SystemExit('FAIL: fragmented or incomplete Gym Bro sprite artwork')

if __name__=='__main__':
    main()
