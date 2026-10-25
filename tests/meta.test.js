import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, hydrate } from '../src/core/state.js';
import { deserialize, serialize } from '../src/core/save.js';
import { applyOffline } from '../src/systems/offline.js';
import { getGlobalMultiplier, offlineCapSeconds, buyAuto, updateEconomy, addCoins } from '../src/systems/economy.js';
import {
  buyGemItem, checkAchievements, claimDaily, claimQuest, dailyStatus, dayNumber, gemItemCost,
  makeQuests, refreshQuests, track,
} from '../src/systems/meta.js';
import { DAILY, QUEST_BONUS_GEMS } from '../src/data/meta.js';

const DAY = 86400000;
const noon = (n) => new Date(2026, 0, 1 + n, 12).getTime(); // local noon, n days after Jan 1

test('daily reward: first claim, then locked until the next local day', () => {
  const s = createInitialState();
  assert.equal(dailyStatus(s, noon(0)).claimable, true);
  const r = claimDaily(s, noon(0));
  assert.equal(r.streak, 1);
  assert.ok(s.coins >= DAILY.minCoins);
  assert.equal(claimDaily(s, noon(0)), null);
  assert.equal(dailyStatus(s, noon(0) + 3600e3).claimable, false);
  assert.equal(dailyStatus(s, noon(1)).claimable, true);
});

test('daily streak grows on consecutive days and resets after a miss', () => {
  const s = createInitialState();
  claimDaily(s, noon(0));
  claimDaily(s, noon(1));
  assert.equal(claimDaily(s, noon(2)).streak, 3);
  assert.equal(s.daily.streak, 3);
  assert.equal(claimDaily(s, noon(4)).streak, 1); // skipped a day
  assert.equal(s.daily.total, 4);
});

test('daily: gems paid on gem days, 7-day cycle loops, clock moved back cannot double claim', () => {
  const s = createInitialState();
  for (let i = 0; i < 7; i++) claimDaily(s, noon(i));
  assert.equal(s.gems, DAILY.rewards.reduce((a, r) => a + r.gems, 0));
  assert.equal(claimDaily(s, noon(7)).streak, 8);
  assert.equal(claimDaily(s, noon(3)), null);
});

test('dayNumber changes at local midnight', () => {
  const a = new Date(2026, 5, 10, 23, 59).getTime();
  const b = new Date(2026, 5, 11, 0, 1).getTime();
  assert.equal(dayNumber(b) - dayNumber(a), 1);
});

test('quests: same day gives same quests, 3 distinct types, new day replaces them', () => {
  const s = createInitialState();
  assert.equal(refreshQuests(s, noon(0)), true);
  const first = JSON.stringify(s.quests.list);
  assert.equal(s.quests.list.length, 3);
  assert.equal(new Set(s.quests.list.map((q) => q.type)).size, 3);
  assert.equal(refreshQuests(s, noon(0) + 3600e3), false);
  assert.equal(JSON.stringify(s.quests.list), first);
  assert.deepEqual(makeQuests(s, dayNumber(noon(0))), s.quests.list);
  assert.equal(refreshQuests(s, noon(1)), true);
});

test('quests: progress, claim once, bonus when all claimed', () => {
  const s = createInitialState();
  refreshQuests(s, noon(0));
  for (const q of s.quests.list) track(s, q.type, q.target * 2);
  assert.ok(s.quests.list.every((q) => q.progress === q.target));
  let total = 0;
  s.quests.list.forEach((q, i) => { total += claimQuest(s, i); });
  const base = s.quests.list.reduce((a, q) => a + q.gems, 0);
  assert.equal(total, base + QUEST_BONUS_GEMS);
  assert.equal(s.gems, total);
  assert.equal(claimQuest(s, 0), 0);
  assert.equal(s.stats.questsDone, 3);
});

test('quests: cannot claim an unfinished quest', () => {
  const s = createInitialState();
  refreshQuests(s, noon(0));
  assert.equal(claimQuest(s, 0), 0);
  assert.equal(s.gems, 0);
});

