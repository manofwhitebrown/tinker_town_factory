import test from 'node:test';
import assert from 'node:assert/strict';
import { Loop } from '../src/core/loop.js';

test('runs whole fixed steps and keeps the remainder', () => {
  let ticks = 0, renders = 0;
  const loop = new Loop({ step: 0.1, update: () => ticks++, render: () => renders++ });
  loop.advance(0.25);
  assert.equal(ticks, 2);
  assert.equal(renders, 1);
  loop.advance(0.05);
  assert.equal(ticks, 3);
});

test('long frames are clamped', () => {
  let ticks = 0;
  const loop = new Loop({ step: 0.1, maxFrame: 0.25, update: () => ticks++ });
  loop.advance(60);
  assert.equal(ticks, 2);
});

test('negative dt is ignored', () => {
  let ticks = 0;
  const loop = new Loop({ step: 0.1, update: () => ticks++ });
  loop.advance(-1);
  assert.equal(ticks, 0);
});

test('simulated time adds up over many frames', () => {
  let simulated = 0;
  const loop = new Loop({ step: 1 / 30, update: (dt) => (simulated += dt) });
  for (let i = 0; i < 600; i++) loop.advance(1 / 60); // 10 real seconds
  assert.ok(Math.abs(simulated - 10) < 0.05, `simulated ${simulated}`);
});
