// Global tuning knobs. Change numbers here, not in the logic.
export const CONFIG = {
  saveKey: 'tinker-town-factory/save',
  saveVersion: 4,

  tickRate: 30,            // fixed simulation steps per second
  maxFrameSeconds: 0.25,   // longest frame we simulate (tab was hidden, etc.)
  autosaveSeconds: 10,

  costGrowth: 1.13,        // default price growth per level owned (gentler = smoother early game)

  // Owning this many levels of a machine multiplies its output.
  milestones: [10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  milestoneMultiplier: 2,

  // Cozy mode (Settings): an optional, switch-off-able income boost. On by default for new players.
  cozyMultiplier: 2,

  // Offline earnings (Part 3)
  offlineCapSeconds: 12 * 3600,   // machines work this long while you're away (Night Shift adds more)
  offlineEfficiency: 1,          // 1 = same speed as playing, 0.5 = half
  offlinePopupMinSeconds: 30,    // show "welcome back" only after this much time away

  // Safety limits (far beyond normal play) so numbers can never overflow to Infinity.
  maxCoins: 1e300,
  maxLevel: 100000,
  maxGems: 1e9,
};
