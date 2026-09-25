# Flood Inundation Projection System — Backend & Database

Production-ready Python FastAPI backend and PostgreSQL database with SQLAlchemy ORM and Pydantic validation for the Flood Inundation Projection System.

---

## 1. System Architecture

```text
React Frontend (Port 5173 / 3000)
       │
       │ HTTP / JSON (VITE_API_BASE_URL=http://localhost:8000)
       ▼
FastAPI Backend (Port 8000)
       │
       ├── CORS Middleware (Cross-Origin Resource Sharing)
       ├── API Routes (/api/predict, /api/locations, /api/forecast, /api/inundation, /api/health)
       ├── Pydantic Schemas (Input/Output data validation & strict YYYY-MM-DD checks)
       ├── Service Layer (prediction_service.py, forecast_service.py, inundation_service.py)
       └── SQLAlchemy ORM Layer
              │
              ▼
PostgreSQL Database (flood_inundation_db)
       ├── locations
       ├── prediction_requests
       ├── predictions
       ├── environmental_data
       └── inundation_results
```

---

## 2. Database Schema & Tables

### Table 1: `locations`
Stores geographical entities and monitored river basin sectors.
- `id` (INTEGER, Primary Key, Autoincrement)
- `name` (VARCHAR(255), Not Null)
- `latitude` (FLOAT, Not Null)
- `longitude` (FLOAT, Not Null)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table 2: `prediction_requests`
Logs user-initiated prediction queries submitted from the frontend or API clients.
- `id` (INTEGER, Primary Key, Autoincrement)
- `location_id` (INTEGER, Foreign Key -> `locations.id` ON DELETE CASCADE, Not Null)
- `prediction_date` (DATE, Not Null)
- `status` (VARCHAR(50), Default: `"WAITING_FOR_AI_MODEL"`)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table 3: `predictions`
Stores evaluation results produced by trained machine learning models (AI model integration pending).
- `id` (INTEGER, Primary Key, Autoincrement)
- `prediction_request_id` (INTEGER, Foreign Key -> `prediction_requests.id` ON DELETE CASCADE, Unique, Not Null)
- `flood_probability` (FLOAT, Nullable)
- `flood_occurred` (INTEGER, Nullable: 0 or 1)
- `risk_level` (VARCHAR(50), Nullable)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

### Table 4: `environmental_data`
Stores verified meteorological, hydrological, and geophysical observations.
**No fake, synthetic, or randomly generated values.**
- `id` (INTEGER, Primary Key, Autoincrement)
- `location_id` (INTEGER, Foreign Key -> `locations.id` ON DELETE CASCADE, Not Null)
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
- **Constraint**: `UniqueConstraint("location_id", "date", name="uq_environmental_location_date")`

### Table 5: `inundation_results`
Stores spatial GIS polygons, flooded areas, and maximum water depths.
- `id` (INTEGER, Primary Key, Autoincrement)
- `prediction_id` (INTEGER, Foreign Key -> `predictions.id` ON DELETE CASCADE, Not Null, Index)
- `geojson` (TEXT, Nullable)
- `maximum_depth` (FLOAT, Nullable)
- `flooded_area_km2` (FLOAT, Nullable)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default: now())

---

## 3. Database Relationships

```text
Location (1)
   │
   ├── (1:N) ──► PredictionRequest (N)
   │                    │
   │                    └── (1:1) ──► Prediction (1)
   │                                     │
   │                                     └── (1:N) ──► InundationResult (N)
   │
   └── (1:N) ──► EnvironmentalData (N)
```

---

## 4. Setup & Execution

### 1. PostgreSQL Database Setup
Create database in PostgreSQL:
```sql
CREATE DATABASE flood_inundation_db;
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set your PostgreSQL credentials in `backend/.env`:
```ini
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flood_inundation_db
```

### 3. Run Backend Server

#### Windows:
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Linux / macOS:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.
OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check & database connectivity verification |
| `GET` | `/api/locations` | Query stored locations from PostgreSQL |
| `POST` | `/api/locations` | Register a new location record |
| `GET` | `/api/forecast` | Query real environmental observations from PostgreSQL |
| `POST` | `/api/forecast` | Store verified environmental features into PostgreSQL |
| `POST` | `/api/predict` | Create and store a prediction request (`WAITING_FOR_AI_MODEL`) |
| `GET` | `/api/predict/history` | List recent prediction requests from database |
| `GET` | `/api/predict/{request_id}` | Retrieve specific prediction request by ID |
| `GET` | `/api/inundation` | Retrieve stored inundation results (strict match only) |
| `POST` | `/api/inundation` | Store inundation results linked to a prediction |

---

## 6. Database Testing Steps & Examples

### Test 1: Health Check
```bash
curl -X GET http://localhost:8000/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "service": "Flood Inundation Projection System API",
  "database": "connected"
}
```

### Test 2: Create Location
```bash
curl -X POST http://localhost:8000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bengaluru, Karnataka",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```
**Expected Response:**
```json
{
  "id": 1,
  "name": "Bengaluru, Karnataka",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "created_at": "2026-09-25T10:00:00Z"
}
```

### Test 3: Retrieve Locations
```bash
curl -X GET http://localhost:8000/api/locations
```

### Test 4: Ingest Real Environmental Data
```bash
curl -X POST http://localhost:8000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 1,
    "date": "2026-09-25",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "rainfall_mm": 120.0,
    "temperature_c": 25.0,
    "humidity_pct": 85.0,
    "river_discharge_m3s": 500.0,
    "water_level_m": 8.2,
    "elevation_m": 900.0,
    "land_cover": "urban",
    "soil_type": "alluvial",
    "population_density": 5000.0,
    "infrastructure": 80,
    "historical_floods": 2
  }'
```

### Test 5: Query Environmental Data
```bash
curl -X GET "http://localhost:8000/api/forecast?location_id=1&date=2026-09-25"
```

### Test 6: Submit Prediction Request (Database Milestone)
```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946,
    "date": "2026-09-25"
  }'
```
**Expected Response:**
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

### Test 7: Query Inundation (Strict Verification)
```bash
curl -X GET "http://localhost:8000/api/inundation?latitude=12.9716&longitude=77.5946&date=2026-09-25"
```
**Expected Response (when no simulation exists):**
```json
{
  "available": false,
  "geojson": null,
  "maximum_depth": null,
  "flooded_area_km2": null
}
```

---

## 7. AI Model Integration Status

**Confirmation:**
AI model integration has **NOT** been performed yet.
- `flood_prediction_model.pkl` is NOT loaded.
- `model.predict()` is NOT invoked.
- Zero synthetic/fake flood probabilities are produced.
- The system is verified for database persistence and CRUD APIs.
- The AI model will be integrated in the next milestone.
