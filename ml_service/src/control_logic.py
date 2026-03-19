"""
Control Logic Implementation

Intelligent control decisions for automatic RPM adjustments based on:
- Material characteristics (hard/soft/fines)
- Energy consumption patterns
- Feed rate optimization
- Safety constraints

Strategy:
- Soft material with fines: Lower RPM (reduce energy consumption)
- Hard material: Higher RPM (maintain throughput)
- Gradual transitions (max ±5% per cycle)
- Safety limits and validation
"""

import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ControlLogic:
    """Intelligent control logic for RPM adjustments."""
    
    def __init__(
        self,
        max_rpm_change_pct: float = 5.0,
        min_rpm: float = 800.0,
        max_rpm: float = 1200.0,
        min_time_between_adjustments: float = 30.0,
        energy_savings_threshold: float = 2.0
    ):
        """
        Initialize control logic.
        
        Args:
            max_rpm_change_pct: Maximum RPM change per cycle (default: 5%)
            min_rpm: Minimum allowed RPM (default: 800)
            max_rpm: Maximum allowed RPM (default: 1200)
            min_time_between_adjustments: Minimum seconds between adjustments (default: 30)
            energy_savings_threshold: Minimum energy savings % to trigger adjustment (default: 2%)
        """
        self.max_rpm_change_pct = max_rpm_change_pct
        self.min_rpm = min_rpm
        self.max_rpm = max_rpm
        self.min_time_between_adjustments = min_time_between_adjustments
        self.energy_savings_threshold = energy_savings_threshold
        
        # Track last adjustment time per device
        self.last_adjustment_time: Dict[str, datetime] = {}
        
        logger.info(
            f"ControlLogic initialized: "
            f"max_change={max_rpm_change_pct}%, "
            f"rpm_range=[{min_rpm}, {max_rpm}], "
            f"min_interval={min_time_between_adjustments}s"
        )
    
    def should_adjust_rpm(
        self,
        device_id: str,
        current_rpm: float,
        recommended_rpm: float,
        energy_savings_pct: float,
        ore_type: str,
        confidence: float
    ) -> Tuple[bool, str]:
        """
        Determine if RPM adjustment should be made.
        
        Args:
            device_id: Device identifier
            current_rpm: Current RPM value
            recommended_rpm: Recommended RPM from ML model
            energy_savings_pct: Predicted energy savings percentage
            ore_type: Predicted ore type
            confidence: Prediction confidence (0-1)
            
        Returns:
            Tuple of (should_adjust, reason)
        """
        # Check minimum confidence threshold
        if confidence < 0.7:
            return False, f"Low confidence ({confidence:.1%} < 70%)"
        
        # Check if recommended RPM is significantly different
        rpm_diff = abs(recommended_rpm - current_rpm)
        rpm_diff_pct = (rpm_diff / current_rpm * 100) if current_rpm > 0 else 0
        
        if rpm_diff_pct < 1.0:  # Less than 1% difference
            return False, f"RPM difference too small ({rpm_diff_pct:.1f}% < 1%)"
        
        # Check minimum time between adjustments
        if device_id in self.last_adjustment_time:
            time_since_last = (
                datetime.now(timezone.utc) - self.last_adjustment_time[device_id]
            ).total_seconds()
            
            if time_since_last < self.min_time_between_adjustments:
                return False, f"Too soon since last adjustment ({time_since_last:.1f}s < {self.min_time_between_adjustments}s)"
        
        # Check energy savings threshold
        if energy_savings_pct < self.energy_savings_threshold:
            return False, f"Energy savings too low ({energy_savings_pct:.1f}% < {self.energy_savings_threshold}%)"
        
        # Check RPM bounds
        if recommended_rpm < self.min_rpm:
            return False, f"Recommended RPM below minimum ({recommended_rpm:.1f} < {self.min_rpm})"
        
        if recommended_rpm > self.max_rpm:
            return False, f"Recommended RPM above maximum ({recommended_rpm:.1f} > {self.max_rpm})"
        
        # All checks passed
        return True, "All conditions met"
    
    def calculate_adjusted_rpm(
        self,
        current_rpm: float,
        recommended_rpm: float
    ) -> float:
        """
        Calculate adjusted RPM with gradual transition limits.
        
        Args:
            current_rpm: Current RPM value
            recommended_rpm: Recommended RPM from ML model
            
        Returns:
            Adjusted RPM value (limited by max change percentage)
        """
        # Calculate desired change
        rpm_diff = recommended_rpm - current_rpm
        rpm_diff_pct = (rpm_diff / current_rpm * 100) if current_rpm > 0 else 0
        
        # Limit change to max percentage
        if abs(rpm_diff_pct) > self.max_rpm_change_pct:
            # Apply maximum change
            max_change = current_rpm * (self.max_rpm_change_pct / 100)
            if rpm_diff > 0:
                adjusted_rpm = current_rpm + max_change
            else:
                adjusted_rpm = current_rpm - max_change
            
            logger.info(
                f"RPM change limited: {rpm_diff_pct:.1f}% → {self.max_rpm_change_pct}% "
                f"({current_rpm:.1f} → {adjusted_rpm:.1f})"
            )
        else:
            adjusted_rpm = recommended_rpm
        
        # Clamp to bounds
        adjusted_rpm = max(self.min_rpm, min(self.max_rpm, adjusted_rpm))
        
        return round(adjusted_rpm, 1)
    
    def make_control_decision(
        self,
        device_id: str,
        prediction: Dict[str, Any],
        current_rpm: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Make control decision based on prediction.
        
        Args:
            device_id: Device identifier
            prediction: Prediction result from pipeline
            current_rpm: Optional current RPM (if not in prediction)
            
        Returns:
            Control decision dictionary or None if no adjustment needed
        """
        if not prediction.get("success"):
            return None
        
        # Extract data from prediction
        ore_classification = prediction.get("ore_classification", {})
        rpm_recommendation = prediction.get("rpm_recommendation", {})
        input_data = prediction.get("input", {})
        
        predicted_ore_type = ore_classification.get("predicted_class")
        confidence = ore_classification.get("confidence", 0.0)
        recommended_rpm = rpm_recommendation.get("recommended_rpm")
        energy_savings_pct = rpm_recommendation.get("energy_savings_pct", 0.0)
        
        # Get current RPM
        if current_rpm is None:
            current_rpm = input_data.get("current_rpm")
        
        if current_rpm is None or recommended_rpm is None:
            logger.warning("Missing current_rpm or recommended_rpm in prediction")
            return None
        
        # Check if adjustment should be made
        should_adjust, reason = self.should_adjust_rpm(
            device_id=device_id,
            current_rpm=current_rpm,
            recommended_rpm=recommended_rpm,
            energy_savings_pct=energy_savings_pct,
            ore_type=predicted_ore_type,
            confidence=confidence
        )
        
        if not should_adjust:
            logger.debug(f"No RPM adjustment for {device_id}: {reason}")
            return None
        
        # Calculate adjusted RPM (with gradual transition)
        adjusted_rpm = self.calculate_adjusted_rpm(current_rpm, recommended_rpm)
        
        # Create control decision
        decision = {
            "device_id": device_id,
            "current_rpm": current_rpm,
            "recommended_rpm": recommended_rpm,
            "adjusted_rpm": adjusted_rpm,
            "rpm_change": adjusted_rpm - current_rpm,
            "rpm_change_pct": ((adjusted_rpm - current_rpm) / current_rpm * 100) if current_rpm > 0 else 0,
            "ore_type": predicted_ore_type,
            "confidence": confidence,
            "energy_savings_pct": energy_savings_pct,
            "predicted_energy_kwh_per_ton": rpm_recommendation.get("predicted_energy_kwh_per_ton"),
            "reason": f"Material: {predicted_ore_type} ({confidence:.1%} confidence), "
                     f"Energy savings: {energy_savings_pct:.1f}%",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "control_logic"
        }
        
        # Record adjustment time
        self.last_adjustment_time[device_id] = datetime.now(timezone.utc)
        
        logger.info(
            f"Control decision for {device_id}: "
            f"RPM {current_rpm:.1f} → {adjusted_rpm:.1f} "
            f"({decision['rpm_change_pct']:+.1f}%), "
            f"Reason: {reason}"
        )
        
        return decision
    
    def get_control_strategy(
        self,
        ore_type: str,
        feed_rate_tph: float,
        ore_fines_pct: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Get control strategy based on material characteristics.
        
        Args:
            ore_type: Predicted ore type (hard/medium/soft)
            feed_rate_tph: Feed rate in tons per hour
            ore_fines_pct: Optional fines percentage
            
        Returns:
            Strategy dictionary with recommendations
        """
        strategy = {
            "ore_type": ore_type,
            "feed_rate_tph": feed_rate_tph,
            "target_rpm_range": None,
            "optimization_goal": None,
            "notes": []
        }
        
        ore_type_lower = ore_type.lower()
        
        # Strategy for soft material with fines
        if ore_type_lower in ["soft"] and ore_fines_pct and ore_fines_pct > 20:
            strategy["target_rpm_range"] = (800, 950)
            strategy["optimization_goal"] = "energy_savings"
            strategy["notes"].append("Soft material with fines: Lower RPM to reduce energy consumption")
            strategy["notes"].append(f"Fines percentage: {ore_fines_pct:.1f}%")
        
        # Strategy for hard material
        elif ore_type_lower in ["hard", "very_hard"]:
            strategy["target_rpm_range"] = (1000, 1200)
            strategy["optimization_goal"] = "throughput"
            strategy["notes"].append("Hard material: Higher RPM to maintain throughput")
            strategy["notes"].append("Monitor for overload conditions")
        
        # Strategy for medium material
        elif ore_type_lower == "medium":
            strategy["target_rpm_range"] = (900, 1050)
            strategy["optimization_goal"] = "balanced"
            strategy["notes"].append("Medium material: Balanced RPM for efficiency")
        
        # Default strategy
        else:
            strategy["target_rpm_range"] = (850, 1100)
            strategy["optimization_goal"] = "balanced"
            strategy["notes"].append("Default strategy: Balanced approach")
        
        # Adjust based on feed rate
        if feed_rate_tph < 300:
            strategy["notes"].append(f"Low feed rate ({feed_rate_tph:.1f} TPH): Consider increasing RPM")
        elif feed_rate_tph > 500:
            strategy["notes"].append(f"High feed rate ({feed_rate_tph:.1f} TPH): Monitor for overload")
        
        return strategy


# Global control logic instance
_control_logic_instance: Optional[ControlLogic] = None


def get_control_logic(**kwargs) -> ControlLogic:
    """Get or create global control logic instance."""
    global _control_logic_instance
    
    if _control_logic_instance is None:
        _control_logic_instance = ControlLogic(**kwargs)
    
    return _control_logic_instance

