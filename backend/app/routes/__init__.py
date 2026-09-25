from app.routes.health import router as health_router
from app.routes.locations import router as locations_router
from app.routes.prediction import router as prediction_router
from app.routes.forecast import router as forecast_router
from app.routes.inundation import router as inundation_router

__all__ = [
    "health_router",
    "locations_router",
    "prediction_router",
    "forecast_router",
    "inundation_router",
]
