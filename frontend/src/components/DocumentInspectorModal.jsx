import React from 'react';
import { API_BASE_URL } from '../config/api';

export const DocumentInspectorModal = ({ isOpen, onClose, application }) => {
  if (!isOpen || !application) return null;

  const docs = [
    { title: 'Student / Faculty ID Photo', path: application.student_id_doc, icon: 'fa-graduation-cap' },
    { title: 'LTO Official Receipt & Registration (OR/CR)', path: application.or_cr_doc, icon: 'fa-file-invoice' },
    { title: 'Valid Driver’s License Photo', path: application.license_doc, icon: 'fa-id-card' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 text-slate-800 relative overflow-hidden max-h-[90vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold text-umak-orange uppercase tracking-wider">OHSO Security Inspector</span>
            <h3 className="text-xl font-bold font-display text-slate-900">
              Uploaded Documents: {application.applicant_name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Student ID: {application.student_id_num} | Plate: {application.plate_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto touch-scroll max-h-[70vh] pr-1">
          {docs.map((doc, idx) => {
            const isPdf = doc.path && doc.path.toLowerCase().endsWith('.pdf');
            const fullUrl = doc.path ? `${API_BASE_URL}${doc.path}` : null;

            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <i className={`fa-solid ${doc.icon} text-umak-orange`}></i>
                  <span>{doc.title}</span>
                </div>

                {/* Document Preview Box */}
                <div className="w-full h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-inner">
                  {fullUrl ? (
                    isPdf ? (
                      <div className="text-center p-3 space-y-2">
                        <i className="fa-solid fa-file-pdf text-4xl text-red-500"></i>
                        <p className="text-[11px] font-bold text-slate-700">PDF Document</p>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 bg-umak-navy text-white text-[10px] font-bold rounded-lg hover:bg-umak-navydark transition-colors"
                        >
                          Open PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={fullUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(fullUrl, '_blank')}
                      />
                    )
                  ) : (
                    <div className="text-center p-4 space-y-1 text-slate-400">
                      <i className="fa-solid fa-file-excel text-2xl"></i>
                      <p className="text-[11px] font-semibold">No Document Attached</p>
                    </div>
                  )}
                </div>

                {fullUrl && (
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-100 hover:bg-umak-navy hover:text-white text-slate-700 text-xs font-bold rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    View Full Image
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
