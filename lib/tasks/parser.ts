export type TaskContentSegment =
  | { type: "text"; value: string }
  | { type: "term"; value: string };

/**
 * Case-insensitive; tolerant of:
 * - whitespace inside brackets: [TERM: term ] / [ TERM : term ]
 * - a "TERM" or "TAG" style label
 */
const TERM_PATTERN = /\[\s*TERM\s*:\s*([^\]]+?)\s*\]/gi;

/** Unwrap markdown bold/italic/backticks that AI often wraps around TERM tags. */
function normalizeTermTags(content: string): string {
  return content
    .replace(/(\*\*|__|\*|_|`)+(\[\s*TERM\s*:[^\]]+?\])(\*\*|__|\*|_|`)+/gi, "$2");
}

/** Returns unique normalized terms from [TERM:...] tags in task copy. */
export function extractUniqueTaskTerms(
  content: string | null | undefined
): string[] {
  const segments = parseTaskContent(content);
  const seen = new Set<string>();

  for (const segment of segments) {
    if (segment.type !== "term") continue;
    const term = segment.value?.trim().toLowerCase();
    if (term) seen.add(term);
  }

  return [...seen];
}

/** Splits task copy into plain text and glossary term segments. */
export function parseTaskContent(content: string | null | undefined): TaskContentSegment[] {
  if (content == null || content === "") {
    console.log("[parseTaskContent] empty content — no segments");
    return [];
  }

  const normalized = normalizeTermTags(content);
  const segments: TaskContentSegment[] = [];
  let lastIndex = 0;
  let termCount = 0;

  for (const match of normalized.matchAll(TERM_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const term = match[1]?.trim();

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        value: normalized.slice(lastIndex, matchIndex),
      });
    }

    if (term) {
      segments.push({ type: "term", value: term });
      termCount += 1;
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < normalized.length) {
    segments.push({ type: "text", value: normalized.slice(lastIndex) });
  }

  const result =
    segments.length > 0 ? segments : [{ type: "text" as const, value: content }];

  console.log("[parseTaskContent] segments:", {
    termCount,
    segmentCount: result.length,
    hadNormalization: normalized !== content,
    segments: result.map((s) =>
      s.type === "term"
        ? { type: s.type, value: s.value }
        : { type: s.type, length: s.value.length }
    ),
  });

  return result;
}
