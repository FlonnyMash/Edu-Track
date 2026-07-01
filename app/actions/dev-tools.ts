"use server";

import { revalidatePath } from "next/cache";
import { completeTask } from "@/lib/tasks/complete-task";
import { getOrCreateTodayTask } from "@/lib/tasks/get-or-create-today";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString, shiftDateString } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function findAvailableArchiveDate(
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

export async function skipToNextDay() {  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_DEV_MODE !== "true"
  ) {
    throw new Error("Dev tools are disabled");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);

  const { data: todayTask } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("task_date", localToday)
    .maybeSingle();

  if (todayTask?.status === "pending") {
    await completeTask(user.id, todayTask.id);
  }

  const { data: taskToShift } = await supabase
    .from("daily_tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("task_date", localToday)
    .maybeSingle();

  if (taskToShift) {
    const archiveDate = await findAvailableArchiveDate(
      supabase,
      user.id,
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

  const { error: createError } = await getOrCreateTodayTask(user.id);

  if (createError) {
    throw new Error(createError);
  }

  revalidatePath("/dashboard");
}
