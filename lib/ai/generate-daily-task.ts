import { getOpenAIApiKey, AI_MODEL, PROMPT_VERSION } from "./client";
import { buildSystemPrompt, buildUserPrompt, type GenerationContext } from "./prompts";
import { aiTaskResponseSchema, type AiTaskResponse } from "@/lib/validations/schemas";
import type { LearningTrack } from "@/types/database";

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

function buildFallbackTask(
  track: LearningTrack,
  dayNumber: number
): AiTaskResponse {
  return {
    title: `Day ${dayNumber}: Explore ${track.title}`,
    instructions: `Spend 20 minutes practicing the fundamentals of ${track.title}. Write down what you learned, any questions you have, and one thing to focus on tomorrow.`,
    estimated_minutes: 20,
    difficulty_level: Math.min(dayNumber, 5),
    rationale: "Fallback task generated when AI is unavailable",
  };
}

/** Edge-compatible OpenAI call using fetch (no Node.js SDK). */
export async function generateDailyTask(
  ctx: GenerationContext
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
    const fallback = buildFallbackTask(ctx.track, ctx.dayNumber);
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
