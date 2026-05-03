# GradRight — Optimized Cursor Prompts v2
# One prompt at a time. @Codebase enabled. In order listed.
# Priority: 🔴 P1 (demo killers) → 🟠 P2 (PS2) → 🟡 P3 (PS1) → 🔵 P4 (polish)

---

## EXECUTION ORDER
1. P1-A: Fix Admission Predictor (FAKE → REAL)
2. P1-B: Fix Application Timeline (MISNAMED → REAL)
3. P1-C: Fix Dashboard Module Routes
4. P2-A: AI Career Navigator
5. P2-B: Live News Feed
6. P2-C: Referral + Score Share
7. P2-D: Smart In-App Nudges
8. P2-E: Post-Disbursement Monitoring
9. P2-F: Dynamic Loan Rates
10. P3-A: Lender Early-Alert System
11. P3-B: Placement Cell + Macro Inputs
12. P4-A: SEO + Open Graph
13. P4-B: Landing Page + Public Demo Calculator
14. P4-C: Demo Accounts + Login Cards
15. P4-D: Loading / Empty / Error States
16. P4-E: Mobile Responsiveness
17. P4-F: Rate Limiting + Security
18. P4-G: Deployment Config + Health Check
19. FINAL: Verification Checklist

---

## 🔴 PROMPT P1-A — Fix Admission Predictor (CRITICAL — FAKE → REAL)

```
@Codebase

The Admission Predictor is currently FAKE: the UI claims it exists but there is no Next.js API route and no page. The backend stub is in risk-service/main.py. Fix this end-to-end.

READ FIRST: risk-service/main.py (find /admission endpoint), risk-service/scorer.py, gradright-web/app/api/ai/risk-score/route.ts (use as call pattern), gradright-web/lib/financing/eligibility-engine.ts (rule engine pattern), gradright-web/app/(dashboard)/career/page.tsx (UI pattern).

--- CREATE: gradright-web/app/api/ai/admission/route.ts ---

POST handler. Zod-validate input:
{ cgpa: number, degree: string, targetUniversity: string, targetCourse: string, country: string, testScores: { gre?: number, gmat?: number, ielts?: number, toefl?: number }, workExperienceYears: number, publications: number, extracurriculars: number }

Logic:
1. Try calling RISK_ENGINE_URL/admission (use same fetch pattern as risk-score route). Timeout 5s.
2. If RISK_ENGINE_URL unset or call fails, use this inline fallback (no random numbers):
   score = (cgpa/10)*35 + (normaliseTestScore(testScores)*25) + (tierMatch(country,targetUniversity)*20) + ((publications*5 + extracurriculars*5)*20/100)
   Clamp score 0-100.
3. Call Anthropic API to generate aiSummary (2 sentences, honest, specific). Use generate-career-risk-summary.ts as pattern.
4. Return: { admissionProbability: number, safetySchools: string[], matchSchools: string[], reachSchools: string[], keyStrengths: string[], keyWeaknesses: string[], aiSummary: string }

Auth required. Handle all errors with typed responses.

--- CREATE: gradright-web/app/(dashboard)/plan/admission/page.tsx ---

3-step form:
- Step 1: CGPA (number input 0-10), Degree Type (dropdown), Graduation Year
- Step 2: GRE/GMAT/IELTS/TOEFL scores (all optional, clear labels)
- Step 3: Country (dropdown), Target Universities (3 text inputs), Target Course

Results section (shown after submit):
- Large circular ring showing probability % (pure CSS, no library)
- Three columns: Safety Schools / Match Schools / Reach Schools (3 items each)
- AI summary in italic card
- Green badges for strengths, amber for weaknesses
- CTA button: "Calculate Loan for [targetUniversity]" → /financing
- Loading skeleton during API call. Error card on failure.
- Fully responsive at 375px. Match existing glass-card design system.

Add export const metadata = { title: "Admission Predictor", description: "Check admission chances for your target universities." }

--- MODIFY: gradright-web/lib/dashboard/module-registry.ts ---
Change "plan" route from /onboarding to /plan/admission.

--- MODIFY: gradright-web/components/dashboard/PrimaryCTACard.tsx ---
Update plan-stage CTA label to "Check Your Admission Chances" and href to /plan/admission.

VERIFY: POST /api/ai/admission returns valid JSON. /plan/admission loads and shows results. Fallback works without RISK_ENGINE_URL.
```

---

## 🔴 PROMPT P1-B — Fix Application Timeline (MISNAMED → REAL)

```
@Codebase

The route gradright-web/app/api/ai/timeline/route.ts is actually a document checklist — not an application timeline. This is a PS2 required feature marked MISSING. Fix without deleting the checklist.

READ FIRST: gradright-web/app/api/ai/timeline/route.ts (current file — preserve it), gradright-web/lib/ai/generate-loan-doc-checklist.ts, gradright-web/app/api/ai/chat/route.ts (LLM call pattern), gradright-web/lib/db/schema/ (user profile structure).

--- RENAME: gradright-web/app/api/ai/timeline/route.ts → gradright-web/app/api/ai/document-checklist/route.ts ---
Add comment at top: // Document Checklist API — see application-timeline for the real timeline.
Update any imports referencing the old path.

--- CREATE: gradright-web/app/api/ai/application-timeline/route.ts ---

POST handler. Input: { targetIntake: string, targetCountry: string, targetUniversities: string[], currentDate: string, profileData: object }

Call Anthropic API with this prompt structure:
"Generate a week-by-week application timeline for an Indian student targeting [targetIntake] in [targetCountry]. Return ONLY valid JSON: { totalWeeks: number, intakeDate: string, phases: [{ phaseName: string, startWeek: number, endWeek: number, color: 'blue'|'amber'|'green'|'red', milestones: [{ week: number, date: string, task: string, priority: 'high'|'medium'|'low', daysFromNow: number, isOverdue: boolean }] }], upcomingDeadlines: [{ task: string, date: string, daysLeft: number }], aiTip: string }"

Parse JSON safely (try/catch). Fallback: rule-based timeline using targetIntake to calculate static phases (GRE Prep → IELTS → Applications → Visa → Loan → Arrival).
Auth required.

--- CREATE: gradright-web/app/(dashboard)/plan/timeline/page.tsx ---

Top: "Your Application Timeline" heading + target intake badge.
Intake selector: Fall 2025 / Spring 2026 / Fall 2026 dropdown — changing it re-fetches.
Visual horizontal timeline: CSS flexbox bar divided by phase, each segment colored per the color field.
Milestone list below: chronological cards with week, date, task, priority badge. Overdue = red + ⚠️ icon.
Sidebar/bottom: top 5 Upcoming Deadlines cards. AI tip in highlighted card at bottom.
Loading skeleton while API call runs. Responsive at 375px. Match existing design system.

Add export const metadata = { title: "Application Timeline", description: "Your personalised application deadline tracker." }

Add timeline link to main dashboard (same card style as other module cards).

VERIFY: /api/ai/document-checklist still works. POST /api/ai/application-timeline returns valid JSON. /plan/timeline shows visual timeline. Changing intake date re-fetches.
```

---

## 🔴 PROMPT P1-C — Fix Dashboard Module Routes

```
@Codebase

READ: gradright-web/lib/dashboard/module-registry.ts, gradright-web/components/dashboard/PrimaryCTACard.tsx, gradright-web/app/(hub)/dashboard/page.tsx.

Audit all module routes. Fix any route that sends users to wrong pages:
- "plan" must go to /plan/admission (not /onboarding)
- "career" must go to /career (verify this works)
- "finance" must go to /financing
- "apply" must go to /loan/apply or /loan/application
- "community" must go to /community if it exists

In PrimaryCTACard.tsx, make the CTA text and destination match the actual page the user will land on.

Add a "Career Navigator" card to the dashboard module grid with href /career/navigator and description "Find your best-fit universities with AI".
Add an "Application Timeline" card with href /plan/timeline.

VERIFY: Click every module card on the dashboard. Each lands on the correct functional page. No card routes to /onboarding.
```

