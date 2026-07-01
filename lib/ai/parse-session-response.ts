import { sessionMetadataSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

export type SessionMetadata = z.infer<typeof sessionMetadataSchema>;

export interface ParsedSession {
  title: string;
  humanReadable: string;
  metadata: SessionMetadata;
}

const TRAILING_JSON_PATTERN =
  /\n*\{[\s\S]*?"next_recommended_action"[\s\S]*?\}\s*$/;

/** Removes trailing Part 2 JSON metadata from session content (UI safety net). */
export function stripHiddenSessionMetadata(
  content: string | null | undefined
): string {
  if (content == null || content === "") return "";
  return content.replace(TRAILING_JSON_PATTERN, "").trimEnd();
}

function extractTitle(part1: string, dayNumber: number): string {
  const dayHeading = part1.match(/^#\s*(Day\s+\d+[:\s—–-].+)$/im);
  if (dayHeading?.[1]) {
    return dayHeading[1].trim();
  }

  const anyHeading = part1.match(/^#\s*(.+)$/m);
  if (anyHeading?.[1]) {
    return anyHeading[1].trim();
  }

  return `Day ${dayNumber}: Japanese Study Session`;
}

/** Removes the leading markdown H1 used as the session title. */
export function stripSessionHeading(content: string | null | undefined): string {
  if (content == null || content === "") return "";
  return content.replace(/^#\s*.+\n?/, "").trimStart();
}

/** Strips trailing JSON metadata and the duplicate title heading for display. */
export function prepareTaskInstructionsForDisplay(
  content: string | null | undefined
): string {
  return stripSessionHeading(stripHiddenSessionMetadata(content));
}

function parseTrailingJson(raw: string): {
  humanReadable: string;
  metadata: SessionMetadata;
} {
  const match = raw.match(TRAILING_JSON_PATTERN);
  if (!match) {
    throw new Error("No trailing JSON metadata block found in AI response");
  }

  const jsonText = match[0].trim();
  const humanReadable = raw.slice(0, match.index).trimEnd();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse trailing JSON metadata block");
  }

  const metadata = sessionMetadataSchema.parse(parsed);
  return { humanReadable, metadata };
}

/** Parses a two-part AI session response into title, human-readable content, and metadata. */
export function parseTwoPartSession(
  raw: string,
  dayNumber: number
): ParsedSession {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Empty AI response");
  }

  const { humanReadable, metadata } = parseTrailingJson(trimmed);
  const title = extractTitle(humanReadable, dayNumber);
  const body = stripSessionHeading(humanReadable);

  return { title, humanReadable: body, metadata };
}
