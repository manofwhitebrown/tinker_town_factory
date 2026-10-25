import { CONFIG } from '../data/config.js';
import { hydrate } from './state.js';

// Save format: { v: <version>, data: <state> }
// To change the state shape later: bump CONFIG.saveVersion and add a
// migration keyed by the OLD version, e.g. MIGRATIONS[1] = (data) => ({...}).
export const MIGRATIONS = {
  // v1 -> v2 (Part 4): runCoins was added. Treat everything earned so far as this run.
  1: (d) => ({ ...d, runCoins: d.lifetimeCoins ?? d.coins ?? 0 }),
  // v2 -> v3 (Part 6): gems, daily, quests, achievements, gem shop. hydrate() fills the new
  // fields with defaults, so nothing needs copying.
  2: (d) => d,
};

export function serialize(state) {
  return JSON.stringify({ v: CONFIG.saveVersion, data: state });
}

export function deserialize(text, migrations = MIGRATIONS, targetVersion = CONFIG.saveVersion) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Save data is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.v !== 'number' || !parsed.data) {
    throw new Error('Save data is missing its version or contents.');
  }
  if (parsed.v > targetVersion) {
    throw new Error('This save is from a newer version of the game.');
  }
  let data = parsed.data;
  for (let v = parsed.v; v < targetVersion; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`No migration from save version ${v}.`);
    data = step(data);
  }
  return hydrate(data);
}

function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null; // storage blocked
  }
}

export function createSaveManager(storage = defaultStorage(), key = CONFIG.saveKey) {
  return {
    /** Returns a state, or null when there is no (readable) save. */
    load() {
      if (!storage) return null;
      let text;
      try { text = storage.getItem(key); } catch { return null; }
      if (!text) return null;
      try {
        return deserialize(text);
      } catch (err) {
        // Keep the unreadable save around instead of silently destroying it.
        try { storage.setItem(key + '.corrupt', text); } catch { /* ignore */ }
        console.warn('Could not load save:', err.message);
        return null;
      }
    },

    save(state) {
      if (!storage) return false;
      state.lastSaved = Date.now();
      try {
        storage.setItem(key, serialize(state));
        return true;
      } catch {
        return false; // storage full or blocked
      }
    },

    wipe() {
      if (!storage) return;
      try { storage.removeItem(key); } catch { /* ignore */ }
    },

    /** Copy/paste friendly backup string. */
    exportString(state) {
      return btoa(serialize(state));
    },

    /** Throws an Error with a readable message on bad input. */
    importString(text) {
      let json;
      try { json = atob(String(text).trim()); } catch { throw new Error('That save code is not valid.'); }
      return deserialize(json);
    },
  };
}
