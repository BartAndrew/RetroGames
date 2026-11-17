# StereoType Fighters — repeatable 20-fighter V7 production pipeline

## How to start the next fighter

From `StereoTypeFighter/`:

```bash
node tools/new-fighter-v7.mjs --id yuppie
node tools/new-fighter-v7.mjs --all
npm run test:unit
```

Outputs are generated under `source-art/fighter-production/<fighter-id>/HANDOFF.v7.json` and **do not affect the live game**. Use `--force` only when intentionally regenerating an outdated handoff. The tool reads existing `roster-v7.js`, `combat-v7.js`, `story-v7.js` and `art/manifest.v7.template.json`; it does not replace canon with generic moves or invented character biographies.

Each handoff records the verified appearance, combat metrics, 31 animation IDs and required per-action frame counts, individual canonical move names/timing, rival ladder, all story scene IDs and a separate image approval status. A file marked `candidate_only` is not production approved.

## Delivery workflow

1. **Lock canon.** Start with the generated handoff and original sprite sheet; record appearance landmarks, provenance and any approved V7 revisions. Preserve user-provided originals.
2. **Create art.** Develop an identity-consistent transparent sprite sequence for each state (startup/contact/recovery for strikes), plus an approved portrait and story illustrations. Use `source-art/` for draft source images, never the active manifest.
3. **QA frames.** Verify actual bytes, 512×512 RGBA transparency, foot anchor, pose uniqueness, temporal motion, costume consistency and foreground edges. Review preview sheets at game scale; do not auto-approve based on PNG dimensions alone.
4. **Wire into engine.** Add fully approved frames to `art/<id>/` and update that fighter's manifest only; never change deterministic damage/hitbox windows to compensate for artwork.
5. **Test gameplay and story.** `npm run test:unit`, `npm run test:browser:release`, keyboard/gamepad, all rival fights, defeat/retry, ending and cutscene skips. The core engine runs at 60 Hz independently of render rate.
6. **Release.** Preview on Vercel, inspect console and assets, measure storage, merge through GitHub CI, publish to Vercel production. Archive every unapproved candidate separately.

## Gym Bro worked example

- **Playable edition:** V7.2 Gym Bro (Tyler) is live with an identity-locked procedural rig covering all 31 combat states, fixed 60 Hz moves and the canonical four-rival story.
- **Required premium art:** The template specifies 120 distinct sprite frames in 31 actions, plus portrait and ten directed story illustrations. These are **not all completed/approved**; the early image candidates were archived under `source-art/gym-bro-v7-1/branch-candidates/` during merge.
- **Canonical attacks:** Pump Jab, Bicep Cross, Quad Axe, Deadlift Uppercut, Protein Shaker Blast and Leg Day Tsunami. Preserve the exact roster/combat values.
- **Source of truth:** `art/ART_SPEC.md`, `art/manifest.v7.template.json`, `roster-v7.js`, `story-v7.js`, `combat-v7.js`.

### Release gates
A fighter is **playable** when its selection, complete action coverage, combat, keyboard/controller and story ladder are verified. A fighter is **visually final** only after every promised source frame, portrait and scene has passed technical review and manual sign-off. Never equate the two.

This contract supports all 20 existing fighters. The next worker chooses an ID, generates its handoff, uses the existing renderer/story engine, produces art, executes the same tests and publishes after review. This avoids rebuilding selection or combat infrastructure each time.
