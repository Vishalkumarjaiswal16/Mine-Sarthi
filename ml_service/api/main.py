"""
FastAPI Main Application for ML Service

ML prediction service exposing endpoints for ore classification and RPM optimization.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from dotenv import load_dotenv

from .endpoints import router
from .dashboard_endpoints import router as dashboard_router
from .realtime_endpoints import router as realtime_router
from .control_endpoints import router as control_router
from .monitoring_endpoints import router as monitoring_router
from .feedback_endpoints import router as feedback_router
from .safety_endpoints import router as safety_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Service configuration
SERVICE_NAME = "ML Prediction Service"
SERVICE_VERSION = "1.0.0"
ML_SERVICE_HOST = os.environ.get("ML_SERVICE_HOST", "0.0.0.0")
ML_SERVICE_PORT = int(os.environ.get("ML_SERVICE_PORT", "8001"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI.
    Handles startup and shutdown events.
    """
    # Startup: Load models
    logger.info("=" * 60)
    logger.info(f"Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    logger.info(f"Listening on {ML_SERVICE_HOST}:{ML_SERVICE_PORT}")
    logger.info("=" * 60)
    
    try:
        logger.info("Loading ML models...")
        
        # Pre-load models to cache them in memory
        from src.ore_classifier import get_classifier
        from src.rpm_optimizer import get_optimizer
        
        classifier = get_classifier()
        classifier.load_models()
        logger.info("✓ Model 1 (Ore Hardness Classifier) loaded")
        
        optimizer = get_optimizer()
        optimizer.load_models()
        logger.info("✓ Model 2 (RPM Optimizer) loaded")
        
        logger.info("All models loaded successfully!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Failed to load models during startup: {str(e)}", exc_info=True)
        logger.warning("Service will start, but predictions may fail until models are loaded")
    
    yield
    
    # Shutdown: Cleanup
    logger.info(f"Shutting down {SERVICE_NAME}")


# Create FastAPI application
app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description="""
    ML Prediction Service for Mine Sarthi (SIH 2025)
    
    This service provides AI/ML predictions for:
    - **Ore Hardness Classification**: Predicts if ore is hard/medium/soft from sensor readings
    - **RPM Optimization**: Recommends optimal RPM to minimize energy consumption
    
    ## Models
    
    - **Model 1**: Random Forest Classifier for ore hardness classification
    - **Model 2**: Energy Optimizer for RPM recommendations
    
    ## Endpoints
    
    - `POST /api/v1/classify-ore` - Classify ore hardness
    - `POST /api/v1/recommend-rpm` - Get RPM recommendation
    - `POST /api/v1/predict` - End-to-end prediction (both models)
    - `POST /api/v1/predict-realtime` - Real-time prediction from telemetry
    - `GET /health` - Service health check
    """,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["ML Predictions"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(realtime_router, prefix="/api/v1", tags=["Real-Time Monitoring"])
app.include_router(control_router, prefix="/api/v1", tags=["Speed Control"])
app.include_router(monitoring_router, prefix="/api/v1", tags=["Monitoring"])
app.include_router(feedback_router, prefix="/api/v1", tags=["Feedback Loop"])
app.include_router(safety_router, prefix="/api/v1", tags=["Safety & Alerts"])


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns service status and model availability.
    """
    try:
        from src.ore_classifier import get_classifier
        from src.rpm_optimizer import get_optimizer
        
        classifier = get_classifier()
        optimizer = get_optimizer()
        
        models_loaded = classifier._is_loaded and optimizer._is_loaded
        
        return {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "models_loaded": models_loaded,
            "models": {
                "ore_classifier": classifier._is_loaded,
                "rpm_optimizer": optimizer._is_loaded
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}", exc_info=True)
        return {
            "status": "unhealthy",
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "error": str(e)
        }


# Serve static files (dashboard)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/dashboard", tags=["Dashboard"])
async def dashboard():
    """Serve the real-time dashboard."""
    dashboard_file = static_dir / "dashboard.html"
    if dashboard_file.exists():
        return FileResponse(dashboard_file)
    else:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=404,
            content={"error": "Dashboard file not found"}
        )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "docs": "/docs",
        "health": "/health",
        "dashboard": "/dashboard",
        "endpoints": {
            "classify_ore": "POST /api/v1/classify-ore",
            "recommend_rpm": "POST /api/v1/recommend-rpm",
            "predict": "POST /api/v1/predict",
            "predict_realtime": "POST /api/v1/predict-realtime",
            "dashboard_current": "GET /api/v1/dashboard/current/{device_id}",
            "dashboard_historical": "GET /api/v1/dashboard/historical/{device_id}",
            "dashboard_stats": "GET /api/v1/dashboard/stats/{device_id}"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ml_service.api.main:app",
        host=ML_SERVICE_HOST,
        port=ML_SERVICE_PORT,
        reload=True
    )

