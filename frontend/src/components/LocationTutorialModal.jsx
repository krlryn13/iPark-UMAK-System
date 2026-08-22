import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, MarkerF, PolylineF, InfoWindowF } from '@react-google-maps/api';
import { getGuideForLocation, CAMPUS_GATES, UMAK_COORDINATES } from '../data/locationGuides';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};

export default function LocationTutorialModal({ isOpen, onClose, locationTarget }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'steps'
  const [selectedGate, setSelectedGate] = useState(CAMPUS_GATES[0]);
  const [transportMode, setTransportMode] = useState('car'); // 'car' | 'motorcycle' | 'walk'
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' (Satellite + Roads) | 'roadmap'
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  // User GPS state
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const mapRef = useRef(null);

  // Load Google Maps JS API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const guide = getGuideForLocation(locationTarget?.location || locationTarget?.name || locationTarget);

  // Set default mode based on location target
  useEffect(() => {
    if (locationTarget && String(locationTarget).toLowerCase().includes('ohso')) {
      setTransportMode('walk');
    } else {
      setTransportMode('car');
    }
  }, [locationTarget]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Request Live GPS Location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    setGpsMessage('Locating your position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserGpsLocation(pos);
        setIsLocating(false);
        setGpsMessage('GPS Location Acquired!');

        if (mapRef.current) {
          mapRef.current.panTo(pos);
          mapRef.current.setZoom(19);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Unable to retrieve location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Convert Waypoints array to Google Maps LatLng Objects
  const routePolylinePath = (guide.waypoints || []).map(wp => ({
    lat: Array.isArray(wp) ? wp[0] : wp.lat,
    lng: Array.isArray(wp) ? wp[1] : wp.lng,
  }));

  // Open Google Maps app for turn-by-turn navigation
  const handleOpenGoogleMapsApp = () => {
    const destLat = guide.lat;
    const destLng = guide.lng;
    const navUrl = guide.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(navUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-umak-navy via-umak-navydark to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden flex-shrink-0">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-${guide.color}-500/20 text-${guide.color}-300 border border-${guide.color}-400/30`}>
                {guide.badge}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                <i className="fa-brands fa-google mr-1"></i> Google Maps Navigation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display flex items-center gap-2">
              <i className={`fa-solid ${guide.icon} text-umak-orange text-lg sm:text-xl`}></i>
              {guide.title}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-building text-umak-orange/80"></i>
              {guide.building}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tab Switcher & Navigation Bar */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-umak-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-map-location-dot text-umak-orange"></i>
              <span>Interactive Google Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'steps'
                  ? 'bg-umak-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-list-ol text-emerald-400"></i>
              <span>Step-by-Step Directions ({guide.steps.length})</span>
            </button>
          </div>

          {/* Transport Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTransportMode('car')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                transportMode === 'car' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-car"></i> Car
            </button>
            <button
              type="button"
              onClick={() => setTransportMode('motorcycle')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                transportMode === 'motorcycle' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-motorcycle"></i> Motorcycle
            </button>
            <button
              type="button"
              onClick={() => setTransportMode('walk')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                transportMode === 'walk' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-person-walking"></i> Walk
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: INTERACTIVE GOOGLE MAP */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              
              {/* Map Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Campus Entrance Gate:</span>
                  <select
                    value={selectedGate.id}
                    onChange={(e) => {
                      const gate = CAMPUS_GATES.find(g => g.id === e.target.value);
                      if (gate) {
                        setSelectedGate(gate);
                        if (mapRef.current) {
                          mapRef.current.panTo({ lat: gate.lat, lng: gate.lng });
                        }
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-umak-navy focus:outline-none focus:border-umak-orange shadow-sm cursor-pointer"
                  >
                    {CAMPUS_GATES.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Map Type Switcher (Satellite vs Roadmap) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMapType('hybrid')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      mapType === 'hybrid' ? 'bg-umak-navy text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-satellite"></i> Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('roadmap')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      mapType === 'roadmap' ? 'bg-umak-navy text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-map"></i> Map
                  </button>
                </div>

                {/* GPS Locate Me Button */}
                <button
                  type="button"
                  onClick={handleLocateUser}
                  disabled={isLocating}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i> Locating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-location-crosshairs"></i> My Location (GPS)
                    </>
                  )}
                </button>
              </div>

              {/* GPS Status Message */}
              {gpsMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-blue-600"></i>
                  <span>{gpsMessage}</span>
                </div>
              )}
              {gpsError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                  <span>{gpsError}</span>
                </div>
              )}

              {/* MAP CONTAINER */}
              <div className="h-[380px] sm:h-[440px] w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative bg-slate-200">
                {!isLoaded ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-slate-100">
                    <i className="fa-solid fa-spinner animate-spin text-3xl text-umak-orange"></i>
                    <p className="text-xs font-bold text-slate-600">Loading Google Maps Satellite Engine...</p>
                  </div>
                ) : loadError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-red-50 text-red-700">
                    <i className="fa-solid fa-circle-exclamation text-3xl text-red-500"></i>
                    <p className="font-bold text-sm">Failed to load Google Maps API.</p>
                    <p className="text-xs">Please ensure your Google Maps API Key is valid and enabled for Maps JavaScript API.</p>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: guide.lat, lng: guide.lng }}
                    zoom={18.5}
                    mapTypeId={mapType}
                    onLoad={onMapLoad}
                    onUnmount={onMapUnmount}
                    options={{
                      tilt: 45,
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,
                    }}
                  >
                    {/* Route Polyline Path */}
                    {routePolylinePath.length > 1 && (
                      <PolylineF
                        path={routePolylinePath}
                        options={{
                          strokeColor: '#F5821F',
                          strokeOpacity: 0.9,
                          strokeWeight: 6,
                        }}
                      />
                    )}

                    {/* Destination Marker */}
                    <MarkerF
                      position={{ lat: guide.lat, lng: guide.lng }}
                      title={guide.title}
                      onClick={() => setSelectedMarker({ type: 'destination', ...guide })}
                    />

                    {/* Campus Gates Markers */}
                    {CAMPUS_GATES.map((gate) => (
                      <MarkerF
                        key={gate.id}
                        position={{ lat: gate.lat, lng: gate.lng }}
                        title={gate.name}
                        onClick={() => setSelectedMarker({ type: 'gate', ...gate })}
                      />
                    ))}

                    {/* User GPS Location Marker */}
                    {userGpsLocation && (
                      <MarkerF
                        position={userGpsLocation}
                        title="Your Current GPS Position"
                        onClick={() => setSelectedMarker({ type: 'user', title: 'Your Position', lat: userGpsLocation.lat, lng: userGpsLocation.lng })}
                      />
                    )}

                    {/* InfoWindow Popup */}
                    {selectedMarker && (
                      <InfoWindowF
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div className="p-1 max-w-xs space-y-1 font-sans text-slate-800">
                          <h4 className="font-bold text-xs text-umak-navy">
                            {selectedMarker.title || selectedMarker.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-tight">
                            {selectedMarker.description || selectedMarker.building || 'Selected Campus Point'}
                          </p>
                        </div>
                      </InfoWindowF>
                    )}
                  </GoogleMap>
                )}

                {/* Satellite Badge Overlay */}
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[11px] font-bold border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>UMak Campus Satellite GPS</span>
                </div>
              </div>

              {/* Direct Open in Google Maps App Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-umak-navy to-umak-navydark p-4 rounded-2xl text-white shadow-md">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                    <i className="fa-brands fa-google text-amber-400"></i> Turn-by-Turn GPS Driving & Walking
                  </h4>
                  <p className="text-xs text-slate-300">
                    Open turn-by-turn navigation directly in your phone's Google Maps app.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGoogleMapsApp}
                  className="px-4 py-2.5 bg-umak-orange hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <i className="fa-solid fa-diamond-turn-right text-sm"></i>
                  <span>Start Navigation in Google Maps</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: STEP-BY-STEP DIRECTIONS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="bg-umak-navy/5 border border-umak-navy/15 p-4 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-umak-orange uppercase tracking-wider">Campus Gate Selected</span>
                  <h4 className="font-extrabold text-sm text-umak-navy">{selectedGate.name}</h4>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs">
                  <i className="fa-solid fa-route text-amber-500 mr-1"></i> {guide.steps.length} Steps
                </span>
              </div>

              <div className="space-y-3">
                {guide.steps.map((s) => (
                  <div
                    key={s.step}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-umak-orange/40 rounded-2xl transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-umak-navy to-umak-navydark text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                      {s.step}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <i className={`fa-solid ${s.icon} text-umak-orange text-xs`}></i>
                        {s.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips Section */}
              {guide.tips && guide.tips.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                    <i className="fa-solid fa-lightbulb text-amber-500"></i> Helpful Campus Security Tips:
                  </h5>
                  <ul className="list-disc list-inside text-xs text-amber-900/80 space-y-1 font-medium">
                    {guide.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-slate-500 font-medium hidden sm:inline">
            University of Makati — Smart Campus Parking & Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
