import { MACHINE_BY_ID } from '../data/machines.js';
import { canPrestige } from './prestige.js';
import { claimableQuests, dailyStatus, spinStatus } from './meta.js';
import { bestBuy } from './advisor.js';
import { tutorialActive } from './tutorial.js';

const CHATTER = [
  'Tinker Bot hums a little tune.',
  'Tip: a Golden Gear floats by now and then. Be quick!',
  'Tip: higher levels double a machine\'s output at Lv 10, 25, 50 and more.',
  'Tip: automated machines keep earning while you are away.',
  'All systems cozy. Gears are turning.',
  'Tip: the Managers tab gives permanent income when you are ready.',
];

/**
 * What the little helper says right now. Returns { text, tab } (tab = where tapping it goes, or null),
 * or null when it should stay quiet. `tip` is the bestBuy() result if the caller already has it.
 * Most useful thing first; plain chatter only when there is nothing to do.
 */
export function botMessage(state, now = Date.now(), tip = bestBuy(state)) {
  if (!state.settings.hints || tutorialActive(state)) return null;

  if (dailyStatus(state, now).claimable) return { text: 'Your daily reward is ready!', tab: 'rewards' };
  if (spinStatus(state, now).available && state.lifetimeCoins >= 100) {
    return { text: 'Your free Lucky Spin is waiting!', tab: 'rewards' };
  }
  if (claimableQuests(state) > 0) return { text: 'A quest is finished. Collect your gems!', tab: 'rewards' };
  if (canPrestige(state) && state.prestige.count === 0) {
    return { text: 'You can reopen the factory and hire your first manager!', tab: 'managers' };
  }
  if (tip) {
    const name = MACHINE_BY_ID[tip.id].name;
    return {
      text: tip.kind === 'auto'
        ? `Automate the ${name}. It will earn for you.`
        : `Best value: level up the ${name}.`,
      tab: null,
    };
  }
  return { text: CHATTER[Math.floor(now / 20000) % CHATTER.length], tab: null };
}
