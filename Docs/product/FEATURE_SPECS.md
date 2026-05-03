# GradRight — Feature Implementation Specs
# Module-by-module: what to build, how to build it, what APIs to call, what components to create.
# This document is the implementation contract. Do not deviate.

---

# MODULE 1 — Smart Onboarding (M1)

## Purpose
Collect minimum viable student profile in under 2 minutes. Generate instant GradRight Score. Create personalized dashboard state.

## Files to Create

### Store
```typescript
// stores/onboarding-store.ts
interface OnboardingState {
  currentStep: number;           // 0–7
  answers: OnboardingAnswers;
  gradRightScore: GradRightScore | null;
  isLoading: boolean;
  error: string | null;
  setAnswer: (key: keyof OnboardingAnswers, value: string | boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitOnboarding: () => Promise<void>;
}
```

### Questions (exact order and options — do not change)
```typescript
// lib/types/index.ts
export const ONBOARDING_QUESTIONS = [
  {
    step: 1,
    key: 'target_country',
    question: "Where are you planning to study?",
    options: ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'India (Domestic)']
  },
  {
    step: 2,
    key: 'degree_type',
    question: "What degree are you aiming for?",
    options: ['Masters (MS/MSc)', 'MBA', 'MiM / Masters in Management', 'PhD', 'PG Diploma']
  },
  {
    step: 3,
    key: 'broad_field',
    question: "What is your target field?",
    options: ['Computer Science / IT', 'Engineering', 'Business / Finance', 'Life Sciences / Healthcare', 'Arts / Design / Social Sciences', 'Other']
  },
  {
    step: 4,
    key: 'target_intake',
    question: "When are you planning to start?",
    options: ['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027', 'Still exploring']
  },
  {
    step: 5,
    key: 'current_academic_level',
    question: "Where are you right now?",
    options: ['2nd year undergraduate', 'Final year undergraduate', 'Recently graduated', 'Working professional (1-3 yrs)', 'Working professional (3+ yrs)']
  },
  {
    step: 6,
    key: 'budget_band_usd',
    question: "What is your approximate annual budget for tuition?",
    options: ['Under $30,000', '$30,000 – $50,000', '$50,000 – $80,000', 'Above $80,000', 'Not sure yet']
  },
  {
    step: 7,
    key: 'loan_needed',
    question: "Are you planning to take an education loan?",
    options: ['Yes, definitely', 'Yes, probably', 'Maybe', 'No, I have other funding']
  },
] as const;
```

### API Route
```typescript
// app/api/user/onboarding/route.ts
// POST: receives OnboardingAnswers, creates student_profiles record,
// calls risk engine for initial score, calls Claude for 3 quick recommendations,
// returns GradRightScore object
// Must complete in under 3 seconds — use Promise.all for parallel calls
```

### GradRight Score Screen (THE WOW MOMENT — highest priority component)
```typescript
// components/onboarding/GradRightScoreScreen.tsx
// Shows AFTER last onboarding question, BEFORE dashboard redirect
// Displays:
// 1. Animated score reveal (Framer Motion)
// 2. Top 3 university cluster matches (with fit % bars)
// 3. Estimated salary range for their profile
// 4. Estimated loan eligibility band (non-binding)
// 5. One-line risk note ("Your profile shows Medium placement risk — here's why")
// 6. CTA button: "Explore Your Dashboard"
// This screen must feel like a personalized reveal, not a loading page
```

### Components to create in /components/onboarding/
- `OnboardingShell.tsx` — full-screen layout with progress bar
- `OnboardingStep.tsx` — renders a single question with animated button options
- `OnboardingProgress.tsx` — step progress indicator (circles + connector line)
- `GradRightScoreScreen.tsx` — THE WOW SCREEN (highest priority)
- `ConsentScreen.tsx` — GDPR/DPDP consent before final submit

---

# MODULE 2 — Personalized Dashboard (M2)

## Purpose
Central hub. Journey progress. Primary next action. Quick insights. AI chatbot access.

## Key Components

### JourneyBar (mandatory, top of dashboard)
```typescript
// components/shared/JourneyBar.tsx
// Horizontal progress bar showing 5 stages:
// Discover → Plan → Finance → Apply → Succeed
// Current stage highlighted. Completed stages show checkmark.
// Clicking a stage navigates to that module.
// Stage is determined by user.journey_stage from Supabase
```

