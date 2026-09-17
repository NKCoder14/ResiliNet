// ResiliNet – ExplainPanel: "Why did this happen?" propagation path & reasoning
// Memoized; rendering logic unchanged.

import { memo } from "react";
import { Waypoints } from "lucide-react";
import type { SimulationResult } from "../types";
import { SEVERITY_COLORS } from "../utils/helpers";

interface ExplainPanelProps {
  simulationResult: SimulationResult | null;
}

export const ExplainPanel = memo(function ExplainPanel({ simulationResult }: ExplainPanelProps) {
  if (!simulationResult) return null;

  const { propagation_paths, propagation_steps } = simulationResult;

  return (
    <div className="explain-panel">
      <h3 className="panel-title">
        <span className="panel-title-icon" aria-hidden="true">
          <Waypoints size={15} strokeWidth={2} />
        </span>
        Why did it propagate?
      </h3>

      {/* Propagation path visualization */}
      {propagation_paths.length > 0 && (
        <div className="propagation-paths">
          <h4 className="propagation-paths-title">Failure propagation paths</h4>
          {propagation_paths.map((path, i) => (
            <div key={i} className="propagation-path">
              {path.map((nodeId, j) => (
                <span key={nodeId} className="propagation-path-node">
                  <span className={`path-node ${j === 0 ? "failed" : "affected"}`}>
                    {nodeId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  {j < path.length - 1 && <span className="path-arrow" aria-hidden="true">&rarr;</span>}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Step-by-step reasoning */}
      {propagation_steps.length > 0 && (
        <div className="propagation-steps">
          <h4 className="propagation-steps-title">Step-by-step analysis</h4>
          {propagation_steps.map((step, i) => (
            <div key={i} className="propagation-step">
              <div className="step-header">
                <span
                  className="step-severity"
                  style={{ backgroundColor: SEVERITY_COLORS[step.severity] }}
                >
                  {step.severity}
                </span>
                <span className="step-time">T+{step.timestamp}min</span>
              </div>
              <div className="step-event">{step.event}</div>
              <div className="step-reason">{step.reason}</div>
            </div>
          ))}
        </div>
      )}

      <div className="explain-disclaimer">
        Simulation-based impact estimate. Not a validated disaster model.
      </div>
    </div>
  );
});
