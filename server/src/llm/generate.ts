import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import { jsonrepair } from "jsonrepair";

import { env } from "@/env";
import { logger } from "@/logger";

import { createLLMClient } from "./client";
import { systemPrompt, userPromptTemplate } from "./prompt";
import {
  EstimateLLMOutput,
  ModuleSize,
  estimateOutputSchema,
  modulePoints,
} from "./schema";

type GenerateEstimateParams = {
  projectName: string;
  inputText: string;
  platformWeb: boolean;
  platformMobile: boolean;
};

type GenerateEstimateOptions = {
  previousEstimate?: {
    version: number;
    data: EstimateLLMOutput;
  };
};

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    userPromptTemplate
      .replace("{{projectName}}", "{projectName}")
      .replace("{{inputText}}", "{inputText}")
      .replace("{{platformWeb}}", "{platformWeb}")
      .replace("{{platformMobile}}", "{platformMobile}")
      .replace("{{previousContext}}", "{previousContext}"),
  ],
]);

const extractMessageContent = (message: unknown): string => {
  if (typeof message === "string") {
    return message;
  }

  if (message instanceof AIMessage) {
    if (typeof message.content === "string") {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      return message.content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          if (typeof part === "object" && part !== null) {
            if ("text" in part && typeof (part as { text?: unknown }).text === "string") {
              return (part as { text: string }).text;
            }

            if ("value" in part && typeof (part as { value?: unknown }).value === "string") {
              return (part as { value: string }).value;
            }
          }

          return "";
        })
        .join("");
    }
  }

  if (
    typeof message === "object" &&
    message !== null &&
    "content" in message &&
    typeof (message as { content: unknown }).content === "string"
  ) {
    return (message as { content: string }).content;
  }

  return JSON.stringify(message);
};

