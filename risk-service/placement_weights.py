"""Explainable weights for Placement Intelligence (sum to 1.0 across profile + market)."""

from __future__ import annotations

# Profile bucket (0.65)
PROFILE_WEIGHTS: dict[str, float] = {
    "institute_tier_score": 0.15,
    "cgpa_score": 0.15,
    "internship_score": 0.15,
    "certification_score": 0.10,
    "work_experience_score": 0.10,
}

# Market + outcomes bucket (0.35)
MARKET_WEIGHTS: dict[str, float] = {
    "sector_demand_score": 0.10,
    "country_opportunity_score": 0.10,
    "historical_admission_score": 0.05,
    "historical_placement_score": 0.05,
    "live_market_score": 0.05,
}

# Optional enricher (not in the 100% core split); blended into sector demand when present
MACRO_FIELD = "macro_employability_score"


def _redistribute(weights: dict[str, float], values: dict[str, float | None]) -> tuple[dict[str, float], float]:
    """Scale active weights to sum to original bucket mass; return (new_weights, coverage_ratio 0-1)."""
    total_mass = sum(weights.values())
    present = {k: values.get(k) is not None for k in weights}
    if not any(present.values()):
        return {k: 0.0 for k in weights}, 0.0

    missing_mass = sum(weights[k] for k in weights if not present[k])
    active_sum = sum(weights[k] for k in weights if present[k])
    if active_sum <= 0:
        return {k: 0.0 for k in weights}, 0.0

    out: dict[str, float] = {}
    for k, w in weights.items():
        if present[k]:
            out[k] = w + missing_mass * (w / active_sum)
        else:
            out[k] = 0.0

    # Renormalize to total_mass in case of float drift
    s = sum(out.values())
    if s > 0 and abs(s - total_mass) > 1e-6:
        scale = total_mass / s
        out = {k: v * scale for k, v in out.items()}

    covered_mass = sum(weights[k] for k in weights if present[k])
    coverage_ratio = covered_mass / total_mass if total_mass > 0 else 0.0
    return out, coverage_ratio


def weighted_block_score(
    weights: dict[str, float],
    values: dict[str, float | None],
) -> tuple[float, dict[str, float], float]:
    """Σ w_i·v_i with v_i ∈ [0,100], weights for the block sum to the block mass (e.g. 0.65)."""
    adj, cov = _redistribute(weights, values)
    block = 0.0
    for k, w in adj.items():
        v = values.get(k)
        if v is None or w <= 0:
            continue
        block += w * v
    return block, adj, cov
