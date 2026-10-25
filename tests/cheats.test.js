import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CHEAT_KEY, createCheatLock, hashText, isCheatPassword } from '../src/systems/cheats.js';

const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
};

test('only the right password unlocks cheats', () => {
  assert.equal(isCheatPassword('abdulnay'), true);
  assert.equal(isCheatPassword('  abdulnay  '), true);
  for (const bad of ['', 'abdulna', 'abdulnay1', 'Abdulnay', 'password', null, undefined, 42]) {
    assert.equal(isCheatPassword(bad), false, String(bad));
  }
});

test('the password is not stored in plain text anywhere in src/', () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  for (const file of walk(new URL('../src', import.meta.url).pathname)) {
    assert.ok(!fs.readFileSync(file, 'utf8').toLowerCase().includes('abdulnay'), file);
  }
});

test('hash is stable and differs for different text', () => {
  assert.equal(hashText('a'), hashText('a'));
  assert.notEqual(hashText('a'), hashText('b'));
});

test('lock starts closed, opens on the password, and remembers it', () => {
  const store = memory();
  const lock = createCheatLock(store);
  assert.equal(lock.isOpen(), false);
  assert.equal(lock.tryUnlock('nope'), false);
  assert.equal(lock.isOpen(), false);
  assert.equal(lock.tryUnlock('abdulnay'), true);
  assert.equal(lock.isOpen(), true);
  assert.equal(store.getItem(CHEAT_KEY), '1');
  assert.equal(createCheatLock(store).isOpen(), true, 'still open after a reload');
  lock.lock();
  assert.equal(lock.isOpen(), false);
  assert.equal(createCheatLock(store).isOpen(), false);
});

test('works when storage is missing or throws', () => {
  const lock = createCheatLock(null);
  assert.equal(lock.tryUnlock('abdulnay'), true);
  assert.equal(lock.isOpen(), true);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const l2 = createCheatLock(broken);
  assert.equal(l2.isOpen(), false);
  assert.equal(l2.tryUnlock('abdulnay'), true);
  l2.lock();
  assert.equal(l2.isOpen(), false);
});
