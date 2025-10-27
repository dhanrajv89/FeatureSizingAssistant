import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import { env } from "@/env";

export type SupportedChatModel = ChatOpenAI | ChatGoogleGenerativeAI;

export const createLLMClient = (): SupportedChatModel => {
  if (env.LLM_PROVIDER === "openai") {
    return new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      model: env.LLM_MODEL,
      temperature: 0.2,
      maxRetries: 2,
      timeout: env.LLM_TIMEOUT_MS,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY!,
    model: env.LLM_MODEL,
    temperature: 0.2,
    maxOutputTokens: 2048,
    maxRetries: 2,
  });
};
