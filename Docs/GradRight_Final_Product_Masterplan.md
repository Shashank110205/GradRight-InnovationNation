# GRADRIGHT — FINAL PRODUCT MASTERPLAN
## Product Bible · UX Blueprint · Technical Spec · Cursor Implementation Guide
### Version 1.0 — TenzorX 2026 | Poonawalla Fincorp

---

> **DOCUMENT PURPOSE**
> This is the single source of truth for building GradRight. Every screen, every module, every AI integration, every user flow, and every line of logic is defined here. No ambiguity. No assumptions. Build exactly this.

---

# SECTION 1 — FINAL PRODUCT OVERVIEW

## 1.1 What Is GradRight?

GradRight is an **AI-powered career-aware education finance platform** for Indian students planning postgraduate education — both abroad (US, UK, Canada, Europe, Australia) and at premium domestic institutions (IIMs, ISB, top NITs).

It is **not** a loan comparison site.
It is **not** a study abroad counseling app.
It is **not** a generic chatbot.

GradRight is a **Social Finance Intelligence Platform** that walks a student from "I'm thinking about a master's degree" all the way to "my education loan is approved and I have a job offer" — with AI as the constant companion at every step.

**The two-sided value:**
- **Student side:** Personalized career + finance intelligence, study planning tools, community, and a loan application system that actually helps them
- **NBFC side (Poonawalla):** A real-time career risk intelligence engine that predicts placement probability, salary outcomes, and repayment risk before any loan is disbursed

---

## 1.2 Who Is It For?

**Primary user:** Indian students aged 18–28
- Final-year or penultimate-year undergraduates
- Young professionals (1–4 years work experience) planning a postgraduate degree
- Planning to study at a foreign university OR a top domestic institution

**Secondary user:** Parents / Co-borrowers
- Typically aged 45–60
- The financial decision-maker and co-signatory in Indian education loans
- Need trust, transparency, and simple information

**B2B customer:** Poonawalla Fincorp (NBFC)
- Uses GradRight's risk intelligence engine via Supervisor Console
- Gets structured loan applications, GradScore, placement predictions, and portfolio analytics

---

## 1.3 What Exact Problem Does It Solve?

**For students:**
The study abroad journey is fragmented across 15+ apps, websites, and WhatsApp groups. Students have no single source of truth. They have financial anxiety. They don't understand loan risks. They don't know if their profile will get them hired after graduation. GradRight solves all of this in one place.

**For NBFCs:**
Education loan defaults happen because lenders approve loans without proper visibility into a student's actual career trajectory. A student from a tier-3 institute pursuing an obscure program in a weak job market is high-risk — but current systems can't flag this early enough. GradRight provides a placement risk score at the time of loan application.

---

## 1.4 Why Will Users Use It, Trust It, Return, and Convert?

**Use it:** Because within 3 minutes of signup, they see a personalized GradScore, their top program matches, and a predicted salary range. Immediate, specific, personal value.

**Trust it:** Because every prediction shows its reasoning. Because there are real sources cited. Because AI never claims to make final loan decisions. Because parents can see a simple summary. Because the platform is explicitly on the student's side.

**Return:** Because the GradScore changes as they take actions. Because deadlines trigger smart reminders. Because the community is active. Because streaks and GradPoints create a habit loop.

**Convert:** Because by the time the loan CTA appears, the student has already calculated their ROI, simulated their EMI, understood their risk band, and feels informed and confident. Conversion is the natural next step of an educated journey.

---

## 1.5 Product Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRADRIGHT ECOSYSTEM                       │
├─────────────────────────────┬───────────────────────────────────┤
│       STUDENT PLATFORM      │         NBFC CONSOLE              │
│   (Web App — Next.js)       │    (Supervisor Dashboard)         │
├─────────────────────────────┼───────────────────────────────────┤
│  Landing Page               │  Individual Applicant View        │
│  Onboarding Flow            │  Portfolio Risk Dashboard         │
│  Personalized Dashboard     │  Early Warning Alerts             │
│  13 Feature Modules         │  Intervention Workflow            │
│  AI Mentor (Chatbot)        │  Cohort Analytics                 │
│  Community Feed             │  Document Review Console          │
│  Loan Application Engine    │                                   │
├─────────────────────────────┴───────────────────────────────────┤
│                         AI LAYER                                 │
│  LLM (Claude API) · Rule Engine · Personalization Engine        │
│  OCR · Content Generator · Nudge Engine · Growth Automator      │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                 │
│  PostgreSQL · Redis · User Profiles · Risk Models               │
│  NewsAPI · NIRF Data · Job Market Index · Institute DB           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1.6 Business Funnel (One Line Per Stage)

| Stage | What happens | AI role |
|---|---|---|
| Awareness | Student finds GradRight via SEO, referral, or campus session | AI generates SEO content |
| Engagement | Student uses tools, sees GradScore, explores community | AI personalizes all content |
| Trust | Student understands their risk, sees parent summary, runs loan readiness check | AI explains everything simply |
| Conversion | Student submits loan application with documents | AI auto-fills forms from OCR |
| Retention | Post-loan career tracking, referral engine | AI monitors career progress |

---

# SECTION 2 — COMPLETE USER JOURNEY (STAGE BY STAGE)

## Stage 1: Discovery — How Students Find GradRight

### Channel 1: SEO Content Flywheel (Primary — Zero CAC)
- AI generates 3–5 long-form articles per week targeting high-intent keywords:
  - "MS CS in USA cost for Indian students 2026"
  - "Education loan eligibility for study abroad India"
  - "Placement rate IIT vs private university for education loan"
- Each article ends with: "See your personalized GradScore → free, 3 minutes"
- Target: 50,000 monthly organic visits within 6 months

