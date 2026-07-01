import type { LearningTrack } from "@/types/database";
import type { GlossaryEntry } from "@/lib/glossary/types";
import type { SyllabusProgress } from "./syllabus";
import { formatUnitCharacterList } from "./syllabus";
export interface CurrentProgress {
  chapter: string;
  masteredTopics: string[];
}

export interface TaskHistoryEntry {
  day_number: number;
  title: string;
  instructions: string;
  reflection_notes: string | null;
  difficulty_level: number;
}

export interface RecentPerformance {
  completedTaskCount: number;
  recentActions: Array<"advance" | "stay" | "review">;
  recentReflections: string[];
  recentTitles: string[];
  averageDifficulty: number | null;
}

export interface ProgressContext {
  currentDay: number;
  currentChapter: string;
  masteredTopics: string[];
  previouslyLearnedTerms: string[];
  recentPerformance: RecentPerformance;
  history: TaskHistoryEntry[];
}

export interface GenerationContext {
  track: LearningTrack;
  dayNumber: number;
  history: TaskHistoryEntry[];
  currentStreak: number;
  totalXp: number;
}

export function buildMvpCoachPrompt(topic: string, currentDay: number): string {
  return `You are an expert learning coach. The user is learning ${topic}. They are on Day ${currentDay} of their journey. Generate a specific, actionable, and highly focused 20-minute daily task. The difficulty must slowly and logically progress based on the day. Keep it concise. Return a JSON object strictly matching this structure: { "title": "Task Title", "description": "Task details and actionable steps" }.`;
}

export function buildSystemPrompt(): string {
  return `You are an intelligent daily learning curriculum planner for Edu Track.
Your role is to plan ONE actionable offline learning task per day — never quizzes or knowledge tests.

Rules:
- Output progressive, bite-sized tasks that build on prior completions and user reflections
- Tasks should be practical: write, practice, review, observe, or create something
- Respect the user's difficulty preference (gentle = shorter/easier, ambitious = more challenging)
- Keep sessions between 15-45 minutes unless gentle preference suggests shorter
- Never repeat the same task title or instructions verbatim from history
- Include the day number in the title (e.g. "Day 3: Write Hiragana S-T")
- Scale difficulty gradually based on day number and past performance`;
}

export function buildUserPrompt(ctx: GenerationContext): string {
  const historyText =
    ctx.history.length === 0
      ? "No prior tasks completed yet. This is the user's first day."
      : ctx.history
          .map(
            (h) =>
              `Day ${h.day_number}: "${h.title}"\nInstructions: ${h.instructions}\nReflection: ${h.reflection_notes || "None"}`
          )
          .join("\n\n");

  return `Learning Goal: ${ctx.track.title}
Description: ${ctx.track.description || "No additional context"}
Difficulty Preference: ${ctx.track.difficulty_preference}
Current Day Number: ${ctx.dayNumber}
Current Streak: ${ctx.currentStreak} days
Total XP: ${ctx.totalXp}

Recent Task History:
${historyText}

Generate the next daily learning task as JSON.`;
}

const SUPPLEMENTARY_MATERIALS: Record<string, string> = {
  "Genki 1 Workbook":
    "Genki 1 (main textbook) — hiragana, katakana, and Lessons 1–12 grammar/vocabulary",
};

const MATERIAL_CURRICULUM_HINTS: Record<string, string> = {
  "Genki 1":
    "Use Genki I (3rd ed.) page references only for the pre-assigned syllabus topic. " +
    "Do NOT advance to Lessons 1–12 or other rows unless they are the assigned topic in the CURRICULUM ASSIGNMENT block.",
  "Genki 1 Workbook":
    "Follow Genki I Workbook exercise sets that mirror the main textbook lessons. " +
    "Never assign workbook pages ahead of the corresponding textbook lesson. " +
    "CRITICAL: For hiragana and katakana sections, workbook exercises start at PAGE 11. " +
    "NEVER reference workbook page 4 or any page below 11 for script practice.",
  "Tae Kim's Guide":
    "Follow Tae Kim's Japanese Grammar Guide section order. " +
    "Cite the exact section title; do not introduce grammar from outside the guide.",
  Duolingo:
    "Align tasks with Duolingo Japanese skill-tree units in order. " +
    "Reference the unit/skill name; do not invent units that do not exist in the tree.",
};

