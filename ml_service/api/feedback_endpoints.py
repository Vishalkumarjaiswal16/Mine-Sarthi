"""
Feedback Loop API Endpoints

Endpoints for Phase 3: Feedback Loop & Validation
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from src.feedback_loop import get_feedback_loop
from src.performance_validator import get_validator
from src.adaptive_controller import get_adaptive_controller
from src.command_tracker import get_tracker

logger = logging.getLogger(__name__)

router = APIRouter()


class ValidationRequest(BaseModel):
    """Request model for manual validation."""
    command_id: int = Field(..., description="Command ID to validate")
    before_data: Dict[str, Any] = Field(..., description="Sensor data before command")
    after_data: Dict[str, Any] = Field(..., description="Sensor data after command")


@router.post("/feedback/start/{device_id}")
async def start_feedback_loop(
    device_id: str,
    validation_interval: float = Query(default=60.0, ge=10.0, le=600.0),
    enable_adaptive_learning: bool = Query(default=True)
):
    """
    Start feedback loop service for a device.
    """
    try:
        feedback_loop = get_feedback_loop(
            device_id=device_id,
            validation_interval=validation_interval,
            enable_adaptive_learning=enable_adaptive_learning
        )
        
        if feedback_loop.is_running:
            return {
                "status": "already_running",
                "device_id": device_id,
                "message": "Feedback loop is already running for this device"
            }
        
        feedback_loop.start()
        
        return {
            "status": "started",
            "device_id": device_id,
            "validation_interval": validation_interval,
            "adaptive_learning": enable_adaptive_learning,
            "message": f"Feedback loop started for device {device_id}"
        }
        
    except Exception as e:
        logger.error(f"Error starting feedback loop: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start feedback loop: {str(e)}")


@router.post("/feedback/stop/{device_id}")
async def stop_feedback_loop(device_id: str):
    """
    Stop feedback loop service for a device.
    """
    try:
        feedback_loop = get_feedback_loop(device_id=device_id)
        
        if not feedback_loop.is_running:
            return {
                "status": "not_running",
                "device_id": device_id,
                "message": "Feedback loop is not running for this device"
            }
        
        feedback_loop.stop()
        
        return {
            "status": "stopped",
            "device_id": device_id,
            "message": f"Feedback loop stopped for device {device_id}"
        }
        
    except Exception as e:
        logger.error(f"Error stopping feedback loop: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to stop feedback loop: {str(e)}")


@router.get("/feedback/status/{device_id}")
async def get_feedback_status(device_id: str):
    """
    Get feedback loop status for a device.
    """
    try:
        feedback_loop = get_feedback_loop(device_id=device_id)
        status = feedback_loop.get_status()
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting feedback status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get feedback status: {str(e)}")


@router.post("/feedback/validate")
async def validate_command_manually(request: ValidationRequest):
    """
    Manually validate a command with provided before/after data.
    """
    try:
        # Get device_id from command
        tracker = get_tracker(device_id="crusher_01")  # Default, would need to query command
        commands = tracker.get_command_history(limit=100)
        command = next((c for c in commands if c.get("id") == request.command_id), None)
        
        if not command:
            raise HTTPException(status_code=404, detail=f"Command {request.command_id} not found")
        
        device_id = command.get("device_id", "crusher_01")
        feedback_loop = get_feedback_loop(device_id=device_id)
        
        validation_result = feedback_loop.validate_command_manually(
            command_id=request.command_id,
            before_data=request.before_data,
            after_data=request.after_data
        )
        
        return validation_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating command: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to validate command: {str(e)}")


@router.get("/feedback/performance/{device_id}")
async def get_performance_summary(
    device_id: str,
    hours: int = Query(default=24, ge=1, le=168)
):
    """
    Get performance validation summary for a device.
    """
    try:
        validator = get_validator(device_id=device_id)
        summary = validator.get_performance_summary(hours=hours)
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting performance summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get performance summary: {str(e)}")


@router.get("/feedback/adaptive/{device_id}")
async def get_adaptive_parameters(device_id: str):
    """
    Get adaptive learning parameters for a device.
    """
    try:
        adaptive = get_adaptive_controller(device_id=device_id)
        parameters = adaptive.get_adaptive_parameters()
        
        return parameters
        
    except Exception as e:
        logger.error(f"Error getting adaptive parameters: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get adaptive parameters: {str(e)}")


@router.get("/feedback/validations/{device_id}")
async def get_recent_validations(
    device_id: str,
    count: int = Query(default=10, ge=1, le=100)
):
    """
    Get recent performance validations for a device.
    """
    try:
        validator = get_validator(device_id=device_id)
        validations = validator.get_recent_validations(count=count)
        
        return {
            "device_id": device_id,
            "count": len(validations),
            "validations": validations
        }
        
    except Exception as e:
        logger.error(f"Error getting validations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get validations: {str(e)}")

