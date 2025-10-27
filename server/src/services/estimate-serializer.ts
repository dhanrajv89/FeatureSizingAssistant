import { parseEstimateResult } from "./estimate-helpers";
import { EstimateWithRelations } from "./estimate-service";
import { EstimateDTO } from "@/types/estimates";

const toIso = (value: Date) => value.toISOString();

export const toEstimateDTO = (estimate: EstimateWithRelations): EstimateDTO => {
  const result = parseEstimateResult(estimate.resultJson);

  const modules = estimate.modules.map((module) => ({
    id: module.id,
    name: module.name,
    description: module.description,
    size: module.size,
    rationale: module.rationale,
    points: module.points,
    sortOrder: module.sortOrder,
  }));

  const risks = estimate.risks.map((risk) => ({
    id: risk.id,
    title: risk.title,
    detail: risk.detail,
    severity: risk.severity,
    sortOrder: risk.sortOrder,
  }));

  const missingItems = estimate.missingItems.map((missing) => ({
    id: missing.id,
    question: missing.question,
    category: missing.category,
    sortOrder: missing.sortOrder,
  }));

  return {
    id: estimate.id,
    projectName: estimate.projectName,
    version: estimate.version,
    createdAt: toIso(estimate.createdAt),
    updatedAt: toIso(estimate.updatedAt),
    inputText: estimate.inputText,
    platformWeb: estimate.platformWeb,
    platformMobile: estimate.platformMobile,
    summary: result.summary,
    modules,
    risks,
    missingItems,
    totals: {
      moduleCount: modules.length,
      totalPoints: modules.reduce((sum, module) => sum + module.points, 0),
      riskCount: risks.length,
      missingCount: missingItems.length,
    },
  };
};

export const toEstimateListDTO = (estimates: EstimateWithRelations[]) =>
  estimates.map(toEstimateDTO);
