import React from 'react';

/**
 * Reusable Document Upload Box Component
 * Displays file input when empty, or instant image thumbnail / PDF document badge with remove button when attached.
 */
export const DocumentUploadCard = ({
  label,
  fileKey,
  file,
  preview,
  onFileChange,
  onRemoveFile,
  accept = '.jpg,.jpeg,.png,.webp,.pdf',
  required = false
}) => {
  return (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        {file && preview && (
          <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
            <i className="fa-solid fa-circle-check"></i> Document Attached ({preview.size} MB)
          </span>
        )}
      </div>

      {!file ? (
        <input
          type="file"
          accept={accept}
          onChange={(e) => onFileChange(fileKey, e)}
          required={required}
          className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-umak-navy file:text-white hover:file:bg-umak-navydark cursor-pointer"
        />
      ) : (
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3 overflow-hidden">
            {preview?.isImage ? (
              <img
                src={preview.url}
                alt={label}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 border border-red-200 flex flex-col items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-file-pdf text-lg"></i>
                <span className="text-[9px] font-bold">PDF</span>
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{preview?.name}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">✓ Ready for Verification</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemoveFile(fileKey)}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1"
          >
            <i className="fa-solid fa-trash-can text-[10px]"></i> Remove
          </button>
        </div>
      )}
    </div>
  );
};
