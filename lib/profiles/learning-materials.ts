/**
 * Parses `profiles.learning_material` into a list of material names.
 * Supports JSON arrays (new) and plain strings (legacy single selection).
 */
export function parseLearningMaterials(
  raw: string | null | undefined
): string[] {
  if (!raw?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [
        ...new Set(
          parsed
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        ),
      ];
    }
  } catch {
    // Legacy plain-text value — treat as a single material.
  }

  return [raw.trim()];
}

/** Serializes a material list for storage in `profiles.learning_material`. */
export function serializeLearningMaterials(materials: string[]): string | null {
  const unique = [
    ...new Set(materials.map((item) => item.trim()).filter(Boolean)),
  ];
  return unique.length > 0 ? JSON.stringify(unique) : null;
}
