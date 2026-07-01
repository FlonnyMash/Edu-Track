"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  buyShopItemSchema,
  grantSelfCoinsSchema,
  toggleEquipItemSchema,
} from "@/lib/validations/schemas";

export async function buyShopItemAction(itemId: string) {
  const parsed = buyShopItemSchema.safeParse({ itemId });
  if (!parsed.success) {
    throw new Error("Invalid item");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase.rpc("buy_shop_item", {
    p_item_id: parsed.data.itemId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tamagotchi");
  return { inventoryId: data };
}

export async function toggleEquipItemAction(
  inventoryId: string,
  equip: boolean
) {
  const parsed = toggleEquipItemSchema.safeParse({ inventoryId, equip });
  if (!parsed.success) {
    throw new Error("Invalid equip request");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.rpc("toggle_equip_item", {
    p_inventory_id: parsed.data.inventoryId,
    p_equip: parsed.data.equip,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tamagotchi");
}

export async function grantSelfCoinsAction(amount: number) {
  const parsed = grantSelfCoinsSchema.safeParse({ amount });
  if (!parsed.success) {
    throw new Error("Invalid amount");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase.rpc("grant_self_coins", {
    p_amount: parsed.data.amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tamagotchi");
  return { newBalance: data };
}
