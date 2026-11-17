# RetroGames branch consolidation — 18 November 2026

Both legacy development branch histories are retained as merge parents on main:
- demolition-man-playtest-v1 (already mirrored into production files; main wins for previously merged code).
- feature/gym-bro-v7-art-qa-20261115 (V7.2 game files were already promoted to main; current main wins on conflicting engine files).

Unique Gym Bro candidate PNGs from the development branch were **archived rather than activated**:
- `source-art/gym-bro-v7-1/branch-candidates/gym-bro/` — animation keyframes and portrait (unapproved).
- `source-art/gym-bro-v7-1/branch-candidates/scenes/` — concept story illustration (unapproved).
- `source-art/gym-bro-v7-1/tests/` — preview tests tied to unapproved binary paths.
- The development GitHub Action YAML was archived, not registered as a live workflow. Keep stable production CI on main.

To trial any archived sprite, explicitly copy into `StereoTypeFighter/art/gym-bro/<action>/NN.png` after QA, update the manifest only when the complete sequence is approved, and run scene/controller/sprite checks on a branch. Do not enable candidate portrait or story art by merely merging a branch.

Current accepted release: V7.2 procedural Gym Bro rig, 31 named states, 60 Hz combat, four-rival story, improved select.
Outstanding art release: 120 distinct audited RGBA frames, art-directed character select portrait, 10 story illustrations and reviewer visual signoff.
