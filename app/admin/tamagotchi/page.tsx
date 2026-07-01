import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { isLocalDevMode } from "@/lib/dev/is-local-dev";
import { PhaseManager } from "@/components/admin/tamagotchi/PhaseManager";
import { ShopItemManager } from "@/components/admin/tamagotchi/ShopItemManager";

export default async function AdminTamagotchiPage() {
  if (!isLocalDevMode()) {
    notFound();
  }

  const admin = await requireAdminUser();

  if (!admin) {
    notFound();
  }

  const { supabase } = admin;

  const [{ data: phases }, { data: shopItems }] = await Promise.all([
    supabase
      .from("tamagotchi_phases")
      .select("*")
      .order("phase_kind")
      .order("day_number", { ascending: true, nullsFirst: false })
      .order("rotation_order"),
    supabase.from("shop_items").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="pixel-label text-city-teal">Admin</p>
          <h1 className="text-2xl font-bold text-white">Tamagotchi Manager</h1>
        </div>
        <Link
          href="/tamagotchi"
          className="text-sm text-city-magenta hover:underline"
        >
          View user page →
        </Link>
      </header>

      <PhaseManager phases={phases ?? []} />
      <ShopItemManager items={shopItems ?? []} />
    </div>
  );
}
