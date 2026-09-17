// ResiliNet – Right Panel: Impact Analysis, Interventions, Recommendations
// Props backward-compatible: className / panelId are optional UI-only additions.

import { memo, useState } from "react";
import { Activity, Crosshair, History, MousePointerClick } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SimulationResult, ImpactMetrics, InterventionType } from "../types";
import { ExplainPanel } from "./ExplainPanel";
import { TimelinePanel } from "./TimelinePanel";
import { InterventionPanel } from "./InterventionPanel";
import { ScenarioComparison } from "./ScenarioComparison";
import { PanelSkeleton } from "./Skeleton";

interface RightPanelProps {
  simulationResult: SimulationResult | null;
  interventionResult: SimulationResult | null;
  baselineMetrics: ImpactMetrics | null;
  activeIntervention: InterventionType | null;
  onRunIntervention: (type: InterventionType, targetId?: string | null) => void;
  loading: boolean;
  className?: string;
  panelId?: string;
}

type Tab = "impact" | "interventions" | "timeline";

export const RightPanel = memo(function RightPanel({
  simulationResult,
  interventionResult,
  baselineMetrics: _baselineMetrics,
  activeIntervention,
  onRunIntervention,
  loading,
  className = "",
  panelId = "resilinet-right-panel",
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("impact");

  if (!simulationResult) {
    return (
      <aside id={panelId} className={`right-panel ${className}`} aria-label="Analysis">
        <div className="right-panel-empty">
          <div className="empty-icon" aria-hidden="true">
            <MousePointerClick size={22} strokeWidth={1.75} />
          </div>
          <span className="eyebrow">Decision support</span>
          <h3>No simulation active</h3>
          <p>
            Select an infrastructure asset from the left panel and run
            <strong> Inject failure </strong>
            to analyze cascading impacts.
          </p>
          {loading ? (
            <PanelSkeleton lines={4} />
          ) : (
            <div className="empty-steps">
              <div className="empty-step">1. Select a critical asset</div>
              <div className="empty-step">2. Run Inject failure</div>
              <div className="empty-step">3. Review cascade effects</div>
              <div className="empty-step">4. Compare interventions</div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "impact", label: "Impact", icon: Activity },
    { key: "interventions", label: "Interventions", icon: Crosshair },
    { key: "timeline", label: "Timeline", icon: History },
  ];

  return (
    <aside id={panelId} className={`right-panel ${className}`} aria-label="Analysis">
      {/* Tab bar */}
      <div className="right-panel-tabs" role="tablist" aria-label="Analysis views">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`right-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="right-tab-icon" aria-hidden="true">
                <TabIcon size={13} strokeWidth={2.25} />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="right-panel-content" role="tabpanel" aria-busy={loading}>
        {interventionResult && (
          <div className="active-intervention-banner">
            <div className="banner-header">
              <span className="banner-tag">Applied intervention</span>
              <span className="banner-type">{activeIntervention}</span>
            </div>
            {interventionResult.impact_metrics && simulationResult.impact_metrics && (
              <div className="banner-stats">
                <span>
                  Resilience <strong>{interventionResult.impact_metrics.resilience_score.toFixed(1)}</strong>
                  {" "}(was {simulationResult.impact_metrics.resilience_score.toFixed(1)})
                </span>
                <span>
                  Affected pop <strong>{interventionResult.impact_metrics.population_affected.toLocaleString()}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {loading && !interventionResult ? (
          <PanelSkeleton lines={5} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
});
