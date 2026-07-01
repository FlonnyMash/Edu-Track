"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleEquipItemAction } from "@/app/actions/tamagotchi";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/tamagotchi/types";

interface TamagotchiInventoryProps {
  inventory: InventoryItem[];
}

export function TamagotchiInventory({ inventory }: TamagotchiInventoryProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(row: InventoryItem) {
    if (row.shop_items.type === "food") return;

    const nextEquip = !row.is_equipped;
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await toggleEquipItemAction(row.id, nextEquip);
        toast.success(
          nextEquip
            ? `Equipped ${row.shop_items.name}`
            : `Unequipped ${row.shop_items.name}`
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update equip state"
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--card)] p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">Inventory</h2>

      {inventory.length === 0 ? (
        <p className="text-sm text-white/50">
          No items yet — visit the shop!
        </p>
      ) : (
        <div className="space-y-2">
          {inventory.map((row) => {
            const isFood = row.shop_items.type === "food";
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-city-navy-light p-3"
              >
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src={row.shop_items.image_url}
                    alt={row.shop_items.name}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {row.shop_items.name}
                  </p>
                  <p className="pixel-label text-[10px] text-city-muted">
                    {row.shop_items.type}
                    {row.is_equipped ? " · equipped" : ""}
                  </p>
                </div>
                {!isFood && (
                  <Button
                    size="sm"
                    variant={row.is_equipped ? "outline" : "default"}
                    disabled={pendingId === row.id}
                    onClick={() => handleToggle(row)}
                    className="shrink-0"
                  >
                    {pendingId === row.id
                      ? "..."
                      : row.is_equipped
                        ? "Unequip"
                        : "Equip"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
