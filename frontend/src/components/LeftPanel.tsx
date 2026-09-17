// ResiliNet – Left Panel: Asset list, filter, simulate button
// Props backward-compatible: className / panelId are optional UI-only additions.

import { memo, useMemo, useState } from "react";
import { Siren } from "lucide-react";
import type { InfrastructureAsset, CriticalAssetResponse, ScenarioStatus } from "../types";
import { AssetType } from "../types";
import {
  ASSET_TYPE_ICONS,
  ASSET_TYPE_COLORS,
  criticalityColor,
  criticalityLabel,
  STATUS_COLORS,
} from "../utils/helpers";
import { AssetListSkeleton } from "./Skeleton";

interface LeftPanelProps {
  assets: InfrastructureAsset[];
  criticalAssets: CriticalAssetResponse[];
  selectedAssetId: string | null;
  scenarioStatus: ScenarioStatus;
  assetStatuses: Record<string, string>;
  onSelectAsset: (id: string | null) => void;
  onSimulateFailure: (id: string) => void;
  loading: boolean;
  className?: string;
  panelId?: string;
}

const ASSET_TYPES = Object.values(AssetType);

export const LeftPanel = memo(function LeftPanel({
  assets,
  criticalAssets,
  selectedAssetId,
  scenarioStatus,
  assetStatuses,
  onSelectAsset,
  onSimulateFailure,
  loading,
  className = "",
  panelId = "resilinet-left-panel",
}: LeftPanelProps) {
  const [typeFilter, setTypeFilter] = useState<AssetType | null>(null);

  const filteredAssets = useMemo(
    () => (typeFilter ? assets.filter((a) => a.type === typeFilter) : assets),
    [assets, typeFilter]
  );

  const selectedCritical = criticalAssets.find(
    (c) => c.asset.id === selectedAssetId
  );

  const simulating = loading && scenarioStatus === "SIMULATING";

  return (
    <aside id={panelId} className={`left-panel ${className}`} aria-label="Infrastructure assets">
      <div className="left-panel-header">
        <div>
          <span className="eyebrow">Control center</span>
          <h2 className="panel-title">Infrastructure assets</h2>
        </div>
        <span className="asset-count">{assets.length} nodes</span>
      </div>

      {/* Type filter */}
      <div className="type-filters" role="group" aria-label="Filter by asset type">
        <button
          type="button"
          className={`type-filter-btn ${typeFilter === null ? "active" : ""}`}
          onClick={() => setTypeFilter(null)}
          aria-pressed={typeFilter === null}
        >
          All
        </button>
        {ASSET_TYPES.map((t) => {
          const TypeIcon = ASSET_TYPE_ICONS[t];
          return (
            <button
              type="button"
              key={t}
              className={`type-filter-btn ${typeFilter === t ? "active" : ""}`}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              aria-pressed={typeFilter === t}
              style={{
                borderColor: typeFilter === t ? ASSET_TYPE_COLORS[t] : undefined,
              }}
            >
              <TypeIcon size={12} strokeWidth={2.25} aria-hidden="true" />
              {t.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {/* Simulate Failure button */}
      <button
        type="button"
        className="btn-simulate"
        onClick={() => selectedAssetId && onSimulateFailure(selectedAssetId)}
        disabled={!selectedAssetId || loading || scenarioStatus !== "IDLE"}
        aria-busy={simulating}
      >
        {simulating ? (
          <span className="btn-loading">
            <span className="inline-spinner" aria-hidden="true" /> Simulating
          </span>
        ) : (
          <>
            <Siren size={14} strokeWidth={2.25} aria-hidden="true" /> Inject failure
          </>
        )}
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
            <CritBar label="Downstream deps" value={selectedCritical.criticality.downstream_dependencies} />
            <CritBar label="Population" value={selectedCritical.criticality.population_served} />
            <CritBar label="Alt path scarcity" value={selectedCritical.criticality.alternative_path_scarcity} />
          </div>
          <p className="criticality-explanation">
            {selectedCritical.criticality.explanation}
          </p>
        </div>
      )}

      {/* Asset list */}
      <div className="asset-list" role="listbox" aria-label="Assets" aria-busy={loading}>
        {loading && assets.length === 0 ? (
          <AssetListSkeleton rows={6} />
        ) : filteredAssets.length === 0 ? (
          <div className="empty-step" role="status">
            No assets match this filter.
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const status = assetStatuses[asset.id] || "OPERATIONAL";
            const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OPERATIONAL;
            const isSelected = asset.id === selectedAssetId;
            const AssetIcon = ASSET_TYPE_ICONS[asset.type];

            return (
              <div
                key={asset.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={`asset-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectAsset(isSelected ? null : asset.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAsset(isSelected ? null : asset.id);
                  }
                }}
              >
                <div className="asset-card-header">
                  <span className="asset-icon" aria-hidden="true">
                    <AssetIcon size={14} strokeWidth={2.25} />
                  </span>
                  <div className="asset-card-info">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-type-label">{asset.type.replace(/_/g, " ")}</span>
                  </div>
                  <span className="asset-status-dot" style={{ backgroundColor: statusColor }} title={status} aria-label={`Status: ${status}`} />
                </div>
                <div className="asset-card-meta">
                  <span className="asset-criticality" style={{ color: criticalityColor(asset.criticality) }}>
                    Criticality {asset.criticality.toFixed(0)}
                  </span>
                  <span className="asset-pop">Pop {asset.population_served.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
});

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
