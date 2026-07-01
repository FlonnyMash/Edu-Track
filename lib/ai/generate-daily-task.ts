import { getOpenAIApiKey, AI_MODEL, PROMPT_VERSION } from "./client";
import {
  buildMvpUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  getDailyTaskPrompt,
  type GenerationContext,
} from "./prompts";
import { parseTwoPartSession } from "./parse-session-response";
import {
  aiTaskResponseSchema,
  type AiTaskResponse,
} from "@/lib/validations/schemas";
import type { CurrentProgress } from "./prompts";
import { getGlossaryContext } from "@/lib/glossary/get-glossary-context";
import { parseLearningMaterials } from "@/lib/profiles/learning-materials";
import { buildProgressContext } from "@/lib/progress/user-progress";
import { createClient } from "@/lib/supabase/server";

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
      "# MAIN QUEST\nBased on our progress, today we are focusing on [TERM:hiragana] recognition, moving us closer to completing the script.\n\n" +
      "**Theory** (max 10 min)\nOpen Genki I pp. 20–25. Read each character aloud twice.\n\n" +
      "あ | a\nい | i\nう | u\nえ | e\nお | o\nか | ka\nき | ki\nく | ku\nけ | ke\nこ | ko\n\n" +
      "**Application**\nOn [TERM:genkouyoushi], write each character 5× with correct stroke order (mandatory handwriting). Then Genki I Workbook p. 11, exercises 1–3 only.\n\n" +
      "**Playful Learning**\nWatch a hiragana stroke-order video for あ–こ. Pause after each character and mimic the motion on paper — sync audio with your hand.\n\n" +
      "**Methodology**\nTextbook first builds sound–shape links; Workbook p. 11+ reinforces recall; the video adds motor memory without rushing ahead.\n\n" +
      "# SIDE QUEST\n**Review**\nFirst session — no prior rows to review yet. Quickly read あ, い, う, え, お aloud once to warm up.\n\n" +
      "**Application**\nSay each A-row sound once while pointing at the matching character.",
    estimated_minutes: 28,
  },
  2: {
    title: "Day 2: Hiragana さ–と",
    description:
      "# MAIN QUEST\nBased on our progress, today we are focusing on the next [TERM:hiragana] rows, building on Day 1.\n\n" +
      "**Theory** (max 10 min)\nLearn from Genki I pp. 26–27. Read each aloud twice.\n\n" +
      "さ | sa\nし | shi\nす | su\nせ | se\nそ | so\nた | ta\nち | chi\nつ | tsu\nて | te\nと | to\n\n" +
      "**Application**\nWrite each new character 5× on [TERM:genkouyoushi] (mandatory handwriting). Complete Genki I Workbook p. 11–12, exercises 4–6.\n\n" +
      "**Playful Learning**\nListen to a hiragana song covering さ–と while reviewing your flashcards. Say each sound as it plays.\n\n" +
      "**Methodology**\nReview before adding new characters avoids mixing similar shapes (し vs そ). Workbook p. 11+ locks in muscle memory.\n\n" +
      "# SIDE QUEST\n**Review**\nBefore writing the new S-row and T-row characters, quickly write the A-row (あ–お) and K-row (か–こ) once each on [TERM:genkouyoushi].\n\n" +
      "**Application**\nRead あ–こ aloud once without looking at romanization.",
    estimated_minutes: 30,
  },
  3: {
    title: "Day 3: Hiragana な–ほ",
    description:
      "# MAIN QUEST\nBased on our progress, today we are focusing on な–ほ rows of [TERM:hiragana].\n\n" +
      "**Theory** (max 10 min)\nLearn from Genki I pp. 28–29. Read each aloud twice.\n\n" +
      "な | na\nに | ni\nぬ | nu\nね | ne\nの | no\nは | ha\nひ | hi\nふ | fu\nへ | he\nほ | ho\n\n" +
      "**Application**\nHandwrite each new character on [TERM:genkouyoushi] (mandatory). Workbook p. 12–13. Copy 3 greetings: こんにちは, ありがとう, さようなら.\n\n" +
      "**Playful Learning**\nUse Forvo to hear native pronunciation of the three greetings — repeat each twice after listening.\n\n" +
      "**Methodology**\nReading and writing aloud connects visual recognition with pronunciation before grammar begins.\n\n" +
      "# SIDE QUEST\n**Review**\nQuickly write the A-row, K-row, and S-row/T-row characters once each before starting today's N-row.\n\n" +
      "**Application**\nCircle any characters you hesitated on and read them aloud again.",
    estimated_minutes: 28,
  },
  4: {
    title: "Day 4: Hiragana ま–よ",
    description:
      "# MAIN QUEST\nBased on our progress, today we are focusing on ま–よ and consolidating [TERM:hiragana] learned so far.\n\n" +
      "**Theory** (max 10 min)\nLearn from Genki I pp. 30–31. Read each aloud twice.\n\n" +
      "ま | ma\nみ | mi\nむ | mu\nめ | me\nも | mo\nや | ya\nゆ | yu\nよ | yo\n\n" +
      "**Application**\nWrite 5 words on [TERM:genkouyoushi] (ねこ, みず, やま) — mandatory handwriting. Workbook p. 13.\n\n" +
      "**Playful Learning**\nWatch a stroke-order video for や, ゆ, よ — these differ from other rows; mimic each stroke slowly.\n\n" +
      "**Methodology**\nMixing characters in words mirrors real reading, not just isolated drills.\n\n" +
      "# SIDE QUEST\n**Review**\nWrite な, に, ぬ, ね, の and は, ひ, ふ, へ, ほ once each from memory before today's M-row and Y-row.\n\n" +
      "**Application**\nRead one older row backward to strengthen recall.",
    estimated_minutes: 30,
  },
  5: {
    title: "Day 5: Complete Hiragana + Numbers",
    description:
      "# MAIN QUEST\nBased on our progress, today we finish [TERM:hiragana] and learn numbers 1–10.\n\n" +
      "**Theory** (max 10 min)\nFinish remaining hiragana from Genki I pp. 32–33, then numbers 1–10.\n\n" +
      "ら | ra\nり | ri\nる | ru\nれ | re\nろ | ro\nわ | wa\nを | wo\nん | n\n" +
      "いち | ichi\nに | ni\nさん | san\nよん | yon\nご | go\nろく | roku\nなな | nana\nはち | hachi\nきゅう | kyuu\nじゅう | juu\n\n" +
      "**Application**\nHandwrite each number in hiragana on [TERM:genkouyoushi] (mandatory). Workbook p. 14. Say numbers in order 3 times.\n\n" +
      "**Playful Learning**\nListen to a Japanese counting song (1–10) and write each number as you hear it.\n\n" +
      "**Methodology**\nNumbers appear everywhere in daily Japanese — lock them in before Lesson 1 grammar.\n\n" +
      "# SIDE QUEST\n**Review**\nQuickly write one character from each row learned so far (あ, か, さ, た, な, は, ま, や, ら) before today's finale.\n\n" +
      "**Application**\nRead the reviewed characters aloud and mark any that need another pass.",
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
      "# MAIN QUEST\nBased on our progress, today we consolidate script knowledge before advancing.\n\n" +
      "**Theory**\nReview [TERM:hiragana] from prior days (5 min).\n\n" +
      "**Application**\nListen to a beginner podcast (10 min); write 5 new words with meanings.\n\n" +
      "**Playful Learning**\nUse Jisho.org to verify word meanings — search each word and read the first definition aloud.\n\n" +
      "**Methodology**\nListening connects script knowledge to real speech patterns.\n\n" +
      "# SIDE QUEST\n**Review**\nWrite 10 characters from earlier rows from memory on [TERM:genkouyoushi] before listening practice.\n\n" +
      "**Application**\nRepeat any missed characters once after checking a visual reference.",
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
      `# MAIN QUEST\nBased on our progress, today we take the next small step in ${topic}.\n\n` +
      "**Theory**\nChoose one sub-topic appropriate for this day.\n\n" +
      "**Application**\nTake actionable notes and practice for 15 minutes.\n\n" +
      "**Playful Learning**\nUse one lightweight resource that makes the topic more memorable.\n\n" +
      "**Methodology**\nBuild incrementally — one concept per session.\n\n" +
      "# SIDE QUEST\n**Review**\nReview one previously learned idea for 3–5 minutes.\n\n" +
      "**Application**\nWrite a short note connecting the review idea to today's Main Quest.",
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

async function fetchActiveLearningMaterial(userId: string): Promise<{
  activeMaterial: string;
  materials: string[];
}> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("learning_material")
    .eq("id", userId)
    .single();

  const materials = parseLearningMaterials(profile?.learning_material);
  const activeMaterial = materials.length > 0 ? materials.join(", ") : "";

  return { activeMaterial, materials };
}

