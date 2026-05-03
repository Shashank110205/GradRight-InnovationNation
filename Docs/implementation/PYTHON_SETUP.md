# GradRight — Python Backend Setup Guide
# Run every step in order. Do not skip.

---

## Step 1 — Python version check
```bash
python3 --version   # Must be 3.11+
pip --version       # Must be available
```

---

## Step 2 — Create and activate virtual environment
```bash
mkdir gradright-backend && cd gradright-backend
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows
```

---

## Step 3 — Install all dependencies
```bash
pip install \
  fastapi==0.111.0 \
  uvicorn[standard]==0.30.1 \
  sqlalchemy[asyncio]==2.0.30 \
  asyncpg==0.29.0 \
  alembic==1.13.1 \
  pydantic==2.7.1 \
  pydantic-settings==2.3.0 \
  supabase==2.5.0 \
  anthropic==0.28.0 \
  httpx==0.27.0 \
  python-dotenv==1.0.1 \
  slowapi==0.1.9 \
  redis==5.0.4 \
  resend==2.0.0 \
  reportlab==4.2.0 \
  pytesseract==0.3.13 \
  Pillow==10.3.0 \
  boto3==1.34.0 \
  python-multipart==0.0.9 \
  python-jose[cryptography]==3.3.0 \
  passlib[bcrypt]==1.7.4 \
  aiofiles==23.2.1

pip freeze > requirements.txt
```

---

## Step 4 — Create .env file
```bash
cp .env.example .env
# Fill in all values
```

`.env.example` contents:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres
ANTHROPIC_API_KEY=
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_TEXTRACT_BUCKET=
RESEND_API_KEY=
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here
```

---

## Step 5 — Create main.py (FastAPI app entry point)
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, user, onboarding, ai, loan, predictor, nbfc

app = FastAPI(
    title="GradRight API",
    description="AI-first study abroad + education finance platform",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(loan.router, prefix="/api/loan", tags=["loan"])
app.include_router(predictor.router, prefix="/api/predictor", tags=["predictor"])
app.include_router(nbfc.router, prefix="/api/nbfc", tags=["nbfc"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

---

## Step 6 — Create app/config.py
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    anthropic_api_key: str
    redis_url: str = "redis://localhost:6379"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    aws_textract_bucket: str = ""
    resend_api_key: str = ""
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    secret_key: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Step 7 — Create app/database.py
```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

---

## Step 8 — Set up Alembic
```bash
alembic init alembic
```

Edit `alembic/env.py` — replace the target_metadata line:
```python
from app.database import Base
from app.models import *    # Import all models so Alembic sees them
target_metadata = Base.metadata
```

Edit `alembic.ini` — set the sqlalchemy.url:
```
sqlalchemy.url = postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
# Note: alembic uses sync URL (no +asyncpg)
```

Generate first migration:
```bash
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

---

## Step 9 — Create folder scaffold
```bash
mkdir -p \
  app/models \
  app/schemas \
  app/routers \
  app/services \
  app/prompts \
  app/data \
  app/utils \
  app/middleware \
  tests \
  scripts

touch \
  app/__init__.py \
  app/models/__init__.py \
  app/schemas/__init__.py \
  app/routers/__init__.py \
  app/services/__init__.py \
  app/prompts/__init__.py \
  app/utils/__init__.py \
  app/middleware/__init__.py

echo "Folder structure created."
```

---

## Step 10 — Run and verify
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test in browser or terminal:
curl http://localhost:8000/health
# Expected: {"status": "ok", "version": "1.0.0"}

# Docs available at:
# http://localhost:8000/docs
```

---

## Step 11 — Connect Lovable frontend to this backend

In the Lovable-generated React app, create `src/api/client.js`:
```javascript
// src/api/client.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function apiPost(path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet(path, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return res.json();
}

export async function apiPatch(path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}
```

Add `REACT_APP_API_URL=http://localhost:8000` to the frontend `.env`.
