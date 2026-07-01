"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hardResetUserData,
  softResetUserData,
} from "@/lib/reset/user-reset";
import type { ResetActionResult } from "@/types/reset";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}

function revalidateResetPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/tamagotchi");
  revalidatePath("/settings");
  revalidatePath("/onboarding");
}

export async function softResetUser(): Promise<ResetActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    await softResetUserData(userId);
    revalidateResetPaths();
    return { ok: true, kind: "soft" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Soft reset failed",
    };
  }
}

export async function hardResetUser(): Promise<ResetActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    await hardResetUserData(userId);
    revalidateResetPaths();
    return { ok: true, kind: "hard" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Hard reset failed",
    };
  }
}
