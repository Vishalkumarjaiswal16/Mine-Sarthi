"""
Dashboard API Endpoints

Provides endpoints for real-time dashboard display including:
- Current/latest predictions
- Historical prediction data
- Statistics and aggregations
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from src.prediction_storage import get_storage
from src.safety_interlocks import get_safety_interlocks
from src.alerting import get_alerting_system
from src.speed_control_service import get_control_service
from src.command_tracker import get_tracker

logger = logging.getLogger(__name__)

router = APIRouter()


class CurrentPredictionResponse(BaseModel):
    """Response model for current prediction."""
    device_id: str
    timestamp: str
    ore_hardness: str
    confidence: float
    probabilities: Dict[str, float]
    recommended_rpm: Optional[float] = None
    predicted_energy: Optional[float] = None
    energy_savings: Optional[float] = None


class HistoricalDataPoint(BaseModel):
    """Single historical data point."""
    timestamp: str
    ore_hardness: str
    confidence: float
    recommended_rpm: Optional[float] = None
    predicted_energy: Optional[float] = None


class HistoricalResponse(BaseModel):
    """Response model for historical data."""
    device_id: str
    data_points: List[HistoricalDataPoint]
    time_range: Dict[str, str]


@router.get("/dashboard/current/{device_id}", response_model=CurrentPredictionResponse, tags=["Dashboard"])
async def get_current_prediction(device_id: str):
    """
    Get the most recent prediction for a device.
    
    Returns the latest ore hardness prediction with confidence and probabilities.
    """
    try:
        storage = get_storage()
        
        # Try to get from PostgreSQL first (more reliable)
        conn = storage.get_pg_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    device_id,
                    timestamp,
                    predicted_ore_type,
                    ore_confidence,
                    recommended_rpm,
                    predicted_energy_kwh_per_ton,
                    energy_savings_pct,
                    prediction_json
                FROM ml_predictions
                WHERE device_id = %s
                ORDER BY timestamp DESC
                LIMIT 1
            """, (device_id,))
            
            row = cursor.fetchone()
            cursor.close()
            
            if row:
                # Extract probabilities from JSON if available
                probabilities = {}
                if row[7]:  # prediction_json
                    json_data = row[7]
                    if isinstance(json_data, dict) and "ore_classification" in json_data:
                        probabilities = json_data["ore_classification"].get("probabilities", {})
                
                return CurrentPredictionResponse(
                    device_id=row[0],
                    timestamp=row[1].isoformat() if isinstance(row[1], datetime) else str(row[1]),
                    ore_hardness=row[2] or "Unknown",
                    confidence=float(row[3] or 0.0),
                    probabilities=probabilities,
                    recommended_rpm=float(row[4]) if row[4] else None,
                    predicted_energy=float(row[5]) if row[5] else None,
                    energy_savings=float(row[6]) if row[6] else None
                )
        
        # If no data in PostgreSQL, try InfluxDB
        client = storage.get_influx_client()
        if client:
            query = f"""
                SELECT * FROM ml_predictions
                WHERE device_id = '{device_id}' AND prediction_type = 'ore_classification'
                ORDER BY time DESC
                LIMIT 1
            """
            results = client.query(query)
            
            for point in results.get_points():
                probabilities = {
                    "Hard": point.get("prob_hard", 0.0),
                    "Medium": point.get("prob_medium", 0.0),
                    "Soft": point.get("prob_soft", 0.0)
                }
                
                return CurrentPredictionResponse(
                    device_id=device_id,
                    timestamp=point.get("time", datetime.now(timezone.utc).isoformat()),
                    ore_hardness=point.get("predicted_class", "Unknown"),
                    confidence=float(point.get("confidence", 0.0)),
                    probabilities=probabilities,
                    recommended_rpm=None,
                    predicted_energy=None,
                    energy_savings=None
                )
        
        # No data found
        raise HTTPException(status_code=404, detail=f"No predictions found for device {device_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current prediction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching current prediction: {str(e)}")


