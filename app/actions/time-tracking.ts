"use server";

import { revalidatePath } from "next/cache";
import { saveStudySessionSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

export async function saveStudySession(userId: string, durationSeconds: number) {
  const parsed = saveStudySessionSchema.safeParse({ userId, durationSeconds });

  if (!parsed.success) {
    throw new Error("Invalid study session data");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.id !== parsed.data.userId) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("study_sessions").insert({
    user_id: user.id,
    duration_seconds: parsed.data.durationSeconds,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/analytics");

  return { success: true, durationSeconds: parsed.data.durationSeconds };
}