---

## 🟠 PROMPT P2-A — AI Career Navigator

```
@Codebase

PS2 requires a structured AI Career Navigator — not just a chatbot. Build it as a separate page.

READ FIRST: gradright-web/app/api/ai/chat/route.ts (LLM pattern), gradright-web/lib/ai/prompts/mentor.ts, risk-service/data/sector_demand.json, risk-service/data/nirf_data.json.

--- CREATE: gradright-web/app/api/ai/career-navigator/route.ts ---

POST. Zod input: { currentDegree: string, currentCGPA: number, targetField: string, budgetRange: string, preferredCountries: string[], careerGoal: string, workExperienceYears: number }

Call Anthropic API. System prompt instructs model to return ONLY valid JSON:
{
  topRecommendations: [{ rank, country, university, program, whyThisFits, estimatedCost: { tuition, living, currency }, avgStartingSalary, roiScore, admissionDifficulty: "safety"|"match"|"reach", employmentRate, visaFriendliness: "high"|"medium"|"low" }],
  bestCountryForYou: string,
  bestFieldForYou: string,
  reasoning: string,
  alternativePaths: [{ path, pros, cons }],
  nextSteps: string[]
}

Return top 5 recommendations. Parse safely with fallback (if JSON parse fails, return 3 hardcoded example recommendations based on targetField + budgetRange). Rate limit: apiRateLimiters.ai. Auth required.

--- CREATE: gradright-web/app/(dashboard)/career/navigator/page.tsx ---

Input form (single page, not multi-step):
- Current Degree (text), CGPA (slider 5-10), Target Field (dropdown: Software/Tech, Data Science, Finance/MBA, Healthcare, Engineering, Other), Budget Range (dropdown: Under 20L/20-40L/40-60L/60L+), Preferred Countries (multi-select chips: USA UK Canada Germany Australia), Career Goal (text, max 200 chars), Work Experience (slider 0-10 years)
- "Find My Best Fit" primary button

Loading state: animated skeleton cards (10-15s expected wait — good UX critical).

Results:
- Top recommendation: featured full-width card with ROI score as large number, difficulty badge, country flag emoji, cost breakdown, avg salary
- 4 other recommendations: 2×2 grid of cards (same fields but compact)
- "Best Country" + "Best Field" as pill badges at top
- AI Reasoning: italic info card
- Alternative Paths: collapsible accordion
- Next Steps: numbered checklist
- Bottom CTA: "Calculate Loan for [top university name]" → /financing

Back button resets form. Responsive at 375px.
Add export const metadata = { title: "Find Your Best University", description: "AI Career Navigator for Indian students planning abroad." }

Add "Find My Best University →" hero CTA card at top of gradright-web/app/(dashboard)/career/page.tsx.

VERIFY: POST /api/ai/career-navigator returns 5 recommendations. Fallback works. Loading skeleton shows. CTA links to financing.
```

---

## 🟠 PROMPT P2-B — Live News Feed (Replace Static Mock)

```
@Codebase

Dashboard news is hardcoded in gradright-web/lib/dashboard/dashboard-news.ts and gradright-web/lib/ai/risk-engine/data/mock-news.ts with example.com URLs. Replace with live or AI-generated content.

READ FIRST: gradright-web/lib/dashboard/dashboard-news.ts, gradright-web/lib/ai/risk-engine/data/mock-news.ts, gradright-web/app/api/ai/digest/route.ts (AI generation pattern). Find the dashboard component that renders news by searching for dashboard-news import.

--- CREATE: gradright-web/lib/services/news-service.ts ---

async function getCachedDashboardNews(): Promise<NewsArticle[]>

NewsArticle type: { title: string, summary: string, url: string, source: string, publishedAt: string, category: "admissions"|"loans"|"career"|"visa"|"general", imageEmoji: string }

Logic (in order, stop at first success):
1. If NEWS_API_KEY env set: fetch https://newsapi.org/v2/everything?q=study+abroad+india+education&language=en&pageSize=6&apiKey={NEWS_API_KEY}
2. Else if GNEWS_API_KEY env set: fetch https://gnews.io/api/v4/search?q=study+abroad+education+india&lang=en&token={GNEWS_API_KEY}&max=6
3. Else: call Anthropic API to generate 6 realistic news items about study abroad for Indian students. Return as same NewsArticle shape. Mark source as "AI Generated".

Cache result in module-level Map<string, { articles: NewsArticle[], fetchedAt: number }>. Cache key "dashboard-news", TTL 4 hours.

Export getCachedDashboardNews.

--- CREATE: gradright-web/app/api/content/news/route.ts ---
GET. Auth required. Calls getCachedDashboardNews(). Returns { articles, generatedAt, source: "newsapi"|"gnews"|"ai" }. Add "Last updated: X minutes ago" in response.

--- MODIFY: gradright-web/lib/dashboard/dashboard-news.ts ---
Replace static mock return with a call to getCachedDashboardNews(). Keep the same return shape.

In the dashboard news component: show a small "Source: NewsAPI" or "AI Generated" label on the news section. This proves to judges it's real.

VERIFY: Dashboard news shows real or AI-generated articles. No example.com URLs remain. News section has a "last updated" indicator.
```

---

## 🟠 PROMPT P2-C — Referral System + Shareable Score Card

```
@Codebase

Audit found: referral_signup XP type exists in gradright-web/lib/gamification/xp-taxonomy.ts but there is NO referral UX, no share buttons, no referral link generation. Build the complete referral flow.

READ FIRST: gradright-web/lib/db/schema/ (users table — check for referral_code field), gradright-web/app/api/user/award-xp/route.ts, gradright-web/lib/gamification/xp-taxonomy.ts, gradright-web/app/(dashboard)/career/page.tsx (for score card placement).

--- SCHEMA: Add to users table if not present ---
referral_code: text unique (generated on user creation: nanoid(8))
referred_by: uuid nullable (foreign key to users)
File: gradright-web/lib/db/migrations/add-referral-fields.ts (Drizzle migration)

--- CREATE: gradright-web/app/api/referral/route.ts ---
GET: Returns { referralCode: string, referralUrl: string, referralCount: number, xpEarned: number } for authenticated user.
POST /api/referral/claim: Body { refCode: string }. Awards 150 XP to referrer (use xp-taxonomy REFERRAL_SIGNUP action) and 50 XP to new user. Idempotent — check if already claimed. Auth required.

--- CREATE: gradright-web/components/referral/ReferralCard.tsx ---
Card component showing:
- "Invite friends, earn XP" heading
- User's referral URL (NEXT_PUBLIC_APP_URL + /signup?ref={code})
- "Copy Link" button (navigator.clipboard.writeText, shows "Copied!" toast on success)
- WhatsApp share button: https://wa.me/?text=I+just+got+my+placement+risk+score+on+GradRight.+Check+yours:+{url}
- Twitter/X share button: https://twitter.com/intent/tweet?text=...
- Count: "X friends joined using your link"
Add this card to the dashboard.

--- CREATE: gradright-web/components/career/PlacementScoreCard.tsx ---
Shareable score card component:
- GradRight branded card (dark bg, white text, logo)
- Large placement risk score number + Low/Medium/High badge
- 3-month / 6-month / 12-month placement probability as progress bars
- Predicted salary range
- "Generated by GradRight.in" watermark
- "Share My Score" button: uses Web Share API (navigator.share) with fallback to copy URL
- The share URL: /career?shared=true shows a read-only version of the card

Add this card to gradright-web/app/(dashboard)/career/page.tsx (below the main risk score section).

On signup: if URL has ?ref=CODE, store in sessionStorage and claim after auth completes (call /api/referral/claim from the onboarding completion handler).

VERIFY: GET /api/referral returns unique code per user. Copy link works. Share buttons open correct URLs. POST /api/referral/claim awards XP. Score card renders with real data.
```

