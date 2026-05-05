"""Multi-source Placement Intelligence Engine — explainable weighted fusion over normalized signals."""

from __future__ import annotations

import json
import math
import os
from dataclasses import asdict, dataclass, fields

from models import ScoreInput

from data_providers.api_provider import LiveMarketApiProvider
from data_providers.csv_provider import CsvOutcomesProvider
from data_providers.fusion import fuse_signals
from data_providers.historical_provider import HistoricalPlacementProvider
from data_providers.normalized import NormalizedPlacementSignals
from data_providers.static_provider import StaticPlacementProvider
from data_providers.supabase_provider import SupabaseSignalsProvider
from placement_weights import MARKET_WEIGHTS, PROFILE_WEIGHTS, weighted_block_score

@dataclass
class RiskDriverInternal:
    factor: str
    direction: str
    weight: float
    explanation: str
    user_friendly_summary: str | None = None


@dataclass
class NextBestActionInternal:
    action: str
    impact: str
    resource_url: str | None


def _signals_from_score_input(inp: ScoreInput) -> NormalizedPlacementSignals:
    tier_map = {"IIT/IIM": 90.0, "NIT/Tier2": 72.0, "Other": 55.0}
    institute = tier_map.get(inp.institute_tier, 55.0)
    cgpa = round(inp.cgpa_normalized * 100.0, 2)
    if inp.internship_months == 0:
        intern = 22.0
    elif inp.internship_months <= 3:
        intern = 52.0
    elif inp.internship_months <= 6:
        intern = 78.0
    else:
        intern = 92.0
    cert = min(float(inp.certification_count) * 25.0, 95.0)
    work = min(float(inp.work_experience_years) * 18.0, 95.0)
    return NormalizedPlacementSignals(
        institute_tier_score=institute,
        cgpa_score=cgpa,
        internship_score=intern,
        certification_score=cert,
        work_experience_score=work,
    )


def _blend_macro_into_sector(signals: NormalizedPlacementSignals) -> NormalizedPlacementSignals:
    sector = signals.sector_demand_score
    macro = signals.macro_employability_score
    if sector is None or macro is None:
        return signals
    blended = round(0.82 * sector + 0.18 * macro, 2)
    return NormalizedPlacementSignals(
        institute_tier_score=signals.institute_tier_score,
        cgpa_score=signals.cgpa_score,
        internship_score=signals.internship_score,
        certification_score=signals.certification_score,
        sector_demand_score=blended,
        country_opportunity_score=signals.country_opportunity_score,
        work_experience_score=signals.work_experience_score,
        historical_admission_score=signals.historical_admission_score,
        historical_placement_score=signals.historical_placement_score,
        live_market_score=signals.live_market_score,
        macro_employability_score=signals.macro_employability_score,
    )


def _signals_to_value_dict(sig: NormalizedPlacementSignals) -> dict[str, float | None]:
    return {f.name: getattr(sig, f.name) for f in fields(sig)}


def _confidence_label(coverage_pct: float, has_live: bool, has_hist: bool) -> str:
    if coverage_pct >= 82 or has_live:
        return "high"
    if coverage_pct >= 58 or has_hist:
        return "medium"
    return "low"


def _tier_copy(has_live: bool, has_hist: bool) -> tuple[str, str, str]:
    if has_live:
        return (
            "live_market",
            "Your Live Market GradScore",
            "Live market feed is contributing to this score.",
        )
    if has_hist:
        return (
            "enhanced",
            "Your Enhanced GradScore",
            "Historical outcomes data is layered on benchmark intelligence.",
        )
    return (
        "preliminary",
        "Your Preliminary GradScore",
        "Using benchmark intelligence",
    )


def _confidence_user_message(conf: str, has_live: bool, has_hist: bool, benchmark: bool) -> str:
    parts = []
    if benchmark:
        parts.append("benchmark data")
    parts.append("profile data")
    if has_hist:
        parts.append("historical outcomes")
    if has_live:
        parts.append("live market signal")
    detail = " + ".join(parts)
    cap = conf[:1].upper() + conf[1:]
    return f"Confidence: {cap} ({detail})"


