#!/usr/bin/env python3
"""Import Gaz's 16 first-pass draft frames into an isolated art-review folder.

Usage: python tools/import-gaz-preview.py /path/to/StereoTypeFighters_Gaz_16_frame_preview.zip

Never modifies art/manifest.json or active sprite art. Extracted frames are NOT game-approved.
"""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import hashlib
import json
import sys

if len(sys.argv) != 2:
    sys.exit(__doc__)
source = Path(sys.argv[1]).expanduser().resolve()
root = Path(__file__).resolve().parents[1]
target = root / "art-review" / "bogan-tradie" / "first-pass"
expected = [f"art/bogan-tradie/{anim}/{i:02d}.png" for anim in ("idle", "walk") for i in range(1, 9)]
if not source.is_file():
    sys.exit(f"Missing {source}")
target.mkdir(parents=True, exist_ok=True)
with ZipFile(source) as archive:
    if archive.testzip() is not None:
        sys.exit("Archive CRC check failed")
    missing = sorted(set(expected) - set(archive.namelist()))
    if missing:
        sys.exit(f"Missing draft frames: {missing}")
    records = []
    for member in expected:
        data = archive.read(member)
        dest = target / Path(member).relative_to("art")
        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("wb") as stream:
            stream.write(data)
        with Image.open(dest) as frame:
            if frame.size != (512, 512) or frame.mode != "RGBA":
                sys.exit(f"Invalid format: {member}")
            low, high = frame.getchannel("A").getextrema()
            if low >= 255 or high == 0:
                sys.exit(f"Alpha invalid: {member}")
        records.append({"path": str(dest.relative_to(root)), "sha256": hashlib.sha256(data).hexdigest()})
    for meta in ("QA_contact_sheet.jpg", "export_report.json"):
        if meta in archive.namelist():
            (target / meta).write_bytes(archive.read(meta))
manifest = {"status": "draft-not-live", "source_archive": source.name, "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "frames": records, "notes": "Human QA and gameplay verification required. Do not change active art/manifest.json."}
(target / "source-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"Imported {len(records)} review-only Gaz frames to {target}")
print("NOT LIVE: Keep game sprites and art/manifest.json unchanged until art passes QA.")