---

## 🟠 PROMPT P2-D — Smart In-App Nudge System

```
@Codebase

Currently only weekly email digest exists. PS2 requires in-app nudges based on journey stage. Build a banner nudge system.

READ FIRST: gradright-web/lib/db/queries/nudge_log.ts (or find nudge_log in schema), gradright-web/lib/db/schema/, gradright-web/app/(dashboard)/page.tsx (main dashboard layout).

--- CREATE: gradright-web/lib/nudges/nudge-rules.ts ---

type JourneyStage = "exploring"|"researching"|"applying"|"loan-ready"|"applied"
type NudgeRule = { id: string, stages: JourneyStage[], condition: (p: UserNudgeProfile) => boolean, message: string, cta: string, ctaUrl: string, priority: 1|2|3, icon: string, cooldownHours: number }

UserNudgeProfile type: { completionPercent: number, hasRunAdmissionPredictor: boolean, hasTimeline: boolean, riskLabel: string, hasCheckedEligibility: boolean, lastActiveHoursAgo: number, hasUsedCareerNavigator: boolean, journeyStage: JourneyStage }

Export NUDGE_RULES array with these 7 rules:
1. id:"profile-incomplete" stages:["exploring","researching"] condition:p.completionPercent<70 message:"Complete your profile to unlock accurate placement predictions" cta:"Complete Profile" ctaUrl:"/onboarding" priority:1 icon:"👤" cooldown:48
2. id:"no-admission-check" stages:["researching","applying"] condition:!p.hasRunAdmissionPredictor message:"Check your admission chances before applications close" cta:"Check Now →" ctaUrl:"/plan/admission" priority:2 icon:"🎓" cooldown:72
3. id:"no-timeline" stages:["applying"] condition:!p.hasTimeline message:"Your application deadline may be closer than you think" cta:"Generate Timeline →" ctaUrl:"/plan/timeline" priority:2 icon:"📅" cooldown:48
4. id:"high-risk" stages:["applying","loan-ready"] condition:p.riskLabel==="high" message:"Your placement risk is High — here's what to do" cta:"See Recommendations →" ctaUrl:"/career" priority:1 icon:"⚠️" cooldown:96
5. id:"no-loan-check" stages:["applying","loan-ready"] condition:!p.hasCheckedEligibility message:"You haven't checked your loan eligibility yet" cta:"Check Eligibility →" ctaUrl:"/financing" priority:3 icon:"💰" cooldown:72
6. id:"streak-risk" stages:["exploring","researching","applying","loan-ready"] condition:p.lastActiveHoursAgo>22 message:"Keep your streak alive! You haven't visited today" cta:"Continue →" ctaUrl:"/career" priority:2 icon:"🔥" cooldown:20
7. id:"navigator-unseen" stages:["exploring","researching"] condition:!p.hasUsedCareerNavigator message:"Let AI find your best-fit universities based on your profile" cta:"Find My Best Fit →" ctaUrl:"/career/navigator" priority:3 icon:"🧭" cooldown:48

--- CREATE: gradright-web/app/api/nudges/active/route.ts ---
GET. Auth required. Build UserNudgeProfile from user's DB record. Evaluate all NUDGE_RULES, filter by stage and condition. Filter out rules shown within cooldownHours (check nudge_log). Sort by priority. Return top 3: { nudges: ActiveNudge[] }.

--- CREATE: gradright-web/components/nudges/NudgeBanner.tsx ---
Client component. Fetches /api/nudges/active on mount. Shows TOP nudge as a banner:
- 52px tall, full width, flush with top of page content
- Left: emoji. Center: message (14px). Right: CTA button + X dismiss button.
- Priority 1 = amber-50 bg with amber-600 left border. Others = blue-50 with blue-600 border.
- Slide-down animation on appear (CSS transition). Slide-up on dismiss.
- On dismiss: POST to nudge_log table to record dismissal (respect cooldown). 
- If no nudges: return null.

Add <NudgeBanner /> at top of gradright-web/app/(dashboard)/page.tsx content area.

VERIFY: /api/nudges/active returns relevant nudges for a test user. Banner appears on dashboard. Dismissing hides it. Returns null when no rules match.
```

---

## 🟠 PROMPT P2-E — Post-Disbursement Monitoring

```
@Codebase

The product lifecycle currently stops at loan submission. PS2 requires post-disbursement monitoring. Build it.

READ FIRST: gradright-web/lib/db/schema/ (loan_applications table), gradright-web/app/api/loan/application/route.ts, gradright-web/lib/gamification/xp-taxonomy.ts, gradright-web/components/nbfc/ (NBFC UI patterns).

--- CREATE: gradright-web/lib/db/migrations/add-disbursement-tracking.ts ---
Add to loan_applications (Drizzle migration):
disbursement_date, repayment_start_date (timestamps nullable), loan_amount_disbursed (decimal nullable), current_repayment_status ("on_track"|"at_risk"|"delayed" nullable), placement_status ("searching"|"placed"|"not_placed" nullable), placement_date (timestamp nullable), placed_company (text nullable), placed_salary_lpa (decimal nullable).

--- CREATE: gradright-web/app/api/loan/placement-update/route.ts ---
POST. Body: { applicationId: string, placementStatus: string, placedCompany?: string, placedSalaryLpa?: number, placementDate?: string }
Auth: user must own the application (check user_id match).
Updates placement fields. If placed: award 200 XP. Insert into lender_alerts table (type:"placement_confirmed", severity:"info") to notify NBFC. Return success.

--- CREATE: gradright-web/app/(dashboard)/loan/status/page.tsx ---
Show only if user has an approved/disbursed loan. Fetch from /api/loan/status.

Sections:
1. Loan Summary Card: amount disbursed, EMI (standard reducing balance formula), next EMI date, remaining tenure in months.
2. Repayment Timeline: CSS progress bar — "Month X of Y completed".
3. Placement Status Card:
   - Current badge (Searching / Placed / Not Placed)
   - "I Got Placed! 🎉" button → modal with fields: Company Name, Role, Annual Salary (LPA), Start Date → submits to /api/loan/placement-update
   - If placed: show company, salary, "Congratulations! 🎉" banner
   - If searching >6 months: show "Resources to help you" with links to /career/navigator and /career
4. EMI Affordability Check: salary input → shows EMI as % of income → green (<30%), amber (30-40%), red (>40%).
5. "Need Help?" section: Poonawalla Fincorp contact link + restructuring request link (static).

--- CREATE: gradright-web/components/nbfc/DisbursedPortfolioPanel.tsx ---
Table of all disbursed loans: student name, disbursement date, repayment start, placement status badge, repayment status badge, months since disbursement, "Send Nudge" button (calls existing digest endpoint to email student).

--- MODIFY: NBFC status routes ---
When loan_applications status changes to "approved": set repayment_start_date = NOW() + 6 months.
When status changes to "disbursed": set disbursement_date = NOW().

Add "My Loan Status" to student dashboard nav (visible only when loan is approved/disbursed).

VERIFY: /loan/status page shows correct data for a test disbursed loan. "I Got Placed" flow awards XP and notifies NBFC. EMI calculation is correct (P*r*(1+r)^n / ((1+r)^n - 1)).
```

