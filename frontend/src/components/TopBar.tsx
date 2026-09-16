// ResiliNet – TopBar component

import type { ScenarioStatus } from "../types";

interface TopBarProps {
  scenarioStatus: ScenarioStatus;
  onReset: () => void;
  loading: boolean;
}

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  IDLE: { label: "Ready", color: "#4ade80" },
  SIMULATING: { label: "Simulating…", color: "#3b82f6" },
  FAILURE_DETECTED: { label: "Failure Detected", color: "#ef4444" },
  INTERVENTION_APPLIED: { label: "Intervention Applied", color: "#a855f7" },
};

export function TopBar({ scenarioStatus, onReset, loading }: TopBarProps) {
  const status = STATUS_CONFIG[scenarioStatus];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <span className="topbar-logo-icon">◆</span>
          <h1 className="topbar-title">ResiliNet</h1>
        </div>
        <span className="topbar-subtitle">Urban Cascading Failure Simulator</span>
      </div>

      <div className="topbar-center">
        <div className="topbar-status" style={{ borderColor: status.color }}>
          <span className="topbar-status-dot" style={{ backgroundColor: status.color }} />
          <span className="topbar-status-text">{status.label}</span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-simulated-badge">⚠ SIMULATED DATA</span>
        <button
          className="btn-reset"
          onClick={onReset}
          disabled={loading || scenarioStatus === "IDLE"}
        >
          ↺ Reset Simulation
        </button>
      </div>
    </header>
  );
}
