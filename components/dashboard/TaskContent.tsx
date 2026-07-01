"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  PenLine,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PronunciationTrigger } from "@/components/dashboard/PronunciationTrigger";
import { TermTrigger } from "@/components/ui/TermTrigger";
import { prepareTaskInstructionsForDisplay } from "@/lib/ai/parse-session-response";
import {
  parseInlineSegments,
  parseMarkdownBlocks,
  parseTaskSections,
  type InlineSegment,
  type MarkdownBlock,
  type ParsedQuest,
  type ParsedQuestSection,
  type ParsedTaskSection,
} from "@/lib/tasks/parser";
import { cn } from "@/lib/utils";

interface TaskContentProps {
  content: string | null | undefined;
  className?: string;
  /** Skip metadata/heading strip when parent already prepared the string. */
  prepared?: boolean;
}

interface TaskSectionsProps {
  content: string | null | undefined;
  className?: string;
  prepared?: boolean;
}

interface ParsedQuestSectionsProps {
  quest: ParsedQuest;
  className?: string;
}

interface SectionStyle {
  icon: LucideIcon;
  accent: string;
  labelClass: string;
}

const PROSE_BASE =
  "space-y-4 text-sm leading-relaxed text-slate-200 sm:text-base";

const BOLD_CLASS =
  "font-bold text-city-magenta drop-shadow-[0_0_10px_rgba(255,77,141,0.35)]";

const SECTION_STYLES: Record<string, SectionStyle> = {
  Theory: {
    icon: Brain,
    accent: "border-l-city-teal",
    labelClass: "text-city-teal",
  },
  Review: {
    icon: RotateCcw,
    accent: "border-l-city-orange/80",
    labelClass: "text-city-orange",
  },
  Application: {
    icon: PenLine,
    accent: "border-l-city-magenta",
    labelClass: "text-city-magenta",
  },
  "Playful Learning": {
    icon: Sparkles,
    accent: "border-l-city-orange",
    labelClass: "text-city-orange",
  },
  Methodology: {
    icon: BookOpen,
    accent: "border-l-city-teal/60",
    labelClass: "text-city-teal/80",
  },
  Overview: {
    icon: BookOpen,
    accent: "border-l-white/25",
    labelClass: "text-slate-200",
  },
};

const DEFAULT_SECTION_STYLE: SectionStyle = {
  icon: BookOpen,
  accent: "border-l-white/20",
  labelClass: "text-slate-300",
};

const MARKDOWN_H1_CLASS =
  "mb-4 text-3xl font-bold text-neon-cyan drop-shadow-[0_0_12px_rgba(61,219,207,0.45)]";
const MARKDOWN_H2_CLASS =
  "mb-2 text-xl font-semibold text-neon-yellow drop-shadow-[0_0_8px_rgba(253,224,71,0.35)]";
const MARKDOWN_BOLD_LINE_CLASS = "mt-4 block text-white";
const MARKDOWN_PARAGRAPH_CLASS = "text-slate-300";

function renderLineContent(text: string, keyPrefix: string) {
  return parseInlineSegments(text).map((segment, segmentIndex) =>
    renderInlineSegment(segment, `${keyPrefix}-${segmentIndex}`)
  );
}

function renderInlineSegment(segment: InlineSegment, key: string) {
  if (segment.type === "term") {
    const term = segment.value?.trim();
    if (!term) return null;

    return <TermTrigger key={`term-${key}-${term}`} term={term} />;
  }

  if (segment.type === "pronunciation") {
    return (
      <PronunciationTrigger
        key={`pron-${key}-${segment.character}`}
        character={segment.character}
        pronunciation={segment.pronunciation}
        className="mx-0.5 inline-flex align-middle"
      />
    );
  }

  if (segment.type === "bold") {
    if (!segment.value) return null;

    return (
      <strong key={`bold-${key}`} className={BOLD_CLASS}>
        {segment.value}
      </strong>
    );
  }

  if (!segment.value) return null;

  return <span key={`text-${key}`}>{segment.value}</span>;
}

function PronunciationGrid({
  blocks,
  keyPrefix,
}: {
  blocks: Extract<MarkdownBlock, { type: "pronunciation" }>[];
  keyPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {blocks.map((block, index) => (
        <PronunciationTrigger
          key={`${keyPrefix}-${block.character}-${index}`}
          character={block.character}
          pronunciation={block.pronunciation}
        />
      ))}
    </div>
  );
}

