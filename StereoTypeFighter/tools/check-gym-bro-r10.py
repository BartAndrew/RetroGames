#!/usr/bin/env python3
"""Technical validation of actual Git-committed R10 Gym Bro airK and jumpDown.

Run from StereoTypeFighter directory:
  python tools/check-gym-bro-r10.py --json r10-qa-run.json
This does NOT approve story art, character identity or 60 Hz motion quality.
"""
import argparse
import hashlib
import json
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'art/gym-bro/R10_TECHNICAL_QA.json'
EXPECTED = {'airK': 4, 'jumpDown': 2}


def components(image):
    arr = list(image.getchannel('A').resize((128, 128), Image.Resampling.NEAREST).getdata())
    visited = bytearray(len(arr))
    areas=[]
    for idx, val in enumerate(arr):
        if val <= 50 or visited[idx]: continue
        queue=deque([idx]);visited[idx]=1;size=0
        while queue:
            pos=queue.popleft();size+=1;x,y=pos%128,pos//128
            for ny in range(max(0,y-1),min(127,y+1)+1):
                for nx in range(max(0,x-1),min(127,x+1)+1):
                    nbr=ny*128+nx
                    if arr[nbr]>50 and not visited[nbr]:visited[nbr]=1;queue.append(nbr)
        areas.append(size)
    areas.sort(reverse=True)
    total=sum(areas)
    return {'detached_fraction': (total-areas[0])/total if total else 1,
            'large_extra_components': [size for size in areas[1:] if size>=30]}


def fingerprint(image):
    bg=Image.new('RGBA',image.size,(30,36,48,255));bg.alpha_composite(image)
    p=list(bg.convert('L').resize((9,8)).getdata())
    return sum(1<<(63-(y*8+x)) for y in range(8) for x in range(8)
               if p[y*9+x+1]>p[y*9+x])


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--json',type=Path)
    args=parser.parse_args()
    proof=json.loads(QA.read_text())
    assert proof['fighter']=='gym-bro' and proof['revision']=='R10'
    errors=[]; warnings=[]; count=0
    for name, required in EXPECTED.items():
        records=sorted((r for r in proof['frames'] if r['action']==name),key=lambda r:r['frame'])
        if len(records)!=required:errors.append(f'{name}: missing provenance entries')
        history=[]
        for i in range(1,required+1):
            path=ROOT/'art/gym-bro'/name/f'{i:02d}.png'
            if not path.is_file():errors.append('missing '+str(path));continue
            data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
            rec=next((r for r in records if r['frame']==i),{})
            if sha!=rec.get('sha256_file'):errors.append(f'hash mismatch {path}')
            with Image.open(path) as img:
                img.load()
                if img.size!=(512,512) or img.mode!='RGBA':errors.append(f'wrong geometry {path}')
                bbox=img.getchannel('A').getbbox()
                if not bbox:errors.append(f'blank frame {path}');continue
                if bbox[0]<=1 or bbox[1]<=1 or bbox[2]>=511 or bbox[3]>=511:errors.append(f'clipped {path}: {bbox}')
                if abs(bbox[3]-470)>2:errors.append(f'foot anchor {path}: {bbox[3]}')
                frag=components(img)
                if frag['large_extra_components'] and frag['detached_fraction']>0.07:errors.append(f'large detached region {path}: {frag}')
                magenta=0
                for r,g,b,a in img.getdata():
                    if a>220 and r>160 and b>150 and g<90:magenta+=1
                if magenta>50:errors.append(f'opaque magenta contamination {path}: {magenta}')
                f=fingerprint(img)
                for oldpath, oldhash in history:
                    dist=(f^oldhash).bit_count()
                    if dist<=5:warnings.append(f'potential similar poses: {oldpath} & {path} dHash={dist}')
                history.append((str(path),f))
            count+=1
    report={'fighter':'gym-bro','revision':'R10','frames_inspected':count,'expected_frames':6,
            'hard_errors':errors,'motion_review_warnings':warnings,
            'note':'Technical pass does not certify appearance, unique motion timing, or gameplay release.'}
    print('Gym Bro R10: %s/6 committed PNGs checked; %s hard errors; %s motion warnings' % (count,len(errors),len(warnings)))
    if args.json:args.json.parent.mkdir(parents=True,exist_ok=True);args.json.write_text(json.dumps(report,indent=2)+'\n')
    if errors:raise SystemExit(1)

if __name__=='__main__': main()