#!/usr/bin/env python3
"""Extract first-pass Gaz idle/walk RGBA frames from the approved V7 contact sheet.
Usage: python3 tools/export-v7-gaz-idle-walk.py <source.png> [output_dir]
Dependencies: pillow, numpy, opencv-python.
Not safe to publish directly: inspect per-frame clothing, edge quality and alignment first.
"""
import sys
from pathlib import Path
import cv2, numpy as np
from PIL import Image
if len(sys.argv)<2: sys.exit(__doc__)
source=Path(sys.argv[1])
out=Path(sys.argv[2]) if len(sys.argv)>2 else Path("art-review/gaz")
data=np.asarray(Image.open(source).convert("RGB"))
if data.shape[:2]!=(682,2048):
    sys.exit("Expected approved 2048x682 Gaz sheet; aborting rather than guessing positions")
rows={"idle":([143,243,345,446,549,648,747,849],4,137),
      "walk":([135,237,338,438,541,641,744,849],145,273)}
for action,(centers,y0,y1) in rows.items():
    dest=out/"art"/"bogan-tradie"/action
    dest.mkdir(parents=True,exist_ok=True)
    for idx,cx in enumerate(centers,1):
        part=data[y0:y1,cx-49:cx+49].copy()
        hsv=cv2.cvtColor(part,cv2.COLOR_RGB2HSV)
        sat=hsv[:,:,1].astype(np.int16)
        val=hsv[:,:,2].astype(np.int16)
        mask=(((val<214)|((sat>27)&(val<250))).astype(np.uint8)*255)
        mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
        n,lab,stats,cent=cv2.connectedComponentsWithStats(mask)
        keep=[j for j in range(1,n) if stats[j,cv2.CC_STAT_AREA]>=25]
        if not keep: sys.exit(f"Missing subject {action}/{idx:02}")
        main=max(keep,key=lambda j:stats[j,cv2.CC_STAT_AREA])
        mx,my=cent[main]
        keep=[j for j in keep if j==main or np.hypot(cent[j][0]-mx,cent[j][1]-my)<90]
        mask=np.isin(lab,keep).astype(np.uint8)*255
        alpha=cv2.GaussianBlur(mask,(3,3),.55)
        ys,xs=np.where(alpha>60)
        if len(xs)<100: sys.exit(f"Invalid mask {action}/{idx:02}")
        left,right=max(0,xs.min()-2),min(part.shape[1],xs.max()+3)
        top,bottom=max(0,ys.min()-2),min(part.shape[0],ys.max()+3)
        rgba=np.dstack((part,alpha))[top:bottom,left:right]
        im=Image.fromarray(rgba,"RGBA")
        width,height=[round(v*2.75) for v in im.size]
        if width>492 or height>440:
            k=min(492/width,440/height)
            width,height=round(width*k),round(height*k)
        im=im.resize((width,height),Image.Resampling.LANCZOS)
        canvas=Image.new("RGBA",(512,512))
        canvas.alpha_composite(im,(256-width//2,470-height))
        canvas.save(dest/f"{idx:02}.png",optimize=True)
print(f"Created 16 preliminary sprites in {out}; not production-approved.")
