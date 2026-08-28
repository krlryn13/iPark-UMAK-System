import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useJsApiLoader, GoogleMap, MarkerF, PolylineF, InfoWindowF } from '@react-google-maps/api';
import { getGuideForLocation, CAMPUS_GATES } from '../data/locationGuides';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};

export default function LocationTutorialModal({ isOpen, onClose, locationTarget }) {
  const [activeRightTab, setActiveRightTab] = useState('handoff'); // 'handoff' | 'steps'
  const [selectedGate, setSelectedGate] = useState(CAMPUS_GATES[0]);
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' | 'roadmap'
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapRef = useRef(null);

  // Load Google Maps JS API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Handle fallback iframe if JS API key is not present or API fails/times out
  const [showEmbedFallback, setShowEmbedFallback] = useState(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!isLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      const timer = setTimeout(() => setShowEmbedFallback(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const guide = getGuideForLocation(locationTarget?.location || locationTarget?.name || locationTarget);

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

  // Compute clean internal route polyline starting from selectedGate -> destination
  const routePolylinePath = useMemo(() => {
    const rawWaypoints = (guide.waypoints || []).map(wp => ({
      lat: Array.isArray(wp) ? wp[0] : wp.lat,
      lng: Array.isArray(wp) ? wp[1] : wp.lng,
    }));

    const destPoint = { lat: guide.lat, lng: guide.lng };
    const gatePoint = { lat: selectedGate.lat, lng: selectedGate.lng };

    // 1. If HPSB Parking Entrance Ramp is selected, show direct ramp entrance
    if (selectedGate.id === 'hpsb-gate') {
      return [
        gatePoint,
        destPoint,
      ];
    }

    // 2. If West Rembo Gate is selected, connect West Rembo -> Road Curve -> Main Gate -> Target Waypoints
    if (selectedGate.id === 'west-rembo-gate') {
      const roadCurvePoint = { lat: 14.56412, lng: 121.05620 };
      const mainGatePoint = { lat: 14.56405, lng: 121.05590 };
      return [
        gatePoint,
        roadCurvePoint,
        mainGatePoint,
        ...(rawWaypoints.length > 1 ? rawWaypoints.slice(1) : rawWaypoints),
      ];
    }

    // 3. Default Main Gate: Use rawWaypoints directly
    return rawWaypoints.length > 0 ? rawWaypoints : [gatePoint, destPoint];
  }, [selectedGate, guide]);

  // Launch Google Maps App
  const handleOpenGoogleMaps = () => {
    const navUrl = guide.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${guide.lat},${guide.lng}`;
    window.open(navUrl, '_blank', 'noopener,noreferrer');
  };

  // Launch Waze App
  const handleOpenWaze = () => {
    const wazeUrl = `https://waze.com/ul?ll=${guide.lat},${guide.lng}&navigate=yes`;
    window.open(wazeUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[95vh] lg:max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-umak-navy via-umak-navydark to-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-lg flex-shrink-0">
              <i className={`fa-solid ${guide.icon}`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {guide.badge}
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">• {guide.building}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-display leading-tight">
                {guide.title}
              </h2>
            </div>
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

        {/* MODAL BODY — SIDE-BY-SIDE ON DESKTOP */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* LEFT COLUMN: INTERACTIVE MAP (7 COLS ON DESKTOP) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Map Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Entrance Gate:</span>
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
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-umak-navy focus:outline-none focus:border-umak-orange shadow-xs cursor-pointer max-w-[200px] sm:max-w-xs truncate"
                >
                  {CAMPUS_GATES.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Map Type Switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMapType('hybrid')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    mapType === 'hybrid' ? 'bg-umak-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="fa-solid fa-satellite"></i> Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('roadmap')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    mapType === 'roadmap' ? 'bg-umak-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="fa-solid fa-map"></i> Map
                </button>
              </div>
            </div>

            {/* Map Container Container */}
            <div className="h-[320px] sm:h-[380px] lg:h-full min-h-[350px] w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative bg-slate-200 flex-1">
              {loadError || showEmbedFallback ? (
                <iframe
                  title="UMak Satellite Campus Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '1rem' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${guide.lat},${guide.lng}&z=18.5&t=${mapType === 'roadmap' ? 'm' : 'k'}&output=embed`}
                ></iframe>
              ) : !isLoaded ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-2 bg-slate-100">
                  <i className="fa-solid fa-spinner animate-spin text-2xl text-umak-orange"></i>
                  <p className="text-xs font-bold text-slate-600">Loading Real-Time Satellite Map Engine...</p>
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
                  {/* Clean Campus Internal Route Polyline */}
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

                  {/* Destination Pin Marker (GREEN PIN) */}
                  <MarkerF
                    position={{ lat: guide.lat, lng: guide.lng }}
                    title={`DESTINATION: ${guide.title}`}
                    icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    onClick={() => setSelectedMarker({ type: 'destination', ...guide })}
                  />

                  {/* Campus Gates Pins (BLUE PIN for Selected Entrance Gate, YELLOW PIN for other gates) */}
                  {CAMPUS_GATES.map((gate) => {
                    const isSelected = gate.id === selectedGate.id;
                    return (
                      <MarkerF
                        key={gate.id}
                        position={{ lat: gate.lat, lng: gate.lng }}
                        title={`${isSelected ? 'SELECTED ENTRANCE: ' : 'GATE: '}${gate.name}`}
                        icon={
                          isSelected
                            ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                        }
                        onClick={() => setSelectedMarker({ type: 'gate', ...gate })}
                      />
                    );
                  })}

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
                          {selectedMarker.description || selectedMarker.building || 'Selected Point'}
                        </p>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              )}

              {/* Satellite Badge Overlay */}
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-bold border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>UMak Campus Satellite GPS</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: APP HANDOFF & DIRECTIONS (5 COLS ON DESKTOP) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 justify-between h-full">
            
            {/* Navigation Tabs Header */}
            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-200 shadow-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveRightTab('handoff')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'handoff'
                    ? 'bg-umak-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-location-arrow text-amber-400"></i>
                <span>Turn-by-Turn GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('steps')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'steps'
                    ? 'bg-umak-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-list-ol text-emerald-400"></i>
                <span>Steps ({guide.steps.length})</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 space-y-4">
              
              {activeRightTab === 'handoff' ? (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  
                  {/* Entrance Instructions Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <i className="fa-solid fa-circle-info text-amber-600"></i>
                      <span>Selected Gate: {selectedGate.name}</span>
                    </div>
                    <p className="text-amber-800 text-[11.5px] leading-relaxed">
                      {selectedGate.description}
                    </p>
                  </div>

                  {/* App Handoff Card */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold flex items-center gap-2 text-white">
                        <i className="fa-solid fa-compass text-amber-400"></i> Real-Time Turn-by-Turn GPS
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Launch your phone's native GPS navigation app for live traffic data, voice guidance, and automatic rerouting from anywhere in Metro Manila directly to UMak:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleOpenGoogleMaps}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-brands fa-google text-sm"></i>
                        <span>Google Maps</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenWaze}
                        className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-waze text-sm"></i>
                        <span>Waze App</span>
                      </button>
                    </div>
                  </div>

                  {/* Campus Parking Tips */}
                  {guide.tips && guide.tips.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
                      <h4 className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <i className="fa-solid fa-lightbulb text-emerald-600"></i> Parking Tip
                      </h4>
                      <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                        {guide.tips[0]}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] lg:max-h-[420px] overflow-y-auto pr-1">
                  {guide.steps.map((s) => (
                    <div
                      key={s.step}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 hover:border-umak-navy/30 transition-all text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-umak-navy text-amber-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-xs font-display">
                        {s.step}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <i className={`fa-solid ${s.icon} text-umak-orange text-[11px]`}></i>
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Footer Close Button */}
            <div className="pt-2 flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Close Navigation Guide
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
