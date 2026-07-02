"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  Layers,
  Loader2,
  RotateCcw,
  Shuffle,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { submitSrsFeedbackAction } from "@/app/actions/srs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SrsReviewItemMeta } from "@/lib/srs/types";
import { cn, detectTimezone, getLocalDateString, shuffleArray } from "@/lib/utils";

const STACK_KANA = ["か", "さ", "た"];
const REPLAY_STORAGE_KEY = "edu-track:srs-replay-pool";

function getTodayKey(): string {
  return getLocalDateString(detectTimezone());
}

function loadReplayPoolFromStorage(): SrsReviewItemMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      date?: string;
      items?: SrsReviewItemMeta[];
    };
    if (parsed.date !== getTodayKey() || !Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

function saveReplayPoolToStorage(items: SrsReviewItemMeta[]) {
  if (typeof window === "undefined" || items.length === 0) return;
  sessionStorage.setItem(
    REPLAY_STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), items })
  );
}

function parseDisplay(display: string): { character: string; pronunciation: string } {
  const parts = display.split("|").map((part) => part.trim());
  if (parts.length >= 2) {
    return { character: parts[0], pronunciation: parts[1] };
  }
  return { character: display.trim(), pronunciation: "" };
}

interface SrsFlipCardProps {
  item: SrsReviewItemMeta;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
  practiceMode?: boolean;
}