### Primary CTA Card
```typescript
// components/dashboard/PrimaryCTACard.tsx
// Content determined by journey_stage:
// 'discover'  → "Complete your academic profile for better predictions"
// 'plan'      → "Run your Admission Predictor for your target universities"
// 'finance'   → "See your career-aware EMI calculation"
// 'apply'     → "Start your loan application — you're ready"
// 'succeed'   → "Log a career milestone — update your risk score"
```

### Dashboard Layout (Server Component)
```typescript
// app/(dashboard)/page.tsx
// Server component — fetches user data, risk score, events server-side
// Passes data to client components as props
// Uses loading.tsx for skeleton states
// Grid layout:
// Row 1: JourneyBar (full width)
// Row 2: PrimaryCTACard (2/3 width) + GamificationBar (1/3 width)
// Row 3: QuickInsightTile + NewsFeedTile + WeeklyTasksTile (each 1/3 width)
// Row 4: Module navigation buttons
```

### AI Chatbot (Floating)
```typescript
// components/shared/ChatbotToggle.tsx
// Floating button bottom-right corner
// Opens as a slide-up sheet (shadcn Sheet component)
// Uses Vercel AI SDK useChat() hook
// API: /api/ai/chat (streaming)
// System prompt: mentor prompt with user profile injected
// Message history: localStorage, max 50 messages
// Starter prompts shown when chat is empty:
// "What GRE score do I need for my target program?"
// "How does the visa process work for the US?"
// "Explain Section 80E tax benefit for education loans"
```

### Gamification Bar
```typescript
// components/shared/GamificationBar.tsx
// Shows: XP level + XP bar to next level + current streak + earned badges (max 3 shown)
// XP levels: 0-100 = Explorer, 101-300 = Researcher, 301-600 = Planner, 601+ = GradReady
// Streak shows fire emoji if streak >= 3 days
// Clicking badges shows a full badge gallery modal
```

### News Feed Tile
```typescript
// components/dashboard/NewsFeedTile.tsx
// Server component — content fetched via ISR (revalidate: 21600 = 6 hours)
// News is pre-processed server-side: RSS feeds filtered by user.target_country + broad_field
// Shows 3 news cards: headline + source + 1-line summary (Claude-generated) + link
// Sources to pull from:
//   - Study abroad: TheGradCafe RSS, IELTSLIZ RSS, official .edu news
//   - Indian education finance: MoneyControl Education RSS, ET Education RSS
//   - Job market: LinkedIn Economic Graph (public data)
```

---

# MODULE 3 — Your Journey Hub (M3)

## Purpose
Step-by-step process map for the student's target path. LLM-powered explanations. XP for completion.

## How to Build It

### Data Model
```typescript
// lib/types/index.ts
interface JourneyStep {
  id: string;
  stage: 'test_prep' | 'shortlisting' | 'applications' | 'admits' | 'visa' | 'loan' | 'pre_departure' | 'career';
  title: string;
  description: string;
  estimated_timeframe: string;         // e.g. "6–8 months before intake"
  is_completed: boolean;
  xp_reward: number;
  sub_tasks: JourneySubTask[];
  linked_module?: string;              // Which GradRight module to navigate to for this step
}
```

### Journey Step Content
Do NOT hardcode journey text in components. All journey content is stored in:
`/lib/ai/risk-engine/data/journey-content.ts` as a static array keyed by `[target_country][degree_type]`.

### LLM Personalization
Each step has a "Tell me more" button. Clicking it calls `/api/ai/timeline` with the step ID + user profile. Claude rewrites the step explanation in plain language tailored to the student. Response streamed and displayed inline. Cached in localStorage for 24 hours (key: `journey_step_${step_id}_${user_id}`).

### Components to create in /components/journey/
- `JourneyStepCard.tsx` — single step card with expand/collapse
- `JourneyProgressMap.tsx` — full visual step map
- `JourneyStepDetail.tsx` — expanded view with LLM explanation
- `StepCompletionButton.tsx` — marks step complete, triggers XP award

---

# MODULE 4 — Requirements + Timeline Intelligence (M4)

## Purpose
Entry requirements for target country + program. Auto-generated application timeline.

## Implementation

### Requirements Data
Store requirements as structured JSON in `/lib/ai/risk-engine/data/requirements.ts`:
```typescript
// Keyed by country → degree_type → broad_field
// Contains: CGPA bands, required tests (GRE/GMAT/IELTS/TOEFL), work experience requirements,
//           SOP required (Y/N), LOR count, average application cost
```

