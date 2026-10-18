import React from 'react';
import { DocumentUploadCard } from './DocumentUploadCard';

// ===== PHILIPPINE LTO & UMAK VALIDATION REGEX RULES =====
export const VALIDATION_RULES = {
  // LTO License: 1 Letter + 2 Digits - 2 Digits - 6 Digits (e.g. N01-12-345678)
  licenseNumber: /^[A-Z]\d{2}-\d{2}-\d{6}$/i,
  // LTO Plate: ABC 1234, 123 ABC, 1234 AB, 11-15 digit MV File No, or E-BIKE
  plateNumber: /^[A-Z]{2,3}\s?\d{3,4}$|^[0-9]{3,4}\s?[A-Z]{2,3}$|^\d{4}\s?[A-Z]{2}$|^\d{11,15}$|^E-?BIKE$/i,
  // LTO OR: 7 to 15 digits, optionally prefixed with OR- or 4-digit code (e.g. 18490000012345 or OR-98765432)
  orNumber: /^(OR-)?\d{7,15}$|^\d{4}-\d{6,10}$/i,
  // LTO CR: 7 to 12 digits, optionally prefixed with CR- (e.g. 501234567 or CR-12345678)
  crNumber: /^(CR-)?\d{7,12}$/i,
  // UMak ID: Min 6 alphanumeric chars starting with letter (e.g. K12345678 or A12241719)
  studentId: /^[A-Z0-9-]{6,15}$/i,
};

/**
 * Auto-formats Driver's License input with hyphens:
 * 1st char = Letter, next 10 chars = Digits ONLY (e.g. N01-12-345678)
 */
export const formatDriverLicense = (value) => {
  if (!value) return '';
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length === 0) return '';

  // First character must be a letter (A-Z)
  const firstChar = raw[0];
  if (!/[A-Z]/.test(firstChar)) {
    return '';
  }

  // Next characters must be NUMERIC DIGITS ONLY (0-9)
  const restDigits = raw.slice(1).replace(/[^0-9]/g, '').slice(0, 10);
  const fullClean = firstChar + restDigits;

  if (fullClean.length <= 3) return fullClean;
  if (fullClean.length <= 5) return `${fullClean.slice(0, 3)}-${fullClean.slice(3)}`;
  return `${fullClean.slice(0, 3)}-${fullClean.slice(3, 5)}-${fullClean.slice(5, 11)}`;
};

/**
 * Auto-formats Plate Number to Uppercase
 */
export const formatPlateNumber = (value) => {
  if (!value) return '';
  return value.toUpperCase();
};

/**
 * Step 1 Component: Vehicle Details & Required Document Attachments
 */
