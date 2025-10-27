import { EstimateLLMOutput } from "@/server/llm/schema";

export type EstimateDTO = {
  id: string;
  projectName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  inputText: string;
  platformWeb: boolean;
  platformMobile: boolean;
  summary: EstimateLLMOutput["summary"];
  modules: Array<{
    id: string;
    name: string;
    description: string;
    size: string;
    rationale: string;
    points: number;
    sortOrder: number;
  }>;
  risks: Array<{
    id: string;
    title: string;
    detail: string;
    severity: string;
    sortOrder: number;
  }>;
  missingItems: Array<{
    id: string;
    question: string;
    category: string | null;
    sortOrder: number;
  }>;
  totals: {
    moduleCount: number;
    totalPoints: number;
    riskCount: number;
    missingCount: number;
  };
};
