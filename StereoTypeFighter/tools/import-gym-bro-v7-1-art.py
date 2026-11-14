#!/usr/bin/env python3
"""Install manually reviewed Gym Bro V7.1 portrait and scenes from a checked ZIP.

Usage:
  python tools/import-gym-bro-v7-1-art.py /path/to/gym-bro-v7-1-candidate-assets.zip --check-only
  python tools/import-gym-bro-v7-1-art.py /path/to/gym-bro-v7-1-candidate-assets.zip --install

By design this never modifies V7 gameplay, story dialogue, or production manifest.
No missing animation frames are synthesized.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ALLOWED={"art/gym-bro/portrait.png","art/gym-bro/hero.png","art/scenes/prologue-gym-bro.png"}
def main():
 p=argparse.ArgumentParser()
 p.add_argument("archive",type=Path)
 g=p.add_mutually_exclusive_group(required=True)
 g.add_argument("--check-only",action="store_true")
 g.add_argument("--install",action="store_true")
 p.add_argument("--force",action="store_true",help="Explicitly replace an already existing candidate asset")
 args=p.parse_args()
 with ZipFile(args.archive) as z:
  manifest=json.loads(z.read("CANDIDATE_ASSET_MANIFEST.json"))
  assert manifest["fighter"]=="gym-bro" and manifest["version"]=="v7.1"
  records=manifest["assets"]
  names={i.filename for i in z.infolist()}
  for r in records:
   name=r["path"]
   if name not in ALLOWED or name not in names or PurePosixPath(name).is_absolute() or ".." in PurePosixPath(name).parts:
    raise ValueError("unexpected file: "+name)
   payload=z.read(name)
   if hashlib.sha256(payload).hexdigest()!=r["sha256"]:
    raise ValueError("checksum mismatch: "+name)
   import io
   with Image.open(io.BytesIO(payload)) as img:
    if img.format!="PNG":raise ValueError("not PNG: "+name)
    if name.startswith("art/scenes/"):
     w,h=img.size
     if w*9!=h*16 or w<960 or h<540:raise ValueError("cinematic image must be >=960x540 and 16:9")
    elif name.endswith("portrait.png") and min(img.size)<720:
     raise ValueError("portrait resolution insufficient")
   dest=ROOT/name
   if dest.exists() and not args.force and args.install:
    raise FileExistsError(str(dest)+" already exists. Refusing overwrite.")
   if args.install:
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(payload)
   print(("INSTALLED" if args.install else "CHECKED")+" "+name+" sha256="+r["sha256"])
 print("Candidate art only; manual identity approval and game/browser testing are still required.")

if __name__=="__main__":main()
