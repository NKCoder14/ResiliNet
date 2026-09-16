// ResiliNet – Left Panel: Asset list, filter, simulate button

import { useState } from "react";
import type { InfrastructureAsset, CriticalAssetResponse, ScenarioStatus } from "../types";
import { AssetType } from "../types";
import {
  ASSET_TYPE_ICONS,
  ASSET_TYPE_COLORS,
  criticalityColor,
  criticalityLabel,
  STATUS_COLORS,
} from "../utils/helpers";

interface LeftPanelProps {
  assets: InfrastructureAsset[];
  criticalAssets: CriticalAssetResponse[];
  selectedAssetId: string | null;
  scenarioStatus: ScenarioStatus;
  assetStatuses: Record<string, string>;
  onSelectAsset: (id: string | null) => void;
  onSimulateFailure: (id: string) => void;
  loading: boolean;
}

const ASSET_TYPES = Object.values(AssetType);

export function LeftPanel({
  assets,
  criticalAssets,
  selectedAssetId,
  scenarioStatus,
  assetStatuses,
  onSelectAsset,
  onSimulateFailure,
  loading,
}: LeftPanelProps) {
  const [typeFilter, setTypeFilter] = useState<AssetType | null>(null);

  const filteredAssets = typeFilter
    ? assets.filter((a) => a.type === typeFilter)
    : assets;

  const selectedCritical = criticalAssets.find(
    (c) => c.asset.id === selectedAssetId
  );

  return (
    <aside className="left-panel">
      <div className="left-panel-header">
        <h2 className="panel-title">Infrastructure Assets</h2>
        <span className="asset-count">{assets.length} nodes</span>
      </div>

      {/* Type filter */}
      <div className="type-filters">
        <button
          className={`type-filter-btn ${typeFilter === null ? "active" : ""}`}
          onClick={() => setTypeFilter(null)}
        >
          All
        </button>
        {ASSET_TYPES.map((t) => (
          <button
            key={t}
            className={`type-filter-btn ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            style={{
              borderColor: typeFilter === t ? ASSET_TYPE_COLORS[t] : undefined,
            }}
          >
            {ASSET_TYPE_ICONS[t]} {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Simulate Failure button */}
      <button
        className="btn-simulate"
        onClick={() => selectedAssetId && onSimulateFailure(selectedAssetId)}
        disabled={!selectedAssetId || loading || scenarioStatus !== "IDLE"}
      >
        {loading ? "⏳ Simulating…" : "⚡ SIMULATE FAILURE"}
      </button>

      {/* Criticality explanation */}
      {selectedCritical && (
        <div className="criticality-panel">
          <h3 className="criticality-title">Why is this asset critical?</h3>
          <div className="criticality-score" style={{ color: criticalityColor(selectedCritical.criticality.score) }}>
            {selectedCritical.criticality.score.toFixed(1)}/100
            <span className="criticality-label">
              {criticalityLabel(selectedCritical.criticality.score)}
            </span>
          </div>
          <div className="criticality-bars">
            <CritBar label="Connectivity" value={selectedCritical.criticality.connectivity} />
            <CritBar label="Downstream Deps" value={selectedCritical.criticality.downstream_dependencies} />
            <CritBar label="Population" value={selectedCritical.criticality.population_served} />
            <CritBar label="Alt. Path Scarcity" value={selectedCritical.criticality.alternative_path_scarcity} />
          </div>
          <p className="criticality-explanation">
            {selectedCritical.criticality.explanation}
          </p>
        </div>
      )}

      {/* Asset list */}
      <div className="asset-list">
        {filteredAssets.map((asset) => {
          const status = assetStatuses[asset.id] || "OPERATIONAL";
          const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OPERATIONAL;
          const isSelected = asset.id === selectedAssetId;

          return (
            <div
              key={asset.id}
              className={`asset-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectAsset(isSelected ? null : asset.id)}
            >
              <div className="asset-card-header">
                <span className="asset-icon">{ASSET_TYPE_ICONS[asset.type]}</span>
                <div className="asset-card-info">
                  <span className="asset-name">{asset.name}</span>
                  <span className="asset-type-label">{asset.type.replace(/_/g, " ")}</span>
                </div>
                <span className="asset-status-dot" style={{ backgroundColor: statusColor }} title={status} />
              </div>
              <div className="asset-card-meta">
                <span className="asset-criticality" style={{ color: criticalityColor(asset.criticality) }}>
                  Criticality: {asset.criticality.toFixed(0)}
                </span>
                <span className="asset-pop">Pop: {asset.population_served.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function CritBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="crit-bar">
      <div className="crit-bar-label">
        <span>{label}</span>
        <span>{value.toFixed(0)}</span>
      </div>
      <div className="crit-bar-track">
        <div
          className="crit-bar-fill"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
