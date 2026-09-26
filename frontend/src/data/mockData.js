export const BASIN_LOCATIONS = [
  {
    id: 'basin-krishna-lower',
    name: 'Lower Krishna Basin — Sector 4',
    riverName: 'Krishna River',
    basinAreaKm2: 12450,
    center: [16.518, 80.619],
    zoom: 12,
    referenceStation: 'STN-KR-04 (Prakasam Gauge)',
  },
  {
    id: 'basin-mahanadi-delta',
    name: 'Mahanadi Delta Reach — Reach B',
    riverName: 'Mahanadi River',
    basinAreaKm2: 8920,
    center: [20.463, 85.882],
    zoom: 12,
    referenceStation: 'STN-MH-12 (Naraj Barrage)',
  },
  {
    id: 'basin-ganga-varanasi',
    name: 'Middle Ganga Reach — Varanasi Plains',
    riverName: 'Ganga River',
    basinAreaKm2: 19800,
    center: [25.317, 83.006],
    zoom: 12,
    referenceStation: 'STN-GG-07 (Rajghat Gauge)',
  },
];

export const HYDRO_STATIONS = [
  {
    id: 'STN-01',
    name: 'Prakasam Upstream Station',
    code: 'G-UP-401',
    lat: 16.505,
    lng: 80.598,
    currentLevel: 8.42,
    warningLevel: 7.50,
    dangerLevel: 8.50,
    status: 'warning',
  },
  {
    id: 'STN-02',
    name: 'Vijayawada Urban Bridge Gauge',
    code: 'G-MD-402',
    lat: 16.519,
    lng: 80.622,
    currentLevel: 8.15,
    warningLevel: 7.20,
    dangerLevel: 8.20,
    status: 'warning',
  },
  {
    id: 'STN-03',
    name: 'Tadepalli Outfall Point',
    code: 'G-DN-403',
    lat: 16.488,
    lng: 80.605,
    currentLevel: 8.68,
    warningLevel: 7.30,
    dangerLevel: 8.40,
    status: 'critical',
  },
  {
    id: 'STN-04',
    name: 'Kankadurga Barrage Inflow',
    code: 'G-MD-404',
    lat: 16.528,
    lng: 80.648,
    currentLevel: 7.90,
    warningLevel: 7.00,
    dangerLevel: 8.00,
    status: 'normal',
  },
];

// River centerline polyline for Leaflet
export const RIVER_CENTERLINE = [
  [16.552, 80.540],
  [16.541, 80.563],
  [16.529, 80.584],
  [16.515, 80.602],
  [16.506, 80.618],
  [16.512, 80.635],
  [16.524, 80.655],
  [16.533, 80.678],
  [16.538, 80.705],
  [16.531, 80.730],
  [16.518, 80.755],
];

