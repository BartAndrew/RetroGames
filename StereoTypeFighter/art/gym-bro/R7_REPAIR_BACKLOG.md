# Gym Bro V7.1 — R7 release-blocking artwork repair backlog

**Status:** 2026-11-15, not production-approved. This is a specific repair list, not evidence that visual inspection has passed.

## Current verified offline candidate
- `GymBro_V7.1_Artwork_Candidate_Pack_R7_QA.zip`
- SHA-256: `7f1788d74fe08b1a908309715d13ae57d7ff5d8926f559b0a6b0522439b57c2d`
- 31 action directories, 120 candidate 512x512 RGBA PNGs, 10 candidate story scenes, a portrait and full-body hero
- R7 repaired forward/back dashes with six new coherent poses
- **Image binaries remain outside GitHub.** Candidate count does not imply release approval.

## Blocking: 17 fragmented / VFX-contaminated frames across eight actions

The image-component detector works at 128px alpha-mask resolution, flagging a secondary foreground component >=30 pixels comprising >7% of visible pixels. False positives are possible for separated effects, but VFX must be kept separate from fighter sprites.

| Action | Specific frames | Artist acceptance requirement |
| --- | --- | --- |
| `airK` | 03, 04 | One complete airborne fighter; no foreign legs, second body or cut-out joins; unique kick and recoil |
| `airP` | 04 | Single full-body jumping punch with anatomically attached limbs |
| `hk` | 03, 06 | One coherent high-kick performer; correct foot impact and recovery |
| `intro` | 01, 02 | Distinct natural start-of-fight warm-up poses; no stray floating image pieces |
| `jumpDown` | 01 | Fully connected descending pose, visibly airborne and not confused with landing |
| `launcher` | 05, 06 | Rebuild late Deadlift Uppercut / recovery; do not leave floating shoes or detached opponent artwork |
| `super` | 04, 05, 06 | Restore fully visible Tyler and export distinct impact energy to separate VFX; retain Leg Day Tsunami mechanics |
| `victory` | 01, 02, 03, 04 | Complete full-body poses with coherent finish and celebration, no clipped legs or source-strip decorations |

The image detector result may be reproduced with `tools/check-gym-bro-components.py <R7_QA.zip> --report component-report.json --strict`; failure is expected until repaired.

## Blocking: nine original pose-similarity comparisons

- `idle`: frames 01/05, 01/06, 02/04, 02/05, 02/06, 05/06 — verify breathing loop in sequence and replace true near-duplicates; subtle breathing may be legitimate when physically distinct.
- `lp`: frames 04/05 — must visibly retract rather than duplicate punch recovery.
- `hp`: frames 04/05, 05/06 — finish with clear follow-through and full return to guard.

These pHash results are advisory; an artist must decide whether motion is actually missing.

## Additional story / release blockers

1. Replace the upscaled/composited pre- and post-fight and ending scene candidates with ten separately art-directed 16:9 images, correct rival identities and existing dialogue composition.
2. Recover the original `Gym Bro Fighting Game Sprite Sheet-3.png` source binary if available, with verified SHA-256; do not fabricate provenance.
3. Verify consistent face/body/outfit, grounded [256,470] foot placement (except airborne), normal facing flips, action semantics, transitions, transparent edges and frame-to-frame continuity.
4. Commit *actual approved PNG binaries* in the development branch, not just this checklist; route V7.1 to them only after image audit passes.
5. Run `tools/check-v7-art.py`, strict action/silhouette gates, deterministic combat tests, real keyboard/controller fights and story-to-credits.
6. Verify Vercel preview asset URLs and Hobby storage; merge and promote only when all release conditions are met. Preserve previous versions and current production.

## Safe work completed

The development Art Lab imports ZIPs locally, verifies per-file SHA-256, and now holds back the eight damaged action groups with the actual engine rig fallback. The four-rival story-navigation browser regression uses test-only injected wins; it is **not** a real four-match controller acceptance test.
