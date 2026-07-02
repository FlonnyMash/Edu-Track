"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { ParsedQuestSections } from "@/components/dashboard/TaskContent";
import type { ParsedQuest } from "@/lib/tasks/parser";
import type { QuestStructureMeta } from "@/lib/tasks/quest-structure";
import { cn } from "@/lib/utils";

interface SideQuestPanelProps {
  quest: ParsedQuest;
  questMeta?: QuestStructureMeta["side"] | null;
  className?: string;
}

const SIDE_TYPE_LABELS: Record<string, string> = {
  srs_review: "SRS Review Drill",
  syllabus_review: "Review Session",
  preparation: "Study Prep",
};

export function SideQuestPanel({
  quest,
  questMeta,
  className,
}: SideQuestPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const title = questMeta?.title || quest.title || "Side Quest";
  const typeLabel =
    SIDE_TYPE_LABELS[questMeta?.type ?? "preparation"] ?? "Bonus Objective";
  const hasContent = quest.sections.length > 0;

  if (!hasContent && !quest.title) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-visible rounded-xl border border-yellow-400/35 bg-yellow-400/5 p-4 shadow-[0_0_20px_rgba(250,204,21,0.08)]",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="pixel-label text-xs font-bold text-yellow-300">
            {typeLabel}
          </p>
          <h3 className="text-base font-bold leading-tight text-yellow-100 sm:text-lg">
            {title}
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
          <Star className="h-3 w-3" />
          Side
        </span>
      </div>

      {questMeta?.type === "srs_review" && (questMeta.srs_item_count ?? 0) > 0 ? (
        <a
          href="#srs-review-stack"
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-city-teal/40 bg-city-teal/10 px-3 py-1 text-xs font-semibold text-city-teal transition-colors hover:bg-city-teal/20"
        >
          {questMeta.srs_item_count} interactive SRS cards in Review Stack ↑
        </a>
      ) : null}

      {!expanded ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-yellow-100/80">
          {quest.sections[0]?.content
            ?.replace(/\[\s*TERM\s*:\s*([^\]]+?)\s*\]/gi, "$1")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .slice(0, 180) || "Complete this bonus objective after your main goal."}
          {(quest.sections[0]?.content?.length ?? 0) > 180 ? "…" : ""}
        </p>
      ) : (
        <div className="overflow-visible">
          <ParsedQuestSections quest={quest} />
        </div>
      )}

      {hasContent ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-300 transition-colors hover:text-yellow-200 active:scale-[0.98]"
        >
          {expanded ? (
            <>
              Collapse side quest
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              View side quest details
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
