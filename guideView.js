// The Guide tab: a plain-language explanation of every feature.
// Numbers (prices, bonuses, thresholds) are read from src/data/, so this page stays correct
// when you rebalance the game. Only the wording lives here.
import { CONFIG } from '../data/config.js';
import { MACHINES, WINGS } from '../data/machines.js';
import { PRESTIGE, UPGRADES } from '../data/prestige.js';
import { ACHIEVEMENTS, DAILY, GEM_SHOP, QUEST_BONUS_GEMS, QUEST_COUNT } from '../data/meta.js';
import { formatDuration, formatNumber } from '../core/format.js';
import { h } from './dom.js';

export const CREDIT = 'Mohammed Abdul Nayeem';

const p = (text) => h('p', {}, text);
const list = (items) => h('ul', {}, ...items.map((t) => h('li', {}, t)));
const term = (name, text) => h('div', { class: 'term' }, h('b', {}, name), h('span', {}, text));
const pct = (n) => `${Math.round(n * 100)}%`;
const gemText = (n) => `${n} ${n === 1 ? 'gem' : 'gems'}`;

/** One collapsible topic. */
function topic(title, open, ...body) {
  const d = h('details', { class: 'topic' }, h('summary', {}, title), h('div', { class: 'topic-body' }, ...body));
  if (open) d.open = true;
  return d;
}

// Plain-language blurbs for the manager upgrades (the numbers come from data/prestige.js).
const UPGRADE_BLURB = {
  thimble: 'Raises the income of every machine, always.',
  spools: 'Machines finish each production cycle faster.',
  seed: 'Every time you reopen the factory you start with some coins instead of nothing.',
  nightshift: 'Your automated machines keep earning for longer while the game is closed.',
};

