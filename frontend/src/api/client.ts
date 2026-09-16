// ResiliNet – API client

import type {
  InfrastructureAsset,
  NetworkData,
  SimulationResult,
  CriticalAssetResponse,
  ImpactMetrics,
  InterventionType,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getAssets: () => request<InfrastructureAsset[]>("/assets"),

  getNetwork: () => request<NetworkData>("/network"),

  simulateFailure: (assetId: string) =>
    request<SimulationResult>("/simulate/failure", {
      method: "POST",
      body: JSON.stringify({ asset_id: assetId }),
    }),

  simulateIntervention: (
    assetId: string,
    interventionType: InterventionType,
    targetAssetId?: string | null
  ) =>
    request<SimulationResult>("/simulate/intervention", {
      method: "POST",
      body: JSON.stringify({
        asset_id: assetId,
        intervention_type: interventionType,
        target_asset_id: targetAssetId || null,
      }),
    }),

  getScenario: (id: string) => request<SimulationResult>(`/scenario/${id}`),

  getCriticalAssets: () => request<CriticalAssetResponse[]>("/critical-assets"),

  getBaselineMetrics: () => request<ImpactMetrics>("/baseline-metrics"),

  resetSimulation: () => request<{ message: string }>("/reset", { method: "POST" }),
};
