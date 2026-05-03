# GradRight — Build Order + Cursor Prompt Templates
# Use these prompts word-for-word in Cursor to build each feature.
# Follow the sprint order exactly. Do not jump ahead.

---

# SPRINT 1 — ENGAGEMENT CORE (Build days 1–2)
# Goal: Working onboarding → GradRight Score → Dashboard → Chatbot

---

## CURSOR PROMPT 1.1 — Project Scaffold + Config

Paste this into Cursor Chat:

```
Set up the GradRight Next.js project with the following exact configuration. Read the .cursorrules file first and follow every instruction there.

1. Configure next.config.ts as defined in PROJECT_SETUP.md
2. Configure tailwind.config.ts as defined in PROJECT_SETUP.md — include the GradRight brand colors
3. Create middleware.ts at project root as defined in PROJECT_SETUP.md
4. Create app/globals.css with the Inter font loaded via next/font and base Tailwind layers
5. Create the root app/layout.tsx with: TanStack Query provider, Supabase SSR session provider, font class applied to body
6. Create lib/types/index.ts with the complete type definitions from DATA_MODELS.md
7. Run the folder creation script from PROJECT_SETUP.md Step 13
8. Create .env.example with all environment variable names (no values) from PROJECT_SETUP.md Step 5

Do not add any features yet. Only configuration and scaffolding.
```

---

## CURSOR PROMPT 1.2 — Supabase Client + Database

```
Create the Supabase client configuration and Drizzle schema for GradRight. Follow .cursorrules strictly.

1. Create lib/db/supabase.ts with:
   - createClient() for client components (uses NEXT_PUBLIC_ keys)
   - createServerClient() for server components and API routes (uses service role where needed)
   - Both must use @supabase/ssr for proper cookie handling

2. Create lib/db/schema.ts with the complete Drizzle schema from ARCHITECTURE.md Section 3.
   Include all tables: users, student_profiles, risk_scores, loan_applications, user_events, gamification_rewards, nudge_log.
   Include all enums as pgEnum.
   Every table must have id (uuid), created_at, updated_at.

3. Create drizzle.config.ts as defined in PROJECT_SETUP.md Step 7

4. Create lib/db/queries/users.ts with these functions:
   - getUserBySupabaseUID(uid: string): Promise<User | null>
   - updateUserJourneyStage(userId: string, stage: JourneyStage): Promise<void>
   - updateUserXP(userId: string, xpToAdd: number): Promise<number>  // returns new total
   - updateStreakDays(userId: string): Promise<number>  // checks last_active_date, increments or resets

5. Create lib/db/queries/applications.ts with:
   - getLoanApplicationByUserId(userId: string): Promise<LoanApplication | null>
   - upsertLoanApplicationStep(userId: string, stepData: Partial<LoanApplication>): Promise<LoanApplication>
   - submitLoanApplication(applicationId: string): Promise<LoanApplication>
   - getNBFCApplications(filters?: NBFCFilters): Promise<NBFCApplicationListItem[]>
   - updateApplicationDecision(id: string, decision: NBFCDecision): Promise<void>

All functions use Drizzle ORM. No raw SQL. All must handle errors with try/catch.
```

---

## CURSOR PROMPT 1.3 — Authentication Pages

```
Build the authentication pages for GradRight. Follow .cursorrules. Use shadcn/ui components throughout.

1. Create app/(auth)/login/page.tsx:
   - Email + password login form
   - React Hook Form + Zod validation (email format, password min 8 chars)
   - Supabase signInWithPassword on submit
   - Error display using shadcn Alert component
   - Redirect to /dashboard on success
   - Link to /signup
   - Clean, minimal design using GradRight brand colors (indigo primary)

2. Create app/(auth)/signup/page.tsx:
   - Full name + email + password + confirm password
   - React Hook Form + Zod validation
   - Supabase signUp on submit
   - On success: redirect to /onboarding (not dashboard — user must complete onboarding first)
   - Link to /login

3. Create app/(auth)/layout.tsx:
   - Centered card layout with GradRight logo
   - No navigation, no sidebar

Do not add social login. Email/password only for MVP.
```

---

## CURSOR PROMPT 1.4 — Onboarding Flow

