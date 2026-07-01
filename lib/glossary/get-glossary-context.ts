import { createClient } from "@/lib/supabase/server";
import { normalizeGlossaryTerm } from "@/lib/glossary/normalize-term";
import type { GlossaryEntry } from "@/lib/glossary/types";

const DEFAULT_GLOSSARY_LIMIT = 50;
const MAX_DEFINITION_LENGTH = 120;

function truncateDefinition(definition: string): string {
  const trimmed = definition.trim();
  if (trimmed.length <= MAX_DEFINITION_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_DEFINITION_LENGTH - 1).trimEnd()}…`;
}

/** Loads shared glossary rows for AI prompt context (capped, normalized, deduped). */
export async function getGlossaryContext(
  limit: number = DEFAULT_GLOSSARY_LIMIT
): Promise<GlossaryEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("glossary")
    .select("term, definition")
    .order("term", { ascending: true })
    .limit(limit);

  if (error) {
    console.warn("[getGlossaryContext] glossary read failed:", error.message);
    return [];
  }

  const seen = new Set<string>();
  const entries: GlossaryEntry[] = [];

  for (const row of data ?? []) {
    const term = normalizeGlossaryTerm(row.term);
    const definition = row.definition?.trim();
    if (!term || !definition || seen.has(term)) continue;

    seen.add(term);
    entries.push({
      term,
      definition: truncateDefinition(definition),
    });
  }

  return entries;
}
