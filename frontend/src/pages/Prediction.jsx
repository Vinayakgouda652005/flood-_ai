import React, { useState, useEffect, useCallback, useRef } from 'react';
import { floodService, PRESET_LOCATIONS } from '../services/floodService.js';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { FloodMap } from '../components/map/FloodMap.jsx';
import { MapLegend } from '../components/map/MapLegend.jsx';
import { LayerControl } from '../components/map/LayerControl.jsx';
import {
  MapPin,
  Calendar as CalendarIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Compass,
  Loader2,
  ShieldAlert,
  HelpCircle,
  Map as MapIcon,
  X,
  Layers,
  ChevronDown,
  Navigation,
} from 'lucide-react';

// Format YYYY-MM-DD to a human readable format: e.g. "25 September 2026"
const formatHumanDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Dynamic today string in YYYY-MM-DD format based on client/browser system date
const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to calculate future date string
const getOffsetIsoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Prediction = ({
  onNavigate,
  selectedLocation,
  setSelectedLocation,
  selectedDate,
  setSelectedDate,
  predictionResult,
  setPredictionResult,
}) => {
  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState('');

  // Location selection & search interface state
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Prediction execution state
  const [isLoading, setIsLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [formValidationMessage, setFormValidationMessage] = useState('');

  // Map layer controls
  const [mapLayers, setMapLayers] = useState({
    showRiver: true,
    showInundation: true,
    showRiskZones: true,
    showRoads: false,
    showSettlements: true,
    showStations: true,
  });

  // Track if geolocation was auto-requested on mount
  const hasRequestedGeolocation = useRef(false);

  // Function to obtain current browser location
  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatusMessage('Browser does not support geolocation.');
      return;
    }

    setIsLocating(true);
    setLocationPermissionDenied(false);
    setLocationStatusMessage('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const humanName = await floodService.reverseGeocode(lat, lon);
          const newLoc = {
            name: humanName || `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
            isCurrentLocation: true,
          };
          if (setSelectedLocation) {
            setSelectedLocation(newLoc);
          }
          setLocationStatusMessage('Current location set successfully.');
          setIsChangingLocation(false);
        } catch {
          const fallbackLoc = {
            name: `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
            isCurrentLocation: true,
          };
          if (setSelectedLocation) {
            setSelectedLocation(fallbackLoc);
          }
          setLocationStatusMessage('Current coordinates acquired.');
          setIsChangingLocation(false);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
          setLocationStatusMessage(
            'Location permission was denied. You can manually select or search for a location below.'
          );
          // If no location has been selected, open the search selector
          if (!selectedLocation) {
            setIsChangingLocation(true);
          }
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatusMessage('Location information is currently unavailable.');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatusMessage('Location request timed out. Please try again or search manually.');
        } else {
          setLocationStatusMessage('Unable to retrieve location.');
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 60000,
      }
    );
  }, [setSelectedLocation, selectedLocation]);

  // Requirement: When the user opens the Flood Prediction page:
  // Automatically request browser geolocation permission.
  useEffect(() => {
    if (!hasRequestedGeolocation.current) {
      hasRequestedGeolocation.current = true;
      handleUseCurrentLocation();
    }
  }, [handleUseCurrentLocation]);

  // Auto-focus search input when opening location selector
  useEffect(() => {
    if (isChangingLocation && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isChangingLocation]);

  // Handle location search typing
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFormValidationMessage('');

    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await floodService.searchLocations(val);
        setSearchResults(results);
      } catch {
        setSearchResults(PRESET_LOCATIONS);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults(PRESET_LOCATIONS.slice(0, 8));
    }
  };

  // Select location from search / preset list
  const handleSelectLocation = (loc) => {
    if (setSelectedLocation) {
      setSelectedLocation({
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        isCurrentLocation: false,
      });
    }
    setSearchQuery('');
    setIsChangingLocation(false);
    setLocationStatusMessage('');
    setLocationPermissionDenied(false);
    setFormValidationMessage('');
  };

  // Predict Flood form submission
  const handlePredictFlood = async (e) => {
    if (e) e.preventDefault();
    setFormValidationMessage('');
    setPredictionError(null);

    // 1. Validate location
    if (!selectedLocation || selectedLocation.latitude == null || selectedLocation.longitude == null) {
      setFormValidationMessage('Please select a valid location before requesting a flood prediction.');
      return;
    }

    // 2. Validate prediction date
    if (!selectedDate) {
      setFormValidationMessage('Please select a valid prediction date.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await floodService.predictFlood({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        date: selectedDate,
        name: selectedLocation.name,
      });

      // Augment result with human-readable location name
      const finalResult = {
        ...response,
        locationName: response.locationName || selectedLocation.name,
      };

      if (setPredictionResult) {
        setPredictionResult(finalResult);
      }
    } catch (err) {
      console.warn('Prediction API call failed:', err);
      // Strictly comply with requirement:
      // "If the backend is not running, show: 'Prediction service is currently unavailable.' instead of displaying a fake prediction."
      setPredictionError(err.message || 'Prediction service is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setPredictionError(null);
    setFormValidationMessage('');
    if (setSelectedDate) {
      setSelectedDate(getTodayIsoDate());
    }
  };

  const hasResult = !!predictionResult;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ======================================================== */}
      {/* 1. PAGE TITLE & SUBTITLE                                */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Flood Inundation Projection
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              User-Driven
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Select a location and date to generate a flood projection.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 self-start sm:self-center">
          <div className="flex items-center gap-1.5 font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Today: {getTodayIsoDate()}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Reset date & clear notifications"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PREDICTION INPUT SECTION (LOCATION & DATE CARDS)     */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ---------------- CARD 1: LOCATION ---------------- */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-700" />
                  LOCATION
                </span>
                {selectedLocation?.isCurrentLocation && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Navigation className="w-2.5 h-2.5" />
                    Current GPS
                  </span>
                )}
              </div>

              {/* Location Permission Denied Alert */}
              {locationPermissionDenied && (
                <div className="mb-3.5 p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Location Permission Denied: </strong>
                    Browser location access was denied. You can manually select or search for a location below.
                  </div>
                </div>
              )}

              {/* Status message while GPS is acquiring */}
              {isLocating && (
                <div className="mb-3 p-2.5 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-700 shrink-0" />
                  <span>Acquiring browser GPS coordinates &amp; reverse geocoding...</span>
                </div>
              )}

              {/* SELECTED LOCATION DISPLAY (When not in change mode) */}
              {!isChangingLocation && selectedLocation && (
                <div className="space-y-2 py-1">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <div className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {selectedLocation.name}
                      </div>
                      <div className="text-xs font-mono text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Lat: <strong>{Number(selectedLocation.latitude).toFixed(4)}</strong></span>
                        <span>Long: <strong>{Number(selectedLocation.longitude).toFixed(4)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state if no location selected yet */}
              {!isChangingLocation && !selectedLocation && !isLocating && (
                <div className="p-3 text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-md text-center">
                  No location selected. Click below to use your current location or search for a city.
                </div>
              )}

              {/* EXPANDED LOCATION SELECTOR / SEARCH INTERFACE */}
              {isChangingLocation && (
                <div className="space-y-3 pt-1">
                  {/* Option A: Use Current Location button */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-md border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-60"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-700" />
                        <span>Detecting GPS Coordinates...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-sky-700" />
                        <span>📍 Use Current Location</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-2 text-[11px] font-medium text-slate-400 absolute">
                      or
                    </span>
                  </div>

                  {/* Option B: Search / Select Location */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="🔍 Search city, district, region..."
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-600 focus:bg-white font-medium transition-all"
                      />
                      {isSearching && (
                        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-2.5" />
                      )}
                    </div>

                    {/* Suggestions list */}
                    <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                      <div className="px-2.5 py-1 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Monitored Locations &amp; River Basins
                      </div>
                      {(searchResults.length > 0 ? searchResults : PRESET_LOCATIONS.slice(0, 6)).map(
                        (loc, idx) => (
                          <button
                            key={`${loc.name}-${idx}`}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                          >
                            <span className="font-medium truncate mr-2">{loc.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {Number(loc.latitude).toFixed(2)}, {Number(loc.longitude).toFixed(2)}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Change Location Action Button */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              {isChangingLocation ? (
                <button
                  type="button"
                  onClick={() => setIsChangingLocation(false)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer text-center"
                >
                  Cancel / Keep Current Location
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingLocation(true);
                    setSearchResults(PRESET_LOCATIONS.slice(0, 8));
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>[ Change Location ]</span>
                </button>
              )}
            </div>
          </div>

          {/* ---------------- CARD 2: PREDICTION DATE ---------------- */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-sky-700" />
                  PREDICTION DATE
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Format: YYYY-MM-DD
                </span>
              </div>

              {/* Display selected date in prominent user-friendly format */}
              <div className="space-y-2 py-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📅</span>
                  <div>
                    <div className="text-base font-bold text-slate-900 tracking-tight">
                      {formatHumanDate(selectedDate)}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      Selected: <strong>{selectedDate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Date Picker Input */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                <label
                  htmlFor="prediction-date-picker"
                  className="block text-xs font-bold text-slate-700"
                >
                  [ Select Date ]
                </label>
                <input
                  id="prediction-date-picker"
                  type="date"
                  value={selectedDate || getTodayIsoDate()}
                  onChange={(e) => {
                    if (setSelectedDate) setSelectedDate(e.target.value);
                    setFormValidationMessage('');
                  }}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-600 focus:bg-white transition-all cursor-pointer font-medium"
                />

                {/* Quick Horizon Shortcuts */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-semibold mr-0.5">
                    Quick:
                  </span>
                  {[
                    { label: 'Today', date: getTodayIsoDate() },
                    { label: '+1 Day', date: getOffsetIsoDate(1) },
                    { label: '+3 Days', date: getOffsetIsoDate(3) },
                    { label: '+7 Days', date: getOffsetIsoDate(7) },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        if (setSelectedDate) setSelectedDate(chip.date);
                        setFormValidationMessage('');
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors cursor-pointer border ${
                        selectedDate === chip.date
                          ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Prediction models evaluate forecasted hydrometric discharge and upstream precipitation for the specified date.
            </div>
          </div>
        </div>

        {/* ---------------- VALIDATION ERROR MESSAGE ---------------- */}
        {formValidationMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formValidationMessage}</span>
          </div>
        )}

        {/* ---------------- CENTERED PREDICT FLOOD BUTTON ---------------- */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handlePredictFlood}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[280px] py-3.5 px-8 text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 active:bg-sky-900 disabled:bg-sky-400 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating flood projection...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Predict Flood</span>
              </>
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-400 mt-2">
            POST /api/predict &bull; Latitude, Longitude &amp; Date
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BACKEND SERVICE ERROR (If backend is offline)         */}
      {/* ======================================================== */}
      {predictionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-xs text-red-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold mb-1.5 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Prediction Service Unavailable</span>
          </div>
          <p className="text-red-700 text-xs">
            {predictionError}
          </p>
          <div className="mt-3 pt-2.5 border-t border-red-100 text-[11px] text-red-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Please verify that the FastAPI backend server is active at{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-red-200 font-mono text-red-800 font-semibold">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
              </code>
            </span>
            <span className="font-mono text-[10px] text-red-500">
              Request: POST /api/predict
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FLOOD PREDICTION RESULT SECTION                       */}
      {/* ======================================================== */}
      {hasResult && !predictionError && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Flood Prediction Result
                </h2>
                <p className="text-xs text-slate-500">
                  Projection generated for {predictionResult.locationName}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
              Backend Response: OK
            </span>
          </div>

          {/* Grid of Results: Location, Date, Probability, Risk Level, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Location */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Location
              </div>
              <div className="font-bold text-slate-900 text-sm truncate" title={predictionResult.locationName}>
                {predictionResult.locationName || selectedLocation?.name || 'Target Location'}
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-1">
                Lat: {predictionResult.latitude?.toFixed(4)}, Long: {predictionResult.longitude?.toFixed(4)}
              </div>
            </div>

            {/* 2. Prediction Date */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Prediction Date
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {formatHumanDate(predictionResult.date)}
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-1">
                ISO: {predictionResult.date}
              </div>
            </div>

            {/* 3. Flood Probability */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Flood Probability
              </div>
              <div className="text-2xl font-black font-mono text-sky-800">
                {typeof predictionResult.flood_probability === 'number'
                  ? `${(predictionResult.flood_probability * 100).toFixed(0)}%`
                  : 'Pending'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {typeof predictionResult.flood_probability === 'number'
                  ? 'Backend Hydro Model'
                  : 'Pending AI Model'}
              </div>
            </div>

            {/* 4. Risk Level */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Risk Level
                </div>
                <div className="py-0.5">
                  <RiskBadge level={predictionResult.risk_level || 'PENDING'} size="lg" />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Civil Defense Threshold
              </div>
            </div>
          </div>

          {/* 5. Prediction Status Banner */}
          <div
            className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              predictionResult.status === 'WAITING_FOR_AI_MODEL' || predictionResult.status === 'PENDING_AI_MODEL'
                ? 'bg-sky-50 border-sky-200 text-sky-950'
                : predictionResult.flood_occurred
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {predictionResult.status === 'WAITING_FOR_AI_MODEL' || predictionResult.status === 'PENDING_AI_MODEL' ? (
                <HelpCircle className="w-5 h-5 text-sky-600 shrink-0" />
              ) : predictionResult.flood_occurred ? (
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  Prediction Status:{' '}
                  {predictionResult.status === 'WAITING_FOR_AI_MODEL'
                    ? 'Request Logged in Database (WAITING_FOR_AI_MODEL)'
                    : predictionResult.status === 'PENDING_AI_MODEL'
                    ? 'Request Logged (AI Model Integration Pending)'
                    : predictionResult.flood_occurred
                    ? 'Flood Threat Projected (Risk Detected)'
                    : 'Minimal Threat (No Flood Projected)'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {predictionResult.message ||
                    (predictionResult.status === 'WAITING_FOR_AI_MODEL'
                      ? 'Prediction request recorded in PostgreSQL. Waiting for AI model integration.'
                      : 'Hydro-model simulation processed.')}
                </div>
              </div>
            </div>
            <div className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded bg-white/70 border border-current self-start sm:self-auto shrink-0">
              {predictionResult.status === 'WAITING_FOR_AI_MODEL'
                ? `DB Request #${predictionResult.request_id || 1}`
                : predictionResult.status === 'PENDING_AI_MODEL'
                ? 'Status: Queued'
                : `Risk: ${predictionResult.risk_level}`}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. NO PREDICTION GENERATED YET STATE                    */}
      {/* ======================================================== */}
      {!hasResult && !predictionError && !isLoading && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6 text-sky-700" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No Prediction Generated Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-3 leading-relaxed">
            Select a location and prediction date above, then click{' '}
            <strong className="text-slate-800 font-semibold">&quot;Predict Flood&quot;</strong>{' '}
            to generate an AI hydrological projection and GIS inundation model.
          </p>
          <span className="text-[11px] font-mono px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-600">
            Awaiting User Trigger
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. GIS INUNDATION MAP SECTION (BELOW)                   */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <MapIcon className="w-5 h-5 text-sky-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                GIS Inundation &amp; Spatial Risk Map
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing flood extent, hydrological monitoring stations, and terrain vulnerability.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 truncate max-w-xs">
              📍 {selectedLocation ? selectedLocation.name : 'No Location Selected'}
            </span>
          </div>
        </div>

        {/* Map Canvas with Floating Controls */}
        <div className="relative w-full h-[520px]">
          <FloodMap
            selectedLocation={selectedLocation}
            predictionResult={predictionResult}
            inundationGeoJson={predictionResult?.inundation?.geojson}
            center={
              selectedLocation?.latitude && selectedLocation?.longitude
                ? [selectedLocation.latitude, selectedLocation.longitude]
                : [16.518, 80.62]
            }
            zoom={selectedLocation ? 13 : 11}
            layers={mapLayers}
            height="100%"
          />

          {/* Floating Map Legend */}
          <div className="absolute top-3 right-3 z-1000 max-w-xs">
            <MapLegend isCompact={true} />
          </div>

          {/* Floating Layer Controls */}
          <div className="absolute bottom-3 left-3 z-1000">
            <LayerControl layers={mapLayers} onChange={setMapLayers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
