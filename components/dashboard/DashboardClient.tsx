"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/app/actions/complete-task";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DailyTaskCard } from "@/components/dashboard/DailyTaskCard";
import { DailyTaskCardSkeleton } from "@/components/dashboard/DailyTaskCardSkeleton";
import { CompletionSheet } from "@/components/dashboard/CompletionSheet";
import { Timer } from "@/components/Timer";
import { CompanionSprite } from "@/components/gamification/CompanionSprite";
import { ProgressMap } from "@/components/gamification/ProgressMap";
import { Card } from "@/components/ui/card";
import { getActiveMapNode } from "@/lib/gamification/map";
import type { DailyTask, GamificationStats } from "@/types/database";

export function DashboardClient() {
  const router = useRouter();
  const [task, setTask] = useState<DailyTask | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [displayDay, setDisplayDay] = useState(1);
  const [taskLoading, setTaskLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [highlightNode, setHighlightNode] = useState<number | null>(null);
  const hasLoadedStatsRef = useRef(false);

  const fetchData = useCallback(async (options?: { optimisticDayDelta?: number }) => {
    setError(null);
    setTaskLoading(true);
    setTask((current) => {
      if (current) {
        if (options?.optimisticDayDelta) {
          setDisplayDay(current.day_number + options.optimisticDayDelta);
        }
        return null;
      }
      return current;
    });
    if (!hasLoadedStatsRef.current) {
      setStatsLoading(true);
    }

    const statsPromise = fetch("/api/gamification/stats")
      .then(async (statsRes) => {
        if (!statsRes.ok) {
          const data = await statsRes.json();
          throw new Error(data.error || "Failed to load stats");
        }
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setTrackTitle(statsData.trackTitle);
        if (typeof statsData.currentDay === "number") {
          setDisplayDay(statsData.currentDay);
        }
        hasLoadedStatsRef.current = true;
      })
      .finally(() => setStatsLoading(false));

    const taskPromise = fetch("/api/tasks/today")
      .then(async (taskRes) => {
        if (!taskRes.ok) {
          const data = await taskRes.json();
          throw new Error(data.error || "Failed to load task");
        }
        const taskData = await taskRes.json();
        setTask(taskData.task);
        if (taskData.task?.day_number != null) {
          setDisplayDay(taskData.task.day_number);
        }
      })
      .finally(() => setTaskLoading(false));

    try {
      await Promise.all([taskPromise, statsPromise]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleRefresh() {
      fetchData({ optimisticDayDelta: 1 });
    }

    window.addEventListener("edu-track:refresh", handleRefresh);
    return () => window.removeEventListener("edu-track:refresh", handleRefresh);
  }, [fetchData]);

  async function handleComplete(reflectionNotes: string) {
    if (!task) return;

    const data = await completeTaskAction(
      task.id,
      reflectionNotes || undefined
    );

    setTask(data.task);
    setStats(data.stats);
    setDisplayDay(data.task.day_number);
    const activeNode = getActiveMapNode(
      data.task.day_number,
      data.task.status === "completed"
    );
    setHighlightNode(activeNode);
    setTimeout(() => setHighlightNode(null), 2000);
    router.refresh();
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md px-1">
        <Card className="border-pink-500/20 bg-city-navy-light p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 text-sm text-city-teal transition-transform active:scale-95 hover:underline"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  if (!statsLoading && !stats) {
    return (
      <div className="mx-auto w-full max-w-md px-1">
        <Card className="border-pink-500/20 bg-city-navy-light p-6 text-center">
          <p className="text-city-muted">No data available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-1">
      <h1 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
        Dashboard
      </h1>

      {statsLoading || !stats ? (
        <div className="flex gap-3">
          <div className="h-14 flex-1 animate-pulse rounded-2xl border border-pink-500/10 bg-city-navy-light/60" />
          <div className="h-14 flex-1 animate-pulse rounded-2xl border border-teal-500/10 bg-city-navy-light/60" />
        </div>
      ) : (
        <DashboardHeader
          streak={stats.current_streak}
          totalXp={stats.total_xp}
        />
      )}

      <Card className="relative flex justify-center overflow-hidden border-pink-500/30 bg-linear-to-b from-city-navy-light to-city-navy py-6 shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
        <div className="collectible-glow pointer-events-none absolute inset-0" />
        <CompanionSprite
          currentDay={displayDay}
          trackTitle={trackTitle ?? undefined}
          dayNumber={displayDay}
        />
      </Card>

      {taskLoading || !task ? (
        <DailyTaskCardSkeleton />
      ) : (
        <DailyTaskCard
          task={task}
          onComplete={() => setCompletionOpen(true)}
        />
      )}

      <Timer />

      <Card className="relative overflow-hidden border-teal-500/20 bg-city-navy-light/80 p-5 shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
        <ProgressMap
          currentDay={displayDay}
          isTodayCompleted={!taskLoading && task?.status === "completed"}
          highlightNode={highlightNode}
        />
      </Card>

      <CompletionSheet
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        onSubmit={handleComplete}
      />
    </div>
  );
}
