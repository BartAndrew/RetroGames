#!/usr/bin/env python3
"""Build a SMALL SYNTHETIC ZIP to test the V7.1 browser artwork importer.

This is TEST FIXTURE ONLY, not Gym Bro artwork. NEVER publish these generated
solid-colour images or copy them to the game's art/ directory.
"""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
RIVALS=("bogan-tradie","yuppie","fat-gamer","cheerleader")
def png(size, color, transparent=False):
    img=Image.new("RGBA" if transparent else "RGB",size,(0,0,0,0) if transparent else color)
    d=ImageDraw.Draw(img)
    d.rounded_rectangle((size[0]//4,size[1]//5,size[0]*3//4,size[1]*9//10),radius=15,fill=color)
    out=io.BytesIO()
    img.save(out,format="PNG",optimize=True)
    return out.getvalue()
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
    target=ROOT/"tests"/"_tmp_gym_bro_synthetic.zip"
    manifest=json.loads((ROOT/"art/manifest.v7.template.json").read_text())
    action_defs=manifest["gym-bro"]["anims"]
    manifest={"scenes":True,"gym-bro":manifest["gym-bro"]}
    provenance={"fighter":"gym-bro","actions":{}}
    scene_proof={}
    with ZipFile(target,"w",compression=ZIP_DEFLATED,compresslevel=6) as z:
        for i,(action,cfg) in enumerate(action_defs.items()):
            records=[]
            for n in range(1,cfg["frames"]+1):
                p="art/gym-bro/"+action+"/"+str(n).zfill(2)+".png"
                image=png((512,512),((i*31)%255,(n*41)%255,80,255),True)
                records.append({"sha256_file":digest(image)})
                z.writestr(p,image)
            provenance["actions"][action]=records
        scenes=("prologue-gym-bro","ending-gym-bro")+tuple(
            item for rival in RIVALS for item in ("pre-gym-bro-"+rival,"post-gym-bro-"+rival)
        )
        for i,id in enumerate(scenes):
            name=id+".png"
            image=png((1600,900),((i*30)%255,40,100))
            z.writestr("art/scenes/"+name,image)
            scene_proof[name]={"sha256":digest(image)}
        z.writestr("art/gym-bro/portrait.png",png((900,1200),(180,30,150)))
        z.writestr("art/gym-bro/hero.png",png((640,960),(180,30,150),True))
        z.writestr("PROVENANCE.json",json.dumps(provenance))
        z.writestr("STORY_PROVENANCE.json",json.dumps(scene_proof))
        z.writestr("art/manifest-v7-1-candidate.json",json.dumps(manifest))
        z.writestr("README.md","TEST FIXTURE ONLY - synthetic image geometry for ZIP import tests")
        z.writestr("QA_REPORT.json",json.dumps({"fighter":"gym-bro","production_status":"TEST ONLY"}))
        z.writestr("animation-review.html","TEST FIXTURE ONLY")
    assert len(ZipFile(target).namelist())==138
    print("Generated only a synthetic ZIP import test fixture:",target)
if __name__=="__main__":main()