```
Build the complete GradRight onboarding flow. This is the highest-priority UX feature. Read .cursorrules and FEATURE_SPECS.md Module 1 carefully before starting.

1. Create stores/onboarding-store.ts with the OnboardingState interface from FEATURE_SPECS.md

2. Create app/(onboarding)/layout.tsx with full-screen centered layout and no navigation

3. Create app/(onboarding)/page.tsx — the onboarding shell page

4. Create components/onboarding/OnboardingShell.tsx:
   - Manages current step with Framer Motion page transitions (slide left/right between steps)
   - Shows OnboardingProgress component at top
   - Renders OnboardingStep for steps 1–7
   - Shows ConsentScreen before final submit
   - On complete: calls submitOnboarding() from store, then shows GradRightScoreScreen

5. Create components/onboarding/OnboardingStep.tsx:
   - Displays the question text (large, prominent)
   - Renders answer options as large clickable buttons (not radio inputs)
   - Selected option gets brand-primary border + background
   - Clicking an option auto-advances to next step after 300ms (Framer Motion delay)
   - Back button navigates to previous step

6. Create components/onboarding/ConsentScreen.tsx:
   - Shows 3 bullet points: what data is collected, how it's used, that AI assists but doesn't auto-approve loans
   - Single checkbox: "I consent to GradRight processing my information as described above"
   - "Get My GradRight Score" CTA button (disabled until checkbox checked)

7. Create app/api/user/onboarding/route.ts (POST):
   - Validate input with Zod
   - Create student_profiles record in Supabase
   - Set users.onboarding_complete = true and consent_given = true
   - Call risk engine (POST to RISK_ENGINE_URL/score) with basic profile data
   - Call Claude to generate risk_one_liner (1 sentence, uses risk-narrator prompt)
   - Return GradRightScore object (see types/index.ts)
   - Award 50 XP (onboarding_complete action)
   - Log user_event: 'onboarding_complete'

8. Create components/onboarding/GradRightScoreScreen.tsx:
   THIS IS THE WOW MOMENT — design it to feel like a personalized reveal:
   - Animated entrance: score components appear one by one with staggered Framer Motion animation
   - Section 1: "Your Top University Matches" — 3 cards with university cluster name + fit % progress bar
   - Section 2: "Your Estimated Salary Range" — large ₹X – ₹Y LPA display with field context
   - Section 3: "Loan Eligibility" — pill badge (Likely / Moderate / Unlikely) with 1-sentence explanation
   - Section 4: Risk note — small text in risk-color (green/amber/red)
   - CTA button: "Explore Your GradRight Dashboard" → navigates to /dashboard
   - If API is still loading: show animated skeleton placeholders, not a spinner
```

---

## CURSOR PROMPT 1.5 — Main Dashboard

```
Build the GradRight main dashboard. Read .cursorrules, FEATURE_SPECS.md Module 2, and DATA_MODELS.md.

1. Create app/(dashboard)/layout.tsx:
   - Left sidebar with navigation links to all modules
   - Header with user name + XP display + streak count
   - Main content area (fills remaining space)
   - Floating ChatbotToggle component (bottom-right)
   - Sidebar collapses to icon-only on smaller screens

2. Create app/(dashboard)/page.tsx (Server Component):
   - Fetch user data + latest risk score + user events server-side using Supabase server client
   - Pass to client components as props
   - Uses app/(dashboard)/loading.tsx for skeleton states

3. Create app/(dashboard)/loading.tsx:
   - Skeleton layout matching the dashboard grid

4. Create components/shared/JourneyBar.tsx:
   - 5-stage horizontal bar: Discover → Plan → Finance → Apply → Succeed
   - Current stage highlighted with brand-primary color
   - Completed stages show checkmark icon
   - Each stage is a clickable link to its module
   - Mobile: horizontal scroll

5. Create components/dashboard/PrimaryCTACard.tsx:
   - Content determined by user.journey_stage (see FEATURE_SPECS.md for exact text per stage)
   - Has an icon, headline, 1-sentence explanation, and CTA button
   - Large card with brand-gradient background

6. Create components/shared/GamificationBar.tsx:
   - XP level label + XP progress bar (shadcn Progress component)
   - Streak count with flame icon (amber color, shows only if streak >= 3)
   - Badge row showing up to 3 unlocked badges
   - Clicking opens a modal with all badges (shadcn Dialog)

7. Create components/dashboard/NewsFeedTile.tsx:
   - Fetches 3 news items (mock data for MVP, use static JSON in /lib/ai/risk-engine/data/mock-news.ts)
   - Each item: source tag + headline + 1-line summary + "Read more" link
   - Server component, revalidate: 21600

8. Create components/dashboard/WeeklyTasksTile.tsx:
   - Shows 3 tasks from user's journey: one overdue (red), one due soon (amber), one upcoming (gray)
   - Determined by comparing timeline milestones to current date
   - Completing a task awards XP and updates journey_steps

9. Create components/shared/ChatbotToggle.tsx:
   - Floating button: bottom-right corner, indigo background, chat bubble icon
   - Opens shadcn Sheet sliding from the right
   - Uses Vercel AI SDK useChat() hook pointing to /api/ai/chat
   - Shows 3 starter prompt buttons when history is empty
   - Message bubbles: user (right, indigo) + AI (left, gray)
   - Input box with send button at bottom
```

