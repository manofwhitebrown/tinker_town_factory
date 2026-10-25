import { CONFIG } from '../data/config.js';
import { MACHINES } from '../data/machines.js';
import { addCoins, cycleTimeOf, machineOutput, offlineCapSeconds } from './economy.js';

/**
 * Give the player what their machines made while the game was closed.
 * Closed form (no simulation), so 8 hours costs the same as 8 seconds.
 *
 *  - automated machines: floor((progress + time) / cycleTime) cycles
 *  - a tapped machine that was mid-cycle finishes that one cycle
 *
 * Returns { seconds, rawSeconds, capped, coins }.
 */
export function applyOffline(state, elapsedSeconds) {
  const raw = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const cap = offlineCapSeconds(state);
  const t = Math.min(raw, cap);
  const result = { seconds: t, rawSeconds: raw, capped: raw > cap, coins: 0 };
  if (t <= 0) return result;

  let earned = 0;
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m.level < 1) continue;
    const ct = cycleTimeOf(def, state);
    const perCycle = machineOutput(def, m.level, state) * CONFIG.offlineEfficiency;

    if (m.auto) {
      const start = m.running ? m.progress : 0;
      const total = start + t;
      const cycles = Math.floor(total / ct);
      m.running = true;
      m.progress = total - cycles * ct;
      earned += cycles * perCycle;
    } else if (m.running) {
      if (m.progress + t >= ct) {
        earned += perCycle;
        m.running = false;
        m.progress = 0;
      } else {
        m.progress += t;
      }
    }
  }

  if (earned > 0) {
    addCoins(state, earned);
    state.stats.offlineCoins += earned;
  }
  result.coins = earned;
  return result;
}
