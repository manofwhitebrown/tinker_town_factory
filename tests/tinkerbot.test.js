import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { botMessage } from '../src/systems/tinkerbot.js';
import { claimDaily, spinWheel } from '../src/systems/meta.js';
import { PRESTIGE } from '../src/data/prestige.js';

const noon = (n) => new Date(2026, 0, 1 + n, 12).getTime();
function veteran() {
  const s = createInitialState();
  s.settings.tutorialStep = 99;
  s.lifetimeCoins = 500;
  return s;
}

test('bot stays quiet during the tutorial and when hints are off', () => {
  const s = createInitialState();
  assert.equal(botMessage(s, noon(0)), null);
  const v = veteran();
  v.settings.hints = false;
  assert.equal(botMessage(v, noon(0)), null);
});

test('bot priorities: daily reward, then spin, then quests, then manager, then best buy', () => {
  const s = veteran();
  let m = botMessage(s, noon(0));
  assert.match(m.text, /daily reward/); assert.equal(m.tab, 'rewards');
  claimDaily(s, noon(0));
  m = botMessage(s, noon(0));
  assert.match(m.text, /Lucky Spin/);
  spinWheel(s, () => 0, noon(0));
  s.quests = { day: 1, bonusClaimed: false, list: [{ type: 'taps', target: 5, progress: 5, gems: 1, claimed: false }] };
  assert.match(botMessage(s, noon(0)).text, /quest/);
  s.quests.list[0].claimed = true;
  s.runCoins = PRESTIGE.divisor * 2;
  assert.match(botMessage(s, noon(0)).text, /manager/);
  s.runCoins = 0;
  m = botMessage(s, noon(0));
  assert.match(m.text, /Automate the Sewing Machine/);
  assert.equal(m.tab, null);
});

test('bot falls back to friendly chatter when nothing is useful', () => {
  const s = veteran();
  claimDaily(s, noon(0));
  spinWheel(s, () => 0, noon(0));
  s.machines.sewing.auto = true;
  s.machines.loom.level = 0;
  const m = botMessage(s, noon(0), null);
  assert.ok(m && m.text.length > 5 && m.tab === null);
});
