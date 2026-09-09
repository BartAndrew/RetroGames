# Sprite atlas notes

The fighter atlases in this folder were derived from the two supplied sprite-sequence images for the prototype.

- Frame size: `96 × 96`
- Atlas size: `480 × 384`
- Columns: `5`
- Rows: `4`
- Transparent background
- Intended rendering: nearest-neighbour / `image-rendering: pixelated`

Frame order:

1. idleA
2. idleB
3. punchWindup
4. punchExtend
5. punchImpact
6. punchRecoil
7. kickLift
8. kickKnee
9. kickExtend
10. kickImpact
11. kickRecover
12. specialCharge
13. specialRelease
14. specialPeak
15. hurtImpact
16. hurtRecoil
17. stagger
18. knockback
19. recover
20. taunt

For this browser prototype, each generated PNG atlas is base64-encoded across small JavaScript chunks (`lefty-atlas-*.js` and `agenda-atlas-*.js`). The chunks concatenate into data URLs before the game runtime starts.

The present atlas reuses poses from the supplied sheets for some generic movement states. Future asset work should add dedicated walk, jump, crouch, block, victory, KO, aerial attack and throw sequences while keeping proportions, palette and pixel treatment consistent.
