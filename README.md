
# Mine Sarthi — The Charioteer of Sustainable Mining

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Powered-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-Dashboard-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/MQTT-Real--time-660066?logo=mqtt" alt="MQTT">
  <img src="https://img.shields.io/badge/InfluxDB-Timeseries-22ADF6?logo=influxdb" alt="InfluxDB">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

> A comprehensive, **AI-powered industrial IoT ecosystem** designed to optimize energy usage in iron ore mining comminution (crushing and grinding) operations. Built for the **Smart India Hackathon (SIH) 2025** (**PS ID: 25210**), Mine Sarthi transforms traditional mining workflows into intelligent, autonomous, and sustainable operations.

<p align="center">
  <img src="images/Screenshot 2026-03-19 181353.png" alt="Mine Sarthi AI Monitoring Dashboard" width="800"/>
</p>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Overview](#-overview)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [What You Will Learn](#-what-you-will-learn)
- [What You'll Build](#%EF%B8%8F-what-youll-build)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running with Docker](#running-with-docker)
- [AI Models](#-ai-models)
- [Key Features](#-key-features)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Problem Statement

### SIH Problem Statement ID: **25210**

**Problem Statement Title:** Efficient Energy use in Iron Ore Mining Operations

**Theme:** Miscellaneous | **PS Category:** Software | **Team ID:** 97177 | **Team Name:** XEN!TH

---

#### Background

In mining operations, the processes of **crushing and grinding** — collectively known as **comminution** — are essential for liberating valuable minerals from the surrounding rock. However, these processes are among the **most energy-intensive stages** in mineral processing, often accounting for up to **50% of a mine's total energy consumption**. The inefficiencies in these systems not only lead to **elevated operational costs** but also contribute significantly to the **environmental footprint** of mining activities.

#### Description

Traditional crushing and grinding equipment often operate under **suboptimal conditions** due to static control systems, wear and tear, and lack of real-time adaptability. This results in:

- ⚠️ **Excessive energy usage**
- 📉 **Reduced throughput**
- 💰 **Increased maintenance costs**
- 🌍 **Higher carbon emissions**

#### Expected Solutions

**a) AI-Controlled Optimization Systems:**

1. **Real-Time Monitoring & Control:** Implement AI-driven systems that continuously monitor variables such as ore hardness, feed size, moisture content, and equipment load.
2. **Predictive Maintenance:** Use machine learning models to predict wear patterns and schedule maintenance proactively, reducing downtime and energy waste.
3. **Dynamic Process Adjustment:** AI algorithms can adjust operational parameters (e.g., crusher speed, grinding media size, mill rotation speed) in real time to maintain optimal energy efficiency.
4. **Integration with IoT Sensors:** Deploy smart sensors to collect high-resolution data and feed it into AI models for more accurate decision-making.

> **Main Goal:** How we can optimize energy consumption in crushing plant.

---

## 🧾 Overview

**Mine Sarthi** is a full-stack, production-ready platform that addresses the SIH problem statement through:

✅ **Real-Time Monitoring** — IoT sensors continuously collect 9+ operational parameters (power, RPM, feed rate, temperature, vibration, ore hardness, etc.)

✅ **AI-Driven Optimization** — Two machine learning models work sequentially:
- **Model 1:** Ore Hardness Classifier (Random Forest) → Classifies ore into SOFT / MEDIUM / HARD
- **Model 2:** RPM Energy Optimizer → Recommends optimal crusher speed to minimize energy per ton

✅ **Autonomous Control** — MQTT-based closed-loop system adjusts crusher RPM automatically based on AI predictions

✅ **Energy Savings** — Demonstrated **8-15% reduction in energy consumption** vs baseline operations

✅ **Complete Stack** — Data pipeline (MQTT → InfluxDB → PostgreSQL), ML service (FastAPI + Scikit-learn), and modern web dashboard (React)

---

## 🏗️ System Architecture

> *High-level architecture showing the complete data flow — from IoT sensors through MQTT ingestion, real-time AI inference, to autonomous speed control commands.*

### 🔄 Architecture Flow

```
IoT Sensors (Crusher + Mill)
        ↓
[📡 MQTT Publish]
        ↓
mining/crusher_01/metrics
        ↓
[Mosquitto Broker]
        ↓
[consumer.py Bridge]  ← MQTT → HTTP with retry queue
        ↓
[FastAPI Backend]  ← POST /ingest
        ↓
┌────────────────┴────────────────┐
│                                 │
[InfluxDB]                   [PostgreSQL]
crusher_metrics (time-series)   sensor_stats (aggregates)
│                                 │
└────────────────┬────────────────┘
                 ↓
        [ML Service (AI)]
  1. Ore Hardness Classifier (RF)
  2. RPM Energy Optimizer (Regression)
                 ↓
[📡 MQTT Publish]
mining/crusher_01/speed_setpoint
                 ↓
       (Crusher adjusts RPM)
```

### Architecture Breakdown

| Component | Responsibility | Technology |
|:---|:---|:---|
| **IoT Layer** | Real-time sensor data generation and publishing | MQTT, Mosquitto |
| **Ingestion Bridge** | Resilient MQTT-to-HTTP relay with buffering | Python, Paho-MQTT, Deque |
| **Data Backend** | High-frequency ingestion, normalization, and API hosting | FastAPI, Pydantic |
| **Storage (RT)** | High-resolution time-series data storage | InfluxDB 1.8 |
| **Storage (Agg)** | Long-term minute aggregates and KPI storage | PostgreSQL 15 |
| **ML Engine** | Sequential AI pipeline for classification and optimization | Scikit-learn, FastAPI |
| **Control Loop** | Autonomous MQTT command publishing back to edge | MQTT, Mosquitto |
| **Frontend UI** | Real-time monitoring dashboard and digital twin | React, Tailwind CSS |

---

## 🎓 What You Will Learn

- ✅ Architecting **Industrial IoT (IIoT)** pipelines for high-frequency data
- ✅ Implementing **sequential AI workflows** (Classification → Regression)
- ✅ Building **production-grade bridges** between different protocols (MQTT & HTTP)
- ✅ Working with **hybrid database strategies** (Time-series + Relational)
- ✅ Creating **autonomous closed-loop systems** for industrial automation
- ✅ Developing **Digital Twins** for process visualization and simulation
- ✅ Optimizing **energy efficiency** in heavy industrial processes using ML

---

## 🛠️ What You'll Build

- A live **Energy Optimization Platform** for mining operations
- A **bidirectional data pipeline** handling thousands of metrics per second
- An **AI-powered speed control service** that operates autonomously
- A **React-based command center** with real-time analytics and alerts
- A **Dockerized microservices architecture** ready for cloud deployment

---

## 🧰 Tech Stack

| Category | Technology |
|:---|:---|
| **Backend** | Python 3.10+, FastAPI |
| **Machine Learning** | Scikit-learn, Random Forest, Regression, Pickle |
| **IIoT / Messaging** | MQTT, Mosquitto, Paho-MQTT |
| **Databases** | InfluxDB (Time-series), PostgreSQL (Relational) |
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons |
| **DevOps** | Docker, Docker Compose |
| **Others** | Pydantic, Dotenv, Requests, Asyncio |

---

## 📁 Project Structure

```bash
Mine-Sarthi/
├── data pipeline/              # Core ingestion & infrastructure
│   ├── backend/                # FastAPI ingestion server
│   ├── bridge/                 # MQTT -> HTTP bridge logic (resilient)
│   ├── gateway/                # Edge gateway configuration
│   ├── mqtt_broker/            # Mosquitto configuration
│   └── docker-compose.yml      # Orchestration script
├── ml_service/                 # AI Engine (Inference & Control)
│   ├── api/                    # Prediction & control endpoints
│   ├── models/                 # Trained .pkl models (Model 1 & 2)
│   └── src/                    # Business logic & control loops
├── smart-ore-flow-main/        # Frontend React Application
├── images/                     # Project documentation images
└── README.md                   # You are here
```

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Python 3.10 or higher
- Node.js (for frontend development)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Vishalkumarjaiswal16/Mine-Sarthi.git
cd Mine-Sarthi
```

2. **Set up Environment Variables**

Create a `.env` file in the `data pipeline/` directory based on the template.

### Running with Docker

The easiest way to run the full stack is using Docker Compose:

```bash
cd "data pipeline"
docker-compose up --build
```

This will start:
- Mosquitto Broker (1883)
- InfluxDB (8086)
- PostgreSQL (5432)
- FastAPI Backend (8000)
- ML Service (8001)

---

## 🤖 AI Models

### Model 1: Ore Hardness Classifier

- **Algorithm:** Random Forest Classifier
- **Inputs:** Power, RPM, Feed Rate, Feed Size, Vibration, Temperature, Current
- **Output:** Ore class (SOFT, MEDIUM, HARD) with confidence %
- **Purpose:** Identifies material characteristics in real-time to set optimization constraints.

### Model 2: RPM Energy Optimizer

- **Algorithm:** Regression-based optimization
- **Inputs:** Output of Model 1 + Live operational data
- **Output:** Optimal RPM setpoint
- **Purpose:** Minimizes `kWh/ton` processed by matching machine speed to ore hardness.

---

## ✨ Key Features

- ⚡ **Real-time Speed Control** — Autonomous adjustment of crusher RPM via AI.
- 🔄 **Digital Twin** — Visual process flow simulation for operational planning.
- 📊 **Energy Usage Analytics** — Granular breakdown of consumption by equipment.
- ☀️ **Renewable Integration** — Dashboard for solar and battery storage management.
- ⚠️ **Smart Alerting** — Threshold-based notifications for machine health.
- 🛡️ **Safety Interlocks** — Logic-based overrides to prevent unsafe machine states.

---

## 🤝 Contributing

We welcome contributions to make mining more sustainable!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team — @XEN!TH

- **Vishal Kumar** — Lead Developer 
- **Shivani Sharma** — Team Lead
- **Aditya Goyal**
- **Akshat Kumar Arya**
- **Himanshi Bishoi**
- **Aditya Naruka**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ for **Smart India Hackathon 2025**
