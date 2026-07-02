"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  activatePendingLearningItemAction,
  toggleLearningItemStatusAction,
} from "@/app/actions/learning-items";
import { parseLearningItemMeaning } from "@/lib/learning/item-utils";
import type { UserLearningItem } from "@/types/database";
import { cn } from "@/lib/utils";

interface LearningItemCardProps {
  item: UserLearningItem;
  variant?: "active" | "archived" | "pending";
  onStatusChange?: () => void;
}

export function LearningItemCard({
  item,
  variant = "active",
  onStatusChange,
}: LearningItemCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { romanji, gloss } = parseLearningItemMeaning(item.meaning);
  const isPending = variant === "pending";
  const isArchived = variant === "archived";

  async function handleAction() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (isPending) {
        await activatePendingLearningItemAction(item.id);
      } else {
        await toggleLearningItemStatusAction(
          item.id,
          isArchived ? "active" : "archived"
        );
      }
      onStatusChange?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      className={cn(
        "city-pop-border flex flex-col gap-3 rounded-xl border p-4",
        isPending && "border-city-orange/50 bg-city-navy-light shadow-[0_0_16px_rgba(255,154,86,0.15)]",
        isArchived && "border-white/10 bg-city-navy/35 opacity-80",
        !isPending && !isArchived && "border-city-teal/40 bg-city-navy-light"
      )}
      whileHover={{ scale: isArchived ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xl font-bold text-white sm:text-2xl">
            {item.term}
          </span>
          <div className="flex flex-col items-end gap-1">
            {isPending ? (
              <span className="rounded-full border border-city-orange/40 bg-city-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-city-orange">
                New
              </span>
            ) : null}
            <span className="rounded-full border border-city-orange/30 bg-city-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-city-orange">
              {item.category}
            </span>
          </div>
        </div>
        <p className="text-sm text-neon-cyan">
          {[romanji, gloss].filter(Boolean).join(" — ")}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleAction()}
        disabled={isSubmitting}
        className={cn(
          "flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 text-xs font-bold transition-all duration-300 sm:text-sm",
          isSubmitting
            ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
            : isPending
              ? "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5"
              : isArchived
                ? "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5"
                : "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_4px_0_0_#B8326A] hover:brightness-110 active:translate-y-0.5"
        )}
      >
        {isSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPending ? (
          "Add to Active Learning"
        ) : isArchived ? (
          "Activate"
        ) : (
          "Archive"
        )}
      </button>
    </motion.div>
  );
}