### Timeline Generator
```typescript
// /api/ai/timeline endpoint
// Input: target_country, degree_type, target_intake (e.g. 'Fall 2026'), current_date
// Claude generates a structured JSON array:
[
  { month_offset: -12, milestone: "Begin GRE/GMAT preparation", category: "test_prep" },
  { month_offset: -9,  milestone: "Finalize university shortlist", category: "shortlisting" },
  // ... etc
]
// Rendered as a visual horizontal timeline (Recharts or custom SVG)
// Each milestone has a status: 'upcoming' | 'due_soon' | 'overdue' | 'completed'
// 'due_soon' = within 30 days. 'overdue' = past date + not marked complete.
```

### Trust Design (mandatory)
Every requirement shown must have a source tag:
```tsx
<span className="text-xs text-muted-foreground">
  Source: Official university data / common platforms — verify before applying
</span>
```
Never show a requirement without this disclaimer. This is a trust and legal protection measure.

### Components to create in /components/requirements/
- `RequirementsCard.tsx` — shows requirements for one country/program combination
- `TimelineView.tsx` — horizontal scrollable timeline
- `TimelineMilestone.tsx` — individual milestone with status indicator
- `DeadlineAlertBanner.tsx` — shown on dashboard when a milestone is due within 14 days

---

# MODULE 5 — Admission Predictor (M5)

## Purpose
Predict admission probability for target universities. Show safer + ambitious alternatives. LLM explains the score.

## Implementation

### API Route
```typescript
// /api/ai/admission
// Input: cgpa (0-10 scale), cgpa_scale (4 or 10), gre_score (optional),
//        ielts_score (optional), work_experience_years,
//        target_university_names: string[] (max 5), target_country, degree_type
//
// Process:
// 1. Normalize CGPA to 0–1 scale
// 2. Map target university names to tier (Top10/Top50/Top100/Other) using static lookup
// 3. Call risk-engine /admission endpoint for probability scores
// 4. Call Claude to generate explanation for each university (parallel, Promise.all)
// 5. Return structured result array

// Output: Array of {
//   university: string,
//   tier: string,
//   admission_prob: number,
//   admit_band: 'low' | 'medium' | 'high',
//   explanation: string,       // Claude-generated, 2 sentences
// }
// Plus: safer_alternatives[] and ambitious_alternatives[]
```

### University Tier Lookup
```typescript
// lib/ai/risk-engine/data/university-tiers.ts
// Static lookup table: university name → tier
// Covers top 200 universities for US/UK/Canada/Germany/Australia
// For universities not in the list: default to 'Other' tier
// IMPORTANT: Never return "Not found". Always return a tier with a note: "Based on general rankings"
```

### Save + Re-run Feature
Student can save a set of universities as "My Shortlist" to `student_profiles.target_universities` JSONB field. Re-running the predictor after updating profile shows delta ("Your probability for Georgia Tech increased from 42% to 58% after adding work experience").

### Components to create in /components/predictor/
- `AdmissionPredictorForm.tsx` — inputs for CGPA, scores, university names
- `PredictionResultCard.tsx` — single university result with probability gauge
- `ProbabilityGauge.tsx` — visual semicircle gauge (custom SVG, not a library)
- `UniversityShortlistManager.tsx` — save/manage shortlisted universities
- `AlternativeSuggestions.tsx` — safer + ambitious alternatives grid

---

# MODULE 6 — Career ROI + Placement Risk Engine (M6)

## Purpose
This is the most important module for PS1 scoring. 3/6/12-month placement probabilities. Salary bands. Risk score. Explainability. Next-best actions.

## Implementation — MOST CRITICAL MODULE

### Risk Service (Python FastAPI) — complete implementation

