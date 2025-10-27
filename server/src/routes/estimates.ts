import { Router } from "express";
import { z } from "zod";

import { AuthenticatedRequest, requireAuth } from "@/auth/middleware";
import { logger } from "@/logger";
import {
  generateAndPersistEstimate,
  getEstimateById,
  listEstimatesForUser,
  listProjectVersions,
  regenerateEstimateVersion,
  deleteEstimate as deleteEstimateRecord,
} from "@/services/estimate-service";
import { serializeEstimateToCsv, serializeEstimateToXlsx } from "@/services/export-service";
import { toEstimateDTO, toEstimateListDTO } from "@/services/estimate-serializer";

const createEstimateSchema = z.object({
  projectName: z.string().min(1),
  inputText: z.string().min(1),
  platformWeb: z.boolean().default(true),
  platformMobile: z.boolean().default(false),
});

const reestimateSchema = z
  .object({
    projectName: z.string().min(1).optional(),
    inputText: z.string().min(1).optional(),
    platformWeb: z.boolean().optional(),
    platformMobile: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.projectName ||
      payload.inputText ||
      typeof payload.platformWeb === "boolean" ||
      typeof payload.platformMobile === "boolean",
    {
      message: "At least one field must be provided",
    },
  );

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const estimates = await listEstimatesForUser(req.user!.id);
  res.json({ estimates: toEstimateListDTO(estimates) });
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const parsed = createEstimateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const estimate = await generateAndPersistEstimate({
      ...parsed.data,
      userId: req.user!.id,
    });

    res.status(201).json({ estimate: toEstimateDTO(estimate) });
  } catch (error) {
    logger.error("Failed to create estimate", error);
    res.status(500).json({ error: "Failed to generate estimate" });
  }
});

router.get("/projects/:projectName/versions", async (req: AuthenticatedRequest, res) => {
  try {
    const projectName = decodeURIComponent(req.params.projectName);
    const estimates = await listProjectVersions(req.user!.id, projectName);
    res.json({ estimates: toEstimateListDTO(estimates) });
  } catch (error) {
    logger.error("Failed to load project versions", error);
    res.status(500).json({ error: "Failed to load project versions" });
  }
});

router.get("/:estimateId", async (req: AuthenticatedRequest, res) => {
  const estimate = await getEstimateById(req.user!.id, req.params.estimateId);
  if (!estimate) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({ estimate: toEstimateDTO(estimate) });
});

router.post("/:estimateId/reestimate", async (req: AuthenticatedRequest, res) => {
  const parsed = reestimateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const estimate = await regenerateEstimateVersion({
      estimateId: req.params.estimateId,
      userId: req.user!.id,
      ...parsed.data,
    });

    res.status(201).json({ estimate: toEstimateDTO(estimate) });
  } catch (error) {
    logger.error("Failed to regenerate estimate", error);
    res.status(500).json({ error: "Failed to re-estimate project" });
  }
});

router.delete("/:estimateId", async (req: AuthenticatedRequest, res) => {
  try {
    await deleteEstimateRecord({
      estimateId: req.params.estimateId,
      userId: req.user!.id,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Estimate not found or access denied") {
      return res.status(404).json({ error: error.message });
    }

    logger.error("Failed to delete estimate", error);
    res.status(500).json({ error: "Failed to delete estimate" });
  }
});

router.get("/:estimateId/export", async (req: AuthenticatedRequest, res) => {
  const format = (req.query.format as string | undefined)?.toLowerCase() ?? "csv";

  if (format !== "csv" && format !== "xlsx") {
    return res.status(400).json({ error: "Unsupported format" });
  }

  const estimate = await getEstimateById(req.user!.id, req.params.estimateId);
  if (!estimate) {
    return res.status(404).json({ error: "Not found" });
  }

  const filenameBase = `${estimate.projectName}-v${estimate.version}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (format === "csv") {
    const csv = serializeEstimateToCsv(estimate);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
    return res.send(csv);
  }

  const xlsxBuffer = serializeEstimateToXlsx(estimate);
  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.header("Content-Disposition", `attachment; filename="${filenameBase}.xlsx"`);
  return res.send(xlsxBuffer);
});

export const apiEstimatesRouter = router;