---

## CURSOR PROMPT 1.6 — AI Chat API Route

```
Build the streaming AI chat API route for GradRight.

1. Create app/api/ai/chat/route.ts:
   - Method: POST
   - Auth: Requires valid Supabase session (check with server client)
   - Rate limiting: 20 requests per minute per user (use Upstash Redis ratelimit)
   - Input validation: { messages: ChatMessage[], user_id: string } — validate with Zod
   - Fetch user profile from Supabase to build context
   - Call Anthropic SDK using the MENTOR_SYSTEM_PROMPT from AI_PROMPTS.md
   - Stream response using Vercel AI SDK streamText
   - Return as streaming response (not JSON)
   - Error handling: if rate limited, return 429. If auth fails, return 401.

2. Create lib/ai/claude.ts with the streamChatResponse function as defined in FEATURE_SPECS.md

3. Create lib/ai/prompts/mentor.ts with the exact prompt from AI_PROMPTS.md
```

---

# SPRINT 2 — RISK ENGINE + FINANCING (Build days 3–4)
# Goal: Placement risk score → salary band → career-aware EMI

---

## CURSOR PROMPT 2.1 — Risk Engine Python Service

```
Build the Python FastAPI risk scoring microservice. Create all files inside risk-service/ directory.

1. Create risk-service/models.py with Pydantic v2 models:
   - ScoreInput, ScoreOutput, AdmissionInput, AdmissionOutput, EligibilityInput, EligibilityOutput
   - Match exactly the schemas in ARCHITECTURE.md Section 5

2. Create risk-service/scorer.py with the PlacementRiskScorer class from FEATURE_SPECS.md Module 6.
   Include: compute_score(), _placement_prob(), _generate_actions() methods.

3. Create risk-service/data/ with these JSON files:
   sector_demand.json — demand index (0.0-1.0) for each sector × country combination:
   {
     "CS": {"US": 0.92, "UK": 0.78, "Canada": 0.85, "Germany": 0.72, "Australia": 0.68, "domestic": 0.70},
     "Engineering": {"US": 0.75, "UK": 0.65, "Canada": 0.72, "Germany": 0.80, "Australia": 0.62, "domestic": 0.65},
     "Business": {"US": 0.68, "UK": 0.72, "Canada": 0.65, "Germany": 0.58, "Australia": 0.60, "domestic": 0.62},
     "Life Sciences": {"US": 0.65, "UK": 0.60, "Canada": 0.62, "Germany": 0.68, "Australia": 0.58, "domestic": 0.55},
     "Other": {"US": 0.50, "UK": 0.48, "Canada": 0.50, "Germany": 0.52, "Australia": 0.45, "domestic": 0.50}
   }

   salary_benchmarks.json — salary bands (INR LPA) keyed by program_type_tier_country:
   Include at minimum 15 combinations covering CS/Engineering/Business × IIT/NIT/Other × US/UK/domestic

   nirf_data.json — institute tier mapping:
   A lookup of 50 Indian institute names to their tier category

4. Create risk-service/main.py with FastAPI app:
   - GET /health → {"status": "ok", "version": "rule-engine-v1"}
   - POST /score → calls PlacementRiskScorer.compute_score()
   - POST /admission → admission probability logic
   - POST /eligibility → loan eligibility estimation
   - CORS enabled for localhost:3000 and production domain
   - All endpoints validate input with Pydantic, return structured JSON

5. Create risk-service/requirements.txt

Use uvicorn for the server. Add a Dockerfile for deployment.
```

