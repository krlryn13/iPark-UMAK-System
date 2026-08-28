import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import LocationTutorialModal from './LocationTutorialModal';
import { StickerFormStep1 } from './sticker/StickerFormStep1';
import { StickerPaymentStep2 } from './sticker/StickerPaymentStep2';
import { StickerReceiptStep3 } from './sticker/StickerReceiptStep3';

/**
 * Main Vehicle Sticker Application Modal Container
 * Modular orchestrator delegating steps to clean, single-responsibility components.
 */
export const StickerApplicationModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, authFetch } = useAuth();

  const [step, setStep] = useState(1); // 1: Form & Documents, 2: Payment, 3: E-Receipt
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

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

  // Restore draft form data if returning from PayMongo checkout
  React.useEffect(() => {
    if (!isOpen) return;
    const savedDraft = localStorage.getItem('ipark_sticker_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) {
          setFormData(parsed.formData);
          if (parsed.step) setStep(parsed.step);
        }
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!files.student_id_doc || !files.or_cr_doc || !files.license_doc) {
      setError('Please upload all 3 required documents: Student ID photo, LTO OR/CR photo, and Driver’s License photo.');
      return;
    }

    setLoading(true);

    try {
      // Upload Step 1 details & 3 documents to backend immediately
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
        setError(data.error || 'Failed to save Step 1 documents.');
        setLoading(false);
        return;
      }

      // Save draft info in localStorage
      localStorage.setItem('ipark_sticker_draft', JSON.stringify({ formData, step: 2 }));
      setLoading(false);
      setStep(2);
    } catch (err) {
      setError('Connection error: Unable to upload Step 1 documents to server.');
      setLoading(false);
    }
  };

  // Launch Official PayMongo REST API Checkout Session
  const handleLaunchPayMongoCheckout = async () => {
    setLoading(true);
    setError('');

    // Save draft in localStorage before opening PayMongo checkout
    localStorage.setItem('ipark_sticker_draft', JSON.stringify({ formData, step: 2 }));

    try {
      const refNo = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await authFetch(`${API_BASE_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 200.00,
          description: `UMak Vehicle Sticker (${formData.plate_number.toUpperCase()})`,
          referenceNo: refNo,
          returnUrl: window.location.origin + '/dashboard'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to initialize PayMongo REST API checkout.');
        setLoading(false);
        return;
      }

      setLoading(false);
      window.open(data.checkoutUrl, '_blank');

    } catch (err) {
      setError('Connection error: Failed to connect to PayMongo API service.');
      setLoading(false);
    }
  };

  // Final Step 2 Submission (Process Application & Files)
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!files.payment_proof_doc) {
      setError('Upload Required: Please attach your GCash, Maya, or Card payment receipt screenshot before submitting.');
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
      submitData.append('payment_method', 'PayMongo API');

      // Only send payment_proof_doc for Step 2 payment verification (Step 1 docs are already safely saved)
      if (files.payment_proof_doc) submitData.append('payment_proof_doc', files.payment_proof_doc);

      const res = await authFetch(`${API_BASE_URL}/api/stickers/apply`, {
        method: 'POST',
        body: submitData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Payment transaction failed.');
        setLoading(false);
        return;
      }

      // Clear saved draft from localStorage
      localStorage.removeItem('ipark_sticker_draft');

      setReceiptData({
        refNo: data.paymentRefNo,
        amount: 200.00,
        date: new Date().toLocaleString(),
        vehicleType: formData.vehicle_type,
        plateNumber: formData.plate_number.toUpperCase(),
        method: 'PayMongo API',
        applicant: currentUser.name,
        email: currentUser.email
      });

      setLoading(false);
      setStep(3);
      if (onSuccess) onSuccess();

    } catch (err) {
      setError('Connection error. Please ensure backend server is running.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-slate-800 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-umak-orange font-bold">Official Campus Access</span>
            <h3 className="text-lg font-bold font-display text-slate-900">
              {step === 1 ? 'Apply for Vehicle Sticker' : step === 2 ? 'PayMongo API Gateway' : 'Application Receipt'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 pb-1">
          <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-umak-navy' : 'bg-slate-200'}`}></div>
          <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-umak-navy' : 'bg-slate-200'}`}></div>
          <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <i className="fa-solid fa-shield-cat text-red-500 mt-0.5 flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 Component */}
        {step === 1 && (
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
          />
        )}

        {/* Step 2 Component */}
        {step === 2 && (
          <StickerPaymentStep2
            files={files}
            filePreviews={filePreviews}
            loading={loading}
            setStep={setStep}
            handleFileChange={handleFileChange}
            handleRemoveFile={handleRemoveFile}
            handleLaunchPayMongoCheckout={handleLaunchPayMongoCheckout}
            handleProcessPayment={handleProcessPayment}
          />
        )}

        {/* Step 3 Component */}
        {step === 3 && (
          <StickerReceiptStep3
            receiptData={receiptData}
            onClose={onClose}
            setIsTutorialOpen={setIsTutorialOpen}
          />
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
