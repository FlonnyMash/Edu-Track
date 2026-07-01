"use client";

import { motion } from "framer-motion";
import { MAP_NODE_COUNT } from "@/lib/gamification/map";

interface ProgressMapProps {
  currentNode: number;
  highlightNode?: number | null;
}

export function ProgressMap({ currentNode, highlightNode }: ProgressMapProps) {
  const nodes = Array.from({ length: MAP_NODE_COUNT }, (_, i) => i);

  return (
    <div className="overflow-x-auto pb-2">
      <p className="pixel-label mb-3 text-[var(--accent-teal)]">Journey Map</p>
      <div className="flex min-w-max items-center gap-0 px-2">
        {nodes.map((index) => {
          const isUnlocked = index <= currentNode;
          const isCurrent = index === currentNode;
          const isHighlighted = highlightNode === index;

          return (
            <div key={index} className="flex items-center">
              <motion.div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  isUnlocked
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]"
                    : "border-white/20 bg-white/5 text-white/30"
                } ${isCurrent ? "animate-pulse-glow" : ""} ${
                  isHighlighted ? "ring-2 ring-[var(--accent-pink)]" : ""
                }`}
                initial={isHighlighted ? { scale: 1.5 } : false}
                animate={isHighlighted ? { scale: 1 } : {}}
                transition={{ type: "spring" }}
              >
                {isUnlocked ? index + 1 : "·"}
              </motion.div>
              {index < MAP_NODE_COUNT - 1 && (
                <div
                  className={`h-0.5 w-3 ${
                    index < currentNode
                      ? "bg-[var(--accent-teal)]"
                      : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
