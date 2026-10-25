import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, hydrate } from '../src/core/state.js';
import { deserialize, serialize } from '../src/core/save.js';
import { TUTORIAL_STEPS } from '../src/data/tutorial.js';
import {
  advanceTutorial, currentStep, nextStep, replayTutorial, skipTutorial, tutorialActive, visitTab,
} from '../src/systems/tutorial.js';
import { buyAuto, buyMachine, startCycle } from '../src/systems/economy.js';
import { SFX, STEP_SECONDS, createAudio, musicPlan } from '../src/audio/audio.js';

// ---- settings ----
test('settings default, round-trip, and repair', () => {
  const s = createInitialState();
  assert.equal(s.settings.sfx, true);
  assert.equal(s.settings.muted, false);
  assert.equal(s.settings.largeText, false);
  s.settings.colorblind = true;
  s.settings.muted = true;
  const back = deserialize(serialize(s));
  assert.equal(back.settings.colorblind, true);
  assert.equal(back.settings.muted, true);
  const bad = hydrate({ settings: { sfx: 'yes', largeText: 1, music: false, tutorialStep: 999 } });
  assert.equal(bad.settings.sfx, true);       // not a boolean: ignored
  assert.equal(bad.settings.largeText, false);
  assert.equal(bad.settings.music, false);
  assert.equal(bad.settings.tutorialStep, TUTORIAL_STEPS.length);
});

test('v3 saves load; veterans skip the tutorial, new saves do not', () => {
  const vet = deserialize(JSON.stringify({ v: 3, data: { coins: 5000, lifetimeCoins: 5000, runCoins: 5000 } }));
  assert.equal(tutorialActive(vet), false);
  const fresh = deserialize(JSON.stringify({ v: 3, data: {} }));
  assert.equal(tutorialActive(fresh), true);
});

// ---- tutorial ----
test('tutorial steps advance on their own as the player plays', () => {
  const s = createInitialState();
  assert.equal(currentStep(s).id, 'tap');
  startCycle(s, 'sewing');
  s.stats.taps = 1;
  assert.equal(advanceTutorial(s), true);
  assert.equal(currentStep(s).id, 'upgrade');
  s.coins = 1e6;
  buyMachine(s, 'sewing', 10);
  advanceTutorial(s);
  assert.equal(currentStep(s).id, 'second');
  buyMachine(s, 'loom', 1);
  advanceTutorial(s);
  assert.equal(currentStep(s).id, 'auto');
  buyAuto(s, 'sewing');
  advanceTutorial(s);
  assert.equal(currentStep(s).id, 'rewards'); // manual from here
  assert.equal(advanceTutorial(s), false);
});

test('tutorial skips steps already done, visiting a tab and Got it finish manual steps', () => {
  const s = createInitialState();
  s.stats.taps = 3;
  s.machines.sewing.level = 5;
  s.machines.loom.level = 1;
  s.machines.loom.auto = true;
  advanceTutorial(s);
  assert.equal(currentStep(s).id, 'rewards');
  visitTab(s, 'shop');                          // wrong tab: nothing
  assert.equal(currentStep(s).id, 'rewards');
  visitTab(s, 'rewards');
  assert.equal(currentStep(s).id, 'managers');
  nextStep(s);
  assert.equal(tutorialActive(s), false);
  replayTutorial(s);
  assert.equal(tutorialActive(s), true);
  skipTutorial(s);
  assert.equal(tutorialActive(s), false);
});

test('every tutorial target points at a real machine or tab', async () => {
  const { MACHINE_BY_ID } = await import('../src/data/machines.js');
  const tabs = ['factory', 'managers', 'rewards', 'shop', 'more'];
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.text.length > 10);
    if (step.target.machine) assert.ok(MACHINE_BY_ID[step.target.machine], step.id);
    if (step.target.tab) assert.ok(tabs.includes(step.target.tab), step.id);
    assert.ok(step.manual || typeof step.done === 'function', `${step.id} must finish somehow`);
  }
});

