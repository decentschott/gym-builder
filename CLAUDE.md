# Baseline (Basketball Practice Planner) — notes for Claude

The app was renamed from "Gym Builder" to **Baseline** on Nov 10, 2026. The repo is still named `gym-builder`; localStorage keys keep their `gb_` prefix so saved plans survive.

The goal: a basketball practice app that coaches actually use on the sideline. Optimize for **phone readability, speed, and simple coach language**. The owner is Ron Schott (high school assistant coach, youth CYO coach). He wants to get to the best version quickly. Make decisions and ship; flag tradeoffs briefly.

## Commands
- `npm run build`: validate every drill + diagram, then bundle `dist/index.html` (single file).
- `npm test`: Playwright e2e (phone + tablet). Locally, set `CHROME_PATH=/usr/bin/google-chrome` if browsers aren't installed.
- `npm run dev`: local server with rebuild-on-save at :5173.

- `npm run test:import`: importer tests that replay `tests/fixtures/*.json` (no API key needed).

Always run `npm run check` (build + importer tests + e2e) before committing.

## Architecture
- The app is **zero-dependency vanilla JS** (ES5-style, no framework, no bundler). Keep it that way unless there's a strong reason. The single-file build has to keep working, because it's also published as a claude.ai artifact.
- `data/drills/*.json` is the source of truth. `src/engine.js` parses the diagram DSL (spec in `docs/DRILL_FORMAT.md`). `src/draw.js` renders SVG. `src/app.js` is the UI.
- `scripts/build.js` injects `GB_CATS`, `DR`, `TEMPLATES` as globals ahead of the source files.
- Gym fit is computed in `fit()` in app.js. Full-court and hoop needs are derived from the diagram; the `hoop` and `one` flags override that.
- localStorage keys: `gb_gym`, `gb_cur` (current plan), `gb_plans` (saved plans). Wrap every access in try/catch; the artifact sandbox can throw.

## Look & design system
- Team colors are CSS variables (`--team`, `--accent`, plus auto-contrast `--team-ink` / `--accent-ink`) set by `applyLook()` from `gb_look`. Presets live in `TEAMS` in app.js (Baseline, St. Luke royal `#1d3fa6` + gold `#f5c400`); "Custom" uses two color pickers.
- Diagram styles live in `THEMES` in draw.js: `classic`, `whiteboard` (marker wobble, magnet players), `neon` (glow filter, holographic players). Every color in a diagram comes from the theme object, so add new looks there. Print always renders in `whiteboard` because it's ink-friendly.
- Animated steps draw their lines first (`.dr` draws on, `.fd` fades in), then the players move. Respect `prefers-reduced-motion`.
- Type: Barlow Condensed (600/800, OFL, `src/fonts/`, inlined at build) for titles and every number; the system UI font for body text. Icons are one 24px line set in `ICONS` (app.js). No emoji in the UI, no all-caps labels, no "a · b · c" meta strings (use icons).

## Importer
- `scripts/import.js` turns links, text, or PDFs/images into drills + templates using the Claude API (tool-forced JSON).
- Each round's output goes through `scripts/check.js` (the same rules as the validator), an 8-word copy detector, and duplicate-name checks. Failures go back to the model, up to 3 rounds; drills that still fail are dropped and listed in the PR.
- `.github/workflows/import.yml` runs it from "Import:" issues. Only owner, member, or collaborator issues trigger it.
- If you change the drill format, update `docs/DRILL_FORMAT.md` (it's part of the prompt), the tool schema in import.js, and `ALLOWED` in check.js.

## Content rules
- Drills must be **original wording**. Never copy text from drill websites. Drill names and concepts are fine.
- `say` is one sentence a coach says out loud (under 160 characters). `how` is 3–5 short steps. `cue` items are 2–5 words each.
- Ron's own drills carry `"src": "St. Luke playbook"` (or similar) and keep his vocabulary: "HUNT", "lift or drift", "feet in the paint", Rip & Go / Jab & Go / Shot Fake + Go.
- Motion offense principles (penetrate → relocate → pass) are a core emphasis.

## Deploy
Pushes to `main` run `.github/workflows/ci.yml`: build, tests, then a GitHub Pages deploy.
