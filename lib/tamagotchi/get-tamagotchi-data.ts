import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";
import { resolveActivePhase } from "@/lib/tamagotchi/resolve-phase";
import type {
  InventoryItem,
  ShopItem,
  TamagotchiPageData,
  TamagotchiPhase,
} from "@/lib/tamagotchi/types";

export async function getTamagotchiData(userId: string): Promise<TamagotchiPageData> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, is_admin, timezone")
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone ?? "UTC";
  const localToday = getLocalDateString(timezone);

  const [
    { data: stats },
    { data: shopItems },
    { data: inventory },
    { data: phases },
    { data: todayTask },
    { count: completedCount },
  ] = await Promise.all([
    supabase
      .from("gamification_stats")
      .select("current_streak")
      .eq("user_id", userId)
      .single(),
    supabase.from("shop_items").select("*").order("type").order("price"),
    supabase
      .from("user_inventory")
      .select("*, shop_items(*)")
      .eq("user_id", userId),
    supabase.from("tamagotchi_phases").select("*").order("phase_kind").order("day_number"),
    supabase
      .from("daily_tasks")
      .select("day_number, status")
      .eq("user_id", userId)
      .eq("task_date", localToday)
      .maybeSingle(),
    supabase
      .from("daily_tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  const currentStreak = stats?.current_streak ?? 0;
  const trackDay = todayTask?.day_number ?? (completedCount ?? 0) + 1;
  const todayTaskCompleted = todayTask?.status === "completed";

  const typedPhases = (phases ?? []) as TamagotchiPhase[];
  const activePhase = resolveActivePhase(
    typedPhases,
    trackDay,
    currentStreak,
    todayTaskCompleted
  );

  const typedInventory = (inventory ?? []) as InventoryItem[];
  const typedShopItems = (shopItems ?? []) as ShopItem[];
  const ownedItemIds = typedInventory.map((row) => row.item_id);
  const equippedItems = typedInventory
    .filter((row) => row.is_equipped)
    .map((row) => row.shop_items)
    .sort((a, b) => a.z_index - b.z_index);

  return {
    coins: profile?.coins ?? 0,
    isAdmin: profile?.is_admin ?? false,
    currentStreak,
    trackDay,
    phase: activePhase,
    equippedItems,
    shopItems: typedShopItems,
    ownedItemIds,
    inventory: typedInventory,
  };
}
