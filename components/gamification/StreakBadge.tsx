"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full border border-[var(--accent-pink)]/30 bg-[var(--accent-pink)]/10 px-4 py-2"
      whileHover={{ scale: 1.05 }}
    >
      <Flame className="h-5 w-5 text-[var(--accent-pink)]" />
      <div>
        <p className="text-xs text-white/50">Streak</p>
        <p className="text-lg font-bold leading-none">{streak}</p>
      </div>
    </motion.div>
  );
}
