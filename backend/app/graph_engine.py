"""Graph engine – build and query the NetworkX infrastructure graph."""

from __future__ import annotations

import networkx as nx

from app.models import Edge, InfrastructureAsset
from app.seed_data import SEED_ASSETS, SEED_EDGES


def build_graph(
    assets: list[InfrastructureAsset] | None = None,
    edges: list[Edge] | None = None,
) -> nx.DiGraph:
    """Construct a directed graph from infrastructure assets and edges."""
    assets = assets or SEED_ASSETS
    edges = edges or SEED_EDGES

    g = nx.DiGraph()

    for asset in assets:
        g.add_node(
            asset.id,
            name=asset.name,
            type=asset.type.value,
            latitude=asset.latitude,
            longitude=asset.longitude,
            capacity=asset.capacity,
            population_served=asset.population_served,
            status=asset.status.value,
            dependencies=asset.dependencies,
        )

    for edge in edges:
        # Only add edge if both endpoints exist
        if g.has_node(edge.source) and g.has_node(edge.target):
            g.add_edge(
                edge.source,
                edge.target,
                weight=edge.weight,
                capacity=edge.capacity,
                travel_time=edge.travel_time,
                edge_type=edge.edge_type,
            )

    return g


def get_downstream_nodes(g: nx.DiGraph, node_id: str) -> list[str]:
    """Return all nodes reachable downstream from *node_id* via directed edges."""
    if node_id not in g:
        return []
    return list(nx.descendants(g, node_id))


def get_direct_dependents(g: nx.DiGraph, node_id: str) -> list[str]:
    """Return immediate successors (nodes that directly depend on *node_id*)."""
    if node_id not in g:
        return []
    return list(g.successors(node_id))


def get_upstream_providers(g: nx.DiGraph, node_id: str) -> list[str]:
    """Return immediate predecessors (nodes that *node_id* depends on)."""
    if node_id not in g:
        return []
    return list(g.predecessors(node_id))


def get_alternate_paths(
    g: nx.DiGraph,
    source: str,
    target: str,
    excluded: set[str] | None = None,
    cutoff: int = 6,
) -> list[list[str]]:
    """Find simple paths from *source* to *target*, excluding certain nodes."""
    excluded = excluded or set()
    sub = g.copy()
    sub.remove_nodes_from(excluded)
    try:
        return list(nx.all_simple_paths(sub, source, target, cutoff=cutoff))
    except (nx.NetworkXError, nx.NodeNotFound):
        return []


def has_alternate_path(
    g: nx.DiGraph,
    target: str,
    failed_nodes: set[str],
) -> tuple[bool, list[list[str]]]:
    """Check whether *target* can still be reached from any root node
    (node with in-degree == 0) after removing *failed_nodes*.
    Returns (reachable, alternate_paths).
    """
    sub = g.copy()
    sub.remove_nodes_from(failed_nodes)
    if target not in sub:
        return False, []

    roots = [n for n in sub.nodes() if sub.in_degree(n) == 0]
    alt_paths: list[list[str]] = []
    for root in roots:
        try:
            paths = list(nx.all_simple_paths(sub, root, target, cutoff=6))
            alt_paths.extend(paths)
        except (nx.NetworkXError, nx.NodeNotFound):
            continue
    return len(alt_paths) > 0, alt_paths


def calculate_connectivity(g: nx.DiGraph, node_id: str) -> float:
    """Normalised degree centrality for a node (0-1)."""
    if node_id not in g:
        return 0.0
    centrality = nx.degree_centrality(g)
    return centrality.get(node_id, 0.0)


def calculate_betweenness(g: nx.DiGraph, node_id: str) -> float:
    """Betweenness centrality for a node (0-1)."""
    if node_id not in g:
        return 0.0
    centrality = nx.betweenness_centrality(g)
    return centrality.get(node_id, 0.0)


def get_all_paths_through(
    g: nx.DiGraph, node_id: str, cutoff: int = 6,
) -> list[list[str]]:
    """Return all simple paths that pass through *node_id*."""
    if node_id not in g:
        return []
    paths: list[list[str]] = []
    predecessors = nx.ancestors(g, node_id)
    successors = nx.descendants(g, node_id)
    for pred in predecessors:
        for succ in successors:
            try:
                for p in nx.all_simple_paths(g, pred, succ, cutoff=cutoff):
                    if node_id in p:
                        paths.append(p)
            except (nx.NetworkXError, nx.NodeNotFound):
                continue
    return paths


# Singleton graph instance for the application
_graph: nx.DiGraph | None = None


def get_graph() -> nx.DiGraph:
    """Return the shared application graph (lazily built)."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def reset_graph() -> nx.DiGraph:
    """Rebuild the graph from seed data (used after simulation reset)."""
    global _graph
    _graph = build_graph()
    return _graph
