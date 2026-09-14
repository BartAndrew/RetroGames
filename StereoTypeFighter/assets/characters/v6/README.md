# Stereotype Fighters V6 character assets

Runtime character atlases for the V6 roster update.

- `lefty-atlas.webp` — Lefty Liberal replacement artwork.
- `agenda-atlas.webp` — Agenda Fluid replacement artwork.
- `gym-bro-atlas.webp` — new Gym Bro fighter.
- `bogan-tradie-atlas.webp` — new Bogan Tradie fighter.

The animation map lives in `../../tools/roster-v6.json`. V6 merges that patch over `roster-v5.json`, replacing Lefty Liberal and Agenda Fluid while retaining the existing fighters and adding Gym Bro and Bogan Tradie.

Each atlas stores frames in sequence order: idle, walk, jump, crouch, punch, kick, special, hurt, block, fall, get-up, victory, followed by a portrait cell. The atlas cell dimensions and frame counts are declared per fighter in `roster-v6.json` so runtime code does not depend on hard-coded image dimensions.

Arena art remains under `../../backgrounds/game/`. `arena-v6.js` resolves those images relative to the page base URL and draws the procedural arena if a stage image fails, avoiding a blank/black arena.
