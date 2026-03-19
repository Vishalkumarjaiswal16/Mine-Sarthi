"""MQTT -> HTTP bridge (Production-Ready)

Subscribes to crusher telemetry topics and forwards validated JSON payloads to FastAPI backend.
Implements production-ready features:
- Automatic reconnection with exponential backoff
- Message validation
- Retry logic for HTTP forwarding
- Error handling and logging
- Health monitoring

By default:
- MQTT topic: ``mining/+/metrics`` (matches architecture: mining/crusher_01/metrics)
- Backend URL: ``http://localhost:8000/ingest`` (FastAPI service)
"""
import os
import json
import logging
import time
import requests
import paho.mqtt.client as mqtt
import threading
from collections import deque
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MQTT Configuration (with .env support)
MQTT_HOST = os.environ.get("MQTT_HOST") or os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
# Subscribe to mining topics matching architecture: mining/crusher_01/metrics
MQTT_TOPIC = os.environ.get("MQTT_TOPIC_PATTERN") or os.environ.get("MQTT_TOPIC", "mining/+/metrics")
# Point to FastAPI subscriber by default
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000/ingest")
# Retry configuration
MAX_RETRIES = int(os.environ.get("MAX_RETRIES", "3"))
RETRY_DELAY = float(os.environ.get("RETRY_DELAY", "1.0"))
HTTP_TIMEOUT = int(os.environ.get("HTTP_TIMEOUT", "10"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("mqtt_bridge")

# Statistics
_stats = {
    "messages_received": 0,
    "messages_forwarded": 0,
    "messages_failed": 0,
    "invalid_json": 0,
    "validation_errors": 0,
    "reconnection_count": 0,
    "messages_queued": 0,
    "messages_retried": 0,
}

# Message queue for buffering when backend is down
_message_queue = deque(maxlen=1000)  # Buffer up to 1000 messages
_queue_lock = threading.Lock()
_backend_available = False


def validate_payload(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate telemetry payload structure and data ranges.
    Returns (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Payload must be a JSON object"
    
    # Check for required fields
    device_id = data.get("device_id") or data.get("sensor_id")
    if not device_id:
        return False, "Missing device_id or sensor_id"
    
    if "ts" not in data:
        return False, "Missing timestamp (ts)"
    
    # Check for at least one metric field
    metric_fields = [
        "power_kw", "rpm", "feed_tph", "ore_fines_pct", "vibration",
        "temperature_c", "motor_current_a", "hardness_index"
    ]
    has_metric = any(field in data and data[field] is not None for field in metric_fields)
    has_single_metric = data.get("metric") is not None and data.get("value") is not None
    
    if not (has_metric or has_single_metric):
        return False, "No metric fields found in payload"
    
    # Validate data ranges (reasonable bounds for crusher operations)
    range_checks = {
        "power_kw": (0, 1000),  # 0 to 1000 kW
        "rpm": (0, 2000),  # 0 to 2000 RPM
        "feed_tph": (0, 1000),  # 0 to 1000 tons/hour
        "ore_fines_pct": (0, 100),  # 0 to 100%
        "vibration": (0, 10),  # 0 to 10 mm/s
        "temperature_c": (0, 150),  # 0 to 150°C
        "motor_current_a": (0, 1000),  # 0 to 1000 Amperes
        "hardness_index": (0, 100),  # 0 to 100
    }
    
    for field, (min_val, max_val) in range_checks.items():
        value = data.get(field)
        if value is not None:
            try:
                num_value = float(value)
                if num_value < min_val or num_value > max_val:
                    logger.warning(
                        f"Value out of range for {field}: {num_value} "
                        f"(expected {min_val}-{max_val})"
                    )
                    # Don't reject, just warn - may be valid edge cases
            except (ValueError, TypeError):
                return False, f"Invalid value type for {field}: {value}"
    
    return True, None


def check_backend_health() -> bool:
    """
    Check if the backend is available and healthy.
    Returns True if backend is reachable, False otherwise.
    """
    global _backend_available
    try:
        # Try to reach the backend with a simple GET request to root or health endpoint
        health_url = BACKEND_URL.replace("/ingest", "/health")
        resp = requests.get(health_url, timeout=5)
        is_available = resp.status_code < 500
        _backend_available = is_available
        return is_available
    except requests.exceptions.RequestException:
        # If health endpoint doesn't exist, try a HEAD request to the ingest endpoint
        try:
            resp = requests.head(BACKEND_URL, timeout=5)
            is_available = resp.status_code < 500
            _backend_available = is_available
            return is_available
        except requests.exceptions.RequestException:
            _backend_available = False
            return False


def forward_to_backend(data: Dict[str, Any], retry_count: int = 0, from_queue: bool = False) -> bool:
    """
    Forward validated payload to FastAPI backend with retry logic.
    Returns True if successful, False otherwise.
    If backend is unavailable, message is queued for later retry.
    """
    global _backend_available
    
    try:
        resp = requests.post(
            BACKEND_URL,
            json=data,
            timeout=HTTP_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        resp.raise_for_status()
        _stats["messages_forwarded"] += 1
        if from_queue:
            _stats["messages_retried"] += 1
        _backend_available = True
        logger.debug(f"Forwarded to {BACKEND_URL} status={resp.status_code}")
        return True
    except requests.exceptions.Timeout:
        logger.warning(f"Timeout forwarding to {BACKEND_URL}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (2 ** retry_count))  # Exponential backoff
            return forward_to_backend(data, retry_count + 1, from_queue)
        # Queue message for later retry
        _queue_message(data)
        _backend_available = False
        return False
    except requests.exceptions.ConnectionError:
        _backend_available = False
        if retry_count == 0:
            logger.warning(f"Backend at {BACKEND_URL} is not available (queuing message for retry)")
        elif retry_count < MAX_RETRIES:
            logger.debug(f"Retry {retry_count}/{MAX_RETRIES}: Backend still not available")
        else:
            logger.warning(f"Backend unavailable after {MAX_RETRIES} retries - message queued")
        
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (2 ** retry_count))
            return forward_to_backend(data, retry_count + 1, from_queue)
        
        # Queue message for later retry instead of failing
        _queue_message(data)
        return False
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error forwarding to backend: {e} (status: {e.response.status_code if e.response else 'unknown'})")
        # Don't queue HTTP errors (4xx/5xx) - these are likely permanent failures
        if e.response and e.response.status_code >= 500:
            # Server errors might be temporary, so queue
            _queue_message(data)
        else:
            _stats["messages_failed"] += 1
        return False
    except Exception as e:
        logger.error(f"Unexpected error forwarding to backend: {e}")
        _stats["messages_failed"] += 1
        return False


def _queue_message(data: Dict[str, Any]):
    """Add message to retry queue."""
    with _queue_lock:
        if len(_message_queue) >= _message_queue.maxlen:
            # Remove oldest message if queue is full
            _message_queue.popleft()
            logger.warning("Message queue full, dropping oldest message")
        _message_queue.append((time.time(), data))
        _stats["messages_queued"] += 1


def _flush_queue():
    """Background thread function to periodically retry queued messages when backend is available."""
    while True:
        time.sleep(5)  # Check every 5 seconds
        
        # Check if backend is available
        if not check_backend_health():
            continue
        
        # Try to flush queue
        messages_to_retry = []
        with _queue_lock:
            if len(_message_queue) == 0:
                continue
            # Get up to 10 messages at a time to avoid overwhelming the backend
            for _ in range(min(10, len(_message_queue))):
                if len(_message_queue) > 0:
                    messages_to_retry.append(_message_queue.popleft())
        
        # Retry messages
        for timestamp, data in messages_to_retry:
            success = forward_to_backend(data, from_queue=True)
            if not success:
                # Re-queue if still failing
                with _queue_lock:
                    _message_queue.append((timestamp, data))
                break  # Stop if backend becomes unavailable again


def on_connect(client: mqtt.Client, userdata, flags, reason_code, properties):
    """
    Callback when MQTT client connects to broker.
    VERSION2 signature: (client, userdata, flags, reason_code, properties)
    Using VERSION2 API (latest) to avoid deprecation warnings.
    """
    if reason_code == 0:
        logger.info(f"Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}")
        logger.info(f"Subscribing to topic: {MQTT_TOPIC}")
        client.subscribe(MQTT_TOPIC, qos=1)
    else:
        logger.error(f"Failed to connect to MQTT broker, reason code {reason_code}")
        _stats["reconnection_count"] += 1


def on_disconnect_v2(client: mqtt.Client, userdata, disconnect_flags, reason_code, properties):
    """
    Callback when MQTT client disconnects from broker (VERSION2).
    VERSION2 signature: (client, userdata, disconnect_flags, reason_code, properties)
    """
    if reason_code != 0:
        logger.warning(f"Unexpected disconnection from MQTT broker (reason_code={reason_code})")
    else:
        logger.info("Disconnected from MQTT broker")


def on_disconnect_v1(client: mqtt.Client, userdata, rc):
    """
    Callback when MQTT client disconnects from broker (VERSION1).
    VERSION1 signature: (client, userdata, rc)
    """
    if rc != 0:
        logger.warning(f"Unexpected disconnection from MQTT broker (rc={rc})")
    else:
        logger.info("Disconnected from MQTT broker")


def on_message(client: mqtt.Client, userdata, msg):
    """Callback when a message is received from MQTT broker."""
    _stats["messages_received"] += 1
    
    # Decode payload - handle both bytes and string
    try:
        if isinstance(msg.payload, bytes):
            payload = msg.payload.decode("utf-8")
        else:
            payload = str(msg.payload)
    except (UnicodeDecodeError, AttributeError) as e:
        logger.error(f"Failed to decode message payload: {e}")
        _stats["invalid_json"] += 1
        return
    
    # Check if payload is empty
    if not payload or not payload.strip():
        logger.warning(f"Empty payload received on topic {msg.topic}")
        _stats["invalid_json"] += 1
        return
    
    logger.debug(f"Received on {msg.topic}: {payload[:200]}...")  # Log first 200 chars
    
    # Parse JSON
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON on topic {msg.topic}: {e}")
        _stats["invalid_json"] += 1
        return
    
    # Validate payload
    is_valid, error_msg = validate_payload(data)
    if not is_valid:
        logger.warning(f"Validation failed for message on {msg.topic}: {error_msg}")
        _stats["validation_errors"] += 1
        return

    # Forward to backend
    success = forward_to_backend(data)
    if success:
        logger.debug(f"Successfully forwarded message from {msg.topic}")
    else:
        # Message was queued for retry, so this is not a critical error
        # Only log as warning since message will be retried when backend comes online
        with _queue_lock:
            queue_size = len(_message_queue)
        if queue_size > 0:
            logger.debug(f"Message from {msg.topic} queued for retry (queue size: {queue_size})")
        else:
            logger.warning(f"Message from {msg.topic} could not be forwarded (backend unavailable)")


def on_log(client: mqtt.Client, userdata, level, buf, properties):
    """
    Callback for MQTT client logging.
    VERSION2 signature: (client, userdata, level, buf, properties)
    Using VERSION2 API (latest) to avoid deprecation warnings.
    """
    if level == mqtt.MQTT_LOG_ERR:
        logger.error(f"MQTT: {buf}")
    elif level == mqtt.MQTT_LOG_WARNING:
        logger.warning(f"MQTT: {buf}")
    else:
        logger.debug(f"MQTT: {buf}")


def print_stats():
    """Print statistics periodically."""
    with _queue_lock:
        queue_size = len(_message_queue)
    logger.info(
        f"Stats - Received: {_stats['messages_received']}, "
        f"Forwarded: {_stats['messages_forwarded']}, "
        f"Failed: {_stats['messages_failed']}, "
        f"Queued: {queue_size}, "
        f"Retried: {_stats['messages_retried']}, "
        f"Invalid: {_stats['invalid_json']}, "
        f"Validation Errors: {_stats['validation_errors']}, "
        f"Reconnections: {_stats['reconnection_count']}"
    )


def main():
    """Main function to start MQTT bridge."""
    logger.info("Starting MQTT -> HTTP Bridge")
    logger.info(f"MQTT Broker: {MQTT_HOST}:{MQTT_PORT}")
    logger.info(f"MQTT Topic: {MQTT_TOPIC}")
    logger.info(f"Backend URL: {BACKEND_URL}")
    logger.info(f"Retry Config: max={MAX_RETRIES}, delay={RETRY_DELAY}s")
    
    # Check backend availability at startup
    logger.info("Checking backend availability...")
    if not check_backend_health():
        logger.warning(
            f"⚠ WARNING: Backend at {BACKEND_URL} is not available. "
            f"Messages will be queued and retried automatically when backend comes online. "
            f"Please ensure the FastAPI backend is running: "
            f"cd backend && python -m uvicorn fastapi_app:app --host 0.0.0.0 --port 8000"
        )
    else:
        logger.info(f"✓ Backend at {BACKEND_URL} is available")
    
    # Start background thread to flush queued messages
    queue_flusher = threading.Thread(target=_flush_queue, daemon=True, name="QueueFlusher")
    queue_flusher.start()
    logger.info("Message queue retry thread started")
    
    # Use VERSION2 API (latest) to avoid deprecation warnings
    # Handle both VERSION1 and VERSION2
    use_version2 = False
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="mqtt_bridge_consumer")
        use_version2 = True
    except AttributeError:
        # Fallback for older paho-mqtt versions that don't support VERSION2
        client = mqtt.Client(client_id="mqtt_bridge_consumer")
        use_version2 = False
    
    # Set callbacks based on version
    if use_version2:
        # VERSION2 callbacks
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect_v2
        client.on_log = on_log
    else:
        # VERSION1 callbacks - need to create wrappers
        def on_connect_v1_wrapper(client, userdata, flags, rc):
            # Convert VERSION1 to VERSION2 signature
            # VERSION1 uses rc (return code), VERSION2 uses reason_code
            on_connect(client, userdata, flags, rc, None)
        
        def on_log_v1_wrapper(client, userdata, level, buf):
            # Convert VERSION1 to VERSION2 signature
            on_log(client, userdata, level, buf, None)
        
        client.on_connect = on_connect_v1_wrapper
        client.on_disconnect = on_disconnect_v1
        client.on_log = on_log_v1_wrapper
    
    # on_message is the same for both versions
    client.on_message = on_message

    # Enable automatic reconnection
    client.reconnect_delay_set(min_delay=1, max_delay=120)
    
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        client.loop_start()
        
        # Print stats every 60 seconds
        last_stats_time = time.time()
        while True:
            time.sleep(10)
            if time.time() - last_stats_time >= 60:
                print_stats()
                last_stats_time = time.time()
                
    except KeyboardInterrupt:
        logger.info("Shutting down MQTT bridge...")
        client.loop_stop()
        client.disconnect()
        print_stats()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