### Channel 2: Campus Ambassador Program
- 150 campus ambassadors (per hackathon's own incentive structure)
- Each ambassador hosts one 20-minute "GradRight Campus Session"
- Demo: Live GradScore calculation for a volunteer from the audience
- Target: 50 signups per campus × 100 campuses = 5,000 high-quality users

### Channel 3: Referral Loop (Built Into Product)
- Every student with a GradScore gets a shareable link: "See your GradScore"
- Referrer earns 100 GradPoints; referred friend gets instant GradScore preview
- WhatsApp-optimized: one-tap share, no app install required for preview

### Channel 4: Social Content
- AI generates short-form content scripts (Instagram reels, YouTube Shorts)
  - "What your CGPA actually means for US MS admits"
  - "Can you afford a UK MBA? Real numbers."
- Team records content. AI writes scripts and captions.

### Channel 5: Study Abroad WhatsApp Groups / Reddit
- GradRight team participates in r/Indians_StudyAbroad, Quora, Facebook groups
- Share free GradScore tool as the answer to "how do I know if I can get a loan?"

---

## Stage 2: Landing Page

### Headline (tested, specific, fear-resolving):
**"Find out if your profile can get you an education loan — in 3 minutes."**

### Sub-headline:
*GradRight shows your GradScore, expected salary, and loan readiness — powered by AI. Used by 10,000+ Indian students planning abroad.*

### Trust Signals (visible above fold):
- "Powered by Poonawalla Fincorp" badge
- "DPDP Compliant" badge
- "No credit check required to start" text
- 3 student testimonial cards (name, photo, program, outcome)
- University logo strip: IIT, NIT, VIT, DTU, Manipal, Pune University

### CTA:
Primary button: **"Get My GradScore — Free"**
Secondary link: "Already have an account? Login"

### What the landing page does NOT have:
- No loan rate tables (that comes later in the funnel)
- No complex finance jargon
- No long forms

---

## Stage 3: Signup / Login

### Signup Method:
- Google OAuth (one tap — primary method for speed)
- Email + Password (fallback)
- Mobile OTP (secondary, needed for Indian users without Google accounts)

### After initial signup, before dashboard: 7-question onboarding flow

---

## Stage 4: Onboarding Flow (The AI Profiling Engine)

**Design principle:** Every question must feel like a counselor asking, not a form demanding. Use large button-based answers. No text input in this stage. Maximum 90 seconds.

### Question 1: "What best describes you right now?"
- Buttons: Final Year Student / Recent Graduate (0–1 year) / Working Professional (1–3 years) / Working Professional (3+ years)
- **Why it matters:** Determines urgency score, loan type, and dashboard layout

### Question 2: "Where are you thinking of studying?"
- Buttons: USA / UK / Canada / Europe / Australia / Top Indian Institute (IIM/ISB/NIT) / Still Deciding
- Multi-select allowed
- **Why it matters:** Drives all content, requirements, timelines, and job market data

### Question 3: "What field do you want to study?"
- Buttons: Computer Science / Engineering / Business/MBA / Data Science / Healthcare / Design / Social Sciences / Other
- **Why it matters:** Core input for salary prediction and placement risk model

### Question 4: "What is your approximate current CGPA / percentage?"
- Buttons: Below 6.0 / 6.0–7.0 / 7.0–8.0 / 8.0–9.0 / Above 9.0 / Not applicable
- **Why it matters:** Primary input for admission probability and risk score

### Question 5: "When are you planning to start your program?"
- Buttons: Fall 2025 / Spring 2026 / Fall 2026 / Fall 2027 / Not sure yet
- **Why it matters:** Drives timeline generator and deadline tracker

### Question 6: "What is your approximate education budget (loan + family)?"
- Buttons: Under ₹20L / ₹20–40L / ₹40–70L / ₹70–100L / Above ₹1 Cr
- **Why it matters:** Loan eligibility estimator, ROI calculator, program shortlisting

### Question 7: "Are you expecting to need an education loan?"
- Buttons: Yes, definitely / Yes, probably / Not sure / No, self-funded
- **Why it matters:** Loan funnel prioritization, NBFC targeting

### After last question: 2-second loading screen with copy:
*"GradRight is building your personalized profile..."*

### Consent Screen (mandatory, simple):
- "GradRight uses your answers to personalize your experience using AI"
- "Your data is never shared without your consent"
- "AI assists your journey. All loan decisions involve human review."
- "By continuing, you agree to our Privacy Policy (DPDP 2023 compliant)"
- Single checkbox + "Continue" button

---

## Stage 4B: The WOW Card (Most Important Screen in the Product)

**Immediately after consent, before the dashboard:**
This screen must load within 3 seconds and show something the student has never seen before — a personalized intelligence summary.

```
┌──────────────────────────────────────────────────────┐
│  Hi Rahul 👋  Your GradRight Intelligence Summary    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  GradScore™           742 / 1000        [GOOD]      │
│  (Career Readiness + Loan Readiness combined)       │
│                                                      │
│  Top Program Match:   MS Computer Science — Canada  │
│  Predicted Salary:    CA$72,000 – CA$91,000 / year  │
│  Placement Odds:      78% within 6 months           │
│  Loan Comfort Zone:   ₹35L – ₹50L                   │
│  Risk Band:           🟡 Medium (improvable)         │
│                                                      │
│  3 things that would improve your GradScore:        │
│  → Add one internship to your profile (+47 pts)     │
│  → Complete a relevant certification (+23 pts)      │
│  → Finalize your target university list (+18 pts)   │
│                                                      │
│  [ Explore Your Dashboard ]  [ Improve My Score ]   │
└──────────────────────────────────────────────────────┘
```

**Why this works:**
Students have never seen their information assembled into a specific, personalized intelligence brief. This creates immediate emotional investment. They will return to watch their GradScore change.

---

## Stage 5: The Dashboard

**Design principle:** The dashboard is not a homepage. It is a command center that shows the student exactly where they are in their journey and what they should do next.

### Dashboard Layout (Top to Bottom):

**Section A — Journey Bar (Sticky Top)**
```
[ Discover ] → [ Shortlist ] → [ Prepare ] → [ Finance ] → [ Apply ] → [ Career ]
       ✓              ✓             Active           →            →           →
```
Shows current stage highlighted. Each stage is clickable and leads to relevant modules.

**Section B — Primary Action Card**
Dynamic based on user stage. Examples:
- Early stage: "You haven't set your target universities yet. Start with your Course Match →"
- Mid stage: "Your GradScore has 3 quick improvements available. See them →"
- Late stage: "You're loan-ready. Start your application →"

**Section C — GradScore Widget**
- Large, prominent number (e.g., 742/1000)
- Color-coded ring: Green (800+), Yellow (600–799), Orange (400–599), Red (below 400)
- "Improved by 23 points this week" micro-copy
- "See what's driving your score" link

**Section D — Weekly Action Plan**
3 specific tasks for this week (AI-generated based on stage and profile):
- Task 1: "Take your GRE mock test → boosts your Admission Probability"
- Task 2: "Add your internship details → improves your GradScore by 47 points"
- Task 3: "Read: US CS Job Market 2026 → 2 min read"
Each task has a checkbox and earns GradPoints when completed.

**Section E — Personalized News Feed**
- 3–5 cards pulled from NewsAPI + curated sources
- Filtered by user's target country + field
- AI rewrites headlines to be student-relevant: "This affects YOUR US F-1 visa timeline"
- Expandable to full article or opens source link

**Section F — Community Spotlight**
- 2 posts from the community feed, filtered by user's groups
- "Join your group: US MS CS 2026" CTA

**Section G — Module Navigation Grid**
8 large buttons arranged in 2×4 grid:
- Your Journey | GradScore | ROI Engine | Admissions
- Requirements | Financing | Loan Apply | Community

**Section H — Bottom Gamification Bar**
- GradPoints balance
- Current streak (🔥 Day 7)
- Next badge progress bar ("3 more points to unlock Premium Salary Report")

---

## Stage 6: Engagement Loop

### Daily Triggers:
- **7 AM push notification:** "Your GradScore can improve today. 2 quick actions →"
- **Deadline alerts:** "Application deadline for University of Toronto: 47 days"
- **News alert:** "New scholarship just opened for Indian students in Canada"

### Weekly Triggers:
- **GradBrief email:** AI-generated weekly newsletter (personalized, 5 sections, 300 words max)
  - Your GradScore change this week
  - Top news for your target country/course
  - One financial tip
  - Community highlight
  - Your next 3 actions

### Re-engagement Triggers (Automated):
- Day 2 without login: "Your GradScore is waiting. Did you know you can improve it today?"
- Day 7 without login: "You had a 7-day streak. Don't lose your progress."
- Day 14 without login: "3 students with your profile just got admitted. See how →"

### Progress Loops:
- Profile completion progress bar (fill this to get more accurate GradScore)
- Module completion tracker (complete all 6 core modules → unlock "GradRight Elite" badge)
- Journey stage progression (visible journey bar always shows progress)

### Gamification Economy:
| Action | GradPoints Earned |
|---|---|
| Complete onboarding | 100 |
| Update academic profile | 75 |
| Run GradScore full analysis | 50 |
| Complete a weekly task | 30 |
| Read a GradBrief | 10 |
| Refer a friend (who signs up) | 150 |
| Friend refers someone | 50 (chain bonus) |
| Submit loan application | 200 |
| Update job placement status | 100 |

**GradPoints are redeemable for:**
- Unlock premium salary report (detailed)
- Unlock SOP AI writer (premium module)
- Waiver of loan processing fee (Poonawalla partnership)
- Amazon vouchers (for top earners, community incentive)

---

## Stage 7: Trust Layer

### Trust is built across 5 mechanisms:

**1. Explainability at every prediction**
Every score, every recommendation, every prediction shows "Why we calculated this:"
- GradScore: "Your top 3 contributors: Institute tier (Strong), Target sector demand (Weak), CGPA (Good)"
- Salary prediction: "Based on 847 Indian students from similar programs who graduated 2021–2024"
- Risk band: "Medium risk because: No internship history + target sector shows 12% decline in hiring"

**2. Human-in-the-loop disclosure**
Repeated, clear, non-scary messaging:
- On all predictions: "This is an AI estimate for educational planning. Not a lending decision."
- On loan application: "Your application will be reviewed by a human loan officer at Poonawalla Fincorp."
- On NBFC console: "AI supports decisions. All approvals/rejections are made by human reviewers."

**3. Parent Summary Feature**
On the Financing module, a prominent button: **"Share with Parents"**
Generates a clean, readable PDF/WhatsApp card:
```
GradRight Student Summary — Rahul Sharma
Program: MS Computer Science, University of Toronto
Estimated Program Cost: ₹48 Lakhs
Expected Salary (Year 1): ₹58–72 Lakhs per annum (converted)
Monthly EMI (10-year loan): ₹42,000
EMI as % of expected salary: 28% (within safe range)
GradRight Risk Assessment: MEDIUM (improving)
AI Recommendation: Candidate has strong academic profile.
Career preparation will improve loan repayment confidence.
This summary is for informational purposes only.
Poonawalla Fincorp is the licensed lender.
```

**4. Source Citations**
Every data point shows its source:
- "Requirements from University of Toronto official website"
- "Salary data from LinkedIn Salary Insights + BLS.gov"
- "Placement rate from NIRF 2024 public report"

**5. Social Proof**
- "12,847 students have used GradRight this month"
- Real student success stories in the community (anonymized by default, can be made public)
- "Students with your profile got admitted to these universities" (aggregated, private)

---

## Stage 8: Conversion Layer (Loan Application)

**Principle:** Never push loan before the student is ready. The system detects readiness.

### Loan Readiness Signal (3 conditions must all be true):
1. Student has at least one target program set
2. Student has run the ROI Engine at least once
3. Student's GradScore is above 400 (minimum baseline)

**When all 3 are true:** A persistent (but not intrusive) banner appears:
> "You're loan-ready. Based on your profile, you may qualify for ₹30L–₹50L. Want to check? It's free and doesn't affect your credit score."

### Step 1: AI Loan Readiness Coach
Before the application, students go through a 5-minute AI-powered "mock loan interview":
- AI asks the same questions a loan officer would ask
- AI identifies gaps: "You don't have a co-borrower listed yet. This is required."
- AI generates a "Loan Readiness Report": which documents you have, which are missing, your eligibility band
- Student feels prepared, not ambushed

### Step 2: Loan Application Engine
**Mode A: Conversational (default)**
AI chatbot guides through the form:
> "Let's start with your academic details. What's your current institution?"
> "Great, and what's your target program and university?"
> "What is your approximate household annual income?"

**Mode B: Document Upload (for faster completion)**
- Student uploads documents; OCR extracts all data
- Pre-filled form shown for review and correction
- Takes 8–12 minutes instead of 25–30 minutes

**Documents collected:**
- Academic transcripts (OCR: extract institute, program, CGPA)
- Admit letter if available (OCR: extract university, program, fee)
- Income proof of co-borrower (OCR: extract income figure)
- ID proof (Aadhaar / PAN)
- Photograph

**After submission:**
- All data stored as structured JSON
- GradScore and placement risk report attached to application
- Application forwarded to NBFC Supervisor Console
- Student sees: Application submitted → In Review → Decision (with estimated timeline)
- Email + SMS confirmation sent

---

## Stage 9: Post-Conversion (Career Pact)

### The Career Pact (Engagement + Data Flywheel)
After loan approval, student is invited to join the "Career Pact":
> "GradRight invested in your success. We want to help you get placed — and keep your repayment stress-free. Update your progress monthly, and we'll give you career support, interview coaching, and GradPoints."

**Monthly update (takes 2 minutes):**
- Job search status (not started / actively searching / got internship / got offer / placed)
- Any new skills or certifications
- GradScore is recalculated

**GradRight provides in return:**
- Mock interview resources
- Recruiter match recommendations (by sector + location)
- Resume improvement AI review
- Repayment readiness tracker: "At your current progress, you're on track to repay comfortably"

**Referral at this stage:**
Students who got loans become the most credible referrers:
> "I got my study abroad loan through GradRight. They actually helped me understand everything."
> One-tap WhatsApp share → sends referral link to 3 friends

---

# SECTION 3 — SCREEN-BY-SCREEN PRODUCT STRUCTURE

## Screen 1: Landing Page

| Element | Detail |
|---|---|
| **Purpose** | Convert visitors into signups via one clear value proposition |
| **Key Features** | Hero headline, WOW card preview (static mockup), trust signals, CTA, testimonials, FAQ |
| **User Actions** | Click "Get My GradScore" → goes to Signup |
| **AI Features** | A/B tested headline variations (optional, post-MVP) |
| **Backend Needs** | Analytics tracking (page views, CTA clicks, bounce rate) |
| **APIs** | Google Analytics / Mixpanel |
| **Business Goal** | Maximize signup conversion rate (target: 15%+ of visitors) |
| **Engagement Goal** | Build immediate curiosity: "What is my GradScore?" |

---

## Screen 2: Signup / Auth Screen

| Element | Detail |
|---|---|
| **Purpose** | Authenticate user with minimum friction |
| **Key Features** | Google OAuth button, Email/Password form, Mobile OTP option |
| **User Actions** | Sign up → goes to Onboarding |
| **AI Features** | None at this screen |
| **Backend Needs** | Auth service (JWT tokens), User record creation |
| **APIs** | Google OAuth API, Twilio (OTP SMS) |
| **Business Goal** | Minimize drop-off; target < 30 seconds to complete |
| **Engagement Goal** | Frictionless entry |

---

## Screen 3: Onboarding Flow (7 Questions)

| Element | Detail |
|---|---|
| **Purpose** | Build user profile for personalization + AI seeding |
| **Key Features** | Button-based Q&A, progress bar, skip option on Q7 |
| **User Actions** | Select answers → reach WOW card |
| **AI Features** | Profile object created; LLM receives profile to generate initial GradScore + WOW card copy |
| **Backend Needs** | User profile schema populated; AI endpoint called async |
| **APIs** | Claude API (generate WOW card personalized text) |
| **Business Goal** | Capture segmentation data for loan targeting |
| **Engagement Goal** | Build anticipation for WOW card reveal |

---

## Screen 4: WOW Card / First Insight Screen

| Element | Detail |
|---|---|
| **Purpose** | Deliver immediate, personalized, specific value — the hook |
| **Key Features** | GradScore, top program match, salary range, placement odds, loan zone, 3 improvement actions |
| **User Actions** | "Explore Dashboard" or "Improve My Score" |
| **AI Features** | LLM generates personalized copy for each section; rule engine calculates initial GradScore |
| **Backend Needs** | GradScore calculation endpoint; LLM call with user profile as context |
| **APIs** | Claude API |
| **Business Goal** | Create immediate emotional investment; reduce Day 1 bounce |
| **Engagement Goal** | "I need to come back and improve this score" |

---

## Screen 5: Main Dashboard

| Element | Detail |
|---|---|
| **Purpose** | Central command center; show progress and guide next action |
| **Key Features** | Journey bar, primary CTA card, GradScore widget, weekly tasks, news feed, module grid, gamification bar |
| **User Actions** | Click any module, complete tasks, read news, check GradScore |
| **AI Features** | Dynamic CTA generated by AI based on current stage; news personalized by LLM; task list generated by AI based on gaps |
| **Backend Needs** | User stage detection logic; news API integration; task generation endpoint |
| **APIs** | NewsAPI.org, Claude API |
| **Business Goal** | Daily active usage; return rate |
| **Engagement Goal** | "I always know what to do next here" |

---

## Screen 6: GradScore Deep Dive

| Element | Detail |
|---|---|
| **Purpose** | Full breakdown of career readiness and loan repayment probability |
| **Key Features** | Score breakdown by 8 factors, placement probability chart (3/6/12 months), risk band with explainers, salary range, next-best actions |
| **User Actions** | View score breakdown, click improvement recommendations, update profile to see real-time score change |
| **AI Features** | LLM generates plain-language explanation for each factor; ML rule engine calculates all sub-scores; AI generates personalized next-best-action list |
| **Backend Needs** | GradScore engine (Python rule engine), score history tracking, profile → score mapping |
| **APIs** | Internal score API, Claude API for explanations |
| **Business Goal** | Core product differentiator; NBFC data input |
| **Engagement Goal** | "I want to improve this score; I know exactly what to do" |

---

## Screen 7: Discover — Course & University Intelligence

| Element | Detail |
|---|---|
| **Purpose** | Help student find best-fit programs, countries, and universities |
| **Key Features** | AI course matcher, country comparison, university shortlisting, peer match, ROI preview per program |
| **User Actions** | Filter by country/field/budget, shortlist universities, compare options |
| **AI Features** | LLM suggests best-fit based on profile; AI explains each recommendation; AI generates a "Why this program is right for you" card |
| **Backend Needs** | University database (static, 500+ universities), program database, peer match aggregation |
| **APIs** | None external required for MVP; optional: Shiksha API |
| **Business Goal** | Drive program shortlisting (which leads to timeline generation and loan application) |
| **Engagement Goal** | "I found programs I hadn't considered — this platform knows me" |

---

## Screen 8: Requirements & Timeline Generator

| Element | Detail |
|---|---|
| **Purpose** | Show exact requirements for each shortlisted program + auto-generate application timeline |
| **Key Features** | Per-university requirement checklist (CGPA, test scores, work exp, language scores), AI-generated application timeline, deadline tracker with alerts |
| **User Actions** | View requirements, mark completed items, set target intake, download timeline PDF |
| **AI Features** | LLM normalizes requirement data into plain language; AI generates personalized timeline based on today's date + target intake; AI alerts when deadlines are approaching |
| **Backend Needs** | Requirements database (seeded from official university pages), timeline calculation logic |
| **APIs** | NewsAPI for any official university updates |
| **Business Goal** | Build dependency on GradRight for application tracking |
| **Engagement Goal** | Daily return trigger (deadline countdowns) |

---

## Screen 9: Admission Predictor

| Element | Detail |
|---|---|
| **Purpose** | Give student a realistic sense of admission chances per shortlisted program |
| **Key Features** | Probability per university (Low/Medium/High), "Safer" and "Ambitious" alternatives, AI explanation of probability drivers, re-run on profile update |
| **User Actions** | View probability per shortlisted university, update profile to see change, add/remove programs |
| **AI Features** | Rule engine calculates admit probability from CGPA band + test scores + program average profile + institute tier; LLM explains the result in student-friendly language |
| **Backend Needs** | Historical admit data by program (static seed database), prediction rule engine |
| **APIs** | None external for MVP |
| **Business Goal** | Increase engagement with profile update cycle |
| **Engagement Goal** | "I want to improve my probability — what do I need to do?" |

---

## Screen 10: ROI Reality Engine

| Element | Detail |
|---|---|
| **Purpose** | Show student the full financial picture of their chosen program — not just a calculator, but a life simulation |
| **Key Features** | Total cost vs. salary simulation, Year 1–5 monthly cash flow breakdown (salary - tax - rent - food - EMI = take-home), payback period, "Improve your ROI" scenarios, share with parents button |
| **User Actions** | Input program cost, target loan amount, family contribution; see full financial simulation; adjust inputs to see scenarios; share with parents |
| **AI Features** | LLM generates a plain-language financial narrative: "At this salary and EMI, here is what your first year actually looks like financially. Here is how you can improve this."; salary data pulled from internal dataset |
| **Backend Needs** | Financial simulation engine (simple math), salary bands database by program/country/sector, tax calculation by country |
| **APIs** | Exchange rate API (for USD/CAD/GBP to INR conversion) |
| **Business Goal** | Build informed, confident users who are ready to apply for loans |
| **Engagement Goal** | "I've never seen my financial future broken down this clearly" |

---

## Screen 11: Financing Hub & Loan Eligibility Estimator

| Element | Detail |
|---|---|
| **Purpose** | Educate student on education loans, estimate their eligibility, and prepare them for the application |
| **Key Features** | Loan eligibility estimator (non-binding), EMI calculator linked to salary prediction, financial literacy content (Section 80E, moratorium, collateral types), parent summary generator, "Am I loan-ready?" self-check |
| **User Actions** | Input income and collateral info, see eligibility band, calculate EMI comfort zone, read financial education cards, generate parent summary |
| **AI Features** | LLM generates personalized eligibility explanation; AI links ROI Engine salary output to EMI comfort zone ("At your predicted salary, an EMI of ₹40,000/month would be 26% of your income — within safe range"); AI generates parent summary PDF |
| **Backend Needs** | Eligibility rule engine, PDF generation for parent summary |
| **APIs** | HTML-to-PDF API for parent summary |
| **Business Goal** | Top-of-funnel for loan conversion; NBFC lead warm-up |
| **Engagement Goal** | Parent involvement = higher conversion |

---

## Screen 12: AI Loan Readiness Coach

| Element | Detail |
|---|---|
| **Purpose** | Prepare student for the loan application process through a simulated loan interview — builds confidence and reduces application drop-off |
| **Key Features** | 10-question AI-led mock loan interview, gap identification ("You are missing co-borrower details"), Loan Readiness Report (document checklist + profile strength assessment), "Start Application" CTA after report |
| **User Actions** | Answer AI interview questions, review Loan Readiness Report, address gaps, proceed to application |
| **AI Features** | LLM conducts conversational mock interview, analyzes answers, generates Loan Readiness Report with specific gaps and strengths |
| **Backend Needs** | Loan Readiness Report generation, gap-to-action mapping |
| **APIs** | Claude API (primary feature here) |
| **Business Goal** | Increase loan application completion rate; reduce incomplete applications to NBFC |
| **Engagement Goal** | Student feels supported, not intimidated, going into the application |

---

## Screen 13: Loan Application Engine

| Element | Detail |
|---|---|
| **Purpose** | Collect all loan application data with minimum friction and maximum AI assistance |
| **Key Features** | Two modes (Conversational / Document Upload), OCR auto-fill, progress bar with save-resume, document status tracker, clear human-review disclosure, final submission confirmation |
| **User Actions** | Choose mode, fill or upload documents, review auto-filled form, submit |
| **AI Features** | LLM-powered conversational form ("What is your co-applicant's annual income?"); OCR extracts data from uploaded PDFs; LLM validates consistency across documents ("Your income proof shows ₹8L/year but you've entered ₹12L — please verify"); auto-fills form fields |
| **Backend Needs** | OCR engine (Tesseract or Google Vision API), form data model, JSON export to NBFC, document storage (encrypted S3), application status tracker |
| **APIs** | Google Vision API (OCR), AWS S3 (document storage) |
| **Business Goal** | Complete, structured loan application delivered to NBFC |
| **Engagement Goal** | "This was easier than I expected" |

---

## Screen 14: Application Status Tracker

| Element | Detail |
|---|---|
| **Purpose** | Keep student informed about their loan application status — reduce anxiety, reduce support calls |
| **Key Features** | Visual status pipeline (Submitted → Under Review → Decision), estimated timeline, "What happens next" explainer, contact support button |
| **User Actions** | View status, read explainer, contact support if needed |
| **AI Features** | AI generates status update messages in warm, reassuring language |
| **Backend Needs** | Application status model, webhook/polling for NBFC console updates |
| **APIs** | Email/SMS notification (SendGrid + Twilio) |
| **Business Goal** | Reduce customer support load; build trust through transparency |
| **Engagement Goal** | Reduces anxiety; keeps user engaged post-application |

---

## Screen 15: Community Feed

| Element | Detail |
|---|---|
| **Purpose** | Social engagement layer — builds trust through peer experience, keeps users returning daily |
| **Key Features** | Topic-based groups (US MS CS 2026, UK MBA, etc.), Q&A posts, success stories, senior mentor posts, AI-moderated content |
| **User Actions** | Post questions, answer others, upvote, follow topics, share GradRight journey updates |
| **AI Features** | LLM auto-suggests relevant community groups on signup; AI moderates content for inappropriate material; AI highlights most relevant posts on dashboard |
| **Backend Needs** | Community post model, group model, upvote system, content moderation pipeline |
| **APIs** | Claude API (moderation), optional: Discourse API for forum backend |
| **Business Goal** | Increase DAU, reduce churn, acquire users through community virality |
| **Engagement Goal** | "I found my people here. This is where I ask questions." |

---

## Screen 16: SOP & LOR Writer (Premium Module)

| Element | Detail |
|---|---|
| **Purpose** | AI-powered Statement of Purpose and Letter of Recommendation writer — a high-engagement, time-on-platform, premium feature |
| **Key Features** | SOP input wizard (background, achievements, goals, target program), AI drafts SOP, iterative editing with AI, LOR template generator, optional human review (premium tier) |
| **User Actions** | Input personal details, generate AI SOP draft, iterate, export as Word/PDF |
| **AI Features** | LLM generates complete SOP draft tailored to specific program; AI suggests improvements on each iteration; AI checks for generic language and suggests specific improvements |
| **Backend Needs** | SOP draft storage, iteration history, export functionality |
| **APIs** | Claude API, docx generation library |
| **Business Goal** | Premium monetization; high time-on-platform (30–60 minutes per session); strong engagement hook |
| **Engagement Goal** | "GradRight basically wrote my SOP. I come here for everything now." |

---

## Screen 17: NBFC Supervisor Console

| Element | Detail |
|---|---|
| **Purpose** | Give Poonawalla loan officers a structured, AI-enriched view of each applicant and the overall portfolio |
| **Key Features** | Individual applicant card (GradScore, risk band, salary prediction, placement probability, document checklist, AI summary), portfolio dashboard (risk distribution, institute breakdown, sector concentration), early warning alerts, intervention workflow |
| **User Actions** | Review applicant, approve/reject/escalate, send student nudge, view portfolio analytics |
| **AI Features** | LLM generates a 3-sentence AI summary for each applicant: "This student has a strong academic profile from a top-tier institute. Career risk is Medium due to target sector softness. Recommend approval with career support enrollment."; early warning algorithm flags risk increase automatically |
| **Backend Needs** | Application → NBFC pipeline, portfolio aggregation queries, alert engine, intervention workflow state machine |
| **APIs** | Internal only |
| **Business Goal** | The NBFC product that makes GradRight a B2B SaaS company |
| **Engagement Goal** | "This saves us 40% of underwriting time and gives us data we never had before" |

---

# SECTION 4 — MODULE-BY-MODULE DEVELOPMENT PLAN

## Module 1: Branding + Landing + Awareness Engine

**Goal:** Convert first-time visitors into signups. Build brand identity.

**Features:**
- Landing page with hero section, WOW card preview (static), testimonials, FAQ, footer
- SEO-optimized blog system (AI-generated articles)
- Referral landing page (unique link per user)
- Meta tags, Open Graph images, sitemap

**Inputs:** Visitor arrives (organic, referral, paid)
**Outputs:** User clicks signup CTA

**Frontend:** Next.js static pages + Tailwind CSS; blog via MDX or CMS (Contentful free tier)
**Backend:** Blog content stored in CMS; referral tracking in database
**AI Tools:** Claude API generates blog articles (1 article = 1 API call with SEO prompt)
**APIs:** Google Analytics, Mixpanel, NewsAPI (for blog content seeding)
**Dependencies:** None (first module to build)
**Priority:** MVP (must-have for launch)

---

## Module 2: Auth / Signup / Login / User Segmentation

**Goal:** Authenticate users securely and create a user profile object.

**Features:**
- Google OAuth signup (primary)
- Email + password signup (secondary)
- Mobile OTP login
- JWT session management
- User type detection (student / parent / NBFC staff)
- Protected routes (dashboard, modules only for logged-in users)

**Inputs:** User email, Google token, or mobile number
**Outputs:** Authenticated session + basic user record in database

**Frontend:** Auth pages (signup, login, forgot password)
**Backend:** NextAuth.js or Supabase Auth; user table in PostgreSQL
**AI Tools:** None at this stage
**APIs:** Google OAuth API, Twilio (SMS OTP)
**Dependencies:** Module 1 (landing page links here)
**Priority:** MVP

---

## Module 3: Onboarding + AI Profiling + WOW Card

**Goal:** Collect user profile data in < 90 seconds and deliver immediate personalized value.

**Features:**
- 7-question button-based flow
- Progress bar
- Consent screen (DPDP-compliant)
- Profile object creation in database
- WOW Card: AI-generated GradScore + program match + salary range + improvement actions
- Loading animation while AI processes

**Inputs:** 7 onboarding answers
**Outputs:** UserProfile object; initial GradScore; WOW Card content

**Frontend:** Multi-step form (no page reloads), animated transitions, WOW card reveal screen
**Backend:**
- API endpoint: POST /api/onboarding → saves profile → triggers GradScore calculation → triggers LLM call → returns WOW card JSON
- GradScore v0 calculation (rule engine, 4 inputs available at this stage)
**AI Tools:** Claude API — system prompt: "You are GradRight's AI. Given this student profile, generate a personalized insight summary in JSON format with fields: primaryProgramMatch, salaryRangeLow, salaryRangeHigh, placementOdds, loanComfortZone, riskBand, top3ImprovementActions. Use encouraging but honest language."
**APIs:** Claude API
**Dependencies:** Module 2 (user must be authenticated)
**Priority:** MVP

**GradScore v0 Formula (at onboarding — only 4 inputs):**
```
Base Score = 500
+ Academic score:    (CGPA 8.0+: +100) (7.0–8.0: +60) (6.0–7.0: +20) (below 6.0: 0)
+ Target clarity:   (specific country + field: +80) (partial: +40) (undecided: 0)
+ Work experience:  (3+ years: +120) (1–3 years: +80) (0: 0)
+ Loan awareness:   (definitely needs: +20, shows seriousness)
= Initial GradScore (max ~820 at onboarding)
```
This score improves as the user adds more profile details throughout their journey.

---

## Module 4: Dashboard Core

**Goal:** Central command center that drives all subsequent engagement.

**Features:**
- Journey Bar (6 stages, current stage highlighted)
- Dynamic Primary CTA Card
- GradScore widget (score + color ring + weekly change)
- Weekly Task List (3 tasks, AI-generated, checkable)
- Personalized News Feed (5 cards, NewsAPI + LLM filter)
- Module Navigation Grid (8 large buttons)
- Gamification Bar (GradPoints + streak + next badge)
- First-login tutorial overlay (dismissable)

**Inputs:** UserProfile, GradScore, user stage, news API response
**Outputs:** Rendered dashboard with all dynamic sections

**Frontend:** Next.js with React Server Components; dashboard sections are independently loading (skeleton loaders per section)
**Backend:**
- GET /api/dashboard → returns { stage, gradScore, weeklyTasks, news, gradPoints, streak }
- Task generation: rule engine based on profile gaps + journey stage
- Stage detection: algorithm checks which modules have been used and profile completeness
**AI Tools:**
- Claude API for news card summarization ("Summarize this article in 1 sentence relevant to a student targeting [country] for [field]")
- Claude API for weekly task generation ("Given this user profile and completed modules, suggest 3 specific high-value tasks this week")
**APIs:** NewsAPI.org (free tier: 100 requests/day)
**Dependencies:** Modules 1–3
**Priority:** MVP

---

## Module 5: Study Abroad Planning Tools (Sub-modules)

This module contains 4 sub-features. Build them in order.

### Sub-module 5A: Discover (Course & University Intelligence)

**Goal:** Help student shortlist programs.

**Features:** AI course match (top 5 programs based on profile), country comparison table, university shortlist (save/remove), "Students like you" peer match card, ROI preview per program

**Database needed:**
```
universities table: id, name, country, rank, avg_gpa_required, avg_gre_required, placement_rate_3mo, placement_rate_6mo, avg_starting_salary_usd, program_cost_usd
programs table: id, university_id, field, name, duration_months
```
Seed with 200–300 programs for MVP.

**AI Role:** LLM generates "Why this program is right for you" for each shortlisted program, using user profile as context.

---

### Sub-module 5B: Requirements & Timeline Generator

**Goal:** Show requirements + create personal application timeline.

**Features:** Per-program requirement checklist, deadline calculation (today → target intake), deadline tracker with badge for approaching deadlines, downloadable timeline PDF

**Database needed:**
```
requirements table: program_id, gpa_min, gre_min, ielts_min, work_exp_required, application_deadline_month
```

**Timeline generation logic:**
```
If target intake is Fall 2026:
- GRE preparation: Start now (if not done)
- IELTS preparation: 3 months before application
- Applications: 6 months before intake
- Visa: After admit letter
- Loan application: 4–6 months before program start
```

**AI Role:** LLM takes the calculated timeline + user's current profile stage and writes it as a personalized "Your Action Plan" narrative.

---

### Sub-module 5C: Admission Predictor

**Goal:** Realistic admission probability per shortlisted program.

**Prediction Rule Engine:**
```python
def calculate_admit_probability(user_profile, program):
    score = 0
    
    # CGPA component (30%)
    cgpa_diff = user_profile.cgpa - program.avg_gpa_required
    if cgpa_diff >= 0.5: score += 30
    elif cgpa_diff >= 0: score += 20
    elif cgpa_diff >= -0.5: score += 10
    else: score += 0
    
    # GRE component (25%)
    if user_profile.gre_score >= program.avg_gre_required + 10: score += 25
    elif user_profile.gre_score >= program.avg_gre_required: score += 17
    elif user_profile.gre_score >= program.avg_gre_required - 10: score += 9
    
    # Work experience (20%)
    if program.work_exp_required and user_profile.work_exp_years >= 2: score += 20
    elif not program.work_exp_required: score += 15
    
    # Institute tier (15%)
    if user_profile.institute_tier == 1: score += 15
    elif user_profile.institute_tier == 2: score += 10
    else: score += 5
    
    # Profile completeness bonus (10%)
    if user_profile.has_internships: score += 5
    if user_profile.has_certifications: score += 5
    
    # Map to Low/Medium/High
    if score >= 70: return "High", score
    elif score >= 45: return "Medium", score
    else: return "Low", score
```

**AI Role:** LLM generates 2-sentence explanation of why probability is what it is.

---

### Sub-module 5D: GradScore Deep Dive (Career & Risk Engine)

**Goal:** Full career readiness score with placement prediction, salary range, and explainability. This is the core of PS1.

**Full GradScore Formula (8 factors):**
```
Factor 1: Institute Tier (20%)
  Tier 1 (IIT/NIT/BITS/top foreign): 100 pts
  Tier 2 (reputable state/private): 65 pts
  Tier 3 (others): 30 pts

Factor 2: Program Placement Rate (20%)
  >80% placed in 6 months: 100 pts
  60–80%: 65 pts
  <60%: 30 pts

Factor 3: CGPA (15%)
  >8.5: 100 pts | 7.5–8.5: 70 pts | 6.5–7.5: 45 pts | <6.5: 20 pts

Factor 4: Internship Quality (15%)
  2+ relevant internships: 100 pts | 1 relevant: 65 pts | 0: 10 pts

Factor 5: Target Sector Job Demand (10%)
  High demand (CS, Data Science, Healthcare): 100 pts
  Medium (Business, Finance): 65 pts
  Low demand (Arts, Niche sciences): 30 pts

Factor 6: Certifications & Skills (10%)
  3+ relevant: 100 pts | 1–2: 60 pts | 0: 20 pts

Factor 7: Communication Proxy (5%)
  High IELTS/TOEFL score: 100 pts | Moderate: 60 pts | None: 30 pts

Factor 8: Macro Job Market (5%)
  Target country employment rate > 95%: 100 pts
  92–95%: 65 pts | <92%: 30 pts

GradScore = Weighted sum, normalized to 0–1000
```

**Placement Timeline Prediction:**
```
P(placed in 3 months) = GradScore × 0.055 (capped at 85%)
P(placed in 6 months) = GradScore × 0.075 (capped at 95%)
P(placed in 12 months) = min(GradScore × 0.090, 99%)
```

**Salary Range Prediction:**
- Stored in static database by (field × country × institute_tier)
- Example: CS × USA × Tier 1 → Low: $85K, Mid: $105K, High: $130K
- Example: MBA × India × Tier 2 → Low: ₹8L, Mid: ₹14L, High: ₹22L

**Risk Band:**
- GradScore 700+: Low Risk
- GradScore 500–699: Medium Risk
- GradScore below 500: High Risk

**Explainability output (top 3 factors):**
```json
{
  "top_risk_factors": [
    {
      "factor": "Internship Quality",
      "direction": "negative",
      "plain_text": "No internship history reduces placement speed in competitive markets"
    },
    {
      "factor": "Target Sector Job Demand",
      "direction": "neutral",
      "plain_text": "Your target sector has moderate hiring trends in 2025–26"
    },
    {
      "factor": "CGPA",
      "direction": "positive",
      "plain_text": "Your academic performance is strong and helps your profile"
    }
  ]
}
```

**Next-Best-Actions (rule-based, shown to student):**
```
IF internship_score < 50 → "Add internship experience to your profile. Consider a pre-departure internship. This could improve your GradScore by ~47 points."
IF certification_score < 50 → "Add 1–2 skill certifications relevant to your field. AWS, Google Analytics, CFA Level 1 — depending on your program."
IF sector_demand == "Low" → "Consider diversifying your target programs to include sectors with stronger job demand."
```

**Dependencies:** Full profile data required. Score recalculates automatically when profile is updated.

---

## Module 6: Social / Community Layer

**Goal:** Build social stickiness — give students a reason to return daily.

**Features:**
- Topic-based groups (auto-joined based on target country + field + intake year)
- Q&A posts (question + answer format with upvotes)
- Success story cards (template: "I got into [university] with [profile]. Here's what I did.")
- AI Mentor posts (daily AI-generated tips, 3 sentences max)
- Report/flag posts
- Notification when someone answers your question

**Backend Schema:**
```
groups: id, name, country, field, intake_year
posts: id, group_id, author_id, type (question/story/tip), content, upvotes, created_at
comments: id, post_id, author_id, content, upvotes
```

**AI Role:**
- LLM auto-suggests 2–3 groups to join at signup
- LLM moderates posts for inappropriate content (simple flag system)
- LLM generates daily "AI Mentor Tip" post for each major group (1 LLM call per group per day)

**APIs:** None external for MVP
**Priority:** MVP (without community, retention drops significantly)

---

## Module 7: AI Mentor (Floating Chatbot)

**Goal:** A persistent, context-aware AI mentor available on every screen — the "always-on counselor."

**Features:**
- Floating chat button on every page
- Context awareness: knows which screen the user is on, knows their profile + GradScore
- Can answer any question about: universities, requirements, loans, visas, scholarships, career, the GradRight platform
- Routes to relevant modules: "To run your full admission prediction, go to the Admissions module. Want me to take you there?"
- Conversation history stored per session (not across sessions for MVP)

**System prompt for AI Mentor:**
```
You are Grad, the AI mentor on GradRight — India's education finance platform. 
You help Indian students plan their postgraduate education and education loan journey.

Current user profile: {userProfileJSON}
Current page: {currentPage}
User's GradScore: {gradScore}
User's shortlisted programs: {shortlistedPrograms}

Rules:
1. Always be warm, encouraging, and specific. Never vague.
2. Always relate advice to the user's actual profile.
3. For loan-specific questions, add: "A human loan officer will review your application. This is educational guidance only."
4. Keep responses under 120 words unless the user asks for more detail.
5. If you suggest an action, tell the user which module to visit.
6. Never make up data. If you don't know, say so and suggest the user check official sources.
```

**Backend:** POST /api/chat with { message, userProfile, currentPage, conversationHistory }
**AI Tools:** Claude API (claude-sonnet-4-6 model)
**APIs:** Claude API
**Priority:** MVP

---

## Module 8: Trust + Loan Education Layer

**Goal:** Build financial literacy and trust before the loan CTA appears.

**Features:**
- Financial Education Cards (bite-sized: 6 topics, 2-minute reads each):
  1. How education loans work in India
  2. What is the moratorium period?
  3. Section 80E tax benefit — how to use it
  4. Collateral vs. non-collateral loans — what's the difference?
  5. How loan repayment works — EMI calculation explained
  6. What NBFCs look for in a student loan application
- "Test your knowledge" quiz (5 questions per card, earns 20 GradPoints)
- Parent Summary Generator (described above)
- "GradRight Promise" section: What we will never do (no unsolicited data sharing, no automated loan decisions, no hidden fees)

**AI Role:** LLM generates explanations in simple language at 8th-grade reading level (instruction in prompt).

**Priority:** MVP

---

## Module 9: Loan Match + Conversion Funnel

**Goal:** Convert engaged, educated students into loan applicants.

This module contains:

### Sub-module 9A: Loan Eligibility Estimator
- Input: Approximate family income, collateral availability, target loan amount
- Output: Eligibility band (e.g., "You likely qualify for ₹25L–₹45L based on your profile")
- Disclaimer: "This is an estimate. Final eligibility is determined by Poonawalla Fincorp's credit team."

### Sub-module 9B: ROI Reality Engine (described in Screen 10 above)

### Sub-module 9C: AI Loan Readiness Coach
Full mock interview + Loan Readiness Report. Described in Screen 12 above.

### Sub-module 9D: Loan Application Engine
Full application with dual modes. Described in Screen 13 above.

**Loan Readiness Check (3 conditions):**
```javascript
function isLoanReady(user) {
  return (
    user.shortlistedPrograms.length >= 1 &&
    user.hasRunROIEngine === true &&
    user.gradScore >= 400
  );
}
// If true: show persistent "You're loan-ready" banner
// If false: show "Complete these steps first" prompt
```

**Priority:** MVP (this is the conversion goal — highest priority after core engagement)

---

## Module 10: Retention + Notifications + Rewards

**Goal:** Keep users returning weekly through automated, AI-powered nudges.

**Notification Triggers (10 automated rules):**
```
Rule 1: User inactive 2 days → Push: "Your GradScore is waiting to improve"
Rule 2: Deadline in 30 days → Push: "[University] deadline in 30 days. 3 tasks remaining."
Rule 3: GradScore improves → Push: "Your GradScore just went up by 34 points! See what changed."
Rule 4: New scholarship matches profile → Push: "New scholarship opened for students like you"
Rule 5: Community member answers your question → Push: "Someone answered your question in the US MS CS group"
Rule 6: 7-day streak → Push + In-app: "7-day streak! You've unlocked the Premium Salary Report."
Rule 7: Profile 80% complete → Push: "Add your internship details to unlock your full GradScore"
Rule 8: ROI Engine run but no loan application in 14 days → Push: "You ran your ROI calculation. Ready to check loan eligibility?"
Rule 9: Referred friend signs up → Push: "Your referral joined GradRight! You earned 150 GradPoints."
Rule 10: Loan application submitted → Push series: "Application received" → "Under review" → "Decision made"
```

**GradPoints Economy:**
Described in Stage 6. Points are tracked in database, redeemable for features and partner rewards.

**Streak System:**
- Daily login = streak maintained
- Missed day = streak resets (with one "streak freeze" available per week, earned at 50 GradPoints)

**Priority:** MVP (notifications are critical for retention)

**APIs:** Firebase Cloud Messaging (push), SendGrid (email), Twilio (SMS for loan status updates)

---

## Module 11: Admin + Analytics Console

**Goal:** Give the GradRight team visibility into product performance + give Poonawalla the NBFC console.

### 11A: GradRight Internal Admin
- User count by stage, conversion funnel metrics
- GradScore distribution across users
- Top-performing referrers
- Content performance (which articles drive signups)
- Loan application completion rates

### 11B: NBFC Supervisor Console (Poonawalla)
Full description in Screen 17 above.

**Portfolio Analytics features:**
- Risk distribution pie chart (% Low / Medium / High applicants)
- Institute-wise risk heatmap (which institutes produce high-risk applicants)
- Sector-wise concentration (over-exposure to any single field)
- Monthly trend: application volume + risk profile change
- Early warning list: students whose GradScore has dropped since application submission

**Intervention Workflow:**
- "Send Career Nudge" button → triggers Rule 4-type notification to student
- "Request Additional Document" button → student gets notification with specific request
- "Flag for Manual Review" → moves application to separate review queue

**Priority:** NBFC console is MVP (required for PS1 scoring). Internal admin can be post-MVP.

---

## Module 12: Scale Features (Post-MVP)

**Goal:** Features that make GradRight defensible, viral, and revenue-generating at scale.

### Scale Feature 1: Zero-Human AI Growth Loop
- Segment users by behavior (defined segments: "curious browser," "active planner," "loan-ready," "dormant")
- Automated campaign engine: per segment, per stage, trigger content + nudges
- Content generation: Claude API generates personalized emails/notifications for each segment daily
- Requires: user behavior tracking + segmentation engine + campaign scheduler

### Scale Feature 2: SOP / LOR AI Writer
- Premium module (costs 300 GradPoints or ₹299 one-time)
- High retention: students spend 45–90 minutes on this feature
- AI generates SOP, student iterates, exports as DOCX

### Scale Feature 3: Scholarship Tracker
- Database of India-specific scholarships for study abroad + domestic
- AI matches scholarships to user profile
- Application deadline tracker
- Earns GradPoints for successful applications

### Scale Feature 4: University Partnership Program
- Integrate university application portals
- GradRight becomes an application aggregator
- Revenue: application referral fee (₹500–₹2,000 per application)

### Scale Feature 5: Alumni Network
- Post-graduation, students remain on GradRight as alumni
- Alumni can answer community questions (earns points)
- Creates social proof + real placement outcome data for the risk model

---

# SECTION 5 — TECHNICAL ARCHITECTURE

## 5.1 Frontend

**Technology:** Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Why Next.js:**
- Server-side rendering for SEO (critical for content flywheel)
- API routes for simple backend logic
- Fast deployment on Vercel
- React ecosystem for component reuse

**Key Design Principles:**
- Mobile-first responsive design (most Indian students use phones)
- Skeleton loaders on every data-dependent section
- Optimistic UI (show expected result immediately, correct if needed)
- Accessible (WCAG 2.1 AA minimum)

**Key Libraries:**
- `shadcn/ui` — component library (buttons, cards, modals)
- `recharts` — charts for GradScore breakdown, ROI simulation, portfolio analytics
- `react-hook-form` + `zod` — form validation
- `framer-motion` — animations (WOW card reveal, score change animation)
- `next-pwa` — Progressive Web App for mobile feel without app store

---

## 5.2 Backend

**Technology:** Next.js API Routes (for simple endpoints) + Python FastAPI (for AI/ML endpoints)

**Why two backends:**
- Next.js API routes handle auth, user data, dashboard data — all simple CRUD
- Python FastAPI handles: GradScore calculation, Claude API calls, OCR processing — AI-heavy operations that benefit from Python's AI ecosystem

**API Design:**
```
Next.js API Routes:
GET  /api/user/profile          → Get user profile
POST /api/user/onboarding       → Save onboarding answers
GET  /api/dashboard             → Get dashboard data
GET  /api/universities          → Get/search universities
POST /api/shortlist             → Add/remove university from shortlist
GET  /api/community/posts       → Get community feed
POST /api/community/posts       → Create post
POST /api/loan/application      → Submit loan application
GET  /api/loan/status           → Get application status

Python FastAPI:
POST /ai/gradfeed-score         → Calculate full GradScore
POST /ai/wow-card               → Generate WOW card content
POST /ai/chat                   → AI mentor chat endpoint
POST /ai/loan-readiness-coach   → Mock loan interview
POST /ai/generate-tasks         → Generate weekly tasks
POST /ai/sop-draft              → Generate SOP draft
POST /ai/ocr-extract            → Process uploaded document
POST /ai/parent-summary         → Generate parent summary PDF
```

---

## 5.3 Database

**Primary Database:** PostgreSQL (via Supabase — free tier, easy setup)

**Cache:** Redis (via Upstash — free tier) for:
- GradScore caching (invalidate on profile update)
- News feed caching (refresh every 4 hours)
- Session data

**Core Database Schema:**
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  user_type VARCHAR DEFAULT 'student' -- student | parent | nbfc_staff
);

