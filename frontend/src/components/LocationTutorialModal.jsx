import React, { useState, useEffect, useRef } from 'react';
import { getGuideForLocation, CAMPUS_GATES, UMAK_COORDINATES } from '../data/locationGuides';

export default function LocationTutorialModal({ isOpen, onClose, locationTarget }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'steps'
  const [selectedGate, setSelectedGate] = useState(CAMPUS_GATES[0]);
  const [transportMode, setTransportMode] = useState('car'); // 'car' | 'motorcycle' | 'walk'
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const routePolylineRef = useRef(null);
  const movingMarkerRef = useRef(null);
  const animationIntervalRef = useRef(null);

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

  // Leaflet Map Initialization & Route Animation
  useEffect(() => {
    if (!isOpen || activeTab !== 'map' || !mapContainerRef.current) return;

    const L = window.L;
    if (!L) return;

    // Destroy existing map instance if present
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([guide.lat, guide.lng], UMAK_COORDINATES.zoom);

    leafletMapRef.current = map;

    // OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom Icon Creator
    const createCustomIcon = (faClass, colorClass, label) => L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative group flex items-center justify-center">
          <div class="w-9 h-9 rounded-full ${colorClass} text-white flex items-center justify-center shadow-lg ring-4 ring-white/80 transform hover:scale-110 transition-transform">
            <i class="fa-solid ${faClass} text-base"></i>
          </div>
          ${label ? `<span class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">${label}</span>` : ''}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Destination Marker (HPSB / OHSO)
    L.marker([guide.lat, guide.lng], {
      icon: createCustomIcon(guide.icon, 'bg-gradient-to-r from-amber-500 to-orange-600', guide.title.split(' ')[0]),
    }).addTo(map).bindPopup(`<b>${guide.title}</b><br/>${guide.building}`);

    // Starting Gate Marker (Main Gate / Rembo Gate)
    const gatePos = [selectedGate.lat, selectedGate.lng];
    L.marker(gatePos, {
      icon: createCustomIcon(selectedGate.icon, 'bg-slate-900', selectedGate.name.split(' ')[0]),
    }).addTo(map).bindPopup(`<b>${selectedGate.name}</b>`);

    // Road Waypoints: Gate -> Road Points -> HPSB Entrance Driveway -> Destination
    const waypoints = [
      gatePos,
      ...guide.waypoints,
      [guide.lat, guide.lng]
    ];

    // Animated Polyline Route following the roads
    const polyline = L.polyline(waypoints, {
      color: transportMode === 'motorcycle' ? '#f97316' : transportMode === 'car' ? '#10b981' : '#3b82f6',
      weight: 6,
      opacity: 0.85,
      dashArray: '10, 10',
      lineCap: 'round',
    }).addTo(map);
    routePolylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Moving Vehicle/Walker Animation Marker
    const vehicleIconClass = transportMode === 'motorcycle'
      ? 'fa-motorcycle'
      : transportMode === 'car'
        ? 'fa-car-side'
        : 'fa-person-walking';

    const vehicleBgClass = transportMode === 'motorcycle'
      ? 'bg-orange-500 ring-orange-300'
      : transportMode === 'car'
        ? 'bg-emerald-600 ring-emerald-300'
        : 'bg-blue-600 ring-blue-300';

    const movingIcon = L.divIcon({
      className: 'moving-marker-icon',
      html: `
        <div class="w-9 h-9 rounded-full ${vehicleBgClass} text-white flex items-center justify-center shadow-2xl ring-4 transform transition-all duration-300">
          <i class="fa-solid ${vehicleIconClass} text-base animate-pulse"></i>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    let currentWaypointIdx = 0;
    const movingMarker = L.marker(waypoints[0], { icon: movingIcon }).addTo(map);
    movingMarkerRef.current = movingMarker;

    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    animationIntervalRef.current = setInterval(() => {
      currentWaypointIdx = (currentWaypointIdx + 1) % waypoints.length;
      movingMarker.setLatLng(waypoints[currentWaypointIdx]);
    }, 1100);

    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, activeTab, selectedGate, transportMode, guide]);

  // Handle User Geolocation Request with distance calculation
  const handleGetGps = () => {
    setIsLocating(true);
    setGpsError(null);
    setGpsMessage(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserGpsLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        // Distance to UMak Main Gate in KM (Haversine formula)
        const R = 6371; // Earth radius in km
        const dLat = (14.56360 - latitude) * (Math.PI / 180);
        const dLng = (121.05560 - longitude) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * (Math.PI / 180)) * Math.cos(14.56360 * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = (R * c).toFixed(1);

        setGpsMessage(`GPS position detected (${distanceKm} km from UMak Campus). Displaying route to destination.`);

        if (leafletMapRef.current) {
          const L = window.L;
          const userIcon = L.divIcon({
            className: 'user-gps-marker',
            html: `
              <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-300 animate-pulse">
                <i class="fa-solid fa-location-crosshairs text-base"></i>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(leafletMapRef.current)
            .bindPopup(`<b>Your GPS Location</b><br/>${distanceKm} km from UMak Campus`)
            .openPopup();

          leafletMapRef.current.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        setGpsError('Unable to retrieve exact GPS location. Please check browser permissions.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-tutorial-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-umak-blue to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center text-xl shadow-inner">
              <i className={`fa-solid ${guide.icon}`}></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {guide.badge}
                </span>
                <span className="text-xs text-slate-300">UMak Campus Navigation</span>
              </div>
              <h2 id="location-tutorial-title" className="text-xl font-bold tracking-tight text-white mt-0.5">
                How to Get To: {guide.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            aria-label="Close location tutorial"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tab Switcher & Navigation Toolbar */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>Interactive Map & Route</span>
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Step-by-Step Guide</span>
            </button>
          </div>

          {/* Quick External Navigation Button */}
          <a
            href={userGpsLocation ? `https://www.google.com/maps/dir/?api=1&origin=${userGpsLocation.lat},${userGpsLocation.lng}&destination=${guide.lat},${guide.lng}` : guide.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all group cursor-pointer"
          >
            <i className="fa-solid fa-diamond-turn-right group-hover:scale-110 transition-transform"></i>
            <span>Open Live Google Maps</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-xs opacity-75"></i>
          </a>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'map' && (
            <div className="space-y-4">
              
              {/* Transport Vehicle Mode & Entry Selector Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 items-end">
                
                {/* Vehicle Mode Toggle */}
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Transport Vehicle Figure:
                  </label>
                  <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setTransportMode('car')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        transportMode === 'car'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-car-side"></i>
                      <span>Car</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportMode('motorcycle')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        transportMode === 'motorcycle'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-motorcycle"></i>
                      <span>Motorcycle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportMode('walk')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        transportMode === 'walk'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-person-walking"></i>
                      <span>Walking</span>
                    </button>
                  </div>
                </div>

                {/* Entry Gate Select */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Starting Entry Gate:
                  </label>
                  <select
                    value={selectedGate.id}
                    onChange={(e) => {
                      const gate = CAMPUS_GATES.find(g => g.id === e.target.value);
                      if (gate) setSelectedGate(gate);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {CAMPUS_GATES.map((gate) => (
                      <option key={gate.id} value={gate.id}>
                        {gate.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GPS Button */}
                <div className="md:col-span-3">
                  <button
                    onClick={handleGetGps}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <i className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
                    <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
                  </button>
                </div>
              </div>

              {gpsMessage && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs rounded-xl flex items-center space-x-2">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>{gpsMessage}</span>
                </div>
              )}

              {gpsError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Leaflet Map Canvas */}
              <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full z-10"></div>

                {/* Map Overlay Badge showing vehicle type */}
                <div className="absolute top-3 right-3 z-20 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 backdrop-blur-md flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="capitalize">Animated {transportMode} Following Campus Road Path</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start space-x-3">
                <i className="fa-solid fa-circle-info text-amber-600 dark:text-amber-400 text-lg mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Destination: {guide.building}</h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400/90 mt-0.5">
                    Follow the numbered steps below to navigate smoothly from campus entrance.
                  </p>
                </div>
              </div>

              {/* Step List Timeline */}
              <div className="relative border-l-2 border-amber-500/40 ml-4 pl-6 space-y-6">
                {guide.steps.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900">
                      {item.step}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 transition-colors">
                      <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-1">
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campus Pro Tips */}
              {guide.tips && guide.tips.length > 0 && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1.5">
                    <i className="fa-solid fa-lightbulb text-amber-400"></i>
                    <span>Campus Navigation Tips</span>
                  </h5>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
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
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <i className="fa-solid fa-location-dot text-amber-500"></i>
            <span>University of Makati, West Rembo, Taguig</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}
