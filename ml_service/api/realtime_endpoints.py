"""
Real-Time Monitoring API Endpoints

Endpoints for Phase 1: Enhanced Real-Time Material Monitoring
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.realtime_integration import get_integration, RealTimeIntegration

logger = logging.getLogger(__name__)

router = APIRouter()


class MonitorConfig(BaseModel):
    """Configuration for real-time monitoring."""
    device_id: str = Field(default="crusher_01", description="Device identifier")
    poll_interval: float = Field(default=5.0, ge=1.0, le=60.0, description="Polling interval in seconds")
    enable_storage: bool = Field(default=True, description="Enable prediction storage")
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum confidence threshold")


@router.post("/realtime/start")
async def start_realtime_monitoring(config: MonitorConfig):
    """
    Start real-time material monitoring for a device.
    
    This endpoint starts continuous monitoring that:
    - Polls sensor data from backend every N seconds
    - Runs ML predictions on new samples
    - Detects material property changes
    - Stores predictions for analysis
    """
    try:
        integration = get_integration(
            device_id=config.device_id,
            poll_interval=config.poll_interval,
            enable_storage=config.enable_storage,
            min_confidence=config.min_confidence
        )
        
        if integration.monitor.is_running:
            return {
                "status": "already_running",
                "device_id": config.device_id,
                "message": "Monitoring is already running for this device"
            }
        
        integration.start()
        
        return {
            "status": "started",
            "device_id": config.device_id,
            "poll_interval": config.poll_interval,
            "message": f"Real-time monitoring started for device {config.device_id}"
        }
        
    except Exception as e:
        logger.error(f"Error starting real-time monitoring: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")


@router.post("/realtime/stop/{device_id}")
async def stop_realtime_monitoring(device_id: str):
    """
    Stop real-time material monitoring for a device.
    """
    try:
        integration = get_integration(device_id=device_id)
        
        if not integration.monitor.is_running:
            return {
                "status": "not_running",
                "device_id": device_id,
                "message": "Monitoring is not running for this device"
            }
        
        integration.stop()
        
        return {
            "status": "stopped",
            "device_id": device_id,
            "message": f"Real-time monitoring stopped for device {device_id}"
        }
        
    except Exception as e:
        logger.error(f"Error stopping real-time monitoring: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to stop monitoring: {str(e)}")


@router.get("/realtime/status/{device_id}")
async def get_realtime_status(device_id: str):
    """
    Get status of real-time monitoring for a device.
    
    Returns:
    - Monitor status (running, healthy, latest sample info)
    - Detector status (recent predictions count)
    - Pipeline status (cached predictions count)
    """
    try:
        integration = get_integration(device_id=device_id)
        status = integration.get_status()
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting real-time status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/realtime/latest/{device_id}")
async def get_latest_prediction(device_id: str):
    """
    Get the most recent prediction for a device.
    """
    try:
        integration = get_integration(device_id=device_id)
        prediction = integration.get_latest_prediction()
        
        if prediction is None:
            raise HTTPException(
                status_code=404,
                detail=f"No predictions available for device {device_id}"
            )
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get latest prediction: {str(e)}")


@router.get("/realtime/predictions/{device_id}")
async def get_recent_predictions(
    device_id: str,
    count: int = Query(default=10, ge=1, le=100, description="Number of predictions to return")
):
    """
    Get recent predictions for a device.
    """
    try:
        integration = get_integration(device_id=device_id)
        predictions = integration.get_recent_predictions(count=count)
        
        return {
            "device_id": device_id,
            "count": len(predictions),
            "predictions": predictions
        }
        
    except Exception as e:
        logger.error(f"Error getting recent predictions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get predictions: {str(e)}")


@router.get("/realtime/samples/{device_id}")
async def get_recent_samples(
    device_id: str,
    count: int = Query(default=10, ge=1, le=100, description="Number of samples to return")
):
    """
    Get recent sensor samples for a device.
    """
    try:
        integration = get_integration(device_id=device_id)
        samples = integration.monitor.get_recent_samples(count=count)
        
        return {
            "device_id": device_id,
            "count": len(samples),
            "samples": samples
        }
        
    except Exception as e:
        logger.error(f"Error getting recent samples: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get samples: {str(e)}")


@router.get("/realtime/changes/{device_id}")
async def get_material_changes(
    device_id: str,
    count: int = Query(default=10, ge=1, le=100, description="Number of recent predictions to analyze")
):
    """
    Get recent material change detection history.
    
    Note: This returns recent predictions that may indicate changes.
    For actual change events, monitor the material_change_detected callback.
    """
    try:
        integration = get_integration(device_id=device_id)
        changes = integration.get_material_change_history(count=count)
        
        return {
            "device_id": device_id,
            "count": len(changes),
            "history": changes
        }
        
    except Exception as e:
        logger.error(f"Error getting material changes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get material changes: {str(e)}")

