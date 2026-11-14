# Gym Bro V7 — artwork and release gate

**State:** development / **not approved for production**  
**Branch:** `feature/gym-bro-v7-art-qa-20261115`  
**Fighter ID:** `gym-bro` / Tyler  

## Verified canonical configuration

Source of truth: `roster-v7.js`, `tools/cast_data.py`, `story-v7.js` and `art/manifest.v7.template.json`.

- Style field in repository: **Fitness Brawler** (request calls this Power Striker; do not silently replace the existing style).
- HP 1100, speed 0.94, jump 13.0.
- Special: **Protein Shaker Blast**, projectile speed 6.2, base damage 13, projectile 46 × 34, Y 88; move startup 14, recovery 26.
- Super: **Leg Day Tsunami**, tick hits `[0,6,12,18,24]`, finisher damage 24, launch 11 and knockback 13.
- Selected light and heavy attacks: Pump Jab, Bicep Cross, Quad Axe, Deadlift Uppercut.
- Fixed simulation rate: 60 Hz.
- Rivals, in source order: `bogan-tradie`, `yuppie`, `fat-gamer`, `cheerleader`.
- Existing fixed story scene: `prologue:gym-bro`, at the 24/7 gym. Preserve dialogue unchanged.
- Other fight and ending scenes must be resolved by live story engine and original source data, without inventing new lines.

## Provenance and source identity

| Asset | Repository path or provenance | SHA-256 | Status |
| --- | --- | --- | --- |
| Contact sheet | `Gym Bro Fighting Game Sprite Sheet-3.png` (conversation source; see `art/ART_SOURCE_INVENTORY.md`) | **unavailable** — original bytes have not been supplied in this runtime | Not verified |
| Legacy imported strips | `art/gym-bro/strips/{idle,walk,jump}.png` | pending binary download/hash | Present on main, quality not certified |
| Cinematic full-body concept | generated in conversation, `a_highly_detailed_cinematic_realistic_photoreal.png` | `f85aba77bcd358190d835985a83372cd31de11637a011d49916f2b2aac6106fe` | Candidate reference only; not committed |
| Runtime portrait | `art/gym-bro/portrait.png` | unavailable | Missing from GitHub |

The generated concept measures **1024 × 1536 RGB**. It is **not** a transparent runtime frame and must not be relabelled as one.

## Asset audit

The existing `art/manifest.json` registers seven Gym Bro animations: idle (8), walk (7), prejump (2), jumpUp (2), jumpApex (1), jumpDown (1), land (1) — **22 referenced frames**. Existing binary directory listings corroborate idle and walk, but all dimensions, alpha and subjective quality still need local checking.

The complete template lists **31 unique animation IDs / 120 required frames**. This template and the currently active manifest have different counts for some early actions. On upgrading, first validate the engine's mapping, then adopt the template counts only after supplying each distinct required frame. Do not create missing-frame entries just to increase reported coverage.

### Required 31 actions

`idle`, `walk`, `walkBack`, `dashF`, `dashB`, `crouch`, `block`, `blockLow`, `prejump`, `jumpUp`, `jumpApex`, `jumpDown`, `land`, `lp`, `lk`, `hp`, `hk`, `launcher`, `sweep`, `airP`, `airK`, `hurt`, `hurtLow`, `launched`, `knockdown`, `ko`, `getup`, `special`, `super`, `victory`, `intro`.

## Identity lock for future authoring

Tan-skinned, extremely muscular original adult gym-goer; backward black cap over short dark hair; vivid yellow GYM BRO sleeveless top; black athletic shorts; black wristbands; white crew socks and white trainers. Same identifiable face, build, skin tone, cap placement and costume across combat frames, select-screen portrait and cinematic scenes. Lighting, camera distance and pose may change without altering identity.

## Reviewer tool

Open `gym-bro-v7-art-qa.html` from an HTTP-served checkout or branch preview. It uses the real roster definition, renderer rig and live manifest, and can inspect each *currently registered* frame. It intentionally does not claim imported frames are approved.

## Release checks (mandatory)

- [ ] Recover and archive actual original contact-sheet binary; record its SHA-256.
- [ ] Establish and review locked identity turnaround.
- [ ] Generate/repair each required distinct 512 × 512 right-facing RGBA animation frame.
- [ ] Verify pose uniqueness, foot registration, frame continuity and transparent edges.
- [ ] Create real portrait, full-body hero and scene illustrations; preserve dialogue and rivalling order.
- [ ] Update only Gym Bro asset manifest mappings once files exist.
- [ ] Run `python tools/check-v7-art.py` in a complete checkout.
- [ ] Run repository automated gameplay/tests; verify 60 Hz mechanics unchanged.
- [ ] Test keyboard, controller, full fight and four-fight story to credits.
- [ ] Preview deploy, check browser console, actual asset URLs, UI and storage budget.
- [ ] Promote to production **only if** checks succeed and record deployment URL, final SHA, image counts and defects.

**QA result:** Not release-ready. The new reviewer page is a development aid, not a substitute for character integration.

## Latest verified automated audit (2026-11-15)

GitHub Actions job: https://github.com/BartAndrew/RetroGames/actions/runs/43646062270

- Current manifest references **7 actions / 22 frames** for Gym Bro.
- Template requires **31 actions / 120 frames**; only **18 / 120** matching template slots currently have assets, since some active counts differ.
- **0 / 10** story images and **no** character portrait found.
- **0** technical image findings and **0** byte-identical pairs within the template-mapped frames.
- All **8** existing unit tests passed; Gym Bro source-of-truth and 480-tick deterministic smoke tests passed.
- Repository-wide V6.6 layout CI has a separate pre-existing failure and must not be presented as a release pass.
- Coverage report: uploaded CI artifact `gym-bro-v7-coverage`, generated by `tools/audit-gym-bro-v7.py`.

**Important:** the audit is informational in development mode. A production release must run
`python tools/audit-gym-bro-v7.py --strict` *and* manual visual, controller,
story-to-credits and live browser tests. Do not activate missing manifest slots
to make a coverage number look better.
