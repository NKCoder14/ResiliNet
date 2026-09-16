// ResiliNet – KPI Cards component

import type { ImpactMetrics } from "../types";
import { formatNumber, formatHours, resilienceColor } from "../utils/helpers";

interface KPICardsProps {
  metrics: ImpactMetrics | null;
  baselineMetrics: ImpactMetrics | null;
  isSimulated: boolean;
}

interface KPICardData {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtitle: string;
}

export function KPICards({ metrics, baselineMetrics, isSimulated }: KPICardsProps) {
  const m = metrics || baselineMetrics;
  if (!m) return null;

  const cards: KPICardData[] = [
    {
      label: "Resilience Score",
      value: m.resilience_score.toFixed(1),
      icon: "🛡️",
      color: resilienceColor(m.resilience_score),
      subtitle: isSimulated ? "Post-simulation" : "Baseline",
    },
    {
      label: "Population Affected",
      value: formatNumber(m.population_affected),
      icon: "👥",
      color: m.population_affected > 0 ? "#ef4444" : "#4ade80",
      subtitle: isSimulated ? "Estimated impact" : "No impact",
    },
    {
      label: "Assets Disrupted",
      value: `${m.affected_assets}`,
      icon: "⚠️",
      color: m.affected_assets > 0 ? "#f97316" : "#4ade80",
      subtitle: isSimulated ? "Nodes affected" : "All operational",
    },
    {
      label: "Avg. Delay",
      value: `${m.average_delay.toFixed(1)} min`,
      icon: "⏱️",
      color: m.average_delay > 10 ? "#ef4444" : m.average_delay > 5 ? "#eab308" : "#4ade80",
      subtitle: isSimulated ? "Travel time impact" : "Normal conditions",
    },
    {
      label: "Recovery Estimate",
      value: m.estimated_recovery > 0 ? formatHours(m.estimated_recovery) : "—",
      icon: "🔧",
      color: m.estimated_recovery > 48 ? "#ef4444" : m.estimated_recovery > 24 ? "#f97316" : "#4ade80",
      subtitle: isSimulated ? "Estimated time" : "No recovery needed",
    },
  ];

  return (
    <div className="kpi-cards">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-icon">{card.icon}</span>
            <span className="kpi-card-label">{card.label}</span>
          </div>
          <div className="kpi-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="kpi-card-subtitle">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
