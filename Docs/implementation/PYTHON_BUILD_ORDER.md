# GradRight — Python Backend Build Order
# Complete Cursor prompts. Run in this exact sequence.
# Backend = Python FastAPI only. No TypeScript anywhere in the backend.

---

# SPRINT 1 — FOUNDATION

## CURSOR PROMPT 1.1 — Database Models (SQLAlchemy)

```
Build all SQLAlchemy ORM models for GradRight. Read .cursorrules first.

Create these files in app/models/:

1. app/models/user.py
```python
from sqlalchemy import Column, String, Boolean, Integer, Date, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="student", nullable=False)
    # 'student' | 'nbfc_supervisor' | 'admin'
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_timestamp = Column(DateTime(timezone=True), nullable=True)
    onboarding_complete = Column(Boolean, default=False, nullable=False)
    journey_stage = Column(String, default="discover", nullable=False)
    # 'discover' | 'plan' | 'finance' | 'apply' | 'succeed'
    xp_points = Column(Integer, default=0, nullable=False)
    streak_days = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

2. app/models/student_profile.py — fields: user_id (FK to users), target_country, target_intake, degree_type, broad_field, current_academic_level, work_experience_years, loan_needed, budget_band_usd, institute_name, institute_tier, cgpa, cgpa_scale, internship_count, internship_months_total, certification_count, target_universities (JSONB), gre_score, ielts_score, toefl_score, parent_contact_email, created_at, updated_at

3. app/models/risk_score.py — fields: id, user_id (FK), input_snapshot (JSONB), placement_prob_3m, placement_prob_6m, placement_prob_12m, salary_band_low_lpa, salary_band_high_lpa, risk_label, risk_score_raw, top_drivers (JSONB), next_best_actions (JSONB), ai_summary, model_version, calculated_at, created_at, updated_at

4. app/models/loan_application.py — fields: id, user_id (FK), risk_score_id (FK), status, step_completed, full_name, dob, pan_number (encrypted), aadhaar_last4, address, institute, program, admission_confirmed, offer_letter_url, loan_amount_requested, co_borrower_name, co_borrower_relation, collateral_available, family_income_annual, documents (JSONB), ocr_extracted_data (JSONB), nbfc_supervisor_id, nbfc_notes, nbfc_decision_at, submitted_at, created_at, updated_at

5. app/models/user_event.py — fields: id, user_id (FK), event_type (String), event_data (JSONB), created_at

6. app/models/gamification_reward.py — fields: id, user_id (FK), action (String), xp_earned (Integer), badge_unlocked (String nullable), created_at

7. app/models/nudge_log.py — fields: id, user_id (FK), nudge_type, channel, content, sent_at, opened (Boolean), clicked (Boolean)

8. Update app/models/__init__.py to import all models.

Use SQLAlchemy JSONB for all JSON fields (from sqlalchemy.dialects.postgresql import JSONB).
Use UUID primary keys everywhere.
All timestamps are timezone-aware DateTime.
```

---

## CURSOR PROMPT 1.2 — Pydantic Schemas

```
Create all Pydantic v2 schemas for GradRight. These are used for request validation and response serialization.

Create app/schemas/base.py:
```python
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
```

Create app/schemas/onboarding.py:
```python
from pydantic import BaseModel
from typing import Optional

class OnboardingAnswers(BaseModel):
    target_country: str
    degree_type: str
    broad_field: str
    target_intake: str
    current_academic_level: str
    budget_band_usd: str
    loan_needed: bool
    consent_given: bool = True

class GradRightScore(BaseModel):
    university_matches: list[dict]       # [{cluster: str, fit_pct: int, examples: list[str]}]
    salary_band_low_lpa: float
    salary_band_high_lpa: float
    loan_eligibility_band: str           # 'likely' | 'moderate' | 'unlikely'
    risk_label: str
    risk_one_liner: str
```

Create app/schemas/risk_score.py:
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RiskDriver(BaseModel):
    factor: str
    direction: str       # 'positive' | 'negative' | 'neutral'
    weight: float
    explanation: str

class NextBestAction(BaseModel):
    action: str
    impact: str          # 'high' | 'medium'
    resource_url: Optional[str] = None

class RiskScoreInput(BaseModel):
    institute_tier: str
    program_type: str
    cgpa_normalized: float       # 0.0 - 1.0
    internship_months: int
    certification_count: int
    target_country: str
    target_sector: str
    work_experience_years: int

class RiskScoreResponse(BaseModel):
    id: str
    placement_prob_3m: float
    placement_prob_6m: float
    placement_prob_12m: float
    salary_band_low_lpa: float
    salary_band_high_lpa: float
    risk_label: str
    risk_score_raw: float
    top_drivers: list[RiskDriver]
    next_best_actions: list[NextBestAction]
    ai_summary: Optional[str] = None
    model_version: str
    calculated_at: datetime
```

Create app/schemas/admission.py, app/schemas/loan.py, app/schemas/financing.py, app/schemas/nbfc.py with similar Pydantic models covering all fields from DATA_MODELS.md.

Update app/schemas/__init__.py to export all schemas.
```

---

## CURSOR PROMPT 1.3 — Auth Middleware

```
Create the authentication middleware for GradRight. All protected routes depend on this.

1. Create app/supabase_client.py:
```python
from supabase import create_client, Client
from app.config import settings

def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)

