import type { UserLearningItem } from "@/types/database";

export type LearningItemStatus = "pending" | "active" | "archived";

export function parseLearningItemMeaning(meaning: string): {
  romanji: string;
  gloss: string;
} {
  const separatorIndex = meaning.indexOf(" | ");
  if (separatorIndex === -1) {
    return { romanji: "", gloss: meaning.trim() };
  }

  return {
    romanji: meaning.slice(0, separatorIndex).trim(),
    gloss: meaning.slice(separatorIndex + 3).trim(),
  };
}

export function buildLearningItemMap(
  items: UserLearningItem[]
): Map<string, UserLearningItem> {
  return new Map(items.map((item) => [item.item_key, item]));
}

export function formatLearningItemDisplay(item: UserLearningItem): string {
  return item.meaning ? `${item.term} | ${item.meaning}` : item.term;
}