/** Material-aware daily task generation for the Dashboard planner. */
export async function generateMvpDailyTask(
  userId: string,
  topic: string,
  dayNumber: number
): Promise<{ task: AiTaskResponse; metadata: Record<string, unknown> }> {
  const [progressContext, glossaryEntries, { activeMaterial, materials }] =
    await Promise.all([
      buildProgressContext(userId, dayNumber),
      getGlossaryContext(),
      fetchActiveLearningMaterial(userId),
    ]);

  const isFreshStart =
    progressContext.currentDay === 1 &&
    progressContext.previouslyLearnedTerms.length === 0 &&
    progressContext.recentPerformance.completedTaskCount === 0;

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
              activeMaterial,
              materials,
              progressContext,
              glossaryEntries
            ),
          },
          {
            role: "user",
            content: buildMvpUserPrompt(topic, progressContext),
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
        active_material: activeMaterial || null,
        topic: parsed.metadata.topic,
        day_number: dayNumber,
        progress_context: progressContext,
        progress_source: isFreshStart ? "default_day_1" : "user_history",
        current_progress: {
          chapter: progressContext.currentChapter,
          masteredTopics: progressContext.masteredTopics,
        } satisfies CurrentProgress,
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
        progress_context: progressContext,
        progress_source: isFreshStart ? "default_day_1" : "user_history",
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

