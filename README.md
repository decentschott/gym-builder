# 🏀 Gym Builder

A basketball drill catalog with **animated diagrams** and a **practice plan builder**. You tell it your gym (court space, hoops, players, level) and it builds a practice you can run.

Made for phones and tablets on the sideline and for printouts on a clipboard. It works offline once it has loaded.

## What's in it
- **138 drills** in 13 categories, including **Motion Offense** (penetrate → relocate → pass).
- **Animated, step-by-step diagrams.** You can play, pause, step through, and change speed. They use the standard notation: cut, dribble, pass, screen, slide, shot.
- **Gym-aware filtering.** You set full, half, or short court, 1–6 hoops, roster size, and level. The app works out which drills fit and splits players into groups ("3 groups of 4 · one per hoop").
- **Practice plan generator.** Pick 30–120 minutes and up to three focus areas. It builds a timed plan with water breaks, and you can swap, reorder, or resize any block.
- **★ Coach playbooks and templates.** The St. Luke 5th grade CYO practice ships as a one-tap template.
- **Print view** with step-by-step diagram panels, and **copy as text** for sending a plan to your staff.

## Run it
```bash
npm install        # only installs the test runner; the app itself has zero dependencies
npm run dev        # http://localhost:5173 — rebuilds on save
npm run build      # validates every drill, then writes dist/index.html
npm test           # end-to-end tests on phone + tablet sizes (opens all 138 drills)
```
`dist/index.html` is one self-contained file. Host it anywhere, open it from a USB stick, or drop it in an artifact.

## Deploy
Every push to `main` runs CI (validate → build → tests). It then deploys to **GitHub Pages**.

One-time setup: **Settings → Pages → Source: GitHub Actions**. Pages on a private repo needs GitHub Pro or Team; otherwise make the repo public.

On the hosted site, coaches can **Add to Home Screen** to install it like an app. Printing works there too, which the Claude preview doesn't allow.

## Project layout
```
data/
  categories.json     category names + colors
  drills/<cat>.json   the drills (one file per category)
  templates.json      saved practice templates (e.g. St. Luke 11/5)
src/
  engine.js           parses the diagram language → timeline of positions
  draw.js             SVG court, static + animated diagrams
  app.js              UI: catalog, drill detail, planner, print view
  styles.css, index.html
scripts/              build / validate / dev server (no dependencies)
public/               PWA manifest, service worker, icons
tests/                Playwright end-to-end tests
docs/DRILL_FORMAT.md  how to write a drill + diagram
```

## Add a drill
1. Add an object to `data/drills/<category>.json`. See **[docs/DRILL_FORMAT.md](docs/DRILL_FORMAT.md)**.
2. Run `npm run dev` and watch the animation on a phone-size window.
3. Run `npm run build` (the validator explains any mistakes), then open a PR.

Coaches who don't code can use the **Suggest a drill** issue form instead.

**Content rule:** every drill is written in our own words. Never paste text or diagrams from other sites.

## Roadmap
1. Drill and plan importer: paste a link, text, or a PDF practice plan → Claude converts it to the drill format → coach reviews.
2. Coach style profiles learned from uploaded plans (block length, scrimmage share, vocabulary).
3. Accounts and shared plans for coaching staffs.
4. Drag-and-drop drill editor.
5. Season planner and drill-usage tracking.
