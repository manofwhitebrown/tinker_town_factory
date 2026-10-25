import { WINGS } from '../data/machines.js';
import { PRESTIGE } from '../data/prestige.js';
import { pendingPoints } from './prestige.js';

/**
 * The most useful thing to work toward right now, for the "Next goal" strip.
 * Returns { label, have, need, fraction } or null when there is nothing left to chase.
 */
export function nextGoal(state) {
  const options = [];

  const wing = WINGS.find((w) => !state.wings[w.id]);
  if (wing) options.push({ label: `Open the ${wing.name}`, have: state.lifetimeCoins, need: wing.unlockAt });

  if (state.prestige.count === 0 && pendingPoints(state) < 1) {
    options.push({ label: 'Hire your first manager', have: state.runCoins, need: PRESTIGE.divisor });
  }

  if (!options.length) return null;
  // Show whichever is closest to finished.
  for (const o of options) o.fraction = Math.min(1, o.need > 0 ? o.have / o.need : 1);
  options.sort((a, b) => b.fraction - a.fraction || a.need - b.need); // tie: the smaller target
  return options[0];
}
