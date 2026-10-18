import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import LocationTutorialModal from './LocationTutorialModal';
import StickerRequirementsStep from './sticker/StickerRequirementsStep';
import { StickerFormStep1 } from './sticker/StickerFormStep1';
import { StickerPaymentStep2 } from './sticker/StickerPaymentStep2';
import { StickerReceiptStep3 } from './sticker/StickerReceiptStep3';
import StickerSubmittedStep from './sticker/StickerSubmittedStep';
import { formatDateClean } from '../utils/dateUtils';

/**
 * Step mapping:
 * 1: Requirements Checklist (StickerRequirementsStep)
 * 2: Form & Document Upload (StickerFormStep1)
 * 3: Submitted / Awaiting Email (StickerSubmittedStep)
 * 4: Approved Payment (StickerPaymentStep2)
 * 5: E-Receipt (StickerReceiptStep3)
 */

export const StickerApplicationModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, authFetch } = useAuth();

  const [step, setStep] = useState(1);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [existingApplication, setExistingApplication] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const [formData, setFormData] = useState({
    student_id_num: '',
    vehicle_type: 'car',
    vehicle_make: '',
    plate_number: '',
    or_number: '',
    cr_number: '',
    license_number: ''
  });

  const [files, setFiles] = useState({
    student_id_doc: null,
    or_cr_doc: null,
    license_doc: null,
    payment_proof_doc: null
  });

  const [filePreviews, setFilePreviews] = useState({
    student_id_doc: null,
    or_cr_doc: null,
    license_doc: null,
    payment_proof_doc: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [paymongoSession, setPaymongoSession] = useState(null);

  // ─── On modal open: check DB for existing apps ───
  useEffect(() => {
    if (!isOpen) return;

    setShowCloseConfirm(false);
    setError('');

    const initModal = async () => {
      if (!currentUser?.id) return;
      setCheckingExisting(true);

      try {
        const res = await authFetch(`${API_BASE_URL}/api/stickers/user/${currentUser.id}`);
        if (res.ok) {
          const stickers = await res.json();

          const isWithinOneYear = (dateStr) => {
            if (!dateStr) return true;
            return new Date(dateStr) >= new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000);
          };

          const active = (stickers || []).find(s => {
            if (s.status === 'expired') return false;
            if ((s.status === 'issued' || s.status === 'claimed') && !isWithinOneYear(s.created_at)) return false;
            return true;
          });

          if (active) {
            setExistingApplication(active);

            setFormData({
              student_id_num: active.student_id_num || '',
              vehicle_type: active.vehicle_type || 'car',
              vehicle_make: active.vehicle_make || '',
              plate_number: active.plate_number || '',
              or_number: active.or_number || '',
              cr_number: active.cr_number || '',
              license_number: active.license_number || ''
            });

            // 1. Ready for release, Paid, Claimed, or Issued -> Show E-Receipt / Digital Pass (Step 5)
            if (active.status === 'ready_for_release' || active.payment_status === 'paid' || active.status === 'paid' || active.status === 'claimed' || active.status === 'issued') {
              setReceiptData({
                refNo: active.payment_ref_no || 'PAID',
                amount: active.amount || 200.00,
                baseFee: 200.00,
                date: new Date(active.created_at).toLocaleString(),
                claimDate: active.claim_date || null,
                vehicleType: active.vehicle_type,
                plateNumber: active.plate_number,
                method: active.payment_method
                  ? active.payment_method.replace('paymongo:', '').replace('PayMongo:', '').toUpperCase()
                  : 'PAYMONGO',
                applicant: active.applicant_name || currentUser.name,
                email: active.email || currentUser.email,
                status: active.status,
                stickerNumber: active.sticker_number
              });
              setStep(5);
              setCheckingExisting(false);
              return;
            }

            // 1B. Payment submitted -> Waiting for admin to verify proof of payment
            if (active.status === 'payment_submitted') {
              setExistingApplication(active);
              setStep(3);
              setCheckingExisting(false);
              return;
            }

            // 1C. Payment on hold / proof rejected -> User needs to re-upload proof of payment without paying again
            if (active.status === 'payment_held' || (active.status === 'approved' && active.rejection_reason)) {
              setExistingApplication(active);
              const savedSessionStr = localStorage.getItem('ipark_paymongo_session');
              let existingSession = null;
              if (savedSessionStr) {
                try { existingSession = JSON.parse(savedSessionStr); } catch (e) { }
              }
              const paymentRef = active.payment_ref_no || existingSession?.referenceNo || 'RECORDED-PAYMENT';
              const paymentMethod = (active.payment_method || existingSession?.paymentMethod || 'gcash').toLowerCase().replace('paymongo:', '').trim();
              setPaymongoSession({
                sessionId: existingSession?.sessionId || paymentRef,
                referenceNo: paymentRef,
                paymentId: paymentRef,
                paymentMethod: paymentMethod,
                isPaid: true,
                amount: active.amount || 200.00
              });
              setStep(4);
              setCheckingExisting(false);
              return;
            }

            // 2. Approved and Unpaid -> Show Payment Step (Step 4)
            if (active.status === 'approved' && active.payment_status !== 'paid') {
              const savedSessionStr = localStorage.getItem('ipark_paymongo_session');
              let sessionToVerify = null;
              if (savedSessionStr) {
                try { sessionToVerify = JSON.parse(savedSessionStr); } catch (e) { }
              }

              if (sessionToVerify?.sessionId) {
                try {
                  const verifyRes = await authFetch(`${API_BASE_URL}/api/payment/verify-session/${sessionToVerify.sessionId}`);
                  if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    if (verifyData.isPaid) {
                      sessionToVerify.isPaid = true;
                      sessionToVerify.paymentId = verifyData.paymentId || sessionToVerify.referenceNo;
                      localStorage.setItem('ipark_paymongo_session', JSON.stringify(sessionToVerify));
                    }
                  }
                } catch (vErr) {
                  console.warn('[VERIFY SESSION WARN]', vErr.message);
                }
              }

              setStep(4);
              if (sessionToVerify) {
                setPaymongoSession(sessionToVerify);
              }
              setCheckingExisting(false);
              return;
            }

            // 3. Rejected -> Show Requirements step with rejection alert so they can resubmit
            if (active.status === 'rejected') {
              setStep(1);
              setCheckingExisting(false);
              return;
            }

            // 4. Pending Review -> Show Step 3 (Submitted & Waiting for Email)
            if (active.status === 'pending_review' || active.status === 'pending') {
              setStep(3);
              setCheckingExisting(false);
              return;
            }
          } else {
            // Fresh user without applications
            setExistingApplication(null);
            setStep(1);
          }
        }
      } catch (e) {
        console.warn('[STICKER MODAL] Could not check existing application:', e.message);
      }

      setCheckingExisting(false);
    };

    initModal();
  }, [isOpen]);

  // ─── Listen for PayMongo return events (cross-tab broadcast & window focus) ───
  useEffect(() => {
    if (!isOpen) return;

    const checkSessionPaymentStatus = async () => {
      const savedSessionStr = localStorage.getItem('ipark_paymongo_session');
      if (!savedSessionStr) return;
      try {
        const session = JSON.parse(savedSessionStr);
        if (session?.sessionId && !session?.isPaid) {
          const verifyRes = await authFetch(`${API_BASE_URL}/api/payment/verify-session/${session.sessionId}`);
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.isPaid) {
              const updated = {
                ...session,
                isPaid: true,
                paymentId: verifyData.paymentId || session.referenceNo
              };
              setPaymongoSession(updated);
              localStorage.setItem('ipark_paymongo_session', JSON.stringify(updated));
            }
          }
        }
      } catch (e) { }
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('ipark_paymongo_payment');
      bc.onmessage = () => {
        checkSessionPaymentStatus();
      };
    } catch (e) { }

    const handleWindowMessage = (event) => {
      if (event?.data?.type === 'PAYMONGO_PAYMENT_RETURN') {
        checkSessionPaymentStatus();
      }
    };
    window.addEventListener('message', handleWindowMessage);

    const handleStorageChange = (e) => {
      if (e.key === 'ipark_paymongo_return_trigger') {
        checkSessionPaymentStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleWindowFocus = () => {
      checkSessionPaymentStatus();
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isOpen, authFetch]);

  if (!isOpen) return null;

  const handleCloseRequest = () => {
    if (step === 3 || step === 5) {
      doClose(false);
      return;
    }

    const hasFormWork = Object.values(formData).some(v => v && v.length > 0 && v !== 'car');
    const hasFiles = Object.values(files).some(f => f !== null);

    if (hasFormWork || hasFiles) {
      setShowCloseConfirm(true);
    } else {
      doClose(false);
    }
  };

  const doClose = (clearAll = false) => {
    setShowCloseConfirm(false);
    if (clearAll) {
      localStorage.removeItem('ipark_sticker_draft');
      localStorage.removeItem('ipark_paymongo_session');
    }

    setPaymongoSession(null);
    setExistingApplication(null);
    setStep(1);
    setError('');
    setFormData({
      student_id_num: '', vehicle_type: 'car', vehicle_make: '',
      plate_number: '', or_number: '', cr_number: '', license_number: ''
    });
    setFiles({ student_id_doc: null, or_cr_doc: null, license_doc: null, payment_proof_doc: null });
    setFilePreviews({ student_id_doc: null, or_cr_doc: null, license_doc: null, payment_proof_doc: null });
    setReceiptData(null);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setError(`"${selectedFile.name}" type is not allowed! Only JPG, PNG, WEBP, and PDF files are accepted.`);
      e.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(`"${selectedFile.name}" exceeds the maximum allowed size limit of 5MB.`);
      e.target.value = '';
      return;
    }

    setError('');
    setFiles(prev => ({ ...prev, [field]: selectedFile }));

    if (filePreviews[field]?.url) {
      URL.revokeObjectURL(filePreviews[field].url);
    }

    const isImage = selectedFile.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(selectedFile) : null;

    setFilePreviews(prev => ({
      ...prev,
      [field]: {
        name: selectedFile.name,
        size: (selectedFile.size / (1024 * 1024)).toFixed(2),
        isImage,
        url: previewUrl
      }
    }));
  };

  const handleRemoveFile = (field) => {
    if (filePreviews[field]?.url) {
      URL.revokeObjectURL(filePreviews[field].url);
    }
    setFiles(prev => ({ ...prev, [field]: null }));
    setFilePreviews(prev => ({ ...prev, [field]: null }));
  };

  /**
   * Submit Step 2: Upload Documents for OHSO Review (No payment yet!)
   */
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!files.student_id_doc || !files.or_cr_doc || !files.license_doc) {
      setError('Please upload all 3 required documents: Student ID photo, LTO OR/CR photo, and Driver\u2019s License photo.');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('user_id', currentUser.id);
      submitData.append('applicant_name', currentUser.name);
      submitData.append('email', currentUser.email);
      submitData.append('student_id_num', formData.student_id_num);
      submitData.append('vehicle_type', formData.vehicle_type);
      submitData.append('vehicle_make', formData.vehicle_make || 'Standard Vehicle');
      submitData.append('plate_number', formData.plate_number);
      submitData.append('or_number', formData.or_number);
      submitData.append('cr_number', formData.cr_number);
      submitData.append('license_number', formData.license_number);

      if (files.student_id_doc) submitData.append('student_id_doc', files.student_id_doc);
      if (files.or_cr_doc) submitData.append('or_cr_doc', files.or_cr_doc);
      if (files.license_doc) submitData.append('license_doc', files.license_doc);

      const res = await authFetch(`${API_BASE_URL}/api/stickers/apply`, {
        method: 'POST',
        body: submitData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit documents for review.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setExistingApplication({
        id: data.applicationId,
        user_id: currentUser.id,
        applicant_name: currentUser.name,
        student_id_num: formData.student_id_num,
        plate_number: formData.plate_number,
        vehicle_type: formData.vehicle_type,
        vehicle_make: formData.vehicle_make || 'Standard Vehicle',
        or_number: formData.or_number,
        cr_number: formData.cr_number,
        license_number: formData.license_number,
        email: currentUser.email,
        status: data.status || 'pending_review'
      });
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Connection error: Unable to submit documents to server.');
      setLoading(false);
    }
  };

  /**
   * Launch PayMongo Checkout for Approved Application
   */
  const handleLaunchPayMongoCheckout = async (selectedMethod = 'gcash', totalAmount = 200.00) => {
    // If already verified as paid, do not re-launch gateway!
    if (paymongoSession?.isPaid) {
      return;
    }

    if (paymongoSession?.checkoutUrl) {
      window.open(paymongoSession.checkoutUrl, '_blank');
      return;
    }

    setLoading(true);
    setError('');

    const refNo = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const returnUrl = `${window.location.origin}/dashboard?payment=return&ref=${refNo}`;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          paymentMethod: selectedMethod,
          description: `UMak Vehicle Sticker (${formData.plate_number.toUpperCase() || 'STICKER'})`,
          referenceNo: refNo,
          returnUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to initialize PayMongo checkout.');
        setLoading(false);
        return;
      }

      const newSession = {
        sessionId: data.sessionId,
        checkoutUrl: data.checkoutUrl,
        referenceNo: data.referenceNo || refNo,
        paymentMethod: selectedMethod,
        totalAmount,
        isPaid: false
      };

      setPaymongoSession(newSession);
      localStorage.setItem('ipark_paymongo_session', JSON.stringify(newSession));
      setLoading(false);
      window.open(data.checkoutUrl, '_blank');
    } catch (err) {
      setError('Connection error: Failed to connect to PayMongo API service.');
      setLoading(false);
    }
  };

  /**
   * Complete payment for approved sticker (supports both PayMongo session and optional proof upload)
   */
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError('');

    const sessionInfo = paymongoSession || JSON.parse(localStorage.getItem('ipark_paymongo_session') || 'null');
    const appId = existingApplication?.id;

    if (!appId) {
      setError('Application reference is missing. Please refresh and try again.');
      return;
    }

    const effectiveRef = sessionInfo?.referenceNo || sessionInfo?.paymentId || existingApplication?.payment_ref_no || `PAY-${Date.now()}`;
    const effectiveMethod = sessionInfo?.paymentMethod || existingApplication?.payment_method || 'gcash';

    if (!sessionInfo?.sessionId && !files.payment_proof_doc && !existingApplication?.payment_ref_no) {
      setError('Please initiate checkout by clicking "Pay via ..." or upload your payment receipt screenshot.');
      return;
    }

    if (!files.payment_proof_doc && !existingApplication?.payment_proof_doc) {
      setError('Please attach your payment receipt screenshot.');
      return;
    }

    setLoading(true);

    try {
      const payFormData = new FormData();
      payFormData.append('applicationId', appId);
      payFormData.append('payment_method', effectiveMethod);
      payFormData.append('payment_ref_no', effectiveRef);
      if (sessionInfo?.sessionId && sessionInfo.sessionId !== effectiveRef) {
        payFormData.append('paymongo_session_id', sessionInfo.sessionId);
      }
      if (files.payment_proof_doc) {
        payFormData.append('payment_proof_doc', files.payment_proof_doc);
      }

      const res = await authFetch(`${API_BASE_URL}/api/stickers/pay`, {
        method: 'POST',
        body: payFormData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Payment recording failed.');
        setLoading(false);
        return;
      }

      localStorage.removeItem('ipark_paymongo_session');
      setPaymongoSession(null);

      setExistingApplication(prev => ({
        ...prev,
        status: 'payment_submitted',
        payment_status: 'pending',
        rejection_reason: null,
        admin_remarks: 'Payment proof resubmitted by applicant. Awaiting OHSO re-verification.',
        payment_ref_no: data.paymentRefNo || effectiveRef,
        payment_method: effectiveMethod,
        amount: 200.00,
        payment_proof_doc: filePreviews.payment_proof_doc?.url || prev?.payment_proof_doc,
        applicant_name: prev?.applicant_name || currentUser.name,
        student_id_num: prev?.student_id_num || formData.student_id_num,
        plate_number: prev?.plate_number || formData.plate_number,
        vehicle_type: prev?.vehicle_type || formData.vehicle_type,
        vehicle_make: prev?.vehicle_make || formData.vehicle_make,
        email: prev?.email || currentUser.email,
        claim_date: prev?.claim_date
      }));

      setLoading(false);
      setStep(3); // Show Step 3 (Payment Submitted & Waiting for Admin Verification)
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Connection error during payment processing.');
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return 'Requirements & Guidelines';
    if (step === 2) return 'Submit Vehicle Documents';
    if (step === 3) {
      return existingApplication?.status === 'payment_submitted'
        ? 'Payment Summary & Verification'
        : 'Review Status';
    }
    if (step === 4) {
      if (existingApplication?.status === 'payment_held' || Boolean(existingApplication?.rejection_reason)) {
        return 'Re-upload Payment Proof';
      }
      return 'Payment & Claim Date';
    }
    return 'Official Electronic Receipt';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-800 relative">

        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-white rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-umak-orange font-bold block">
                Official Campus Access
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-snug">
                {getStepTitle()}
              </h3>
            </div>
            <button
              onClick={handleCloseRequest}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 -mr-1"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Step Indicator Bar */}
          <div className="flex items-center gap-1.5 pt-3">
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-umak-navy' : 'bg-slate-200'}`} title="Requirements"></div>
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-umak-navy' : 'bg-slate-200'}`} title="Document Submission"></div>
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 3 ? (step === 3 && existingApplication?.status !== 'payment_submitted' ? 'bg-amber-500' : 'bg-umak-navy') : 'bg-slate-200'}`} title="Verification Review"></div>
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 4 || existingApplication?.status === 'payment_submitted' ? 'bg-umak-navy' : 'bg-slate-200'}`} title="Payment"></div>
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 5 ? 'bg-emerald-500' : 'bg-slate-200'}`} title="E-Receipt"></div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-5 py-4 overflow-y-auto touch-scroll flex-1 space-y-4">

          {/* Loading status */}
          {checkingExisting && (
            <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium">Checking application status...</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <i className="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Requirements Checklist */}
          {step === 1 && !checkingExisting && (
            <StickerRequirementsStep
              onProceed={() => setStep(2)}
              hasRejectedApp={existingApplication?.status === 'rejected'}
              rejectionReason={existingApplication?.rejection_reason}
            />
          )}

          {/* Step 2: Form & Document Upload */}
          {step === 2 && !checkingExisting && (
            <StickerFormStep1
              formData={formData}
              setFormData={setFormData}
              files={files}
              filePreviews={filePreviews}
              handleInputChange={handleInputChange}
              handleFileChange={handleFileChange}
              handleRemoveFile={handleRemoveFile}
              handleProceedToPayment={handleProceedToPayment}
              setIsTutorialOpen={setIsTutorialOpen}
              isSubmitting={loading}
            />
          )}

          {/* Step 3: Submitted / Awaiting Admin Review */}
          {step === 3 && !checkingExisting && (
            <StickerSubmittedStep
              applicationData={{
                applicant_name: currentUser.name,
                student_id_num: formData.student_id_num,
                plate_number: formData.plate_number,
                vehicle_type: formData.vehicle_type,
                vehicle_make: formData.vehicle_make,
                email: currentUser.email,
                status: 'pending_review',
                ...existingApplication,
                student_id_num: existingApplication?.student_id_num || formData.student_id_num,
                vehicle_make: existingApplication?.vehicle_make || formData.vehicle_make
              }}
              onClose={() => doClose(false)}
            />
          )}

          {/* Step 4: Approved Payment / Proof Re-upload */}
          {step === 4 && !checkingExisting && (
            <div className="space-y-4">
              {/* Claim Date Banner from Admin (Only when not in hold mode) */}
              {!(existingApplication?.status === 'payment_held' || Boolean(existingApplication?.rejection_reason)) && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-lg flex-shrink-0 mt-0.5"></i>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Documents Approved by OHSO</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your documents have been verified. Complete the ₱200 fee below to secure your sticker.
                    </p>
                    {existingApplication?.claim_date && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800">
                        <i className="fa-solid fa-calendar text-emerald-600 text-xs"></i>
                        <span>Scheduled Claim Date: {formatDateClean(existingApplication.claim_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <StickerPaymentStep2
                files={files}
                filePreviews={filePreviews}
                loading={loading}
                setStep={setStep}
                paymongoSession={paymongoSession}
                existingApplication={existingApplication}
                onResetPaymentSession={() => {
                  if (paymongoSession?.isPaid) return;
                  setPaymongoSession(null);
                  localStorage.removeItem('ipark_paymongo_session');
                }}
                handleFileChange={handleFileChange}
                handleRemoveFile={handleRemoveFile}
                handleLaunchPayMongoCheckout={handleLaunchPayMongoCheckout}
                handleProcessPayment={handleProcessPayment}
              />
            </div>
          )}

          {/* Step 5: Official E-Receipt */}
          {step === 5 && !checkingExisting && (
            <StickerReceiptStep3
              receiptData={receiptData}
              onClose={() => doClose(false)}
              setIsTutorialOpen={setIsTutorialOpen}
            />
          )}

        </div>

        {/* Close Confirmation Dialog */}
        {showCloseConfirm && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl sm:rounded-3xl p-4">
            <div className="text-center space-y-4 px-8 max-w-sm">
              <div className="w-14 h-14 mx-auto bg-umak-navy/10 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-2xl text-umak-navy"></i>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Close Application?</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You can reopen this modal anytime. Any saved form progress will be preserved.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => doClose(false)}
                  className="flex-1 py-2.5 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Tutorial Modal */}
        <LocationTutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />
      </div>
    </div>
  );
};

export default StickerApplicationModal;
