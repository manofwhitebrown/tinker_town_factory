import { CONFIG } from '../data/config.js';
import { MACHINES, WINGS } from '../data/machines.js';
import { UPGRADES, UPGRADES_BY_ID, seedCoins } from '../data/prestige.js';
import { ACHIEVEMENT_BY_ID, GEM_SHOP, QUEST_TYPES } from '../data/meta.js';

export const BUY_MODES = [1, 10, 'max'];

function freshMachines() {
  const machines = {};
  for (const def of MACHINES) {
    machines[def.id] = { level: 0, progress: 0, running: false, auto: false };
  }
  machines[MACHINES[0].id].level = 1; // first machine is free
  return machines;
}

export function createInitialState(now = Date.now()) {
  const wings = {};
  for (const w of WINGS) wings[w.id] = w.unlockAt <= 0;
  const upgrades = {};
  for (const u of UPGRADES) upgrades[u.id] = 0;

  return {
    version: CONFIG.saveVersion,
    coins: 0,
    lifetimeCoins: 0,   // earned across all runs (never resets)
    runCoins: 0,        // earned this run (resets on prestige; drives manager points)
    machines: freshMachines(),
    wings,
    prestige: { points: 0, totalPoints: 0, count: 0, upgrades },
    stats: { taps: 0, playSeconds: 0, offlineCoins: 0, questsDone: 0 },
    // Part 6
    gems: 0,
    gemShop: Object.fromEntries(GEM_SHOP.filter((i) => i.kind === 'permanent').map((i) => [i.id, 0])),
    buffs: { boost: 0 },                                  // seconds of Double Time left
    daily: { lastDay: null, streak: 0, total: 0 },        // lastDay = local day number of last claim
    quests: { day: null, list: [], bonusClaimed: false },
    achievements: {},                                     // id -> true
    settings: { buyMode: 1, wing: WINGS[0].id },
    createdAt: now,
    lastSaved: now,
  };
}

/** Reset everything a prestige resets. Managers, upgrades, wings and lifetime stats stay. */
export function startNewRun(state) {
  state.machines = freshMachines();
  state.runCoins = 0;
  state.coins = seedCoins(state.prestige.upgrades.seed || 0);
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
  s.runCoins = Math.min(num(raw.runCoins), s.lifetimeCoins);

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

  // Wings: keep what was unlocked, plus anything lifetime earnings already qualify for.
  for (const w of WINGS) {
    s.wings[w.id] = w.unlockAt <= 0 || !!(raw.wings && raw.wings[w.id]) || s.lifetimeCoins >= w.unlockAt;
  }

  const p = raw.prestige && typeof raw.prestige === 'object' ? raw.prestige : {};
  s.prestige.points = Math.floor(num(p.points));
  s.prestige.totalPoints = Math.max(Math.floor(num(p.totalPoints)), s.prestige.points);
  s.prestige.count = Math.floor(num(p.count));
  for (const u of UPGRADES) {
    const lvl = Math.floor(num(p.upgrades && p.upgrades[u.id]));
    s.prestige.upgrades[u.id] = Math.min(lvl, UPGRADES_BY_ID[u.id].max);
  }

  const st = raw.stats || {};
  s.stats.taps = Math.floor(num(st.taps));
  s.stats.playSeconds = num(st.playSeconds);
  s.stats.offlineCoins = num(st.offlineCoins);

  const set = raw.settings || {};
  if (BUY_MODES.includes(set.buyMode)) s.settings.buyMode = set.buyMode;
  if (WINGS.some((w) => w.id === set.wing) && s.wings[set.wing]) s.settings.wing = set.wing;

  s.stats.questsDone = Math.floor(num(st.questsDone));

  // ---- Part 6 ----
  s.gems = Math.floor(num(raw.gems));
  const shop = raw.gemShop || {};
  for (const item of GEM_SHOP) {
    if (item.kind === 'permanent') s.gemShop[item.id] = Math.min(Math.floor(num(shop[item.id])), item.max);
  }
  s.buffs.boost = num(raw.buffs && raw.buffs.boost);

  const d = raw.daily || {};
  s.daily.lastDay = Number.isFinite(d.lastDay) ? Math.floor(d.lastDay) : null;
  s.daily.streak = Math.floor(num(d.streak));
  s.daily.total = Math.floor(num(d.total));

  const q = raw.quests || {};
  s.quests.day = Number.isFinite(q.day) ? Math.floor(q.day) : null;
  s.quests.bonusClaimed = !!q.bonusClaimed;
  if (Array.isArray(q.list)) {
    s.quests.list = q.list
      .filter((x) => x && QUEST_TYPES[x.type] && num(x.target) > 0)
      .slice(0, 6)
      .map((x) => ({
        type: x.type,
        target: num(x.target),
        progress: Math.min(num(x.progress), num(x.target)),
        gems: Math.floor(num(x.gems, QUEST_TYPES[x.type].gems)),
        claimed: !!x.claimed,
      }));
  }

  for (const id of Object.keys(raw.achievements || {})) {
    if (ACHIEVEMENT_BY_ID[id] && raw.achievements[id]) s.achievements[id] = true;
  }

  s.createdAt = num(raw.createdAt, now);
  s.lastSaved = num(raw.lastSaved, now);
  return s;
}
