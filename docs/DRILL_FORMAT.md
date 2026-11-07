# Drill format

Each drill is one object in `data/drills/<category>.json`. The file name must match the drill's `cat`. Run `npm run validate` after editing; it simulates every diagram and tells you exactly what's wrong.

```json
{
  "id": "m1",
  "cat": "mot",
  "n": "Drive & Relocate (2-on-0)",
  "lv": "123",
  "p": [2, 16],
  "t": 5,
  "eq": "1 ball per pair",
  "why": "One line: what it builds.",
  "say": "The one sentence you say to players. Under 160 characters.",
  "how": ["Setup", "Step", "Step", "Rotation"],
  "cue": ["Short", "Things you yell"],
  "e": "Make it easier",
  "h": "Make it harder",
  "d": {
    "s": "1 25,30 q2;2 8,20 q2;b:1",
    "st": [
      ["1 d 21,16 22,9;2 c 4,7", "Drive the gap — wing drifts to the corner"],
      ["1 p 2", "Kick it out"],
      ["2 sh", "Shoot"]
    ]
  }
}
```

## Fields

| Field | Meaning |
|---|---|
| `id` | Unique short id. The convention is category letter + number (`m14`, `s15`). |
| `cat` | Category key from `data/categories.json`. |
| `n` | Drill name. |
| `lv` | Levels it suits: `1` beginner, `2` intermediate, `3` advanced. `"123"` means all of them. |
| `p` | `[min, max]` players for one group. The app splits bigger rosters across hoops. |
| `t` | Default minutes. |
| `eq`, `why`, `say`, `how`, `cue`, `e`, `h` | The coach-facing text. Keep it simple enough to read on a phone in the gym. |
| `src` *(optional)* | Marks a drill from a coach's own playbook (shows a ★ badge), e.g. `"St. Luke playbook"`. |
| `also` *(optional)* | Extra categories it should show under, e.g. `["mot"]`. |
| `hoop` *(optional)* | `1` = needs a hoop even if the diagram has no shot. |
| `one` *(optional)* | `1` = always one whole-team group (scrimmages, 5-player sets). |

## Diagram language

Court coordinates are in **feet**. Half court: x 0–50 (sideline to sideline), y 0–47 (baseline to half court), rim at `25,5.25`. Set `"c": "f"` for a full court (y 0–94, second rim at `25,88.75`).

**Handy spots (half court):** top `25,30` · slots `16,28` / `34,28` · wings `8,20` / `42,20` · corners `3,5` / `47,5` · elbows `19,19` / `31,19` · blocks `19,8` / `31,8` · free-throw line `25,19` · dunker spots `16,4` / `34,4` · half court `25,46`

### Setup (`s`): tokens separated by `;`
| Token | Meaning |
|---|---|
| `1 25,30` | Offensive player `1` at (25,30). Any id without a prefix is offense. |
| `x1 25,26` | Defender (drawn as X). |
| `C 25,40` | Coach. |
| `k1 10,15` | Cone. |
| `1 25,40 q3` | Player 1 with 3 more waiting in line behind them. |
| `b:1,3` | Players 1 and 3 start with a ball. |
| `b@25,19` | Loose ball on the floor. |

### Steps (`st`): `[ops, caption]`
Ops within a step happen at the same time. Separate them with `;`.

| Op | Meaning | Drawn as |
|---|---|---|
| `1 c 23,8` | Cut (path can have several points: `1 c 20,20 23,8`) | solid arrow |
| `1 d 30,16 28,8` | Dribble | zigzag arrow |
| `1 p 2` | Pass to player 2 | dashed arrow |
| `1 s 22,28` | Move and set a screen | line with a T-bar |
| `x1 sl 18,22` | Defensive slide | red dashed arrow |
| `1 sh` | Shot at the nearest rim | dotted arc |
| `2 rb 24,6` | Move to (optional) point and grab the loose ball | — |
| `1 h 2` | Handoff | dashed arrow |

The validator flags passes or shots by a player without the ball, unknown players, missing captions, and anything off the court.
