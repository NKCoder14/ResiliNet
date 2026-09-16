// ResiliNet – Main Application Layout

import { useSimulation } from "./hooks/useSimulation";
import { TopBar } from "./components/TopBar";
import { KPICards } from "./components/KPICards";
import { LeftPanel } from "./components/LeftPanel";
import { MapView } from "./components/MapView";
import { RightPanel } from "./components/RightPanel";
import "./App.css";

function App() {
  const sim = useSimulation();

  // Build asset statuses map from simulation result
  const assetStatuses: Record<string, string> = {};
  if (sim.simulationResult) {
    for (const id of sim.simulationResult.failed_assets) {
      assetStatuses[id] = "FAILED";
    }
    for (const [id, status] of Object.entries(sim.simulationResult.affected_asset_details)) {
      if (!assetStatuses[id]) {
        assetStatuses[id] = status;
      }
    }
  }
  // Override with intervention result if active
  if (sim.interventionResult) {
    // Clear previous and apply intervention state
    Object.keys(assetStatuses).forEach((k) => delete assetStatuses[k]);
    for (const id of sim.interventionResult.failed_assets) {
      assetStatuses[id] = "FAILED";
    }
    for (const [id, status] of Object.entries(sim.interventionResult.affected_asset_details)) {
      if (!assetStatuses[id]) {
        assetStatuses[id] = status;
      }
    }
  }

  const currentMetrics = sim.interventionResult?.impact_metrics
    || sim.simulationResult?.impact_metrics
    || null;

  const isSimulated = !!sim.simulationResult;

  if (sim.loading && !sim.network) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading ResiliNet…</p>
      </div>
    );
  }

  if (sim.error && !sim.network) {
    return (
      <div className="error-screen">
        <h2>⚠ Connection Error</h2>
        <p>{sim.error}</p>
        <p>Make sure the backend is running at <code>http://localhost:8000</code></p>
        <button className="btn-reset" onClick={sim.loadInitialData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar
        scenarioStatus={sim.scenarioStatus}
        onReset={sim.resetSimulation}
        loading={sim.loading}
      />

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
        />

        <main className="center-panel">
          <MapView
            nodes={sim.network?.nodes || []}
            edges={sim.network?.edges || []}
            selectedAssetId={sim.selectedAssetId}
            simulationResult={sim.simulationResult}
            interventionResult={sim.interventionResult}
            onSelectAsset={sim.selectAsset}
          />
        </main>

        <RightPanel
          simulationResult={sim.simulationResult}
          interventionResult={sim.interventionResult}
          baselineMetrics={sim.baselineMetrics}
          activeIntervention={sim.activeIntervention}
          onRunIntervention={sim.runIntervention}
          loading={sim.loading}
        />
      </div>

      {sim.error && sim.network && (
        <div className="error-toast">
          <span>⚠ {sim.error}</span>
          <button onClick={() => {}}>✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
