// Balancing helper: a greedy bot plays the game and reports how long milestones take.
//   node tools/simulate.js            (first run, then 2 more runs with prestige)
// The bot buys whichever purchase pays back fastest and never taps, so real players
// (who tap early and may play smarter) will be a little faster in the first minutes.
import { createInitialState } from '../src/core/state.js';
import { MACHINES } from '../src/data/machines.js';
import {
  buyAuto, buyMachine, cycleTimeOf, isUnlocked, machineCost, machineOutput, startCycle, updateEconomy,
} from '../src/systems/economy.js';
import { checkWingUnlocks } from '../src/systems/wings.js';
import { doPrestige, pendingPoints, buyUpgrade, upgradeCost } from '../src/systems/prestige.js';
import { formatDuration, formatNumber } from '../src/core/format.js';

function incomeOf(def, state, level, auto) {
  return auto ? machineOutput(def, level, state) / cycleTimeOf(def, state) : 0;
}

function bestPurchase(state) {
  let best = null;
  for (const def of MACHINES) {
    if (!isUnlocked(state, def.id)) continue;
    const m = state.machines[def.id];
    const cost = machineCost(def, m.level, 1);
    const auto = m.auto;
    const gain = incomeOf(def, state, m.level + 1, auto) - incomeOf(def, state, m.level, auto);
    // an un-automated machine's first levels have no passive value; value them via the auto they unlock
    if (gain > 0) consider({ kind: 'level', id: def.id, cost, score: cost / gain });
    if (m.level >= 1 && !m.auto) {
      const g = incomeOf(def, state, m.level, true);
      consider({ kind: 'auto', id: def.id, cost: def.autoCost, score: def.autoCost / g });
    }
    if (m.level === 0) { // building a new machine only pays off after automating it
      const g = incomeOf(def, state, 1, true);
      consider({ kind: 'level', id: def.id, cost, score: (cost + def.autoCost) / g });
    }
  }
  function consider(o) { if (!best || o.score < best.score) best = o; }
  return best;
}

function playRun(state, { maxSeconds = 3 * 24 * 3600, stopAtRunCoins = Infinity, label = '' } = {}) {
  const marks = [[1e3, '1K'], [1e6, '1M (first manager)'], [5e6, '5M (toys wing)'], [1e8, '100M'], [1e10, '10B'],
    [1e12, '1T (gadgets wing)'], [1e15, '1Qa'], [2e17, '200Qa (candy wing)'], [1e20, '100Qi+']];
  let mi = 0, t = 0, autoAt = null;
  const lines = [];
  while (t < maxSeconds && state.runCoins < stopAtRunCoins) {
    // pretend to tap idle machines once per second until they are automated
    for (const def of MACHINES) if (!state.machines[def.id].auto) startCycle(state, def.id);
    for (let guard = 0; guard < 50; guard++) {
      const b = bestPurchase(state);
      if (!b || state.coins < b.cost) break;
      if (b.kind === 'level') buyMachine(state, b.id, 1); else buyAuto(state, b.id);
      if (autoAt === null && b.kind === 'auto') autoAt = t;
    }
    updateEconomy(state, 1);
    checkWingUnlocks(state);
    t += 1;
    while (mi < marks.length && state.runCoins >= marks[mi][0]) {
      lines.push(`   ${formatDuration(t).padStart(8)}  run earnings reach ${marks[mi][1]}`);
      mi++;
    }
  }
  console.log(`${label}${autoAt !== null ? ` (first automation at ${formatDuration(autoAt)})` : ''}`);
  console.log(lines.join('\n'));
  return t;
}

const state = createInitialState();
console.log('Greedy bot, no taps beyond the first minutes\n');
const run1 = playRun(state, { label: 'RUN 1', stopAtRunCoins: 1e8 });
console.log(`   -> prestige now: +${pendingPoints(state)} managers after ${formatDuration(run1)}\n`);

for (let r = 2; r <= 4; r++) {
  doPrestige(state);
  // spend managers on the best-value permanent boosts
  for (const id of ['thimble', 'thimble', 'seed', 'spools', 'thimble']) { if (upgradeCost(state, id) <= state.prestige.points) buyUpgrade(state, id); }
  const t = playRun(state, { label: `RUN ${r} (managers ${state.prestige.totalPoints}, income x${(1 + 0.1 * state.prestige.totalPoints).toFixed(1)})`, stopAtRunCoins: 1e8 * 10 ** (r - 1) });
  console.log(`   -> ${formatDuration(t)} total, would give +${pendingPoints(state)} managers\n`);
}
console.log('lifetime earnings:', formatNumber(state.lifetimeCoins));
