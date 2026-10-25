import './ui/styles.css';
import { CONFIG } from './data/config.js';
import { createInitialState, TOGGLE_SETTINGS } from './core/state.js';
import { createSaveManager } from './core/save.js';
import { Loop } from './core/loop.js';
import {
  addCoins, buyAuto, buyMachine, offlineCapSeconds, startCycle, updateEconomy,
} from './systems/economy.js';
import { applyOffline } from './systems/offline.js';
import { buyUpgrade, doPrestige, pendingPoints } from './systems/prestige.js';
import { checkWingUnlocks } from './systems/wings.js';
import {
  buyGemItem, checkAchievements, claimDaily, claimQuest, refreshQuests, track,
} from './systems/meta.js';
import { GEM_SHOP_BY_ID } from './data/meta.js';
import {
  advanceTutorial, nextStep, replayTutorial, skipTutorial, visitTab,
} from './systems/tutorial.js';
import { createAudio } from './audio/audio.js';
import { createUI } from './ui/ui.js';
import { formatNumber } from './core/format.js';

const gemWord = (n) => `${n} ${n === 1 ? 'gem' : 'gems'}`;
const saves = createSaveManager();
const debug = new URLSearchParams(location.search).has('debug');

const game = { state: saves.load() || createInitialState() };
let sinceSave = 0;
let sinceWingCheck = 0;
let ui;
const audio = createAudio(() => game.state.settings);

/** New day? Unlock achievements. Safe to call often. */
function checkMeta() {
  const gemsBefore = game.state.gems;
  if (refreshQuests(game.state)) {
    const got = game.state.gems - gemsBefore;
    ui.toast(got > 0 ? `New daily quests. Collected ${gemWord(got)} from yesterday` : 'New daily quests');
  }
  for (const a of checkAchievements(game.state)) {
    ui.toast(`Achievement: ${a.name} (+${gemWord(a.gems)})`);
    ui.feedback('achievement');
  }
  advanceTutorial(game.state);
}

/** Credit time spent away and tell the player about it. */
function settleAway(seconds) {
  const away = applyOffline(game.state, seconds);
  checkWingUnlocks(game.state);
  if (away.coins > 0 && away.rawSeconds >= CONFIG.offlinePopupMinSeconds && ui) {
    ui.showWelcome(away, offlineCapSeconds(game.state));
  }
  return away;
}

