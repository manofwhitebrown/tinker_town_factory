import {
  ACHIEVEMENTS, DAILY, EARN_QUEST, GEM_SHOP_BY_ID, QUEST_BONUS_GEMS, QUEST_COUNT, QUEST_TYPES,
} from '../data/meta.js';
import {
  addCoins, gemShopLevel, incomePerSecond, potentialIncomePerSecond,
} from './economy.js';

// ---------------------------------------------------------------- days

/** Whole local calendar days since 1970 (changes at the player's local midnight). */
export function dayNumber(now = Date.now()) {
  const d = new Date(now);
  return Math.floor((now - d.getTimezoneOffset() * 60000) / 86400000);
}

export function addGems(state, n) {
  const g = Math.max(0, Math.floor(n));
  state.gems += g;
  return g;
}

// ---------------------------------------------------------------- daily reward

/**
 * What the daily button should do right now.
 *  claimable: can claim today
 *  streak:    the streak you will have after claiming (or have, if already claimed)
 */
export function dailyStatus(state, now = Date.now()) {
  const today = dayNumber(now);
  const d = state.daily;
  const last = d.lastDay;
  if (last !== null && last >= today) return { claimable: false, streak: d.streak, today };
  const continues = last !== null && last === today - 1;
  return { claimable: true, streak: continues ? d.streak + 1 : 1, today };
}

/** Which of the 7 reward slots a streak value lands on (0-based). */
export const rewardSlot = (streak) => (Math.max(1, streak) - 1) % DAILY.rewards.length;

export function dailyReward(state, streak) {
  const r = DAILY.rewards[rewardSlot(streak)];
  const coins = Math.max(DAILY.minCoins, Math.ceil(potentialIncomePerSecond(state) * 60 * r.coinMinutes));
  return { coins, gems: r.gems };
}

/** Returns the reward given, or null when already claimed today. */
export function claimDaily(state, now = Date.now()) {
  const st = dailyStatus(state, now);
  if (!st.claimable) return null;
  const reward = dailyReward(state, st.streak);
  addCoins(state, reward.coins);
  addGems(state, reward.gems);
  state.daily.lastDay = st.today;
  state.daily.streak = st.streak;
  state.daily.total += 1;
  return { ...reward, streak: st.streak };
}

// ---------------------------------------------------------------- quests

/** Small seeded PRNG so a given day always produces the same quest picks. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeQuests(state, day) {
  const rand = mulberry32(day * 2654435761);
  const types = Object.keys(QUEST_TYPES);
  // Fisher-Yates with the seeded rand, take the first QUEST_COUNT.
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types.slice(0, QUEST_COUNT).map((type) => {
    const def = QUEST_TYPES[type];
    let target;
    if (type === 'earn') {
      target = Math.max(EARN_QUEST.minCoins,
        Math.ceil(potentialIncomePerSecond(state) * EARN_QUEST.potentialSeconds));
    } else {
      target = def.targets[Math.floor(rand() * def.targets.length)];
    }
    return { type, target, progress: 0, gems: def.gems, claimed: false };
  });
}

/** Start a new set of quests when the local day has changed. Returns true if it did. */
export function refreshQuests(state, now = Date.now()) {
  const today = dayNumber(now);
  if (state.quests.day === today) return false;
  state.quests = { day: today, list: makeQuests(state, today), bonusClaimed: false };
  return true;
}

/** Record progress. type: 'taps' | 'levels' | 'cycles' | 'earn'. */
export function track(state, type, amount = 1) {
  if (!(amount > 0)) return;
  for (const q of state.quests.list) {
    if (q.type === type && q.progress < q.target) q.progress = Math.min(q.target, q.progress + amount);
  }
}

export const questDone = (q) => q.progress >= q.target;

/** Quests that are finished but not collected yet. */
export function claimableQuests(state) {
  return state.quests.list.filter((q) => !q.claimed && questDone(q)).length;
}

/** Returns gems paid (including the all-done bonus), or 0 if not claimable. */
export function claimQuest(state, index) {
  const q = state.quests.list[index];
  if (!q || q.claimed || !questDone(q)) return 0;
  q.claimed = true;
  state.stats.questsDone += 1;
  let gems = addGems(state, q.gems);
  if (!state.quests.bonusClaimed && state.quests.list.every((x) => x.claimed)) {
    state.quests.bonusClaimed = true;
    gems += addGems(state, QUEST_BONUS_GEMS);
  }
  return gems;
}

// ---------------------------------------------------------------- achievements

/** Unlock anything newly earned and pay its gems. Returns the newly unlocked achievements. */
export function checkAchievements(state) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if (a.check(state)) {
      state.achievements[a.id] = true;
      addGems(state, a.gems);
      fresh.push(a);
    }
  }
  return fresh;
}

// ---------------------------------------------------------------- gem shop

export function gemItemCost(state, id) {
  const item = GEM_SHOP_BY_ID[id];
  if (!item) return null;
  if (item.kind === 'consume') {
    if (id === 'boost' && state.buffs.boost + item.seconds > item.maxSeconds) return null; // would waste gems
    return item.cost;
  }
  const lvl = gemShopLevel(state, id);
  return lvl >= item.max ? null : Math.ceil(item.baseCost * item.growth ** lvl);
}

/** Returns true if the purchase went through. */
export function buyGemItem(state, id) {
  const item = GEM_SHOP_BY_ID[id];
  const cost = gemItemCost(state, id);
  if (!item || cost === null || state.gems < cost) return false;
  state.gems -= cost;
  if (id === 'crate') {
    const base = Math.max(incomePerSecond(state), potentialIncomePerSecond(state) / 4);
    addCoins(state, Math.max(DAILY.minCoins, Math.ceil(base * 3600 * item.hours)));
  } else if (id === 'boost') {
    state.buffs.boost += item.seconds;
  } else {
    state.gemShop[id] = gemShopLevel(state, id) + 1;
  }
  return true;
}
