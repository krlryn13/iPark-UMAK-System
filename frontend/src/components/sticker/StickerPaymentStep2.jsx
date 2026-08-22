import React from 'react';
import { DocumentUploadCard } from './DocumentUploadCard';

/**
 * Step 2 Component: PayMongo REST API Payment Gateway & Screenshot Proof Upload
 */
export const StickerPaymentStep2 = ({
  files,
  filePreviews,
  loading,
  setStep,
  handleFileChange,
  handleRemoveFile,
  handleLaunchPayMongoCheckout,
  handleProcessPayment
}) => {
  return (
    <form onSubmit={handleProcessPayment} className="space-y-4">

      {/* Fee Summary Box */}
      <div className="bg-umak-navy/5 border border-umak-navy/15 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase">Fee Summary</span>
          <h4 className="text-lg font-extrabold text-slate-900">UMak Vehicle Sticker (1 Year)</h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-600 font-bold block">Fixed Rate</span>
          <span className="text-2xl font-black font-mono text-umak-navy">₱200.00</span>
        </div>
      </div>

      {/* Stage 1: PayMongo REST API Gateway Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-emerald-900">Stage 1: Pay via PayMongo Official Gateway</h5>
              <p className="text-[10px] text-emerald-700 font-medium">REST API supporting GCash, Maya, QR Ph & Cards</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[9px]">
            TEST MODE
          </span>
        </div>

        <button
          type="button"
          onClick={handleLaunchPayMongoCheckout}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <i className="fa-solid fa-up-right-from-square"></i>
          <span>1. Open Official PayMongo Checkout Page (₱200.00)</span>
        </button>
        
        <p className="text-[11px] text-slate-600 text-center font-medium">
          💡 After paying on PayMongo, <strong>take a screenshot</strong> of your payment receipt!
        </p>
      </div>

      {/* Stage 2: Proof of Payment Screenshot Upload */}
      <div className="pt-1">
        <DocumentUploadCard
          label="Stage 2: Upload PayMongo / GCash Screenshot"
          fileKey="payment_proof_doc"
          file={files.payment_proof_doc}
          preview={filePreviews.payment_proof_doc}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          required={true}
        />
      </div>

      {/* Navigation & Submit Controls */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !files.payment_proof_doc}
          className="w-2/3 py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              Submitting Application...
            </>
          ) : (
            <>
              <i className="fa-solid fa-check-double"></i>
              2. Submit Final Application & Receipt
            </>
          )}
        </button>
      </div>
    </form>
  );
};