@router.get("/dashboard/historical/{device_id}", response_model=HistoricalResponse, tags=["Dashboard"])
async def get_historical_predictions(
    device_id: str,
    hours: int = Query(24, description="Number of hours of history to retrieve", ge=1, le=168),
    limit: int = Query(100, description="Maximum number of data points", ge=1, le=1000)
):
    """
    Get historical prediction data for a device.
    
    Returns time-series data for visualization in charts.
    """
    try:
        storage = get_storage()
        data_points = []
        
        # Calculate time range
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours)
        
        # Try to get from PostgreSQL
        conn = storage.get_pg_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    timestamp,
                    predicted_ore_type,
                    ore_confidence,
                    recommended_rpm,
                    predicted_energy_kwh_per_ton
                FROM ml_predictions
                WHERE device_id = %s 
                AND timestamp >= %s
                AND timestamp <= %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (device_id, start_time, end_time, limit))
            
            rows = cursor.fetchall()
            cursor.close()
            
            for row in rows:
                data_points.append(HistoricalDataPoint(
                    timestamp=row[0].isoformat() if isinstance(row[0], datetime) else str(row[0]),
                    ore_hardness=row[1] or "Unknown",
                    confidence=float(row[2] or 0.0),
                    recommended_rpm=float(row[3]) if row[3] else None,
                    predicted_energy=float(row[4]) if row[4] else None
                ))
            
            # Reverse to get chronological order
            data_points.reverse()
            
            return HistoricalResponse(
                device_id=device_id,
                data_points=data_points,
                time_range={
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                }
            )
        
        # If no PostgreSQL data, try InfluxDB
        client = storage.get_influx_client()
        if client:
            query = f"""
                SELECT * FROM ml_predictions
                WHERE device_id = '{device_id}' 
                AND prediction_type = 'ore_classification'
                AND time >= '{start_time.isoformat()}'
                AND time <= '{end_time.isoformat()}'
                ORDER BY time DESC
                LIMIT {limit}
            """
            results = client.query(query)
            
            for point in results.get_points():
                data_points.append(HistoricalDataPoint(
                    timestamp=point.get("time", ""),
                    ore_hardness=point.get("predicted_class", "Unknown"),
                    confidence=float(point.get("confidence", 0.0)),
                    recommended_rpm=None,
                    predicted_energy=None
                ))
            
            data_points.reverse()
            
            return HistoricalResponse(
                device_id=device_id,
                data_points=data_points,
                time_range={
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                }
            )
        
        # No data found
        return HistoricalResponse(
            device_id=device_id,
            data_points=[],
            time_range={
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Error fetching historical predictions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching historical predictions: {str(e)}")


@router.get("/dashboard/stats/{device_id}", tags=["Dashboard"])
async def get_prediction_stats(
    device_id: str,
    hours: int = Query(24, description="Number of hours for statistics", ge=1, le=168)
):
    """
    Get aggregated statistics for a device.
    
    Returns summary statistics including:
    - Ore type distribution
    - Average confidence
    - Average RPM recommendations
    - Average predicted energy
    """
    try:
        storage = get_storage()
        
        start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        conn = storage.get_pg_connection()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection unavailable")
        
        cursor = conn.cursor()
        
        # Get ore type distribution
        cursor.execute("""
            SELECT 
                predicted_ore_type,
                COUNT(*) as count,
                AVG(ore_confidence) as avg_confidence
            FROM ml_predictions
            WHERE device_id = %s AND timestamp >= %s
            GROUP BY predicted_ore_type
        """, (device_id, start_time))
        
        ore_distribution = {}
        for row in cursor.fetchall():
            ore_distribution[row[0] or "Unknown"] = {
                "count": row[1],
                "avg_confidence": float(row[2] or 0.0)
            }
        
        # Get averages
        cursor.execute("""
            SELECT 
                AVG(ore_confidence) as avg_confidence,
                AVG(recommended_rpm) as avg_rpm,
                AVG(predicted_energy_kwh_per_ton) as avg_energy,
                COUNT(*) as total_predictions
            FROM ml_predictions
            WHERE device_id = %s AND timestamp >= %s
        """, (device_id, start_time))
        
        row = cursor.fetchone()
        cursor.close()
        
        return {
            "device_id": device_id,
            "time_range_hours": hours,
            "total_predictions": row[3] or 0,
            "ore_distribution": ore_distribution,
            "averages": {
                "confidence": float(row[0] or 0.0),
                "recommended_rpm": float(row[1] or 0.0) if row[1] else None,
                "predicted_energy_kwh_per_ton": float(row[2] or 0.0) if row[2] else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prediction stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

