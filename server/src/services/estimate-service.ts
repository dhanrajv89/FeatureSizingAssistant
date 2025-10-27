import { Prisma, Estimate, Module, MissingItem, Risk } from "@prisma/client";

import { logger } from "@/logger";
import { prisma } from "@/db/client";

import { generateEstimateFromLLM } from "../llm/generate";
import { EstimateLLMOutput, estimateOutputSchema } from "../llm/schema";

export type EstimatePayload = {
  projectName: string;
  inputText: string;
  platformWeb: boolean;
  platformMobile: boolean;
};

export type CreateEstimateInput = EstimatePayload & {
  userId: string;
};

export type ReEstimateInput = Partial<EstimatePayload> & {
  userId: string;
  estimateId: string;
};

export type EstimateWithRelations = Estimate & {
  modules: Module[];
  risks: Risk[];
  missingItems: MissingItem[];
};

const buildResultJson = (result: EstimateLLMOutput): Prisma.JsonObject => ({
  summary: result.summary,
  modules: result.modules,
  risks: result.risks,
  missingItems: result.missingItems,
});

const attachChildren = async (
  estimateId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) =>
  tx.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
      },
      risks: {
        orderBy: { sortOrder: "asc" },
      },
      missingItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

const resolveNextVersion = async (
  tx: Prisma.TransactionClient,
  userId: string,
  projectName: string,
) => {
  const { _max } = await tx.estimate.aggregate({
    where: {
      userId,
      projectName,
    },
    _max: {
      version: true,
    },
  });

  return (_max.version ?? 0) + 1;
};

export const generateAndPersistEstimate = async ({
  userId,
  projectName,
  inputText,
  platformMobile,
  platformWeb,
}: CreateEstimateInput): Promise<EstimateWithRelations> => {
  const llmResult = await generateEstimateFromLLM({
    projectName,
    inputText,
    platformMobile,
    platformWeb,
  });

  return prisma.$transaction(async (tx) => {
    const version = await resolveNextVersion(tx, userId, projectName);

    const estimate = await tx.estimate.create({
      data: {
        userId,
        projectName,
        inputText,
        platformWeb,
        platformMobile,
        resultJson: buildResultJson(llmResult),
        version,
      },
    });

    await Promise.all([
      tx.module.createMany({
        data: llmResult.modules.map((module, index) => ({
          estimateId: estimate.id,
          name: module.name,
          description: module.description,
          size: module.size,
          rationale: module.rationale,
          points: module.points,
          sortOrder: index,
        })),
      }),
      tx.risk.createMany({
        data: llmResult.risks.map((risk, index) => ({
          estimateId: estimate.id,
          title: risk.title,
          detail: risk.detail,
          severity: risk.severity,
          sortOrder: index,
        })),
      }),
      tx.missingItem.createMany({
        data: llmResult.missingItems.map((missing, index) => ({
          estimateId: estimate.id,
          question: missing.question,
          category: missing.category,
          sortOrder: index,
        })),
      }),
    ]);

    logger.info("Created new estimate version", {
      estimateId: estimate.id,
      userId,
      projectName,
      version,
    });

    return attachChildren(estimate.id, tx);
  });
};

export const regenerateEstimateVersion = async ({
  estimateId,
  userId,
  ...updates
}: ReEstimateInput): Promise<EstimateWithRelations> => {
  const existing = await prisma.estimate.findUnique({
    where: { id: estimateId },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Estimate not found or access denied");
  }

  const payload: EstimatePayload = {
    projectName: updates.projectName ?? existing.projectName,
    inputText: updates.inputText ?? existing.inputText,
    platformWeb: updates.platformWeb ?? existing.platformWeb,
    platformMobile: updates.platformMobile ?? existing.platformMobile,
  };

  const previousParsed = estimateOutputSchema.safeParse(existing.resultJson);
  const llmOptions = previousParsed.success
    ? {
        previousEstimate: {
          version: existing.version,
          data: previousParsed.data,
        },
      }
    : undefined;

  const llmResult = await generateEstimateFromLLM(payload, llmOptions);

  return prisma.$transaction(async (tx) => {
    const version = await resolveNextVersion(tx, userId, payload.projectName);

    const estimate = await tx.estimate.create({
      data: {
        userId,
        projectName: payload.projectName,
        inputText: payload.inputText,
        platformWeb: payload.platformWeb,
        platformMobile: payload.platformMobile,
        resultJson: buildResultJson(llmResult),
        version,
      },
    });

    await Promise.all([
      tx.module.createMany({
        data: llmResult.modules.map((module, index) => ({
          estimateId: estimate.id,
          name: module.name,
          description: module.description,
          size: module.size,
          rationale: module.rationale,
          points: module.points,
          sortOrder: index,
        })),
      }),
      tx.risk.createMany({
        data: llmResult.risks.map((risk, index) => ({
          estimateId: estimate.id,
          title: risk.title,
          detail: risk.detail,
          severity: risk.severity,
          sortOrder: index,
        })),
      }),
      tx.missingItem.createMany({
        data: llmResult.missingItems.map((missing, index) => ({
          estimateId: estimate.id,
          question: missing.question,
          category: missing.category,
          sortOrder: index,
        })),
      }),
    ]);

    logger.info("Generated new estimate version", {
      estimateId: estimate.id,
      previousEstimateId: estimateId,
      userId,
      projectName: payload.projectName,
      version,
    });

    return attachChildren(estimate.id, tx);
  });
};

export const deleteEstimate = async ({
  userId,
  estimateId,
}: {
  userId: string;
  estimateId: string;
}): Promise<void> => {
  const existing = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      userId,
    },
  });

  if (!existing) {
    throw new Error("Estimate not found or access denied");
  }

  await prisma.$transaction(async (tx) => {
    await tx.module.deleteMany({ where: { estimateId } });
    await tx.risk.deleteMany({ where: { estimateId } });
    await tx.missingItem.deleteMany({ where: { estimateId } });
    await tx.estimate.delete({ where: { id: estimateId } });
  });

  logger.info("Deleted estimate", {
    estimateId,
    userId,
    projectName: existing.projectName,
    version: existing.version,
  });
};

export const listEstimatesForUser = async (
  userId: string,
): Promise<EstimateWithRelations[]> =>
  prisma.estimate.findMany({
    where: { userId },
    include: {
      modules: { orderBy: { sortOrder: "asc" } },
      risks: { orderBy: { sortOrder: "asc" } },
      missingItems: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

export const getEstimateById = async (
  userId: string,
  estimateId: string,
): Promise<EstimateWithRelations | null> =>
  prisma.estimate.findFirst({
    where: {
      id: estimateId,
      userId,
    },
    include: {
      modules: { orderBy: { sortOrder: "asc" } },
      risks: { orderBy: { sortOrder: "asc" } },
      missingItems: { orderBy: { sortOrder: "asc" } },
    },
  });

export const listProjectVersions = async (
  userId: string,
  projectName: string,
): Promise<EstimateWithRelations[]> =>
  prisma.estimate.findMany({
    where: {
      userId,
      projectName,
    },
    include: {
      modules: { orderBy: { sortOrder: "asc" } },
      risks: { orderBy: { sortOrder: "asc" } },
      missingItems: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ version: "desc" }],
  });
