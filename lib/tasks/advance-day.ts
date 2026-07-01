import { getOrCreateTodayTask } from "@/lib/tasks/get-or-create-today";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString, shiftDateString } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyTask, Database } from "@/types/database";

export async function findAvailableArchiveDate(
  supabase: SupabaseClient<Database>,
  userId: string,
  beforeDate: string
): Promise<string> {
  let candidate = shiftDateString(beforeDate, -1);

  for (let attempt = 0; attempt < 400; attempt++) {
    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("task_date", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }

    candidate = shiftDateString(candidate, -1);
  }

  throw new Error("Could not find an open date to archive the current task");
}

export async function archiveTodayTask(
  userId: string,
  localToday: string
): Promise<void> {
  const supabase = await createClient();

  const { data: taskToShift } = await supabase
    .from("daily_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("task_date", localToday)
    .maybeSingle();

  if (!taskToShift) {
    return;
  }

  const archiveDate = await findAvailableArchiveDate(
    supabase,
    userId,
    localToday
  );

  const { error: shiftError } = await supabase
    .from("daily_tasks")
    .update({ task_date: archiveDate })
    .eq("id", taskToShift.id);

  if (shiftError) {
    throw new Error(shiftError.message);
  }
}

export async function advanceToNextDayTask(
  userId: string
): Promise<{ task: DailyTask | null; error?: string }> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);

  const { data: todayTask } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", localToday)
    .maybeSingle();

  if (!todayTask) {
    return { task: null, error: "No task found for today" };
  }

  if (todayTask.status !== "completed") {
    return { task: null, error: "Complete today's lesson before advancing" };
  }

  try {
    await archiveTodayTask(userId, localToday);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not archive today's task";
    return { task: null, error: message };
  }

  return getOrCreateTodayTask(userId);
}
