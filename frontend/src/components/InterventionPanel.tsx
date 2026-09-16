// ResiliNet – InterventionPanel: What-if options & comparison

import type { InterventionOption, ImpactMetrics, InterventionType } from "../types";
import { formatNumber, formatHours, resilienceColor } from "../utils/helpers";

interface InterventionPanelProps {
  options: InterventionOption[];
  baseMetrics: ImpactMetrics;
  recommendation: string | null;
  recommendationExplanation: string | null;
  activeIntervention: InterventionType | null;
  onRunIntervention: (type: InterventionType, targetId?: string | null) => void;
  loading: boolean;
}

const INTERVENTION_ICONS: Record<string, string> = {
  REPAIR: "🔧",
  REROUTE: "🔀",
  REINFORCE: "🛡️",
  ADD_CONNECTION: "🔗",
};

export function InterventionPanel({
  options,
  baseMetrics,
  recommendation,
  recommendationExplanation,
  activeIntervention,
  onRunIntervention,
  loading,
}: InterventionPanelProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="intervention-panel">
      <h3 className="panel-title">
        <span className="panel-title-icon">🎯</span>
        Compare Interventions
      </h3>

      {/* Recommendation */}
      {recommendation && recommendationExplanation && (
        <div className="recommendation-box">
          <div className="recommendation-header">
            <span className="recommendation-icon">✨</span>
            <span className="recommendation-title">Recommended Intervention</span>
          </div>
          <div className="recommendation-text">
            {recommendationExplanation.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Intervention option cards */}
      <div className="intervention-options">
        {/* Do Nothing baseline */}
        <div className={`intervention-card ${!activeIntervention ? "active" : ""}`}>
          <div className="intervention-card-header">
            <span className="intervention-icon">⚠️</span>
            <div>
              <span className="intervention-label">Do Nothing</span>
              <span className="intervention-desc">No intervention applied</span>
            </div>
          </div>
          <div className="intervention-metrics">
            <MetricRow label="Population" value={formatNumber(baseMetrics.population_affected)} color="#ef4444" />
            <MetricRow label="Assets" value={`${baseMetrics.affected_assets}`} color="#f97316" />
            <MetricRow label="Delay" value={`${baseMetrics.average_delay.toFixed(1)} min`} color="#eab308" />
            <MetricRow label="Recovery" value={formatHours(baseMetrics.estimated_recovery)} color="#94a3b8" />
            <MetricRow label="Resilience" value={`${baseMetrics.resilience_score.toFixed(1)}`} color={resilienceColor(baseMetrics.resilience_score)} />
          </div>
        </div>

        {options.map((opt) => {
          const isActive = activeIntervention === opt.intervention_type;
          const isRecommended = recommendation === opt.intervention_type;
          const m = opt.metrics;
          const popDiff = baseMetrics.population_affected - m.population_affected;
          const resDiff = m.resilience_score - baseMetrics.resilience_score;

          return (
            <div
              key={opt.intervention_type}
              className={`intervention-card ${isActive ? "active" : ""} ${isRecommended ? "recommended" : ""}`}
            >
              {isRecommended && <span className="recommended-badge">★ Recommended</span>}
              <div className="intervention-card-header">
                <span className="intervention-icon">
                  {INTERVENTION_ICONS[opt.intervention_type] || "🔧"}
                </span>
                <div>
                  <span className="intervention-label">{opt.label}</span>
                  <span className="intervention-desc">{opt.description}</span>
                </div>
              </div>
              <div className="intervention-metrics">
                <MetricRow
                  label="Population"
                  value={formatNumber(m.population_affected)}
                  diff={popDiff > 0 ? `-${formatNumber(popDiff)}` : undefined}
                  color={m.population_affected === 0 ? "#4ade80" : "#ef4444"}
                />
                <MetricRow label="Assets" value={`${m.affected_assets}`} color={m.affected_assets === 0 ? "#4ade80" : "#f97316"} />
                <MetricRow label="Delay" value={`${m.average_delay.toFixed(1)} min`} color={m.average_delay <= 5 ? "#4ade80" : "#eab308"} />
                <MetricRow label="Recovery" value={m.estimated_recovery > 0 ? formatHours(m.estimated_recovery) : "—"} color="#94a3b8" />
                <MetricRow
                  label="Resilience"
                  value={`${m.resilience_score.toFixed(1)}`}
                  diff={resDiff > 0 ? `+${resDiff.toFixed(1)}` : undefined}
                  color={resilienceColor(m.resilience_score)}
                />
              </div>
              <button
                className="btn-apply-intervention"
                onClick={() => onRunIntervention(opt.intervention_type, opt.target_asset_id)}
                disabled={loading || isActive}
              >
                {isActive ? "✓ Applied" : "Apply Intervention"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  diff,
  color,
}: {
  label: string;
  value: string;
  diff?: string;
  color: string;
}) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={{ color }}>
        {value}
        {diff && <span className="metric-diff">{diff}</span>}
      </span>
    </div>
  );
}
