import { createInitialState } from '../src/core/state.js';

/** A fresh game with Cozy mode off, so economy tests check the base numbers. */
export function plainState(...args) {
  const s = createInitialState(...args);
  s.settings.cozy = false;
  return s;
}