```python
# risk-service/scorer.py

from dataclasses import dataclass
from typing import Literal
import json, os

RiskLabel = Literal["low", "medium", "high"]

@dataclass
class ScoreInput:
    institute_tier: str          # "IIT/IIM" | "NIT/Tier2" | "Other"
    program_type: str            # "CS" | "Engineering" | "Business" | "Life Sciences" | "Other"
    cgpa_normalized: float       # 0.0 – 1.0
    internship_months: int
    certification_count: int
    target_country: str
    target_sector: str
    work_experience_years: int

@dataclass
class RiskDriver:
    factor: str
    direction: str               # "positive" | "negative" | "neutral"
    weight: float
    explanation: str

@dataclass
class NextBestAction:
    action: str
    impact: str                  # "high" | "medium"
    resource_url: str | None

class PlacementRiskScorer:
    def __init__(self):
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        with open(f'{data_dir}/sector_demand.json') as f:
            self.sector_demand = json.load(f)
        with open(f'{data_dir}/salary_benchmarks.json') as f:
            self.salary_benchmarks = json.load(f)
        with open(f'{data_dir}/nirf_data.json') as f:
            self.nirf_data = json.load(f)

    def compute_score(self, inp: ScoreInput) -> dict:
        drivers = []
        total_score = 0.0

        # 1. Institute tier (max 30 pts)
        tier_scores = {"IIT/IIM": 30, "NIT/Tier2": 20, "Other": 10}
        tier_pts = tier_scores.get(inp.institute_tier, 10)
        total_score += tier_pts
        drivers.append(RiskDriver(
            factor="Institute Placement Strength",
            direction="positive" if tier_pts >= 20 else "negative",
            weight=tier_pts / 30,
            explanation=f"Your institute tier ({inp.institute_tier}) has a baseline placement strength of {tier_pts}/30."
        ))

        # 2. CGPA (max 20 pts)
        cgpa_pts = inp.cgpa_normalized * 20
        total_score += cgpa_pts
        cgpa_direction = "positive" if cgpa_normalized >= 0.75 else ("neutral" if cgpa_normalized >= 0.6 else "negative")
        drivers.append(RiskDriver(
            factor="Academic Performance (CGPA)",
            direction=cgpa_direction,
            weight=cgpa_pts / 20,
            explanation=f"Your CGPA contributes {cgpa_pts:.1f}/20 to your placement readiness score."
        ))

        # 3. Internship (max 15 pts)
        if inp.internship_months == 0: intern_pts = 0
        elif inp.internship_months <= 3: intern_pts = 5
        elif inp.internship_months <= 6: intern_pts = 10
        else: intern_pts = 15
        total_score += intern_pts
        drivers.append(RiskDriver(
            factor="Internship Exposure",
            direction="positive" if intern_pts >= 10 else "negative",
            weight=intern_pts / 15,
            explanation=f"{'Strong' if intern_pts >= 10 else 'Limited'} internship history ({inp.internship_months} months) {'builds' if intern_pts >= 10 else 'weakens'} employer confidence."
        ))

        # 4. Certifications (max 5 pts)
        cert_pts = min(inp.certification_count * 2.5, 5)
        total_score += cert_pts
        drivers.append(RiskDriver(
            factor="Skill Certifications",
            direction="positive" if cert_pts >= 3 else "neutral",
            weight=cert_pts / 5,
            explanation=f"You have {inp.certification_count} certifications contributing {cert_pts}/5 pts."
        ))

        # 5. Sector demand (max 15 pts)
        demand_index = self.sector_demand.get(inp.target_sector, {}).get(inp.target_country, 0.5)
        sector_pts = demand_index * 15
        total_score += sector_pts
        drivers.append(RiskDriver(
            factor=f"{inp.target_sector} Sector Demand in {inp.target_country}",
            direction="positive" if demand_index >= 0.65 else ("neutral" if demand_index >= 0.4 else "negative"),
            weight=demand_index,
            explanation=f"Job demand for {inp.target_sector} in {inp.target_country} is rated {demand_index:.0%} of peak demand."
        ))

        # 6. Country bonus (max 5 pts)
        country_bonus = {"US": 5, "UK": 3, "Germany": 4, "Canada": 4, "Australia": 3, "domestic": 2}
        country_pts = country_bonus.get(inp.target_country, 2)
        total_score += country_pts

        # 7. Work experience bonus (max 10 pts)
        work_pts = min(inp.work_experience_years * 3, 10)
        total_score += work_pts

        # Cap at 100
        total_score = min(total_score, 100)

        # Risk label
        if total_score >= 66: risk_label = "low"
        elif total_score >= 41: risk_label = "medium"
        else: risk_label = "high"

        # Placement probabilities (sigmoid approximation)
        p3m = self._placement_prob(total_score, months=3)
        p6m = self._placement_prob(total_score, months=6)
        p12m = self._placement_prob(total_score, months=12)

        # Salary band
        salary_key = f"{inp.program_type}_{inp.institute_tier}_{inp.target_country}"
        salary = self.salary_benchmarks.get(salary_key, {"low": 40, "high": 60})

        # Next best actions
        actions = self._generate_actions(inp, drivers, risk_label)

        # Sort drivers by absolute impact, return top 3
        drivers_sorted = sorted(drivers, key=lambda d: abs(d.weight - 0.5), reverse=True)[:3]

        return {
            "placement_prob_3m": round(p3m, 2),
            "placement_prob_6m": round(p6m, 2),
            "placement_prob_12m": round(p12m, 2),
            "salary_band_low_lpa": salary["low"],
            "salary_band_high_lpa": salary["high"],
            "risk_label": risk_label,
            "risk_score_raw": round(total_score, 2),
            "top_drivers": [vars(d) for d in drivers_sorted],
            "next_best_actions": [vars(a) for a in actions]
        }

    def _placement_prob(self, score: float, months: int) -> float:
        # Sigmoid function scaled per time window
        # 3 months: max ~60% even for high scorers (placement takes time)
        # 6 months: max ~85%
        # 12 months: max ~95%
        import math
        caps = {3: 0.60, 6: 0.85, 12: 0.95}
        floors = {3: 0.05, 6: 0.20, 12: 0.40}
        cap = caps[months]
        floor = floors[months]
        normalized = (score - 50) / 20       # center around 50
        sigmoid = 1 / (1 + math.exp(-normalized))
        return floor + (cap - floor) * sigmoid

    def _generate_actions(self, inp, drivers, risk_label):
        actions = []
        # Low internship → recommend internship platforms
        if inp.internship_months < 4:
            actions.append(NextBestAction(
                action="Complete at least one 3-month internship in your target sector before graduation",
                impact="high",
                resource_url="https://internshala.com"
            ))
        # Low certifications → recommend cert
        if inp.certification_count == 0:
            cert_map = {"CS": "AWS Certified Cloud Practitioner or Google Data Analytics", "Business": "CFA Level 1 or CPA basics", "Engineering": "PMP or Six Sigma Green Belt"}
            cert_rec = cert_map.get(inp.program_type, "a field-relevant certification")
            actions.append(NextBestAction(
                action=f"Earn {cert_rec} to strengthen your profile signal",
                impact="medium",
                resource_url="https://coursera.org"
            ))
        # Weak sector demand
        sector_demand_val = self.sector_demand.get(inp.target_sector, {}).get(inp.target_country, 0.5)
        if sector_demand_val < 0.4:
            actions.append(NextBestAction(
                action=f"Consider targeting adjacent sectors with stronger demand in {inp.target_country}",
                impact="medium",
                resource_url=None
            ))
        return actions[:3]
```

