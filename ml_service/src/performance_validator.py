"""
Performance Validation Module

Validates that control actions achieve desired outcomes:
- Energy consumption before/after adjustment
- Throughput maintenance
- Equipment health (vibration, temperature)
- ROI calculation (energy saved vs throughput impact)
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from collections import deque
import numpy as np

logger = logging.getLogger(__name__)


class PerformanceValidator:
    """Validates performance of control actions."""
    
    def __init__(self, device_id: str = "crusher_01", window_size: int = 20):
        """
        Initialize performance validator.
        
        Args:
            device_id: Device identifier
            window_size: Number of recent samples for analysis (default: 20)
        """
        self.device_id = device_id
        self.window_size = window_size
        
        # Performance history
        self.performance_history: deque = deque(maxlen=window_size)
        
        logger.info(f"PerformanceValidator initialized for device {device_id}")
    
    def validate_control_action(
        self,
        command_record: Dict[str, Any],
        before_data: Dict[str, Any],
        after_data: Dict[str, Any],
        time_window_minutes: int = 5
    ) -> Dict[str, Any]:
        """
        Validate a control action by comparing before/after metrics.
        
        Args:
            command_record: Command that was executed
            before_data: Sensor data before command (baseline)
            after_data: Sensor data after command (result)
            time_window_minutes: Time window for comparison (default: 5 minutes)
            
        Returns:
            Validation result dictionary
        """
        try:
            target_rpm = command_record.get("target_rpm") or command_record.get("adjusted_rpm")
            current_rpm = command_record.get("current_rpm")
            predicted_savings = command_record.get("predicted_energy_savings_pct", 0.0)
            
            # Extract metrics
            before_energy = before_data.get("energy_per_ton") or before_data.get("power_kw")
            after_energy = after_data.get("energy_per_ton") or after_data.get("power_kw")
            
            before_rpm = before_data.get("rpm") or current_rpm
            after_rpm = after_data.get("rpm") or target_rpm
            
            before_feed_rate = before_data.get("feed_rate_tph") or before_data.get("feed_tph")
            after_feed_rate = after_data.get("feed_rate_tph") or after_data.get("feed_tph")
            
            before_vibration = before_data.get("vibration")
            after_vibration = after_data.get("vibration")
            
            before_temperature = before_data.get("temperature_c")
            after_temperature = after_data.get("temperature_c")
            
            # Calculate actual energy savings
            actual_savings_pct = 0.0
            if before_energy and after_energy and before_energy > 0:
                energy_change = ((before_energy - after_energy) / before_energy) * 100
                actual_savings_pct = energy_change
            
            # Calculate throughput change
            throughput_change_pct = 0.0
            if before_feed_rate and after_feed_rate and before_feed_rate > 0:
                throughput_change_pct = ((after_feed_rate - before_feed_rate) / before_feed_rate) * 100
            
            # Calculate RPM accuracy
            rpm_accuracy = 0.0
            if target_rpm and after_rpm:
                rpm_error = abs(after_rpm - target_rpm)
                rpm_accuracy = max(0, 100 - (rpm_error / target_rpm * 100)) if target_rpm > 0 else 0
            
            # Validate energy savings
            energy_validation = self._validate_energy_savings(
                predicted_savings, actual_savings_pct
            )
            
            # Validate throughput maintenance
            throughput_validation = self._validate_throughput(throughput_change_pct)
            
            # Validate equipment health
            health_validation = self._validate_equipment_health(
                before_vibration, after_vibration,
                before_temperature, after_temperature
            )
            
            # Calculate ROI
            roi = self._calculate_roi(
                energy_saved=actual_savings_pct,
                throughput_impact=throughput_change_pct
            )
            
            # Overall validation result
            overall_success = (
                energy_validation["success"] and
                throughput_validation["success"] and
                health_validation["success"]
            )
            
            validation_result = {
                "device_id": self.device_id,
                "command_id": command_record.get("id"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "time_window_minutes": time_window_minutes,
                "rpm_validation": {
                    "target_rpm": target_rpm,
                    "actual_rpm": after_rpm,
                    "rpm_accuracy": rpm_accuracy,
                    "success": rpm_accuracy >= 95.0
                },
                "energy_validation": energy_validation,
                "throughput_validation": throughput_validation,
                "health_validation": health_validation,
                "roi": roi,
                "overall_success": overall_success,
                "metrics": {
                    "predicted_savings_pct": predicted_savings,
                    "actual_savings_pct": actual_savings_pct,
                    "savings_accuracy": abs(predicted_savings - actual_savings_pct),
                    "throughput_change_pct": throughput_change_pct,
                    "before_energy": before_energy,
                    "after_energy": after_energy,
                    "before_rpm": before_rpm,
                    "after_rpm": after_rpm
                }
            }
            
            # Store in history
            self.performance_history.append(validation_result)
            
            logger.info(
                f"Performance validation for {self.device_id}: "
                f"Success={overall_success}, "
                f"Energy Savings={actual_savings_pct:.2f}% (predicted: {predicted_savings:.2f}%), "
                f"Throughput Change={throughput_change_pct:+.2f}%"
            )
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating control action: {str(e)}", exc_info=True)
            return {
                "device_id": self.device_id,
                "error": str(e),
                "overall_success": False
            }
    
    def _validate_energy_savings(
        self,
        predicted_savings: float,
        actual_savings: float
    ) -> Dict[str, Any]:
        """Validate energy savings achieved."""
        # Allow some tolerance (within 50% of predicted)
        min_acceptable = predicted_savings * 0.5
        success = actual_savings >= min_acceptable
        
        return {
            "success": success,
            "predicted_savings_pct": predicted_savings,
            "actual_savings_pct": actual_savings,
            "difference_pct": actual_savings - predicted_savings,
            "meets_target": actual_savings >= min_acceptable,
            "message": (
                f"Energy savings: {actual_savings:.2f}% (predicted: {predicted_savings:.2f}%)"
                if success else
                f"Energy savings below target: {actual_savings:.2f}% < {min_acceptable:.2f}%"
            )
        }
    
    def _validate_throughput(self, throughput_change_pct: float) -> Dict[str, Any]:
        """Validate throughput is maintained (not significantly reduced)."""
        # Throughput should not decrease by more than 5%
        success = throughput_change_pct >= -5.0
        
        return {
            "success": success,
            "throughput_change_pct": throughput_change_pct,
            "meets_target": success,
            "message": (
                f"Throughput maintained: {throughput_change_pct:+.2f}%"
                if success else
                f"Throughput decreased significantly: {throughput_change_pct:.2f}%"
            )
        }
    
    def _validate_equipment_health(
        self,
        before_vibration: Optional[float],
        after_vibration: Optional[float],
        before_temperature: Optional[float],
        after_temperature: Optional[float]
    ) -> Dict[str, Any]:
        """Validate equipment health metrics."""
        health_issues = []
        
        # Check vibration
        if before_vibration and after_vibration:
            vibration_increase = after_vibration - before_vibration
            if vibration_increase > 0.2:  # Significant increase
                health_issues.append(f"Vibration increased by {vibration_increase:.2f}mm/s")
        
        # Check temperature
        if before_temperature and after_temperature:
            temp_increase = after_temperature - before_temperature
            if temp_increase > 10:  # Significant increase
                health_issues.append(f"Temperature increased by {temp_increase:.1f}°C")
        
        success = len(health_issues) == 0
        
        return {
            "success": success,
            "health_issues": health_issues,
            "vibration_change": (after_vibration - before_vibration) if (before_vibration and after_vibration) else None,
            "temperature_change": (after_temperature - before_temperature) if (before_temperature and after_temperature) else None,
            "message": (
                "Equipment health maintained"
                if success else
                f"Health issues detected: {', '.join(health_issues)}"
            )
        }
    
    def _calculate_roi(
        self,
        energy_saved: float,
        throughput_impact: float
    ) -> Dict[str, Any]:
        """
        Calculate Return on Investment (ROI) of control action.
        
        ROI = (Energy Savings Benefit - Throughput Impact Cost) / Base Cost
        """
        # Simplified ROI calculation
        # Energy savings benefit (positive)
        energy_benefit = energy_saved
        
        # Throughput impact cost (negative if throughput decreased)
        throughput_cost = -throughput_impact if throughput_impact < 0 else 0
        
        # Net benefit
        net_benefit = energy_benefit + throughput_cost
        
        # ROI percentage
        roi_pct = net_benefit if net_benefit > 0 else 0
        
        return {
            "energy_benefit_pct": energy_benefit,
            "throughput_cost_pct": throughput_cost,
            "net_benefit_pct": net_benefit,
            "roi_pct": roi_pct,
            "positive_roi": roi_pct > 0
        }
    
    def get_performance_summary(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get performance summary for recent validations.
        
        Args:
            hours: Time window in hours
            
        Returns:
            Performance summary dictionary
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        recent_validations = [
            v for v in self.performance_history
            if datetime.fromisoformat(v["timestamp"].replace('Z', '+00:00')) >= cutoff_time
        ]
        
        if not recent_validations:
            return {
                "device_id": self.device_id,
                "time_window_hours": hours,
                "total_validations": 0,
                "success_rate": 0.0
            }
        
        success_count = sum(1 for v in recent_validations if v.get("overall_success"))
        success_rate = (success_count / len(recent_validations)) * 100
        
        avg_energy_savings = np.mean([
            v["metrics"]["actual_savings_pct"]
            for v in recent_validations
            if v["metrics"].get("actual_savings_pct") is not None
        ]) if recent_validations else 0.0
        
        avg_rpm_accuracy = np.mean([
            v["rpm_validation"]["rpm_accuracy"]
            for v in recent_validations
            if v["rpm_validation"].get("rpm_accuracy") is not None
        ]) if recent_validations else 0.0
        
        return {
            "device_id": self.device_id,
            "time_window_hours": hours,
            "total_validations": len(recent_validations),
            "successful_validations": success_count,
            "success_rate": success_rate,
            "avg_energy_savings_pct": avg_energy_savings,
            "avg_rpm_accuracy": avg_rpm_accuracy,
            "avg_roi_pct": np.mean([
                v["roi"]["roi_pct"]
                for v in recent_validations
                if v.get("roi", {}).get("roi_pct") is not None
            ]) if recent_validations else 0.0
        }
    
    def get_recent_validations(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent validation results."""
        return list(self.performance_history)[-count:] if count > 0 else list(self.performance_history)


# Global validator instances
_validator_instances: Dict[str, PerformanceValidator] = {}


def get_validator(device_id: str = "crusher_01", **kwargs) -> PerformanceValidator:
    """Get or create validator instance for a device."""
    global _validator_instances
    
    if device_id not in _validator_instances:
        _validator_instances[device_id] = PerformanceValidator(device_id=device_id, **kwargs)
    
    return _validator_instances[device_id]

