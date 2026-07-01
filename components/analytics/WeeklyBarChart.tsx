"use client";

import { formatStudyDuration } from "@/lib/analytics/format-study-duration";
import type { DayBucket } from "@/lib/analytics/types";

interface WeeklyBarChartProps {
  buckets: DayBucket[];
}

export function WeeklyBarChart({ buckets }: WeeklyBarChartProps) {
  const maxMinutes = Math.max(...buckets.map((b) => b.minutes), 1);

  return (
    <div className="flex h-48 items-end justify-between gap-2">
      {buckets.map((bucket) => {
        const pct =
          bucket.minutes > 0
            ? Math.max((bucket.minutes / maxMinutes) * 100, 4)
            : 0;

        return (
          <div
            key={bucket.dateKey}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <div className="relative flex h-full w-full items-end justify-center">
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-city-teal/30 bg-city-navy px-2 py-0.5 text-xs font-medium text-city-teal opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-active:opacity-100">
                {formatStudyDuration(bucket.minutes * 60)}
              </span>
              <div
                className="w-full max-w-8 rounded-t-lg bg-linear-to-t from-city-magenta to-city-orange transition-all group-hover:brightness-110 group-active:scale-y-105"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-city-muted">{bucket.label}</span>
          </div>
        );
      })}
    </div>
  );
}
