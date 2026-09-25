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

## Running the Application

The frontend and backend run as independent services.

### 1. Backend (FastAPI + PostgreSQL)

```bash
cd backend
```

#### Windows:
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **Backend API URL:** `http://localhost:8000`
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`
- **Database Configuration:** Configure `DATABASE_URL` in `backend/.env` (e.g. `postgresql://postgres:password@localhost:5432/flood_inundation_db`).

---

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- **Frontend Application URL:** `http://localhost:5173`
- **Backend API Base URL:** Configured in `frontend/.env` via `VITE_API_BASE_URL=http://localhost:8000`.

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
