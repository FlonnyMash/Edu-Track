export type ShopItemType = "food" | "head" | "accessory" | "background";

export type TamagotchiPhase = {
  id: string;
  phase_name: string;
  phase_kind: "starter" | "mood";
  day_number: number | null;
  rotation_order: number;
  image_url: string;
  condition_description: string | null;
};

export type ShopItem = {
  id: string;
  name: string;
  type: ShopItemType;
  price: number;
  image_url: string;
  z_index: number;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  user_id: string;
  item_id: string;
  is_equipped: boolean;
  shop_items: ShopItem;
};

export type TamagotchiPageData = {
  coins: number;
  isAdmin: boolean;
  currentStreak: number;
  trackDay: number;
  phase: TamagotchiPhase | null;
  equippedItems: ShopItem[];
  shopItems: ShopItem[];
  ownedItemIds: string[];
  inventory: InventoryItem[];
};
