"""Canonical 0–100 feature signals; None = unknown (scorer redistributes weights)."""

from __future__ import annotations

from dataclasses import dataclass, fields


@dataclass
class NormalizedPlacementSignals:
    institute_tier_score: float | None = None
    cgpa_score: float | None = None
    internship_score: float | None = None
    certification_score: float | None = None
    sector_demand_score: float | None = None
    country_opportunity_score: float | None = None
    work_experience_score: float | None = None
    historical_admission_score: float | None = None
    historical_placement_score: float | None = None
    live_market_score: float | None = None
    macro_employability_score: float | None = None

    def merge(self, other: NormalizedPlacementSignals) -> NormalizedPlacementSignals:
        """Later `other` overrides when set; otherwise keep `self` (chain: benchmark → profile → feeds)."""
        out = NormalizedPlacementSignals()
        for f in fields(NormalizedPlacementSignals):
            name = f.name
            a = getattr(self, name)
            b = getattr(other, name)
            setattr(out, name, b if b is not None else a)
        return out