export function createGuideView() {
  const hoursCap = CONFIG.offlineCapSeconds / 3600;
  const ms = CONFIG.milestones;
  const exampleRuns = [4e6, 1e8, 1e9].map((c) => ({ c, n: Math.floor(Math.sqrt(c / PRESTIGE.divisor)) }));

  const basics = topic('Words used in this game', false,
    term('Coins', 'The main money. Machines make coins; you spend them on machine levels and on Automate.'),
    term('Gems ◆', 'A special money you get from rewards and achievements. You spend them in the Shop. Reopening the factory never touches your gems.'),
    term('Machines', `The things you build to make coins. There are ${MACHINES.length} of them, grouped into wings.`),
    term('Level', 'How strong a machine is. Every level you buy makes that machine earn more per cycle.'),
    term('Cycle', 'One round of work. A machine runs a cycle, the thread bar fills up, and you get coins at the end.'),
    term('Wings', `The ${WINGS.length} parts of the factory (${WINGS.map((w) => w.short).join(', ')}). Later wings hold bigger machines.`),
    term('Managers', 'A permanent income bonus you earn by reopening the factory. Explained in full below.'));

  const playing = topic('Machines, levels and cycles', false,
    p('Tap a machine to run one cycle. The dashed thread bar fills up, and when it is full you get coins. Tap again to run another.'),
    p(`Spend coins on Buy to raise a machine's level. Each level makes every cycle pay more, but the price of the next level goes up by about ${pct(CONFIG.costGrowth - 1)} each time.`),
    p(`Milestone bonus: when a machine reaches level ${ms.join(', ')}, its output doubles. The card shows the next milestone.`),
    p('Buy amount sets how many levels one tap on Buy gets you: ×1, ×10, or Max (as many as you can afford).'),
    p('Machines show ??? until you build the one before it in the same wing. The first machine of each wing is open as soon as the wing is.'),
    p('The strip at the top of the Factory tab, Next goal, shows the most useful target to chase right now.'));

  const automate = topic('Automate', false,
    p('Press Automate under a machine and pay once. From then on it restarts its own cycles forever, so you no longer have to tap it.'),
    list([
      'The price is five times the price of that machine\'s first level.',
      'Only automated machines earn while you are away, and only they count toward the +coins per second in the header.',
      'An automated machine cannot be tapped, because it is already running.',
      'Reopening the factory resets automation, so you buy it again each run.',
    ]));

  const away = topic('Earning while you are away', false,
    p(`Close the game and your automated machines keep working, for up to ${hoursCap} hours at the same speed as when you play. When you come back you get a Welcome back summary.`),
    list([
      'A machine you tapped and left mid-cycle will finish that one cycle.',
      'Want more time? Night Shift (manager upgrade) and Bigger Vault (gem shop) both add hours.',
      'Double Time pauses while the game is closed, so it does not boost away earnings.',
    ]));

  const wings = topic('Wings (the factory sections)', false,
    p('Each wing is a bigger tier of the same coin pool. A wing opens by itself once your lifetime earnings reach its target. Opened wings stay open forever, even after you reopen the factory.'),
    list(WINGS.map((w) => {
      const n = MACHINES.filter((m) => m.wing === w.id).length;
      return `${w.name}: ${n} machines. ${w.unlockAt > 0 ? `Opens at ${formatNumber(w.unlockAt)} coins earned.` : 'Open from the start.'}`;
    })),
    p('Tap a wing name above the machine list to switch between wings. Locked wings show how much you still need to earn.'));

  const managers = topic('Managers (reopening the factory)', false,
    p('This is the big reset button, and it is what makes your income grow for the long run.'),
    h('p', { class: 'strong' }, 'What it is'),
    p(`When you reopen the factory, you hire managers. Every manager you ever hire gives you +${pct(PRESTIGE.bonusPerPoint)} income for good, on top of everything else.`),
    h('p', { class: 'strong' }, 'How many you get'),
    p(`The more you earn in one run, the more you get: the count is the square root of (coins earned this run ÷ ${formatNumber(PRESTIGE.divisor)}), rounded down. For example: ${exampleRuns.map((e) => `${formatNumber(e.c)} coins gives ${e.n}`).join(', ')}. You need ${formatNumber(PRESTIGE.divisor)} coins in a run for the first one.`),
    h('p', { class: 'strong' }, 'What resets and what stays'),
    list([
      'Resets: your coins, machine levels and automation. You start again from the Sewing Machine.',
      'Stays: managers, manager upgrades, open wings, gems, achievements, rewards and your lifetime total.',
    ]),
    h('p', { class: 'strong' }, 'What managers are not'),
    list([
      'They do not run machines for you. Running on their own is Automate.',
      'They are not coins. You cannot spend managers on machines.',
      'Spending managers on upgrades never lowers your +income bonus.',
    ]),
    p('A dot on the Managers tab means you could hire at least one right now. Many players reopen once the next manager is a long way off, because a fresh run starts fast and the bonus is permanent.'));

  const upgrades = topic('Manager upgrades', false,
    p('Spend the managers you have not used yet on permanent upgrades. Each upgrade has levels, and each level costs more than the last.'),
    ...UPGRADES.map((u) => term(u.name,
      `${UPGRADE_BLURB[u.id] || ''} Level 1: ${u.describe(1, formatNumber)}. Up to level ${u.max}. First level costs ${u.baseCost} managers.`.trim())));

  const rewards = topic('Rewards: daily gift, quests, achievements', false,
    h('p', { class: 'strong' }, 'Daily reward'),
    p(`Claim once a day. Keep your streak and the prize grows over ${DAILY.rewards.length} days (it includes gems on days ${DAILY.rewards.map((r, i) => (r.gems ? i + 1 : 0)).filter(Boolean).join(', ')}), then loops. Miss a day and a Streak Shield saves your streak (one shield per missed day; you start with one, can hold up to 3, and earn another when you finish day 7). With no shield, the streak starts over. The coins are minutes of your own income, so they stay worth claiming at any stage.`),
    h('p', { class: 'strong' }, 'Daily quests'),
    p(`${QUEST_COUNT} quests every day, like tapping, buying levels, finishing cycles or earning coins. Each pays gems. Finish all of them for ${gemText(QUEST_BONUS_GEMS)} extra. New quests arrive at your local midnight, and anything finished but not collected is paid out for you.`),
    h('p', { class: 'strong' }, 'Golden Gear'),
    p('Every minute or two a golden gear floats onto the screen for a few seconds. Tap it fast for a big bonus of coins, and sometimes a gem. It only appears while the game is open.'),
    h('p', { class: 'strong' }, 'Welcome back'),
    p('When you return after being away you can double what your machines earned. The first double each day is free; after that it costs gems.'),
    h('p', { class: 'strong' }, 'Achievements'),
    p(`${ACHIEVEMENTS.length} goals to unlock, each paying gems once, the moment you reach it. A dot on the Rewards tab means something is ready to claim.`));

  const shop = topic('Shop and gems', false,
    p('Gems come from the daily reward, quests, achievements and now and then a Golden Gear. Spend them here.'),
    ...GEM_SHOP.map((i) => {
      const price = i.kind === 'consume'
        ? `${gemText(i.cost)} each`
        : `from ${gemText(i.baseCost)}, up to level ${i.max}`;
      const extra = i.id === 'boost' ? ` Time stacks up to ${formatDuration(i.maxSeconds)}.` : '';
      return term(i.name, `${i.describe(1, formatNumber)}${extra} ${price}.`);
    }));

  const settings = topic('Settings and saving', false,
    list([
      'Cozy mode doubles all your income for a relaxed pace. It starts on in a new game; switch it off any time for the original challenge.',
      'Mute all sound (also the speaker button in the header), Sound effects, and Music are separate switches.',
      'Large text makes words and numbers bigger.',
      'Colorblind-friendly uses safer machine colors and a plain background.',
      'Reduce motion turns off particles and wiggles.',
      'Replay tutorial shows the first-minutes hints again.',
    ]),
    p(`Your game saves on this device by itself every ${CONFIG.autosaveSeconds} seconds and when you leave. To back it up or move to another device, use Copy save code, then Load save code on the other one. Start over erases everything.`),
    p('Daily rewards and offline earnings use your device clock. Moving the clock back can lock the daily claim.'));

  const faq = topic('Quick answers', false,
    term('Why can\'t I tap a machine?', 'It is either not built yet, already automated, or already working on a cycle.'),
    term('Will reopening the factory delete my progress?', 'Only coins, machine levels and automation. Managers, upgrades, wings and gems are kept.'),
    term('Where is my save?', 'In this browser or app. Clearing site data erases it, so copy a save code now and then.'));

  const credit = h('div', { class: 'credit' },
    h('b', {}, 'Tinker Town Factory'),
    h('span', {}, `A game by ${CREDIT}.`));

  const intro = h('section', { class: 'panel guide' },
    h('h2', {}, 'How it all works'),
    h('p', { class: 'lede' }, 'Tap a topic to open it. Everything in the game is explained here.'),
    basics, playing, automate, away, wings, managers, upgrades, rewards, shop, settings, faq);

  const el = h('div', { class: 'view' }, intro, credit);
  return { el, render() {} };
}
