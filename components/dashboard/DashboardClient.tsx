"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DailyTaskCard } from "@/components/dashboard/DailyTaskCard";
import { CompletionSheet } from "@/components/dashboard/CompletionSheet";
import { CompanionSprite } from "@/components/gamification/CompanionSprite";
import { ProgressMap } from "@/components/gamification/ProgressMap";
import { Card } from "@/components/ui/card";
import type { DailyTask, GamificationStats } from "@/types/database";

export function DashboardClient() {
  const [task, setTask] = useState<DailyTask | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [highlightNode, setHighlightNode] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [taskRes, statsRes] = await Promise.all([
        fetch("/api/tasks/today"),
        fetch("/api/gamification/stats"),
      ]);

      if (!taskRes.ok) {
        const data = await taskRes.json();
        throw new Error(data.error || "Failed to load task");
      }

      if (!statsRes.ok) {
        const data = await statsRes.json();
        throw new Error(data.error || "Failed to load stats");
      }

      const taskData = await taskRes.json();
      const statsData = await statsRes.json();

      setTask(taskData.task);
      setStats(statsData.stats);
      setTrackTitle(statsData.trackTitle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleComplete(reflectionNotes: string) {
    if (!task) return;

    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        reflectionNotes: reflectionNotes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to complete task");
    }

    const data = await res.json();
    setTask(data.task);
    setStats(data.stats);
    setHighlightNode(data.stats.map_node_index);
    setTimeout(() => setHighlightNode(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-white/10" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 text-sm text-[var(--accent-teal)] hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!task || !stats) {
    return (
      <Card className="p-6 text-center">
        <p className="text-white/60">No data available</p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <DashboardHeader
        streak={stats.current_streak}
        totalXp={stats.total_xp}
      />

      <Card className="mb-6 flex justify-center py-6 city-pop-border">
        <CompanionSprite
          stage={stats.companion_stage}
          trackTitle={trackTitle ?? undefined}
          dayNumber={task.day_number}
        />
      </Card>

      <div className="mb-6">
        <DailyTaskCard
          task={task}
          onComplete={() => setCompletionOpen(true)}
        />
      </div>

      <Card className="p-4">
        <ProgressMap
          currentNode={stats.map_node_index}
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
