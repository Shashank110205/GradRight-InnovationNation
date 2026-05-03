from __future__ import annotations

from typing import Protocol

from models import ScoreInput

from data_providers.normalized import NormalizedPlacementSignals


class PlacementDataProvider(Protocol):
    """Each provider returns the same normalized schema; missing fields stay None."""

    def fetch(self, inp: ScoreInput) -> NormalizedPlacementSignals: ...
