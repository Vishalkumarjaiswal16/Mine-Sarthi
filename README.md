# 🚜 Mine Sarthi — The Charioteer of Sustainable Mining

<p align="center">
<img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python">
<img src="https://img.shields.io/badge/FastAPI-Powered-009688?logo=fastapi" alt="FastAPI">
<img src="https://img.shields.io/badge/React-Dashboard-61DAFB?logo=react" alt="React">
<img src="https://img.shields.io/badge/AI--Optimization-Integrated-orange" alt="AI">
<img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

> **Mine Sarthi** is a comprehensive, AI-powered industrial IoT ecosystem designed to optimize energy usage in iron ore mining comminution (crushing and grinding) operations. Built for the **Smart India Hackathon (SIH) 2025**, it transforms traditional mining workflows into intelligent, autonomous, and sustainable operations.

<p align="center">
  <img src="images/Screenshot-2026-03-19-181353.jpg" alt="Mine Sarthi AI Monitoring Dashboard" width="800"/>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [AI Models & Predictions](#ai-models--predictions)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Impact & Results](#impact--results)
- [Team Details](#team-details)
- [License](#license)

---

## 🧾 Overview

Iron ore mining is one of the most energy-intensive industries globally. In traditional mines, crushers and mills often run at fixed speeds regardless of the material characteristics, leading to massive energy waste and premature equipment wear. **Mine Sarthi** solves this by:

- **Real-time Monitoring:** Ingesting live sensor telemetry via MQTT for sub-second situational awareness.
- **AI-Driven Classification:** Categorizing ore hardness (Soft/Medium/Hard) using Machine Learning.
- **Autonomous Optimization:** Dynamically adjusting crusher RPM to match the ore type, reducing energy-per-ton.
- **Digital Twin:** Providing a SCADA-grade visualization for process simulation and control.

---

## 🏗️ System Architecture

### 🔄 Architecture Flow

```
IoT Sensors (MQTT) ──▶ Data Bridge (FastAPI) ──▶ Dual-DB Storage (InfluxDB/Postgres)
                               │
                               ▼
                        AI Prediction Engine ◀─── ML Service (Scikit-Learn)
                               │
                               ▼
                        React Dashboard ◀──────── API Layer (Real-time Updates)
```

### Architecture Breakdown

| Component | Technology | Description |
|-----------|------------|-------------|
| **Data Pipeline** | MQTT + FastAPI | Reliable ingestion and routing of live sensor data. |
| **Storage** | InfluxDB & Postgres | Hybrid storage for real-time telemetry and analytical reports. |
| **AI Engine** | Scikit-learn | Dual-model pipeline for hardness classification and RPM optimization. |
| **Frontend** | React + TypeScript | Modern dashboard with Digital Twin and AI monitoring features. |

---

## 🧠 AI Models & Predictions

The core of **Mine Sarthi** consists of two sophisticated models designed to work in tandem for maximum efficiency.

### 1. Ore Hardness Prediction
Categorizes the incoming ore based on power consumption, vibration, and feed rate telemetry.

### 2. Optimal RPM Recommendation
Suggests the most energy-efficient speed for the crusher based on the predicted hardness and feed size.

<p align="center">
  <img src="images/Screenshot-2026-03-19-181419.jpg" alt="Model Prediction Results" width="800"/>
</p>

---

## ✨ Key Features

- 🚦 **Closed-Loop Control** — Autonomous RPM adjustments published back to hardware.
- 📉 **Energy Analytics** — Track energy-per-ton metrics in real-time.
- 👯 **Digital Twin** — 3D/2D visualization of the mining process chain.
- 🔋 **Renewable Integration** — Manage solar generation and battery storage mix.
- 🔒 **Industrial Grade** — Robust error handling and data persistence.

---

## 🧰 Tech Stack

- **Backend:** Python 3.10+, FastAPI, MQTT (Mosquitto)
- **Database:** InfluxDB (Time-series), PostgreSQL (Relational)
- **Machine Learning:** Scikit-learn, Random Forest, Joblib
- **Frontend:** React.js, TypeScript, Tailwind CSS, Shadcn/UI
- **DevOps:** Docker, Docker Compose, Nginx

---

## 📂 Project Structure

```bash
Mine-Sarthi/
├── data pipeline/          # MQTT bridge, Ingestion API & Gateway
├── ml_service/             # AI optimization engine & trained models
├── smart-ore-flow-main/    # React + TypeScript web dashboard
├── images/                 # Documentation assets (Screenshots/Diagrams)
└── docker-compose.yml      # Orchestration for the entire ecosystem
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.10+ (for local development)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vishalkumarjaiswal16/Mine-Sarthi.git
   cd Mine-Sarthi
   ```

2. **Start the ecosystem:**
   ```bash
   docker-compose up --build
   ```

3. **Access the services:**
   - **Dashboard:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000/docs`
   - **ML Service:** `http://localhost:8001/docs`

---

## 📉 Impact & Results

Against traditional mining baselines, **Mine Sarthi** delivers:

- **Energy Consumption:** ↓ 14% reduction
- **Operational Efficiency:** ↑ 8% increase
- **Renewable Energy Mix:** 78% sustainable usage
- **Recovery Rate:** 95.2% Overall Recovery

---

## 👥 Team XEN!TH (SIH 97177)

- **Shivani Sharma** (Team Lead)
- **Vishal Kumar** (AI & Data Pipeline)
- **Aditya Goyal**
- **Akshat Kumar Arya**
- **Himanshi Bishoi**
- **Aditya Naruka**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Made with ❤️ by [Team XEN!TH](https://github.com/Vishalkumarjaiswal16)
