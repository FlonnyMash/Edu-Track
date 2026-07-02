"use server";

import { revalidatePath } from "next/cache";
import {
  activateCatalogItem,
  activatePendingLearningItem,
  addCustomItem,
  getPendingLearningItems,
  toggleItemStatus,
} from "@/lib/supabase/learningItemsService";
import { createClient } from "@/lib/supabase/server";
import {
  activateCatalogItemSchema,
  addCustomItemSchema,
  activatePendingItemSchema,
  toggleLearningItemStatusSchema,
} from "@/lib/validations/schemas";
import { getLocalDateString } from "@/lib/utils";

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    localToday: getLocalDateString(profile?.timezone || "UTC"),
  };
}

function revalidateLearningPaths() {
  revalidatePath("/library");
  revalidatePath("/dashboard");
}

export async function addCustomItemAction(
  term: string,
  meaning: string,
  category: string
) {
  const parsed = addCustomItemSchema.safeParse({ term, meaning, category });

  if (!parsed.success) {
    throw new Error("Invalid custom item data");
  }

  const { userId, localToday } = await getAuthenticatedContext();
  const item = await addCustomItem(
    userId,
    parsed.data.term,
    parsed.data.meaning,
    parsed.data.category,
    localToday
  );

  revalidateLearningPaths();
  return { item };
}

export async function toggleLearningItemStatusAction(
  itemId: string,
  status: "active" | "archived"
) {
  const parsed = toggleLearningItemStatusSchema.safeParse({ itemId, status });

  if (!parsed.success) {
    throw new Error("Invalid status update");
  }

  const { userId } = await getAuthenticatedContext();
  const item = await toggleItemStatus(
    userId,
    parsed.data.itemId,
    parsed.data.status
  );

  revalidateLearningPaths();
  return { item };
}

export async function getPendingLearningItemsAction() {
  const { userId } = await getAuthenticatedContext();
  const items = await getPendingLearningItems(userId);
  return { items };
}

export async function activatePendingLearningItemAction(itemId: string) {
  const parsed = activatePendingItemSchema.safeParse({ itemId });

  if (!parsed.success) {
    throw new Error("Invalid pending item activation");
  }

  const { userId, localToday } = await getAuthenticatedContext();
  const item = await activatePendingLearningItem(
    userId,
    parsed.data.itemId,
    localToday
  );

  revalidateLearningPaths();
  return { item };
}

export async function activateCatalogItemAction(
  unitId: string,
  character: string,
  pronunciation: string,
  category: string
) {
  const parsed = activateCatalogItemSchema.safeParse({
    unitId,
    character,
    pronunciation,
    category,
  });

  if (!parsed.success) {
    throw new Error("Invalid catalog activation data");
  }

  const { userId, localToday } = await getAuthenticatedContext();
  const item = await activateCatalogItem(
    userId,
    {
      unitId: parsed.data.unitId,
      character: parsed.data.character,
      pronunciation: parsed.data.pronunciation,
      category: parsed.data.category,
    },
    localToday
  );

  revalidateLearningPaths();
  return { item };
}
