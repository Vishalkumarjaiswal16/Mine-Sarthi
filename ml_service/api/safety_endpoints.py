"""
Safety & Alerts API Endpoints

Thin API layer over src.safety_interlocks and src.alerting.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.safety_interlocks import get_safety_interlocks
from src.alerting import get_alerting_system

logger = logging.getLogger(__name__)

router = APIRouter()


class ValidateSafetyRequest(BaseModel):
    device_id: str = Field(default="crusher_01")
    target_rpm: float = Field(..., description="Target RPM to validate")
    sensor_data: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional current sensor snapshot"
    )


@router.get("/safety/status/{device_id}")
async def get_safety_status(device_id: str) -> Dict[str, Any]:
    interlocks = get_safety_interlocks(device_id=device_id)
    return {
        "device_id": device_id,
        "limits": {
            "min_rpm": interlocks.min_rpm,
            "max_rpm": interlocks.max_rpm,
            "max_power_kw": interlocks.max_power_kw,
            "max_vibration": interlocks.max_vibration,
            "max_temperature_c": interlocks.max_temperature_c,
            "emergency_stop_enabled": interlocks.emergency_stop_enabled,
        },
    }


@router.post("/safety/validate")
async def validate_safety(req: ValidateSafetyRequest) -> Dict[str, Any]:
    interlocks = get_safety_interlocks(device_id=req.device_id)
    ok, reason, details = interlocks.validate_control_command(
        target_rpm=req.target_rpm, sensor_data=req.sensor_data
    )
    return {
        "device_id": req.device_id,
        "is_safe": ok,
        "reason": reason,
        "details": details,
    }


@router.get("/alerts/{device_id}/active")
async def get_active_alerts(device_id: str) -> Dict[str, Any]:
    alerting = get_alerting_system(device_id=device_id)
    alerts = [a.to_dict() for a in getattr(alerting, "active_alerts", [])]
    return {"device_id": device_id, "count": len(alerts), "alerts": alerts}


@router.get("/alerts/{device_id}/history")
async def get_alert_history(device_id: str, limit: int = 100) -> Dict[str, Any]:
    alerting = get_alerting_system(device_id=device_id)
    all_alerts = list(getattr(alerting, "alerts", []))
    items = [a.to_dict() for a in all_alerts[-limit:]][::-1]
    return {"device_id": device_id, "count": len(items), "alerts": items}

