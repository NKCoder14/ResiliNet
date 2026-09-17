// ResiliNet – helper utilities, color maps, formatters

import { Bridge, Droplets, Hospital, Route, Siren, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AssetType, AssetStatus, Severity } from "../types";

// Asset type colors
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  [AssetType.BRIDGE]: "#8b5cf6",     // violet
  [AssetType.ROAD]: "#6b7280",       // gray
  [AssetType.HOSPITAL]: "#ec4899",   // pink
  [AssetType.POWER]: "#f59e0b",      // amber
  [AssetType.WATER]: "#06b6d4",      // cyan
  [AssetType.EMERGENCY_FACILITY]: "#ef4444", // red
};

// Asset type icons (Lucide)
export const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  [AssetType.BRIDGE]: Bridge,
  [AssetType.ROAD]: Route,
  [AssetType.HOSPITAL]: Hospital,
  [AssetType.POWER]: Zap,
  [AssetType.WATER]: Droplets,
  [AssetType.EMERGENCY_FACILITY]: Siren,
};

// Status colors
export const STATUS_COLORS: Record<AssetStatus, string> = {
  [AssetStatus.OPERATIONAL]: "#4ade80",  // green
  [AssetStatus.FAILED]: "#ef4444",       // red
  [AssetStatus.AFFECTED]: "#f97316",     // orange
  [AssetStatus.DEGRADED]: "#eab308",     // yellow
};

// Status for map markers
export const STATUS_MAP_COLORS: Record<string, string> = {
  OPERATIONAL: "#4ade80",
  FAILED: "#ef4444",
  AFFECTED: "#f97316",
  DEGRADED: "#eab308",
  SELECTED: "#3b82f6",
  INTERVENTION: "#a855f7",
};

// Severity colors
export const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.HIGH]: "#ef4444",
  [Severity.MEDIUM]: "#f97316",
  [Severity.LOW]: "#eab308",
};

// Format large numbers
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Criticality label
export function criticalityLabel(score: number): string {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

// Criticality color
export function criticalityColor(score: number): string {
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f97316";
  if (score >= 25) return "#eab308";
  return "#4ade80";
}

// Resilience score color
export function resilienceColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// Format hours
export function formatHours(h: number): string {
  if (h >= 24) return `${(h / 24).toFixed(0)}d ${(h % 24).toFixed(0)}h`;
  return `${h.toFixed(0)}h`;
}

// Asset type label
export function assetTypeLabel(type: AssetType): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