function SrsFlipCard({
  item,
  onAnswer,
  disabled = false,
  practiceMode = false,
}: SrsFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { character, pronunciation } = parseDisplay(item.display);

  async function handleAnswer(isCorrect: boolean) {
    if (disabled || submitting || !flipped) return;

    setSubmitting(true);
    try {
      await submitSrsFeedbackAction(item.id, isCorrect, practiceMode);
      onAnswer(isCorrect);
    } catch {
      toast.error("Could not save your review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={() => setFlipped(true)}
        className="group relative h-48 w-full perspective-[1000px]"
        aria-label={flipped ? "Card revealed" : "Tap to reveal answer"}
      >
        <motion.div
          className="relative h-full w-full"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-city-teal/50 bg-city-navy-light p-6 shadow-[0_6px_0_0_#238982]",
              "backface-hidden"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="pixel-label mb-2 text-city-teal">Recall</p>
            <span className="text-5xl font-extrabold text-white">{character}</span>
            {!flipped ? (
              <p className="mt-4 text-xs text-city-muted group-hover:text-city-teal">
                Tap to flip
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-city-magenta/50 bg-linear-to-b from-city-navy-light to-city-navy p-6 shadow-[0_6px_0_0_#B8326A]",
              "backface-hidden"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="pixel-label mb-2 text-city-magenta">Answer</p>
            <span className="text-3xl font-bold text-white">{character}</span>
            {pronunciation ? (
              <span className="mt-2 text-xl font-semibold text-city-teal">
                {pronunciation}
              </span>
            ) : null}
          </div>
        </motion.div>
      </button>

      {flipped ? (
        <motion.div
          className="grid w-full grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            type="button"
            disabled={disabled || submitting}
            onClick={() => void handleAnswer(true)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-city-teal/60 bg-city-teal text-sm font-bold text-city-navy shadow-[0_4px_0_0_#238982] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#238982]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Got it
          </button>
          <button
            type="button"
            disabled={disabled || submitting}
            onClick={() => void handleAnswer(false)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-sm font-bold text-white shadow-[0_4px_0_0_#B8326A] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Missed it
          </button>
        </motion.div>
      ) : (
        <p className="text-center text-xs text-city-muted">
          Flip the card, then rate your recall
        </p>
      )}
    </div>
  );
}

interface SrsQuickStartProps {
  taskId?: string | null;
  className?: string;
}

export function SrsQuickStart({ taskId, className }: SrsQuickStartProps) {
  const [items, setItems] = useState<SrsReviewItemMeta[]>([]);
  const [sessionItems, setSessionItems] = useState<SrsReviewItemMeta[]>([]);
  const [replayPool, setReplayPool] = useState<SrsReviewItemMeta[]>([]);
  const [activeLearningCount, setActiveLearningCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPracticeSession, setIsPracticeSession] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [lastSessionWasPractice, setLastSessionWasPractice] = useState(false);

  useEffect(() => {
    setReplayPool(loadReplayPoolFromStorage());
  }, []);

  const loadStack = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
      const res = await fetch(`/api/srs/due${query}`);
      if (!res.ok) {
        throw new Error("Failed to load review stack");
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setActiveLearningCount(data.activeLearningCount ?? 0);
    } catch {
      setItems([]);
      setActiveLearningCount(0);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [taskId]);

  useEffect(() => {
    void loadStack();
  }, [loadStack]);

  useEffect(() => {
    function handleRefresh() {
      void loadStack();
    }

    window.addEventListener("edu-track:srs-refresh", handleRefresh);
    return () =>
      window.removeEventListener("edu-track:srs-refresh", handleRefresh);
  }, [loadStack]);

  function persistReplayPool(pool: SrsReviewItemMeta[]) {
    if (pool.length === 0) return;
    setReplayPool(pool);
    saveReplayPoolToStorage(pool);
  }

  function startGradedSession() {
    if (items.length === 0) return;
    persistReplayPool(items);
    setIsPracticeSession(false);
    setSessionItems(shuffleArray(items));
    setSessionActive(true);
    setCurrentIndex(0);
    setSessionComplete(false);
    setLastSessionWasPractice(false);
  }

  function startPracticeSession() {
    if (replayPool.length === 0) return;
    setIsPracticeSession(true);
    setSessionItems(shuffleArray(replayPool));
    setSessionActive(true);
    setCurrentIndex(0);
    setSessionComplete(false);
    setLastSessionWasPractice(false);
  }

  function handleCardAnswered() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionItems.length) {
      const completedItems = [...sessionItems];
      setLastSessionWasPractice(isPracticeSession);
      setSessionComplete(true);
      setSessionActive(false);
      setSessionItems([]);
      setCurrentIndex(0);

      if (!isPracticeSession) {
        persistReplayPool(completedItems.length > 0 ? completedItems : items);
        void loadStack({ silent: true });
      }
      return;
    }
    setCurrentIndex(nextIndex);
  }

  function dismissSessionComplete() {
    setSessionComplete(false);
  }

  function closeSession() {
    setSessionActive(false);
    setCurrentIndex(0);
    setSessionItems([]);
    setIsPracticeSession(false);
    if (!isPracticeSession) {
      void loadStack();
    }
  }

  const currentItem = sessionItems[currentIndex];
  const progressLabel =
    sessionItems.length > 0
      ? `${currentIndex + 1} / ${sessionItems.length}`
      : "";
  const hasReviews = items.length > 0;
  const canPracticeAgain = replayPool.length > 0;
  const practiceCardCount = replayPool.length;

  function PracticeAgainButton({ className: buttonClassName }: { className?: string }) {
    return (
      <button
        type="button"
        onClick={() => {
          dismissSessionComplete();
          startPracticeSession();
        }}
        disabled={sessionActive || practiceCardCount === 0}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-sm font-bold text-white shadow-[0_5px_0_0_#B8326A] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A] disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName ?? "h-14 text-base"
        )}
      >
        <RotateCcw className="h-5 w-5" />
        Practice Again ({practiceCardCount} cards)
      </button>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn("relative w-full overflow-visible", className)}
        id="srs-review-stack"
      >
        <div className="rounded-2xl bg-linear-to-r from-city-teal via-city-magenta to-city-orange p-[2px] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
          <Card
            className="city-pop-border relative overflow-visible border-0 bg-city-navy-light"
            aria-label="SRS review stack"
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-city-teal/10 via-transparent to-city-magenta/8" />

            {STACK_KANA.map((kana, index) => (
              <motion.span
                key={kana}
                className="pointer-events-none absolute select-none text-sm font-bold text-yellow-300/20"
                style={{
                  right: `${8 + index * 14}%`,
                  top: `${10 + (index % 2) * 14}%`,
                }}
                animate={{
                  y: [0, -6, 0],
                  opacity: [0.12, 0.3, 0.12],
                }}
                transition={{
                  duration: 2.8 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.15,
                }}
                aria-hidden
              >
                {kana}
              </motion.span>
            ))}

            <CardHeader className="relative space-y-2 p-5 pb-3 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="pixel-label font-bold text-yellow-300">
                  SRS Review Stack
                </p>
                {!loading && hasReviews ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-bold text-yellow-300">
                    <Layers className="h-3 w-3" />
                    {items.length} ready
                  </span>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="relative space-y-4 overflow-visible p-5 pt-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="flex items-center gap-4 py-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-city-teal/40 bg-city-teal/10">
                    <Loader2 className="h-5 w-5 animate-spin text-city-teal" />
                  </div>
                  <p className="text-sm font-semibold text-white/90">
                    Loading your review stack…
                  </p>
                </div>
              ) : hasReviews ? (
                <>
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                      {items.length} {items.length === 1 ? "card" : "cards"}{" "}
                      waiting
                    </h2>
                    <p className="flex items-center gap-1.5 text-sm text-city-muted">
                      <Shuffle className="h-3.5 w-3.5 shrink-0 text-city-teal" />
                      Shuffled each session — flip, then Got it or Missed it.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startGradedSession}
                    disabled={sessionActive}
                    className={cn(
                      "flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all duration-300 sm:text-lg",
                      !sessionActive
                        ? "border-city-teal/60 bg-city-teal text-city-navy shadow-[0_6px_0_0_#238982] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_0_#238982]"
                        : "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
                    )}
                  >
                    <Zap className="h-5 w-5" />
                    Start Review Session
                  </button>
                </>
              ) : canPracticeAgain ? (
                <div className="space-y-4 py-1">
                  <div className="space-y-1 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-city-teal/40 bg-city-teal/10 shadow-[0_0_20px_rgba(61,219,207,0.2)]">
                      <Check className="h-7 w-7 text-city-teal" />
                    </div>
                    <h2 className="text-lg font-extrabold text-white">
                      Today&apos;s reviews done!
                    </h2>
                    <p className="text-sm text-city-muted">
                      Want more reps? Run a practice round with the same cards.
                    </p>
                  </div>
                  <PracticeAgainButton className="h-14 text-base" />
                  <p className="text-center text-xs text-city-muted">
                    Practice won&apos;t affect SRS scheduling or day progression.
                  </p>
                </div>
              ) : activeLearningCount > 0 ? (
                <div className="space-y-4 py-1 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-city-teal/40 bg-city-teal/10 shadow-[0_0_20px_rgba(61,219,207,0.2)]">
                    <Check className="h-7 w-7 text-city-teal" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold text-white">
                      All caught up!
                    </h2>
                    <p className="text-sm text-city-muted">
                      {activeLearningCount} active items in your loop — check
                      back tomorrow.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-1">
                  <div className="space-y-1 text-center">
                    <h2 className="text-lg font-extrabold text-white">
                      No reviews yet
                    </h2>
                    <p className="text-sm text-city-muted">
                      Activate vocabulary from suggestions or your library to
                      start building a stack.
                    </p>
                  </div>
                  <Link
                    href="/library"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-yellow-400/50 bg-yellow-400/10 text-base font-bold text-yellow-300 shadow-[0_4px_0_0_#CA8A04] transition-all hover:bg-yellow-400/20 active:translate-y-0.5 active:shadow-[0_2px_0_0_#CA8A04]"
                  >
                    <BookOpen className="h-5 w-5" />
                    Open Library
                  </Link>
                </div>
              )}

              {!loading && canPracticeAgain && hasReviews ? (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <p className="pixel-label text-center text-city-orange">
                    Optional practice
                  </p>
                  <PracticeAgainButton />
                  <p className="text-center text-xs text-city-muted">
                    Same-day replay — won&apos;t change SRS scheduling or day
                    progression.
                  </p>
                </div>
              ) : null}

              {sessionComplete ? (
                <div className="space-y-3 rounded-xl border border-city-teal/30 bg-city-teal/10 p-4 text-center">
                  <p className="text-sm font-semibold text-city-teal">
                    {lastSessionWasPractice
                      ? "Practice round complete!"
                      : "Review session complete! Your schedule is updated."}
                  </p>
                  {canPracticeAgain ? (
                    <PracticeAgainButton className="h-12 text-sm" />
                  ) : null}
                  <button
                    type="button"
                    onClick={dismissSessionComplete}
                    className="text-xs font-semibold text-city-muted transition-colors hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AnimatePresence>
        {sessionActive && currentItem ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-city-navy/85 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSession}
          >
            <motion.div
              className="w-full max-w-md overflow-visible rounded-2xl bg-linear-to-r from-city-teal via-city-magenta to-city-orange p-[2px] shadow-[0_12px_0_0_rgba(0,0,0,0.35)]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rounded-[14px] bg-city-navy-light p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="pixel-label text-city-magenta">
                      {isPracticeSession ? "Practice Round" : "SRS Session"}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Card {progressLabel}
                    </p>
                    {isPracticeSession ? (
                      <p className="text-xs text-yellow-300/80">
                        For fun — won&apos;t update your schedule
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={closeSession}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-city-muted transition-colors hover:border-white/20 hover:text-white active:scale-95"
                  >
                    Close
                  </button>
                </div>

                <SrsFlipCard
                  key={currentItem.id}
                  item={currentItem}
                  onAnswer={handleCardAnswered}
                  practiceMode={isPracticeSession}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
