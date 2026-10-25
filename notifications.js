import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { planReminders } from '../systems/reminders.js';

const CHANNEL = 'reminders';

/**
 * Reminders for the Android app. In a normal browser every method does nothing.
 * Nothing here can break the game: every device call is wrapped so errors are swallowed.
 */
export function createNotifier() {
  const native = !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  let chain = Promise.resolve(); // run device calls one after another, never at the same time
  let channelMade = false;
  const queue = (fn) => { chain = chain.then(fn).catch(() => {}); return chain; };

  async function permission() {
    const p = await LocalNotifications.checkPermissions();
    return p.display;
  }

  async function ensureChannel() {
    if (channelMade || Capacitor.getPlatform() !== 'android') return;
    await LocalNotifications.createChannel({
      id: CHANNEL, name: 'Reminders', description: 'Factory full and daily reward reminders', importance: 3,
    });
    channelMade = true;
  }

  async function cancelAll() {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
  }

  return {
    native,

    /** Ask the player for permission. Call it right after something good (a tap), not on launch. */
    requestPermission() {
      if (!native) return Promise.resolve(false);
      return queue(async () => {
        const state = await permission();
        if (state === 'granted') return true;
        if (state === 'prompt' || state === 'prompt-with-rationale') {
          const r = await LocalNotifications.requestPermissions();
          return r.display === 'granted';
        }
        return false;
      });
    },

    /** The player is leaving: set up the reminders. */
    schedule(state) {
      if (!native || !state.settings.reminders) return Promise.resolve();
      return queue(async () => {
        if ((await permission()) !== 'granted') return;
        await ensureChannel();
        await cancelAll();
        const plan = planReminders(state, Date.now());
        if (!plan.length) return;
        await LocalNotifications.schedule({
          notifications: plan.map((p) => ({
            id: p.id, title: p.title, body: p.body, channelId: CHANNEL,
            // Not exact: a reminder a few minutes late is fine, and exact alarms would send the
            // player to a system settings screen on Android 12+.
            isExactNotification: false,
            schedule: { at: p.at, allowWhileIdle: true },
          })),
        });
      });
    },

    /** The player is back: drop anything still waiting. */
    clear() {
      if (!native) return Promise.resolve();
      return queue(async () => {
        await cancelAll();
        if (LocalNotifications.removeAllDeliveredNotifications) await LocalNotifications.removeAllDeliveredNotifications();
      });
    },
  };
}
