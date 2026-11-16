# Gym Bro V7.1 R12 — consistent high-kick art development

**Current stage:** development, not production. Preserve all earlier playable versions and game mechanics.

## Actual binaries added in this update

Six `art/gym-bro/hk/01.png`–`06.png` real 512×512 RGBA PNG assets recovered from one **consistent 1536×1024 3×2** artwork sheet. Compared to the R11 crops, the new images show the same Tyler identity, face, cap, yellow GYM BRO shirt, black shorts with white side stripes, wristbands and trainers throughout the kick.

- Six exact file SHA-256 checksums and grounded foot/transparent pixel QA in `tools/check-gym-bro-hk-r12.py`.
- Dedicated browser preview: `v7-1.html?gymBroHK=1`.
- Frame viewer: `gym-bro-v7-art-qa.html?r12=1`.
- Full identity comparison and deviations policy: `art/gym-bro/R12_IDENTITY_LOCK.md`.
- Canonical `hk` move **Quad Axe** remains defined in `roster-v7.js`; damage, active frames, physics, hitboxes and 60 Hz engine are unchanged.

## Technical QA versus visual approval

**Passed:** six exact hashes; 512×512 RGBA; all top/bottom margins; 0 detached figure components; 0 foreground pink spill; yellow/black/white costume landmarks; six nonidentical PNG files. **Remaining visual motion review:** three near-similar pose pairs (01/06, 02/05, 03/04); do not count them as independently approved motion just because there are six files. The original R11 `hk/03.png` and `hk/06.png` fragmentation defects are replaced.

This is an **opt-in** candidate. Neither V7 nor V7.1 production manifest changes until all release gates pass. The R12 full candidate archive (31 actions, 120 sprite frames, 10 story candidates) is still outside GitHub's served bundle and is not evidence of overall character completion. The R12 high-kick source archive preserves the original source file and reproducible extraction steps.

## Additional outstanding release gates

Fix and approve super, victory, idle, light and heavy punch visual issues, plus remaining airP/launcher timing concerns. Validate portraits and all ten individually art-directed scenes featuring the same Tyler, against original story and rivalry canon. Complete strict art QA, physical controller and CPU fights, full story to credits, deployment URL verification, Vercel Hobby size, and production promotion only after all checks pass.
