# Crown of Cinders: story bible and art reference

## Premise
For a thousand years the **Ember Crown** burned above the Dawn Order's keep and held the ash-storms beyond the mountains. **King Vael** lifted it onto his own brow. The flame consumed him and he conquered the realm as the **Cinder King** (his soldiers still call him the Cinder Warden). The Order's four champions rode out to end him. Three fell. The one you choose is the last.

## Cast
| Who | Role in the story | Fighting style |
| --- | --- | --- |
| **Astrid** | Spear maiden, heir of the frontier. Default lead. | Reach, fast thrusts, whirlwind and flurry finishers |
| **Iron Warden** | Knight of the Order. | Balanced sword and shield |
| **Ash Berserker** | Champion of the northern holds. | Slow, heavy axe |
| **Moonblade** | Spellblade. | Fast cuts, strong magic |
| **King Vael, the Cinder King** | Final boss. Crown-bound tyrant. | Guard-breaking slams; enrages at half health |

Whichever hero you pick is the protagonist. The other three appear as the fallen (prologue) and as spirits who guide and thank you (woods, throne approach, ending). Names in the script are filled in automatically.

## Structure
| Scene | Trigger | Backdrop | Beats |
| --- | --- | --- | --- |
| `prologue` | Hero confirmed | The Burning March | Title card, the crown's legacy, the fallen champions, the last champion walks out |
| `stage1` | Burning March cleared | The Forgotten Woods | Spirit of a fallen champion warns of Vael's warband; the hero's vow |
| `stage2` | Forgotten Woods cleared | The Cinder Throne | The keep of black glass; the crown feeds on flame; "let it burn out here" |
| `boss` | Hero reaches the throne hall | The Cinder Throne | King Vael: "Another candle come to my hall." / "The last one." |
| `ending` | Boss defeated | Throne, then dawn over the Burning March | The crown goes out; the spirits stand with the hero; dawn |
| `fallen` | Hero dies | Current stage | The oath outlives its champions; another will rise |

Cutscenes can be advanced with Enter, Space, J, K or a click/tap (gamepad A), and skipped with Esc (gamepad B or Start). The script lives in `story.js`; the engine is in `game.js` (`playScene`, `drawScene`).

## Visual direction
- **Backdrops** are the painted, realistic stage plates (see `backdrops/`). Cutscenes pan and push in on them like a slow camera move.
- **Grade by scene:** ember (warm orange), ash (desaturated grey), cold (teal woods), dusk (violet), inferno (red, boss), dawn (gold, ending).
- **Cinematic treatment:** 2.2:1-style letterbox bars, ground haze, vignette, film grain, drifting embers / ash / spirit motes, a white flash on the king's last line.
- **Characters** are the pixel-styled rig heroes (`characters/`) composited over the painted plates. Spirits are drawn translucent with a cold glow; the fallen are dimmed.
- The Cinder King uses the boss sprite from V1.5. There is no photographic or AI-generated art in this repo; "realistic" here means the painted backdrops plus lighting and grading.

## Files
- `characters/*-reference.png`: pose sheets (idle, walk, three lights, heavy, finisher, magic, hurt, death) with palette swatches, rendered from `rig.js`.
- `backdrops/stage-1..3.jpg`: the three stage plates.
- `storyboard/*.jpg`: every cutscene shot as it plays (shown with Astrid as the hero); `storyboard-contact-sheet.jpg` is the overview.
