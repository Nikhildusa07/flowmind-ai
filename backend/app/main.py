from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import models

from app.api.auth import router as auth_router
from app.api.ai import router as ai_router
from app.api.workflows import router as workflows_router
from app.api.documents import router as documents_router
from app.api.requests import router as requests_router
from app.api.reviews import router as reviews_router
from app.api.analytics import router as analytics_router


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="FlowMind AI",
    description="AI-Powered Business Operations Automation System",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# ROUTES
# ============================================================

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(workflows_router)
app.include_router(documents_router)
app.include_router(requests_router)
app.include_router(reviews_router)
app.include_router(analytics_router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "FlowMind AI backend is running.",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
    }