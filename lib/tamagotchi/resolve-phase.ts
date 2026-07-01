import type { TamagotchiPhase } from "@/types/database";

export type PhaseKind = "starter" | "mood";

export type MoodState = "happy" | "hungry" | "sad";

export function getMoodState(
  currentStreak: number,
  todayTaskCompleted: boolean
): MoodState {
  if (currentStreak === 0) {
    return "sad";
  }
  if (!todayTaskCompleted) {
    return "hungry";
  }
  return "happy";
}

export function resolveActivePhase(
  phases: TamagotchiPhase[],
  trackDay: number,
  currentStreak: number,
  todayTaskCompleted: boolean
): TamagotchiPhase | null {
  if (trackDay <= 4) {
    return (
      phases.find(
        (p) => p.phase_kind === "starter" && p.day_number === trackDay
      ) ?? null
    );
  }

  const moodState = getMoodState(currentStreak, todayTaskCompleted);
  return (
    phases.find(
      (p) => p.phase_kind === "mood" && p.phase_name === moodState
    ) ?? null
  );
}
