import { CONFIG } from '../data/config.js';
import { MACHINES } from '../data/machines.js';

export const BUY_MODES = [1, 10, 'max'];

export function createInitialState(now = Date.now()) {
  const machines = {};
  for (const def of MACHINES) {
    machines[def.id] = { level: 0, progress: 0, running: false, auto: false };
  }
  machines[MACHINES[0].id].level = 1; // first machine is free

  return {
    version: CONFIG.saveVersion,
    coins: 0,
    lifetimeCoins: 0,
    machines,
    stats: { taps: 0, playSeconds: 0 },
    settings: { buyMode: 1 },
    createdAt: now,
    lastSaved: now,
  };
}

const num = (v, fallback = 0) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;

/**
 * Turn untrusted/old save data into a valid state: fills missing fields,
 * drops unknown machines, and clamps garbage numbers.
 */
export function hydrate(raw, now = Date.now()) {
  const s = createInitialState(now);
  if (!raw || typeof raw !== 'object') return s;

  s.coins = num(raw.coins);
  s.lifetimeCoins = Math.max(num(raw.lifetimeCoins), s.coins);

  for (const def of MACHINES) {
    const m = raw.machines && raw.machines[def.id];
    if (!m || typeof m !== 'object') continue;
    const level = Math.floor(num(m.level));
    const running = !!m.running && level >= 1;
    s.machines[def.id] = {
      level,
      running,
      auto: !!m.auto && level >= 1,
      progress: running ? Math.min(num(m.progress), def.cycleTime) : 0,
    };
  }
  const first = s.machines[MACHINES[0].id];
  if (first.level < 1) first.level = 1;

  s.stats.taps = Math.floor(num(raw.stats && raw.stats.taps));
  s.stats.playSeconds = num(raw.stats && raw.stats.playSeconds);
  if (raw.settings && BUY_MODES.includes(raw.settings.buyMode)) {
    s.settings.buyMode = raw.settings.buyMode;
  }
  s.createdAt = num(raw.createdAt, now);
  s.lastSaved = num(raw.lastSaved, now);
  return s;
}
