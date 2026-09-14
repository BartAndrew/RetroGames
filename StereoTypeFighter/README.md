# Stereotype Fighters - V5.1

A browser arcade prototype using the repository's original character artwork. V5 replaces the string-replacement/eval loader with direct ES modules and a rebuilt character-select interface.

## Play

Serve this folder over HTTP; ES modules and sprite processing should not be opened with file:// URLs.

```sh
# From the repository root
python3 -m http.server 8080
# Open http://localhost:8080/StereoTypeFighter/
```

The Pages workflow stages this game at `/RetroGames/StereoTypeFighter/` and publishes a root redirect from `/RetroGames/`. No framework, bundler, account or game installation is required. Pages publishing still depends on the repository's Pages settings and a successful deployment.

## Character select

All 18 fighters remain available. Select P1 or P2 above the large preview, then click a portrait. Search filters the grid; Random Pick changes the active slot. Both players may choose the same fighter. Selected fighters load first, and Start unlocks only when both selected assets are ready. A failed sprite displays an error and can be retried without stopping other fighters.

Modes: **VS CPU** with Easy/Normal/Hard, **Local 2P**, and **Practice** with unlimited time and special meter. Practice's opponent is a controllable training partner, not an AI.

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right |
| Jump / Crouch | W / S | Up / Down |
| Block | E | I |
| Punch / Kick | F / G | J / K |
| Special | H | L |

P or Escape pauses. R resets Practice. Pause and match-end screens offer a return to character select. The selector also supports WASD for P1, arrows for P2 and 1/2 to change the active slot. Coarse-pointer devices have Player 1 touch controls; local two-player play requires a keyboard. Physical keyboard rollover limits still apply.

## Animation repair

`tools/roster-v5.json` maps each of the 16 full sheets independently; it does **not** reuse Bimbo's coordinates for other fighters. Panels refine their cell boundaries against gutters. Frames are background-cleaned and cached once, with torso/foot anchors, preserved aspect ratio and consistent sequence scale. RapThug and Grunge have additional alpha masks for their textured backgrounds.

Animation timing is local to each fighter and resets when actions change. Walking reverses when retreating. Jump poses follow ascent/apex/descent; landing has a short transition. Attacks have startup, active and recovery periods, nine-frame input buffering, hit interruption, block reactions, knockdown and get-up. KO poses stop on their final frame. Explicit round phases prevent the earlier repeated round-award timer problem.

The **Animation Lab** in the top bar previews every available sequence and supports pause and frame stepping against a ground/pivot guide.

## Current boundaries

This is still a prototype, not a finished arcade animation set. Lefty Liberal and Agenda Fluid retain their older combat atlases: dedicated walk/jump/crouch/block art is absent, so they use honest neutral/guard fallbacks rather than distorted hurt poses. Some source-sheet actions contain only one or two usable poses. Hand-authored in-between frames, outline cleanup and unique hitboxes would improve them further.

Specials retain their names, source poses, meter cost and character-coloured effects, but currently share a short-range combat implementation; they are not 18 separate projectile/special systems. The stage catalogue and parallax production documents are preserved, but this runtime still uses the procedural Neon Quarter stage.

## Files and QA

- `app-v5.js`: selection, loading, input, dialogs and accessibility.
- `arena-v5.js`: fixed-step combat, rounds and arena drawing.
- `sprites-v5.js`: source-sheet processing and animation rendering.
- `ui-v5.css`: responsive UI.
- `matte-v5.js` / `matte-part-*.js`: compressed alpha-mask polygons.

Run the Chromium checks after installing Python Playwright and a Chromium executable:

```sh
python3 StereoTypeFighter/tools/qa_v5.py --offline --output /tmp/sf-qa
# To test HTTP asset/module delivery as well, with a local server running:
python3 StereoTypeFighter/tools/qa_v5.py --url 'http://localhost:8080/StereoTypeFighter/?test' --output /tmp/sf-http-qa
```

`--chromium` overrides the executable path. `--extract` exports frame sheets and source rectangles for art review. See `docs/QA-v5.md` for the executed checks and test limitations. Old v2/v3/v4 files are retained for history but are no longer referenced by index.html.
