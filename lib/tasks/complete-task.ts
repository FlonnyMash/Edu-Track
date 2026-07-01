import { calculateStreakUpdate, calculateLongestStreak } from "@/lib/gamification/streak";
import { calculateXpAward } from "@/lib/gamification/xp";
import { calculateCoinAward } from "@/lib/gamification/coins";
import { getCompanionStage } from "@/lib/gamification/companion";
import { getMapNodeIndex } from "@/lib/gamification/map";
import {
  applyProgressionEvaluation,
  evaluateProgressAfterCompletion,
} from "@/lib/ai/evaluate-progress";
import { parseLearningMaterials } from "@/lib/profiles/learning-materials";
import {
  appendMasteredTopicId,
  extractUnitIdFromTaskMetadata,
  getUserProgress,
  upsertUserProgress,
} from "@/lib/progress/user-progress";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString, getYesterdayDateString } from "@/lib/utils";
import type { DailyTask, GamificationStats } from "@/types/database";

export type CompleteTaskResult = {
  stats: GamificationStats;
  xpAwarded: number;
  coinsAwarded: number;
  task: DailyTask;
  progressionUpdate?: {
    chapter: string;
    action: "advance" | "stay" | "review";
  };
};

export async function completeTask(
  userId: string,
  taskId: string,
  reflectionNotes?: string
): Promise<CompleteTaskResult> {
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (taskError || !task) {
    throw new Error("Task not found");
  }

  if (task.status !== "pending") {
    throw new Error("Task already completed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, learning_material")
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);
  const localYesterday = getYesterdayDateString(timezone);

  const { data: stats } = await supabase
    .from("gamification_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!stats) {
    throw new Error("Stats not found");
  }

  const { currentStreak, streakBroken } = calculateStreakUpdate(
    stats.last_active_date,
    localToday,
    localYesterday,
    stats.current_streak
  );

  const xpAwarded = calculateXpAward(currentStreak);
  const coinsAwarded = calculateCoinAward(currentStreak);
  const newTotalXp = stats.total_xp + xpAwarded;
  const longestStreak = calculateLongestStreak(currentStreak, stats.longest_streak);
  const companionStage = getCompanionStage(newTotalXp);

  const { count: completedCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const mapNodeIndex = getMapNodeIndex((completedCount ?? 0) + 1);

  const { error: completionError } = await supabase
    .from("task_completions")
    .insert({
      task_id: taskId,
      user_id: userId,
      reflection_notes: reflectionNotes || null,
      xp_awarded: xpAwarded,
    });

  if (completionError) {
    throw new Error(completionError.message);
  }

  const { error: taskUpdateError } = await supabase
    .from("daily_tasks")
    .update({ status: "completed" })
    .eq("id", taskId);

  if (taskUpdateError) {
    throw new Error(taskUpdateError.message);
  }

  const { data: updatedStats, error: statsError } = await supabase
    .from("gamification_stats")
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: localToday,
      total_xp: newTotalXp,
      companion_stage: companionStage,
      map_node_index: mapNodeIndex,
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (statsError || !updatedStats) {
    throw new Error(statsError?.message ?? "Failed to update stats");
  }

  const { error: coinsError } = await supabase.rpc("award_coins", {
    p_amount: coinsAwarded,
  });

  if (coinsError) {
    throw new Error(coinsError.message);
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: streakBroken ? "task_completed_streak_reset" : "task_completed",
    payload: {
      task_id: taskId,
      xp_awarded: xpAwarded,
      coins_awarded: coinsAwarded,
      reflection_notes: reflectionNotes || null,
      day_number: task.day_number,
    },
  });

  const currentProgress = await getUserProgress(userId);
  const learningMaterials = parseLearningMaterials(profile?.learning_material);
  const unitId = extractUnitIdFromTaskMetadata(task.ai_metadata);

  const evaluation = await evaluateProgressAfterCompletion({
    taskTitle: task.title,
    taskInstructions: task.instructions,
    reflectionNotes: reflectionNotes ?? null,
    currentProgress,
    learningMaterials,
  });

  const updatedProgress = applyProgressionEvaluation(
    currentProgress,
    evaluation
  );

  const masteredTopics = unitId
    ? appendMasteredTopicId(currentProgress.masteredTopics, unitId)
    : currentProgress.masteredTopics;

  if (!unitId) {
    console.warn("[CompleteTask] No syllabus unit id in task metadata; mastered_topics unchanged", {
      taskId,
    });
  }

  const progressToSave = {
    ...updatedProgress,
    masteredTopics,
  };

  await upsertUserProgress(userId, progressToSave);

  await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: "progression_updated",
    payload: {
      task_id: taskId,
      action: evaluation.action,
      previous_chapter: currentProgress.chapter,
      new_chapter: progressToSave.chapter,
      next_topic_id: unitId,
      mastered_topics: progressToSave.masteredTopics,
    },
  });

  return {
    stats: updatedStats,
    xpAwarded,
    coinsAwarded,
    task: { ...task, status: "completed" as const },
    progressionUpdate: {
      chapter: progressToSave.chapter,
      action: evaluation.action,
    },
  };
}
