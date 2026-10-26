import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, hydrate } from '../src/core/state.js';
import { GOLDEN } from '../src/data/meta.js';
import { GoldenTimer, collectGolden } from '../src/systems/golden.js';
import { checkAchievements } from '../src/systems/meta.js';

test('golden gear: appears after the wait, floats away after its life', () => {
  const t = new GoldenTimer(() => 0); // always the shortest wait
  assert.equal(t.tick(GOLDEN.minWait - 1), null);
  assert.equal(t.active, false);
  assert.equal(t.tick(2), 'spawn');
  assert.equal(t.active, true);
  assert.equal(t.tick(GOLDEN.life - 1), null);
  assert.equal(t.tick(2), 'expire');
  assert.equal(t.active, false);
});

test('golden gear: does not appear while spawning is blocked (tutorial)', () => {
  const t = new GoldenTimer(() => 0);
  for (let i = 0; i < 1000; i++) assert.equal(t.tick(1, false), null);
  assert.equal(t.tick(GOLDEN.maxWait, true), 'spawn'); // the countdown only runs once allowed
});

test('golden gear: collecting pays coins, counts, and can unlock the achievement', () => {
  const s = createInitialState();
  const t = new GoldenTimer(() => 0);
  t.tick(1000);
  assert.equal(t.active, true);
  const r = collectGolden(s, () => 0); // shortest reward, gem roll succeeds
  t.collect();
  assert.equal(t.active, false);
  assert.ok(r.coins >= GOLDEN.minCoins);
  assert.equal(r.gems, 1);
  assert.equal(s.coins, r.coins);
  assert.equal(s.stats.goldenGears, 1);
  const fresh = checkAchievements(s);
  assert.ok(fresh.some((a) => a.id === 'golden1'));
  assert.equal(collectGolden(s, () => 0.99).gems, 0);
});

test('golden gear count survives save repair', () => {
  assert.equal(hydrate({ stats: { goldenGears: 7 } }).stats.goldenGears, 7);
  assert.equal(hydrate({ stats: { goldenGears: -3 } }).stats.goldenGears, 0);
});
