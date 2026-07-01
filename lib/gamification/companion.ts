import { XP_THRESHOLDS } from "./xp";

export function getCompanionStage(totalXp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export const COMPANION_LABELS: Record<number, string> = {
  1: "Hatchling",
  2: "Curious Kit",
  3: "Study Buddy",
  4: "Wise Spirit",
  5: "Master Sage",
};
