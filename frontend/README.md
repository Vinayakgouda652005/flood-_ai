# Flood Inundation Projection System - Frontend

A React + Vite application for interactive visualization of flood inundation extent, hydro-meteorological river station telemetry, depth risk contours, and AI-driven flood prediction projections.

## Tech Stack
- **React 19**
- **Vite 6**
- **Tailwind CSS v4**
- **Leaflet & React-Leaflet** for geospatial GIS mapping
- **Lucide Icons**
- **Recharts**

## Prerequisites
- Node.js (v18+ recommended)
- npm or bun

## Setup & Running

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your running FastAPI backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend runs by default at `http://localhost:5173`.

5. Build for Production:
   ```bash
   npm run build
   ```
