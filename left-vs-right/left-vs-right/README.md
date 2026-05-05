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

Each fighter uses a single SVG sprite sheet with 7 frames:

1. idle A
2. idle B
3. punch
4. kick
5. hurt
6. jump
7. special

You can replace the current placeholder sheets with finished pixel art later as long as each frame stays `48x72` and the frames remain in the same order.

## Run locally

Open `index.html` in a browser, or serve the folder with a simple static server for the smoothest loading behavior.
