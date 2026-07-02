import type { SrsReviewItemMeta } from "@/lib/srs/types";

export function parseSrsReviewFromMetadata(
  metadata: unknown
): SrsReviewItemMeta[] {
  if (!metadata || typeof metadata !== "object") return [];

  const srsReview = (metadata as Record<string, unknown>).srs_review;
  if (!srsReview || typeof srsReview !== "object") return [];

  const items = (srsReview as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const id = record.id;
    const itemKey = record.item_key;
    const display = record.display;

    if (
      typeof id !== "string" ||
      typeof itemKey !== "string" ||
      typeof display !== "string"
    ) {
      return [];
    }

    return [{ id, item_key: itemKey, display }];
  });
}
