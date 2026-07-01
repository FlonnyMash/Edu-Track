import { createClient } from "@/lib/supabase/server";
import type { DailyTask } from "@/types/database";

export async function getTaskByDayNumber(
  userId: string,
  dayNumber: number
): Promise<{ task: DailyTask | null; error?: string }> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (error) {
    return { task: null, error: error.message };
  }

  return { task };
}
