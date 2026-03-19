-- PostgreSQL Database Setup for Mine Sarthi Data Pipeline
-- This script creates the database and all required tables

-- Create database (if not exists)
-- Note: This is typically done outside the script, but included for reference
-- CREATE DATABASE mine_sarthi;

-- Connect to database
-- \c mine_sarthi;

-- Create table for minute aggregates (device-level statistics)
CREATE TABLE IF NOT EXISTS crusher_minute_stats (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp_start INTEGER NOT NULL,
    timestamp_end INTEGER NOT NULL,
    count_readings INTEGER,
    avg_power_kw DECIMAL(10, 2),
    min_power_kw DECIMAL(10, 2),
    max_power_kw DECIMAL(10, 2),
    avg_rpm DECIMAL(10, 1),
    min_rpm INTEGER,
    max_rpm INTEGER,
    avg_feed_rate_tph DECIMAL(10, 2),
    avg_feed_size_mm DECIMAL(10, 1),
    avg_fines_percent DECIMAL(5, 2),
    avg_product_size_mm DECIMAL(10, 2),
    avg_temperature_c DECIMAL(5, 1),
    avg_vibration_mm_s DECIMAL(5, 2),
    energy_per_ton_kwh DECIMAL(10, 3),
    ore_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Compatibility fields for FastAPI (using timestamptz)
    bucket_ts TIMESTAMPTZ,
    avg_power DOUBLE PRECISION,
    avg_rpm_compat DOUBLE PRECISION,
    energy_kwh DOUBLE PRECISION,
    power_draw DOUBLE PRECISION,
    feed_rate DOUBLE PRECISION,
    sample_count INTEGER
);

-- Create index for device and timestamp queries
CREATE INDEX IF NOT EXISTS idx_device_timestamp ON crusher_minute_stats(device_id, timestamp_start);
CREATE INDEX IF NOT EXISTS idx_crusher_minute_stats_device_time ON crusher_minute_stats(device_id, bucket_ts DESC);

-- Create table for raw sensor data (optional, for long-term storage)
CREATE TABLE IF NOT EXISTS crusher_raw_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp INTEGER NOT NULL,
    power_kw DECIMAL(10, 2),
    rpm INTEGER,
    feed_rate_tph DECIMAL(10, 2),
    feed_size_mm DECIMAL(10, 1),
    fines_percent DECIMAL(5, 2),
    product_size_mm DECIMAL(10, 2),
    vibration_mm_s DECIMAL(5, 2),
    temperature_c DECIMAL(5, 1),
    ore_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for device and timestamp queries on raw data
CREATE INDEX IF NOT EXISTS idx_raw_device_timestamp ON crusher_raw_data(device_id, timestamp);

-- Create table for sensor-level minute aggregates (for FastAPI compatibility)
CREATE TABLE IF NOT EXISTS sensor_minute_agg (
    bucket_ts TIMESTAMPTZ,
    sensor_id TEXT,
    metric TEXT,
    count BIGINT,
    sum_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    PRIMARY KEY (bucket_ts, sensor_id, metric)
);

-- Create index for sensor aggregates
CREATE INDEX IF NOT EXISTS idx_sensor_minute_agg_sensor_time ON sensor_minute_agg(sensor_id, bucket_ts DESC);

-- Legacy tables (for backward compatibility)
CREATE TABLE IF NOT EXISTS raw_events (
    id SERIAL PRIMARY KEY,
    sensor_id TEXT,
    metric TEXT,
    value DOUBLE PRECISION,
    ts TIMESTAMPTZ,
    received_at TIMESTAMPTZ DEFAULT now(),
    raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_raw_events_sensor_ts ON raw_events(sensor_id, ts);

CREATE TABLE IF NOT EXISTS sensor_archive (
    id SERIAL PRIMARY KEY,
    received_at TIMESTAMPTZ DEFAULT now(),
    ts TIMESTAMPTZ,
    sensor_id TEXT,
    metric TEXT,
    value DOUBLE PRECISION,
    raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_sensor_archive_sensor_metric_time ON sensor_archive(sensor_id, metric, ts);

-- Grant permissions (if needed)
-- Note: In Docker, postgres user typically has all permissions
-- GRANT ALL PRIVILEGES ON DATABASE mine_sarthi TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
