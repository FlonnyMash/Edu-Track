import { getOrGenerateDailyTask } from "@/app/actions/tasks";
import { ensureProfile } from "@/lib/profiles/ensure-profile";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

export async function getOrCreateTodayTask(
  userId: string
): Promise<{ task: DailyTask | null; error?: string }> {
  const supabase = await createClient();

  const ensured = await ensureProfile(userId);
  if (!ensured.ok) {
    return { task: null, error: ensured.error ?? "Profile not found" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, onboarding_completed")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    const message =
      profileError?.code === "42501"
        ? "Database permission error — run migration 003_table_grants.sql"
        : "Profile not found";
    return { task: null, error: message };
  }

  if (!profile.onboarding_completed) {
    return { task: null, error: "Onboarding not completed" };
  }

  const timezone = profile.timezone || "UTC";
  const localToday = getLocalDateString(timezone);

  const { data: existingTodayTask } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", localToday)
    .maybeSingle();

  if (existingTodayTask) {
    return { task: existingTodayTask };
  }

  const { data: track } = await supabase
    .from("learning_tracks")
    .select("title")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const { count: completedCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const currentDay = (completedCount ?? 0) + 1;
  const topic = track?.title || "Japanese";

  return getOrGenerateDailyTask(userId, currentDay, topic);
}
