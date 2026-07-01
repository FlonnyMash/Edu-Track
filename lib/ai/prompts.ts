import type { LearningTrack } from "@/types/database";
import type { GlossaryEntry } from "@/lib/glossary/types";
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
    "Follow Genki I (3rd ed.) lesson order: hiragana → katakana → Lessons 1–12. " +
    "Each task must cite a specific lesson, page range, or grammar point from Genki I only. " +
    "Theory sections draw from the main textbook only.",
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

const KANA_ROW_PROGRESSION = [
  "A-row (あ, い, う, え, お)",
  "K-row (か, き, く, け, こ)",
  "S-row (さ, し, す, せ, そ)",
  "T-row (た, ち, つ, て, と)",
  "N-row (な, に, ぬ, ね, の)",
  "H-row (は, ひ, ふ, へ, ほ)",
  "M-row (ま, み, む, め, も)",
  "Y-row (や, ゆ, よ)",
  "R-row (ら, り, る, れ, ろ)",
  "W-row + ん (わ, を, ん)",
].join(" → ");

const KANA_ROW_HINTS: Array<{ pattern: RegExp; nextRow: string }> = [
  { pattern: /k-row|か|き|く|け|こ/i, nextRow: "S-row (さ, し, す, せ, そ)" },
  { pattern: /s-row|さ|し|す|せ|そ/i, nextRow: "T-row (た, ち, つ, て, と)" },
  { pattern: /t-row|た|ち|つ|て|と/i, nextRow: "N-row (な, に, ぬ, ね, の)" },
  { pattern: /n-row|な|に|ぬ|ね|の/i, nextRow: "H-row (は, ひ, ふ, へ, ほ)" },
  { pattern: /h-row|は|ひ|ふ|へ|ほ/i, nextRow: "M-row (ま, み, む, め, も)" },
  { pattern: /m-row|ま|み|む|め|も/i, nextRow: "Y-row (や, ゆ, よ)" },
  { pattern: /y-row|や|ゆ|よ/i, nextRow: "R-row (ら, り, る, れ, ろ)" },
  { pattern: /r-row|ら|り|る|れ|ろ/i, nextRow: "W-row + ん (わ, を, ん)" },
  { pattern: /a-row|あ|い|う|え|お/i, nextRow: "K-row (か, き, く, け, こ)" },
];

function isFreshStart(progressContext: ProgressContext): boolean {
  return (
    progressContext.currentDay === 1 &&
    progressContext.previouslyLearnedTerms.length === 0
  );
}

function buildDayOneBlock(progressContext: ProgressContext): string | null {
  if (!isFreshStart(progressContext)) return null;

  return [
    "═══ DAY 1 / EMPTY STATE (CRITICAL) ═══",
    "CRITICAL: If the previouslyLearnedTerms context is completely empty (i.e., it is Day 1),",
    "you MUST start at the very beginning of the syllabus (e.g., the A-row: あ, い, う, え, お).",
    "Do NOT skip ahead to the K-row or any later row.",
    "Previous mentions of the K-row or other rows elsewhere in these instructions were merely examples",
    "for users who have already completed earlier rows — they do NOT apply on Day 1.",
    "Today's MAIN QUEST new-learning focus MUST be the A-row only (or the equivalent opening",
    "unit of the user's selected material).",
  ].join("\n");
}
function inferNextKanaRowHint(progressContext: ProgressContext): string | null {
  if (isFreshStart(progressContext)) return null;

  const lastTitle = progressContext.recentPerformance.recentTitles[0];
  if (!lastTitle) return null;

  for (const { pattern, nextRow } of KANA_ROW_HINTS) {
    if (pattern.test(lastTitle)) {
      return `- Recent session title suggests prior row coverage — today's NEW focus should be ${nextRow}.`;
    }
  }

  return null;
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
    "- previouslyLearnedTerms is authoritative: " + learnedTerms + ".",
    "- Plan the NEXT step beyond these terms — never re-introduce them as new material.",
    "- Use task history in the user message to infer pacing; if history is empty and",
    "  currentDay is 1, start at the true beginning of the curriculum."
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

  const masteredList =
    progressContext.masteredTopics.length > 0
      ? progressContext.masteredTopics.join(", ")
      : "none recorded yet";

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
    `Current chapter: ${progressContext.currentChapter}`,
    `Previously learned terms: ${learnedTermsList}`,
    `Mastered topics: ${masteredList}`,
    "Recent performance:",
    `  - Completed sessions: ${recentPerformance.completedTaskCount}`,
    `  - Recent progression signals: ${actionsList}`,
    `  - Recent reflections: ${reflectionsList}`,
    `  - Recent session titles: ${titlesList}`,
    `  - Average recent difficulty: ${difficultyText}`,
  ].join("\n");
}

