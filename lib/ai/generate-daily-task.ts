import { getOpenAIApiKey, AI_MODEL, PROMPT_VERSION } from "./client";
import {
  buildMvpCoachPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  type GenerationContext,
} from "./prompts";
import {
  aiMvpTaskResponseSchema,
  aiTaskResponseSchema,
  type AiTaskResponse,
} from "@/lib/validations/schemas";
import type { LearningTrack } from "@/types/database";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const MVP_TASK_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "mvp_daily_task",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["title", "description"],
      additionalProperties: false,
    },
  },
};

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
  { title: string; description: string }
> = {
  1: {
    title: "Day 1: Meet Hiragana (あ–の)",
    description:
      "Spend 20 minutes learning the first 10 hiragana (あ, い, う, え, お, か, き, く, け, こ). Write each character 5 times, say the sound aloud, then quiz yourself by covering the romaji and naming each one.",
  },
  2: {
    title: "Day 2: Hiragana さ–と",
    description:
      "Review yesterday's 10 characters, then learn さ, し, す, せ, そ, た, ち, つ, て, と. Create flashcards on paper and drill them for 10 minutes, then write 5 simple words like あさ (morning) and いぬ (dog).",
  },
  3: {
    title: "Day 3: Hiragana な–ほ",
    description:
      "Quick review of Days 1–2 (5 min). Learn な, に, ぬ, ね, の, は, ひ, ふ, へ, ほ. Practice reading aloud a short hiragana chart row by row, then copy 3 basic greetings: こんにちは, ありがとう, さようなら.",
  },
  4: {
    title: "Day 4: Hiragana ま–よ",
    description:
      "Review all hiragana learned so far (5 min). Learn ま, み, む, め, も, や, ゆ, よ. Write 5 words mixing old and new characters (e.g. ねこ, みず, やま) and read them aloud twice.",
  },
  5: {
    title: "Day 5: Complete Hiragana + Numbers",
    description:
      "Finish remaining hiragana: ら, り, る, れ, ろ, わ, を, ん. Then learn numbers 1–10 (いち–じゅう). Write each number in hiragana and say them in order 3 times.",
  },
};

function getJapaneseFallbackTask(dayNumber: number): {
  title: string;
  description: string;
} {
  const cappedDay = Math.min(Math.max(dayNumber, 1), 5);
  const template = JAPANESE_FALLBACK_TASKS[cappedDay];

  if (dayNumber <= 5) {
    return template;
  }

  return {
    title: `Day ${dayNumber}: Japanese Listening & Recall`,
    description: `Spend 20 minutes on Japanese: review hiragana (5 min), listen to a beginner Japanese podcast or video (10 min), and write 5 new words you heard with their meanings. Focus on one theme (food, travel, or daily life) based on Day ${dayNumber}.`,
  };
}

function buildFallbackTask(
  topic: string,
  dayNumber: number
): { title: string; instructions: string; estimated_minutes: number; difficulty_level: number; rationale: string } {
  const normalizedTopic = topic.toLowerCase();
  const isJapanese =
    normalizedTopic.includes("japanese") || normalizedTopic.includes("日本語");

  if (isJapanese) {
    const fallback = getJapaneseFallbackTask(dayNumber);
    return {
      title: fallback.title,
      instructions: fallback.description,
      estimated_minutes: 20,
      difficulty_level: Math.min(dayNumber, 10),
      rationale: "Japanese-specific fallback task generated when AI is unavailable",
    };
  }

  return {
    title: `Day ${dayNumber}: Explore ${topic}`,
    instructions: `Spend 20 minutes on a focused ${topic} practice session. Choose one sub-topic appropriate for Day ${dayNumber}, take actionable notes, and write one goal for tomorrow.`,
    estimated_minutes: 20,
    difficulty_level: Math.min(dayNumber, 10),
    rationale: "Fallback task generated when AI is unavailable",
  };
}

function normalizeMvpResponse(
  raw: { title: string; description: string },
  topic: string,
  dayNumber: number
): AiTaskResponse {
  return {
    title: raw.title,
    instructions: raw.description,
    estimated_minutes: 20,
    difficulty_level: Math.min(dayNumber, 10),
    rationale: `AI-generated Day ${dayNumber} task for ${topic}`,
  };
}

/** MVP coach prompt — topic + day based generation for the Dashboard planner. */
export async function generateMvpDailyTask(
  topic: string,
  dayNumber: number
): Promise<{ task: AiTaskResponse; metadata: Record<string, unknown> }> {
  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: buildMvpCoachPrompt(topic, dayNumber) }],
        response_format: MVP_TASK_JSON_SCHEMA,
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

    const parsed = aiMvpTaskResponseSchema.parse(JSON.parse(content));
    const task = normalizeMvpResponse(parsed, topic, dayNumber);

    return {
      task,
      metadata: {
        model: AI_MODEL,
        prompt_version: PROMPT_VERSION,
        topic,
        day_number: dayNumber,
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
