"""
Feedback Loop Service

Orchestrates the complete feedback loop:
- Command execution tracking
- Performance validation
- Adaptive learning
- Continuous improvement
"""

import logging
import time
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone, timedelta
from threading import Thread, Event

from .command_tracker import CommandTracker, get_tracker
from .performance_validator import PerformanceValidator, get_validator
from .adaptive_controller import AdaptiveController, get_adaptive_controller
from .realtime_integration import RealTimeIntegration, get_integration

logger = logging.getLogger(__name__)


class FeedbackLoop:
    """Complete feedback loop service for continuous improvement."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        validation_interval: float = 60.0,
        enable_adaptive_learning: bool = True
    ):
        """
        Initialize feedback loop service.
        
        Args:
            device_id: Device identifier
            validation_interval: Interval between validation cycles (default: 60s)
            enable_adaptive_learning: Enable adaptive learning (default: True)
        """
        self.device_id = device_id
        self.validation_interval = validation_interval
        self.enable_adaptive_learning = enable_adaptive_learning
        
        # Initialize components
        self.tracker = get_tracker(device_id=device_id)
        self.validator = get_validator(device_id=device_id)
        self.adaptive = get_adaptive_controller(device_id=device_id)
        self.integration = get_integration(device_id=device_id)
        
        # Feedback loop state
        self.is_running = False
        self._stop_event = Event()
        self._feedback_thread: Optional[Thread] = None
        
        # Track pending validations
        self.pending_validations: Dict[int, Dict[str, Any]] = {}
        
        # Callbacks
        self.on_validation_complete: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_learning_update: Optional[Callable[[Dict[str, Any]], None]] = None
        
        logger.info(
            f"FeedbackLoop initialized for device {device_id}, "
            f"validation_interval={validation_interval}s, "
            f"adaptive_learning={'enabled' if enable_adaptive_learning else 'disabled'}"
        )
    
    def _feedback_loop(self):
        """Main feedback loop running in background thread."""
        logger.info(f"Starting feedback loop for device {self.device_id}")
        
        while not self._stop_event.is_set():
            try:
                # Wait for validation interval
                self._stop_event.wait(self.validation_interval)
                
                if self._stop_event.is_set():
                    break
                
                # Run validation cycle
                self._run_validation_cycle()
                
            except Exception as e:
                logger.error(f"Error in feedback loop: {e}", exc_info=True)
                # Wait a bit before retrying
                self._stop_event.wait(min(self.validation_interval, 10.0))
        
        logger.info(f"Feedback loop stopped for device {self.device_id}")
    
    def _run_validation_cycle(self):
        """Run one cycle of validation and learning."""
        try:
            # Get recent executed commands
            executed_commands = self.tracker.get_command_history(
                limit=10,
                status="executed"
            )
            
            if not executed_commands:
                logger.debug(f"No executed commands to validate for {self.device_id}")
                return
            
            # Validate each command
            for command in executed_commands:
                command_id = command.get("id")
                
                # Skip if already validated
                if command_id in self.pending_validations:
                    continue
                
                # Get before/after data
                before_data, after_data = self._get_before_after_data(command)
                
                if before_data and after_data:
                    # Perform validation
                    validation_result = self.validator.validate_control_action(
                        command_record=command,
                        before_data=before_data,
                        after_data=after_data
                    )
                    
                    # Record for adaptive learning
                    if self.enable_adaptive_learning:
                        self.adaptive.record_action_result(command, validation_result)
                    
                    # Mark as validated
                    self.pending_validations[command_id] = validation_result
                    
                    # Call callback
                    if self.on_validation_complete:
                        try:
                            self.on_validation_complete(validation_result)
                        except Exception as e:
                            logger.error(f"Error in on_validation_complete callback: {e}", exc_info=True)
                    
                    logger.info(
                        f"Validation complete for command {command_id}: "
                        f"Success={validation_result.get('overall_success')}"
                    )
            
            # Clean up old pending validations
            self._cleanup_pending_validations()
            
        except Exception as e:
            logger.error(f"Error in validation cycle: {str(e)}", exc_info=True)
    
    def _get_before_after_data(
        self,
        command: Dict[str, Any]
    ) -> tuple:
        """Get before/after sensor data for a command."""
        try:
            command_time = datetime.fromisoformat(
                command["command_timestamp"].replace('Z', '+00:00')
            )
            
            # Get data from integration (would need to query backend in real implementation)
            # For now, return placeholder data structure
            # In production, this would query the backend for actual sensor data
            
            before_data = {
                "rpm": command.get("current_rpm"),
                "power_kw": None,  # Would query from backend
                "feed_rate_tph": None,  # Would query from backend
                "vibration": None,
                "temperature_c": None
            }
            
            after_data = {
                "rpm": command.get("actual_rpm"),
                "power_kw": None,  # Would query from backend
                "feed_rate_tph": None,  # Would query from backend
                "vibration": None,
                "temperature_c": None
            }
            
            return before_data, after_data
            
        except Exception as e:
            logger.error(f"Error getting before/after data: {str(e)}", exc_info=True)
            return None, None
    
    def _cleanup_pending_validations(self):
        """Remove old pending validations."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        to_remove = []
        for command_id, validation in self.pending_validations.items():
            validation_time = datetime.fromisoformat(
                validation["timestamp"].replace('Z', '+00:00')
            )
            if validation_time < cutoff_time:
                to_remove.append(command_id)
        
        for command_id in to_remove:
            del self.pending_validations[command_id]
    
    def validate_command_manually(
        self,
        command_id: int,
        before_data: Dict[str, Any],
        after_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Manually validate a command with provided before/after data.
        
        Args:
            command_id: Command ID to validate
            before_data: Sensor data before command
            after_data: Sensor data after command
            
        Returns:
            Validation result
        """
        try:
            # Get command from tracker
            commands = self.tracker.get_command_history(limit=100)
            command = next((c for c in commands if c.get("id") == command_id), None)
            
            if not command:
                return {"error": f"Command {command_id} not found"}
            
            # Perform validation
            validation_result = self.validator.validate_control_action(
                command_record=command,
                before_data=before_data,
                after_data=after_data
            )
            
            # Record for adaptive learning
            if self.enable_adaptive_learning:
                self.adaptive.record_action_result(command, validation_result)
            
            # Store validation
            self.pending_validations[command_id] = validation_result
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error in manual validation: {str(e)}", exc_info=True)
            return {"error": str(e)}
    
    def start(self):
        """Start feedback loop service."""
        if self.is_running:
            logger.warning(f"Feedback loop is already running for {self.device_id}")
            return
        
        logger.info(f"Starting feedback loop for device {self.device_id}")
        
        self.is_running = True
        self._stop_event.clear()
        
        self._feedback_thread = Thread(
            target=self._feedback_loop,
            name=f"FeedbackLoop-{self.device_id}",
            daemon=True
        )
        self._feedback_thread.start()
        
        logger.info(
            f"Feedback loop started for {self.device_id}, "
            f"validation every {self.validation_interval}s"
        )
    
    def stop(self):
        """Stop feedback loop service."""
        if not self.is_running:
            return
        
        logger.info(f"Stopping feedback loop for device {self.device_id}")
        
        self.is_running = False
        self._stop_event.set()
        
        if self._feedback_thread:
            self._feedback_thread.join(timeout=10.0)
            if self._feedback_thread.is_alive():
                logger.warning("Feedback thread did not stop gracefully")
        
        logger.info(f"Feedback loop stopped for device {self.device_id}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get feedback loop status."""
        return {
            "device_id": self.device_id,
            "running": self.is_running,
            "validation_interval": self.validation_interval,
            "adaptive_learning_enabled": self.enable_adaptive_learning,
            "pending_validations": len(self.pending_validations),
            "performance_summary": self.validator.get_performance_summary(hours=24),
            "adaptive_parameters": self.adaptive.get_adaptive_parameters() if self.enable_adaptive_learning else None
        }


# Global feedback loop instances
_feedback_loop_instances: Dict[str, FeedbackLoop] = {}


def get_feedback_loop(device_id: str = "crusher_01", **kwargs) -> FeedbackLoop:
    """Get or create feedback loop instance for a device."""
    global _feedback_loop_instances
    
    if device_id not in _feedback_loop_instances:
        _feedback_loop_instances[device_id] = FeedbackLoop(device_id=device_id, **kwargs)
    
    return _feedback_loop_instances[device_id]

