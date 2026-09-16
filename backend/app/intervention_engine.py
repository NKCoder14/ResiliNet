"""Intervention engine – what-if scenario calculations.

Each intervention modifies the graph temporarily and re-runs the simulation
to produce comparative impact metrics.
"""

from __future__ import annotations

import networkx as nx

from app.models import (
    AssetType,
    ImpactMetrics,
    InterventionOption,
    InterventionType,
    SimulationResult,
)
from app.simulation_engine import simulate_failure
from app.impact_engine import calculate_impact


def run_interventions(
    graph: nx.DiGraph,
    failed_asset_id: str,
    intervention_types: list[InterventionType],
    target_asset_id: str | None = None,
) -> tuple[SimulationResult, ImpactMetrics]:
    """Run a modified simulation with one or more compound interventions applied simultaneously."""
    if not intervention_types:
        result = simulate_failure(graph, failed_asset_id)
        metrics = calculate_impact(
            graph, result.failed_assets, result.affected_assets,
            result.affected_asset_details, {},
        )
        result.impact_metrics = metrics
        return result, metrics

    g = graph.copy()
    applied_descriptions: list[str] = []

    # 1. Check if REPAIR is selected
    if InterventionType.REPAIR in intervention_types:
        applied_descriptions.append(f"Restoration of asset '{failed_asset_id}'")
        result = SimulationResult(
            failed_assets=[],
            affected_assets=[],
            affected_asset_details={},
            propagation_paths=[],
            propagation_steps=[],
            explanation="Asset restored to full operational status. Network fully functional.",
            timeline=[],
        )
        base_res = _baseline_resilience(g)
        bonus = 1.0 if len(intervention_types) > 1 else 0.0
        metrics = ImpactMetrics(
            population_affected=0,
            affected_assets=0,
            average_delay=4.0 if InterventionType.REROUTE in intervention_types else 5.0,
            service_disruption=0.0,
            estimated_recovery=0.0,
            resilience_score=min(100.0, base_res + bonus),
        )
        return result, metrics

    # 2. Check if REROUTE is selected
    if InterventionType.REROUTE in intervention_types:
        for u, v, data in g.edges(data=True):
            if u != failed_asset_id and v != failed_asset_id:
                data["capacity"] = data.get("capacity", 100) * 1.5
        applied_descriptions.append("Alternate route capacities expanded (+50%)")

    # 3. Check if REINFORCE is selected
    if InterventionType.REINFORCE in intervention_types:
        target = target_asset_id or _find_best_reinforce_target(g, failed_asset_id)
        if target and target in g.nodes:
            g.nodes[target]["capacity"] = g.nodes[target].get("capacity", 100) * 2
            for u, v, data in g.edges(data=True):
                if u == target or v == target:
                    data["capacity"] = data.get("capacity", 100) * 2
            target_name = g.nodes[target].get("name", target)
            applied_descriptions.append(f"Corridor '{target_name}' reinforced (2x capacity)")

    # 4. Check if ADD_CONNECTION is selected
    if InterventionType.ADD_CONNECTION in intervention_types:
        bypass = _find_best_bypass(g, failed_asset_id)
        if bypass:
            src, tgt = bypass
            g.add_edge(src, tgt, weight=0.8, capacity=150, travel_time=6, edge_type="emergency_bypass")
            src_name = g.nodes[bypass[0]].get("name", bypass[0])
            tgt_name = g.nodes[bypass[1]].get("name", bypass[1])
            applied_descriptions.append(f"Emergency bypass established ({src_name} → {tgt_name})")

    result = simulate_failure(g, failed_asset_id)
    metrics = calculate_impact(
        g, result.failed_assets, result.affected_assets,
        result.affected_asset_details, {},
    )
    result.impact_metrics = metrics
    desc_str = " + ".join(applied_descriptions)
    result.explanation = f"Compound Mitigation Deployed [{desc_str}]. " + result.explanation
    return result, metrics


def run_intervention(
    graph: nx.DiGraph,
    failed_asset_id: str,
    intervention_type: InterventionType,
    target_asset_id: str | None = None,
) -> tuple[SimulationResult, ImpactMetrics]:
    """Run a single intervention (backwards compatibility)."""
    return run_interventions(graph, failed_asset_id, [intervention_type], target_asset_id)


