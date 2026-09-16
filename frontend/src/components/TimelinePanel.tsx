// ResiliNet – TimelinePanel: Event timeline (T+0, T+2, T+5…)

import type { PropagationStep } from "../types";
import { SEVERITY_COLORS } from "../utils/helpers";

interface TimelinePanelProps {
  timeline: PropagationStep[];
}

export function TimelinePanel({ timeline }: TimelinePanelProps) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="timeline-panel">
      <h3 className="panel-title">
        <span className="panel-title-icon">📋</span>
        Event Timeline
      </h3>
      <div className="timeline">
        {timeline.map((step, i) => (
          <div key={i} className="timeline-event" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="timeline-marker">
              <div
                className="timeline-dot"
                style={{ backgroundColor: SEVERITY_COLORS[step.severity] }}
              />
              {i < timeline.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-time">T+{step.timestamp} min</span>
                <span
                  className="timeline-severity-badge"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[step.severity]}20`,
                    color: SEVERITY_COLORS[step.severity],
                  }}
                >
                  {step.severity}
                </span>
              </div>
              <div className="timeline-event-text">{step.event}</div>
              <div className="timeline-reason">{step.reason}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
