"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PronunciationTriggerProps {
  character: string;
  pronunciation: string;
  className?: string;
}

export function PronunciationTrigger({
  character,
  pronunciation,
  className,
}: PronunciationTriggerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((prev) => !prev)}
      aria-expanded={revealed}
      aria-label={
        revealed
          ? `Hide pronunciation for ${character}`
          : `Reveal pronunciation for ${character}`
      }
      className={cn(
        "city-pop-border relative flex min-w-[4.5rem] flex-col items-center rounded-xl",
        "border border-city-teal/50 bg-city-navy-light px-3 py-2",
        "transition-all duration-200",
        "hover:border-city-teal hover:shadow-[0_0_16px_rgba(61,219,207,0.35)]",
        revealed && "border-city-teal shadow-[0_0_20px_rgba(61,219,207,0.4)]",
        className
      )}
    >
      <span className="text-2xl font-bold leading-none text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
        {character}
      </span>

      <AnimatePresence initial={false}>
        {revealed && (
          <motion.span
            key="pronunciation"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden text-sm font-semibold tracking-wide text-neon-cyan drop-shadow-[0_0_6px_rgba(61,219,207,0.5)]"
          >
            {pronunciation}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
