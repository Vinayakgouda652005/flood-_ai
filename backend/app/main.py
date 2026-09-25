import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.routes.health import router as health_router
from app.routes.locations import router as locations_router
from app.routes.prediction import router as prediction_router
from app.routes.forecast import router as forecast_router
from app.routes.inundation import router as inundation_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("flood_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    logger.info("Initializing Flood Inundation Projection backend...")
    init_db()
    logger.info("Backend service ready.")
    yield
    # Shutdown
    logger.info("Shutting down Flood Inundation Projection backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-ready FastAPI backend & PostgreSQL schema for the Flood Inundation Projection System. "
        "Provides user-driven prediction logging, location management, real environmental feature ingestion, "
        "and clean extension hooks for future trained AI model inference."
    ),
    lifespan=lifespan,
)

# Configure CORS for React/Vite development server (port 3000 / 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.run\.app)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health_router)
app.include_router(locations_router)
app.include_router(prediction_router)
app.include_router(forecast_router)
app.include_router(inundation_router)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "predict": "/api/predict",
            "locations": "/api/locations",
            "forecast": "/api/forecast",
            "inundation": "/api/inundation",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
