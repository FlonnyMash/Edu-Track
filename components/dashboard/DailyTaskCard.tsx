"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prepareTaskInstructionsForDisplay } from "@/lib/ai/parse-session-response";
import { cn } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

const MOCK_DAY_1: Pick<
  DailyTask,
  "title" | "instructions" | "estimated_minutes" | "status"
> = {
  title: "Day 1: Hiragana Foundations (あ–の)",
  instructions:
    "Based on our progress, today we are focusing on [TERM:hiragana] recognition, moving us closer to completing the script.\n\n" +
    "**Theory** (max 10 min)\nOpen Genki I pp. 20–25. Learn あ, い, う, え, お, か, き, く, け, こ. Read each aloud twice.\n\n" +
    "**Application**\nOn [TERM:genkouyoushi], write each character 5× with correct stroke order (mandatory handwriting). Then Genki I Workbook p. 11, exercises 1–3 only.\n\n" +
    "**Playful Learning**\nWatch a hiragana stroke-order video for あ–こ. Pause after each character and mimic the motion on paper — sync audio with your hand.\n\n" +
    "**Methodology**\nTextbook first builds sound–shape links; Workbook p. 11+ reinforces recall; the video adds motor memory without rushing ahead.",
  estimated_minutes: 28,
  status: "pending",
};

const TERM_PATTERN = /\[\s*TERM\s*:\s*([^\]]+?)\s*\]/gi;

const SECTION_HEADERS = [
  "Theory",
  "Application",
  "Playful Learning",
  "Methodology",
] as const;

type SectionKey = (typeof SECTION_HEADERS)[number];

type TermSegment =
  | { type: "text"; value: string }
  | { type: "term"; value: string };

interface TaskSection {
  key: SectionKey;
  body: string;
}

interface ParsedTaskContent {
  intro: string;
  sections: TaskSection[];
}

interface DailyTaskCardProps {
  task?: DailyTask;
  onComplete?: () => void;
}

const SECTION_CONFIG: Record<
  SectionKey,
  {
    icon: typeof Brain;
    accent: string;
    labelClass: string;
  }
> = {
  Theory: {
    icon: Brain,
    accent: "border-l-city-teal",
    labelClass: "text-city-teal",
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
};

function parseTermTags(text: string): TermSegment[] {
  const segments: TermSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TERM_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const term = match[1]?.trim();

    if (matchIndex > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }

    if (term) {
      segments.push({ type: "term", value: term });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function renderTextWithTerms(text: string) {
  return parseTermTags(text).map((segment, index) => {
    if (segment.type === "term") {
      return (
        <mark
          key={`term-${index}-${segment.value}`}
          title={`Tap to learn: ${segment.value}`}
          className={cn(
            "inline cursor-help rounded-md border border-city-teal/30 bg-city-teal/15 px-1.5 py-0.5",
            "font-medium text-city-teal not-italic",
            "transition-all duration-200",
            "hover:-translate-y-px hover:shadow-[0_0_12px_rgba(61,219,207,0.4)]"
          )}
        >
          {segment.value}
        </mark>
      );
    }

    if (!segment.value) return null;

    return <span key={`text-${index}`}>{segment.value}</span>;
  });
}

function splitIntoSections(instructions: string): ParsedTaskContent {
  const headerPattern = new RegExp(
    `\\*\\*(${SECTION_HEADERS.map((h) => h.replace(/ /g, " ")).join("|")})\\*\\*(?:\\s*\\([^)]*\\))?`,
    "gi"
  );

  const sections: TaskSection[] = [];
  const matches = [...instructions.matchAll(headerPattern)];

  if (matches.length === 0) {
    return { intro: instructions.trim(), sections: [] };
  }

  const firstMatchIndex = matches[0].index ?? 0;
  const intro = instructions.slice(0, firstMatchIndex).trim();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const headerRaw = match[1];
    const key = SECTION_HEADERS.find(
      (h) => h.toLowerCase() === headerRaw.toLowerCase()
    ) as SectionKey | undefined;

    if (!key) continue;

    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? instructions.length)
        : instructions.length;

    const body = instructions.slice(bodyStart, bodyEnd).trim();
    if (body) {
      sections.push({ key, body });
    }
  }

  return { intro, sections };
}

function TaskSectionBlock({ section }: { section: TaskSection }) {
  const config = SECTION_CONFIG[section.key];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/8 bg-city-navy/40 p-4",
        "border-l-4",
        config.accent
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.labelClass)} />
        <span className={cn("pixel-label font-bold", config.labelClass)}>
          {section.key}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-white/85 sm:text-base">
        {renderTextWithTerms(section.body)}
      </p>
    </div>
  );
}

export function DailyTaskCard({ task, onComplete }: DailyTaskCardProps) {
  const display = task ?? MOCK_DAY_1;
  const initiallyCompleted = display.status === "completed";

  const [localCompleted, setLocalCompleted] = useState(initiallyCompleted);
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [buttonBounce, setButtonBounce] = useState(false);

  const isCompleted = initiallyCompleted || localCompleted;

  const prepared = prepareTaskInstructionsForDisplay(display.instructions);
  const { intro, sections } = splitIntoSections(prepared);

  function handleComplete() {
    if (isCompleted) return;

    setButtonBounce(true);
    setLocalCompleted(true);
    setShowXpBurst(true);

    setTimeout(() => setButtonBounce(false), 400);
    setTimeout(() => setShowXpBurst(false), 1200);

    onComplete?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-magenta-500/25 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
        <CardHeader className="p-4 sm:p-6">
          <p className="pixel-label font-bold text-city-magenta">
            Today&apos;s Task
          </p>
          <CardTitle className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {display.title}
          </CardTitle>
          {display.estimated_minutes != null && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-city-teal/30 bg-city-teal/10 px-3 py-1 text-sm font-medium text-city-teal">
                <Clock className="h-3.5 w-3.5" />
                ~{display.estimated_minutes} min
              </span>
              {display.estimated_minutes > 30 && (
                <span className="rounded-full border border-city-orange/40 bg-city-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-city-orange">
                  Ambitious Session
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          {intro && (
            <p className="text-sm leading-relaxed text-white/75 sm:text-base">
              {renderTextWithTerms(intro)}
            </p>
          )}

          {sections.length > 0 ? (
            <div className="space-y-3">
              {sections.map((section) => (
                <TaskSectionBlock key={section.key} section={section} />
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85 sm:text-base">
              {renderTextWithTerms(prepared)}
            </p>
          )}

          <div className="relative pt-2">
            {isCompleted ? (
              <motion.div
                className="flex h-14 items-center justify-center gap-2 rounded-xl border border-city-teal/30 bg-city-teal/15 text-city-teal shadow-[0_4px_0_0_rgba(0,0,0,0.2)]"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-base font-semibold sm:text-lg">
                  Completed today!
                </span>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                onClick={handleComplete}
                animate={
                  buttonBounce
                    ? { scale: [1, 1.05, 0.98, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-xl",
                  "border-2 border-city-magenta/50 bg-city-magenta text-base font-bold text-white sm:text-lg",
                  "shadow-[0_6px_0_0_#B8326A]",
                  "transition-colors duration-300",
                  "hover:brightness-110",
                  "active:translate-y-1 active:scale-[0.98] active:shadow-[0_2px_0_0_#B8326A]"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-white/60 bg-white/10">
                  <Check className="h-4 w-4" />
                </span>
                Complete Daily Task
              </motion.button>
            )}

            <AnimatePresence>
              {showXpBurst && (
                <motion.span
                  className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 font-bold text-city-orange"
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -40, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  +10 XP
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