-- Student Profiles
CREATE TABLE student_profiles (
  user_id UUID REFERENCES users(id),
  current_level VARCHAR,           -- final_year | graduate | working_1_3 | working_3+
  target_countries TEXT[],         -- ['USA', 'Canada']
  target_field VARCHAR,            -- cs | mba | engineering | etc
  cgpa DECIMAL(3,2),
  target_intake VARCHAR,           -- Fall2026
  budget_band VARCHAR,             -- 20_40L | 40_70L | etc
  loan_need VARCHAR,               -- definitely | probably | not_sure | no
  institute_name VARCHAR,
  institute_tier INTEGER,          -- 1 | 2 | 3
  work_exp_years INTEGER DEFAULT 0,
  internship_count INTEGER DEFAULT 0,
  internship_quality VARCHAR,      -- none | tier3 | tier2 | tier1
  certification_count INTEGER DEFAULT 0,
  ielts_score DECIMAL(3,1),
  gre_score INTEGER,
  profile_completeness INTEGER DEFAULT 0, -- 0-100
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GradScore History
CREATE TABLE grad_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL,
  risk_band VARCHAR, -- low | medium | high
  placement_3mo DECIMAL(5,2),
  placement_6mo DECIMAL(5,2),
  placement_12mo DECIMAL(5,2),
  salary_low INTEGER,
  salary_mid INTEGER,
  salary_high INTEGER,
  top_factors JSONB,
  next_actions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- University Shortlists
CREATE TABLE shortlists (
  user_id UUID REFERENCES users(id),
  university_id UUID REFERENCES universities(id),
  admit_probability VARCHAR, -- low | medium | high
  created_at TIMESTAMP DEFAULT NOW()
);

-- Universities
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  country VARCHAR,
  rank INTEGER,
  field VARCHAR,
  avg_gpa_required DECIMAL(3,2),
  avg_gre_required INTEGER,
  placement_rate_6mo DECIMAL(5,2),
  avg_starting_salary_usd INTEGER,
  program_cost_usd INTEGER,
  work_exp_required BOOLEAN DEFAULT false
);