export const StickerFormStep1 = ({
  formData,
  setFormData,
  files,
  filePreviews,
  handleInputChange,
  handleFileChange,
  handleRemoveFile,
  handleProceedToPayment,
  setIsTutorialOpen
}) => {

  // Validation States
  const isIdValid = VALIDATION_RULES.studentId.test(formData.student_id_num.trim());
  const isPlateValid = VALIDATION_RULES.plateNumber.test(formData.plate_number.trim());
  const isLicenseValid = VALIDATION_RULES.licenseNumber.test(formData.license_number.trim());
  const isOrValid = VALIDATION_RULES.orNumber.test(formData.or_number.trim());
  const isCrValid = VALIDATION_RULES.crNumber.test(formData.cr_number.trim());

  // Files uploaded check
  const areFilesUploaded = files.student_id_doc && files.or_cr_doc && files.license_doc;
  const isFormValid = isIdValid && isPlateValid && isLicenseValid && isOrValid && isCrValid && areFilesUploaded && formData.vehicle_make.trim().length >= 3;

  // Customized handlers for auto-masking
  const onLicenseInputChange = (e) => {
    const formatted = formatDriverLicense(e.target.value);
    setFormData(prev => ({ ...prev, license_number: formatted }));
  };

  const onPlateInputChange = (e) => {
    const formatted = formatPlateNumber(e.target.value);
    setFormData(prev => ({ ...prev, plate_number: formatted }));
  };

  const onOrInputChange = (e) => {
    setFormData(prev => ({ ...prev, or_number: e.target.value.toUpperCase() }));
  };

  const onCrInputChange = (e) => {
    setFormData(prev => ({ ...prev, cr_number: e.target.value.toUpperCase() }));
  };

  const onIdInputChange = (e) => {
    setFormData(prev => ({ ...prev, student_id_num: e.target.value.toUpperCase() }));
  };

  return (
    <form onSubmit={handleProceedToPayment} className="space-y-4 max-h-[75vh] sm:max-h-[70vh] overflow-y-auto touch-scroll pr-1">

      {/* Student ID */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Student / Faculty ID Number</label>
        <div className="relative">
          <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            type="text"
            name="student_id_num"
            value={formData.student_id_num}
            onChange={onIdInputChange}
            placeholder="e.g. K12345678"
            required
            className={`w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:bg-white transition-colors ${formData.student_id_num.length === 0
                ? 'border-slate-300 focus:border-umak-orange'
                : isIdValid
                  ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                  : 'border-red-400 focus:border-red-500 bg-red-50/20'
              }`}
          />
        </div>
        {formData.student_id_num.length > 0 && (
          <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${isIdValid ? 'text-emerald-600' : 'text-red-500'
            }`}>
            <i className={`fa-solid ${isIdValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
            <span>{isIdValid ? 'Valid UMak ID format' : 'Min 6 alphanumeric characters (e.g. K12345678)'}</span>
          </div>
        )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Plate Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Plate / MV File No.</label>
          <input
            type="text"
            name="plate_number"
            value={formData.plate_number}
            onChange={onPlateInputChange}
            placeholder="ABC 1234 or MV File No."
            required
            className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 uppercase font-mono font-bold focus:outline-none focus:bg-white transition-colors ${formData.plate_number.length === 0
                ? 'border-slate-300 focus:border-umak-orange'
                : isPlateValid
                  ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                  : 'border-red-400 focus:border-red-500 bg-red-50/20'
              }`}
          />
          {formData.plate_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${isPlateValid ? 'text-emerald-600' : 'text-red-500'
              }`}>
              <i className={`fa-solid ${isPlateValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{isPlateValid ? 'Official LTO Plate format' : 'Format: ABC 1234 or MV File No.'}</span>
            </div>
          )}
        </div>

        {/* Driver's License Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Driver's License No.</label>
          <input
            type="text"
            name="license_number"
            value={formData.license_number}
            onChange={onLicenseInputChange}
            placeholder="N01-12-345678"
            maxLength={13}
            required
            className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:bg-white transition-colors ${formData.license_number.length === 0
                ? 'border-slate-300 focus:border-umak-orange'
                : isLicenseValid
                  ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                  : 'border-red-400 focus:border-red-500 bg-red-50/20'
              }`}
          />
          {formData.license_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${isLicenseValid ? 'text-emerald-600' : 'text-red-500'
              }`}>
              <i className={`fa-solid ${isLicenseValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{isLicenseValid ? 'Official LTO License format' : 'Format: A00-00-000000'}</span>
            </div>
          )}
        </div>
      </div>

      {/* LTO OR & CR Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* LTO OR Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">LTO OR Number</label>
          <input
            type="text"
            name="or_number"
            value={formData.or_number}
            onChange={onOrInputChange}
            placeholder="OR-98765432"
            required
            className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:bg-white transition-colors ${formData.or_number.length === 0
                ? 'border-slate-300 focus:border-umak-orange'
                : isOrValid
                  ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                  : 'border-red-400 focus:border-red-500 bg-red-50/20'
              }`}
          />
          {formData.or_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${isOrValid ? 'text-emerald-600' : 'text-red-500'
              }`}>
              <i className={`fa-solid ${isOrValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{isOrValid ? 'Valid LTO OR Number' : 'Min 8 characters (e.g. OR-98765432)'}</span>
            </div>
          )}
        </div>

        {/* LTO CR Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">LTO CR Number</label>
          <input
            type="text"
            name="cr_number"
            value={formData.cr_number}
            onChange={onCrInputChange}
            placeholder="CR-12345678"
            required
            className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:bg-white transition-colors ${formData.cr_number.length === 0
                ? 'border-slate-300 focus:border-umak-orange'
                : isCrValid
                  ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                  : 'border-red-400 focus:border-red-500 bg-red-50/20'
              }`}
          />
          {formData.cr_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${isCrValid ? 'text-emerald-600' : 'text-red-500'
              }`}>
              <i className={`fa-solid ${isCrValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{isCrValid ? 'Valid LTO CR Number' : 'Min 7 characters (e.g. CR-12345678)'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== ENCRYPTED FILE UPLOADS SECTION ===== */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <i className="fa-solid fa-lock text-emerald-600"></i> Encrypted Document Uploads & Previews
          </span>
          <span className="text-[10px] font-mono text-slate-400">Max 5MB (JPG, PNG, WEBP, PDF)</span>
        </div>

        {/* 1. Student / Faculty ID Photo */}
        <DocumentUploadCard
          label="1. Student / Faculty ID Photo"
          fileKey="student_id_doc"
          file={files.student_id_doc}
          preview={filePreviews.student_id_doc}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          required={true}
        />

        {/* 2. LTO OR/CR Document */}
        <DocumentUploadCard
          label="2. LTO OR / CR Photo"
          fileKey="or_cr_doc"
          file={files.or_cr_doc}
          preview={filePreviews.or_cr_doc}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          required={true}
        />

        {/* 3. Driver's License Document */}
        <DocumentUploadCard
          label="3. Driver's License Photo"
          fileKey="license_doc"
          file={files.license_doc}
          preview={filePreviews.license_doc}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          required={true}
        />
      </div>

      {/* Step 1 Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid}
        className={`w-full py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${isFormValid
            ? 'bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600 text-white cursor-pointer'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
          }`}
      >
        <span>Proceed to Payment (₱200.00)</span>
        <i className="fa-solid fa-arrow-right"></i>
      </button>

      {!isFormValid && (
        <p className="text-[11px] text-center text-slate-500 font-medium">
          {!areFilesUploaded
            ? '⚠️ Please upload all 3 required document photos to proceed.'
            : '⚠️ Please fix invalid field formats above to proceed.'}
        </p>
      )}
    </form>
  );
};
