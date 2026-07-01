"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Clock } from "lucide-react";
import { ParsedQuestSections } from "@/components/dashboard/TaskContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedQuest } from "@/lib/tasks/parser";
import { cn } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

const MOCK_DAY_1: Pick<
  DailyTask,
  "title" | "instructions" | "estimated_minutes" | "status"
> = {
  title: "Day 1: Hiragana Foundations (あ–の)",
  instructions:
    "# MAIN QUEST\n## Introduction to Hiragana A-row\n\n" +
    "**Theory** (max 10 min)\nOpen Genki I pp. 20–25. Read each character aloud twice.\n\n" +
    "あ | a\nい | i\nう | u\nえ | e\nお | o\n\n" +
    "**Application**\nOn [TERM:genkouyoushi], write each character 5× with correct stroke order (mandatory handwriting).\n\n" +
    "**Playful Learning**\nWatch a hiragana stroke-order video for あ–お.\n\n" +
    "**Methodology**\nTextbook first builds sound–shape links; the video adds motor memory.\n\n" +
    "# SIDE QUEST\n## Study Environment Setup\n\n**Review**\nSet up your study space and print [TERM:genkouyoushi].\n\n" +
    "**Application**\nLocate the hiragana chart in your textbook and skim the A-row once.",
  estimated_minutes: 28,
  status: "pending",
};

const EMPTY_QUEST: ParsedQuest = { title: "", sections: [] };

interface DailyTaskCardProps {
  task?: DailyTask;
  quest?: ParsedQuest;
  questLabel: string;
  eyebrow?: string;
  variant?: "main" | "side";
  completed?: boolean;
  /** Dim/grayscale the card after local quest completion, before the day is fully saved. */
  dimmed?: boolean;
  completeLabel?: string;
  completedLabel?: string;
  onComplete?: () => void;
}

const CARD_VARIANTS = {
  main: {
    card: "border-city-teal/45 bg-city-navy-light shadow-[0_0_24px_rgba(61,219,207,0.12)]",
    eyebrow: "text-city-teal",
    subtitle: "text-white/90",
    timePill: "border-white/20 bg-white/5 text-city-teal",
    button:
      "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_6px_0_0_#238982] active:shadow-[0_2px_0_0_#238982]",
    completed:
      "border-city-teal/40 bg-city-teal/15 text-city-teal",
    xp: "text-city-orange",
  },
  side: {
    card: "border-yellow-400/45 bg-city-navy-light/90 shadow-[0_0_20px_rgba(250,204,21,0.1)]",
    eyebrow: "text-yellow-300",
    subtitle: "text-yellow-100/90",
    timePill: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    button:
      "border-yellow-400/60 bg-yellow-400 text-city-navy shadow-[0_6px_0_0_#CA8A04] active:shadow-[0_2px_0_0_#CA8A04]",
    completed:
      "border-yellow-400/35 bg-yellow-400/15 text-yellow-300",
    xp: "text-city-teal",
  },
} as const;

