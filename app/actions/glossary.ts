"use server";

import { getTermDefinition } from "@/lib/glossary/get-term-definition";
import { glossaryTermSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

export async function fetchTermDefinition(
  term: string
): Promise<{ definition: string }> {
  const parsed = glossaryTermSchema.safeParse({ term });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid term");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const definition = await getTermDefinition(parsed.data.term);

    if (!definition?.trim()) {
      throw new Error("Definition not found. Try again later.");
    }

    return { definition: definition.trim() };
  } catch (err) {
    console.error(
      `[fetchTermDefinition] failed for "${parsed.data.term}":`,
      err instanceof Error ? err.message : err
    );
    throw new Error("Definition not found. Try again later.");
  }
}
