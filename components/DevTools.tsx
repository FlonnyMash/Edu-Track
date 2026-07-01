"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { skipToNextDay } from "@/app/actions/dev-tools";
import { cn } from "@/lib/utils";

export function DevTools() {
  const [open, setOpen] = useState(false);
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
    <div className="pointer-events-none absolute right-3 top-3 z-50">
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50 backdrop-blur-md transition-colors hover:text-city-teal",
            open && "border-city-magenta/30 text-city-magenta"
          )}
          aria-expanded={open}
          aria-label="Toggle dev tools"
        >
          <Wrench className="h-3 w-3" />
          Dev
        </button>

        {open && (
          <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-white/10 bg-black/70 p-2.5 text-xs shadow-lg backdrop-blur-xl">
            <button
              type="button"
              onClick={handleSkipDay}
              disabled={isLoading}
              className="w-full rounded-md bg-city-magenta/80 px-2 py-1.5 text-left text-[11px] font-medium text-white transition hover:bg-city-magenta disabled:opacity-50"
            >
              {isLoading ? "Skipping…" : "⏩ Skip +1 Day"}
            </button>
            <Link
              href="/admin/tamagotchi"
              className="mt-1.5 block rounded-md px-2 py-1.5 text-[11px] text-city-teal hover:bg-white/5"
            >
              Tamagotchi Admin →
            </Link>
            {error && (
              <p className="mt-1.5 text-[10px] leading-tight text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
