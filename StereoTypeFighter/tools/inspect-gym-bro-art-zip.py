#!/usr/bin/env python3
"""Inspect a standalone Gym Bro V7.1 artwork ZIP without activating artwork.

Usage:
  python tools/inspect-gym-bro-art-zip.py GymBro_V7.1_Artwork_Candidate_Pack_R5.zip --json report.json
  python tools/inspect-gym-bro-art-zip.py <archive> --strict

The non-strict audit returns success when files are structurally readable, while
reporting all subjective/motion concerns. --strict is an approval gate: it fails
when either structural problems or review warnings remain.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile
from PIL import Image


def digest(data):
    return hashlib.sha256(data).hexdigest()


def dhash(im):
    im = im.convert("RGBA")
    background = Image.new("RGBA", im.size, (20, 30, 45, 255))
    background.alpha_composite(im)
    pixels = list(background.convert("L").resize((9, 8)).getdata())
    return sum((1 << (63 - (y * 8 + x))) for y in range(8) for x in range(8)
               if pixels[y * 9 + x] > pixels[y * 9 + x + 1])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("archive", type=Path)
    p.add_argument("--json", type=Path, default=None)
    p.add_argument("--strict", action="store_true")
    args = p.parse_args()
    root = Path(__file__).resolve().parents[1]
    required = json.loads((root / "art/manifest.v7.template.json").read_text())["gym-bro"]["anims"]
    hard, warnings, frames, animation_hashes = [], [], [], {}
    with ZipFile(args.archive) as z:
        names = set(z.namelist())
        provenance = json.loads(z.read("PROVENANCE.json"))
        scene_proof = json.loads(z.read("STORY_PROVENANCE.json"))
        for action, spec in required.items():
            known = []
            for n in range(1, spec["frames"] + 1):
                name = f"art/gym-bro/{action}/{n:02d}.png"
                if name not in names:
                    hard.append(f"missing {name}")
                    continue
                data = z.read(name)
                sha = digest(data)
                try:
                    with Image.open(io.BytesIO(data)) as img:
                        img.load()
                        if img.mode != "RGBA" or img.size != (512, 512):
                            hard.append(f"invalid RGBA geometry: {name}")
                        a = img.convert("RGBA").getchannel("A")
                        bounds = a.getbbox()
                        if bounds is None or a.getextrema()[0] == 255:
                            hard.append(f"missing transparency or alpha: {name}")
                            continue
                        if bounds[0] <= 1 or bounds[1] <= 1 or bounds[2] >= 511 or bounds[3] >= 511:
                            warnings.append(f"possible sprite clipping: {name} {bounds}")
                        if action in {"idle", "walk", "walkBack", "crouch", "block", "blockLow"}:
                            if abs(bounds[3] - 470) > 15:
                                warnings.append(f"ground contact needs review: {name} footY={bounds[3]}")
                        h = dhash(img)
                        if sha in animation_hashes:
                            hard.append(f"exact duplicate across actions: {animation_hashes[sha]} and {name}")
                        animation_hashes[sha] = name
                        for old_name, old_hash in known:
                            if (old_hash ^ h).bit_count() <= 4:
                                warnings.append(f"visually similar poses: {old_name} and {name}")
                        known.append((name, h))
                        frames.append({"name": name, "sha256": sha, "bbox": list(bounds)})
                except Exception as e:
                    hard.append(f"unreadable {name}: {e}")
                source = provenance.get("actions", {}).get(action, [])
                if len(source) < n or source[n - 1].get("sha256_file") != sha:
                    hard.append(f"provenance SHA mismatch: {name}")
        for filename, rec in scene_proof.items():
            name = "art/scenes/" + filename
            if name not in names:
                hard.append(f"missing story image: {name}")
                continue
            data = z.read(name)
            if rec.get("sha256") != digest(data):
                hard.append(f"story SHA mismatch: {name}")
            with Image.open(io.BytesIO(data)) as img:
                if img.size != (1600, 900):
                    hard.append(f"invalid story dimensions: {name}")
        for name in ("art/gym-bro/portrait.png", "art/gym-bro/hero.png"):
            if name not in names:
                hard.append(f"missing select asset: {name}")
    report = {
        "fighter": "gym-bro", "archive": args.archive.name,
        "actions_required": len(required),
        "frames_required": sum(x["frames"] for x in required.values()),
        "frames_structurally_inspected": len(frames),
        "story_scenes": len(scene_proof),
        "hard_errors": hard,
        "review_warnings": warnings,
        "note": "Similarity is an advisory heuristic, not evidence that small idle motions are invalid; human review required."
    }
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Gym Bro candidate audit: {len(frames)}/120 frames, {len(scene_proof)} scenes, "
          f"{len(hard)} hard errors, {len(warnings)} review warnings")
    if hard or (args.strict and warnings):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
