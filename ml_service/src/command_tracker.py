"""
Command Execution Tracking Module

Tracks if commands were executed and measures results:
- Monitor actual RPM changes after command
- Compare predicted vs actual energy consumption
- Calculate real energy savings
- Store execution history in PostgreSQL
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from collections import deque
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class CommandTracker:
    """Tracks command execution and measures results."""
    
    def __init__(self, device_id: str = "crusher_01", history_size: int = 100):
        """
        Initialize command tracker.
        
        Args:
            device_id: Device identifier
            history_size: Size of in-memory history (default: 100)
        """
        self.device_id = device_id
        self.history_size = history_size
        
        # In-memory command history
        self.command_history: deque = deque(maxlen=history_size)
        
        # PostgreSQL configuration
        self.pg_host = os.environ.get("PG_HOST", "localhost")
        self.pg_port = int(os.environ.get("PG_PORT", "5432"))
        self.pg_db = os.environ.get("PG_DB", "mine_sarthi")
        self.pg_user = os.environ.get("PG_USER", "postgres")
        self.pg_password = os.environ.get("PG_PASSWORD", "password")
        
        self._pg_conn = None
        # Try to ensure table, but don't fail initialization if database is unavailable
        try:
            self._ensure_table()
        except Exception as e:
            logger.warning(f"Could not initialize database table (database may be unavailable): {str(e)}")
            logger.info("CommandTracker will continue with in-memory storage only")
        
        logger.info(f"CommandTracker initialized for device {device_id}")
    
    def _get_pg_connection(self):
        """Get or create PostgreSQL connection."""
        if self._pg_conn is None or (hasattr(self._pg_conn, 'closed') and self._pg_conn.closed):
            try:
                self._pg_conn = psycopg2.connect(
                    host=self.pg_host,
                    port=self.pg_port,
                    database=self.pg_db,
                    user=self.pg_user,
                    password=self.pg_password,
                    connect_timeout=5  # 5 second timeout
                )
                logger.debug(f"Connected to PostgreSQL at {self.pg_host}:{self.pg_port}")
            except Exception as e:
                logger.warning(f"PostgreSQL connection unavailable: {str(e)}")
                logger.debug("CommandTracker will use in-memory storage only")
                self._pg_conn = None
        
        return self._pg_conn
    
    def _ensure_table(self):
        """Ensure command tracking table exists."""
        conn = self._get_pg_connection()
        if conn is None:
            return
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS control_commands (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    command_timestamp TIMESTAMPTZ NOT NULL,
                    command_type VARCHAR(50) NOT NULL,
                    target_rpm DOUBLE PRECISION,
                    current_rpm DOUBLE PRECISION,
                    ore_type VARCHAR(20),
                    predicted_energy_kwh_per_ton DOUBLE PRECISION,
                    predicted_energy_savings_pct DOUBLE PRECISION,
                    command_json JSONB,
                    execution_status VARCHAR(20) DEFAULT 'pending',
                    executed_timestamp TIMESTAMPTZ,
                    actual_rpm DOUBLE PRECISION,
                    actual_energy_kwh_per_ton DOUBLE PRECISION,
                    actual_energy_savings_pct DOUBLE PRECISION,
                    execution_result_json JSONB,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_control_commands_device_time 
                ON control_commands(device_id, command_timestamp DESC);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_control_commands_status 
                ON control_commands(execution_status);
            """)
            
            conn.commit()
            cursor.close()
            logger.debug("Command tracking table ensured")
            
        except Exception as e:
            logger.error(f"Failed to ensure command tracking table: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
    
    def record_command(self, command: Dict[str, Any]) -> bool:
        """
        Record a control command that was sent.
        
        Args:
            command: Command dictionary from control service
            
        Returns:
            True if recorded successfully
        """
        try:
            command_record = {
                "device_id": self.device_id,
                "command_timestamp": command.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "command_type": "speed_setpoint",
                "target_rpm": command.get("target_rpm") or command.get("adjusted_rpm"),
                "current_rpm": command.get("current_rpm"),
                "ore_type": command.get("ore_type"),
                "predicted_energy_kwh_per_ton": command.get("predicted_energy_kwh_per_ton"),
                "predicted_energy_savings_pct": command.get("energy_savings_pct"),
                "command_json": psycopg2.extras.Json(command),
                "execution_status": "pending"
            }
            
            # Store in PostgreSQL
            conn = self._get_pg_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO control_commands (
                            device_id, command_timestamp, command_type,
                            target_rpm, current_rpm, ore_type,
                            predicted_energy_kwh_per_ton, predicted_energy_savings_pct,
                            command_json, execution_status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        command_record["device_id"],
                        command_record["command_timestamp"],
                        command_record["command_type"],
                        command_record["target_rpm"],
                        command_record["current_rpm"],
                        command_record["ore_type"],
                        command_record["predicted_energy_kwh_per_ton"],
                        command_record["predicted_energy_savings_pct"],
                        command_record["command_json"],
                        command_record["execution_status"]
                    ))
                    
                    command_id = cursor.fetchone()[0]
                    conn.commit()
                    cursor.close()
                    
                    command_record["id"] = command_id
                    logger.debug(f"Recorded command {command_id} for device {self.device_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to record command in PostgreSQL: {str(e)}", exc_info=True)
                    if conn:
                        conn.rollback()
            
            # Store in memory
            self.command_history.append(command_record)
            
            return True
            
        except Exception as e:
            logger.error(f"Error recording command: {str(e)}", exc_info=True)
            return False
    
    def update_command_execution(
        self,
        command_id: Optional[int] = None,
        actual_rpm: Optional[float] = None,
        actual_energy: Optional[float] = None,
        status: str = "executed"
    ) -> bool:
        """
        Update command execution status with actual results.
        
        Args:
            command_id: Command ID (if None, updates most recent pending command)
            actual_rpm: Actual RPM after execution
            actual_energy: Actual energy consumption after execution
            status: Execution status (executed, failed, timeout)
            
        Returns:
            True if updated successfully
        """
        try:
            conn = self._get_pg_connection()
            if not conn:
                return False
            
            # Calculate actual energy savings if we have both predicted and actual
            actual_savings_pct = None
            if actual_energy and command_id:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT predicted_energy_kwh_per_ton, current_rpm
                    FROM control_commands
                    WHERE id = %s
                """, (command_id,))
                
                result = cursor.fetchone()
                if result:
                    predicted_energy, current_rpm_data = result
                    if predicted_energy and actual_energy:
                        # Calculate savings based on energy difference
                        if predicted_energy > actual_energy:
                            actual_savings_pct = ((predicted_energy - actual_energy) / predicted_energy) * 100
                cursor.close()
            
            # Update command
            cursor = conn.cursor()
            
            if command_id:
                cursor.execute("""
                    UPDATE control_commands
                    SET execution_status = %s,
                        executed_timestamp = %s,
                        actual_rpm = %s,
                        actual_energy_kwh_per_ton = %s,
                        actual_energy_savings_pct = %s
                    WHERE id = %s
                """, (
                    status,
                    datetime.now(timezone.utc).isoformat(),
                    actual_rpm,
                    actual_energy,
                    actual_savings_pct,
                    command_id
                ))
            else:
                # Update most recent pending command
                cursor.execute("""
                    UPDATE control_commands
                    SET execution_status = %s,
                        executed_timestamp = %s,
                        actual_rpm = %s,
                        actual_energy_kwh_per_ton = %s,
                        actual_energy_savings_pct = %s
                    WHERE device_id = %s
                    AND execution_status = 'pending'
                    ORDER BY command_timestamp DESC
                    LIMIT 1
                """, (
                    status,
                    datetime.now(timezone.utc).isoformat(),
                    actual_rpm,
                    actual_energy,
                    actual_savings_pct,
                    self.device_id
                ))
            
            conn.commit()
            cursor.close()
            
            logger.debug(f"Updated command execution status: {status}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating command execution: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            return False
    
    def get_command_history(
        self,
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get command history from database.
        
        Args:
            limit: Maximum number of records to return
            status: Filter by execution status (optional)
            
        Returns:
            List of command records
        """
        try:
            conn = self._get_pg_connection()
            if not conn:
                return list(self.command_history)[-limit:] if limit else list(self.command_history)
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            query = """
                SELECT * FROM control_commands
                WHERE device_id = %s
            """
            params = [self.device_id]
            
            if status:
                query += " AND execution_status = %s"
                params.append(status)
            
            query += " ORDER BY command_timestamp DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            
            # Convert to list of dicts
            commands = [dict(row) for row in results]
            
            return commands
            
        except Exception as e:
            logger.error(f"Error getting command history: {str(e)}", exc_info=True)
            return list(self.command_history)[-limit:] if limit else list(self.command_history)
    
    def get_energy_savings_summary(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get energy savings summary for recent commands.
        
        Args:
            hours: Time window in hours (default: 24)
            
        Returns:
            Summary dictionary with savings statistics
        """
        try:
            conn = self._get_pg_connection()
            if not conn:
                return {"error": "Database not available"}
            
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_commands,
                    COUNT(CASE WHEN execution_status = 'executed' THEN 1 END) as executed_commands,
                    AVG(predicted_energy_savings_pct) as avg_predicted_savings,
                    AVG(actual_energy_savings_pct) as avg_actual_savings,
                    SUM(CASE WHEN actual_energy_savings_pct IS NOT NULL 
                        THEN actual_energy_savings_pct ELSE 0 END) as total_actual_savings
                FROM control_commands
                WHERE device_id = %s
                AND command_timestamp >= NOW() - INTERVAL '%s hours'
                AND execution_status = 'executed'
            """, (self.device_id, hours))
            
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return {
                    "device_id": self.device_id,
                    "time_window_hours": hours,
                    "total_commands": result[0] or 0,
                    "executed_commands": result[1] or 0,
                    "avg_predicted_savings_pct": float(result[2]) if result[2] else 0.0,
                    "avg_actual_savings_pct": float(result[3]) if result[3] else 0.0,
                    "total_actual_savings_pct": float(result[4]) if result[4] else 0.0
                }
            
            return {
                "device_id": self.device_id,
                "time_window_hours": hours,
                "total_commands": 0,
                "executed_commands": 0,
                "avg_predicted_savings_pct": 0.0,
                "avg_actual_savings_pct": 0.0,
                "total_actual_savings_pct": 0.0
            }
            
        except Exception as e:
            logger.error(f"Error getting energy savings summary: {str(e)}", exc_info=True)
            return {"error": str(e)}


# Global tracker instances
_tracker_instances: Dict[str, CommandTracker] = {}


def get_tracker(device_id: str = "crusher_01", **kwargs) -> CommandTracker:
    """Get or create tracker instance for a device."""
    global _tracker_instances
    
    if device_id not in _tracker_instances:
        _tracker_instances[device_id] = CommandTracker(device_id=device_id, **kwargs)
    
    return _tracker_instances[device_id]

