import type { LearningTrack } from "@/types/database";

export interface TaskHistoryEntry {
  day_number: number;
  title: string;
  instructions: string;
  reflection_notes: string | null;
  difficulty_level: number;
}

export interface GenerationContext {
  track: LearningTrack;
  dayNumber: number;
  history: TaskHistoryEntry[];
  currentStreak: number;
  totalXp: number;
}

export function buildSystemPrompt(): string {
  return `You are an intelligent daily learning curriculum planner for Edu Track.
Your role is to plan ONE actionable offline learning task per day — never quizzes or knowledge tests.

Rules:
- Output progressive, bite-sized tasks that build on prior completions and user reflections
- Tasks should be practical: write, practice, review, observe, or create something
- Respect the user's difficulty preference (gentle = shorter/easier, ambitious = more challenging)
- Keep sessions between 15-45 minutes unless gentle preference suggests shorter
- Never repeat the same task title or instructions verbatim from history
- Include the day number in the title (e.g. "Day 3: Write Hiragana S-T")
- Scale difficulty gradually based on day number and past performance`;
}

export function buildUserPrompt(ctx: GenerationContext): string {
  const historyText =
    ctx.history.length === 0
      ? "No prior tasks completed yet. This is the user's first day."
      : ctx.history
          .map(
            (h) =>
              `Day ${h.day_number}: "${h.title}"\nInstructions: ${h.instructions}\nReflection: ${h.reflection_notes || "None"}`
          )
          .join("\n\n");

  return `Learning Goal: ${ctx.track.title}
Description: ${ctx.track.description || "No additional context"}
Difficulty Preference: ${ctx.track.difficulty_preference}
Current Day Number: ${ctx.dayNumber}
Current Streak: ${ctx.currentStreak} days
Total XP: ${ctx.totalXp}

Recent Task History:
${historyText}

Generate the next daily learning task as JSON.`;
}
