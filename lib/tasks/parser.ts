import { prepareTaskInstructionsForDisplay } from "@/lib/ai/parse-session-response";

export type TaskContentSegment =
  | { type: "text"; value: string }
  | { type: "term"; value: string };

export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "term"; value: string }
  | { type: "pronunciation"; character: string; pronunciation: string };

export type MarkdownBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "pronunciation"; character: string; pronunciation: string }
  | { type: "bold"; text: string; trailing?: string }
  | { type: "paragraph"; text: string };

/**
 * Case-insensitive; tolerant of:
 * - whitespace inside brackets: [TERM: term ] / [ TERM : term ]
 */
const TERM_PATTERN = /\[\s*TERM\s*:\s*([^\]]+?)\s*\]/gi;

const INLINE_PATTERN =
  /\[\s*TERM\s*:\s*([^\]]+?)\s*\]|\*\*([^*]+?)\*\*/gi;

/** Canonical session section order (matches AI prompt output structure). */
export const CANONICAL_TASK_SECTIONS = [
  "Theory",
  "Review",
  "Application",
  "Playful Learning",
  "Methodology",
] as const;

export type CanonicalTaskSection = (typeof CANONICAL_TASK_SECTIONS)[number];

export interface ParsedTaskSection {
  key: string;
  body: string;
}

export interface ParsedTaskSections {
  intro: string;
  sections: ParsedTaskSection[];
}

export interface SplitQuestsResult {
  mainQuestText: string;
  sideQuestText: string;
}

export interface ParsedQuestSection {
  title: string;
  content: string;
}

export interface ParsedQuest {
  title: string;
  sections: ParsedQuestSection[];
}

export interface ParsedDailyTask {
  mainQuest: ParsedQuest;
  sideQuest: ParsedQuest;
}

const EMPTY_QUEST: ParsedQuest = { title: "", sections: [] };

const MAIN_QUEST_HEADING_PATTERN = /^#\s*MAIN\s+QUEST\s*$/im;
const SIDE_QUEST_HEADING_PATTERN = /^#\s*SIDE\s+QUEST\s*$/im;

const SECTION_HEADER_PATTERN =
  /\*\*([^*]+?)\*\*(?:\s*\([^)]*\))?/gi;

const H1_LINE_PATTERN = /^#\s+(.+)$/;
const H2_LINE_PATTERN = /^##\s+(.+)$/;
const BOLD_LINE_PATTERN = /^\*\*(.+?)\*\*(.*)$/;
export const PRONUNCIATION_LINE_PATTERN =
  /^[-*•]?\s*(?:Character:\s*)?(.+?)\s*\|\s*(?:Pronunciation:\s*)?(.+?)\s*$/i;

const ROMANIZATION_PATTERN = /^[a-zA-ZāēīōūĀĒĪŌŪ\-'.]+$/;

function stripQuestHeading(content: string, pattern: RegExp): string {
  return content.replace(pattern, "").trim();
}

/**
 * Splits a single AI task body into Main Quest and Side Quest copy.
 * Falls back to the full text as Main Quest when the delimiter is missing so
 * old tasks remain readable.
 */
export function splitQuests(rawText: string | null | undefined): SplitQuestsResult {
  const raw = rawText?.trim() ?? "";
  if (!raw) {
    return { mainQuestText: "", sideQuestText: "" };
  }

  const sideMatch = raw.match(SIDE_QUEST_HEADING_PATTERN);
  if (!sideMatch || sideMatch.index == null) {
    return {
      mainQuestText: stripQuestHeading(raw, MAIN_QUEST_HEADING_PATTERN),
      sideQuestText: "",
    };
  }

  const mainRaw = raw.slice(0, sideMatch.index).trim();
  const sideRaw = raw.slice(sideMatch.index + sideMatch[0].length).trim();

  return {
    mainQuestText: stripQuestHeading(mainRaw, MAIN_QUEST_HEADING_PATTERN),
    sideQuestText: sideRaw,
  };
}

function extractQuestTitleAndBody(text: string): { title: string; body: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { title: "", body: "" };
  }

  const lines = trimmed.split("\n");
  let title = "";
  let bodyStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      title = h2Match[1].trim();
      bodyStartLine = i + 1;
      break;
    }
    if (line) {
      break;
    }
  }

  return {
    title,
    body: lines.slice(bodyStartLine).join("\n").trim(),
  };
}

