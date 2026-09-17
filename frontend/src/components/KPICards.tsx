// ResiliNet – KPI Cards component (props unchanged, added meter + memo)

import { memo, useMemo } from "react";
import { Clock, ShieldCheck, TriangleAlert, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  color: string;
  subtitle: string;
  meter: number;
}

export const KPICards = memo(function KPICards({ metrics, baselineMetrics, isSimulated }: KPICardsProps) {
  const m = metrics || baselineMetrics;

  const cards: KPICardData[] = useMemo(() => {
    if (!m) return [];
    return [
      {
        label: "Resilience score",
        value: m.resilience_score.toFixed(1),
        icon: ShieldCheck,
        color: resilienceColor(m.resilience_score),
        subtitle: isSimulated ? "Post-simulation" : "Baseline",
        meter: m.resilience_score,
      },
      {
        label: "Population affected",
        value: formatNumber(m.population_affected),
        icon: Users,
        color: m.population_affected > 0 ? "#ef4444" : "#22c55e",
        subtitle: isSimulated ? "Estimated impact" : "No impact",
        meter: m.population_affected > 0 ? 82 : 6,
      },
      {
        label: "Assets disrupted",
        value: `${m.affected_assets}`,
        icon: TriangleAlert,
        color: m.affected_assets > 0 ? "#f59e0b" : "#22c55e",
        subtitle: isSimulated ? "Nodes affected" : "All operational",
        meter: Math.min(100, m.affected_assets * 12),
      },
      {
        label: "Avg delay",
        value: `${m.average_delay.toFixed(1)} min`,
        icon: Clock,
        color: m.average_delay > 10 ? "#ef4444" : m.average_delay > 5 ? "#f59e0b" : "#22c55e",
        subtitle: isSimulated ? "Travel time impact" : "Normal conditions",
        meter: Math.min(100, m.average_delay * 6),
      },
      {
        label: "Recovery estimate",
        value: m.estimated_recovery > 0 ? formatHours(m.estimated_recovery) : "—",
        icon: Wrench,
        color: m.estimated_recovery > 48 ? "#ef4444" : m.estimated_recovery > 24 ? "#f59e0b" : "#22c55e",
        subtitle: isSimulated ? "Estimated time" : "No recovery needed",
        meter: Math.min(100, m.estimated_recovery * 1.4),
      },
    ];
  }, [m, isSimulated]);

  if (!m) return null;

  return (
    <div className="kpi-cards" role="region" aria-label="Key impact indicators">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-label">{card.label}</span>
              <span className="kpi-card-icon" aria-hidden="true">
                <Icon size={15} strokeWidth={2} />
              </span>
            </div>
            <div className="kpi-card-value" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="kpi-card-subtitle">{card.subtitle}</div>
            <div className="kpi-line" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(4, card.meter))}%`, background: card.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
});
