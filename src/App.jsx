import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Prediction } from './pages/Prediction.jsx';
import { InundationMap } from './pages/InundationMap.jsx';
import { Forecast } from './pages/Forecast.jsx';
import { Analysis } from './pages/Analysis.jsx';
import { About } from './pages/About.jsx';
import { floodService } from './services/floodService.js';
import {
  CURRENT_SUMMARY,
  FORECAST_TIMELINE,
  BASIN_LOCATIONS,
} from './data/mockData.js';

export function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [basins, setBasins] = useState(BASIN_LOCATIONS);
  const [selectedBasinId, setSelectedBasinId] = useState(BASIN_LOCATIONS[0].id);
  const [summary, setSummary] = useState(CURRENT_SUMMARY);
  const [timeline, setTimeline] = useState(FORECAST_TIMELINE);
  const [lastPredictionResult, setLastPredictionResult] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize and load basin data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const basinList = await floodService.getBasins();
        if (isMounted && basinList.length > 0) {
          setBasins(basinList);
        }
      } catch (err) {
        console.error('Failed to load basins:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When basin changes, update summary
  useEffect(() => {
    let isMounted = true;
    async function updateBasinContext() {
      try {
        const sum = await floodService.getDashboardSummary(selectedBasinId);
        const timeData = await floodService.getForecastTimeline(selectedBasinId);
        if (isMounted) {
          setSummary(sum);
          setTimeline(timeData);
        }
      } catch (err) {
        console.error('Error fetching basin summary:', err);
      }
    }
    updateBasinContext();
    return () => {
      isMounted = false;
    };
  }, [selectedBasinId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const sum = await floodService.getDashboardSummary(selectedBasinId);
      const timeData = await floodService.getForecastTimeline(selectedBasinId);
      setSummary(sum);
      setTimeline(timeData);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handlePredictionCompleted = (result) => {
    setLastPredictionResult(result);
    // Update summary with the new prediction result values
    setSummary((prev) => ({
      ...prev,
      predictedFloodedAreaKm2: result.projectedFloodedAreaKm2,
      maxWaterDepthMeters: result.maxDepthMeters,
      riskLevel: result.riskLevel,
      highRiskAreaKm2: result.highRiskAreaKm2,
      moderateRiskAreaKm2: result.moderateRiskAreaKm2,
      lowRiskAreaKm2: result.lowRiskAreaKm2,
      affectedLocationsCount: result.affectedLocationsCount,
      riverLevelMeters: result.parameters.forecastRiverLevel,
      rainfallMm: result.parameters.rainfall,
      forecastHorizonHours: result.forecastDurationHours,
      lastUpdated: 'Just now (Custom Model Run)',
    }));

    if (result.timeSteps && result.timeSteps.length > 0) {
      setTimeline(result.timeSteps);
    }
  };

  const selectedBasin = basins.find((b) => b.id === selectedBasinId) || basins[0];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          basins={basins}
          selectedBasinId={selectedBasinId}
          onSelectBasin={setSelectedBasinId}
          onToggleMobileSidebar={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <Dashboard
                onNavigate={setCurrentPage}
                summary={summary}
                timelineData={timeline}
              />
            )}

            {currentPage === 'prediction' && (
              <Prediction
                basins={basins}
                onNavigate={setCurrentPage}
                onPredictionCompleted={handlePredictionCompleted}
                lastResult={lastPredictionResult}
              />
            )}

            {currentPage === 'inundation-map' && (
              <InundationMap
                basin={selectedBasin}
                summary={summary}
              />
            )}

            {currentPage === 'forecast' && (
              <Forecast
                timelineData={timeline}
                summary={summary}
              />
            )}

            {currentPage === 'analysis' && (
              <Analysis
                summary={summary}
              />
            )}

            {currentPage === 'about' && <About />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
