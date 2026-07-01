"use client";

import { useState } from "react";
import { skipToNextDay } from "@/app/actions/dev-tools";
import { Button } from "@/components/ui/button";

export function DevTools() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return null;
  }

  async function handleSkipDay() {
    setIsLoading(true);
    setError(null);

    try {
      await skipToNextDay();
      window.dispatchEvent(new Event("edu-track:refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-56 rounded-2xl border-2 border-city-magenta bg-city-navy/85 p-4 shadow-[0_0_24px_rgba(255,77,141,0.35)] backdrop-blur-xl">
      <p className="pixel-label mb-3 text-city-magenta">Dev Tools</p>
      <Button
        onClick={handleSkipDay}
        disabled={isLoading}
        className="w-full bg-city-magenta shadow-[0_6px_0_0_#B8326A] transition-all hover:brightness-110 active:translate-y-1 active:scale-95 active:shadow-[0_2px_0_0_#B8326A]"
        size="sm"
      >
        {isLoading ? "Skipping…" : "⏩ Skip +1 Day"}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