// Inundation polygon coordinates for different forecast horizons
export const INUNDATION_POLYGONS = {
  1: {
    waterExtent: [
      [
        [16.554, 80.541], [16.543, 80.565], [16.532, 80.588], [16.519, 80.605],
        [16.510, 80.620], [16.516, 80.638], [16.528, 80.659], [16.537, 80.682],
        [16.542, 80.708], [16.535, 80.732], [16.521, 80.757],
        // return path
        [16.513, 80.753], [16.527, 80.728], [16.533, 80.702], [16.529, 80.675],
        [16.519, 80.651], [16.507, 80.632], [16.502, 80.615], [16.511, 80.598],
        [16.525, 80.580], [16.538, 80.560], [16.550, 80.538],
      ],
    ],
    highRisk: [
      [
        [16.522, 80.598], [16.512, 80.614], [16.508, 80.626], [16.514, 80.636],
        [16.510, 80.630], [16.505, 80.618], [16.516, 80.602],
      ],
    ],
    moderateRisk: [
      [
        [16.530, 80.590], [16.518, 80.608], [16.505, 80.622], [16.514, 80.642],
        [16.522, 80.635], [16.511, 80.614], [16.524, 80.598],
      ],
    ],
    lowRisk: [],
  },
  3: {
    waterExtent: [
      [
        [16.556, 80.538], [16.546, 80.562], [16.535, 80.584], [16.522, 80.602],
        [16.512, 80.617], [16.519, 80.641], [16.531, 80.663], [16.541, 80.686],
        [16.545, 80.712], [16.538, 80.736], [16.524, 80.760],
        [16.510, 80.755], [16.524, 80.725], [16.530, 80.698], [16.526, 80.671],
        [16.516, 80.647], [16.504, 80.628], [16.498, 80.610], [16.508, 80.593],
        [16.522, 80.575], [16.535, 80.555], [16.548, 80.533],
      ],
    ],
    highRisk: [
      [
        [16.525, 80.595], [16.514, 80.610], [16.509, 80.626], [16.515, 80.639],
        [16.508, 80.634], [16.503, 80.615], [16.518, 80.596],
      ],
    ],
    moderateRisk: [
      [
        [16.533, 80.586], [16.522, 80.604], [16.507, 80.624], [16.517, 80.646],
        [16.524, 80.637], [16.512, 80.612], [16.526, 80.593],
      ],
    ],
    lowRisk: [],
  },
  6: {
    waterExtent: [
      [
        [16.560, 80.534], [16.549, 80.558], [16.539, 80.580], [16.526, 80.598],
        [16.515, 80.614], [16.523, 80.645], [16.535, 80.668], [16.545, 80.690],
        [16.549, 80.716], [16.542, 80.741], [16.527, 80.765],
        [16.507, 80.758], [16.520, 80.722], [16.527, 80.694], [16.522, 80.667],
        [16.512, 80.643], [16.500, 80.624], [16.494, 80.605], [16.504, 80.588],
        [16.518, 80.570], [16.531, 80.550], [16.545, 80.528],
      ],
    ],
    highRisk: [
      [
        [16.528, 80.591], [16.516, 80.606], [16.510, 80.625], [16.518, 80.644],
        [16.510, 80.638], [16.500, 80.613], [16.518, 80.590],
      ],
    ],
    moderateRisk: [
      [
        [16.537, 80.582], [16.525, 80.600], [16.510, 80.626], [16.520, 80.651],
        [16.528, 80.640], [16.514, 80.609], [16.529, 80.588],
      ],
    ],
    lowRisk: [
      [
        [16.545, 80.572], [16.533, 80.591], [16.515, 80.620], [16.527, 80.659],
        [16.536, 80.648], [16.521, 80.603], [16.538, 80.578],
      ],
    ],
  },
  12: {
    waterExtent: [
      [
        [16.564, 80.530], [16.553, 80.554], [16.543, 80.576], [16.530, 80.594],
        [16.519, 80.611], [16.527, 80.650], [16.539, 80.673], [16.549, 80.695],
        [16.553, 80.720], [16.546, 80.745], [16.531, 80.770],
        [16.503, 80.762], [16.516, 80.718], [16.523, 80.690], [16.518, 80.663],
        [16.508, 80.639], [16.495, 80.620], [16.489, 80.600], [16.500, 80.584],
        [16.514, 80.565], [16.527, 80.545], [16.541, 80.523],
      ],
    ],
    highRisk: [
      [
        [16.532, 80.588], [16.520, 80.603], [16.512, 80.624], [16.522, 80.648],
        [16.514, 80.642], [16.496, 80.610], [16.521, 80.586],
      ],
    ],
    moderateRisk: [
      [
        [16.542, 80.578], [16.529, 80.597], [16.514, 80.628], [16.524, 80.656],
        [16.532, 80.644], [16.517, 80.606], [16.533, 80.584],
      ],
    ],
    lowRisk: [
      [
        [16.551, 80.567], [16.538, 80.587], [16.518, 80.623], [16.531, 80.665],
        [16.540, 80.652], [16.525, 80.599], [16.542, 80.573],
      ],
    ],
  },
  24: {
    waterExtent: [
      // Major overflow polygon matching 24.6 km²
      [
        [16.570, 80.524], [16.558, 80.548], [16.548, 80.571], [16.535, 80.590],
        [16.524, 80.607], [16.532, 80.655], [16.544, 80.678], [16.554, 80.700],
        [16.558, 80.725], [16.550, 80.750], [16.536, 80.776],
        [16.498, 80.767], [16.511, 80.713], [16.518, 80.685], [16.513, 80.658],
        [16.503, 80.634], [16.490, 80.615], [16.484, 80.594], [16.495, 80.578],
        [16.509, 80.559], [16.522, 80.539], [16.536, 80.517],
      ],
    ],
    highRisk: [
      [
        [16.536, 80.585], [16.524, 80.600], [16.515, 80.623], [16.525, 80.652],
        [16.517, 80.645], [16.492, 80.606], [16.524, 80.582],
      ],
    ],
    moderateRisk: [
      [
        [16.547, 80.574], [16.534, 80.593], [16.518, 80.630], [16.528, 80.661],
        [16.536, 80.647], [16.520, 80.602], [16.538, 80.579],
      ],
    ],
    lowRisk: [
      [
        [16.558, 80.562], [16.544, 80.582], [16.523, 80.627], [16.536, 80.671],
        [16.545, 80.656], [16.529, 80.594], [16.548, 80.568],
      ],
    ],
  },
};

