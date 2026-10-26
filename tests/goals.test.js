import { plainState } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESTIGE } from '../src/data/prestige.js';
import { nextGoal } from '../src/systems/goals.js';

test('new game: closest goal is the first manager rather than the Toy Shop (5M lifetime)', () => {
  const s = plainState();
  s.runCoins = PRESTIGE.divisor / 2; s.lifetimeCoins = PRESTIGE.divisor / 2;
  const g = nextGoal(s);
  assert.equal(g.label, 'Hire your first manager');
  assert.equal(g.fraction, 0.5);
});

test('after the first prestige the goal is the next wing', () => {
  const s = plainState();
  s.prestige.count = 1;
  s.lifetimeCoins = 2.5e6;
  const g = nextGoal(s);
  assert.equal(g.label, 'Open the Toy Shop');
  assert.equal(g.fraction, 0.5);
});

test('goal moves on as wings open, and ends when everything is open', () => {
  const s = plainState();
  s.prestige.count = 1;
  s.wings.toys = true;
  assert.equal(nextGoal(s).label, 'Open the Gadget Garage');
  s.wings.gadgets = true; s.wings.candy = true;
  assert.equal(nextGoal(s).label, 'Open the Clockwork Tower');
  s.wings.clock = true; s.wings.sky = true; s.wings.star = true;
  assert.equal(nextGoal(s), null);
});

test('no "first manager" goal once a manager can be hired', () => {
  const s = plainState();
  s.runCoins = 2e6; s.lifetimeCoins = 2e6;
  s.wings.toys = true; s.wings.gadgets = true; s.wings.candy = true;
  assert.equal(nextGoal(s).label, 'Open the Clockwork Tower');
  s.wings.clock = true; s.wings.sky = true; s.wings.star = true;
  assert.equal(nextGoal(s), null);
});

test('brand new game (everything at 0%): the smaller target wins the tie', () => {
  assert.equal(nextGoal(plainState()).label, 'Hire your first manager');
});
