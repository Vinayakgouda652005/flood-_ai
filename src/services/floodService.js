/**
 * Flood Service Layer (API Client)
 *
 * NOTE: Currently configured to provide realistic mock data for frontend development.
 * In production, these methods will point to the Python / FastAPI backend (e.g. POST /predict,
 * GET /basin/:id/forecast, GET /basin/:id/inundation-layers) running the FNO+ neural operator.
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

export const floodService = {
  /**
   * Get list of monitored river basins/reaches
   */
  async getBasins() {
    await new Promise((r) => setTimeout(r, 80));
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
    await new Promise((r) => setTimeout(r, 80));
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
    await new Promise((r) => setTimeout(r, 80));
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
   * Run Flood Projection simulation (Mock of FNO+ FastAPI inference)
   */
  async runPrediction(params) {
    // Simulate brief inference latency (600ms) to illustrate loading UI
    await new Promise((r) => setTimeout(r, 600));

    const baseLevel = params.forecastRiverLevel;
    const rainFactor = params.rainfall / 100;
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

    const simulatedTimeline = [
      {
        timeOffset: '+1 hr',
        hours: 1,
        riverLevel: Number((baseLevel - 0.6).toFixed(2)),
        rainfall: Math.round(params.rainfall * 0.65),
        floodedAreaKm2: Number((estimatedArea * 0.35).toFixed(1)),
        maxDepth: Number((estimatedMaxDepth * 0.45).toFixed(1)),
        avgDepth: Number((estimatedAvgDepth * 0.45).toFixed(1)),
        riskLevel: 'MODERATE',
        affectedSettlementsCount: 3,
      },
      {
        timeOffset: '+3 hr',
        hours: 3,
        riverLevel: Number((baseLevel - 0.3).toFixed(2)),
        rainfall: Math.round(params.rainfall * 0.75),
        floodedAreaKm2: Number((estimatedArea * 0.52).toFixed(1)),
        maxDepth: Number((estimatedMaxDepth * 0.6).toFixed(1)),
        avgDepth: Number((estimatedAvgDepth * 0.6).toFixed(1)),
        riskLevel: 'MODERATE',
        affectedSettlementsCount: 5,
      },
      {
        timeOffset: '+6 hr',
        hours: 6,
        riverLevel: Number(baseLevel.toFixed(2)),
        rainfall: params.rainfall,
        floodedAreaKm2: Number((estimatedArea * 0.71).toFixed(1)),
        maxDepth: Number((estimatedMaxDepth * 0.78).toFixed(1)),
        avgDepth: Number((estimatedAvgDepth * 0.78).toFixed(1)),
        riskLevel: riskLevel === 'VERY_HIGH' ? 'HIGH' : riskLevel,
        affectedSettlementsCount: 8,
      },
      {
        timeOffset: '+12 hr',
        hours: 12,
        riverLevel: Number((baseLevel + 0.45).toFixed(2)),
        rainfall: Math.round(params.rainfall * 1.15),
        floodedAreaKm2: Number((estimatedArea * 0.86).toFixed(1)),
        maxDepth: Number((estimatedMaxDepth * 0.9).toFixed(1)),
        avgDepth: Number((estimatedAvgDepth * 0.9).toFixed(1)),
        riskLevel: riskLevel,
        affectedSettlementsCount: 10,
      },
      {
        timeOffset: `+${params.forecastDurationHours} hr`,
        hours: params.forecastDurationHours,
        riverLevel: Number((baseLevel + 0.75).toFixed(2)),
        rainfall: Math.round(params.rainfall * 1.25),
        floodedAreaKm2: estimatedArea,
        maxDepth: estimatedMaxDepth,
        avgDepth: estimatedAvgDepth,
        riskLevel: riskLevel,
        affectedSettlementsCount: riskLevel === 'VERY_HIGH' ? 14 : 11,
      },
    ];

    return {
      id: `PRD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      parameters: params,
      projectedFloodedAreaKm2: estimatedArea,
      maxDepthMeters: estimatedMaxDepth,
      avgDepthMeters: estimatedAvgDepth,
      riskLevel,
      forecastDurationHours: params.forecastDurationHours,
      affectedLocationsCount: riskLevel === 'VERY_HIGH' ? 14 : 11,
      highRiskAreaKm2: highRiskArea,
      moderateRiskAreaKm2: moderateRiskArea,
      lowRiskAreaKm2: lowRiskArea,
      timeSteps: simulatedTimeline,
    };
  },

  /**
   * Returns default/initial prediction result
   */
  getInitialPrediction() {
    return INITIAL_PREDICTION_RESULT;
  },
};