---

## 🟠 PROMPT P2-F — Dynamic Personalised Loan Rates

```
@Codebase

Interest rate (11.5%) and tenure (120 months) are hardcoded constants in gradright-web/lib/financing/eligibility-engine.ts lines 17-19. PS2 requires dynamic offers based on profile strength.

READ FIRST: gradright-web/lib/financing/eligibility-engine.ts (entire file), find the component rendering eligibility (search for eligibility-engine import), gradright-web/lib/db/schema/ (risk_scores table).

--- CREATE: gradright-web/lib/financing/lender-config.ts ---
export const LENDER_CONFIG = {
  poonawalla: {
    name: "Poonawalla Fincorp",
    baseRate: 11.5,
    riskPremiums: { low: 0, medium: 1.0, high: 2.5 },
    profileBonuses: { topTierInstitute: -0.5, cgpaAbove85: -0.25, twoOrMoreInternships: -0.25 },
    minRate: 9.5, maxRate: 15.0,
    tenure: { default: 120, byRisk: { low: 180, medium: 120, high: 84 } },
    maxLoanAmount: { domestic: 5000000, international: 15000000 },
    processingFee: 0.02
  }
}

type RateBreakdown = { baseRate: number, riskPremium: number, profileBonus: number, finalRate: number, tenure: number, explanation: string }

export function calculatePersonalisedRate(riskLabel: "low"|"medium"|"high", instituteTier: string, cgpa: number, internshipCount: number): RateBreakdown {
  const c = LENDER_CONFIG.poonawalla
  let rate = c.baseRate + c.riskPremiums[riskLabel]
  let bonus = 0
  if (instituteTier === "1") bonus += c.profileBonuses.topTierInstitute
  if (cgpa >= 8.5) bonus += c.profileBonuses.cgpaAbove85
  if (internshipCount >= 2) bonus += c.profileBonuses.twoOrMoreInternships
  const finalRate = Math.max(c.minRate, Math.min(c.maxRate, rate + bonus))
  return {
    baseRate: c.baseRate, riskPremium: c.riskPremiums[riskLabel], profileBonus: bonus,
    finalRate, tenure: c.tenure.byRisk[riskLabel],
    explanation: `Base ${c.baseRate}% + Risk ${c.riskPremiums[riskLabel]}% - Profile Bonus ${Math.abs(bonus)}% = ${finalRate.toFixed(2)}%`
  }
}

--- MODIFY: gradright-web/lib/financing/eligibility-engine.ts ---
Replace hardcoded 11.5 and 120 with calculatePersonalisedRate(riskLabel, instituteTier, cgpa, internshipCount).
Pass riskLabel and profile fields into the eligibility function (they're available from risk_scores table).
Include rateBreakdown in the eligibility function return value.

--- MODIFY: The financing hub eligibility display component ---
Show: personalised rate prominently (e.g. "12.0% p.a." in large text).
Add expandable "How is this calculated?" → shows RateBreakdown explanation line.
Add tenure clearly. Add monthly EMI. Add processing fee.
Add badge: "Your Rate" — green if low risk, amber if medium, red if high.
Add below: "If you improve to Low Risk, your rate would be {minRate}% — saving ₹{totalInterestDiff} over the loan tenure." (Calculate totalInterestDiff from the two EMI schedules.)

VERIFY: Low-risk student sees lower rate than high-risk student. Top-tier institute adds discount. Rate breakdown is shown and makes mathematical sense. No hardcoded 11.5 or 120 remains.
```

---

## 🟡 PROMPT P3-A — Lender Early-Alert System (NBFC)

```
@Codebase

The NBFC console exists but has NO proactive alert pipeline. PS1 requires lenders to get early alerts for high-risk borrowers. Build it.

READ FIRST: gradright-web/app/api/nbfc/ (all existing routes), gradright-web/lib/nbfc/require-nbfc-api.ts (auth pattern), gradright-web/lib/db/schema/ (loan_applications, risk_scores), gradright-web/components/nbfc/ (UI patterns), gradright-web/vercel.json (cron pattern).

--- CREATE: gradright-web/lib/db/migrations/add-lender-alerts.ts ---
Drizzle migration. Table lender_alerts:
id uuid pk, application_id uuid fk, student_id uuid fk, alert_type ("high_risk_score"|"risk_score_degraded"|"no_placement_signal"|"approaching_repayment"|"profile_incomplete"), severity ("critical"|"warning"|"info"), message text, ai_recommendation text, is_read bool default false, is_resolved bool default false, created_at timestamp, resolved_at timestamp nullable.

--- CREATE: gradright-web/lib/nbfc/alert-generator.ts ---
export async function generateAlertsForPortfolio(): Promise<{ alertsGenerated: number }>

Logic: Query all loan_applications where status IN ("approved","disbursed"). For each, get latest risk_score. Apply these rules (skip if unresolved alert of same type for same application already exists):
- Rule 1: risk_label==="high" → alert_type:"high_risk_score" severity:"critical"
- Rule 2: current risk_score < previous risk_score - 15 → alert_type:"risk_score_degraded" severity:"warning"  
- Rule 3: disbursement_date > 6 months ago AND placement_status IS NULL → alert_type:"no_placement_signal" severity:"warning"
- Rule 4: repayment_start_date within 30 days AND risk_label !== "low" → alert_type:"approaching_repayment" severity:"critical"

For each new alert: call Anthropic API (use existing AI pattern) with prompt: "In 2 sentences, what specific action should a lender take for a student with risk={riskLabel}, placement probability 6mo={prob6mo}%, sector={sector}, institute tier={tier}? Be specific." Store as ai_recommendation.

--- CREATE: gradright-web/app/api/nbfc/alerts/route.ts ---
GET: requireNbfcSupervisorApi. Query params: severity, is_read, page (default 1), limit (default 20). Join with loan_applications and users. Return { alerts, total, page }.

--- CREATE: gradright-web/app/api/nbfc/alerts/[alertId]/route.ts ---
PATCH. Body: { is_read?: boolean, is_resolved?: boolean }. requireNbfcSupervisorApi. Updates the alert.

--- CREATE: gradright-web/app/api/nbfc/alerts/summary/route.ts ---
GET. requireNbfcSupervisorApi. Returns { critical: number, warning: number, info: number, total: number, unread: number }.

--- CREATE: gradright-web/app/api/nbfc/alerts/generate/route.ts ---
GET (for Vercel cron). Verify Authorization header matches CRON_SECRET env. Calls generateAlertsForPortfolio(). Returns result.

--- MODIFY: gradright-web/vercel.json ---
Add cron: { "path": "/api/nbfc/alerts/generate", "schedule": "0 9 * * *" }

--- CREATE: gradright-web/components/nbfc/AlertsPanel.tsx ---
Alert list with tabs: All / Critical / Warning / Unresolved.
Each alert card: colored left border (red=critical, amber=warning, blue=info), student name + university + loan amount, alert message, AI recommendation in italics, "Resolve" button, "View Student" link, timestamp.
"Mark all as read" button. Empty state: "No active alerts — portfolio is healthy ✅" in green.
Red badge on NBFC nav showing unread count (fetches from /summary).

Add AlertsPanel to the NBFC dashboard page.

VERIFY: generateAlertsForPortfolio runs without errors. /api/nbfc/alerts returns paginated list. PATCH marks as resolved. Non-NBFC users get 403. Cron route requires CRON_SECRET.
```

---

## 🟡 PROMPT P3-B — Placement Cell Strength + Macro Labor Market Inputs