def get_supabase_admin() -> Client:
    """Service role client — use only in backend, never expose to frontend."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
```

2. Create app/middleware/auth.py:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.supabase_client import get_supabase
from app.models.user import User

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Verifies Bearer token with Supabase, returns the User ORM object.
    Raises 401 if token invalid, 404 if user not found in our DB.
    """
    token = credentials.credentials
    supabase = get_supabase()
    
    try:
        response = supabase.auth.get_user(token)
        supabase_uid = response.user.id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    result = await db.execute(
        select(User).where(User.supabase_uid == supabase_uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user

async def require_nbfc_supervisor(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Additional check on top of get_current_user.
    Raises 403 if user is not an NBFC supervisor.
    """
    if current_user.role != "nbfc_supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="NBFC supervisor access required",
        )
    return current_user
```

Use `Depends(get_current_user)` on all student routes.
Use `Depends(require_nbfc_supervisor)` on all /api/nbfc/* routes.
```

---

# SPRINT 2 — CORE SERVICES

## CURSOR PROMPT 2.1 — Risk Engine Service

```
Build the placement risk scoring engine. This is the most important service — it must be accurate, fast, and produce explainable outputs.

Create app/services/risk_engine.py:

```python
import json
import math
import os
from dataclasses import dataclass
from typing import Optional
from app.schemas.risk_score import RiskDriver, NextBestAction

@dataclass
class RiskScoreInput:
    institute_tier: str          # "IIT/IIM" | "NIT/Tier2" | "Other"
    program_type: str            # "CS" | "Engineering" | "Business" | "Life Sciences" | "Other"
    cgpa_normalized: float       # 0.0 – 1.0
    internship_months: int
    certification_count: int
    target_country: str
    target_sector: str
    work_experience_years: int

@dataclass
class RiskScoreResult:
    placement_prob_3m: float
    placement_prob_6m: float
    placement_prob_12m: float
    salary_band_low_lpa: float
    salary_band_high_lpa: float
    risk_label: str              # "low" | "medium" | "high"
    risk_score_raw: float        # 0–100
    top_drivers: list[RiskDriver]
    next_best_actions: list[NextBestAction]


class PlacementRiskEngine:
    """
    Rule-based placement risk scoring engine v1.
    Scores a student's likelihood of job placement post-graduation.
    Max raw score = 100. Risk: 0-40 = high, 41-65 = medium, 66-100 = low.
    """

    DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

    def __init__(self):
        with open(f"{self.DATA_DIR}/sector_demand.json") as f:
            self.sector_demand: dict = json.load(f)
        with open(f"{self.DATA_DIR}/salary_benchmarks.json") as f:
            self.salary_benchmarks: dict = json.load(f)

    def score(self, inp: RiskScoreInput) -> RiskScoreResult:
        """Compute placement risk score and return full result object."""
        drivers: list[RiskDriver] = []
        total = 0.0

        # 1. Institute tier (max 30 pts)
        tier_pts = {"IIT/IIM": 30.0, "NIT/Tier2": 20.0, "Other": 10.0}.get(inp.institute_tier, 10.0)
        total += tier_pts
        drivers.append(RiskDriver(
            factor="Institute Placement Strength",
            direction="positive" if tier_pts >= 20 else "negative",
            weight=round(tier_pts / 30, 2),
            explanation=f"Your institute tier ({inp.institute_tier}) contributes {tier_pts:.0f}/30 to your placement readiness.",
        ))

        # 2. CGPA (max 20 pts)
        cgpa_pts = inp.cgpa_normalized * 20
        total += cgpa_pts
        drivers.append(RiskDriver(
            factor="Academic Performance (CGPA)",
            direction="positive" if inp.cgpa_normalized >= 0.75 else ("neutral" if inp.cgpa_normalized >= 0.60 else "negative"),
            weight=round(inp.cgpa_normalized, 2),
            explanation=f"CGPA contributes {cgpa_pts:.1f}/20. {'Strong academic record.' if inp.cgpa_normalized >= 0.75 else 'Moderate academic record.'}",
        ))

        # 3. Internship (max 15 pts)
        if inp.internship_months == 0:
            intern_pts = 0.0
        elif inp.internship_months <= 3:
            intern_pts = 5.0
        elif inp.internship_months <= 6:
            intern_pts = 10.0
        else:
            intern_pts = 15.0
        total += intern_pts
        drivers.append(RiskDriver(
            factor="Internship Exposure",
            direction="positive" if intern_pts >= 10 else "negative",
            weight=round(intern_pts / 15, 2),
            explanation=f"{'Strong' if intern_pts >= 10 else 'Limited'} internship history ({inp.internship_months} months). {'This significantly boosts employer confidence.' if intern_pts >= 10 else 'More internship experience would improve this score.'}",
        ))

        # 4. Certifications (max 5 pts)
        cert_pts = min(inp.certification_count * 2.5, 5.0)
        total += cert_pts
        drivers.append(RiskDriver(
            factor="Skill Certifications",
            direction="positive" if cert_pts >= 3 else "neutral",
            weight=round(cert_pts / 5, 2),
            explanation=f"{inp.certification_count} certification(s) contribute {cert_pts:.1f}/5 pts.",
        ))

        # 5. Sector demand (max 15 pts)
        demand_index = self.sector_demand.get(inp.target_sector, {}).get(inp.target_country, 0.5)
        sector_pts = demand_index * 15
        total += sector_pts
        drivers.append(RiskDriver(
            factor=f"{inp.target_sector} Demand in {inp.target_country}",
            direction="positive" if demand_index >= 0.65 else ("neutral" if demand_index >= 0.40 else "negative"),
            weight=round(demand_index, 2),
            explanation=f"Job demand for {inp.target_sector} in {inp.target_country} is at {demand_index:.0%} of peak activity.",
        ))

        # 6. Country bonus (max 5 pts)
        country_pts = {"US": 5.0, "UK": 3.0, "Germany": 4.0, "Canada": 4.0, "Australia": 3.0, "domestic": 2.0}.get(inp.target_country, 2.0)
        total += country_pts

        # 7. Work experience (max 10 pts)
        work_pts = min(inp.work_experience_years * 3.0, 10.0)
        total += work_pts

        total = min(total, 100.0)

        # Risk label
        if total >= 66:
            risk_label = "low"
        elif total >= 41:
            risk_label = "medium"
        else:
            risk_label = "high"

        # Placement probabilities
        p3m = self._placement_prob(total, months=3)
        p6m = self._placement_prob(total, months=6)
        p12m = self._placement_prob(total, months=12)

        # Salary band
        salary_key = f"{inp.program_type}_{inp.institute_tier}_{inp.target_country}"
        salary = self.salary_benchmarks.get(salary_key, {"low": 40.0, "high": 60.0})

        # Top 3 drivers by impact
        top_drivers = sorted(drivers, key=lambda d: abs(d.weight - 0.5), reverse=True)[:3]

        # Next best actions
        actions = self._generate_actions(inp, drivers, risk_label)

        return RiskScoreResult(
            placement_prob_3m=round(p3m, 2),
            placement_prob_6m=round(p6m, 2),
            placement_prob_12m=round(p12m, 2),
            salary_band_low_lpa=float(salary["low"]),
            salary_band_high_lpa=float(salary["high"]),
            risk_label=risk_label,
            risk_score_raw=round(total, 2),
            top_drivers=top_drivers,
            next_best_actions=actions,
        )

    @staticmethod
    def _placement_prob(score: float, months: int) -> float:
        caps = {3: 0.60, 6: 0.85, 12: 0.95}
        floors = {3: 0.05, 6: 0.20, 12: 0.40}
        cap = caps[months]
        floor = floors[months]
        normalized = (score - 50) / 20
        sigmoid = 1 / (1 + math.exp(-normalized))
        return floor + (cap - floor) * sigmoid

    def _generate_actions(self, inp: RiskScoreInput, drivers: list[RiskDriver], risk_label: str) -> list[NextBestAction]:
        actions = []
        if inp.internship_months < 4:
            actions.append(NextBestAction(
                action="Complete at least one 3-month internship in your target sector before graduation",
                impact="high",
                resource_url="https://internshala.com",
            ))
        if inp.certification_count == 0:
            cert_map = {
                "CS": "AWS Cloud Practitioner or Google Data Analytics",
                "Business": "CFA Level 1 or CPA basics",
                "Engineering": "PMP or Six Sigma Green Belt",
            }
            cert_rec = cert_map.get(inp.program_type, "a field-relevant certification")
            actions.append(NextBestAction(
                action=f"Earn {cert_rec} to strengthen your profile signal to recruiters",
                impact="medium",
                resource_url="https://coursera.org",
            ))
        demand_index = self.sector_demand.get(inp.target_sector, {}).get(inp.target_country, 0.5)
        if demand_index < 0.40:
            actions.append(NextBestAction(
                action=f"Explore adjacent high-demand sectors in {inp.target_country} for your profile",
                impact="medium",
                resource_url=None,
            ))
        return actions[:3]


# Singleton instance — import this wherever needed
risk_engine = PlacementRiskEngine()
```

Also create app/services/admission_engine.py:

```python
import json
import os
from dataclasses import dataclass

@dataclass
class AdmissionInput:
    cgpa_normalized: float
    gre_score: int | None
    ielts_score: float | None
    work_experience_years: int
    target_university_tier: str   # "Top10" | "Top50" | "Top100" | "Other"
    target_country: str
    degree_type: str

@dataclass
class AdmissionResult:
    university: str
    tier: str
    admission_prob: float
    admit_band: str               # "low" | "medium" | "high"


class AdmissionEngine:
    """
    Rule-based admission probability estimator.
    Uses CGPA, test scores, work experience vs university tier benchmarks.
    """

    # Baseline thresholds per tier (cgpa_norm, gre_normalized 260-340 range)
    TIER_BENCHMARKS = {
        "Top10":  {"cgpa_min": 0.85, "cgpa_avg": 0.92, "gre_min": 320, "gre_avg": 330},
        "Top50":  {"cgpa_min": 0.75, "cgpa_avg": 0.85, "gre_min": 310, "gre_avg": 322},
        "Top100": {"cgpa_min": 0.65, "cgpa_avg": 0.78, "gre_min": 300, "gre_avg": 315},
        "Other":  {"cgpa_min": 0.55, "cgpa_avg": 0.70, "gre_min": 290, "gre_avg": 305},
    }

    def score(self, inp: AdmissionInput) -> AdmissionResult:
        bench = self.TIER_BENCHMARKS.get(inp.target_university_tier, self.TIER_BENCHMARKS["Other"])
        score = 0.0

        # CGPA component (max 50 pts)
        if inp.cgpa_normalized >= bench["cgpa_avg"]:
            score += 50
        elif inp.cgpa_normalized >= bench["cgpa_min"]:
            ratio = (inp.cgpa_normalized - bench["cgpa_min"]) / (bench["cgpa_avg"] - bench["cgpa_min"])
            score += 20 + 30 * ratio
        else:
            gap = bench["cgpa_min"] - inp.cgpa_normalized
            score += max(0, 20 - gap * 100)

        # GRE component (max 30 pts) — optional
        if inp.gre_score:
            gre_norm = (inp.gre_score - 260) / (340 - 260)
            bench_norm = (bench["gre_avg"] - 260) / (340 - 260)
            score += min(30, 30 * (gre_norm / bench_norm))
        else:
            score += 15  # neutral if not taken yet

        # Work experience (max 10 pts) — primarily for MBA/MiM
        is_work_exp_program = inp.degree_type in ("MBA", "MiM")
        if is_work_exp_program:
            score += min(inp.work_experience_years * 3, 10)
        else:
            score += min(inp.work_experience_years * 1.5, 5)

        # Country adjustment (max 10 pts) — US is most competitive
        country_factor = {"US": 0.9, "UK": 1.0, "Canada": 1.05, "Germany": 1.1, "Australia": 1.05}.get(inp.target_country, 1.0)
        score = min(score * country_factor, 100)

        prob = score / 100
        if prob >= 0.65:
            band = "high"
        elif prob >= 0.40:
            band = "medium"
        else:
            band = "low"

        return AdmissionResult(
            university="",           # Caller sets this
            tier=inp.target_university_tier,
            admission_prob=round(prob, 2),
            admit_band=band,
        )

admission_engine = AdmissionEngine()
```
```

---

## CURSOR PROMPT 2.2 — Claude AI Service

```
Build the Claude AI service. All Claude API calls go through this single service file. Never call the Anthropic SDK from a router directly.

Create app/services/claude_service.py:

```python
import json
import logging
from anthropic import Anthropic
from app.config import settings
from app.prompts import (
    mentor, risk_narrator, timeline_generator, 
    admission_explainer, digest as digest_prompt, ocr_assist
)

logger = logging.getLogger(__name__)
client = Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-sonnet-4-20250514"


def stream_chat_response(user_message: str, system_prompt: str):
    """
    Streams a chat response using Claude.
    Yields text chunks as Server-Sent Event strings.
    Use with FastAPI StreamingResponse.
    """
    with client.messages.stream(
        model=MODEL,
        max_tokens=1000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {text}\n\n"
    yield "data: [DONE]\n\n"


def generate_risk_summary(risk_data: dict) -> str:
    """
    Generate a plain-language 3-sentence risk summary.
    Input: dict with risk_score_raw, risk_label, top_drivers, placement_prob_6m, salary_band_*
    Output: 3-sentence string
    """
    try:
        user_message = f"Risk data: {json.dumps(risk_data)}"
        response = client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=risk_narrator.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"[claude_service][generate_risk_summary] Error: {e}")
        return "Your risk score has been calculated. View the detailed breakdown below."


def generate_timeline_milestones(target_country: str, degree_type: str, target_intake: str, current_date: str) -> list[dict]:
    """
    Generate personalized application timeline as a JSON array.
    Returns list of milestone dicts.
    """
    user_message = (
        f"Target country: {target_country}, Degree: {degree_type}, "
        f"Target intake: {target_intake}, Current date: {current_date}"
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=timeline_generator.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"[claude_service][generate_timeline_milestones] Error: {e}")
        return []


def generate_admission_explanation(university: str, tier: str, prob: float, cgpa_norm: float, gre: int | None, work_exp: int) -> str:
    """
    Generate a plain-language admission probability explanation (2 paragraphs).
    """
    user_message = (
        f"University: {university}, Tier: {tier}, Probability: {prob:.0%}, "
        f"Student CGPA (normalized): {cgpa_norm:.2f}, GRE: {gre or 'not taken'}, "
        f"Work experience: {work_exp} years"
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=400,
            system=admission_explainer.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"[claude_service][generate_admission_explanation] Error: {e}")
        return f"Based on your profile, we estimate a {prob:.0%} probability of admission to this program."


def generate_weekly_digest(user_context: dict) -> dict | None:
    """
    Generate personalized weekly digest content as structured JSON.
    Returns dict with subject_line, greeting, items list.
    """
    user_message = f"User context: {json.dumps(user_context)}"
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=digest_prompt.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"[claude_service][generate_weekly_digest] Error: {e}")
        return None


def extract_document_fields(raw_ocr_text: str, document_type: str) -> dict:
    """
    Use Claude to parse ambiguous OCR text into structured fields.
    document_type: 'marksheet' | 'offer_letter' | 'income_proof'
    """
    system = ocr_assist.get_prompt(document_type, raw_ocr_text)
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=500,
            system="You are a document extraction assistant. Return only valid JSON.",
            messages=[{"role": "user", "content": system}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"[claude_service][extract_document_fields] Error: {e}")
        return {}
```

Also create all prompt files in app/prompts/:
- app/prompts/mentor.py — SYSTEM_PROMPT string (copy from AI_PROMPTS.md mentor section)
- app/prompts/risk_narrator.py — SYSTEM_PROMPT string
- app/prompts/timeline_generator.py — SYSTEM_PROMPT string
- app/prompts/admission_explainer.py — SYSTEM_PROMPT string
- app/prompts/digest.py — SYSTEM_PROMPT string
- app/prompts/ocr_assist.py — get_prompt(document_type, raw_text) function

Each prompt file exports exactly one constant or function. Copy the prompt text from AI_PROMPTS.md.
```

---

## CURSOR PROMPT 2.3 — Loan Service + Calculations

```
Build the loan service with EMI calculations and eligibility estimation.

Create app/utils/calculations.py:
```python
import math

def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """
    Calculate monthly EMI using the standard reducing balance formula.
    principal: loan amount in INR
    annual_rate: e.g. 0.115 for 11.5%
    tenure_months: repayment period in months
    Returns: monthly EMI in INR (rounded to nearest rupee)
    """
    monthly_rate = annual_rate / 12
    emi = (principal * monthly_rate * math.pow(1 + monthly_rate, tenure_months)) / \
          (math.pow(1 + monthly_rate, tenure_months) - 1)
    return round(emi, 0)


def calculate_emi_comfort(
    emi: float,
    salary_low_lpa: float,
    salary_high_lpa: float,
) -> dict:
    """
    Calculate what % of take-home income the EMI represents.
    Assumes 78% take-home ratio (after Indian tax + PF deductions).
    Returns dict with pct_at_low, pct_at_high, comfort_label.
    """
    take_home_low = (salary_low_lpa * 100_000 / 12) * 0.78
    take_home_high = (salary_high_lpa * 100_000 / 12) * 0.78
    pct_low = (emi / take_home_low) * 100
    pct_high = (emi / take_home_high) * 100

    if pct_high <= 25:
        label = "comfortable"
    elif pct_high <= 40:
        label = "moderate"
    else:
        label = "high_stress"

    return {
        "emi_pct_at_low_salary": round(pct_low, 1),
        "emi_pct_at_high_salary": round(pct_high, 1),
        "comfort_label": label,
    }


def normalize_cgpa(cgpa: float, scale: float) -> float:
    """Normalize CGPA to 0.0–1.0 range."""
    return min(max(cgpa / scale, 0.0), 1.0)


def format_inr(amount: float) -> str:
    """Format a rupee amount in Indian notation. e.g. 3500000 → '₹35,00,000'"""
    amount = int(amount)
    s = str(amount)
    if len(s) <= 3:
        return f"₹{s}"
    last3 = s[-3:]
    rest = s[:-3]
    parts = []
    while len(rest) > 2:
        parts.append(rest[-2:])
        rest = rest[:-2]
    if rest:
        parts.append(rest)
    parts.reverse()
    return f"₹{','.join(parts)},{last3}"
```

Create app/services/loan_service.py:
```python
from app.utils.calculations import calculate_emi, calculate_emi_comfort
from app.services.risk_engine import risk_engine, RiskScoreInput

def estimate_loan_eligibility(
    family_income_annual: float,
    loan_amount_requested: float,
    collateral_available: bool,
    salary_low_lpa: float,
    salary_high_lpa: float,
) -> dict:
    """
    Non-binding loan eligibility estimate.
    Uses family income, collateral, and predicted salary to determine eligibility band.
    This is NOT a credit decision — it is an indicative estimate only.
    """
    # Max loan = min of (20x monthly family income) and (salary-based repayment capacity)
    monthly_income = family_income_annual / 12
    income_based_max = monthly_income * 20 * 12   # rough 20-months-income heuristic

    # Salary-based capacity: assume max 40% of predicted income for EMI
    max_emi_capacity = (salary_high_lpa * 100_000 / 12) * 0.78 * 0.40
    tenure = 120
    annual_rate = 0.115
    # Back-calculate max loan from max EMI capacity
    import math
    r = annual_rate / 12
    salary_based_max = max_emi_capacity * (math.pow(1 + r, tenure) - 1) / (r * math.pow(1 + r, tenure))

    max_recommended = min(income_based_max, salary_based_max)
    if collateral_available:
        max_recommended *= 1.2   # collateral boosts eligibility

    if loan_amount_requested <= max_recommended * 0.85:
        band = "likely"
    elif loan_amount_requested <= max_recommended * 1.10:
        band = "moderate"
    else:
        band = "unlikely"

    emi = calculate_emi(loan_amount_requested, annual_rate, tenure)
    comfort = calculate_emi_comfort(emi, salary_low_lpa, salary_high_lpa)

    return {
        "eligibility_band": band,
        "max_recommended_loan": round(max_recommended, -4),  # round to nearest 10k
        "monthly_emi": emi,
        "comfort": comfort,
        "disclaimer": "This is a non-binding estimate. Actual eligibility is determined by a trained credit officer.",
    }
```
```

---

# SPRINT 3 — API ROUTERS

## CURSOR PROMPT 3.1 — All FastAPI Routers

```
Build all FastAPI route handlers. Routes must be thin — all logic lives in services. Read .cursorrules.

Create app/routers/onboarding.py:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.schemas.onboarding import OnboardingAnswers, GradRightScore
from app.schemas.base import APIResponse
from app.services.risk_engine import risk_engine, RiskScoreInput
from app.services.claude_service import generate_risk_summary
from app.utils.calculations import normalize_cgpa
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/submit", response_model=APIResponse[GradRightScore])
async def submit_onboarding(
    answers: OnboardingAnswers,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives onboarding answers, creates student profile, generates GradRight Score.
    Must complete under 3 seconds — risk engine and Claude called in parallel where possible.
    """
    try:
        # Create student profile
        profile = StudentProfile(
            user_id=current_user.id,
            target_country=answers.target_country,
            degree_type=answers.degree_type,
            broad_field=answers.broad_field,
            target_intake=answers.target_intake,
            current_academic_level=answers.current_academic_level,
            budget_band_usd=answers.budget_band_usd,
            loan_needed=answers.loan_needed,
        )
        db.add(profile)

        # Update user consent + onboarding status
        current_user.consent_given = True
        current_user.onboarding_complete = True
        await db.commit()

        # Generate a basic risk score with minimal data (CGPA unknown yet, use defaults)
        risk_input = RiskScoreInput(
            institute_tier="NIT/Tier2",   # default until profile is enriched
            program_type=_map_field_to_program(answers.broad_field),
            cgpa_normalized=0.75,          # default neutral
            internship_months=0,
            certification_count=0,
            target_country=_map_country(answers.target_country),
            target_sector=_map_field_to_sector(answers.broad_field),
            work_experience_years=_map_work_exp(answers.current_academic_level),
        )
        risk_result = risk_engine.score(risk_input)

        # Build GradRight Score
        grad_score = GradRightScore(
            university_matches=_build_university_matches(answers.target_country, answers.broad_field),
            salary_band_low_lpa=risk_result.salary_band_low_lpa,
            salary_band_high_lpa=risk_result.salary_band_high_lpa,
            loan_eligibility_band="likely" if risk_result.risk_label != "high" else "moderate",
            risk_label=risk_result.risk_label,
            risk_one_liner=f"Your profile shows {risk_result.risk_label.upper()} placement risk based on your field and intake.",
        )

        return APIResponse(success=True, data=grad_score)

    except Exception as e:
        logger.error(f"[onboarding][submit] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process onboarding")


def _map_field_to_program(field: str) -> str:
    mapping = {"Computer Science / IT": "CS", "Engineering": "Engineering", "Business / Finance": "Business", "Life Sciences": "Life Sciences"}
    return mapping.get(field, "Other")

def _map_field_to_sector(field: str) -> str:
    mapping = {"Computer Science / IT": "CS", "Engineering": "Engineering", "Business / Finance": "Business", "Life Sciences": "Life Sciences"}
    return mapping.get(field, "Other")

def _map_country(country: str) -> str:
    mapping = {"United States": "US", "United Kingdom": "UK", "Canada": "Canada", "Germany": "Germany", "Australia": "Australia", "India (Domestic)": "domestic"}
    return mapping.get(country, "US")

def _map_work_exp(level: str) -> int:
    mapping = {"Working (1–3 yrs)": 2, "Working (3+ yrs)": 4}
    return mapping.get(level, 0)

def _build_university_matches(country: str, field: str) -> list[dict]:
    # Static hardcoded match clusters — enriched by real predictor in M5
    country_clusters = {
        "United States": [
            {"cluster": "Top US CS Programs", "fit_pct": 65, "examples": ["Purdue", "UIUC", "UMass Amherst"]},
            {"cluster": "Mid-tier US CS", "fit_pct": 78, "examples": ["ASU", "Northeastern", "George Mason"]},
            {"cluster": "Business-track US", "fit_pct": 55, "examples": ["UT Dallas", "Case Western"]},
        ]
    }
    return country_clusters.get(country, [
        {"cluster": "Target Programs", "fit_pct": 70, "examples": ["See predictor for details"]}
    ])
```

Create app/routers/ai.py with these endpoints:
- POST /api/ai/chat — streaming chat via StreamingResponse
- POST /api/ai/risk-score — generate/refresh risk score
- POST /api/ai/admission — admission predictor (batch for multiple universities)
- POST /api/ai/timeline — generate application timeline
- POST /api/ai/digest — trigger weekly digest generation (protected by cron secret)

Create app/routers/loan.py with:
- GET /api/loan/application — get current user's draft application
- POST /api/loan/application — create new draft
- PATCH /api/loan/application — update step data
- POST /api/loan/application/submit — submit for NBFC review
- POST /api/loan/ocr — OCR document upload
- POST /api/loan/eligibility — loan eligibility estimate
- GET /api/loan/parent-summary — generate parent PDF

Create app/routers/nbfc.py with:
- GET /api/nbfc/applications — list all submitted applications (requires nbfc_supervisor)
- GET /api/nbfc/applications/{id} — application detail
- PATCH /api/nbfc/applications/{id}/decision — approve/reject/flag
- GET /api/nbfc/portfolio — aggregated portfolio stats

All routes must use Depends(get_current_user) for student routes and Depends(require_nbfc_supervisor) for NBFC routes.
```

---

## CURSOR PROMPT 3.2 — OCR Service

```
Build the OCR document extraction service.

Create app/services/ocr_service.py:
```python
import os
import re
import logging
from pathlib import Path
from PIL import Image
import pytesseract
from app.services.claude_service import extract_document_fields

logger = logging.getLogger(__name__)

class OCRService:
    """
    Extracts structured data from uploaded documents.
    Development: uses pytesseract (local Tesseract).
    Production: uses AWS Textract for higher accuracy.
    """

    def extract(self, file_path: str, document_type: str) -> dict:
        """
        Main extraction method. Returns dict of extracted fields.
        Falls back gracefully if extraction fails.
        """
        try:
            raw_text = self._run_tesseract(file_path)
            parsed = self._parse_by_type(raw_text, document_type)
            # For fields we couldn't parse with regex, ask Claude
            missing_fields = [k for k, v in parsed.items() if v is None]
            if missing_fields:
                claude_result = extract_document_fields(raw_text, document_type)
                for field in missing_fields:
                    if field in claude_result:
                        parsed[field] = claude_result[field]
            return parsed
        except Exception as e:
            logger.error(f"[ocr_service][extract] Error for {document_type}: {e}")
            return {}

    def _run_tesseract(self, file_path: str) -> str:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text.strip()

    def _parse_by_type(self, text: str, document_type: str) -> dict:
        if document_type == "marksheet":
            return self._parse_marksheet(text)
        elif document_type == "offer_letter":
            return self._parse_offer_letter(text)
        elif document_type == "income_proof":
            return self._parse_income_proof(text)
        return {}

    def _parse_marksheet(self, text: str) -> dict:
        cgpa = None
        cgpa_match = re.search(r'(?:cgpa|gpa|grade point)[:\s]+([0-9]+\.?[0-9]*)', text, re.IGNORECASE)
        if cgpa_match:
            cgpa = float(cgpa_match.group(1))
        year_match = re.search(r'(?:year of passing|graduation)[:\s]+(\d{4})', text, re.IGNORECASE)
        return {
            "student_name": None,
            "institute_name": None,
            "cgpa": cgpa,
            "cgpa_scale": 10.0,
            "graduation_year": int(year_match.group(1)) if year_match else None,
        }

    def _parse_offer_letter(self, text: str) -> dict:
        fee_match = re.search(r'\$\s*([0-9,]+)', text)
        fees = float(fee_match.group(1).replace(',', '')) if fee_match else None
        return {
            "university_name": None,
            "program_name": None,
            "intake_date": None,
            "total_fees_amount": fees,
            "fees_currency": "USD" if fees else None,
        }

    def _parse_income_proof(self, text: str) -> dict:
        income_match = re.search(r'(?:gross total|total income|annual income)[:\s]+(?:rs\.?|₹)?\s*([0-9,]+)', text, re.IGNORECASE)
        income = float(income_match.group(1).replace(',', '')) if income_match else None
        return {
            "annual_income": income,
            "employer_name": None,
            "assessment_year": None,
        }

ocr_service = OCRService()
```
```

---

## CURSOR PROMPT 3.3 — PDF Service (Parent Summary)

```
Build the parent summary PDF generator using reportlab.

Create app/services/pdf_service.py:
```python
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import cm
from reportlab.lib import colors

BRAND_INDIGO = HexColor("#6366F1")
BRAND_LIGHT = HexColor("#EEF2FF")
TEXT_DARK = HexColor("#1E1B4B")
TEXT_GRAY = HexColor("#6B7280")

def generate_parent_summary_pdf(data: dict) -> bytes:
    """
    Generate a 4-page parent-friendly loan summary PDF.
    data dict keys: student_name, target_university, program, total_cost_usd,
                    loan_amount_inr, monthly_emi, salary_low_lpa, salary_high_lpa,
                    tenure_months, risk_label
    Returns PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Page 1: Header + Program Overview
    story.append(Paragraph("GradRight — Parent Summary", ParagraphStyle(
        "header", fontSize=22, textColor=BRAND_INDIGO, spaceAfter=8, fontName="Helvetica-Bold"
    )))
    story.append(Paragraph("A plain-language overview of your child's education finance plan.", ParagraphStyle(
        "sub", fontSize=12, textColor=TEXT_GRAY, spaceAfter=20
    )))

    story.append(Paragraph("Program Details", ParagraphStyle(
        "section", fontSize=14, textColor=TEXT_DARK, spaceAfter=8, fontName="Helvetica-Bold"
    )))
    program_data = [
        ["Student", data.get("student_name", "—")],
        ["University", data.get("target_university", "—")],
        ["Program", data.get("program", "—")],
        ["Estimated Annual Tuition", f"USD {data.get('total_cost_usd', 0):,.0f}"],
    ]
    table = Table(program_data, colWidths=[5*cm, 12*cm])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GRAY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_LIGHT, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5*cm))

    # Page 2: Loan Details
    story.append(Paragraph("Loan Details", ParagraphStyle(
        "section", fontSize=14, textColor=TEXT_DARK, spaceAfter=8, fontName="Helvetica-Bold"
    )))
    loan_data = [
        ["Loan Amount", f"₹{data.get('loan_amount_inr', 0):,.0f}"],
        ["Monthly EMI", f"₹{data.get('monthly_emi', 0):,.0f}"],
        ["Repayment Period", f"{data.get('tenure_months', 120)} months ({data.get('tenure_months', 120) // 12} years)"],
        ["Interest Rate", "11.5% per annum (indicative)"],
    ]
    table2 = Table(loan_data, colWidths=[6*cm, 11*cm])
    table2.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GRAY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_LIGHT, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table2)
    story.append(Spacer(1, 0.5*cm))

    # Salary projection
    story.append(Paragraph("Expected Salary After Graduation", ParagraphStyle(
        "section", fontSize=14, textColor=TEXT_DARK, spaceAfter=8, fontName="Helvetica-Bold"
    )))
    story.append(Paragraph(
        f"Based on placement data for your child's program and target region, "
        f"the expected starting salary range is <b>₹{data.get('salary_low_lpa', 0):.0f} – "
        f"₹{data.get('salary_high_lpa', 0):.0f} LPA</b>. "
        f"At this salary, the monthly EMI would represent approximately "
        f"19–28% of monthly take-home pay — within the manageable range.",
        ParagraphStyle("body", fontSize=11, textColor=TEXT_DARK, leading=16, spaceAfter=12)
    ))

    # Page 3+: FAQ
    faqs = [
        ("What is a moratorium period?",
         "During studies and for 6–12 months after graduation, the student does not need to pay EMIs. "
         "Interest may accumulate during this period depending on the loan terms."),
        ("What happens if placement is delayed?",
         "Reputable NBFCs offer restructuring options for borrowers facing genuine placement delays. "
         "GradRight monitors career progress and can facilitate early communication with the lender."),
        ("Is the loan amount fixed?",
         "No. The final disbursed amount depends on the lender's assessment. The figures here are estimates."),
        ("What documents will you need?",
         "Typically: student's marksheets, admission offer letter, co-borrower income proof (Form 16 or ITR), "
         "PAN card, and Aadhaar. A GradRight counselor will guide you through the checklist."),
        ("Is this an approval of the loan?",
         "No. This document is for informational purposes only. The loan application requires a formal "
         "review by a trained credit officer. No AI system automatically approves or rejects loans."),
    ]

    story.append(Paragraph("Frequently Asked Questions", ParagraphStyle(
        "section", fontSize=14, textColor=TEXT_DARK, spaceAfter=12, fontName="Helvetica-Bold"
    )))
    for q, a in faqs:
        story.append(Paragraph(f"Q: {q}", ParagraphStyle(
            "faq_q", fontSize=11, textColor=BRAND_INDIGO, fontName="Helvetica-Bold", spaceAfter=4
        )))
        story.append(Paragraph(a, ParagraphStyle(
            "faq_a", fontSize=10, textColor=TEXT_DARK, leading=14, spaceAfter=12
        )))

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "For questions, contact GradRight support. This document was generated by GradRight AI "
        "and does not constitute financial advice.",
        ParagraphStyle("footer", fontSize=9, textColor=TEXT_GRAY)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
```
```

---

## CURSOR PROMPT 3.4 — Gamification Service

```
Build the gamification service (XP, streaks, badges).

Create app/services/gamification_service.py:
```python
from datetime import date, timedelta
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.gamification_reward import GamificationReward

logger = logging.getLogger(__name__)

XP_TABLE = {
    "onboarding_complete": 50,
    "profile_academic_complete": 75,
    "predictor_first_run": 40,
    "career_risk_first_view": 60,
    "financing_first_view": 30,
    "loan_tab_opened": 20,
    "document_first_upload": 50,
    "streak_7_days": 100,
    "streak_30_days": 300,
    "referral_signup": 150,
    "loan_application_submitted": 200,
}

BADGE_TABLE = {
    "onboarding_complete": "First Step",
    "profile_academic_complete": "Scholar",
    "predictor_first_run": "Calculated",
    "career_risk_first_view": "Risk-Aware",
    "document_first_upload": "Prepared",
    "streak_7_days": "Consistent",
    "streak_30_days": "Dedicated",
    "referral_signup": "Champion",
    "loan_application_submitted": "Ready",
}

ONE_TIME_ACTIONS = {
    "onboarding_complete", "profile_academic_complete", "predictor_first_run",
    "career_risk_first_view", "document_first_upload", "streak_7_days",
    "streak_30_days", "referral_signup", "loan_application_submitted",
}


async def award_xp(user: User, action: str, db: AsyncSession) -> dict:
    """
    Award XP for an action. Returns dict with xp_earned and badge_unlocked.
    One-time actions are only awarded once per user.
    """
    xp_to_award = XP_TABLE.get(action, 0)
    if xp_to_award == 0:
        return {"xp_earned": 0, "badge_unlocked": None}

    if action in ONE_TIME_ACTIONS:
        existing = await db.execute(
            select(GamificationReward).where(
                GamificationReward.user_id == user.id,
                GamificationReward.action == action,
            )
        )
        if existing.scalar_one_or_none():
            return {"xp_earned": 0, "badge_unlocked": None}

    badge = BADGE_TABLE.get(action)
    reward = GamificationReward(user_id=user.id, action=action, xp_earned=xp_to_award, badge_unlocked=badge)
    db.add(reward)

    user.xp_points += xp_to_award
    await db.commit()

    logger.info(f"[gamification] User {user.id} earned {xp_to_award} XP for {action}")
    return {"xp_earned": xp_to_award, "badge_unlocked": badge}


async def check_and_update_streak(user: User, db: AsyncSession) -> dict:
    """
    Called once per day on dashboard load. Updates streak_days.
    Returns dict with streak_days and any XP awarded for milestone.
    """
    today = date.today()
    xp_awarded = 0
    badge_unlocked = None

    if user.last_active_date is None:
        user.streak_days = 1
    elif user.last_active_date == today:
        return {"streak_days": user.streak_days, "xp_awarded": 0}
    elif user.last_active_date == today - timedelta(days=1):
        user.streak_days += 1
    else:
        user.streak_days = 1

    user.last_active_date = today

    if user.streak_days == 7:
        result = await award_xp(user, "streak_7_days", db)
        xp_awarded = result["xp_earned"]
        badge_unlocked = result["badge_unlocked"]
    elif user.streak_days == 30:
        result = await award_xp(user, "streak_30_days", db)
        xp_awarded = result["xp_earned"]
        badge_unlocked = result["badge_unlocked"]

    await db.commit()
    return {"streak_days": user.streak_days, "xp_awarded": xp_awarded, "badge_unlocked": badge_unlocked}
```
```
