import { MACHINES } from '../data/machines.js';
import { cycleTimeOf, isUnlocked, machineCost, machineOutput } from './economy.js';

const perSecond = (def, state, level) => (level < 1 ? 0 : machineOutput(def, level, state) / cycleTimeOf(def, state));

/**
 * The purchase that pays itself back fastest right now (price / extra income per second).
 * Powers the "Best value" hint. Returns { id, kind: 'level' | 'auto' } or null.
 *  - a level on an automated machine is judged by the income it adds
 *  - a machine you tap by hand is judged by the Automate upgrade it would unlock
 *  - a machine you have not built yet is judged by building plus automating it
 */
export function bestBuy(state) {
  let best = null;
  const consider = (id, kind, cost, gain) => {
    if (!(gain > 0) || !Number.isFinite(cost)) return;
    const score = cost / gain;
    if (!best || score < best.score) best = { id, kind, score };
  };
  for (const def of MACHINES) {
    if (!isUnlocked(state, def.id)) continue;
    const m = state.machines[def.id];
    const cost = machineCost(def, m.level, 1);
    if (m.level === 0) {
      consider(def.id, 'level', cost + def.autoCost, perSecond(def, state, 1));
    } else if (m.auto) {
      consider(def.id, 'level', cost, perSecond(def, state, m.level + 1) - perSecond(def, state, m.level));
    } else {
      consider(def.id, 'auto', def.autoCost, perSecond(def, state, m.level));
    }
  }
  return best && { id: best.id, kind: best.kind };
}