```
@Codebase

PS1 requires placement cell strength and macro labor market conditions as inputs to the scoring model. Both are missing.

READ FIRST: risk-service/scorer.py (full file — understand scoring factors and weights), risk-service/data/nirf_data.json, risk-service/data/sector_demand.json, risk-service/models.py.

--- MODIFY: risk-service/data/nirf_data.json ---
Add placement_cell_strength field (0-100 integer) to each institute record:
- IIT/IIM/BITS tier-1: 90-100
- Reputable private tier-2: 60-80
- State colleges tier-2: 50-70
- Tier-3: 20-45
Add if field doesn't exist. Keep all existing fields.

--- CREATE: risk-service/data/macro_labor.json ---
{
  "USA": { "employment_rate": 96.3, "tech_hiring_index": 78, "visa_difficulty": "medium", "last_updated": "2025-Q1" },
  "UK": { "employment_rate": 95.1, "tech_hiring_index": 71, "visa_difficulty": "high", "last_updated": "2025-Q1" },
  "Canada": { "employment_rate": 94.8, "tech_hiring_index": 74, "visa_difficulty": "low", "last_updated": "2025-Q1" },
  "Germany": { "employment_rate": 96.8, "tech_hiring_index": 82, "visa_difficulty": "medium", "last_updated": "2025-Q1" },
  "Australia": { "employment_rate": 95.5, "tech_hiring_index": 69, "visa_difficulty": "medium", "last_updated": "2025-Q1" },
  "India": { "employment_rate": 93.2, "tech_hiring_index": 65, "visa_difficulty": "none", "last_updated": "2025-Q1" }
}

--- MODIFY: risk-service/scorer.py ---
1. Add placement_cell_strength as Factor 8 (rename existing Factor 8 to Factor 9, shift weights):
   - Recalculate weights so all factors still sum to 100%
   - New weight distribution (adjust existing as needed to make room):
     placement_cell_strength: 10% weight
     Score: 90+ = 100pts, 70-89 = 70pts, 50-69 = 45pts, <50 = 20pts
   - Load from nirf_data.json using institute_tier as lookup key (or institute_name if available)

2. Add macro labor market as Factor 9 (5% weight, or fold into existing macro factor):
   - Load macro_labor.json at startup
   - Use target_country to look up employment_rate
   - Score: employment_rate >= 96 = 100pts, 94-96 = 70pts, <94 = 40pts
   - Combine with existing sector demand score: (sector_demand_score * 0.6 + macro_score * 0.4)

3. Add placement_cell_strength and target_country to the StudentProfile input model in models.py.
4. Update the explainability output to include these new factors in top_risk_factors.

--- MODIFY: gradright-web/lib/career/build-risk-engine-payload.ts ---
Add placement_cell_strength (derive from institute_tier: tier1=90, tier2=65, tier3=30) and target_country to the payload sent to the risk engine.

VERIFY: scorer.py calculates score with all factors including placement_cell_strength and macro. Factor weights still sum to 100. /api/ai/risk-score returns updated score. Explainability output includes new factors.
```

---

## 🔵 PROMPT P4-A — SEO + Open Graph

```
@Codebase

Audit: SEO score 3/10. gradright-web/app/layout.tsx has only a generic title. No per-page metadata, no OG image route, no sitemap.

READ FIRST: gradright-web/app/layout.tsx, all page.tsx files in gradright-web/app/(dashboard)/.

--- MODIFY: gradright-web/app/layout.tsx ---
Replace metadata with:
export const metadata: Metadata = {
  title: { default: "GradRight — AI Study Abroad & Education Finance", template: "%s | GradRight" },
  description: "India's AI platform for study abroad. Get admission predictions, placement risk scores, and personalised education loans. 10,000+ Indian students.",
  keywords: ["study abroad India","education loan","student loan abroad","admission predictor","GRE","IELTS","university predictor India"],
  openGraph: { type:"website", locale:"en_IN", url:"https://gradright.in", siteName:"GradRight", title:"GradRight — AI Study Abroad Platform", description:"Admission predictions + placement risk + education loans. Built for Indian students.", images:[{ url:"/og?title=GradRight&subtitle=AI-Powered Study Abroad Platform", width:1200, height:630 }] },
  twitter: { card:"summary_large_image", title:"GradRight", description:"AI-powered study abroad platform for Indian students" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gradright.in")
}

--- ADD: export const metadata to each page.tsx ---
/career/page.tsx: { title: "Career Risk Score", description: "AI-predicted placement risk and salary forecast." }
/career/navigator/page.tsx: { title: "Find Your Best University", description: "AI Career Navigator — best-fit universities and countries for your profile." }
/plan/admission/page.tsx: { title: "Admission Predictor", description: "Check admission probability for your target universities with AI." }
/plan/timeline/page.tsx: { title: "Application Timeline", description: "Personalised application deadline tracker." }
/financing/page.tsx: { title: "Loan Eligibility", description: "Personalised education loan eligibility and EMI calculator." }
/loan/status/page.tsx: { title: "My Loan Status", description: "Track your education loan and placement progress." }
NBFC pages: { title: "NBFC Dashboard | GradRight", robots: { index: false } }

--- CREATE: gradright-web/app/og/route.tsx ---
Edge runtime OG image generation (next/og ImageResponse, 1200×630):
import { ImageResponse } from 'next/og'
export const runtime = 'edge'
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'GradRight'
  const subtitle = searchParams.get('subtitle') || 'AI-Powered Study Abroad Platform'
  return new ImageResponse(<div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100%', backgroundColor:'#0f172a', padding:'60px', justifyContent:'center' }}><div style={{ fontSize:22, color:'#60a5fa', marginBottom:16 }}>GradRight</div><div style={{ fontSize:52, fontWeight:700, color:'white', lineHeight:1.2, marginBottom:20 }}>{title}</div><div style={{ fontSize:26, color:'#94a3b8' }}>{subtitle}</div><div style={{ position:'absolute', bottom:60, left:60, fontSize:18, color:'#60a5fa' }}>gradright.in</div></div>, { width:1200, height:630 })
}

--- CREATE: gradright-web/app/sitemap.ts ---
Return array of { url, lastModified, changeFrequency, priority } for: / (daily,1.0), /career (weekly,0.8), /career/navigator (weekly,0.8), /plan/admission (weekly,0.8), /financing (weekly,0.9), /plan/timeline (weekly,0.7).

VERIFY: Browser tab shows unique title on each page. /og?title=Test shows an image. /sitemap.xml is accessible. <meta property="og:title"> visible in page source.
```

---

## 🔵 PROMPT P4-B — Landing Page + Public Demo Calculator

