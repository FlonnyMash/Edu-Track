import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTamagotchiData } from "@/lib/tamagotchi/get-tamagotchi-data";
import { TamagotchiDisplay } from "@/components/tamagotchi/TamagotchiDisplay";
import { TamagotchiShop } from "@/components/tamagotchi/TamagotchiShop";
import { TamagotchiInventory } from "@/components/tamagotchi/TamagotchiInventory";
import { AdminCoinCheats } from "@/components/tamagotchi/AdminCoinCheats";

export default async function TamagotchiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getTamagotchiData(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-2xl font-bold text-transparent">
          Tamagotchi
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Care for your companion, earn coins, and customize their look.
        </p>
      </header>

      <TamagotchiDisplay
        phase={data.phase}
        equippedItems={data.equippedItems}
        currentStreak={data.currentStreak}
        trackDay={data.trackDay}
      />

      {data.isAdmin && <AdminCoinCheats coins={data.coins} />}

      <TamagotchiShop
        shopItems={data.shopItems}
        ownedItemIds={data.ownedItemIds}
        coins={data.coins}
        isAdmin={data.isAdmin}
      />

      <TamagotchiInventory inventory={data.inventory} />
    </div>
  );
}
