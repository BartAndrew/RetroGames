# Teaching Notes For Version 2

## Main idea

This version is a good bridge between a flat 2D game and a 3D-feeling game.

The game world still uses a normal 2D canvas, but each enemy stores:

- an `x` position for left and right
- a `z` position for distance from the player

The code then projects that world position onto the screen.

## Good lesson sequence

1. Open `game.js`.
2. Find the `GAME` object and explain `focalLength`.
3. Find `worldToScreen()` and show how distance changes scale.
4. Find `applyMovement()` and explain how keyboard input moves the player.
5. Find `fireWeapon()` and explain how the game checks hits.
6. Find `updateEnemies()` and explain simple enemy AI.

## Easy student experiments

- Make the player move faster.
- Change the number of medkits.
- Make grenades stronger.
- Change the gunship health.
- Change the colours in the SVG asset generator.
- Add a new enemy type based on an existing one.

## Key programming ideas

- A 3D-looking game can still be built from 2D maths.
- Functions help turn a hard problem into smaller jobs.
- Objects let us bundle game data together.
- Arrays let us track many enemies and effects at once.
- Repeated updates create motion and action.
