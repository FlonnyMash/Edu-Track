const BASE_COINS = 50;
const STREAK_COIN_BONUS_PER_DAY = 10;

export function calculateCoinAward(currentStreak: number): number {
  return BASE_COINS + currentStreak * STREAK_COIN_BONUS_PER_DAY;
}
