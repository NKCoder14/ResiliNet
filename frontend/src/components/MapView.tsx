// ResiliNet – MapView component: Leaflet interactive map

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import type { InfrastructureAsset, Edge, SimulationResult } from "../types";
import { AssetType } from "../types";
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, STATUS_MAP_COLORS } from "../utils/helpers";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  nodes: InfrastructureAsset[];
  edges: Edge[];
  selectedAssetId: string | null;
  simulationResult: SimulationResult | null;
  interventionResult: SimulationResult | null;
  onSelectAsset: (id: string | null) => void;
}

// Center of our demo city
const CENTER: [number, number] = [28.632, 77.225];
const ZOOM = 14;

function getNodeStatus(
  nodeId: string,
  selectedId: string | null,
  simResult: SimulationResult | null,
  intResult: SimulationResult | null
): string {
  if (nodeId === selectedId && !simResult) return "SELECTED";
  if (intResult) {
    if (intResult.failed_assets.includes(nodeId)) return "FAILED";
    if (intResult.affected_assets.includes(nodeId)) return "AFFECTED";
    const detail = intResult.affected_asset_details[nodeId];
    if (detail) return detail;
  }
  if (simResult) {
    if (simResult.failed_assets.includes(nodeId)) return "FAILED";
    if (simResult.affected_assets.includes(nodeId)) return "AFFECTED";
    const detail = simResult.affected_asset_details[nodeId];
    if (detail) return detail;
  }
  if (nodeId === selectedId) return "SELECTED";
  return "OPERATIONAL";
}

function getEdgeColor(
  source: string,
  target: string,
  simResult: SimulationResult | null
): string {
  if (!simResult) return "rgba(148, 163, 184, 0.3)";
  const sourceStatus = simResult.affected_asset_details[source] || (simResult.failed_assets.includes(source) ? "FAILED" : "");
  const targetStatus = simResult.affected_asset_details[target] || (simResult.failed_assets.includes(target) ? "FAILED" : "");
  
  if (sourceStatus === "FAILED" || targetStatus === "FAILED") return "#ef4444";
  if (sourceStatus === "AFFECTED" || targetStatus === "AFFECTED") return "#f97316";
  if (sourceStatus === "DEGRADED" || targetStatus === "DEGRADED") return "#eab308";
  return "rgba(148, 163, 184, 0.3)";
}

function getNodeRadius(type: AssetType): number {
  switch (type) {
    case AssetType.HOSPITAL: return 12;
    case AssetType.BRIDGE: return 11;
    case AssetType.POWER: return 10;
    case AssetType.WATER: return 10;
    case AssetType.EMERGENCY_FACILITY: return 10;
    case AssetType.ROAD: return 8;
    default: return 8;
  }
}

function MapController({ selectedAssetId, nodes }: { selectedAssetId: string | null; nodes: InfrastructureAsset[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedAssetId) {
      const node = nodes.find((n) => n.id === selectedAssetId);
      if (node) {
        map.flyTo([node.latitude, node.longitude], 15, { duration: 0.8 });
      }
    }
  }, [selectedAssetId, nodes, map]);

  return null;
}

export function MapView({
  nodes,
  edges,
  selectedAssetId,
  simulationResult,
  interventionResult,
  onSelectAsset,
}: MapViewProps) {
  const nodeMap = useRef<Map<string, InfrastructureAsset>>(new Map());

  useEffect(() => {
    const map = new Map<string, InfrastructureAsset>();
    nodes.forEach((n) => map.set(n.id, n));
    nodeMap.current = map;
  }, [nodes]);

  const getNodePos = (id: string): [number, number] | null => {
    const node = nodeMap.current.get(id);
    return node ? [node.latitude, node.longitude] : null;
  };

  const activeResult = interventionResult || simulationResult;

  return (
    <div className="map-container">
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController selectedAssetId={selectedAssetId} nodes={nodes} />

        {/* Edges */}
        {edges.map((edge, i) => {
          const sourcePos = getNodePos(edge.source);
          const targetPos = getNodePos(edge.target);
          if (!sourcePos || !targetPos) return null;

          const color = getEdgeColor(edge.source, edge.target, activeResult);
          const isAffectedEdge = color !== "rgba(148, 163, 184, 0.3)";

          return (
            <Polyline
              key={`edge-${i}`}
              positions={[sourcePos, targetPos]}
              pathOptions={{
                color,
                weight: isAffectedEdge ? 3 : 1.5,
                opacity: isAffectedEdge ? 0.9 : 0.4,
                dashArray: edge.edge_type === "bypass" ? "8 4" : undefined,
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const status = getNodeStatus(node.id, selectedAssetId, simulationResult, interventionResult);
          const color = STATUS_MAP_COLORS[status] || ASSET_TYPE_COLORS[node.type];
          const radius = getNodeRadius(node.type);
          const isSelected = node.id === selectedAssetId;
          const isAffected = status === "FAILED" || status === "AFFECTED";

          return (
            <CircleMarker
              key={node.id}
              center={[node.latitude, node.longitude]}
              radius={isSelected ? radius + 3 : radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.9,
                color: isSelected ? "#ffffff" : isAffected ? color : "rgba(255,255,255,0.3)",
                weight: isSelected ? 3 : isAffected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => onSelectAsset(node.id === selectedAssetId ? null : node.id),
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="popup-title">
                    <span>{ASSET_TYPE_ICONS[node.type]}</span>
                    <span>{node.name}</span>
                  </div>
                  <div className="popup-type">{node.type.replace(/_/g, " ")}</div>
                  <div className="popup-stats">
                    <span>Status</span>
                    <strong style={{ color }}>{status}</strong>
                  </div>
                  <div className="popup-stats">
                    <span>Criticality</span>
                    <strong>{node.criticality.toFixed(1)}/100</strong>
                  </div>
                  <div className="popup-stats">
                    <span>Pop. Served</span>
                    <strong>{node.population_served.toLocaleString()}</strong>
                  </div>
                  <div className="popup-stats">
                    <span>Capacity</span>
                    <strong>{node.capacity} units</strong>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map legend */}
      <div className="map-legend">
        <div className="map-legend-title">Status</div>
        {Object.entries(STATUS_MAP_COLORS).filter(([k]) => k !== "INTERVENTION").map(([label, color]) => (
          <div key={label} className="map-legend-item">
            <span className="map-legend-dot" style={{ backgroundColor: color }} />
            <span>{label.charAt(0) + label.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
