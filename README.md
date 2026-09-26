# Flood Inundation Projection System

A complete hydrological forecasting and spatial flood inundation projection platform. The system integrates river basin sensor monitoring, geospatial GIS inundation depth contours, and machine learning prediction models to project flood risk levels and inundated areas corresponding to forecasted river stages and precipitation levels.

---

## Project Structure

```text
flood-inundation-projection-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # GIS Map, Horizon Slider, Flood Risk Panel, Station Telemetry
│   │   ├── pages/            # Dashboard, Inundation GIS Map, Historical Forecasts, Model Predictions
│   │   ├── services/         # API client layer (floodService.js -> POST /api/predict)
│   │   ├── data/             # Hydro-spatial presets and mock basin contours
│   │   ├── App.jsx           # Top-level application router & state
│   │   ├── main.jsx          # React DOM entry point
│   │   └── index.css         # Tailwind CSS & Leaflet mapping styles
│   ├── public/               # Static assets & icons
│   ├── package.json          # Frontend scripts & dependencies
│   ├── vite.config.js        # Vite build & development configuration
│   ├── index.html            # Single Page Application HTML shell
│   ├── .env                  # Frontend environment configuration (VITE_API_BASE_URL)
│   ├── .env.example          # Frontend environment template
│   └── README.md             # Frontend documentation & quickstart
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI application entry point & CORS middleware
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py     # Pydantic Settings & environment variables
│   │   │   └── database.py   # SQLAlchemy session manager & PostgreSQL connection
│   │   ├── models/           # SQLAlchemy database models (locations, predictions, environmental_data, etc.)
│   │   ├── schemas/          # Pydantic validation schemas (strict YYYY-MM-DD validation)
│   │   ├── routes/           # REST endpoints (/api/predict, /api/forecast, /api/inundation, /api/locations)
│   │   └── services/         # Business logic & model integration (model_service.py, prediction_service.py)
│   ├── models/
│   │   └── flood_prediction_model.pkl  # Trained AI model artifact placement directory
│   ├── requirements.txt      # Python dependencies (FastAPI, SQLAlchemy, Scikit-learn, etc.)
│   ├── .env                  # Backend environment configuration (DATABASE_URL)
│   ├── .env.example          # Backend environment template
│   └── README.md             # Backend documentation & API schema
│
├── README.md                 # System overview & execution guide
└── .gitignore                # Git ignore rules
```

---

## Local Setup & Quickstart Guide

Follow these steps to run the application locally on your machine in VS Code.

### Step 1: PostgreSQL Database Creation
Ensure PostgreSQL is installed and running on your system (default port 5432). Create the database in `psql` or pgAdmin:

```sql
CREATE DATABASE flood_inundation_db;
```

### Step 2: Backend .env Configuration
Navigate to the `backend` folder and verify or edit `backend/.env`:

```env
# backend/.env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

# Replace YOUR_PASSWORD with your actual local PostgreSQL password
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flood_inundation_db
```

### Step 3: Backend Installation
Create a Python virtual environment and install the required dependencies:

```bash
cd backend
```

**Windows (PowerShell / Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 4: Backend Startup
Launch the FastAPI server with live reload:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`. Database tables (`locations`, `prediction_requests`, `predictions`, `environmental_data`, `inundation_results`) are automatically created in PostgreSQL on startup.

### Step 5: Frontend Installation
In a separate terminal, navigate to the `frontend` directory and install npm packages:

```bash
cd frontend
npm install
```

Verify that `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 6: Frontend Startup
Start the Vite development server:

```bash
npm run dev
```

The frontend will run at `http://localhost:5173` (or port 3000 if configured).

### Step 7: API Health Check
Verify that the FastAPI backend and PostgreSQL connection are running and healthy by visiting `http://localhost:8000/api/health` in your browser or executing:

```bash
curl http://localhost:8000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "Flood Inundation Projection System API",
  "database": "connected"
}
```


---

## API Contract

### Primary Prediction Endpoint: `POST /api/predict`

**Request:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "date": "2026-09-25"
}
```

**Database-Backed Milestone Response:**
```json
{
  "status": "WAITING_FOR_AI_MODEL",
  "prediction_request_id": 1,
  "location": {
    "name": "Bengaluru, Karnataka",
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "date": "2026-09-25"
}
```

- **Strict Date Validation:** Returns HTTP 400 Bad Request for any invalid date format.
- **Truthful Data Handling:** Returns status `WAITING_FOR_AI_MODEL` without fabricating synthetic probabilities or calling unverified models.

---

## AI Model Integration Status

**Confirmation:**
AI model integration has **NOT** been performed yet.
- `flood_prediction_model.pkl` is NOT loaded.
- `model.predict()` is NOT called.
- No fake flood probabilities or synthetic environmental data are generated.
- This milestone verifies the PostgreSQL database, SQLAlchemy models, and CRUD API endpoints.
- The trained AI model will be integrated in the subsequent milestone.

---

## AI Model Integration Point

The trained machine learning model artifact must be placed at:
```
backend/models/flood_prediction_model.pkl
```

The dedicated model service (`backend/app/services/model_service.py`) automatically loads the model artifact from this location upon startup or inference request and passes the 13 verified hydro-meteorological features for prediction.
