import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_URL: z.string().url().default("http://localhost:5173"),
    SERVER_URL: z.string().url().default("http://localhost:4000"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    ENABLE_PROMPT_LOGS: z.coerce.boolean().default(false),
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    AUTH_JWT_SECRET: z.string().min(1, "AUTH_JWT_SECRET is required"),
    AUTH_JWT_EXPIRES_IN: z.string().default("7d"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    LLM_PROVIDER: z.enum(["openai", "gemini"]),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    LLM_MODEL: z.string().min(1, "LLM_MODEL is required"),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required when LLM_PROVIDER is openai",
        path: ["OPENAI_API_KEY"],
      });
    }

    if (data.LLM_PROVIDER === "gemini" && !data.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GEMINI_API_KEY is required when LLM_PROVIDER is gemini",
        path: ["GEMINI_API_KEY"],
      });
    }
  });

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  SERVER_URL: process.env.SERVER_URL,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ENABLE_PROMPT_LOGS: process.env.ENABLE_PROMPT_LOGS,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ?? process.env.AUTH_SECRET,
  AUTH_JWT_EXPIRES_IN: process.env.AUTH_JWT_EXPIRES_IN,
  DATABASE_URL: process.env.DATABASE_URL,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  LLM_TIMEOUT_MS: process.env.LLM_TIMEOUT_MS,
});

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
