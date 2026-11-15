# Gym Bro V7.1 artwork handoff — 15 November 2026

**Status:** 31 animation actions populated as **candidate** files, **not production-approved**.

The completed local deliverable is named `GymBro_V7.1_Artwork_Candidate_Pack.zip`. Download it from the original ChatGPT delivery; sandbox attachments are not public GitHub URLs and cannot be downloaded by CI automatically.

- Archive size: **26,618,846 bytes**.
- Archive SHA-256: `9cc06484b4e8347ca7dec7be107d7d6ec88c6770659762a8366eefb2188a7c07`.
- 31 action directories, 120 numbered 512×512 RGBA PNG files, with matching canonical frame counts from `art/manifest.v7.template.json`.
- 10 story illustrations (1600×900) including the prologue, four pre-fights, four post-fights and the ending.
- Full-body photographic hero and 900×1200 character portrait.
- Offline animation-review HTML, provenance/checksums and JSON QA evidence.

## How to review (do not overwrite production)

1. Download the ZIP from this ChatGPT conversation.
2. In a checkout of `feature/gym-bro-v7-art-qa-20261115`, run
   `python StereoTypeFighter/tools/import-gym-bro-full-pack.py /path/to/GymBro_V7.1_Artwork_Candidate_Pack.zip --verify`.
3. If verification passes, run the same script with `--stage` to place files under `StereoTypeFighter/art/_review/gym-bro-v7-1/` only.
4. For the standalone animation gallery, unzip in a separate directory, run `python -m http.server 8080` there, and open `http://localhost:8080/animation-review.html`.

## Important QA truthfulness

The archive has **all required files**, but many sprite poses were cut from earlier *presentation contact sheets* at insufficient native resolution, resulting in some soft or inconsistent anatomy and costume detail. The first automatic audit reported **13 manual review findings**, including 12 visually similar frame pairs and one potentially clipped jump apex. Geometry and alpha format checks passed, but that **does not certify motion or identity continuity**.

The eight pre-/post-fight scenes and the ending are composited from earlier AI concept thumbnails rather than fully new, individually art-directed high-resolution illustrations. They retain rival themes, with the lower dialogue area darkened, but **require replacement or explicit visual approval**. The prologue is a full-resolution separately generated illustration.

**Do not copy the candidate manifest to the active game manifest, merge the draft PR or promote Vercel production based on file count alone.** Source-of-truth combat code and all dialogue remain unchanged. Existing rig fallbacks continue working.

## Required acceptance

- [ ] Independent human review of all 120 source frames at 512px and scaled in-game.
- [ ] Replace near-duplicates and low-resolution poses with physically distinct, identity-locked, properly aligned artwork.
- [ ] Finalize 10 high-quality story scenes with correct Tyler/opponent identities.
- [ ] Run frame geometry and visual QA, then `tools/check-v7-art.py`, the strict V7 asset gate, browser/keyboard/controller QA, and a complete four-rival story run.
- [ ] Commit verified binaries to GitHub only after approval, deploy preview, verify actual asset URLs and storage, then promote if all checks pass.

**Note:** This handoff records a **candidate artwork deliverable** and is not a claim that the new binary artwork has been committed, made live or production-ready.
