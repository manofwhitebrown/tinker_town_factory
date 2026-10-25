import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { MACHINE_BY_ID } from '../src/data/machines.js';
import { buyAuto, updateEconomy, incomePerSecond } from '../src/systems/economy.js';
import { applyOffline } from '../src/systems/offline.js';

const sewing = MACHINE_BY_ID.sewing;

test('autoCost defaults to 5x base cost', () => {
  assert.equal(sewing.autoCost, 75);
  assert.equal(MACHINE_BY_ID.loom.autoCost, 600);
});

test('buyAuto charges once and only when affordable and owned', () => {
  const s = createInitialState();
  s.coins = 74;
  assert.equal(buyAuto(s, 'sewing'), false);
  s.coins = 100;
  assert.equal(buyAuto(s, 'sewing'), true);
  assert.equal(s.coins, 25);
  assert.equal(s.machines.sewing.auto, true);
  assert.equal(buyAuto(s, 'sewing'), false); // already automated
  s.coins = 1e9;
  assert.equal(buyAuto(s, 'loom'), false);   // not owned yet
});

test('an automated machine runs on its own', () => {
  const s = createInitialState();
  s.coins = 75;
  buyAuto(s, 'sewing');
  for (let i = 0; i < 100; i++) updateEconomy(s, 0.1); // 10s
  assert.ok(Math.abs(s.coins - 16) <= 1, `coins ${s.coins}`); // 10 / 0.6 cycles
  assert.ok(incomePerSecond(s) > 1.6);
});

test('offline: automated machine earns floor(time / cycle) cycles', () => {
  const s = createInitialState();
  s.machines.sewing.auto = true;
  const r = applyOffline(s, 600);
  assert.equal(r.coins, 1000); // 600 / 0.6
  assert.equal(s.coins, 1000);
  assert.equal(s.runCoins, 1000);
  assert.equal(s.stats.offlineCoins, 1000);
  assert.equal(r.capped, false);
});

test('offline: leftover cycle progress is kept (no free or lost time)', () => {
  const s = createInitialState();
  s.machines.sewing.auto = true;
  applyOffline(s, 1);                       // 1 full cycle + 0.4s
  assert.equal(s.coins, 1);
  assert.ok(Math.abs(s.machines.sewing.progress - 0.4) < 1e-9);
  assert.equal(s.machines.sewing.running, true);
});

test('offline: matches what online play would have produced', () => {
  const online = createInitialState();
  const offline = createInitialState();
  for (const s of [online, offline]) { s.machines.loom.level = 4; s.machines.loom.auto = true; s.machines.sewing.level = 7; s.machines.sewing.auto = true; }
  for (let i = 0; i < 6000; i++) updateEconomy(online, 0.1); // 600s
  applyOffline(offline, 600);
  assert.ok(Math.abs(online.coins - offline.coins) / online.coins < 0.01, `${online.coins} vs ${offline.coins}`);
});

test('offline: capped at 8 hours', () => {
  const s = createInitialState();
  s.machines.sewing.auto = true;
  const r = applyOffline(s, 30 * 3600);
  assert.equal(r.capped, true);
  assert.equal(r.seconds, 8 * 3600);
  assert.equal(r.coins, Math.floor((8 * 3600) / 0.6));
});

test('offline: Night Shift raises the cap', () => {
  const s = createInitialState();
  s.prestige.upgrades.nightshift = 2; // +4h
  s.machines.sewing.auto = true;
  assert.equal(applyOffline(s, 30 * 3600).seconds, 12 * 3600);
});

test('offline: tapped (non-auto) machine only finishes its current cycle', () => {
  const s = createInitialState();
  s.machines.loom.level = 2;
  s.machines.loom.running = true;
  s.machines.loom.progress = 0.5;
  const r = applyOffline(s, 3600);
  assert.equal(r.coins, 18); // loom: 9 per level x 2, once
  assert.equal(s.machines.loom.running, false);
});

test('offline: idle machines earn nothing, bad input is safe', () => {
  const s = createInitialState();
  assert.equal(applyOffline(s, 3600).coins, 0);
  assert.equal(applyOffline(s, -50).seconds, 0);
  assert.equal(applyOffline(s, NaN).seconds, 0);
});
