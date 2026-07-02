"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ParsedQuestSections } from "@/components/dashboard/TaskContent";
import type { ParsedQuest } from "@/lib/tasks/parser";
import { cn } from "@/lib/utils";

const PREVIEW_CHAR_LIMIT = 220;

function buildPreviewText(quest: ParsedQuest): string {
  const firstSection = quest.sections[0];
  if (!firstSection?.content) {
    return quest.title;
  }

  const plain = firstSection.content
    .replace(/\[\s*TERM\s*:\s*([^\]]+?)\s*\]/gi, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= PREVIEW_CHAR_LIMIT) {
    return plain;
  }

  return `${plain.slice(0, PREVIEW_CHAR_LIMIT).trim()}…`;
}

interface MissionSummaryProps {
  quest: ParsedQuest;
  goal?: string;
  className?: string;
}

export function MissionSummary({ quest, goal, className }: MissionSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = useMemo(() => buildPreviewText(quest), [quest]);
  const hasMoreContent =
    quest.sections.length > 1 ||
    (quest.sections[0]?.content?.length ?? 0) > PREVIEW_CHAR_LIMIT;

  return (
    <div className={cn("space-y-3", className)}>
      {goal ? (
        <p className="text-sm font-medium leading-relaxed text-city-teal/90">
          {goal}
        </p>
      ) : null}

      {!expanded ? (
        <p className="text-sm leading-relaxed text-white/80">{preview}</p>
      ) : (
        <div className="overflow-visible">
          <ParsedQuestSections quest={quest} />
        </div>
      )}

      {hasMoreContent ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-city-magenta transition-colors hover:text-city-orange active:scale-[0.98]"
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Read full mission
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
