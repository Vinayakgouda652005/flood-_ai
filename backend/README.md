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
│   │   ├── environmental_data.py   # environmental_data table model
│   │   └── inundation.py           # inundations table model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── location.py             # Location schemas
│   │   ├── prediction.py           # Prediction request & response schemas
│   │   ├── forecast.py             # Environmental feature schemas
│   │   └── inundation.py           # Inundation geometry schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py               # Health check endpoint
│   │   ├── locations.py            # Location query & registration endpoints
│   │   ├── prediction.py           # Prediction endpoints (POST /api/predict)
│   │   ├── forecast.py             # Environmental observation endpoints
│   │   └── inundation.py           # Spatial inundation layer endpoints
│   └── services/
│       ├── __init__.py
│       ├── prediction_service.py   # Prediction request processing & AI model hook
│       ├── forecast_service.py     # Environmental observation query service
│       └── inundation_service.py   # Inundation spatial data service
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
| `POST` | `/api/predict` | Primary prediction endpoint called by frontend |
| `GET` | `/api/predict/history` | List recent prediction requests |
| `GET` | `/api/predict/{request_id}` | Retrieve specific prediction by ID |
| `POST` | `/api/predict/record` | Ingest ML prediction results |
| `GET` | `/api/locations` | List/search stored locations |
| `POST` | `/api/locations` | Register a new location |
| `GET` | `/api/forecast` | Query verified environmental observations |
| `POST` | `/api/forecast` | Ingest verified environmental features |
| `GET` | `/api/inundation` | Retrieve spatial GIS inundation polygons |
| `POST` | `/api/inundation` | Store GIS simulation results |

---

## 6. Integrating the Future Trained AI Model

The application is structured so that the AI model will be integrated without changing the API contract or the React frontend.

In `backend/app/services/prediction_service.py`:
1. Save the serialized model artifact (`model.joblib` or `model.onnx`) into a models directory.
2. In `process_prediction_request`:
   - Query features from the `environmental_data` table for `location.id` and `pred_date`.
   - Run inference: `prob = model.predict_proba([features])[0][1]`.
   - Derive civil defense risk level:
     - `prob >= 0.75` -> `"HIGH"`
     - `prob >= 0.40` -> `"MODERATE"`
     - `prob < 0.40` -> `"LOW"`
   - Save record to `predictions` table and mark `prediction_request.status = "COMPLETED"`.
