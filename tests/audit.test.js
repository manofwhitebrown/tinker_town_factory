// Regression tests for the bugs found in the post-Part-8 audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createInitialState, hydrate } from '../src/core/state.js';
import { CONFIG } from '../src/data/config.js';
import { MACHINES } from '../src/data/machines.js';
import { addCoins, updateEconomy, buyMachine } from '../src/systems/economy.js';
import { applyOffline } from '../src/systems/offline.js';
import { advanceTutorial, currentStep } from '../src/systems/tutorial.js';
import { claimDaily, claimQuest, dailyStatus, refreshQuests, track } from '../src/systems/meta.js';
import { QUEST_BONUS_GEMS } from '../src/data/meta.js';

const noon = (n) => new Date(2026, 0, 1 + n, 12).getTime();
const finiteDeep = (o) => Object.values(o).every((v) => (v && typeof v === 'object' ? finiteDeep(v) : typeof v !== 'number' || Number.isFinite(v)));

// ---- CI: the Android build must be able to run gradlew ----
test('android workflow makes gradlew executable before every use', () => {
  const yml = fs.readFileSync(new URL('../.github/workflows/android.yml', import.meta.url), 'utf8');
  const lines = yml.split('\n');
  const uses = lines.map((l, i) => (l.includes('./gradlew') ? i : -1)).filter((i) => i >= 0);
  assert.ok(uses.length >= 2, 'debug and release both call gradlew');
  for (const i of uses) {
    const before = lines.slice(0, i).join('\n');
    // the closest chmod above this call must come after the previous job/step that built the project
    assert.ok(before.lastIndexOf('chmod +x android/gradlew') > before.lastIndexOf('npx cap sync android'),
      `line ${i + 1}: chmod +x android/gradlew must run before ./gradlew`);
  }
});

// ---- numbers can never overflow ----
test('addCoins clamps to the safety cap and ignores junk', () => {
  const s = createInitialState();
  addCoins(s, 6e299); addCoins(s, 6e299);
  assert.equal(s.coins, CONFIG.maxCoins);
  assert.equal(s.lifetimeCoins, CONFIG.maxCoins);
  const before = s.coins;
  addCoins(s, NaN); addCoins(s, -5); addCoins(s, 0);
  assert.equal(s.coins, before);
  addCoins(s, Infinity);
  assert.equal(s.coins, CONFIG.maxCoins);
});

test('a tampered save with absurd levels and coins cannot create Infinity or NaN', () => {
  const raw = { coins: 1e308, lifetimeCoins: 1e308, runCoins: 1e308, gems: 1e308, machines: {}, prestige: { points: 1e308, totalPoints: 1e308, count: 1e308 } };
  for (const m of MACHINES) raw.machines[m.id] = { level: 1e308, auto: true, running: true, progress: 0 };
  const s = hydrate(raw);
  assert.ok(s.machines.sewing.level <= CONFIG.maxLevel);
  assert.ok(s.gems <= CONFIG.maxGems);
  updateEconomy(s, 1);
  applyOffline(s, 8 * 3600);
  buyMachine(s, 'sewing', 'max');
  assert.ok(finiteDeep(s), 'every number in the state is finite');
});

// ---- quests are not lost at midnight ----
test('finished but unclaimed quests are paid out when the day rolls over', () => {
  const s = createInitialState();
  refreshQuests(s, noon(0));
  const [a, b] = s.quests.list;
  track(s, a.type, a.target); // finish the first quest only
  if (b.type !== a.type) assert.ok(b.progress < b.target);
  const gemsBefore = s.gems;
  const doneBefore = s.stats.questsDone;
  assert.equal(refreshQuests(s, noon(1)), true);
  assert.equal(s.gems - gemsBefore, a.gems, 'paid for the finished quest');
  assert.equal(s.stats.questsDone, doneBefore + 1);
  assert.ok(s.quests.list.every((q) => q.progress === 0 && !q.claimed), 'fresh list');
});

test('rollover pays the all-quests bonus too, but only once', () => {
  const s = createInitialState();
  refreshQuests(s, noon(0));
  for (const q of s.quests.list) q.progress = q.target;
  const expected = s.quests.list.reduce((n, q) => n + q.gems, 0) + QUEST_BONUS_GEMS;
  refreshQuests(s, noon(1));
  assert.equal(s.gems, expected);
  refreshQuests(s, noon(1)); // same day again: nothing more
  assert.equal(s.gems, expected);
});

test('already claimed quests are not paid a second time at rollover', () => {
  const s = createInitialState();
  refreshQuests(s, noon(0));
  const q = s.quests.list[0];
  track(s, q.type, q.target);
  claimQuest(s, 0);
  const gems = s.gems;
  refreshQuests(s, noon(1));
  assert.equal(s.gems, gems);
});

// ---- daily reward when the device clock is behind ----
test('daily reward: a clock behind the last claim stays locked but says why', () => {
  const s = createInitialState();
  claimDaily(s, noon(7));
  const st = dailyStatus(s, noon(3));
  assert.equal(st.claimable, false);
  assert.equal(st.clockBehind, true);
  assert.equal(dailyStatus(s, noon(7)).clockBehind, false); // plain "already claimed today"
});

// ---- tutorial cannot get stuck ----
test('tutorial moves on if the player builds the Loom before levelling the Sewing Machine to 3', () => {
  const s = createInitialState();
  s.settings.tutorialStep = 1; // "Spend coins on Buy..."
  s.stats.taps = 5;
  s.machines.sewing.level = 2;
  s.machines.loom.level = 1;
  advanceTutorial(s);
  assert.equal(currentStep(s).id, 'auto');
});
