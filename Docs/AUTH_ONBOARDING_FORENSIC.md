# Auth & onboarding — forensic summary

## Student authentication

| Artifact | Path | Verdict |
|----------|------|---------|
| Sign-in UI | `components/student/auth/SignInForm.tsx` | **Canonical** — used when `!isNbfcPortalInstance()`. |
| Sign-up UI | `components/student/auth/SignUpForm.tsx` | **Canonical** — student portal default. |
| Routes | `app/(auth-shell)/sign-in`, `sign-up` | **Canonical** — single URL pair; legacy `/login` `/signup` redirect in middleware. |

## Partner (NBFC) authentication

| Artifact | Path | Verdict |
|----------|------|---------|
| Partner login | `components/partner/partner-login-form.tsx` | **Canonical** — exclusively rendered from `sign-in/page.tsx` when `isNbfcPortalInstance()`. |
| Partner signup | `components/partner/partner-signup-form.tsx` | **Canonical** — mounted from `sign-up/page.tsx` in NBFC portal mode. |

**Result:** One route file per concern; **portal switch** chooses the correct form. No duplicate `/login` pages.

## Onboarding

| Artifact | Path | Verdict |
|----------|------|---------|
| Flow shell | `components/student/onboarding/OnboardingShell.tsx` | **Canonical** — steps + score reveal. |
| Route | `app/onboarding/page.tsx` | **Canonical** |

No second onboarding route group was found. Partner “onboarding” is not a mirrored student wizard — partner completion uses `POST /api/auth/complete-partner-signup` (service account / env gated).

## Score / wow UX

Supporting components (`ScoreRevealCarousel`, `ScoreWowMoment`, `GradRightScoreScreen`, …) live under **`components/student/onboarding/`** and are composed by `OnboardingShell` only.

## Session exit

- `components/shared/AppUserMenu.tsx` → `GET/POST /api/auth/sign-out` → redirect `/sign-in`.
