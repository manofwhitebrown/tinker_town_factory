// First-run tutorial. One short hint at a time, shown above the game.
//
//   text      what the hint says
//   target    what gets a pulsing outline: { machine, part?: 'buy'|'auto' } or { tab }
//   done(s)   returns true when the player has already done it (step skips itself)
//   manual    show a "Got it" button
//   visitTab  also finishes when the player opens this tab
export const TUTORIAL_STEPS = [
  {
    id: 'tap',
    text: 'Tap the Sewing Machine to make your first coins.',
    target: { machine: 'sewing' },
    done: (s) => s.stats.taps >= 1,
  },
  {
    id: 'upgrade',
    text: 'Spend coins on Buy to level it up. Higher levels earn more per tap.',
    target: { machine: 'sewing', part: 'buy' },
    done: (s) => s.machines.sewing.level >= 3,
  },
  {
    id: 'second',
    text: 'Build the Weaving Loom. Each new machine earns far more.',
    target: { machine: 'loom', part: 'buy' },
    done: (s) => s.machines.loom.level >= 1,
  },
  {
    id: 'auto',
    text: 'Automate a machine so it runs by itself, even while you are away.',
    target: { machine: 'sewing', part: 'auto' },
    done: (s) => Object.values(s.machines).some((m) => m.auto),
  },
  {
    id: 'rewards',
    text: 'Open Rewards for a daily gift and daily quests. They pay gems.',
    target: { tab: 'rewards' },
    manual: true,
    visitTab: 'rewards',
  },
  {
    id: 'managers',
    text: 'Later, reopen the factory in Managers for permanent bonuses. Have fun!',
    target: { tab: 'managers' },
    manual: true,
  },
];
