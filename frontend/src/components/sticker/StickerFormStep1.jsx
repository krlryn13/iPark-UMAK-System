import React from 'react';
import { DocumentUploadCard } from './DocumentUploadCard';

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
            onChange={handleInputChange}
            placeholder="e.g. K12345678"
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
          />
        </div>
        {formData.student_id_num.length > 0 && (
          <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${
            formData.student_id_num.trim().length >= 4 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            <i className={`fa-solid ${formData.student_id_num.trim().length >= 4 ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
            <span>{formData.student_id_num.trim().length >= 4 ? 'Valid ID number format' : 'Enter valid ID number'}</span>
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
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              formData.vehicle_type === 'car'
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
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              formData.vehicle_type === 'motorcycle'
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
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              formData.vehicle_type === 'ebike'
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
          {formData.plate_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${
              formData.plate_number.trim().length >= 3 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              <i className={`fa-solid ${formData.plate_number.trim().length >= 3 ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{formData.plate_number.trim().length >= 3 ? 'Valid plate format' : 'Min 3 characters'}</span>
            </div>
          )}
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
          {formData.license_number.length > 0 && (
            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${
              formData.license_number.trim().length >= 5 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              <i className={`fa-solid ${formData.license_number.trim().length >= 5 ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
              <span>{formData.license_number.trim().length >= 5 ? 'Valid license format' : 'Min 5 characters'}</span>
            </div>
          )}
        </div>
      </div>

      {/* LTO OR & CR Numbers */}
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
        className="w-full py-3 bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
      >
        <span>Proceed to Payment (₱200.00)</span>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </form>
  );
};
