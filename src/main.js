import './ui/styles.css';
import { CONFIG } from './data/config.js';
import { createInitialState } from './core/state.js';
import { createSaveManager } from './core/save.js';
import { Loop } from './core/loop.js';
import { addCoins, buyMachine, startCycle, updateEconomy } from './systems/economy.js';
import { createUI } from './ui/ui.js';

const saves = createSaveManager();
const debug = new URLSearchParams(location.search).has('debug');

const game = { state: saves.load() || createInitialState() };
let sinceSave = 0;
let ui;

const actions = {
  tap(id) {
    startCycle(game.state, id);
    ui.render();
  },
  buy(id) {
    const { bought } = buyMachine(game.state, id, game.state.settings.buyMode);
    if (bought) saves.save(game.state);
    ui.render();
  },
  setBuyMode(mode) {
    game.state.settings.buyMode = mode;
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
    ui.rebuild();
    ui.toast('Fresh start');
  },
  cheat(amount) {
    addCoins(game.state, amount);
    ui.render();
  },
};

ui = createUI(document.getElementById('app'), game, actions, { debug });

const loop = new Loop({
  step: 1 / CONFIG.tickRate,
  maxFrame: CONFIG.maxFrameSeconds,
  update(dt) {
    updateEconomy(game.state, dt, ui.onProduce);
    game.state.stats.playSeconds += dt;
    sinceSave += dt;
    if (sinceSave >= CONFIG.autosaveSeconds) {
      sinceSave = 0;
      saves.save(game.state);
    }
  },
  render: () => ui.render(),
});

// Save whenever the player leaves; never count time spent hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saves.save(game.state);
  else loop.resetClock();
});
window.addEventListener('pagehide', () => saves.save(game.state));

loop.start();

if (debug) window.game = game; // poke at state from the console: game.state
