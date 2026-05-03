## Title

**chore: initial private GitHub publish — GradRight monorepo**

## Summary

This changeset establishes the **GradRight** monorepo on GitHub as a **private** repository with a safe baseline for collaboration: documentation, ignore rules for secrets and large artifacts, and a clear map of what the codebase already contains versus what remains per product specs.

## Scope

### Repository hygiene

- Added a **root `.gitignore`** covering env secrets, `node_modules`, Next.js `.next`, Python caches, `venv`/`venv311`, IDE folders (`.cursor/`), and common logs.  
- Extended **`gradright-backend/.gitignore`** with **`venv311/`** so local Python environments are never committed.  
- Confirmed template env files remain trackable while **`.env.local`** / **`.env`** stay ignored.

### Documentation

- Root **`README.md`**: project overview, folder layout, prerequisites, quick start for web/backend/mobile, pointer to security checklist and GitHub push guide.  
- **`docs/SECURITY_PRE_PUSH_CHECKLIST.md`**: repeatable audit before every push.  
- **`docs/GITHUB_PUSH_STEPS.md`**: prerequisites and commands to create a **private** GitHub repo and push `main`.

## Product / engineering coverage (current state)

| Area | Status |
|------|--------|
| Next.js app (`gradright-web`) | Auth pages, onboarding → GradRight Score, dashboard shell and tiles, floating mentor chat |
| AI mentor chat | `POST /api/ai/chat` — Supabase session, Zod validation, Upstash rate limit, Gemini streaming, `MENTOR_SYSTEM_PROMPT` context |
| Database | Drizzle + Supabase-oriented schema and queries (users, profiles, risk scores, activity) |
| Python API (`gradright-backend`) | FastAPI service present per repo layout; run/configure per package README |
| Mobile (`gradright-mobile`) | Expo scaffold — see package README |
| Specs | `BUILD_ORDER.md`, `FEATURE_SPECS.md`, `AI_PROMPTS.md`, `DATA_MODELS.md` define remaining modules |

## Out of scope (follow-on PRs)

- Remaining BUILD_ORDER modules (loan flow, NBFC console, admission predictor, etc.) per `FEATURE_SPECS.md`.  
- CI/CD workflows (optional next step).  
- Production deployment hardening.

## Verification

- [ ] `git status` shows no `.env*` secrets staged.  
- [ ] `git check-ignore -v gradright-web/.env.local` confirms ignore.  
- [ ] `pnpm install` / `pnpm build` succeed in `gradright-web` when env is configured locally (maintainer check).
