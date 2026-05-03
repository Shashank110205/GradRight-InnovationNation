"""
Static JSON benchmarks: country opportunity, sector demand, macro employability baselines.

Recommended static feeds: NIRF tiers, salary bands, sector demand curves, country opportunity indices.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

from models import ScoreInput

from data_providers.normalized import NormalizedPlacementSignals

_SECTOR_TO_DEMAND_KEY: dict[str, str] = {
    "IT": "CS",
    "BFSI": "Business",
    "Healthcare": "Life Sciences",
    "Manufacturing": "Engineering",
    "Other": "Other",
}


@dataclass
class StaticPlacementProvider:
    """Loads packaged JSON under `data_dir`; never raises on missing files (degrades to None)."""

    data_dir: str

    def __post_init__(self) -> None:
        self._sector_demand: dict[str, dict[str, float]] = {}
        self._macro: dict[str, float] = {}
        try:
            with open(os.path.join(self.data_dir, "sector_demand.json"), encoding="utf-8") as f:
                self._sector_demand = json.load(f)
        except OSError:
            pass
        try:
            with open(os.path.join(self.data_dir, "macro_baseline.json"), encoding="utf-8") as f:
                self._macro = json.load(f)
        except OSError:
            pass

    def _demand_bucket(self, target_sector: str) -> str:
        return _SECTOR_TO_DEMAND_KEY.get(target_sector, "Other")

    def demand_index(self, target_sector: str, target_country: str) -> float | None:
        key = self._demand_bucket(target_sector)
        row = self._sector_demand.get(key)
        if not row:
            return None
        return row.get(target_country)

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        demand = self.demand_index(inp.target_sector, inp.target_country)
        sector = round(demand * 100, 2) if demand is not None else None

        macro_raw = self._macro.get(inp.target_country)
        macro = round(macro_raw * 100, 2) if macro_raw is not None else None

        country_bonus = {"US": 88, "UK": 68, "Germany": 76, "Canada": 78, "Australia": 70, "domestic": 58}
        country = float(country_bonus.get(inp.target_country, 60))

        return NormalizedPlacementSignals(
            sector_demand_score=sector,
            country_opportunity_score=country,
            macro_employability_score=macro,
        )
