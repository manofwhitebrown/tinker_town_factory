import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { WINGS, MACHINES, PREV_IN_WING } from '../src/data/machines.js';
import { addCoins, isUnlocked, isVisible, buyMachine } from '../src/systems/economy.js';
import { checkWingUnlocks } from '../src/systems/wings.js';

test('only the first wing starts open', () => {
  const s = createInitialState();
  assert.deepEqual(Object.entries(s.wings).filter(([, v]) => v).map(([k]) => k), ['cloth']);
});

test('wings open at lifetime-earnings milestones, once', () => {
  const s = createInitialState();
  addCoins(s, 4.9e6);
  assert.deepEqual(checkWingUnlocks(s), []);
  addCoins(s, 2e5);
  assert.deepEqual(checkWingUnlocks(s).map((w) => w.id), ['toys']);
  assert.deepEqual(checkWingUnlocks(s), []); // already open
  addCoins(s, 1e13);
  assert.deepEqual(checkWingUnlocks(s).map((w) => w.id), ['gadgets']);
});

test('machines of a closed wing are hidden and unbuyable', () => {
  const s = createInitialState();
  s.coins = 1e30;
  assert.equal(isVisible(s, 'stuffing'), false);
  assert.equal(isUnlocked(s, 'stuffing'), false);
  assert.equal(buyMachine(s, 'stuffing', 1).bought, 0);
  s.wings.toys = true;
  assert.equal(isVisible(s, 'stuffing'), true);
  assert.equal(isUnlocked(s, 'stuffing'), true);   // first of its wing: no chain needed
  assert.equal(isUnlocked(s, 'blockcutter'), false);
  assert.equal(isVisible(s, 'blockcutter'), true); // teaser
  assert.equal(isVisible(s, 'tracklayer'), false);
  assert.equal(buyMachine(s, 'stuffing', 1).bought, 1);
  assert.equal(isUnlocked(s, 'blockcutter'), true);
});

test('wing chain does not depend on other wings', () => {
  assert.equal(PREV_IN_WING.sewing, null);
  assert.equal(PREV_IN_WING.stuffing, null);
  assert.equal(PREV_IN_WING.loom.id, 'sewing');
  assert.equal(PREV_IN_WING.blockcutter.id, 'stuffing');
});

test('wing data is consistent', () => {
  const ids = new Set(WINGS.map((w) => w.id));
  for (const m of MACHINES) assert.ok(ids.has(m.wing), `${m.id} has a real wing`);
  for (const w of WINGS) assert.ok(MACHINES.some((m) => m.wing === w.id), `${w.id} has machines`);
  const thresholds = WINGS.map((w) => w.unlockAt);
  assert.deepEqual([...thresholds].sort((a, b) => a - b), thresholds, 'unlocks are in ascending order');
  assert.equal(WINGS[0].unlockAt, 0);
});

test('every machine has an icon and a sensible autoCost', async () => {
  const { ICONS } = await import('../src/ui/icons.js');
  for (const m of MACHINES) {
    assert.ok(ICONS[m.icon], `${m.id} icon "${m.icon}" exists`);
    assert.ok(m.autoCost > m.baseCost, m.id);
  }
});

test('there are 7 wings and 36 machines, each wing has 5 or 6 machines', () => {
  assert.equal(WINGS.length, 7);
  assert.equal(MACHINES.length, 36);
  for (const w of WINGS) {
    const n = MACHINES.filter((m) => m.wing === w.id).length;
    assert.ok(n === 5 || n === 6, `${w.id} has ${n}`);
  }
});

test('later wings open before their first machine becomes affordable to a beginner, and costs always rise', () => {
  for (let i = 1; i < MACHINES.length; i++) {
    assert.ok(MACHINES[i].baseCost > MACHINES[i - 1].baseCost, `${MACHINES[i].id} costs more than ${MACHINES[i - 1].id}`);
    assert.ok(MACHINES[i].baseOutput > MACHINES[i - 1].baseOutput, `${MACHINES[i].id} earns more than ${MACHINES[i - 1].id}`);
  }
  for (const w of WINGS.slice(1)) {
    const first = MACHINES.find((m) => m.wing === w.id);
    assert.ok(w.unlockAt < first.baseCost, `${w.id} opens before its first machine is affordable`);
  }
});

test('all ids are unique and the new wings unlock in order', () => {
  assert.equal(new Set(MACHINES.map((m) => m.id)).size, MACHINES.length);
  assert.equal(new Set(WINGS.map((w) => w.id)).size, WINGS.length);
  const s = createInitialState();
  addCoins(s, 1e30);
  assert.deepEqual(checkWingUnlocks(s).map((w) => w.id), ['toys', 'gadgets', 'candy', 'clock', 'sky']);
  addCoins(s, 1e34);
  assert.deepEqual(checkWingUnlocks(s).map((w) => w.id), ['star']);
});
