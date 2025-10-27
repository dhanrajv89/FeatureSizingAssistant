import { EstimateDTO } from "@/types/estimates";

type ApiError = {
  message: string;
  details?: unknown;
};

export const getApiBaseUrl = () => {
  const base = import.meta.env.VITE_API_URL;
  return base ? base.replace(/\/+$/, "") : "";
};

export const getApiUrl = (path: string) => `${getApiBaseUrl()}${path}`;

const handleError = async (response: Response): Promise<never> => {
  let message = "Unexpected error";
  let details: unknown;

  try {
    const payload = await response.json();
    message = payload.error ?? payload.message ?? message;
    details = payload;
  } catch {
    // ignore parse errors
  }

  const error: ApiError = { message, details };
  throw error;
};

const apiFetch = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const target = typeof input === "string" ? getApiUrl(input) : input;
  const response = await fetch(target, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json() as Promise<T>;
};

export type CreateEstimatePayload = {
  projectName: string;
  inputText: string;
  platformWeb: boolean;
  platformMobile: boolean;
};

export type ReestimatePayload = Partial<CreateEstimatePayload>;

export const getEstimates = () =>
  apiFetch<{ estimates: EstimateDTO[] }>("/api/estimates");

export const createEstimate = (payload: CreateEstimatePayload) =>
  apiFetch<{ estimate: EstimateDTO }>("/api/estimates", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getEstimate = (estimateId: string) =>
  apiFetch<{ estimate: EstimateDTO }>(`/api/estimates/${estimateId}`);

export const reestimate = (estimateId: string, payload: ReestimatePayload) =>
  apiFetch<{ estimate: EstimateDTO }>(`/api/estimates/${estimateId}/reestimate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteEstimate = (estimateId: string) =>
  apiFetch<{ success: boolean }>(`/api/estimates/${estimateId}`, {
    method: "DELETE",
  });

export const getProjectVersions = (projectName: string) =>
  apiFetch<{ estimates: EstimateDTO[] }>(
    `/api/estimates/projects/${encodeURIComponent(projectName)}/versions`,
  );