```
@Codebase

Judges must sign in to see any value. Build a compelling landing page with a no-login demo calculator.

READ FIRST: gradright-web/middleware.ts (confirm / route is public), gradright-web/app/page.tsx (current landing page), gradright-web/lib/financing/eligibility-engine.ts (for demo calculation reference).

--- CONFIRM: gradright-web/middleware.ts ---
Ensure "/" route is NOT behind auth. If protected, add it to the public routes list.

--- CREATE: gradright-web/app/api/public/quick-risk/route.ts ---
POST. NO auth. Rate limit: 10 req/IP/min (in-memory counter — simple Map).
Input: { cgpa: number, instituteType: "iit-iim"|"tier1-private"|"tier2"|"other", internships: 0|1|2, targetField: string }
Rule-based calculation (fast, no external calls):
  score = (cgpa/10)*40 + { "iit-iim":40, "tier1-private":28, "tier2":18, "other":10 }[instituteType] + [0,10,20][internships] + { "Software/Tech":10, "Data Science":10, "Finance/MBA":7, "Healthcare":8 }[targetField] ?? 5
  riskLabel = score>=70?"Low":score>=45?"Medium":"High"
  placement6mo = Math.round(score * 0.75)
  oneLineSummary = generated based on riskLabel + instituteType combination (use if/else strings, no LLM call here)
Return: { riskScore: number, riskLabel, placementProbability6Months: number, oneLineSummary: string }
Must respond <500ms.

--- CREATE or REPLACE: gradright-web/app/page.tsx ---

Full landing page with these sections:

HERO: dark gradient (#0f172a to #1e293b). Headline "Know Your Chances. Fund Your Future." (60px desktop, 36px mobile, font-weight:800). Subheadline "India's first AI platform that predicts your placement risk AND funds your study abroad dream." Two CTAs: "Check My Admission Chances →" (primary, /signup) + "See How It Works" (secondary, smooth scroll to #how). Static mockup of the risk score card (pure HTML/CSS visual, not a real component).

DEMO CALCULATOR (id="demo"): "Try Right Now — No Login Needed" heading. Form with 4 inputs: CGPA slider (5.0-10.0, step 0.1, shows live value), Institute Type dropdown, Internships radio (0/1/2+), Target Field dropdown. "Calculate My Risk Score" button. On submit: POST /api/public/quick-risk. Shows result: risk score as large colored number + badge + one-line summary. Below result: "Get your full report free →" CTA to /signup. Loading spinner on button during call.

HOW IT WORKS: 4 steps horizontal (desktop) / vertical (mobile): 🎓 Build Profile (30 sec) → 🤖 Get AI Score → 🏫 Find Universities → 💰 Get Your Loan. Each: icon + title + one sentence.

FEATURES: 3 cards: "Admission Predictor" / "Placement Risk Score" / "Personalised Loan Rate".

SOCIAL PROOF: 3 student testimonial cards (realistic placeholders — Indian names, real universities, outcomes). Stats row: "10,000+ Students | ₹200Cr+ Facilitated | 85% Placement Rate | 40+ Countries" (add "Beta projections" footnote). 

FINAL CTA: "Start Your Study Abroad Journey" heading. Large "Create Free Account" button. "Takes 2 minutes. No credit card."

Design: premium, dark hero + white body, fully responsive. No heavy libs.

VERIFY: / loads without auth. Demo calculator shows results. /api/public/quick-risk responds <500ms. Page looks premium on 375px mobile.
```

---

## 🔵 PROMPT P4-C — Demo Accounts + Login Cards

```
@Codebase

Demo readiness is 5/10. Judges must type full profiles. Build demo accounts and auto-fill login cards.

READ FIRST: gradright-web/app/(auth)/login/page.tsx, gradright-web/lib/db/schema/ (users, student_profiles, risk_scores tables — understand all fields), gradright-web/lib/db/ (find existing seed patterns).

--- CREATE: gradright-web/lib/db/seed-demo-data.ts ---
Export async function seedDemoAccounts() that creates (upsert on email conflict):

Account 1 — "Arjun Sharma" (High Risk):
email: demo.student@gradright.in, password: Demo@GradRight1
Profile: B.Tech CS, CGPA 6.8, Manipal (tier2), 0 internships, targeting USA/Canada for MS CS, GRE 310, 0 work years, budget_band:"40_70L", 5-day streak, 340 XP.
Risk: label="high", score~380. One in-progress loan application (status:"draft").

Account 2 — "Priya Mehta" (Low Risk):
email: demo.student2@gradright.in, password: Demo@GradRight1
Profile: B.Tech from IIT Bombay (tier1), CGPA 9.1, 3 internships at top companies, targeting UK/Germany for MS Data Science, IELTS 7.5, 1 year work experience.
Risk: label="low", score~820. 12-day streak. Has run admission predictor (set hasRunAdmissionPredictor=true).

Account 3 — "NBFC Demo":
email: demo.nbfc@gradright.in, password: Demo@GradRight1
user_type: "nbfc_supervisor"
Pre-insert 8 loan applications in the DB from demo student 1 profile (varied statuses: submitted, under_review, approved). Pre-insert 3 lender_alerts (2 critical, 1 warning).

--- CREATE: gradright-web/scripts/seed-demo.ts ---
#!/usr/bin/env tsx
import { seedDemoAccounts } from '../lib/db/seed-demo-data'
seedDemoAccounts().then(() => { console.log('✅ Demo accounts seeded'); process.exit(0) }).catch(e => { console.error('❌', e); process.exit(1) })

Add to package.json: "seed:demo": "tsx scripts/seed-demo.ts"

--- MODIFY: gradright-web/app/(auth)/login/page.tsx ---
Below the login form add a "🎯 For Judges / Demo" section with 3 clickable cards:
Card 1: "High-Risk Student" — "See risk warnings, recommendations, loan alerts" — auto-fills email: demo.student@gradright.in
Card 2: "Low-Risk Student" — "See top score, navigator results, best loan rate" — fills demo.student2@gradright.in
Card 3: "NBFC Dashboard" — "See portfolio, alerts, risk monitoring" — fills demo.nbfc@gradright.in

All cards fill password "Demo@GradRight1" automatically.
onClick: setEmail(demoEmail); setPassword('Demo@GradRight1')
Small note: "Pre-filled data for demonstration."

When demo accounts log in: redirect to dashboard with ?tour=true query param. Add a simple 3-step tooltip guide (sessionStorage-gated, shown once): Step 1 points to risk score, Step 2 to career navigator, Step 3 to financing hub. Each tooltip has a "Next →" and "Skip" button.

--- MODIFY: README.md ---
Add at top:
## 🎯 Demo Accounts (For Judges & Evaluators)
| Role | Email | Password | Best for |
|------|-------|----------|----------|
| High-Risk Student | demo.student@gradright.in | Demo@GradRight1 | Risk warnings, recommendations |
| Low-Risk Student | demo.student2@gradright.in | Demo@GradRight1 | Low risk, navigator, best rate |
| NBFC Dashboard | demo.nbfc@gradright.in | Demo@GradRight1 | Portfolio, alerts, monitoring |

Live URL: [TO BE ADDED AFTER DEPLOY]
Setup: npm run seed:demo

VERIFY: npm run seed:demo runs without errors. Login page shows demo cards. Clicking auto-fills form. Logging in as demo.student shows complete profile (not empty onboarding). Logging in as demo.nbfc shows NBFC dashboard with data.
```

---

## 🔵 PROMPT P4-D — Loading / Empty / Error States

