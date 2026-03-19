"""
Monitoring API Endpoints

Endpoints for monitoring MQTT command delivery and energy savings.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query

from src.mqtt_command_monitor import get_command_monitor
from src.command_tracker import get_tracker
from src.speed_control_service import get_control_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/monitoring/commands/{device_id}")
async def get_recent_commands(
    device_id: str,
    count: int = Query(default=10, ge=1, le=100, description="Number of commands to return")
):
    """
    Get recent MQTT commands received for a device.
    """
    try:
        monitor = get_command_monitor(device_id=device_id)
        commands = monitor.get_recent_commands(count=count)
        
        return {
            "device_id": device_id,
            "count": len(commands),
            "commands": commands,
            "monitor_status": monitor.get_status()
        }
        
    except Exception as e:
        logger.error(f"Error getting recent commands: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get commands: {str(e)}")


@router.get("/monitoring/tracker/{device_id}")
async def get_command_tracking(
    device_id: str,
    limit: int = Query(default=50, ge=1, le=200, description="Number of records to return"),
    status: str = Query(default=None, description="Filter by execution status")
):
    """
    Get command tracking history from database.
    """
    try:
        tracker = get_tracker(device_id=device_id)
        history = tracker.get_command_history(limit=limit, status=status)
        
        return {
            "device_id": device_id,
            "count": len(history),
            "commands": history
        }
        
    except Exception as e:
        logger.error(f"Error getting command tracking: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get tracking: {str(e)}")


@router.get("/monitoring/energy-savings/{device_id}")
async def get_energy_savings(
    device_id: str,
    hours: int = Query(default=24, ge=1, le=168, description="Time window in hours")
):
    """
    Get energy savings summary for a device.
    """
    try:
        tracker = get_tracker(device_id=device_id)
        summary = tracker.get_energy_savings_summary(hours=hours)
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting energy savings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get energy savings: {str(e)}")


@router.get("/monitoring/status/{device_id}")
async def get_monitoring_status(device_id: str):
    """
    Get complete monitoring status for a device.
    """
    try:
        monitor = get_command_monitor(device_id=device_id)
        tracker = get_tracker(device_id=device_id)
        service = get_control_service(device_id=device_id)
        
        return {
            "device_id": device_id,
            "mqtt_monitor": monitor.get_status(),
            "control_service": service.get_status(),
            "energy_savings_24h": tracker.get_energy_savings_summary(hours=24)
        }
        
    except Exception as e:
        logger.error(f"Error getting monitoring status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get monitoring status: {str(e)}")

