#!/usr/bin/env python3
"""Verify/stage the offline Gym Bro V7.1 candidate art pack, WITHOUT activating it.

Usage:
    python tools/import-gym-bro-full-pack.py /path/to/GymBro_V7.1_Artwork_Candidate_Pack.zip --verify
    python tools/import-gym-bro-full-pack.py /path/to/GymBro_V7.1_Artwork_Candidate_Pack.zip --stage

--stage writes exclusively under StereoTypeFighter/art/_review/gym-bro-v7-1/.
It cannot modify art/manifest.json or the live V7.1 manifest.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / "art" / "_review" / "gym-bro-v7-1"
REQUIRED = {
    "idle":6,"walk":6,"walkBack":6,"dashF":3,"dashB":3,
    "crouch":2,"block":2,"blockLow":2,"prejump":1,"jumpUp":2,
    "jumpApex":1,"jumpDown":2,"land":1,"lp":5,"lk":5,"hp":6,
    "hk":6,"launcher":6,"sweep":6,"airP":4,"airK":4,
    "hurt":2,"hurtLow":2,"launched":3,"knockdown":2,
    "ko":1,"getup":5,"special":6,"super":12,"victory":4,"intro":4,
}
RIVALS = ["bogan-tradie", "yuppie", "fat-gamer", "cheerleader"]
SCENES = {"prologue-gym-bro.png", "ending-gym-bro.png"} | {
    f"{stage}-gym-bro-{rival}.png"
    for stage in ("pre", "post") for rival in RIVALS
}
EXPECTED = {
    f"art/gym-bro/{action}/{n:02d}.png"
    for action, frames in REQUIRED.items()
    for n in range(1, frames + 1)
}
EXPECTED |= {f"art/scenes/{name}" for name in SCENES}
EXPECTED |= {"art/gym-bro/portrait.png", "art/gym-bro/hero.png"}
META = {"PROVENANCE.json", "STORY_PROVENANCE.json", "QA_REPORT.json", "README.md", "animation-review.html", "art/manifest-v7-1-candidate.json"}


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--verify", action="store_true")
    group.add_argument("--stage", action="store_true")
    args = parser.parse_args()

    with ZipFile(args.archive) as z:
        paths = set(z.namelist())
        if paths != EXPECTED | META:
            missing = sorted((EXPECTED | META) - paths)
            unexpected = sorted(paths - (EXPECTED | META))
            raise ValueError(f"Unexpected ZIP inventory. Missing={missing[:8]}, excess={unexpected[:8]}")
        for name in paths:
            pp = PurePosixPath(name)
            if pp.is_absolute() or ".." in pp.parts or "\\" in name:
                raise ValueError(f"Unsafe ZIP member: {name}")
        qa = json.loads(z.read("QA_REPORT.json"))
        if qa.get("fighter") != "gym-bro" or qa.get("production_status", "").startswith("APPROVED"):
            raise ValueError("Expected explicitly unapproved Gym Bro candidate QA metadata")
        if qa.get("present_frame_count") != 120 or qa.get("present_action_count") != 31:
            raise ValueError("Required 31 action / 120 frame inventory missing")
        provenance = json.loads(z.read("PROVENANCE.json"))
        story = json.loads(z.read("STORY_PROVENANCE.json"))

        for action, count in REQUIRED.items():
            records = provenance["actions"][action]
            if len(records) != count:
                raise ValueError(f"Frame count mismatch: {action}")
            for idx, record in enumerate(records, 1):
                path = f"art/gym-bro/{action}/{idx:02d}.png"
                payload = z.read(path)
                with Image.open(io.BytesIO(payload)) as img:
                    img.load()
                    if img.size != (512, 512) or img.mode != "RGBA":
                        raise ValueError(f"Invalid dimensions or transparency: {path}")
                    if img.getchannel("A").getextrema() != (0, 255):
                        raise ValueError(f"Invalid alpha range: {path}")
                if record["sha256_file"] != sha256(payload):
                    raise ValueError(f"SHA-256 mismatch: {path}")

        for name in SCENES:
            path = "art/scenes/" + name
            payload = z.read(path)
            with Image.open(io.BytesIO(payload)) as img:
                img.load()
                if img.size != (1600, 900):
                    raise ValueError(f"Scene image must be 16:9: {path}")
            if story[name]["sha256"] != sha256(payload):
                raise ValueError(f"Scene checksum mismatch: {path}")

        if args.stage:
            if REVIEW.exists():
                raise FileExistsError(f"Review folder already exists; refusing overwrite: {REVIEW}")
            for name in sorted(paths):
                output = REVIEW / name
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_bytes(z.read(name))
        print("PASS: 31 candidate actions, 120 RGBA frame files, 10 scenes, portrait and hero; checksums verified.")
        print("PRODUCTION APPROVAL: NO — visuals, distinct poses, source resolution and game testing still require review.")
        if args.stage:
            print(f"Staged safely under {REVIEW.relative_to(ROOT)}; live manifests remain unchanged.")


if __name__ == "__main__":
    main()
