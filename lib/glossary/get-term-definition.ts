import { generateGlossaryDefinition } from "@/lib/ai/glossary-definition";
import { normalizeGlossaryTerm } from "@/lib/glossary/normalize-term";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getTermDefinition(term: string): Promise<string> {
  const normalized = normalizeGlossaryTerm(term);
  if (!normalized) {
    throw new Error("Term is required");
  }

  const supabase = await createClient();

  const { data: cached, error: cacheError } = await supabase
    .from("glossary")
    .select("definition")
    .eq("term", normalized)
    .maybeSingle();

  if (cacheError) {
    console.warn("[getTermDefinition] glossary cache read failed:", cacheError.message);
  }

  if (cached?.definition?.trim()) {
    return cached.definition.trim();
  }

  const definition = await generateGlossaryDefinition(term);
  const trimmed = definition?.trim();

  if (!trimmed) {
    throw new Error("Definition not found. Try again later.");
  }

  try {
    const admin = createAdminClient();
    const { error: writeError } = await admin
      .from("glossary")
      .upsert(
        { term: normalized, definition: trimmed },
        { onConflict: "term" }
      );

    if (writeError) {
      console.error(
        "[getTermDefinition] glossary cache write failed:",
        writeError.message,
        writeError.details ?? ""
      );
    } else {
      console.log(`[getTermDefinition] cached definition for "${normalized}"`);
    }
  } catch (cacheWriteError) {
    console.error("[getTermDefinition] glossary admin client error:", cacheWriteError);
  }

  return trimmed;
}
