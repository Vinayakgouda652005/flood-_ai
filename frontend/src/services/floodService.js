/**
 * Flood Service Layer (API Client)
 *
 * Configured for real FastAPI backend communication via configurable VITE_API_BASE_URL.
 * Integrates location-driven and date-driven flood prediction models.
 */

import {
  BASIN_LOCATIONS,
  CURRENT_SUMMARY,
  FORECAST_TIMELINE,
  HYDRO_STATIONS,
  AFFECTED_LOCATIONS,
  INUNDATION_POLYGONS,
  RIVER_CENTERLINE,
  SETTLEMENT_MARKERS,
  ROAD_SEGMENTS,
  INITIAL_PREDICTION_RESULT,
} from '../data/mockData.js';

// Base API URL configured from environment, defaulting to http://localhost:8000
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '');

// Curated list of monitored flood-risk districts and river basin cities
export const PRESET_LOCATIONS = [
  { name: 'Bengaluru, Karnataka', latitude: 12.9716, longitude: 77.5946, region: 'South' },
  { name: 'Vijayawada, Krishna Basin, Andhra Pradesh', latitude: 16.5062, longitude: 80.648, region: 'East Coast' },
  { name: 'Patna, Ganga Basin, Bihar', latitude: 25.5941, longitude: 85.1376, region: 'Ganges Plains' },
  { name: 'Guwahati, Brahmaputra Basin, Assam', latitude: 26.1445, longitude: 91.7362, region: 'North East' },
  { name: 'Cuttack, Mahanadi Delta, Odisha', latitude: 20.4625, longitude: 85.883, region: 'East Coast' },
  { name: 'Varanasi, Middle Ganga, Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, region: 'Ganges Plains' },
  { name: 'Mumbai, Mithi Basin, Maharashtra', latitude: 19.076, longitude: 72.8777, region: 'West Coast' },
  { name: 'Chennai, Adyar & Cooum Basins, Tamil Nadu', latitude: 13.0827, longitude: 80.2707, region: 'South' },
  { name: 'Kolkata, Hooghly Basin, West Bengal', latitude: 22.5726, longitude: 88.3639, region: 'East' },
  { name: 'Delhi, Yamuna Floodplain, NCR', latitude: 28.6139, longitude: 77.209, region: 'North' },
  { name: 'Srinagar, Jhelum Basin, Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973, region: 'North' },
  { name: 'Surat, Tapi Basin, Gujarat', latitude: 21.1702, longitude: 72.8311, region: 'West' },
  { name: 'Kochi, Periyar Basin, Kerala', latitude: 9.9312, longitude: 76.2673, region: 'South' },
  { name: 'Hyderabad, Musi Basin, Telangana', latitude: 17.385, longitude: 78.4867, region: 'South' },
  { name: 'Pune, Mula-Mutha Basin, Maharashtra', latitude: 18.5204, longitude: 73.8567, region: 'West' },
  { name: 'Ahmedabad, Sabarmati Basin, Gujarat', latitude: 23.0225, longitude: 72.5714, region: 'West' },
];

export const floodService = {
  /**
   * Primary User-Driven Prediction API
   * Calls FastAPI backend: POST /api/predict
   *
   * Request format:
   * {
   *   "latitude": 12.9716,
   *   "longitude": 77.5946,
   *   "date": "2026-09-25"
   * }
   *
   * Expected response format:
   * {
   *   "latitude": 12.9716,
   *   "longitude": 77.5946,
   *   "date": "2026-09-25",
   *   "flood_probability": 0.82,
   *   "risk_level": "HIGH",
   *   "flood_occurred": 1,
   *   "inundation": {
   *     "available": true,
   *     "geojson": {}
   *   }
   * }
   */
  async predictFlood({ latitude, longitude, date, name }) {
    if (latitude === undefined || latitude === null || isNaN(Number(latitude))) {
      throw new Error('Valid latitude is required for prediction.');
    }
    if (longitude === undefined || longitude === null || isNaN(Number(longitude))) {
      throw new Error('Valid longitude is required for prediction.');
    }
    if (!date) {
      throw new Error('Valid prediction date is required.');
    }

    const payload = {
      latitude: Number(Number(latitude).toFixed(6)),
      longitude: Number(Number(longitude).toFixed(6)),
      date: String(date),
    };
    if (name) {
      payload.location_name = String(name);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          throw new Error('Prediction service is currently unavailable.');
        }
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || 'Prediction service is currently unavailable.');
      }

      const data = await response.json();

      // Normalize response according to specification
      const floodProb =
        typeof data.flood_probability === 'number'
          ? data.flood_probability
          : typeof data.floodProbability === 'number'
          ? data.floodProbability
          : null;

      const riskLevel = (
        data.risk_level ||
        data.riskLevel ||
        (floodProb !== null
          ? (floodProb >= 0.75
              ? 'HIGH'
              : floodProb >= 0.4
              ? 'MODERATE'
              : 'LOW')
          : 'PENDING')
      ).toUpperCase();

      const floodOccurred =
        data.flood_occurred !== undefined && data.flood_occurred !== null
          ? Number(data.flood_occurred)
          : floodProb !== null
          ? (floodProb >= 0.5 ? 1 : 0)
          : null;

      const resolvedLocationName =
        (data.location && data.location.name) ||
        data.location_name ||
        name ||
        '';

      return {
        latitude: (data.location && data.location.latitude) || payload.latitude,
        longitude: (data.location && data.location.longitude) || payload.longitude,
        locationName: resolvedLocationName,
        date: data.date || payload.date,
        flood_probability: floodProb,
        risk_level: riskLevel,
        flood_occurred: floodOccurred,
        status: data.status || 'WAITING_FOR_AI_MODEL',
        message: data.message || '',
        request_id: data.prediction_request_id || data.request_id || null,
        inundation: data.inundation || {
          available: false,
          geojson: null,
        },
        raw: data,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Prediction request timed out. Prediction service is currently unavailable.');
      }
      // If error is network refusal or CORS or server offline
      throw new Error('Prediction service is currently unavailable.');
    }
  },

  /**
   * Fetch registered locations from PostgreSQL
   * GET /api/locations?query=...
   */
  async getLocations(query = '') {
    try {
      const url = query
        ? `${API_BASE_URL}/api/locations?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/locations`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running
    }
    return null;
  },

  /**
   * Register a new location in PostgreSQL
   * POST /api/locations
   */
  async createLocation({ name, latitude, longitude }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, latitude, longitude }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running
    }
    return null;
  },

  /**
   * Ingest environmental data into PostgreSQL
   * POST /api/forecast
   */
  async saveForecast(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running
    }
    return null;
  },

  /**
   * Future Backend Forecast API endpoint
   * GET /api/forecast?latitude=...&longitude=...&date=...
   */
  async getForecast({ latitude, longitude, date }) {
    try {
      const query = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        date: String(date),
      });
      const response = await fetch(`${API_BASE_URL}/api/forecast?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running yet
    }
    return null;
  },

  /**
   * Future Backend Inundation Layer API endpoint
   * GET /api/inundation?latitude=...&longitude=...&date=...
   */
  async getInundation({ latitude, longitude, date }) {
    try {
      const query = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        date: String(date),
      });
      const response = await fetch(`${API_BASE_URL}/api/inundation?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running yet
    }
    return null;
  },

  /**
   * Reverse Geocode coordinates to human-readable address/city
   * Uses OpenStreetMap Nominatim with graceful fallback
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const primaryName =
            addr.city ||
            addr.town ||
            addr.suburb ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            addr.state;
          const secondary = addr.state || addr.country;
          if (primaryName && secondary) {
            return `${primaryName}, ${secondary}`;
          }
          return data.display_name.split(',').slice(0, 3).join(',').trim();
        }
      }
    } catch {
      // Network or rate-limit fallback
    }

    // Nearest preset location fallback if close
    const closest = PRESET_LOCATIONS.find((loc) => {
      const dLat = Math.abs(loc.latitude - latitude);
      const dLon = Math.abs(loc.longitude - longitude);
      return dLat < 0.25 && dLon < 0.25;
    });

    if (closest) {
      return closest.name;
    }

    return `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  },

  /**
   * Search locations (presets first, then Nominatim)
   */
  async searchLocations(query) {
    if (!query || query.trim().length < 2) {
      return PRESET_LOCATIONS;
    }
    const qLower = query.toLowerCase().trim();
    const matchedPresets = PRESET_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(qLower) ||
        (loc.region && loc.region.toLowerCase().includes(qLower))
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=6&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const externalResults = await res.json();
        const formatted = externalResults.map((item) => ({
          name: item.display_name.split(',').slice(0, 3).join(',').trim(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          region: item.type || 'Location',
        }));

        // Combine deduplicated results
        const existingNames = new Set(matchedPresets.map((p) => p.name));
        for (const item of formatted) {
          if (!existingNames.has(item.name)) {
            matchedPresets.push(item);
            existingNames.add(item.name);
          }
        }
      }
    } catch {
      // Continue with matched presets
    }

    return matchedPresets;
  },

  // =========================================================================
  // Existing Supporting Methods for Dashboard, Basins, Timeline, GIS & Charts
  // =========================================================================

  /**
   * Get list of monitored river basins/reaches
   */
  async getBasins() {
    await new Promise((r) => setTimeout(r, 60));
    return BASIN_LOCATIONS;
  },

  /**
   * Get current summary for dashboard cards
   */
  async getDashboardSummary(basinId = 'basin-krishna-lower') {
    await new Promise((r) => setTimeout(r, 60));
    const basin = BASIN_LOCATIONS.find((b) => b.id === basinId) || BASIN_LOCATIONS[0];
    return {
      ...CURRENT_SUMMARY,
      locationName: basin.name,
      referenceRiver: basin.riverName,
    };
  },

  /**
   * Get forecast timeline points (River level, rainfall, area, depth over +1h..+24h)
   */
  async getForecastTimeline(basinId = 'basin-krishna-lower') {
    await new Promise((r) => setTimeout(r, 60));
    return FORECAST_TIMELINE;
  },

  /**
   * Get hydrological gauging stations
   */
  async getHydrologicalStations(basinId = 'basin-krishna-lower') {
    await new Promise((r) => setTimeout(r, 60));
    return HYDRO_STATIONS;
  },

  /**
   * Get affected settlements and infrastructure list
   */
  async getAffectedLocations(basinId = 'basin-krishna-lower') {
    await new Promise((r) => setTimeout(r, 60));
    return AFFECTED_LOCATIONS;
  },

  /**
   * Get GIS geospatial layers for a specific forecast horizon (1, 3, 6, 12, 24)
   */
  async getInundationLayers(horizonHours = 24) {
    await new Promise((r) => setTimeout(r, 50));
    const validHorizon = [1, 3, 6, 12, 24].includes(horizonHours) ? horizonHours : 24;
    return {
      horizon: validHorizon,
      riverCenterline: RIVER_CENTERLINE,
      inundationPolygons: INUNDATION_POLYGONS[validHorizon],
      settlements: SETTLEMENT_MARKERS,
      roads: ROAD_SEGMENTS,
      stations: HYDRO_STATIONS,
    };
  },

  /**
   * Run Flood Projection simulation (Legacy proxy)
   */
  async runPrediction(params) {
    await new Promise((r) => setTimeout(r, 400));
    const baseLevel = params.forecastRiverLevel || 8.42;
    const rainFactor = (params.rainfall || 125) / 100;
    const conditionMultiplier =
      params.initialWaterCondition === 'High'
        ? 1.25
        : params.initialWaterCondition === 'Elevated'
        ? 1.1
        : 1.0;

    const estimatedArea = Number(
      Math.min(38.5, Math.max(5.0, (baseLevel * 2.2 + rainFactor * 4.5) * conditionMultiplier)).toFixed(1)
    );
    const estimatedMaxDepth = Number(
      Math.min(4.8, Math.max(0.8, (baseLevel * 0.28 + rainFactor * 0.4) * conditionMultiplier)).toFixed(1)
    );
    const estimatedAvgDepth = Number((estimatedMaxDepth * 0.52).toFixed(1));

    let riskLevel = 'LOW';
    if (estimatedMaxDepth >= 2.5 || baseLevel >= 8.5) {
      riskLevel = 'VERY_HIGH';
    } else if (estimatedMaxDepth >= 1.8 || baseLevel >= 7.8) {
      riskLevel = 'HIGH';
    } else if (estimatedMaxDepth >= 1.0 || baseLevel >= 6.5) {
      riskLevel = 'MODERATE';
    }

    const highRiskArea = Number((estimatedArea * 0.32).toFixed(1));
    const moderateRiskArea = Number((estimatedArea * 0.42).toFixed(1));
    const lowRiskArea = Number((estimatedArea - highRiskArea - moderateRiskArea).toFixed(1));

    return {
      id: `PRD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      parameters: params,
      projectedFloodedAreaKm2: estimatedArea,
      maxDepthMeters: estimatedMaxDepth,
      avgDepthMeters: estimatedAvgDepth,
      riskLevel,
      forecastDurationHours: params.forecastDurationHours || 24,
      affectedLocationsCount: riskLevel === 'VERY_HIGH' ? 14 : 11,
      highRiskAreaKm2: highRiskArea,
      moderateRiskAreaKm2: moderateRiskArea,
      lowRiskAreaKm2: lowRiskArea,
    };
  },

  /**
   * Returns default/initial prediction result
   */
  getInitialPrediction() {
    return INITIAL_PREDICTION_RESULT;
  },
};