### API Route (Next.js calling risk engine)
```typescript
// app/api/ai/risk-score/route.ts
// 1. Validate input with Zod
// 2. Call Python risk engine: POST ${RISK_ENGINE_URL}/score
// 3. Call Claude with risk-narrator prompt to generate ai_summary
// 4. Save to risk_scores table via Drizzle
// 5. Log user_event: 'risk_score_generated'
// 6. Award XP: 60 points (first time only — check if user has previous risk score)
// 7. Return full risk score object
```

### Components to create in /components/career/
- `RiskScoreDisplay.tsx` — main risk score card with badge + score + summary
- `PlacementProbabilityChart.tsx` — Recharts BarChart showing 3/6/12-month probs
- `SalaryBandDisplay.tsx` — visual salary range bar with market context
- `RiskDriversList.tsx` — 3 driver cards with direction icon + explanation
- `NextBestActionsList.tsx` — 3 action cards with impact badge + resource link
- `EMIComfortZone.tsx` — links salary band to loan EMI (connects M6 to M7)
- `RiskScoreHistory.tsx` — shows how risk score changed over time (after 2+ scores exist)

### EMI Comfort Zone Formula
```typescript
// lib/utils/calculations.ts
export function calculateEMIComfortZone(
  salaryBandLowLPA: number,
  salaryBandHighLPA: number,
  loanAmountINR: number,
  tenureMonths: number = 120,
  interestRateAnnual: number = 0.115  // 11.5% typical NBFC education loan rate
): EMIComfortZone {
  const monthlyRate = interestRateAnnual / 12;
  const emi = (loanAmountINR * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths))
              / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const monthlyIncomeAtLow = (salaryBandLowLPA * 100000) / 12;
  const monthlyIncomeAtHigh = (salaryBandHighLPA * 100000) / 12;

  // Take-home ≈ 78% of CTC after tax + PF (Indian standard)
  const takeHomeLow = monthlyIncomeAtLow * 0.78;
  const takeHomeHigh = monthlyIncomeAtHigh * 0.78;

  const emiPctAtLow = (emi / takeHomeLow) * 100;
  const emiPctAtHigh = (emi / takeHomeHigh) * 100;

  return {
    emi_monthly: Math.round(emi),
    emi_pct_at_low_salary: Math.round(emiPctAtLow),
    emi_pct_at_high_salary: Math.round(emiPctAtHigh),
    comfort_label: emiPctAtHigh <= 25 ? 'comfortable' : emiPctAtHigh <= 40 ? 'moderate' : 'high_stress',
  };
}
```

