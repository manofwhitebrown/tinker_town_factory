import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, hydrate } from '../src/core/state.js';
import { createSaveManager, serialize, deserialize } from '../src/core/save.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _data: data,
  };
}

test('initial state: first machine owned, nothing else', () => {
  const s = createInitialState();
  assert.equal(s.coins, 0);
  assert.equal(s.machines.sewing.level, 1);
  assert.equal(s.machines.loom.level, 0);
});

test('save and load round trip', () => {
  const store = memoryStorage();
  const saves = createSaveManager(store, 'k');
  const s = createInitialState();
  s.coins = 1234.5;
  s.lifetimeCoins = 5000;
  s.machines.loom.level = 7;
  s.settings.buyMode = 'max';
  assert.equal(saves.save(s), true);
  const loaded = saves.load();
  assert.equal(loaded.coins, 1234.5);
  assert.equal(loaded.lifetimeCoins, 5000);
  assert.equal(loaded.machines.loom.level, 7);
  assert.equal(loaded.settings.buyMode, 'max');
});

test('load with no save returns null', () => {
  assert.equal(createSaveManager(memoryStorage(), 'k').load(), null);
});

test('corrupt save returns null and is kept aside', () => {
  const store = memoryStorage();
  store.setItem('k', '{not json');
  const saves = createSaveManager(store, 'k');
  const orig = console.warn; console.warn = () => {};
  assert.equal(saves.load(), null);
  console.warn = orig;
  assert.equal(store.getItem('k.corrupt'), '{not json');
});

test('missing storage never throws', () => {
  const saves = createSaveManager(null, 'k');
  assert.equal(saves.load(), null);
  assert.equal(saves.save(createInitialState()), false);
});

test('hydrate repairs bad data', () => {
  const s = hydrate({
    coins: -5, lifetimeCoins: 'lots',
    machines: { loom: { level: 3.7, running: true, progress: 999 }, ghost: { level: 9 } },
    settings: { buyMode: 7 },
  });
  assert.equal(s.coins, 0);
  assert.equal(s.lifetimeCoins, 0);
  assert.equal(s.machines.loom.level, 3);
  assert.equal(s.machines.loom.progress, 2); // clamped to cycleTime
  assert.equal(s.machines.ghost, undefined);
  assert.equal(s.settings.buyMode, 1);
});

test('hydrate keeps lifetimeCoins >= coins and first machine owned', () => {
  const s = hydrate({ coins: 50, lifetimeCoins: 10, machines: { sewing: { level: 0 } } });
  assert.equal(s.lifetimeCoins, 50);
  assert.equal(s.machines.sewing.level, 1);
});

test('export and import', () => {
  const saves = createSaveManager(memoryStorage(), 'k');
  const s = createInitialState();
  s.coins = 99;
  const code = saves.exportString(s);
  assert.equal(saves.importString(code).coins, 99);
  assert.throws(() => saves.importString('%%%not base64%%%'), /not valid/);
  assert.throws(() => saves.importString(btoa('{"hello":1}')), /missing/);
});

test('migrations run in order', () => {
  const old = JSON.stringify({ v: 1, data: { gold: 42 } });
  const migrations = { 1: (d) => ({ ...d, coins: d.gold }) };
  const s = deserialize(old, migrations, 2);
  assert.equal(s.coins, 42);
});

test('newer saves are rejected', () => {
  assert.throws(() => deserialize(JSON.stringify({ v: 99, data: {} })), /newer/);
});

test('serialize includes version', () => {
  assert.equal(JSON.parse(serialize(createInitialState())).v, 1);
});
