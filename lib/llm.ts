import OpenAI from "openai";

// Nebius Token Factory is OpenAI-compatible. Override any of these in .env.local.
export const AGENT_MODEL = process.env.AGENT_MODEL ?? "Qwen/Qwen3-30B-A3B-Instruct-2507";
export const COACH_MODEL = process.env.COACH_MODEL ?? "Qwen/Qwen3-235B-A22B-Instruct-2507";

let client: OpenAI | null = null;

export function llm(): OpenAI {
  if (!process.env.NEBIUS_API_KEY) {
    throw new Error("NEBIUS_API_KEY is not set. Add it to .env.local and restart the dev server.");
  }
  client ??= new OpenAI({
    apiKey: process.env.NEBIUS_API_KEY,
    baseURL: process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1/",
  });
  return client;
}

/** Some open models emit <think>…</think> reasoning; never show it. */
export const stripThinking = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
