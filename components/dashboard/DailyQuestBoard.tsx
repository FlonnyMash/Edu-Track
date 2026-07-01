"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { completeTaskAction } from "@/app/actions/complete-task";
import { DailyTaskCard } from "@/components/dashboard/DailyTaskCard";
import { DayCompletePanel } from "@/components/dashboard/DayCompletePanel";
import { triggerJackpotConfetti } from "@/lib/gamification/trigger-jackpot-confetti";
import { parseDailyTask, type ParsedQuest } from "@/lib/tasks/parser";
import { cn } from "@/lib/utils";
import type { DailyTask, GamificationStats } from "@/types/database";

const FALLBACK_SIDE_QUEST: ParsedQuest = {
  title: "Study Prep",
  sections: [
    {
      title: "Review",
      content:
        "Set up your study space, print or open a [TERM:genkouyoushi] sheet, and locate the kana chart in your textbook.",
    },
    {
      title: "Application",
      content:
        "Spend 3 minutes orienting yourself to today's material, then mark this Side Quest complete.",
    },
  ],
};

interface DailyQuestBoardProps {
  task: DailyTask;
  selectedDay: number;
  isDayComplete?: boolean;
  isHistoricalView?: boolean;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isNavigating?: boolean;
  onPreviousDay?: () => void;
  onGoToNextDay?: () => void;
  onTaskCompleted?: (payload: {
    task: DailyTask;
    stats: GamificationStats;
    xpAwarded: number;
    coinsAwarded: number;
  }) => void;
  onSubmitError?: (error: Error) => void;
}

export function DailyQuestBoard({
  task,
  selectedDay,
  isDayComplete = false,
  isHistoricalView = false,
  canGoPrevious = false,
  canGoNext = false,
  isNavigating = false,
  onPreviousDay,
  onGoToNextDay,
  onTaskCompleted,
  onSubmitError,
}: DailyQuestBoardProps) {
  const [mainDone, setMainDone] = useState(false);
  const [sideDone, setSideDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daySubmitted, setDaySubmitted] = useState(false);
  const [lastRewards, setLastRewards] = useState<{
    xpAwarded: number;
    coinsAwarded: number;
  } | null>(null);

  const parsed = useMemo(
    () => parseDailyTask(task.instructions),
    [task.instructions]
  );

  const sideQuest = useMemo(() => {
    if (parsed.sideQuest.sections.length > 0) {
      return parsed.sideQuest;
    }
    return FALLBACK_SIDE_QUEST;
  }, [parsed.sideQuest]);

  const isReadOnly = isDayComplete || isHistoricalView;
  const canCompleteDay =
    mainDone &&
    sideDone &&
    !isDayComplete &&
    !isHistoricalView &&
    !isSubmitting &&
    !daySubmitted;

  useEffect(() => {
    const completed = isDayComplete || task.status === "completed";
    setMainDone(completed);
    setSideDone(completed);
    if (completed) {
      setDaySubmitted(true);
    }
  }, [isDayComplete, task.id, task.status]);

  async function handleCompleteDay() {
    if (isDayComplete || isSubmitting || daySubmitted || !canCompleteDay) return;

    setIsSubmitting(true);

    try {
      const data = await completeTaskAction(task.id);

      setLastRewards({
        xpAwarded: data.xpAwarded,
        coinsAwarded: data.coinsAwarded,
      });
      setDaySubmitted(true);

      triggerJackpotConfetti();

      toast.success("✨ DAY CLEARED! ✨", {
        description: `+${data.xpAwarded} XP & +${data.coinsAwarded} Coins earned! Your companion is thrilled!`,
        duration: 5000,
      });

      onTaskCompleted?.({
        task: data.task,
        stats: data.stats,
        xpAwarded: data.xpAwarded,
        coinsAwarded: data.coinsAwarded,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Could not complete daily task");
      onSubmitError?.(error);
      toast.error("Could not save your quest progress", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isNavigating;
  const showDayCompletePanel = isDayComplete && !isHistoricalView;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {showDayCompletePanel ? (
          <DayCompletePanel
            key="day-complete"
            dayNumber={selectedDay}
            xpAwarded={lastRewards?.xpAwarded}
            coinsAwarded={lastRewards?.coinsAwarded}
          />
        ) : (
          <motion.div
            key="quests"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <DailyTaskCard
              task={task}
              questLabel="Main Quest"
              quest={parsed.mainQuest}
              eyebrow="Primary Objective"
              variant="main"
              completed={mainDone}
              dimmed={mainDone && !isDayComplete}
              completeLabel="Mark Main Quest Complete"
              completedLabel="Main Quest complete!"
              onComplete={() => {
                if (!isReadOnly && !isBusy) setMainDone(true);
              }}
            />

            <DailyTaskCard
              task={task}
              questLabel="Side Quest"
              quest={sideQuest}
              eyebrow="Bonus Objective"
              variant="side"
              completed={sideDone}
              dimmed={sideDone && !isDayComplete}
              completeLabel="Mark Side Quest Complete"
              completedLabel="Side Quest complete!"
              onComplete={() => {
                if (!isReadOnly && !isBusy) setSideDone(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {canGoPrevious ? (
          <button
            type="button"
            onClick={onPreviousDay}
            disabled={isBusy}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold transition-all duration-300 sm:text-base",
              isBusy
                ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
                : "border-city-teal/40 bg-city-navy-light text-city-teal shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#238982]"
            )}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Previous Day
          </button>
        ) : null}

        {isDayComplete ? (
          <button
            type="button"
            onClick={onGoToNextDay}
            disabled={!canGoNext || isBusy}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold transition-all duration-300 sm:text-base",
              canGoNext && !isBusy
                ? "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_6px_0_0_#B8326A] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_0_#B8326A]"
                : "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
            )}
          >
            {isNavigating ? "Loading next day..." : "Go to Next Day"}
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleCompleteDay()}
            disabled={!canCompleteDay}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-300 sm:text-base",
              canCompleteDay
                ? "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_6px_0_0_#B8326A] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_0_#B8326A]"
                : "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
            )}
          >
            {isSubmitting ? "Saving your progress..." : "Complete Day"}
          </button>
        )}
      </div>

      {!isDayComplete && (!mainDone || !sideDone) ? (
        <p className="text-center text-xs text-city-muted">
          Finish both quests to unlock Complete Day
        </p>
      ) : null}

      {isHistoricalView ? (
        <p className="text-center text-xs text-city-muted">
          Reviewing Day {selectedDay} — quests are read-only
        </p>
      ) : null}
    </div>
  );
}
