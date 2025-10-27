import { Prisma } from "@prisma/client";

import { estimateOutputSchema, EstimateLLMOutput } from "../llm/schema";

export const parseEstimateResult = (resultJson: Prisma.JsonValue): EstimateLLMOutput =>
  estimateOutputSchema.parse(resultJson);
