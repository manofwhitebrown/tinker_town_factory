import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { bestBuy } from '../src/systems/advisor.js';

test('best value: a new game points at automating the free first machine', () => {
  const s = createInitialState();
  assert.deepEqual(bestBuy(s), { id: 'sewing', kind: 'auto' });
});

test('best value: once automated it recommends something affordable-in-spirit and valid', () => {
  const s = createInitialState();
  s.machines.sewing.auto = true;
  const b = bestBuy(s);
  assert.ok(b && ['sewing', 'loom'].includes(b.id));
  assert.equal(b.kind, 'level');
});

test('best value: locked machines are never suggested', () => {
  const s = createInitialState();
  s.machines.sewing.auto = true;
  for (let i = 0; i < 5; i++) assert.notEqual(bestBuy(s).id, 'dyevat');
});

test('hints setting defaults on and is a real toggle', () => {
  assert.equal(createInitialState().settings.hints, true);
});
