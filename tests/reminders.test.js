import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/core/state.js';
import { avoidNight, nextLocalHour, planReminders, REMINDER_IDS, REMINDERS } from '../src/systems/reminders.js';
import { offlineCapSeconds } from '../src/systems/economy.js';

const at = (y, m, d, h, min = 0) => new Date(y, m, d, h, min).getTime();

function playing() {
  const s = createInitialState();
  s.lifetimeCoins = 50000;
  s.machines.sewing.auto = true;
  return s;
}

test('no reminders for someone who has barely started', () => {
  assert.deepEqual(planReminders(createInitialState(), at(2026, 0, 5, 12)), []);
});

test('plan: factory full, daily reward, come back', () => {
  const now = at(2026, 0, 5, 12);
  const plan = planReminders(playing(), now);
  assert.deepEqual(plan.map((p) => p.id), [REMINDER_IDS.full, REMINDER_IDS.daily, REMINDER_IDS.comeback]);
  assert.ok(plan.every((p) => p.at.getTime() > now && p.title && p.body));
});

test('factory-full reminder arrives when the offline cap is reached (during the day)', () => {
  const s = playing();
  const now = at(2026, 0, 5, 8); // cap is 12h -> 20:00, which is fine
  const full = planReminders(s, now).find((p) => p.id === REMINDER_IDS.full);
  assert.equal(full.at.getTime(), now + offlineCapSeconds(s) * 1000);
});

test('no factory-full reminder when nothing is automated', () => {
  const s = playing();
  s.machines.sewing.auto = false;
  assert.ok(!planReminders(s, at(2026, 0, 5, 12)).some((p) => p.id === REMINDER_IDS.full));
});

test('quiet hours: nothing lands between 22:00 and 08:00', () => {
  assert.equal(avoidNight(new Date(2026, 0, 5, 23, 30)).getTime(), at(2026, 0, 6, 8));
  assert.equal(avoidNight(new Date(2026, 0, 6, 3, 0)).getTime(), at(2026, 0, 6, 8));
  assert.equal(avoidNight(new Date(2026, 0, 6, 15, 0)).getTime(), at(2026, 0, 6, 15));
  for (let h = 0; h < 24; h++) {
    const s = playing();
    for (const p of planReminders(s, at(2026, 0, 5, h, 17))) {
      const hr = p.at.getHours();
      assert.ok(hr >= REMINDERS.quietTo && hr < REMINDERS.quietFrom, `hour ${hr} for start ${h}`);
    }
  }
});

test('daily reminder is the next 10:00 and mentions the streak', () => {
  assert.equal(nextLocalHour(at(2026, 0, 5, 9), 10).getTime(), at(2026, 0, 5, 10));
  assert.equal(nextLocalHour(at(2026, 0, 5, 10), 10).getTime(), at(2026, 0, 6, 10));
  const s = playing();
  s.daily.streak = 4;
  const daily = planReminders(s, at(2026, 0, 5, 12)).find((p) => p.id === REMINDER_IDS.daily);
  assert.equal(daily.at.getTime(), at(2026, 0, 6, 10));
  assert.match(daily.body, /4-day streak/);
});
