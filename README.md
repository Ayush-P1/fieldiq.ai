# FieldIQ – The AI Cricket Captain

> **Tagline:** *Think Like a Captain. Set the Perfect Field.*

FieldIQ is an AI-powered cricket field placement simulator that allows cricket fans and tacticians to experience what it feels like to set a tactical field as a captain.

The user receives a simulated cricket match situation, positions fielders on an interactive vector SVG cricket ground, and submits their field placement for evaluation. The deterministic mathematical engine evaluates field coverage, boundary protection, exposed scoring zones, and batter tendencies. The AI Captain then provides tactical feedback, recommends adjustments, compares decisions with its own optimized field, and engages in contextual chat.

---

## 🌟 Key Features

1. **Interactive SVG Cricket Ground:**
   - Proportional cricket stadium with boundary rope, inner 30-yard fielding circle, pitch, batting/bowling creases, and wickets.
   - 9 user-controllable draggable fielders with coordinate bounds clamping and overlap collision avoidance.
   - Distinct markers for bowler and wicketkeeper, plus ghost outlines for AI-recommended fielders.
   - Real-time position name resolution (e.g. Deep Mid-Wicket, Long-On, Point, Slip).

2. **Deterministic Field Evaluation Engine:**
   - Evaluates overall tactical score (0–100), leg-side coverage, off-side coverage, boundary protection, and inner-circle coverage.
   - Gaussian distance-decay coverage models weighted against scenario-specific shot zone distributions.
   - Dynamic identification of the top 3 exposed scoring zones.
   - Live interactive score recalculation as fielders are dragged on the ground.

3. **Field Coverage Heatmap:**
   - Visual overlay directly on the SVG ground depicting well-protected (green) vs exposed (red/amber) scoring regions with toggle controls.

4. **Multi-Scenario Match Contexts (Simulations):**
   - **Scenario 1: Death-over Attack** (T20, Right-handed aggressive batter vs Right-arm fast, heavy leg-side boundary threat).
   - **Scenario 2: Spin Pressure** (Test, Left-handed batter vs Leg-spin, sweep specialists, slip & silly point wicket-taking opportunities).
   - **Scenario 3: Powerplay Defence** (ODI, 2-fielders-out restrictions, cover drive specialist).

5. **AI Captain & Dual Reasoning Modes:**
   - **LLM Mode (Google Gemini API via `gemini-3.8-flash`):** Contextual tactical explanation, breakdown of strengths, vulnerabilities, and recommended adjustments grounded directly in calculated metrics.
   - **Local Deterministic Fallback Mode:** Robust rule-based reasoning engine that functions completely offline without any API keys.

6. **Field Battle (You vs AI):**
   - Side-by-side metric comparison and delta analysis between the user's field and the AI's optimized placement.
   - "Apply AI Field" to copy AI coordinates to the interactive canvas and "Restore My Field" to revert.

7. **What-If Simulator:**
   - Tracks improvements and regressions point-by-point in real time as the user experiments with fielder adjustments.

8. **"Ask the Captain" Contextual Chat:**
   - Interactive tactical chat assistant aware of current fielder positions, match scenario, and evaluation scores.

---

## 🏗️ Architecture

```
fieldiq/
│
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # CricketGround, MatchScenarioPanel, FieldAnalysis,
│   │   │                     # AIRecommendation, FieldComparison, WhatIfSimulator,
│   │   │                     # CaptainChat, FieldControls
│   │   ├── data/             # Scenarios & shot zone definitions
│   │   ├── services/         # API client & local fallback engine
│   │   ├── types/            # TypeScript schemas
│   │   ├── utils/            # Evaluation math & coordinate geometry
│   │   ├── App.tsx           # Main application state orchestration
│   │   └── main.tsx
│   └── vite.config.ts
│
├── backend/                  # FastAPI + Pydantic + Google GenAI SDK
│   ├── app/
│   │   ├── ai/               # Gemini prompt orchestration & fallback logic
│   │   ├── engines/          # Spatial field evaluation & scenario database
│   │   ├── schemas/          # Pydantic request & response models
│   │   └── main.py           # FastAPI endpoints
│   ├── .env.example
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Backend Setup
```bash
cd backend
python3 -m pip install -r requirements.txt   # or: pip install fastapi uvicorn pydantic python-dotenv httpx google-genai

# (Optional) Add your Gemini API key for live LLM reasoning:
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# Run the backend server
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` (Healthcheck: `http://localhost:8000/health`).

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Evaluation Algorithm Explanation

The field evaluation engine is 100% deterministic:
1. **Coordinate System:** Field and fielder positions exist within a standardized coordinate space $(X, Y)$ where $(250, 250)$ is the pitch center, $R=215$ is the boundary, and $R=108$ is the 30-yard inner circle.
2. **Shot Zones:** Each scenario defines primary scoring zones with associated empirical probabilities $P_z$.
3. **Proximity & Depth Decay:** For each zone $z$ and nearest fielder $f$, distance $D = \|(X_f, Y_f) - (X_z, Y_z)\|$ is computed. Coverage factor is modeled with a Gaussian decay:
   $$C_z = \exp\left(-\frac{D^2}{2 \sigma^2}\right)$$
   Where $\sigma$ depends on whether the zone is on the boundary or inner ring. Fielders in the wrong depth (e.g. an inner ring fielder trying to cover a boundary zone) receive a penalty discount factor.
4. **Weighted Aggregate Score:**
   $$\text{Score} = \frac{\sum (C_z \times P_z)}{\sum P_z} \times 100$$
5. **Categorical Breakdowns:** Leg-side vs off-side and boundary vs inner-circle are aggregated across subsets of shot zones to compute specific tactical sub-scores.

---

## 📋 Simulated Data Notice & Limitations
- All match scenarios, player names, tendencies, and shot probabilities are **simulations created for tactical demonstration**.
- The model does not simulate 3D ball trajectory physics or aerodynamic ball swing.
- Real-time cricket APIs and production user authentication are deliberately omitted as per design guidelines.

