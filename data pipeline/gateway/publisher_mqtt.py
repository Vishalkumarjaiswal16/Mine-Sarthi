"""Simulated IoT gateway that publishes sensor messages to MQTT.
Usage:
  python publisher_mqtt.py --device crusher_01
"""
import time
import json
import random
import argparse
import os
import sys
import io
from datetime import datetime
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Terminal colors for demo presentation
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Load environment variables from .env file
load_dotenv()

# MQTT Configuration (with .env support)
MQTT_HOST = os.environ.get("MQTT_HOST") or os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
# Default topic matches architecture: mining/crusher_01/metrics
TOPIC_TEMPLATE = os.environ.get("MQTT_TOPIC_TEMPLATE", "mining/{device_id}/metrics")


def make_payload(device_id: str):
    """
    Generate realistic crusher telemetry payload with all sensor fields.
    
    NOTE: This is a SIMULATED data generator for demo purposes.
    In production, this would be replaced with actual IoT sensor readings.
    Real sensors will plug into the same MQTT/HTTP pipeline.
    """
    return {
        "device_id": device_id,
        "ts": int(time.time()),
        "power_kw": round(random.uniform(200, 400), 2),
        "rpm": random.randint(800, 1200),
        "feed_tph": random.randint(300, 600),
        "feed_size_mm": round(random.uniform(50, 150), 1),  # Required for Model 1 (Ore Hardness Classifier)
        "ore_fines_pct": round(random.uniform(5.0, 30.0), 2),
        "vibration": round(random.uniform(0.1, 2.0), 3),
        "temperature_c": round(random.uniform(65.0, 85.0), 1),
        "motor_current_a": round(random.uniform(250.0, 400.0), 1),
        "hardness_index": round(random.uniform(40.0, 80.0), 1),
    }


def print_banner():
    """Print a professional banner for demo presentation."""
    try:
        banner = f"""
{Colors.CYAN}{'='*70}{Colors.RESET}
{Colors.BOLD}{Colors.HEADER}    IoT GATEWAY SIMULATOR - Real-Time Sensor Data Publisher{Colors.RESET}
{Colors.CYAN}{'='*70}{Colors.RESET}
{Colors.YELLOW}[SENSOR] Simulating IoT sensors collecting real-time crusher telemetry{Colors.RESET}
{Colors.CYAN}{'='*70}{Colors.RESET}
"""
        print(banner)
    except UnicodeEncodeError:
        # Fallback banner without special characters if encoding fails
        banner = f"""
{'='*70}
    IoT GATEWAY SIMULATOR - Real-Time Sensor Data Publisher
{'='*70}
[SENSOR] Simulating IoT sensors collecting real-time crusher telemetry
{'='*70}
"""
        print(banner)


def print_connection_info(device_id: str, topic: str, interval_min: int, interval_max: int):
    """Print connection information."""
    print(f"{Colors.GREEN}✓{Colors.RESET} Device ID: {Colors.BOLD}{device_id}{Colors.RESET}")
    print(f"{Colors.GREEN}✓{Colors.RESET} MQTT Broker: {Colors.BOLD}{MQTT_HOST}:{MQTT_PORT}{Colors.RESET}")
    print(f"{Colors.GREEN}✓{Colors.RESET} Topic: {Colors.BOLD}{topic}{Colors.RESET}")
    print(f"{Colors.GREEN}✓{Colors.RESET} Publish Interval: {Colors.BOLD}{interval_min}-{interval_max} seconds{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")


def print_sensor_data(payload: dict, message_count: int):
    """Print sensor data in a presentation-friendly format."""
    timestamp = datetime.fromtimestamp(payload['ts']).strftime('%H:%M:%S')
    
    print(f"\n{Colors.CYAN}{'─'*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}[{timestamp}] Message #{message_count} - Sensor Data Published{Colors.RESET}")
    print(f"{Colors.CYAN}{'─'*70}{Colors.RESET}")
    
    # Key metrics for presentation
    print(f"{Colors.GREEN}  Power:{Colors.RESET}        {Colors.BOLD}{payload['power_kw']:.2f} kW{Colors.RESET}")
    print(f"{Colors.GREEN}  RPM:{Colors.RESET}           {Colors.BOLD}{payload['rpm']} rpm{Colors.RESET}")
    print(f"{Colors.GREEN}  Feed Rate:{Colors.RESET}    {Colors.BOLD}{payload['feed_tph']} TPH{Colors.RESET}")
    print(f"{Colors.GREEN}  Feed Size:{Colors.RESET}    {Colors.BOLD}{payload['feed_size_mm']:.1f} mm{Colors.RESET} {Colors.YELLOW}(for AI Model 1){Colors.RESET}")
    print(f"{Colors.GREEN}  Temperature:{Colors.RESET} {Colors.BOLD}{payload['temperature_c']:.1f} °C{Colors.RESET}")
    print(f"{Colors.GREEN}  Vibration:{Colors.RESET}   {Colors.BOLD}{payload['vibration']:.3f} mm/s{Colors.RESET}")
    print(f"{Colors.GREEN}  Current:{Colors.RESET}     {Colors.BOLD}{payload['motor_current_a']:.1f} A{Colors.RESET}")
    
    # Full JSON for technical details (can be collapsed in presentation)
    print(f"\n{Colors.YELLOW}  Full Payload:{Colors.RESET}")
    print(f"{Colors.CYAN}  {json.dumps(payload, indent=4)}{Colors.RESET}")
    
    print(f"{Colors.CYAN}{'─'*70}{Colors.RESET}")


