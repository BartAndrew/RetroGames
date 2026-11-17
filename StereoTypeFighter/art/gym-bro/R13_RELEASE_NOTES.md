# Gym Bro V7.1 R13 — identity-locked Victory animation

**Development preview, NOT production approval.**

## Character continuity

All four sprites show the same tan, extremely muscular male fighter, with brown/dark hair under a backward black cap, bright yellow sleeveless `GYM BRO` tank with black lettering, black shorts with white stripes, black wristbands, striped white socks and white athletic shoes. His face remains angular and strong-jawed. Small expression changes are appropriate during celebration; the **realistic portrait/hero face mismatch remains unresolved** and is not certified by this sprite-only check.

## Four deliberate keyposes

1. Bent over, hands on knees, taking a victorious breath
2. Upright single-bicep flex, other hand braced on hip
3. Roaring double-biceps pose, shoulders raised and chest open
4. Guard restored with shoulders squared, ready to fight again

## Source and validation

- Approved appearance reference: earlier R11 intro / R12 high-kick sprite designs.
- New unchanged single-generation 1254×1254 2×2 magenta-key source image SHA-256: `db4540773010a7ab04678476f0273f3d87a2536baf1d0c9034af6cd9d4ef0327`.
- Four exported 512×512 RGBA PNGs are in `art/gym-bro/victory/01–04.png`, with a shared extraction scale and common foot baseline y=470.
- Standalone source archive: `GymBro_V7.1_Source_Artwork_Archive_R13.zip`, SHA-256 `a60f8a771a3cff859bf80a9ffdf52e0bb23c98b44c246ccb553650fbca852dbe`, contains unchanged generated sheet and Python source/packing scripts.
- Complete **offline** candidate `GymBro_V7.1_Artwork_Candidate_Pack_R13.zip`, SHA-256 `b9f9a5b020f074fc98868e72b5d7cad798b1134c015e6c7a6cf72d4b95cfe3f0` (28,302,933 bytes), has 31 action definitions, 120 candidate frames and ten scene images; it is **not** Git-committed or active by default.
- The action-specific PNG technical check verifies per-file SHA, transparency, connected body, grounded foot, margins and distinct poses (64-bit dHash min 7). Zero significant magenta spill or detached sections.
- R13 candidate metadata removes four old detached-victory findings; **17 other review findings remain**, notably `super/04-06` VFX contamination and idle/punch similarities. Victory stays on the candidate blocked list until human visual/gameplay approval.

Preview: `v7-1.html?gymBroVictory=1`; compare: `gym-bro-v7-art-qa.html?r13=1`. Never alter canonical move damage, five-hit super timing or story dialogue based on static artwork. Previous playable versions and production must be preserved.
