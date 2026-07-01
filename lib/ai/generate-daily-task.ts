import { getOpenAIApiKey, AI_MODEL, PROMPT_VERSION } from "./client";
import {
  buildMvpUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  getDailyTaskPrompt,
  type GenerationContext,
  type TaskHistoryEntry,
} from "./prompts";
import { parseTwoPartSession } from "./parse-session-response";
import {
  aiTaskResponseSchema,
  type AiTaskResponse,
} from "@/lib/validations/schemas";
import type { CurrentProgress } from "./prompts";
import type { GlossaryEntry } from "@/lib/glossary/types";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const TASK_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "daily_task",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        estimated_minutes: { type: "integer" },
        difficulty_level: { type: "integer" },
        rationale: { type: "string" },
      },
      required: [
        "title",
        "instructions",
        "estimated_minutes",
        "difficulty_level",
        "rationale",
      ],
      additionalProperties: false,
    },
  },
};

const JAPANESE_FALLBACK_TASKS: Record<
  number,
  { title: string; description: string; estimated_minutes: number }
> = {
  1: {
    title: "Day 1: Hiragana Foundations (あ–の)",
    description:
      "Based on our progress, today we are focusing on [TERM:hiragana] recognition, moving us closer to completing the script.\n\n" +
      "**Theory** (max 10 min)\nOpen Genki I pp. 20–25. Learn あ, い, う, え, お, か, き, く, け, こ. Read each aloud twice.\n\n" +
      "**Application**\nOn [TERM:genkouyoushi], write each character 5× with correct stroke order (mandatory handwriting). Then Genki I Workbook p. 11, exercises 1–3 only.\n\n" +
      "**Playful Learning**\nWatch a hiragana stroke-order video for あ–こ. Pause after each character and mimic the motion on paper — sync audio with your hand.\n\n" +
      "**Methodology**\nTextbook first builds sound–shape links; Workbook p. 11+ reinforces recall; the video adds motor memory without rushing ahead.",
    estimated_minutes: 28,
  },
  2: {
    title: "Day 2: Hiragana さ–と",
    description:
      "Based on our progress, today we are focusing on the next [TERM:hiragana] rows, building on Day 1.\n\n" +
      "**Theory** (max 10 min)\nReview あ–こ from Genki I, then learn さ, し, す, せ, そ, た, ち, つ, て, と (pp. 26–27).\n\n" +
      "**Application**\nWrite each new character 5× on [TERM:genkouyoushi] (mandatory handwriting). Complete Genki I Workbook p. 11–12, exercises 4–6.\n\n" +
      "**Playful Learning**\nListen to a hiragana song covering さ–と while reviewing your flashcards. Say each sound as it plays.\n\n" +
      "**Methodology**\nReview before adding new characters avoids mixing similar shapes (し vs そ). Workbook p. 11+ locks in muscle memory.",
    estimated_minutes: 30,
  },
  3: {
    title: "Day 3: Hiragana な–ほ",
    description:
      "Based on our progress, today we are focusing on な–ほ rows of [TERM:hiragana].\n\n" +
      "**Theory** (max 10 min)\nQuick review of Days 1–2, then learn な–ほ from Genki I pp. 28–29.\n\n" +
      "**Application**\nHandwrite each new character on [TERM:genkouyoushi] (mandatory). Workbook p. 12–13. Copy 3 greetings: こんにちは, ありがとう, さようなら.\n\n" +
      "**Playful Learning**\nUse Forvo to hear native pronunciation of the three greetings — repeat each twice after listening.\n\n" +
      "**Methodology**\nReading and writing aloud connects visual recognition with pronunciation before grammar begins.",
    estimated_minutes: 28,
  },
  4: {
    title: "Day 4: Hiragana ま–よ",
    description:
      "Based on our progress, today we are focusing on ま–よ and consolidating [TERM:hiragana] learned so far.\n\n" +
      "**Theory** (max 10 min)\nReview all hiragana learned, then learn ま, み, む, め, も, や, ゆ, よ (Genki I pp. 30–31).\n\n" +
      "**Application**\nWrite 5 words on [TERM:genkouyoushi] (ねこ, みず, やま) — mandatory handwriting. Workbook p. 13.\n\n" +
      "**Playful Learning**\nWatch a stroke-order video for や, ゆ, よ — these differ from other rows; mimic each stroke slowly.\n\n" +
      "**Methodology**\nMixing characters in words mirrors real reading, not just isolated drills.",
    estimated_minutes: 30,
  },
  5: {
    title: "Day 5: Complete Hiragana + Numbers",
    description:
      "Based on our progress, today we finish [TERM:hiragana] and learn numbers 1–10.\n\n" +
      "**Theory** (max 10 min)\nFinish remaining hiragana: ら–ん (Genki I pp. 32–33). Learn いち–じゅう.\n\n" +
      "**Application**\nHandwrite each number in hiragana on [TERM:genkouyoushi] (mandatory). Workbook p. 14. Say numbers in order 3 times.\n\n" +
      "**Playful Learning**\nListen to a Japanese counting song (1–10) and write each number as you hear it.\n\n" +
      "**Methodology**\nNumbers appear everywhere in daily Japanese — lock them in before Lesson 1 grammar.",
    estimated_minutes: 32,
  },
};

