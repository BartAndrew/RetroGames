# Gym Bro V7.1 — R11 introductory animation repair

This is **development candidate artwork**, not a production sign-off.

The original 1536×1024 V7-aligned source `a_clean_composite_sprite_sheet_a_3x2_grid_comic_a.png` is preserved without alteration in the R11 source archive. Four distinct source cells (1, 4, 2, 0) were extracted, chroma-keyed, resized without distortion and grounded to 512×512 RGBA images with foot baseline y=470. The phases are crouch/warm-up, flex, raised guard, ready stance; combat and story data remain unchanged.

Committed paths: `art/gym-bro/intro/01.png`–`04.png`. The original source SHA-256 is `6d7ce258601c863557c42f69ef7abc3b3b4c5e8375c17a95acac009acb59b13d` (verified against the unchanged original source image).

Per-frame checksums, in order:
- `cc0678b6710194bf1303eb8a0c56759ceb055a1f4ea915006b0548f54debf3ed`
- `ff4e0f7721cd3a5ad7685b64d8906ce55f83aa5bdd75ace7223b002685365128`
- `44432c08db4f938ed702ac68d4ba5c4ec012cdd03c03cb233b20a3ae828c071b`
- `21e0b558371210105a0a809ebc03688d70acaf09bdd820ee13482a236b8d1fb8`

Technical QA: 4/4 pass RGBA dimensions, margins, foreground connectivity (single 128px connected component), zero major clipping and no dHash near-duplicates (minimum pair distance 7). The default V7.1 manifest is unchanged. To preview, use `v7-1.html?gymBroIntro=1` or `gym-bro-v7-art-qa.html?r11=1`; compare against actual rig and test story flow.

Offline R11 ZIP: `GymBro_V7.1_Artwork_Candidate_Pack_R11.zip` (28,070,591 bytes), SHA-256 `5a3ffc2046f5cef5610741687c49f2db4a705fb9581b87b2322ea7805770414b`. Source ZIP `GymBro_V7.1_Source_Artwork_Archive_R11_intro.zip` (1,696,978 bytes), SHA-256 `4e98d6fed5a814a6e7b05d3f55700eea605d48440693384d51043588bb386b07`.

Remaining candidate QA flags: 20 (R10 had 22). Still blocked in the R11 pack: `airP`, `hk`, `launcher`, `super`, `victory` and unapproved individual story composites. A source extraction does not certify all four pose transitions or a complete cutscene; manual QA and strict release gates remain required.