---

# MODULE 7 — Financing Hub (M7)

## Purpose
Loan eligibility estimation. Career-aware EMI planning. Financial literacy. Parent summary export.

## Components to create in /components/financing/

### LoanEligibilityEstimator
```typescript
// Inputs: family_income_annual, collateral_available, co_borrower_type, target_loan_amount
// API call: /api/loan/eligibility (calls risk engine /eligibility)
// Output: eligibility band + max recommended loan + comfort EMI range
// Show disclaimer: "This is a non-binding estimate. Actual eligibility determined by lender review."
```

### CareerAwareEMICalculator
```typescript
// Takes: loan_amount, tenure_months (default 120), interest_rate (default 11.5%)
// Displays:
//   - Monthly EMI (large, prominent)
//   - "At your predicted salary of ₹X–Y LPA, this EMI is Z% of your take-home"
//   - Color-coded: green (≤25%), amber (26-40%), red (>40%)
//   - Slider for loan amount (updates EMI and % in real-time)
//   - Slider for tenure (84 / 120 / 144 months)
// This is the core trust-building feature of the financing module
```

### FinancialLiteracyAccordion
```typescript
// 5 expandable sections (static content):
// 1. "How education loans work in India" — interest rates, moratorium, disbursement
// 2. "Section 80E tax benefit" — deduction on interest, how to claim
// 3. "Moratorium period explained" — what it means, typical NBFC terms
// 4. "Collateral vs collateral-free loans" — PSL limits, clean loans
// 5. "How to compare NBFC offers" — checklist of what to look for
// Content is plain language, verified, no jargon
```

### ParentSummaryExport
```typescript
// Button: "Share with Parents (PDF)"
// Generates a clean PDF using jsPDF:
//   Page 1: Student's target program + university + estimated total cost
//   Page 2: Loan amount recommended + monthly EMI + salary projection
//   Page 3: Repayment timeline (chart) + risk label + what happens next
//   Page 4: FAQ for parents (5 questions about education loans)
// Language: Simple English. No financial jargon. No risk scores shown to parents.
// This PDF is the primary trust tool for Indian families.
```

---

# MODULE 8 — Loan Application Flow (M8)

## Steps (7 steps total)
0. Document checklist (generated by Claude, personalized)
1. Personal details (name, DOB, PAN, Aadhaar last 4, address)
2. Academic details (institute, program, offer letter upload)
3. Target program details (university, country, intake, total cost)
4. Financial details (family income, co-borrower info, collateral)
5. Document upload (OCR + auto-fill, up to 5 documents)
6. Review (summary of all entered info, edit links per section)
7. Submit (disclaimer + consent checkbox + submit button)

## Save + Resume
After every step completion: PATCH `/api/loan/application` with `{ step_completed: N, ...step_data }`. If user leaves and comes back, they resume from `step_completed + 1`.

## OCR Flow
```typescript
// app/api/loan/ocr/route.ts
// Input: { storage_path: string, document_type: 'marksheet' | 'offer_letter' | 'income_proof' | 'pan' | 'aadhaar' }
// Process:
//   1. Download file from Supabase Storage using service role client
//   2. Run Tesseract.js worker on the file
//   3. Parse extracted text using document-type-specific regex patterns
//   4. For ambiguous fields: send to Claude with extraction prompt
//   5. Return structured extracted fields
//
// Field mappings per document type:
//   marksheet → { student_name, institute, cgpa, graduation_year }
//   offer_letter → { university, program, intake_date, total_fees_usd }
//   income_proof → { annual_income, employer_name, assessment_year }
```

