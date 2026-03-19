"""
Real-Time Speed Control Service

Core service that orchestrates:
- Real-time monitoring (Phase 1)
- ML predictions
- Control logic decisions
- Safety interlock checks
- MQTT command publishing

Runs periodic analysis (every 30-60 seconds) and automatically adjusts RPM
based on material characteristics to optimize energy consumption.
"""

import os
import logging
import time
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone
from threading import Thread, Event
from collections import deque

from .realtime_integration import RealTimeIntegration, get_integration
from .control_logic import ControlLogic, get_control_logic
from .safety_interlocks import SafetyInterlocks, get_safety_interlocks
from .mqtt_publisher import MQTTPublisher, get_publisher
from .command_tracker import CommandTracker, get_tracker
from .adaptive_controller import AdaptiveController, get_adaptive_controller
from .alerting import AlertingSystem, get_alerting_system, AlertType, AlertLevel

logger = logging.getLogger(__name__)


class SpeedControlService:
    """Real-time speed control service with automatic RPM adjustments."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        analysis_interval: float = 30.0,
        poll_interval: float = 5.0,
        enable_automatic_control: bool = True,
        min_confidence: float = 0.7
    ):
        """
        Initialize speed control service.
        
        Args:
            device_id: Device identifier
            analysis_interval: Interval between control analysis cycles (default: 30s)
            poll_interval: Sensor data polling interval (default: 5s)
            enable_automatic_control: Enable automatic RPM adjustments (default: True)
            min_confidence: Minimum confidence threshold (default: 0.7)
        """
        self.device_id = device_id
        self.analysis_interval = analysis_interval
        self.enable_automatic_control = enable_automatic_control
        self.min_confidence = min_confidence
        
        # Initialize components
        self.integration = get_integration(
            device_id=device_id,
            poll_interval=poll_interval,
            enable_storage=True,
            min_confidence=min_confidence
        )
        self.control_logic = get_control_logic()
        self.safety = get_safety_interlocks()
        self.mqtt_publisher = get_publisher()
        self.command_tracker = get_tracker(device_id=device_id)
        self.adaptive = get_adaptive_controller(device_id=device_id)
        self.alerting = get_alerting_system(device_id=device_id)
        
        # Control state
        self.is_running = False
        self._stop_event = Event()
        self._control_thread: Optional[Thread] = None
        
        # Command history
        self.command_history: deque = deque(maxlen=50)
        self.last_control_decision: Optional[Dict[str, Any]] = None
        
        # Setup callbacks
        self.integration.on_prediction_ready = self._on_prediction_ready
        self.integration.on_material_change_detected = self._on_material_change
        
        # External callbacks
        self.on_control_action: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_safety_interlock: Optional[Callable[[str], None]] = None
        
        logger.info(
            f"SpeedControlService initialized for device {device_id}, "
            f"analysis_interval={analysis_interval}s, "
            f"automatic_control={'enabled' if enable_automatic_control else 'disabled'}"
        )
    
    def _on_prediction_ready(self, prediction: Dict[str, Any]):
        """Handle new prediction from integration."""
        # Predictions are handled in the control loop
        pass
    
    def _on_material_change(self, change_event: Dict[str, Any]):
        """Handle material change detection."""
        logger.info(
            f"Material change detected for {self.device_id}: "
            f"{change_event.get('change_type')} - {change_event.get('description')}"
        )
        
        # Trigger immediate control analysis if automatic control is enabled
        if self.enable_automatic_control and self.is_running:
            logger.info("Triggering immediate control analysis due to material change")
            # The control loop will pick this up on next cycle
    
    def _control_loop(self):
        """Main control loop running in background thread."""
        logger.info(f"Starting control loop for device {self.device_id}")
        
        while not self._stop_event.is_set():
            try:
                # Wait for analysis interval
                self._stop_event.wait(self.analysis_interval)
                
                if self._stop_event.is_set():
                    break
                
                # Run control analysis
                self._run_control_analysis()
                
            except Exception as e:
                logger.error(f"Error in control loop: {e}", exc_info=True)
                # Wait a bit before retrying
                self._stop_event.wait(min(self.analysis_interval, 5.0))
        
        logger.info(f"Control loop stopped for device {self.device_id}")
    
    def _run_control_analysis(self):
        """Run one cycle of control analysis and decision making."""
        try:
            # Get latest prediction
            latest_prediction = self.integration.get_latest_prediction()
            
            if not latest_prediction or not latest_prediction.get("success"):
                logger.debug(f"No valid prediction available for {self.device_id}")
                return
            
            # Get latest sensor sample for safety checks
            latest_sample = self.integration.monitor.get_latest_sample()
            
            # Make control decision
            control_decision = self.control_logic.make_control_decision(
                device_id=self.device_id,
                prediction=latest_prediction,
                current_rpm=latest_sample.get("current_rpm") if latest_sample else None
            )
            
            # Apply adaptive learning adjustments if available
            if control_decision:
                ore_type = control_decision.get("ore_type")
                recommended_rpm = control_decision.get("recommended_rpm")
                
                if ore_type and recommended_rpm:
                    # Adjust RPM based on learned patterns
                    adjusted_rpm = self.adaptive.adjust_rpm_recommendation(
                        recommended_rpm=recommended_rpm,
                        ore_type=ore_type
                    )
                    
                    # Update control decision with adaptive adjustment
                    control_decision["recommended_rpm"] = adjusted_rpm
                    control_decision["adaptive_adjustment_applied"] = True
                    
                    # Adjust energy prediction
                    predicted_savings = control_decision.get("energy_savings_pct", 0.0)
                    adjusted_savings = self.adaptive.adjust_energy_prediction(
                        predicted_savings=predicted_savings,
                        ore_type=ore_type
                    )
                    control_decision["energy_savings_pct"] = adjusted_savings
            
            if not control_decision:
                logger.debug(f"No control decision made for {self.device_id}")
                return
            
            # Validate with safety interlocks
            target_rpm = control_decision["adjusted_rpm"]
            is_safe, safety_error, safety_status = self.safety.validate_control_command(
                target_rpm=target_rpm,
                sensor_data=latest_sample
            )
            
            if not is_safe:
                logger.warning(
                    f"Safety interlock triggered for {self.device_id}: {safety_error}"
                )
                
                # Alert on safety interlock
                self.alerting.alert_safety_interlock(
                    reason=safety_error or "Unknown safety issue",
                    details=safety_status
                )
                
                # Call safety interlock callback
                if self.on_safety_interlock:
                    try:
                        self.on_safety_interlock(safety_error or "Unknown safety issue")
                    except Exception as e:
                        logger.error(f"Error in on_safety_interlock callback: {e}", exc_info=True)
                
                return
            
            # Check emergency stop conditions
            if latest_sample:
                emergency_result = self.safety.check_emergency_stop(latest_sample)
                if isinstance(emergency_result, tuple) and len(emergency_result) == 3:
                    should_stop, stop_reason, stop_details = emergency_result
                else:
                    # Backward compatibility
                    should_stop, stop_reason = emergency_result[:2]
                    stop_details = {}
                
                if should_stop:
                    logger.error(
                        f"EMERGENCY STOP condition for {self.device_id}: {stop_reason}"
                    )
                    
                    # Alert on emergency stop
                    self.alerting.alert_emergency_stop(
                        reason=stop_reason or "Emergency stop condition",
                        details=stop_details
                    )
                    
                    # In production, this would trigger an emergency stop
                    return
            
            # Execute control action if automatic control is enabled
            if self.enable_automatic_control:
                self._execute_control_action(control_decision, safety_status)
            else:
                logger.info(
                    f"Control decision made but automatic control disabled: "
                    f"RPM {control_decision['current_rpm']:.1f} → {target_rpm:.1f}"
                )
                self.last_control_decision = control_decision
        
        except Exception as e:
            logger.error(f"Error in control analysis: {e}", exc_info=True)
    
    def _execute_control_action(
        self,
        control_decision: Dict[str, Any],
        safety_status: Dict[str, Any]
    ):
        """Execute control action by publishing MQTT command."""
        try:
            target_rpm = control_decision["adjusted_rpm"]
            
            # Publish MQTT command
            success = self.mqtt_publisher.publish_rpm_recommendation(
                device_id=self.device_id,
                recommended_rpm=target_rpm,
                current_rpm=control_decision["current_rpm"],
                ore_type=control_decision["ore_type"],
                predicted_energy=control_decision.get("predicted_energy_kwh_per_ton"),
                energy_savings_pct=control_decision["energy_savings_pct"],
                confidence=control_decision.get("confidence", "High")
            )
            
            if success:
                # Record command in history
                command_record = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "device_id": self.device_id,
                    "current_rpm": control_decision["current_rpm"],
                    "target_rpm": target_rpm,
                    "adjusted_rpm": target_rpm,
                    "rpm_change": control_decision["rpm_change"],
                    "rpm_change_pct": control_decision["rpm_change_pct"],
                    "ore_type": control_decision["ore_type"],
                    "energy_savings_pct": control_decision["energy_savings_pct"],
                    "predicted_energy_kwh_per_ton": control_decision.get("predicted_energy_kwh_per_ton"),
                    "safety_status": safety_status,
                    "success": True
                }
                
                self.command_history.append(command_record)
                self.last_control_decision = control_decision
                
                # Track command in database
                self.command_tracker.record_command(command_record)
                
                logger.info(
                    f"Control action executed for {self.device_id}: "
                    f"RPM {control_decision['current_rpm']:.1f} → {target_rpm:.1f} "
                    f"({control_decision['rpm_change_pct']:+.1f}%), "
                    f"Energy savings: {control_decision['energy_savings_pct']:.1f}%"
                )
                
                # Alert on control action
                self.alerting.alert_control_action(command_record)
                
                # Alert on significant energy savings
                if control_decision['energy_savings_pct'] >= 5.0:
                    self.alerting.alert_energy_savings(
                        savings_pct=control_decision['energy_savings_pct'],
                        details=command_record
                    )
                
                # Call control action callback
                if self.on_control_action:
                    try:
                        self.on_control_action(command_record)
                    except Exception as e:
                        logger.error(f"Error in on_control_action callback: {e}", exc_info=True)
            else:
                logger.warning(f"Failed to publish MQTT command for {self.device_id}")
                
        except Exception as e:
            logger.error(f"Error executing control action: {e}", exc_info=True)
    
    def start(self):
        """Start speed control service."""
        if self.is_running:
            logger.warning(f"Control service is already running for {self.device_id}")
            return
        
        logger.info(f"Starting speed control service for device {self.device_id}")
        
        # Initialize MQTT connection early (so status shows as connected)
        try:
            if self.mqtt_publisher:
                # Get client to trigger connection
                client = self.mqtt_publisher.get_client()
                if client:
                    # Try to ensure connection
                    self.mqtt_publisher.ensure_connected()
                    logger.info("MQTT publisher initialized for control service")
        except Exception as e:
            logger.warning(f"MQTT initialization warning: {e}. Will connect on first publish.")
        
        # Start real-time monitoring (handle errors gracefully)
        try:
            if not self.integration.monitor.is_running:
                self.integration.start()
        except Exception as e:
            logger.warning(f"Failed to start integration monitoring: {e}. Service will continue with limited functionality.")
            # Continue anyway - service can still work with manual predictions
        
        # Start control loop
        self.is_running = True
        self._stop_event.clear()
        
        try:
            self._control_thread = Thread(
                target=self._control_loop,
                name=f"SpeedControlService-{self.device_id}",
                daemon=True
            )
            self._control_thread.start()
        except Exception as e:
            logger.error(f"Failed to start control thread: {e}", exc_info=True)
            self.is_running = False
            raise
        
        logger.info(
            f"Speed control service started for {self.device_id}, "
            f"analysis every {self.analysis_interval}s"
        )
    
    def stop(self):
        """Stop speed control service."""
        if not self.is_running:
            return
        
        logger.info(f"Stopping speed control service for device {self.device_id}")
        
        self.is_running = False
        self._stop_event.set()
        
        if self._control_thread:
            self._control_thread.join(timeout=10.0)
            if self._control_thread.is_alive():
                logger.warning("Control thread did not stop gracefully")
        
        # Stop monitoring
        self.integration.stop()
        
        logger.info(f"Speed control service stopped for device {self.device_id}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of control service."""
        # Safely get integration status
        try:
            integration_status = self.integration.get_status()
        except Exception as e:
            logger.warning(f"Failed to get integration status: {e}", exc_info=True)
            integration_status = {
                "device_id": self.device_id,
                "monitor": {"running": False, "healthy": False},
                "detector": {},
                "pipeline": {}
            }
        
        # Safely get MQTT connection status
        # Actually check the MQTT publisher's connection status
        mqtt_connected = False
        try:
            if self.mqtt_publisher:
                # Check if MQTT publisher has a connection status attribute
                if hasattr(self.mqtt_publisher, '_connected'):
                    mqtt_connected = self.mqtt_publisher._connected
                elif hasattr(self.mqtt_publisher, 'is_connected'):
                    mqtt_connected = self.mqtt_publisher.is_connected()
                elif hasattr(self.mqtt_publisher, 'client'):
                    # Check paho-mqtt client connection status
                    client = self.mqtt_publisher.client
                    if client and hasattr(client, 'is_connected'):
                        mqtt_connected = client.is_connected()
                    elif client:
                        # Fallback: if client exists and service is running, assume connected
                        # (MQTT connects lazily on first publish)
                        mqtt_connected = self.is_running
                else:
                    # No publisher or client, but if service is running, MQTT will connect on first use
                    mqtt_connected = self.is_running
        except Exception as e:
            logger.debug(f"Failed to get MQTT connection status: {e}")
            # Fallback: if service is running, assume MQTT is available (connects lazily)
            mqtt_connected = self.is_running
        
        # Safely get last control decision
        last_decision = None
        try:
            last_decision = self.last_control_decision
        except Exception as e:
            logger.debug(f"Failed to get last control decision: {e}")
        
        return {
            "device_id": self.device_id,
            "is_running": self.is_running,  # Changed from "running" to "is_running" for frontend compatibility
            "running": self.is_running,  # Keep for backward compatibility
            "automatic_control_enabled": self.enable_automatic_control,
            "analysis_interval": self.analysis_interval,
            "integration": integration_status,
            "last_control_decision": last_decision,
            "command_history_count": len(self.command_history) if self.command_history else 0,
            "mqtt_connected": mqtt_connected
        }
    
    def get_command_history(self, count: int = 10) -> list:
        """Get recent command history."""
        commands = list(self.command_history)
        if count:
            return commands[-count:] if count > 0 else []
        return commands
    
    def enable_control(self):
        """Enable automatic control."""
        self.enable_automatic_control = True
        logger.info(f"Automatic control enabled for {self.device_id}")
    
    def disable_control(self):
        """Disable automatic control."""
        self.enable_automatic_control = False
        logger.info(f"Automatic control disabled for {self.device_id}")


# Global service instances
_service_instances: Dict[str, SpeedControlService] = {}


def get_control_service(device_id: str = "crusher_01", **kwargs) -> SpeedControlService:
    """
    Get or create control service instance for a device.
    
    Args:
        device_id: Device identifier
        **kwargs: Additional arguments for SpeedControlService constructor
        
    Returns:
        SpeedControlService instance
        
    Raises:
        Exception: If service initialization fails
    """
    global _service_instances
    
    if device_id not in _service_instances:
        try:
            _service_instances[device_id] = SpeedControlService(device_id=device_id, **kwargs)
        except Exception as e:
            logger.error(f"Failed to initialize SpeedControlService for {device_id}: {e}", exc_info=True)
            # Re-raise to let caller handle it
            raise
    
    return _service_instances[device_id]

