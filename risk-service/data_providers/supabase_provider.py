"""
Supabase / Postgres-backed cohort signals (user progression, historical user outcomes).

Optional: set RISK_SUPABASE_SIGNALS_URL to an internal JSON endpoint that returns:
  { \"historical_placement_score\": n, \"historical_admission_score\": n, ... }
No client keys in-process; operator-owned URL only. Otherwise returns empty (None fields).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass

from models import ScoreInput

from data_providers.normalized import NormalizedPlacementSignals


@dataclass
class SupabaseSignalsProvider:
    timeout_s: float = 1.5

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        url = os.environ.get("RISK_SUPABASE_SIGNALS_URL", "").strip()
        if not url:
            return NormalizedPlacementSignals()

        try:
            body = json.dumps({"target_country": inp.target_country, "program_type": inp.program_type}).encode(
                "utf-8"
            )
            req = urllib.request.Request(  # noqa: S310
                url,
                data=body,
                method="POST",
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            if not isinstance(data, dict):
                return NormalizedPlacementSignals()

            def pick(key: str) -> float | None:
                v = data.get(key)
                if v is None:
                    return None
                try:
                    x = float(v)
                    return max(0.0, min(100.0, round(x, 2)))
                except (TypeError, ValueError):
                    return None

            return NormalizedPlacementSignals(
                historical_placement_score=pick("historical_placement_score"),
                historical_admission_score=pick("historical_admission_score"),
                live_market_score=pick("live_market_score"),
                macro_employability_score=pick("macro_employability_score"),
            )
        except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, json.JSONDecodeError):
            return NormalizedPlacementSignals()
