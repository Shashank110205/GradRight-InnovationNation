"""Pydantic v2 models aligned with ARCHITECTURE.md Section 5."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

InstituteTier = Literal["IIT/IIM", "NIT/Tier2", "Other"]
ProgramType = Literal["CS", "Engineering", "Business", "Life Sciences", "Other"]
TargetSector = Literal["IT", "BFSI", "Healthcare", "Manufacturing", "Other"]
RiskLabel = Literal["low", "medium", "high"]
DriverDirection = Literal["positive", "negative", "neutral"]
ActionImpact = Literal["high", "medium"]
AdmitBand = Literal["low", "medium", "high"]
EligibilityBand = Literal["likely", "moderate", "unlikely"]
UniversityTier = Literal["Top10", "Top50", "Top100", "Other"]


class ScoreInput(BaseModel):
    institute_tier: InstituteTier
    program_type: ProgramType
    cgpa_normalized: float = Field(ge=0.0, le=1.0)
    internship_months: int = Field(ge=0)
    certification_count: int = Field(ge=0)
    target_country: str
    target_sector: TargetSector
    work_experience_years: int = Field(ge=0)


class RiskDriver(BaseModel):
    factor: str
    direction: DriverDirection
    weight: float
    explanation: str
    user_friendly_summary: str | None = None


class NextBestAction(BaseModel):
    action: str
    impact: ActionImpact
    resource_url: str | None = None


class ScoreOutput(BaseModel):
    placement_prob_3m: float
    placement_prob_6m: float
    placement_prob_12m: float
    salary_band_low_lpa: float
    salary_band_high_lpa: float
    risk_label: RiskLabel
    risk_score_raw: float
    top_drivers: list[RiskDriver]
    next_best_actions: list[NextBestAction]
    score_confidence: Literal["low", "medium", "high"] = "medium"
    score_data_coverage_percentage: float = Field(default=100.0, ge=0.0, le=100.0)
    placement_intelligence_tier: Literal["preliminary", "enhanced", "live_market"] = "preliminary"
    grad_score_display_title: str = "Your Preliminary GradScore"
    intelligence_source_note: str = "Using benchmark intelligence"
    score_confidence_user_message: str = ""
    normalized_signal_snapshot: dict[str, float] = Field(default_factory=dict)


class AdmissionInput(BaseModel):
    cgpa_normalized: float = Field(ge=0.0, le=1.0)
    gre_score: int | None = Field(default=None, ge=260, le=340)
    ielts_score: float | None = Field(default=None, ge=0.0, le=9.0)
    work_experience_years: int = Field(ge=0)
    target_program: str
    target_university_tier: UniversityTier
    target_country: str


class AdmissionOutput(BaseModel):
    admission_prob: float = Field(ge=0.0, le=1.0)
    admit_band: AdmitBand
    safer_alternatives: list[str]
    ambitious_alternatives: list[str]
    key_factors: list[str]


class EligibilityInput(BaseModel):
    loan_amount_requested: float = Field(gt=0)
    salary_band_low_lpa: float = Field(ge=0)
    salary_band_high_lpa: float = Field(ge=0)
    family_income_annual: float = Field(ge=0)
    collateral_available: bool


class ComfortEmiRange(BaseModel):
    low: float
    high: float


class EligibilityOutput(BaseModel):
    eligibility_band: EligibilityBand
    max_recommended_loan: float
    comfort_emi_range: ComfortEmiRange
    income_to_emi_ratio: float
