"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { advanceToNextDayAction } from "@/app/actions/advance-to-next-day";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DailyQuestBoard } from "@/components/dashboard/DailyQuestBoard";
import { DailyTaskCardSkeleton } from "@/components/dashboard/DailyTaskCardSkeleton";
import { Timer } from "@/components/Timer";
import { CompanionSprite } from "@/components/gamification/CompanionSprite";
import { ProgressMap } from "@/components/gamification/ProgressMap";
import { Card } from "@/components/ui/card";
import { getActiveMapNode } from "@/lib/gamification/map";
import { cn } from "@/lib/utils";
import type { DailyTask, GamificationStats } from "@/types/database";

export function DashboardClient() {
  const router = useRouter();
  const [todayTask, setTodayTask] = useState<DailyTask | null>(null);
  const [viewedTask, setViewedTask] = useState<DailyTask | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [taskLoading, setTaskLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrateFlash, setCelebrateFlash] = useState(false);
  const [highlightNode, setHighlightNode] = useState<number | null>(null);
  const hasLoadedStatsRef = useRef(false);
  const selectedDayRef = useRef(selectedDay);

  useEffect(() => {
    selectedDayRef.current = selectedDay;
  }, [selectedDay]);

  const loadDay = useCallback(
    async (day: number, today: DailyTask | null) => {
      if (!today) return false;

      setTaskLoading(true);
      try {
        if (day === today.day_number) {
          setViewedTask(today);
          setSelectedDay(day);
          return true;
        }

        const res = await fetch(`/api/tasks/by-day?day=${day}`);
        if (!res.ok) {
          const data = await res.json();
          toast.error("Could not load that day", {
            description: data.error || "Task not found",
          });
          return false;
        }

        const data = await res.json();
        setViewedTask(data.task);
        setSelectedDay(day);
        return true;
      } catch {
        toast.error("Could not load that day");
        return false;
      } finally {
        setTaskLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    const statsRes = await fetch("/api/gamification/stats");
    if (!statsRes.ok) {
      const data = await statsRes.json();
      throw new Error(data.error || "Failed to load stats");
    }
    const statsData = await statsRes.json();
    setStats(statsData.stats);
    setTrackTitle(statsData.trackTitle);
    if (typeof statsData.currentDay === "number") {
      setActiveDay(statsData.currentDay);
    }
    hasLoadedStatsRef.current = true;
    return statsData;
  }, []);

  const fetchTodayTask = useCallback(async () => {
    const taskRes = await fetch("/api/tasks/today");
    if (!taskRes.ok) {
      const data = await taskRes.json();
      throw new Error(data.error || "Failed to load task");
    }
    const taskData = await taskRes.json();
    return taskData.task as DailyTask;
  }, []);

  const fetchData = useCallback(
    async (options?: { optimisticDayDelta?: number }) => {
      setError(null);
      setTaskLoading(true);
      if (!hasLoadedStatsRef.current) {
        setStatsLoading(true);
      }

      const browsingHistory =
        todayTask != null &&
        selectedDayRef.current !== todayTask.day_number;

      try {
        const [today, _statsData] = await Promise.all([
          fetchTodayTask(),
          fetchStats().finally(() => setStatsLoading(false)),
        ]);

        setTodayTask(today);

        if (options?.optimisticDayDelta && today) {
          const optimisticDay = today.day_number + options.optimisticDayDelta;
          setSelectedDay(optimisticDay);
          setViewedTask(null);
        } else if (browsingHistory) {
          await loadDay(selectedDayRef.current, today);
        } else {
          setViewedTask(today);
          setSelectedDay(today.day_number);
          setTaskLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setTaskLoading(false);
      }
    },
    [fetchStats, fetchTodayTask, loadDay, todayTask]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    function handleRefresh() {
      fetchData({ optimisticDayDelta: 1 });
    }

    window.addEventListener("edu-track:refresh", handleRefresh);
    return () => window.removeEventListener("edu-track:refresh", handleRefresh);
  }, [fetchData]);

  const goToCurrentDay = useCallback(() => {
    if (!todayTask) return;
    void loadDay(todayTask.day_number, todayTask);
  }, [loadDay, todayTask]);

  const selectDay = useCallback(
    (day: number) => {
      if (!todayTask) return;
      if (day === todayTask.day_number) {
        goToCurrentDay();
        return;
      }
      void loadDay(day, todayTask);
    },
    [goToCurrentDay, loadDay, todayTask]
  );

  const goToPreviousDay = useCallback(() => {
    if (selectedDay <= 1 || !todayTask) return;
    void loadDay(selectedDay - 1, todayTask);
  }, [loadDay, selectedDay, todayTask]);

  const goToNextDay = useCallback(async () => {
    if (!todayTask || !viewedTask) return;

    setIsNavigating(true);
    const nextDay = selectedDay + 1;

    try {
      const res = await fetch(`/api/tasks/by-day?day=${nextDay}`);
      if (res.ok) {
        const data = await res.json();
        setViewedTask(data.task);
        setSelectedDay(nextDay);
        return;
      }

      const onTodayCompleted =
        selectedDay === todayTask.day_number &&
        todayTask.status === "completed";

      if (!onTodayCompleted) {
        toast.error("Next day not available yet");
        return;
      }

      setTaskLoading(true);
      const { task: newTask } = await advanceToNextDayAction();
      setTodayTask(newTask);
      setViewedTask(newTask);
      setSelectedDay(newTask.day_number);

      const statsData = await fetchStats();
      if (typeof statsData.currentDay === "number") {
        setActiveDay(statsData.currentDay);
      }

      router.refresh();
    } catch (err) {
      toast.error("Could not advance to next day", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsNavigating(false);
      setTaskLoading(false);
    }
  }, [fetchStats, router, selectedDay, todayTask, viewedTask]);

  function handleTaskCompleted({
    task: completedTask,
    stats: updatedStats,
  }: {
    task: DailyTask;
    stats: GamificationStats;
    xpAwarded: number;
    coinsAwarded: number;
  }) {
    setTodayTask(completedTask);
    setViewedTask(completedTask);
    setStats(updatedStats);
    setSelectedDay(completedTask.day_number);
    setActiveDay(completedTask.day_number + 1);

    const activeNode = getActiveMapNode(
      completedTask.day_number,
      completedTask.status === "completed"
    );
    setHighlightNode(activeNode);
    setTimeout(() => setHighlightNode(null), 2000);

    setCelebrateFlash(true);
    setTimeout(() => setCelebrateFlash(false), 2400);

    router.refresh();
  }

  const isHistoricalView =
    todayTask != null && selectedDay !== todayTask.day_number;

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
          celebrate={celebrateFlash}
        />
      )}

      <Card
        className={cn(
          "relative flex justify-center overflow-hidden border-pink-500/30 bg-linear-to-b from-city-navy-light to-city-navy py-6 shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all duration-300",
          celebrateFlash && "animate-pulse-glow scale-[1.02]"
        )}
      >
        <div className="collectible-glow pointer-events-none absolute inset-0" />
        <CompanionSprite
          currentDay={selectedDay}
          trackTitle={trackTitle ?? undefined}
          dayNumber={selectedDay}
        />
      </Card>

      <Timer />

      {isHistoricalView && todayTask ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-city-teal/30 bg-city-teal/10 px-4 py-2.5">
          <p className="text-sm text-city-teal">
            Viewing Day {selectedDay}
          </p>
          <button
            type="button"
            onClick={goToCurrentDay}
            className="shrink-0 text-sm font-semibold text-city-magenta transition-colors hover:text-city-orange"
          >
            Back to Current Day (Day {todayTask.day_number})
          </button>
        </div>
      ) : null}

      {taskLoading || !viewedTask ? (
        <DailyTaskCardSkeleton />
      ) : (
        <DailyQuestBoard
          task={viewedTask}
          selectedDay={selectedDay}
          isDayComplete={viewedTask.status === "completed"}
          isHistoricalView={isHistoricalView}
          canGoPrevious={selectedDay > 1}
          canGoNext={
            viewedTask.status === "completed" &&
            (selectedDay < (todayTask?.day_number ?? selectedDay) ||
              (todayTask?.status === "completed" &&
                selectedDay === todayTask.day_number))
          }
          isNavigating={isNavigating}
          onPreviousDay={goToPreviousDay}
          onGoToNextDay={() => void goToNextDay()}
          onTaskCompleted={handleTaskCompleted}
        />
      )}

      <Card className="relative overflow-hidden border-teal-500/20 bg-city-navy-light/80 p-5 shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
        <ProgressMap
          selectedDay={selectedDay}
          activeDay={activeDay}
          isTodayCompleted={
            !taskLoading && todayTask?.status === "completed"
          }
          highlightNode={highlightNode}
          onSelectDay={selectDay}
        />
      </Card>
    </div>
  );
}
