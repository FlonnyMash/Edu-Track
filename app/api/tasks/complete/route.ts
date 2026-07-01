export const runtime = "edge";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeTaskSchema } from "@/lib/validations/schemas";
import { calculateStreakUpdate, calculateLongestStreak } from "@/lib/gamification/streak";
import { calculateXpAward } from "@/lib/gamification/xp";
import { getCompanionStage } from "@/lib/gamification/companion";
import { getMapNodeIndex } from "@/lib/gamification/map";
import { getLocalDateString, getYesterdayDateString } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = completeTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { taskId, reflectionNotes } = parsed.data;

  const { data: task, error: taskError } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "pending") {
    return NextResponse.json({ error: "Task already completed" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);
  const localYesterday = getYesterdayDateString(timezone);

  const { data: stats } = await supabase
    .from("gamification_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stats) {
    return NextResponse.json({ error: "Stats not found" }, { status: 404 });
  }

  const { currentStreak, streakBroken } = calculateStreakUpdate(
    stats.last_active_date,
    localToday,
    localYesterday,
    stats.current_streak
  );

  const xpAwarded = calculateXpAward(currentStreak);
  const newTotalXp = stats.total_xp + xpAwarded;
  const longestStreak = calculateLongestStreak(currentStreak, stats.longest_streak);
  const companionStage = getCompanionStage(newTotalXp);

  const { count: completedCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const mapNodeIndex = getMapNodeIndex((completedCount ?? 0) + 1);

  const { error: completionError } = await supabase
    .from("task_completions")
    .insert({
      task_id: taskId,
      user_id: user.id,
      reflection_notes: reflectionNotes || null,
      xp_awarded: xpAwarded,
    });

  if (completionError) {
    return NextResponse.json(
      { error: completionError.message },
      { status: 500 }
    );
  }

  await supabase
    .from("daily_tasks")
    .update({ status: "completed" })
    .eq("id", taskId);

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
    .eq("user_id", user.id)
    .select()
    .single();

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    event_type: streakBroken ? "task_completed_streak_reset" : "task_completed",
    payload: {
      task_id: taskId,
      xp_awarded: xpAwarded,
      reflection_notes: reflectionNotes || null,
      day_number: task.day_number,
    },
  });

  return NextResponse.json({
    stats: updatedStats,
    xpAwarded,
    task: { ...task, status: "completed" as const },
  });
}