def generate_intervention_options(
    graph: nx.DiGraph,
    failed_asset_id: str,
    base_metrics: ImpactMetrics,
) -> list[InterventionOption]:
    """Generate all 4 intervention options with pre-computed metrics."""
    failed_name = graph.nodes[failed_asset_id].get("name", failed_asset_id) if failed_asset_id in graph else failed_asset_id

    reinforce_target = _find_best_reinforce_target(graph, failed_asset_id)
    reinforce_name = graph.nodes[reinforce_target].get("name", reinforce_target) if reinforce_target and reinforce_target in graph else "nearby road"

    options: list[InterventionOption] = [
        InterventionOption(
            intervention_type=InterventionType.REPAIR,
            label=f"Repair {failed_name}",
            description=f"Restore {failed_name} to full operational status. Full network recovery.",
            target_asset_id=failed_asset_id,
        ),
        InterventionOption(
            intervention_type=InterventionType.REROUTE,
            label="Reroute Traffic",
            description="Increase capacity on alternate routes by 50% to absorb redirected traffic.",
        ),
        InterventionOption(
            intervention_type=InterventionType.REINFORCE,
            label=f"Reinforce {reinforce_name}",
            description=f"Double the capacity of {reinforce_name} to handle additional load.",
            target_asset_id=reinforce_target,
        ),
        InterventionOption(
            intervention_type=InterventionType.ADD_CONNECTION,
            label="Add Emergency Bypass",
            description="Create a temporary bypass connection to restore critical connectivity.",
        ),
    ]

    # Compute metrics for each option
    for opt in options:
        _, metrics = run_intervention(
            graph, failed_asset_id, opt.intervention_type, opt.target_asset_id,
        )
        opt.metrics = metrics

    return options


def _find_best_reinforce_target(graph: nx.DiGraph, failed_id: str) -> str | None:
    """Find the best road to reinforce (highest degree neighbour that isn't the failed node)."""
    candidates = []
    for neighbor in graph.neighbors(failed_id):
        if neighbor != failed_id and graph.nodes[neighbor].get("type") in (
            AssetType.ROAD.value, AssetType.BRIDGE.value,
        ):
            candidates.append((neighbor, graph.degree(neighbor)))

    # Also check neighbours of neighbours
    for neighbor in graph.neighbors(failed_id):
        for nn in graph.neighbors(neighbor):
            if nn != failed_id and nn not in {c[0] for c in candidates}:
                if graph.nodes[nn].get("type") == AssetType.ROAD.value:
                    candidates.append((nn, graph.degree(nn)))

    if not candidates:
        # Fallback: any road node
        for n in graph.nodes():
            if graph.nodes[n].get("type") == AssetType.ROAD.value and n != failed_id:
                return n
        return None

    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]


def _find_best_bypass(graph: nx.DiGraph, failed_id: str) -> tuple[str, str] | None:
    """Find a good pair of nodes to connect with a bypass edge."""
    predecessors = list(graph.predecessors(failed_id))
    downstream = list(nx.descendants(graph, failed_id)) if failed_id in graph else []

    # Connect a predecessor's alternate to a downstream node
    for pred in predecessors:
        for sibling in graph.neighbors(pred):
            if sibling != failed_id and sibling not in downstream:
                for ds in downstream:
                    if not graph.has_edge(sibling, ds):
                        return (sibling, ds)

    # Fallback: connect any two nodes around the failure
    if predecessors and downstream:
        return (predecessors[0], downstream[0])

    return None


def _baseline_resilience(graph: nx.DiGraph) -> float:
    """Quick baseline resilience estimate."""
    try:
        undirected = graph.to_undirected()
        if nx.is_connected(undirected):
            connectivity = 1.0
        else:
            largest_cc = max(nx.connected_components(undirected), key=len)
            connectivity = len(largest_cc) / len(graph.nodes())
    except Exception:
        connectivity = 0.5
    avg_degree = sum(dict(graph.degree()).values()) / max(len(graph.nodes()), 1)
    normalized_degree = min(avg_degree / 6, 1.0)
    return round(70 + 20 * connectivity + 10 * normalized_degree, 1)
