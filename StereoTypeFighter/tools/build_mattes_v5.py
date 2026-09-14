"""Regenerate two textured-sheet masks from exported source rectangles.
Usage: python tools/build_mattes_v5.py /path/to/qa/frames
Requires numpy, Pillow, opencv-python. Masks affect alpha only, not source RGB.
"""
from pathlib import Path
import base64,gzip,json,sys
import cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
rectdir=Path(sys.argv[1]);cv2.setRNGSeed(11);result={}
for ident,name in [('rapthug','RapThug.png'),('grunge','Grunge.png')]:
 image=np.array(Image.open(ROOT/name).convert('RGB'));groups={}
 for seq,boxes in json.loads((rectdir/(ident+'-rects.json')).read_text()).items():
  frames=[]
  for x,y,w,h in boxes:
   crop=image[y:y+h,x:x+w].copy();r,g,b=[crop[:,:,i].astype(float) for i in range(3)]
   mask=np.full((h,w),cv2.GC_PR_FGD,np.uint8);mask[:2]=0;mask[-2:]=0;mask[:,:2]=0;mask[:,-2:]=0
   gold=(r>105)&(r>g*1.1)&(r>b*1.5);blue=(b>38)&(b>r*1.12)&(g>r*.9)
   mask[gold|blue]=cv2.GC_FGD
   if seq not in ['fall','getup']:
    mask[int(h*.3):int(h*.62),int(w*.37):int(w*.65)]=cv2.GC_FGD
    skinY,skinX=np.where(gold[:int(h*.42)])
    if len(skinX):
     hx=int(np.median(skinX));hy=int(np.percentile(skinY,12));mask[max(2,hy-10):hy+5,max(2,hx-9):min(w-2,hx+5)]=cv2.GC_FGD
   else:mask[int(h*.6):int(h*.82),int(w*.33):int(w*.64)]=cv2.GC_FGD
   if seq in ['idle','punch','block']:
    projection=blue[int(h*.7):int(h*.94)].sum(axis=0);segments=[];active=projection>1;start=None
    for xx in range(w):
     if active[xx] and start is None:start=xx
     if start is not None and (not active[xx] or xx==w-1):
      if xx-start>4:segments.append((start,xx))
      start=None
    if len(segments)>=2:
     left,right=segments[0],segments[-1];mid=(left[1]+right[0])//2
     if right[0]-left[1]>3:mask[int(h*.82):,mid-1:mid+2]=cv2.GC_BGD
    if ident=='grunge':
     for a,bx in segments:mask[h-9:h-3,max(2,a-2):min(w-2,bx+2)]=cv2.GC_FGD
   cv2.grabCut(crop,mask,None,np.zeros((1,65)),np.zeros((1,65)),4,cv2.GC_INIT_WITH_MASK)
   alpha=((mask==1)|(mask==3)).astype('uint8')
   n,labels,stats,_=cv2.connectedComponentsWithStats(alpha,8)
   for j in range(1,n):
    if stats[j,4]<12:alpha[labels==j]=0
   contours,_=cv2.findContours(alpha,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
   polygons=[cv2.approxPolyDP(c,1.3,True).reshape(-1,2).tolist() for c in contours if cv2.contourArea(c)>12]
   frames.append([x,y,w,h,polygons])
  groups[seq]=frames
 result[ident]=groups
raw=json.dumps(result,separators=(',',':')).encode();encoded=base64.b64encode(gzip.compress(raw,9,mtime=0)).decode()
parts=[encoded[i:i+3200] for i in range(0,len(encoded),3200)]
for i,part in enumerate(parts):
 (ROOT/f'matte-part-{i}.js').write_text('export default "'+part+'";\n')
imports=''.join(f"import p{i} from './matte-part-{i}.js';\n" for i in range(len(parts)))
(ROOT/'matte-v5.js').write_text('// Generated alpha-mask polygon data.\n'+imports+'export const encodedMattes='+ '+'.join(f'p{i}' for i in range(len(parts)))+';\n')
print('mask JSON bytes',len(raw),'encoded',len(encoded))
