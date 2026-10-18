import React, { useState } from 'react';
import StickerVerificationModal from '../StickerVerificationModal';
import { formatDateClean } from '../../utils/dateUtils';

/**
 * Step 3 Component: Official Digital E-Receipt & OHSO Pickup Guide
 */
export const StickerReceiptStep3 = ({
  receiptData,
  onClose,
  setIsTutorialOpen
}) => {
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  if (!receiptData) return null;

  const refNo = receiptData.refNo || receiptData.payment_ref_no || 'PAY-VERIFIED';
  const amountNumber = Number(receiptData.amount || 200.00);
  const applicantName = receiptData.applicant || receiptData.applicant_name || 'UMak Applicant';
  const plateNumber = receiptData.plateNumber || receiptData.plate_number || 'N/A';
  const paymentMethod = receiptData.method || receiptData.payment_method || 'PAYMONGO';
  const stickerNumber = receiptData.stickerNumber || receiptData.sticker_number;
  const claimDate = receiptData.claimDate || receiptData.claim_date;
  const userEmail = receiptData.email || 'your registered email';
  const isReady = receiptData.status === 'ready_for_release' || receiptData.status === 'paid' || receiptData.status === 'claimed' || receiptData.status === 'issued';

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${window.location.origin}/verify-sticker?ref=${refNo}`
  )}`;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Success / Release Banner */}
      <div className={`border rounded-2xl p-4 text-center space-y-1 ${
        isReady ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl mb-1 shadow-xs">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h4 className="text-lg font-black text-slate-900">
          {isReady ? 'Sticker Verified & Ready for Release!' : 'Payment & Application Successful!'}
        </h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">
          {isReady
            ? 'Your payment proof has been verified by OHSO. Your official hologram sticker is ready for pickup!'
            : 'Your payment has been recorded. OHSO Security will review and verify your sticker details.'}
        </p>
        {stickerNumber && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-xl shadow-xs font-mono font-extrabold text-sm text-umak-navy">
            <i className="fa-solid fa-barcode text-umak-orange"></i>
            <span>Sticker No: {stickerNumber}</span>
          </div>
        )}
      </div>

      {/* Official Electronic Receipt Card with QR Code */}
      <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <span className="font-mono font-extrabold text-umak-navy text-sm block">UMak OHSO E-Receipt</span>
            <span className="text-[10px] text-slate-500">Official Campus Access Hologram Sticker</span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px] border border-emerald-200">
            {String(paymentMethod).toUpperCase()} PAID
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Details Column */}
          <div className="sm:col-span-8 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Ref Code:</span>
              <span className="font-bold text-slate-900 break-all">{refNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-bold text-slate-900">{applicantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Plate Number:</span>
              <span className="font-bold text-slate-900 uppercase">{plateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-600">₱{amountNumber.toFixed(2)}</span>
            </div>
            {claimDate && (
              <div className="flex justify-between text-blue-900 pt-1 border-t border-slate-200">
                <span className="font-bold">Scheduled Pickup:</span>
                <span className="font-extrabold">{formatDateClean(claimDate)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Date:</span>
              <span>{receiptData.date || new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Dynamic Scannable QR Code Column */}
          <div className="sm:col-span-4 flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 text-center">
            <img
              src={qrCodeApiUrl}
              alt="UMak Sticker Verification QR Code"
              className="w-22 h-22 object-contain"
            />
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(true)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-shield-check text-emerald-500"></i> Verify Pass
            </button>
          </div>
        </div>
      </div>

      {/* 📍 Official OHSO Claiming & Pickup Instructions Box */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-2.5 text-xs text-amber-950">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold uppercase tracking-wide">
          <i className="fa-solid fa-location-dot text-umak-orange text-sm"></i>
          <span>Official Sticker Claiming Guidelines</span>
        </div>
        <p className="text-[11px] text-amber-900 leading-relaxed">
          An official release notification has been dispatched to your email at <strong>{userEmail}</strong>. Please follow these instructions to claim your physical hologram sticker:
        </p>
        <div className="space-y-1.5 pl-2 text-[11px] text-amber-900 font-medium">
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-building text-amber-700 mt-0.5 text-xs"></i>
            <span><strong>Claim Location:</strong> OHSO Security Office, Ground Floor, HPSB Building.</span>
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-clock text-amber-700 mt-0.5 text-xs"></i>
            <span><strong>Office Hours:</strong> Monday to Friday, 8:00 AM – 5:00 PM.</span>
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-id-card text-amber-700 mt-0.5 text-xs"></i>
            <span><strong>Requirements to Present:</strong> Original UMak Student/Faculty ID and Driver's License.</span>
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-qrcode text-amber-700 mt-0.5 text-xs"></i>
            <span><strong>Digital Pass:</strong> Show this E-Receipt or the QR Code on your phone to the OHSO officer.</span>
          </div>
        </div>

        {/* Tutorial Link */}
        {setIsTutorialOpen && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="text-[11px] font-bold text-umak-navy hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-map-location-dot text-umak-orange"></i>
              <span>View HPSB Campus Navigation Guide</span>
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-print"></i> Print E-Receipt
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-check"></i> Done & Close
        </button>
      </div>

      {/* Gate Security Verification Modal */}
      <StickerVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        identifier={refNo}
      />
    </div>
  );
};

export default StickerReceiptStep3;
