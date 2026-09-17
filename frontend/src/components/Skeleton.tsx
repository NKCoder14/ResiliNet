// ResiliNet – Skeleton loaders (UI only, no logic changes)
// Used for initial load and panel-level loading states.

import { BrandMark } from "./BrandMark";

export function DashboardSkeleton() {
  return (
    <div className="app" aria-busy="true" aria-label="Loading ResiliNet">
      <div className="topbar" aria-hidden="true">
        <div className="topbar-left">
          <div className="topbar-logo">
            <span className="topbar-logo-icon">
              <BrandMark size={20} />
            </span>
            <span className="topbar-title">RESILINET</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="skeleton" style={{ width: 120, height: 34 }} />
        </div>
      </div>

      <div className="skeleton-shell">
        <div className="skeleton-kpi-grid" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-kpi" />
          ))}
        </div>

        <div className="skeleton-main" aria-hidden="true">
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-block" />
        </div>

        <p className="sr-only" role="status">Loading ResiliNet</p>
        <div className="loading-spinner" aria-hidden="true" />
      </div>
    </div>
  );
}

export function AssetListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 54 }} />
      ))}
    </div>
  );
}
