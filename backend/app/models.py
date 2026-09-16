"""Pydantic models for ResiliNet API."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class AssetType(str, Enum):
    ROAD = "ROAD"
    BRIDGE = "BRIDGE"
    HOSPITAL = "HOSPITAL"
    POWER = "POWER"
    WATER = "WATER"
    EMERGENCY_FACILITY = "EMERGENCY_FACILITY"


class AssetStatus(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    FAILED = "FAILED"
    AFFECTED = "AFFECTED"
    DEGRADED = "DEGRADED"


class InterventionType(str, Enum):
    REPAIR = "REPAIR"
    REROUTE = "REROUTE"
    REINFORCE = "REINFORCE"
    ADD_CONNECTION = "ADD_CONNECTION"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ---------------------------------------------------------------------------
# Core Data Models
# ---------------------------------------------------------------------------

class InfrastructureAsset(BaseModel):
    id: str
    name: str
    type: AssetType
    latitude: float
    longitude: float
    criticality: float = Field(default=0.0, ge=0, le=100)
    capacity: float = Field(default=100.0, ge=0)
    status: AssetStatus = AssetStatus.OPERATIONAL
    dependencies: list[str] = Field(default_factory=list)
    population_served: int = Field(default=0, ge=0)


class Edge(BaseModel):
    source: str
    target: str
    weight: float = Field(default=1.0, ge=0)
    capacity: float = Field(default=100.0, ge=0)
    travel_time: float = Field(default=5.0, ge=0)  # minutes
    edge_type: str = "dependency"


class NetworkData(BaseModel):
    nodes: list[InfrastructureAsset]
    edges: list[Edge]


# ---------------------------------------------------------------------------
# Simulation Request / Response
# ---------------------------------------------------------------------------

class SimulationRequest(BaseModel):
    asset_id: str


class InterventionRequest(BaseModel):
    asset_id: str  # originally failed asset
    intervention_type: Optional[InterventionType] = None
    intervention_types: Optional[list[InterventionType]] = None
    target_asset_id: Optional[str] = None  # asset to reinforce / connect


class PropagationStep(BaseModel):
    timestamp: int  # simulated minutes after failure
    asset_id: str
    asset_name: str
    event: str
    severity: Severity
    reason: str


class ImpactMetrics(BaseModel):
    population_affected: int = 0
    affected_assets: int = 0
    average_delay: float = 0.0
    service_disruption: float = 0.0
    estimated_recovery: float = 0.0  # hours
    resilience_score: float = 100.0


class CriticalityBreakdown(BaseModel):
    connectivity: float = 0.0
    downstream_dependencies: float = 0.0
    population_served: float = 0.0
    alternative_path_scarcity: float = 0.0
    score: float = 0.0
    explanation: str = ""


class InterventionOption(BaseModel):
    intervention_type: InterventionType
    label: str
    description: str
    target_asset_id: Optional[str] = None
    metrics: ImpactMetrics = Field(default_factory=ImpactMetrics)


class SimulationResult(BaseModel):
    failed_assets: list[str] = Field(default_factory=list)
    affected_assets: list[str] = Field(default_factory=list)
    affected_asset_details: dict[str, AssetStatus] = Field(default_factory=dict)
    propagation_paths: list[list[str]] = Field(default_factory=list)
    propagation_steps: list[PropagationStep] = Field(default_factory=list)
    impact_metrics: Optional[ImpactMetrics] = None
    critical_nodes: list[str] = Field(default_factory=list)
    explanation: str = ""
    timeline: list[PropagationStep] = Field(default_factory=list)
    intervention_options: list[InterventionOption] = Field(default_factory=list)
    recommendation: Optional[str] = None
    recommendation_explanation: Optional[str] = None


class ScenarioComparison(BaseModel):
    scenario_name: str
    intervention_type: Optional[InterventionType] = None
    metrics: ImpactMetrics


class CriticalAssetResponse(BaseModel):
    asset: InfrastructureAsset
    criticality: CriticalityBreakdown