---

## CURSOR PROMPT 2.2 — Risk Score API + Module

```
Build the Career ROI + Placement Risk Engine module (M6). Read FEATURE_SPECS.md Module 6 and .cursorrules.

1. Create app/api/ai/risk-score/route.ts:
   - POST with input from student profile
   - Validate with Zod using RiskScoreInputSchema
   - Call risk engine microservice at RISK_ENGINE_URL/score
   - Call Claude to generate ai_summary (risk-narrator prompt, 3 sentences)
   - Save to risk_scores table via Drizzle
   - Log user_event: 'risk_score_generated'
   - Award XP: 60 points if first risk score ever
   - Return full RiskScore object

2. Create components/career/RiskScoreDisplay.tsx — main card
3. Create components/career/PlacementProbabilityChart.tsx — Recharts BarChart, 3/6/12 months
4. Create components/career/SalaryBandDisplay.tsx — visual range bar
5. Create components/career/RiskDriversList.tsx — 3 driver cards with direction icon
6. Create components/career/NextBestActionsList.tsx — 3 action cards
7. Create components/career/EMIComfortZone.tsx — links salary to loan EMI using calculateEMIComfortZone from lib/utils/calculations.ts

8. Create lib/utils/calculations.ts with:
   - calculateEMIComfortZone() — exact formula from FEATURE_SPECS.md Module 6
   - calculateROI(totalCostUSD, salaryLPA, exchangeRate) → { payback_years: number }
   - formatSalaryBand(low: number, high: number) → "₹48 – 64 LPA"
   - formatLoanAmount(amount: number) → "₹24,50,000"

9. Create app/(dashboard)/career/page.tsx:
   - Checks if risk score exists for user (server-side query)
   - If no score: shows a "Generate Your Risk Score" form (collects CGPA, internship info if not in profile)
   - If score exists: renders RiskScoreDisplay + all sub-components
   - Shows "Recalculate" button if profile was updated more than 30 days ago
```

---

## CURSOR PROMPT 2.3 — Financing Hub

```
Build the Financing Hub module (M7). Read FEATURE_SPECS.md Module 7.

1. Create app/(dashboard)/financing/page.tsx — server component, fetches risk score + loan eligibility

2. Create app/api/loan/eligibility/route.ts:
   - POST with family_income, collateral_available, co_borrower_type, loan_amount_requested
   - Calls risk engine /eligibility endpoint
   - Returns LoanEligibilityEstimate

3. Create components/financing/LoanEligibilityEstimator.tsx — input form + result display
4. Create components/financing/CareerAwareEMICalculator.tsx:
   - Loan amount slider (₹5L to ₹80L, steps of ₹1L)
   - Tenure selector (84 / 120 / 144 months)
   - Real-time EMI calculation using calculateEMIComfortZone
   - Color-coded comfort indicator (green/amber/red)
   - Prominently shows "At your predicted salary, this EMI = X% of take-home"

5. Create components/financing/FinancialLiteracyAccordion.tsx:
   - 5 sections using shadcn Accordion
   - Static content — hardcode the text (plain language, no jargon)
   - Sections: How education loans work | Section 80E | Moratorium period | Collateral vs clean loans | How to compare offers

6. Create components/financing/ParentSummaryExport.tsx:
   - "Share with Parents (PDF)" button
   - Calls lib/utils/pdf-export.ts generateParentSummaryPDF()
   - On success: triggers download

7. Create lib/utils/pdf-export.ts:
   - Uses jsPDF
   - 4-page PDF as described in FEATURE_SPECS.md Module 7
   - Page 1: Target program + cost breakdown
   - Page 2: Loan + EMI + salary projection
   - Page 3: Simple repayment chart
   - Page 4: 5 FAQ for parents (hardcoded text)
```

---

# SPRINT 3 — LOAN FLOW + NBFC CONSOLE (Build days 5–6)

---

## CURSOR PROMPT 3.1 — Loan Application Flow

