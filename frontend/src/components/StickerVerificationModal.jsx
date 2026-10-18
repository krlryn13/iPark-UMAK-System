import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function StickerVerificationModal({ isOpen, onClose, identifier }) {
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !identifier) return;

    setLoading(true);
    setError(null);
    setVerificationData(null);

    fetch(`${API_BASE_URL}/api/stickers/verify/${encodeURIComponent(identifier)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('No official vehicle sticker found for this reference code.');
        }
        return res.json();
      })
      .then((data) => {
        setVerificationData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to verify sticker.');
        setLoading(false);
      });
  }, [isOpen, identifier]);

  if (!isOpen) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${window.location.origin}/verify-sticker?ref=${identifier}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-umak-navy via-umak-navydark to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base font-display">UMak Gate Verification</h3>
              <p className="text-[11px] text-slate-300">Security Clearance & Sticker Validator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <i className="fa-solid fa-spinner animate-spin text-3xl text-umak-orange"></i>
              <p className="text-xs font-bold text-slate-600">Verifying with UMak Security Database...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3 text-red-800">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h4 className="font-extrabold text-base">Unverified / Invalid Sticker</h4>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          ) : verificationData ? (
            <div className="space-y-5">
              
              {/* Status Shield */}
              <div
                className={`p-4 rounded-2xl border text-center space-y-1 ${
                  verificationData.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i
                    className={`fa-solid ${
                      verificationData.isValid ? 'fa-shield-check text-emerald-600' : 'fa-shield-xmark text-red-600'
                    } text-2xl`}
                  ></i>
                  <span className="font-extrabold text-base tracking-wide">
                    {verificationData.isValid
                      ? verificationData.status === 'ready_for_release'
                        ? 'VALID OFFICIAL STICKER (READY FOR PICKUP)'
                        : 'VALID OFFICIAL STICKER'
                      : verificationData.isExpired
                      ? 'EXPIRED VEHICLE STICKER'
                      : 'PENDING CLEARANCE / UNVERIFIED'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80">
                  {verificationData.isValid
                    ? verificationData.status === 'ready_for_release'
                      ? 'Payment verified & approved by OHSO Security. Hologram sticker ready for pickup.'
                      : 'Official Vehicle Pass Approved by OHSO Admin. Authorized Campus Parking.'
                    : verificationData.isExpired
                    ? 'This vehicle sticker has passed its 1-year validity period.'
                    : 'Sticker application is pending OHSO review or payment verification.'}
                </p>
              </div>

              {/* Dynamic QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="UMak Sticker Security QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Ref: {verificationData.paymentRefNo || identifier}
                </span>
              </div>

              {/* Details List */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Sticker Number:</span>
                  <span className="font-extrabold text-umak-navy">{verificationData.stickerNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Plate Number:</span>
                  <span className="font-extrabold text-slate-900">{verificationData.plateNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Vehicle Model:</span>
                  <span className="font-bold text-slate-800">{verificationData.vehicleMake} ({verificationData.vehicleType})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Registered Owner:</span>
                  <span className="font-bold text-slate-800">{verificationData.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-bold text-emerald-600">
                    {new Date(verificationData.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">UMak Gate Security Clearance System</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
