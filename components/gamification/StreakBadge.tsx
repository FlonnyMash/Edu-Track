"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-2xl border border-city-orange/30 bg-city-navy-light px-4 py-2 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] transition-transform active:scale-95"
      whileHover={{ scale: 1.02 }}
    >
      <Flame className="h-5 w-5 text-city-orange drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-city-muted">
          Streak
        </p>
        <p className="bg-linear-to-br from-city-orange to-city-magenta bg-clip-text text-2xl font-extrabold leading-none text-transparent">
          {streak}
        </p>
      </div>
    </motion.div>
  );
}
