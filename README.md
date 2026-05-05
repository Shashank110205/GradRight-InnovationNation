# GradRight

**AI-powered platform that unifies career intelligence, university planning, and education financing — for students and lenders.**

🔗 **[Live Demo](https://gradright-demo.vercel.app/)** 

---

[![GradRight Demo](https://img.youtube.com/vi/gaIQOBJVQmE/maxresdefault.jpg)](https://youtu.be/gaIQOBJVQmE)

---

## The Problem

Students planning postgrad education juggle a dozen disconnected tools — counselors, comparison sites, loan apps — with no single place that ties career outcomes to university fit to financing readiness.

Lenders face the other side: no early signal on employability, salary trajectory, or repayment risk. They make decisions reactively, not predictively.

---

## What GradRight Does

One platform. Two portals. End-to-end flow.

**For students:** Onboarding → placement & salary scoring → admission shortlists → ROI & loan eligibility → guided loan application

**For lenders (NBFCs):** Structured application queue → candidate risk intelligence → approve / reject / review → portfolio analytics

---

## Core Features

### Student Portal

| Feature | What it does |
|---|---|
| **Risk & Placement Score** | Placement probability at 3 / 6 / 12 months, salary band, risk tier |
| **Admission Predictor** | Safety / match / reach shortlists with AI strategy brief |
| **Financial Readiness** | ROI model, cost planner, scholarship fit, EMI comfort zone |
| **AI Mentor** | Streaming chat grounded in the student's profile and scores |
| **Loan Application** | Multi-step flow with document upload, OCR extraction, and checklist |
| **Timeline Generator** | AI-built application milestones for target intake |

### NBFC Console

| Feature | What it does |
|---|---|
| **Application Queue** | Filtered list of submitted applications with risk signals |
| **Candidate Detail** | Full profile, scores, salary forecast, documents in one view |
| **Decision Workflow** | Approve / reject / manual review with timestamped notes |
| **Portfolio View** | Risk distribution, approval rates, program mix |

---

## Architecture

```
┌──────────────────────────────────────┐
│           Web Application            │
│  Student Portal │ NBFC Supervisor    │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│           Backend API Layer          │
│  Auth · Scoring · Loans · NBFC · AI  │
└──────┬────────────────────┬──────────┘
       │                    │
┌──────▼──────┐    ┌────────▼────────┐
│   Scoring   │    │  Database &     │
│   Engine    │    │  File Storage   │
│  (Python)   │    │  (Supabase)     │
└─────────────┘    └─────────────────┘
```

- **Frontend** — Next.js App Router; student and NBFC portals split by middleware
- **API Layer** — Next.js Route Handlers handle all product logic; auth enforced on every route
- **Scoring Engine** — FastAPI microservice for placement risk, admission probability, and loan eligibility
- **Database** — Postgres via Supabase + Drizzle ORM; Supabase Storage for loan documents
- **AI Layer** — Generative AI for mentor chat, dashboard briefs, summaries, and document checklists

---

## Tech Stack

| | |
|---|---|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Radix UI |
| **Backend** | Next.js Route Handlers, Python FastAPI |
| **Database** | PostgreSQL, Drizzle ORM, Supabase Auth & Storage |
| **AI / OCR** | Generative AI (streaming), Tesseract.js |
| **Deployment** | Vercel |
| **Optional** | Upstash Redis (rate limiting), Resend (email digest) |

---

## Data Flow

```
# Student
Sign Up → Onboarding → Scoring → Dashboard → Explore / Plan / Finance → Apply

# NBFC
Login → Application Queue → Candidate Detail → Decision → Portfolio
```

---

## Why Not Just Use...

| | Covers |
|---|---|
| Study abroad platforms | Discovery only |
| Loan platforms | Financing only |
| Career platforms | Employability only |
| **GradRight** | **All three, connected** |

Career outcomes, admission chances, and loan readiness aren't separate questions — GradRight models them together and surfaces a unified signal for both student and lender.

---

## Local Setup

**Prerequisites:** Node.js + pnpm, Python 3.11+, Supabase project

```bash
# Install
pnpm install

# Run scoring engine
cd risk-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Configure
cp gradright-web/.env.example gradright-web/.env.local
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#           SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, GEMINI_API_KEY
#           RISK_ENGINE_URL=http://localhost:8000

# Push schema + run
pnpm --dir gradright-web db:push
pnpm dev:web          # → localhost:3000
pnpm dev:web:all      # → :3000 (student) + :3001 (NBFC)
```

> Create a Supabase Storage bucket named **`loan-documents`** before testing uploads.

---

## Roadmap

- Real-time job market & salary data ingestion
- Server-side PDF OCR and multi-document validation
- Deeper predictive modeling from placement outcome data
- Post-loan placement monitoring and repayment readiness alerts
- Multi-lender support and white-label configurations
