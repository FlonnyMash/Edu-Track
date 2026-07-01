import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/profiles/ensure-profile";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ensured = await ensureProfile(user.id);
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: 500 });
  }

  const { data: stats, error } = await supabase
    .from("gamification_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: track } = await supabase
    .from("learning_tracks")
    .select("title")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: completedCount } = await supabase
    .from("daily_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const currentDay = (completedCount ?? 0) + 1;

  return NextResponse.json({
    stats,
    trackTitle: track?.title ?? null,
    currentDay,
  });
}