function renderMarkdownBlock(block: MarkdownBlock, index: number) {
  switch (block.type) {
    case "h1":
      return (
        <h1 key={`h1-${index}`} className={MARKDOWN_H1_CLASS}>
          {renderLineContent(block.text, `h1-${index}`)}
        </h1>
      );
    case "h2":
      return (
        <h2 key={`h2-${index}`} className={MARKDOWN_H2_CLASS}>
          {renderLineContent(block.text, `h2-${index}`)}
        </h2>
      );
    case "bold":
      return (
        <strong key={`bold-${index}`} className={MARKDOWN_BOLD_LINE_CLASS}>
          {renderLineContent(block.text, `bold-${index}`)}
          {block.trailing ? (
            <span className="ml-1 font-normal text-slate-300">
              {renderLineContent(block.trailing, `bold-tail-${index}`)}
            </span>
          ) : null}
        </strong>
      );
    case "paragraph":
      return (
        <p key={`p-${index}`} className={MARKDOWN_PARAGRAPH_CLASS}>
          {renderLineContent(block.text, `p-${index}`)}
        </p>
      );
    default:
      return null;
  }
}

function MarkdownTaskBody({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);
  const rendered: ReactNode[] = [];
  let pronunciationRun: Extract<MarkdownBlock, { type: "pronunciation" }>[] =
    [];

  function flushPronunciationRun(runIndex: number) {
    if (pronunciationRun.length === 0) return;
    rendered.push(
      <PronunciationGrid
        key={`pron-grid-${runIndex}`}
        blocks={pronunciationRun}
        keyPrefix={`pron-grid-${runIndex}`}
      />
    );
    pronunciationRun = [];
  }

  blocks.forEach((block, index) => {
    if (block.type === "pronunciation") {
      pronunciationRun.push(block);
      return;
    }

    flushPronunciationRun(index);
    const node = renderMarkdownBlock(block, index);
    if (node) rendered.push(node);
  });

  flushPronunciationRun(blocks.length);

  if (rendered.length === 0) {
    return null;
  }

  return <>{rendered}</>;
}

function getSectionStyle(key: string): SectionStyle {
  return SECTION_STYLES[key] ?? DEFAULT_SECTION_STYLE;
}

export function TaskContent({
  content,
  className,
  prepared = false,
}: TaskContentProps) {
  const displayContent = prepared
    ? (content ?? "")
    : prepareTaskInstructionsForDisplay(content);

  if (!displayContent.trim()) {
    return null;
  }

  return (
    <div className={cn(PROSE_BASE, className)}>
      <MarkdownTaskBody content={displayContent} />
    </div>
  );
}

function QuestSectionBlock({ section }: { section: ParsedQuestSection }) {
  const style = getSectionStyle(section.title);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/8 bg-city-navy/40 p-4",
        "border-l-4",
        style.accent
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", style.labelClass)} />
        <span className={cn("pixel-label font-bold", style.labelClass)}>
          {section.title}
        </span>
      </div>
      <TaskContent content={section.content} prepared className="space-y-4" />
    </div>
  );
}

export function ParsedQuestSections({
  quest,
  className,
}: ParsedQuestSectionsProps) {
  if (quest.sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {quest.sections.map((section) => (
        <QuestSectionBlock
          key={`${section.title}-${section.content.slice(0, 24)}`}
          section={section}
        />
      ))}
    </div>
  );
}

function TaskSectionBlock({ section }: { section: ParsedTaskSection }) {
  const style = getSectionStyle(section.key);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/8 bg-city-navy/40 p-4",
        "border-l-4",
        style.accent
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", style.labelClass)} />
        <span className={cn("pixel-label font-bold", style.labelClass)}>
          {section.key}
        </span>
      </div>
      <TaskContent content={section.body} prepared className="space-y-4" />
    </div>
  );
}

export function TaskSections({
  content,
  className,
  prepared = false,
}: TaskSectionsProps) {
  const displayContent = prepared
    ? (content ?? "")
    : prepareTaskInstructionsForDisplay(content);
  const { intro, sections } = parseTaskSections(displayContent);

  if (!intro && sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {intro && (
        <TaskContent content={intro} prepared className="text-slate-300/90" />
      )}

      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map((section) => (
            <TaskSectionBlock key={section.key} section={section} />
          ))}
        </div>
      ) : (
        <TaskContent content={displayContent} prepared />
      )}
    </div>
  );
}
