import { incomePerSecond, offlineCapSeconds } from './economy.js';

// Notification ids (a new schedule with the same id replaces the old one).
export const REMINDER_IDS = { full: 1, daily: 2, comeback: 3 };

export const REMINDERS = {
  dailyHour: 10,          // the daily-reward nudge arrives at 10:00 local time
  comebackDays: 3,        // "we miss you" after this long away
  quietFrom: 22,          // nothing between 22:00 and 08:00
  quietTo: 8,
  minLifetimeCoins: 1000, // do not nag someone who has barely started
};

/** Move a time out of quiet hours (no pings in the middle of the night). */
export function avoidNight(date) {
  const d = new Date(date.getTime());
  const hour = d.getHours();
  if (hour >= REMINDERS.quietFrom) {
    d.setDate(d.getDate() + 1);
    d.setHours(REMINDERS.quietTo, 0, 0, 0);
  } else if (hour < REMINDERS.quietTo) {
    d.setHours(REMINDERS.quietTo, 0, 0, 0);
  }
  return d;
}

/** The next time it is `hour`:00 local time (strictly after `now`). */
export function nextLocalHour(now, hour) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * What to remind the player about once they leave the game.
 * Returns [{ id, at: Date, title, body }]. Pure: it does not touch the device.
 */
export function planReminders(state, now = Date.now()) {
  if (state.lifetimeCoins < REMINDERS.minLifetimeCoins) return [];
  const plan = [];

  // 1. The vault fills up: machines stop earning after the offline cap.
  if (incomePerSecond(state) > 0) {
    const hours = Math.round(offlineCapSeconds(state) / 3600);
    plan.push({
      id: REMINDER_IDS.full,
      at: avoidNight(new Date(now + offlineCapSeconds(state) * 1000)),
      title: 'Your factory is full',
      body: `Your machines have been busy for ${hours} hours. Come collect your coins!`,
    });
  }

  // 2. The next daily reward.
  const streak = state.daily.streak || 0;
  plan.push({
    id: REMINDER_IDS.daily,
    at: nextLocalHour(now, REMINDERS.dailyHour),
    title: 'Your daily reward is ready',
    body: streak > 0
      ? `Claim it to keep your ${streak}-day streak going.`
      : 'Claim your daily coins and gems.',
  });

  // 3. A gentle "come back" if they stay away for days.
  plan.push({
    id: REMINDER_IDS.comeback,
    at: avoidNight(new Date(now + REMINDERS.comebackDays * 86400000)),
    title: 'Tinker Town misses you',
    body: 'Your factory has been working while you were away. Come see how much it made.',
  });

  return plan;
}
