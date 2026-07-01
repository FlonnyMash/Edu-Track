import type {
  CurrentProgress,
  ProgressContext,
  RecentPerformance,
  TaskHistoryEntry,
} from "@/lib/ai/prompts";
import { extractUniqueTaskTerms } from "@/lib/tasks/parser";
import { createClient } from "@/lib/supabase/server";

export const DEFAULT_PROGRESS: CurrentProgress = {
  chapter: "Hiragana",
  masteredTopics: [],
};

export const DEFAULT_PROGRESS_CONTEXT: ProgressContext = {
  currentDay: 1,
  currentChapter: DEFAULT_PROGRESS.chapter,
  masteredTopics: [],
  previouslyLearnedTerms: [],
  recentPerformance: {
    completedTaskCount: 0,
    recentActions: [],
    recentReflections: [],
    recentTitles: [],
    averageDifficulty: null,
  },
  history: [],
};

const PROGRESSION_ACTIONS = new Set(["advance", "stay", "review"]);

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

function parseProgressionAction(value: unknown): "advance" | "stay" | "review" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return PROGRESSION_ACTIONS.has(normalized)
    ? (normalized as "advance" | "stay" | "review")
    : null;
}

function extractTopicFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;

  const sessionMeta = record.session_metadata;
  if (sessionMeta && typeof sessionMeta === "object") {
    const topic = (sessionMeta as Record<string, unknown>).topic;
    if (typeof topic === "string" && topic.trim()) {
      return topic.trim();
    }
  }

  const directTopic = record.topic;
  if (typeof directTopic === "string" && directTopic.trim()) {
    return directTopic.trim();
  }

  return null;
}

function extractActionFromMetadata(metadata: unknown): "advance" | "stay" | "review" | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;

  const recommend = record.recommend_progression;
  if (recommend && typeof recommend === "object") {
    const action = parseProgressionAction(
      (recommend as Record<string, unknown>).action
    );
    if (action) return action;
  }

  const sessionMeta = record.session_metadata;
  if (sessionMeta && typeof sessionMeta === "object") {
    const action = parseProgressionAction(
      (sessionMeta as Record<string, unknown>).next_recommended_action
    );
    if (action) return action;
  }

  return null;
}

function truncateReflection(notes: string, maxLength = 200): string {
  const trimmed = notes.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildPreviouslyLearnedTerms(
  masteredTopics: string[],
  history: TaskHistoryEntry[],
  completedRows: Array<{ instructions: string; ai_metadata: unknown }>
): string[] {
  const terms = new Set<string>();

  for (const topic of masteredTopics) {
    const normalized = topic.trim().toLowerCase();
    if (normalized) terms.add(normalized);
  }

  for (const row of completedRows) {
    for (const term of extractUniqueTaskTerms(row.instructions)) {
      terms.add(term.toLowerCase());
    }

    const sessionTopic = extractTopicFromMetadata(row.ai_metadata);
    if (sessionTopic) {
      terms.add(sessionTopic.toLowerCase());
    }
  }

  for (const entry of history) {
    for (const term of extractUniqueTaskTerms(entry.instructions)) {
      terms.add(term.toLowerCase());
    }
  }

  return [...terms];
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

export async function buildProgressContext(
  userId: string,
  currentDay: number
): Promise<ProgressContext> {
  const supabase = await createClient();
  const userProgress = await getUserProgress(userId);

  const { count: completedTaskCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const completedCount = completedTaskCount ?? 0;

  const { data: recentCompleted } = await supabase
    .from("daily_tasks")
    .select(
      "day_number, title, instructions, reflection_notes, difficulty_level, ai_metadata"
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("day_number", { ascending: false })
    .limit(5);

  const completedRows = recentCompleted ?? [];

  const history: TaskHistoryEntry[] = completedRows
    .slice()
    .reverse()
    .map((h) => ({
      day_number: h.day_number,
      title: h.title,
      instructions: h.instructions,
      reflection_notes: h.reflection_notes,
      difficulty_level: h.difficulty_level,
    }));

  const previouslyLearnedTerms = buildPreviouslyLearnedTerms(
    userProgress.masteredTopics,
    history,
    completedRows
  );

  const recentActions = completedRows
    .map((row) => extractActionFromMetadata(row.ai_metadata))
    .filter((action): action is "advance" | "stay" | "review" => action !== null)
    .slice(0, 3);

  const recentReflections = completedRows
    .map((row) => row.reflection_notes?.trim())
    .filter((notes): notes is string => Boolean(notes))
    .map(truncateReflection)
    .slice(0, 3);

  const recentTitles = completedRows.map((row) => row.title).slice(0, 3);

  const difficultyLevels = completedRows
    .map((row) => row.difficulty_level)
    .filter((level) => typeof level === "number" && level > 0);

  const averageDifficulty =
    difficultyLevels.length > 0
      ? Math.round(
          (difficultyLevels.reduce((sum, level) => sum + level, 0) /
            difficultyLevels.length) *
            10
        ) / 10
      : null;

  const recentPerformance: RecentPerformance = {
    completedTaskCount: completedCount,
    recentActions,
    recentReflections,
    recentTitles,
    averageDifficulty,
  };

  if (completedCount === 0 && previouslyLearnedTerms.length === 0) {
    return {
      ...DEFAULT_PROGRESS_CONTEXT,
      currentDay,
      currentChapter: userProgress.chapter,
    };
  }

  return {
    currentDay,
    currentChapter: userProgress.chapter,
    masteredTopics: userProgress.masteredTopics,
    previouslyLearnedTerms,
    recentPerformance,
    history,
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