const cleanJsonString = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/```json/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
};

const deriveOverallSizing = (modules: Array<{ size: ModuleSize }>): ModuleSize => {
  if (modules.some((module) => module.size === "L")) {
    return "L";
  }

  if (modules.some((module) => module.size === "M")) {
    return "M";
  }

  return "S";
};

const toTrimmedString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const asModuleSize = (value: unknown): ModuleSize | null => {
  if (value === "S" || value === "M" || value === "L") {
    return value;
  }
  return null;
};

const asRiskSeverity = (value: unknown): "Low" | "Medium" | "High" => {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }
  return "Medium";
};

type NormalizedModule = {
  name: string;
  description: string;
  size: ModuleSize;
  rationale: string;
  points: number;
};

type NormalizedRisk = {
  title: string;
  detail: string;
  severity: "Low" | "Medium" | "High";
};

type NormalizedMissingItem = {
  question: string;
  category: "Requirement" | "Integration" | "Security" | "Performance" | "Non-functional" | "Other";
};

const createPlaceholderModule = (index: number): NormalizedModule => ({
  name: `Additional discovery module ${index + 1}`,
  description: "Placeholder module added because the AI response omitted enough delivery workstreams.",
  size: "M",
  rationale: "Refine requirements to generate a more precise module breakdown.",
  points: modulePoints.M,
});

const createPlaceholderRisk = (): NormalizedRisk => ({
  title: "Scope clarity risk",
  detail: "The AI response did not include explicit risks; clarify requirements and dependencies to validate delivery scope.",
  severity: "Medium",
});

const placeholderMissingItems: NormalizedMissingItem[] = [
  {
    question: "What non-functional requirements (performance, security, compliance) are in scope?",
    category: "Non-functional",
  },
  {
    question: "Are there integrations with existing property management, CRM, or payment systems?",
    category: "Integration",
  },
  {
    question: "What are the target user roles and access levels for the application?",
    category: "Requirement",
  },
];

const normalizeLLMOutput = (
  raw: unknown,
  input: GenerateEstimateParams,
): EstimateLLMOutput => {
  const root = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawModules = Array.isArray(root.modules) ? root.modules.slice(0, 5) : [];
  const modules: NormalizedModule[] = rawModules
    .map((entry, index) => {
      const record = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
      const size = asModuleSize(record.size) ?? "M";
      const name = toTrimmedString(record.name) || `Module ${index + 1}`;
      const description = toTrimmedString(record.description) || toTrimmedString(record.rationale) || "Details not provided. Update the estimate to refine this module.";
      const rationale = toTrimmedString(record.rationale) || "Specify rationale to explain complexity and dependencies.";

      return {
        name,
        description,
        size,
        rationale,
        points: modulePoints[size],
      };
    })
    .filter((module) => module.name || module.description);

  while (modules.length < 3) {
    modules.push(createPlaceholderModule(modules.length));
  }

  const rawRisks = Array.isArray(root.risks) ? root.risks : [];
  const risks: NormalizedRisk[] = rawRisks
    .map((entry, index) => {
      const record = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
      const title = toTrimmedString(record.title) || `Risk ${index + 1}`;
      const detail =
        toTrimmedString(record.detail) ||
        "Risk detail missing from AI response. Validate dependencies, integrations, and delivery constraints.";

      return {
        title,
        detail,
        severity: asRiskSeverity(record.severity),
      };
    })
    .filter((risk) => risk.title || risk.detail);

  if (risks.length === 0) {
    risks.push(createPlaceholderRisk());
  }

  const rawMissing = Array.isArray(root.missingItems) ? root.missingItems : [];
  const missingItems: NormalizedMissingItem[] = rawMissing
    .map((entry, index) => {
      const record = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
      const question =
        toTrimmedString(record.question) ||
        `Additional clarification ${index + 1}: provide more detail to finalize the estimate.`;
      const category = record.category;

      const normalizedCategory: NormalizedMissingItem["category"] =
        category === "Requirement" ||
        category === "Integration" ||
        category === "Security" ||
        category === "Performance" ||
        category === "Non-functional" ||
        category === "Other"
          ? category
          : "Other";

      return {
        question,
        category: normalizedCategory,
      };
    })
    .filter((item) => item.question);

  while (missingItems.length < 2) {
    const index = missingItems.length;
    missingItems.push(placeholderMissingItems[index % placeholderMissingItems.length]);
  }

  const summaryRecord = (typeof root.summary === "object" && root.summary !== null
    ? (root.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const assumptions = Array.isArray(summaryRecord.assumptions)
    ? summaryRecord.assumptions.map(toTrimmedString).filter(Boolean).slice(0, 8)
    : [];

  const summaryProjectName = toTrimmedString(summaryRecord.projectName) || input.projectName;
  const summarySizing = asModuleSize(summaryRecord.overallSizing) ?? deriveOverallSizing(modules);

  return {
    summary: {
      projectName: summaryProjectName,
      overallSizing: summarySizing,
      assumptions,
    },
    modules,
    risks,
  missingItems,
  };
};

const buildPreviousContext = (options: GenerateEstimateOptions["previousEstimate"]): string => {
  if (!options) {
    return "No previous estimate. Treat this as a fresh sizing.";
  }

  const { version, data } = options;
  const lines: string[] = [];
  lines.push(`Reference version: v${version}`);

  if (data.summary.assumptions.length > 0) {
    lines.push("Key assumptions:");
    data.summary.assumptions.slice(0, 5).forEach((assumption, index) => {
      lines.push(`${index + 1}. ${assumption}`);
    });
  }

  if (data.modules.length > 0) {
    lines.push("Existing modules:");
    data.modules.slice(0, 6).forEach((module, index) => {
      lines.push(
        `${index + 1}. ${module.name} [${module.size}/${module.points} pts] - ${module.description}`,
      );
    });
  }

  if (data.risks.length > 0) {
    lines.push("Existing risks to revisit:");
    data.risks.slice(0, 4).forEach((risk, index) => {
      lines.push(`${index + 1}. ${risk.title} (${risk.severity}) - ${risk.detail}`);
    });
  }

  if (data.missingItems.length > 0) {
    lines.push("Outstanding questions:");
    data.missingItems.slice(0, 4).forEach((missing, index) => {
      lines.push(`${index + 1}. ${missing.question} [${missing.category ?? "Other"}]`);
    });
  }

  lines.push("Update or adjust modules, risks, and questions to reflect the latest scope.");

  return lines.join("\n");
};

export const generateEstimateFromLLM = async (
  input: GenerateEstimateParams,
  options: GenerateEstimateOptions = {},
): Promise<EstimateLLMOutput> => {
  const baseModel = createLLMClient();
  const previousContext = buildPreviousContext(options.previousEstimate);

  if (env.ENABLE_PROMPT_LOGS) {
    logger.debug("Dispatching estimation prompt", {
      projectName: input.projectName,
      platformWeb: input.platformWeb,
      platformMobile: input.platformMobile,
      previousVersion: options.previousEstimate?.version ?? null,
      inputSnippet: input.inputText.slice(0, 120),
    });
  }

  let result: EstimateLLMOutput;

  if (env.LLM_PROVIDER === "openai") {
    const structuredModel = (baseModel as ChatOpenAI).withStructuredOutput(
      estimateOutputSchema,
      { name: "FeatureSizingEstimate" },
    );

    const chain = prompt.pipe(structuredModel);

    const response = await chain.invoke({
      projectName: input.projectName,
      inputText: input.inputText,
      platformWeb: input.platformWeb ? "Yes" : "No",
      platformMobile: input.platformMobile ? "Yes" : "No",
      previousContext,
    });

    result = response;
  } else {
    const chain = prompt.pipe(baseModel);

    const rawResponse = await chain.invoke({
      projectName: input.projectName,
      inputText: input.inputText,
      platformWeb: input.platformWeb ? "Yes" : "No",
      platformMobile: input.platformMobile ? "Yes" : "No",
      previousContext,
    });

    const message = extractMessageContent(rawResponse);
    const cleaned = cleanJsonString(message);
    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      try {
        const repaired = jsonrepair(cleaned);
        logger.warn("Attempted to repair Gemini JSON response", {
          messageSnippet: cleaned.slice(0, 200),
        });
        parsed = JSON.parse(repaired);
      } catch (repairError) {
        logger.error("Failed to parse Gemini response as JSON", {
          messageSnippet: cleaned.slice(0, 200),
          error,
          repairError,
        });
        throw new Error("Gemini returned an invalid JSON response");
      }
    }

    const normalized = normalizeLLMOutput(parsed, input);
    const parsedResult = estimateOutputSchema.safeParse(normalized);

    if (!parsedResult.success) {
      logger.error("Gemini output failed schema validation", {
        issues: parsedResult.error.issues,
        messageSnippet: cleaned.slice(0, 500),
      });
      throw new Error("Gemini returned an incomplete estimate payload");
    }

    result = parsedResult.data;
  }

  const modules = result.modules.map((module) => ({
    ...module,
    points: modulePoints[module.size],
  }));

  const overallSizing = result.summary.overallSizing ?? deriveOverallSizing(modules);
  const assumptions = (result.summary.assumptions ?? []).map((item) => item.trim()).filter(Boolean);

  const validated: EstimateLLMOutput = {
    summary: {
      projectName: result.summary.projectName?.trim() || input.projectName,
      overallSizing,
      assumptions,
    },
    modules,
    risks: result.risks,
    missingItems: result.missingItems,
  };

  if (env.ENABLE_PROMPT_LOGS) {
    logger.debug("LLM estimation completed", {
      projectName: validated.summary.projectName,
      modules: validated.modules.length,
      risks: validated.risks.length,
    });
  }

  return validated;
};
