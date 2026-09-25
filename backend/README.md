# Flood Inundation Projection System — Backend & Database

Production-ready Python FastAPI backend and PostgreSQL database with SQLAlchemy ORM and Pydantic validation for the Flood Inundation Projection System.

---

## 1. System Architecture

```
React + Vite Frontend (Port 3000)
       │
       │ HTTP / JSON (VITE_API_BASE_URL=http://localhost:8000)
       ▼
FastAPI Application (Port 8000)
       │
       ├── CORS Middleware (Cross-Origin Resource Sharing)
       ├── API Routes (/api/predict, /api/locations, /api/forecast, /api/inundation, /health)
       ├── Pydantic Schemas (Input/Output data validation)
       ├── Service Layer (Business logic & future AI model hooks)
       └── SQLAlchemy ORM Layer
              │
              ▼
PostgreSQL Database (Tables: locations, prediction_requests, predictions, environmental_data, inundations)
```

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application entry point & CORS configuration
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic Settings & environment variables
│   │   └── database.py             # SQLAlchemy engine, session maker, & Base
│   ├── models/
│   │   ├── __init__.py
│   │   ├── location.py             # locations table model
│   │   ├── prediction_request.py   # prediction_requests table model
│   │   ├── prediction.py           # predictions table model
│   │   ├── environmental_data.py   # environmental_data table model (with UniqueConstraint(location_id, date))
│   │   └── inundation.py           # inundations table model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── location.py             # Location schemas
│   │   ├── prediction.py           # Prediction request & response schemas (strict YYYY-MM-DD validator)
│   │   ├── forecast.py             # Environmental feature schemas
│   │   └── inundation.py           # Inundation geometry schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py               # Health check endpoint
│   │   ├── locations.py            # Location query & registration endpoints
│   │   ├── prediction.py           # Prediction endpoints (POST /api/predict)
│   │   ├── forecast.py             # Environmental observation endpoints (strict date validation)
│   │   └── inundation.py           # Spatial inundation layer endpoints (strict retrieval)
│   └── services/
│       ├── __init__.py
│       ├── model_service.py        # Dedicated AI model loading & inference service
│       ├── prediction_service.py   # Validates features, coordinates location, calls model_service & stores prediction
│       ├── forecast_service.py     # Real environmental observations query & storage
│       └── inundation_service.py   # Strict spatial inundation retrieval by request_id or exact location+date
├── models/
│   ├── README.md                   # Model artifact directory instructions
│   └── flood_prediction_model.pkl  # <-- Trained AI model artifact will be placed here
├── requirements.txt                # Python dependencies
├── .env.example                    # Template environment variables
└── README.md                       # Documentation
```

---

## 3. Database Schema

### Table: `locations`
Stores geographical entities and monitored river basin sectors.
- `id` (INTEGER, Primary Key, Autoincrement)
- `name` (VARCHAR(255), Not Null)
- `latitude` (FLOAT, Not Null)
- `longitude` (FLOAT, Not Null)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table: `prediction_requests`
Logs user-initiated prediction queries submitted from the frontend.
- `id` (INTEGER, Primary Key, Autoincrement)
- `location_id` (INTEGER, Foreign Key -> `locations.id`, Not Null)
- `prediction_date` (DATE, Not Null)
- `status` (VARCHAR(50), Default: `"PENDING_AI_MODEL"`)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table: `predictions`
Stores evaluation results produced by trained machine learning models.
- `id` (INTEGER, Primary Key, Autoincrement)
- `prediction_request_id` (INTEGER, Foreign Key -> `prediction_requests.id`, Unique)
- `flood_probability` (FLOAT, Nullable) — *Nullable until model evaluates*
- `risk_level` (VARCHAR(50), Nullable)
- `flood_occurred` (INTEGER, Nullable: 0 or 1)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table: `environmental_data`
Stores real meteorological, hydrological, and geophysical features.
**No fake values are automatically generated.**
- `id` (INTEGER, Primary Key, Autoincrement)
- `location_id` (INTEGER, Foreign Key -> `locations.id`, Not Null)
- `date` (DATE, Not Null)
- **Constraint**: `UniqueConstraint("location_id", "date", name="uq_environmental_location_date")`
- `latitude` (FLOAT, Not Null)
- `longitude` (FLOAT, Not Null)
- `rainfall_mm` (FLOAT, Nullable)
- `temperature_c` (FLOAT, Nullable)
- `humidity_pct` (FLOAT, Nullable)
- `river_discharge_m3s` (FLOAT, Nullable)
- `water_level_m` (FLOAT, Nullable)
- `elevation_m` (FLOAT, Nullable)
- `land_cover` (VARCHAR(100), Nullable)
- `soil_type` (VARCHAR(100), Nullable)
- `population_density` (FLOAT, Nullable)
- `infrastructure` (VARCHAR(255), Nullable)
- `historical_floods` (INTEGER, Nullable)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table: `inundations`
Stores GIS polygon/extent outputs and flood depths.
- `id` (INTEGER, Primary Key, Autoincrement)
- `prediction_request_id` (INTEGER, Foreign Key -> `prediction_requests.id`, Nullable)
- `horizon_hours` (INTEGER, Default: 24)
- `flooded_area_km2` (FLOAT, Nullable)
- `max_depth_m` (FLOAT, Nullable)
- `avg_depth_m` (FLOAT, Nullable)
- `geojson_data` (TEXT, Nullable)
- `status` (VARCHAR(50), Default: `"PENDING_AI_MODEL"`)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

---

## 4. Setup & Execution

### 1. Create a Python Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` with your PostgreSQL connection string:
```ini
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/flood_db
```
*(Note: If PostgreSQL is not currently running locally, a SQLite fallback `sqlite:///./flood_db.db` is supported for local validation).*

