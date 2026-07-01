"use server";

import { generateMvpDailyTask } from "@/lib/ai/generate-daily-task";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

export async function getOrGenerateDailyTask(
  userId: string,
  currentDay: number,
  topic: string = "Japanese"
): Promise<{ task: DailyTask | null; error?: string }> {
  const supabase = await createClient();

  const { data: existingTask } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("day_number", currentDay)
    .maybeSingle();

  if (existingTask) {
    return { task: existingTask };
  }

  const { data: track, error: trackError } = await supabase
    .from("learning_tracks")
    .select("id, title")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (trackError || !track) {
    return { task: null, error: "No active learning track" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);
  const learningTopic = topic || track.title || "Japanese";

  const { task: aiTask, metadata } = await generateMvpDailyTask(
    learningTopic,
    currentDay
  );

  const { data: newTask, error: insertError } = await supabase
    .from("daily_tasks")
    .insert({
      user_id: userId,
      track_id: track.id,
      task_date: localToday,
      day_number: currentDay,
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
        .eq("day_number", currentDay)
        .maybeSingle();

      if (raceTask) {
        return { task: raceTask };
      }

      const { data: todayTask } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", localToday)
        .maybeSingle();

      return { task: todayTask };
    }

    return { task: null, error: insertError.message };
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: "task_generated",
    payload: {
      task_id: newTask.id,
      day_number: currentDay,
      topic: learningTopic,
      metadata,
    },
  });

  return { task: newTask };
}
