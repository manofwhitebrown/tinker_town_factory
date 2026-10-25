import { CONFIG } from '../data/config.js';
import { MACHINES, MACHINE_BY_ID } from '../data/machines.js';

const growth = (def) => def.costGrowth ?? CONFIG.costGrowth;

/** Hook for Part 4 (prestige) and Part 6 (boosts). Everything multiplies through here. */
export function getGlobalMultiplier(/* state */) {
  return 1;
}

export function milestoneMultiplier(level) {
  let hits = 0;
  for (const m of CONFIG.milestones) if (level >= m) hits++;
  return CONFIG.milestoneMultiplier ** hits;
}

export function nextMilestone(level) {
  const next = CONFIG.milestones.find((m) => m > level);
  return next === undefined ? null : next;
}

/** Coins produced by one finished cycle. */
export function machineOutput(def, level, state) {
  if (level < 1) return 0;
  const global = state ? getGlobalMultiplier(state) : 1;
  return def.baseOutput * level * milestoneMultiplier(level) * global;
}

/** Price of buying `count` levels when you already own `owned` levels. */
export function machineCost(def, owned, count = 1) {
  const g = growth(def);
  const first = def.baseCost * g ** owned;
  const total = count === 1 ? first : (first * (g ** count - 1)) / (g - 1);
  return Math.ceil(total - 1e-9);
}

/** How many levels `coins` can buy right now. */
export function maxAffordable(def, owned, coins) {
  const g = growth(def);
  const first = def.baseCost * g ** owned;
  if (!Number.isFinite(first) || coins < machineCost(def, owned, 1)) return 0;

  let n = Math.floor(Math.log((coins * (g - 1)) / first + 1) / Math.log(g));
  if (!Number.isFinite(n) || n < 1) n = 1;
  // Correct any floating point drift in both directions.
  let guard = 0;
  while (n > 1 && machineCost(def, owned, n) > coins && guard++ < 100) n--;
  while (machineCost(def, owned, n + 1) <= coins && guard++ < 200) n++;
  return n;
}

function indexOfMachine(id) {
  return MACHINES.findIndex((m) => m.id === id);
}

/** A machine can be bought once the previous machine is owned. */
export function isUnlocked(state, id) {
  const i = indexOfMachine(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return state.machines[MACHINES[i - 1].id].level >= 1;
}

/** Shown in the list: unlocked machines plus one locked teaser. */
export function isVisible(state, id) {
  const i = indexOfMachine(id);
  if (i <= 0) return i === 0;
  return isUnlocked(state, id) || isUnlocked(state, MACHINES[i - 1].id);
}

export function addCoins(state, amount) {
  state.coins += amount;
  state.lifetimeCoins += amount;
}

/** How many levels a buy of this mode would purchase (0 = cannot afford). */
export function resolveBuyCount(state, def, mode) {
  const owned = state.machines[def.id].level;
  if (mode === 'max') return maxAffordable(def, owned, state.coins);
  const count = Number(mode) || 1;
  return state.coins >= machineCost(def, owned, count) ? count : 0;
}

export function buyMachine(state, id, mode = 1) {
  const def = MACHINE_BY_ID[id];
  if (!def || !isUnlocked(state, id)) return { bought: 0, spent: 0 };
  const m = state.machines[id];
  const count = resolveBuyCount(state, def, mode);
  if (count < 1) return { bought: 0, spent: 0 };
  const spent = machineCost(def, m.level, count);
  state.coins -= spent;
  m.level += count;
  return { bought: count, spent };
}

/** Tap a machine: starts one production cycle if it is idle. */
export function startCycle(state, id) {
  const m = state.machines[id];
  if (!m || m.level < 1 || m.running) return false;
  m.running = true;
  m.progress = 0;
  state.stats.taps += 1;
  return true;
}

/** Coins per second from machines that run by themselves (Part 3 turns `auto` on). */
export function incomePerSecond(state) {
  let total = 0;
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level >= 1 && m.auto) total += machineOutput(def, m.level, state) / def.cycleTime;
  }
  return total;
}

/** Advance every machine by dt seconds. onProduce(id, amount) fires per finished cycle. */
export function updateEconomy(state, dt, onProduce) {
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level < 1) continue;
    if (!m.running) {
      if (!m.auto) continue;
      m.running = true;
      m.progress = 0;
    }
    m.progress += dt;
    let guard = 0;
    while (m.running && m.progress >= def.cycleTime && guard++ < 1000) {
      const amount = machineOutput(def, m.level, state);
      addCoins(state, amount);
      if (onProduce) onProduce(def.id, amount);
      m.progress -= def.cycleTime;
      if (!m.auto) {
        m.running = false;
        m.progress = 0;
      }
    }
  }
}
