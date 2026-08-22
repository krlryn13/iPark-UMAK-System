import React from 'react';

/**
 * Step 3 Component: Official Digital E-Receipt & OHSO Pickup Guide
 */
export const StickerReceiptStep3 = ({
  receiptData,
  onClose,
  setIsTutorialOpen
}) => {
  if (!receiptData) return null;

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Success Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
        <i className="fa-solid fa-circle-check text-3xl text-emerald-600 mb-1"></i>
        <h4 className="text-lg font-extrabold text-emerald-800">Payment & Application Successful!</h4>
        <p className="text-xs text-emerald-700">Your application and encrypted documents are now submitted to the OHSO Office.</p>
      </div>

      {/* Official Electronic Receipt Card */}
      <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-3 text-xs">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <span className="font-mono font-extrabold text-umak-navy text-sm">UMak OHSO E-Receipt</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
            {receiptData.method} PAID
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Ref No:</span>
            <span className="font-bold text-slate-900">{receiptData.refNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Applicant:</span>
            <span className="font-bold text-slate-900">{receiptData.applicant}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plate Number:</span>
            <span className="font-bold text-slate-900">{receiptData.plateNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount Paid:</span>
            <span className="font-bold text-emerald-600">₱{receiptData.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-1">
            <span>Date & Time:</span>
            <span>{receiptData.date}</span>
          </div>
        </div>
      </div>

      {/* Pickup Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
        <h5 className="font-bold flex items-center gap-1.5 text-amber-800">
          <i className="fa-solid fa-location-dot"></i> Next Step: Sticker Claiming at OHSO
        </h5>
        <p className="text-[11px] leading-relaxed">
          Please visit the <strong>University Safety and Security Office (OHSO)</strong> inside UMak Campus to claim your official sticker. Bring your original Driver's License and Student ID for verification.
        </p>

        {/* Tutorial Link */}
        {setIsTutorialOpen && (
          <button
            type="button"
            onClick={() => setIsTutorialOpen(true)}
            className="text-[11px] font-bold text-umak-navy hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
          >
            <i className="fa-solid fa-map-location-dot text-umak-orange"></i>
            <span>View Campus Map & Navigation Guide</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-print"></i> Print E-Receipt
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-1/2 py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Done & Close
        </button>
      </div>
    </div>
  );
};
