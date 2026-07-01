export const AI_MODEL = "gpt-4o-mini";
export const PROMPT_VERSION = "v9";

export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}
