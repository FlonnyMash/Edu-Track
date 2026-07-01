export type EvolutionStage = "hatchling" | "chibi" | "companion";

export const EVOLUTION_LABELS: Record<EvolutionStage, string> = {
  hatchling: "Hatchling",
  chibi: "Chibi",
  companion: "Companion",
};

/** Maps track day (1-based) to the Tamagotchi evolution stage. */
export function getEvolutionStage(currentDay: number): EvolutionStage {
  const day = Math.max(1, Math.floor(currentDay));

  if (day <= 2) return "hatchling";
  if (day <= 5) return "chibi";
  return "companion";
}

export const EVOLUTION_GLOW_CLASS: Record<EvolutionStage, string> = {
  hatchling:
    "bg-[radial-gradient(circle,rgba(61,219,207,0.4)_0%,rgba(255,77,141,0.2)_40%,transparent_70%)]",
  chibi:
    "bg-[radial-gradient(circle,rgba(255,154,86,0.45)_0%,rgba(255,77,141,0.25)_45%,transparent_70%)]",
  companion:
    "bg-[radial-gradient(circle,rgba(255,217,61,0.35)_0%,rgba(61,219,207,0.35)_40%,rgba(255,77,141,0.2)_60%,transparent_75%)]",
};
