// Password-locked cheats.
//
// The cheat buttons (Settings tab, bottom) stay hidden until the right password is typed in.
// Only a hash of the password lives in this file, so it is not readable at a glance.
// NOTE: this is a game on the player's own device. Anyone determined can still read the code,
// so treat it as a door lock, not a vault.

/** Small, fast, non-cryptographic string hash (cyrb53). Works everywhere, even on plain http. */
export function hashText(text, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const SALT = 'tinker-town:';
export const CHEAT_HASH = '1rq91snkggs';
export const CHEAT_KEY = 'tinker-town-factory/cheats';

/** True when `input` is the cheat password (surrounding spaces are ignored). */
export function isCheatPassword(input) {
  return typeof input === 'string' && hashText(SALT + input.trim()) === CHEAT_HASH;
}

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

/**
 * Remembers on this device whether cheats were unlocked, so you only type the password once.
 * It is kept apart from the game save, so "Start over" or loading a save code never touches it.
 */
export function createCheatLock(storage = defaultStorage(), key = CHEAT_KEY) {
  let open = false;
  try { open = !!storage && storage.getItem(key) === '1'; } catch { open = false; }
  const remember = (value) => {
    try {
      if (!storage) return;
      if (value) storage.setItem(key, '1'); else storage.removeItem(key);
    } catch { /* storage blocked: stays unlocked for this visit only */ }
  };
  return {
    isOpen: () => open,
    /** Returns true (and unlocks) when the password is right. */
    tryUnlock(input) {
      if (!isCheatPassword(input)) return false;
      open = true;
      remember(true);
      return true;
    },
    lock() {
      open = false;
      remember(false);
    },
  };
}
