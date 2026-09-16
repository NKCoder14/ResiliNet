// ResiliNet – ScenarioComparison: Recharts bar chart + comparison table

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { InterventionOption, ImpactMetrics } from "../types";

interface ScenarioComparisonProps {
  baseMetrics: ImpactMetrics;
  options: InterventionOption[];
  recommendation: string | null;
}

export function ScenarioComparison({
  baseMetrics,
  options,
  recommendation,
}: ScenarioComparisonProps) {
  if (!options || options.length === 0) return null;

  const chartData = [
    {
      name: "Do Nothing",
      population: baseMetrics.population_affected,
      assets: baseMetrics.affected_assets,
      delay: baseMetrics.average_delay,
      resilience: baseMetrics.resilience_score,
    },
    ...options.map((opt) => ({
      name: opt.label.length > 18 ? opt.label.substring(0, 16) + "…" : opt.label,
      population: opt.metrics.population_affected,
      assets: opt.metrics.affected_assets,
      delay: opt.metrics.average_delay,
      resilience: opt.metrics.resilience_score,
    })),
  ];

  return (
    <div className="scenario-comparison">
      <h3 className="panel-title">
        <span className="panel-title-icon">📊</span>
        Scenario Comparison
      </h3>

      {/* Bar Chart */}
      <div className="chart-container">
        <h4 className="chart-subtitle">Resilience Score by Scenario</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
            <Bar dataKey="resilience" name="Resilience" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="assets" name="Assets Disrupted" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="comparison-table-wrapper">
        <h4 className="chart-subtitle">Detailed Comparison</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Pop. Affected</th>
              <th>Assets</th>
              <th>Avg Delay</th>
              <th>Recovery</th>
              <th>Resilience</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Do Nothing</td>
              <td className="table-danger">{baseMetrics.population_affected.toLocaleString()}</td>
              <td className="table-warning">{baseMetrics.affected_assets}</td>
              <td>{baseMetrics.average_delay.toFixed(1)} min</td>
              <td>{baseMetrics.estimated_recovery}h</td>
              <td className="table-danger">{baseMetrics.resilience_score.toFixed(1)}</td>
            </tr>
            {options.map((opt) => {
              const isRec = recommendation === opt.intervention_type;
              return (
                <tr key={opt.intervention_type} className={isRec ? "recommended-row" : ""}>
                  <td>
                    {isRec && <span className="rec-star">★ </span>}
                    {opt.label}
                  </td>
                  <td className={opt.metrics.population_affected === 0 ? "table-success" : ""}>
                    {opt.metrics.population_affected.toLocaleString()}
                  </td>
                  <td className={opt.metrics.affected_assets === 0 ? "table-success" : ""}>
                    {opt.metrics.affected_assets}
                  </td>
                  <td>{opt.metrics.average_delay.toFixed(1)} min</td>
                  <td>{opt.metrics.estimated_recovery > 0 ? `${opt.metrics.estimated_recovery}h` : "—"}</td>
                  <td className={opt.metrics.resilience_score >= 80 ? "table-success" : ""}>
                    {opt.metrics.resilience_score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="comparison-disclaimer">
        All values are simulation-based estimates. Results depend on modeled assumptions.
      </div>
    </div>
  );
}
