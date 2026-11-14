#!/usr/bin/env python3
"""Gym Bro V7 asset coverage and forensic checks.

Development mode (default) reports missing assets without pretending they exist.
--strict fails if any required animation frame, portrait or scene art is missing
or if any image has critical technical problems.

Run from repository root or StereoTypeFighter:
    python StereoTypeFighter/tools/audit-gym-bro-v7.py --output /tmp/gym-bro-audit.json
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art"
FIGHTER = "gym-bro"


def image_audit(path, expected_size, transparent):
    result = {"exists": path.is_file(), "path": str(path.relative_to(ROOT))}
    if not result["exists"]:
        return result
    result["bytes"] = path.stat().st_size
    result["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    try:
        with Image.open(path) as raw:
            raw.load()
            result["size"] = list(raw.size)
            result["mode"] = raw.mode
            errors = []
            if expected_size and raw.size != expected_size:
                errors.append(f"dimensions {raw.size} != {expected_size}")
            if transparent and raw.mode != "RGBA":
                errors.append(f"requires RGBA, got {raw.mode}")
            rgba = raw.convert("RGBA")
            alpha = rgba.getchannel("A")
            extrema = alpha.getextrema()
            result["alpha_extrema"] = list(extrema)
            if transparent and extrema[0] == 255:
                errors.append("completely opaque")
            if transparent and extrema[1] == 0:
                errors.append("completely transparent")
            bbox = alpha.getbbox()
            result["opaque_bounds"] = list(bbox) if bbox else None
            if transparent and bbox:
                x0, y0, x1, y1 = bbox
                result["touches_canvas_edge"] = x0 <= 1 or y0 <= 1 or x1 >= raw.width - 1 or y1 >= raw.height - 1
                if result["touches_canvas_edge"]:
                    errors.append("visible alpha touches edge; inspect possible clipping")
                # Bounding-box drift is advisory: airborne moves and attacks are not grounded.
                result["lower_alpha_y"] = y1
            # Compare a low-resolution luminance fingerprint as a QA hint, not motion proof.
            thumb = rgba.convert("RGB").resize((9, 8))
            pixels = list(thumb.convert("L").getdata())
            bits = "".join("1" if pixels[y * 9 + x] > pixels[y * 9 + x + 1] else "0"
                           for y in range(8) for x in range(8))
            result["dhash64"] = f"{int(bits, 2):016x}"
            result["errors"] = errors
    except Exception as exc:
        result["errors"] = [f"unreadable: {exc}"]
    return result


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--strict", action="store_true")
    cli.add_argument("--output", type=Path, default=None)
    args = cli.parse_args()

    active = json.loads((ART / "manifest.json").read_text(encoding="utf-8"))[FIGHTER]
    required = json.loads((ART / "manifest.v7.template.json").read_text(encoding="utf-8"))[FIGHTER]
    rows, collisions = [], []
    manifest_mismatch = {}
    actual_files = 0
    required_frames = 0
    active_frames = sum(v["frames"] for v in active["anims"].values())
    invalid = []
    for anim, cfg in required["anims"].items():
        count = cfg["frames"]
        required_frames += count
        registered = active["anims"].get(anim, {}).get("frames", 0)
        if registered != count:
            manifest_mismatch[anim] = {"required": count, "registered": registered}
        assets = []
        sha_seen = {}
        for n in range(1, count + 1):
            path = ART / FIGHTER / anim / f"{n:02d}.png"
            item = image_audit(path, (512, 512), True)
            if item["exists"]:
                actual_files += 1
            if item.get("errors"):
                invalid.append({"animation": anim, "frame": n, "errors": item["errors"]})
            sha = item.get("sha256")
            if sha:
                if sha in sha_seen:
                    collisions.append({"animation": anim, "frames": [sha_seen[sha], n], "kind": "identical PNG bytes"})
                else:
                    sha_seen[sha] = n
            assets.append(item)
        rows.append({"animation": anim, "required": count, "registered": registered,
                     "present": sum(a["exists"] for a in assets), "frames": assets})

    portrait = image_audit(ART / FIGHTER / "portrait.png", None, False)
    # Scene naming comes from story-v7.js (prologue/ending and four rivals).
    opponents = ["bogan-tradie", "yuppie", "fat-gamer", "cheerleader"]
    scene_names = ["prologue-gym-bro"] + [
        name for opp in opponents for name in
        (f"pre-gym-bro-{opp}", f"post-gym-bro-{opp}")
    ] + ["ending-gym-bro"]
    scenes = [image_audit(ART / "scenes" / (name + ".png"), None, False) for name in scene_names]
    complete = (actual_files == required_frames and not invalid and not collisions and
                portrait["exists"] and all(x["exists"] for x in scenes))
    report = {
        "fighter": FIGHTER, "status": "complete" if complete else "incomplete",
        "required_actions": len(required["anims"]), "required_frames": required_frames,
        "active_actions": len(active["anims"]), "active_registered_frames": active_frames,
        "present_required_frames": actual_files, "missing_required_frames": required_frames - actual_files,
        "manifest_count_differences": manifest_mismatch, "exact_duplicate_frames": collisions,
        "technical_findings": invalid, "portrait": portrait, "scenes": scenes,
        "animations": rows,
        "notes": [
            "SHA-256 hashes only reflect original binary files present in the checkout.",
            "Technical checks cannot certify pose uniqueness, visual identity or ground contact.",
            "Scenes may be inherited from bidirectional scene assets; missing directions are reported conservatively.",
            "Missing frames are expected during development and do not fail unless --strict is passed.",
            "The active manifest remains unchanged until every animation is verified."
        ],
    }
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Gym Bro V7: {len(active['anims'])}/{len(required['anims'])} actions active; "
          f"{actual_files}/{required_frames} template frames present; "
          f"{sum(x['exists'] for x in scenes)}/{len(scenes)} story images; "
          f"portrait={'present' if portrait['exists'] else 'missing'}")
    print(f"Technical findings: {len(invalid)}; identical frame pairs: {len(collisions)}")
    if args.strict and not complete:
        raise SystemExit("FAIL: Gym Bro is not ready for production")
    if invalid:
        # Technical errors are reportable even in development, not falsely waived.
        print("WARNING: Some existing art needs manual or technical repair.")


if __name__ == "__main__":
    main()
