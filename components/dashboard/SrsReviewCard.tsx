"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { submitSrsFeedbackAction } from "@/app/actions/srs";
import { PronunciationTrigger } from "@/components/dashboard/PronunciationTrigger";
import type { SrsReviewItemMeta } from "@/lib/srs/types";
import { cn } from "@/lib/utils";

type AnswerState = "idle" | "submitting" | "correct" | "incorrect";

interface SrsReviewCardProps {
  item: SrsReviewItemMeta;
  disabled?: boolean;
  onAnswered?: (itemId: string, isCorrect: boolean) => void;
}

function parseDisplay(display: string): { character: string; pronunciation: string } {
  const parts = display.split("|").map((part) => part.trim());
  if (parts.length >= 2) {
    return { character: parts[0], pronunciation: parts[1] };
  }
  return { character: display.trim(), pronunciation: "" };
}

export function SrsReviewCard({
  item,
  disabled = false,
  onAnswered,
}: SrsReviewCardProps) {
  const [state, setState] = useState<AnswerState>("idle");
  const { character, pronunciation } = parseDisplay(item.display);

  async function handleAnswer(isCorrect: boolean) {
    if (disabled || state !== "idle") return;

    setState("submitting");

    try {
      await submitSrsFeedbackAction(item.id, isCorrect);
      setState(isCorrect ? "correct" : "incorrect");
      onAnswered?.(item.id, isCorrect);
    } catch {
      setState("idle");
    }
  }

  const isAnswered = state === "correct" || state === "incorrect";

  return (
    <motion.div
      className={cn(
        "city-pop-border rounded-xl border border-white/10 bg-city-navy/50 p-4",
        isAnswered && state === "correct" && "border-city-teal/50 shadow-[0_0_16px_rgba(61,219,207,0.2)]",
        isAnswered && state === "incorrect" && "border-city-magenta/40 shadow-[0_0_16px_rgba(255,77,141,0.15)]"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="pixel-label text-xs font-bold text-city-orange">
          SRS Review
        </span>
        <AnimatePresence>
          {isAnswered ? (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                state === "correct"
                  ? "bg-city-teal/20 text-city-teal"
                  : "bg-city-magenta/20 text-city-magenta"
              )}
            >
              {state === "correct" ? (
                <>
                  <Check className="h-3 w-3" />
                  Got it
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  Missed it
                </>
              )}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mb-4 flex justify-center">
        {pronunciation ? (
          <PronunciationTrigger
            character={character}
            pronunciation={pronunciation}
          />
        ) : (
          <span className="text-3xl font-bold text-white">{character}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || state !== "idle"}
          onClick={() => void handleAnswer(true)}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-bold transition-all duration-300",
            disabled || state !== "idle"
              ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
              : "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#238982]"
          )}
        >
          {state === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Got it
        </button>

        <button
          type="button"
          disabled={disabled || state !== "idle"}
          onClick={() => void handleAnswer(false)}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-bold transition-all duration-300",
            disabled || state !== "idle"
              ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
              : "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_4px_0_0_#B8326A] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
          )}
        >
          {state === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Missed it
        </button>
      </div>
    </motion.div>
  );
}

interface SrsReviewListProps {
  items: SrsReviewItemMeta[];
  disabled?: boolean;
  onItemAnswered?: (itemId: string, isCorrect: boolean) => void;
}

export function SrsReviewList({
  items,
  disabled = false,
  onItemAnswered,
}: SrsReviewListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <SrsReviewCard
          key={item.id}
          item={item}
          disabled={disabled}
          onAnswered={onItemAnswered}
        />
      ))}
    </div>
  );
}
