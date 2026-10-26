import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { busyWings, sunPosition, townPhase } from '../src/systems/townclock.js';
import { WINGS } from '../src/data/machines.js';

test('town phase follows the clock', () => {
  const want = { 0: 'night', 5: 'night', 6: 'day', 12: 'day', 16: 'day', 17: 'dusk', 19: 'dusk', 20: 'night', 23: 'night' };
  for (const [h, p] of Object.entries(want)) assert.equal(townPhase(Number(h)), p, `hour ${h}`);
});

test('sun rises on the left, peaks at midday, sets on the right, always inside the scene', () => {
  const a = sunPosition(6), b = sunPosition(12), c = sunPosition(19);
  assert.ok(a.x < b.x && b.x < c.x);
  assert.ok(b.y < a.y && b.y < c.y);
  for (let h = 0; h < 24; h++) {
    const p = sunPosition(h);
    assert.ok(p.x >= 0 && p.x <= 360 && p.y >= 0 && p.y <= 100, `hour ${h}`);
  }
});

test('chimneys only puff in wings with an automated machine', () => {
  const s = createInitialState();
  assert.equal(Object.values(busyWings(s)).some(Boolean), false);
  s.machines.sewing.auto = true;
  const busy = busyWings(s);
  assert.equal(busy.cloth, true);
  assert.equal(busy.toys, false);
  assert.deepEqual(Object.keys(busy), WINGS.map((w) => w.id));
});