// ---- audio ----
function fakeContext() {
  const log = { oscillators: 0, resumed: 0, suspended: 0 };
  const param = () => ({
    value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {},
  });
  const ctx = {
    log, state: 'suspended', currentTime: 0, destination: {},
    resume() { log.resumed++; ctx.state = 'running'; },
    suspend() { log.suspended++; },
    createGain: () => ({ gain: param(), connect() {} }),
    createOscillator() {
      log.oscillators++;
      return { type: '', frequency: param(), connect() {}, start() {}, stop() {} };
    },
  };
  return ctx;
}

test('audio does nothing before unlock and does not crash without Web Audio', () => {
  const a = createAudio(() => ({ sfx: true, music: true, muted: false }), () => null);
  a.play('tap');
  assert.equal(a.unlock(), false);
  assert.equal(a.ready, false);
});

test('audio plays sound effects, and mute / sfx switches silence them', () => {
  const ctx = fakeContext();
  const settings = { sfx: true, music: false, muted: false };
  const a = createAudio(() => settings, () => ctx);
  assert.equal(a.unlock(), true);
  assert.equal(ctx.log.resumed, 1);
  a.play('buy');
  assert.equal(ctx.log.oscillators, SFX.buy.length);
  const before = ctx.log.oscillators;
  settings.muted = true;
  a.play('buy');
  assert.equal(ctx.log.oscillators, before);
  settings.muted = false; settings.sfx = false;
  a.play('buy');
  assert.equal(ctx.log.oscillators, before);
  settings.sfx = true;
  a.play('does-not-exist');
  assert.equal(ctx.log.oscillators, before);
});

test('fast sounds are rate limited', () => {
  const ctx = fakeContext();
  const a = createAudio(() => ({ sfx: true, music: false, muted: false }), () => ctx);
  a.unlock();
  a.play('coin'); a.play('coin'); a.play('coin');
  assert.equal(ctx.log.oscillators, SFX.coin.length);
  ctx.currentTime = 1;
  a.play('coin');
  assert.equal(ctx.log.oscillators, SFX.coin.length * 2);
});

test('music only schedules when enabled, and stops when hidden', () => {
  const ctx = fakeContext();
  const settings = { sfx: false, music: false, muted: false };
  const a = createAudio(() => settings, () => ctx);
  a.unlock();
  assert.equal(ctx.log.oscillators, 0);
  settings.music = true;
  a.sync();
  assert.ok(ctx.log.oscillators > 0);
  a.setHidden(true);
  assert.equal(ctx.log.suspended, 1);
  a.setHidden(false);
  settings.music = false; a.sync();
});

test('music plan is deterministic and always in a sensible range', () => {
  assert.deepEqual(musicPlan(5), musicPlan(5));
  let notes = 0;
  for (let i = 0; i < 400; i++) {
    const p = musicPlan(i);
    for (const f of [p.lead, p.bass, ...(p.pad || [])]) {
      if (f === null || f === undefined) continue;
      notes++;
      assert.ok(f > 50 && f < 3000, `freq ${f} at step ${i}`);
    }
  }
  assert.ok(notes > 400);
  assert.ok(STEP_SECONDS > 0.5 && STEP_SECONDS < 1.2);
});

// ---- cozy mode ----
import { getGlobalMultiplier as _gm } from '../src/systems/economy.js';
test('cozy mode: on for new games, doubles income, off for existing saves until opted in', () => {
  const fresh = createInitialState();
  assert.equal(fresh.settings.cozy, true);
  const plain = createInitialState(); plain.settings.cozy = false;
  assert.equal(_gm(fresh), _gm(plain) * 2);
  const veteran = hydrate({ lifetimeCoins: 5000, stats: { taps: 50 }, settings: {} });
  assert.equal(veteran.settings.cozy, false);
  const opted = hydrate({ lifetimeCoins: 5000, settings: { cozy: true } });
  assert.equal(opted.settings.cozy, true);
});