-- Loan Applications
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'draft', -- draft | submitted | under_review | approved | rejected
  grad_score_at_submission INTEGER,
  risk_band_at_submission VARCHAR,
  application_json JSONB, -- full structured application data
  documents_json JSONB,   -- document metadata + extraction results
  supervisor_notes TEXT,
  supervisor_id UUID,
  submitted_at TIMESTAMP,
  decision_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GradPoints
CREATE TABLE grad_points (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0
);

-- GradPoints Transactions
CREATE TABLE grad_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER,
  action VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Streaks
CREATE TABLE streaks (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  freeze_available INTEGER DEFAULT 1
);
```

---

## 5.4 Authentication

**Library:** NextAuth.js v5 (handles Google OAuth + email/password + JWT)

**Session strategy:** JWT stored in httpOnly cookie (secure, XSS-safe)

**NBFC Staff Auth:** Separate login route (/nbfc/login) with fixed email/password credentials (no OAuth, tighter control)

---

## 5.5 AI Layer

**Primary LLM:** Claude claude-sonnet-4-6 (via Anthropic API)
- All conversational features, content generation, explanations

**Rule Engine:** Python (no external ML library needed for MVP)
- GradScore calculation
- Admission probability
- Loan eligibility estimate
- Placement timeline prediction

**OCR:** Google Cloud Vision API (most accurate for Indian documents)
- Fallback: Tesseract.js (free, runs in browser for simple documents)

**Content Generation Pipeline:**
- Blog articles: Claude API called once per article topic; cached in CMS
- News summarization: Claude API called on NewsAPI response; cached 4 hours
- Weekly GradBrief: Claude API called once per user per week (batched Sunday night)

---

## 5.6 External APIs

| API | Purpose | Cost |
|---|---|---|
| Anthropic Claude API | All LLM features | Pay-per-use |
| Google OAuth | Authentication | Free |
| Google Vision API | OCR document processing | $1.50 per 1,000 pages |
| NewsAPI.org | News feed | Free (100 req/day) |
| ExchangeRate-API | USD/CAD/GBP to INR conversion | Free tier |
| SendGrid | Email notifications | Free (100/day) |
| Twilio | SMS OTP + loan status SMS | Pay-per-use |
| Firebase Cloud Messaging | Push notifications | Free |
| AWS S3 (or Supabase Storage) | Document storage | Pay-per-use |
| Vercel | Frontend hosting | Free tier |
| Railway / Render | Python backend hosting | Free tier |
| Supabase | PostgreSQL + Auth | Free tier |
| Upstash | Redis cache | Free tier |

**MVP cost estimate:** < ₹2,000/month at 1,000 active users

---

## 5.7 Notifications

**Three channels:**
1. **In-app notifications:** Bell icon in nav bar, stored in database, shown on dashboard
2. **Email:** SendGrid, triggered by automation rules
3. **Push (web):** Firebase Cloud Messaging, PWA push notifications

**Notification service architecture:**
- Background job runs every hour
- Checks all 10 automation rules against user activity data
- Queues notifications for users who match trigger conditions
- Sends via appropriate channel based on user preference

---

## 5.8 Security & Compliance

**Data Security:**
- All documents uploaded encrypted at rest (AES-256, AWS S3 server-side encryption)
- All API endpoints authenticated (JWT middleware)
- Sensitive fields (income data, document content) stored encrypted in database
- HTTPS enforced on all routes

**DPDP 2023 Compliance:**
- Explicit consent captured at onboarding with specific language
- Users can download all their data (GET /api/user/export)
- Users can delete their account and all associated data (DELETE /api/user/account)
- Loan applications: data shared with Poonawalla Fincorp only with explicit consent at application step
- No data sold to third parties — stated explicitly in consent screen and privacy policy

**NBFC Compliance:**
- Loan application form collects only data required for education loan (no surplus collection)
- AI decision support only — no AI-automated approvals
- All credit decisions logged with supervisor ID and timestamp
- Audit trail for all status changes on loan applications

---

# SECTION 6 — AI IMPLEMENTATION PLAN

## AI Feature 1: Smart Onboarding Assistant

**Purpose:** Make the 7-question onboarding feel like a conversation, not a form. Then generate the WOW card.

**Model:** Claude claude-sonnet-4-6

**System Prompt:**
```
You are GradRight's AI. A student just completed their onboarding. 
Given their profile, generate a JSON response with exactly these fields:
- primaryProgramMatch (string: e.g., "MS Computer Science in Canada")  
- salaryRangeLow (integer in the primary currency of target country, annual)
- salaryRangeHigh (integer)
- placementOdds (integer: percentage, 0-95)
- loanComfortZone (string: e.g., "₹35L – ₹50L")
- riskBand (string: "Low" | "Medium" | "High")
- riskBandColor (string: "green" | "yellow" | "red")
- top3Actions (array of 3 strings, each under 60 characters, starting with action verb)
Use the salary database provided. Be specific and honest. Do not be overly optimistic.
```

**User Value:** Immediate "this platform knows me" feeling. Creates the hook.

---

## AI Feature 2: AI Mentor Chatbot (Grad)

**Purpose:** Answer any student question, route to relevant module, maintain context about the student.

**Model:** Claude claude-sonnet-4-6

**System Prompt:** (as defined in Module 7 above)

**Key behaviors:**
- Always mentions the student's name
- References their actual GradScore and profile data
- Ends every response with one actionable next step
- Routes to modules rather than trying to do everything in chat

**User Value:** "I have a counselor available 24/7 who knows my profile."

---

## AI Feature 3: GradScore Explainer

**Purpose:** Translate rule engine output into human language.

**Model:** Claude claude-sonnet-4-6

**Prompt structure:**
```
Given this GradScore breakdown: {factorsJSON}
Write a 3-paragraph explanation for the student:
Paragraph 1: What the score means overall (encouraging but honest)
Paragraph 2: The 2 biggest factors helping them
Paragraph 3: The 2 biggest areas for improvement and exactly what to do
Write at an 8th-grade reading level. Be specific, not vague.
```

**User Value:** Student understands their score deeply. Knows exactly what to improve.

---

## AI Feature 4: ROI Narrative Generator

**Purpose:** Take financial simulation output and write it as a human story.

**Model:** Claude claude-sonnet-4-6

**Prompt structure:**
```
A student is planning: {program} at {university} in {country}.
Total cost: {totalCost}. Loan amount: {loanAmount}. 
Family contribution: {familyContribution}.
Expected Year 1 salary: {salaryLow}–{salaryHigh}.
Monthly EMI: {emi}. 

