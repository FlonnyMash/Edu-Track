import { createClient } from "@/lib/supabase/server";
import { generateDailyTask } from "@/lib/ai/generate-daily-task";
import type { TaskHistoryEntry } from "@/lib/ai/prompts";
import { getLocalDateString } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

export async function getOrCreateTodayTask(
  userId: string
): Promise<{ task: DailyTask | null; error?: string }> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, onboarding_completed")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { task: null, error: "Profile not found" };
  }

  if (!profile.onboarding_completed) {
    return { task: null, error: "Onboarding not completed" };
  }

  const timezone = profile.timezone || "UTC";
  const localToday = getLocalDateString(timezone);

  const { data: existingTask } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", localToday)
    .maybeSingle();

  if (existingTask) {
    return { task: existingTask };
  }

  const { data: track, error: trackError } = await supabase
    .from("learning_tracks")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (trackError || !track) {
    return { task: null, error: "No active learning track" };
  }

  const { count: completedCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const dayNumber = (completedCount ?? 0) + 1;

  const { data: recentTasks } = await supabase
    .from("daily_tasks")
    .select("id, day_number, title, instructions, difficulty_level")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("task_date", { ascending: false })
    .limit(7);

  const taskIds = (recentTasks ?? []).map((t) => t.id);
  const { data: completions } = taskIds.length
    ? await supabase
        .from("task_completions")
        .select("task_id, reflection_notes")
        .in("task_id", taskIds)
    : { data: [] };

  const reflectionMap = new Map(
    (completions ?? []).map((c) => [c.task_id, c.reflection_notes])
  );

  const history: TaskHistoryEntry[] = (recentTasks ?? []).map((t) => ({
    day_number: t.day_number,
    title: t.title,
    instructions: t.instructions,
    reflection_notes: reflectionMap.get(t.id) ?? null,
    difficulty_level: t.difficulty_level,
  }));

  const { data: stats } = await supabase
    .from("gamification_stats")
    .select("current_streak, total_xp")
    .eq("user_id", userId)
    .single();

  const { task: aiTask, metadata } = await generateDailyTask({
    track,
    dayNumber,
    history: history.reverse(),
    currentStreak: stats?.current_streak ?? 0,
    totalXp: stats?.total_xp ?? 0,
  });

  const { data: newTask, error: insertError } = await supabase
    .from("daily_tasks")
    .insert({
      user_id: userId,
      track_id: track.id,
      task_date: localToday,
      day_number: dayNumber,
      title: aiTask.title,
      instructions: aiTask.instructions,
      estimated_minutes: aiTask.estimated_minutes,
      difficulty_level: aiTask.difficulty_level,
      ai_metadata: metadata,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raceTask } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", localToday)
        .single();
      return { task: raceTask };
    }
    return { task: null, error: insertError.message };
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: "task_generated",
    payload: { task_id: newTask.id, day_number: dayNumber, metadata },
  });

  return { task: newTask };
}
