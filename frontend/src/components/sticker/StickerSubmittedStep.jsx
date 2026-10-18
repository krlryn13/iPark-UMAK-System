import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { formatDateClean } from '../../utils/dateUtils';

const BrandIcon = ({ method = 'gcash', size = 20 }) => {
  const m = String(method).toLowerCase();
  if (m.includes('gcash')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
        <rect width="48" height="48" rx="12" fill="#007EFC" />
        <path d="M24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38C30.05 38 35.19 34.15 37.14 28.75H24V22.25H43.68C43.89 22.82 44 23.4 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4C30.68 4 36.57 7.28 40.2 12.35L34.6 15.75C32.1 12.25 28.3 10 24 10Z" fill="white" />
      </svg>
    );
  }
  if (m.includes('maya')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
        <rect width="48" height="48" rx="12" fill="#00B388" />
        <path d="M12 34V14L21 27.5L30 14V34" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="36" cy="31" r="3" fill="#FBBF24" />
      </svg>
    );
  }
  if (m.includes('qrph')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
        <rect width="48" height="48" rx="12" fill="#0F2C59" />
        <rect x="10" y="10" width="12" height="12" rx="3" fill="#F59E0B" />
        <rect x="26" y="10" width="12" height="12" rx="3" fill="#EF4444" />
        <rect x="10" y="26" width="12" height="12" rx="3" fill="#3B82F6" />
        <rect x="13" y="13" width="6" height="6" rx="1.5" fill="white" />
        <rect x="29" y="13" width="6" height="6" rx="1.5" fill="white" />
        <rect x="13" y="29" width="6" height="6" rx="1.5" fill="white" />
        <rect x="26" y="26" width="5" height="5" rx="1" fill="#F59E0B" />
        <rect x="33" y="26" width="5" height="5" rx="1" fill="white" />
        <rect x="26" y="33" width="5" height="5" rx="1" fill="white" />
        <rect x="33" y="33" width="5" height="5" rx="1" fill="#EF4444" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
      <rect width="48" height="48" rx="12" fill="#1E293B" />
      <circle cx="20" cy="24" r="9" fill="#EB001B" />
      <circle cx="28" cy="24" r="9" fill="#F79E1B" fillOpacity="0.85" />
      <path d="M24 17.5C25.5 19.3 26.4 21.5 26.4 24C26.4 26.5 25.5 28.7 24 30.5C22.5 28.7 21.6 26.5 21.6 24C21.6 21.5 22.5 19.3 24 17.5Z" fill="#FF5F00" />
    </svg>
  );
};


const getDocUrl = (pathStr) => {
  if (!pathStr) return null;
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  if (pathStr.startsWith('/uploads/') && !pathStr.startsWith('/uploads/documents/')) {
    return `${API_BASE_URL}/uploads/documents/${pathStr.replace('/uploads/', '')}`;
  }
  return `${API_BASE_URL}${pathStr}`;
};

