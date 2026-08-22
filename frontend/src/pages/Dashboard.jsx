import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ParkingLotCard } from '../components/ParkingLotCard';
import { InspectLotModal } from '../components/InspectLotModal';
import { StickerApplicationModal } from '../components/StickerApplicationModal';
import { DocumentInspectorModal } from '../components/DocumentInspectorModal';
import { GuestReservationModal } from '../components/GuestReservationModal';
import LocationTutorialModal from '../components/LocationTutorialModal';
import { useParkingData } from '../hooks/useParkingData';
import { API_BASE_URL } from '../config/api';

export const Dashboard = () => {
  const { currentUser, logoutUser, loading: authLoading, authFetch } = useAuth();
  const navigate = useNavigate();
  const { lots } = useParkingData();

  const isAdmin = currentUser?.role === 'admin';

  // Navigation Sub-tab: default 'monitor'
  const [dashboardTab, setDashboardTab] = useState('monitor');

  // Monitor Filters
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);

  // Sticker Application Modal & User Stickers
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [userStickers, setUserStickers] = useState([]);
  const [adminStickers, setAdminStickers] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(false);

  // Selected application for document inspector modal
  const [inspectApplication, setInspectApplication] = useState(null);

  // Location tutorial state
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialTarget, setTutorialTarget] = useState(null);

  const handleOpenDirections = (target) => {
    setTutorialTarget(target);
    setIsTutorialOpen(true);
  };



  // Fetch user stickers (for regular users)
  const fetchUserStickers = async () => {
    if (!currentUser || isAdmin) return;
    setLoadingStickers(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/user/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserStickers(data);
      }
    } catch (e) {}
    setLoadingStickers(false);
  };

  // Fetch admin stickers (for admin)
  const fetchAdminStickers = async () => {
    if (!isAdmin) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setAdminStickers(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        fetchAdminStickers();
      } else {
        fetchUserStickers();
      }
    }

    // Auto-open sticker modal if returning from PayMongo redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsStickerModalOpen(true);
    }
  }, [currentUser]);

  // Admin Approve / Reject Action
  const handleAdminStatusUpdate = async (id, status, vehicle_type) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/update`, {
        method: 'POST',
        body: JSON.stringify({ id, status, vehicle_type, admin_remarks: `OHSO Admin processed status to ${status}.` })
      });
      if (res.ok) {
        fetchAdminStickers();
      }
    } catch (e) {}
  };

  // Render clean loader while auth context restores from localStorage
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="fa-solid fa-spinner animate-spin text-3xl text-umak-orange"></i>
          <p className="text-xs font-bold text-slate-600">Loading Heron Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Calculate totals
  const totalParkingLots = lots.length;
  const totalAvailable = lots.reduce((acc, curr) => acc + (curr.availableSlots || (curr.totalSlots - curr.occupiedSlots)), 0);
  const totalOccupied = lots.reduce((acc, curr) => acc + (curr.occupiedSlots || 0), 0);
  const totalCapacity = totalAvailable + totalOccupied;
  const overallOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Filter lots
  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'available') return (lot.availableSlots || (lot.totalSlots - lot.occupiedSlots)) > 0;
    if (activeTab === 'full') return (lot.availableSlots || (lot.totalSlots - lot.occupiedSlots)) === 0;
    return true;
  });

  const activeSticker = userStickers.find(s => s.status === 'issued' || s.status === 'approved');
  const pendingSticker = userStickers.find(s => s.status === 'pending');
  const hasRejectedOnly = userStickers.length > 0 && !activeSticker && !pendingSticker && userStickers.some(s => s.status === 'rejected');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <main className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-umak-navy to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-umak-orange/10 to-transparent pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <i className="fa-solid fa-circle-check mr-1"></i> Verified (@umak.edu.ph)
              </span>
              {isAdmin && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  <i className="fa-solid fa-shield-halved mr-1"></i> OHSO Administrator Role
                </span>
              )}
              {!isAdmin && activeSticker && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  <i className="fa-solid fa-id-card mr-1"></i> UMak Sticker Active
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display">
              Welcome back, {currentUser.name}! 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-lg">
              {isAdmin
                ? 'OHSO Security Management. Monitor HPSB Building parking and review campus vehicle sticker applications.'
                : 'Official University of Makati Heron Portal. Monitor HPSB Building parking or apply for your UMak Vehicle Sticker.'}
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[42px]"
              >
                <i className="fa-solid fa-shield-halved"></i> Open OHSO Admin Portal
              </button>
            )}

            <button
              onClick={() => { logoutUser(); navigate('/'); }}
              className="px-5 py-2.5 bg-white/10 hover:bg-red-600/80 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer min-h-[42px]"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>

        {/* DASHBOARD TAB SWITCHER NAVIGATION */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto">
          <button
            onClick={() => setDashboardTab('monitor')}
            className={`flex-1 min-w-[150px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              dashboardTab === 'monitor'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-satellite-dish text-umak-orange"></i>
            <span>Live Parking Monitor</span>
          </button>

          {/* Regular Users: Show Sticker Application Tab */}
          {!isAdmin && (
            <button
              onClick={() => setDashboardTab('sticker')}
              className={`flex-1 min-w-[150px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                dashboardTab === 'sticker'
                  ? 'bg-umak-navy text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-id-card text-umak-orange"></i>
              <span>My Vehicle Sticker</span>
              {userStickers.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-umak-orange text-white text-[10px] flex items-center justify-center font-bold">
                  {userStickers.length}
                </span>
              )}
            </button>
          )}

          {/* Admin Role: Show OHSO Admin Tab Only */}
          {isAdmin && (
            <button
              onClick={() => setDashboardTab('admin')}
              className={`flex-1 min-w-[150px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                dashboardTab === 'admin'
                  ? 'bg-umak-navy text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-shield-halved text-amber-400"></i>
              <span>OHSO Approval Requests</span>
              {adminStickers.filter(s => s.status === 'pending').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-bounce">
                  {adminStickers.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ===== TAB 1: LIVE PARKING MONITOR ===== */}
        {dashboardTab === 'monitor' && (
          <div className="space-y-8 tab-content-enter">
            {/* QUICK METRICS STATS BAR WITH PERFECT EQUAL CARD HEIGHTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="anim-pop in-view anim-delay-0 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-umak-navy/30 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-umak-navy/10 text-umak-navy flex items-center justify-center text-xl border border-umak-navy/20 flex-shrink-0">
                  <i className="fa-solid fa-building text-lg"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">HPSB Levels</p>
                  <h3 className="text-2xl font-extrabold font-display text-slate-900 mt-0.5">{totalParkingLots} Floors</h3>
                </div>
              </div>

              <div className="anim-pop in-view anim-delay-100 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-200 flex-shrink-0">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Slots</p>
                  <h3 className="text-2xl font-extrabold font-display text-emerald-600 mt-0.5">{totalAvailable} Free</h3>
                </div>
              </div>

              <div className="anim-pop in-view anim-delay-200 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-red-300 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl border border-red-200 flex-shrink-0">
                  <i className="fa-solid fa-car"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupied Slots</p>
                  <h3 className="text-2xl font-extrabold font-display text-red-600 mt-0.5">{totalOccupied} Parked</h3>
                </div>
              </div>

              <div className="anim-pop in-view anim-delay-300 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-orange-300 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-umak-orange flex items-center justify-center text-xl border border-orange-200 flex-shrink-0">
                  <i className="fa-solid fa-chart-pie"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupancy Rate</p>
                  <h3 className="text-2xl font-extrabold font-display text-slate-900 mt-0.5">{overallOccupancyRate}%</h3>
                </div>
              </div>
            </div>

            {/* LIVE PARKING MONITOR GRID */}
            <section id="monitor" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest mb-2">
                    <i className="fa-solid fa-satellite-dish animate-pulse"></i> Live Operations Grid
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                    HPSB Building Parking Levels
                  </h2>
                  <p className="text-slate-600 text-sm mt-1 max-w-xl font-medium">
                    Filter by status or search for specific floor levels (Level 1 to 4) inside the HPSB Building.
                  </p>
                </div>

                {/* Filters & Search Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Search level or floor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:ring-2 focus:ring-amber-500/20 shadow-sm transition-all h-10"
                    />
                  </div>

                  <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 w-full sm:w-auto h-10">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'all' ? 'bg-umak-navy text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      All Levels
                    </button>
                    <button
                      onClick={() => setActiveTab('available')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'available' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => setActiveTab('full')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'full' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Full
                    </button>
                  </div>
                </div>
              </div>

              {/* PARKING LOTS GRID WITH EQUAL HEIGHT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {filteredLots.map((lot, idx) => (
                  <div
                    key={lot.id}
                    className="anim-fade-up in-view h-full"
                    style={{ transitionDelay: `${idx * 80}ms` }}
                  >
                    <ParkingLotCard
                      lot={lot}
                      onInspect={(l) => setSelectedLot(l)}
                      onOpenDirections={handleOpenDirections}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 2: MY VEHICLE STICKER (REGULAR USER ONLY) ===== */}
        {!isAdmin && dashboardTab === 'sticker' && (
          <div className="space-y-8 tab-content-enter">
            
            {/* Top Action Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-umak-orange uppercase tracking-wider">OHSO Vehicle Registration</span>
                <h2 className="text-2xl font-bold font-display text-slate-900">UMak Vehicle Sticker System</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Apply online, pay your ₱200 fee via GCash/Maya/Card, and skip the Cash Office physical queue!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setIsGuestModalOpen(true)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                >
                  <i className="fa-solid fa-calendar-check"></i>
                  <span>Guest / Visitor Parking Pass</span>
                </button>

                {activeSticker ? (
                  <div className="px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                    <span>Sticker Issued & Active</span>
                  </div>
                ) : pendingSticker ? (
                  <div className="px-5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-2">
                    <i className="fa-solid fa-clock animate-pulse text-amber-600 text-base"></i>
                    <span>Application Pending OHSO Review</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsStickerModalOpen(true)}
                    className="px-6 py-3 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                    <span>{hasRejectedOnly ? 'Re-apply for UMak Sticker (₱200.00)' : 'Apply for UMak Sticker (₱200.00)'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Issued Sticker Digital Card */}
            {activeSticker && (
              <div className="bg-gradient-to-r from-umak-navy via-slate-900 to-umak-navydark text-white rounded-3xl p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                      <i className="fa-solid fa-circle-check mr-1"></i> Active Official Sticker
                    </span>
                    <h3 className="text-3xl font-extrabold font-mono tracking-wider text-amber-400">
                      {activeSticker.sticker_number || 'UMAK-2026-CAR-0842'}
                    </h3>
                    <p className="text-sm text-slate-300">
                      Registered to <strong>{activeSticker.applicant_name}</strong> ({activeSticker.student_id_num})
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-2">
                      <span>Plate: <strong className="text-white">{activeSticker.plate_number}</strong></span>
                      <span>Type: <strong className="text-white uppercase">{activeSticker.vehicle_type}</strong></span>
                      <span>Valid: <strong className="text-emerald-400">1 Year (2026-2027)</strong></span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center space-y-2 min-w-[200px]">
                    <i className="fa-solid fa-barcode text-4xl text-slate-300"></i>
                    <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">OHSO Verified Digital Badge</p>
                    <span className="inline-block px-3 py-1 rounded-md bg-emerald-500 text-white font-bold text-xs">
                      ₱200.00 Paid ({activeSticker.payment_method.toUpperCase()})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Applications History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-receipt text-umak-orange"></i> My Sticker Applications & Receipts
              </h3>

              {userStickers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <i className="fa-solid fa-id-card text-4xl text-slate-400 mb-3"></i>
                  <h4 className="text-base font-bold text-slate-800">No Vehicle Stickers Applied Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Submit your vehicle details online and pay ₱200 via GCash/Maya to secure your official UMak vehicle sticker.
                  </p>
                  <button
                    onClick={() => setIsStickerModalOpen(true)}
                    className="px-5 py-2.5 bg-umak-navy text-white text-xs font-bold rounded-xl hover:bg-umak-navydark transition-colors cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto touch-scroll">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <th className="p-3.5 rounded-l-xl">Ref / Date</th>
                        <th className="p-3.5">Vehicle Make & Plate</th>
                        <th className="p-3.5">Payment Ref (₱200)</th>
                        <th className="p-3.5">Uploaded Docs</th>
                        <th className="p-3.5">OHSO Status</th>
                        <th className="p-3.5 rounded-r-xl">Assigned Sticker No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {userStickers.map((stk) => (
                        <tr key={stk.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{stk.student_id_num}</span>
                            <span className="text-[11px] text-slate-400">{new Date(stk.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 font-mono block">{stk.plate_number}</span>
                            <span className="text-[11px] text-slate-500 capitalize">{stk.vehicle_make} ({stk.vehicle_type})</span>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-emerald-600 block">{stk.payment_ref_no}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{stk.payment_method} PAID</span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => setInspectApplication(stk)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-umak-navy hover:text-white text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              <i className="fa-solid fa-eye text-umak-orange"></i> View Uploads
                            </button>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border capitalize ${
                              stk.status === 'issued' || stk.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : stk.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {stk.status}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-umak-navy">
                            {stk.sticker_number ? stk.sticker_number : <span className="text-slate-400 font-normal italic">Pending OHSO Pickup</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB 3: OHSO ADMIN APPROVAL REQUESTS (ADMIN ONLY) ===== */}
        {isAdmin && dashboardTab === 'admin' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">OHSO Security Portal</span>
                <h3 className="text-xl font-bold font-display text-slate-900">Vehicle Sticker Verification & Document Inspection</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs border border-slate-200">
                {adminStickers.length} Total Submissions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-3.5 rounded-l-xl">Applicant & ID</th>
                    <th className="p-3.5">Plate & Type</th>
                    <th className="p-3.5">LTO OR/CR & License</th>
                    <th className="p-3.5">Uploaded Documents</th>
                    <th className="p-3.5">Payment Ref (₱200)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">OHSO Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminStickers.map((stk) => (
                    <tr key={stk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{stk.applicant_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{stk.email} ({stk.student_id_num})</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 font-mono block">{stk.plate_number}</span>
                        <span className="text-[11px] text-slate-500 capitalize">{stk.vehicle_make}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        <div>OR: {stk.or_number}</div>
                        <div>CR: {stk.cr_number}</div>
                        <div>Lic: {stk.license_number}</div>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => setInspectApplication(stk)}
                          className="px-3 py-1.5 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-images text-amber-400"></i> Inspect Photos
                        </button>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-emerald-600 block">{stk.payment_ref_no}</span>
                        <span className="text-[10px] text-slate-500 uppercase">₱200.00 ({stk.payment_method})</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border capitalize ${
                          stk.status === 'approved' || stk.status === 'issued'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : stk.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {stk.status}
                        </span>
                        {stk.sticker_number && (
                          <span className="block text-[10px] font-mono text-umak-navy font-bold mt-1">
                            {stk.sticker_number}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {stk.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => handleAdminStatusUpdate(stk.id, 'approved', stk.vehicle_type)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <i className="fa-solid fa-check text-xs"></i> Approve & Issue
                            </button>
                            <button
                              onClick={() => handleAdminStatusUpdate(stk.id, 'rejected', stk.vehicle_type)}
                              className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 border border-red-200"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i> Reject
                            </button>
                          </div>
                        )}
                        {(stk.status === 'approved' || stk.status === 'issued') && (
                          <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                            <i className="fa-solid fa-circle-check"></i> Sticker Issued
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* INSPECT LOT MODAL */}
      <InspectLotModal
        selectedLot={selectedLot}
        onClose={() => setSelectedLot(null)}
        onOpenDirections={handleOpenDirections}
      />

      {/* STICKER APPLICATION MODAL (REGULAR USER ONLY) */}
      {!isAdmin && (
        <StickerApplicationModal
          isOpen={isStickerModalOpen}
          onClose={() => setIsStickerModalOpen(false)}
          onSuccess={() => fetchUserStickers()}
        />
      )}

      {/* UPLOADED DOCUMENTS INSPECTOR MODAL */}
      <DocumentInspectorModal
        isOpen={Boolean(inspectApplication)}
        onClose={() => setInspectApplication(null)}
        application={inspectApplication}
      />

      {/* GUEST RESERVATION MODAL */}
      <GuestReservationModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        initialEmail={currentUser?.email || ''}
      />

      {/* LOCATION TUTORIAL MODAL */}
      <LocationTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        locationTarget={tutorialTarget}
      />
    </div>
  );
};
