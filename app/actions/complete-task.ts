"use server";

import { revalidatePath } from "next/cache";
import { completeTask } from "@/lib/tasks/complete-task";
import { completeTaskSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

export async function completeTaskAction(taskId: string, reflectionNotes?: string) {
  const parsed = completeTaskSchema.safeParse({ taskId, reflectionNotes });

  if (!parsed.success) {
    throw new Error("Invalid task completion data");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await completeTask(
    user.id,
    parsed.data.taskId,
    parsed.data.reflectionNotes
  );

  revalidatePath("/dashboard");
  revalidatePath("/tamagotchi");

  return result;
}
