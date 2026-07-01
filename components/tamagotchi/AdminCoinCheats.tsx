"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { grantSelfCoinsAction } from "@/app/actions/tamagotchi";
import { Button } from "@/components/ui/button";
import { isLocalDevMode } from "@/lib/dev/is-local-dev";

interface AdminCoinCheatsProps {
  coins: number;
}

const GRANT_AMOUNTS = [100, 500, 1000, 5000] as const;

export function AdminCoinCheats({ coins }: AdminCoinCheatsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (isLocalDevMode()) {
    return null;
  }

  function grant(amount: number) {
    startTransition(async () => {
      try {
        const result = await grantSelfCoinsAction(amount);
        toast.success(`+${amount} coins (balance: ${result.newBalance})`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not grant coins"
        );
      }
    });
  }

  return (
    <section className="rounded-xl border border-city-magenta/30 bg-city-magenta/10 p-4">
      <p className="pixel-label mb-1 text-city-magenta">Admin</p>
      <p className="mb-3 text-sm text-white/70">
        Unlimited shop purchases · balance {coins} (display only)
      </p>
      <div className="flex flex-wrap gap-2">
        {GRANT_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => grant(amount)}
          >
            +{amount} 🪙
          </Button>
        ))}
      </div>
    </section>
  );
}
