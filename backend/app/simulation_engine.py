"""Simulation engine – deterministic cascading failure propagation.

Algorithm
---------
1. Mark the initial node as FAILED.
2. BFS through direct dependents.
3. For each dependent, check if alternate paths exist (excluding failed nodes).
4. If no alternate path → AFFECTED (HIGH severity).
5. If alternate path exists but capacity insufficient → AFFECTED (MEDIUM).
6. If alternate path has sufficient capacity → DEGRADED (LOW).
7. Continue propagation from AFFECTED nodes.
8. Stop when queue is empty or max depth reached.

All results are labelled **"Simulation-based impact estimate"**.
"""

from __future__ import annotations

from collections import deque
from typing import Optional

import networkx as nx

from app.models import (
    AssetStatus,
    AssetType,
    PropagationStep,
    Severity,
    SimulationResult,
)
from app.graph_engine import (
    get_direct_dependents,
    get_upstream_providers,
    has_alternate_path,
)


# Recovery time assumptions (hours) by asset type
RECOVERY_HOURS: dict[str, float] = {
    AssetType.BRIDGE.value: 72,
    AssetType.ROAD.value: 24,
    AssetType.HOSPITAL.value: 48,
    AssetType.POWER.value: 36,
    AssetType.WATER.value: 30,
    AssetType.EMERGENCY_FACILITY.value: 12,
}

MAX_PROPAGATION_DEPTH = 10


