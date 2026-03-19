"""
MQTT Command Monitor

Monitors MQTT commands being published to verify delivery.
Subscribes to command topics and logs all commands received.
"""

import os
import json
import logging
import paho.mqtt.client as mqtt
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class MQTTCommandMonitor:
    """Monitors MQTT commands for verification."""
    
    def __init__(
        self,
        device_id: str = "crusher_01",
        command_topic_template: str = None
    ):
        """
        Initialize MQTT command monitor.
        
        Args:
            device_id: Device identifier to monitor
            command_topic_template: MQTT topic template (default: mining/{device_id}/speed_setpoint)
        """
        self.device_id = device_id
        self.mqtt_host = os.environ.get("MQTT_HOST", "localhost")
        self.mqtt_port = int(os.environ.get("MQTT_PORT", "1883"))
        self.command_topic = (command_topic_template or 
                            os.environ.get("COMMAND_TOPIC_TEMPLATE", 
                                         "mining/{device_id}/speed_setpoint")).format(device_id=device_id)
        
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self.commands_received: list = []
        
        # Callbacks
        self.on_command_received: Optional[Callable[[Dict[str, Any]], None]] = None
        
        logger.info(
            f"MQTTCommandMonitor initialized for device {device_id}, "
            f"topic: {self.command_topic}"
        )
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when MQTT client connects."""
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT broker at {self.mqtt_host}:{self.mqtt_port}")
            # Subscribe to command topic
            client.subscribe(self.command_topic, qos=1)
            logger.info(f"Subscribed to topic: {self.command_topic}")
        else:
            self.is_connected = False
            logger.error(f"Failed to connect to MQTT broker, return code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when MQTT client disconnects."""
        self.is_connected = False
        logger.warning(f"Disconnected from MQTT broker (rc: {rc})")
    
    def _on_message(self, client, userdata, msg):
        """Callback when a command message is received."""
        try:
            payload = msg.payload.decode("utf-8")
            data = json.loads(payload)
            
            # Add reception timestamp
            data["received_timestamp"] = datetime.now(timezone.utc).isoformat()
            data["topic"] = msg.topic
            
            # Store command
            self.commands_received.append(data)
            
            logger.info(
                f"Command received on {msg.topic}: "
                f"RPM {data.get('current_rpm', 'N/A')} → {data.get('value', 'N/A')}, "
                f"Source: {data.get('source', 'unknown')}"
            )
            
            # Call callback if registered
            if self.on_command_received:
                try:
                    self.on_command_received(data)
                except Exception as e:
                    logger.error(f"Error in on_command_received callback: {e}", exc_info=True)
        
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in command message: {e}")
        except Exception as e:
            logger.error(f"Error processing command message: {e}", exc_info=True)
    
    def start(self):
        """Start monitoring MQTT commands."""
        if self.client and self.is_connected:
            logger.warning("Monitor is already running")
            return
        
        try:
            self.client = mqtt.Client(client_id=f"mqtt_command_monitor_{self.device_id}")
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            
            self.client.connect(self.mqtt_host, self.mqtt_port, 60)
            self.client.loop_start()
            
            logger.info(f"MQTT command monitor started for device {self.device_id}")
            
        except Exception as e:
            logger.error(f"Failed to start MQTT monitor: {str(e)}", exc_info=True)
            self.client = None
    
    def stop(self):
        """Stop monitoring MQTT commands."""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
            logger.info(f"MQTT command monitor stopped for device {self.device_id}")
    
    def get_recent_commands(self, count: int = 10) -> list:
        """Get recent commands received."""
        return self.commands_received[-count:] if count > 0 else self.commands_received
    
    def get_status(self) -> Dict[str, Any]:
        """Get monitor status."""
        return {
            "device_id": self.device_id,
            "connected": self.is_connected,
            "topic": self.command_topic,
            "commands_received": len(self.commands_received)
        }


# Global monitor instances
_monitor_instances: Dict[str, MQTTCommandMonitor] = {}


def get_command_monitor(device_id: str = "crusher_01", **kwargs) -> MQTTCommandMonitor:
    """Get or create command monitor instance."""
    global _monitor_instances
    
    if device_id not in _monitor_instances:
        _monitor_instances[device_id] = MQTTCommandMonitor(device_id=device_id, **kwargs)
    
    return _monitor_instances[device_id]

