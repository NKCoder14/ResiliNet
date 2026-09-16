// ResiliNet – Right Panel: Impact Analysis, Interventions, Recommendations

import { useState } from "react";
import type { SimulationResult, ImpactMetrics, InterventionType } from "../types";
import { ExplainPanel } from "./ExplainPanel";
import { TimelinePanel } from "./TimelinePanel";
import { InterventionPanel } from "./InterventionPanel";
import { ScenarioComparison } from "./ScenarioComparison";

interface RightPanelProps {
  simulationResult: SimulationResult | null;
  interventionResult: SimulationResult | null;
  baselineMetrics: ImpactMetrics | null;
  activeIntervention: InterventionType | null;
  onRunIntervention: (type: InterventionType, targetId?: string | null) => void;
  loading: boolean;
}

type Tab = "impact" | "interventions" | "timeline";

export function RightPanel({
  simulationResult,
  interventionResult,
  baselineMetrics: _baselineMetrics,
  activeIntervention,
  onRunIntervention,
  loading,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("impact");

  if (!simulationResult) {
    return (
      <aside className="right-panel">
        <div className="right-panel-empty">
          <div className="empty-icon">🎯</div>
          <h3>No Simulation Active</h3>
          <p>
            Select an infrastructure asset from the left panel and click
            <strong> "Simulate Failure" </strong>
            to analyze cascading impacts.
          </p>
          <div className="empty-steps">
            <div className="empty-step">1. Select a critical asset</div>
            <div className="empty-step">2. Click "Simulate Failure"</div>
            <div className="empty-step">3. View cascade effects</div>
            <div className="empty-step">4. Compare interventions</div>
          </div>
        </div>
      </aside>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "impact", label: "Impact", icon: "💥" },
    { key: "interventions", label: "Interventions", icon: "🎯" },
    { key: "timeline", label: "Timeline", icon: "📋" },
  ];

  return (
    <aside className="right-panel">
      {/* Tab bar */}
      <div className="right-panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`right-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="right-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="right-panel-content">
        {interventionResult && (
          <div className="active-intervention-banner">
            <div className="banner-header">
              <span className="banner-tag">APPLIED INTERVENTION</span>
              <span className="banner-type">{activeIntervention}</span>
            </div>
            {interventionResult.impact_metrics && simulationResult.impact_metrics && (
              <div className="banner-stats">
                <span>
                  Resilience: <strong>{interventionResult.impact_metrics.resilience_score.toFixed(1)}</strong>
                  {" "}(was {simulationResult.impact_metrics.resilience_score.toFixed(1)})
                </span>
                <span>
                  Affected Pop: <strong>{interventionResult.impact_metrics.population_affected.toLocaleString()}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === "impact" && (
          <>
            <ExplainPanel simulationResult={interventionResult || simulationResult} />
            {simulationResult.impact_metrics && (
              <ScenarioComparison
                baseMetrics={simulationResult.impact_metrics}
                options={simulationResult.intervention_options}
                recommendation={simulationResult.recommendation}
              />
            )}
          </>
        )}

        {activeTab === "interventions" && simulationResult.impact_metrics && (
          <InterventionPanel
            options={simulationResult.intervention_options}
            baseMetrics={simulationResult.impact_metrics}
            recommendation={simulationResult.recommendation}
            recommendationExplanation={simulationResult.recommendation_explanation}
            activeIntervention={activeIntervention}
            onRunIntervention={onRunIntervention}
            loading={loading}
          />
        )}

        {activeTab === "timeline" && (
          <TimelinePanel timeline={(interventionResult || simulationResult).timeline} />
        )}
      </div>
    </aside>
  );
}
