import { ensureProfile } from "@/lib/profiles/ensure-profile";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString, shiftDateString } from "@/lib/utils";
import type { DayBucket, StudyAnalytics } from "@/lib/analytics/types";

export type { DayBucket, StudyAnalytics } from "@/lib/analytics/types";
export { formatStudyDuration } from "@/lib/analytics/format-study-duration";

function toLocalDateKey(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function getWeekdayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function getLast7DayKeys(timezone: string): string[] {
  const today = getLocalDateString(timezone);
  const keys: string[] = [];

  for (let i = 6; i >= 0; i--) {
    keys.push(shiftDateString(today, -i));
  }

  return keys;
}

export async function getStudyAnalytics(
  userId: string
): Promise<StudyAnalytics> {
  const supabase = await createClient();

  const ensured = await ensureProfile(userId);
  if (!ensured.ok) {
    throw new Error(ensured.error ?? "Failed to load profile");
  }

  const [profileResult, sessionsResult, statsResult] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", userId).single(),
    supabase
      .from("study_sessions")
      .select("duration_seconds, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("gamification_stats")
      .select("current_streak")
      .eq("user_id", userId)
      .single(),
  ]);

  const timezone = profileResult.data?.timezone || "UTC";
  const sessions = sessionsResult.data ?? [];
  const currentStreak = statsResult.data?.current_streak ?? 0;

  const dayKeys = getLast7DayKeys(timezone);
  const minutesByDay = new Map<string, number>(
    dayKeys.map((key) => [key, 0])
  );

  let totalSeconds = 0;

  for (const session of sessions) {
    totalSeconds += session.duration_seconds;

    const localDate = toLocalDateKey(session.created_at, timezone);
    if (minutesByDay.has(localDate)) {
      const current = minutesByDay.get(localDate) ?? 0;
      minutesByDay.set(
        localDate,
        current + Math.round(session.duration_seconds / 60)
      );
    }
  }

  const weeklyBuckets: DayBucket[] = dayKeys.map((dateKey) => ({
    dateKey,
    label: getWeekdayLabel(dateKey),
    minutes: minutesByDay.get(dateKey) ?? 0,
  }));

  const weekSeconds = weeklyBuckets.reduce(
    (sum, bucket) => sum + bucket.minutes * 60,
    0
  );

  return {
    totalSeconds,
    weekSeconds,
    sessionCount: sessions.length,
    currentStreak,
    weeklyBuckets,
    hasData: sessions.length > 0,
  };
}