```
Build the 7-step loan application flow (M8). Read FEATURE_SPECS.md Module 8 carefully.

1. Create stores/application-store.ts:
   - Tracks current step (0–6), all form data per step, validation errors
   - saveStep() function: calls PATCH /api/loan/application after each step completion
   - submitApplication() function: calls POST /api/loan/application/submit

2. Create app/(dashboard)/loan/page.tsx:
   - Loads existing draft application on mount (GET /api/loan/application)
   - If exists: resumes from step_completed + 1
   - If not: starts from step 0 (document checklist)

3. Create the 7 step components in components/loan/:
   - DocumentChecklist.tsx (Step 0): calls /api/ai/timeline for personalized doc list
   - PersonalDetailsForm.tsx (Step 1)
   - AcademicDetailsForm.tsx (Step 2) — includes offer letter upload
   - ProgramDetailsForm.tsx (Step 3)
   - FinancialDetailsForm.tsx (Step 4)
   - DocumentUploadStep.tsx (Step 5) — uses OCR auto-fill
   - ReviewStep.tsx (Step 6) — summary of all data with edit links
   - SubmitStep.tsx (Step 7) — disclaimer + consent + submit button

4. Create app/api/loan/application/route.ts:
   - GET: fetch draft application for current user
   - POST: create new draft application
   - PATCH: update step data, set step_completed

5. Create app/api/loan/ocr/route.ts as defined in FEATURE_SPECS.md Module 8 OCR Flow

6. Add disclaimer text to SubmitStep.tsx — use EXACT text from .cursorrules Module 8 section. Do not rephrase.

7. Create components/loan/LoanProgressBar.tsx — shows "Step X of 7" with visual bar
```

---

## CURSOR PROMPT 3.2 — NBFC Supervisor Console

```
Build the complete NBFC Supervisor Console. Read FEATURE_SPECS.md NBFC section and ARCHITECTURE.md.

1. Create app/(nbfc)/layout.tsx:
   - Different from student dashboard layout
   - Slate/gray color scheme (NOT indigo)
   - Header: "GradRight NBFC Portal" + supervisor name + logout
   - Left sidebar with: Applications | Portfolio | Settings

2. Create app/(nbfc)/applications/page.tsx (server component):
   - Calls GET /api/nbfc/applications
   - Renders ApplicationsTable with all columns from FEATURE_SPECS.md
   - Includes filter controls (Risk Level, Status, Country, Program)
   - Supabase Realtime subscription for new application notifications

3. Create app/(nbfc)/applications/[id]/page.tsx:
   - Full application detail view as defined in FEATURE_SPECS.md
   - Shows: RiskScoreDisplay (reuse from career module) + PlacementProbabilityChart + StudentProfileSummary + DocumentList + DecisionActions

4. Create components/nbfc/DecisionActions.tsx:
   - Three buttons: Approve (green), Reject (red), Flag for Manual Review (amber)
   - Each opens a confirmation dialog (shadcn Dialog)
   - Optional notes textarea in dialog
   - Calls PATCH /api/nbfc/applications/[id]/decision

5. Create app/api/nbfc/applications/route.ts (GET):
   - Auth: requires nbfc_supervisor role (double-check in route handler)
   - Joins loan_applications + risk_scores + users
   - Applies filters from query params
   - Returns NBFCApplicationListItem[]

6. Create app/api/nbfc/applications/[id]/decision/route.ts (PATCH):
   - Auth: requires nbfc_supervisor role
   - Validates decision enum
   - Updates application status + supervisor fields
   - Logs to user_events for audit trail

7. Create app/(nbfc)/portfolio/page.tsx:
   - Fetches portfolio aggregation from /api/nbfc/portfolio
   - Shows: 4 stat cards (total, pending, approval rate, risk distribution)
   - Renders CohortRiskHeatmap component

8. Create components/nbfc/CohortRiskHeatmap.tsx:
   - Recharts ScatterChart configured as a heatmap
   - X-axis: program types, Y-axis: institute tiers
   - Cell color: green (score 66+) → amber (41-65) → red (0-40)
   - Tooltip: count + avg score + avg placement prob
```

---

# POST-SPRINT — GROWTH ENGINE

## CURSOR PROMPT 4.1 — Gamification System

