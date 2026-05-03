from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, auth, loan, nbfc, onboarding, predictor, user

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