Write a 2-paragraph financial reality summary:
Paragraph 1: What their first year actually looks like financially (numbers included)
Paragraph 2: One realistic scenario for reducing payback time (specific action)
Be honest. Do not sugarcoat. Help them make an informed decision.
```

**User Value:** Financial clarity that no other platform provides.

---

## AI Feature 5: AI Loan Readiness Coach

**Purpose:** Simulate a loan officer interview so students arrive at the application fully prepared.

**Model:** Claude claude-sonnet-4-6

**Conversation flow:**
1. AI asks 10 specific questions (income, co-applicant, collateral, existing debts, etc.)
2. After all answers, AI generates Loan Readiness Report
3. Report identifies: documents missing, profile gaps, estimated eligibility band

**System Prompt:**
```
You are a loan officer at Poonawalla Fincorp conducting an education loan eligibility interview.
Ask the student 10 questions, one at a time, to assess their loan readiness.
After all answers, generate a structured Loan Readiness Report in JSON format with:
- eligibilityBand (string)
- documentsMissing (array)
- profileGaps (array)
- strengths (array)
- overallReadiness (Low | Medium | High)
- summaryMessage (string, 3 sentences, encouraging)
Note: This is for educational preparation only. Actual approval is at Poonawalla's discretion.
```

**User Value:** "I knew exactly what to expect in the loan application. No surprises."

---

## AI Feature 6: Document Intelligence (OCR + LLM)

**Purpose:** Extract structured data from uploaded documents and auto-fill the loan application form.

**Pipeline:**
1. User uploads document (PDF or image)
2. Google Vision API extracts raw text
3. LLM parses raw text into structured fields:
```
Prompt: "Extract the following fields from this document text: {rawText}
Fields: institute_name, program_name, cgpa, graduation_year, student_name.
Return as JSON. If a field is not found, return null. Do not guess."
```
4. Structured data pre-fills the form
5. User reviews and corrects
6. Validated data stored in application JSON

**User Value:** "I uploaded my transcript and the form filled itself."

---

## AI Feature 7: Content Generation Engine

**Purpose:** Generate personalized content at scale — blog articles, GradBrief newsletters, community AI mentor posts.

**Blog Article Generation:**
```
Prompt: "Write a 1,200-word SEO-optimized blog article for Indian students about: {topic}.
Target keyword: {keyword}. Include: practical advice, real numbers, India-specific context.
End with a CTA to try GradRight's free GradScore tool.
Writing style: clear, direct, helpful. Not salesy."
```
One article per topic, stored in CMS, never regenerated (costs money).

**GradBrief Newsletter:**
```
Prompt: "Generate a weekly GradBrief newsletter for a student with this profile: {profile}.
Include: 
1. Their GradScore change this week and why
2. Top 2 news items relevant to their target country/field
3. One financial tip relevant to their budget range
4. One community highlight from their groups
5. Their 3 tasks for next week
Keep total length under 300 words. Warm, motivating tone."
```

---

## AI Feature 8: NBFC Applicant Summarizer

**Purpose:** Give loan officers a 3-sentence AI summary for each loan applicant.

**Model:** Claude claude-sonnet-4-6

**Prompt:**
```
You are assisting a loan officer at Poonawalla Fincorp reviewing an education loan application.
Write a 3-sentence summary of this applicant for the loan officer. Include:
Sentence 1: Academic and program profile (neutral, factual)
Sentence 2: Career risk assessment (based on GradScore data)
Sentence 3: A recommendation (approve / manual review / request more info) with brief reasoning.
Data: {applicationJSON + gradScoreJSON}
Be professional, concise, and objective. Never use the word "guaranteed."
```

**User value (NBFC):** Saves 15–20 minutes per application review.

---

## AI Feature 9: Zero-Human Growth Loop (v1)

**Purpose:** Automatically acquire, engage, and nurture users without manual marketing.

**Architecture:**
```
Segment Engine (runs nightly):
- Classify all users into segments:
  "new_curious": onboarded < 7 days, < 3 modules used
  "active_planner": 3+ modules, no loan step started
  "loan_ready": loan readiness conditions met, no application
  "dormant": no login in 14+ days
  "completed": loan application submitted

