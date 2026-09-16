// ResiliNet – TypeScript type definitions
// Mirrors backend Pydantic models

export const AssetType = {
  ROAD: "ROAD",
  BRIDGE: "BRIDGE",
  HOSPITAL: "HOSPITAL",
  POWER: "POWER",
  WATER: "WATER",
  EMERGENCY_FACILITY: "EMERGENCY_FACILITY",
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const AssetStatus = {
  OPERATIONAL: "OPERATIONAL",
  FAILED: "FAILED",
  AFFECTED: "AFFECTED",
  DEGRADED: "DEGRADED",
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const InterventionType = {
  REPAIR: "REPAIR",
  REROUTE: "REROUTE",
  REINFORCE: "REINFORCE",
  ADD_CONNECTION: "ADD_CONNECTION",
} as const;
export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];

export const Severity = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: AssetType;
  latitude: number;
  longitude: number;
  criticality: number;
  capacity: number;
  status: AssetStatus;
  dependencies: string[];
  population_served: number;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  capacity: number;
  travel_time: number;
  edge_type: string;
}

export interface NetworkData {
  nodes: InfrastructureAsset[];
  edges: Edge[];
}

export interface PropagationStep {
  timestamp: number;
  asset_id: string;
  asset_name: string;
  event: string;
  severity: Severity;
  reason: string;
}

export interface ImpactMetrics {
  population_affected: number;
  affected_assets: number;
  average_delay: number;
  service_disruption: number;
  estimated_recovery: number;
  resilience_score: number;
}

export interface CriticalityBreakdown {
  connectivity: number;
  downstream_dependencies: number;
  population_served: number;
  alternative_path_scarcity: number;
  score: number;
  explanation: string;
}

export interface InterventionOption {
  intervention_type: InterventionType;
  label: string;
  description: string;
  target_asset_id: string | null;
  metrics: ImpactMetrics;
}

export interface SimulationResult {
  failed_assets: string[];
  affected_assets: string[];
  affected_asset_details: Record<string, string>;
  propagation_paths: string[][];
  propagation_steps: PropagationStep[];
  impact_metrics: ImpactMetrics;
  critical_nodes: string[];
  explanation: string;
  timeline: PropagationStep[];
  intervention_options: InterventionOption[];
  recommendation: string | null;
  recommendation_explanation: string | null;
}

export interface CriticalAssetResponse {
  asset: InfrastructureAsset;
  criticality: CriticalityBreakdown;
}

export type ScenarioStatus =
  | "IDLE"
  | "SIMULATING"
  | "FAILURE_DETECTED"
  | "INTERVENTION_APPLIED";
