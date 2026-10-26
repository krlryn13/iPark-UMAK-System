import React, { useState } from 'react';
import { generatePDFReport } from '../../utils/pdfReportGenerator';

export const ReportsTab = ({
  dateRange,
  setDateRange,
  authFetch,
  apiBaseUrl,
  adminName,
  showToast
}) => {
  const [generatingType, setGeneratingType] = useState(null);

  const reportTypes = [
    {
      id: 'stickers',
      title: 'Vehicle Sticker Applications',
      desc: 'Complete log of applicants, student IDs, vehicle types, plate numbers, and validation statuses.',
      icon: 'fa-solid fa-id-card',
      color: 'blue'
    },
    {
      id: 'revenue',
      title: 'Revenue & Payment Remittance',
      desc: 'Collection audit with payment reference numbers, payment channels (GCash, Cashier), and amounts (₱200).',
      icon: 'fa-solid fa-peso-sign',
      color: 'emerald'
    },
    {
      id: 'guests',
      title: 'Guest & Event Reservations',
      desc: 'Visitor access records, guest names, host departments, approved dates, and entry pass codes.',
      icon: 'fa-solid fa-calendar-check',
      color: 'amber'
    },
    {
      id: 'users',
      title: 'User Accounts & Security Roster',
      desc: 'Campus community accounts, verification rates, role distributions, and account lockout history.',
      icon: 'fa-solid fa-users-gear',
      color: 'indigo'
    },
    {
      id: 'audit',
      title: 'Comprehensive System Audit Trail',
      desc: 'Chronological timeline of system events, logins, admin approvals, document rejections, and IP records.',
      icon: 'fa-solid fa-shield-halved',
      color: 'purple'
    }
  ];

  const handleDownload = async (reportId, reportTitle) => {
    setGeneratingType(reportId);
    try {
      const res = await authFetch(
        `${apiBaseUrl}/api/admin/reports/${reportId}?from=${dateRange.from}&to=${dateRange.to}`
      );
      if (!res.ok) {
        showToast('Failed to fetch report data from server.', 'error');
        setGeneratingType(null);
        return;
      }

      const data = await res.json();
      if (!data.rows || data.rows.length === 0) {
        showToast(`No records found for ${reportTitle} within the selected date range.`, 'warning');
        setGeneratingType(null);
        return;
      }

      generatePDFReport({
        type: reportId,
        title: data.title || reportTitle,
        range: data.range || dateRange,
        rows: data.rows,
        adminName
      });

      showToast(`Generated official PDF for "${reportTitle}"!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF report.', 'error');
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* FILTER & HEADER CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Official Report Generation Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export tamper-evident, accredited PDF summaries with official University of Makati & OHSO headers.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 pl-2">Period:</span>
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
      </div>

      {/* REPORT TYPE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTypes.map((rep) => {
          const isGenerating = generatingType === rep.id;
          return (
            <div
              key={rep.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-umak-navy flex items-center justify-center text-xl border border-slate-100">
                  <i className={`${rep.icon} text-umak-navy`}></i>
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">{rep.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  disabled={isGenerating}
                  onClick={() => handleDownload(rep.id, rep.title)}
                  className="w-full py-2.5 px-4 bg-umak-navy hover:bg-umak-navy/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-pdf text-umak-orange"></i>
                      <span>Export Official PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
