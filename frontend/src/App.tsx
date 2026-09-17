// ResiliNet – Main Application Layout
// NOTE: Simulation / API logic unchanged. Only UI shell (responsive drawers,
// skeleton states, memoization) was added around the existing hook.

import { useEffect, useMemo, useState } from "react";
import { PanelLeft, PanelRight, RotateCcw, TriangleAlert, X } from "lucide-react";
import { useSimulation } from "./hooks/useSimulation";
import { TopBar } from "./components/TopBar";
import { KPICards } from "./components/KPICards";
import { LeftPanel } from "./components/LeftPanel";
import { MapView } from "./components/MapView";
import { RightPanel } from "./components/RightPanel";
import { DashboardSkeleton } from "./components/Skeleton";
import "./App.css";

type MobileDrawer = "left" | "right" | null;

function App() {
  const sim = useSimulation();
  const [openDrawer, setOpenDrawer] = useState<MobileDrawer>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  // Build asset statuses map from simulation result (memoized, same behavior)
  const assetStatuses: Record<string, string> = useMemo(() => {
    const statuses: Record<string, string> = {};
    if (sim.simulationResult) {
      for (const id of sim.simulationResult.failed_assets) {
        statuses[id] = "FAILED";
      }
      for (const [id, status] of Object.entries(sim.simulationResult.affected_asset_details)) {
        if (!statuses[id]) {
          statuses[id] = status;
        }
      }
    }
    // Override with intervention result if active
    if (sim.interventionResult) {
      for (const k of Object.keys(statuses)) delete statuses[k];
      for (const id of sim.interventionResult.failed_assets) {
        statuses[id] = "FAILED";
      }
      for (const [id, status] of Object.entries(sim.interventionResult.affected_asset_details)) {
        if (!statuses[id]) {
          statuses[id] = status;
        }
      }
    }
    return statuses;
  }, [sim.simulationResult, sim.interventionResult]);

  const currentMetrics = useMemo(
    () =>
      sim.interventionResult?.impact_metrics ||
      sim.simulationResult?.impact_metrics ||
      null,
    [sim.interventionResult, sim.simulationResult]
  );

  const isSimulated = !!sim.simulationResult;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDrawer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleDrawer = (which: Exclude<MobileDrawer, null>) => {
    setOpenDrawer((cur) => (cur === which ? null : which));
  };

  if (sim.loading && !sim.network) {
    return <DashboardSkeleton />;
  }

  if (sim.error && !sim.network) {
    return (
      <div className="error-screen" role="alert">
        <div className="error-card">
          <h2>
            <TriangleAlert size={16} strokeWidth={2} aria-hidden="true" /> Connection error
          </h2>
          <p>{sim.error}</p>
          <p>
            Make sure the backend is running at <code>http://localhost:8000</code>
          </p>
          <button
            className="btn-reset"
            onClick={sim.loadInitialData}
            disabled={sim.loading}
            style={{ marginTop: 12 }}
          >
            {sim.loading ? (
              <span className="btn-loading">
                <span className="inline-spinner" aria-hidden="true" /> Retrying
              </span>
            ) : (
              <>
                <RotateCcw size={13} strokeWidth={2.25} aria-hidden="true" /> Retry
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const showToast = !!sim.error && !!sim.network && dismissedError !== sim.error;

  return (
    <div className="app">
      <TopBar
        scenarioStatus={sim.scenarioStatus}
        onReset={sim.resetSimulation}
        loading={sim.loading}
      />

      <div className="mobile-toolbar" role="group" aria-label="Panels">
        <button
          type="button"
          className={`mobile-toggle ${openDrawer === "left" ? "active" : ""}`}
          onClick={() => toggleDrawer("left")}
          aria-expanded={openDrawer === "left"}
          aria-controls="resilinet-left-panel"
        >
          <PanelLeft size={13} strokeWidth={2.25} aria-hidden="true" /> Assets
        </button>
        <button
          type="button"
          className={`mobile-toggle ${openDrawer === "right" ? "active" : ""}`}
          onClick={() => toggleDrawer("right")}
          aria-expanded={openDrawer === "right"}
          aria-controls="resilinet-right-panel"
        >
          <PanelRight size={13} strokeWidth={2.25} aria-hidden="true" /> Analysis
        </button>
      </div>

      <div
        className={`drawer-backdrop ${openDrawer ? "visible" : ""}`}
        onClick={() => setOpenDrawer(null)}
        aria-hidden="true"
      />

      <div className="dashboard-scroll">
        <KPICards
          metrics={currentMetrics}
          baselineMetrics={sim.baselineMetrics}
          isSimulated={isSimulated}
        />

        <div className="main-content">
          <LeftPanel
            assets={sim.network?.nodes || []}
            criticalAssets={sim.criticalAssets}
            selectedAssetId={sim.selectedAssetId}
            scenarioStatus={sim.scenarioStatus}
            assetStatuses={assetStatuses}
            onSelectAsset={sim.selectAsset}
            onSimulateFailure={sim.simulateFailure}
            loading={sim.loading}
            className={openDrawer === "left" ? "mobile-open" : ""}
            panelId="resilinet-left-panel"
          />

          <main className="center-panel" aria-label="Infrastructure map">
            <MapView
              nodes={sim.network?.nodes || []}
              edges={sim.network?.edges || []}
              selectedAssetId={sim.selectedAssetId}
              simulationResult={sim.simulationResult}
              interventionResult={sim.interventionResult}
              onSelectAsset={sim.selectAsset}
            />
            {sim.loading && sim.network && (
              <div className="map-loading-overlay" role="status">
                <span className="inline-spinner" aria-hidden="true" />
                <span>Updating simulation…</span>
              </div>
            )}
          </main>

          <RightPanel
            simulationResult={sim.simulationResult}
            interventionResult={sim.interventionResult}
            baselineMetrics={sim.baselineMetrics}
            activeIntervention={sim.activeIntervention}
            onRunIntervention={sim.runIntervention}
            loading={sim.loading}
            className={openDrawer === "right" ? "mobile-open" : ""}
            panelId="resilinet-right-panel"
          />
        </div>

        <footer className="app-footer">
          <span>
            <span className="footer-mark" aria-hidden="true" />
            RESILINET / PROTOTYPE SIMULATION
          </span>
          <span>Infrastructure values are illustrative simulation estimates.</span>
        </footer>
      </div>

      {showToast && (
        <div className="error-toast" role="alert">
          <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
          <span>{sim.error}</span>
          <button onClick={() => setDismissedError(sim.error)} aria-label="Dismiss error">
            <X size={14} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
