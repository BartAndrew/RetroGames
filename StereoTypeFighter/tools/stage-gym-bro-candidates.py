#!/usr/bin/env python3
"""Inspect a ChatGPT-generated Gym Bro attack candidate ZIP without enabling it in V7.
Run:
  python tools/stage-gym-bro-candidates.py path/to/gym-bro-v7-1-attack-candidates.zip --verify
  python tools/stage-gym-bro-candidates.py path/to/gym-bro-v7-1-attack-candidates.zip --stage

Staged PNG files go in art/gym-bro/candidates, never art/gym-bro/<action>.
No active manifest is changed and existing approved artwork is never overwritten.
"""
from pathlib import Path, PurePosixPath
from PIL import Image
from zipfile import ZipFile
import argparse, hashlib, io, json, sys

ROOT=Path(__file__).resolve().parents[1]
STAGE=ROOT/"art/gym-bro/candidates"

def main():
  p=argparse.ArgumentParser()
  p.add_argument("archive",type=Path)
  g=p.add_mutually_exclusive_group(required=True)
  g.add_argument("--verify",action="store_true")
  g.add_argument("--stage",action="store_true")
  args=p.parse_args()
  with ZipFile(args.archive) as z:
    manifest=json.loads(z.read("CANDIDATE_QA.json"))
    if manifest.get("fighter")!="gym-bro" or manifest.get("type")!="animation candidates only - not verified runtime frames":
      sys.exit("Incorrect candidate manifest")
    files=manifest["files"]
    if len(files)>120:sys.exit("Unreasonable number of candidate frames")
    for f in files:
      name=f["path"]; parts=PurePosixPath(name).parts
      if len(parts)!=2 or parts[0] not in {"lp","lk","hp"} or parts[1].find(".png")==-1:
        sys.exit("Invalid candidate name: "+name)
      data=z.read(name)
      if hashlib.sha256(data).hexdigest()!=f["sha256"]:
        sys.exit("Checksum mismatch: "+name)
      with Image.open(io.BytesIO(data)) as image:
        if image.size!=(512,512) or image.mode!="RGBA" or image.getchannel("A").getextrema()[0]>0:
          sys.exit("Not a valid transparent 512x512 RGBA candidate: "+name)
      if args.stage:
        dest=STAGE/name
        if dest.exists():sys.exit("Will not overwrite: "+str(dest))
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(data)
    print(f"Verified {len(files)} transparent candidate frames")
    print(f"Near-duplicate pairs flagged: {len(manifest.get('perceptually_similar_pairs', []))}")
    if args.stage:
      (STAGE/"CANDIDATE_QA.json").write_text(json.dumps(manifest,indent=2)+"\n")
      print("Staged only. No manifest activation, combat changes, or release approval.")

if __name__=="__main__": main()
