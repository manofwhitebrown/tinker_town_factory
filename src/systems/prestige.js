import { PRESTIGE, UPGRADES_BY_ID } from '../data/prestige.js';
import { startNewRun } from '../core/state.js';
import { upgradeLevel } from './economy.js';

/** Managers you would hire if you prestiged right now. */
export function pendingPoints(state) {
  return Math.floor(Math.sqrt(state.runCoins / PRESTIGE.divisor));
}

/** Coins you must earn this run for the next manager point after the pending ones. */
export function coinsForNextPoint(state) {
  return (pendingPoints(state) + 1) ** 2 * PRESTIGE.divisor;
}

export function canPrestige(state) {
  return pendingPoints(state) >= 1;
}

/** Close the factory: reset the run, hire managers. Returns points gained, or 0 if not allowed. */
export function doPrestige(state) {
  const gained = pendingPoints(state);
  if (gained < 1) return 0;
  state.prestige.points += gained;
  state.prestige.totalPoints += gained;
  state.prestige.count += 1;
  startNewRun(state);
  return gained;
}

/** Manager points needed for the next level, or null when maxed. */
export function upgradeCost(state, id) {
  const def = UPGRADES_BY_ID[id];
  const lvl = upgradeLevel(state, id);
  if (!def || lvl >= def.max) return null;
  return Math.ceil(def.baseCost * def.growth ** lvl);
}

export function buyUpgrade(state, id) {
  const cost = upgradeCost(state, id);
  if (cost === null || state.prestige.points < cost) return false;
  state.prestige.points -= cost;
  state.prestige.upgrades[id] = upgradeLevel(state, id) + 1;
  return true;
}
