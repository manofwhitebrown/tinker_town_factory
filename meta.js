// Part 6 tuning: daily rewards, quests, achievements, gem shop.
// Numbers only live here; logic is in src/systems/meta.js.

// ---- Daily login rewards (7-day cycle, then it loops) ----
// Coins are "minutes of your potential income" so they stay meaningful at any stage.
export const DAILY = {
  minCoins: 200,
  rewards: [
    { coinMinutes: 5, gems: 0 },
    { coinMinutes: 10, gems: 0 },
    { coinMinutes: 15, gems: 2 },
    { coinMinutes: 25, gems: 0 },
    { coinMinutes: 40, gems: 3 },
    { coinMinutes: 60, gems: 0 },
    { coinMinutes: 120, gems: 5 },
  ],
};

// ---- Streak Shield: saves your streak when you miss a day (one shield per missed day) ----
export const SHIELD = {
  max: 3,        // most you can hold
  start: 1,      // everyone begins with one
};

// ---- Golden Gear: a gear that floats across the screen now and then. Tap it for a bonus. ----
export const GOLDEN = {
  minWait: 90,        // seconds between gears (random between min and max)
  maxWait: 210,
  life: 12,           // seconds it stays on screen
  minMinutes: 8,      // reward = this many minutes of your income (random between min and max)
  maxMinutes: 25,
  gemChance: 0.1,     // chance of +1 gem as well
  minCoins: 300,
};

// ---- Welcome back: double your away earnings. Free once a day, then costs gems. ----
export const WELCOME_DOUBLE = { gemCost: 2 };

// ---- Daily quests ----
export const QUEST_COUNT = 3;
export const QUEST_BONUS_GEMS = 2; // for claiming all of them

// `targets` are picked at random per day. `earn` targets are computed from your income.
export const QUEST_TYPES = {
  taps: { targets: [20, 40, 70], gems: 1, label: (n) => `Tap machines ${n} times` },
  levels: { targets: [8, 15, 30], gems: 1, label: (n) => `Buy ${n} machine levels` },
  cycles: { targets: [30, 80, 160], gems: 1, label: (n) => `Finish ${n} production cycles` },
  earn: { gems: 2, label: (n, fmt) => `Earn ${fmt(n)} coins` },
};
export const EARN_QUEST = { minCoins: 1000, potentialSeconds: 120 };

// ---- Achievements (gems are paid out the moment one unlocks) ----
const autoCount = (s) => Object.values(s.machines).filter((m) => m.auto).length;
const topLevel = (s) => Math.max(...Object.values(s.machines).map((m) => m.level));

