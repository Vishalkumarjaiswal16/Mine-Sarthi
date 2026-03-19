"""
API Endpoints for ML Service

Defines all FastAPI routes for ore classification and RPM optimization.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.ore_classifier import get_classifier
from src.rpm_optimizer import get_optimizer
from src.prediction_pipeline import get_pipeline
from src.prediction_storage import get_storage
from src.mqtt_publisher import get_publisher

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models

class OreClassificationRequest(BaseModel):
    """Request model for ore classification."""
    power_kw: float = Field(..., description="Power consumption in kW", gt=0)
    feed_rate_tph: float = Field(..., description="Feed rate in tons per hour", gt=0)
    feed_size_mm: float = Field(..., description="Feed size in millimeters", gt=0)


class OreClassificationResponse(BaseModel):
    """Response model for ore classification."""
    predicted_class: str
    probabilities: Dict[str, float]
    confidence: float
    raw_features: list
    error: Optional[str] = None


class RPMRecommendationRequest(BaseModel):
    """Request model for RPM recommendation."""
    ore_type: str = Field(..., description="Ore type: hard/medium/soft")
    feed_rate_tph: float = Field(..., description="Feed rate in tons per hour", gt=0)
    feed_size_mm: float = Field(..., description="Feed size in millimeters", gt=0)
    current_rpm: Optional[float] = Field(None, description="Current RPM (optional, for energy savings calculation)")


class RPMRecommendationResponse(BaseModel):
    """Response model for RPM recommendation."""
    recommended_rpm: Optional[float]
    predicted_energy_kwh_per_ton: Optional[float]
    optimal_css_mm: Optional[float]
    confidence: str
    energy_savings_pct: float
    error: Optional[str] = None


class CombinedPredictionRequest(BaseModel):
    """Request model for end-to-end prediction."""
    power_kw: float = Field(..., description="Power consumption in kW", gt=0)
    feed_rate_tph: float = Field(..., description="Feed rate in tons per hour", gt=0)
    feed_size_mm: float = Field(..., description="Feed size in millimeters", gt=0)
    current_rpm: Optional[float] = Field(None, description="Current RPM (optional)")


class RealtimePredictionRequest(BaseModel):
    """Request model for real-time prediction (matches telemetry format)."""
    device_id: Optional[str] = None
    sensor_id: Optional[str] = None
    power_kw: Optional[float] = None
    rpm: Optional[float] = None
    feed_tph: Optional[float] = Field(None, description="Feed rate in tons per hour (alias: feed_rate_tph)")
    feed_rate_tph: Optional[float] = Field(None, description="Feed rate in tons per hour")
    feed_size_mm: Optional[float] = None
    ts: Optional[Any] = None
    timestamp: Optional[Any] = None
    
    class Config:
        extra = "allow"


# API Endpoints

@router.post("/classify-ore", response_model=OreClassificationResponse, tags=["Model 1"])
async def classify_ore(request: OreClassificationRequest) -> OreClassificationResponse:
    """
    Classify ore hardness from sensor readings.
    
    Uses Model 1 (Random Forest Classifier) to predict if ore is hard/medium/soft
    based on Power, Feed Rate, and Feed Size.
    
    **Example Request:**
    ```json
    {
        "power_kw": 288.58,
        "feed_rate_tph": 387,
        "feed_size_mm": 90
    }
    ```
    
    **Example Response:**
    ```json
    {
        "predicted_class": "medium",
        "probabilities": {
            "hard": 0.15,
            "medium": 0.70,
            "soft": 0.15
        },
        "confidence": 0.70,
        "raw_features": [288.58, 387, 90],
        "error": null
    }
    ```
    """
    try:
        classifier = get_classifier()
        result = classifier.classify_ore_hardness(
            power_kw=request.power_kw,
            feed_rate_tph=request.feed_rate_tph,
            feed_size_mm=request.feed_size_mm
        )
        
        return OreClassificationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in classify_ore endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")


@router.post("/recommend-rpm", response_model=RPMRecommendationResponse, tags=["Model 2"])
async def recommend_rpm(request: RPMRecommendationRequest) -> RPMRecommendationResponse:
    """
    Recommend optimal RPM to minimize energy consumption.
    
    Uses Model 2 (Energy Optimizer) to recommend optimal RPM based on ore type,
    feed rate, and feed size.
    
    **Example Request:**
    ```json
    {
        "ore_type": "medium",
        "feed_rate_tph": 387,
        "feed_size_mm": 90,
        "current_rpm": 945
    }
    ```
    
    **Example Response:**
    ```json
    {
        "recommended_rpm": 920.5,
        "predicted_energy_kwh_per_ton": 2.3957,
        "optimal_css_mm": 14.94,
        "confidence": "High",
        "energy_savings_pct": 5.2,
        "error": null
    }
    ```
    """
    try:
        optimizer = get_optimizer()
        result = optimizer.recommend_optimal_rpm(
            ore_type=request.ore_type,
            feed_rate_tph=request.feed_rate_tph,
            feed_size_mm=request.feed_size_mm,
            current_rpm=request.current_rpm
        )
        
        return RPMRecommendationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in recommend_rpm endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RPM recommendation error: {str(e)}")


@router.post("/predict", tags=["Combined Pipeline"])
async def predict_combined(request: CombinedPredictionRequest) -> Dict[str, Any]:
    """
    Complete end-to-end prediction pipeline.
    
    Combines both models:
    1. Classifies ore hardness from sensor data (Model 1)
    2. Recommends optimal RPM based on predicted ore type (Model 2)
    
    **Example Request:**
    ```json
    {
        "power_kw": 288.58,
        "feed_rate_tph": 387,
        "feed_size_mm": 90,
        "current_rpm": 945
    }
    ```
    
    **Example Response:**
    ```json
    {
        "timestamp": "2025-12-04T00:00:00Z",
        "input": {
            "power_kw": 288.58,
            "feed_rate_tph": 387,
            "feed_size_mm": 90,
            "current_rpm": 945
        },
        "ore_classification": {
            "predicted_class": "medium",
            "probabilities": {...},
            "confidence": 0.70
        },
        "rpm_recommendation": {
            "recommended_rpm": 920.5,
            "predicted_energy_kwh_per_ton": 2.3957,
            ...
        },
        "success": true,
        "error": null,
        "summary": "..."
    }
    ```
    """
    try:
        pipeline = get_pipeline()
        result = pipeline.predict_end_to_end(
            power_kw=request.power_kw,
            feed_rate_tph=request.feed_rate_tph,
            feed_size_mm=request.feed_size_mm,
            current_rpm=request.current_rpm
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Prediction failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in predict_combined endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict-realtime", tags=["Real-time Integration"])
async def predict_realtime(request: RealtimePredictionRequest) -> Dict[str, Any]:
    """
    Real-time prediction from telemetry data.
    
    Accepts telemetry format from data pipeline and returns predictions.
    This endpoint is designed to be called by the backend service after
    receiving sensor data.
    
    **Example Request (matches telemetry format):**
    ```json
    {
        "device_id": "crusher_01",
        "power_kw": 288.58,
        "rpm": 945,
        "feed_tph": 387,
        "feed_size_mm": 90,
        "ts": 1764578407
    }
    ```
    
    **Example Response:**
    ```json
    {
        "device_id": "crusher_01",
        "timestamp": "2025-12-04T00:00:00Z",
        "predictions": {
            "ore_classification": {...},
            "rpm_recommendation": {...}
        },
        "success": true
    }
    ```
    """
    try:
        # Extract required fields (handle both feed_tph and feed_rate_tph)
        power_kw = request.power_kw
        feed_rate_tph = request.feed_rate_tph or request.feed_tph
        feed_size_mm = request.feed_size_mm
        current_rpm = request.rpm
        
        device_id = request.device_id or request.sensor_id or "unknown"
        
        # Validate required fields
        if power_kw is None:
            raise HTTPException(status_code=400, detail="Missing required field: power_kw")
        if feed_rate_tph is None:
            raise HTTPException(status_code=400, detail="Missing required field: feed_tph or feed_rate_tph")
        if feed_size_mm is None:
            raise HTTPException(status_code=400, detail="Missing required field: feed_size_mm")
        
        # Run prediction pipeline
        pipeline = get_pipeline()
        result = pipeline.predict_end_to_end(
            power_kw=power_kw,
            feed_rate_tph=feed_rate_tph,
            feed_size_mm=feed_size_mm,
            current_rpm=current_rpm
        )
        
        # Store predictions in databases
        if result.get("success"):
            try:
                storage = get_storage()
                storage_result = storage.store_prediction(result, device_id)
                logger.debug(f"Prediction storage result: {storage_result}")
            except Exception as e:
                logger.warning(f"Failed to store prediction: {str(e)}")
            
            # Publish RPM recommendation to MQTT
            try:
                publisher = get_publisher()
                publisher.publish_prediction(result, device_id)
            except Exception as e:
                logger.warning(f"Failed to publish to MQTT: {str(e)}")
        
        # Format response for real-time integration
        return {
            "device_id": device_id,
            "timestamp": result.get("timestamp"),
            "predictions": {
                "ore_classification": result.get("ore_classification"),
                "rpm_recommendation": result.get("rpm_recommendation")
            },
            "success": result.get("success", False),
            "error": result.get("error")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in predict_realtime endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Real-time prediction error: {str(e)}")

