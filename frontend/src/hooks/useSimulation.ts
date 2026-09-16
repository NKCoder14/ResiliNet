// ResiliNet – Central simulation state hook

import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import type {
  InfrastructureAsset,
  NetworkData,
  SimulationResult,
  ImpactMetrics,
  CriticalAssetResponse,
  ScenarioStatus,
  InterventionType,
} from "../types";

export interface SimulationState {
  // Data
  network: NetworkData | null;
  criticalAssets: CriticalAssetResponse[];
  baselineMetrics: ImpactMetrics | null;

  // Selection
  selectedAssetId: string | null;
  selectedAsset: InfrastructureAsset | null;

  // Simulation
  simulationResult: SimulationResult | null;
  scenarioStatus: ScenarioStatus;
  activeIntervention: InterventionType | null;
  interventionResult: SimulationResult | null;

  // UI
  loading: boolean;
  error: string | null;

  // Actions
  selectAsset: (id: string | null) => void;
  simulateFailure: (assetId: string) => Promise<void>;
  runIntervention: (type: InterventionType, targetId?: string | null) => Promise<void>;
  resetSimulation: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

export function useSimulation(): SimulationState {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [criticalAssets, setCriticalAssets] = useState<CriticalAssetResponse[]>([]);
  const [baselineMetrics, setBaselineMetrics] = useState<ImpactMetrics | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [scenarioStatus, setScenarioStatus] = useState<ScenarioStatus>("IDLE");
  const [activeIntervention, setActiveIntervention] = useState<InterventionType | null>(null);
  const [interventionResult, setInterventionResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAsset = network?.nodes.find((n) => n.id === selectedAssetId) || null;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [networkData, critData, baseline] = await Promise.all([
        api.getNetwork(),
        api.getCriticalAssets(),
        api.getBaselineMetrics(),
      ]);
      setNetwork(networkData);
      setCriticalAssets(critData);
      setBaselineMetrics(baseline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAsset = useCallback((id: string | null) => {
    setSelectedAssetId(id);
  }, []);

  const simulateFailure = useCallback(async (assetId: string) => {
    setLoading(true);
    setError(null);
    setScenarioStatus("SIMULATING");
    setActiveIntervention(null);
    setInterventionResult(null);
    try {
      const result = await api.simulateFailure(assetId);
      setSimulationResult(result);
      setScenarioStatus("FAILURE_DETECTED");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
      setScenarioStatus("IDLE");
    } finally {
      setLoading(false);
    }
  }, []);

  const runIntervention = useCallback(
    async (type: InterventionType, targetId?: string | null) => {
      if (!selectedAssetId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await api.simulateIntervention(selectedAssetId, type, targetId);
        setInterventionResult(result);
        setActiveIntervention(type);
        setScenarioStatus("INTERVENTION_APPLIED");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Intervention simulation failed");
      } finally {
        setLoading(false);
      }
    },
    [selectedAssetId]
  );

  const resetSimulation = useCallback(async () => {
    setLoading(true);
    try {
      await api.resetSimulation();
      setSimulationResult(null);
      setInterventionResult(null);
      setActiveIntervention(null);
      setScenarioStatus("IDLE");
      setSelectedAssetId(null);
      setError(null);
      await loadInitialData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }, [loadInitialData]);

  // Load on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    network,
    criticalAssets,
    baselineMetrics,
    selectedAssetId,
    selectedAsset,
    simulationResult,
    scenarioStatus,
    activeIntervention,
    interventionResult,
    loading,
    error,
    selectAsset,
    simulateFailure,
    runIntervention,
    resetSimulation,
    loadInitialData,
  };
}
