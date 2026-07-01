const BASE_XP = 50;
const MAX_STREAK_BONUS = 50;

export function calculateXpAward(currentStreak: number): number {
  const streakBonus = Math.min(currentStreak * 5, MAX_STREAK_BONUS);
  return BASE_XP + streakBonus;
}

export const XP_THRESHOLDS = [0, 200, 500, 1000, 2000] as const;

export function getXpProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  let level = 0;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }

  const currentLevelXp = XP_THRESHOLDS[level];
  const nextLevelXp =
    level < XP_THRESHOLDS.length - 1
      ? XP_THRESHOLDS[level + 1]
      : XP_THRESHOLDS[level] + 1000;

  const progress =
    nextLevelXp > currentLevelXp
      ? ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
      : 100;

  return { level, currentLevelXp, nextLevelXp, progress: Math.min(progress, 100) };
}
