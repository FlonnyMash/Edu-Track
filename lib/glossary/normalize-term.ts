/** Normalizes glossary keys for consistent cache lookups. */
export function normalizeGlossaryTerm(term: string): string {
  return term.trim().toLowerCase();
}
