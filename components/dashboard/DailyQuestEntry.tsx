"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { completeTaskAction } from "@/app/actions/complete-task";
import { MissionSummary } from "@/components/dashboard/MissionSummary";
import { SideQuestPanel } from "@/components/dashboard/SideQuestPanel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { triggerJackpotConfetti } from "@/lib/gamification/trigger-jackpot-confetti";
import { parseDailyTask, type ParsedQuest } from "@/lib/tasks/parser";
import { parseQuestStructureFromMetadata } from "@/lib/tasks/quest-structure";
import { cn } from "@/lib/utils";
import type { DailyTask, GamificationStats } from "@/types/database";

type QuestPhase = "start" | "loading" | "active" | "success";

interface DailyQuestEntryProps {
  task: DailyTask | null;
  isLoading?: boolean;
  isGenerating?: boolean;
  isHistoricalView?: boolean;
  streak?: number;
  onStartMission?: () => void | Promise<void>;
  onTaskCompleted?: (payload: {
    task: DailyTask;
    stats: GamificationStats;
    xpAwarded: number;
    coinsAwarded: number;
  }) => void;
  canGoNext?: boolean;
  isNavigating?: boolean;
  onGoToNextDay?: () => void;
}

const FLOATING_KANA = ["あ", "い", "う", "か", "き"];

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
        "Spend 3 minutes orienting yourself to today's material before marking complete.",
    },
  ],
};

function QuestLoadingState() {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-city-teal/40 bg-city-teal/10 shadow-[0_0_24px_rgba(61,219,207,0.3)]">
        <Loader2 className="h-7 w-7 animate-spin text-city-teal" />
        <motion.span
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-city-magenta text-[10px] text-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          ✦
        </motion.span>
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold text-white">Preparing your mission</p>
        <p className="text-sm text-city-muted">
          Your AI tutor is crafting today&apos;s quest…
        </p>
      </div>
    </div>
  );
}

