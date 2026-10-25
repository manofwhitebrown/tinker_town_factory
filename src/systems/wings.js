import { WINGS } from '../data/machines.js';

/** Open any wing whose lifetime-earnings milestone has been reached. Returns the newly opened wings. */
export function checkWingUnlocks(state) {
  const opened = [];
  for (const w of WINGS) {
    if (!state.wings[w.id] && state.lifetimeCoins >= w.unlockAt) {
      state.wings[w.id] = true;
      opened.push(w);
    }
  }
  return opened;
}
