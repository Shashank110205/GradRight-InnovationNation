# GradRight

> **The AI-powered platform that unifies career intelligence, university planning, and education financing — for students and lenders alike.**

---

## 🔗 Live Demo

**[→ Try the Student Portal](https://gradright-demo.vercel.app/)**

---

## 🎥 Demo Video

[![GradRight Demo](https://img.youtube.com/vi/gaIQOBJVQmE/maxresdefault.jpg)](https://youtu.be/gaIQOBJVQmE)

> Click the thumbnail to watch the full walkthrough.

---

## Overview

GradRight is a unified decision-intelligence platform that connects career outcomes, university planning, and education financing into a single system.

For **students**, it replaces the chaos of scattered counselors, comparison sites, and loan apps with a single guided journey — from first exploring a career path to receiving a loan decision.

For **NBFCs and education lenders**, it replaces guesswork with structured, data-backed insights on every applicant: placement likelihood, salary trajectory, repayment confidence, and more.

The result: students make better decisions, faster — and lenders underwrite with clarity instead of uncertainty.

---

## Problem Statement

### The Student Side

Students planning a postgrad degree — domestic or abroad — navigate a completely fragmented ecosystem:

- Career planning happens in isolation from university discovery
- Admission chances are guessed, not calculated
- Scholarship and cost information is scattered and hard to compare
- Loan processes are opaque, intimidating, and disconnected from academic planning
- No single platform connects career outcomes to financing readiness

The result is anxiety, poor decisions, and missed opportunities.

### The Lender Side

Traditional education lenders lack early intelligence on the candidates they're evaluating:

- No visibility into employability or placement probability at application time
- Salary and repayment outcomes aren't forecasted — they're hoped for
- Lead quality is assessed manually, inconsistently, and too late
- Portfolio risk accumulates without early warning signals

The result is reactive lending, avoidable delinquency, and missed quality candidates.

---

## Solution

GradRight is a **unified AI-powered decision and financing platform** that addresses both sides simultaneously.

Students move through a structured, personalized journey:

1. **Onboarding** — structured profiling captures academic background, target programs, career goals, and financial situation
2. **Risk & Career Insights** — the platform scores placement probability across 3, 6, and 12-month horizons, forecasts salary bands, and surfaces a risk classification with clear explanations
3. **Admission Intelligence** — generates university lists across safety, match, and reach tiers with admission probability estimates and an AI-generated strategy brief
4. **Financial Readiness** — models ROI, total cost of study, scholarship fit, and loan eligibility; surfaces a comfort-zone EMI range
5. **Loan Application** — a guided multi-step workflow collects documents, runs extraction checks, and submits a structured application
6. **NBFC Decisioning** — submitted applications flow into a lender console with full candidate intelligence, risk signals, and a structured approval/rejection workflow

---

## Core Features

### Student Side

**Onboarding & Profile System**
Structured intake captures academic history, target countries, field of study, work experience, and financial context. Profile data powers all downstream intelligence.

**Risk & Placement Intelligence**
A scoring engine calculates placement probability across three time horizons, forecasts salary bands, assigns a risk tier (low / medium / high), and provides human-readable drivers and recommended actions.

**Admission Predictor**
Based on profile data, the platform estimates admission probability and generates ranked university shortlists across safety, match, and reach bands. Each recommendation includes an AI-generated strategic brief.

**AI Mentor & Guidance**
A conversational AI mentor — grounded in the student's profile, risk score, and goals — answers questions, explains recommendations, and suggests concrete next steps. Responses are streamed in real time.

**Timeline & Planning**
An AI-generated application timeline maps out milestones, deadlines, and preparation tasks tailored to the student's target intake and selected programs.

**Loan Application & Document Handling**
A step-by-step loan application flow saves progress at each stage. Documents are uploaded securely, processed for text extraction, and reviewed against an AI-generated checklist before final submission.

---

### NBFC Side

**Application Review Queue**
A role-gated console lists all submitted applications with filters by status, risk band, program type, and more. Each row surfaces key signals at a glance.

**Candidate Intelligence Panel**
Full application detail view includes the student's academic profile, risk score, placement probability, salary forecast, eligibility estimate, and uploaded documents — everything needed for a structured underwriting review.

**Decision Workflow**
Supervisors record a decision (approved / rejected / manual review) with optional notes. Decisions are timestamped and stored against the application record.

**Portfolio View**
Aggregated portfolio analytics provide a real-time picture of the submitted application book — risk distribution, approval rates, program mix, and candidate quality metrics.

---

## System Architecture

GradRight is built as a modular, three-layer system:

```
┌─────────────────────────────────────────────┐
│              Web Application                │
│   Student Portal  │  NBFC Supervisor Portal │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              Backend API Layer              │
│  Onboarding · Scoring · Admission · Loans   │
│  AI Mentor  · NBFC Console · Documents      │
└──────┬──────────────────────────┬───────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────┐
│  Scoring &  │          │  Database &     │
│  Decision   │          │  Storage Layer  │
│  Engine     │          │  (Auth + DB +   │
│  (Python)   │          │   File Storage) │
└─────────────┘          └─────────────────┘
```

**Web Application**
A Next.js App Router application serving both the student portal and the NBFC supervisor console. Portal access is controlled by session-based authentication and middleware routing.

**Backend API Layer**
All product logic — onboarding, scoring, admission prediction, loan lifecycle, NBFC review — is implemented as structured API endpoints within the web application layer. Authentication is enforced on every route.

**Scoring & Decision Engine**
A dedicated Python microservice exposes three core capabilities: placement risk scoring, admission probability estimation, and loan eligibility calculation. It can be run alongside the web app or deployed independently.

**Database & Storage**
A managed Postgres database stores all application state — user profiles, risk scores, loan applications, and NBFC decisions — accessed via a typed ORM. A separate object storage bucket handles loan document uploads with service-role access controls.

**AI & Automation Layer**
A generative AI layer powers the mentor chat, dashboard briefs, admission summaries, ROI narratives, and document checklists. All AI outputs are grounded in the student's live profile and scoring context.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS, Radix UI |
| **State & Data Fetching** | Zustand, TanStack Query, Zod |
| **Backend API** | Next.js Route Handlers (Node runtime) |
| **Scoring Engine** | Python, FastAPI, Pydantic, Uvicorn |
| **Database** | PostgreSQL via Supabase, Drizzle ORM |
| **Auth & Storage** | Supabase Auth (SSR session cookies), Supabase Storage |
| **AI / Intelligence** | Generative AI (text generation, streaming chat, summaries) |
| **OCR** | Tesseract.js (image-based document extraction) |
| **Deployment** | Vercel |
| **Optional Infra** | Upstash Redis (rate limiting), Resend (email digest) |

---

## Data Flow

### A. Student Journey

```
Sign Up
  └─► Onboarding (goals, academics, finances)
        └─► Scoring Engine (placement probability, salary forecast, risk band)
              └─► Dashboard (AI brief, score reveal, next actions)
                    ├─► Explore (admission predictor, university shortlists)
                    ├─► Plan (timeline generator, prep milestones)
                    ├─► Finance (ROI engine, eligibility estimate, cost planner)
                    └─► Apply (loan application, document upload, submission)
```

### B. NBFC Journey

```
Supervisor Login
  └─► Application Queue (submitted loans, filters, risk signals)
        └─► Candidate Detail (full profile, risk score, salary forecast, docs)
              └─► Decision (approve / reject / manual review + notes)
                    └─► Portfolio View (book-level analytics, risk distribution)
```

---

## What Makes GradRight Different

| Platform Type | What They Solve |
|---|---|
| Study abroad platforms | University discovery only |
| Education loan platforms | Financing only |
| Career platforms | Employability only |
| **GradRight** | **All three — in one connected flow** |

The core insight is that career outcomes, admission probability, and loan readiness are not separate questions — they are deeply interconnected. GradRight is the first platform to model and present them as a unified signal, for both the student and the lender.

---

## Business & User Value

### For Students

- Clarity on which programs genuinely match their profile and career goals
- Honest, data-backed probability estimates — not guesswork
- A realistic picture of cost, ROI, and financing comfort before committing
- A guided loan application with document intelligence built in
- An AI mentor available throughout the entire journey

### For NBFCs

- Consistent, structured risk and employability signals on every applicant
- Early visibility into candidate quality — not just at disbursement
- Faster, more confident underwriting decisions
- Portfolio-level insight into placement risk and repayment readiness
- A cleaner pipeline with fewer surprises post-disbursement

---

## Future Scope

**Richer Market Data Integration**
Real-time ingestion of job market signals, live salary benchmarks, and scholarship databases to keep scoring outputs current and accurate.

**Advanced Document Intelligence**
Full server-side PDF processing, multi-document cross-validation, and structured field extraction to reduce manual review burden on both sides.

**Deeper Predictive Modeling**
Expanded training signals — program-level placement outcomes, cohort comparisons, lender portfolio data — to sharpen placement and repayment predictions over time.

**Post-Loan Career Pact**
A post-disbursement layer that monitors placement progress, surfaces repayment readiness signals, and enables early intervention before loans become at risk.

**Platform Scaling**
Multi-lender support, NBFC-specific scoring configurations, white-label capabilities, and mobile-first student experiences.

---

## Local Development

### Prerequisites

- Node.js + pnpm
- Python 3.11+
- A Supabase project (Auth + Postgres + Storage)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the scoring engine (separate terminal)
cd risk-service
python -m venv .venv && source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Configure environment
cp gradright-web/.env.example gradright-web/.env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL,
#          RISK_ENGINE_URL=http://localhost:8000

# 4. Push database schema
pnpm --dir gradright-web db:push

# 5. Run the web app
pnpm dev:web          # Student portal → http://localhost:3000
pnpm dev:web:all      # Both portals  → :3000 (student) + :3001 (NBFC)
```

> **Storage note:** Create a Supabase Storage bucket named `loan-documents` before testing document upload flows.


---

*Built for the complete student-to-career-to-financing lifecycle.*