function buildAntiRepeatBlock(progressContext: ProgressContext): string {
  return [
    "── PROGRESSION RULES (strict) ──",
    "You are a Japanese learning guide. Do NOT repeat lessons.",
    "Based on previouslyLearnedTerms, introduce the NEXT logical set of characters or grammar rules.",
    "Never re-teach content the user has already covered in prior sessions.",
    "If currentDay > 1 or previouslyLearnedTerms is non-empty, you MUST advance —",
    "do not assign introductory あ–お hiragana content again unless explicitly reviewing.",
    "- When teaching kana, treat each row as a single-day unit unless review is",
    "  explicitly required (see KANA PACING block).",
    "Maintain the strict quest structure: # MAIN QUEST for new learning and # SIDE QUEST for review.",
    "Continue using the [TERM:word] tagging system for important Japanese concepts.",
    progressContext.currentDay === 1 &&
    progressContext.previouslyLearnedTerms.length === 0
      ? "- Day 1 fresh start: begin at the A-row (あ, い, う, え, お) — the very first step of the syllabus."
      : "- This is NOT a first session — advance beyond all previouslyLearnedTerms.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildReviewBlock(progressContext: ProgressContext): string {
  const learnedTerms =
    progressContext.previouslyLearnedTerms.length > 0
      ? progressContext.previouslyLearnedTerms.join(", ")
      : "none yet";

  const isFreshStartDay =
    progressContext.currentDay === 1 &&
    progressContext.previouslyLearnedTerms.length === 0;

  return [
    "── REVIEW SECTION (mandatory — spaced repetition) ──",
    "The **Review** section belongs inside # SIDE QUEST in every session.",
    "Strict quest structure:",
    "  # MAIN QUEST → ## [Topic Title] → **Theory** → **Application** → **Playful Learning** → **Methodology**",
    "  # SIDE QUEST → **Review** → **Application**",
    "",
    ...(isFreshStartDay
      ? [
          "── DAY 1 SIDE QUEST (preparation — not review) ──",
          "CRITICAL: If it is Day 1, instead of a review, the # SIDE QUEST must instruct the user on",
          "preparation tasks (e.g., setting up their study environment, printing out a",
          "[TERM:genkouyoushi] sheet, or learning how to read a standard Kana chart).",
          "Do NOT write a hollow 'nothing to review yet' message — give concrete, useful prep steps.",
          "Still use the **Review** and **Application** section headers inside # SIDE QUEST.",
          "Label **Review** as study-environment setup; **Application** as a short prep drill",
          "(e.g. locate the kana chart in their textbook, open to the first page).",
        ]
      : [
          "Instructions for **Review**:",
          "- Look at previouslyLearnedTerms: " + learnedTerms + ".",
          "- Select a subset of these older characters/concepts and instruct the user to",
          "  quickly write or recall them (e.g. \"Before writing the new S-row characters,",
          '  quickly write the A-row and K-row once each").',
          "- Do NOT introduce new concepts in Review — only reinforce prior material.",
          "- Keep Review brief (about 3–5 minutes).",
          "- Every session after Day 1 MUST include concrete spaced-repetition practice",
          "  drawn from previouslyLearnedTerms.",
        ]),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildKanaPacingBlock(progressContext: ProgressContext): string {
  const scriptPhase =
    progressContext.currentChapter.toLowerCase().includes("katakana")
      ? "Katakana"
      : "Hiragana";

  const lines = [
    "── KANA PACING (strict — no micro-stagnation) ──",
    `Standard ${scriptPhase} row order (same sequence for Hiragana and Katakana):`,
    `  ${KANA_ROW_PROGRESSION}`,
    "",
    "Rules:",
  ];

  if (isFreshStart(progressContext)) {
    lines.push(
      "- DAY 1 / empty previouslyLearnedTerms: today's NEW material MUST be the A-row",
      "  (あ, い, う, え, お) only. Do NOT assign K-row or any later row.",
      "- K-row/S-row examples below apply only after the user has completed prior rows."
    );
  }

  lines.push(
    "- If previouslyLearnedTerms or recent session titles indicate the user already",
    "  practiced a specific row (e.g. A-row: a, i, u, e, o), today's NEW",
    "  material MUST be the NEXT row in the sequence (e.g. K-row: ka, ki, ku, ke, ko).",
    "- One row per session for new script learning — do not stretch the same row",
    "  across multiple consecutive days.",
    "- Only repeat the previous day's exact row if recent progression signals",
    '  include "review" OR reflections clearly indicate the user struggled/failed.',
    "- Brief review of prior rows (5 min max) is allowed, but today's focus must",
    "  introduce the next row."
  );

  const rowHint = inferNextKanaRowHint(progressContext);
  if (rowHint) {
    lines.push(rowHint);
  }

  return lines.join("\n");
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
  glossaryEntries: GlossaryEntry[] = []
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
  const dayOneBlock = buildDayOneBlock(progressContext);
  const outputFormatBlock = buildOutputFormatBlock();
  const characterListBlock = buildCharacterListFormatBlock();
  const groundingBlock = buildMaterialGroundingBlock(activeMaterial);
  const progressionBlock = buildProgressionBlock(materials, progressContext);
  const learnerStateBlock = buildLearnerStateBlock(progressContext);
  const antiRepeatBlock = buildAntiRepeatBlock(progressContext);
  const kanaPacingBlock = buildKanaPacingBlock(progressContext);
  const noVisualBlock = buildNoVisualDescriptionsBlock();
  const reviewBlock = buildReviewBlock(progressContext);
  const handwritingBlock = buildHandwritingBlock(dayNumber);
  const glossaryBlock = buildGlossaryBlock(glossaryEntries);

  return [
    groundingBlock,
    "",
    "Role: Expert AI Learning Architect & Tutor.",
    "You are the primary driver of the user's Japanese learning journey.",
    "Your sole job is to plan ONE comprehensive daily study session (20–35 minutes).",
    "You are not a chat companion — you output structured learning assignments only.",
    "",
    learnerStateBlock,
    "",
    ...(dayOneBlock ? [dayOneBlock, ""] : []),
    antiRepeatBlock,
    "",
    kanaPacingBlock,
    "",
    noVisualBlock,
    "",
    "- Based on learner state, determine the most logical next step in the curriculum.",
    "- If prior tasks suggest mastery, proactively plan content that advances toward the next chapter.",
    "- If recent progression signals include 'review' or reflections suggest struggle,",
    "  plan consolidation before advancing.",
    "- The user may override chapter in Settings — treat current chapter above as authoritative.",
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
    "MAIN QUEST contains today's new learning only.",
    "Inside # MAIN QUEST, use these **bold** section headers in this exact order (after `##`):",
    "  **Theory** — material curriculum only; cap at 10 minutes of reading/study.",
    "  **Application** — practice from the selected material (workbook pages, exercises, or writing).",
    "  **Playful Learning** — Suggest auditory/visual aids (hiragana song, stroke-order video,",
    "    Forvo pronunciation). EXPLAIN how to use each aid (HOW + WHEN relative to the session).",
    "  **Methodology** — Brief synergy: why each material is used and the order of operations.",
    "",
    characterListBlock,
    "",
    "After MAIN QUEST, include exactly this H1 heading:",
    "# SIDE QUEST",
    ...(isFreshStart(progressContext)
      ? [
          "On Day 1 (empty previouslyLearnedTerms), SIDE QUEST is for preparation tasks —",
          "not spaced repetition. Instruct study-environment setup and kana-chart orientation.",
          "Use **Review** for prep/setup steps and **Application** for a short prep drill.",
        ]
      : [
          "SIDE QUEST is spaced repetition only. It must cover older concepts from",
          "previouslyLearnedTerms and must not introduce new concepts.",
          "Inside # SIDE QUEST, use these **bold** section headers in this exact order:",
          "  **Review** — Select older characters/concepts from previouslyLearnedTerms.",
          "    Instruct the user to quickly write, read, or recall them.",
          "  **Application** — A short 3–5 minute review drill using only older material.",
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
    "- topic: today's focus label",
    "- chapter: target chapter after this session",
    "- next_recommended_action: advance | stay | review",
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
  progressContext: ProgressContext
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
      : "none — Day 1 start";

  return [
    `Learning goal: ${topic}`,
    `Current day number: ${currentDay}`,
    `Current chapter: ${progressContext.currentChapter}`,
    `Mastered topics: ${progressContext.masteredTopics.join(", ") || "none yet"}`,
    `Previously learned terms: ${learnedTerms}`,
    "",
    "Recent task history:",
    historyText,
    "",
    `Generate Day ${currentDay}'s comprehensive study session.`,
    "Content MUST differ from all recent session titles and must advance beyond previouslyLearnedTerms.",
    "When teaching kana, advance to the next row — do not repeat yesterday's row unless review is needed.",
    "Always include # MAIN QUEST for new learning and # SIDE QUEST for spaced repetition review.",
    "MAIN QUEST sections: Theory, Application, Playful Learning, Methodology.",
    "SIDE QUEST sections: Review, Application.",
    "Output Part 1 (Markdown starting with # MAIN QUEST) then Part 2 (raw JSON metadata at the very end).",
  ].join("\n");
}