// Settlement and infrastructure markers for GIS layer
export const SETTLEMENT_MARKERS = [
  { id: 'SET-01', name: 'Krishnalanka Lowlands', type: 'Urban Ward', lat: 16.507, lng: 80.625, risk: 'HIGH', depth: 2.8, status: 'Evacuation Alert' },
  { id: 'SET-02', name: 'Tadepalli Embankment Area', type: 'Settlement', lat: 16.491, lng: 80.609, risk: 'HIGH', depth: 2.3, status: 'Evacuation Alert' },
  { id: 'SET-03', name: 'Ranigari Thota', type: 'Residential', lat: 16.502, lng: 80.632, risk: 'MODERATE', depth: 1.6, status: 'Advisory' },
  { id: 'SET-04', name: 'Bhavanipuram Floodplain', type: 'Agricultural / Mixed', lat: 16.528, lng: 80.590, risk: 'MODERATE', depth: 1.4, status: 'Advisory' },
  { id: 'SET-05', name: 'Gollapudi Agri Reach', type: 'Farmland', lat: 16.542, lng: 80.565, risk: 'LOW', depth: 0.8, status: 'Accessible' },
  { id: 'SET-06', name: 'NH-16 River Crossing Approach', type: 'Transport Arterial', lat: 16.516, lng: 80.640, risk: 'HIGH', depth: 2.1, status: 'Traffic Diversion' },
];

export const ROAD_SEGMENTS = [
  // Major highway along bank
  [
    [16.548, 80.545],
    [16.535, 80.575],
    [16.520, 80.610],
    [16.515, 80.640],
    [16.525, 80.670],
    [16.540, 80.710],
  ],
  // Bypass route
  [
    [16.480, 80.590],
    [16.485, 80.615],
    [16.495, 80.645],
    [16.510, 80.675],
  ],
];

export const FORECAST_TIMELINE = [
  {
    timeOffset: '+1 hr',
    hours: 1,
    riverLevel: 7.80,
    rainfall: 80,
    floodedAreaKm2: 8.2,
    maxDepth: 1.2,
    avgDepth: 0.6,
    riskLevel: 'MODERATE',
    affectedSettlementsCount: 3,
  },
  {
    timeOffset: '+3 hr',
    hours: 3,
    riverLevel: 8.10,
    rainfall: 95,
    floodedAreaKm2: 12.7,
    maxDepth: 1.7,
    avgDepth: 0.9,
    riskLevel: 'MODERATE',
    affectedSettlementsCount: 5,
  },
  {
    timeOffset: '+6 hr',
    hours: 6,
    riverLevel: 8.42,
    rainfall: 125,
    floodedAreaKm2: 17.4,
    maxDepth: 2.2,
    avgDepth: 1.1,
    riskLevel: 'HIGH',
    affectedSettlementsCount: 8,
  },
  {
    timeOffset: '+12 hr',
    hours: 12,
    riverLevel: 8.90,
    rainfall: 140,
    floodedAreaKm2: 21.3,
    maxDepth: 2.5,
    avgDepth: 1.3,
    riskLevel: 'HIGH',
    affectedSettlementsCount: 10,
  },
  {
    timeOffset: '+24 hr',
    hours: 24,
    riverLevel: 9.20,
    rainfall: 155,
    floodedAreaKm2: 24.6,
    maxDepth: 2.8,
    avgDepth: 1.4,
    riskLevel: 'VERY_HIGH',
    affectedSettlementsCount: 12,
  },
];

