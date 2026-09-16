# ResiliNet: Urban Cascading Failure Simulator & Resilience Planning Platform

> **UN SDG 11: Sustainable Cities and Communities**  
> Problem Statement: *“Cascading Failure: When One Failure Becomes Many”*

ResiliNet is an interactive decision-support prototype engineered to demonstrate that municipal infrastructure must be analyzed as an **interconnected network** rather than isolated assets. When a single arterial road or bridge fails, traffic and dependent loads cascade onto adjacent corridors, triggering secondary disruptions across hospitals, emergency facilities, power grids, and water supplies.

---

## 🚀 Key Features

1. **Interactive Infrastructure Topology Map (Leaflet)**
   - 18 interdependent assets (Bridges, Arterial Roads, Trauma Centers, Community Hospitals, Power Stations, Water Treatment, Emergency Facilities) connected by 25 directed dependencies.
   - Live color-coded status highlighting (Operational, Selected, Failed, Affected, Degraded, Intervention).

2. **Graph-Based Cascade Simulation Engine (NetworkX & FastAPI)**
   - Deterministic propagation algorithm analyzing downstream dependencies, alternate path capacity, bottlenecks, and congestion multipliers.
   - Live impact metrics: Network Resilience Score ($0-100$), Population Affected, Disrupted Assets Count, Average Delay Multiplier, and Estimated Recovery Duration.

3. **Multi-Factor Criticality Breakdown**
   - Evaluates each node across Degree Centrality (35%), Downstream Reachability (25%), Population Served (25%), and Alternative Path Scarcity (15%).
   - Provides clear natural-language explanations for why an asset is a critical single-point-of-failure.

4. **"Why Did It Propagate?" Explainability Panel**
   - Visual flow diagrams charting exact failure paths ($A \to B \to C$).
   - Step-by-step reasoning explaining why secondary failures were triggered (e.g. alternate routes exceeding capacity limits).

5. **Event Timeline ($T+N\text{ min}$)**
   - Chronological event logs detailing propagation milestones and emergency response actions.

6. **What-If Intervention Simulator & AI Recommendations**
   - Simulates 4 intervention strategies:
     - 🔧 **Immediate Repair**: Restore failed asset to operational state.
     - 🔀 **Traffic & Load Rerouting**: Increase capacity on detour corridors by +50%.
     - 🏗️ **Infrastructure Reinforcement**: Double capacity on high-stress roads.
     - 🌐 **Add Emergency Connection**: Construct rapid bypass between key nodes.
   - Side-by-side scenario comparison with Recharts bar chart and detailed delta metrics.
   - Automated recommendation engine highlighting the highest-impact intervention with trade-off justification.

---

## 🛠️ Architecture

```
d:\ResiliNet\
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point, CORS, REST endpoints
│   │   ├── models.py                # Pydantic data schemas
│   │   ├── seed_data.py             # Demo city network (18 assets, 25 dependencies)
│   │   ├── graph_engine.py          # NetworkX graph construction & topological queries
│   │   ├── simulation_engine.py     # Deterministic cascade propagation algorithm
│   │   ├── impact_engine.py         # Impact metrics & multi-factor criticality scoring
│   │   ├── intervention_engine.py   # What-if scenario calculations
│   │   └── recommendation_engine.py # Multi-criteria decision ranking & natural language reasoning
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # React components (TopBar, KPICards, LeftPanel, MapView, RightPanel, etc.)
│   │   ├── hooks/                   # useSimulation state management hook
│   │   ├── api/                     # REST API client
│   │   ├── types/                   # TypeScript interfaces matching backend models
│   │   └── App.css / index.css      # Glassmorphic dark theme design system
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the Backend API
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API will be available at: `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`).

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

---

## 🎯 10-Step Interactive Demo Walkthrough

1. **Open Dashboard**: View the urban infrastructure map, baseline resilience score ($94.8$), and ready status.
2. **Inspect Asset Criticality**: Select `Bridge Alpha` from the left panel. View the breakdown radar explaining why it is critical ($39.9/100$ score, 15,000 population served, primary crossing).
3. **Simulate Failure**: Click the red **⚡ SIMULATE FAILURE** button.
4. **Observe Cascade**:
   - `Bridge Alpha` turns red (Failed).
   - `Road Central` turns orange (Affected/Congested due to spillover).
   - Dependent routes to `Hospital East` experience transit delay.
5. **Review Impact Metrics**:
   - Resilience score drops to **93.2**.
   - Population affected rises to **7,500**.
   - Disrupted assets count updates to **2**.
   - Avg. delay increases to **10.0 min**.
6. **Analyze "Why Did It Propagate?"**: Right panel displays the propagation path (`Bridge Alpha → Road Central`) with explanations of alternative capacity thresholds.
7. **Inspect Timeline**: Switch to the **Timeline** tab to see timestamps ($T+0\text{ min}$, $T+3\text{ min}$) for each cascade event.
8. **Compare Interventions**: Switch to the **Interventions** tab or view the **Scenario Comparison** chart showing comparative resilience scores and affected population numbers.
9. **Apply Intervention**: Select the recommended intervention (**Repair Bridge Alpha** or **Traffic Rerouting**) and click **Apply Intervention**. Observe the map and KPI cards update in real time.
10. **Reset**: Click **↺ Reset Simulation** in the TopBar to restore the network to baseline.

---

## 📜 Disclaimer
*All datasets and graph parameters are SIMULATED for educational and demonstration purposes. No real-world municipal infrastructure is represented.*
