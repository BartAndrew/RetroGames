#!/usr/bin/env python3
"""Validate game-ready V7 animation frames against art/manifest.json.
Run from any directory: python tools/check-v7-art.py
Requires Pillow: python -m pip install Pillow
This validates files/alpha/geometry; human visual inspection remains mandatory.
"""
from pathlib import Path
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art"
manifest_path = ART / "manifest.json"
if not manifest_path.is_file():
    sys.exit("ERROR: missing art/manifest.json")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
failures, warnings, present = [], [], 0
for fid, fighter in manifest.items():
    if not isinstance(fighter, dict) or "anims" not in fighter:
        continue
    if "anchor" not in fighter or "scale" not in fighter:
        failures.append(f"{fid}: missing anchor/scale")
        continue
    path_tpl = fighter.get("path", "art/{id}/{anim}/{n}.png")
    for anim, spec in fighter["anims"].items():
        count = spec.get("frames")
        if not isinstance(count, int) or count < 1:
            failures.append(f"{fid}/{anim}: invalid frame count")
            continue
        for n in range(1, count + 1):
            rel = path_tpl.replace("{id}", fid).replace("{anim}", anim).replace("{n}", f"{n:02d}")
            frame = ROOT / rel
            if not frame.is_file():
                failures.append(f"{fid}/{anim}/{n:02d}: missing {rel}")
                continue
            present += 1
            try:
                with Image.open(frame) as im:
                    if im.size != (512,512):
                        failures.append(f"{rel}: {im.size}, expected 512x512")
                    if im.mode != "RGBA":
                        failures.append(f"{rel}: mode {im.mode}, expected RGBA")
                    else:
                        low, high = im.getchannel("A").getextrema()
                        if low == 255:
                            failures.append(f"{rel}: no transparent pixels")
                        elif high == 0:
                            failures.append(f"{rel}: wholly transparent")
            except Exception as ex:
                failures.append(f"{rel}: unreadable ({ex})")
print(f"Checked {present} existing frames; {len(failures)} errors, {len(warnings)} warnings")
for line in failures: print("ERROR:", line)
for line in warnings: print("WARN:", line)
print("Manual QA still required: frame separation, temporal ordering, identical character identity, feet, VFX and actual game playback.")
sys.exit(1 if failures else 0)
