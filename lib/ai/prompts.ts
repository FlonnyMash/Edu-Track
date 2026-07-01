import type { LearningTrack } from "@/types/database";
import { parseLearningMaterials } from "@/lib/profiles/learning-materials";

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

function curriculumHintFor(material: string): string {
  return (
    MATERIAL_CURRICULUM_HINTS[material] ??
    `Treat "${material}" as an authoritative curriculum. ` +
      "Only assign content that genuinely exists within that resource. " +
      "If you are unsure of its structure, assign a short orientation task " +
      "(e.g. identify the next unread chapter) instead of inventing lessons."
  );
}

function buildProgressionBlock(materials: string[]): string {
  const lines: string[] = ["PROGRESSION AWARENESS:"];

  if (materials.length > 1) {
    lines.push(
      "- The user studies multiple resources in one session.",
      "- Follow order: primary textbook (Theory) → workbook (Application) → playful aids (Playful Learning).",
      "- State the order of operations explicitly in Methodology",
      '  (e.g. "Read Genki p. 40, then Workbook p. 11+, finish with a hiragana song").'
    );
  } else {
    lines.push(
      "- Advance one small step at a time within the chosen material's natural order.",
      "- Do not jump to advanced grammar, kanji, or lessons the user has not reached."
    );
  }

  lines.push(
    "- Use prior task history (when provided in the user message) to infer the",
    "  next lesson; if history is empty, start at the true beginning of the curriculum."
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
    "  or lined paper: write each new character with correct stroke order.",
    "- Say each sound aloud as you write to sync audio with motion.",
  ].join("\n");
}

/**
 * Builds the Master Prompt system message for daily Japanese session generation.
 */
export function getDailyTaskPrompt(
  learningMaterials: string | string[] | null | undefined,
  currentProgress: CurrentProgress,
  dayNumber: number
): string {
  const materials = Array.isArray(learningMaterials)
    ? learningMaterials.map((m) => m.trim()).filter(Boolean)
    : parseLearningMaterials(learningMaterials);

  const materialList =
    materials.length > 0
      ? materials.join(", ")
      : "their chosen learning material";

  const curriculumHints =
    materials.length > 0
      ? materials
          .map((m) => `  • ${m}: ${curriculumHintFor(m)}`)
          .join("\n")
      : `  • ${curriculumHintFor("their chosen learning material")}`;

  const progressionBlock = buildProgressionBlock(materials);
  const handwritingBlock = buildHandwritingBlock(dayNumber);

  const masteredList =
    currentProgress.masteredTopics.length > 0
      ? currentProgress.masteredTopics.join(", ")
      : "none recorded yet";

  return [
    "Role: Expert AI Learning Architect & Tutor.",
    "You are the primary driver of the user's Japanese learning journey.",
    "Your sole job is to plan ONE comprehensive daily study session (20–35 minutes).",
    "You are not a chat companion — you output structured learning assignments only.",
    "",
    "── CURRENT USER PROGRESS ──",
    `Current day number: ${dayNumber}`,
    `Current chapter/lesson: ${currentProgress.chapter}`,
    `Mastered topics: ${masteredList}`,
    "- Based on this progress, determine the most logical next step in the curriculum.",
    "- If prior tasks suggest mastery, proactively plan content that advances toward the next chapter.",
    "- If the user likely struggled, plan review or consolidation before advancing.",
    "- The user may override chapter in Settings — treat the chapter above as authoritative.",
    "",
    `LEARNING MATERIALS (user-selected): ${materialList}`,
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
    handwritingBlock,
    "",
    "── PART 1: HUMAN-READABLE SESSION (Markdown) ──",
    "Begin with a single heading: # Day {N}: {Short Title}",
    "Then a one-line progress summary (plain text, no [Topic:X] or [Chapter:Y] tags).",
    "Use these **bold** section headers in order:",
    "  **Theory** — Genki I concepts only; cap at 10 minutes of reading/study.",
    "  **Application** — Workbook practice (pages 11+ for script) or writing exercises.",
    "  **Playful Learning** — Suggest auditory/visual aids (hiragana song, stroke-order video,",
    "    Forvo pronunciation). EXPLAIN how to use each aid (HOW + WHEN relative to the session).",
    "  **Methodology** — Brief synergy: why each material is used and the order of operations.",
    "",
    "── GLOSSARY TERM TAGS (mandatory in Part 1) ──",
    "Part 1 MUST include at least 3 terms wrapped in [TERM:term].",
    "Do not use markdown inside the tag. Format: [TERM:term] only.",
    "Example: 'Use [TERM:genkouyoushi] for your writing practice.'",
    "Tag tools, scripts, grammar labels, and study resources",
    "(e.g. [TERM:hiragana], [TERM:katakana], [TERM:desu]).",
    "Do NOT use [Topic:X] or [Chapter:Y] tags anywhere in Part 1.",
    "",
    "── PLAYFUL LEARNING ──",
    "- Frequently suggest external auditory/visual aids to make the session engaging.",
    "- Each aid must include: what it is, HOW to use it, and WHEN in the session.",
    "- Example: \"Listen to a hiragana song while writing to sync audio with motion.\"",
    "",
    "── SESSION DURATION ──",
    "- Total session (Theory + Application + Playful Learning) MUST be 20–35 minutes.",
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
  dayNumber: number,
  currentProgress: CurrentProgress,
  history: TaskHistoryEntry[] = []
): string {
  const historyText =
    history.length === 0
      ? "No prior tasks completed yet. This is the user's first day."
      : history
          .map(
            (h) =>
              `Day ${h.day_number}: "${h.title}"\nInstructions: ${h.instructions.slice(0, 800)}\nReflection: ${h.reflection_notes || "None"}`
          )
          .join("\n\n");

  return [
    `Learning goal: ${topic}`,
    `Current day number: ${dayNumber}`,
    `Current chapter: ${currentProgress.chapter}`,
    `Mastered topics: ${currentProgress.masteredTopics.join(", ") || "none yet"}`,
    "",
    "Recent task history:",
    historyText,
    "",
    `Generate Day ${dayNumber}'s comprehensive study session.`,
    "Output Part 1 (Markdown starting with # Day {N}: ...) then Part 2 (raw JSON metadata at the very end).",
  ].join("\n");
}
