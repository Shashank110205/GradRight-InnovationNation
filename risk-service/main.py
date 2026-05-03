"""FastAPI risk engine — rule-engine-v1."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import (
    AdmissionInput,
    AdmissionOutput,
    ComfortEmiRange,
    EligibilityInput,
    EligibilityOutput,
    ScoreInput,
    ScoreOutput,
)
from scorer import PlacementRiskScorer

DEFAULT_CORS = "http://localhost:3000,https://gradright.com,https://www.gradright.com"
_cors_origins = [
    o.strip()
    for o in os.environ.get("RISK_CORS_ORIGINS", DEFAULT_CORS).split(",")
    if o.strip()
]

app = FastAPI(title="GradRight Risk Engine", version="placement-intelligence-v2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_scorer: PlacementRiskScorer | None = None


def get_scorer() -> PlacementRiskScorer:
    global _scorer
    if _scorer is None:
        _scorer = PlacementRiskScorer()
    return _scorer


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "placement-intelligence-v2"}


@app.post("/score", response_model=ScoreOutput)
def score(body: ScoreInput) -> ScoreOutput:
    raw = get_scorer().compute_score(body)
    return ScoreOutput.model_validate(raw)


def _estimate_admission(body: AdmissionInput) -> AdmissionOutput:
    strength = 0.18 + 0.38 * body.cgpa_normalized
    strength += min(body.work_experience_years * 0.035, 0.18)

    if body.gre_score is not None:
        if body.gre_score >= 328:
            strength += 0.12
        elif body.gre_score >= 318:
            strength += 0.08
        elif body.gre_score >= 305:
            strength += 0.04

    if body.ielts_score is not None:
        if body.ielts_score >= 7.5:
            strength += 0.09
        elif body.ielts_score >= 7.0:
            strength += 0.06
        elif body.ielts_score >= 6.5:
            strength += 0.03

    tier_mult = {"Top10": 0.50, "Top50": 0.67, "Top100": 0.80, "Other": 0.93}
    raw_prob = strength * tier_mult[body.target_university_tier]
    admission_prob = max(0.05, min(0.95, raw_prob))

    if admission_prob >= 0.62:
        admit_band: str = "high"
    elif admission_prob >= 0.35:
        admit_band = "medium"
    else:
        admit_band = "low"

    tier = body.target_university_tier
    safer = [
        f"Consider {body.target_country} programs one selectivity band below your current target",
        "Add 1–2 target universities where your CGPA sits above the stated class average",
    ]
    ambitious = [
        "If test scores improve by one band, revisit Top50 targets with stronger quant profiles",
        "Highlight work outcomes (promotions, scope) to offset a reach school’s baseline stats",
    ]
    if tier == "Top10":
        safer = [
            "Strong public flagship or Top50 programs with aligned faculty in your sub-field",
            "Programs with co-op or STEM OPT-friendly curricula in the same region",
        ]
        ambitious = [
            "Ultra-selective peers only after GRE/IELTS at or above program medians",
        ]
    elif tier == "Other":
        safer = [
            "Regional accredited programs with documented placement in your target role",
        ]
        ambitious = [
            "Step up to Top100 targets after one internship or test-score improvement cycle",
        ]

    key_factors = [
        f"Normalized CGPA signal (~{body.cgpa_normalized:.0%} of scale)",
        f"Target band: {body.target_university_tier} in {body.target_country}",
    ]
    if body.gre_score is not None:
        key_factors.append(f"GRE {body.gre_score}")
    if body.ielts_score is not None:
        key_factors.append(f"IELTS {body.ielts_score}")
    if body.work_experience_years:
        key_factors.append(f"{body.work_experience_years} year(s) work experience")

    return AdmissionOutput(
        admission_prob=round(admission_prob, 2),
        admit_band=admit_band,
        safer_alternatives=safer,
        ambitious_alternatives=ambitious,
        key_factors=key_factors,
    )


def _estimate_eligibility(body: EligibilityInput) -> EligibilityOutput:
    mid_lpa = (body.salary_band_low_lpa + body.salary_band_high_lpa) / 2.0
    monthly_gross = (mid_lpa * 100_000) / 12.0
    takehome = monthly_gross * 0.78

    annual_rate = 0.115
    monthly_rate = annual_rate / 12.0
    tenure = 120

    def emi_for_principal(principal: float) -> float:
        if principal <= 0:
            return 0.0
        r = monthly_rate
        return (principal * r * (1 + r) ** tenure) / ((1 + r) ** tenure - 1)

    emi_requested = emi_for_principal(body.loan_amount_requested)
    income_to_emi_ratio = round((emi_requested / takehome) * 100.0, 2) if takehome > 0 else 100.0

    comfort_low = round(takehome * 0.25, 2)
    comfort_high = round(takehome * 0.40, 2)

    emi_cap_fraction = 0.38 if body.collateral_available else 0.30
    if body.family_income_annual >= 1_200_000:
        emi_cap_fraction += 0.04
    max_emi = takehome * emi_cap_fraction
    r = monthly_rate
    max_loan = max_emi * ((1 + r) ** tenure - 1) / (r * (1 + r) ** tenure)
    max_recommended = round(min(max_loan, body.loan_amount_requested * 1.15), 2)
    max_recommended = max(0.0, max_recommended)

    if income_to_emi_ratio <= 28 and (body.collateral_available or body.family_income_annual >= 800_000):
        band: str = "likely"
    elif income_to_emi_ratio <= 42:
        band = "moderate"
    else:
        band = "unlikely"

    return EligibilityOutput(
        eligibility_band=band,
        max_recommended_loan=max_recommended,
        comfort_emi_range=ComfortEmiRange(low=comfort_low, high=comfort_high),
        income_to_emi_ratio=income_to_emi_ratio,
    )


@app.post("/admission", response_model=AdmissionOutput)
def admission(body: AdmissionInput) -> AdmissionOutput:
    return _estimate_admission(body)


@app.post("/eligibility", response_model=EligibilityOutput)
def eligibility(body: EligibilityInput) -> EligibilityOutput:
    return _estimate_eligibility(body)
