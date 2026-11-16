#!/usr/bin/env python3
"""Check actual six R12 Gym Bro high-kick (Quad Axe) PNGs.

Verifies exact source-derived SHA256, 512x512 RGBA, silhouette connectivity,
foot anchoring, clipping, chroma-key edges and costume colour landmarks.
Near-identical recovery poses are reported honestly as REVIEW, not concealed.
This script does not change damage/hitboxes or certify production art.
"""
import argparse
import hashlib
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FRAME_HASHES=(
    '0fc2a13d6fad5001ba2f586b69dee8809a456f3905dd79302e43c7295e8bed97',
    '2898e0a608dd96e6caa1ec33168c765070dd863a120bd361c8c5260dd36389cc',
    '94124e96fdedaa9be60a3889d40f66d498433e4976ff37cdc0468af0af4814d0',
    '5c5248f937c84edf075ca6074e915b84a20bf62e5c1d350dd69d483807ab88dd',
    '2a7a87552666a16e0c607634debb151b47e2d415ff983bfff2ba27427493db0a',
    '326135495a43c1b56d1b092773b60aaa2a668493b0efd5753e314f3da22bcf8d',
)

def dhash(img):
    base=Image.new('RGBA',(512,512),(20,30,45,255))
    base.alpha_composite(img)
    pix=list(base.convert('L').resize((9,8)).getdata())
    return sum(1 << (63-(y*8+x)) for y in range(8) for x in range(8)
               if pix[y*9+x]>pix[y*9+x+1])

def detached_fraction(img):
    a=list(img.getchannel('A').resize((128,128),Image.Resampling.NEAREST).getdata())
    seen=bytearray(len(a)); sizes=[]
    for i,v in enumerate(a):
        if v<=50 or seen[i]:continue
        seen[i]=1;todo=deque([i]);size=0
        while todo:
            p=todo.popleft();size+=1;x,y=p%128,p//128
            for yy in range(max(0,y-1),min(127,y+1)+1):
                for xx in range(max(0,x-1),min(127,x+1)+1):
                    j=yy*128+xx
                    if a[j]>50 and not seen[j]:
                        seen[j]=1;todo.append(j)
        sizes.append(size)
    return 1-max(sizes)/sum(sizes) if sizes else 1

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--directory',type=Path,default=ROOT/'art/gym-bro/hk')
    args=parser.parse_args()
    hashes=[]
    for n,sha in enumerate(FRAME_HASHES,1):
        path=args.directory/f'{n:02}.png'; data=path.read_bytes()
        assert hashlib.sha256(data).hexdigest()==sha,f'R12 binary mismatch: {path}'
        with Image.open(path) as im:
            im.load();assert im.size==(512,512) and im.mode=='RGBA',f'Bad RGBA: {path}'
            b=im.getchannel('A').getbbox()
            assert b and 60<=b[1]<=110 and b[3]==470 and b[0]>10 and b[2]<502,f'Clipped/misaligned sprite: {path} {b}'
            assert im.getchannel('A').getextrema()==(0,255),f'Alpha channel problem: {path}'
            detached=detached_fraction(im)
            assert detached<0.07,f'Detached body parts in {path}: {detached:.1%}'
            rgba=list(im.getdata())
            pink=sum(1 for r,g,b,a in rgba if a>180 and r>180 and b>165 and g<120 and r-g>75)
            assert pink<=100,f'Chroma-key contamination in {path}: {pink} pixels'
            # A source-derived, measurable costume signature; NOT automated facial identification.
            yellow=sum(1 for j,(r,g,b,a) in enumerate(rgba)
                       if a>150 and 130<=j//512<310 and r>170 and g>115 and b<140)
            darkshort=sum(1 for j,(r,g,b,a) in enumerate(rgba)
                       if a>150 and 230<=j//512<410 and r<110 and g<110 and b<120)
            shoes=sum(1 for j,(r,g,b,a) in enumerate(rgba)
                      if a>150 and j//512>365 and r>165 and g>160 and b>155)
            assert yellow>4000 and darkshort>2000 and shoes>800,f'Outfit signature changed in {path}: {yellow},{darkshort},{shoes}'
            hashes.append(dhash(im))
    near=[(i+1,j+1,(hashes[i]^hashes[j]).bit_count())
          for i in range(6) for j in range(i+1,6)
          if (hashes[i]^hashes[j]).bit_count()<=6]
    print('PASS Gym Bro R12 hk: 6/6 exact PNG hashes, alpha, feet, connected silhouettes, costume palettes and clean edges')
    print('REVIEW (not approval): similar-pose pairs',near)
    assert near==[(1,6,3),(2,5,4),(3,4,6)],f'Unexpected motion-similarity pattern: {near}'
    print('Release gate remains blocked on motion review, remaining actions and cinematic art.')

if __name__=='__main__':main()