test('achievements unlock once and pay gems', () => {
  const s = createInitialState();
  assert.equal(checkAchievements(s).length, 0);
  s.stats.taps = 1;
  const got = checkAchievements(s);
  assert.deepEqual(got.map((a) => a.id), ['tap1']);
  assert.equal(s.gems, got[0].gems);
  assert.equal(checkAchievements(s).length, 0);
  assert.equal(s.gems, got[0].gems);
});

test('gem shop: crate, boost, permanent upgrades', () => {
  const s = createInitialState();
  s.gems = 100;
  const coins0 = s.coins;
  assert.ok(buyGemItem(s, 'crate'));
  assert.ok(s.coins > coins0);
  assert.equal(s.gems, 97);

  const mult0 = getGlobalMultiplier(s);
  assert.ok(buyGemItem(s, 'boost'));
  assert.equal(getGlobalMultiplier(s), mult0 * 2);

  assert.ok(buyGemItem(s, 'polish'));
  assert.equal(s.gemShop.polish, 1);
  assert.ok(Math.abs(getGlobalMultiplier(s) - mult0 * 2 * 1.05) < 1e-9);

  const cap0 = offlineCapSeconds(s);
  assert.ok(buyGemItem(s, 'vault'));
  assert.equal(offlineCapSeconds(s), cap0 + 3600);
});

test('gem shop: cannot overspend, max out, or over-stack boost', () => {
  const s = createInitialState();
  s.gems = 2;
  assert.equal(buyGemItem(s, 'crate'), false);
  assert.equal(s.gems, 2);
  s.gems = 1e6;
  for (let i = 0; i < 20; i++) buyGemItem(s, 'vault');
  assert.equal(s.gemShop.vault, 4);
  assert.equal(gemItemCost(s, 'vault'), null);
  for (let i = 0; i < 10; i++) buyGemItem(s, 'boost');
  assert.ok(s.buffs.boost <= 3600);
  assert.equal(gemItemCost(s, 'boost'), null);
});

test('Double Time counts down while playing and does not inflate offline earnings', () => {
  const s = createInitialState();
  addCoins(s, 1e6);
  s.coins = 1e6;
  buyAuto(s, 'sewing');
  const plain = createInitialState();
  plain.machines.sewing.auto = true;
  s.buffs.boost = 900;
  const away = applyOffline(s, 600);
  const awayPlain = applyOffline(plain, 600);
  assert.equal(away.coins, awayPlain.coins);
  assert.equal(s.buffs.boost, 900);
  updateEconomy(s, 10);
  assert.equal(s.buffs.boost, 890);
});

test('save v2 migrates to v3 with empty meta, and v3 round-trips', () => {
  const old = JSON.stringify({ v: 2, data: { coins: 50, lifetimeCoins: 50, runCoins: 50 } });
  const s = deserialize(old);
  assert.equal(s.gems, 0);
  assert.equal(s.daily.streak, 0);
  assert.deepEqual(s.quests.list, []);
  assert.equal(s.gemShop.polish, 0);

  s.gems = 7;
  s.achievements.tap1 = true;
  claimDaily(s, noon(0));
  refreshQuests(s, noon(0));
  const back = deserialize(serialize(s));
  assert.equal(back.gems, s.gems);
  assert.equal(back.daily.streak, 1);
  assert.equal(back.quests.list.length, 3);
  assert.equal(back.achievements.tap1, true);
});

test('hydrate repairs garbage meta data', () => {
  const s = hydrate({
    gems: -5, achievements: { nope: true, tap1: true },
    gemShop: { polish: 999, vault: 'x' },
    daily: { lastDay: 'x', streak: -1 },
    quests: { day: 5, list: [{ type: 'bad', target: 5 }, { type: 'taps', target: 10, progress: 99 }] },
  });
  assert.equal(s.gems, 0);
  assert.deepEqual(Object.keys(s.achievements), ['tap1']);
  assert.equal(s.gemShop.polish, 10);
  assert.equal(s.gemShop.vault, 0);
  assert.equal(s.daily.lastDay, null);
  assert.equal(s.quests.list.length, 1);
  assert.equal(s.quests.list[0].progress, 10);
});
