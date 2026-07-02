"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  activatePendingLearningItemAction,
  getPendingLearningItemsAction,
} from "@/app/actions/learning-items";
import { parseLearningItemMeaning } from "@/lib/learning/item-utils";
import type { UserLearningItem } from "@/types/database";
import { cn } from "@/lib/utils";

export function NewLessonNotification() {
  const [pendingItems, setPendingItems] = useState<UserLearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadPendingItems = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await getPendingLearningItemsAction();
      setPendingItems(items);
    } catch {
      setPendingItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingItems();
  }, [loadPendingItems]);

  async function handleActivate(itemId: string) {
    setActivatingId(itemId);

    try {
      await activatePendingLearningItemAction(itemId);
      setPendingItems((current) => current.filter((item) => item.id !== itemId));
      window.dispatchEvent(new Event("edu-track:srs-refresh"));
      toast.success("Added to Active Learning", {
        description: "This item will appear in your SRS review loop.",
      });
    } catch (error) {
      toast.error("Could not activate item", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setActivatingId(null);
    }
  }

  if (loading || pendingItems.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="city-pop-border space-y-4 rounded-2xl border border-city-magenta/40 bg-city-navy-light p-4 shadow-[0_0_24px_rgba(255,77,141,0.15)]"
      aria-labelledby="new-lesson-heading"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-city-orange" />
        <h2
          id="new-lesson-heading"
          className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-lg font-extrabold text-transparent"
        >
          New Lesson Suggestions
        </h2>
      </div>

      <p className="text-sm text-city-muted">
        Your tutor found new vocabulary for your level. Add items you want in
        your daily SRS loop.
      </p>

      <ul className="space-y-3">
        {pendingItems.map((item) => {
          const { romanji, gloss } = parseLearningItemMeaning(item.meaning);
          const isActivating = activatingId === item.id;

          return (
            <li
              key={item.id}
              className="rounded-xl border border-white/10 bg-city-navy/50 p-3"
            >
              <div className="mb-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-white">{item.term}</span>
                  <span className="rounded-full border border-city-orange/40 bg-city-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-city-orange">
                    New
                  </span>
                </div>
                <p className="text-sm text-neon-cyan">
                  {[romanji, gloss].filter(Boolean).join(" — ")}
                </p>
                <p className="text-xs text-city-muted">{item.category}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleActivate(item.id)}
                disabled={isActivating}
                className={cn(
                  "flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-300",
                  isActivating
                    ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
                    : "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#238982]"
                )}
              >
                {isActivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Add to Active Learning
              </button>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
