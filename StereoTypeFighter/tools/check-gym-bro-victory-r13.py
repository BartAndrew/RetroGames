#!/usr/bin/env python3
"""Validate Git-committed R13 Gym Bro victory sprite PNGs.

This verifies image integrity and strong pose distinction, not human artwork
approval, cinematic continuity or a production-ready game.
"""
import hashlib
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SHA256=(
"7ea2843a7d33dd24ee1a82cc0ed3fa5f3161e99e3dc8acbd1c86808edf6ba622",
"e7b13790f2ff2d64334d0a30cf4cbf7bac01ebef9c844126571fa2c99c092bab",
"546c3abed5e4b7116c4f7fb73576a569696d047cddf602ef9ca95b3a926f74b5",
"e262b96209b9d8696d29a48e3f813037a0c1a0ced7ff58b843fb3ecd2ef2fbaa",
)
def d_hash(img):
    bg=Image.new("RGBA",img.size,(20,30,45,255))
    bg.alpha_composite(img)
    p=list(bg.convert("L").resize((9,8)).getdata())
    return sum(1<<(63-(y*8+x)) for y in range(8) for x in range(8) if p[y*9+x]>p[y*9+x+1])
def detached_frac(img):
    pixels=list(img.getchannel("A").resize((128,128),Image.Resampling.NEAREST).getdata())
    seen=bytearray(128*128);areas=[]
    for start,alpha in enumerate(pixels):
        if alpha<=50 or seen[start]:continue
        seen[start]=1;pending=deque([start]);area=0
        while pending:
            i=pending.popleft();area+=1;x=i%128;y=i//128
            for yy in range(max(0,y-1),min(127,y+1)+1):
                for xx in range(max(0,x-1),min(127,x+1)+1):
                    j=yy*128+xx
                    if pixels[j]>50 and not seen[j]:
                        seen[j]=1;pending.append(j)
        areas.append(area)
    return 1-max(areas)/sum(areas) if areas else 1.0
def main():
    hashes=[]
    for index,sha in enumerate(SHA256,1):
        path=ROOT/"art"/"gym-bro"/"victory"/f"{index:02}.png"
        data=path.read_bytes()
        assert hashlib.sha256(data).hexdigest()==sha,f"Unexpected asset bytes: {path}"
        with Image.open(path) as png:
            png.load()
            assert png.size==(512,512) and png.mode=="RGBA",f"Bad PNG dimensions/alpha: {path}"
            alpha=png.getchannel("A")
            box=alpha.getbbox()
            assert box and box[0]>24 and box[1]>20 and box[2]<490 and box[3]==470,f"Clipped/unanchored: {path}: {box}"
            assert alpha.getextrema()[0]==0,f"Opaque background: {path}"
            assert detached_frac(png)<0.07,f"Disconnected figure: {path}"
            pixels=list(png.getdata())
            magenta=sum(1 for r,g,b,a in pixels if a>180 and r>185 and b>170 and g<100)
            assert magenta<20,f"Magenta key spill: {path} ({magenta} px)"
            hashes.append(d_hash(png))
    distances=[(hashes[i]^hashes[j]).bit_count() for i in range(4) for j in range(i+1,4)]
    assert len(set(hashes))==4 and min(distances)>=6,f"Repeated victory pose, dHash min {min(distances)}"
    print(f"PASS Gym Bro R13 victory: 4/4 SHA-verified PNGs, RGBA, grounded, connected, clean edges; dHash min {min(distances)}; human approval pending")
if __name__=="__main__":
    main()