/**
 * Injects the pre-computed curriculum assignment so the LLM never has to
 * infer the next topic. Progression is resolved deterministically in code.
 */
function buildCurriculumAssignmentBlock(progress: SyllabusProgress): string {
  const mainItems = formatUnitCharacterList(progress.nextTopic);
  const { nextTopic } = progress;

  const lines = [
    "═══ CURRICULUM ASSIGNMENT (PRE-COMPUTED — HIGHEST PRIORITY) ═══",
    "Progression is decided in code. You are a content writer ONLY — do NOT choose topics.",
    `Your # MAIN QUEST MUST EXACTLY teach this topic: ${nextTopic.title}`,
    `and these items: ${nextTopic.items.join(", ")}`,
    "Use the strict Character | Pronunciation list format for these items in **Theory**:",
    mainItems,
    "Do NOT teach any other topic, lesson, row, or vocabulary.",
    "Do NOT reference Genki Lesson 1 unless it is the assigned topic above.",
    "",
  ];

  if (nextTopic.textbookReference) {
    lines.push(
      `Textbook reference (PRIMARY SOURCE OF TRUTH): ${nextTopic.textbookReference}`,
      "You MUST cite this location explicitly in MAIN QUEST **Theory** and **Application**.",
      ""
    );
  }

  if (progress.reviewItems.length === 0) {
    lines.push(
      "CRITICAL: The user has NO review items yet. For the `# SIDE QUEST`, DO NOT generate character reviews.",
      "Instead, give them a generic preparation task (e.g., set up a notebook, explain stroke order).",
      "Your # SIDE QUEST is a generic PREPARATION task (not spaced repetition):",
      "instruct study-environment setup, printing a [TERM:genkouyoushi] sheet,",
      "and locating the kana chart in the user's material."
    );
  } else {
    lines.push(
      `For the # SIDE QUEST, you MUST EXACTLY review these items: ${progress.reviewItems.join(", ")}.`,
      "Do NOT add, remove, or substitute any item.",
      "List each item using the strict Character | Pronunciation format."
    );
  }

  return lines.join("\n");
}

function buildCurriculumCompleteBlock(progress: SyllabusProgress): string {
  const reviewList = progress.reviewItems.join(", ");

  return [
    "═══ CURRICULUM COMPLETE — MASTERY CONSOLIDATION DAY (HIGHEST PRIORITY) ═══",
    "The user has mastered all current MVP syllabus content (Hiragana, Katakana, Genki I greetings).",
    "Do NOT introduce new material.",
    "",
    "Your # MAIN QUEST MUST be titled Mastery Consolidation Day.",
    "Provide a comprehensive review combining all Hiragana, Katakana, and greetings learned.",
    "Include broad practice: mixed writing, reading aloud, and a short self-check.",
    "Use the strict Word/Character | Pronunciation format for any listed items.",
    "",
    "Your # SIDE QUEST MUST review ONLY these pre-selected items (60% spaced repetition sample):",
    `  ${reviewList}`,
    "List each item using the strict Word/Character | Pronunciation format.",
    "Do NOT introduce new concepts in the # SIDE QUEST.",
  ].join("\n");
}

function curriculumHintFor(material: string): string {
  return (
    MATERIAL_CURRICULUM_HINTS[material] ??
    `Treat "${material}" as an authoritative curriculum. ` +
      "Only assign content that genuinely exists within that resource. " +
      "If you are unsure of its structure, assign a short orientation task " +
      "(e.g. identify the next unread chapter) instead of inventing lessons."
  );
}

