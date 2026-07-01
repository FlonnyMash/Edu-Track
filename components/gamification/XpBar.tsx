"use client";

import { motion } from "framer-motion";
import { getXpProgress } from "@/lib/gamification/xp";

interface XpBarProps {
  totalXp: number;
}

export function XpBar({ totalXp }: XpBarProps) {
  const { progress, nextLevelXp } = getXpProgress(totalXp);

  return (
    <div className="flex-1">
      <div className="mb-1 flex justify-between text-xs text-white/50">
        <span>{totalXp} XP</span>
        <span>Next: {nextLevelXp}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-teal)] to-[var(--accent-pink)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
