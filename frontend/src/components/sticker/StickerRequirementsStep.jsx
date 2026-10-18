import React, { useState } from 'react';

const StickerRequirementsStep = ({ onProceed, hasRejectedApp = false, rejectionReason = '' }) => {
  const [agreed, setAgreed] = useState(false);

  const requirements = [
    {
      title: 'UMak Student or Employee ID',
      desc: 'Valid school/work ID showing your active enrollment or employment status at UMak.',
      icon: <i className="fa-solid fa-id-card text-blue-600 text-lg"></i>
    },
    {
      title: 'LTO Official Receipt (OR) & Certificate of Registration (CR)',
      desc: 'Valid vehicle OR/CR registered under your name or immediate family.',
      icon: <i className="fa-solid fa-file-invoice text-emerald-600 text-lg"></i>
    },
    {
      title: 'Valid Driver\'s License',
      desc: 'Current non-professional or professional driver\'s license issued by LTO.',
      icon: <i className="fa-solid fa-address-card text-indigo-600 text-lg"></i>
    },
    {
      title: 'Exact Vehicle Plate or MV File Number',
      desc: 'Make sure your plate or MV file number matches the documents submitted.',
      icon: <i className="fa-solid fa-car-rear text-amber-600 text-lg"></i>
    }
  ];

  const stepsFlow = [
    {
      step: '1',
      title: 'Submit Documents',
      desc: 'Upload clear photos or scans of your ID, OR/CR, and Driver\'s License. No payment is required yet.',
      icon: <i className="fa-solid fa-upload text-blue-600"></i>
    },
    {
      step: '2',
      title: 'OHSO Admin Review',
      desc: 'Security officers verify your documents. You will receive an official email once approved or rejected.',
      icon: <i className="fa-solid fa-user-shield text-amber-600"></i>
    },
    {
      step: '3',
      title: 'Pay & Claim Online',
      desc: 'Once approved, return here to pay the ₱200 fee and receive your scheduled sticker claim date.',
      icon: <i className="fa-solid fa-credit-card text-emerald-600"></i>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Rejection Alert Banner if applicable */}
      {hasRejectedApp && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-red-600 text-base flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">Previous Application Rejected</h4>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Reason: <span className="font-semibold">{rejectionReason || 'Uploaded documents were incomplete or unclear.'}</span>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Please review the required documents below and resubmit clear, valid files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-[#0A1F5C]">Vehicle Sticker Application Requirements</h3>
        <p className="text-xs text-slate-500 mt-1">
          Please prepare the following documents before proceeding. Note that payment is only required <strong>after OHSO approves your documents</strong>.
        </p>
      </div>

      {/* Document Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requirements.map((req, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-xs border border-slate-100 flex items-center justify-center flex-shrink-0">
              {req.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">{req.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{req.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Process Flow Overview */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
        <h4 className="text-xs font-bold text-[#0A1F5C] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <i className="fa-solid fa-clock-rotate-left text-blue-600 text-xs"></i>
          Application & Claim Process
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stepsFlow.map((s, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100/80">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#0A1F5C] text-white text-[10px] font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <span className="text-xs font-bold text-slate-800">{s.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="pt-2 border-t border-slate-200">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded text-[#0A1F5C] border-slate-300 focus:ring-[#0A1F5C]"
          />
          <span className="text-xs text-slate-700 font-medium">
            I have prepared my documents and confirm all submitted vehicle information is valid and authentic.
          </span>
        </label>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!agreed}
          onClick={onProceed}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            agreed
              ? 'bg-[#0A1F5C] hover:bg-[#122b7a] text-white cursor-pointer active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{hasRejectedApp ? 'Proceed to Resubmit Documents' : 'Proceed to Document Submission'}</span>
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default StickerRequirementsStep;
