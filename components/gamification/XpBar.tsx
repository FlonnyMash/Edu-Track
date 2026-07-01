"use client";

import { motion } from "framer-motion";
import { getXpProgress } from "@/lib/gamification/xp";

interface XpBarProps {
  totalXp: number;
}

export function XpBar({ totalXp }: XpBarProps) {
  const { progress, nextLevelXp } = getXpProgress(totalXp);

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-bold text-white">{totalXp} XP</span>
        <span className="text-city-muted">Next: {nextLevelXp}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full border border-white/5 bg-city-navy">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-city-orange via-city-magenta to-city-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
