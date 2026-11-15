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


## R4 — Protein Shaker Blast rebuilt as six full-body keyposes (latest candidate)

**R4 supersedes R3.** The six special animation frames were replaced from a new 1536 × 1024 magenta-key 3×2 source image. Unlike the R3 special, every frame now includes the complete body, footwear and the appropriate arm gesture. The sequence shows guard with shaker holstered, reach to hip, shaker wind-up, forward extension, release and guarded recovery. The projectile remains governed by the unchanged combat engine (not by a painted damage effect).

- Latest candidate ZIP: `GymBro_V7.1_Artwork_Candidate_Pack_R4.zip`
- **Archive SHA-256:** `dab1eba889b27f79b6933cdd47c59e0a72b803f7025e8ad6ff8110be27f0416a`
- **Size:** 26,963,677 bytes; exactly 138 archive members.
- Latest source archive: `GymBro_V7.1_Source_Artwork_Archive_R4.zip`
- **Source SHA-256:** `e2f2c5d16a5bc3c19c2f9e75bf9046f478ac0a31c2377714c4d06e37d51bcbd7`
- 27,539,930 bytes; includes the original R3 source files **plus unchanged R4 source art and the reproducible `build_gymbro_r4.py` script**.
- Changed entries: `art/gym-bro/special/01.png` through `06.png`; all six 512×512 RGBA PNGs retain foot grounding at y=470, with maximum visible bounds inside the canvas.
- Recomputed `PROVENANCE.json` SHA-256 for all replaced frames and updated `QA_REPORT.json` per-frame sizes, bounds, hashes and 64-bit preview perceptual fingerprints.
- Independent archive validation passed **31 actions, 120 frame images, 10 1600×900 story scenes and matching SHA-256 checksums**. Six special frames have distinct binary images and visibly different move phases.
- Automated **previously flagged special/02–03 similarity issue is now superseded**. Remaining manual-review findings: **12**, including the unresolved jump-apex clipping review, idle/locomotion near-similarity, some punch near-similarity, plus other low-detail/composited art. A source sheet is not itself an approved finished clip.

The R4 offline ZIP is delivered in this ChatGPT conversation, **not pushed to GitHub as image binaries or enabled in production**. To use, load the **R4 ZIP** on `v7-1-art-lab.html` using the local browser file chooser, and compare against the rig. Any updated soundtrack, combat frame timing or story dialogue must remain unaffected. The development and production manifests retain existing verified art until actual binary assets pass acceptance and are committed.


## R5 — high-resolution jump-apex replacement (latest offline candidate)

**R5 supersedes R4.** The original `jumpApex/01.png` contained a small blurry airborne figure touching the top pixel boundary (alpha bbox y=0). A purpose-generated, isolated transparent full-body Gym Bro pose has been cropped and resized to 512×512 RGBA, with no cut-off limbs and a **30-pixel top margin**. The new alpha bounding box is **[163,30,349,342]**, keeping the fighter visibly airborne rather than pretending his feet touch the grounded anchor.

- Latest candidate ZIP: `GymBro_V7.1_Artwork_Candidate_Pack_R5.zip` — **26,972,681 bytes**, SHA-256 `8fa297fcb00986eb73174613726417d6a1f0a49615ff669bc334bb12da4eb841`.
- Updated source ZIP: `GymBro_V7.1_Source_Artwork_Archive_R5.zip` — SHA-256 `923b98d320c388015c6c13736244bb825b470535eda04d9ec02bfbc174818a98`.
- Replaced PNG: `art/gym-bro/jumpApex/01.png`. New image SHA-256 `a4fc9967e1d950cdad2e2006b767b722d7e2c808f40cde48a70272360bcd3756`.
- The unmodified full-resolution input PNG and `build_gymbro_r5.py` reproduction script are included in the source archive. Original R4 images remain intact in their own archive.
- Independent offline package check: **138 ZIP members**, **31 actions / 120 RGBA frames**, ten 1600×900 scenes; all per-file provenance and story hashes match.
- R4's jump-apex boundary-clipping warning has been removed from `QA_REPORT.json`; **11 visual-review findings remain**. Strict image production approval has **not** been granted.
- GitHub branch adds `tools/inspect-gym-bro-art-zip.py` to run read-only binary/margin/provenance audits; its CI uses synthetic data for the importer and does not certify real R5 artwork.
- Open `v7-1-art-lab.html` from the branch preview and load the R5 ZIP to evaluate the replacement in the actual unchanged game renderer. The ZIP stays on the user's computer and is not transmitted to Vercel.

**Critical:** This updates one image pose, not the entire jump animation or story. Near-identical idle/locomotion/punch frames and low-quality story composites remain unresolved; no R5 binary images have been uploaded into GitHub's active asset tree or promoted to production.


## R6 — complete six-frame forward-walk reconstruction (2026-11-15)

