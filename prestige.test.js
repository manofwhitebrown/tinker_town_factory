import { plainState } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { addCoins, getGlobalMultiplier, speedMultiplier, machineOutput, cycleTimeOf } from '../src/systems/economy.js';
import { MACHINE_BY_ID } from '../src/data/machines.js';
import { PRESTIGE } from '../src/data/prestige.js';
import {
  pendingPoints, coinsForNextPoint, canPrestige, doPrestige, upgradeCost, buyUpgrade,
} from '../src/systems/prestige.js';

test('manager points grow with the square root of run earnings', () => {
  const s = plainState();
  assert.equal(pendingPoints(s), 0);
  assert.equal(canPrestige(s), false);
  const D = PRESTIGE.divisor;
  s.runCoins = D; assert.equal(pendingPoints(s), 1);
  s.runCoins = 4 * D; assert.equal(pendingPoints(s), 2);
  s.runCoins = 100 * D; assert.equal(pendingPoints(s), 10);
  s.runCoins = 1e6 * D; assert.equal(pendingPoints(s), 1000);
  assert.equal(coinsForNextPoint(s), 1001 ** 2 * D);
});

test('addCoins tracks run and lifetime separately from spending', () => {
  const s = plainState();
  addCoins(s, 500);
  s.coins -= 200;
  assert.equal(s.runCoins, 500);
  assert.equal(s.lifetimeCoins, 500);
});

test('prestige is refused until at least one point is available', () => {
  const s = plainState();
  s.runCoins = PRESTIGE.divisor - 1;
  assert.equal(doPrestige(s), 0);
  assert.equal(s.prestige.count, 0);
});

test('prestige resets the run but keeps the permanent stuff', () => {
  const s = plainState();
  s.coins = 123; s.runCoins = 9 * PRESTIGE.divisor; s.lifetimeCoins = 2e7;
  s.machines.sewing.level = 40; s.machines.sewing.auto = true; s.machines.loom.level = 5;
  s.wings.toys = true;
  s.prestige.upgrades.thimble = 2;
  const gained = doPrestige(s);
  assert.equal(gained, 3);
  assert.equal(s.prestige.points, 3);
  assert.equal(s.prestige.totalPoints, 3);
  assert.equal(s.prestige.count, 1);
  assert.equal(s.coins, 0);
  assert.equal(s.runCoins, 0);
  assert.equal(s.machines.sewing.level, 1);
  assert.equal(s.machines.sewing.auto, false);
  assert.equal(s.machines.loom.level, 0);
  assert.equal(s.lifetimeCoins, 2e7);       // kept
  assert.equal(s.wings.toys, true);          // kept
  assert.equal(s.prestige.upgrades.thimble, 2); // kept
});

test('second run is faster: managers multiply income', () => {
  const s = plainState();
  const before = machineOutput(MACHINE_BY_ID.sewing, 10, s);
  s.runCoins = 100 * PRESTIGE.divisor; s.lifetimeCoins = 100 * PRESTIGE.divisor;
  doPrestige(s); // 10 managers -> +100%
  assert.equal(getGlobalMultiplier(s), 2);
  assert.equal(machineOutput(MACHINE_BY_ID.sewing, 10, s), before * 2);
});

test('spending managers never lowers the bonus', () => {
  const s = plainState();
  s.runCoins = 100 * PRESTIGE.divisor; s.lifetimeCoins = 100 * PRESTIGE.divisor;
  doPrestige(s);
  const mult = getGlobalMultiplier(s);
  assert.equal(buyUpgrade(s, 'seed'), true);
  assert.equal(getGlobalMultiplier(s), mult);
});

test('upgrade costs, max levels and affordability', () => {
  const s = plainState();
  assert.equal(upgradeCost(s, 'thimble'), 3);
  assert.equal(buyUpgrade(s, 'thimble'), false); // no points
  s.prestige.points = 100;
  assert.equal(buyUpgrade(s, 'thimble'), true);
  assert.equal(s.prestige.points, 97);
  assert.equal(upgradeCost(s, 'thimble'), Math.ceil(3 * 1.6));
  s.prestige.upgrades.nightshift = 5;
  assert.equal(upgradeCost(s, 'nightshift'), null);
  assert.equal(buyUpgrade(s, 'nightshift'), false);
  assert.equal(buyUpgrade(s, 'nope'), false);
});

test('Golden Thimble, Speedy Spools and Seed Money take effect', () => {
  const s = plainState();
  s.prestige.upgrades.thimble = 4;   // +100%
  assert.equal(getGlobalMultiplier(s), 2);
  s.prestige.upgrades.spools = 5;    // +50% speed
  assert.equal(speedMultiplier(s), 1.5);
  assert.ok(Math.abs(cycleTimeOf(MACHINE_BY_ID.sewing, s) - 0.4) < 1e-9);

  s.prestige.upgrades.seed = 3;      // 500 * 5^2
  s.runCoins = PRESTIGE.divisor; s.lifetimeCoins = PRESTIGE.divisor;
  doPrestige(s);
  assert.equal(s.coins, 12500);
});
