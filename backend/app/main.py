"""ResiliNet – FastAPI application.

Urban Cascading Failure Simulator & Resilience Planning Platform.
All data is SIMULATED. No real-world infrastructure is represented.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    CriticalAssetResponse,
    InterventionRequest,
    NetworkData,
    SimulationRequest,
    SimulationResult,
    ScenarioComparison,
    InfrastructureAsset,
    ImpactMetrics,
)
from app.seed_data import SEED_ASSETS, SEED_EDGES
from app.graph_engine import get_graph, reset_graph
from app.simulation_engine import simulate_failure
from app.impact_engine import calculate_impact, calculate_criticality, calculate_baseline_metrics
from app.intervention_engine import generate_intervention_options, run_intervention, run_interventions
from app.recommendation_engine import recommend_intervention


app = FastAPI(
    title="ResiliNet API",
    description="Urban Cascading Failure Simulator – Simulation-based impact estimates",
    version="1.0.0-mvp",
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory scenario cache
_scenario_cache: dict[str, SimulationResult] = {}


@app.get("/")
def root():
    return {"message": "ResiliNet API – Simulation-based urban infrastructure resilience platform"}


@app.get("/assets", response_model=list[InfrastructureAsset])
def get_assets():
    """Return all infrastructure assets with computed criticality scores."""
    graph = get_graph()
    assets = []
    for asset in SEED_ASSETS:
        crit = calculate_criticality(graph, asset.id)
        updated = asset.model_copy(update={"criticality": crit.score})
        assets.append(updated)
    return assets


@app.get("/network", response_model=NetworkData)
def get_network():
    """Return the full network graph (nodes + edges) for map rendering."""
    graph = get_graph()
    assets = []
    for asset in SEED_ASSETS:
        crit = calculate_criticality(graph, asset.id)
        updated = asset.model_copy(update={"criticality": crit.score})
        assets.append(updated)
    return NetworkData(nodes=assets, edges=SEED_EDGES)


@app.post("/simulate/failure", response_model=SimulationResult)
def run_failure_simulation(req: SimulationRequest):
    """Run a cascading failure simulation for the given asset."""
    graph = get_graph()

    if req.asset_id not in graph:
        raise HTTPException(status_code=404, detail=f"Asset '{req.asset_id}' not found")

    result = simulate_failure(graph, req.asset_id)

    # Calculate impact metrics
    metrics = calculate_impact(
        graph,
        result.failed_assets,
        result.affected_assets,
        result.affected_asset_details,
    )
    result.impact_metrics = metrics

    # Calculate critical nodes
    critical_nodes = []
    for node_id in set(result.failed_assets + result.affected_assets):
        crit = calculate_criticality(graph, node_id)
        if crit.score > 30:
            critical_nodes.append(node_id)
    result.critical_nodes = critical_nodes

    # Generate intervention options
    options = generate_intervention_options(graph, req.asset_id, metrics)
    result.intervention_options = options

    # Generate recommendation
    rec_type, rec_explanation = recommend_intervention(metrics, options)
    result.recommendation = rec_type.value
    result.recommendation_explanation = rec_explanation

    # Cache the result
    scenario_id = f"failure_{req.asset_id}"
    _scenario_cache[scenario_id] = result

    return result


@app.post("/simulate/intervention", response_model=SimulationResult)
def run_intervention_simulation(req: InterventionRequest):
    """Run a modified simulation with one or more interventions applied."""
    graph = get_graph()

    if req.asset_id not in graph:
        raise HTTPException(status_code=404, detail=f"Asset '{req.asset_id}' not found")

    types = req.intervention_types or ([req.intervention_type] if req.intervention_type else [])
    if not types:
        raise HTTPException(status_code=400, detail="No intervention type specified")

    result, metrics = run_interventions(
        graph, req.asset_id, types, req.target_asset_id,
    )
    result.impact_metrics = metrics

    # Cache
    types_str = "_".join(t.value for t in types)
    scenario_id = f"intervention_{req.asset_id}_{types_str}"
    _scenario_cache[scenario_id] = result

    return result


@app.get("/scenario/{scenario_id}", response_model=SimulationResult)
def get_scenario(scenario_id: str):
    """Retrieve a cached simulation scenario."""
    if scenario_id not in _scenario_cache:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return _scenario_cache[scenario_id]


@app.get("/critical-assets", response_model=list[CriticalAssetResponse])
def get_critical_assets():
    """Return the top critical assets ranked by criticality score."""
    graph = get_graph()
    results = []
    for asset in SEED_ASSETS:
        crit = calculate_criticality(graph, asset.id)
        updated = asset.model_copy(update={"criticality": crit.score})
        results.append(CriticalAssetResponse(asset=updated, criticality=crit))

    results.sort(key=lambda x: x.criticality.score, reverse=True)
    return results


@app.get("/baseline-metrics", response_model=ImpactMetrics)
def get_baseline_metrics():
    """Return baseline metrics for a healthy network."""
    graph = get_graph()
    return calculate_baseline_metrics(graph)


@app.post("/reset")
def reset_simulation():
    """Reset the simulation to initial state."""
    reset_graph()
    _scenario_cache.clear()
    return {"message": "Simulation reset to initial state", "status": "ok"}
