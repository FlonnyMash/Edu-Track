import { shiftDateString } from "@/lib/utils";

export const INTERVAL_STEPS = [1, 2, 4, 8, 10] as const;

export type LeitnerUpdate = {
  repetitions: number;
  interval: number;
  next_review_date: string | null;
  is_mastered: boolean;
};

function defaultFromDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Step-based Leitner interval update (not SM-2). */
export function applyLeitnerStep(
  isCorrect: boolean,
  currentRepetitions: number,
  fromDate?: string
): LeitnerUpdate {
  const baseDate = fromDate ?? defaultFromDate();

  if (!isCorrect) {
    return {
      repetitions: 0,
      interval: 1,
      next_review_date: shiftDateString(baseDate, 1),
      is_mastered: false,
    };
  }

  const newRepetitions = currentRepetitions + 1;

  if (newRepetitions >= INTERVAL_STEPS.length) {
    return {
      repetitions: newRepetitions,
      interval: INTERVAL_STEPS[INTERVAL_STEPS.length - 1],
      next_review_date: null,
      is_mastered: true,
    };
  }

  const interval = INTERVAL_STEPS[newRepetitions];

  return {
    repetitions: newRepetitions,
    interval,
    next_review_date: shiftDateString(baseDate, interval),
    is_mastered: false,
  };
}
