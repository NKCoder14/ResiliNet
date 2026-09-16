"""Recommendation engine – compare intervention scenarios and explain the best option."""

from __future__ import annotations

from app.models import (
    ImpactMetrics,
    InterventionOption,
    InterventionType,
)


def recommend_intervention(
    base_metrics: ImpactMetrics,
    options: list[InterventionOption],
) -> tuple[InterventionType, str]:
    """Select the best intervention and generate an explanation.

    Ranking score = 0.4 × pop_reduction
                  + 0.3 × resilience_improvement
                  + 0.2 × delay_reduction
                  + 0.1 × feasibility

    Returns (best_intervention_type, explanation_text).
    """
    if not options:
        return InterventionType.REPAIR, "No options available. Default: repair the asset."

    scored: list[tuple[InterventionOption, float]] = []

    base_pop = max(base_metrics.population_affected, 1)
    base_res = base_metrics.resilience_score
    base_delay = max(base_metrics.average_delay, 1)

    for opt in options:
        m = opt.metrics

        # Population reduction (fraction)
        pop_reduction = max(0, (base_pop - m.population_affected) / base_pop)

        # Resilience improvement (fraction)
        resilience_improvement = max(0, (m.resilience_score - base_res) / max(100 - base_res, 1))

        # Delay reduction (fraction)
        delay_reduction = max(0, (base_delay - m.average_delay) / base_delay)

        # Feasibility (heuristic: repair best, add_connection worst)
        feasibility_map = {
            InterventionType.REROUTE: 0.9,
            InterventionType.REINFORCE: 0.7,
            InterventionType.REPAIR: 0.5,  # repair takes longest but is most complete
            InterventionType.ADD_CONNECTION: 0.4,
        }
        feasibility = feasibility_map.get(opt.intervention_type, 0.5)

        score = (
            0.4 * pop_reduction
            + 0.3 * resilience_improvement
            + 0.2 * delay_reduction
            + 0.1 * feasibility
        )
        scored.append((opt, round(score, 4)))

    scored.sort(key=lambda x: x[1], reverse=True)
    best_opt, best_score = scored[0]

    # Build explanation
    m = best_opt.metrics
    explanation_parts = [
        f"Recommended intervention: {best_opt.label}",
        f"",
        f"This scenario is recommended because:",
    ]

    pop_diff = base_metrics.population_affected - m.population_affected
    if pop_diff > 0:
        pct = (pop_diff / max(base_metrics.population_affected, 1)) * 100
        explanation_parts.append(f"• Reduces estimated population affected by {pop_diff:,} ({pct:.0f}%)")

    asset_diff = base_metrics.affected_assets - m.affected_assets
    if asset_diff > 0:
        explanation_parts.append(f"• Reduces disrupted assets from {base_metrics.affected_assets} to {m.affected_assets}")

    res_diff = m.resilience_score - base_metrics.resilience_score
    if res_diff > 0:
        explanation_parts.append(f"• Improves resilience score by {res_diff:.1f} points (to {m.resilience_score:.1f})")

    delay_diff = base_metrics.average_delay - m.average_delay
    if delay_diff > 0:
        explanation_parts.append(f"• Reduces average delay by {delay_diff:.1f} minutes")

    explanation_parts.append(f"")
    explanation_parts.append(f"Note: All values are simulation-based estimates.")

    return best_opt.intervention_type, "\n".join(explanation_parts)
