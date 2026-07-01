"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { buyShopItemAction } from "@/app/actions/tamagotchi";
import { Button } from "@/components/ui/button";
import type { ShopItem } from "@/lib/tamagotchi/types";

interface TamagotchiShopProps {
  shopItems: ShopItem[];
  ownedItemIds: string[];
  coins: number;
  isAdmin?: boolean;
}

export function TamagotchiShop({
  shopItems,
  ownedItemIds,
  coins,
  isAdmin = false,
}: TamagotchiShopProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleBuy(item: ShopItem) {
    setPendingId(item.id);
    startTransition(async () => {
      try {
        await buyShopItemAction(item.id);
        toast.success(`Purchased ${item.name}!`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Purchase failed"
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--card)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Item Shop</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-city-orange/20 px-3 py-1 text-sm font-medium text-city-orange">
          <Coins className="h-4 w-4" />
          {isAdmin ? "∞" : coins}
        </div>
      </div>

      {shopItems.length === 0 ? (
        <p className="text-sm text-white/50">No items in the shop yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shopItems.map((item) => {
            const owned = ownedItemIds.includes(item.id);
            const canAfford = isAdmin || coins >= item.price;

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-white/10 bg-city-navy-light p-3 transition-all hover:-translate-y-0.5 hover:border-city-teal/40 hover:shadow-[0_0_20px_rgba(61,219,207,0.15)]"
              >
                <div className="relative mx-auto mb-2 h-16 w-16">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    unoptimized
                    className="object-contain transition-transform group-hover:scale-110"
                  />
                </div>
                <p className="truncate text-sm font-medium text-white">
                  {item.name}
                </p>
                <p className="pixel-label mb-2 text-[10px] text-city-muted">
                  {item.type}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-city-orange">{item.price} 🪙</span>
                  <Button
                    size="sm"
                    variant={owned ? "ghost" : "secondary"}
                    disabled={owned || !canAfford || pendingId === item.id}
                    onClick={() => handleBuy(item)}
                    className="h-8 px-2 text-xs"
                  >
                    {owned ? "Owned" : pendingId === item.id ? "..." : "Buy"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
