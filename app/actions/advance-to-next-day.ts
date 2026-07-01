"use server";

import { revalidatePath } from "next/cache";
import { advanceToNextDayTask } from "@/lib/tasks/advance-day";
import { createClient } from "@/lib/supabase/server";

export async function advanceToNextDayAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { task, error } = await advanceToNextDayTask(user.id);

  if (error) {
    throw new Error(error);
  }

  if (!task) {
    throw new Error("Could not load the next day");
  }

  revalidatePath("/dashboard");

  return { task };
}
