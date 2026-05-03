"""
Historical warehouse / long-horizon datasets (placement by program, salary by geography).

Uses RISK_HISTORICAL_CSV when set; otherwise delegates to the same CSV reader with a dedicated path.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from models import ScoreInput

from data_providers.csv_provider import CsvOutcomesProvider
from data_providers.normalized import NormalizedPlacementSignals


@dataclass
class HistoricalPlacementProvider:
    """Separate env hook so historical DB exports can be swapped without touching generic CSV."""

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        hist_path = os.environ.get("RISK_HISTORICAL_CSV", "").strip()
        if hist_path:
            return CsvOutcomesProvider(csv_path=hist_path).fetch(inp)
        return NormalizedPlacementSignals()
