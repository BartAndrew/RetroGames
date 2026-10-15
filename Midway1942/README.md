# Midway 1942: Reforged

**Independent playable browser arcade tribute inspired by Capcom's 1942 (1984) and 1943: The Battle of Midway (1987).** Not affiliated with or endorsed by Capcom. No original sprites, code, ROMs, or soundtrack from those games are used.

## Play

- [Play Midway 1942 Reforged on GitHub Pages](https://bartandrew.github.io/RetroGames/Midway1942/)
- [RetroGames arcade](https://bartandrew.github.io/RetroGames/)
- Requires a recent browser only, no installation or account. Sound is muted by default.

## Controls

| Action | Keyboard | Touchscreen |
| --- | --- | --- |
| Start/restart | Enter or launch button | Launch button |
| Fly | WASD or arrows | Drag in game area |
| Machine guns | Hold Space or J | Automatic fire |
| Bomb (damages all enemies and clears bullets) | X or Shift | BOMB |
| Evasive barrel roll | Z | EVADE |
| Pause/resume | P or Escape | Pause button |

## Gameplay

- Player flies a P-38-inspired twin-boom fighter with 100 hull points, 3 bombs, 3 evasive rolls and four weapon levels.
- Enemies include conventional fighters, weaving aces, heavy bombers, patrol destroyers, coastal gun batteries, and flagship aircraft carriers with multiple gun mounts.
- W pickup improves weapon firing, + pickup repairs 30 hull, B pickup adds one screen bomb.
- After approximately one minute the stage flagship arrives. Sinking it advances to progressively harder operations.
- High score is saved in localStorage where permitted, otherwise the game still works.

## Files

- index.html — responsive standalone game page, HUD, start/pause overlays.
- style.css — themed layout and touch UI.
- game.js — original dependency-free Canvas 2D engine (720x960 logical resolution), procedural terrain, boats and aircraft, bullets, AI, particles, keyboard and pointer controls, synthesized sound.
- cover.svg — original promotional art illustration.
- favicon.svg — original fighter icon.

## Limitations and future upgrades

This is a playable illustrated/procedural v1, not photorealistic 3D. Future improvements could add carefully authored high-resolution aircraft models, normal-mapped lighting, WebGL/WebGPU backgrounds, atmospheric weather, gamepad controls, expanded carriers, scripted campaign missions and multiplayer.

## Build and deploy

Publish this folder unchanged to any static HTTP host. The parent RetroGames site validator automatically includes this folder because its homepage links to it with the data-game-link attribute. Local commands from repository root:

    python3 -m unittest discover -s tools -p test_build_site.py -v
    python3 tools/build_site.py --check
    python3 tools/build_site.py
    python3 -m http.server 8080 --directory _site

Then visit http://localhost:8080/Midway1942/.