```
@Codebase

Many pages show blank content while loading or on errors. Fix all data-fetching pages with proper states.

READ FIRST: gradright-web/app/(dashboard)/page.tsx, gradright-web/app/(dashboard)/career/page.tsx, gradright-web/app/nbfc/(console)/portfolio/page.tsx, gradright-web/components/nbfc/ApplicationsPageClient.tsx.

--- CREATE: gradright-web/components/shared/LoadingStates.tsx ---
Export:
- SkeletonCard: ({ lines?: number }) → gray animated pulse div, lines number of skeleton text rows, one skeleton heading at top
- SkeletonTable: ({ rows?: number, cols?: number }) → animated table skeleton
- InlineLoader: small spinning circle (16px, CSS animation, no library)
- PageLoader: centered full-page spinner with "Loading..." text

--- CREATE: gradright-web/components/shared/EmptyStates.tsx ---
Export EmptyState: ({ icon: string, title: string, description: string, cta?: { label: string, href: string } })
Pre-built named exports:
- NoRiskScore: icon="🤖" title="No Risk Score Yet" description="Complete your profile to generate your placement risk score." cta: { label:"Complete Profile", href:"/onboarding" }
- NoLoanApplication: icon="📋" title="No Application Yet" description="Check your eligibility and start your application." cta: { label:"Check Eligibility", href:"/financing" }
- NoAlerts: icon="✅" title="Portfolio is Healthy" description="No active alerts. All monitored borrowers are on track." (green themed)
- NoNews: icon="📰" title="No news right now" description="Check back soon."

--- CREATE: gradright-web/components/shared/ErrorStates.tsx ---
Export ErrorCard: ({ message: string, onRetry?: () => void }) — red-tinted card, ⚠️ icon, message, optional "Try Again" button.

--- APPLY to these pages/components ---
For EACH component that calls an API, implement this 4-state pattern:
1. isLoading → show SkeletonCard or SkeletonTable
2. isError → show ErrorCard with onRetry calling the fetch function
3. isEmpty (data exists but empty) → show appropriate EmptyState
4. hasData → show actual content

Priority pages:
1. Dashboard main page (career summary, news feed, weekly tasks) → SkeletonCard for each section
2. Career/risk score page → SkeletonCard while risk score loads
3. Financing hub → SkeletonCard while eligibility calculates
4. NBFC applications list → SkeletonTable (5 rows × 6 cols)
5. NBFC alerts panel → NoAlerts when empty, SkeletonCard while loading
6. Career navigator results → SkeletonCard × 5 during LLM call (especially important — 10-15s wait)

For ALL submit/calculate buttons: add disabled={isLoading} and show <InlineLoader /> inside button text while loading. Prevent double-submission.

Install sonner if no toast library exists: npm install sonner. Add <Toaster /> to root layout.
Add success/error toasts to: loan application submit, placement update, XP award, referral claim, form submissions.

VERIFY: Dashboard shows skeleton cards (not blank) during load. ErrorCard appears with retry on API failure. Empty NBFC portfolio shows EmptyState. Submit buttons show spinner. Success actions show toast.
```

---

## 🔵 PROMPT P4-E — Mobile Responsiveness

```
@Codebase

Mobile responsiveness was not systematically verified. Fix the 5 most critical pages.

READ FIRST: List all files in gradright-web/app/(dashboard)/ and gradright-web/components/. Check gradright-web/tailwind.config.ts for breakpoints.

Apply these rules to EVERY page and major component. Fix violations:

RULE 1 — No horizontal scroll: Remove fixed widths >375px. Replace width:900px with max-width:900px+overflow handling. Wrap all <table> in <div className="overflow-x-auto w-full">.

RULE 2 — Touch targets 44px min: All buttons, links, icon buttons must have min-h-[44px] min-w-[44px].

RULE 3 — Navigation on mobile: If sidebar nav exists, hide on mobile (hidden lg:block or similar) and add a bottom navigation bar or hamburger. Bottom nav preferred for this audience.

RULE 4 — Forms full-width on mobile: All input fields: className="w-full". Labels above inputs (flex-col). Multi-step forms show "Step X of Y" on mobile.

RULE 5 — Grid collapse: 3+ column grids → 1 column on mobile. Use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3. 2-column grids may stay 2-col on mobile.

RULE 6 — Typography: H1 max text-3xl on mobile. Body minimum text-base (16px). Line height min 1.5.

RULE 7 — Modals: On mobile, modals should be near-full-screen (w-[calc(100vw-32px)] max-w-none). All modals need a clearly visible close button.

RULE 8 — CTAs full-width on mobile: Primary CTA buttons: w-full sm:w-auto.

Fix in this priority order:
1. Landing page (most visible)
2. Login + signup pages
3. Dashboard main page
4. Career/risk score page
5. Financing hub page

For each page you fix: test mentally at 375px width and 768px width.

VERIFY: No page causes horizontal scroll at 375px. All buttons are tappable (≥44px). Navigation works on mobile. Forms are usable on small screens.
```

---

## 🔵 PROMPT P4-F — Rate Limiting + Security Hardening

```
@Codebase

Only AI chat has rate limiting. All other APIs are unprotected. Add rate limiting everywhere and fix basic security issues.

READ FIRST: gradright-web/lib/ai/rate-limit.ts (existing rate limiter — understand the pattern), gradright-web/app/api/ai/chat/route.ts (how it's applied), gradright-web/next.config.js or next.config.ts, gradright-web/app/api/loan/documents/upload/route.ts.

--- CREATE: gradright-web/lib/security/rate-limiter.ts ---
Simple in-memory rate limiter (no Redis needed):
const store = new Map<string, { count: number; resetAt: number }>()
type RLConfig = { windowMs: number; max: number; prefix: string }
export function createRL(config: RLConfig) {
  return (id: string) => {
    const key = `${config.prefix}:${id}`, now = Date.now(), rec = store.get(key)
    if (!rec || now > rec.resetAt) { store.set(key, { count: 1, resetAt: now + config.windowMs }); return { ok: true, remaining: config.max - 1, resetAt: now + config.windowMs } }
    if (rec.count >= config.max) return { ok: false, remaining: 0, resetAt: rec.resetAt }
    rec.count++; return { ok: true, remaining: config.max - rec.count, resetAt: rec.resetAt }
  }
}
export const RL = {
  ai: createRL({ windowMs: 60_000, max: 10, prefix: 'ai' }),
  loan: createRL({ windowMs: 3_600_000, max: 5, prefix: 'loan' }),
  public: createRL({ windowMs: 60_000, max: 10, prefix: 'pub' }),
  general: createRL({ windowMs: 60_000, max: 60, prefix: 'gen' }),
  xp: createRL({ windowMs: 3_600_000, max: 20, prefix: 'xp' }),
}
export const getId = (req: Request, userId?: string) => userId || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
export const rlFail = (resetAt: number) => new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } })

Apply RL to these routes (add 3 lines at the top of each handler):
- /api/public/quick-risk → RL.public
- /api/ai/career-navigator → RL.ai
- /api/ai/admission → RL.ai
- /api/ai/application-timeline → RL.ai
- /api/loan/application → RL.loan
- /api/user/award-xp → RL.xp
- /api/referral/claim → RL.general
- /api/content/news → RL.general

Pattern for each: const id = getId(request, session?.user?.id); const check = RL.ai(id); if (!check.ok) return rlFail(check.resetAt);

--- MODIFY: gradright-web/app/api/loan/documents/upload/route.ts ---
Add before processing:
const MAX = 10 * 1024 * 1024  // 10MB
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
if (file.size > MAX) return Response.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
if (!ALLOWED.includes(file.type)) return Response.json({ error: 'Invalid file type. Use PDF, JPG, or PNG.' }, { status: 400 })

--- MODIFY: gradright-web/next.config.js or next.config.ts ---
Add security headers:
async headers() {
  return [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
  ]}]
}

--- FIX: Chat route validation ---
gradright-web/app/api/ai/chat/route.ts: Replace z.any() for messages with a proper Zod schema:
const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })
const bodySchema = z.object({ messages: z.array(messageSchema).max(50), currentPage: z.string().optional() })

VERIFY: POST /api/ai/career-navigator returns 429 after 10 requests in 1 minute. File upload rejects files >10MB. File upload rejects non-PDF/JPG/PNG files. X-Content-Type-Options header present in response.
```

---

## 🔵 PROMPT P4-G — Deployment Config + Health Check

