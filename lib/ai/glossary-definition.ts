import { getOpenAIApiKey, AI_MODEL } from "./client";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const DEFINITION_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "term_definition",
    strict: true,
    schema: {
      type: "object",
      properties: {
        definition: { type: "string" },
      },
      required: ["definition"],
      additionalProperties: false,
    },
  },
};

/** Generates a concise Japanese-learning glossary entry via OpenAI. */
export async function generateGlossaryDefinition(term: string): Promise<string> {
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
          content: [
            `Define "${term}" for a beginner Japanese learner.`,
            "Write exactly two concise sentences.",
            "Explain what it is and how it is used in study practice.",
            'Return JSON: { "definition": string }.',
          ].join(" "),
        },
      ],
      response_format: DEFINITION_JSON_SCHEMA,
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
    throw new Error("Empty glossary definition response");
  }

  const parsed = JSON.parse(content) as { definition: string };
  return parsed.definition.trim();
}
