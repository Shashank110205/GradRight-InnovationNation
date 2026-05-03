from __future__ import annotations

from data_providers.normalized import NormalizedPlacementSignals


def fuse_signals(*layers: NormalizedPlacementSignals) -> NormalizedPlacementSignals:
    """Merge left-to-right; rightmost non-None wins per field."""
    acc = NormalizedPlacementSignals()
    for layer in layers:
        acc = acc.merge(layer)
    return acc
