"use client";

import { useCallback, useState } from "react";
import { fetchTermDefinition } from "@/app/actions/glossary";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FALLBACK_MESSAGE = "Definition not found. Try again later.";

interface TermTriggerProps {
  term: string;
  className?: string;
}

export function TermTrigger({ term, className }: TermTriggerProps) {
  const [open, setOpen] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefinition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchTermDefinition(term);
      const text = result.definition?.trim();

      if (!text) {
        setDefinition(null);
        setError(FALLBACK_MESSAGE);
      } else {
        setDefinition(text);
        setError(null);
      }
    } catch (err) {
      console.error("[TermTrigger] fetchTermDefinition failed:", err);
      setDefinition(null);
      setError(FALLBACK_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [term]);

  function handleOpen() {
    setOpen(true);
    if (!definition && !loading) {
      void loadDefinition();
    }
  }

  function handleClose() {
    setOpen(false);
  }

  function handleRetry() {
    setDefinition(null);
    void loadDefinition();
  }

  const showFallback = !loading && Boolean(error);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "inline cursor-pointer text-city-teal",
          "underline decoration-city-teal/50 decoration-dotted underline-offset-2",
          "transition-all hover:text-city-teal hover:drop-shadow-[0_0_6px_rgba(61,219,207,0.45)]",
          className
        )}
      >
        {term}
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        title={term}
        className="city-pop-border border-city-teal/20 bg-city-navy-light"
      >
        {loading && (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-white/60">Loading definition...</p>
            <div className="h-4 animate-pulse rounded-lg bg-white/10" />
            <div className="h-4 w-4/5 animate-pulse rounded-lg bg-white/10" />
          </div>
        )}

        {showFallback && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">{error ?? FALLBACK_MESSAGE}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm font-medium text-city-teal underline underline-offset-2 hover:text-city-teal/80"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && definition && (
          <p className="text-base leading-relaxed text-white/85">{definition}</p>
        )}
      </Dialog>
    </>
  );
}