function parseQuestBody(questText: string): ParsedQuest {
  const { title, body } = extractQuestTitleAndBody(questText);
  if (!body) {
    return { title, sections: [] };
  }

  const { intro, sections } = parseTaskSections(body);
  const parsedSections: ParsedQuestSection[] = [];

  if (intro) {
    parsedSections.push({ title: "Overview", content: intro });
  }

  for (const section of sections) {
    parsedSections.push({
      title: section.key,
      content: section.body,
    });
  }

  if (parsedSections.length === 0) {
    parsedSections.push({ title: "Overview", content: body });
  }

  return { title, sections: parsedSections };
}

/**
 * Parses AI daily task output into Main Quest and Side Quest structures.
 * Splits on `# MAIN QUEST` / `# SIDE QUEST`, extracts `##` titles and `**Section**` blocks.
 */
export function parseDailyTask(
  rawText: string | null | undefined
): ParsedDailyTask {
  const prepared = prepareTaskInstructionsForDisplay(rawText);
  const raw = prepared.trim();

  if (!raw) {
    return { mainQuest: { ...EMPTY_QUEST }, sideQuest: { ...EMPTY_QUEST } };
  }

  const sideMatch = raw.match(SIDE_QUEST_HEADING_PATTERN);

  let mainRaw = "";
  let sideRaw = "";

  if (sideMatch?.index != null) {
    mainRaw = raw.slice(0, sideMatch.index).trim();
    sideRaw = raw.slice(sideMatch.index + sideMatch[0].length).trim();
  } else {
    mainRaw = raw;
  }

  mainRaw = stripQuestHeading(mainRaw, MAIN_QUEST_HEADING_PATTERN);
  sideRaw = stripQuestHeading(sideRaw, SIDE_QUEST_HEADING_PATTERN);

  return {
    mainQuest: parseQuestBody(mainRaw),
    sideQuest: parseQuestBody(sideRaw),
  };
}


function canonicalizeSectionKey(raw: string): string {
  const trimmed = raw.trim();
  const known = CANONICAL_TASK_SECTIONS.find(
    (section) => section.toLowerCase() === trimmed.toLowerCase()
  );
  return known ?? trimmed;
}

function sectionSortIndex(key: string): number {
  const canonical = canonicalizeSectionKey(key);
  const index = CANONICAL_TASK_SECTIONS.findIndex(
    (section) => section.toLowerCase() === canonical.toLowerCase()
  );
  return index === -1 ? CANONICAL_TASK_SECTIONS.length + 1 : index;
}

/**
 * Splits task instructions into an intro blurb and dynamic **Section** blocks.
 * Recognizes canonical sections by name (case-insensitive); unknown headings
 * are preserved with their raw title.
 */
export function parseTaskSections(
  content: string | null | undefined
): ParsedTaskSections {
  if (content == null || content === "") {
    return { intro: "", sections: [] };
  }

  const matches = [...content.matchAll(SECTION_HEADER_PATTERN)];

  if (matches.length === 0) {
    return { intro: content.trim(), sections: [] };
  }

  const firstMatchIndex = matches[0].index ?? 0;
  const intro = content.slice(0, firstMatchIndex).trim();
  const sections: ParsedTaskSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const headerRaw = match[1]?.trim();
    if (!headerRaw) continue;

    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? content.length)
        : content.length;

    const body = content.slice(bodyStart, bodyEnd).trim();
    if (!body) continue;

    sections.push({
      key: canonicalizeSectionKey(headerRaw),
      body,
    });
  }

  sections.sort((a, b) => sectionSortIndex(a.key) - sectionSortIndex(b.key));

  return { intro, sections };
}

/** Unwrap markdown bold/italic/backticks that AI often wraps around TERM tags. */
function normalizeTermTags(content: string): string {
  return content
    .replace(/(\*\*|__|\*|_|`)+(\[\s*TERM\s*:[^\]]+?\])(\*\*|__|\*|_|`)+/gi, "$2");
}

