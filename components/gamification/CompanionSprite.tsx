"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import {
  EVOLUTION_GLOW_CLASS,
  EVOLUTION_LABELS,
  getEvolutionStage,
  type EvolutionStage,
} from "@/lib/gamification/evolution";

interface CompanionSpriteProps {
  currentDay: number;
  trackTitle?: string;
  dayNumber?: number;
}

function HatchlingSprite() {
  return (
    <svg
      width={104}
      height={104}
      viewBox="0 0 64 72"
      className="drop-shadow-[0_4px_12px_rgba(61,219,207,0.35)]"
      aria-hidden
    >
      <ellipse cx="32" cy="66" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      <path
        d="M32 8 C22 8 16 22 16 36 C16 50 22 60 32 62 C42 60 48 50 48 36 C48 22 42 8 32 8Z"
        fill="#F5E6D3"
        stroke="#3DDBCF"
        strokeWidth="1.5"
      />
      <rect x="24" y="22" width="3" height="3" fill="#FF4D8D" opacity="0.7" />
      <rect x="36" y="28" width="3" height="3" fill="#FF4D8D" opacity="0.5" />
      <rect x="28" y="38" width="3" height="3" fill="#FF9A56" opacity="0.6" />
      <rect x="38" y="44" width="3" height="3" fill="#FF9A56" opacity="0.4" />
      <ellipse cx="26" cy="24" rx="6" ry="10" fill="white" opacity="0.25" />
      <path
        d="M28 32 Q32 36 36 32"
        stroke="#3DDBCF"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
        className="animate-pulse"
      />
    </svg>
  );
}

function ChibiSprite() {
  return (
    <svg
      width={112}
      height={112}
      viewBox="0 0 72 80"
      className="drop-shadow-[0_4px_14px_rgba(255,77,141,0.4)]"
      aria-hidden
    >
      <ellipse cx="36" cy="74" rx="20" ry="4" fill="rgba(0,0,0,0.2)" />

      {/* Neon aura ring */}
      <ellipse
        cx="36"
        cy="42"
        rx="28"
        ry="30"
        fill="none"
        stroke="#3DDBCF"
        strokeWidth="1"
        opacity="0.35"
        className="animate-pulse"
      />

      {/* Stubby legs */}
      <rect x="24" y="58" width="8" height="10" rx="2" fill="#E8F8F6" stroke="#3DDBCF" strokeWidth="1" />
      <rect x="40" y="58" width="8" height="10" rx="2" fill="#E8F8F6" stroke="#3DDBCF" strokeWidth="1" />

      {/* Round chibi body */}
      <ellipse cx="36" cy="46" rx="22" ry="20" fill="#E8F8F6" stroke="#FF4D8D" strokeWidth="1.5" />

      {/* Belly patch */}
      <ellipse cx="36" cy="50" rx="12" ry="10" fill="#FFE8F0" opacity="0.9" />

      {/* Tiny arms */}
      <ellipse cx="14" cy="46" rx="6" ry="8" fill="#E8F8F6" stroke="#FF9A56" strokeWidth="1" />
      <ellipse cx="58" cy="46" rx="6" ry="8" fill="#E8F8F6" stroke="#FF9A56" strokeWidth="1" />

      {/* Ears / nubs */}
      <polygon points="22,24 18,14 28,20" fill="#FF9A56" stroke="#FF4D8D" strokeWidth="0.75" />
      <polygon points="50,24 54,14 44,20" fill="#FF9A56" stroke="#FF4D8D" strokeWidth="0.75" />

      {/* Big pixel eyes */}
      <rect x="26" y="36" width="6" height="6" fill="#131421" rx="0.5" />
      <rect x="40" y="36" width="6" height="6" fill="#131421" rx="0.5" />
      <rect x="27.5" y="37.5" width="2" height="2" fill="#3DDBCF" className="animate-pulse" />
      <rect x="41.5" y="37.5" width="2" height="2" fill="#3DDBCF" className="animate-pulse" />

      {/* Cheek blush */}
      <rect x="20" y="44" width="4" height="2" fill="#FF4D8D" opacity="0.5" />
      <rect x="48" y="44" width="4" height="2" fill="#FF4D8D" opacity="0.5" />

      {/* Happy mouth */}
      <path
        d="M30 52 Q36 58 42 52"
        stroke="#131421"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Crown tuft */}
      <polygon points="36,18 32,28 40,28" fill="#3DDBCF" stroke="#FF4D8D" strokeWidth="0.75" />
    </svg>
  );
}