export function DailyTaskCard({
  task,
  quest,
  questLabel,
  eyebrow,
  variant = "main",
  completed,
  dimmed = false,
  completeLabel,
  completedLabel,
  onComplete,
}: DailyTaskCardProps) {
  const display = task ?? MOCK_DAY_1;
  const resolvedQuest = quest ?? EMPTY_QUEST;
  const style = CARD_VARIANTS[variant];
  const initiallyCompleted = completed ?? display.status === "completed";

  const [localCompleted, setLocalCompleted] = useState(initiallyCompleted);
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [buttonBounce, setButtonBounce] = useState(false);
  const [cardBounce, setCardBounce] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const isCompleted = completed ?? localCompleted;
  const displayEyebrow = eyebrow ?? "Today's Task";
  const actionLabel = completeLabel ?? "Complete Quest";
  const doneLabel = completedLabel ?? "Quest complete!";
  const topicTitle = resolvedQuest.title || questLabel;

  useEffect(() => {
    if (completed != null) {
      setLocalCompleted(completed);
    }
  }, [completed]);

  function handleComplete() {
    if (isCompleted) return;

    setButtonBounce(true);
    setCardBounce(true);
    setJustCompleted(true);
    if (completed == null) {
      setLocalCompleted(true);
    }
    setShowXpBurst(true);

    setTimeout(() => setButtonBounce(false), 400);
    setTimeout(() => setCardBounce(false), 400);
    setTimeout(() => setJustCompleted(false), 600);
    setTimeout(() => setShowXpBurst(false), 1200);

    onComplete?.();
  }

  const dimmedComplete = dimmed && isCompleted;

  return (
    <motion.div
      className={cn(
        "relative transition-all duration-500 ease-out",
        dimmedComplete && "pointer-events-none opacity-60"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={
        cardBounce
          ? { opacity: 1, y: 0, scale: [1, 1.03, 0.98, 1] }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        cardBounce
          ? { duration: 0.4, ease: "easeOut" }
          : { duration: 0.4 }
      }
    >
      {isCompleted && (
        <motion.div
          className={cn(
            "pointer-events-none absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border bg-city-navy/80 shadow-[0_0_20px_rgba(61,219,207,0.45)]",
            variant === "main"
              ? "border-city-teal/50"
              : "border-yellow-400/50"
          )}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
        >
          <CheckCircle2
            className={cn(
              "h-6 w-6 drop-shadow-[0_0_8px_rgba(61,219,207,0.9)]",
              variant === "main" ? "text-city-teal" : "text-yellow-300"
            )}
          />
        </motion.div>
      )}

      <Card
        className={cn(
          "shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-300",
          variant === "side" && "scale-[0.98]",
          style.card,
          justCompleted &&
            (variant === "main"
              ? "!border-city-teal shadow-[0_0_24px_rgba(61,219,207,0.6)]"
              : "!border-yellow-400 shadow-[0_0_24px_rgba(250,204,21,0.5)]"),
          dimmedComplete &&
            !justCompleted &&
            (variant === "main"
              ? "!border-city-teal/60 shadow-[0_0_20px_rgba(61,219,207,0.25)]"
              : "!border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.2)]")
        )}
      >
        <CardHeader className="p-4 sm:p-6">
          <p className={cn("pixel-label font-bold", style.eyebrow)}>
            {displayEyebrow}
          </p>
          <CardTitle className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {questLabel}
          </CardTitle>
          {topicTitle !== questLabel && (
            <p className={cn("text-base font-semibold sm:text-lg", style.subtitle)}>
              {topicTitle}
            </p>
          )}
          {variant === "main" && display.estimated_minutes != null && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
                  style.timePill
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                ~{display.estimated_minutes} min
              </span>
              {display.estimated_minutes > 30 && (
                <span className="rounded-full border border-city-orange/40 bg-city-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-city-orange">
                  Ambitious Session
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <ParsedQuestSections quest={resolvedQuest} />

          <div className="relative pt-2">
            {isCompleted ? (
              <motion.div
                className={cn(
                  "flex h-14 items-center justify-center gap-2 rounded-xl border shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
                  style.completed
                )}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-base font-semibold sm:text-lg">
                  {doneLabel}
                </span>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                onClick={handleComplete}
                animate={
                  buttonBounce
                    ? { scale: [1, 1.05, 0.98, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-xl",
                  "border-2 text-base font-bold sm:text-lg",
                  style.button,
                  "outline-none transition-colors duration-300",
                  "hover:brightness-110",
                  "active:translate-y-1 active:scale-[0.98]",
                  "focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-city-navy"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-current/40 bg-black/10">
                  <Check className="h-4 w-4" />
                </span>
                {actionLabel}
              </motion.button>
            )}

            <AnimatePresence>
              {showXpBurst && (
                <motion.span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 font-bold",
                    style.xp
                  )}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -40, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  +10 XP
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
