"""Impact engine – compute impact metrics and criticality scores."""

from __future__ import annotations

import networkx as nx

from app.models import (
    AssetStatus,
    AssetType,
    CriticalityBreakdown,
    ImpactMetrics,
)
from app.graph_engine import (
    calculate_betweenness,
    calculate_connectivity,
    get_alternate_paths,
    get_downstream_nodes,
)


# Weight multipliers for service disruption by type
SERVICE_WEIGHT: dict[str, float] = {
    AssetType.HOSPITAL.value: 3.0,
    AssetType.EMERGENCY_FACILITY.value: 2.5,
    AssetType.POWER.value: 2.0,
    AssetType.WATER.value: 2.0,
    AssetType.BRIDGE.value: 1.5,
    AssetType.ROAD.value: 1.0,
}

# Recovery hours by type
RECOVERY_HOURS: dict[str, float] = {
    AssetType.BRIDGE.value: 72,
    AssetType.ROAD.value: 24,
    AssetType.HOSPITAL.value: 48,
    AssetType.POWER.value: 36,
    AssetType.WATER.value: 30,
    AssetType.EMERGENCY_FACILITY.value: 12,
}


def calculate_impact(
    graph: nx.DiGraph,
    failed_assets: list[str],
    affected_assets: list[str],
    affected_details: dict[str, str],
    congestion: dict[str, float] | None = None,
) -> ImpactMetrics:
    """Compute aggregate impact metrics from a simulation result."""
    congestion = congestion or {}
    total_nodes = len(graph.nodes())

    # Population affected – sum population served by affected critical facilities
    pop_affected = 0
    for node_id in set(failed_assets + affected_assets):
        if node_id in graph.nodes:
            data = graph.nodes[node_id]
            node_type = data.get("type", "")
            pop = data.get("population_served", 0)
            if node_type in (AssetType.HOSPITAL.value, AssetType.EMERGENCY_FACILITY.value):
                pop_affected += pop
            elif node_type in (AssetType.POWER.value, AssetType.WATER.value):
                pop_affected += int(pop * 0.6)
            else:
                pop_affected += int(pop * 0.3)

    # Affected assets count
    n_affected = len(set(failed_assets + affected_assets))

    # Average delay
    delays: list[float] = []
    for node_id in affected_assets:
        cong = congestion.get(node_id, 2.0)
        base_delay = 5.0  # baseline minutes
        delays.append(base_delay * cong)
    avg_delay = sum(delays) / max(len(delays), 1)

    # Service disruption (weighted)
    disruption = 0.0
    for node_id in set(failed_assets + affected_assets):
        if node_id in graph.nodes:
            node_type = graph.nodes[node_id].get("type", AssetType.ROAD.value)
            disruption += SERVICE_WEIGHT.get(node_type, 1.0)
    max_possible = sum(SERVICE_WEIGHT.get(graph.nodes[n].get("type", "ROAD"), 1.0) for n in graph.nodes())
    service_disruption = (disruption / max(max_possible, 1)) * 100

    # Estimated recovery (max of affected assets' recovery times)
    recovery_hours = 0.0
    for node_id in set(failed_assets + affected_assets):
        if node_id in graph.nodes:
            node_type = graph.nodes[node_id].get("type", AssetType.ROAD.value)
            recovery_hours = max(recovery_hours, RECOVERY_HOURS.get(node_type, 24))

    # Resilience score
    disruption_ratio = n_affected / max(total_nodes, 1)
    pop_ratio = pop_affected / max(
        sum(graph.nodes[n].get("population_served", 0) for n in graph.nodes()), 1
    )
    resilience_score = max(0, 100 * (1 - 0.5 * disruption_ratio - 0.5 * pop_ratio))

    return ImpactMetrics(
        population_affected=pop_affected,
        affected_assets=n_affected,
        average_delay=round(avg_delay, 1),
        service_disruption=round(service_disruption, 1),
        estimated_recovery=recovery_hours,
        resilience_score=round(resilience_score, 1),
    )


