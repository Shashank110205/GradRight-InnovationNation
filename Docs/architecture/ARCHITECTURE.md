# GradRight — Full System Architecture

## 1. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js 14 Web App          Expo React Native App          │
│  (Student Dashboard)         (iOS + Android)                │
│  (NBFC Console)                                             │
└───────────────────┬────────────────────────┬────────────────┘
                    │ HTTPS                  │ HTTPS
┌───────────────────▼────────────────────────▼────────────────┐
│                  NEXT.JS API LAYER (App Router)              │
│  /api/ai/*   /api/loan/*   /api/user/*   /api/nbfc/*        │
│  Rate-limited via Upstash Redis                             │
└──────┬──────────┬───────────────┬──────────────┬────────────┘
       │          │               │              │
┌──────▼──┐  ┌────▼─────┐  ┌─────▼──────┐  ┌───▼────────────┐
│ Claude  │  │ Supabase │  │   Risk     │  │  AWS Textract  │
│ API     │  │ Postgres │  │  Engine    │  │  (OCR)         │
│ (LLM)   │  │ + Auth   │  │ FastAPI    │  │                │
│         │  │ + Storage│  │ (Python)   │  │                │
└─────────┘  └──────────┘  └────────────┘  └────────────────┘
                                │
                         ┌──────▼──────┐
                         │   Resend    │
                         │  (Email)    │
                         └─────────────┘
```

---

## 2. Technology Stack — Complete and Final

### Frontend (Web)
| Concern | Technology | Version | Reason |
|---|---|---|---|
| Framework | Next.js | 14.2+ | App Router, RSC, streaming, ISR |
| Language | TypeScript | 5.4+ | Type safety across entire codebase |
| Styling | Tailwind CSS | 3.4+ | Utility-first, consistent design tokens |
| UI Components | shadcn/ui | latest | Accessible, unstyled base, full control |
| State (global) | Zustand | 4.5+ | Simple, TypeScript-native global state |
| State (server) | TanStack Query | 5.x | Cache, refetch, loading states for APIs |
| Forms | React Hook Form + Zod | 7.x + 3.x | Validated, performant, type-safe forms |
| Charts | Recharts | 2.x | React-native charts, composable |
| Animation | Framer Motion | 11.x | Page transitions + micro-interactions |
| AI Streaming | Vercel AI SDK | 3.x | Streams Claude responses to client |
| Icons | Lucide React | latest | Consistent icon set |
| Date utils | date-fns | 3.x | Tree-shakeable, no mutations |
| PDF Export | jsPDF + html2canvas | latest | Parent summary PDF generation |
| HTTP | Axios | 1.x | External API calls with interceptors |

### Frontend (Mobile — React Native)
| Concern | Technology | Version |
|---|---|---|
| Framework | Expo | SDK 51 |
| Routing | Expo Router | v3 |
| Styling | NativeWind (Tailwind for RN) | 4.x |
| State | Zustand (shared with web logic) | 4.5+ |
| Storage | Expo SecureStore (sensitive) + AsyncStorage (non-sensitive) | latest |
| Notifications | Expo Notifications | latest |
| Camera/upload | Expo Document Picker + Image Picker | latest |

### Backend (Next.js API Routes)
| Concern | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| API layer | Next.js App Router Route Handlers |
| Validation | Zod on all inputs |
| Rate limiting | @upstash/ratelimit + @upstash/redis |
| Auth middleware | Supabase SSR Auth helpers |
| Email | Resend SDK |

### Database
| Concern | Technology | Details |
|---|---|---|
| Primary DB | Supabase PostgreSQL | Managed, RLS enabled |
| ORM | Drizzle ORM | Type-safe, migration-first |
| File storage | Supabase Storage | Document uploads (encrypted bucket) |
| Auth | Supabase Auth | Email/OTP + social login |
| Realtime | Supabase Realtime | NBFC console live application updates |
| Caching layer | Upstash Redis | Rate limiting + session cache |

### AI / ML Services
| Service | Technology | Used For |
|---|---|---|
| LLM | Anthropic Claude (claude-sonnet-4-20250514) | Chatbot, explanations, content gen |
| Risk scoring | Python FastAPI microservice | Placement risk engine |
| OCR (MVP) | Tesseract.js (server-side) | Document text extraction in development |
| OCR (production) | AWS Textract | Accurate document parsing at scale |

### Risk Engine Microservice (Python)
| Concern | Technology |
|---|---|
| Framework | FastAPI 0.111+ |
| HTTP server | Uvicorn |
| Data processing | Pandas, NumPy |
| Model (MVP) | Scikit-learn rule-based pipeline |
| Model (v2) | XGBoost / LightGBM |
| Validation | Pydantic v2 |
| Deployment | Docker container, deployed on Railway or Render |

---

## 3. Database Schema (Drizzle — Complete)

```typescript
// lib/db/schema.ts — SINGLE SOURCE OF TRUTH

// ─── USERS ───────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  supabase_uid: text('supabase_uid').unique().notNull(),
  email: text('email').unique().notNull(),
  full_name: text('full_name'),
  phone: text('phone'),
  role: roleEnum('role').default('student').notNull(), // 'student' | 'nbfc_supervisor' | 'admin'
  consent_given: boolean('consent_given').default(false).notNull(),
  consent_timestamp: timestamp('consent_timestamp', { withTimezone: true }),
  onboarding_complete: boolean('onboarding_complete').default(false).notNull(),
  journey_stage: journeyStageEnum('journey_stage').default('discover'),
  xp_points: integer('xp_points').default(0).notNull(),
  streak_days: integer('streak_days').default(0).notNull(),
  last_active_date: date('last_active_date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── STUDENT PROFILES ────────────────────────────────────────
export const student_profiles = pgTable('student_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  // Onboarding answers
  target_country: text('target_country'),           // 'US' | 'UK' | 'Canada' | 'Germany' | 'Australia' | 'domestic'
  target_intake: text('target_intake'),             // 'Fall 2025' | 'Spring 2026' etc
  degree_type: text('degree_type'),                 // 'MS' | 'MBA' | 'MIM' | 'PhD' | 'PG_domestic'
  broad_field: text('broad_field'),                 // 'CS' | 'Engineering' | 'Business' | 'Life Sciences' etc
  current_academic_level: text('current_academic_level'), // '2nd_year_UG' | 'Final_year_UG' | 'Working'
  work_experience_years: integer('work_experience_years').default(0),
  loan_needed: boolean('loan_needed').default(true),
  budget_band_usd: text('budget_band_usd'),         // '<30k' | '30-50k' | '50-80k' | '>80k'
  // Detailed academic profile (filled later)
  institute_name: text('institute_name'),
  institute_tier: text('institute_tier'),           // 'IIT/IIM' | 'NIT/Tier2' | 'Other'
  cgpa: decimal('cgpa', { precision: 4, scale: 2 }),
  cgpa_scale: decimal('cgpa_scale', { precision: 3, scale: 1 }).default('10'),
  internship_count: integer('internship_count').default(0),
  internship_months_total: integer('internship_months_total').default(0),
  certification_count: integer('certification_count').default(0),
  target_universities: jsonb('target_universities').$type<string[]>().default([]),
  gre_score: integer('gre_score'),
  ielts_score: decimal('ielts_score', { precision: 3, scale: 1 }),
  toefl_score: integer('toefl_score'),
  parent_contact_email: text('parent_contact_email'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── RISK SCORES ─────────────────────────────────────────────
export const risk_scores = pgTable('risk_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // Inputs snapshot (frozen at time of calculation)
  input_snapshot: jsonb('input_snapshot').notNull(),
  // Outputs
  placement_prob_3m: decimal('placement_prob_3m', { precision: 5, scale: 2 }),   // e.g. 42.50
  placement_prob_6m: decimal('placement_prob_6m', { precision: 5, scale: 2 }),
  placement_prob_12m: decimal('placement_prob_12m', { precision: 5, scale: 2 }),
  salary_band_low_lpa: decimal('salary_band_low_lpa', { precision: 6, scale: 2 }),
  salary_band_high_lpa: decimal('salary_band_high_lpa', { precision: 6, scale: 2 }),
  risk_label: riskLabelEnum('risk_label').notNull(), // 'low' | 'medium' | 'high'
  risk_score_raw: decimal('risk_score_raw', { precision: 5, scale: 2 }),
  top_drivers: jsonb('top_drivers').$type<RiskDriver[]>().notNull(),
  next_best_actions: jsonb('next_best_actions').$type<NextBestAction[]>().notNull(),
  ai_summary: text('ai_summary'),   // Claude-generated plain language summary
  model_version: text('model_version').default('rule-engine-v1').notNull(),
  calculated_at: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── LOAN APPLICATIONS ───────────────────────────────────────
export const loan_applications = pgTable('loan_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  risk_score_id: uuid('risk_score_id').references(() => risk_scores.id),
  status: loanStatusEnum('status').default('draft').notNull(),
  // 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'manual_review'
  step_completed: integer('step_completed').default(0), // 0–6 steps
  // Personal details
  full_name: text('full_name'),
  dob: date('dob'),
  pan_number: text('pan_number'),  // encrypted
  aadhaar_last4: text('aadhaar_last4'),
  address: text('address'),
  // Academic details
  institute: text('institute'),
  program: text('program'),
  admission_confirmed: boolean('admission_confirmed').default(false),
  offer_letter_url: text('offer_letter_url'), // Supabase Storage URL
  // Financial details
  loan_amount_requested: decimal('loan_amount_requested', { precision: 12, scale: 2 }),
  co_borrower_name: text('co_borrower_name'),
  co_borrower_relation: text('co_borrower_relation'),
  collateral_available: boolean('collateral_available').default(false),
  family_income_annual: decimal('family_income_annual', { precision: 12, scale: 2 }),
  // Documents
  documents: jsonb('documents').$type<DocumentRecord[]>().default([]),
  ocr_extracted_data: jsonb('ocr_extracted_data'),
  // NBFC fields
  nbfc_supervisor_id: uuid('nbfc_supervisor_id'),
  nbfc_notes: text('nbfc_notes'),
  nbfc_decision_at: timestamp('nbfc_decision_at', { withTimezone: true }),
  submitted_at: timestamp('submitted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── USER EVENTS (for growth engine) ─────────────────────────
export const user_events = pgTable('user_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  event_type: text('event_type').notNull(),
  // Events: 'onboarding_complete' | 'predictor_run' | 'financing_viewed' |
  //         'risk_score_generated' | 'loan_tab_opened' | 'document_uploaded' |
  //         'profile_updated' | 'streak_broken' | 'referral_sent' | 'digest_opened'
  event_data: jsonb('event_data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── GAMIFICATION ─────────────────────────────────────────────
export const gamification_rewards = pgTable('gamification_rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(),
  xp_earned: integer('xp_earned').notNull(),
  badge_unlocked: text('badge_unlocked'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── NUDGE LOG ────────────────────────────────────────────────
export const nudge_log = pgTable('nudge_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nudge_type: text('nudge_type').notNull(),
  channel: text('channel').notNull(), // 'email' | 'push' | 'in_app'
  content: text('content'),
  sent_at: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  opened: boolean('opened').default(false),
  clicked: boolean('clicked').default(false),
});
```

---

## 4. API Routes — Complete Map

### Student-Facing APIs

| Route | Method | Auth | Purpose | Key Integrations |
|---|---|---|---|---|
| `/api/user/onboarding` | POST | Student | Submit onboarding answers, create student profile | Supabase, Risk Engine, Claude |
| `/api/user/profile` | GET/PATCH | Student | Read/update student profile | Supabase |
| `/api/ai/chat` | POST | Student | Streaming chatbot response | Claude API (streaming) |
| `/api/ai/risk-score` | POST | Student | Generate/refresh placement risk score | Risk Engine microservice + Claude |
| `/api/ai/admission` | POST | Student | Admission probability for a target program | Risk Engine (admission module) + Claude |
| `/api/ai/timeline` | POST | Student | Generate personalized application timeline | Claude API |
| `/api/ai/digest` | POST | Student/Cron | Generate weekly personalized email digest | Claude API + Resend |
| `/api/loan/application` | GET/POST/PATCH | Student | CRUD for loan application drafts | Supabase |
| `/api/loan/ocr` | POST | Student | Extract text from uploaded document | Tesseract.js / AWS Textract |
| `/api/loan/eligibility` | POST | Student | Non-binding loan eligibility estimate | Risk Engine |
| `/api/loan/parent-summary` | GET | Student | Generate parent-facing PDF summary | jsPDF + Supabase |

### NBFC Console APIs

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/nbfc/applications` | GET | NBFC Supervisor | List all applications with risk scores |
| `/api/nbfc/applications/[id]` | GET | NBFC Supervisor | Single application detail + AI summary |
| `/api/nbfc/applications/[id]/decision` | PATCH | NBFC Supervisor | Approve / Reject / Flag for review |
| `/api/nbfc/portfolio` | GET | NBFC Supervisor | Aggregated cohort risk data for heatmap |
| `/api/nbfc/alerts` | GET | NBFC Supervisor | Post-loan students with deteriorating risk |

---

## 5. Risk Engine Microservice — Architecture

```
POST /score
Body: {
  institute_tier: "IIT/IIM" | "NIT/Tier2" | "Other",
  program_type: "CS" | "Engineering" | "Business" | "Life Sciences" | "Other",
  cgpa_normalized: float,          // 0.0 – 1.0 (CGPA / max scale)
  internship_months: int,          // total internship duration in months
  certification_count: int,
  target_country: str,
  target_sector: str,              // "IT" | "BFSI" | "Healthcare" | "Manufacturing" | "Other"
  work_experience_years: int
}

Response: {
  placement_prob_3m: float,
  placement_prob_6m: float,
  placement_prob_12m: float,
  salary_band_low_lpa: float,
  salary_band_high_lpa: float,
  risk_label: "low" | "medium" | "high",
  risk_score_raw: float,           // 0–100
  top_drivers: [
    { factor: str, direction: "positive" | "negative" | "neutral", weight: float, explanation: str }
  ],
  next_best_actions: [
    { action: str, impact: "high" | "medium", resource_url: str | null }
  ]
}

POST /admission
Body: {
  cgpa_normalized: float,
  gre_score: int | null,
  ielts_score: float | null,
  work_experience_years: int,
  target_program: str,
  target_university_tier: str,    // "Top10" | "Top50" | "Top100" | "Other"
  target_country: str
}

Response: {
  admission_prob: float,           // 0.0 – 1.0
  admit_band: "low" | "medium" | "high",
  safer_alternatives: [str],
  ambitious_alternatives: [str],
  key_factors: [str]
}

POST /eligibility
Body: {
  loan_amount_requested: float,   // INR
  salary_band_low_lpa: float,
  salary_band_high_lpa: float,
  family_income_annual: float,
  collateral_available: bool
}

Response: {
  eligibility_band: "likely" | "moderate" | "unlikely",
  max_recommended_loan: float,    // INR
  comfort_emi_range: { low: float, high: float },  // monthly INR
  income_to_emi_ratio: float      // % of predicted income
}
```

### Risk Engine Scoring Formula (Rule Engine v1)

```python
# scorer.py — rule-based scoring weights

WEIGHTS = {
    'institute_tier': {
        'IIT/IIM': 30,
        'NIT/Tier2': 20,
        'Other': 10
    },
    'cgpa_normalized': 20,          # multiplied by CGPA normalized score
    'internship_months': {
        0: 0,
        1-3: 5,
        4-6: 10,
        7+: 15
    },
    'certification_count': {
        0: 0,
        1: 3,
        2+: 5
    },
    'sector_demand_index': 15,      # from sector_demand.json lookup
    'country_demand_bonus': {
        'US': 5,
        'UK': 3,
        'Germany': 4,
        'Canada': 4,
        'Australia': 3,
        'domestic': 2
    }
}
# Max raw score: 100
# Risk label: 0-40 = high, 41-65 = medium, 66-100 = low
# Salary band: looked up from salary_benchmarks.json by [program_type][institute_tier][country]
# Placement probabilities: sigmoid function applied to raw score per time window
```

---

## 6. Claude API Integration — System Prompts and Usage

### Chatbot Mentor
```
Model: claude-sonnet-4-20250514
Max tokens: 1000
Stream: YES (use Vercel AI SDK streamText)
System prompt: Located at /lib/ai/prompts/mentor.ts
Context injected: user profile summary (target country, program, risk label)
```

### Risk Score Narrator
```
Model: claude-sonnet-4-20250514
Max tokens: 300
Stream: NO
System prompt: Located at /lib/ai/prompts/risk-narrator.ts
Input: risk score data object from risk engine
Output: exactly 3 sentences. Sentence 1: summary. Sentence 2: top negative factor. Sentence 3: most impactful action.
```

### Timeline Generator
```
Model: claude-sonnet-4-20250514
Max tokens: 1500
Stream: NO
System prompt: Located at /lib/ai/prompts/timeline-gen.ts
Input: target_country, program_type, target_intake, current_date, current_semester
Output: structured JSON array of timeline milestones
```

### Admission Explainer
```
Model: claude-sonnet-4-20250514
Max tokens: 400
Stream: NO
System prompt: Located at /lib/ai/prompts/admission-explainer.ts
Input: admission probability result from risk engine
Output: 2 paragraphs. Para 1: why this probability. Para 2: what can change it.
```

### Weekly Digest Generator
```
Model: claude-sonnet-4-20250514
Max tokens: 2000
Stream: NO
System prompt: Located at /lib/ai/prompts/digest.ts
Input: user profile + last 7 days events + current deadline list
Output: structured JSON with 5 items (subject line + 5 content blocks)
Trigger: Cron job via Vercel Cron, every Monday 8:00 AM IST
```

---

## 7. Authentication Flow

```
1. Student signs up → Supabase Auth creates auth.users record
2. Supabase Auth trigger → creates public.users record via DB trigger
3. Student completes onboarding → POST /api/user/onboarding sets onboarding_complete = true
4. All dashboard routes protected by Next.js middleware checking Supabase session
5. NBFC supervisor accounts: Created manually by admin. role = 'nbfc_supervisor' set in users table.
6. NBFC routes: Middleware checks session + role before any route handler runs.

Middleware file: /middleware.ts
Protected patterns: ['/dashboard(.*)', '/nbfc(.*)', '/api/loan(.*)', '/api/ai(.*)', '/api/nbfc(.*)']
Public patterns: ['/', '/login', '/signup', '/api/auth(.*)']
```

---

## 8. Document Upload + OCR Flow

```
1. Student selects file (PDF/JPG/PNG, max 10MB)
2. Client validates file type and size
3. Client uploads directly to Supabase Storage (private bucket: 'loan-documents')
4. Supabase returns storage path
5. Client calls POST /api/loan/ocr with { storage_path, document_type }
6. API route downloads file from Supabase Storage using service role key
7. API route runs Tesseract.js (MVP) on the file
8. Extracted text is sent to a simple field parser (regex + Claude for ambiguous fields)
9. Structured extracted data returned to client
10. Client pre-fills loan application form fields
11. User reviews + confirms auto-filled fields
12. Storage path + extraction result saved to loan_applications.documents JSONB field
```

---

## 9. Gamification System

### XP Taxonomy (exact values — do not change without updating gamification_rewards schema)

| Action | XP Earned | Badge Unlocked |
|---|---|---|
| onboarding_complete | 50 | "First Step" |
| profile_academic_complete | 75 | "Scholar" |
| predictor_first_run | 40 | "Calculated" |
| career_risk_first_view | 60 | "Risk-Aware" |
| financing_first_view | 30 | — |
| loan_tab_opened | 20 | — |
| document_first_upload | 50 | "Prepared" |
| streak_7_days | 100 | "Consistent" |
| streak_30_days | 300 | "Dedicated" |
| referral_signup | 150 | "Champion" |
| loan_application_submitted | 200 | "Ready" |

### Streak Logic
- Streak increments when `last_active_date` changes to a new calendar day (IST timezone).
- Streak resets to 0 if more than 1 calendar day gap.
- Streak check runs on each dashboard load via `/api/user/streak-check` (debounced, max once per day).

---

## 10. Growth Engine — Nudge Rules (v1)

| Trigger Condition | Wait Time | Channel | Message Type |
|---|---|---|---|
| onboarding_complete AND predictor never run | 24 hours | Email + In-app | "See your admission chances" |
| predictor_run AND financing never viewed | 48 hours | Email | ROI teaser with salary band |
| financing_viewed AND loan never opened | 72 hours | In-app | "Your loan eligibility estimate is ready" |
| streak_broken after day ≥ 5 | Immediate | Push | "Keep your streak — quick 2-min task" |
| profile incomplete (cgpa not set) | 48 hours | In-app | "Update profile for accurate predictions" |
| digest_sent but not opened in 48h | 72 hours | Push | "Your week's GradRight summary is waiting" |

Nudge engine runs as a Vercel Cron job at 9:00 AM IST daily. Reads `user_events` table to evaluate conditions. Logs all sent nudges to `nudge_log` table (prevents duplicate nudges — check `sent_at` within last 7 days before sending).

---

## 11. Deployment Architecture

### Web App
- Platform: Vercel (Next.js native)
- Environment: Production + Preview (per PR)
- Cron jobs: Vercel Cron (digest every Monday, nudge check daily)
- Domain: gradright.com (custom)

### Risk Engine (Python)
- Platform: Railway.app (Docker container)
- Docker: Python 3.11 + FastAPI + Uvicorn
- Health check endpoint: `GET /health`
- Auto-restart on failure

### Database
- Platform: Supabase (managed PostgreSQL)
- Backups: Daily automated (Supabase Pro)
- Connection pooling: PgBouncer (Supabase default)

### File Storage
- Platform: Supabase Storage
- Bucket `loan-documents`: Private, authenticated access only
- Bucket `profile-assets`: Public (profile pictures)

### Redis
- Platform: Upstash (serverless Redis)
- Used for: Rate limiting only in MVP

---

## 12. Security Checklist

- [ ] All API routes validate input with Zod before any processing
- [ ] Supabase RLS policies written for all tables before any client queries
- [ ] NBFC routes check `role = 'nbfc_supervisor'` in middleware AND in route handler
- [ ] No secrets in client-side code (check NEXT_PUBLIC_ prefix carefully)
- [ ] Document storage bucket: private, signed URLs with 1-hour expiry for OCR processing
- [ ] PAN number stored encrypted (pgcrypto) in loan_applications table
- [ ] Consent check: every data-enriching action checks `users.consent_given = true`
- [ ] Rate limiting: 20 requests/minute on `/api/ai/*` routes per user
- [ ] Disclaimer text unchanged on loan application flow (exact text defined in .cursorrules)
