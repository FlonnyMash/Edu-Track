"use client";

import { motion } from "framer-motion";
import { COMPANION_LABELS } from "@/lib/gamification/companion";

interface CompanionSpriteProps {
  stage: number;
  trackTitle?: string;
  dayNumber?: number;
}

const STAGE_COLORS = [
  "#8b7fa8",
  "#4ecdc4",
  "#ff6b9d",
  "#ff9a56",
  "#ffd93d",
];

export function CompanionSprite({
  stage,
  trackTitle,
  dayNumber,
}: CompanionSpriteProps) {
  const clampedStage = Math.min(Math.max(stage, 1), 5);
  const color = STAGE_COLORS[clampedStage - 1];
  const size = 40 + clampedStage * 12;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <svg
          width={size * 2}
          height={size * 2}
          viewBox="0 0 120 120"
          className="drop-shadow-[0_0_20px_rgba(255,107,157,0.3)]"
        >
          <ellipse cx="60" cy="95" rx="30" ry="8" fill="rgba(0,0,0,0.2)" />
          <circle cx="60" cy="55" r="35" fill={color} opacity="0.9" />
          <circle cx="60" cy="55" r="30" fill={color} />
          {clampedStage >= 2 && (
            <ellipse cx="60" cy="30" rx="8" ry="12" fill={color} opacity="0.7" />
          )}
          {clampedStage >= 3 && (
            <>
              <circle cx="48" cy="50" r="5" fill="#0f0a1a" />
              <circle cx="72" cy="50" r="5" fill="#0f0a1a" />
              <circle cx="49" cy="49" r="2" fill="white" />
              <circle cx="73" cy="49" r="2" fill="white" />
            </>
          )}
          {clampedStage >= 4 && (
            <path
              d="M 50 65 Q 60 72 70 65"
              stroke="#0f0a1a"
              strokeWidth="2"
              fill="none"
            />
          )}
          {clampedStage >= 5 && (
            <>
              <polygon points="30,40 25,25 40,35" fill="#ffd93d" />
              <polygon points="90,40 95,25 80,35" fill="#ffd93d" />
            </>
          )}
        </svg>
      </motion.div>
      <p className="mt-2 text-sm font-medium text-[var(--accent-teal)]">
        {COMPANION_LABELS[clampedStage]}
      </p>
      {trackTitle && dayNumber && (
        <p className="text-xs text-white/50">
          Day {dayNumber} — {trackTitle}
        </p>
      )}
    </motion.div>
  );
}