def calculate_baseline_metrics(graph: nx.DiGraph) -> ImpactMetrics:
    """Return metrics for a healthy network (no failures)."""
    return ImpactMetrics(
        population_affected=0,
        affected_assets=0,
        average_delay=5.0,
        service_disruption=0.0,
        estimated_recovery=0.0,
        resilience_score=_calculate_baseline_resilience(graph),
    )


def _calculate_baseline_resilience(graph: nx.DiGraph) -> float:
    """Compute baseline resilience score from graph connectivity."""
    if len(graph.nodes()) == 0:
        return 0.0
    # Use average clustering + connectivity as proxy
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
    normalized_degree = min(avg_degree / 6, 1.0)  # cap at 6 avg connections

    return round(70 + 20 * connectivity + 10 * normalized_degree, 1)


def calculate_criticality(
    graph: nx.DiGraph,
    node_id: str,
) -> CriticalityBreakdown:
    """Calculate the criticality score for a node (0-100).

    Score = 0.35 × Connectivity
          + 0.25 × Downstream Dependencies
          + 0.25 × Population Served
          + 0.15 × Alternative Path Scarcity
    """
    if node_id not in graph:
        return CriticalityBreakdown(explanation=f"Node '{node_id}' not found.")

    node_data = graph.nodes[node_id]

    # Connectivity (normalised degree centrality × 100)
    conn = calculate_connectivity(graph, node_id) * 100

    # Downstream dependencies (normalised by total nodes)
    downstream = get_downstream_nodes(graph, node_id)
    downstream_score = min(len(downstream) / max(len(graph.nodes()) - 1, 1) * 100, 100)

    # Population served (normalised against max in network)
    all_pops = [graph.nodes[n].get("population_served", 0) for n in graph.nodes()]
    max_pop = max(all_pops) if all_pops else 1
    pop_score = (node_data.get("population_served", 0) / max(max_pop, 1)) * 100

    # Alternative path scarcity
    successors = list(graph.successors(node_id))
    if successors:
        alt_counts = []
        for succ in successors:
            alts = get_alternate_paths(graph, node_id, succ, excluded={node_id}, cutoff=4)
            alt_counts.append(len(alts))
        avg_alts = sum(alt_counts) / max(len(alt_counts), 1)
        scarcity_score = max(0, 100 - avg_alts * 25)  # fewer alts = higher score
    else:
        scarcity_score = 0  # leaf nodes have no downstream

    score = (
        0.35 * conn
        + 0.25 * downstream_score
        + 0.25 * pop_score
        + 0.15 * scarcity_score
    )
    score = min(round(score, 1), 100)

    # Build explanation
    node_name = node_data.get("name", node_id)
    node_type = node_data.get("type", "UNKNOWN")
    hospital_count = sum(
        1 for d in downstream
        if graph.nodes[d].get("type") == AssetType.HOSPITAL.value
    )
    explanation_parts = [
        f"{node_name} has a criticality score of {score}/100.",
        f"",
        f"Why is {node_name} critical?",
    ]
    if len(downstream) > 0:
        explanation_parts.append(f"• {len(downstream)} downstream assets depend on it")
    if hospital_count > 0:
        explanation_parts.append(f"• {hospital_count} hospital(s) are reachable through connected routes")
    if successors:
        avg_alt_display = sum(alt_counts) / max(len(alt_counts), 1) if alt_counts else 0
        if avg_alt_display <= 1:
            explanation_parts.append(f"• Very few alternate routes exist (avg {avg_alt_display:.0f})")
        else:
            explanation_parts.append(f"• {avg_alt_display:.0f} average alternate routes exist")
    pop = node_data.get("population_served", 0)
    if pop > 0:
        explanation_parts.append(f"• {pop:,} population directly served")
    total_downstream_pop = sum(
        graph.nodes[d].get("population_served", 0)
        for d in downstream
    )
    if total_downstream_pop > 0:
        explanation_parts.append(f"• {total_downstream_pop:,} population indirectly served via downstream")

    return CriticalityBreakdown(
        connectivity=round(conn, 1),
        downstream_dependencies=round(downstream_score, 1),
        population_served=round(pop_score, 1),
        alternative_path_scarcity=round(scarcity_score, 1),
        score=score,
        explanation="\n".join(explanation_parts),
    )
