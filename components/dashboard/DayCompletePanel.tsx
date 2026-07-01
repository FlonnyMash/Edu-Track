"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FLOATING_KANA = ["あ", "い", "う", "か", "き", "さ"];

interface DayCompletePanelProps {
  dayNumber: number;
  xpAwarded?: number;
  coinsAwarded?: number;
}

export function DayCompletePanel({
  dayNumber,
  xpAwarded,
  coinsAwarded,
}: DayCompletePanelProps) {
  const showRewards = xpAwarded != null && coinsAwarded != null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-xl bg-linear-to-r from-city-magenta via-city-orange to-city-teal p-[2px] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]"
    >
      <Card
        className={cn(
          "relative overflow-hidden border-0 bg-city-navy-light",
          "bg-linear-to-b from-city-navy-light to-city-navy"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-city-magenta/10 via-transparent to-city-teal/10" />

        {FLOATING_KANA.map((kana, index) => (
          <motion.span
            key={kana}
            className="pointer-events-none absolute select-none text-lg font-bold text-city-teal/25"
            style={{
              left: `${8 + index * 15}%`,
              top: `${12 + (index % 3) * 24}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, index % 2 === 0 ? 10 : -10, 0],
            }}
            transition={{
              duration: 2.8 + index * 0.25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15,
            }}
            aria-hidden
          >
            {kana}
          </motion.span>
        ))}

        <CardContent className="relative flex flex-col items-center gap-4 px-6 py-10 text-center">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-city-teal/50 bg-city-teal/15 shadow-[0_0_32px_rgba(61,219,207,0.45)]"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
          >
            <CheckCircle2 className="h-8 w-8 text-city-teal drop-shadow-[0_0_12px_rgba(61,219,207,0.8)]" />
          </motion.div>

          <div className="space-y-2">
            <p className="pixel-label text-city-magenta">Day {dayNumber}</p>
            <h2 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              DAY CLEARED
            </h2>
            <p className="flex items-center justify-center gap-1.5 text-sm text-white/70 sm:text-base">
              <Sparkles className="h-4 w-4 shrink-0 text-city-orange" />
              Come back tomorrow for your next quest.
            </p>
          </div>

          {showRewards ? (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <span className="text-sm font-bold text-city-orange">
                +{xpAwarded} XP
              </span>
              <span className="text-white/30">·</span>
              <span className="text-sm font-bold text-yellow-300">
                +{coinsAwarded} Coins
              </span>
            </motion.div>
          ) : null}

          <p className="text-xs text-city-muted">
            Your companion is resting happily until then.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
