import { z } from "zod";

export const moduleSizeSchema = z.enum(["S", "M", "L"]);

export type ModuleSize = z.infer<typeof moduleSizeSchema>;

export const modulePoints: Record<ModuleSize, number> = {
  S: 5,
  M: 13,
  L: 40,
};

export const summarySchema = z.object({
  projectName: z.string(),
  overallSizing: moduleSizeSchema,
  assumptions: z.array(z.string()).min(0).max(8),
});

export const moduleSchema = z.object({
  name: z.string(),
  description: z.string(),
  size: moduleSizeSchema,
  rationale: z.string(),
  points: z.coerce.number().int().positive(),
});

export const riskSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: z.enum(["Low", "Medium", "High"]),
});

export const missingItemSchema = z.object({
  question: z.string(),
  category: z.enum([
    "Requirement",
    "Integration",
    "Security",
    "Performance",
    "Non-functional",
    "Other",
  ]),
});

export const estimateOutputSchema = z.object({
  summary: summarySchema,
  modules: z.array(moduleSchema).min(3).max(5),
  risks: z.array(riskSchema).min(1),
  missingItems: z.array(missingItemSchema).min(2),
});

export type EstimateLLMOutput = z.infer<typeof estimateOutputSchema>;
