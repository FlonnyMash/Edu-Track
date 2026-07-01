export function calculateStreakUpdate(
  lastActiveDate: string | null,
  localToday: string,
  localYesterday: string,
  currentStreak: number
): { currentStreak: number; streakBroken: boolean } {
  if (lastActiveDate === localToday) {
    return { currentStreak, streakBroken: false };
  }

  if (lastActiveDate === localYesterday) {
    return { currentStreak: currentStreak + 1, streakBroken: false };
  }

  return { currentStreak: 1, streakBroken: lastActiveDate !== null };
}

export function calculateLongestStreak(
  currentStreak: number,
  longestStreak: number
): number {
  return Math.max(currentStreak, longestStreak);
}
