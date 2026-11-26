import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { DocumentInspectorModal } from '../components/DocumentInspectorModal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useParkingData } from '../hooks/useParkingData';
import { API_BASE_URL } from '../config/api';
import { formatDateClean, formatDateShort, formatDateInput } from '../utils/dateUtils';
import { getStatusConfig, getGuestStatusConfig, getActionMessage } from '../utils/statusConfig';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { AuditLogsTab } from '../components/admin/AuditLogsTab';
import { ReportsTab } from '../components/admin/ReportsTab';
import { DioramaTab } from '../components/admin/DioramaTab';

export const AdminDashboard = () => {
  const { currentUser, logoutUser, loading: authLoading, authFetch } = useAuth();
  const navigate = useNavigate();
  const { lots } = useParkingData();
  const { showToast, ToastContainer } = useToast();

  const [activeAdminTab, setActiveAdminTab] = useState('stickers'); // 'stickers' | 'guests' | 'parking' | 'users'
  const [adminStickers, setAdminStickers] = useState([]);
  const [adminGuestReservations, setAdminGuestReservations] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Default 30-day date range in YYYY-MM-DD
  const getDefaultDateRange = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Audit Log tab states
  const [auditData, setAuditData] = useState(null);
  const [auditCategory, setAuditCategory] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Selected application for document inspector modal
  const [inspectApplication, setInspectApplication] = useState(null);



  // Subtab under stickers: 'docs' | 'payments'
  const [stickerSubTab, setStickerSubTab] = useState('docs'); // 'docs' | 'payments'
  const [docFilter, setDocFilter] = useState('all'); // 'all' | 'pending' | 'rejected'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'needs_verification' | 'ready' | 'unpaid'

  // Approval modal state (to set pickup/claim date)
  const [approvalModalApp, setApprovalModalApp] = useState(null);
  const [claimDateInput, setClaimDateInput] = useState('');

  // Rejection modal state (to specify rejection reason)
  const [rejectionModalApp, setRejectionModalApp] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Payment hold modal state
  const [paymentHoldModalApp, setPaymentHoldModalApp] = useState(null);
  const [paymentHoldReasonInput, setPaymentHoldReasonInput] = useState('');

  // Fetch admin stickers
  const fetchAdminStickers = async () => {
    setLoadingData(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setAdminStickers(data);
      }
    } catch (e) { }
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
    } catch (e) { }
  };

  // Fetch admin users for Account Security tab
  const fetchAdminUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (e) { }
  };

  // Fetch Analytics data
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/analytics?from=${dateRange.from}&to=${dateRange.to}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) { }
    setLoadingAnalytics(false);
  };

  // Fetch Audit Logs data
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const catParam = auditCategory !== 'all' ? `&category=${auditCategory}` : '';
      const searchParam = auditSearch ? `&search=${encodeURIComponent(auditSearch)}` : '';
      const res = await authFetch(
        `${API_BASE_URL}/api/admin/audit-logs?from=${dateRange.from}&to=${dateRange.to}&page=${auditPage}&pageSize=50${catParam}${searchParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      }
    } catch (e) { }
    setLoadingAudit(false);
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminStickers();
      fetchAdminGuestReservations();
      fetchAdminUsers();
      fetchAnalytics();
      fetchAuditLogs();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'admin' && activeAdminTab === 'analytics') {
      fetchAnalytics();
    }
  }, [dateRange, activeAdminTab]);

  useEffect(() => {
    if (currentUser?.role === 'admin' && activeAdminTab === 'audit') {
      fetchAuditLogs();
    }
  }, [dateRange, auditCategory, auditSearch, auditPage, activeAdminTab]);

  const handleGuestStatusUpdate = async (id, status) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/guests/admin/update-status`, {
        method: 'POST',
        body: JSON.stringify({ id, status, admin_remarks: `OHSO Admin updated status to ${status}` })
      });
      if (res.ok) {
        showToast(
          getActionMessage(status === 'approved' ? 'approve_guest' : 'reject_guest'),
          status === 'approved' ? 'success' : 'warning'
        );
        fetchAdminGuestReservations();
      }
    } catch (e) {
      showToast('Could not update reservation. Please try again.', 'error');
    }
  };

  // Admin Approve Documents & Set Claim Date
  const handleConfirmApproval = async () => {
    if (!approvalModalApp) return;
    if (!claimDateInput) {
      showToast('Please select a pickup date before approving.', 'warning');
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/update`, {
        method: 'POST',
        body: JSON.stringify({
          id: approvalModalApp.id,
          status: 'approved',
          vehicle_type: approvalModalApp.vehicle_type,
          claim_date: claimDateInput,
          admin_remarks: `OHSO Admin verified documents. Claim date set to ${claimDateInput}.`
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(getActionMessage('approve_docs', { name: approvalModalApp.applicant_name }), 'success');
        setApprovalModalApp(null);
        setClaimDateInput('');
        fetchAdminStickers();
      } else {
        showToast(data.error || 'Could not approve this application right now.', 'error');
      }
    } catch (e) {
      showToast('Connection issue. Please check your network and try again.', 'error');
    }
  };

  // Admin Reject Documents
  const handleConfirmRejection = async () => {
    if (!rejectionModalApp) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/update`, {
        method: 'POST',
        body: JSON.stringify({
          id: rejectionModalApp.id,
          status: 'rejected',
          vehicle_type: rejectionModalApp.vehicle_type,
          rejection_reason: rejectionReasonInput || 'Documents submitted do not meet requirements.',
          admin_remarks: `OHSO Admin rejected application: ${rejectionReasonInput}`
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(getActionMessage('reject_docs', { name: rejectionModalApp.applicant_name }), 'warning');
        setRejectionModalApp(null);
        setRejectionReasonInput('');
        fetchAdminStickers();
      } else {
        showToast(data.error || 'Could not reject this application right now.', 'error');
      }
    } catch (e) {
      showToast('Connection issue. Please check your network and try again.', 'error');
    }
  };

  // Admin Verify Payment & Mark Ready for Release
  const handleVerifyPayment = async (id, action, rejection_reason = '') => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/stickers/admin/verify-payment`, {
        method: 'POST',
        body: JSON.stringify({ id, action, rejection_reason })
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'approve') {
          showToast(getActionMessage('verify_payment', { name: data.applicantName, stickerNumber: data.stickerNumber }), 'success');
        } else {
          showToast(getActionMessage('hold_payment', { name: data.applicantName }), 'warning');
        }
        setPaymentHoldModalApp(null);
        setPaymentHoldReasonInput('');
        fetchAdminStickers();
      } else {
        showToast(data.error || 'Could not process payment verification.', 'error');
      }
    } catch (e) {
      showToast('Connection issue. Please check your network and try again.', 'error');
    }
  };

  // Admin Unlock User Action
  const handleAdminUnlockUser = async (userId, userEmail) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/admin/unlock-user`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(getActionMessage('unlock_user', { email: userEmail }), 'success');
        fetchAdminUsers();
      } else {
        showToast(data.error || 'Could not unlock this account right now.', 'error');
      }
    } catch (e) {
      showToast('Connection issue. Could not unlock account.', 'error');
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

  // 1. Phase 1: Document Review (ONLY pending review or rejected - NEVER approved)
  const docReviewStickers = adminStickers.filter(
    s => s.status === 'pending_review' || s.status === 'pending' || s.status === 'rejected'
  );

  const filteredDocStickers = docReviewStickers.filter(s => {
    if (docFilter === 'pending') return s.status === 'pending_review' || s.status === 'pending';
    if (docFilter === 'rejected') return s.status === 'rejected';
    return true;
  });

  // 2. Phase 2: Payment Verification & Release (ONLY approved documents that moved forward)
  const paymentReviewStickers = adminStickers.filter(
    s => s.status !== 'pending_review' && s.status !== 'pending' && s.status !== 'rejected'
  );

  const filteredPaymentStickers = paymentReviewStickers.filter(s => {
    if (paymentFilter === 'needs_verification') return s.status === 'payment_submitted';
    if (paymentFilter === 'held') return s.status === 'payment_held';
    if (paymentFilter === 'ready') return s.status === 'ready_for_release' || s.status === 'paid' || s.status === 'claimed' || s.status === 'issued';
    if (paymentFilter === 'unpaid') return s.status === 'approved' && !s.payment_ref_no;
    return true;
  });

  // Key Metrics Calculation
  const totalStickersApplied = adminStickers.length;
  const totalApprovedStickers = paymentReviewStickers.filter(s => s.status === 'ready_for_release' || s.status === 'paid' || s.status === 'claimed' || s.status === 'issued').length;
  const totalPendingDocs = docReviewStickers.filter(s => s.status === 'pending_review' || s.status === 'pending').length;
  const totalPendingPayments = paymentReviewStickers.filter(s => s.status === 'payment_submitted').length;
  const totalHeldPayments = paymentReviewStickers.filter(s => s.status === 'payment_held').length;
  const totalPendingStickers = totalPendingDocs + totalPendingPayments + totalHeldPayments;
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

        {/* ADMIN TAB NAVIGATION */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('stickers')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'stickers'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-id-card text-umak-orange"></i>
            <span>Vehicle Sticker Applications ({totalPendingStickers} Pending)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('guests')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'guests'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-calendar-check text-emerald-400"></i>
            <span>Guest & Event Reservations ({adminGuestReservations.filter(g => g.status === 'pending').length} Pending)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('parking')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'parking'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-building text-umak-orange"></i>
            <span>HPSB Operations Overview</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 relative ${activeAdminTab === 'users'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-shield-halved text-red-400"></i>
            <span>Account Security</span>
            {adminUsers.filter(u => u.unlock_requested || (u.locked_until && new Date(u.locked_until) > new Date())).length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold animate-pulse">
                {adminUsers.filter(u => u.unlock_requested || (u.locked_until && new Date(u.locked_until) > new Date())).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('analytics')}
            className={`flex-1 min-w-[170px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'analytics'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-chart-line text-blue-400"></i>
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('audit')}
            className={`flex-1 min-w-[170px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'audit'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-list-check text-purple-400"></i>
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`flex-1 min-w-[170px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'reports'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-file-pdf text-umak-orange"></i>
            <span>Reports (PDF)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('diorama')}
            className={`flex-1 min-w-[200px] py-3 px-5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeAdminTab === 'diorama'
                ? 'bg-umak-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <i className="fa-solid fa-microchip text-emerald-400"></i>
            <span>ESP32 Diorama & Gates</span>
          </button>
        </div>

        {/* ===== SECTION 1: VEHICLE STICKER APPLICATIONS (PHASE 1 DOCS + PHASE 2 PAYMENT) ===== */}
        {activeAdminTab === 'stickers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Header with Subtabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">Vehicle Sticker Applications Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">Two-phase verification: Review submitted documents first, then verify payment proof before releasing stickers.</p>
              </div>

              <button
                onClick={fetchAdminStickers}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-rotate-right"></i> Refresh Data
              </button>
            </div>

            {/* Sub-tab Switcher: Phase 1 (Docs) vs Phase 2 (Payments) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full max-w-xl">
              <button
                type="button"
                onClick={() => setStickerSubTab('docs')}
                className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  stickerSubTab === 'docs'
                    ? 'bg-white text-umak-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-file-shield text-umak-orange"></i>
                <span>Phase 1: Document Review</span>
                {totalPendingDocs > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold">
                    {totalPendingDocs}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStickerSubTab('payments')}
                className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  stickerSubTab === 'payments'
                    ? 'bg-white text-umak-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-receipt text-emerald-600"></i>
                <span>Phase 2: Payment Verification</span>
                {totalPendingPayments > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold animate-pulse">
                    {totalPendingPayments}
                  </span>
                )}
              </button>
            </div>

            {/* SUB-VIEW 1: DOCUMENT REVIEW (PHASE 1 - ONLY PENDING REVIEW OR REJECTED) */}
            {stickerSubTab === 'docs' && (
              <div className="space-y-4">
                {/* Filter Pills for Document Review */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter</span>
                  {[
                    { key: 'all', label: 'All Requests', count: docReviewStickers.length, activeClass: 'bg-umak-navy text-white' },
                    { key: 'pending', label: 'Awaiting Review', count: docReviewStickers.filter(s => s.status === 'pending_review' || s.status === 'pending').length, activeClass: 'bg-amber-500 text-white' },
                    { key: 'rejected', label: 'Rejected', count: docReviewStickers.filter(s => s.status === 'rejected').length, activeClass: 'bg-red-600 text-white' },
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setDocFilter(f.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        docFilter === f.key
                          ? `${f.activeClass} shadow-sm`
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                      <span className={`text-[10px] font-mono opacity-80 ${docFilter === f.key ? '' : 'text-slate-400'}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                    Approved documents move to Phase 2 automatically.
                  </span>
                </div>

                {/* Application Cards */}
                {filteredDocStickers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center text-3xl mx-auto mb-4">
                      <i className="fa-solid fa-file-circle-check" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 mb-1">No applications pending review</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">All submitted documents have been reviewed. New submissions will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocStickers.map((stk) => {
                      const isDocPending = stk.status === 'pending_review' || stk.status === 'pending';

                      return (
                        <div
                          key={stk.id}
                          className={`admin-app-card bg-white rounded-2xl border p-5 space-y-4 ${
                            stk.status === 'rejected'
                              ? 'border-red-200 bg-red-50/20'
                              : 'border-amber-200 bg-amber-50/10'
                          }`}
                        >
                          {/* Card Header: Applicant + Status + Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Applicant Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                stk.status === 'rejected'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {stk.applicant_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{stk.applicant_name}</h4>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  <span className="text-[11px] text-slate-500 truncate">{stk.email}</span>
                                  <span className="text-[10px] font-mono font-bold text-umak-navy bg-slate-100 px-1.5 py-0.5 rounded">
                                    {stk.student_id_num}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge + Actions */}
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <StatusBadge status={stk.status} variant="short" pulse={isDocPending} />

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setApprovalModalApp(stk);
                                    const defDate = new Date();
                                    defDate.setDate(defDate.getDate() + 3);
                                    setClaimDateInput(formatDateInput(defDate));
                                  }}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-calendar-check text-[10px]" /> Approve & Schedule
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectionModalApp(stk);
                                    setRejectionReasonInput('');
                                  }}
                                  className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-red-200"
                                >
                                  <i className="fa-solid fa-xmark text-[10px]" /> Reject
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Rejection reason if present */}
                          {stk.rejection_reason && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                              <i className="fa-solid fa-circle-info text-red-400 text-xs mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-red-700 leading-relaxed">
                                <span className="font-bold">Previous rejection:</span> {stk.rejection_reason}
                              </p>
                            </div>
                          )}

                          {/* Card Body: Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                            {/* Vehicle */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle</p>
                              <p className="text-sm font-bold font-mono text-slate-900">{stk.plate_number}</p>
                              <p className="text-[11px] text-slate-500 capitalize">{stk.vehicle_make} • {stk.vehicle_type}</p>
                            </div>

                            {/* LTO Numbers */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LTO Records</p>
                              <div className="space-y-0.5 text-[11px] font-mono text-slate-700">
                                <p>OR: <span className="font-bold text-slate-900">{stk.or_number}</span></p>
                                <p>CR: <span className="font-bold text-slate-900">{stk.cr_number}</span></p>
                              </div>
                            </div>

                            {/* License */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">License No.</p>
                              <p className="text-sm font-bold font-mono text-slate-900">{stk.license_number}</p>
                            </div>

                            {/* Documents */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Documents</p>
                              <button
                                onClick={() => setInspectApplication(stk)}
                                className="px-3 py-1.5 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-images text-amber-400" /> Inspect All Docs
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: PAYMENT VERIFICATION (PHASE 2 - ONLY APPROVED DOCS) */}
            {stickerSubTab === 'payments' && (
              <div className="space-y-4">
                {/* Filter Pills for Payment Stage */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter</span>
                  {[
                    { key: 'all', label: 'All', count: paymentReviewStickers.length, activeClass: 'bg-umak-navy text-white' },
                    { key: 'needs_verification', label: 'Proof Submitted', count: totalPendingPayments, activeClass: 'bg-amber-500 text-white', pulse: totalPendingPayments > 0 },
                    { key: 'held', label: 'On Hold', count: totalHeldPayments, activeClass: 'bg-amber-600 text-white', pulse: totalHeldPayments > 0 },
                    { key: 'ready', label: 'Verified & Ready', count: paymentReviewStickers.filter(s => s.status === 'ready_for_release' || s.status === 'paid' || s.status === 'claimed' || s.status === 'issued').length, activeClass: 'bg-emerald-600 text-white' },
                    { key: 'unpaid', label: 'Awaiting Payment', count: paymentReviewStickers.filter(s => s.status === 'approved' && !s.payment_ref_no).length, activeClass: 'bg-slate-600 text-white' },
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setPaymentFilter(f.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        paymentFilter === f.key
                          ? `${f.activeClass} shadow-sm`
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                      <span className={`text-[10px] font-mono opacity-80 ${paymentFilter === f.key ? '' : 'text-slate-400'}`}>
                        {f.count}
                      </span>
                      {f.pulse && paymentFilter !== f.key && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Application Cards */}
                {filteredPaymentStickers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center text-3xl mx-auto mb-4">
                      <i className="fa-solid fa-receipt" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 mb-1">No applications match this filter</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Applications appear here after their documents are approved in Phase 1.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPaymentStickers.map((stk) => {
                      const isPaymentPending = stk.status === 'payment_submitted';
                      const isPaymentHeld = stk.status === 'payment_held';
                      const isReadyForRelease = stk.status === 'ready_for_release' || stk.status === 'paid' || stk.status === 'claimed' || stk.status === 'issued';
                      const isAwaitingPayment = stk.status === 'approved' && !stk.payment_ref_no;

                      return (
                        <div
                          key={stk.id}
                          className={`admin-app-card bg-white rounded-2xl border p-5 space-y-4 ${
                            isPaymentPending
                              ? 'border-amber-200 bg-amber-50/20'
                              : isPaymentHeld
                                ? 'border-amber-300 bg-amber-50/30'
                                : isReadyForRelease
                                  ? 'border-emerald-200 bg-emerald-50/20'
                                  : 'border-slate-200'
                          }`}
                        >
                          {/* Card Header: Applicant + Status + Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Applicant Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-umak-navy/10 text-umak-navy flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {stk.applicant_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{stk.applicant_name}</h4>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  <span className="text-[11px] text-slate-500 truncate">{stk.email}</span>
                                  <span className="text-[10px] font-mono font-bold text-umak-navy bg-slate-100 px-1.5 py-0.5 rounded">
                                    {stk.student_id_num}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge + Actions */}
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <StatusBadge status={stk.status} variant="short" pulse={isPaymentPending} />

                              {isPaymentPending && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleVerifyPayment(stk.id, 'approve')}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-check-double text-[10px]" /> Verify & Release
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPaymentHoldModalApp(stk);
                                      setPaymentHoldReasonInput(stk.rejection_reason || '');
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-red-200"
                                  >
                                    <i className="fa-solid fa-hand text-[10px]" /> Hold
                                  </button>
                                </div>
                              )}
                              {isPaymentHeld && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleVerifyPayment(stk.id, 'approve')}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-check-double text-[10px]" /> Verify & Release
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPaymentHoldModalApp(stk);
                                      setPaymentHoldReasonInput(stk.rejection_reason || '');
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-amber-300"
                                  >
                                    <i className="fa-solid fa-pen text-[10px]" /> Edit Hold Note
                                  </button>
                                </div>
                              )}
                              {isReadyForRelease && (
                                <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1.5">
                                  <i className="fa-solid fa-circle-check" /> Released
                                </span>
                              )}
                              {isAwaitingPayment && (
                                <span className="text-xs text-slate-400 font-semibold inline-flex items-center gap-1.5">
                                  <i className="fa-solid fa-clock" /> Awaiting Payment
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Body: Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                            {/* Vehicle */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle</p>
                              <p className="text-sm font-bold font-mono text-slate-900">{stk.plate_number}</p>
                              <p className="text-[11px] text-slate-500 capitalize">{stk.vehicle_make} • {stk.vehicle_type}</p>
                            </div>

                            {/* Payment Info */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment</p>
                              {stk.payment_ref_no ? (
                                <>
                                  <p className="text-xs font-bold text-slate-800 font-mono break-all">{stk.payment_ref_no}</p>
                                  <p className="text-[11px] text-emerald-600 font-bold">₱200.00 via {stk.payment_method?.toUpperCase() || 'PayMongo'}</p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No payment yet</p>
                              )}
                            </div>

                            {/* Claim Date */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pickup Date</p>
                              {stk.claim_date ? (
                                <p className="text-sm font-bold text-umak-navy">{formatDateClean(stk.claim_date)}</p>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Not scheduled</p>
                              )}
                            </div>

                            {/* Sticker / Proof */}
                            <div className="flex flex-col gap-2">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  {isReadyForRelease ? 'Sticker No.' : 'Proof'}
                                </p>
                                {isReadyForRelease && stk.sticker_number ? (
                                  <p className="text-sm font-bold font-mono text-emerald-700">{stk.sticker_number}</p>
                                ) : stk.payment_proof_doc ? (
                                  <button
                                    onClick={() => setInspectApplication(stk)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-umak-navy hover:text-white text-slate-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-image text-umak-orange" /> View Proof
                                  </button>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No proof</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Hold Feedback Notice */}
                          {isPaymentHeld && stk.rejection_reason && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2.5">
                              <i className="fa-solid fa-hand text-amber-600 text-sm mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-extrabold text-amber-900 uppercase tracking-wide text-[10px]">Payment Proof On Hold:</span>
                                <p className="text-amber-900 font-semibold mt-0.5">{stk.rejection_reason}</p>
                                <p className="text-[10px] text-amber-700 mt-1">Applicant has been notified via email and can re-upload their proof directly from their dashboard.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                          {(() => {
                            const gsc = getGuestStatusConfig(gst.status);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${gsc.palette.bg} ${gsc.palette.text} ${gsc.palette.border}`}>
                                <i className={`${gsc.icon} text-[10px]`} />
                                {gsc.label}
                              </span>
                            );
                          })()}
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
                const total = lot.totalSlots || (free + (lot.occupiedSlots || 0)) || 0;
                const percent = total > 0 ? Math.min(100, Math.round(((lot.occupiedSlots || 0) / total) * 100)) : 0;
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
                            <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] uppercase ${u.role === 'admin'
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

        {/* ===== SECTION 5: DATA ANALYTICS & CAMPUS INTELLIGENCE ===== */}
        {activeAdminTab === 'analytics' && (
          <AnalyticsTab
            analyticsData={analyticsData}
            dateRange={dateRange}
            setDateRange={setDateRange}
            loading={loadingAnalytics}
            onRefresh={fetchAnalytics}
          />
        )}

        {/* ===== SECTION 6: SYSTEM AUDIT LOGS & EVENT TRAIL ===== */}
        {activeAdminTab === 'audit' && (
          <AuditLogsTab
            auditData={auditData}
            activeCategory={auditCategory}
            setActiveCategory={setAuditCategory}
            searchQuery={auditSearch}
            setSearchQuery={setAuditSearch}
            dateRange={dateRange}
            setDateRange={setDateRange}
            page={auditPage}
            setPage={setAuditPage}
            loading={loadingAudit}
            onRefresh={fetchAuditLogs}
          />
        )}

        {/* ===== SECTION 7: OFFICIAL GENERATED REPORTS (PDF) ===== */}
        {activeAdminTab === 'reports' && (
          <ReportsTab
            dateRange={dateRange}
            setDateRange={setDateRange}
            authFetch={authFetch}
            apiBaseUrl={API_BASE_URL}
            adminName={currentUser?.name || 'OHSO Administrator'}
            showToast={showToast}
          />
        )}

        {/* ===== SECTION 8: ESP32 DIORAMA GATEWAY & HARDWARE CONTROLS ===== */}
        {activeAdminTab === 'diorama' && (
          <DioramaTab
            authFetch={authFetch}
            showToast={showToast}
          />
        )}

      </main>

      {/* APPROVAL & CLAIM DATE MODAL */}
      {approvalModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setApprovalModalApp(null)}>
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <i className="fa-solid fa-calendar-check" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approve & Schedule Pickup</h3>
                  <p className="text-[11px] text-slate-400">Documents verified — set the pickup date</p>
                </div>
              </div>
              <button onClick={() => setApprovalModalApp(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Applicant Summary Card */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-umak-navy/10 text-umak-navy flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {approvalModalApp.applicant_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{approvalModalApp.applicant_name}</p>
                  <p className="text-[11px] text-slate-500">
                    {approvalModalApp.plate_number} • {approvalModalApp.vehicle_make} ({approvalModalApp.vehicle_type})
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Once approved, the applicant will receive an email notification with their scheduled pickup date and a link to pay ₱200 online.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Sticker Pickup Date</label>
                <input
                  type="date"
                  value={claimDateInput}
                  onChange={(e) => setClaimDateInput(e.target.value)}
                  min={formatDateInput(new Date())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <p className="text-[10px] text-slate-400">When should they visit OHSO Ground Floor to claim their sticker?</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovalModalApp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="fa-solid fa-check text-[10px]" /> Approve & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setRejectionModalApp(null)}>
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <i className="fa-solid fa-circle-xmark" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Application</h3>
                  <p className="text-[11px] text-slate-400">Return for corrections — applicant will be notified</p>
                </div>
              </div>
              <button onClick={() => setRejectionModalApp(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Applicant Summary Card */}
              <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {rejectionModalApp.applicant_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{rejectionModalApp.applicant_name}</p>
                  <p className="text-[11px] text-slate-500">
                    {rejectionModalApp.plate_number} • {rejectionModalApp.vehicle_make}
                  </p>
                </div>
              </div>

              {/* Quick reason chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Quick Reasons</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Expired LTO OR/CR',
                    'Blurred document photo',
                    'Plate number mismatch',
                    'Incomplete documents',
                    'Invalid license',
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReasonInput(prev => prev ? `${prev}, ${reason.toLowerCase()}` : reason)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
                  <span className={`text-[10px] font-mono ${rejectionReasonInput.length > 200 ? 'text-red-500' : 'text-slate-400'}`}>
                    {rejectionReasonInput.length}/200
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Explain what needs to be corrected so the applicant can resubmit..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalApp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="fa-solid fa-xmark text-[10px]" /> Reject & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT HOLD / REJECT MODAL */}
      {paymentHoldModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setPaymentHoldModalApp(null)}>
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <i className="fa-solid fa-hand" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hold Payment</h3>
                  <p className="text-[11px] text-slate-400">Payment proof needs clarification</p>
                </div>
              </div>
              <button onClick={() => setPaymentHoldModalApp(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Applicant Summary Card */}
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {paymentHoldModalApp.applicant_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{paymentHoldModalApp.applicant_name}</p>
                  <p className="text-[11px] text-slate-500">
                    Ref: {paymentHoldModalApp.payment_ref_no || 'N/A'} • {paymentHoldModalApp.payment_method?.toUpperCase() || 'Unknown'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The applicant's sticker will remain on hold until they upload a valid payment receipt. They'll receive an email with your feedback.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Hold Reason / Feedback</label>
                <textarea
                  rows={3}
                  value={paymentHoldReasonInput}
                  onChange={(e) => setPaymentHoldReasonInput(e.target.value)}
                  placeholder="e.g. Receipt is unreadable, reference number doesn't match, or amount is incorrect..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentHoldModalApp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPayment(paymentHoldModalApp.id, 'hold', paymentHoldReasonInput)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="fa-solid fa-hand text-[10px]" /> Place on Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOADED DOCUMENTS INSPECTOR MODAL */}
      <DocumentInspectorModal
        isOpen={Boolean(inspectApplication)}
        onClose={() => setInspectApplication(null)}
        application={inspectApplication}
      />

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer />

      <Footer />
    </div>
  );
};
