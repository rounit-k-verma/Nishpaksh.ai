const rawApiBase = process.env.NEXT_PUBLIC_API_BASE;
export const API_BASE = rawApiBase?.replace(/\/+$/, "") ?? "";

function apiPath(path: string): string {
  if (API_BASE) return `${API_BASE}${path}`;
  if (path === "/health") return "/health";
  if (path.startsWith("/api/")) return `/api/backend${path.slice(4)}`;
  return `/api/backend${path}`;
}

export type AuditResult = {
  model_accuracy: number;
  selection_rate_by_gender: Record<string, number>;
  disparate_impact_ratio: number;
  confusion_matrix_by_group: Record<string, { tn: number; fp: number; fn: number; tp: number }>;
  feature_importance: { feature: string; importance: number }[];
  recommendations: string[];
};

export async function runAudit(file: File, targetColumn = "selected", sensitiveColumn = "gender") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_column", targetColumn);
  formData.append("sensitive_column", sensitiveColumn);

  const response = await fetch(apiPath("/api/audit"), {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return (await response.json()) as AuditResult;
}

export async function simulate(features: Record<string, string | number>) {
  const response = await fetch(apiPath("/api/simulate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features })
  });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return (await response.json()) as { prediction: number; probability: number };
}

export async function checkBackendHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(apiPath("/health"), {
      method: "GET",
      cache: "no-store",
      signal
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { status?: string };
    return body?.status === "ok";
  } catch {
    return false;
  }
}

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    if (body?.detail) return body.detail;
  } catch {
    // Ignore JSON parsing failures and fallback to plain text.
  }

  const text = await response.text();
  return text || `API request failed with status ${response.status}`;
}
