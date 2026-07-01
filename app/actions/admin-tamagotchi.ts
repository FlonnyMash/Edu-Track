"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocalDevMode } from "@/lib/dev/is-local-dev";
import {
  shopItemFormSchema,
  tamagotchiPhaseFormSchema,
} from "@/lib/validations/schemas";

async function requireAdmin() {
  if (!isLocalDevMode()) {
    throw new Error("Admin tools are only available in local dev");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Forbidden");
  }

  return { supabase, user };
}

export async function upsertTamagotchiPhaseAction(formData: {
  id?: string;
  phaseKind: "starter" | "mood";
  dayNumber?: number;
  phaseName?: string;
  rotationOrder?: number;
  imageUrl: string;
  conditionDescription?: string;
}) {
  const parsed = tamagotchiPhaseFormSchema.safeParse(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid phase data";
    throw new Error(message);
  }

  const { supabase } = await requireAdmin();

  const phaseName =
    parsed.data.phaseKind === "starter"
      ? `day_${parsed.data.dayNumber}`
      : parsed.data.phaseName!.trim();

  const payload = {
    phase_name: phaseName,
    phase_kind: parsed.data.phaseKind,
    day_number: parsed.data.phaseKind === "starter" ? parsed.data.dayNumber! : null,
    rotation_order:
      parsed.data.phaseKind === "mood" ? (parsed.data.rotationOrder ?? 0) : 0,
    image_url: parsed.data.imageUrl,
    condition_description: parsed.data.conditionDescription ?? null,
  };

  if (parsed.data.phaseKind === "starter") {
    const { data: existing } = await supabase
      .from("tamagotchi_phases")
      .select("id")
      .eq("phase_kind", "starter")
      .eq("day_number", parsed.data.dayNumber!)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("tamagotchi_phases")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("tamagotchi_phases").insert(payload);
      if (error) throw new Error(error.message);
    }
  } else if (parsed.data.id) {
    const { error } = await supabase
      .from("tamagotchi_phases")
      .update(payload)
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("tamagotchi_phases").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/tamagotchi");
  revalidatePath("/tamagotchi");
}

export async function deleteTamagotchiPhaseAction(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("tamagotchi_phases")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tamagotchi");
  revalidatePath("/tamagotchi");
}

export async function upsertShopItemAction(formData: {
  id?: string;
  name: string;
  type: "food" | "head" | "accessory" | "background";
  price: number;
  imageUrl: string;
  zIndex: number;
}) {
  const parsed = shopItemFormSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error("Invalid shop item data");
  }

  const { supabase } = await requireAdmin();
  const payload = {
    name: parsed.data.name,
    type: parsed.data.type,
    price: parsed.data.price,
    image_url: parsed.data.imageUrl,
    z_index: parsed.data.zIndex,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("shop_items")
      .update(payload)
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("shop_items").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/tamagotchi");
  revalidatePath("/tamagotchi");
}

export async function deleteShopItemAction(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("shop_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tamagotchi");
  revalidatePath("/tamagotchi");
}
