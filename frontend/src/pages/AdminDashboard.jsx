import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { DocumentInspectorModal } from '../components/DocumentInspectorModal';
import { useParkingData } from '../hooks/useParkingData';
import { API_BASE_URL } from '../config/api';

export const AdminDashboard = () => {
  const { currentUser, logoutUser, loading: authLoading, authFetch } = useAuth();
  const navigate = useNavigate();
  const { lots } = useParkingData();

  const [activeAdminTab, setActiveAdminTab] = useState('stickers'); // 'stickers' | 'guests' | 'parking' | 'users'
  const [adminStickers, setAdminStickers] = useState([]);
  const [adminGuestReservations, setAdminGuestReservations] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Selected application for document inspector modal
  const [inspectApplication, setInspectApplication] = useState(null);



  // Fetch admin stickers
  const fetchAdminStickers = async () => {
    setLoadingData(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setAdminStickers(data);
      }
    } catch (e) {}
    setLoadingData(false);
  };

  // Fetch guest reservations
  const fetchAdminGuestReservations = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/guests/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setAdminGuestReservations(data);
      }
    } catch (e) {}
  };

  // Fetch admin users for Account Security tab
  const fetchAdminUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminStickers();
      fetchAdminGuestReservations();
      fetchAdminUsers();
    }
  }, [currentUser]);

  const handleGuestStatusUpdate = async (id, status) => {
    setActionMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/guests/admin/update-status`, {
        method: 'POST',
        body: JSON.stringify({ id, status, admin_remarks: `OHSO Admin updated status to ${status}` })
      });
      if (res.ok) {
        setActionMessage(`Guest reservation #${id} status updated to "${status}".`);
        fetchAdminGuestReservations();
      }
    } catch (e) {}
  };

  // Admin Approve / Reject Action
  const handleAdminStatusUpdate = async (id, status, vehicle_type) => {
    setActionMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/update`, {
        method: 'POST',
        body: JSON.stringify({ id, status, vehicle_type, admin_remarks: `OHSO Admin processed status to ${status}.` })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Application #${id} updated to "${status}". ${data.stickerNumber ? `Issued: ${data.stickerNumber}` : ''}`);
        fetchAdminStickers();
      }
    } catch (e) {}
  };

  // Admin Unlock User Action
  const handleAdminUnlockUser = async (userId, userEmail) => {
    setActionMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/admin/unlock-user`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Account (${userEmail}) unlocked successfully! Notification email sent.`);
        fetchAdminUsers();
      } else {
        setActionMessage(`Error: ${data.error || 'Failed to unlock user.'}`);
      }
    } catch (e) {
      setActionMessage('Connection error. Could not unlock user.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="fa-solid fa-spinner animate-spin text-3xl text-umak-orange"></i>
          <p className="text-xs font-bold text-slate-600">Loading OHSO Admin Security Portal...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') return null;

  // Key Metrics Calculation
  const totalStickersApplied = adminStickers.length;
  const totalApprovedStickers = adminStickers.filter(s => s.status === 'approved' || s.status === 'issued').length;
  const totalPendingStickers = adminStickers.filter(s => s.status === 'pending').length;
  const totalRevenueCollected = totalApprovedStickers * 200.00;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <main className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto space-y-8">
        
        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-umak-navy to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-shield-halved mr-1"></i> OHSO Security & Admin Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display">
              Administrator Dashboard
            </h1>
            <p className="text-slate-300 text-sm max-w-lg">
              Manage campus vehicle sticker approvals, online payments (₱200), live parking operations, and document verifications.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 min-h-[42px]"
            >
              <i className="fa-solid fa-gauge"></i> Live Monitor
            </Link>

            <button
              onClick={() => { logoutUser(); navigate('/'); }}
              className="px-5 py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer min-h-[42px]"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>

        {/* METRICS STATS BAR WITH PERFECT EQUAL CARD HEIGHTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-200 flex-shrink-0">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approval</p>
              <h3 className="text-2xl font-extrabold font-display text-amber-600 mt-0.5">{totalPendingStickers} Requests</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-200 flex-shrink-0">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stickers Issued</p>
              <h3 className="text-2xl font-extrabold font-display text-emerald-600 mt-0.5">{totalApprovedStickers} Active</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-200 flex-shrink-0">
              <i className="fa-solid fa-peso-sign"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-extrabold font-display text-slate-900 mt-0.5">₱{totalRevenueCollected.toFixed(2)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-umak-navy/10 text-umak-navy flex items-center justify-center text-xl border border-umak-navy/20 flex-shrink-0">
              <i className="fa-solid fa-list-ol"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
              <h3 className="text-2xl font-extrabold font-display text-slate-900 mt-0.5">{totalStickersApplied} Total</h3>
            </div>
          </div>

        </div>

        {/* Action Alert Message */}
        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage('')} className="text-emerald-700 hover:text-emerald-900">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* ADMIN TAB NAVIGATION */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('stickers')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeAdminTab === 'stickers'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-id-card text-umak-orange"></i>
            <span>Vehicle Sticker Applications ({totalPendingStickers} Pending)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('guests')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeAdminTab === 'guests'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-calendar-check text-emerald-400"></i>
            <span>Guest & Event Reservations ({adminGuestReservations.filter(g => g.status === 'pending').length} Pending)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('parking')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeAdminTab === 'parking'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-building text-umak-orange"></i>
            <span>HPSB Operations Overview</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
              activeAdminTab === 'users'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-shield-halved text-red-400"></i>
            <span>Account Security & Lockouts</span>
            {adminUsers.filter(u => u.unlock_requested || (u.locked_until && new Date(u.locked_until) > new Date())).length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold animate-pulse">
                {adminUsers.filter(u => u.unlock_requested || (u.locked_until && new Date(u.locked_until) > new Date())).length}
              </span>
            )}
          </button>
        </div>

        {/* ===== SECTION 1: VEHICLE STICKER APPLICATIONS TABLE ===== */}
        {activeAdminTab === 'stickers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">Vehicle Sticker Submissions & Document Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click "Inspect Photos" to view uploaded LTO OR/CR, License, and Student ID documents.</p>
              </div>

              <button
                onClick={fetchAdminStickers}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-rotate-right"></i> Refresh Table
              </button>
            </div>

            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-3.5 rounded-l-xl">Applicant / ID</th>
                    <th className="p-3.5">Vehicle Info & Plate</th>
                    <th className="p-3.5">LTO OR/CR & License</th>
                    <th className="p-3.5">Uploaded Documents</th>
                    <th className="p-3.5">Payment Ref (₱200)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">OHSO Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminStickers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No sticker applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    adminStickers.map((stk) => (
                      <tr key={stk.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{stk.applicant_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{stk.email}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-umak-navy font-bold font-mono text-[10px] inline-block mt-1">
                            {stk.student_id_num}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 font-mono block text-sm">{stk.plate_number}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{stk.vehicle_make} ({stk.vehicle_type})</span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600">
                          <div>OR: <strong>{stk.or_number}</strong></div>
                          <div>CR: <strong>{stk.cr_number}</strong></div>
                          <div>Lic: <strong>{stk.license_number}</strong></div>
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
                            <span className="block text-[11px] font-mono text-umak-navy font-bold mt-1.5">
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
                              <i className="fa-solid fa-circle-check"></i> Sticker Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SECTION 2: GUEST & EVENT RESERVATIONS TABLE ===== */}
        {activeAdminTab === 'guests' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">Guest & Event Parking Pass Reservations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review visitor parking passes, event details, host contact persons, and plate numbers.</p>
              </div>

              <button
                onClick={fetchAdminGuestReservations}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-rotate-right"></i> Refresh Table
              </button>
            </div>

            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-3.5 rounded-l-xl">Pass Ref / Date</th>
                    <th className="p-3.5">Event Name & Kind</th>
                    <th className="p-3.5">Guest & Plate</th>
                    <th className="p-3.5">Venue & Time</th>
                    <th className="p-3.5">Host Point Person</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminGuestReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No guest parking reservations submitted yet.
                      </td>
                    </tr>
                  ) : (
                    adminGuestReservations.map((gst) => (
                      <tr key={gst.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-700 font-mono block text-xs">{gst.pass_code}</span>
                          <span className="text-[11px] text-slate-400">{new Date(gst.event_date).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{gst.event_name}</span>
                          <span className="text-[11px] text-slate-500 uppercase font-mono">{gst.event_kind} ({gst.requestee_role})</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{gst.guest_name}</span>
                          <span className="text-[11px] font-mono text-slate-600 font-bold uppercase">{gst.plate_number} • {gst.vehicle_details}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{gst.building_room}</span>
                          <span className="text-[11px] text-slate-500">{gst.time_start} - {gst.time_end}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{gst.point_person_name}</span>
                          <span className="text-[11px] font-mono text-slate-500">{gst.point_person_contact}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border capitalize ${
                            gst.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : gst.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {gst.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {gst.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleGuestStatusUpdate(gst.id, 'approved')}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-check text-xs"></i> Approve Pass
                              </button>
                              <button
                                onClick={() => handleGuestStatusUpdate(gst.id, 'rejected')}
                                className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-red-200"
                              >
                                <i className="fa-solid fa-xmark text-xs"></i> Reject
                              </button>
                            </div>
                          )}
                          {gst.status === 'approved' && (
                            <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                              <i className="fa-solid fa-circle-check"></i> E-Pass Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SECTION 3: HPSB PARKING OPERATIONS OVERVIEW ===== */}
        {activeAdminTab === 'parking' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900">HPSB Building Floor Levels Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of Level 1 to Level 4 parking capacity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {lots.map((lot) => {
                const free = lot.availableSlots !== undefined ? lot.availableSlots : (lot.totalSlots - lot.occupiedSlots);
                const percent = Math.round(((lot.occupiedSlots || 0) / lot.totalSlots) * 100);
                return (
                  <div key={lot.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-xs text-umak-navy bg-white px-2 py-0.5 rounded border border-slate-200">
                          {lot.code}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{percent}% Occupied</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">{lot.name}</h4>
                    </div>

                    <div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full transition-all ${percent >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-emerald-600 font-bold">{free} Free Slots</span>
                        <span className="text-red-600 font-bold">{lot.occupiedSlots || 0} Occupied</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== SECTION 4: ACCOUNT SECURITY & USER LOCKOUT MANAGEMENT ===== */}
        {activeAdminTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">Account Security & User Lockout Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">View user security status, failed login attempts, and process account unlock requests.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  Total Accounts: {adminUsers.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                  Locked: {adminUsers.filter(u => u.locked_until && new Date(u.locked_until) > new Date()).length}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200">
                  Unlock Requested: {adminUsers.filter(u => u.unlock_requested === 1).length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold bg-slate-50/50">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email Verified</th>
                    <th className="py-3 px-4">Failed Attempts</th>
                    <th className="py-3 px-4">Lockout / Security Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                        No registered users found in database.
                      </td>
                    </tr>
                  ) : (
                    adminUsers.map(u => {
                      const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
                      const minutesLeft = isLocked ? Math.ceil((new Date(u.locked_until) - new Date()) / 60000) : 0;
                      const hasRequestedUnlock = u.unlock_requested === 1;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                              u.role === 'admin'
                                ? 'bg-umak-navy text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {u.is_verified ? (
                              <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                                <i className="fa-solid fa-circle-check text-xs"></i> Verified
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                                <i className="fa-solid fa-clock text-xs"></i> Pending OTP
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`font-mono font-bold ${u.failed_login_attempts > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {u.failed_login_attempts || 0} / 5
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isLocked ? (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] inline-flex items-center gap-1">
                                  <i className="fa-solid fa-lock text-red-500"></i> Locked ({minutesLeft}m left)
                                </span>
                                {hasRequestedUnlock && (
                                  <div className="text-[10px] text-amber-600 font-extrabold animate-pulse">
                                    ⚡ Requested Unlock from Admin
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                                <i className="fa-solid fa-shield-check text-emerald-500"></i> Active & Normal
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isLocked || hasRequestedUnlock || u.failed_login_attempts > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAdminUnlockUser(u.id, u.email)}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-key"></i> Unlock Account
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium">No Action Needed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* UPLOADED DOCUMENTS INSPECTOR MODAL */}
      <DocumentInspectorModal
        isOpen={Boolean(inspectApplication)}
        onClose={() => setInspectApplication(null)}
        application={inspectApplication}
      />
    </div>
  );
};
