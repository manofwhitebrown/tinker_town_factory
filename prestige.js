// Prestige ("hire managers") tuning. Part 4.

export const PRESTIGE = {
  divisor: 2.5e5,         // managers gained = floor(sqrt(coinsEarnedThisRun / divisor))
  bonusPerPoint: 0.1,    // every manager ever hired: +10% income (spending them never lowers this)
};

// Permanent upgrades bought with manager points.
//   cost of next level = ceil(baseCost * growth^currentLevel)
export const UPGRADES = [
  {
    id: 'thimble', name: 'Golden Thimble', max: 30, baseCost: 3, growth: 1.6, perLevel: 0.25,
    describe: (lvl) => `+${Math.round(lvl * 25)}% income`,
  },
  {
    id: 'spools', name: 'Speedy Spools', max: 10, baseCost: 5, growth: 1.8, perLevel: 0.1,
    describe: (lvl) => `+${Math.round(lvl * 10)}% machine speed`,
  },
  {
    id: 'seed', name: 'Seed Money', max: 8, baseCost: 2, growth: 2.5,
    describe: (lvl, fmt) => (lvl ? `Start runs with ${fmt(seedCoins(lvl))} coins` : 'Start runs with 0 coins'),
  },
  {
    id: 'nightshift', name: 'Night Shift', max: 5, baseCost: 4, growth: 2, perLevel: 2 * 3600,
    describe: (lvl) => `+${lvl * 2}h offline earning time`,
  },
];

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

/** Coins you begin each run with at Seed Money level `lvl`. */
export function seedCoins(lvl) {
  return lvl > 0 ? 500 * 5 ** (lvl - 1) : 0;
}
