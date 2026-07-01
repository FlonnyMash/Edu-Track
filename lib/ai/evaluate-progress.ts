import { getOpenAIApiKey, AI_MODEL } from "./client";
import type { CurrentProgress } from "./prompts";
import {
  progressionEvaluationSchema,
  type ProgressionEvaluation,
} from "@/lib/validations/schemas";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const EVALUATION_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "progression_evaluation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        chapter: { type: "string" },
        action: { type: "string", enum: ["advance", "stay", "review"] },
        mastered_topics: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["chapter", "action", "mastered_topics"],
      additionalProperties: false,
    },
  },
};

function buildEvaluationPrompt(
  taskTitle: string,
  taskInstructions: string,
  reflectionNotes: string | null,
  currentProgress: CurrentProgress,
  learningMaterials: string[]
): string {
  const materials =
    learningMaterials.length > 0
      ? learningMaterials.join(", ")
      : "unspecified materials";

  return [
    "You evaluate whether a Japanese learner should advance in their curriculum.",
    "",
    `Learning materials: ${materials}`,
    `Current chapter: ${currentProgress.chapter}`,
    `Mastered topics: ${currentProgress.masteredTopics.join(", ") || "none yet"}`,
    "",
    `Completed task title: ${taskTitle}`,
    `Task content: ${taskInstructions.slice(0, 1500)}`,
    `User reflection: ${reflectionNotes?.trim() || "No reflection provided."}`,
    "",
    "Decide the next progression step:",
    "- advance: user clearly mastered today's content; move to the next logical chapter/lesson.",
    "- stay: partial mastery; repeat or consolidate within the current chapter.",
    "- review: user struggled; assign review of current or prior chapter.",
    "",
    "Update mastered_topics to include any new topics the user demonstrated today.",
    "Return JSON with chapter (target chapter label), action, and mastered_topics array.",
  ].join("\n");
}

/** Analyzes task completion and reflection to recommend curriculum progression. */
export async function evaluateProgressAfterCompletion(params: {
  taskTitle: string;
  taskInstructions: string;
  reflectionNotes: string | null;
  currentProgress: CurrentProgress;
  learningMaterials: string[];
}): Promise<ProgressionEvaluation> {
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
            role: "user",
            content: buildEvaluationPrompt(
              params.taskTitle,
              params.taskInstructions,
              params.reflectionNotes,
              params.currentProgress,
              params.learningMaterials
            ),
          },
        ],
        response_format: EVALUATION_JSON_SCHEMA,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI evaluation response");
    }

    const parsed = progressionEvaluationSchema.parse(JSON.parse(content));

    return {
      chapter: parsed.chapter,
      action: parsed.action,
      masteredTopics: parsed.mastered_topics,
    };
  } catch (error) {
    console.error("Progress evaluation failed:", error);
    return {
      chapter: params.currentProgress.chapter,
      action: "stay",
      masteredTopics: params.currentProgress.masteredTopics,
    };
  }
}

export function applyProgressionEvaluation(
  current: CurrentProgress,
  evaluation: ProgressionEvaluation
): CurrentProgress {
  const mergedTopics = [
    ...new Set([...current.masteredTopics, ...evaluation.masteredTopics]),
  ];

  if (evaluation.action === "advance") {
    return { chapter: evaluation.chapter, masteredTopics: mergedTopics };
  }

  if (evaluation.action === "review") {
    return { chapter: evaluation.chapter, masteredTopics: mergedTopics };
  }

  return { chapter: current.chapter, masteredTopics: mergedTopics };
}