class PlacementRiskScorer:
    def __init__(self) -> None:
        self.data_dir = os.path.join(os.path.dirname(__file__), "data")
        with open(os.path.join(self.data_dir, "salary_benchmarks.json"), encoding="utf-8") as f:
            self.salary_benchmarks: dict[str, dict[str, float]] = json.load(f)
        with open(os.path.join(self.data_dir, "nirf_data.json"), encoding="utf-8") as f:
            self.nirf_data: dict[str, str] = json.load(f)

        self._static = StaticPlacementProvider(self.data_dir)
        self._csv = CsvOutcomesProvider(csv_path=None)
        self._historical = HistoricalPlacementProvider()
        self._supabase = SupabaseSignalsProvider()
        self._live = LiveMarketApiProvider()

    def _demand_index(self, target_sector: str, target_country: str) -> float:
        v = self._static.demand_index(target_sector, target_country)
        return float(v) if v is not None else 0.5

    def _fuse_all(self, inp: ScoreInput) -> NormalizedPlacementSignals:
        profile = _signals_from_score_input(inp)
        fused = fuse_signals(
            self._static.fetch(inp),
            self._csv.fetch(inp),
            self._historical.fetch(inp),
            self._supabase.fetch(inp),
            self._live.fetch(inp),
            profile,
        )
        return _blend_macro_into_sector(fused)

    def compute_score(self, inp: ScoreInput) -> dict:
        signals = self._fuse_all(inp)
        vals = _signals_to_value_dict(signals)

        profile_block, _pw, profile_cov = weighted_block_score(PROFILE_WEIGHTS, vals)
        market_block, _mw, market_cov = weighted_block_score(MARKET_WEIGHTS, vals)

        profile_mass = sum(PROFILE_WEIGHTS.values())
        market_mass = sum(MARKET_WEIGHTS.values())
        profile_mult = 1.0
        market_mult = 1.0
        final_score = profile_block * profile_mult + market_block * market_mult
        final_score = max(0.0, min(100.0, final_score))

        score_data_coverage_percentage = round(
            100.0 * (profile_mass * profile_cov + market_mass * market_cov),
            1,
        )

        has_live = signals.live_market_score is not None
        has_hist = (
            signals.historical_placement_score is not None or signals.historical_admission_score is not None
        )
        tier, title, intel_note = _tier_copy(has_live, has_hist)
        conf = _confidence_label(score_data_coverage_percentage, has_live, has_hist)
        conf_message = _confidence_user_message(conf, has_live, has_hist, benchmark=True)

        drivers: list[RiskDriverInternal] = []
        drivers.append(
            RiskDriverInternal(
                factor="Profile strength (weighted)",
                direction="positive" if final_score >= 55 else "negative",
                weight=min(1.0, final_score / 100.0),
                explanation=(
                    f"Institute, CGPA, internships, certifications, and experience contribute "
                    f"~{profile_mass:.0%} of your GradScore using explainable weights."
                ),
                user_friendly_summary=(
                    "Your academic and experience signals are shaping a credible trajectory — "
                    "small upgrades to internships or certifications can lift confidence."
                    if final_score >= 55
                    else "Your profile has room to compound — focused internships, certifications, "
                    "and clarity on target roles will strengthen projected outcomes."
                ),
            )
        )
        demand_index = self._demand_index(inp.target_sector, inp.target_country)
        sector_direction = (
            "positive"
            if demand_index >= 0.65
            else ("neutral" if demand_index >= 0.4 else "negative")
        )
        drivers.append(
            RiskDriverInternal(
                factor=f"{inp.target_sector} demand in {inp.target_country}",
                direction=sector_direction,
                weight=demand_index,
                explanation=(
                    f"Market bucket (~{market_mass:.0%} of score) includes sector and destination context; "
                    f"missing feeds are redistributed so you are not penalized for unavailable data."
                ),
                user_friendly_summary=(
                    "Market context for your field and destination is supportive of your direction."
                    if sector_direction == "positive"
                    else (
                        "Your target market may need stronger positioning or adjacent opportunities."
                        if sector_direction == "negative"
                        else "Sector demand is mixed — pairing a clear narrative with adjacent skills "
                        "often improves outcomes."
                    )
                ),
            )
        )
        drivers.append(
            RiskDriverInternal(
                factor="Data coverage",
                direction="positive" if score_data_coverage_percentage >= 70 else "neutral",
                weight=score_data_coverage_percentage / 100.0,
                explanation=conf_message,
                user_friendly_summary=(
                    "We are transparent about how much verified data sits behind this score — "
                    "adding academic, career, and market inputs improves precision over time."
                ),
            ),
        )

        if final_score >= 66:
            risk_label = "low"
        elif final_score >= 41:
            risk_label = "medium"
        else:
            risk_label = "high"

        p3m = self._placement_prob(final_score, months=3)
        p6m = self._placement_prob(final_score, months=6)
        p12m = self._placement_prob(final_score, months=12)

        salary_key = f"{inp.program_type}_{inp.institute_tier}_{inp.target_country}"
        salary = self.salary_benchmarks.get(salary_key, {"low": 40.0, "high": 60.0})

        actions = self._generate_actions(inp, drivers, risk_label)

        drivers_sorted = sorted(drivers, key=lambda d: abs(d.weight - 0.5), reverse=True)[:3]

        profile_completeness_score = self._profile_input_completeness(inp)
        readiness_signals = self._readiness_signals(inp, signals, score_data_coverage_percentage)
        strengths, improvement_areas = self._strengths_and_gaps(inp, drivers_sorted, final_score)
        strengths = list(dict.fromkeys(strengths))[:4]
        improvement_areas = list(dict.fromkeys(improvement_areas))[:4]

        return {
            "placement_prob_3m": round(p3m, 2),
            "placement_prob_6m": round(p6m, 2),
            "placement_prob_12m": round(p12m, 2),
            "salary_band_low_lpa": float(salary["low"]),
            "salary_band_high_lpa": float(salary["high"]),
            "risk_label": risk_label,
            "risk_score_raw": round(final_score, 2),
            "top_drivers": [asdict(d) for d in drivers_sorted],
            "next_best_actions": [asdict(a) for a in actions],
            "score_confidence": conf,
            "score_data_coverage_percentage": score_data_coverage_percentage,
            "placement_intelligence_tier": tier,
            "grad_score_display_title": title,
            "intelligence_source_note": intel_note,
            "score_confidence_user_message": conf_message,
            "normalized_signal_snapshot": {k: v for k, v in vals.items() if v is not None},
            "profile_completeness_score": profile_completeness_score,
            "readiness_signals": readiness_signals,
            "strengths": strengths,
            "improvement_areas": improvement_areas,
        }

    def _profile_input_completeness(self, inp: ScoreInput) -> int:
        """How complete the scoring inputs are (not a marketing score)."""
        pts = 0
        if inp.institute_tier:
            pts += 22
        if inp.cgpa_normalized > 0:
            pts += 22
        if inp.internship_months > 0:
            pts += 18
        if inp.certification_count > 0:
            pts += 12
        if inp.work_experience_years > 0:
            pts += 12
        if inp.target_country and inp.target_country != "domestic":
            pts += 8
        if inp.target_sector and inp.target_sector != "Other":
            pts += 6
        return int(min(100, pts))

    def _readiness_signals(
        self,
        inp: ScoreInput,
        signals: NormalizedPlacementSignals,
        coverage_pct: float,
    ) -> dict[str, str]:
        out: dict[str, str] = {}
        out["internships"] = "strong" if inp.internship_months >= 6 else ("ok" if inp.internship_months >= 3 else "thin")
        out["certifications"] = "present" if inp.certification_count > 0 else "missing"
        out["experience"] = "seasoned" if inp.work_experience_years >= 2 else ("early" if inp.work_experience_years == 0 else "building")
        out["data_coverage"] = "high" if coverage_pct >= 75 else ("medium" if coverage_pct >= 55 else "low")
        if signals.historical_placement_score is not None:
            out["historical_layer"] = "active"
        else:
            out["historical_layer"] = "not_in_run"
        return out

    def _strengths_and_gaps(
        self,
        inp: ScoreInput,
        drivers_sorted: list[RiskDriverInternal],
        final_score: float,
    ) -> tuple[list[str], list[str]]:
        strengths: list[str] = []
        gaps: list[str] = []
        if inp.cgpa_normalized >= 0.78:
            strengths.append("CGPA signal sits in a competitive band for many target programs.")
        elif inp.cgpa_normalized < 0.62:
            gaps.append("CGPA narrative may need stronger test scores, coursework, or experience offsets.")

        if inp.internship_months >= 6:
            strengths.append("Internship depth supports faster employer confidence.")
        elif inp.internship_months < 3:
            gaps.append("Internship months are still thin versus typical placement cohorts.")

        if inp.certification_count > 0:
            strengths.append("Certifications add verifiable skill signals alongside academics.")
        else:
            gaps.append("Add at least one credible certification aligned to your target role family.")

        for d in drivers_sorted:
            if d.direction == "positive" and d.user_friendly_summary:
                strengths.append(d.user_friendly_summary)
            elif d.direction == "negative" and d.user_friendly_summary:
                gaps.append(d.user_friendly_summary)

        if final_score >= 62:
            strengths.append("Composite placement intelligence is trending supportive for your stated trajectory.")
        else:
            gaps.append("Composite score has headroom — prioritize one high-leverage internship or certification cycle.")

        return strengths[:4], gaps[:4]

    def _placement_prob(self, score: float, months: int) -> float:
        caps = {3: 0.60, 6: 0.85, 12: 0.95}
        floors = {3: 0.05, 6: 0.20, 12: 0.40}
        cap = caps[months]
        floor = floors[months]
        normalized = (score - 50) / 20
        sigmoid = 1 / (1 + math.exp(-normalized))
        return floor + (cap - floor) * sigmoid

    def _generate_actions(
        self,
        inp: ScoreInput,
        drivers: list[RiskDriverInternal],
        risk_label: str,
    ) -> list[NextBestActionInternal]:
        _ = drivers
        _ = risk_label
        actions: list[NextBestActionInternal] = []
        if inp.internship_months < 4:
            actions.append(
                NextBestActionInternal(
                    action=(
                        "Complete at least one 3-month internship in your target sector "
                        "before graduation"
                    ),
                    impact="high",
                    resource_url="https://internshala.com",
                )
            )
        if inp.certification_count == 0:
            cert_map = {
                "CS": "AWS Certified Cloud Practitioner or Google Data Analytics",
                "Business": "CFA Level 1 or CPA basics",
                "Engineering": "PMP or Six Sigma Green Belt",
                "Life Sciences": "a relevant clinical research or lab certification",
                "Other": "a field-relevant certification",
            }
            cert_rec = cert_map.get(inp.program_type, "a field-relevant certification")
            actions.append(
                NextBestActionInternal(
                    action=f"Earn {cert_rec} to strengthen your profile signal",
                    impact="medium",
                    resource_url="https://coursera.org",
                )
            )
        sector_demand_val = self._demand_index(inp.target_sector, inp.target_country)
        if sector_demand_val < 0.4:
            actions.append(
                NextBestActionInternal(
                    action=(
                        f"Consider targeting adjacent sectors with stronger demand in "
                        f"{inp.target_country}"
                    ),
                    impact="medium",
                    resource_url=None,
                )
            )
        return actions[:3]

    def resolve_institute_tier(self, institute_name: str) -> str | None:
        """Optional helper: map Indian institute name to tier using NIRF lookup."""
        key = institute_name.strip().casefold()
        return self.nirf_data.get(key)
