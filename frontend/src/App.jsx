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

// Dynamic helper to obtain current date formatted as YYYY-MM-DD
const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Basins & baseline summary state
  const [basins, setBasins] = useState(BASIN_LOCATIONS);
  const [selectedBasinId, setSelectedBasinId] = useState(BASIN_LOCATIONS[0].id);
  const [summary, setSummary] = useState(CURRENT_SUMMARY);
  const [timeline, setTimeline] = useState(FORECAST_TIMELINE);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Requirement 13 State Management
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [predictionResult, setPredictionResult] = useState(null);

  // Initialize and load basin data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const basinList = await floodService.getBasins();
        if (isMounted && basinList.length > 0) {
          setBasins(basinList);
          // If no location has been selected by user yet, initialize with default basin
          setSelectedLocation((prev) => {
            if (!prev) {
              return {
                name: basinList[0].name,
                latitude: basinList[0].center[0],
                longitude: basinList[0].center[1],
                isCurrentLocation: false,
              };
            }
            return prev;
          });
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

  // When basin changes, update summary & sync selectedLocation if not overridden
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

  const handleSelectBasin = (basinId) => {
    setSelectedBasinId(basinId);
    const found = basins.find((b) => b.id === basinId);
    if (found) {
      setSelectedLocation({
        name: found.name,
        latitude: found.center[0],
        longitude: found.center[1],
        isCurrentLocation: false,
      });
    }
  };

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
    setPredictionResult(result);
    if (result) {
      setSummary((prev) => ({
        ...prev,
        riskLevel: result.risk_level || prev.riskLevel,
        locationName: result.locationName || prev.locationName,
        lastUpdated: `Just now (AI Run: ${result.date})`,
      }));
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
          onSelectBasin={handleSelectBasin}
          onToggleMobileSidebar={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          selectedLocation={selectedLocation}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <Dashboard
                onNavigate={setCurrentPage}
                summary={summary}
                timelineData={timeline}
                selectedLocation={selectedLocation}
                predictionResult={predictionResult}
              />
            )}

            {currentPage === 'prediction' && (
              <Prediction
                onNavigate={setCurrentPage}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                predictionResult={predictionResult}
                setPredictionResult={handlePredictionCompleted}
              />
            )}

            {currentPage === 'inundation-map' && (
              <InundationMap
                basin={selectedBasin}
                summary={summary}
                selectedLocation={selectedLocation}
                predictionResult={predictionResult}
              />
            )}

            {currentPage === 'forecast' && (
              <Forecast
                timelineData={timeline}
                summary={summary}
                selectedLocation={selectedLocation}
                selectedDate={selectedDate}
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