function buildProgressionBlock(
  materials: string[],
  progressContext: ProgressContext
): string {
  const lines: string[] = ["PROGRESSION AWARENESS:"];

  if (materials.length > 1) {
    lines.push(
      "- The user studies multiple resources in one session.",
      "- Follow order: primary textbook (Theory) → spaced repetition (Review) →",
      "  workbook (Application) → playful aids (Playful Learning).",
      "- State the order of operations explicitly in Methodology",
      '  (e.g. "Read Genki p. 40, then Workbook p. 11+, finish with a hiragana song").'
    );
  } else {
    lines.push(
      "- Advance one small step at a time within the chosen material's natural order.",
      "- Do not jump to advanced grammar, kanji, or lessons the user has not reached."
    );
  }

  const learnedTerms =
    progressContext.previouslyLearnedTerms.length > 0
      ? progressContext.previouslyLearnedTerms.join(", ")
      : "none yet";

  lines.push(
    "- previouslyLearnedTerms (background only — do NOT use for curriculum decisions): " +
      learnedTerms + ".",
    "- Today's topic and review items are fixed in the CURRICULUM ASSIGNMENT block — write content for those only."
  );

  for (const material of materials) {
    const prerequisite = SUPPLEMENTARY_MATERIALS[material];
    if (!prerequisite) continue;

    const prerequisiteName = prerequisite.split("—")[0]?.trim() ?? prerequisite;
    const hasFoundation = materials.some(
      (m) => m === prerequisiteName || prerequisite.includes(m)
    );

    if (hasFoundation) {
      lines.push(
        `- User has both "${prerequisiteName}" and "${material}". ` +
          "Assign textbook/content first; workbook drills only for lessons already covered."
      );
    } else {
      lines.push(
        `- User selected "${material}" without "${prerequisiteName}".`,
        "  Do NOT assign heavy workbook drills or advanced exercises from that resource.",
        "  Assign a lightweight prerequisite or orientation task instead, or focus on",
        "  a different selected material they are ready for."
      );
    }
  }

  return lines.join("\n");
}

function buildLearnerStateBlock(progressContext: ProgressContext): string {
  const { recentPerformance } = progressContext;

  const learnedTermsList =
    progressContext.previouslyLearnedTerms.length > 0
      ? progressContext.previouslyLearnedTerms.join(", ")
      : "none — Day 1 start";

  const actionsList =
    recentPerformance.recentActions.length > 0
      ? recentPerformance.recentActions.join(", ")
      : "none yet";

  const reflectionsList =
    recentPerformance.recentReflections.length > 0
      ? recentPerformance.recentReflections.join(" | ")
      : "none provided";

  const titlesList =
    recentPerformance.recentTitles.length > 0
      ? recentPerformance.recentTitles.join(" | ")
      : "none yet";

  const difficultyText =
    recentPerformance.averageDifficulty != null
      ? String(recentPerformance.averageDifficulty)
      : "not enough data";

  return [
    "── LEARNER STATE (authoritative) ──",
    `Current day: ${progressContext.currentDay}`,
    `Current chapter (informational only): ${progressContext.currentChapter}`,
    `Previously learned terms (do NOT use for curriculum decisions): ${learnedTermsList}`,
    "Recent performance:",
    `  - Completed sessions: ${recentPerformance.completedTaskCount}`,
    `  - Recent progression signals: ${actionsList}`,
    `  - Recent reflections: ${reflectionsList}`,
    `  - Recent session titles: ${titlesList}`,
    `  - Average recent difficulty: ${difficultyText}`,
  ].join("\n");
}

function buildAntiRepeatBlock(): string {
  return [
    "── PROGRESSION RULES (strict) ──",
    "You are a Japanese learning guide. Do NOT repeat lessons.",
    "Today's new topic is fixed by the CURRICULUM ASSIGNMENT block above — teach exactly that.",
    "Never re-teach content the user has already covered in prior sessions as NEW material.",
    "Maintain the strict quest structure: # MAIN QUEST for new learning and # SIDE QUEST for review.",
    "Continue using the [TERM:word] tagging system for important Japanese concepts.",
  ].join("\n");
}

