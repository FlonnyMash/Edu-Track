"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ShopItem, TamagotchiPhase } from "@/lib/tamagotchi/types";

interface TamagotchiDisplayProps {
  phase: TamagotchiPhase | null;
  equippedItems: ShopItem[];
  currentStreak: number;
  trackDay: number;
}

export function TamagotchiDisplay({
  phase,
  equippedItems,
  currentStreak,
  trackDay,
}: TamagotchiDisplayProps) {
  const layers = [
    ...equippedItems.filter((item) => item.type === "background"),
    ...(phase
      ? [
          {
            id: phase.id,
            name: phase.phase_name,
            type: "head" as const,
            price: 0,
            image_url: phase.image_url,
            z_index: 10,
            created_at: "",
          },
        ]
      : []),
    ...equippedItems.filter((item) => item.type !== "background"),
  ].sort((a, b) => a.z_index - b.z_index);

  return (
    <section className="city-pop-border rounded-2xl bg-city-navy-light p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="pixel-label text-city-teal">Your Companion</h2>
        <span className="rounded-full bg-city-magenta/20 px-3 py-1 text-xs font-medium text-city-magenta">
          Day {trackDay}
          {currentStreak > 0 ? ` · ${currentStreak} streak` : ""}
        </span>
      </div>

      <div className="relative mx-auto flex h-56 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-city-navy to-[#0d0e18]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(61,219,207,0.15),transparent_60%)]" />

        <motion.div
          className="relative h-40 w-40"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {layers.map((layer) => (
            <div
              key={`${layer.id}-${layer.z_index}`}
              className="absolute inset-0"
              style={{ zIndex: layer.z_index }}
            >
              <Image
                src={layer.image_url}
                alt={layer.name}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ))}

          {!phase && (
            <p className="absolute inset-0 flex items-center justify-center text-center text-sm text-white/50">
              Upload phase sprites in admin
            </p>
          )}
        </motion.div>
      </div>

      {phase?.condition_description && (
        <p className="mt-3 text-center text-sm text-white/60">
          {phase.condition_description}
        </p>
      )}
    </section>
  );
}
