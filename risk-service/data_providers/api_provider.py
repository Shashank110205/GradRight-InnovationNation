"""
Live / external APIs: job postings velocity, visa trends, FX, hiring indices.

Does NOT fabricate data: returns None for live_market_score unless RISK_LIVE_MARKET_URL responds 200
with JSON { \"score\": 0-100 }.
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
class LiveMarketApiProvider:
    timeout_s: float = 1.2

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        _ = inp
        url = os.environ.get("RISK_LIVE_MARKET_URL", "").strip()
        if not url:
            return NormalizedPlacementSignals()

        try:
            req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:  # noqa: S310 — URL from operator env
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            val = data.get("score")
            if val is None:
                return NormalizedPlacementSignals()
            score = float(val)
            score = max(0.0, min(100.0, score))
            return NormalizedPlacementSignals(live_market_score=round(score, 2))
        except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, json.JSONDecodeError):
            return NormalizedPlacementSignals()
