# 🚜 Mine Sarthi — The Charioteer of Sustainable Mining

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI Powered](https://img.shields.io/badge/FastAPI-Powered-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React Dashboard](https://img.shields.io/badge/React-Dashboard-61DAFB?logo=react)](https://reactjs.org/)
[![AI-Powered](https://img.shields.io/badge/AI--Optimization-Integrated-orange)](https://scikit-learn.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Mine Sarthi** is a comprehensive, AI-powered industrial IoT ecosystem designed to optimize energy usage in iron ore mining comminution (crushing and grinding) operations. Built for the **Smart India Hackathon (SIH) 2025**, it transforms traditional mining workflows into intelligent, autonomous, and sustainable operations.

---

## 📖 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Data Pipeline Flow](#data-pipeline-flow)
- [ML Intelligence Layer](#ml-intelligence-layer)
- [Impact & Results](#impact--results)
- [Team Details](#team-details)

---

## 🌟 Overview
Iron ore mining is one of the most energy-intensive industries globally. In traditional mines, crushers and mills often run at fixed speeds regardless of the material characteristics, leading to massive energy waste and premature equipment wear.

**Mine Sarthi** solves this by:
1. **Real-time Monitoring:** Ingesting live sensor telemetry via MQTT.
2. **AI-Driven Classification:** Categorizing ore hardness (Soft/Medium/Hard) using Machine Learning.
3. **Autonomous Optimization:** Dynamically adjusting crusher RPM to match the ore type, reducing energy-per-ton.
4. **Digital Twin:** Providing a SCADA-grade visualization for process simulation and control.

---

## 🏗️ System Architecture

### 📊 Architecture Breakdown
The system is built on a distributed microservices architecture:
- **IoT Edge:** Simulated sensors publishing multi-dimensional telemetry (Power, RPM, Vibration, etc.) via MQTT.
- **Data Pipeline:** A resilient relay bridge (MQTT → FastAPI) with dual-write storage (InfluxDB for real-time, Postgres for aggregates).
- **ML Engine:** A dedicated service running a sequential inference pipeline (Classification → Optimization).
- **Frontend Dashboard:** A modern React + TypeScript application providing real-time situational awareness and control.

---

## 🚀 Key Features
- **Closed-Loop Control:** Autonomous RPM adjustment commands published back to hardware via MQTT.
- **Dual-Model AI:** 
  - **Model 1:** Random Forest classifier for Ore Hardness detection.
  - **Model 2:** Energy Optimizer for precise RPM recommendation.
- **Digital Twin:** Full-process visualization of the iron ore processing chain.
- **Renewable Integration:** Tracking solar generation and battery storage for a sustainable energy mix.
- **Real-time Analytics:** Sub-second latency for live sensor updates and efficiency tracking.

---

## 🛠️ Tech Stack

### Backend & Pipeline
- **Language:** Python 3.10+
- **API Framework:** FastAPI (Asynchronous)
- **Message Broker:** Mosquitto MQTT
- **Databases:** 
  - **InfluxDB:** Time-series storage for sub-second telemetry.
  - **PostgreSQL:** Relational storage for 1-minute aggregates and reports.

### Machine Learning
- **Library:** Scikit-learn
- **Algorithms:** Random Forest (Classification & Regression)
- **Serialization:** Joblib/Pickle

### Frontend
- **Framework:** React.js + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Maps:** Leaflet.js

### DevOps
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx
- **CI/CD:** GitHub Actions

---

## 📂 Project Structure

```bash
Mine-Sarthi/
├── data pipeline/         # Ingestion, storage, and MQTT bridge
│   ├── backend/           # FastAPI ingestion & dual-DB logic
│   ├── bridge/            # MQTT subscriber to HTTP relay
│   └── gateway/           # IoT sensor simulator
├── ml_service/            # AI optimization engine
│   ├── api/               # REST endpoints for predictions
│   ├── models/            # Trained .pkl model artifacts
│   └── src/               # Core ML logic & control loops
└── smart-ore-flow-main/   # React + TypeScript web dashboard
```

---

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.10 (if running locally)
- Node.js & Bun/NPM (for frontend development)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Vishalkumarjaiswal16/Mine-Sarthi.git
   cd Mine-Sarthi
   ```

2. Start the entire ecosystem using Docker:
   ```bash
   docker-compose up --build
   ```

3. Access the services:
   - **Dashboard:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000/docs`
   - **ML Service:** `http://localhost:8001/docs`

---

## 📉 Impact & Results
Against traditional mining baselines, Mine Sarthi delivers:
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