def main(device_id: str, interval_min: int = 1, interval_max: int = 5):
    topic = TOPIC_TEMPLATE.format(device_id=device_id)
    # Use VERSION2 API (latest) to avoid deprecation warnings
    use_version2 = False
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        use_version2 = True
    except AttributeError:
        # Fallback for older paho-mqtt versions that don't support VERSION2
        client = mqtt.Client()
        use_version2 = False
    message_count = 0
    
    # Print banner
    print_banner()
    
    # Add connection callbacks for better error handling
    # Handle both VERSION1 and VERSION2
    if use_version2:
        # VERSION2 signature: (client, userdata, flags, reason_code, properties)
        def on_connect(client, userdata, flags, reason_code, properties):
            if reason_code == 0:
                print(f"{Colors.GREEN}✓ Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}{Colors.RESET}\n")
                print_connection_info(device_id, topic, interval_min, interval_max)
                print(f"{Colors.BOLD}{Colors.GREEN}[START] Starting real-time data stream...{Colors.RESET}\n")
            else:
                print(f"{Colors.RED}✗ Failed to connect to MQTT broker, reason code {reason_code}{Colors.RESET}")
                sys.exit(1)
        
        def on_publish(client, userdata, mid, reason_code=None, properties=None):
            pass  # Message published successfully
    else:
        # VERSION1 signature: (client, userdata, flags, rc)
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print(f"{Colors.GREEN}✓ Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}{Colors.RESET}\n")
                print_connection_info(device_id, topic, interval_min, interval_max)
                print(f"{Colors.BOLD}{Colors.GREEN}[START] Starting real-time data stream...{Colors.RESET}\n")
            else:
                print(f"{Colors.RED}✗ Failed to connect to MQTT broker, return code {rc}{Colors.RESET}")
                sys.exit(1)
        
        def on_publish(client, userdata, mid):
            pass  # Message published successfully
    
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        print(f"{Colors.YELLOW}Connecting to MQTT broker at {MQTT_HOST}:{MQTT_PORT}...{Colors.RESET}")
        client.connect(MQTT_HOST, MQTT_PORT, 60)
        client.loop_start()
        
        # Wait for connection to be established
        time.sleep(2)
        
        while True:
            payload = make_payload(device_id)
            result = client.publish(topic, json.dumps(payload), qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                message_count += 1
                print_sensor_data(payload, message_count)
            else:
                print(f"{Colors.RED}✗ Failed to publish message, return code: {result.rc}{Colors.RESET}")
            
            # Wait before next publish
            sleep_time = random.uniform(interval_min, interval_max)
            print(f"{Colors.YELLOW}  [WAIT] Next publish in {sleep_time:.1f} seconds...{Colors.RESET}\n")
            time.sleep(sleep_time)
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}{'='*70}{Colors.RESET}")
        print(f"{Colors.YELLOW}⚠ Stopping publisher...{Colors.RESET}")
        print(f"{Colors.YELLOW}   Total messages published: {message_count}{Colors.RESET}")
        print(f"{Colors.YELLOW}{'='*70}{Colors.RESET}\n")
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {e}{Colors.RESET}")
        sys.exit(1)
    finally:
        client.loop_stop()
        client.disconnect()
        print(f"{Colors.GREEN}✓ Disconnected from MQTT broker{Colors.RESET}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(
        description="IoT Gateway Simulator - Publishes sensor data to MQTT every 2-3 seconds"
    )
    p.add_argument("--device", default="crusher_01", help="Device ID (default: crusher_01)")
    p.add_argument("--min", type=int, default=2, help="Minimum publish interval in seconds (default: 2)")
    p.add_argument("--max", type=int, default=3, help="Maximum publish interval in seconds (default: 3)")
    args = p.parse_args()
    main(args.device, args.min, args.max)
