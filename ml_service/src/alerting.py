"""
Alerting System Module

Notifies operators of important events:
- Material property changes
- Control actions taken
- Safety interlock triggers
- Performance degradation
- System errors
- Emergency conditions
"""

import os
import logging
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timezone
from collections import deque
from enum import Enum

logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertType(Enum):
    """Types of alerts."""
    MATERIAL_CHANGE = "material_change"
    CONTROL_ACTION = "control_action"
    SAFETY_INTERLOCK = "safety_interlock"
    PERFORMANCE_ISSUE = "performance_issue"
    SYSTEM_ERROR = "system_error"
    EMERGENCY_STOP = "emergency_stop"
    ENERGY_SAVINGS = "energy_savings"
    LEARNING_UPDATE = "learning_update"


class Alert:
    """Represents a single alert."""
    
    def __init__(
        self,
        alert_type: AlertType,
        level: AlertLevel,
        message: str,
        device_id: str = "crusher_01",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize alert.
        
        Args:
            alert_type: Type of alert
            level: Alert severity level
            message: Alert message
            device_id: Device identifier
            details: Optional additional details
        """
        self.alert_type = alert_type
        self.level = level
        self.message = message
        self.device_id = device_id
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.acknowledged = False
        self.acknowledged_by = None
        self.acknowledged_at = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        return {
            "alert_type": self.alert_type.value,
            "level": self.level.value,
            "message": self.message,
            "device_id": self.device_id,
            "details": self.details,
            "timestamp": self.timestamp,
            "acknowledged": self.acknowledged,
            "acknowledged_by": self.acknowledged_by,
            "acknowledged_at": self.acknowledged_at
        }
    
    def acknowledge(self, user: str = "system"):
        """Acknowledge the alert."""
        self.acknowledged = True
        self.acknowledged_by = user
        self.acknowledged_at = datetime.now(timezone.utc).isoformat()


class AlertingSystem:
    """Alerting system for monitoring and notifications."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        max_alerts: int = 1000,
        enable_notifications: bool = True
    ):
        """
        Initialize alerting system.
        
        Args:
            device_id: Device identifier
            max_alerts: Maximum number of alerts to keep in memory (default: 1000)
            enable_notifications: Enable alert notifications (default: True)
        """
        self.device_id = device_id
        self.max_alerts = max_alerts
        self.enable_notifications = enable_notifications
        
        # Alert storage
        self.alerts: deque = deque(maxlen=max_alerts)
        self.active_alerts: List[Alert] = []  # Non-acknowledged alerts
        
        # Alert callbacks
        self.on_alert: Optional[Callable[[Alert], None]] = None
        self.on_critical_alert: Optional[Callable[[Alert], None]] = None
        
        logger.info(f"AlertingSystem initialized for device {device_id}")
    
    def create_alert(
        self,
        alert_type: AlertType,
        level: AlertLevel,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Alert:
        """
        Create and register a new alert.
        
        Args:
            alert_type: Type of alert
            level: Alert severity level
            message: Alert message
            details: Optional additional details
            
        Returns:
            Created alert
        """
        alert = Alert(
            alert_type=alert_type,
            level=level,
            message=message,
            device_id=self.device_id,
            details=details or {}
        )
        
        # Store alert
        self.alerts.append(alert)
        
        # Add to active alerts if not acknowledged
        if not alert.acknowledged:
            self.active_alerts.append(alert)
        
        # Log alert
        log_level = {
            AlertLevel.INFO: logger.info,
            AlertLevel.WARNING: logger.warning,
            AlertLevel.ERROR: logger.error,
            AlertLevel.CRITICAL: logger.critical
        }.get(level, logger.info)
        
        log_level(f"ALERT [{level.value.upper()}] {alert_type.value}: {message}")
        
        # Trigger callbacks
        if self.on_alert:
            try:
                self.on_alert(alert)
            except Exception as e:
                logger.error(f"Error in on_alert callback: {e}", exc_info=True)
        
        if level == AlertLevel.CRITICAL and self.on_critical_alert:
            try:
                self.on_critical_alert(alert)
            except Exception as e:
                logger.error(f"Error in on_critical_alert callback: {e}", exc_info=True)
        
        return alert
    
    def alert_material_change(self, change_event: Dict[str, Any]):
        """Alert on material property change."""
        change_type = change_event.get("change_type", "unknown")
        description = change_event.get("description", "Material property changed")
        
        level = AlertLevel.WARNING if change_type == "hardness_change" else AlertLevel.INFO
        
        self.create_alert(
            alert_type=AlertType.MATERIAL_CHANGE,
            level=level,
            message=f"Material change detected: {description}",
            details=change_event
        )
    
    def alert_control_action(self, command: Dict[str, Any]):
        """Alert on control action taken."""
        rpm_change = command.get("rpm_change_pct", 0)
        energy_savings = command.get("energy_savings_pct", 0)
        
        message = (
            f"Control action: RPM {command.get('current_rpm', 'N/A')} → "
            f"{command.get('target_rpm', 'N/A')} ({rpm_change:+.1f}%), "
            f"Energy savings: {energy_savings:.1f}%"
        )
        
        self.create_alert(
            alert_type=AlertType.CONTROL_ACTION,
            level=AlertLevel.INFO,
            message=message,
            details=command
        )
    
    def alert_safety_interlock(self, reason: str, details: Optional[Dict[str, Any]] = None):
        """Alert on safety interlock trigger."""
        self.create_alert(
            alert_type=AlertType.SAFETY_INTERLOCK,
            level=AlertLevel.WARNING,
            message=f"Safety interlock triggered: {reason}",
            details=details or {}
        )
    
    def alert_emergency_stop(self, reason: str, details: Optional[Dict[str, Any]] = None):
        """Alert on emergency stop condition."""
        self.create_alert(
            alert_type=AlertType.EMERGENCY_STOP,
            level=AlertLevel.CRITICAL,
            message=f"EMERGENCY STOP: {reason}",
            details=details or {}
        )
    
    def alert_performance_issue(self, issue: str, details: Optional[Dict[str, Any]] = None):
        """Alert on performance degradation."""
        self.create_alert(
            alert_type=AlertType.PERFORMANCE_ISSUE,
            level=AlertLevel.WARNING,
            message=f"Performance issue: {issue}",
            details=details or {}
        )
    
    def alert_system_error(self, error: str, details: Optional[Dict[str, Any]] = None):
        """Alert on system error."""
        self.create_alert(
            alert_type=AlertType.SYSTEM_ERROR,
            level=AlertLevel.ERROR,
            message=f"System error: {error}",
            details=details or {}
        )
    
    def alert_energy_savings(self, savings_pct: float, details: Optional[Dict[str, Any]] = None):
        """Alert on significant energy savings."""
        if savings_pct >= 5.0:  # Only alert on significant savings
            self.create_alert(
                alert_type=AlertType.ENERGY_SAVINGS,
                level=AlertLevel.INFO,
                message=f"Significant energy savings achieved: {savings_pct:.1f}%",
                details=details or {}
            )
    
    def acknowledge_alert(self, alert_id: Optional[int] = None, user: str = "operator"):
        """
        Acknowledge an alert.
        
        Args:
            alert_id: Alert index in active_alerts (if None, acknowledges all)
            user: User acknowledging the alert
        """
        if alert_id is not None:
            if 0 <= alert_id < len(self.active_alerts):
                self.active_alerts[alert_id].acknowledge(user)
                # Remove from active alerts
                self.active_alerts.pop(alert_id)
        else:
            # Acknowledge all active alerts
            for alert in self.active_alerts:
                alert.acknowledge(user)
            self.active_alerts.clear()
    
    def get_active_alerts(self, level: Optional[AlertLevel] = None) -> List[Alert]:
        """
        Get active (non-acknowledged) alerts.
        
        Args:
            level: Filter by alert level (optional)
            
        Returns:
            List of active alerts
        """
        if level:
            return [a for a in self.active_alerts if a.level == level]
        return self.active_alerts.copy()
    
    def get_recent_alerts(
        self,
        count: int = 50,
        level: Optional[AlertLevel] = None,
        alert_type: Optional[AlertType] = None
    ) -> List[Alert]:
        """
        Get recent alerts.
        
        Args:
            count: Number of alerts to return
            level: Filter by alert level (optional)
            alert_type: Filter by alert type (optional)
            
        Returns:
            List of recent alerts
        """
        alerts = list(self.alerts)
        
        # Apply filters
        if level:
            alerts = [a for a in alerts if a.level == level]
        if alert_type:
            alerts = [a for a in alerts if a.alert_type == alert_type]
        
        return alerts[-count:] if count > 0 else alerts
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary statistics."""
        total_alerts = len(self.alerts)
        active_count = len(self.active_alerts)
        
        # Count by level
        by_level = {
            level.value: sum(1 for a in self.alerts if a.level == level)
            for level in AlertLevel
        }
        
        # Count by type
        by_type = {
            alert_type.value: sum(1 for a in self.alerts if a.alert_type == alert_type)
            for alert_type in AlertType
        }
        
        # Critical alerts
        critical_alerts = [a for a in self.active_alerts if a.level == AlertLevel.CRITICAL]
        
        return {
            "device_id": self.device_id,
            "total_alerts": total_alerts,
            "active_alerts": active_count,
            "critical_alerts": len(critical_alerts),
            "by_level": by_level,
            "by_type": by_type,
            "has_critical": len(critical_alerts) > 0
        }


# Global alerting system instances
_alerting_instances: Dict[str, AlertingSystem] = {}


def get_alerting_system(device_id: str = "crusher_01", **kwargs) -> AlertingSystem:
    """Get or create alerting system instance for a device."""
    global _alerting_instances
    
    if device_id not in _alerting_instances:
        _alerting_instances[device_id] = AlertingSystem(device_id=device_id, **kwargs)
    
    return _alerting_instances[device_id]

