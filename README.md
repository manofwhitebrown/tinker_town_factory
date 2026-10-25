# Tinker Town Factory

A cozy, endless idle factory game. Built as plain HTML5 + JavaScript (Vite), wrapped into an Android APK with Capacitor in Part 8.

**Status: all parts done (0-8).** Scaffold, engine, economy, automation + offline income, prestige, factory wings, daily rewards / quests / achievements / gems, polish + sound + accessibility + tutorial, Android packaging + CI.

## Run it

Requires Node 22+ (Capacitor needs it).

```bash
npm install
npm run dev        # opens a local server, play in the browser (phone-sized window works best)
npm test           # unit tests (economy, saving, number formatting, game loop)
npm run build      # production build into dist/
```

Add `?debug=1` to the URL (e.g. `http://localhost:5173/?debug=1`) to get cheat buttons (+1K ... +1T) and `window.game` in the console.

## Play it / get the APK

- **In the browser:** every push to `main` is published to GitHub Pages. One-time: repo Settings > Pages > Source = **GitHub Actions**.
- **On your phone:** every push builds a debug APK (Actions tab > run > Artifacts). Pushing a tag like `v1.0.0` builds a signed release APK. Setup and the keystore guide: [docs/ANDROID.md](docs/ANDROID.md).

## How to play (so far)

- Tap a machine to run one production cycle; the thread bar fills, then you get coins.
- Spend coins to level machines up. Pick **x1 / x10 / Max** for how many levels to buy at once.
- **Automate** a machine (button under its card) and it runs forever by itself.
- Machines **keep earning while you are away** (up to 8 hours). You get a "Welcome back" summary.
- Every 10/25/50/100... levels a machine's output doubles.
- **Managers tab:** once you have earned 1M coins in a run you can reopen the factory. Coins and machines reset, but you hire managers (permanent +10% income each) and can spend them on permanent upgrades.
- **Wings:** Cloth Works, Toy Shop (opens at 5M lifetime coins), Gadget Garage (1T), Candy Kitchen (200Qa). Each is a bigger tier of the same coin pool.
- **Rewards tab:** a daily reward on a 7-day streak (miss a day and it resets), three daily quests that change at local midnight, and 22 achievements. They all pay **gems** (◆).
- **Shop tab:** spend gems on a Coin Crate (1 hour of income), Double Time (2x income for 15 min, pauses while the game is closed), and permanent Gem Polish (+5% income per level) and Bigger Vault (+1h offline time per level).
- **Settings tab:** mute button (also in the header), sound effects, music (all generated in code), Large text, Colorblind-friendly colors, Reduce motion, and Replay tutorial. A short tutorial guides your first minutes.
- Progress autosaves every 10 seconds and when you leave the page.

## Project layout

```
src/
  core/      state.js (state shape + repair), save.js (versioned saves), loop.js (fixed timestep), format.js (1.2K, 3.4M)
  systems/   economy.js (costs, buying, automation), offline.js (away earnings), prestige.js (managers + shop), wings.js, meta.js (daily, quests, achievements, gem shop)
  data/      config.js (global knobs), machines.js (wings + every machine's numbers), prestige.js (manager tuning), meta.js (rewards, quests, achievements, gem shop)
  ui/        ui.js (shell, tabs, dialogs), factoryView.js, managersView.js, rewardsView.js, shopView.js, moreView.js, icons.js (SVG), styles.css, dom.js
  main.js    wires it all together
tests/       node:test unit tests
tools/simulate.js   balancing bot: `node tools/simulate.js` prints how long milestones take
capacitor.config.json   stub, used in Part 8
.github/workflows/ci.yml   runs tests + build on every push
```

## Balancing

Edit numbers only in `src/data/`:

- `machines.js`: `baseCost`, `baseOutput`, `cycleTime`, `autoCost` per machine, and each wing's `unlockAt`. Price of the next level is `baseCost * 1.15^levelsOwned`.
- `prestige.js`: manager formula (`divisor`), bonus per manager, and the upgrade shop.
- `meta.js`: daily reward sizes, quest targets, every achievement, gem shop prices.
- `config.js`: price growth, milestone levels, offline cap and efficiency, autosave interval.

After changing numbers run `node tools/simulate.js` to see the effect on pacing.

To add a machine, append an entry to `MACHINES` and add an icon in `src/ui/icons.js`. To add a wing, add it to `WINGS`. Saves from older versions pick up new machines and wings automatically.

## Saves

Stored in `localStorage` as `{ v: <version>, data: <state> }` (currently version 4; older saves migrate automatically). If you change the shape of the state, bump `CONFIG.saveVersion` and add a migration in `src/core/save.js`. Unreadable saves are kept under `<key>.corrupt` rather than deleted.

## Known limits (by design, for now)

- Numbers are standard JS doubles (max about 1e308). Plenty for this game; the formatter switches to `1e40` style past 1e36.
- Offline earnings trust the device clock.
- Daily rewards and quests trust the device clock (like offline earnings). Sound, settings, tutorial and accessibility options arrive in Part 7.

## Roadmap

| Part | What | Status |
|------|------|--------|
| 0 | Repo scaffold | done |
| 1 | Core engine: state, loop, saves, number formatting | done |
| 2 | Machines & economy | done |
| 3 | Automation & offline income | done |
| 4 | Prestige (managers + upgrade shop) | done |
| 5 | Factory wings (4 wings, 21 machines) | done |
| 6 | Daily rewards, quests, achievements, gems | done |
| 7 | Polish, sound, accessibility | next |
| 8 | Android packaging + APK via GitHub Actions | |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Part 6: daily rewards, quests, achievements, gems"
git branch -M main
git remote add origin https://github.com/<you>/tinker-town-factory.git
git push -u origin main
```