def simulate_failure(
    graph: nx.DiGraph,
    failed_asset_id: str,
    max_depth: int = MAX_PROPAGATION_DEPTH,
) -> SimulationResult:
    """Run a deterministic cascading failure simulation starting from
    *failed_asset_id* and return the full result.
    """
    if failed_asset_id not in graph:
        return SimulationResult(explanation=f"Asset '{failed_asset_id}' not found in the network.")

    # Work on a copy so the original graph is not mutated
    g = graph.copy()

    # Track states
    node_status: dict[str, AssetStatus] = {n: AssetStatus.OPERATIONAL for n in g.nodes()}
    node_status[failed_asset_id] = AssetStatus.FAILED

    failed_nodes: set[str] = {failed_asset_id}
    affected_nodes: set[str] = set()
    congestion: dict[str, float] = {}  # node_id → congestion factor

    # Timeline & propagation
    timeline: list[PropagationStep] = []
    propagation_paths: list[list[str]] = []
    sim_time = 0

    # Initial failure event
    failed_name = g.nodes[failed_asset_id].get("name", failed_asset_id)
    failed_type = g.nodes[failed_asset_id].get("type", "UNKNOWN")
    timeline.append(PropagationStep(
        timestamp=sim_time,
        asset_id=failed_asset_id,
        asset_name=failed_name,
        event=f"{failed_name} has failed",
        severity=Severity.HIGH,
        reason=f"Initial failure event – {failed_name} ({failed_type}) is now non-operational.",
    ))

    # BFS propagation
    queue: deque[tuple[str, int, list[str]]] = deque()  # (node_id, depth, path)

    for dep in get_direct_dependents(g, failed_asset_id):
        queue.append((dep, 1, [failed_asset_id, dep]))

    visited: set[str] = {failed_asset_id}

    while queue:
        current_id, depth, path = queue.popleft()

        if depth > max_depth:
            continue
        if current_id in visited:
            continue
        visited.add(current_id)

        node_data = g.nodes[current_id]
        node_name = node_data.get("name", current_id)
        node_capacity = node_data.get("capacity", 100)

        sim_time = depth * 3  # each depth level ≈ 3 minutes

        # Check alternate paths
        reachable, alt_paths = has_alternate_path(g, current_id, failed_nodes)

        if not reachable:
            # No alternate path → AFFECTED (HIGH)
            node_status[current_id] = AssetStatus.AFFECTED
            affected_nodes.add(current_id)
            congestion[current_id] = 3.0

            timeline.append(PropagationStep(
                timestamp=sim_time,
                asset_id=current_id,
                asset_name=node_name,
                event=f"{node_name} is now affected (no alternate route)",
                severity=Severity.HIGH,
                reason=(
                    f"All upstream connections to {node_name} pass through "
                    f"failed infrastructure. No viable alternate route exists."
                ),
            ))
            propagation_paths.append(path)

            # Continue propagation from this affected node
            for dep in get_direct_dependents(g, current_id):
                if dep not in visited:
                    queue.append((dep, depth + 1, path + [dep]))

        elif reachable:
            # Has alternate paths – check capacity
            total_alt_capacity = sum(
                min(
                    g.nodes[n].get("capacity", 100)
                    for n in p if n != current_id
                )
                for p in alt_paths
                if len(p) > 1
            ) if alt_paths else 0

            # If total alternate capacity is too small, still affected
            if total_alt_capacity < node_capacity * 0.5:
                node_status[current_id] = AssetStatus.AFFECTED
                affected_nodes.add(current_id)
                cong_factor = min(node_capacity / max(total_alt_capacity, 1), 3.0)
                congestion[current_id] = cong_factor

                timeline.append(PropagationStep(
                    timestamp=sim_time,
                    asset_id=current_id,
                    asset_name=node_name,
                    event=f"{node_name} is affected (insufficient alternate capacity)",
                    severity=Severity.MEDIUM,
                    reason=(
                        f"Alternate routes to {node_name} exist but can only handle "
                        f"{total_alt_capacity:.0f}/{node_capacity:.0f} capacity. "
                        f"Congestion factor: {cong_factor:.1f}x."
                    ),
                ))
                propagation_paths.append(path)

                # Continue propagation
                for dep in get_direct_dependents(g, current_id):
                    if dep not in visited:
                        queue.append((dep, depth + 1, path + [dep]))

            elif total_alt_capacity < node_capacity:
                # Degraded but not fully affected
                node_status[current_id] = AssetStatus.DEGRADED
                cong_factor = min(node_capacity / max(total_alt_capacity, 1), 2.0)
                congestion[current_id] = cong_factor

                timeline.append(PropagationStep(
                    timestamp=sim_time,
                    asset_id=current_id,
                    asset_name=node_name,
                    event=f"{node_name} is degraded (rerouted traffic)",
                    severity=Severity.LOW,
                    reason=(
                        f"Traffic to {node_name} has been rerouted. "
                        f"Alternate capacity: {total_alt_capacity:.0f}/{node_capacity:.0f}. "
                        f"Expected delay increase: {cong_factor:.1f}x."
                    ),
                ))
            else:
                # Sufficient alternate capacity – stays operational
                congestion[current_id] = 1.0

    # Build affected_asset_details
    affected_detail: dict[str, AssetStatus] = {}
    for nid, status in node_status.items():
        if status != AssetStatus.OPERATIONAL:
            affected_detail[nid] = status

    return SimulationResult(
        failed_assets=list(failed_nodes),
        affected_assets=list(affected_nodes),
        affected_asset_details={k: v.value for k, v in affected_detail.items()},  # type: ignore[arg-type]
        propagation_paths=propagation_paths,
        propagation_steps=timeline,
        impact_metrics=None,  # type: ignore[arg-type]  # filled by caller
        critical_nodes=[],  # filled by caller
        explanation=_build_explanation(failed_asset_id, g, failed_nodes, affected_nodes, timeline),
        timeline=timeline,
    )


def _build_explanation(
    failed_id: str,
    g: nx.DiGraph,
    failed: set[str],
    affected: set[str],
    timeline: list[PropagationStep],
) -> str:
    """Build a human-readable explanation of the cascade."""
    failed_name = g.nodes[failed_id].get("name", failed_id)
    lines = [
        f"Simulation-based impact estimate",
        f"",
        f"Initial failure: {failed_name}",
        f"Total affected assets: {len(affected)}",
        f"",
        f"Propagation chain:",
    ]
    for step in timeline:
        lines.append(f"  T+{step.timestamp}min: {step.event}")
        lines.append(f"    Reason: {step.reason}")

    return "\n".join(lines)
