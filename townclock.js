import { MACHINES, WINGS } from '../data/machines.js';

/** Part of the day for the town scene, from the local hour (0-23). */
export function townPhase(hour) {
  if (hour >= 6 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/** Where the sun sits in the 360 x 100 scene. It rises at 06:00 and sets at 19:00. */
export function sunPosition(hour) {
  const t = Math.min(1, Math.max(0, (hour - 6) / 13));
  return { x: Math.round(30 + t * 300), y: Math.round(66 - Math.sin(Math.PI * t) * 46) };
}

/** Wings that have at least one automated machine running (they get chimney smoke). */
export function busyWings(state) {
  const busy = {};
  for (const w of WINGS) busy[w.id] = false;
  for (const def of MACHINES) {
    const m = state.machines[def.id];
    if (m && m.auto && m.level > 0) busy[def.wing] = true;
  }
  return busy;
}
