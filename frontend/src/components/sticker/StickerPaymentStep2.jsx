import React, { useState } from 'react';
import { PAYMENT_METHODS, computeTotal, formatPeso, STICKER_BASE_FEE } from '../../utils/feeCalculator';

/**
 * Payment method authentic brand SVG icons (official brand marks, no generic text/emojis)
 */
const BrandIcon = ({ method, size = 32 }) => {
  if (method === 'gcash') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
      <rect width="48" height="48" rx="12" fill="#007EFC"/>
      <path d="M24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38C30.05 38 35.19 34.15 37.14 28.75H24V22.25H43.68C43.89 22.82 44 23.4 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4C30.68 4 36.57 7.28 40.2 12.35L34.6 15.75C32.1 12.25 28.3 10 24 10Z" fill="white"/>
    </svg>
  );
  if (method === 'maya') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
      <rect width="48" height="48" rx="12" fill="#00B388"/>
      <path d="M12 34V14L21 27.5L30 14V34" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="31" r="3" fill="#FBBF24"/>
    </svg>
  );
  if (method === 'qrph') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
      <rect width="48" height="48" rx="12" fill="#0F2C59"/>
      <rect x="10" y="10" width="12" height="12" rx="3" fill="#F59E0B"/>
      <rect x="26" y="10" width="12" height="12" rx="3" fill="#EF4444"/>
      <rect x="10" y="26" width="12" height="12" rx="3" fill="#3B82F6"/>
      <rect x="13" y="13" width="6" height="6" rx="1.5" fill="white"/>
      <rect x="29" y="13" width="6" height="6" rx="1.5" fill="white"/>
      <rect x="13" y="29" width="6" height="6" rx="1.5" fill="white"/>
      <rect x="26" y="26" width="5" height="5" rx="1" fill="#F59E0B"/>
      <rect x="33" y="26" width="5" height="5" rx="1" fill="white"/>
      <rect x="26" y="33" width="5" height="5" rx="1" fill="white"/>
      <rect x="33" y="33" width="5" height="5" rx="1" fill="#EF4444"/>
    </svg>
  );
  // Card (Visa / Mastercard)
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
      <rect width="48" height="48" rx="12" fill="#1E293B"/>
      <circle cx="20" cy="24" r="9" fill="#EB001B"/>
      <circle cx="28" cy="24" r="9" fill="#F79E1B" fillOpacity="0.85"/>
      <path d="M24 17.5C25.5 19.3 26.4 21.5 26.4 24C26.4 26.5 25.5 28.7 24 30.5C22.5 28.7 21.6 26.5 21.6 24C21.6 21.5 22.5 19.3 24 17.5Z" fill="#FF5F00"/>
    </svg>
  );
};

/**
 * Step 2 Component: Payment Method Selection + Live Fee Breakdown
 * Redesigned with premium glassmorphism and brand-accurate payment method cards.
 */
