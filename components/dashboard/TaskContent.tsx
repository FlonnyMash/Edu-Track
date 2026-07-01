"use client";

import { TermTrigger } from "@/components/ui/TermTrigger";
import { stripHiddenSessionMetadata } from "@/lib/ai/parse-session-response";
import { parseTaskContent, type TaskContentSegment } from "@/lib/tasks/parser";

/** Set to true only while verifying TermTrigger UI in isolation. */
const TERM_DEBUG_HARDCODE = false;

interface TaskContentProps {
  content: string | null | undefined;
  className?: string;
}

function renderSegment(segment: TaskContentSegment, index: number) {
  if (segment.type === "term") {
    const term = segment.value?.trim();
    if (!term) return null;

    return <TermTrigger key={`term-${index}-${term}`} term={term} />;
  }

  if (!segment.value) return null;

  return <span key={`text-${index}`}>{segment.value}</span>;
}

export function TaskContent({ content, className }: TaskContentProps) {
  const displayContent = stripHiddenSessionMetadata(content);
  const segments = parseTaskContent(displayContent);

  return (
    <div className={className}>
      {TERM_DEBUG_HARDCODE && (
        <div className="mb-3 rounded-lg border border-city-teal/20 bg-city-teal/5 px-3 py-2 text-sm text-white/70">
          <span className="mr-1 text-city-teal">[Debug]</span>
          Hard-coded test: use <TermTrigger term="genkouyoushi" /> for writing
          practice.
        </div>
      )}

      {segments.map((segment, index) => renderSegment(segment, index))}
    </div>
  );
}
