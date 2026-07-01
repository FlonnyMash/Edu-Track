import { createClient } from "@/lib/supabase/server";

function assertNoError(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function softResetUserData(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error: logError } = await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: "soft_reset",
    payload: {},
  });
  assertNoError(logError, "Failed to log soft reset");

  const { error: statsError } = await supabase
    .from("gamification_stats")
    .update({
      current_streak: 0,
      last_active_date: null,
      map_node_index: 0,
    })
    .eq("user_id", userId);
  assertNoError(statsError, "Failed to reset gamification stats");

  const { error: tasksError } = await supabase
    .from("daily_tasks")
    .delete()
    .eq("user_id", userId);
  assertNoError(tasksError, "Failed to delete daily tasks");

  const { error: trackError } = await supabase
    .from("learning_tracks")
    .update({ started_at: new Date().toISOString() })
    .eq("user_id", userId);
  assertNoError(trackError, "Failed to reset learning track");
}

export async function hardResetUserData(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error: statsError } = await supabase
    .from("gamification_stats")
    .update({
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      total_xp: 0,
      companion_stage: 1,
      map_node_index: 0,
    })
    .eq("user_id", userId);
  assertNoError(statsError, "Failed to reset gamification stats");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      coins: 0,
      onboarding_completed: false,
    })
    .eq("id", userId);
  assertNoError(profileError, "Failed to reset profile");

  const { error: inventoryError } = await supabase
    .from("user_inventory")
    .delete()
    .eq("user_id", userId);
  assertNoError(inventoryError, "Failed to delete inventory");

  const { error: logsError } = await supabase
    .from("activity_logs")
    .delete()
    .eq("user_id", userId);
  assertNoError(logsError, "Failed to delete activity logs");

  const { error: sessionsError } = await supabase
    .from("study_sessions")
    .delete()
    .eq("user_id", userId);
  assertNoError(sessionsError, "Failed to delete study sessions");

  const { error: trackError } = await supabase
    .from("learning_tracks")
    .delete()
    .eq("user_id", userId);
  assertNoError(trackError, "Failed to delete learning track");
}
