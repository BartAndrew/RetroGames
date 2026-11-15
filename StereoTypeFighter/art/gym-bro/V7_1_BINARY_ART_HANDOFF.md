# Gym Bro V7.1 artwork handoff — 15 November 2026

**Status:** 31 animation actions populated as **candidate** files, **not production-approved**.

The completed local deliverable is named `GymBro_V7.1_Artwork_Candidate_Pack.zip`. Download it from the original ChatGPT delivery; sandbox attachments are not public GitHub URLs and cannot be downloaded by CI automatically.

- Archive size: **26,628,612 bytes**.
- Archive SHA-256: `192a32fff175731d53df275cafe16cc1b72e5a0fba6d9375d10bf09540acb5fb`.
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


## Offline original source archive

A second download, `GymBro_V7.1_Source_Artwork_Archive.zip`, preserves 10 unmodified source images/ZIPs and the three reproduction scripts, keeping source material out of the Vercel-served production bundle.

- Source archive size: **24,294,249 bytes**.
- Source archive SHA-256: `5f074e48e7f6711678dd63c5b91023b9fb62f69406af5c0f75bd5ca0972fc732`.
- Contains `SOURCE_ART_INVENTORY.json` with original image filenames, SHA-256 and sizes.
- The explicitly named original `Gym Bro Fighting Game Sprite Sheet-3.png` was not available and is recorded as missing, not silently recreated or assigned a fabricated checksum.

These source files also remain outside GitHub unless separately uploaded and reviewed; the named ZIP is delivered as a ChatGPT conversation download, not a publicly reachable CI URL.


## R2 artwork correction and live local artwork preview

A new **R2 ZIP** is available in this ChatGPT conversation. It supersedes the R1 artwork pack and fixes four broken or soft low-defense/reaction sprites using a higher-resolution, individually generated pose source.

- `GymBro_V7.1_Artwork_Candidate_Pack_R2.zip`: **26,885,041 bytes**, SHA-256 `f6f5c7e6ed650423be54d928c8554e4328f0c9f90170017b4a09fc857da4f3de`.
- `GymBro_V7.1_Source_Artwork_Archive_R2.zip`: **25,923,100 bytes**, SHA-256 `548f822eff5e5d463fc38c4be5bd2cb761bf7979b5c835081fe45fcddba78b83`.
- Replaced `blockLow/01.png`, `blockLow/02.png`, `hurtLow/01.png`, `hurtLow/02.png`. Original files and their SHA-256 values are recorded under `QA_REPORT.json.replacements`; new bytes and checksums are in the R2 provenance manifest.
- Independently verified all 31 actions, 120 RGBA 512 × 512 frames, ten 1600 × 900 scenes and all corresponding recorded SHA-256 values. No replaced frame extends past the bottom 480 px.

The new `v7-1-art-lab.html` is a separate, browser-playable test build that lets the player select this local ZIP directly, without uploading it, and enables **all 31 Gym Bro actions and all ten scenes on demand**. The in-memory loader verifies frame counts, SHA-256, PNG dimensions, decodes the image files, then allows switching candidate art on/off while running the unchanged V7.1 deterministic combat code. GitHub Actions now runs a real Chromium ZIP import/toggle/playability regression using a **synthetic test fixture** (not the real artwork).

This local, opt-in artwork preview is **not production activation**; the incomplete R2 art has not been merged, uploaded to GitHub as binaries, or assigned to the default V7.1 manifest. Existing low-resolution frames and composited story scenes remain candidates until reviewed and replaced.


## R3 candidate cleanup (latest offline artwork pack)

The R3 pack supersedes R2, with **seven total frame repairs since R1**: four higher-resolution replacements from R2 and three non-destructive detached-fragment cleanups to the `walkBack/05.png`, `dashF/03.png` and `special/04.png` candidate frames. No original artwork is overwritten or lost; the R3 source archive includes the exact Python scripts and unmodified source-sheet bytes.

- `GymBro_V7.1_Artwork_Candidate_Pack_R3.zip`: **26,869,208 bytes** — SHA-256 `b06d00cfba1e097b6b3543fa1e38e4ce1ca39a72eb14902d62970375bbcd06a7`.
- `GymBro_V7.1_Source_Artwork_Archive_R3.zip`: **25,924,842 bytes** — SHA-256 `81cfd1bf2973f19b1326d14016ec626ae13e5aea993e178f910b9c1ae3a92cff`.
- All **31 animation definitions, 120 512×512 RGBA frames, ten 1600×900 story images and per-frame/per-scene SHA-256 hashes** passed independent archive validation.
- Review artifacts: R2 low-block/hurtLow before-after comparison and R3 fragment-removal comparison are delivered alongside the ZIP in this ChatGPT conversation.
- R3 image quality is **still not approved**. Earlier 13 perceptual/manual-review findings remain recorded, and `special/04.png` still has a partially cropped figure; removal of foreign fragments is not the same as reconstructing a missing limb. Other low-resolution source poses and composited story scenes still need bespoke high-resolution replacements.

To test R3 against the real fighting game, open `v7-1-art-lab.html` on the Vercel branch preview, choose the **R3 ZIP** with the local file input, then toggle candidate artwork versus original rig. The loader checks the R3 hashes and mounts files in memory only. **No artwork binaries are committed to GitHub or promoted to the default live manifest.**
