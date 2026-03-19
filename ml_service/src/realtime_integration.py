"""
Real-Time Integration Module

Integrates RealTimeMonitor, MaterialChangeDetector, and PredictionPipeline
for complete real-time material monitoring and change detection.

This module orchestrates:
1. Continuous sensor data polling
2. Real-time predictions
3. Material change detection
4. Event callbacks
"""

import logging
from typing import Dict, Any, Optional, Callable
from .real_time_monitor import RealTimeMonitor, get_monitor
from .material_change_detector import MaterialChangeDetector, get_detector
from .prediction_pipeline import PredictionPipeline, get_pipeline
from .prediction_storage import get_storage
from .alerting import get_alerting_system

logger = logging.getLogger(__name__)


class RealTimeIntegration:
    """Integrates all real-time monitoring components."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        poll_interval: float = 5.0,
        enable_storage: bool = True,
        min_confidence: float = 0.7
    ):
        """
        Initialize real-time integration.
        
        Args:
            device_id: Device identifier
            poll_interval: Polling interval in seconds
            enable_storage: Enable prediction storage
            min_confidence: Minimum confidence threshold
        """
        self.device_id = device_id
        
        # Initialize components
        self.monitor = get_monitor(device_id=device_id, poll_interval=poll_interval)
        self.detector = get_detector(device_id=device_id)
        self.pipeline = get_pipeline(
            cache_size=10,
            min_confidence_threshold=min_confidence,
            enable_caching=True
        )
        self.storage = get_storage() if enable_storage else None
        self.alerting = get_alerting_system(device_id=device_id)
        
        # Setup callbacks
        self.monitor.on_new_sample = self._on_new_sample
        self.detector.on_material_change = self._on_material_change
        self.pipeline.on_prediction_complete = self._on_prediction_complete
        
        # External callbacks
        self.on_material_change_detected: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_prediction_ready: Optional[Callable[[Dict[str, Any]], None]] = None
        
        logger.info(
            f"RealTimeIntegration initialized for device {device_id}, "
            f"poll_interval={poll_interval}s, storage={'enabled' if enable_storage else 'disabled'}"
        )
    
    def _on_new_sample(self, sample: Dict[str, Any]):
        """Handle new sensor sample from monitor."""
        try:
            # Extract required fields
            power_kw = sample.get("power_kw")
            feed_rate_tph = sample.get("feed_rate_tph")
            feed_size_mm = sample.get("feed_size_mm", 90.0)  # Default if not available
            current_rpm = sample.get("current_rpm")
            
            # Check if we have minimum required data
            if power_kw is None or feed_rate_tph is None:
                logger.debug(
                    f"Insufficient data for prediction: "
                    f"power_kw={power_kw}, feed_rate_tph={feed_rate_tph}"
                )
                return
            
            # Run prediction
            logger.debug(
                f"Running prediction for device {self.device_id}: "
                f"power={power_kw}kW, feed_rate={feed_rate_tph}TPH, feed_size={feed_size_mm}mm"
            )
            
            prediction = self.pipeline.predict_with_validation(
                power_kw=power_kw,
                feed_rate_tph=feed_rate_tph,
                feed_size_mm=feed_size_mm,
                current_rpm=current_rpm,
                require_confidence=True
            )
            
            # Add device_id and sample metadata
            prediction["device_id"] = self.device_id
            prediction["sample_timestamp"] = sample.get("timestamp")
            
            # Store prediction if enabled
            if self.storage and prediction.get("success"):
                try:
                    self.storage.store_prediction(prediction, self.device_id)
                except Exception as e:
                    logger.error(f"Failed to store prediction: {e}", exc_info=True)
            
            # Feed to change detector
            if prediction.get("success"):
                change_event = self.detector.add_prediction(prediction)
                if change_event:
                    logger.info(
                        f"Material change detected for device {self.device_id}: "
                        f"{change_event.get('change_type')}"
                    )
                    # Alert on material change
                    self.alerting.alert_material_change(change_event)
            
        except Exception as e:
            logger.error(f"Error processing new sample: {e}", exc_info=True)
    
    def _on_material_change(self, change_event: Dict[str, Any]):
        """Handle material change detection."""
        try:
            change_event["device_id"] = self.device_id
            
            # Call external callback if registered
            if self.on_material_change_detected:
                try:
                    self.on_material_change_detected(change_event)
                except Exception as e:
                    logger.error(f"Error in on_material_change_detected callback: {e}", exc_info=True)
            
            logger.info(
                f"Material change event for device {self.device_id}: "
                f"{change_event.get('description')}"
            )
            
        except Exception as e:
            logger.error(f"Error handling material change: {e}", exc_info=True)
    
    def _on_prediction_complete(self, prediction: Dict[str, Any]):
        """Handle prediction completion."""
        try:
            # Call external callback if registered
            if self.on_prediction_ready:
                try:
                    self.on_prediction_ready(prediction)
                except Exception as e:
                    logger.error(f"Error in on_prediction_ready callback: {e}", exc_info=True)
            
        except Exception as e:
            logger.error(f"Error handling prediction completion: {e}", exc_info=True)
    
    def start(self):
        """Start real-time monitoring."""
        logger.info(f"Starting real-time integration for device {self.device_id}")
        try:
            self.monitor.start()
        except Exception as e:
            logger.warning(f"Failed to start monitor: {e}. Integration will continue with limited functionality.")
            # Don't raise - allow service to start even if monitoring fails
            # Service can still work with manual predictions
    
    def stop(self):
        """Stop real-time monitoring."""
        logger.info(f"Stopping real-time integration for device {self.device_id}")
        self.monitor.stop()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of all components."""
        return {
            "device_id": self.device_id,
            "monitor": {
                "running": self.monitor.is_running,
                "healthy": self.monitor.is_healthy(),
                "latest_sample": self.monitor.get_latest_sample() is not None,
                "recent_samples_count": len(self.monitor.get_recent_samples())
            },
            "detector": {
                "recent_predictions_count": len(self.detector.get_recent_predictions())
            },
            "pipeline": {
                "cached_predictions_count": len(self.pipeline.get_recent_predictions())
            }
        }
    
    def get_latest_prediction(self) -> Optional[Dict[str, Any]]:
        """Get the most recent prediction."""
        predictions = self.pipeline.get_recent_predictions(count=1)
        return predictions[0] if predictions else None
    
    def get_recent_predictions(self, count: int = 10) -> list:
        """Get recent predictions."""
        return self.pipeline.get_recent_predictions(count=count)
    
    def get_material_change_history(self, count: int = 10) -> list:
        """Get recent material change events."""
        # This would need to be implemented if we want to track change history
        # For now, return recent predictions that might indicate changes
        return self.detector.get_recent_predictions(count=count)


# Global integration instances
_integration_instances: Dict[str, RealTimeIntegration] = {}


def get_integration(device_id: str = "crusher_01", **kwargs) -> RealTimeIntegration:
    """
    Get or create integration instance for a device.
    
    Args:
        device_id: Device identifier
        **kwargs: Additional arguments for RealTimeIntegration constructor
        
    Returns:
        RealTimeIntegration instance
    """
    global _integration_instances
    
    if device_id not in _integration_instances:
        _integration_instances[device_id] = RealTimeIntegration(device_id=device_id, **kwargs)
    
    return _integration_instances[device_id]