## Disclaimer Text (MUST use exact text — do not rephrase)
```tsx
<p className="text-sm text-muted-foreground border border-border rounded-md p-3 mt-4">
  Your application will be reviewed by a trained credit officer from our lending partner.
  This is not an automated loan approval. Your data is encrypted and shared only with your
  explicit consent. You can withdraw your application at any time before a decision is made.
</p>
```

---

# NBFC SUPERVISOR CONSOLE

## Access
Route group: `app/(nbfc)/`
Middleware enforces `role = 'nbfc_supervisor'`
Separate layout: `components/layouts/NBFCLayout.tsx` (different header, sidebar, color scheme — use slate/gray tones to differentiate from student dashboard)

## Application List Page
```typescript
// app/(nbfc)/applications/page.tsx
// Server component — fetches all non-draft applications with risk_scores join
// Columns: Applicant Name | Program | Country | Risk Level | Placement Prob (6m) | Salary Band | Submitted At | Status | Actions
// Filters: Risk Level (Low/Medium/High) | Status | Country | Program Type
// Sort: submitted_at DESC by default
// Realtime: Subscribe to Supabase Realtime on loan_applications for new submissions
```

## Application Detail Page
```typescript
// app/(nbfc)/applications/[id]/page.tsx
// Shows:
// 1. Risk Score card (badge + raw score + model version)
// 2. Placement probability bar chart (3/6/12 months)
// 3. Salary band + EMI comfort zone
// 4. Top 3 risk drivers with explanation
// 5. AI summary (3 sentences from Claude risk-narrator)
// 6. Student profile summary (institute, program, CGPA, internship)
// 7. Document list with download links (signed URLs, 1-hour expiry)
// 8. Application timeline (submitted → current status)
// 9. THREE ACTION BUTTONS: Approve | Reject | Flag for Manual Review
```

## Decision Action
```typescript
// app/api/nbfc/applications/[id]/decision/route.ts
// PATCH: { decision: 'approved' | 'rejected' | 'manual_review', notes?: string }
// Validates: user.role === 'nbfc_supervisor' (double-check, not just middleware)
// Updates: loan_applications.status + nbfc_supervisor_id + nbfc_decision_at + nbfc_notes
// Inserts: user_events record for audit trail
// Returns: updated application
```

## Portfolio Heatmap
```typescript
// app/(nbfc)/portfolio/page.tsx
// Recharts heatmap (use ScatterChart + custom cell coloring):
// X-axis: Program type (CS / Engineering / Business / Life Sciences / Other)
// Y-axis: Institute tier (IIT/IIM / NIT/Tier2 / Other)
// Cell: Average risk_score_raw for that cohort. Color: green (high score) → red (low score)
// Hover tooltip: shows count, avg score, avg placement prob 6m
// Also shows: total applications, approval rate, pending applications count
```

---

# SHARED UTILITIES TO BUILD

## lib/ai/claude.ts
```typescript
// Exports these functions (and nothing else):
// streamChatResponse(userMessage: string, systemPrompt: string, userProfile: UserProfileContext): ReadableStream
// generateRiskSummary(riskData: RiskScoreData): Promise<string>
// generateTimelineMilestones(input: TimelineInput): Promise<TimelineMilestone[]>
// generateAdmissionExplanation(admissionResult: AdmissionResult): Promise<string>
// generateWeeklyDigest(userContext: DigestContext): Promise<DigestContent>
// All functions use claude-sonnet-4-20250514. All handle errors with fallback responses.
```

## lib/utils/calculations.ts
```typescript
// Exports: calculateEMIComfortZone, calculateROI, formatSalaryBand, formatLoanAmount
```

## lib/utils/pdf-export.ts
```typescript
// Exports: generateParentSummaryPDF(data: ParentSummaryData): Promise<Blob>
// Uses jsPDF. Returns blob for download or email attachment.
```

## lib/validations/
```typescript
// onboarding.ts — OnboardingAnswersSchema (Zod)
// loan-application.ts — LoanApplicationSchema (Zod, per step)
// user-profile.ts — UserProfileUpdateSchema (Zod)
// risk-score-input.ts — RiskScoreInputSchema (Zod)
```