export const StickerPaymentStep2 = ({
  files,
  filePreviews,
  loading,
  setStep,
  paymongoSession,
  existingApplication,
  onResetPaymentSession,
  handleFileChange,
  handleRemoveFile,
  handleLaunchPayMongoCheckout,
  handleProcessPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('gcash');
  const [repayMode, setRepayMode] = useState(false);
  const feeInfo = computeTotal(selectedMethod);

  const handlePayNow = () => {
    handleLaunchPayMongoCheckout(selectedMethod, feeInfo.total);
  };

  const isPaymentHeld = existingApplication?.status === 'payment_held' || Boolean(existingApplication?.rejection_reason);
  const isPaid = Boolean(paymongoSession?.isPaid) || isPaymentHeld;
  const isUploadUnlocked = Boolean(paymongoSession?.sessionId) || isPaymentHeld;

  return (
    <form onSubmit={handleProcessPayment} className="space-y-4">

      {/* ── HOLD MODE: Prompt to re-upload proof without paying again ──── */}
      {isPaymentHeld && !repayMode ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <i className="fa-solid fa-hand text-sm" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
                OHSO Payment Verification Notice
              </h4>
              <p className="text-[11px] text-amber-800">
                Your sticker release is on hold awaiting an updated payment proof
              </p>
            </div>
          </div>

          {existingApplication?.rejection_reason && (
            <div className="p-3 bg-white/90 border border-amber-200 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Reason / Admin Remarks:
              </span>
              <p className="text-amber-950 font-semibold italic leading-relaxed">
                "{existingApplication.rejection_reason}"
              </p>
            </div>
          )}

          {/* Recorded Transaction details */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-100/70 rounded-xl text-[11px] text-amber-950 border border-amber-200 font-mono">
            <span>
              Ref: <strong className="text-slate-900">{existingApplication?.payment_ref_no || paymongoSession?.referenceNo || 'RECORDED'}</strong>
            </span>
            <span className="font-bold uppercase text-emerald-800">
              ₱200.00 via {existingApplication?.payment_method?.toUpperCase() || paymongoSession?.paymentMethod?.toUpperCase() || 'PAYMONGO'}
            </span>
          </div>

          <p className="text-[11px] text-amber-900 leading-relaxed">
            <strong className="text-amber-950">No new payment required:</strong> Your previous payment reference is recorded. Simply re-upload a clear, valid screenshot of your receipt below so OHSO can verify it.
          </p>
        </div>
      ) : null}

      {/* ── Active PayMongo Reference Banner (Normal payment mode) ───── */}
      {(!isPaymentHeld || repayMode) && paymongoSession && (
        <div className={`flex items-center justify-between p-3.5 border rounded-xl text-xs animate-in fade-in ${
          isPaid ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs' : 'bg-blue-50/90 border-blue-200/80 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-xs ${
              isPaid ? 'bg-emerald-600' : 'bg-blue-500'
            }`}>
              <i className={`fa-solid ${isPaid ? 'fa-check' : 'fa-clock'} text-xs`}></i>
            </div>
            <div>
              <p className="font-extrabold text-[12px] leading-tight">
                {isPaid ? 'Payment Confirmed & Verified!' : 'PayMongo Checkout Active'}
              </p>
              <p className="font-mono text-[10px] text-slate-600">
                Ref Code: <span className="font-bold text-slate-900">{paymongoSession.paymentId || paymongoSession.referenceNo}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white font-mono font-bold text-[10px] text-emerald-900 rounded-md uppercase tracking-wider border border-emerald-200 shadow-2xs">
              {paymongoSession.paymentMethod} • {isPaid ? 'PAID' : 'PENDING'}
            </span>
            {!isPaid && onResetPaymentSession && (
              <button
                type="button"
                onClick={onResetPaymentSession}
                className="text-[10px] text-red-600 hover:text-red-800 underline font-bold cursor-pointer"
                title="Cancel current session to choose another channel"
              >
                Change
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Payment Method Selector & Fee Breakdown (Only in initial payment or repay mode) ── */}
      {(!isPaymentHeld || repayMode) && (
        <>
          {repayMode && (
            <button
              type="button"
              onClick={() => setRepayMode(false)}
              className="text-xs text-umak-navy font-bold hover:underline cursor-pointer inline-flex items-center gap-1.5 mb-1"
            >
              <i className="fa-solid fa-arrow-left" /> Cancel & Return to Re-upload Proof for {existingApplication?.payment_ref_no || 'Recorded Payment'}
            </button>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Select Payment Channel
              </p>
              {paymongoSession && (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isPaid ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    <i className="fa-solid fa-lock text-[9px] mr-1"></i> {isPaid ? 'Paid via' : 'Locked to'} {paymongoSession.paymentMethod?.toUpperCase()}
                  </span>
                  {!isPaid && onResetPaymentSession && (
                    <button
                      type="button"
                      onClick={onResetPaymentSession}
                      className="text-[10px] text-umak-navy hover:underline font-bold cursor-pointer"
                    >
                      (Change Channel)
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSessionLocked = Boolean(paymongoSession);
                const activeMethodId = paymongoSession ? paymongoSession.paymentMethod : selectedMethod;
                const isActive = activeMethodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={isSessionLocked && !isActive}
                    onClick={() => {
                      if (!isSessionLocked) setSelectedMethod(method.id);
                    }}
                    className={`
                      relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200
                      ${isActive
                        ? 'border-umak-navy bg-umak-navy/5 shadow-md cursor-default'
                        : isSessionLocked
                        ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                      }
                    `}
                    aria-pressed={isActive}
                    aria-label={`Pay via ${method.label}`}
                  >
                    {/* Active dot indicator */}
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-umak-navy animate-pulse" />
                    )}
                    <BrandIcon method={method.id} size={32} />
                    <span className={`text-[10px] font-bold leading-tight text-center ${isActive ? 'text-umak-navy' : 'text-slate-600'}`}>
                      {method.label}
                    </span>
                    <span className={`text-[9px] font-mono font-semibold ${isActive ? 'text-umak-orange' : 'text-slate-400'}`}>
                      {formatPeso(computeTotal(method.id).total)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Live Fee Breakdown ────────────────────────────────────── */}
          <div className="bg-umak-navy/[0.03] border border-umak-navy/15 rounded-2xl p-4 space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fee Breakdown</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wide">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Test Mode
              </span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sticker Application Fee</span>
                <span className="font-bold text-slate-800">{formatPeso(STICKER_BASE_FEE)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">
                  {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label} Processing
                  <span className="ml-1 text-slate-400">
                    ({(PAYMENT_METHODS.find(m => m.id === selectedMethod)?.rate * 100).toFixed(2)}%
                    {selectedMethod === 'card' ? ' + ₱13.39' : ''})
                  </span>
                </span>
                <span className="font-bold text-orange-500">+{formatPeso(feeInfo.processingFee)}</span>
              </div>
              <div className="border-t border-umak-navy/10 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-[11px]">Total to Pay</span>
                <span className="text-base font-black font-mono text-umak-navy">{formatPeso(feeInfo.total)}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 leading-relaxed pt-0.5 border-t border-slate-100">
              <svg className="w-3 h-3 inline mr-1 text-slate-400" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Processing fee is charged by PayMongo gateway, not by the University of Makati. The school receives exactly ₱200.00.
            </p>
          </div>

          {/* ── Pay Now / Session Active Button ───────────────────────── */}
          {isPaid && !repayMode ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-1 animate-in fade-in">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wide">
                <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                <span>Online Payment Completed Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                Your payment via <strong>{paymongoSession?.paymentMethod?.toUpperCase()}</strong> is recorded. Please upload your payment receipt screenshot below to submit to OHSO.
              </p>
            </div>
          ) : !paymongoSession ? (
            <button
              type="button"
              onClick={handlePayNow}
              disabled={loading}
              id="btn-launch-paymongo"
              className="w-full py-3.5 bg-umak-navy hover:bg-umak-navydark text-white font-extrabold text-sm rounded-xl shadow-lg shadow-umak-navy/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Connecting to PayMongo...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Pay {formatPeso(feeInfo.total)} via {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={loading}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300/80 font-bold text-xs rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Re-open PayMongo Gateway Tab ({PAYMENT_METHODS.find(m => m.id === (paymongoSession?.paymentMethod || selectedMethod))?.label})
              </button>
              <p className="text-[10px] text-center text-slate-500 font-medium">
                Payment session pending ({paymongoSession?.paymentMethod?.toUpperCase()}). If you have finished paying, upload your receipt screenshot below.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Stage 2: Upload Proof (unlocked if paid or if on hold) ── */}
      <div className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 space-y-3 transition-colors ${
        isPaymentHeld && !repayMode
          ? 'border-amber-300 bg-amber-50/20'
          : isUploadUnlocked
            ? 'border-slate-200 bg-white'
            : 'border-slate-200 bg-slate-50/60'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            files.payment_proof_doc ? 'border-emerald-500 bg-emerald-500' : isUploadUnlocked ? 'border-umak-navy' : 'border-slate-300'
          }`}>
            {files.payment_proof_doc ? (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
              </svg>
            ) : isUploadUnlocked ? (
              <span className="w-2 h-2 rounded-full bg-umak-navy animate-pulse" />
            ) : null}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {isPaymentHeld && !repayMode ? 'Attach Updated Payment Screenshot' : 'Step 2: Upload Payment Screenshot'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isPaymentHeld && !repayMode
                ? 'Upload your clear payment receipt showing the Reference Number and Amount'
                : 'Upload your PayMongo payment receipt screenshot below'}
            </p>
          </div>
        </div>

        {/* File upload area */}
        <div className="relative">
          {!files.payment_proof_doc ? (
            <label
              htmlFor="payment_proof_doc_input"
              className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                isPaymentHeld && !repayMode
                  ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-100/50 hover:border-amber-400'
                  : 'border-slate-200 hover:border-umak-navy/30 hover:bg-umak-navy/[0.02]'
              }`}
            >
              <svg className={`w-8 h-8 ${isPaymentHeld && !repayMode ? 'text-amber-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-slate-700">Click to attach payment receipt screenshot</span>
              <span className="text-[10px] text-slate-400">JPG, PNG, WEBP, PDF — max 5MB</span>
              <input
                id="payment_proof_doc_input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="sr-only"
                onChange={(e) => handleFileChange('payment_proof_doc', e)}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              {filePreviews.payment_proof_doc?.isImage && filePreviews.payment_proof_doc?.url ? (
                <img
                  src={filePreviews.payment_proof_doc.url}
                  alt="Payment proof preview"
                  className="w-14 h-14 object-cover rounded-lg border border-emerald-200 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900 truncate">{filePreviews.payment_proof_doc?.name}</p>
                <p className="text-[10px] text-emerald-600 font-mono">{filePreviews.payment_proof_doc?.size} MB</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                  <i className="fa-solid fa-check text-[9px]" /> Ready to upload
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile('payment_proof_doc')}
                className="p-2 rounded-lg hover:bg-emerald-200 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Remove file"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Optional toggle for re-paying ─────────────────────────── */}
      {isPaymentHeld && !repayMode && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setRepayMode(true)}
            className="text-[11px] text-slate-500 hover:text-umak-navy font-semibold underline cursor-pointer"
          >
            Need to pay again using a different account? Click here to launch a new payment checkout.
          </button>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-1/3 py-3 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <button
          type="submit"
          id="btn-submit-sticker"
          disabled={loading || !isUploadUnlocked || !files.payment_proof_doc}
          className={`w-2/3 py-3 font-bold text-xs rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white ${
            isPaymentHeld && !repayMode
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              : 'bg-gradient-to-r from-umak-navy to-umak-navycard hover:from-umak-navydark hover:to-umak-navy shadow-umak-navy/20'
          }`}
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Submitting Proof...
            </>
          ) : (
            <>
              <i className={`fa-solid ${isPaymentHeld && !repayMode ? 'fa-cloud-arrow-up' : 'fa-check'} text-xs`} />
              <span>{isPaymentHeld && !repayMode ? 'Submit Updated Payment Proof' : 'Submit Final Application'}</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