export const AFFECTED_LOCATIONS = [
  {
    id: 'LOC-01',
    name: 'Krishnalanka Lowland Colony',
    type: 'Town',
    estimatedDepth: 2.8,
    risk: 'HIGH',
    distanceFromRiverKm: 0.2,
    populationAtRisk: 8400,
    status: 'Evacuation Alert',
  },
  {
    id: 'LOC-02',
    name: 'Tadepalli Embankment Village',
    type: 'Village',
    estimatedDepth: 2.3,
    risk: 'HIGH',
    distanceFromRiverKm: 0.35,
    populationAtRisk: 3100,
    status: 'Evacuation Alert',
  },
  {
    id: 'LOC-03',
    name: 'NH-16 Floodplain Flyover Pier',
    type: 'Infrastructure',
    estimatedDepth: 2.1,
    risk: 'HIGH',
    distanceFromRiverKm: 0.1,
    status: 'Submerged',
  },
  {
    id: 'LOC-04',
    name: 'Ranigari Thota Riverside',
    type: 'Town',
    estimatedDepth: 1.6,
    risk: 'MODERATE',
    distanceFromRiverKm: 0.55,
    populationAtRisk: 4200,
    status: 'Advisory',
  },
  {
    id: 'LOC-05',
    name: 'Bhavanipuram Agricultural Polder',
    type: 'Agricultural',
    estimatedDepth: 1.4,
    risk: 'MODERATE',
    distanceFromRiverKm: 0.7,
    status: 'Submerged',
  },
  {
    id: 'LOC-06',
    name: 'Gollapudi Agri Reach',
    type: 'Agricultural',
    estimatedDepth: 0.8,
    risk: 'LOW',
    distanceFromRiverKm: 1.2,
    status: 'Accessible',
  },
  {
    id: 'LOC-07',
    name: 'Kondapalli Substation Buffer',
    type: 'Infrastructure',
    estimatedDepth: 0.6,
    risk: 'LOW',
    distanceFromRiverKm: 1.5,
    status: 'Accessible',
  },
  {
    id: 'LOC-08',
    name: 'Sitanagaram Ferry Approach',
    type: 'Infrastructure',
    estimatedDepth: 2.6,
    risk: 'HIGH',
    distanceFromRiverKm: 0.15,
    status: 'Submerged',
  },
];

export const CURRENT_SUMMARY = {
  riverLevelMeters: 8.42,
  predictedFloodedAreaKm2: 24.6,
  maxWaterDepthMeters: 2.8,
  avgWaterDepthMeters: 1.4,
  riskLevel: 'HIGH',
  warningLevelMeters: 7.50,
  dangerLevelMeters: 8.50,
  highRiskAreaKm2: 7.8,
  moderateRiskAreaKm2: 10.2,
  lowRiskAreaKm2: 6.6,
  affectedLocationsCount: 12,
  forecastHorizonHours: 24,
  rainfallMm: 125,
  lastUpdated: 'Today, 06:00 UTC (Cycle 12)',
  locationName: 'Lower Krishna Basin — Sector 4',
  referenceRiver: 'Krishna River',
};

export const INITIAL_PREDICTION_RESULT = {
  id: 'PRD-MOCK-2026-0901',
  timestamp: new Date().toISOString(),
  parameters: {
    locationId: 'basin-krishna-lower',
    forecastRiverLevel: 8.42,
    rainfall: 125,
    forecastDurationHours: 24,
    initialWaterCondition: 'Elevated',
  },
  projectedFloodedAreaKm2: 24.6,
  maxDepthMeters: 2.8,
  avgDepthMeters: 1.4,
  riskLevel: 'HIGH',
  forecastDurationHours: 24,
  affectedLocationsCount: 12,
  highRiskAreaKm2: 7.8,
  moderateRiskAreaKm2: 10.2,
  lowRiskAreaKm2: 6.6,
  timeSteps: FORECAST_TIMELINE,
};
