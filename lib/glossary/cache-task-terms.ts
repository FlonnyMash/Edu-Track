import { getTermDefinition } from "@/lib/glossary/get-term-definition";
import { normalizeGlossaryTerm } from "@/lib/glossary/normalize-term";

/** Ensures each tagged term has a cached glossary definition (best-effort). */
export async function cacheTaskGlossaryTerms(terms: string[]): Promise<void> {
  const unique = [
    ...new Set(terms.map(normalizeGlossaryTerm).filter(Boolean)),
  ];

  if (unique.length === 0) return;

  const results = await Promise.allSettled(
    unique.map((term) => getTermDefinition(term))
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.warn(
        `[cacheTaskGlossaryTerms] failed for "${unique[index]}":`,
        result.reason
      );
    }
  }
}
