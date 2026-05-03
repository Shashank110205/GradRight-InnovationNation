# Push GradRight to a new private GitHub repository

Complete these on the machine that has your project folder (e.g. `C:\Users\<you>\Desktop\GradRight`).

## Prerequisites

1. **Git** installed (`git --version`).  
2. **GitHub account** and permission to create a repository.  
3. **Authentication** to GitHub:
   - **HTTPS**: [Personal Access Token (classic)](https://github.com/settings/tokens) with `repo` scope, or Git Credential Manager; or  
   - **SSH**: [SSH key added to GitHub](https://docs.github.com/en/authentication/connecting-with-ssh).  
4. Optional: **GitHub CLI** (`gh`): [install](https://cli.github.com/) then `gh auth login`.

## One-time: commit local work

From the **repository root** (folder containing `gradright-web/`, `gradright-backend/`, `README.md`):

```bash
git status
```

Confirm **no** `.env` / `.env.local` files are listed under “Changes to be committed”. If unsure:

```bash
git diff --cached
```

Stage and commit:

```bash
git add .
git commit -m "chore: initial commit — GradRight monorepo"
```

If Git asks for `user.name` / `user.email`:

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

## Create the GitHub repo (private) and push

### Option A — GitHub CLI (recommended)

```bash
gh auth login
gh repo create GradRight --private --source=. --remote=origin --push
```

Use another name instead of `GradRight` if taken. If the repo already exists empty:

```bash
git remote add origin https://github.com/<your-username>/GradRight.git
git push -u origin main
```

### Option B — GitHub website + command line

1. On GitHub: **New repository** → name `GradRight` → **Private** → **Do not** add README/license/gitignore (you already have files locally).  
2. Then:

```bash
git remote add origin https://github.com/<your-username>/GradRight.git
git branch -M main
git push -u origin main
```

## After the first push

- Add collaborators under **Settings → Collaborators** (private repo).  
- Optionally enable **Secret scanning** and **Dependabot** under **Settings → Security**.  
- Open a PR using the description in [`INITIAL_PUBLISH_PR.md`](INITIAL_PUBLISH_PR.md) if you used a branch; otherwise the first commit on `main` already matches that narrative.

## Troubleshooting

| Issue | What to do |
|--------|------------|
| Auth failed on `git push` | Re-run `gh auth login` or configure HTTPS token / SSH agent. |
| `remote origin already exists` | `git remote remove origin` then add again, or `git remote set-url origin <new-url>`. |
| Accidentally staged `.env` | `git reset HEAD -- path/to/.env` and ensure `.gitignore` matches; see [`SECURITY_PRE_PUSH_CHECKLIST.md`](SECURITY_PRE_PUSH_CHECKLIST.md). |
