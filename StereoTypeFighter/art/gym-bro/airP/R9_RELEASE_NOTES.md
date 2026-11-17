# Gym Bro R9 — Airborne Punch Preview
Development asset only. Not production-approved.

- Four **actual Git-committed** 512×512 RGBA PNGs: `airP/01.png`–`04.png`.
- Original 1254×1254 2×2 high-resolution pose sheet is preserved in `GymBro_V7.1_Source_Artwork_Archive_R9_airP.zip`.
- Source archive SHA-256: `966d115f87880ff5b6c6f6348d5451748d8f3d483e4b473098a2b1d0016d41e5`.
- R9 full candidate ZIP (31 action folders / 120 frames / ten story candidates) SHA-256: `441f726cf499501a13c106c7edcbc596b4970ca31a973aaeea4685cc08dc652f` (27,635,597 bytes). This ZIP is a ChatGPT download and **not** committed to GitHub.
- Source-of-truth animations and hitboxes remain in `combat-v7.js`. The existing V7.1 manifest is unchanged and uses the rig fallback unless the URL has `?gymBroAirP=1`.
- Technical QA: **4/4**, RGBA and dimensions pass, no significant detached components, all grounded-foot anchors y=470, no magenta contamination, no byte-identical frames.
- Human motion review remains outstanding: frames 01/04 and 02/03 have similar outlines (dHash distances 6 and 8). Do not claim smooth motion or visual sign-off from a PNG count.
- Preview example: `/StereoTypeFighter/v7-1.html?gymBroAirP=1`. Existing R8 launcher query `?gymBroLauncher=1` remains independent. Both may be combined.
- Full story scenes, portrait, other seven damaged action groups, controller and story-to-credits acceptance, Vercel storage and production gates remain pending.

See `R9_TECHNICAL_QA.json` and `tools/check-gym-bro-airp-r9.py` for reproducible verification.
