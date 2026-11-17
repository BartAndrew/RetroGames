#!/usr/bin/env python3
"""R9 Gym Bro airborne punch: verify committed PNGs, report pose similarity.

This gates technical integrity only. A passing check is not an artistic or
production sign-off. Combat frame timing and hitboxes live in combat-v7.js.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import argparse, hashlib, json, sys

EXPECTED = [
    'c526575b2bacb7dce3d0bd7c910975be5efdbd9c65d2ab49c8d2a39973eeeaf6',
    '6054ca640d70c361e749cb30c1ed8a52acaefeb02f45685585134b9ba78fef06',
    '2cce3a719dc305a27c5e64287d73daf9d0f7938ff833ec88f9dd934e15ad4502',
    'db9f21870b1eccd8a57637f8403ab40fd3d5c9f4d0a316d511e855cf85a8d1c5',
]

def foreground_components(pixels):
    mask = bytearray(1 if a > 50 else 0 for a in pixels)
    done = bytearray(len(mask))
    areas = []
    for idx in range(len(mask)):
        if not mask[idx] or done[idx]: continue
        done[idx] = 1
        queue = deque([idx])
        size = 0
        while queue:
            p = queue.popleft(); size += 1
            x, y = p % 128, p // 128
            for yy in range(max(0,y-1),min(127,y+1)+1):
                for xx in range(max(0,x-1),min(127,x+1)+1):
                    dst = yy*128 + xx
                    if mask[dst] and not done[dst]:
                        done[dst] = 1; queue.append(dst)
        areas.append(size)
    return sorted(areas, reverse=True)

def phash(img):
    import math
    # Tiny robust 8x8 difference hash (advisory, not a motion proof).
    backdrop = Image.new('RGBA',img.size,(24,32,46,255))
    backdrop.alpha_composite(img)
    grey = backdrop.convert('L').resize((9,8)).tobytes()
    bits = 0
    for y in range(8):
        for x in range(8):
            bits = (bits << 1) | int(grey[y*9+x] > grey[y*9+x+1])
    return bits

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    cli.add_argument('--json',type=Path)
    args=cli.parse_args()
    root=args.root
    warnings=[];errors=[];frames=[];hashes=[]
    for n,required in enumerate(EXPECTED,1):
        path=root/'art'/'gym-bro'/'airP'/f'{n:02d}.png'
        if not path.is_file():errors.append(f'Missing {path}');continue
        payload=path.read_bytes();sha=hashlib.sha256(payload).hexdigest()
        if sha!=required:errors.append(f'Unexpected SHA-256 in airP/{n:02d}')
        with Image.open(path) as img:
            img.load()
            if img.mode!='RGBA' or img.size!=(512,512):
                errors.append(f'airP/{n:02d} is not RGBA 512x512');continue
            bbox=img.getchannel('A').getbbox()
            if not bbox:errors.append(f'airP/{n:02d} empty alpha');continue
            if bbox[0]<10 or bbox[1]<10 or bbox[2]>502 or bbox[3]>475:
                errors.append(f'airP/{n:02d} possible sprite clipping at {bbox}')
            if not 460<=bbox[3]<=475:
                errors.append(f'airP/{n:02d} inconsistent lower anchor {bbox[3]}')
            a=img.getchannel('A').resize((128,128),Image.Resampling.NEAREST).tobytes()
            components=foreground_components(a)
            detached=sum(components[1:])/max(1,sum(components))
            if detached>.07:errors.append(f'airP/{n:02d} detached foreground {detached:.1%}')
            data=img.tobytes()
            visible=sum(1 for p in range(0,len(data),4) if data[p+3]>100)
            pink=sum(1 for p in range(0,len(data),4) if data[p+3]>100 and data[p]>180 and data[p+2]>180 and data[p+1]<110)
            if pink/max(1,visible)>.005:errors.append(f'airP/{n:02d} magenta contamination')
            hashes.append(phash(img))
            frames.append({'name':f'airP/{n:02d}.png','bytes':len(payload),'sha256':sha,
                           'alpha_bbox':list(bbox),'detached_fraction':round(detached,4)})
    for i in range(len(hashes)):
        for j in range(i+1,len(hashes)):
            d=(hashes[i]^hashes[j]).bit_count()
            if d<=8:warnings.append(f'airP/{i+1:02d} and airP/{j+1:02d} have similar outlines (dHash distance {d})')
    report={'fighter':'gym-bro','action':'airP','source':'R9 individual high-resolution keyposes',
            'frames_checked':len(frames),'hard_errors':errors,'manual_review_warnings':warnings,
            'frames':frames,'release_approved':False}
    if args.json:
        args.json.parent.mkdir(parents=True,exist_ok=True)
        args.json.write_text(json.dumps(report,indent=2)+'\n')
    print(f'Gym Bro R9 airP: {len(frames)}/4 PNGs, {len(errors)} hard findings, {len(warnings)} motion warnings')
    for item in errors:print('FAIL',item)
    for item in warnings:print('REVIEW',item)
    if errors:sys.exit(1)

if __name__=='__main__':main()