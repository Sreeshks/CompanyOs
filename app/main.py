from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.database import engine, Base
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.api.v1.api import api_router
from app.seeds.runner import seed_database
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and initial database seed is loaded
    logger.info("Initializing Company OS backend...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error during initial seeding: {e}")
    yield
    # Shutdown: Clean up resources if necessary
    logger.info("Company OS backend shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-grade, modular, database-driven business management and workflow backend.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Mount API V1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "documentation": f"{settings.API_V1_PREFIX}/docs"
    }
