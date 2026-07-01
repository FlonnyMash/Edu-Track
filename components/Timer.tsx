"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveStudySession } from "@/app/actions/time-tracking";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type TimerStatus = "idle" | "running" | "paused";

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function Timer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearTimerInterval();
    }

    return clearTimerInterval;
  }, [status, clearTimerInterval]);

  useEffect(() => {
    return () => {
      clearTimerInterval();
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [clearTimerInterval]);

  function handleStart() {
    setError(null);
    setSuccessMessage(null);
    setStatus("running");
  }

  function handlePause() {
    setStatus("paused");
  }

  async function handleStopAndSave() {
    if (elapsedSeconds === 0) return;

    clearTimerInterval();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to save study time");
      }

      await saveStudySession(user.id, elapsedSeconds);

      setElapsedSeconds(0);
      setStatus("idle");
      setSuccessMessage("Study session saved!");

      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session");
      setStatus("paused");
    } finally {
      setIsSaving(false);
    }
  }

  const showStopAndSave = elapsedSeconds > 0 || status === "paused";
  const isRunning = status === "running";

  return (
    <Card className="border-city-teal/30 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
      <CardHeader>
        <p className="text-xs font-bold uppercase tracking-widest text-city-teal">
          Study Timer
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "font-mono text-5xl font-bold tabular-nums tracking-wider text-white",
            isRunning && "drop-shadow-[0_0_12px_rgba(61,219,207,0.4)]"
          )}
          aria-live="polite"
          aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}
        >
          {formatTime(elapsedSeconds)}
        </div>

        <div className="flex w-full gap-3">
          {!isRunning && (
            <button
              type="button"
              onClick={handleStart}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-city-teal py-3 text-sm font-bold text-city-navy shadow-[0_6px_0_0_#2A9E8F] transition-all hover:brightness-110 active:scale-95 active:translate-y-1 active:shadow-[0_2px_0_0_#2A9E8F] disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "paused" ? "Resume" : "Start"}
            </button>
          )}

          {isRunning && (
            <button
              type="button"
              onClick={handlePause}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-white/10 bg-city-navy py-3 text-sm font-bold text-city-muted transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              Pause
            </button>
          )}

          {showStopAndSave && (
            <button
              type="button"
              onClick={handleStopAndSave}
              disabled={isSaving || elapsedSeconds === 0}
              className="flex-1 rounded-xl bg-city-magenta py-3 text-sm font-bold text-white shadow-[0_6px_0_0_#B8326A] transition-all hover:brightness-110 active:scale-95 active:translate-y-1 active:shadow-[0_2px_0_0_#B8326A] disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Stop & Save"}
            </button>
          )}
        </div>

        {successMessage && (
          <p className="text-sm font-medium text-city-teal" role="status">
            {successMessage}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