```
@Codebase

No live deployment. Missing health check. Incomplete env vars. Fix all deployment blockers.

READ FIRST: gradright-web/.env.example, risk-service/main.py, gradright-web/vercel.json, gradright-web/next.config.js or next.config.ts, README.md (root level).

--- CREATE: gradright-web/app/api/health/route.ts ---
GET (no auth). Returns:
{ status: "ok"|"degraded"|"critical", services: { database: "ok"|"error", riskEngine: "ok"|"unavailable", anthropicAI: "ok"|"missing_key", geminiAI: "ok"|"missing_key" }, mode: "full"|"fallback", version: "1.0.0", timestamp: string }

Checks:
- database: try SELECT 1 (or a simple Drizzle query). ok/error.
- riskEngine: GET ${RISK_ENGINE_URL}/health with 2s timeout. ok/unavailable (not a failure — fallback exists).
- anthropicAI: ANTHROPIC_API_KEY env set? ok/missing_key. Don't call the API.
- geminiAI: GOOGLE_AI_API_KEY env set? ok/missing_key.
status: "critical" if database=error. "degraded" if riskEngine=unavailable OR either AI key missing. "ok" if all pass.

--- MODIFY: risk-service/main.py ---
Ensure GET /health endpoint exists and returns { "status": "ok", "model": "rule-based-v1", "version": "1.0.0" }.
Update CORS origins: replace wildcard "*" with list: ["http://localhost:3000", os.environ.get("FRONTEND_URL", "https://gradright.vercel.app")]. Add FRONTEND_URL to risk-service/.env.example.

--- AUDIT: gradright-web/.env.example ---
Walk through every process.env reference in the codebase. Ensure EVERY env var is documented in .env.example with a comment explaining what it does and where to get it:
NEXT_PUBLIC_APP_URL= # Your deployed URL e.g. https://gradright.vercel.app
NEXT_PUBLIC_SUPABASE_URL= # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY= # From Supabase project settings
DATABASE_URL= # From Supabase project settings > Database > Connection string
ANTHROPIC_API_KEY= # From console.anthropic.com
GOOGLE_AI_API_KEY= # From aistudio.google.com
RISK_ENGINE_URL= # URL of deployed risk-service e.g. https://your-app.railway.app
NEWS_API_KEY= # From newsapi.org (free tier)
GNEWS_API_KEY= # From gnews.io (free, no credit card)
RESEND_API_KEY= # From resend.com (for email digest) — optional
CRON_SECRET= # Random string — used to secure cron endpoints
FRONTEND_URL= # Same as NEXT_PUBLIC_APP_URL — used by risk-service

--- CREATE: gradright-web/scripts/pre-deploy-check.ts ---
#!/usr/bin/env tsx
Check required env vars (NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY).
Log: ✅ for each set, ❌ with message for each missing.
Log: "⚠️ RISK_ENGINE_URL not set — fallback mode will be used" if missing.
Exit code 1 if any critical var missing.
Add to package.json: "pre-deploy": "tsx scripts/pre-deploy-check.ts"

--- MODIFY: README.md ---
Rewrite deployment section:
## Deployment (5 minutes)
1. Fork/clone repo
2. Create Supabase project → copy DATABASE_URL and keys → add to Vercel env vars
3. Get Anthropic API key from console.anthropic.com → add to Vercel env vars
4. Deploy to Vercel: vercel deploy (or connect GitHub repo in Vercel dashboard)
5. Deploy risk-service to Railway (free): create new project → deploy from /risk-service folder → copy URL → set as RISK_ENGINE_URL in Vercel
6. Run: npm run seed:demo (locally, pointing at production DB) to create demo accounts
7. Visit /api/health — should show status: "ok" or "degraded"

VERIFY: GET /api/health returns valid JSON. .env.example covers all env vars used in codebase. risk-service /health returns ok. CORS uses specific origins not wildcard. README deployment guide is clear and complete.
```

---

## ✅ FINAL CHECKLIST PROMPT — Run After All Prompts Complete

```
@Codebase

Do a final verification pass. Report PASS or FAIL for every item. For FAILs: file path + one-line fix.

PS1 FEATURES:
[ ] Placement probability 3/6/12 months — wired end-to-end, no random numbers
[ ] Expected salary range — from DB/static dataset, not hardcoded
[ ] Risk score Low/Medium/High — calculated from real weighted inputs
[ ] AI plain-English risk summary — generated by Anthropic
[ ] Next-best-actions — at least 5 distinct rule-based recommendations
[ ] Placement cell strength — field in scorer.py, in payload builder
[ ] Macro labor market — target_country used in scoring
[ ] Lender early-alert system — generates alerts, shown in NBFC dashboard

PS2 FEATURES:
[ ] AI Career Navigator — structured form + results page at /career/navigator (NOT just chatbot)
[ ] ROI Calculator — salary vs cost simulation with chart
[ ] Admission Predictor — API at /api/ai/admission + page at /plan/admission
[ ] Application Timeline — real timeline at /api/ai/application-timeline + page at /plan/timeline
[ ] Document Checklist — correctly named at /api/ai/document-checklist
[ ] Conversational Mentor — chatbot with user profile context injection
[ ] Personalised Loan Rate — dynamic rate based on risk label + profile
[ ] EMI Calculator with repayment scenarios
[ ] AI-assisted loan application — multi-step with document upload
[ ] Live news feed — no example.com URLs
[ ] Gamification — streaks + XP DB-backed
[ ] Smart in-app nudges — journey-stage based, not just email
[ ] Post-disbursement monitoring — /loan/status page + placement update flow
[ ] Referral system — link generation + share buttons + XP on claim

TECHNICAL:
[ ] No hardcoded API keys in source
[ ] .env.example complete
[ ] Rate limiting on all AI + loan + public routes
[ ] File upload validates type and size
[ ] Risk engine fallback works without RISK_ENGINE_URL
[ ] /api/health returns ok or degraded

UX:
[ ] Landing page / loads without login
[ ] Demo calculator on landing page works
[ ] Demo accounts exist and auto-fill on login page
[ ] Loading skeletons on all data-fetching pages
[ ] Error states with retry buttons
[ ] Empty states on all list/table views
[ ] Toast notifications for key actions
[ ] Mobile responsive at 375px (no horizontal scroll)
[ ] All submit buttons show spinner + disabled during API call

VISUAL:
[ ] Per-page SEO metadata (unique title on each page)
[ ] /og route generates OG image
[ ] /sitemap.xml accessible
[ ] Score share card on career page

DEPLOYMENT:
[ ] GET /api/health returns ok or degraded
[ ] CORS in risk-service uses specific origins not *
[ ] npm run seed:demo runs without errors
[ ] README shows demo credentials at top

AT END: Give FINAL SCORE (X/100) and WIN PROBABILITY (X%). List top 3 remaining issues.
```

---

## QUICK REFERENCE — What Each Prompt Fixes

| Prompt | Audit Issue | Scoring Impact |
|--------|-------------|----------------|
| P1-A | Admission Predictor FAKE | +8pts — eliminates trust collapse |
| P1-B | Timeline MISNAMED | +5pts — PS2 completeness |
| P1-C | Dashboard routes wrong | +3pts — demo flow |
| P2-A | Career Navigator missing | +6pts — PS2 AI depth |
| P2-B | Static mock news | +3pts — growth story |
| P2-C | No referral/sharing | +4pts — viral + bonus |
| P2-D | No in-app nudges | +3pts — engagement |
| P2-E | No post-disbursement | +4pts — lifecycle completeness |
| P2-F | Hardcoded loan rates | +3pts — conversion logic |
| P3-A | No NBFC alerts | +4pts — PS1 lender value |
| P3-B | Missing PS1 inputs | +3pts — model completeness |
| P4-A | SEO 3/10 | +4pts — growth narrative |
| P4-B | No landing page value | +5pts — demo readiness |
| P4-C | No demo accounts | +5pts — prototype quality |
| P4-D | No loading/error states | +3pts — UX quality |
| P4-E | Mobile unverified | +2pts — polish |
| P4-F | No rate limiting | +2pts — security |
| P4-G | No deployment config | +3pts — live demo bonus |
| **Total potential gain** | | **~70pts → 62+70 theoretical** |