### 4. Run the FastAPI Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The server will start on `http://localhost:8000`.
Interactive OpenAPI docs are available at `http://localhost:8000/docs`.

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` / `/api/health` | System health & PostgreSQL connection check |
| `POST` | `/api/predict` | Primary prediction endpoint (strict YYYY-MM-DD validation) |
| `GET` | `/api/predict/history` | List recent prediction requests |
| `GET` | `/api/predict/{request_id}` | Retrieve specific prediction by ID |
| `POST` | `/api/predict/record` | Ingest ML prediction results |
| `GET` | `/api/locations` | List/search stored locations |
| `POST` | `/api/locations` | Register a new location |
| `GET` | `/api/forecast` | Query verified environmental observations |
| `POST` | `/api/forecast` | Ingest verified environmental features |
| `GET` | `/api/inundation` | Retrieve spatial GIS inundation (strictly by request_id or exact location+date) |
| `POST` | `/api/inundation` | Store GIS simulation results |

---

## 6. Model Artifact Placement & AI Model Integration

### Model File Placement
The trained machine learning model artifact **MUST** be placed directly at:
```
backend/models/flood_prediction_model.pkl
```

### Inference Lifecycle:
1. `backend/app/services/model_service.py` is initialized once and loads `backend/models/flood_prediction_model.pkl`.
2. When a prediction request arrives at `POST /api/predict`, `prediction_service.py`:
   - Validates the target date strictly (HTTP 400 for invalid formats).
   - Looks up or creates the location record in PostgreSQL.
   - Searches `environmental_data` table for the matching `(location_id, date)`.
   - Validates all 13 required features:
     `latitude`, `longitude`, `rainfall_mm`, `temperature_c`, `humidity_pct`, `river_discharge_m3s`, `water_level_m`, `elevation_m`, `land_cover`, `soil_type`, `population_density`, `infrastructure`, `historical_floods`.
   - If features are missing, returns `status: "INCOMPLETE_FEATURES"` or `status: "DATA_UNAVAILABLE"` without generating fake numbers.
   - Calls `model_service.predict(feature_dict)`.
   - Passes the result to `PredictionService.classify_risk()` to determine the risk level (`HIGH`, `MODERATE`, `LOW`).
   - Persists the prediction in `predictions` and marks the request as `COMPLETED`.

