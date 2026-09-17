// ResiliNet – TopBar component (props unchanged, responsive + a11y only)

import { memo } from "react";
import { RotateCcw } from "lucide-react";
import { BrandMark } from "./BrandMark";
import type { ScenarioStatus } from "../types";

interface TopBarProps {
  scenarioStatus: ScenarioStatus;
  onReset: () => void;
  loading: boolean;
}

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  IDLE: { label: "Ready", color: "#22c55e" },
  SIMULATING: { label: "Simulating", color: "#5ee7d4" },
  FAILURE_DETECTED: { label: "Failure detected", color: "#ef4444" },
  INTERVENTION_APPLIED: { label: "Intervention applied", color: "#a855f7" },
};

export const TopBar = memo(function TopBar({ scenarioStatus, onReset, loading }: TopBarProps) {
  const status = STATUS_CONFIG[scenarioStatus];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <span className="topbar-logo-icon" aria-hidden="true">
            <BrandMark size={20} />
          </span>
          <div>
            <h1 className="topbar-title">ResiliNet</h1>
            <div className="topbar-subtitle">Urban cascading failure simulator</div>
          </div>
        </div>
      </div>

      <div className="topbar-center">
        <div
          className="topbar-status"
          style={{ borderColor: `${status.color}55` }}
          role="status"
          aria-label={`Scenario status: ${status.label}`}
        >
          <span
            className="topbar-status-dot"
            style={{ backgroundColor: status.color }}
            aria-hidden="true"
          />
          <span className="topbar-status-text">{status.label}</span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-simulated-badge">
          <span className="pulse-dot" aria-hidden="true" /> SIMULATION MODE
        </span>
        <button
          type="button"
          className="btn-reset"
          onClick={onReset}
          disabled={loading || scenarioStatus === "IDLE"}
          aria-busy={loading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="inline-spinner" aria-hidden="true" /> Working
            </span>
          ) : (
            <>
              <RotateCcw size={13} strokeWidth={2.25} aria-hidden="true" /> Reset
            </>
          )}
        </button>
      </div>
    </header>
  );
});
