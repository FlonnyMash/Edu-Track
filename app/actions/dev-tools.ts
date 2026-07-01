"use server";

import { revalidatePath } from "next/cache";
import { archiveTodayTask } from "@/lib/tasks/advance-day";
import { completeTask } from "@/lib/tasks/complete-task";
import { getOrCreateTodayTask } from "@/lib/tasks/get-or-create-today";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";

export async function skipToNextDay() {
  if (
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

  await archiveTodayTask(user.id, localToday);

  const { error: createError } = await getOrCreateTodayTask(user.id);

  if (createError) {
    throw new Error(createError);
  }

  revalidatePath("/dashboard");
}
