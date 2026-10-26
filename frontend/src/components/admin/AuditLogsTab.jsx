import React, { useState } from 'react';

export const AuditLogsTab = ({
  auditData,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  page,
  setPage,
  loading,
  onRefresh
}) => {
  const [selectedLog, setSelectedLog] = useState(null);

  const categories = [
    { id: 'all', label: 'All Logs', icon: 'fa-solid fa-list' },
    { id: 'auth', label: 'Authentication', icon: 'fa-solid fa-user-shield' },
    { id: 'sticker', label: 'Stickers & Payments', icon: 'fa-solid fa-id-card' },
    { id: 'guest', label: 'Guest Reservations', icon: 'fa-solid fa-calendar-check' },
    { id: 'admin', label: 'Admin Actions', icon: 'fa-solid fa-shield-halved' }
  ];

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    const d = new Date(ts * 1000);
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDescription = (desc) => {
    if (!desc) return '';
    return desc
      .replace(/^User signed in successfully\s*\([^)]*\)$/i, 'Signed in with password')
      .replace(/^Signed in successfully via official Google SSO\s*\([^)]*\)$/i, 'Signed in with Google SSO')
      .replace(/^(?:Exported official|Generated)\s*(?:PDF|CSV)?\s*"?([^"()]+)"?\s*(?:covering|for)?\s*[\d-]*\s*(?:to)?\s*[\d-]*\s*\(\d+\s*records\)$/i, 'Generated $1')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getBadgeStyle = (category, status) => {
    if (status === 'failed') {
      return 'bg-red-50 text-red-600 border-red-200';
    }
    switch (category) {
      case 'auth':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sticker':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'guest':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* FILTER & CATEGORY SUB-TABS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">System Security & Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tamper-evident log of authentication events, admin approvals, and applicant activities.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 pl-2">Filter:</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none"
              />
            </div>

            <button
              onClick={onRefresh}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        {/* CATEGORY SELECTOR PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          {categories.map(c => {
            const count = auditData?.categoryCounts?.[c.id] || 0;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCategory(c.id); setPage(1); }}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-umak-navy text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className={`${c.icon} ${isActive ? 'text-umak-orange' : 'text-slate-400'}`}></i>
                <span>{c.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search audit trail by email, action, or description..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-umak-navy transition-all"
          />
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-umak-orange"></i>
            <p className="text-xs font-semibold text-slate-500">Querying secure audit logs...</p>
          </div>
        ) : !auditData?.rows || auditData.rows.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-2">
              <i className="fa-solid fa-shield"></i>
            </div>
            <p className="text-sm font-bold text-slate-700">No audit events match your filters</p>
            <p className="text-xs text-slate-400">Events will appear here as users and admins interact with the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Timestamp (PHT)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {auditData.rows.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatTimestamp(log.ts)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getBadgeStyle(log.category, log.status)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">{log.actorEmail || 'Anonymous/System'}</div>
                      {log.actorRole && (
                        <span className="text-[10px] text-slate-400 capitalize">{log.actorRole}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">
                      {formatDescription(log.description)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-umak-navy hover:text-umak-orange font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-circle-info"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {auditData && auditData.total > auditData.pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {((page - 1) * auditData.pageSize) + 1} to {Math.min(page * auditData.pageSize, auditData.total)} of {auditData.total} logs
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">Page {page}</span>
              <button
                disabled={page * auditData.pageSize >= auditData.total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Security Audit Record #{selectedLog.id}</span>
                <h3 className="text-base font-bold font-display text-slate-900 mt-0.5">{selectedLog.action}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Timestamp:</span>
                  <span className="font-mono text-slate-800 font-bold">{formatTimestamp(selectedLog.ts)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Category:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedLog.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Actor / Performed By:</span>
                  <span className="text-slate-800 font-bold">{selectedLog.actorEmail || 'System / Anonymous'}</span>
                  {selectedLog.actorRole && (
                    <span className="text-[10px] text-slate-500 block capitalize">Role: {selectedLog.actorRole}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Status:</span>
                  <span className={`font-bold uppercase ${selectedLog.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedLog.status}
                  </span>
                </div>
                {selectedLog.targetType && (
                  <div className="col-span-2 pt-2 border-t border-slate-200/70">
                    <span className="text-slate-400 block font-semibold">Affected Item:</span>
                    <span className="text-slate-800 font-bold">
                      {selectedLog.targetType.replace(/_/g, ' ').toUpperCase()} #{selectedLog.targetId}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Event Summary:</span>
                <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 font-semibold leading-relaxed">
                  {formatDescription(selectedLog.description)}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-umak-navy hover:bg-umak-navy/90 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
