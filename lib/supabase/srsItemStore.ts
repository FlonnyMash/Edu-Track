import { createClient } from "@/lib/supabase/server";

const DEFAULT_EASINESS_FACTOR = 2.5;

export async function ensureSrsItemForKey(
  userId: string,
  itemKey: string,
  asOfDate: string
): Promise<void> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("srs_items")
    .select("id")
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabase.from("srs_items").insert({
    user_id: userId,
    item_key: itemKey,
    easiness_factor: DEFAULT_EASINESS_FACTOR,
    interval: 1,
    repetitions: 0,
    next_review_date: asOfDate,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
