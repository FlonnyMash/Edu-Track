import { applyLeitnerStep } from "@/lib/srs/leitner";
import { parseSrsItemKey } from "@/lib/srs/keys";
import type { SrsReviewItemMeta } from "@/lib/srs/types";
import {
  JAPANESE_SYLLABUS_CHAIN,
  type SyllabusUnit,
} from "@/lib/ai/syllabus";
import { createClient } from "@/lib/supabase/server";
import type { SrsItem, UserLearningItem } from "@/types/database";

export type { SrsReviewItemMeta } from "@/lib/srs/types";
export { buildSrsItemKey, parseSrsItemKey } from "@/lib/srs/keys";
export { ensureSrsItemForKey } from "@/lib/supabase/srsItemStore";

const DUE_ITEM_LIMIT = 5;
const REVIEW_SESSION_LIMIT = 20;
const CUSTOM_ITEM_KEY_PREFIX = "custom:";

function findSyllabusUnit(unitId: string): SyllabusUnit | undefined {
  return JAPANESE_SYLLABUS_CHAIN.find((unit) => unit.id === unitId);
}

function isSyncItemKey(itemKey: string): boolean {
  return itemKey.startsWith("sync:") || itemKey.startsWith(CUSTOM_ITEM_KEY_PREFIX);
}

/** Format item_key for prompts and UI, using learning items when available. */
export function formatSrsItemKey(
  itemKey: string,
  learningItemMap?: Map<string, UserLearningItem>
): string {
  const learningItem = learningItemMap?.get(itemKey);
  if (learningItem) {
    return learningItem.meaning
      ? `${learningItem.term} | ${learningItem.meaning}`
      : learningItem.term;
  }

  if (isSyncItemKey(itemKey)) {
    return itemKey.includes(":") ? itemKey.split(":").slice(1).join(":") : itemKey;
  }

  const parsed = parseSrsItemKey(itemKey);
  if (!parsed) return itemKey;

  const unit = findSyllabusUnit(parsed.unitId);
  if (!unit) return parsed.character;

  const index = unit.items.indexOf(parsed.character);
  const pronunciation =
    index >= 0 ? unit.pronunciations?.[index] ?? "" : "";

  return pronunciation
    ? `${parsed.character} | ${pronunciation}`
    : parsed.character;
}

async function getActiveItemKeys(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: activeLearningItems, error: learningError } = await supabase
    .from("user_learning_items")
    .select("item_key")
    .eq("user_id", userId)
    .eq("status", "active");

  if (learningError) {
    throw new Error(learningError.message);
  }

  return (activeLearningItems ?? []).map((item) => item.item_key);
}

async function fetchDueSrsItems(
  userId: string,
  asOfDate: string,
  limit: number
): Promise<{ items: SrsItem[]; totalCount: number }> {
  const activeItemKeys = await getActiveItemKeys(userId);

  if (activeItemKeys.length === 0) {
    return { items: [], totalCount: 0 };
  }

  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("srs_items")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .in("item_key", activeItemKeys)
    .not("next_review_date", "is", null)
    .lte("next_review_date", asOfDate)
    .order("next_review_date", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as SrsItem[],
    totalCount: count ?? data?.length ?? 0,
  };
}

export async function getDueSrsItems(
  userId: string,
  asOfDate: string
): Promise<SrsItem[]> {
  const { items } = await fetchDueSrsItems(userId, asOfDate, DUE_ITEM_LIMIT);
  return items;
}

export async function getDueSrsStack(
  userId: string,
  asOfDate: string,
  limit: number = REVIEW_SESSION_LIMIT
): Promise<{ items: SrsReviewItemMeta[]; totalCount: number }> {
  const { items: srsItems, totalCount } = await fetchDueSrsItems(
    userId,
    asOfDate,
    limit
  );

  if (srsItems.length === 0) {
    return { items: [], totalCount: 0 };
  }

  const supabase = await createClient();
  const { data: learningItems } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .in(
      "item_key",
      srsItems.map((item) => item.item_key)
    );

  const learningItemMap = new Map(
    (learningItems ?? []).map((item) => [item.item_key, item as UserLearningItem])
  );

  return {
    items: toSrsReviewMeta(srsItems, learningItemMap),
    totalCount,
  };
}

export async function updateSrsItemAfterReview(
  userId: string,
  itemId: string,
  isCorrect: boolean,
  asOfDate: string
): Promise<SrsItem> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("srs_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("SRS item not found");
  }

  const update = applyLeitnerStep(
    isCorrect,
    existing.repetitions,
    asOfDate
  );

  const { data: updated, error: updateError } = await supabase
    .from("srs_items")
    .update({
      repetitions: update.repetitions,
      interval: update.interval,
      next_review_date: update.next_review_date,
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update SRS item");
  }

  return updated;
}

export function toSrsReviewMeta(
  items: SrsItem[],
  learningItemMap?: Map<string, UserLearningItem>
): SrsReviewItemMeta[] {
  return items.map((item) => ({
    id: item.id,
    item_key: item.item_key,
    display: formatSrsItemKey(item.item_key, learningItemMap),
  }));
}