Campaign Engine (per segment):
  new_curious → send 3-day email sequence (Day 1: GradScore explanation, Day 3: Community invite)
  active_planner → nudge toward ROI Engine, then Financing Hub
  loan_ready → loan application CTA campaign
  dormant → re-engagement campaign with GradScore preview
  
Content for each campaign: Generated by Claude API with segment context.
Sending: Automated via SendGrid + Firebase.
```

---

# SECTION 7 — MVP EXECUTION ROADMAP

**Total build time for hackathon demo: 14 days**

## Week 1: Core Functionality

### Day 1–2: Foundation
**Build:** Project setup + authentication + database
- Initialize Next.js project with TypeScript + Tailwind
- Set up Supabase (auth + PostgreSQL)
- Google OAuth integration
- Basic user table + session management
- Deploy to Vercel

**Why first:** Nothing else works without auth and database.

### Day 3–4: Onboarding + WOW Card
**Build:** 7-question flow + AI-powered WOW card
- Multi-step onboarding form (no page reloads)
- Consent screen
- UserProfile creation in database
- GradScore v0 rule engine (Python FastAPI, deploy to Railway)
- Claude API integration for WOW card
- WOW card reveal screen with animation

**Why now:** This is the primary hook. Demo starts here.

### Day 5–6: Dashboard + GradScore Deep Dive
**Build:** Dashboard all sections + full GradScore module
- Journey bar
- Dynamic CTA card logic
- GradScore widget (score + color ring)
- Weekly task list (rule-based generation)
- Module navigation grid
- GradScore deep dive page: full 8-factor breakdown + placement predictions + explainability

**Why now:** Dashboard is what users see every day. GradScore is the core differentiator.

### Day 7: Seed Data + University Database
**Build:** University + program database (200+ entries)
**Format:** JSON seed file → import to Supabase
**Fields:** name, country, rank, field, avg_gpa, avg_gre, placement_rate, avg_salary, cost
**Sources:** NIRF, QS Rankings, LinkedIn Salary Insights, Times Higher Education

---

## Week 2: Intelligence + Conversion

### Day 8–9: Planning Modules
**Build:** Discover + Requirements + Admission Predictor
- University search and shortlisting
- Program comparison view
- Requirements display per shortlisted program
- Timeline generator (based on target intake)
- Admission probability rule engine
- AI explanation of probability

### Day 10: ROI Reality Engine
**Build:** Full financial simulation + narrative
- Input form (cost, loan amount, family contribution)
- Calculation engine (salary vs. EMI vs. tax vs. living cost)
- Year 1–5 cash flow chart (Recharts)
- AI-generated ROI narrative (Claude API)
- Parent summary generator (HTML → PDF via API)

### Day 11: AI Mentor Chatbot
**Build:** Floating chatbot on all pages
- Chat UI component (floating button → slide-up panel)
- Claude API integration with full system prompt
- User profile context injection
- Module routing responses

### Day 12: Loan Conversion Flow
**Build:** AI Loan Readiness Coach + Loan Application Engine
- Mock loan interview (conversational, Claude API)
- Loan Readiness Report generation
- Loan application form (dual mode)
- Document upload + Google Vision OCR
- Application JSON storage
- Submission confirmation screen

### Day 13: NBFC Console + Community
**Build:** Supervisor console + community basics
- NBFC login route (separate from student login)
- Individual applicant view with all data + AI summary
- Portfolio risk dashboard (basic charts)
- Community groups (auto-joined by profile)
- Post creation and display

### Day 14: Polish + Demo Prep
**Build:** Gamification + notifications + demo data
- GradPoints tracking + streak system
- 3 pre-built demo student profiles (different risk bands)
- End-to-end flow test: onboarding → GradScore → ROI → loan application → NBFC view
- Landing page final polish
- Mobile responsiveness check

---

# SECTION 8 — BUSINESS + ENGAGEMENT SAFETY CHECK

## Is This Engaging Enough? ✅ YES (with all modules built)

The 60-second WOW moment, GradScore that changes on actions, weekly tasks, streaks, community, and AI mentor together create a habit loop that brings users back 3–5 times per week during the study planning phase. No existing competitor has this combination.

**Risk:** If the community is empty at launch, it feels dead. Mitigation: Seed with 50 campus ambassador posts before public launch. AI Mentor posts fill each group daily.

## Is This Realistic to Build? ✅ YES (in 14 days for hackathon demo)

Every module described is buildable with:
- Next.js (no novel framework)
- Supabase (no complex database ops)
- Claude API (no ML training required)
- Python rule engine (no dataset required)

The most complex pieces (OCR, NBFC console) are achievable in 1 day each using existing APIs.

## Is This Overbuilt? ⚠️ PARTIALLY

Module 12 (Scale Features) is explicitly post-MVP. Do not attempt to build it for the hackathon. Document it in the architecture deck as Phase 2.

The SOP Writer is a Scale feature for the demo — describe it, show a mockup, but do not spend time building it during the 14 days.

## Is This Trustable? ✅ YES

Six trust mechanisms are built in:
1. Human-in-the-loop disclosure on all AI outputs
2. Source citations on all data
3. DPDP-compliant consent
4. Parent summary feature
5. Explainability on all scores
6. Loan readiness coach (positions GradRight as on the student's side)

## Is This Differentiated? ✅ YES

The GradScore + ROI Reality Engine combination does not exist anywhere in the Indian market. The Career Pact post-loan engagement does not exist. The NBFC-side risk intelligence layer does not exist in any student platform.

**Three-line pitch:**
"GradRight is the only platform that tells you your exact career risk before you take an education loan — and then helps you reduce that risk. We're not just a loan platform. We're a career-aware finance companion."

---

# SECTION 9 — FINAL IMPLEMENTATION COMMAND CENTER

## Exact Execution Order for Your Team

### Step 1 (Day 1 morning): Set up all accounts
- Vercel account → connect GitHub repo
- Supabase account → create project → note connection string
- Anthropic account → get API key
- Google Cloud → enable OAuth + Vision API
- Railway account → for Python backend
- NewsAPI account → get key
- SendGrid account → get key

### Step 2 (Day 1 afternoon): Initialize project
```bash
npx create-next-app@latest gradright --typescript --tailwind --app
cd gradright
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install next-auth @auth/supabase-adapter
npm install framer-motion recharts react-hook-form zod
npm install @radix-ui/react-* (shadcn components)
```

### Step 3 (Day 1 evening): Set up Python backend
```bash
mkdir gradright-ai-engine
cd gradright-ai-engine
pip install fastapi uvicorn anthropic google-cloud-vision python-multipart
```
Deploy to Railway immediately (so endpoint is live for Next.js to call).

### Step 4 (Day 2): Build auth flow end-to-end
Landing page → Signup → Login → Basic session → Redirect to /onboarding

### Step 5 (Day 3): Build onboarding + WOW card
7-question flow → UserProfile creation → GradScore v0 calculation → WOW card reveal

Test: Sign up as a student and see a personalized WOW card within 3 minutes.

### Step 6 (Day 4–5): Build dashboard + GradScore page
Dashboard with all 8 sections → GradScore deep dive with full breakdown

Test: Update profile → see GradScore change in real time.

### Step 7 (Day 6): Seed the database
Write seed script for 200 universities + programs. Run it. Verify data.

### Step 8 (Day 7): Build Discover + Requirements + Admission Predictor
University search → shortlisting → requirements view → admission probability

Test: Shortlist 3 universities and see probability for each.

### Step 9 (Day 8): Build ROI Reality Engine
Financial inputs → simulation → chart → AI narrative → parent summary

Test: Input ₹45L loan, CS MS in Canada, see full financial simulation.

### Step 10 (Day 9): Build AI Mentor chatbot
Floating button → chat panel → Claude API integration → context injection

Test: Ask "what should I do to improve my GradScore?" and get a profile-specific answer.

### Step 11 (Day 10): Build loan conversion flow
AI Loan Readiness Coach → Mock interview → Loan Readiness Report → Loan Application Engine (both modes)

Test: Complete loan interview, see readiness report, submit mock application.

### Step 12 (Day 11): Build NBFC console
Separate /nbfc route → applicant list → individual applicant view → portfolio dashboard

Test: Log in as NBFC supervisor, see submitted application with GradScore and AI summary.

### Step 13 (Day 12): Build community + gamification
Community groups → post + comment → GradPoints tracking → streak system → notifications (in-app)

### Step 14 (Day 13): Build demo data + end-to-end test
Pre-populate 4 demo profiles:
- Profile 1: Tier 1 institute, CS, strong internships → GradScore 820, Low Risk
- Profile 2: Tier 2 institute, MBA, some work exp → GradScore 620, Medium Risk
- Profile 3: Tier 3 institute, nursing, no internships → GradScore 380, High Risk
- Profile 4: You (team member's realistic profile) → live demo

Test full journey for each profile.

### Step 15 (Day 14): Final polish + landing page
Mobile responsiveness fixes → landing page final version → Vercel production deploy → custom domain (gradright.in or similar)

### Step 16 (Pitch Deck): Document what you built
10-slide deck must cover:
1. Problem (30 seconds to explain)
2. The merge insight (how PS1 + PS2 become one product)
3. GradRight overview + two-sided value
4. GradScore — the core differentiator (show the formula, the explainability, the NBFC use)
5. User journey (the WOW moment → conversion flow)
6. AI architecture (the 5 AI layers)
7. NBFC Console (show portfolio analytics, early warning)
8. Growth engine + zero-human loop (document the 10 rules)
9. Business model + revenue streams
10. Live demo link + team

---

## Post-Launch (Week 3 and beyond):

- Launch campus ambassador program (target 20 campuses in Week 3)
- Publish first 5 SEO blog articles
- Submit for Poonawalla partnership / pilot
- Begin collecting real user data to improve GradScore model
- Build Phase 2: SOP Writer, Scholarship Tracker, Alumni Network

---

# APPENDIX: DATA SOURCES FOR SEEDING

## University Placement Data (offline, seed once):
- NIRF Rankings 2024 (public): institute placement rates for Indian universities
- QS World University Rankings: for foreign universities
- LinkedIn Salary Insights: salary bands by program × country
- Times Higher Education: supplementary ranking data

## Job Market Data (quarterly update):
- India Labour Bureau reports (public)
- US Bureau of Labor Statistics (public)
- UK Office for National Statistics (public)
- Canadian government job market data (public)

## Scholarship Data (seed once, update quarterly):
- Inlaks Shivdasani Foundation (India)
- Tata Scholarship (Cornell)
- AAUW International Fellowship
- Fulbright-Nehru scholarship
- Commonwealth Scholarship

---

*This document is the single source of truth for GradRight's implementation. Every team member, every module, every AI integration must reference this before building anything.*

*Last updated: Hackathon Phase 2 (Detailed Prototype Submission)*

---
**GradRight** — *Your grades got you here. GradRight gets you funded and hired.*
