# Left Vs Right

`Left Vs Right` is a browser-playable retro parody fighter built as a sprite-based prototype in plain HTML, CSS, and JavaScript.

## Included in this build

- 4 satirical fighters with distinct move names and color palettes
- single-player versus CPU mode
- local two-player mode
- custom sprite-sheet placeholders stored in `assets/sprites/`
- one self-contained stage, HUD, timer, hit flashes, popups, and rematch flow

## Controls

- Player 1: `WASD` to move and jump, `F` punch, `G` kick, `H` special
- Player 2: Arrow keys to move and jump, `J` punch, `K` kick, `L` special

## Art pipeline

All four fighters now use fuller 16-frame arcade-style sheets:

1. idle A
2. walk A
3. walk B
4. punch
5. kick
6. hurt
7. jump
8. special startup
9. special charge
10. special release
11. dash
12. block
13. taunt
14. victory
15. knocked out
16. crouch

You can replace the current sheets with finished pixel art later as long as each frame stays `64x96` and the frames remain in the same order.

## Run locally

Open `index.html` in a browser, or serve the folder with a simple static server for the smoothest loading behavior.
