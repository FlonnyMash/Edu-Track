import { buildSrsItemKey } from "@/lib/srs/keys";
import { ensureSrsItemForKey } from "@/lib/supabase/srsItemStore";
import type { LearningItemStatus } from "@/lib/learning/item-utils";
import { createClient } from "@/lib/supabase/server";
import type { UserLearningItem } from "@/types/database";
import type { z } from "zod";
import type { suggestedLearningItemSchema } from "@/lib/validations/schemas";

export type { LearningItemStatus } from "@/lib/learning/item-utils";
export {
  buildLearningItemMap,
  formatLearningItemDisplay,
  parseLearningItemMeaning,
} from "@/lib/learning/item-utils";

export type SuggestedLearningItem = z.infer<typeof suggestedLearningItemSchema>;

const CUSTOM_ITEM_KEY_PREFIX = "custom:";
const SYNC_ITEM_KEY_PREFIX = "sync:";

function buildCustomItemKey(): string {
  return `${CUSTOM_ITEM_KEY_PREFIX}${crypto.randomUUID()}`;
}

function buildSyncItemKey(): string {
  return `${SYNC_ITEM_KEY_PREFIX}${crypto.randomUUID()}`;
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function formatSuggestedMeaning(romanji: string, meaning: string): string {
  const normalizedRomanji = romanji.trim();
  const normalizedMeaning = meaning.trim();
  return normalizedRomanji
    ? `${normalizedRomanji} | ${normalizedMeaning}`
    : normalizedMeaning;
}

export async function getUserLearningItems(
  userId: string
): Promise<UserLearningItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPendingLearningItems(
  userId: string
): Promise<UserLearningItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getActiveLearningItems(
  userId: string
): Promise<UserLearningItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getActiveLearningItemKeys(
  userId: string
): Promise<string[]> {
  const items = await getActiveLearningItems(userId);
  return items.map((item) => item.item_key);
}

export async function getActiveLearningItemCount(
  userId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("user_learning_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function persistSuggestedLearningItems(
  userId: string,
  suggestions: SuggestedLearningItem[],
  category: string
): Promise<UserLearningItem[]> {
  if (suggestions.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const normalizedCategory = assertNonEmpty(category, "Category");
  const created: UserLearningItem[] = [];

  for (const suggestion of suggestions) {
    const term = assertNonEmpty(suggestion.term, "Term");
    const meaning = formatSuggestedMeaning(suggestion.romanji, suggestion.meaning);

    const { data: existingByTerm } = await supabase
      .from("user_learning_items")
      .select("*")
      .eq("user_id", userId)
      .eq("term", term)
      .maybeSingle();

    if (existingByTerm) {
      continue;
    }

    const itemKey = buildSyncItemKey();

    const { data: learningItem, error: insertError } = await supabase
      .from("user_learning_items")
      .insert({
        user_id: userId,
        term,
        meaning,
        category: normalizedCategory,
        item_key: itemKey,
        status: "pending",
        source: "syllabus_sync",
      })
      .select("*")
      .single();

    if (insertError || !learningItem) {
      throw new Error(insertError?.message ?? "Failed to save suggested item");
    }

    created.push(learningItem);
  }

  return created;
}

export async function activatePendingLearningItem(
  userId: string,
  itemId: string,
  asOfDate: string
): Promise<UserLearningItem> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("Learning item not found");
  }

  if (existing.status !== "pending") {
    throw new Error("Only pending items can be activated from suggestions");
  }

  const { data: updated, error: updateError } = await supabase
    .from("user_learning_items")
    .update({ status: "active" })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to activate learning item");
  }

  await ensureSrsItemForKey(userId, updated.item_key, asOfDate);
  return updated;
}

export async function addCustomItem(
  userId: string,
  term: string,
  meaning: string,
  category: string,
  asOfDate: string
): Promise<UserLearningItem> {
  const supabase = await createClient();
  const normalizedTerm = assertNonEmpty(term, "Term");
  const normalizedMeaning = assertNonEmpty(meaning, "Meaning");
  const normalizedCategory = assertNonEmpty(category, "Category");
  const itemKey = buildCustomItemKey();

  const { data: learningItem, error: insertError } = await supabase
    .from("user_learning_items")
    .insert({
      user_id: userId,
      term: normalizedTerm,
      meaning: normalizedMeaning,
      category: normalizedCategory,
      item_key: itemKey,
      status: "active",
      source: "custom",
    })
    .select("*")
    .single();

  if (insertError || !learningItem) {
    throw new Error(insertError?.message ?? "Failed to add custom item");
  }

  await ensureSrsItemForKey(userId, itemKey, asOfDate);

  return learningItem;
}

export type ActivateCatalogItemInput = {
  unitId: string;
  character: string;
  pronunciation: string;
  category: string;
};

export async function activateCatalogItem(
  userId: string,
  input: ActivateCatalogItemInput,
  asOfDate: string
): Promise<UserLearningItem> {
  const supabase = await createClient();
  const character = assertNonEmpty(input.character, "Character");
  const category = assertNonEmpty(input.category, "Category");
  const unitId = assertNonEmpty(input.unitId, "Unit");
  const itemKey = buildSrsItemKey(unitId, character);

  const { data: existing } = await supabase
    .from("user_learning_items")
    .select("*")
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .maybeSingle();

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("user_learning_items")
      .update({ status: "active" })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Failed to activate catalog item");
    }

    await ensureSrsItemForKey(userId, itemKey, asOfDate);
    return updated;
  }

  const { data: learningItem, error: insertError } = await supabase
    .from("user_learning_items")
    .insert({
      user_id: userId,
      term: character,
      meaning: input.pronunciation.trim(),
      category,
      item_key: itemKey,
      status: "active",
      source: "catalog",
    })
    .select("*")
    .single();

  if (insertError || !learningItem) {
    throw new Error(insertError?.message ?? "Failed to activate catalog item");
  }

  await ensureSrsItemForKey(userId, itemKey, asOfDate);
  return learningItem;
}

export async function toggleItemStatus(
  userId: string,
  itemId: string,
  newStatus: LearningItemStatus
): Promise<UserLearningItem> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("user_learning_items")
    .update({ status: newStatus })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Learning item not found");
  }

  return updated;
}