function getJapaneseFallbackTask(dayNumber: number): {
  title: string;
  description: string;
  estimated_minutes: number;
} {
  const cappedDay = Math.min(Math.max(dayNumber, 1), 5);
  const template = JAPANESE_FALLBACK_TASKS[cappedDay];

  if (dayNumber <= 5) {
    return template;
  }

  return {
    title: `Day ${dayNumber}: Japanese Listening & Recall`,
    description:
      "Based on our progress, today we consolidate script knowledge before advancing.\n\n" +
      "**Theory**\nReview [TERM:hiragana] from prior days (5 min).\n\n" +
      "**Application**\nWrite 10 characters from memory on [TERM:genkouyoushi]. Listen to a beginner podcast (10 min); write 5 new words with meanings.\n\n" +
      "**Playful Learning**\nUse Jisho.org to verify word meanings — search each word and read the first definition aloud.\n\n" +
      "**Methodology**\nListening connects script knowledge to real speech patterns.",
    estimated_minutes: 30,
  };
}

function clampSessionMinutes(minutes: number): number {
  return Math.min(35, Math.max(20, Math.round(minutes)));
}

function buildFallbackTask(
  topic: string,
  dayNumber: number
): {
  title: string;
  instructions: string;
  estimated_minutes: number;
  difficulty_level: number;
  rationale: string;
} {
  const normalizedTopic = topic.toLowerCase();
  const isJapanese =
    normalizedTopic.includes("japanese") || normalizedTopic.includes("日本語");

  if (isJapanese) {
    const fallback = getJapaneseFallbackTask(dayNumber);
    return {
      title: fallback.title,
      instructions: fallback.description,
      estimated_minutes: fallback.estimated_minutes,
      difficulty_level: Math.min(dayNumber, 10),
      rationale: "Japanese-specific fallback task generated when AI is unavailable",
    };
  }

  return {
    title: `Day ${dayNumber}: Explore ${topic}`,
    instructions:
      `Based on our progress, today we take the next small step in ${topic}.\n\n` +
      "**Theory**\nChoose one sub-topic appropriate for this day.\n\n" +
      "**Application**\nTake actionable notes and practice for 15 minutes.\n\n" +
      "**Methodology**\nBuild incrementally — one concept per session.",
    estimated_minutes: 25,
    difficulty_level: Math.min(dayNumber, 10),
    rationale: "Fallback task generated when AI is unavailable",
  };
}

function normalizeParsedSession(
  parsed: ReturnType<typeof parseTwoPartSession>,
  topic: string,
  dayNumber: number
): AiTaskResponse {
  return {
    title: parsed.title,
    instructions: parsed.humanReadable,
    estimated_minutes: clampSessionMinutes(parsed.metadata.estimated_duration),
    difficulty_level: Math.min(dayNumber, 10),
    rationale: `AI-generated Day ${dayNumber} task for ${topic}`,
  };
}

/** Material-aware daily task generation for the Dashboard planner. */
export async function generateMvpDailyTask(
  topic: string,
  dayNumber: number,
  learningMaterials?: string | string[] | null,
  currentProgress?: CurrentProgress,
  history: TaskHistoryEntry[] = [],
  glossaryEntries: GlossaryEntry[] = []
): Promise<{ task: AiTaskResponse; metadata: Record<string, unknown> }> {
  const progress: CurrentProgress = currentProgress ?? {
    chapter: "Hiragana",
    masteredTopics: [],
  };

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: getDailyTaskPrompt(
              learningMaterials,
              progress,
              dayNumber,
              glossaryEntries
            ),
          },
          {
            role: "user",
            content: buildMvpUserPrompt(topic, dayNumber, progress, history),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = parseTwoPartSession(content, dayNumber);
    const task = normalizeParsedSession(parsed, topic, dayNumber);

    return {
      task,
      metadata: {
        model: AI_MODEL,
        prompt_version: PROMPT_VERSION,
        topic: parsed.metadata.topic,
        day_number: dayNumber,
        current_progress: progress,
        recommend_progression: {
          chapter: parsed.metadata.chapter,
          action: parsed.metadata.next_recommended_action,
        },
        session_metadata: parsed.metadata,
        generated_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("AI MVP task generation failed:", error);
    const fallback = buildFallbackTask(topic, dayNumber);
    return {
      task: fallback,
      metadata: {
        model: "fallback",
        prompt_version: PROMPT_VERSION,
        topic,
        day_number: dayNumber,
        generated_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/** Edge-compatible OpenAI call using fetch (no Node.js SDK). */
export async function generateDailyTask(
  ctx: GenerationContext
): Promise<{ task: AiTaskResponse; metadata: Record<string, unknown> }> {
  const topic = ctx.track.title || "Japanese";

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(ctx) },
        ],
        response_format: TASK_JSON_SCHEMA,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = aiTaskResponseSchema.parse(JSON.parse(content));

    return {
      task: parsed,
      metadata: {
        model: AI_MODEL,
        prompt_version: PROMPT_VERSION,
        rationale: parsed.rationale,
        generated_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("AI task generation failed:", error);
    const fallback = buildFallbackTask(topic, ctx.dayNumber);
    return {
      task: fallback,
      metadata: {
        model: "fallback",
        prompt_version: PROMPT_VERSION,
        rationale: fallback.rationale,
        generated_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

