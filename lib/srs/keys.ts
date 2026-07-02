export function buildSrsItemKey(unitId: string, character: string): string {
  return `${unitId}:${character}`;
}

export function parseSrsItemKey(itemKey: string): {
  unitId: string;
  character: string;
} | null {
  const separatorIndex = itemKey.indexOf(":");
  if (separatorIndex <= 0) return null;

  const unitId = itemKey.slice(0, separatorIndex);
  const character = itemKey.slice(separatorIndex + 1);
  if (!unitId || !character) return null;

  return { unitId, character };
}
