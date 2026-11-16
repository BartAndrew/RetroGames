#!/usr/bin/env python3
"""Verify actual Git-committed four R11 Gym Bro intro sprite frames.

This certifies only file structure, hash provenance and basic pose separation.
It does not certify temporal motion smoothness, narrative suitability or other
fighters. Run from StereoTypeFighter: python tools/check-gym-bro-intro-r11.py
"""
import hashlib
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
HASHES=(
    "cc0678b6710194bf1303eb8a0c56759ceb055a1f4ea915006b0548f54debf3ed",
    "ff4e0f7721cd3a5ad7685b64d8906ce55f83aa5bdd75ace7223b002685365128",
    "44432c08db4f938ed702ac68d4ba5c4ec012cdd03c03cb233b20a3ae828c071b",
    "21e0b558371210105a0a809ebc03688d70acaf09bdd820ee13482a236b8d1fb8",
)
def connected_fraction(image):
    data=list(image.getchannel('A').resize((128,128),Image.Resampling.NEAREST).getdata())
    seen=bytearray(len(data));parts=[]
    for idx,value in enumerate(data):
        if value<=50 or seen[idx]:continue
        seen[idx]=1
        todo=deque([idx]);count=0
        while todo:
            p=todo.popleft();count+=1;x,y=p%128,p//128
            for yy in range(max(0,y-1),min(127,y+1)+1):
                for xx in range(max(0,x-1),min(127,x+1)+1):
                    j=yy*128+xx
                    if data[j]>50 and not seen[j]:
                        seen[j]=1;todo.append(j)
        parts.append(count)
    return 1-max(parts)/sum(parts) if parts else 1
def dhash(img):
    b=Image.new('RGBA',img.size,(20,30,45,255))
    b.alpha_composite(img)
    pix=list(b.convert('L').resize((9,8)).getdata())
    return sum(1 << (63-(y*8+x)) for y in range(8) for x in range(8) if pix[y*9+x]>pix[y*9+x+1])
def main():
    hashes=[]
    for n,digest in enumerate(HASHES,1):
        p=ROOT/'art'/'gym-bro'/'intro'/f'{n:02}.png'
        data=p.read_bytes()
        assert hashlib.sha256(data).hexdigest()==digest, f'SHA-256 mismatch: {p}'
        with Image.open(p) as img:
            img.load()
            assert img.size==(512,512) and img.mode=='RGBA',f'Invalid RGBA geometry: {p}'
            box=img.getchannel('A').getbbox()
            assert box and box[1]>50 and box[3]==470 and box[0]>25 and box[2]<490,f'Canvas margins: {p}: {box}'
            assert img.getchannel('A').getextrema()[0]==0,'Opaque PNG is not a sprite'
            detached=connected_fraction(img)
            assert detached<.07,f'Large detached fragments ({detached:.1%}): {p}'
            pixels=list(img.getdata())
            mag=sum(1 for red,green,blue,alpha in pixels if alpha>180 and red>185 and blue>175 and green<105)
            assert mag<200,f'Excessive magenta contamination ({mag}): {p}'
            hashes.append(dhash(img))
    distances=[(hashes[i]^hashes[j]).bit_count() for i in range(4) for j in range(i+1,4)]
    assert min(distances)>5,f'Potential duplicate intro keypose: dHash minimum {min(distances)}'
    print(f'PASS Gym Bro R11 intro: 4/4 PNGs, verified hashes, alpha edges, one silhouette, foot anchor and distinct poses; min dHash={min(distances)}')
if __name__=='__main__':main()