export const StickerSubmittedStep = ({ applicationData, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'receipt'
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const applicantName = applicationData?.applicant_name || 'Applicant';
  const studentIdNum = applicationData?.student_id_num || 'N/A';
  const plateNumber = applicationData?.plate_number || 'N/A';
  const vehicleType = applicationData?.vehicle_type || 'car';
  const vehicleMake = applicationData?.vehicle_make || 'Standard Vehicle';
  const email = applicationData?.email || 'your registered email';
  const status = applicationData?.status || 'pending_review';
  const paymentRefNo = applicationData?.payment_ref_no || 'PAY-PENDING';
  const paymentMethod = applicationData?.payment_method || 'gcash';
  const amount = applicationData?.amount || 200.00;
  const claimDate = applicationData?.claim_date;
  const paymentProofDoc = applicationData?.payment_proof_doc;

  const isPaymentVerification = status === 'payment_submitted';
  const proofUrl = getDocUrl(paymentProofDoc);

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${window.location.origin}/verify-sticker?ref=${paymentRefNo}`
  )}`;

  // ==========================================
  // CASE 1: DOCUMENTS SUBMITTED (PHASE 1)
  // ==========================================
  if (!isPaymentVerification) {
    return (
      <div className="py-2 text-center space-y-5 animate-in fade-in">
        {/* Icon Status Indicator */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <i className="fa-solid fa-file-circle-check text-3xl text-emerald-600"></i>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md text-xs">
            <i className="fa-solid fa-clock"></i>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-black text-[#0A1F5C]">
            Documents Submitted for Review!
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your application and vehicle documents have been securely uploaded to the UMak OHSO Security portal.
          </p>
        </div>

        {/* Details Card */}
        <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Applicant:</span>
            <span className="font-bold text-slate-800">{applicantName}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Student ID / Faculty ID:</span>
            <span className="font-mono font-bold text-slate-800">{studentIdNum}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Plate Number:</span>
            <span className="font-mono font-bold text-slate-800 uppercase">{plateNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Vehicle Type & Make:</span>
            <span className="font-bold text-slate-800 uppercase">{vehicleMake} ({vehicleType})</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Review Status:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] uppercase tracking-wide">
              Pending OHSO Document Review
            </span>
          </div>
        </div>

        {/* What happens next */}
        <div className="max-w-md mx-auto bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0A1F5C] uppercase tracking-wider">
            <i className="fa-solid fa-envelope text-blue-600"></i>
            <span>What Happens Next?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please <strong>wait for our email</strong> at <span className="font-semibold text-slate-800">{email}</span>:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
            <li>OHSO Security officers will inspect your submitted OR/CR, Driver's License, and ID.</li>
            <li>Once approved, you will receive an email stating your <strong>scheduled sticker pickup date</strong>.</li>
            <li>You will then be prompted in this portal to <strong>pay the ₱200 sticker fee and upload your payment proof</strong>.</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0A1F5C] hover:bg-[#122b7a] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Understood, Close Window
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: PAYMENT PROOF SUBMITTED (LOCKED)
  // ==========================================
  return (
    <div className="space-y-4 animate-in fade-in">

      {/* 🔒 Strict Locked Banner */}
      <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm text-sm">
          <i className="fa-solid fa-lock"></i>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
              Payment Submitted & Details Locked
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
              Verification In Progress
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Your ₱200 payment and proof have been securely submitted. Payment details are locked and cannot be edited while under OHSO admin verification.
          </p>
        </div>
      </div>

      {/* Subtab Switcher: Payment Summary vs Official E-Receipt */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('summary')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeSubTab === 'summary'
              ? 'bg-white text-umak-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <i className="fa-solid fa-list-check text-umak-orange"></i>
          <span>Payment Summary & Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('receipt')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeSubTab === 'receipt'
              ? 'bg-white text-umak-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <i className="fa-solid fa-receipt text-emerald-600"></i>
          <span>Official E-Receipt & QR</span>
        </button>
      </div>

      {/* VIEW 1: PAYMENT SUMMARY & DETAILS */}
      {activeSubTab === 'summary' && (
        <div className="space-y-3.5">
          {/* Main Payment Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Transaction Details
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                <BrandIcon method={paymentMethod} size={18} />
                <span className="text-xs font-extrabold text-slate-800 uppercase font-mono">
                  {paymentMethod}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reference Number:</span>
                <span className="font-mono font-bold text-slate-900 text-xs block break-all">
                  {paymentRefNo}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount Paid:</span>
                <span className="font-extrabold text-emerald-600 text-sm block">
                  ₱{Number(amount).toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant / Student ID:</span>
                <span className="font-bold text-slate-800 block truncate">
                  {applicantName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {studentIdNum}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Vehicle:</span>
                <span className="font-mono font-bold text-slate-900 block uppercase">
                  {plateNumber}
                </span>
                <span className="text-[10px] text-slate-500 capitalize block">
                  {vehicleMake} ({vehicleType})
                </span>
              </div>
            </div>

            {/* Scheduled Pickup Date Alert */}
            {claimDate && (
              <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-calendar-check text-emerald-600 text-base"></i>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Scheduled Sticker Pickup:</span>
                    <span className="font-extrabold text-emerald-950 text-xs font-mono">
                      {formatDateClean(claimDate)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                  OHSO Ground Floor
                </span>
              </div>
            )}
          </div>

          {/* Uploaded Payment Proof Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <div>
                <h5 className="text-xs font-extrabold text-slate-900">Submitted Proof of Payment</h5>
                <p className="text-[10px] text-slate-500">Screenshot attached with payment reference code</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                  <i className="fa-solid fa-circle-check text-[8px]"></i> Attached & Under Review
                </span>
              </div>
            </div>

            {proofUrl ? (
              <button
                type="button"
                onClick={() => setIsProofModalOpen(true)}
                className="px-4 py-2.5 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                <i className="fa-solid fa-eye text-amber-400"></i>
                <span>View Receipt Proof</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">No image file found</span>
            )}
          </div>

          {/* Verification Stepper Timeline */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Application Progress
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-700 font-bold">
                <i className="fa-solid fa-circle-check text-sm text-emerald-600"></i>
                <span>Phase 1: Documents Verified by OHSO</span>
              </div>
              <div className="flex items-center gap-2.5 text-amber-700 font-bold">
                <i className="fa-solid fa-spinner animate-spin text-sm text-amber-600"></i>
                <span>Phase 2: Payment Proof Under Verification (Locked)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <i className="fa-regular fa-circle text-sm"></i>
                <span>Phase 3: Ready for Release & Sticker Pickup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: OFFICIAL E-RECEIPT & QR CODE */}
      {activeSubTab === 'receipt' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-4 text-xs font-mono">
            {/* Receipt Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="font-extrabold text-umak-navy text-sm block">UMak OHSO E-Receipt</span>
                <span className="text-[10px] text-slate-500">Official Electronic Payment Acknowledgement</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold uppercase text-[10px] border border-amber-300">
                PROOF SUBMITTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Receipt Rows */}
              <div className="sm:col-span-8 space-y-2">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Ref Code:</span>
                  <span className="font-bold text-slate-900 break-all">{paymentRefNo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{applicantName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Plate Number:</span>
                  <span className="font-bold text-slate-900 uppercase">{plateNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Fee Paid:</span>
                  <span className="font-black text-emerald-600 text-sm">₱{Number(amount).toFixed(2)}</span>
                </div>
                {claimDate && (
                  <div className="flex justify-between text-blue-900 pt-0.5">
                    <span className="font-bold">Claim Schedule:</span>
                    <span className="font-bold">{formatDateClean(claimDate)}</span>
                  </div>
                )}
              </div>

              {/* QR Code Container */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 text-center">
                <img
                  src={qrCodeApiUrl}
                  alt="Payment QR Verification Code"
                  className="w-24 h-24 object-contain"
                />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Scan to Verify
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-print"></i> Print Receipt
            </button>
            {proofUrl && (
              <button
                type="button"
                onClick={() => setIsProofModalOpen(true)}
                className="flex-1 py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-receipt text-amber-400"></i> View Uploaded Proof
              </button>
            )}
          </div>
        </div>
      )}

      {/* Done & Close Button */}
      <div className="pt-1 flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-check"></i> Close Summary Window
        </button>
      </div>

      {/* Full-Size Uploaded Proof Lightbox Modal */}
      {isProofModalOpen && proofUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-200 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-receipt text-emerald-600 text-base"></i>
                <h4 className="text-sm font-bold text-slate-900">Uploaded Payment Proof Screenshot</h4>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="w-full h-80 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {proofUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center p-6 space-y-3">
                  <i className="fa-solid fa-file-pdf text-5xl text-red-500"></i>
                  <p className="text-xs font-bold text-slate-700">PDF Receipt Document</p>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-umak-navy text-white text-xs font-bold rounded-xl"
                  >
                    Open PDF in New Window
                  </a>
                </div>
              ) : (
                <img
                  src={proofUrl}
                  alt="Proof of Payment"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="font-mono font-bold text-slate-500">{paymentRefNo}</span>
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Open Full Size
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StickerSubmittedStep;
