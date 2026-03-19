"""
Adaptive Learning Module

Learns from past control actions to improve future decisions:
- Stores successful control patterns
- Adjusts control parameters based on historical performance
- Fine-tunes RPM recommendations based on actual results
"""

import logging
import numpy as np
from typing import Dict, Any, Optional, List
from collections import deque
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


class AdaptiveController:
    """Adaptive learning controller that improves over time."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        learning_window: int = 50,
        min_samples_for_learning: int = 10
    ):
        """
        Initialize adaptive controller.
        
        Args:
            device_id: Device identifier
            learning_window: Number of recent actions to consider (default: 50)
            min_samples_for_learning: Minimum samples needed before learning (default: 10)
        """
        self.device_id = device_id
        self.learning_window = learning_window
        self.min_samples_for_learning = min_samples_for_learning
        
        # Learning history
        self.action_history: deque = deque(maxlen=learning_window)
        
        # Learned patterns
        self.learned_patterns: Dict[str, Dict[str, Any]] = {}
        
        # Adaptive parameters
        self.rpm_adjustment_factors: Dict[str, float] = {
            "soft": 1.0,
            "medium": 1.0,
            "hard": 1.0,
            "very_hard": 1.0
        }
        
        self.energy_prediction_corrections: Dict[str, float] = {
            "soft": 0.0,
            "medium": 0.0,
            "hard": 0.0,
            "very_hard": 0.0
        }
        
        logger.info(
            f"AdaptiveController initialized for device {device_id}, "
            f"learning_window={learning_window}"
        )
    
    def record_action_result(
        self,
        command: Dict[str, Any],
        validation_result: Dict[str, Any]
    ):
        """
        Record an action and its result for learning.
        
        Args:
            command: Command that was executed
            validation_result: Performance validation result
        """
        try:
            action_record = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "command": command,
                "validation": validation_result,
                "ore_type": command.get("ore_type"),
                "predicted_rpm": command.get("target_rpm") or command.get("adjusted_rpm"),
                "actual_rpm": validation_result.get("rpm_validation", {}).get("actual_rpm"),
                "predicted_savings": command.get("predicted_energy_savings_pct", 0.0),
                "actual_savings": validation_result.get("metrics", {}).get("actual_savings_pct", 0.0),
                "success": validation_result.get("overall_success", False)
            }
            
            self.action_history.append(action_record)
            
            # Learn from this action if we have enough samples
            if len(self.action_history) >= self.min_samples_for_learning:
                self._learn_from_history()
            
            logger.debug(f"Recorded action result for {self.device_id}, total actions: {len(self.action_history)}")
            
        except Exception as e:
            logger.error(f"Error recording action result: {str(e)}", exc_info=True)
    
    def _learn_from_history(self):
        """Learn from action history and update adaptive parameters."""
        try:
            # Group actions by ore type
            actions_by_ore = {}
            for action in self.action_history:
                ore_type = action.get("ore_type", "unknown")
                if ore_type not in actions_by_ore:
                    actions_by_ore[ore_type] = []
                actions_by_ore[ore_type].append(action)
            
            # Learn for each ore type
            for ore_type, actions in actions_by_ore.items():
                if len(actions) < 3:  # Need at least 3 samples per ore type
                    continue
                
                # Calculate RPM adjustment factor
                rpm_factors = []
                for action in actions:
                    predicted_rpm = action.get("predicted_rpm")
                    actual_rpm = action.get("actual_rpm")
                    if predicted_rpm and actual_rpm and predicted_rpm > 0:
                        factor = actual_rpm / predicted_rpm
                        if 0.8 <= factor <= 1.2:  # Reasonable range
                            rpm_factors.append(factor)
                
                if rpm_factors:
                    avg_factor = np.mean(rpm_factors)
                    self.rpm_adjustment_factors[ore_type] = avg_factor
                    logger.debug(
                        f"Learned RPM adjustment factor for {ore_type}: {avg_factor:.3f}"
                    )
                
                # Calculate energy prediction correction
                energy_corrections = []
                for action in actions:
                    predicted = action.get("predicted_savings", 0.0)
                    actual = action.get("actual_savings", 0.0)
                    if predicted != 0:
                        correction = actual - predicted
                        energy_corrections.append(correction)
                
                if energy_corrections:
                    avg_correction = np.mean(energy_corrections)
                    self.energy_prediction_corrections[ore_type] = avg_correction
                    logger.debug(
                        f"Learned energy correction for {ore_type}: {avg_correction:.3f}%"
                    )
                
                # Store learned patterns
                successful_actions = [a for a in actions if a.get("success")]
                if successful_actions:
                    self.learned_patterns[ore_type] = {
                        "success_rate": len(successful_actions) / len(actions),
                        "avg_rpm": np.mean([
                            a.get("actual_rpm", 0)
                            for a in successful_actions
                            if a.get("actual_rpm")
                        ]) if successful_actions else None,
                        "avg_savings": np.mean([
                            a.get("actual_savings", 0)
                            for a in successful_actions
                            if a.get("actual_savings") is not None
                        ]) if successful_actions else None,
                        "sample_count": len(successful_actions)
                    }
            
            logger.info(
                f"Learning complete for {self.device_id}: "
                f"Patterns learned for {len(self.learned_patterns)} ore types"
            )
            
        except Exception as e:
            logger.error(f"Error in learning process: {str(e)}", exc_info=True)
    
    def adjust_rpm_recommendation(
        self,
        recommended_rpm: float,
        ore_type: str
    ) -> float:
        """
        Adjust RPM recommendation based on learned patterns.
        
        Args:
            recommended_rpm: Original recommended RPM
            ore_type: Ore type
            
        Returns:
            Adjusted RPM recommendation
        """
        ore_type_lower = ore_type.lower()
        
        # Get adjustment factor for this ore type
        factor = self.rpm_adjustment_factors.get(ore_type_lower, 1.0)
        
        # Apply adjustment
        adjusted_rpm = recommended_rpm * factor
        
        logger.debug(
            f"RPM adjustment for {ore_type}: {recommended_rpm:.1f} → {adjusted_rpm:.1f} "
            f"(factor: {factor:.3f})"
        )
        
        return adjusted_rpm
    
    def adjust_energy_prediction(
        self,
        predicted_savings: float,
        ore_type: str
    ) -> float:
        """
        Adjust energy savings prediction based on learned patterns.
        
        Args:
            predicted_savings: Original predicted savings percentage
            ore_type: Ore type
            
        Returns:
            Adjusted energy savings prediction
        """
        ore_type_lower = ore_type.lower()
        
        # Get correction for this ore type
        correction = self.energy_prediction_corrections.get(ore_type_lower, 0.0)
        
        # Apply correction
        adjusted_savings = predicted_savings + correction
        
        logger.debug(
            f"Energy prediction adjustment for {ore_type}: "
            f"{predicted_savings:.2f}% → {adjusted_savings:.2f}% "
            f"(correction: {correction:+.2f}%)"
        )
        
        return adjusted_savings
    
    def get_learned_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Get learned patterns for all ore types."""
        return self.learned_patterns.copy()
    
    def get_adaptive_parameters(self) -> Dict[str, Any]:
        """Get current adaptive parameters."""
        return {
            "rpm_adjustment_factors": self.rpm_adjustment_factors.copy(),
            "energy_prediction_corrections": self.energy_prediction_corrections.copy(),
            "learned_patterns": self.learned_patterns.copy(),
            "total_actions_learned": len(self.action_history)
        }
    
    def reset_learning(self):
        """Reset learned patterns (useful for testing or major changes)."""
        self.action_history.clear()
        self.learned_patterns.clear()
        self.rpm_adjustment_factors = {
            "soft": 1.0,
            "medium": 1.0,
            "hard": 1.0,
            "very_hard": 1.0
        }
        self.energy_prediction_corrections = {
            "soft": 0.0,
            "medium": 0.0,
            "hard": 0.0,
            "very_hard": 0.0
        }
        logger.info(f"Learning reset for device {self.device_id}")


# Global adaptive controller instances
_adaptive_controller_instances: Dict[str, AdaptiveController] = {}


def get_adaptive_controller(device_id: str = "crusher_01", **kwargs) -> AdaptiveController:
    """Get or create adaptive controller instance for a device."""
    global _adaptive_controller_instances
    
    if device_id not in _adaptive_controller_instances:
        _adaptive_controller_instances[device_id] = AdaptiveController(device_id=device_id, **kwargs)
    
    return _adaptive_controller_instances[device_id]

