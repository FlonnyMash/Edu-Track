export type DayBucket = { dateKey: string; label: string; minutes: number };

export type StudyAnalytics = {
  totalSeconds: number;
  weekSeconds: number;
  sessionCount: number;
  currentStreak: number;
  weeklyBuckets: DayBucket[];
  hasData: boolean;
};