const actions = {
  tap(id) {
    if (startCycle(game.state, id)) { track(game.state, 'taps'); ui.feedback('tap', id); }
    checkMeta();
    ui.render();
  },
  buy(id) {
    const { bought } = buyMachine(game.state, id, game.state.settings.buyMode);
    if (bought) { track(game.state, 'levels', bought); saves.save(game.state); ui.feedback('buy', id); }
    checkMeta();
    ui.render();
  },
  buyAuto(id) {
    if (buyAuto(game.state, id)) {
      saves.save(game.state);
      ui.toast('Automated');
      ui.feedback('auto', id);
    }
    checkMeta();
    ui.render();
  },
  claimDaily() {
    const r = claimDaily(game.state);
    if (r) {
      saves.save(game.state);
      ui.feedback('claim');
      ui.toast(`Day ${r.streak}: +${formatNumber(r.coins)} coins${r.gems ? ` and ${gemWord(r.gems)}` : ''}`);
    }
    checkMeta();
    ui.render();
  },
  claimQuest(i) {
    const gems = claimQuest(game.state, i);
    if (gems) { saves.save(game.state); ui.toast(`+${gemWord(gems)}`); ui.feedback('gem'); }
    checkMeta();
    ui.render();
  },
  buyGem(id) {
    if (buyGemItem(game.state, id)) {
      saves.save(game.state);
      ui.toast(`${GEM_SHOP_BY_ID[id].name} bought`);
      ui.feedback('buy');
    }
    checkMeta();
    ui.render();
  },
  // ---- Part 7: settings + tutorial ----
  setSetting(key, value) {
    if (!(key in TOGGLE_SETTINGS)) return;
    game.state.settings[key] = !!value;
    audio.unlock();
    audio.sync();
    saves.save(game.state);
    ui.render();
  },
  toggleMute() {
    game.state.settings.muted = !game.state.settings.muted;
    audio.unlock();
    audio.sync();
    saves.save(game.state);
    ui.render();
  },
  tutorialNext() {
    nextStep(game.state);
    saves.save(game.state);
    ui.render();
  },
  tutorialSkip() {
    skipTutorial(game.state);
    saves.save(game.state);
    ui.render();
  },
  tutorialReplay() {
    replayTutorial(game.state);
    saves.save(game.state);
    ui.render();
    ui.toast('Tutorial restarted');
  },
  visitTab(id) {
    visitTab(game.state, id);
  },
  setBuyMode(mode) {
    game.state.settings.buyMode = mode;
    ui.render();
  },
  setWing(id) {
    if (game.state.wings[id]) game.state.settings.wing = id;
    ui.render();
  },
  prestige() {
    const n = pendingPoints(game.state);
    if (n < 1) return;
    const ok = window.confirm(
      `Reopen the factory and hire ${formatNumber(n)} ${n === 1 ? 'manager' : 'managers'}?\n\nCoins and machines reset. Managers, upgrades and open wings stay.`);
    if (!ok) return;
    doPrestige(game.state);
    saves.save(game.state);
    ui.feedback('prestige');
    ui.render();
    ui.toast(`Hired ${formatNumber(n)} ${n === 1 ? 'manager' : 'managers'}`);
  },
  upgrade(id) {
    if (buyUpgrade(game.state, id)) saves.save(game.state);
    ui.render();
  },
  exportSave() {
    const code = saves.exportString(game.state);
    const done = () => ui.toast('Save code copied');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, () => window.prompt('Copy your save code:', code));
    } else {
      window.prompt('Copy your save code:', code);
    }
  },
  importSave() {
    const code = window.prompt('Paste your save code:');
    if (!code) return;
    try {
      game.state = saves.importString(code);
      saves.save(game.state);
      refreshQuests(game.state);
      ui.rebuild();
      ui.toast('Save loaded');
    } catch (err) {
      ui.toast(err.message);
    }
  },
  resetSave() {
    if (!window.confirm('Erase all progress and start over?')) return;
    saves.wipe();
    game.state = createInitialState();
    refreshQuests(game.state);
    ui.rebuild();
    ui.toast('Fresh start');
  },
  // ---- debug-only (?debug=1) ----
  cheat(amount) {
    addCoins(game.state, amount);
    checkWingUnlocks(game.state);
    ui.render();
  },
  cheatAway(seconds) {
    settleAway(seconds);
    ui.render();
  },
  cheatGems(n) {
    game.state.gems += n;
    ui.render();
  },
  cheatPoints(n) {
    game.state.prestige.points += n;
    game.state.prestige.totalPoints += n;
    ui.render();
  },
};

ui = createUI(document.getElementById('app'), game, actions, { debug, audio });

// Browsers only allow sound after a tap or key press.
const unlockAudio = () => {
  if (audio.unlock()) {
    for (const ev of ['pointerdown', 'keydown']) window.removeEventListener(ev, unlockAudio, true);
  }
};
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlockAudio, true);

// Time since the game was last open.
settleAway((Date.now() - game.state.lastSaved) / 1000);
checkMeta();
saves.save(game.state);
ui.render();

const loop = new Loop({
  step: 1 / CONFIG.tickRate,
  maxFrame: CONFIG.maxFrameSeconds,
  update(dt) {
    const before = game.state.lifetimeCoins;
    updateEconomy(game.state, dt, (id, amount) => {
      track(game.state, 'cycles');
      ui.onProduce(id, amount);
    });
    track(game.state, 'earn', game.state.lifetimeCoins - before);
    game.state.stats.playSeconds += dt;

    sinceWingCheck += dt;
    if (sinceWingCheck >= 0.5) {
      sinceWingCheck = 0;
      for (const w of checkWingUnlocks(game.state)) { ui.toast(`${w.name} is open!`); ui.feedback('wing'); }
      checkMeta();
    }

    sinceSave += dt;
    if (sinceSave >= CONFIG.autosaveSeconds) {
      sinceSave = 0;
      saves.save(game.state);
    }
  },
  render: () => ui.render(),
});

// Leaving: save. Coming back: credit the time away.
document.addEventListener('visibilitychange', () => {
  audio.setHidden(document.hidden);
  if (document.hidden) {
    saves.save(game.state);
  } else {
    settleAway((Date.now() - game.state.lastSaved) / 1000);
    checkMeta();
    saves.save(game.state);
    loop.resetClock();
    ui.render();
  }
});
window.addEventListener('pagehide', () => saves.save(game.state));

loop.start();

if (debug) window.game = game; // poke at state from the console: game.state
