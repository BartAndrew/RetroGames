# Gym Bro V7.1 — R8 Binary Integration and Animation QA

**Status:** Development preview only, **NOT approved for production**.

## Actual GitHub binary commits (new in R8)

Six distinct 512 × 512 transparent RGBA **Deadlift Uppercut** keyposes are committed to GitHub at:

`StereoTypeFighter/art/gym-bro/launcher/01.png` through `06.png`.

The original, unmodified **1536 × 1024** AI-generated six-pose sheet is archived outside the web-served arcade directory at:

`source-art/gym-bro-v7-1/launcher-r8-source-3x2.png`

- Source PNG SHA-256: `6d7ce258601c863557c42f69ef7abc3b3b4c5e8375c17a95acac009acb59b13d`.
- Reproducible extraction script: `StereoTypeFighter/tools/build-gym-bro-r8-launcher.py`.
- Technical validator: `StereoTypeFighter/tools/check-gym-bro-launcher-r8.py`.
- Script records exact PNG SHA-256 hashes, crop bounds, source panel indices and notes that apex frame 04 uses a same-identity fist reconstruction from panel 03.

### Frame QA

Six distinct SHA-256 fingerprints; 512 × 512 RGBA; single connected silhouette each; all sprites grounded at y=470; no source-colour magenta pixels in visible opaque regions; no edge clipping. These checks passed on the generated binaries locally and are run again against the **real GitHub-committed PNGs** in CI.

**Not a release approval:** Temporal continuity, apex-hand blending and consistent scale need artist review in motion. The combat move timing, hitboxes, damage and deterministic 60 Hz simulation remain untouched.

### Opt-in real-game preview

Open `StereoTypeFighter/v7-1.html?gymBroLauncher=1` on the development deployment. This **explicit opt-in** registers the six R8 launcher PNGs in the existing V7.1 ArtStore, loads the real GitHub PNGs, and preserves all other fighter animations and safe rig fallbacks. Without the query flag, the original V7.1 game remains unchanged. A dedicated Chromium regression verifies both modes and actual 512 × 512 image decode.

### Offline R8 full candidate pack

`GymBro_V7.1_Artwork_Candidate_Pack_R8.zip` (ChatGPT artifact, **not committed as a ZIP**): **27,407,448 bytes**, SHA-256 `42ca3982e3bdf70ceedc385a45a823c17f04ee25a1a760a759923af335a5c338`.

It contains the 31 action directories and 120 candidate frames, ten story-image candidates, portrait and hero. Six launcher PNGs are the new replacements. Its QA report still identifies **15 detached-foreground frame warnings across other actions**, **nine pose-similarity comparisons**, and **one apex fist blending review** (25 current review items). The release remains **blocked**. The file-count does not certify sprite motion or cinematic identity.

The stand-alone R8 source archive in the same conversation, `GymBro_V7.1_Source_Artwork_Archive_R8.zip`, is **1,629,836 bytes**, SHA-256 `8b1969ae5b93e7a514d8702a95c0f50261d1a76244735a09fe7f9d1712093975`. The source image is also permanently backed up inside GitHub.

## Remaining release gates

- Repair and approve the other seven suspect animation groups: `airK`, `airP`, `hk`, `intro`, `jumpDown`, `super`, `victory`.
- Replace real pose duplicates and review the launcher apex fist seam at game speed.
- Replace composited story art with individually illustrated 16:9 scenes and approve all character identities and existing dialogue.
- Commit and inspect all remaining final binaries, update the actual runtime manifest, verify full four-rival campaign, controller and keyboard play, 60 Hz determinism, strict art checks, and Vercel Hobby storage.
- Preserve all prior versions and production while the draft PR fails any release gate.
