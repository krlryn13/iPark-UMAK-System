import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { formatDateClean } from '../utils/dateUtils';

export const VerifyStickerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref') || searchParams.get('sticker') || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!refCode) {
      setLoading(false);
      setError('No sticker reference code or sticker number was provided.');
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/stickers/verify/${encodeURIComponent(refCode)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('No official UMak vehicle sticker found for this reference code.');
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Verification failed.');
        setLoading(false);
      });
  }, [refCode]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    window.location.href
  )}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-slate-950/80 border-b border-slate-800 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              <i className="fa-solid fa-shield-halved text-base"></i>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide font-display text-white">UMak OHSO Security</h1>
              <p className="text-[10px] text-slate-400">Gate Access & Sticker Validator</p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>Heron Portal</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-4">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-umak-navy via-umak-navydark to-slate-900 text-white p-5 text-center relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-umak-orange/15 to-transparent pointer-events-none"></div>
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              University of Makati
            </span>
            <h2 className="text-lg font-black font-display mt-1 text-white">Campus Gate Verification</h2>
            <p className="text-xs text-slate-300">Office of Human Safety and Operations (OHSO)</p>
          </div>

          <div className="p-6 space-y-5">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <i className="fa-solid fa-spinner animate-spin text-4xl text-umak-orange"></i>
                <p className="text-xs font-bold text-slate-600">Querying UMak Security Database...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 text-red-900">
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-2xl">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 className="font-extrabold text-base">Unverified Record</h3>
                <p className="text-xs text-red-700">{error}</p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Go to Heron Login
                  </button>
                </div>
              </div>
            ) : data ? (
              <div className="space-y-4">
                {/* Status Shield */}
                <div
                  className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                    data.isValid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <i
                      className={`fa-solid ${
                        data.isValid ? 'fa-shield-check text-emerald-600' : 'fa-shield-xmark text-red-600'
                      } text-2xl`}
                    ></i>
                    <span className="font-black text-base tracking-wide uppercase">
                      {data.isValid
                        ? data.status === 'ready_for_release'
                          ? 'VALID PASS (READY FOR PICKUP)'
                          : 'VALID OFFICIAL STICKER'
                        : data.isExpired
                        ? 'EXPIRED VEHICLE STICKER'
                        : 'PENDING CLEARANCE / UNVERIFIED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {data.isValid
                      ? data.status === 'ready_for_release'
                        ? 'Payment verified & approved by OHSO Security. Scheduled for release.'
                        : 'Official UMak Campus Vehicle Pass. Authorized for parking entry.'
                      : data.isExpired
                      ? 'This vehicle sticker has passed its 1-year validity period.'
                      : 'This sticker application is pending clearance or verification.'}
                  </p>
                </div>

                {/* QR Display */}
                <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 shadow-inner">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src={qrCodeUrl}
                      alt="UMak Sticker Security QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    REF: {data.paymentRefNo || refCode}
                  </span>
                </div>

                {/* Detail Specifications */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Sticker Number:</span>
                    <span className="font-extrabold text-umak-navy">{data.stickerNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Plate Number:</span>
                    <span className="font-extrabold text-slate-900 uppercase">{data.plateNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-bold text-slate-800">
                      {data.vehicleMake || 'N/A'} ({data.vehicleType || 'vehicle'})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Registered Owner:</span>
                    <span className="font-bold text-slate-800">{data.applicantName || 'UMak Applicant'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Student/Staff ID:</span>
                    <span className="font-bold text-slate-800">{data.studentIdNum || 'N/A'}</span>
                  </div>
                  {data.claimDate && data.status === 'ready_for_release' && (
                    <div className="flex justify-between border-b border-slate-200 pb-2 text-blue-900">
                      <span className="font-bold">Scheduled Claim:</span>
                      <span className="font-extrabold">
                        {formatDateClean(data.claimDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="font-bold text-emerald-600">
                      {data.expiresAt
                        ? new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '1 Year from Issue'}
                    </span>
                  </div>
                </div>

                {/* Claiming Office note if ready for pickup */}
                {data.status === 'ready_for_release' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <i className="fa-solid fa-location-dot text-umak-orange"></i>
                      <span>Claim Location: OHSO Security Office</span>
                    </div>
                    <p className="text-amber-800">
                      Ground Floor, HPSB Building • Mon–Fri, 8:00 AM – 5:00 PM. Present student ID & driver's license.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[10px] text-slate-500">
            <span>University of Makati OHSO</span>
            <span className="font-mono">Security Clearance System</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} University of Makati — Office of Human Safety and Operations (OHSO)
      </footer>
    </div>
  );
};

export default VerifyStickerPage;
