import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const StickerApplicationModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1); // 1: Form & Security Uploads, 2: Payment, 3: Receipt
  const [paymentMethod, setPaymentMethod] = useState('gcash');

  const [formData, setFormData] = useState({
    student_id_num: '',
    vehicle_type: 'car',
    vehicle_make: '',
    plate_number: '',
    or_number: '',
    cr_number: '',
    license_number: '',
    payment_mobile: '',
    payment_pin: '',
    card_number: '',
    card_name: '',
    card_expiry: '',
    card_cvv: ''
  });

  // Secure File Upload States
  const [files, setFiles] = useState({
    student_id_doc: null,
    or_cr_doc: null,
    license_doc: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // CLIENT-SIDE FILE SECURITY VALIDATION (Type & Size Check)
  const handleFileChange = (fieldname, e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError('');

    // 1. Extension Whitelist Check
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setError(`Security Violation: File "${selectedFile.name}" type is not allowed! Only JPG, PNG, WEBP, and PDF files are accepted.`);
      e.target.value = '';
      return;
    }

    // 2. Max File Size Check (5MB)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSizeBytes) {
      setError(`Security Violation: File "${selectedFile.name}" exceeds the maximum allowed size limit of 5MB (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB).`);
      e.target.value = '';
      return;
    }

    // File passed security checks!
    setFiles(prev => ({ ...prev, [fieldname]: selectedFile }));
  };

  // Step 1 Validation
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.student_id_num.trim()) {
      setError('Please enter your Student ID or Faculty ID number.');
      return;
    }
    if (!formData.plate_number.trim()) {
      setError('Please enter your Vehicle Plate Number or MV File Number.');
      return;
    }
    if (!formData.or_number.trim() || !formData.cr_number.trim()) {
      setError('Please enter your Official Receipt (OR) and Certificate of Registration (CR) numbers.');
      return;
    }
    if (!formData.license_number.trim()) {
      setError('Please enter your valid Driver’s License number.');
      return;
    }

    setStep(2);
  };

  // Step 2 Submission (Process Payment & Multipart Application)
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
      if (!formData.payment_mobile.trim() || formData.payment_mobile.length < 10) {
        setError(`Please enter a valid 11-digit ${paymentMethod.toUpperCase()} mobile number.`);
        return;
      }
      if (!formData.payment_pin || formData.payment_pin.length < 4) {
        setError('Please enter your 4-digit MPIN for authorization.');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!formData.card_number || formData.card_number.length < 15) {
        setError('Please enter a valid credit/debit card number.');
        return;
      }
    }

    setLoading(true);

    try {
      // Build Multipart FormData for secure file transfer
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
      submitData.append('payment_method', paymentMethod);

      if (files.student_id_doc) submitData.append('student_id_doc', files.student_id_doc);
      if (files.or_cr_doc) submitData.append('or_cr_doc', files.or_cr_doc);
      if (files.license_doc) submitData.append('license_doc', files.license_doc);

      const res = await fetch('http://localhost:5000/api/stickers/apply', {
        method: 'POST',
        body: submitData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Payment transaction failed. Please check document security requirements.');
        setLoading(false);
        return;
      }

      setReceiptData({
        refNo: data.paymentRefNo,
        amount: 200.00,
        date: new Date().toLocaleString(),
        vehicleType: formData.vehicle_type,
        plateNumber: formData.plate_number.toUpperCase(),
        method: paymentMethod.toUpperCase(),
        applicant: currentUser.name,
        email: currentUser.email
      });

      setLoading(false);
      setStep(3);
      if (onSuccess) onSuccess();

    } catch (err) {
      setError('Connection error. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 text-slate-800 relative overflow-hidden">

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-umak-navy/10 text-umak-navy flex items-center justify-center border border-umak-navy/20">
              <i className="fa-solid fa-shield-halved text-umak-orange text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900">
                {step === 1 && 'UMak Sticker Application'}
                {step === 2 && 'Online Payment Gateway (₱200.00)'}
                {step === 3 && 'Payment & Application Receipt'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1 && 'Step 1 of 3: Vehicle Info & Encrypted Document Uploads'}
                {step === 2 && 'Step 2 of 3: Instant Payment Authorization'}
                {step === 3 && 'Step 3 of 3: Official Electronic Receipt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Security Feedback Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <i className="fa-solid fa-shield-cat text-red-500 mt-0.5 flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* ===== STEP 1: VEHICLE & SECURE DOCUMENT UPLOADS ===== */}
        {step === 1 && (
          <form onSubmit={handleProceedToPayment} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student / Faculty ID Number</label>
              <div className="relative">
                <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  name="student_id_num"
                  value={formData.student_id_num}
                  onChange={handleInputChange}
                  placeholder="e.g. K12345678"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Classification</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, vehicle_type: 'car' }))}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formData.vehicle_type === 'car'
                      ? 'bg-umak-navy text-white border-umak-navy shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-car text-base"></i>
                  <span>4-Wheeler Car</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, vehicle_type: 'motorcycle' }))}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formData.vehicle_type === 'motorcycle'
                      ? 'bg-umak-navy text-white border-umak-navy shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-motorcycle text-base"></i>
                  <span>Motorcycle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, vehicle_type: 'ebike' }))}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formData.vehicle_type === 'ebike'
                      ? 'bg-umak-navy text-white border-umak-navy shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-bolt text-base"></i>
                  <span>E-Bike / Scooter</span>
                </button>
              </div>
            </div>

            {/* Vehicle Make / Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Make, Model & Color</label>
              <input
                type="text"
                name="vehicle_make"
                value={formData.vehicle_make}
                onChange={handleInputChange}
                placeholder="e.g. Toyota Vios (Black) / Honda Click (Red)"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
              />
            </div>

            {/* Plate Number & License Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plate / MV File No.</label>
                <input
                  type="text"
                  name="plate_number"
                  value={formData.plate_number}
                  onChange={handleInputChange}
                  placeholder="ABC 1234"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver's License No.</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="N01-12-345678"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LTO OR Number</label>
                <input
                  type="text"
                  name="or_number"
                  value={formData.or_number}
                  onChange={handleInputChange}
                  placeholder="OR-98765432"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LTO CR Number</label>
                <input
                  type="text"
                  name="cr_number"
                  value={formData.cr_number}
                  onChange={handleInputChange}
                  placeholder="CR-12345678"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* ===== ENCRYPTED FILE UPLOADS SECTION WITH SECURITY CHECKS ===== */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <i className="fa-solid fa-[#10B981] fa-lock text-emerald-600"></i> Encrypted Document Uploads
                </span>
                <span className="text-[10px] font-mono text-slate-400">Max 5MB (JPG, PNG, PDF)</span>
              </div>

              {/* Student ID & COR Document */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">1. Student ID & COR Photo</label>
                  {files.student_id_doc && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      <i className="fa-solid fa-check mr-1"></i> Verified
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => handleFileChange('student_id_doc', e)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-umak-navy file:text-white hover:file:bg-umak-navydark cursor-pointer"
                />
              </div>

              {/* LTO OR/CR Document */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">2. LTO OR / CR Photo</label>
                  {files.or_cr_doc && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      <i className="fa-solid fa-check mr-1"></i> Verified
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => handleFileChange('or_cr_doc', e)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-umak-navy file:text-white hover:file:bg-umak-navydark cursor-pointer"
                />
              </div>

              {/* Driver's License Document */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">3. Driver's License Photo</label>
                  {files.license_doc && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      <i className="fa-solid fa-check mr-1"></i> Verified
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => handleFileChange('license_doc', e)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-umak-navy file:text-white hover:file:bg-umak-navydark cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>Proceed to Payment (₱200.00)</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        )}

        {/* ===== STEP 2: ONLINE PAYMENT GATEWAY ===== */}
        {step === 2 && (
          <form onSubmit={handleProcessPayment} className="space-y-4">

            {/* Amount Summary Box */}
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

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gcash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === 'gcash'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-mobile-retro text-lg"></i>
                  <span className="text-xs font-extrabold">GCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('maya')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === 'maya'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-wallet text-lg"></i>
                  <span className="text-xs font-extrabold">Maya</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === 'card'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <i className="fa-solid fa-credit-card text-lg"></i>
                  <span className="text-xs font-extrabold">Credit Card</span>
                </button>
              </div>
            </div>

            {/* GCash / Maya Form */}
            {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {paymentMethod.toUpperCase()} Account Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+63</span>
                    <input
                      type="text"
                      name="payment_mobile"
                      maxLength={11}
                      value={formData.payment_mobile}
                      onChange={handleInputChange}
                      placeholder="09171234567"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-umak-orange transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit MPIN / Authorization</label>
                  <input
                    type="password"
                    name="payment_pin"
                    maxLength={4}
                    value={formData.payment_pin}
                    onChange={handleInputChange}
                    placeholder="••••"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-mono tracking-widest focus:outline-none focus:border-umak-orange transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    name="card_number"
                    maxLength={16}
                    value={formData.card_number}
                    onChange={handleInputChange}
                    placeholder="4532 •••• •••• 8901"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-umak-orange transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MM/YY</label>
                    <input
                      type="text"
                      name="card_expiry"
                      placeholder="12/28"
                      value={formData.card_expiry}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-umak-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      name="card_cvv"
                      maxLength={3}
                      placeholder="•••"
                      value={formData.card_cvv}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-umak-orange transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    Authorizing Payment...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    Pay ₱200.00 & Submit
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ===== STEP 3: DIGITAL RECEIPT & PICKUP INSTRUCTIONS ===== */}
        {step === 3 && receiptData && (
          <div className="space-y-5 animate-in fade-in">
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
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-slate-700">{receiptData.date}</span>
                </div>
              </div>
            </div>

            {/* Pickup Instructions */}
            <div className="bg-umak-navy/5 border border-umak-navy/15 rounded-2xl p-4 text-xs space-y-2">
              <h5 className="font-bold text-umak-navy flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-umak-orange"></i> Physical Sticker Pickup Instructions
              </h5>
              <p className="text-slate-600 leading-relaxed">
                Your online payment eliminates the Cash Office physical queue! Once approved by OHSO Admin, present this Ref No. (<strong>{receiptData.refNo}</strong>) or your Student ID at:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800">
                Occupational Health & Safety Office (OHSO) — Basement, Admin Building
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
