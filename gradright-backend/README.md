# GradRight — Python backend (PYTHON_SETUP)

## Prerequisites

- **Python 3.11+** (recommended: **3.11.x**). Use `py -3.11` on Windows if multiple versions are installed.
- **PostgreSQL** reachable at the URL in `.env` (`DATABASE_URL`) for Alembic and SQLAlchemy.
- **pip** (inside the virtual environment).

## Virtual environment

This repo uses **`venv311`** (Python 3.11) so pinned wheels install reliably. An older `venv` folder may exist if it was locked by another process; prefer activating **`venv311`**.

**Windows (PowerShell):**

```powershell
cd gradright-backend
.\venv311\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
cd gradright-backend
source venv311/bin/activate
```

## Install dependencies

Already captured in `requirements.txt` (from `pip freeze` after PYTHON_SETUP Step 3). To reinstall:

```bash
pip install -r requirements.txt
```

## Environment

1. Copy `.env.example` → `.env`.
2. Fill in real values for Supabase, `DATABASE_URL`, `ANTHROPIC_API_KEY`, etc.

## Run the API (PYTHON_SETUP Step 10)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"1.0.0"}
```

Open interactive docs: `http://localhost:8000/docs` (when `ENVIRONMENT=development`).

## Alembic (Step 8)

- **`alembic.ini`** uses a sync PostgreSQL URL placeholder; **`alembic/env.py`** overrides it from `DATABASE_URL` (async URL converted to `postgresql://` for **psycopg2**).

With PostgreSQL running and `DATABASE_URL` correct:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

If no database was available during first setup, an empty baseline revision exists (`initial tables`). After you add SQLAlchemy models under `app/models/`, run **`alembic revision --autogenerate`** again to generate real DDL, then **`alembic upgrade head`**.

## Frontend (Next.js)

See **`gradright-web`** and `lib/api/client.ts`. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `gradright-web/.env.local`.
