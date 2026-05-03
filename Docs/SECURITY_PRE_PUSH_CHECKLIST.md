# Security checklist before `git push`

Use this every time you push, especially from a new machine or after moving the project.

## Secrets

- [ ] No `.env`, `.env.local`, `.env.production`, or `.env.*` files with real values are staged (`git status`, `git diff --cached`).  
- [ ] Only **`.env.example`** files contain variable **names**; values stay empty or placeholder.  
- [ ] No API keys, JWTs, `DATABASE_URL` passwords, or Supabase **service role** keys appear in committed source or docs.  
- [ ] If keys were ever pasted into chat, logs, or a public issue, **rotate** them in Supabase / Google Cloud / Upstash and update local `.env` only.

## Ignored artifacts

- [ ] `node_modules/`, `.next/`, Python `venv/` / `venv311/`, `__pycache__/` are **not** tracked (see root `.gitignore` and package `.gitignore`).  
- [ ] Optional: run `git ls-files gradright-backend/venv311` — should print **nothing**.

## GitHub

- [ ] Repository visibility is **private** unless you intend otherwise.  
- [ ] Branch protection and secret scanning enabled on the org/repo if available.
