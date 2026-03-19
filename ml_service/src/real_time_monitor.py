"""
Real-Time Material Monitoring Module

Continuously monitors sensor data from the backend data pipeline to detect
material characteristics and trigger analysis when changes are detected.

Features:
- Polls sensor data every 5-10 seconds
- Extracts: power_kw, feed_rate_tph, feed_size_mm, ore_fines_pct, current_rpm
- Detects material property changes
- Feeds data to prediction pipeline
"""

import os
import logging
import time
import requests
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable, List
from collections import deque
from threading import Thread, Event
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class RealTimeMonitor:
    """Real-time sensor data monitor for material characterization."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        backend_url: str = None,
        poll_interval: float = 5.0,
        window_size: int = 10
    ):
        """
        Initialize real-time monitor.
        
        Args:
            device_id: Device identifier to monitor
            backend_url: Backend FastAPI URL (default: from env or http://localhost:8000)
            poll_interval: Polling interval in seconds (default: 5.0)
            window_size: Number of recent samples to keep in memory (default: 10)
        """
        self.device_id = device_id
        self.backend_url = backend_url or os.environ.get(
            "BACKEND_URL", 
            "http://localhost:8000"
        ).rstrip("/")
        self.poll_interval = poll_interval
        self.window_size = window_size
        
        # Data storage
        self.recent_samples: deque = deque(maxlen=window_size)
        self.latest_sample: Optional[Dict[str, Any]] = None
        
        # Monitoring state
        self.is_running = False
        self._stop_event = Event()
        self._monitor_thread: Optional[Thread] = None
        
        # Callbacks
        self.on_new_sample: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_material_change: Optional[Callable[[Dict[str, Any], Dict[str, Any]], None]] = None
        
        logger.info(
            f"RealTimeMonitor initialized for device {device_id}, "
            f"polling every {poll_interval}s from {self.backend_url}"
        )
    
    def _fetch_latest_sensor_data(self) -> Optional[Dict[str, Any]]:
        """
        Fetch latest sensor data from backend.
        
        Returns:
            Dictionary with sensor readings or None if failed
        """
        try:
            # Try to get latest time-series data
            url = f"{self.backend_url}/timeseries/{self.device_id}"
            params = {
                "minutes": 1,  # Get last 1 minute of data
                "aggregation": "last"  # Get last value
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract latest point
                if isinstance(data, dict) and "data" in data:
                    points = data["data"]
                    if points and len(points) > 0:
                        latest = points[-1]  # Most recent point
                        return self._normalize_sensor_data(latest)
                elif isinstance(data, list) and len(data) > 0:
                    latest = data[-1]
                    return self._normalize_sensor_data(latest)
            
            # Fallback: Try AI features endpoint
            url = f"{self.backend_url}/ai/features/{self.device_id}"
            params = {"minutes": 1, "window_seconds": 10}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "data" in data:
                    points = data["data"]
                    if points and len(points) > 0:
                        latest = points[-1]
                        return self._normalize_from_features(latest)
            
            logger.warning(f"No sensor data available for device {self.device_id}")
            return None
            
        except requests.exceptions.Timeout:
            logger.warning(f"Backend request timed out for device {self.device_id}")
            return None
        except requests.exceptions.ConnectionError:
            logger.warning(f"Failed to connect to backend at {self.backend_url}")
            return None
        except Exception as e:
            logger.error(f"Error fetching sensor data: {str(e)}", exc_info=True)
            return None
    
    def _normalize_sensor_data(self, point: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize sensor data point to standard format.
        
        Args:
            point: Raw sensor data point from backend
            
        Returns:
            Normalized sensor data dictionary
        """
        # Extract timestamp
        timestamp = point.get("time") or point.get("timestamp") or datetime.now(timezone.utc).isoformat()
        
        # Extract sensor values
        normalized = {
            "device_id": self.device_id,
            "timestamp": timestamp,
            "power_kw": self._extract_float(point, ["power_kw", "power"]),
            "feed_rate_tph": self._extract_float(point, ["feed_tph", "feed_rate_tph", "feed_rate"]),
            "feed_size_mm": self._extract_float(point, ["feed_size_mm", "feed_size"]),
            "ore_fines_pct": self._extract_float(point, ["ore_fines_pct", "fines_pct", "fines"]),
            "current_rpm": self._extract_float(point, ["rpm", "current_rpm"]),
            "vibration": self._extract_float(point, ["vibration"]),
            "temperature_c": self._extract_float(point, ["temperature_c", "temperature"]),
            "motor_current_a": self._extract_float(point, ["motor_current_a", "current"]),
            "hardness_index": self._extract_float(point, ["hardness_index", "hardness"])
        }
        
        return normalized
    
    def _normalize_from_features(self, point: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize from aggregated features endpoint.
        
        Args:
            point: Aggregated features point
            
        Returns:
            Normalized sensor data dictionary
        """
        timestamp = point.get("time") or datetime.now(timezone.utc).isoformat()
        
        normalized = {
            "device_id": self.device_id,
            "timestamp": timestamp,
            "power_kw": self._extract_float(point, ["avg_power", "power_kw"]),
            "feed_rate_tph": self._extract_float(point, ["avg_feed", "feed_tph", "feed_rate_tph"]),
            "feed_size_mm": None,  # May not be in aggregated data
            "ore_fines_pct": None,  # May not be in aggregated data
            "current_rpm": self._extract_float(point, ["avg_rpm", "rpm"]),
            "vibration": self._extract_float(point, ["avg_vibration", "vibration"]),
            "temperature_c": None,
            "motor_current_a": None,
            "hardness_index": None
        }
        
        return normalized
    
    def _extract_float(self, data: Dict[str, Any], keys: List[str]) -> Optional[float]:
        """Extract float value from data using multiple possible keys."""
        for key in keys:
            value = data.get(key)
            if value is not None:
                try:
                    return float(value)
                except (ValueError, TypeError):
                    continue
        return None
    
    def _monitoring_loop(self):
        """Main monitoring loop running in background thread."""
        logger.info(f"Starting monitoring loop for device {self.device_id}")
        
        while not self._stop_event.is_set():
            try:
                # Fetch latest sensor data
                sample = self._fetch_latest_sensor_data()
                
                if sample:
                    # Check if we have required fields for prediction
                    has_required = (
                        sample.get("power_kw") is not None and
                        sample.get("feed_rate_tph") is not None
                    )
                    
                    if has_required:
                        # Store sample
                        self.latest_sample = sample
                        self.recent_samples.append(sample)
                        
                        # Call new sample callback
                        if self.on_new_sample:
                            try:
                                self.on_new_sample(sample)
                            except Exception as e:
                                logger.error(f"Error in on_new_sample callback: {e}", exc_info=True)
                    else:
                        logger.debug(
                            f"Sample missing required fields: "
                            f"power_kw={sample.get('power_kw')}, "
                            f"feed_rate_tph={sample.get('feed_rate_tph')}"
                        )
                
                # Wait for next poll interval
                self._stop_event.wait(self.poll_interval)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}", exc_info=True)
                # Wait a bit before retrying
                self._stop_event.wait(min(self.poll_interval, 5.0))
        
        logger.info(f"Monitoring loop stopped for device {self.device_id}")
    
    def start(self):
        """Start real-time monitoring in background thread."""
        if self.is_running:
            logger.warning("Monitor is already running")
            return
        
        self.is_running = True
        self._stop_event.clear()
        
        self._monitor_thread = Thread(
            target=self._monitoring_loop,
            name=f"RealTimeMonitor-{self.device_id}",
            daemon=True
        )
        self._monitor_thread.start()
        
        logger.info(f"Real-time monitoring started for device {self.device_id}")
    
    def stop(self):
        """Stop real-time monitoring."""
        if not self.is_running:
            return
        
        logger.info(f"Stopping real-time monitoring for device {self.device_id}")
        
        self.is_running = False
        self._stop_event.set()
        
        if self._monitor_thread:
            self._monitor_thread.join(timeout=10.0)
            if self._monitor_thread.is_alive():
                logger.warning("Monitor thread did not stop gracefully")
        
        logger.info(f"Real-time monitoring stopped for device {self.device_id}")
    
    def get_latest_sample(self) -> Optional[Dict[str, Any]]:
        """Get the most recent sensor sample."""
        return self.latest_sample
    
    def get_recent_samples(self, count: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get recent sensor samples.
        
        Args:
            count: Number of samples to return (default: all available)
            
        Returns:
            List of recent sensor samples
        """
        samples = list(self.recent_samples)
        if count is not None:
            return samples[-count:] if count > 0 else []
        return samples
    
    def is_healthy(self) -> bool:
        """
        Check if monitor is healthy (running and receiving data).
        
        Returns:
            True if monitor is running and has recent data
        """
        if not self.is_running:
            return False
        
        if not self.latest_sample:
            return False
        
        # Check if latest sample is recent (within 2 poll intervals)
        try:
            timestamp_str = self.latest_sample.get("timestamp")
            if timestamp_str:
                if isinstance(timestamp_str, str):
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    return False
                
                age_seconds = (datetime.now(timezone.utc) - timestamp.replace(tzinfo=timezone.utc)).total_seconds()
                max_age = self.poll_interval * 2
                
                return age_seconds < max_age
        except Exception:
            pass
        
        return True


# Global monitor instances (one per device)
_monitor_instances: Dict[str, RealTimeMonitor] = {}


def get_monitor(device_id: str = "crusher_01", **kwargs) -> RealTimeMonitor:
    """
    Get or create monitor instance for a device.
    
    Args:
        device_id: Device identifier
        **kwargs: Additional arguments for RealTimeMonitor constructor
        
    Returns:
        RealTimeMonitor instance
    """
    global _monitor_instances
    
    if device_id not in _monitor_instances:
        _monitor_instances[device_id] = RealTimeMonitor(device_id=device_id, **kwargs)
    
    return _monitor_instances[device_id]

