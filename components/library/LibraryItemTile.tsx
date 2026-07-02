"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  activateCatalogItemAction,
  activatePendingLearningItemAction,
  toggleLearningItemStatusAction,
} from "@/app/actions/learning-items";
import { buildSrsItemKey } from "@/lib/srs/keys";
import type { UserLearningItem } from "@/types/database";
import { cn } from "@/lib/utils";

type TileLearningStatus = "none" | "pending" | "active" | "archived";

interface LibraryItemTileProps {
  character: string;
  pronunciation: string;
  variant?: "kana" | "vocabulary";
  unitId: string;
  category: string;
  learningItem?: UserLearningItem;
  onStatusChange?: () => void;
}

function getTileStatus(learningItem?: UserLearningItem): TileLearningStatus {
  if (!learningItem) return "none";
  return learningItem.status;
}

export function LibraryItemTile({
  character,
  pronunciation,
  variant = "kana",
  unitId,
  category,
  learningItem,
  onStatusChange,
}: LibraryItemTileProps) {
  const [revealed, setRevealed] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isVocabulary = variant === "vocabulary";
  const status = getTileStatus(learningItem);

  async function handleActivate() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (learningItem?.status === "pending") {
        await activatePendingLearningItemAction(learningItem.id);
      } else if (learningItem?.status === "archived") {
        await toggleLearningItemStatusAction(learningItem.id, "active");
      } else {
        await activateCatalogItemAction(
          unitId,
          character,
          pronunciation,
          category
        );
      }
      onStatusChange?.();
      setManageOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchive() {
    if (isSubmitting || !learningItem) return;
    setIsSubmitting(true);

    try {
      await toggleLearningItemStatusAction(learningItem.id, "archived");
      onStatusChange?.();
      setManageOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusLabel =
    status === "active"
      ? "Active"
      : status === "pending"
        ? "New"
      : status === "archived"
        ? "Archived"
        : "Not in loop";

  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        aria-expanded={revealed}
        aria-label={
          revealed
            ? `Hide pronunciation for ${character}`
            : `Reveal pronunciation for ${character}`
        }
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={cn(
          "city-pop-border flex w-full flex-col items-center justify-center rounded-xl",
          "border border-city-teal/40 bg-city-navy-light",
          "px-2 py-3 transition-shadow duration-200",
          "hover:border-city-teal hover:shadow-[0_0_18px_rgba(61,219,207,0.35)]",
          revealed && "border-city-teal shadow-[0_0_22px_rgba(61,219,207,0.45)]",
          isVocabulary ? "min-h-[4.5rem] py-4" : "min-h-[4.25rem]"
        )}
      >
        <span
          className={cn(
            "font-bold leading-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]",
            isVocabulary ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          )}
        >
          {character}
        </span>

        <AnimatePresence initial={false}>
          {revealed && pronunciation ? (
            <motion.span
              key="pronunciation"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden text-center text-xs font-semibold tracking-wide text-neon-cyan drop-shadow-[0_0_6px_rgba(61,219,207,0.5)] sm:text-sm"
            >
              {pronunciation}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              status === "active" && "bg-city-teal/15 text-city-teal",
              status === "pending" && "bg-city-orange/15 text-city-orange",
              status === "archived" && "bg-white/10 text-city-muted",
              status === "none" && "bg-city-orange/10 text-city-orange"
            )}
          >
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={() => setManageOpen((prev) => !prev)}
            className="text-[10px] font-bold uppercase tracking-wide text-city-magenta hover:underline"
          >
            {manageOpen ? "Close" : "Manage"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {manageOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-1.5">
                {status !== "active" ? (
                  <button
                    type="button"
                    onClick={() => void handleActivate()}
                    disabled={isSubmitting}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1 rounded-lg border-2 text-xs font-bold",
                      isSubmitting
                        ? "cursor-not-allowed opacity-60"
                        : "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_3px_0_0_#238982] active:translate-y-0.5"
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Activate
                  </button>
                ) : null}

                {status === "active" && learningItem ? (
                  <button
                    type="button"
                    onClick={() => void handleArchive()}
                    disabled={isSubmitting}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1 rounded-lg border-2 text-xs font-bold",
                      isSubmitting
                        ? "cursor-not-allowed opacity-60"
                        : "border-city-magenta/60 bg-city-magenta/20 text-city-magenta shadow-[0_3px_0_0_#8B2252] active:translate-y-0.5"
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Archive
                  </button>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <span className="sr-only">
        Item key {buildSrsItemKey(unitId, character)}
      </span>
    </div>
  );
}