```
Implement the gamification system. Read ARCHITECTURE.md Section 9 (XP Taxonomy).

1. Create app/api/user/award-xp/route.ts (POST):
   - Input: { action: GamificationAction }
   - Check if this action has already been awarded (for one-time actions) using gamification_rewards query
   - If valid: insert into gamification_rewards, update users.xp_points
   - Check if new XP total crosses a streak threshold (7-day, 30-day badges)
   - Return: { new_xp_total, badge_unlocked }

2. Create hooks/useAwardXP.ts:
   - React Query mutation hook wrapping /api/user/award-xp
   - Called from module page components on first visit / key actions

3. Create app/api/user/streak-check/route.ts (POST):
   - Checks users.last_active_date
   - If last_active_date is yesterday: increment streak_days, update last_active_date to today
   - If last_active_date is today: do nothing (already counted)
   - If last_active_date is 2+ days ago: reset streak_days to 1, update last_active_date
   - Award 100 XP + "Consistent" badge if streak_days reaches 7 (only once per streak)
   - Return: { streak_days, xp_awarded }
   - Call this from dashboard layout on load (debounced, max once per day via cookie check)
```

---

## CURSOR PROMPT 4.2 — Weekly Digest Email

```
Build the AI-powered weekly digest email system.

1. Create app/api/ai/digest/route.ts (POST):
   - Called by Vercel Cron (also callable manually for testing)
   - Fetches all users with onboarding_complete = true who are not post-loan
   - For each user (in batches of 10):
     - Build DigestContext: profile + last 7 days events + upcoming timeline milestones
     - Call Claude with WEEKLY_DIGEST_PROMPT from AI_PROMPTS.md
     - Parse JSON response
     - Send email via Resend SDK
     - Log to nudge_log table
   - Max 5 seconds processing per user (timeout + skip if over)

2. Create lib/ai/prompts/digest.ts with exact prompt from AI_PROMPTS.md

3. Email template: plain HTML email (not a component — just a string template)
   - GradRight header (simple)
   - Subject from digest.subject_line
   - 5 content blocks from digest.items
   - Unsubscribe link at bottom (Resend handles this)

4. Create vercel.json with cron config:
   {
     "crons": [{
       "path": "/api/ai/digest",
       "schedule": "0 2 * * 1"   // Every Monday at 2:30 UTC = 8:00 AM IST
     }]
   }
```

---

# DATA FILES TO CREATE (required before risk engine works)

## CURSOR PROMPT 5.1 — Seed Data

```
Create the static data files required by the risk engine.

1. Create risk-service/data/salary_benchmarks.json with salary bands (INR LPA) for these combinations:
   Keys formatted as "PROGRAM_TIER_COUNTRY", e.g. "CS_IIT/IIM_US"
   Minimum required entries:
   CS × {IIT/IIM, NIT/Tier2, Other} × {US, UK, domestic} = 9 entries
   Engineering × {IIT/IIM, NIT/Tier2, Other} × {US, UK, domestic} = 9 entries
   Business × {IIT/IIM, NIT/Tier2, Other} × {US, UK, domestic} = 9 entries
   Each entry: { "low": number_lpa, "high": number_lpa }
   Use realistic 2025 salary benchmarks. Research typical graduate salaries.

2. Create risk-service/data/nirf_data.json with 60 Indian institute names mapped to tier:
   { "institute_name": "tier" } where tier is "IIT/IIM" | "NIT/Tier2" | "Other"
   Include all IITs, all IIMs, all NITs, and major private universities.

3. Create lib/ai/risk-engine/data/university-tiers.ts with 150 global university names mapped to tier:
   { "university_name": "Top10" | "Top50" | "Top100" | "Other" }
   Cover: US (top 100), UK (top 30), Canada (top 20), Germany (top 15), Australia (top 15)

4. Create lib/ai/risk-engine/data/requirements.ts with entry requirements:
   For each of: US/UK/Canada/Germany/Australia × MS/MBA/MiM
   Fields: typical_cgpa_min, typical_cgpa_avg, gre_required (bool), gmat_required (bool),
           ielts_min, toefl_min, work_exp_required (bool), work_exp_preferred_years,
           sop_required (bool), lor_count, application_cost_usd
```
