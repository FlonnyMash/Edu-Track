import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureProfile(
  userId: string,
  displayName?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName ?? null,
    });

    if (profileError) {
      return { ok: false, error: profileError.message };
    }
  }

  const { data: stats } = await supabase
    .from("gamification_stats")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!stats) {
    const { error: statsError } = await supabase
      .from("gamification_stats")
      .insert({ user_id: userId });

    if (statsError) {
      return { ok: false, error: statsError.message };
    }
  }

  return { ok: true };
}
