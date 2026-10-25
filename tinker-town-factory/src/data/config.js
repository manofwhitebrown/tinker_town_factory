// Global tuning knobs. Change numbers here, not in the logic.
export const CONFIG = {
  saveKey: 'tinker-town-factory/save',
  saveVersion: 1,

  tickRate: 30,            // fixed simulation steps per second
  maxFrameSeconds: 0.25,   // longest frame we simulate (tab was hidden, etc.)
  autosaveSeconds: 10,

  costGrowth: 1.15,        // default price growth per level owned

  // Owning this many levels of a machine multiplies its output.
  milestones: [10, 25, 50, 100, 200, 300, 400, 500],
  milestoneMultiplier: 2,
};
