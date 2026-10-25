# Tinker Town Factory

A cozy, endless idle factory game. Built as plain HTML5 + JavaScript (Vite), wrapped into an Android APK with Capacitor in Part 8.

**Status: Parts 0-2 of 9 done** (scaffold, core engine, machines & economy).

## Run it

Requires Node 18+.

```bash
npm install
npm run dev        # opens a local server, play in the browser (phone-sized window works best)
npm test           # unit tests (economy, saving, number formatting, game loop)
npm run build      # production build into dist/
```

Add `?debug=1` to the URL (e.g. `http://localhost:5173/?debug=1`) to get cheat buttons (+1K ... +1T) and `window.game` in the console.

## How to play (so far)

- Tap a machine to run one production cycle; the thread bar fills, then you get coins.
- Spend coins to level machines up. Pick **x1 / x10 / Max** for how many levels to buy at once.
- Machine N+1 unlocks when you own machine N.
- Every 10/25/50/100... levels a machine's output doubles (see `CONFIG.milestones`).
- Progress autosaves every 10 seconds and when you leave the page.
- "Copy save code" / "Load save code" back up progress as text.

## Project layout

```
src/
  core/      state.js (state shape + repair), save.js (versioned saves), loop.js (fixed timestep), format.js (1.2K, 3.4M)
  systems/   economy.js (costs, buying, production cycles)
  data/      config.js (global knobs), machines.js (every machine's numbers)
  ui/        ui.js (rendering), icons.js (SVG icons), styles.css
  main.js    wires it all together
tests/       node:test unit tests
capacitor.config.json   stub, used in Part 8
.github/workflows/ci.yml   runs tests + build on every push
```

## Balancing

Edit numbers only in `src/data/`:

- `machines.js`: `baseCost`, `baseOutput`, `cycleTime` per machine. Price of the next level is `baseCost * 1.15^levelsOwned`.
- `config.js`: price growth, milestone levels, autosave interval.

To add a machine, append an entry to `MACHINES` and add an icon in `src/ui/icons.js`. Saves from older versions pick up new machines automatically.

## Saves

Stored in `localStorage` as `{ v: <version>, data: <state> }`. If you change the shape of the state, bump `CONFIG.saveVersion` and add a migration in `src/core/save.js`. Unreadable saves are kept under `<key>.corrupt` rather than deleted.

## Known limits (by design, for now)

- Numbers are standard JS doubles (max about 1e308). Plenty for this game; formatter switches to `1e40` style past 1e36.
- Machines only run when you tap them. Automation (`auto`) and offline earnings arrive in **Part 3**; the engine already supports `auto`.
- The game pauses while the tab is hidden; Part 3 replaces that with offline earnings.

## Roadmap

| Part | What | Status |
|------|------|--------|
| 0 | Repo scaffold | done |
| 1 | Core engine: state, loop, saves, number formatting | done |
| 2 | Machines & economy | done |
| 3 | Automation & offline income | next |
| 4 | Prestige | |
| 5 | Factory wings | |
| 6 | Daily rewards, quests, achievements | |
| 7 | Polish, sound, accessibility | |
| 8 | Android packaging + APK via GitHub Actions | |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Parts 0-2: scaffold, engine, economy"
git branch -M main
git remote add origin https://github.com/<you>/tinker-town-factory.git
git push -u origin main
```