function buildReviewBlock(progress: SyllabusProgress): string {
  return [
    "── REVIEW SECTION (mandatory — spaced repetition) ──",
    "The **Review** section belongs inside # SIDE QUEST in every session.",
    "Strict quest structure:",
    "  # MAIN QUEST → ## [Topic Title] → **Theory** → **Application** → **Playful Learning** → **Methodology**",
    "  # SIDE QUEST → **Review** → **Application**",
    "",
    ...(progress.reviewItems.length === 0
      ? [
          "── FRESH START SIDE QUEST (preparation — not review) ──",
          "CRITICAL: The user has NO review items yet. For the `# SIDE QUEST`, DO NOT generate character reviews.",
          "Instead, give them a generic preparation task (e.g., set up a notebook, explain stroke order).",
          "There is nothing to review yet, so the # SIDE QUEST must instruct the user on",
          "preparation tasks (e.g., setting up their study environment, printing out a",
          "[TERM:genkouyoushi] sheet, or learning how to read a standard Kana chart).",
          "Do NOT write a hollow 'nothing to review yet' message — give concrete, useful prep steps.",
          "Still use the **Review** and **Application** section headers inside # SIDE QUEST.",
          "Label **Review** as study-environment setup; **Application** as a short prep drill",
          "(e.g. locate the kana chart in their textbook, open to the first page).",
        ]
      : [
          "Instructions for **Review**:",
          `For the # SIDE QUEST, you MUST EXACTLY review these items: ${progress.reviewItems.join(", ")}.`,
          "Do NOT add, remove, or substitute any item.",
          "- Instruct the user to quickly write, read, or recall them before the new topic.",
          "- List reviewed characters using the strict Character | Pronunciation format.",
          "- Do NOT introduce new concepts in Review — only reinforce these items.",
          "- Keep Review brief (about 3–5 minutes).",
        ]),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildNoVisualDescriptionsBlock(): string {
  return [
    "── NO TEXTUAL STROKE DESCRIPTIONS (critical) ──",
    "- Do NOT describe stroke orders or character shapes using text",
    '  (e.g. never write "draw a horizontal line, then add a hook").',
    "- Textual stroke instructions are confusing and forbidden.",
    "- Instead, instruct the user to check Genki I for the character chart OR",
    "  use a stroke-order video/image in Playful Learning.",
    '- Application may say "write each character 5× following Genki stroke order"',
    "  but must NOT narrate the strokes themselves.",
  ].join("\n");
}

function buildHandwritingBlock(dayNumber: number): string {
  if (dayNumber > 10) {
    return [
      "── HANDWRITING ──",
      "- Handwriting practice is encouraged but not mandatory after Day 10.",
      "- Include writing steps when they reinforce today's script or vocabulary.",
    ].join("\n");
  }

  return [
    "── HANDWRITING FIRST (MANDATORY — Days 1–10) ──",
    `- Today is Day ${dayNumber}. Handwriting practice of the script is MANDATORY.`,
    "- The Application section MUST include a dedicated handwriting step on [TERM:genkouyoushi]",
    "  or lined paper: write each new character 5×, following stroke order shown in",
    "  Genki I or a linked visual resource — do not describe strokes in text.",
    "- Say each sound aloud as you write to sync audio with motion.",
  ].join("\n");
}

function buildGlossaryBlock(glossaryEntries: GlossaryEntry[]): string {
  if (glossaryEntries.length === 0) {
    return [
      "── KNOWN GLOSSARY (database) ──",
      "No glossary terms stored yet. Tag at least 3 important terms with [TERM:term];",
      "they will be cached automatically for future sessions.",
    ].join("\n");
  }

  const termLines = glossaryEntries.map(
    (entry) => `  • [TERM:${entry.term}] — ${entry.definition}`
  );

  return [
    "── KNOWN GLOSSARY (database) ──",
    "Prefer these terms when they fit today's session. Use the exact tag spelling shown.",
    "Do not re-explain tagged terms inline — the user clicks them for definitions.",
    ...termLines,
    "You may add new [TERM:...] tags for other important words not listed above.",
  ].join("\n");
}

function buildCharacterListFormatBlock(): string {
  return [
    "── CHARACTER & PRONUNCIATION LISTS (mandatory in Theory / Review kana) ──",
    "Whenever you list Japanese characters (hiragana, katakana, or kanji) in **Theory**",
    "or **Review**, use ONLY this strict one-per-line format — no pronunciations in prose:",
    "  か | ka",
    "  き | ki",
    "Labeled form is also accepted:",
    "  Character: か | Pronunciation: ka",
    "Rules:",
    "- One character per line. Place context sentences (page refs, instructions) above or below the list.",
    "- NEVER explain pronunciation in sentences (wrong: 'あ is pronounced ah'; right: 'あ | a').",
    "- Do NOT comma-separate characters in prose when teaching sounds — always use the list format.",
    "- Keep # MAIN QUEST / # SIDE QUEST and ## [Topic Title] structure unchanged.",
  ].join("\n");
}

function buildOutputFormatBlock(): string {
  return [
    "── STRICT OUTPUT FORMATTING (do not deviate) ──",
    "Part 1 output MUST strictly begin with `# MAIN QUEST` as the very first line.",
    "Never place unformatted text, progress summaries, or commentary before `# MAIN QUEST`.",
    "Immediately below `# MAIN QUEST`, you MUST provide a clean `## [Topic Title]` heading",
    "(e.g. `## Introduction to Hiragana A-row`) before starting the `**Theory**` block.",
    "Do NOT skip the `##` sub-heading. Do NOT place plain text between `# MAIN QUEST` and `##`.",
    "Required MAIN QUEST structure:",
    "  # MAIN QUEST",
    "  ## [Topic Title]",
    "  **Theory**",
    "  **Application**",
    "  **Playful Learning**",
    "  **Methodology**",
    "Violating this structure is an error — always follow it exactly.",
  ].join("\n");
}

function buildTextbookReferenceDirective(textbookReference?: string): string {
  if (!textbookReference?.trim()) return "";
  return [
    "── TEXTBOOK ANCHOR (MANDATORY) ──",
    `If a textbookReference is provided (Value: ${textbookReference}), you MUST explicitly instruct the user in the **Theory** and **Application** sections to open their textbook to this specific location. Treat the textbook as the primary source of truth.`,
  ].join("\n");
}

function buildMaterialGroundingBlock(activeMaterial: string): string {
  const materialLabel =
    activeMaterial.trim() ||
    "standard introductory Japanese (no specific material selected)";

  return [
    "═══ MATERIAL GROUNDING (CRITICAL — highest priority) ═══",
    `The user is studying using the following material: ${materialLabel}.`,
    "You must strictly base today's lesson, vocabulary, and grammar on the curriculum of this specific material.",
    "Use your internal training knowledge of this book/resource to generate accurate references (e.g., 'Read Genki 1, Chapter X').",
    "Do not introduce concepts, vocabulary, or Kanji that appear outside or ahead of this material's progression.",
    "The **Theory** and **Application** sections of # MAIN QUEST must cite this material explicitly.",
    ...(activeMaterial.trim()
      ? []
      : [
          "No material was selected — you may fall back to standard introductory Japanese knowledge only.",
        ]),
  ].join("\n");
}

/**
 * Builds the Master Prompt system message for daily Japanese session generation.
 */
export function getDailyTaskPrompt(
  activeMaterial: string,
  materials: string[],
  progressContext: ProgressContext,
  glossaryEntries: GlossaryEntry[] = [],
  syllabusProgress: SyllabusProgress
): string {
  const materialList =
    activeMaterial.trim() ||
    "standard introductory Japanese (no specific material selected)";

  const curriculumHints =
    materials.length > 0
      ? materials
          .map((m) => `  • ${m}: ${curriculumHintFor(m)}`)
          .join("\n")
      : `  • ${curriculumHintFor("their chosen learning material")}`;

  const dayNumber = progressContext.currentDay;
  const assignmentBlock = syllabusProgress.isCurriculumComplete
    ? buildCurriculumCompleteBlock(syllabusProgress)
    : buildCurriculumAssignmentBlock(syllabusProgress);
  const deterministicTopic = syllabusProgress.isCurriculumComplete
    ? "Mastery Consolidation Day"
    : syllabusProgress.nextTopic.title;
  const textbookReference = syllabusProgress.nextTopic.textbookReference;
  const textbookReferenceBlock =
    buildTextbookReferenceDirective(textbookReference);
  const outputFormatBlock = buildOutputFormatBlock();
  const characterListBlock = buildCharacterListFormatBlock();
  const groundingBlock = buildMaterialGroundingBlock(activeMaterial);
  const progressionBlock = buildProgressionBlock(materials, progressContext);
  const learnerStateBlock = buildLearnerStateBlock(progressContext);
  const antiRepeatBlock = buildAntiRepeatBlock();
  const noVisualBlock = buildNoVisualDescriptionsBlock();
  const reviewBlock = buildReviewBlock(syllabusProgress);
  const handwritingBlock = buildHandwritingBlock(dayNumber);
  const glossaryBlock = buildGlossaryBlock(glossaryEntries);

  return [
    groundingBlock,
    "",
    "Role: Expert Japanese study session content writer.",
    "You write motivating educational copy for ONE daily study session (20–35 minutes).",
    "Curriculum is pre-assigned in the CURRICULUM ASSIGNMENT block — you do NOT decide topics or review items.",
    "You are not a chat companion — you output structured learning assignments only.",
    "",
    assignmentBlock,
    "",
    learnerStateBlock,
    "",
    antiRepeatBlock,
    "",
    noVisualBlock,
    "",
    "- Curriculum progression is pre-computed — follow the CURRICULUM ASSIGNMENT block exactly.",
    "- Your job is to write great, motivating educational content for the assigned topic,",
    "  not to decide what comes next.",
    "",
    "═══ LEARNING MATERIALS ═══",
    `User-selected materials: ${materialList}`,
    "",
    "── STRICT ADHERENCE ──",
    "- The task MUST be strictly based on the curriculum and pacing of the user's materials.",
    "- Do NOT hallucinate grammar points, vocabulary, chapters, pages, or app units",
    "  that do not exist in those resources.",
    "- Per-material curriculum anchors:",
    curriculumHints,
    "- Every session must name a concrete anchor",
    "  (e.g. \"Genki I Lesson 3 – です/であります\", \"Genki I Workbook p. 11\").",
    "- If you cannot cite a real anchor, assign an orientation/review task within",
    "  the material — never fabricate content.",
    "- Workbook exercises for Hiragana/Katakana start at PAGE 11. Never reference page 4.",
    "",
    progressionBlock,
    "",
    reviewBlock,
    "",
    handwritingBlock,
    "",
    outputFormatBlock,
    "",
    "── PART 1: HUMAN-READABLE SESSION (Markdown) ──",
    "Part 1 MUST strictly begin with `# MAIN QUEST` — no text before it.",
    "Immediately under `# MAIN QUEST`, add `## [Topic Title]` then the section blocks.",
    "Do NOT include a Day title heading or unformatted progress line before `# MAIN QUEST`.",
    ...(syllabusProgress.isCurriculumComplete
      ? [
          "MAIN QUEST is a Mastery Consolidation Day — comprehensive review only, no new material.",
        ]
      : ["MAIN QUEST contains today's new learning only."]),
    "Inside # MAIN QUEST, use these **bold** section headers in this exact order (after `##`):",
    "  **Theory** — material curriculum only; cap at 10 minutes of reading/study.",
    "  **Application** — practice from the selected material (workbook pages, exercises, or writing).",
    "  **Playful Learning** — Suggest auditory/visual aids (hiragana song, stroke-order video,",
    "    Forvo pronunciation). EXPLAIN how to use each aid (HOW + WHEN relative to the session).",
    "  **Methodology** — Brief synergy: why each material is used and the order of operations.",
    "",
    ...(textbookReferenceBlock ? [textbookReferenceBlock, ""] : []),
    characterListBlock,
    "",
    "After MAIN QUEST, include exactly this H1 heading:",
    "# SIDE QUEST",
    ...(syllabusProgress.isCurriculumComplete
      ? [
          "Curriculum complete: SIDE QUEST continues spaced repetition from the full corpus.",
          `Review ONLY these assigned items (${syllabusProgress.reviewItems.join(", ")}).`,
          "List each using the strict Word/Character | Pronunciation format.",
          "Inside # SIDE QUEST, use **Review** and **Application** section headers.",
        ]
      : syllabusProgress.reviewItems.length === 0
        ? [
            "CRITICAL: The user has NO review items yet. For the `# SIDE QUEST`, DO NOT generate character reviews.",
            "Instead, give them a generic preparation task (e.g., set up a notebook, explain stroke order).",
            "Fresh start: SIDE QUEST is for preparation tasks — not spaced repetition.",
            "Instruct study-environment setup and kana-chart orientation.",
            "Use **Review** for prep/setup steps and **Application** for a short prep drill.",
          ]
        : [
            `For the # SIDE QUEST, you MUST EXACTLY review these items: ${syllabusProgress.reviewItems.join(", ")}.`,
            "Do NOT add, remove, or substitute any item.",
            "Inside # SIDE QUEST, use these **bold** section headers in this exact order:",
            "  **Review** — Have the user quickly write, read, or recall the assigned items,",
            "    listed using the strict Character | Pronunciation format.",
            "  **Application** — A short 3–5 minute review drill using only those items.",
          ]),
    "You MUST generate BOTH # MAIN QUEST and # SIDE QUEST every time.",
    "",
    "── GLOSSARY TERM TAGS (mandatory in Part 1) ──",
    "Part 1 MUST include at least 3 terms wrapped in [TERM:term].",
    "Do not use markdown inside the tag. Format: [TERM:term] only.",
    "Example: 'Use [TERM:genkouyoushi] for your writing practice.'",
    "Tag tools, scripts, grammar labels, and study resources",
    "(e.g. [TERM:hiragana], [TERM:katakana], [TERM:desu]).",
    "When a word is wrapped in [TERM:...], do NOT explain it inline — the user",
    "clicks the term for a definition. Never add glosses, translations, or",
    "parentheticals right after a tag.",
    "Wrong: 'Use [TERM:genkouyoushi] (square writing paper) for practice.'",
    "Wrong: 'Learn [TERM:hiragana], the basic Japanese syllabary, today.'",
    "Right: 'Use [TERM:genkouyoushi] for your handwriting practice.'",
    "Do NOT use [Topic:X] or [Chapter:Y] tags anywhere in Part 1.",
    "",
    glossaryBlock,
    "",
    "── PLAYFUL LEARNING ──",
    "- Frequently suggest external auditory/visual aids to make the session engaging.",
    "- Each aid must include: what it is, HOW to use it, and WHEN in the session.",
    "- Example: \"Listen to a hiragana song while writing to sync audio with motion.\"",
    "",
    "── SESSION DURATION ──",
    "- Total session (Theory + Review + Application + Playful Learning) MUST be 20–35 minutes.",
    "- Light review days ≈ 20–25 min; full Theory + Workbook + playful aid ≈ 30–35 min.",
    "- Do not overwhelm the user in early stages — keep the load manageable.",
    "",
    "── PART 2: HIDDEN JSON METADATA ──",
    "After Part 1, append a raw JSON block at the very end (no markdown fence).",
    "This block is for system tracking only — not shown to the user.",
    "Use exactly these keys:",
    '{ "topic": "...", "chapter": "...", "next_recommended_action": "advance|stay|review", "estimated_duration": 30 }',
    `- topic: copy EXACTLY this value — "${deterministicTopic}"`,
    `- chapter: copy EXACTLY this value — "${deterministicTopic}"`,
    "- next_recommended_action: use advance (do not invent a different progression decision)",
    "- estimated_duration: integer 20–35 (total session minutes)",
    "",
    "── OUTPUT RULES ──",
    "- Output Part 1 markdown first, then Part 2 JSON on its own at the very end.",
    "- Part 1 MUST start with `# MAIN QUEST` — never lead with unformatted text.",
    "- Under `# MAIN QUEST`, the next line MUST be `## [Topic Title]` before **Theory**.",
    "- Part 1 must contain exactly two H1 quest headings: # MAIN QUEST and # SIDE QUEST.",
    "- Do not add any other H1 headings in Part 1.",
    "- Do NOT wrap Part 2 in ```json code fences.",
    "- Tasks must be offline-friendly when possible (reading, writing, speaking aloud).",
    "- Never output quizzes scored by you; assign practice the user performs themselves.",
    "",
    "── TONE ──",
    "Encouraging, structured, and professional. You are a proactive tutor.",
    "Short sentences. No filler. Stay inside the user's book, app, or guide.",
  ].join("\n");
}

/** User message for MVP daily task generation (day + goal + progress + history). */
export function buildMvpUserPrompt(
  topic: string,
  progressContext: ProgressContext,
  syllabusProgress: SyllabusProgress
): string {
  const { currentDay, history } = progressContext;

  const historyText =
    history.length === 0
      ? "No prior tasks completed yet. This is the user's first day."
      : history
          .map(
            (h) =>
              `Day ${h.day_number}: "${h.title}"\nInstructions: ${h.instructions.slice(0, 400)}\nReflection: ${h.reflection_notes || "None"}`
          )
          .join("\n\n");

  const learnedTerms =
    progressContext.previouslyLearnedTerms.length > 0
      ? progressContext.previouslyLearnedTerms.join(", ")
      : "none — fresh start";

  const sideQuestLine = syllabusProgress.isCurriculumComplete
    ? "Generate a Mastery Consolidation Day — no new syllabus topic."
    : syllabusProgress.reviewItems.length === 0
      ? "CRITICAL: The user has NO review items yet. SIDE QUEST is preparation only — DO NOT generate character reviews."
      : `For the # SIDE QUEST, you MUST EXACTLY review these items: ${syllabusProgress.reviewItems.join(", ")}.`;

  const mainQuestLine = syllabusProgress.isCurriculumComplete
    ? "MAIN QUEST MUST be a Mastery Consolidation Day (comprehensive review, no new material)."
    : `MAIN QUEST MUST EXACTLY teach this topic: ${syllabusProgress.nextTopic.title} and these items: ${syllabusProgress.nextTopic.items.join(", ")}.`;

  const textbookAnchorLine =
    !syllabusProgress.isCurriculumComplete &&
    syllabusProgress.nextTopic.textbookReference
      ? `Textbook anchor for Theory/Application: ${syllabusProgress.nextTopic.textbookReference}.`
      : null;

  return [
    `Learning goal: ${topic}`,
    `Current day number: ${currentDay}`,
    `Current chapter (informational only): ${progressContext.currentChapter}`,
    `Previously learned terms (do NOT use for curriculum decisions): ${learnedTerms}`,
    "",
    "Recent task history:",
    historyText,
    "",
    `Generate Day ${currentDay}'s comprehensive study session.`,
    mainQuestLine,
    ...(textbookAnchorLine ? [textbookAnchorLine] : []),
    sideQuestLine,
    "Always include # MAIN QUEST for new learning and # SIDE QUEST for review.",
    "MAIN QUEST sections: Theory, Application, Playful Learning, Methodology.",
    "SIDE QUEST sections: Review, Application.",
    "Output Part 1 (Markdown starting with # MAIN QUEST) then Part 2 (raw JSON metadata at the very end).",
  ].join("\n");
}
