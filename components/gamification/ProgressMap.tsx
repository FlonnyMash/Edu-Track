"use client";

import { motion } from "framer-motion";
import { MAP_NODE_COUNT, getNodeLabel } from "@/lib/gamification/map";

interface ProgressMapProps {
  currentDay: number;
  isTodayCompleted?: boolean;
  highlightNode?: number | null;
}

function JapanSilhouette() {
  return (
    <svg
      viewBox="0 0 120 140"
      className="pointer-events-none absolute -right-4 top-1/2 h-40 w-auto -translate-y-1/2 fill-city-teal opacity-[0.08]"
      aria-hidden
    >
      {/* Stylized abstract Japan archipelago */}
      <path d="M62 6 C70 4 78 10 76 20 C74 28 66 26 62 6Z" />
      <path d="M58 30 C64 28 70 32 72 42 C74 58 68 78 60 108 C54 118 48 112 46 96 C44 72 50 48 52 36 C54 32 56 30 58 30Z" />
      <path d="M44 78 C50 76 54 82 52 90 C48 94 42 88 44 78Z" />
      <path d="M40 96 C46 94 50 104 46 112 C40 110 38 100 40 96Z" />
      <path d="M78 38 C82 36 86 44 84 52 C80 54 76 46 78 38Z" />
    </svg>
  );
}

function MetroStop({
  index,
  isCompleted,
  isCurrent,
  isHighlighted,
}: {
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isHighlighted: boolean;
}) {
  return (
    <motion.div
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isCurrent
          ? "border-[3.5px] border-city-teal bg-city-navy-light shadow-[0_0_0_2px_rgba(61,219,207,0.35),0_3px_0_0_rgba(0,0,0,0.3)]"
          : isCompleted
            ? "border-[2.5px] border-city-orange/80 bg-city-navy-light"
            : "border-2 border-white/15 bg-city-navy"
      } ${isCurrent ? "animate-pulse-glow" : ""} ${
        isHighlighted ? "ring-2 ring-city-magenta ring-offset-1 ring-offset-city-navy-light" : ""
      }`}
      initial={isHighlighted ? { scale: 1.5 } : false}
      animate={isHighlighted ? { scale: 1 } : {}}
      transition={{ type: "spring" }}
    >
      {isCurrent ? (
        <span className="h-3 w-3 rounded-full bg-city-magenta shadow-[0_0_6px_rgba(255,77,141,0.6)]" />
      ) : isCompleted ? (
        <span className="h-2.5 w-2.5 rounded-full bg-city-orange shadow-[0_0_4px_rgba(255,154,86,0.5)]" />
      ) : (
        <span className="text-[9px] font-bold text-city-muted/40">·</span>
      )}
      <span
        className={`absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[8px] leading-none ${
          isCurrent
            ? "font-bold text-city-teal"
            : isCompleted
              ? "font-semibold text-city-orange/80"
              : "text-city-muted/50"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </motion.div>
  );
}

export function ProgressMap({
  currentDay,
  isTodayCompleted = false,
  highlightNode,
}: ProgressMapProps) {
  const nodes = Array.from({ length: MAP_NODE_COUNT }, (_, i) => i);
  const progressIndex = isTodayCompleted ? currentDay : currentDay - 1;
  const activeNode = Math.min(Math.max(progressIndex, 0), MAP_NODE_COUNT - 1);
  const stationLabel = getNodeLabel(activeNode);

  return (
    <div className="relative overflow-hidden">
      <JapanSilhouette />

      <div className="relative z-10">
        {/* Metro line header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-city-teal px-2 py-0.5 font-mono text-[10px] font-bold text-city-navy">
              学習線
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-city-teal">
              Journey Map
            </p>
          </div>
          <span className="font-mono text-[10px] text-city-muted">
            {stationLabel}
          </span>
        </div>

        {/* Metro timeline */}
        <div className="overflow-x-auto pb-6 pt-1">
          <div className="flex min-w-max items-center px-1">
            {nodes.map((index) => {
              const isCompleted = index < progressIndex;
              const isCurrent = index === progressIndex;
              const isHighlighted = highlightNode === index;
              const waveOffset = index % 2 === 1 ? "translate-y-1" : "";

              return (
                <div
                  key={index}
                  className={`relative flex items-center ${waveOffset}`}
                >
                  <MetroStop
                    index={index}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isHighlighted={isHighlighted}
                  />
                  {index < MAP_NODE_COUNT - 1 && (
                    <div
                      className={`mx-0.5 h-1 w-3 shrink-0 rounded-full ${
                        index < progressIndex
                          ? "bg-linear-to-r from-city-orange to-city-teal"
                          : "bg-city-navy-light ring-1 ring-white/5"
                      }`}
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-1 text-center font-mono text-[10px] text-city-muted">
          ▶ {stationLabel} — Stop {String(activeNode + 1).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
