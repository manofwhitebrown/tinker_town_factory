import { plainState } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { CONFIG } from '../src/data/config.js';
import { MACHINE_BY_ID, MACHINES } from '../src/data/machines.js';
import {
  machineCost, maxAffordable, machineOutput, milestoneMultiplier, nextMilestone,
  buyMachine, startCycle, updateEconomy, isUnlocked, isVisible, incomePerSecond, resolveBuyCount,
} from '../src/systems/economy.js';

const sewing = MACHINE_BY_ID.sewing;
const loom = MACHINE_BY_ID.loom;

test('single level cost scales by the cost growth per level owned', () => {
  assert.equal(machineCost(loom, 0), 120);
  assert.equal(machineCost(loom, 1), Math.ceil(120 * CONFIG.costGrowth));
  assert.equal(machineCost(loom, 10), Math.ceil(120 * CONFIG.costGrowth ** 10));
});

test('bulk cost equals summing single purchases (within rounding)', () => {
  for (const owned of [0, 1, 5, 40]) {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += loom.baseCost * CONFIG.costGrowth ** (owned + i);
    assert.ok(Math.abs(machineCost(loom, owned, 10) - sum) <= 1);
  }
});

test('maxAffordable agrees with brute force', () => {
  for (const owned of [0, 1, 7, 30]) {
    for (const coins of [0, 50, 119, 120, 500, 10_000, 1e6, 3.3e9]) {
      let brute = 0;
      while (machineCost(loom, owned, brute + 1) <= coins) brute++;
      assert.equal(maxAffordable(loom, owned, coins), brute, `owned ${owned}, coins ${coins}`);
    }
  }
});

test('milestones double output', () => {
  assert.equal(milestoneMultiplier(9), 1);
  assert.equal(milestoneMultiplier(10), 2);
  assert.equal(milestoneMultiplier(25), 4);
  assert.equal(nextMilestone(10), 25);
  assert.equal(nextMilestone(999), null);
  assert.equal(machineOutput(sewing, 9), 9);
  assert.equal(machineOutput(sewing, 10), 20);
  assert.equal(machineOutput(sewing, 0), 0);
});

test('unlock chain and visibility', () => {
  const s = plainState();
  assert.equal(isUnlocked(s, 'sewing'), true);
  assert.equal(isUnlocked(s, 'loom'), true); // sewing owned
  assert.equal(isUnlocked(s, 'dyevat'), false);
  assert.equal(isVisible(s, 'dyevat'), true); // teaser
  assert.equal(isVisible(s, 'buttonpress'), false);
  s.machines.loom.level = 1;
  assert.equal(isUnlocked(s, 'dyevat'), true);
  assert.equal(isVisible(s, 'buttonpress'), true);
});

test('buy x1, x10, max and refusals', () => {
  const s = plainState();
  s.coins = 100;
  assert.deepEqual(buyMachine(s, 'loom', 1), { bought: 0, spent: 0 }); // 120 > 100
  s.coins = 130;
  const r = buyMachine(s, 'loom', 1);
  assert.equal(r.bought, 1);
  assert.equal(s.coins, 10);
  assert.equal(s.machines.loom.level, 1);

  s.coins = 1e6;
  assert.equal(buyMachine(s, 'loom', 10).bought, 10);
  assert.equal(s.machines.loom.level, 11);

  const before = s.coins;
  const max = buyMachine(s, 'loom', 'max');
  assert.ok(max.bought > 10);
  assert.ok(s.coins >= 0 && s.coins < before);
  // after buying max we can't afford another level
  assert.ok(s.coins < machineCost(loom, s.machines.loom.level, 1));
});

test('x10 is all-or-nothing', () => {
  const s = plainState();
  s.coins = machineCost(sewing, 1, 10) - 1;
  assert.equal(resolveBuyCount(s, sewing, 10), 0);
  s.coins += 1;
  assert.equal(resolveBuyCount(s, sewing, 10), 10);
});

test('cannot buy a locked machine', () => {
  const s = plainState();
  s.coins = 1e12;
  assert.equal(buyMachine(s, 'dyevat', 1).bought, 0);
});

test('tap runs one cycle then stops', () => {
  const s = plainState();
  assert.equal(startCycle(s, 'sewing'), true);
  assert.equal(startCycle(s, 'sewing'), false); // already running
  const produced = [];
  updateEconomy(s, 0.3, (id, a) => produced.push([id, a]));
  assert.equal(s.coins, 0);
  updateEconomy(s, 0.31, (id, a) => produced.push([id, a]));
  assert.equal(s.coins, 1);
  assert.deepEqual(produced, [['sewing', 1]]);
  assert.equal(s.machines.sewing.running, false);
  assert.equal(s.stats.taps, 1);
  updateEconomy(s, 5);
  assert.equal(s.coins, 1); // idle machines do nothing
});

test('cannot tap a machine you do not own', () => {
  const s = plainState();
  assert.equal(startCycle(s, 'loom'), false);
});

test('auto machines keep cycling (hook for Part 3)', () => {
  const s = plainState();
  s.machines.sewing.auto = true;
  for (let i = 0; i < 300; i++) updateEconomy(s, 0.1); // 30s
  assert.ok(Math.abs(s.coins - 50) <= 1, `coins ${s.coins}`); // 30 / 0.6
  assert.ok(Math.abs(incomePerSecond(s) - 1 / 0.6) < 1e-9);
});

test('a long step finishes several cycles at once', () => {
  const s = plainState();
  s.machines.sewing.auto = true;
  updateEconomy(s, 6.1);
  assert.equal(s.coins, 10);
});

test('lifetime coins track earnings but not spending', () => {
  const s = plainState();
  s.machines.sewing.auto = true;
  updateEconomy(s, 60);
  const earned = s.lifetimeCoins;
  s.coins = earned;
  buyMachine(s, 'sewing', 1);
  assert.equal(s.lifetimeCoins, earned);
  assert.ok(s.coins < earned);
});

test('tuning data is sane', () => {
  for (let i = 0; i < MACHINES.length; i++) {
    const d = MACHINES[i];
    assert.ok(d.baseCost > 0 && d.baseOutput > 0 && d.cycleTime > 0, d.id);
    if (i > 0) assert.ok(d.baseCost > MACHINES[i - 1].baseCost, `${d.id} costs more than previous`);
  }
  assert.equal(new Set(MACHINES.map((m) => m.id)).size, MACHINES.length);
});
