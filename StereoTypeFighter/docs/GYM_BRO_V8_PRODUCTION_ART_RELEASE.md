# Gym Bro — V8.0 production artwork patch (18 November 2026)

The V8.0 default and `v8.html` now use `art/manifest-v8.json` and
version-isolated assets under `art/v8/`. Historical V7, V7.1, V7.2, their
artwork and gameplay remain unchanged.

## Released
- **28 genuine 512×512 transparent RGBA sprite frames**: `airP` (4),
  `airK` (4), `hk` / Quad Axe (6), `launcher` / Deadlift Uppercut (6),
  `intro` (4), and `victory` (4). All are sourced from the consolidated
  Gym Bro candidate branch, with the original blob bytes preserved.
- **1 realistic character-selection portrait**: 900×1200 PNG, black backward
  cap, bright yellow `GYM BRO` tank, muscular tan build, black shorts.
- **1 illustrated prologue**: 1600×900 PNG showing Tyler at the 24/7 gym.
  Its existing canon dialogue and location text remain unchanged.
- **25 rig-rendered action states remain**. The previous dark-tank,
  no-cap idle/walk images do not activate in V8; the approved yellow-kit
  procedural rig fills all unreleased actions (including idle, walk and super).

## Quality evidence
GitHub artifact: `source-art/gym-bro-v7-1/qa-v8/REPORT.json`, generated
from real PNG bytes on CI. **28/28 frames** passed size, RGBA, grounded
silhouette/anchor, alpha, detached-body and byte-uniqueness checks. Reference
montages, portrait and scene previews accompany the report. A visual inspection
confirmed the yellow top, backward cap, shorts and athletic silhouette across
those frames and realistic images. Near-identical windup/recovery pairs, some
neon colour-edge fringing and differences between 2D sprites and procedural
rig movements remain **known polish limitations**, not hidden defects.

This is a **user-requested staged production art release**. It is **not** a
claim that all 120 target sprite frames have been completed, that remaining are resolved, or that the nine remaining story illustrations
exist. The canonical 31-action/120-frame artwork target therefore remains
partially complete: 6 sprite sequences / 28 distinct frame files are live;
25 actions / 92 target frames still require artwork. One of ten scene
illustrations is live.

## Implementation and rollback
- V8 only: `window.SF_RELEASE.version === '8.0'` selects
  `./art/manifest-v8.json` and routes cutscene images to `./art/v8/scenes/`.
- Historical V7.1 and V7.2 entry points keep their previous art behavior.
- `?gymBroRig=1` on V8 provides a procedural rig comparison for combat.
- Missing, late-loading or rejected sprite frames fall back to the rig,
  not an invisible character.
- Original source images remain in
  `source-art/gym-bro-v7-1/branch-candidates/`.
- No deterministic 60 Hz combat data, hitboxes, damage or rivalry dialogue
  changed.

## Release checks
- `npm run test:unit` including `gym-bro-production-art-v8.unit.mjs`
- `npm run test:browser:release` including `v8-art-release.spec.mjs`
- Staged `tools/build_site.py` plus `tools/prune-v66-site.mjs`
- Production Vercel commit SHA and image URL checks.

The 120-frame sprite-and-cutscene art delivery is still an independent
follow-up milestone. Continue to use the `docs/FIGHTER_PRODUCTION_PLAYBOOK_V7.md`
for next-character replication.