/** Parses inline text, **bold**, and [TERM:...] segments within a single paragraph. */
export function parseInlineSegments(text: string): InlineSegment[] {
  if (!text) return [];

  const normalized = normalizeTermTags(text);
  const segments: InlineSegment[] = [];
  let lastIndex = 0;

  for (const match of normalized.matchAll(INLINE_PATTERN)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        value: normalized.slice(lastIndex, matchIndex),
      });
    }

    const term = match[1]?.trim();
    const bold = match[2]?.trim();

    if (term) {
      segments.push({ type: "term", value: term });
    } else if (bold) {
      segments.push({ type: "bold", value: bold });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < normalized.length) {
    segments.push({ type: "text", value: normalized.slice(lastIndex) });
  }

  return segments.length > 0
    ? segments
    : [{ type: "text", value: normalized }];
}

/** Parses a single line for `character | pronunciation` format. */
export function parsePronunciationLine(
  line: string
): { character: string; pronunciation: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(PRONUNCIATION_LINE_PATTERN);
  if (!match) return null;

  const character = match[1]?.trim() ?? "";
  const pronunciation = match[2]?.trim() ?? "";

  if (!character || !pronunciation) return null;
  if (!ROMANIZATION_PATTERN.test(pronunciation)) return null;

  return { character, pronunciation };
}

/** Classifies task copy lines into markdown blocks for structured rendering. */
export function parseMarkdownBlocks(content: string | null | undefined): MarkdownBlock[] {
  if (content == null || content === "") return [];

  const blocks: MarkdownBlock[] = [];

  for (const rawLine of content.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const h1Match = trimmed.match(H1_LINE_PATTERN);
    if (h1Match) {
      blocks.push({ type: "h1", text: h1Match[1].trim() });
      continue;
    }

    const h2Match = trimmed.match(H2_LINE_PATTERN);
    if (h2Match) {
      blocks.push({ type: "h2", text: h2Match[1].trim() });
      continue;
    }

    const pronunciation = parsePronunciationLine(trimmed);
    if (pronunciation) {
      blocks.push({ type: "pronunciation", ...pronunciation });
      continue;
    }

    const boldMatch = trimmed.match(BOLD_LINE_PATTERN);
    if (boldMatch) {
      const trailing = boldMatch[2]?.trim();
      blocks.push({
        type: "bold",
        text: boldMatch[1].trim(),
        ...(trailing ? { trailing } : {}),
      });
      continue;
    }

    blocks.push({ type: "paragraph", text: trimmed });
  }

  return blocks;
}

/** Splits task copy into paragraphs (double newline), each with inline segments. */
export function parseTaskParagraphs(
  content: string | null | undefined
): InlineSegment[][] {
  if (content == null || content === "") {
    return [];
  }

  const normalized = normalizeTermTags(content.trim());
  const paragraphs = normalized
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  return paragraphs.map((paragraph) => parseInlineSegments(paragraph));
}

/** Returns unique normalized terms from [TERM:...] tags in task copy. */
export function extractUniqueTaskTerms(
  content: string | null | undefined
): string[] {
  if (content == null || content === "") return [];

  const seen = new Set<string>();

  for (const paragraph of parseTaskParagraphs(content)) {
    for (const segment of paragraph) {
      if (segment.type !== "term") continue;
      const term = segment.value?.trim().toLowerCase();
      if (term) seen.add(term);
    }
  }

  return [...seen];
}

/** Splits task copy into plain text and glossary term segments (flat, legacy). */
export function parseTaskContent(
  content: string | null | undefined
): TaskContentSegment[] {
  if (content == null || content === "") {
    return [];
  }

  const segments: TaskContentSegment[] = [];

  for (const paragraph of parseTaskParagraphs(content)) {
    for (const segment of paragraph) {
      if (segment.type === "term") {
        segments.push({ type: "term", value: segment.value });
      } else if (segment.type === "bold") {
        segments.push({ type: "text", value: segment.value });
      } else if (segment.type === "text" && segment.value) {
        segments.push({ type: "text", value: segment.value });
      }
    }
  }

  return segments.length > 0 ? segments : [{ type: "text", value: content }];
}