function QuestSuccessState({
  streak,
  xpAwarded,
  coinsAwarded,
  canGoNext,
  isNavigating,
  onGoToNextDay,
}: {
  streak?: number;
  xpAwarded?: number;
  coinsAwarded?: number;
  canGoNext?: boolean;
  isNavigating?: boolean;
  onGoToNextDay?: () => void;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 py-4 text-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
    >
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-city-teal/50 bg-city-teal/15 shadow-[0_0_32px_rgba(61,219,207,0.45)]"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
      >
        <CheckCircle2 className="h-8 w-8 text-city-teal drop-shadow-[0_0_12px_rgba(61,219,207,0.8)]" />
      </motion.div>

      <div className="space-y-2">
        <p className="pixel-label text-city-magenta">Mission Complete</p>
        <h2 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
          Great job!
        </h2>
        <p className="flex items-center justify-center gap-1.5 text-sm text-white/70">
          <Sparkles className="h-4 w-4 shrink-0 text-city-orange" />
          You crushed today&apos;s daily quest.
        </p>
      </div>

      {(xpAwarded != null || coinsAwarded != null || streak != null) && (
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {xpAwarded != null ? (
            <span className="text-sm font-bold text-city-orange">
              +{xpAwarded} XP
            </span>
          ) : null}
          {coinsAwarded != null ? (
            <>
              <span className="text-white/30">·</span>
              <span className="text-sm font-bold text-yellow-300">
                +{coinsAwarded} Coins
              </span>
            </>
          ) : null}
          {streak != null && streak > 0 ? (
            <>
              <span className="text-white/30">·</span>
              <span className="text-sm font-bold text-city-teal">
                {streak}-day streak 🔥
              </span>
            </>
          ) : null}
        </motion.div>
      )}

      {canGoNext && onGoToNextDay ? (
        <motion.button
          type="button"
          onClick={onGoToNextDay}
          disabled={isNavigating}
          className={cn(
            "flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-300",
            !isNavigating
              ? "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_5px_0_0_#B8326A] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
              : "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
          )}
        >
          {isNavigating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading next day…
            </>
          ) : (
            <>
              Go to Next Day
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      ) : null}
    </motion.div>
  );
}

export function DailyQuestEntry({
  task,
  isLoading = false,
  isGenerating = false,
  isHistoricalView = false,
  streak,
  onStartMission,
  onTaskCompleted,
  canGoNext,
  isNavigating,
  onGoToNextDay,
}: DailyQuestEntryProps) {
  const [missionEngaged, setMissionEngaged] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRewards, setLastRewards] = useState<{
    xpAwarded: number;
    coinsAwarded: number;
    streak: number;
  } | null>(null);

  const parsed = useMemo(
    () => (task ? parseDailyTask(task.instructions) : null),
    [task]
  );

  const questStructure = useMemo(
    () => (task ? parseQuestStructureFromMetadata(task.ai_metadata) : null),
    [task]
  );

  const sideQuest = useMemo(() => {
    if (!parsed) return FALLBACK_SIDE_QUEST;
    if (parsed.sideQuest.sections.length > 0) {
      return parsed.sideQuest;
    }
    return FALLBACK_SIDE_QUEST;
  }, [parsed]);

  const isCompleted = task?.status === "completed";
  const isReadOnly = isHistoricalView || isCompleted;

  useEffect(() => {
    if (isCompleted) {
      setMissionEngaged(true);
    }
  }, [isCompleted]);

  const phase: QuestPhase = useMemo(() => {
    if (isLoading || isGenerating || isStarting) return "loading";
    if (isCompleted) return "success";
    if (task?.status === "pending" && missionEngaged) return "active";
    return "start";
  }, [
    isLoading,
    isGenerating,
    isStarting,
    isCompleted,
    task?.status,
    missionEngaged,
  ]);

  async function handleStartMission() {
    setIsStarting(true);
    try {
      await onStartMission?.();
      setMissionEngaged(true);
    } catch (err) {
      toast.error("Could not start your mission", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleCompleteTask() {
    if (!task || isReadOnly || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data = await completeTaskAction(task.id);

      setLastRewards({
        xpAwarded: data.xpAwarded,
        coinsAwarded: data.coinsAwarded,
        streak: data.stats.current_streak,
      });

      triggerJackpotConfetti();

      toast.success("Great job!", {
        description: `+${data.xpAwarded} XP earned. Streak updated!`,
        duration: 4000,
      });

      onTaskCompleted?.({
        task: data.task,
        stats: data.stats,
        xpAwarded: data.xpAwarded,
        coinsAwarded: data.coinsAwarded,
      });
    } catch (err) {
      toast.error("Could not complete your mission", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const showStartPulse = phase === "start" && !isHistoricalView;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative w-full overflow-visible"
    >
      <div className="rounded-2xl bg-linear-to-r from-city-magenta via-city-orange to-city-teal p-[2px] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
        <Card className="city-pop-border relative overflow-visible border-0 bg-city-navy-light">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-city-magenta/8 via-transparent to-city-teal/8" />

          {FLOATING_KANA.map((kana, index) => (
            <motion.span
              key={kana}
              className="pointer-events-none absolute select-none text-sm font-bold text-city-teal/15"
              style={{
                left: `${6 + index * 18}%`,
                top: `${8 + (index % 2) * 12}%`,
              }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.1, 0.35, 0.1],
              }}
              transition={{
                duration: 3 + index * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
              aria-hidden
            >
              {kana}
            </motion.span>
          ))}

          <CardHeader className="relative space-y-2 p-5 pb-3 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="pixel-label font-bold text-city-magenta">
                Daily Quest · Main Goal
              </p>
              {task?.estimated_minutes != null && phase === "active" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-city-teal">
                  <Clock className="h-3 w-3" />
                  ~{task.estimated_minutes} min
                </span>
              ) : null}
            </div>
            {task?.day_number != null && phase !== "start" ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-city-muted">
                Day {task.day_number}
              </p>
            ) : null}
          </CardHeader>

          <CardContent className="relative space-y-4 overflow-visible p-5 pt-0 sm:p-6 sm:pt-0">
            <AnimatePresence mode="wait">
              {phase === "loading" ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <QuestLoadingState />
                </motion.div>
              ) : null}

              {phase === "start" ? (
                <motion.div
                  key="start"
                  className="flex flex-col items-center gap-5 py-4 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-city-orange/40 bg-city-orange/10 shadow-[0_0_20px_rgba(255,154,86,0.25)]">
                    <Swords className="h-7 w-7 text-city-orange" />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                      Ready for today&apos;s mission?
                    </h2>
                    <p className="text-sm leading-relaxed text-city-muted">
                      Your AI tutor has a personalized quest waiting. Start now
                      to keep your streak alive.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => void handleStartMission()}
                    disabled={isHistoricalView}
                    className={cn(
                      "flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-xl border-2 border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-base font-bold text-white shadow-[0_6px_0_0_#B8326A] transition-all duration-300 hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_0_#B8326A] sm:text-lg",
                      showStartPulse && "animate-start-pulse",
                      isHistoricalView &&
                        "cursor-not-allowed opacity-60 shadow-none"
                    )}
                  >
                    <Zap className="h-5 w-5" />
                    Start Your Daily Mission
                  </motion.button>
                </motion.div>
              ) : null}

              {phase === "active" && task && parsed ? (
                <motion.div
                  key="active"
                  className="space-y-4 overflow-visible"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                      {task.title}
                    </h2>
                    {parsed.mainQuest.title ? (
                      <p className="text-sm font-semibold text-city-teal/90">
                        {parsed.mainQuest.title}
                      </p>
                    ) : null}
                  </div>

                  <MissionSummary
                    quest={parsed.mainQuest}
                    goal={questStructure?.main.goal}
                  />

                  <SideQuestPanel
                    quest={sideQuest}
                    questMeta={questStructure?.side}
                  />

                  <motion.button
                    type="button"
                    onClick={() => void handleCompleteTask()}
                    disabled={isReadOnly || isSubmitting}
                    className={cn(
                      "flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all duration-300 sm:text-lg",
                      !isReadOnly && !isSubmitting
                        ? "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_6px_0_0_#238982] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_0_#238982]"
                        : "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving progress…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Complete Task
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : null}

              {phase === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <QuestSuccessState
                    streak={lastRewards?.streak ?? streak}
                    xpAwarded={lastRewards?.xpAwarded}
                    coinsAwarded={lastRewards?.coinsAwarded}
                    canGoNext={canGoNext}
                    isNavigating={isNavigating}
                    onGoToNextDay={onGoToNextDay}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
