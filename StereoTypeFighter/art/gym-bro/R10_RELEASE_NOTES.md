# Gym Bro V7.1 R10 animation release candidate

Status: DEVELOPMENT PREVIEW ONLY. Production manifest untouched.

- Newly rebuilt `airK` frames 01–04 (chamber, side kick, follow-through, guarded recovery)
- Newly rebuilt `jumpDown` frames 01–02 (descending preparation, defensive landing approach)
- All six files are **actual 512×512 RGBA PNG binaries committed to this GitHub branch** at `art/gym-bro/<action>/NN.png`.
- Source: original `1536×1024` 3×2 right-facing, magenta-key motion sheet.
- Source checksum (SHA-256): `f8d3cc4f7a6c71025399abef98a372fc345e32187cb42e71a9acb5caffa5a6d3`.
- Technical checks of six individual PNGs: 0 clipping, 0 large disconnected components, 0 significant magenta spill, 0 within-action 64-bit dHash near-duplicate pairs; all feet anchored at image y=470.
- The underlying `combat-v7.js` remains authoritative for move hit/hurt boxes, attack startup/recovery and 60 Hz state changes. No mechanical changes were made.
- Opt-in URLs: `v7-1.html?gymBroAirK=1&gymBroJumpDown=1` and optionally combine with `gymBroLauncher=1&gymBroAirP=1`.
- Default V7.1 continues to use its original validated/fallback animation paths.
- Full R10 candidate ZIP SHA-256: `84c415ba372b8463ee4666f73c0639f2305f5c33e60a913b12486a2864cc5d77` (27,961,505 bytes), includes 31 actions and 120 candidate frames, 10 cinematic candidates, portrait and hero. **Not itself committed into the served bundle**.
- Supplemental R10 source/reproduction ZIP SHA-256: `6b9c4ec8b9f76b3911962e7012b9e3e6843a24a79b3adfae8d4ff8e6b0312e0d`.
- Remaining from R9 candidate QA blocked actions: `airP`, `hk`, `intro`, `launcher`, `super`, `victory`. Some of these have separately committed technical previews but still await visual signoff.
- Pending: full 31-action art QA, ten bespoke scenes, portrait integration, controller and real four-fight story to credits, preview/public access and Vercel Hobby storage checks. Do not promote this draft PR.

Detailed cryptographic frame checksums and original crop mapping are in `R10_TECHNICAL_QA.json`; the source archive preserves the extraction script.
