import { GOLDEN } from '../data/meta.js';
import { addCoins, potentialIncomePerSecond } from './economy.js';
import { addGems } from './meta.js';

/**
 * Decides when a Golden Gear appears and when it floats away.
 * It lives only in memory (nothing to save). `rand` can be swapped in tests.
 */
export class GoldenTimer {
  constructor(rand = Math.random) {
    this.rand = rand;
    this.reset();
  }

  pickWait() {
    return GOLDEN.minWait + this.rand() * (GOLDEN.maxWait - GOLDEN.minWait);
  }

  reset() {
    this.life = 0;
    this.wait = this.pickWait();
  }

  get active() {
    return this.life > 0;
  }

  /** Advance by dt seconds. Returns 'spawn', 'expire', or null. */
  tick(dt, canSpawn = true) {
    if (this.life > 0) {
      this.life -= dt;
      if (this.life <= 0) { this.reset(); return 'expire'; }
      return null;
    }
    if (!canSpawn) return null;
    this.wait -= dt;
    if (this.wait <= 0) { this.life = GOLDEN.life; return 'spawn'; }
    return null;
  }

  /** The player caught it. */
  collect() {
    this.reset();
  }
}

/** Pay the bonus: some minutes of your income, sometimes a gem. Returns { coins, gems }. */
export function collectGolden(state, rand = Math.random) {
  const minutes = GOLDEN.minMinutes + rand() * (GOLDEN.maxMinutes - GOLDEN.minMinutes);
  const coins = Math.max(GOLDEN.minCoins, Math.ceil(potentialIncomePerSecond(state) * 60 * minutes));
  const gems = rand() < GOLDEN.gemChance ? 1 : 0;
  addCoins(state, coins);
  addGems(state, gems);
  state.stats.goldenGears += 1;
  return { coins, gems };
}
