"""
CSV outcomes: historical placements, salary progression, admission rates by program/region.

Configure via RISK_OUTCOMES_CSV; expected optional columns (any subset):
  program_type, target_country, placement_rate, admission_rate, salary_index
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass

from models import ScoreInput

from data_providers.normalized import NormalizedPlacementSignals


def _safe_float(cell: str) -> float | None:
    try:
        return float(cell.strip())
    except (ValueError, AttributeError):
        return None


@dataclass
class CsvOutcomesProvider:
    csv_path: str | None

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        path = self.csv_path or os.environ.get("RISK_OUTCOMES_CSV", "").strip()
        if not path or not os.path.isfile(path):
            return NormalizedPlacementSignals()

        best: dict[str, float] = {}
        try:
            with open(path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row:
                        continue
                    p = (row.get("program_type") or "").strip()
                    c = (row.get("target_country") or "").strip()
                    if p and p != inp.program_type:
                        continue
                    if c and c != inp.target_country:
                        continue
                    pr = _safe_float(row.get("placement_rate") or "")
                    ar = _safe_float(row.get("admission_rate") or "")
                    si = _safe_float(row.get("salary_index") or "")
                    if pr is not None:
                        best["placement"] = max(best.get("placement", 0), min(100.0, pr * 100 if pr <= 1 else pr))
                    if ar is not None:
                        best["admission"] = max(best.get("admission", 0), min(100.0, ar * 100 if ar <= 1 else ar))
                    if si is not None:
                        best["salary"] = max(best.get("salary", 0), min(100.0, si * 50 if si <= 2 else si))
        except OSError:
            return NormalizedPlacementSignals()

        return NormalizedPlacementSignals(
            historical_placement_score=best.get("placement"),
            historical_admission_score=best.get("admission"),
        )
