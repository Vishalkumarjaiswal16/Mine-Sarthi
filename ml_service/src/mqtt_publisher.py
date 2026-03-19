"""
MQTT Publisher Module

Publishes RPM recommendations to MQTT topic for PLC/controller execution.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class MQTTPublisher:
    """Publishes predictions and recommendations to MQTT."""
    
    def __init__(self):
        """Initialize MQTT publisher."""
        self.mqtt_host = os.environ.get("MQTT_HOST", "localhost")
        self.mqtt_port = int(os.environ.get("MQTT_PORT", "1883"))
        self.command_topic_template = os.environ.get(
            "MQTT_COMMAND_TOPIC",
            "mining/{device_id}/speed_setpoint"
        )
        
        self._client = None
        self._connected = False
        
    def get_client(self) -> Optional[mqtt.Client]:
        """Get or create MQTT client."""
        if self._client is None:
            try:
                self._client = mqtt.Client(client_id="ml_service_publisher")
                
                def on_connect(client, userdata, flags, rc):
                    if rc == 0:
                        self._connected = True
                        logger.info(f"Connected to MQTT broker at {self.mqtt_host}:{self.mqtt_port}")
                    else:
                        self._connected = False
                        logger.error(f"Failed to connect to MQTT broker, return code: {rc}")
                
                def on_disconnect(client, userdata, rc):
                    self._connected = False
                    logger.warning(f"Disconnected from MQTT broker (rc: {rc})")
                
                self._client.on_connect = on_connect
                self._client.on_disconnect = on_disconnect
                
                try:
                    logger.info(f"Connecting to MQTT broker at {self.mqtt_host}:{self.mqtt_port}...")
                    self._client.connect(self.mqtt_host, self.mqtt_port, 60)
                    self._client.loop_start()
                    # Wait a moment for connection to establish
                    import time
                    time.sleep(0.5)
                    if not self._connected:
                        logger.warning("MQTT connection not established yet, will retry on first publish")
                except Exception as e:
                    logger.error(f"Failed to connect to MQTT broker: {str(e)}")
                    self._client = None
            
            except Exception as e:
                logger.error(f"Failed to create MQTT client: {str(e)}")
                self._client = None
        
        return self._client
    
    def ensure_connected(self) -> bool:
        """Ensure MQTT client is connected, reconnect if needed."""
        client = self.get_client()
        if client is None:
            return False
        
        if not self._connected:
            try:
                # Try to reconnect
                client.reconnect()
                import time
                time.sleep(0.5)
            except Exception as e:
                logger.error(f"Failed to reconnect to MQTT broker: {str(e)}")
                return False
        
        return self._connected
    
    def publish_rpm_recommendation(
        self,
        device_id: str,
        recommended_rpm: float,
        current_rpm: Optional[float] = None,
        ore_type: Optional[str] = None,
        predicted_energy: Optional[float] = None,
        energy_savings_pct: Optional[float] = None,
        confidence: Optional[str] = None
    ) -> bool:
        """
        Publish RPM recommendation to MQTT.
        
        Args:
            device_id: Device identifier
            recommended_rpm: Recommended RPM value
            current_rpm: Optional current RPM
            ore_type: Optional predicted ore type
            predicted_energy: Optional predicted energy consumption
            energy_savings_pct: Optional energy savings percentage
            confidence: Optional confidence level
            
        Returns:
            True if published successfully, False otherwise
        """
        # Ensure MQTT connection is established
        if not self.ensure_connected():
            logger.warning("MQTT not connected, attempting to connect...")
            client = self.get_client()
            if client is None or not self._connected:
                logger.error("MQTT client not available or not connected")
                return False
        else:
            client = self.get_client()
            if client is None:
                logger.error("MQTT client not available")
                return False
        
        try:
            topic = self.command_topic_template.format(device_id=device_id)
            
            payload = {
                "device_id": device_id,
                "command": "speed_setpoint",
                "value": float(recommended_rpm),
                "current_rpm": float(current_rpm) if current_rpm else None,
                "ore_type": ore_type,
                "predicted_energy_kwh_per_ton": float(predicted_energy) if predicted_energy else None,
                "energy_savings_pct": float(energy_savings_pct) if energy_savings_pct else None,
                "confidence": confidence,
                "reason": f"ML optimization: {ore_type} ore, recommended RPM {recommended_rpm}",
                "source": "ml_service",
                "timestamp": None  # Will be set on PLC side
            }
            
            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            
            message = json.dumps(payload)
            result = client.publish(topic, message, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(
                    f"Published RPM recommendation to {topic}: "
                    f"{current_rpm or 'N/A'} → {recommended_rpm} RPM "
                    f"({ore_type or 'unknown'} ore)"
                )
                return True
            else:
                logger.error(f"Failed to publish RPM recommendation, return code: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing RPM recommendation: {str(e)}", exc_info=True)
            return False
    
    def publish_prediction(self, prediction: Dict[str, Any], device_id: str = "unknown") -> bool:
        """
        Publish complete prediction result to MQTT.
        
        Args:
            prediction: Prediction result dictionary
            device_id: Device identifier
            
        Returns:
            True if published successfully, False otherwise
        """
        rpm_recommendation = prediction.get("rpm_recommendation", {})
        ore_classification = prediction.get("ore_classification", {})
        
        if not rpm_recommendation or not rpm_recommendation.get("recommended_rpm"):
            logger.warning("No RPM recommendation in prediction, skipping MQTT publication")
            return False
        
        input_data = prediction.get("input", {})
        
        return self.publish_rpm_recommendation(
            device_id=device_id,
            recommended_rpm=rpm_recommendation["recommended_rpm"],
            current_rpm=input_data.get("current_rpm"),
            ore_type=ore_classification.get("predicted_class"),
            predicted_energy=rpm_recommendation.get("predicted_energy_kwh_per_ton"),
            energy_savings_pct=rpm_recommendation.get("energy_savings_pct"),
            confidence=rpm_recommendation.get("confidence")
        )
    
    def disconnect(self):
        """Disconnect from MQTT broker."""
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            self._connected = False
            logger.info("Disconnected from MQTT broker")


# Global publisher instance
_publisher_instance: Optional[MQTTPublisher] = None


def get_publisher() -> MQTTPublisher:
    """Get or create global publisher instance."""
    global _publisher_instance
    
    if _publisher_instance is None:
        _publisher_instance = MQTTPublisher()
    
    return _publisher_instance

