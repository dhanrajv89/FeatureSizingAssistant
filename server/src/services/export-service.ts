import Papa from "papaparse";
import { utils, write } from "xlsx";

import { parseEstimateResult } from "./estimate-helpers";
import { EstimateWithRelations } from "./estimate-service";

const formatDate = (value: Date) => value.toISOString();

export const serializeEstimateToCsv = (estimate: EstimateWithRelations) => {
  const payload = parseEstimateResult(estimate.resultJson);

  const rows: (string | number)[][] = [
    ["Project Name", estimate.projectName],
    ["Version", estimate.version],
    ["Created At", formatDate(estimate.createdAt)],
    ["Overall Size", payload.summary.overallSizing],
    ["Assumptions", payload.summary.assumptions.join("; ") || "None"],
    [],
    ["Modules"],
    ["Name", "Description", "Size", "Points", "Rationale"],
    ...payload.modules.map((module) => [
      module.name,
      module.description,
      module.size,
      module.points,
      module.rationale,
    ]),
    [],
    ["Risks"],
    ["Title", "Detail", "Severity"],
    ...payload.risks.map((risk) => [risk.title, risk.detail, risk.severity]),
    [],
    ["Missing Items"],
    ["Question", "Category"],
    ...payload.missingItems.map((missing) => [
      missing.question,
      missing.category,
    ]),
  ];

  return Papa.unparse(rows, { newline: "\r\n" });
};

export const serializeEstimateToXlsx = (estimate: EstimateWithRelations) => {
  const payload = parseEstimateResult(estimate.resultJson);

  const workbook = utils.book_new();

  const summarySheet = utils.aoa_to_sheet([
    ["Project Name", estimate.projectName],
    ["Version", estimate.version],
    ["Created At", formatDate(estimate.createdAt)],
    ["Overall Size", payload.summary.overallSizing],
    ["Assumptions", payload.summary.assumptions.join("\n") || "None"],
  ]);

  const modulesSheet = utils.aoa_to_sheet([
    ["Name", "Description", "Size", "Points", "Rationale"],
    ...payload.modules.map((module) => [
      module.name,
      module.description,
      module.size,
      module.points,
      module.rationale,
    ]),
  ]);

  const risksSheet = utils.aoa_to_sheet([
    ["Title", "Detail", "Severity"],
    ...payload.risks.map((risk) => [risk.title, risk.detail, risk.severity]),
  ]);

  const missingSheet = utils.aoa_to_sheet([
    ["Question", "Category"],
    ...payload.missingItems.map((missing) => [
      missing.question,
      missing.category,
    ]),
  ]);

  utils.book_append_sheet(workbook, summarySheet, "Summary");
  utils.book_append_sheet(workbook, modulesSheet, "Modules");
  utils.book_append_sheet(workbook, risksSheet, "Risks");
  utils.book_append_sheet(workbook, missingSheet, "Missing Items");

  return write(workbook, { type: "buffer", bookType: "xlsx" });
};
