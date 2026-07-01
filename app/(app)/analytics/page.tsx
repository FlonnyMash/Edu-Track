import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsStatCard } from "@/components/analytics/AnalyticsStatCard";
import { WeeklyBarChart } from "@/components/analytics/WeeklyBarChart";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatStudyDuration,
  getStudyAnalytics,
} from "@/lib/analytics/study-analytics";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const analytics = await getStudyAnalytics(user.id);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-1">
      <h1 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
        Your Journey
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <AnalyticsStatCard
          label="Total Time"
          value={formatStudyDuration(analytics.totalSeconds)}
        />
        <AnalyticsStatCard
          label="Current Streak"
          value={analytics.currentStreak}
        />
      </div>

      {analytics.hasData ? (
        <Card className="border-city-teal/30 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
          <CardContent className="pt-2">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-city-magenta">
                This Week
              </p>
              <p className="mt-1 text-sm text-city-muted">
                {formatStudyDuration(analytics.weekSeconds)} studied
              </p>
            </div>
            <WeeklyBarChart buckets={analytics.weeklyBuckets} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-city-teal/30 bg-city-navy-light p-6 text-center shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-bold text-white">No data yet</h2>
          <p className="mt-2 text-sm text-city-muted">
            Complete your first session to see your stats here!
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-semibold text-city-teal transition-transform active:scale-95 hover:underline"
          >
            Go to Dashboard
          </Link>
        </Card>
      )}
    </div>
  );
}
