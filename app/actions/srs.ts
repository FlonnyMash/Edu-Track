"use server";

import { revalidatePath } from "next/cache";
import { updateSrsItemAfterReview } from "@/lib/supabase/srsService";
import { submitSrsFeedbackSchema } from "@/lib/validations/schemas";
import { getLocalDateString } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export async function submitSrsFeedbackAction(
  itemId: string,
  isCorrect: boolean,
  practiceMode?: boolean
) {
  const parsed = submitSrsFeedbackSchema.safeParse({
    itemId,
    isCorrect,
    practiceMode,
  });

  if (!parsed.success) {
    throw new Error("Invalid SRS feedback data");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!parsed.data.practiceMode) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "UTC";
    const localToday = getLocalDateString(timezone);

    await updateSrsItemAfterReview(
      user.id,
      parsed.data.itemId,
      parsed.data.isCorrect,
      localToday
    );

    revalidatePath("/dashboard");
  }

  return { success: true, practiceMode: Boolean(parsed.data.practiceMode) };
}
