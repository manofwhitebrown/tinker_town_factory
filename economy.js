import { CONFIG } from '../data/config.js';
import { MACHINES, MACHINE_BY_ID, PREV_IN_WING } from '../data/machines.js';
import { PRESTIGE, UPGRADES_BY_ID } from '../data/prestige.js';
import { GEM_SHOP_BY_ID } from '../data/meta.js';

const growth = (def) => def.costGrowth ?? CONFIG.costGrowth;

export function upgradeLevel(state, id) {
  return (state.prestige && state.prestige.upgrades[id]) || 0;
}

export function gemShopLevel(state, id) {
  return (state.gemShop && state.gemShop[id]) || 0;
}

/** Everything that multiplies income: managers, Golden Thimble, Gem Polish, Double Time, Cozy mode. */
export function getGlobalMultiplier(state) {
  const managers = 1 + PRESTIGE.bonusPerPoint * state.prestige.totalPoints;
  const thimble = 1 + UPGRADES_BY_ID.thimble.perLevel * upgradeLevel(state, 'thimble');
  const polish = 1 + GEM_SHOP_BY_ID.polish.perLevel * gemShopLevel(state, 'polish');
  const boost = state.buffs && state.buffs.boost > 0 ? 2 : 1;
  const cozy = state.settings && state.settings.cozy ? CONFIG.cozyMultiplier : 1;
  return managers * thimble * polish * boost * cozy;
}

/** Speedy Spools: machines finish cycles faster. */
export function speedMultiplier(state) {
  return 1 + UPGRADES_BY_ID.spools.perLevel * upgradeLevel(state, 'spools');
}

export function cycleTimeOf(def, state) {
  return def.cycleTime / (state ? speedMultiplier(state) : 1);
}

/** Seconds of offline work that count (Night Shift extends it). */
export function offlineCapSeconds(state) {
  return CONFIG.offlineCapSeconds
    + UPGRADES_BY_ID.nightshift.perLevel * upgradeLevel(state, 'nightshift')
    + GEM_SHOP_BY_ID.vault.perLevel * gemShopLevel(state, 'vault');
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

/** A machine can be bought once its wing is open and the previous machine in the wing is owned. */
export function isUnlocked(state, id) {
  const def = MACHINE_BY_ID[id];
  if (!def || !state.wings[def.wing]) return false;
  const prev = PREV_IN_WING[id];
  return !prev || state.machines[prev.id].level >= 1;
}

/** Shown in the list: unlocked machines plus one locked teaser. */
export function isVisible(state, id) {
  const def = MACHINE_BY_ID[id];
  if (!def || !state.wings[def.wing]) return false;
  const prev = PREV_IN_WING[id];
  return !prev || isUnlocked(state, prev.id);
}

export function addCoins(state, amount) {
  if (!(amount > 0)) return; // ignores 0, negatives and NaN
  const cap = CONFIG.maxCoins;
  state.coins = Math.min(cap, state.coins + amount);
  state.lifetimeCoins = Math.min(cap, state.lifetimeCoins + amount);
  state.runCoins = Math.min(cap, state.runCoins + amount);
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

/** Part 3: pay once and the machine restarts its own cycles forever. */
export function buyAuto(state, id) {
  const def = MACHINE_BY_ID[id];
  const m = state.machines[id];
  if (!def || !m || m.level < 1 || m.auto || state.coins < def.autoCost) return false;
  state.coins -= def.autoCost;
  m.auto = true;
  return true;
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

/** Coins per second from machines that run by themselves. */
export function incomePerSecond(state) {
  let total = 0;
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level >= 1 && m.auto) total += machineOutput(def, m.level, state) / cycleTimeOf(def, state);
  }
  return total;
}

/** Coins per second if every owned machine were running (used to size rewards). */
export function potentialIncomePerSecond(state) {
  let total = 0;
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level >= 1) total += machineOutput(def, m.level, state) / cycleTimeOf(def, state);
  }
  return total;
}

/** Advance every machine by dt seconds. onProduce(id, amount) fires per finished cycle. */
export function updateEconomy(state, dt, onProduce) {
  if (state.buffs.boost > 0) state.buffs.boost = Math.max(0, state.buffs.boost - dt);
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level < 1) continue;
    if (!m.running) {
      if (!m.auto) continue;
      m.running = true;
      m.progress = 0;
    }
    const ct = cycleTimeOf(def, state);
    m.progress += dt;
    let guard = 0;
    while (m.running && m.progress >= ct && guard++ < 1000) {
      const amount = machineOutput(def, m.level, state);
      addCoins(state, amount);
      if (onProduce) onProduce(def.id, amount);
      m.progress -= ct;
      if (!m.auto) {
        m.running = false;
        m.progress = 0;
      }
    }
  }
}
