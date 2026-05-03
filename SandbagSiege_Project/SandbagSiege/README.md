# Sandbag Siege

Sandbag Siege is a browser game inspired by fast-paced shooting gallery arcade games from the late 1980s and early 1990s.

## Game idea

- The player defends a ridge from behind sandbags.
- Infantry, snipers, trucks, jeeps, tanks, helicopters, and a final gunship boss attack in waves.
- The default weapon is a sniper rifle.
- The support slot can unlock machine guns, flamethrowers, missile launchers, and grenade launchers.
- Grenades stay as a separate throw action so students can see how a game can have multiple weapon systems.

## Controls

- Mouse: aim
- Left click: fire
- `Space`: pop up or hide
- `1`: sniper rifle
- `2`: support weapon
- `Q`: cycle support weapon
- `G`: throw grenade
- `R`: reload
- `P`: pause

## Teaching angle

This project is heavily commented so younger students can trace how:

1. data is stored
2. input changes game state
3. the update loop moves objects
4. the render loop draws the frame
5. sprite sheets are loaded and displayed

## Files

- `index.html`: page structure
- `style.css`: layout and retro presentation
- `game.js`: the game logic
- `assets/generate_svg_assets.py`: creates the sprite sheets
- `assets/*.svg`: retro sprite sheets used by the canvas
- `docs/TEACHING_NOTES.md`: plain-English walkthrough for lessons
