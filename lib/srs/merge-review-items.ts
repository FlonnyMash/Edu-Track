import type { SrsReviewItemMeta } from "@/lib/srs/types";

/** Merge task-assigned reviews with live due stack (task items first, deduped by id). */
export function mergeSrsReviewItems(
  taskItems: SrsReviewItemMeta[],
  dueItems: SrsReviewItemMeta[]
): SrsReviewItemMeta[] {
  const seen = new Set<string>();
  const merged: SrsReviewItemMeta[] = [];

  for (const item of [...taskItems, ...dueItems]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}
