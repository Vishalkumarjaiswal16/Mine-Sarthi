"""
Prediction Storage Module

Stores ML predictions in InfluxDB and PostgreSQL for tracking and analysis.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from influxdb import InfluxDBClient
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class PredictionStorage:
    """Handles storage of predictions in databases."""
    
    def __init__(self):
        """Initialize prediction storage with database connections."""
        # InfluxDB configuration
        self.influx_host = os.environ.get("INFLUX_HOST", "localhost")
        self.influx_port = int(os.environ.get("INFLUX_PORT", "8086"))
        self.influx_db = os.environ.get("INFLUX_DB", "mine_sarthi_realtime")
        self.influx_user = os.environ.get("INFLUX_USER", "admin")
        self.influx_password = os.environ.get("INFLUX_PASSWORD", "adminpass")
        
        # PostgreSQL configuration
        self.pg_host = os.environ.get("PG_HOST", "localhost")
        self.pg_port = int(os.environ.get("PG_PORT", "5432"))
        self.pg_db = os.environ.get("PG_DB", "mine_sarthi")
        self.pg_user = os.environ.get("PG_USER", "postgres")
        self.pg_password = os.environ.get("PG_PASSWORD", "password")
        
        # Storage settings
        self.store_predictions = os.environ.get("STORE_PREDICTIONS", "true").lower() == "true"
        
        self._influx_client = None
        self._pg_conn = None
        
    def get_influx_client(self) -> Optional[InfluxDBClient]:
        """Get or create InfluxDB client."""
        if not self.store_predictions:
            return None
            
        if self._influx_client is None:
            try:
                self._influx_client = InfluxDBClient(
                    host=self.influx_host,
                    port=self.influx_port,
                    username=self.influx_user,
                    password=self.influx_password,
                    database=self.influx_db
                )
                # Create database if it doesn't exist
                self._influx_client.create_database(self.influx_db)
                logger.info(f"Connected to InfluxDB at {self.influx_host}:{self.influx_port}")
            except Exception as e:
                logger.error(f"Failed to connect to InfluxDB: {str(e)}")
                self._influx_client = None
        
        return self._influx_client
    
    def get_pg_connection(self):
        """Get or create PostgreSQL connection."""
        if not self.store_predictions:
            return None
            
        if self._pg_conn is None or (hasattr(self._pg_conn, 'closed') and self._pg_conn.closed):
            try:
                self._pg_conn = psycopg2.connect(
                    host=self.pg_host,
                    port=self.pg_port,
                    database=self.pg_db,
                    user=self.pg_user,
                    password=self.pg_password,
                    connect_timeout=5  # 5 second timeout
                )
                logger.info(f"Connected to PostgreSQL at {self.pg_host}:{self.pg_port}")
            except Exception as e:
                logger.warning(f"PostgreSQL connection unavailable: {str(e)}")
                logger.debug("PredictionStorage will continue without PostgreSQL")
                self._pg_conn = None
        
        return self._pg_conn
    
    def store_prediction_influxdb(self, prediction: Dict[str, Any], device_id: str = "unknown") -> bool:
        """
        Store prediction in InfluxDB.
        
        Args:
            prediction: Prediction result dictionary
            device_id: Device identifier
            
        Returns:
            True if successful, False otherwise
        """
        if not self.store_predictions:
            return False
            
        client = self.get_influx_client()
        if client is None:
            return False
        
        try:
            timestamp = prediction.get("timestamp", datetime.now(timezone.utc).isoformat())
            
            # Convert ISO timestamp to datetime
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            points = []
            
            # Store ore classification
            if "ore_classification" in prediction:
                ore_data = prediction["ore_classification"]
                points.append({
                    "measurement": "ml_predictions",
                    "tags": {
                        "device_id": device_id,
                        "prediction_type": "ore_classification"
                    },
                    "time": timestamp.isoformat() if isinstance(timestamp, datetime) else timestamp,
                    "fields": {
                        "predicted_class": ore_data.get("predicted_class", ""),
                        "confidence": float(ore_data.get("confidence", 0.0)),
                        "prob_hard": float(ore_data.get("probabilities", {}).get("hard", 0.0)),
                        "prob_medium": float(ore_data.get("probabilities", {}).get("medium", 0.0)),
                        "prob_soft": float(ore_data.get("probabilities", {}).get("soft", 0.0))
                    }
                })
            
            # Store RPM recommendation
            if "rpm_recommendation" in prediction:
                rpm_data = prediction["rpm_recommendation"]
                points.append({
                    "measurement": "ml_predictions",
                    "tags": {
                        "device_id": device_id,
                        "prediction_type": "rpm_recommendation"
                    },
                    "time": timestamp.isoformat() if isinstance(timestamp, datetime) else timestamp,
                    "fields": {
                        "recommended_rpm": float(rpm_data.get("recommended_rpm", 0.0)),
                        "predicted_energy_kwh_per_ton": float(rpm_data.get("predicted_energy_kwh_per_ton", 0.0)),
                        "optimal_css_mm": float(rpm_data.get("optimal_css_mm", 0.0)),
                        "energy_savings_pct": float(rpm_data.get("energy_savings_pct", 0.0)),
                        "confidence": rpm_data.get("confidence", "Unknown")
                    }
                })
            
            if points:
                client.write_points(points)
                logger.debug(f"Stored {len(points)} prediction points in InfluxDB for device {device_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to store prediction in InfluxDB: {str(e)}", exc_info=True)
            return False
    
    def store_prediction_postgres(self, prediction: Dict[str, Any], device_id: str = "unknown") -> bool:
        """
        Store prediction in PostgreSQL.
        
        Args:
            prediction: Prediction result dictionary
            device_id: Device identifier
            
        Returns:
            True if successful, False otherwise
        """
        if not self.store_predictions:
            return False
            
        conn = self.get_pg_connection()
        if conn is None:
            return False
        
        try:
            cursor = conn.cursor()
            
            timestamp = prediction.get("timestamp", datetime.now(timezone.utc).isoformat())
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            # Create table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ml_predictions (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    predicted_ore_type VARCHAR(20),
                    ore_confidence DOUBLE PRECISION,
                    recommended_rpm DOUBLE PRECISION,
                    predicted_energy_kwh_per_ton DOUBLE PRECISION,
                    optimal_css_mm DOUBLE PRECISION,
                    energy_savings_pct DOUBLE PRECISION,
                    prediction_json JSONB,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_ml_predictions_device_time 
                ON ml_predictions(device_id, timestamp DESC);
            """)
            
            conn.commit()
            
            # Extract data
            ore_classification = prediction.get("ore_classification", {})
            rpm_recommendation = prediction.get("rpm_recommendation", {})
            
            # Insert prediction
            cursor.execute("""
                INSERT INTO ml_predictions (
                    device_id, timestamp, predicted_ore_type, ore_confidence,
                    recommended_rpm, predicted_energy_kwh_per_ton, optimal_css_mm,
                    energy_savings_pct, prediction_json
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                device_id,
                timestamp,
                ore_classification.get("predicted_class"),
                ore_classification.get("confidence"),
                rpm_recommendation.get("recommended_rpm"),
                rpm_recommendation.get("predicted_energy_kwh_per_ton"),
                rpm_recommendation.get("optimal_css_mm"),
                rpm_recommendation.get("energy_savings_pct"),
                psycopg2.extras.Json(prediction)
            ))
            
            conn.commit()
            cursor.close()
            
            logger.debug(f"Stored prediction in PostgreSQL for device {device_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store prediction in PostgreSQL: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            return False
    
    def store_prediction(self, prediction: Dict[str, Any], device_id: str = "unknown") -> Dict[str, bool]:
        """
        Store prediction in both InfluxDB and PostgreSQL.
        
        Args:
            prediction: Prediction result dictionary
            device_id: Device identifier
            
        Returns:
            Dictionary with storage results for each database
        """
        result = {
            "influxdb": False,
            "postgres": False
        }
        
        if not self.store_predictions:
            logger.debug("Prediction storage is disabled")
            return result
        
        result["influxdb"] = self.store_prediction_influxdb(prediction, device_id)
        result["postgres"] = self.store_prediction_postgres(prediction, device_id)
        
        return result


# Global storage instance
_storage_instance: Optional[PredictionStorage] = None


def get_storage() -> PredictionStorage:
    """Get or create global storage instance."""
    global _storage_instance
    
    if _storage_instance is None:
        _storage_instance = PredictionStorage()
    
    return _storage_instance