function CompanionSpriteGraphic() {
  return (
    <svg
      width={120}
      height={120}
      viewBox="0 0 80 88"
      className="drop-shadow-[0_6px_18px_rgba(255,217,61,0.35)]"
      aria-hidden
    >
      <ellipse cx="40" cy="82" rx="24" ry="5" fill="rgba(0,0,0,0.22)" />

      {/* Wing glow trails */}
      <path
        d="M8 44 Q2 36 6 28 Q12 34 14 42"
        fill="none"
        stroke="#3DDBCF"
        strokeWidth="1.5"
        opacity="0.5"
        className="animate-pulse"
      />
      <path
        d="M72 44 Q78 36 74 28 Q68 34 66 42"
        fill="none"
        stroke="#FF4D8D"
        strokeWidth="1.5"
        opacity="0.5"
        className="animate-pulse"
      />

      {/* Wings */}
      <path
        d="M14 42 C6 34 4 24 12 18 C16 26 18 36 20 44 Z"
        fill="#FFE8F0"
        stroke="#FF4D8D"
        strokeWidth="1.25"
      />
      <path
        d="M66 42 C74 34 76 24 68 18 C64 26 62 36 60 44 Z"
        fill="#E8F8F6"
        stroke="#3DDBCF"
        strokeWidth="1.25"
      />

      {/* Tail */}
      <path
        d="M40 62 Q52 72 58 66 Q50 64 44 58"
        fill="#FF9A56"
        stroke="#FF4D8D"
        strokeWidth="1"
      />

      {/* Legs */}
      <rect x="28" y="64" width="9" height="12" rx="2" fill="#FFF0E0" stroke="#FF9A56" strokeWidth="1" />
      <rect x="43" y="64" width="9" height="12" rx="2" fill="#FFF0E0" stroke="#FF9A56" strokeWidth="1" />

      {/* Main body */}
      <ellipse cx="40" cy="50" rx="24" ry="22" fill="#FFF8DC" stroke="#FFD93D" strokeWidth="1.5" />

      {/* Chest gem */}
      <polygon
        points="40,44 36,50 40,56 44,50"
        fill="#3DDBCF"
        stroke="#FF4D8D"
        strokeWidth="0.75"
        className="animate-pulse"
      />

      {/* Head */}
      <ellipse cx="40" cy="30" rx="18" ry="16" fill="#FFF8DC" stroke="#FFD93D" strokeWidth="1.5" />

      {/* Star crown */}
      <polygon
        points="40,10 42,16 48,16 43,20 45,26 40,22 35,26 37,20 32,16 38,16"
        fill="#FFD93D"
        stroke="#FF4D8D"
        strokeWidth="0.75"
      />

      {/* Eyes */}
      <rect x="32" y="26" width="5" height="5" fill="#131421" rx="0.5" />
      <rect x="43" y="26" width="5" height="5" fill="#131421" rx="0.5" />
      <rect x="33" y="27" width="2" height="2" fill="#FFD93D" />
      <rect x="44" y="27" width="2" height="2" fill="#FFD93D" />

      {/* Confident smile */}
      <path
        d="M34 38 Q40 43 46 38"
        stroke="#131421"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Antenna / spirit orb */}
      <line x1="40" y1="14" x2="40" y2="6" stroke="#3DDBCF" strokeWidth="1.5" />
      <circle cx="40" cy="5" r="3" fill="#3DDBCF" className="animate-pulse" />
    </svg>
  );
}

const STAGE_SPRITES: Record<EvolutionStage, () => ReactElement> = {
  hatchling: HatchlingSprite,
  chibi: ChibiSprite,
  companion: CompanionSpriteGraphic,
};

export function CompanionSprite({
  currentDay,
  trackTitle,
  dayNumber,
}: CompanionSpriteProps) {
  const stage = getEvolutionStage(currentDay);
  const Sprite = STAGE_SPRITES[stage];

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center"
      key={stage}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <div
          className={`animate-breathe-glow pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full ${EVOLUTION_GLOW_CLASS[stage]}`}
          aria-hidden
        />

        <div className="relative z-10">
          <Sprite />
        </div>
      </motion.div>

      <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-city-teal">
        {EVOLUTION_LABELS[stage]}
      </p>
      {trackTitle && dayNumber && (
        <p className="text-xs text-city-muted">
          Day {dayNumber} — {trackTitle}
        </p>
      )}
    </motion.div>
  );
}
