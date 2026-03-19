"""
Safety Interlocks Module

Prevents unsafe operations by checking:
- Maximum RPM limits (equipment-specific)
- Minimum RPM limits (prevent stalling)
- Power overload protection
- Vibration threshold monitoring
- Temperature monitoring
- Emergency stop conditions
"""

import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class SafetyInterlocks:
    """Safety interlock checks for control operations."""
    
    def __init__(
        self,
        max_rpm: float = 1200.0,
        min_rpm: float = 800.0,
        max_power_kw: float = 500.0,
        max_vibration: float = 1.0,
        max_temperature_c: float = 100.0,
        emergency_stop_enabled: bool = True
    ):
        """
        Initialize safety interlocks.
        
        Args:
            max_rpm: Maximum allowed RPM (default: 1200)
            min_rpm: Minimum allowed RPM to prevent stalling (default: 800)
            max_power_kw: Maximum power consumption (default: 500 kW)
            max_vibration: Maximum vibration level in mm/s (default: 1.0)
            max_temperature_c: Maximum temperature in Celsius (default: 100)
            emergency_stop_enabled: Enable emergency stop checks (default: True)
        """
        self.max_rpm = max_rpm
        self.min_rpm = min_rpm
        self.max_power_kw = max_power_kw
        self.max_vibration = max_vibration
        self.max_temperature_c = max_temperature_c
        self.emergency_stop_enabled = emergency_stop_enabled
        
        logger.info(
            f"SafetyInterlocks initialized: "
            f"RPM=[{min_rpm}, {max_rpm}], "
            f"Max Power={max_power_kw}kW, "
            f"Max Vibration={max_vibration}mm/s, "
            f"Max Temp={max_temperature_c}°C"
        )
    
    def check_rpm_limits(self, rpm: float) -> Tuple[bool, Optional[str]]:
        """
        Check if RPM is within safe limits.
        
        Args:
            rpm: RPM value to check
            
        Returns:
            Tuple of (is_safe, error_message)
        """
        if rpm < self.min_rpm:
            return False, f"RPM below minimum ({rpm:.1f} < {self.min_rpm}) - risk of stalling"
        
        if rpm > self.max_rpm:
            return False, f"RPM above maximum ({rpm:.1f} > {self.max_rpm}) - equipment limit exceeded"
        
        return True, None
    
    def check_power_overload(self, power_kw: float) -> Tuple[bool, Optional[str]]:
        """
        Check if power consumption is within safe limits.
        
        Args:
            power_kw: Power consumption in kW
            
        Returns:
            Tuple of (is_safe, error_message)
        """
        if power_kw > self.max_power_kw:
            return False, f"Power overload ({power_kw:.1f}kW > {self.max_power_kw}kW)"
        
        return True, None
    
    def check_vibration(self, vibration: float) -> Tuple[bool, Optional[str]]:
        """
        Check if vibration is within safe limits.
        
        Args:
            vibration: Vibration level in mm/s
            
        Returns:
            Tuple of (is_safe, error_message)
        """
        if vibration > self.max_vibration:
            return False, f"Vibration threshold exceeded ({vibration:.2f} > {self.max_vibration}mm/s)"
        
        return True, None
    
    def check_temperature(self, temperature_c: float) -> Tuple[bool, Optional[str]]:
        """
        Check if temperature is within safe limits.
        
        Args:
            temperature_c: Temperature in Celsius
            
        Returns:
            Tuple of (is_safe, error_message)
        """
        if temperature_c > self.max_temperature_c:
            return False, f"Temperature threshold exceeded ({temperature_c:.1f}°C > {self.max_temperature_c}°C)"
        
        return True, None
    
    def validate_control_command(
        self,
        target_rpm: float,
        sensor_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """
        Validate a control command against all safety interlocks.
        
        Args:
            target_rpm: Target RPM value
            sensor_data: Optional current sensor data for additional checks
            
        Returns:
            Tuple of (is_safe, error_message, safety_status)
        """
        safety_status = {
            "rpm_check": None,
            "power_check": None,
            "vibration_check": None,
            "temperature_check": None,
            "all_checks_passed": False
        }
        
        # Check RPM limits
        rpm_safe, rpm_error = self.check_rpm_limits(target_rpm)
        safety_status["rpm_check"] = {"passed": rpm_safe, "error": rpm_error}
        
        if not rpm_safe:
            return False, rpm_error, safety_status
        
        # Check sensor data if provided
        if sensor_data:
            # Power check
            power_kw = sensor_data.get("power_kw")
            if power_kw is not None:
                power_safe, power_error = self.check_power_overload(power_kw)
                safety_status["power_check"] = {"passed": power_safe, "error": power_error}
                
                if not power_safe:
                    return False, power_error, safety_status
            
            # Vibration check
            vibration = sensor_data.get("vibration")
            if vibration is not None:
                vib_safe, vib_error = self.check_vibration(vibration)
                safety_status["vibration_check"] = {"passed": vib_safe, "error": vib_error}
                
                if not vib_safe:
                    return False, vib_error, safety_status
            
            # Temperature check
            temperature_c = sensor_data.get("temperature_c")
            if temperature_c is not None:
                temp_safe, temp_error = self.check_temperature(temperature_c)
                safety_status["temperature_check"] = {"passed": temp_safe, "error": temp_error}
                
                if not temp_safe:
                    return False, temp_error, safety_status
        
        # All checks passed
        safety_status["all_checks_passed"] = True
        return True, None, safety_status
    
    def check_emergency_stop(
        self,
        sensor_data: Dict[str, Any]
    ) -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """
        Check for emergency stop conditions.
        
        Args:
            sensor_data: Current sensor data
            
        Returns:
            Tuple of (should_stop, reason, details)
        """
        if not self.emergency_stop_enabled:
            return False, None, {}
        
        details = {
            "power_kw": sensor_data.get("power_kw"),
            "vibration": sensor_data.get("vibration"),
            "temperature_c": sensor_data.get("temperature_c"),
            "rpm": sensor_data.get("rpm")
        }
        
        # Check for critical power overload
        power_kw = sensor_data.get("power_kw")
        if power_kw and power_kw > self.max_power_kw * 1.2:  # 20% above max
            return True, f"Critical power overload: {power_kw:.1f}kW", details
        
        # Check for critical vibration
        vibration = sensor_data.get("vibration")
        if vibration and vibration > self.max_vibration * 1.5:  # 50% above max
            return True, f"Critical vibration: {vibration:.2f}mm/s", details
        
        # Check for critical temperature
        temperature_c = sensor_data.get("temperature_c")
        if temperature_c and temperature_c > self.max_temperature_c * 1.2:  # 20% above max
            return True, f"Critical temperature: {temperature_c:.1f}°C", details
        
        # Check for RPM out of bounds (critical)
        rpm = sensor_data.get("rpm")
        if rpm:
            if rpm < self.min_rpm * 0.9:  # 10% below minimum (stalling risk)
                return True, f"Critical RPM too low (stalling risk): {rpm:.1f} RPM", details
            if rpm > self.max_rpm * 1.1:  # 10% above maximum (equipment damage risk)
                return True, f"Critical RPM too high (damage risk): {rpm:.1f} RPM", details
        
        return False, None, details
    
    def get_safety_status(self, sensor_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get comprehensive safety status.
        
        Args:
            sensor_data: Optional current sensor data
            
        Returns:
            Safety status dictionary
        """
        status = {
            "device_id": "unknown",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "safety_limits": {
                "rpm_range": [self.min_rpm, self.max_rpm],
                "max_power_kw": self.max_power_kw,
                "max_vibration": self.max_vibration,
                "max_temperature_c": self.max_temperature_c
            },
            "current_status": {},
            "checks": {
                "rpm_safe": None,
                "power_safe": None,
                "vibration_safe": None,
                "temperature_safe": None,
                "emergency_stop": False
            },
            "overall_safe": True
        }
        
        if sensor_data:
            status["device_id"] = sensor_data.get("device_id", "unknown")
            status["current_status"] = {
                "rpm": sensor_data.get("rpm"),
                "power_kw": sensor_data.get("power_kw"),
                "vibration": sensor_data.get("vibration"),
                "temperature_c": sensor_data.get("temperature_c")
            }
            
            # Perform all checks
            rpm = sensor_data.get("rpm")
            if rpm is not None:
                rpm_safe, _ = self.check_rpm_limits(rpm)
                status["checks"]["rpm_safe"] = rpm_safe
            
            power_kw = sensor_data.get("power_kw")
            if power_kw is not None:
                power_safe, _ = self.check_power_overload(power_kw)
                status["checks"]["power_safe"] = power_safe
            
            vibration = sensor_data.get("vibration")
            if vibration is not None:
                vib_safe, _ = self.check_vibration(vibration)
                status["checks"]["vibration_safe"] = vib_safe
            
            temperature_c = sensor_data.get("temperature_c")
            if temperature_c is not None:
                temp_safe, _ = self.check_temperature(temperature_c)
                status["checks"]["temperature_safe"] = temp_safe
            
            # Check emergency stop
            should_stop, _, _ = self.check_emergency_stop(sensor_data)
            status["checks"]["emergency_stop"] = should_stop
            
            # Overall safety
            status["overall_safe"] = (
                status["checks"]["rpm_safe"] is not False and
                status["checks"]["power_safe"] is not False and
                status["checks"]["vibration_safe"] is not False and
                status["checks"]["temperature_safe"] is not False and
                not status["checks"]["emergency_stop"]
            )
        
        return status


# Global safety interlock instance
_safety_interlocks_instance: Optional[SafetyInterlocks] = None


def get_safety_interlocks(**kwargs) -> SafetyInterlocks:
    """Get or create global safety interlock instance."""
    global _safety_interlocks_instance
    
    if _safety_interlocks_instance is None:
        _safety_interlocks_instance = SafetyInterlocks(**kwargs)
    
    return _safety_interlocks_instance

