# Tinker Town Factory

A cozy, endless idle factory game. Built as plain HTML5 + JavaScript (Vite), wrapped into an Android APK with Capacitor in Part 8.

**Status: all parts done (0-9).** Scaffold, engine, economy, automation + offline income, prestige, factory wings, daily rewards / quests / achievements / gems, polish + sound + accessibility + tutorial, Android packaging + CI, and Part 9 (more wings, in-game Guide, favicon, password-locked cheats).

Created by **Mohammed Abdul Nayeem**.

## Run it

Requires Node 22+ (Capacitor needs it).

```bash
npm install
npm run dev        # opens a local server, play in the browser (phone-sized window works best)
npm test           # unit tests (economy, saving, number formatting, game loop)
npm run build      # production build into dist/
```

**Cheats:** open the Settings tab, scroll to the bottom and type the cheat password in the Cheats box. The cheat buttons (add coins, gems, managers, open all wings, automate all, skip time) then appear, and stay unlocked on that device until you press Lock cheats. Only a hash of the password is stored in `src/systems/cheats.js`; to change the password, put the new hash from `hashText('tinker-town:' + yourPassword)` into `CHEAT_HASH`. Adding `?debug=1` to the URL only exposes `window.game`, `window.actions` and `window.goldenTimer` in the console.

## Play it / get the APK

- **In the browser:** every push to `main` is published to GitHub Pages. One-time: repo Settings > Pages > Source = **GitHub Actions**.
- **On your phone:** every push builds a debug APK (Actions tab > run > Artifacts). Pushing a tag like `v1.0.0` builds a signed release APK. Setup and the keystore guide: [docs/ANDROID.md](docs/ANDROID.md).

## How to play (so far)

- Tap a machine to run one production cycle; the thread bar fills, then you get coins.
- Spend coins to level machines up. Pick **x1 / x10 / Max** for how many levels to buy at once.
- **Automate** a machine (button under its card) and it runs forever by itself.
- Machines **keep earning while you are away** (up to 12 hours). You get a "Welcome back" summary.
- Every 10/25/50/100... levels (up to 900) a machine's output doubles.
- **Managers tab:** once you have earned 250K coins in a run you can reopen the factory. Coins and machines reset, but you hire managers (permanent +10% income each) and can spend them on permanent upgrades.
- **Wings:** 7 of them, 36 machines in total. Cloth Works, Toy Shop (opens at 5M lifetime coins), Gadget Garage (1T), Candy Kitchen (200Qa), Clockwork Tower (40Sx), Sky Dock (8Oc) and Star Observatory (1.7Dc). Each is a bigger tier of the same coin pool.
- **Guide tab:** a plain-language page explaining every feature (machines, Automate, offline income, wings, managers and their upgrades, rewards, shop, settings, saving). Its numbers are read from `src/data/`, so it stays correct when you rebalance.
- **Rewards tab:** a daily reward on a 7-day streak (a Streak Shield saves it if you miss a day), three daily quests that change at local midnight, and 30 achievements. They all pay **gems** (◆).
- **Reminders (Android):** local notifications via `@capacitor/local-notifications`: factory full (when the offline cap is reached), daily reward at 10:00, and a nudge after 3 days away. Never between 22:00 and 08:00. Permission is requested right after the player automates their first machine (or turns the setting on). Plan logic: `src/systems/reminders.js`; device code: `src/platform/notifications.js`. Does nothing in a browser.
- **Living town:** the scene at the top of the Factory (`src/ui/townScene.js`): a building per open wing, chimney smoke for automated machines, day/dusk/night from the real clock, a Tinker Bot strolling along, and tap a building to visit that wing. Pure helpers in `src/systems/townclock.js`. Animations stop with Reduce motion.
- **Lucky Spin:** one free spin a day on the Rewards tab (coins, gems, Double Time, Streak Shield). Prizes and odds: `SPIN` in `src/data/meta.js`.
- **Tinker Bot:** a helper strip at the top of the Factory that says what to do next (logic: `src/systems/tinkerbot.js`). Tapping it jumps to the right tab.
- **Best value hint:** a gold star on the smartest purchase right now (logic in `src/systems/advisor.js`). Can be switched off in Settings.
- **Golden Gear:** now and then a golden gear floats across the screen for ~12 seconds. Tap it for 8-25 minutes of income (and sometimes a gem). Tuning: `GOLDEN` in `src/data/meta.js`.
- **Streak Shield:** saves your daily streak when you miss a day. Everyone starts with 1, you earn one at the end of each 7-day cycle, hold up to 3, and can buy more in the Shop.
- **Welcome back x2:** the away-earnings popup has a Double button: free once a day, then 2 gems.
- **Shop tab:** spend gems on a Coin Crate (1 hour of income), Double Time (2x income for 15 min, pauses while the game is closed), and permanent Gem Polish (+5% income per level) and Bigger Vault (+1h offline time per level).
- **Cozy mode** (Settings): doubles all income. On by default in new games, off for existing saves until you switch it on. Turn it off for the original challenge.
- **Settings tab** (also holds the password-locked Cheats box and the credit): mute button (also in the header), sound effects, music (all generated in code), Large text, Colorblind-friendly colors, Reduce motion, and Replay tutorial. A short tutorial guides your first minutes.
- Progress autosaves every 10 seconds and when you leave the page.

## Project layout

```
src/
  core/      state.js (state shape + repair), save.js (versioned saves), loop.js (fixed timestep), format.js (1.2K, 3.4M)
  systems/   economy.js (costs, buying, automation), offline.js (away earnings), prestige.js (managers + shop), wings.js, meta.js (daily, quests, achievements, gem shop), cheats.js (password lock)
  data/      config.js (global knobs), machines.js (wings + every machine's numbers), prestige.js (manager tuning), meta.js (rewards, quests, achievements, gem shop)
  ui/        ui.js (shell, tabs, dialogs), factoryView.js, managersView.js, rewardsView.js, shopView.js, guideView.js, moreView.js, icons.js (SVG), styles.css, dom.js
  main.js    wires it all together
tests/       node:test unit tests
tools/simulate.js   balancing bot: `node tools/simulate.js` prints how long milestones take
public/     favicon (svg, png, ico) and apple-touch icon
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

- Numbers are standard JS doubles (max about 1e308). Plenty for this game; the formatter switches to `1e40` style past 1e36 (the last wing's machines are in that range).
- The cheat password is client-side, so it keeps casual players out but is not real security.
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
| 7 | Polish, sound, accessibility, tutorial | done |
| 8 | Android packaging + APK via GitHub Actions | done |
| 9 | 3 more wings (36 machines), Guide tab, favicon, credit, password-locked cheats | done |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Part 6: daily rewards, quests, achievements, gems"
git branch -M main
git remote add origin https://github.com/<you>/tinker-town-factory.git
git push -u origin main
```