export const ACHIEVEMENTS = [
  { id: 'tap1', name: 'First Tap', desc: 'Tap a machine.', gems: 1, check: (s) => s.stats.taps >= 1 },
  { id: 'tap100', name: 'Busy Fingers', desc: 'Tap 100 times.', gems: 1, check: (s) => s.stats.taps >= 100 },
  { id: 'tap1000', name: 'Tap Dancer', desc: 'Tap 1,000 times.', gems: 3, check: (s) => s.stats.taps >= 1000 },
  { id: 'lv10', name: 'Getting Started', desc: 'Get any machine to Lv 10.', gems: 1, check: (s) => topLevel(s) >= 10 },
  { id: 'lv100', name: 'Well Oiled', desc: 'Get any machine to Lv 100.', gems: 3, check: (s) => topLevel(s) >= 100 },
  { id: 'lv500', name: 'Built to Last', desc: 'Get any machine to Lv 500.', gems: 5, check: (s) => topLevel(s) >= 500 },
  { id: 'auto1', name: 'Hands Free', desc: 'Automate a machine.', gems: 1, check: (s) => autoCount(s) >= 1 },
  { id: 'auto5', name: 'Clockwork Town', desc: 'Automate 5 machines.', gems: 3, check: (s) => autoCount(s) >= 5 },
  { id: 'earn1k', name: 'Pocket Change', desc: 'Earn 1K coins in total.', gems: 1, check: (s) => s.lifetimeCoins >= 1e3 },
  { id: 'earn1m', name: 'Millionaire', desc: 'Earn 1M coins in total.', gems: 2, check: (s) => s.lifetimeCoins >= 1e6 },
  { id: 'earn1b', name: 'Billionaire', desc: 'Earn 1B coins in total.', gems: 3, check: (s) => s.lifetimeCoins >= 1e9 },
  { id: 'earn1t', name: 'Trillionaire', desc: 'Earn 1T coins in total.', gems: 4, check: (s) => s.lifetimeCoins >= 1e12 },
  { id: 'earn1qa', name: 'Beyond Counting', desc: 'Earn 1Qa coins in total.', gems: 6, check: (s) => s.lifetimeCoins >= 1e15 },
  { id: 'wingToys', name: 'Playtime', desc: 'Open the Toy Shop.', gems: 2, check: (s) => !!s.wings.toys },
  { id: 'wingGadgets', name: 'Tinkerer', desc: 'Open the Gadget Garage.', gems: 3, check: (s) => !!s.wings.gadgets },
  { id: 'wingCandy', name: 'Sweet Tooth', desc: 'Open the Candy Kitchen.', gems: 5, check: (s) => !!s.wings.candy },
  { id: 'wingClock', name: 'Right on Time', desc: 'Open the Clockwork Tower.', gems: 6, check: (s) => !!s.wings.clock },
  { id: 'wingSky', name: 'Head in the Clouds', desc: 'Open the Sky Dock.', gems: 7, check: (s) => !!s.wings.sky },
  { id: 'wingStar', name: 'Starstruck', desc: 'Open the Star Observatory.', gems: 10, check: (s) => !!s.wings.star },
  { id: 'lv900', name: 'Unbreakable', desc: 'Get any machine to Lv 900.', gems: 8, check: (s) => topLevel(s) >= 900 },
  { id: 'mgr1', name: 'You\'re Hired', desc: 'Hire your first manager.', gems: 2, check: (s) => s.prestige.totalPoints >= 1 },
  { id: 'prestige5', name: 'Regular Reopening', desc: 'Reopen the factory 5 times.', gems: 4, check: (s) => s.prestige.count >= 5 },
  { id: 'prestige10', name: 'Grand Reopening', desc: 'Reopen the factory 10 times.', gems: 6, check: (s) => s.prestige.count >= 10 },
  { id: 'streak3', name: 'Regular', desc: 'Reach a 3-day login streak.', gems: 1, check: (s) => s.daily.streak >= 3 },
  { id: 'streak7', name: 'Dedicated', desc: 'Reach a 7-day login streak.', gems: 3, check: (s) => s.daily.streak >= 7 },
  { id: 'quests10', name: 'Odd Jobs', desc: 'Finish 10 daily quests.', gems: 3, check: (s) => s.stats.questsDone >= 10 },
  { id: 'golden1', name: 'Lucky Find', desc: 'Catch a Golden Gear.', gems: 1, check: (s) => s.stats.goldenGears >= 1 },
  { id: 'golden25', name: 'Golden Touch', desc: 'Catch 25 Golden Gears.', gems: 4, check: (s) => s.stats.goldenGears >= 25 },
  { id: 'hour1', name: 'Settling In', desc: 'Play for 1 hour.', gems: 2, check: (s) => s.stats.playSeconds >= 3600 },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---- Gem shop ----
// kind 'consume': instant effect, buy as often as you like (price is fixed).
// kind 'permanent': levels, price = ceil(baseCost * growth^level), survives prestige.
export const GEM_SHOP = [
  {
    id: 'crate', kind: 'consume', name: 'Coin Crate', cost: 3, hours: 1,
    describe: () => 'Instantly get 1 hour of your income.',
  },
  {
    id: 'boost', kind: 'consume', name: 'Double Time', cost: 5, seconds: 900, maxSeconds: 3600,
    describe: () => 'Doubles all income for 15 minutes. Pauses while the game is closed.',
  },
  {
    id: 'shield', kind: 'consume', name: 'Streak Shield', cost: 6,
    describe: () => 'Saves your daily streak if you miss a day. You can hold up to 3.',
  },
  {
    id: 'polish', kind: 'permanent', name: 'Gem Polish', max: 10, baseCost: 10, growth: 1.6, perLevel: 0.05,
    describe: (lvl) => `+${Math.round(lvl * 5)}% income`,
  },
  {
    id: 'vault', kind: 'permanent', name: 'Bigger Vault', max: 4, baseCost: 15, growth: 2, perLevel: 3600,
    describe: (lvl) => `+${lvl}h offline earning time`,
  },
];
export const GEM_SHOP_BY_ID = Object.fromEntries(GEM_SHOP.map((i) => [i.id, i]));