**R6 is the current offline candidate, superseding R5.** All six `walk/01.png` through `walk/06.png` were rebuilt from one newly rendered **1536 × 1024** six-pose, right-facing source sheet. Each source cell is 512 × 512. The frames depict successive rightward strides with different foot-plants, passing and recovery poses. All retain the same outfit, camera, foot baseline at y=470, and combat engine locomotion timing; the screenshots are for **visual QA** only.

- Candidate archive: `GymBro_V7.1_Artwork_Candidate_Pack_R6.zip` — **27,042,361 bytes**, SHA-256 `516bbbec31cd0198a3862dfaae3e5f08f3061919e179a995245087a50d60959c`.
- Source archive: `GymBro_V7.1_Source_Artwork_Archive_R6.zip` — **30,192,709 bytes**, SHA-256 `b411877e4254635a15776d763ceb5ebf2ea04a502e7ebcbbd4dd82c226003c9f`.
- Complete standalone reproduction script: `reproduction_scripts/build_gymbro_r6.py` in the source archive; original source sheet preserved as `source_art/a_clean_composited_sprite_sheet_style_image_an_ov.png`.
- All six new images are **512 × 512 RGBA**, with alpha bounds ranging from x=74..438, y=80..470. The magenta-key spill was reduced by applying a strict chroma mask and pixel decontamination; the source images are original keyposes, **not motion interpolation**.
- The automated 64-bit pose-fingerprint comparison found **no within-walk pair with Hamming distance ≤5**. This does not replace human timing, stride and foot-sliding review.
- `QA_REPORT.json` and `PROVENANCE.json` contain updated exact checksums, bounding boxes, source references and per-frame replacement evidence; SHA-256 verified for all 120 frames and all ten 1600 × 900 story images.
- Existing R5 `walk/03–04` similarity warning is superseded; **10 manual-review warnings remain** (idle, dash-back, light and heavy punch pose similarity). Other quality concerns — source softness in some attacks and low-quality story composites — remain release blockers.

**Not yet live:** the R6 binary ZIP is a ChatGPT conversation deliverable and has not been committed to the GitHub source tree or activated in the default V7.1 manifest. Use the existing `v7-1-art-lab.html` preview to load it locally for side-by-side verification. Only a completed visual and runtime review can authorize binary integration and a Vercel production promotion.


## R7 (current) — six dash keyposes, truthful fragment audit, safe preview

**Candidate binaries, NOT committed to GitHub:** `GymBro_V7.1_Artwork_Candidate_Pack_R7_QA.zip`, SHA-256 `7f1788d74fe08b1a908309715d13ae57d7ff5d8926f559b0a6b0522439b57c2d` (**27,266,735 bytes**). The source archive `GymBro_V7.1_Source_Artwork_Archive_R7.zip` has SHA-256 `410a8d89898004c59e1c5c88f68f9219c42d6eea3bc9aecafce32afd9a193ce5` (**31,975,657 bytes**).

- New `dashF/01–03.png` and `dashB/01–03.png` come from one 1536×1024 six-pose original source sheet; all six are unique 512×512 RGBA and have one large connected figure silhouette. Source and Python extraction are included in the source archive.
- Independent image-component QA measured the old R6 dashF detached-alpha fractions of 15.3% and 20.6% for frames 01 and 02, versus **0% for all six R7 dash sprites**; the prior near-identical R6 dashB 02/03 dHash distance of 2 increased to 21 in R7.
- **However the broader inspection found a previously missed defect class**: 17 other potentially fragmented frames in `airK`, `airP`, `hk`, `intro`, `jumpDown`, `launcher`, `super`, and `victory`. A second independent pHash pass also retains 9 similarity warnings (idle and punches). These 26 combined issues are recorded in the R7_QA `QA_REPORT.json`.
- R7_QA explicitly records `blocked_actions` for those eight damaged action groups. The updated `v7-1-art-lab.html` loader validates all 120 image checksums but **withholds those eight action groups**, using the original engine rig fallback instead of displaying corrupted sprites. Expected opt-in preview: **23 candidate animation actions / 8 fallback actions**, and ten scene images for comparison only.
- Original R7 (before adding the full QA evidence) was SHA-256 `06cbf14a10164d224af58fd1a8db0f2b46a754dd2913bbb6e8ae16a4dc03664b` and is superseded by R7_QA.
- Repo tool `tools/check-gym-bro-components.py` checks whether candidate PNGs contain multiple large detached foreground components; its strict mode fails if missing or suspect images are found. CI tests this tool on a **synthetic** 120-frame fixture only; it does not claim that R7 passes strict QA.
- Source-of-truth mechanics, the original V7 game and Vercel production are not modified.

**Further blockers:** reconstruct all damaged pose sequences with correctly attached limbs and separated VFX; replace repeated idle/punch keyposes and unapproved low-resolution story composites; commit *actual verified binary images* to GitHub; test full 60 Hz combat, controls, story to credits, and Vercel storage; then merge and deploy. No production promotion on this revision.
