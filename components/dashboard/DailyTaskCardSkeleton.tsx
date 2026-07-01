"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DailyTaskCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-magenta-500/25 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-city-magenta/5 via-transparent to-city-teal/5" />
      <CardHeader className="relative">
        <div className="h-3 w-24 animate-pulse rounded-full border border-magenta-500/20 bg-city-navy/80" />
        <div className="mt-3 h-7 w-4/5 animate-pulse rounded-lg border border-magenta-500/15 bg-city-navy/70" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded-full border border-teal-500/15 bg-city-navy/60" />
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="h-4 w-full animate-pulse rounded border border-pink-500/10 bg-city-navy/60" />
        <div className="h-4 w-full animate-pulse rounded border border-pink-500/10 bg-city-navy/60" />
        <div className="h-4 w-3/4 animate-pulse rounded border border-pink-500/10 bg-city-navy/60" />
        <div className="mt-4 h-12 animate-pulse rounded-xl border border-magenta-500/20 bg-city-magenta/10 shadow-[0_4px_0_0_rgba(0,0,0,0.15)]" />
      </CardContent>
    </Card>
  );
}
