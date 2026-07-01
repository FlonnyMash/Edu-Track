export const MAP_NODE_COUNT = 30;

export function getMapNodeIndex(completedDaysCount: number): number {
  return Math.min(completedDaysCount, MAP_NODE_COUNT);
}

export const MAP_NODE_LABELS = [
  "Start",
  "Alley",
  "Neon",
  "Arcade",
  "Rooftop",
  "Station",
  "Harbor",
  "Garden",
  "Tower",
  "Summit",
] as const;

export function getNodeLabel(index: number): string {
  if (index === 0) return MAP_NODE_LABELS[0];
  const labelIndex = Math.min(
    Math.floor((index / MAP_NODE_COUNT) * (MAP_NODE_LABELS.length - 1)) + 1,
    MAP_NODE_LABELS.length - 1
  );
  return MAP_NODE_LABELS[labelIndex];
}
