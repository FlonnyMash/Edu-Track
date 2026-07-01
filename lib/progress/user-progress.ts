import { createClient } from "@/lib/supabase/server";
import type { CurrentProgress } from "@/lib/ai/prompts";

export const DEFAULT_PROGRESS: CurrentProgress = {
  chapter: "Hiragana",
  masteredTopics: [],
};

function parseMasteredTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

export async function getUserProgress(
  userId: string
): Promise<CurrentProgress> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_progress")
    .select("current_chapter, mastered_topics")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return DEFAULT_PROGRESS;
  }

  return {
    chapter: data.current_chapter || DEFAULT_PROGRESS.chapter,
    masteredTopics: parseMasteredTopics(data.mastered_topics),
  };
}

export async function upsertUserProgress(
  userId: string,
  progress: CurrentProgress
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      current_chapter: progress.chapter.trim() || DEFAULT_PROGRESS.chapter,
      mastered_topics: progress.masteredTopics,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}
