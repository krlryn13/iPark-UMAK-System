import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useParkingData } from '../hooks/useParkingData';

export const GuestReservationModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const { lots } = useParkingData();
  const totalAvailable = (lots || []).reduce((sum, l) => sum + (l.availableSlots || 0), 0);

  const [step, setStep] = useState(1); // 1: Notice & Policy, 2: Event Details, 3: Guest & Contact, 4: Vehicle & Submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Checkbox consent states (Step 1)
  const [dataPrivacyConsent, setDataPrivacyConsent] = useState(false);
  const [policyAgreement, setPolicyAgreement] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    email: initialEmail || '',
    event_name: '',
    event_kind: 'Seminar / Trainings',
    event_kind_other: '',
    event_date: '',
    time_start: '08:00',
    time_end: '17:00',
    building_room: '',
    guest_name: '',
    point_person_name: '',
    point_person_contact: '',
    vehicle_details: '',
    plate_number: '',
    requestee_role: 'Visitor',
    requestee_role_other: '',
    preferred_level: 'HPSB Level 2'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!dataPrivacyConsent || !policyAgreement) {
      setError('Please acknowledge the Data Privacy Consent and Entry/Parking Policy checkboxes to continue.');
      return;
    }
    setError('');
    setStep(2);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (!formData.event_date || !formData.time_start || !formData.time_end || !formData.event_name.trim() || !formData.building_room.trim()) {
      setError('Please fill out all required event details (Date, Times, Event Name, and Building/Room).');
      return;
    }

    if (formData.event_date < todayStr) {
      setError(`Event date cannot be in the past. Please select today (${todayStr}) or a future date.`);
      return;
    }

    setError('');
    setStep(3);
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();
    if (!formData.guest_name.trim() || !formData.point_person_name.trim() || !formData.point_person_contact.trim()) {
      setError('Please fill out Guest Name, Host Point Person Name, and Contact Number.');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.plate_number.trim() || !formData.vehicle_details.trim()) {
      setError('Please provide your Email, Vehicle Details, and Plate Number.');
      return;
    }

    setLoading(true);
    setError('');

    const finalEventKind = formData.event_kind === 'Other' && formData.event_kind_other
      ? `Other: ${formData.event_kind_other.trim()}`
      : formData.event_kind;

    const finalRole = formData.requestee_role === 'Other' && formData.requestee_role_other
      ? `Other: ${formData.requestee_role_other.trim()}`
      : formData.requestee_role;

    const payload = {
      ...formData,
      event_kind: finalEventKind,
      requestee_role: finalRole
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/guests/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit guest parking reservation.');
        setLoading(false);
        return;
      }

      setReceipt(data);
      setLoading(false);
    } catch (err) {
      setError('Network connection error. Please ensure backend is running.');
      setLoading(false);
    }
  };

  const handleCloseAll = () => {
    setStep(1);
    setReceipt(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-800 relative my-8 max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-lg">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest block">Official UMak Form</span>
              <h3 className="text-xl font-bold font-display text-slate-900">
                UMak Online Parking Reservation
              </h3>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Step Indicator */}
        {!receipt && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-1 sm:gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-500">
              <div className={`flex-1 text-center py-1.5 px-1 rounded-xl transition-all ${step === 1 ? 'bg-emerald-600 text-white shadow-sm' : ''}`}>
                <span className="sm:hidden">1. Policy</span>
                <span className="hidden sm:inline">1. Policy Consent</span>
              </div>
              <div className={`flex-1 text-center py-1.5 px-1 rounded-xl transition-all ${step === 2 ? 'bg-emerald-600 text-white shadow-sm' : ''}`}>
                <span className="sm:hidden">2. Event</span>
                <span className="hidden sm:inline">2. Event Details</span>
              </div>
              <div className={`flex-1 text-center py-1.5 px-1 rounded-xl transition-all ${step === 3 ? 'bg-emerald-600 text-white shadow-sm' : ''}`}>
                <span className="sm:hidden">3. Contact</span>
                <span className="hidden sm:inline">3. Guest & Host</span>
              </div>
              <div className={`flex-1 text-center py-1.5 px-1 rounded-xl transition-all ${step === 4 ? 'bg-emerald-600 text-white shadow-sm' : ''}`}>
                <span className="sm:hidden">4. Vehicle</span>
                <span className="hidden sm:inline">4. Vehicle & Submit</span>
              </div>
            </div>

            {/* LIVE PARKING SLOTS AVAILABILITY WIDGET */}
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <i className="fa-solid fa-satellite-dish text-umak-orange"></i>
                  <span>Live HPSB Building Parking Slots</span>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {totalAvailable} Free Slots
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(lots || []).map((lot) => {
                  const isFull = lot.availableSlots === 0;
                  return (
                    <div
                      key={lot.id}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isFull
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{lot.code || lot.name}</p>
                      <p className={`text-xs font-extrabold mt-0.5 ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isFull ? '🔴 FULL' : `🟢 ${lot.availableSlots} Free`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-medium">
            <i className="fa-solid fa-circle-exclamation text-base flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* RECEIPT VIEW (AFTER SUCCESSFUL SUBMISSION) */}
        {receipt ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-4 border-emerald-200 flex items-center justify-center text-3xl mx-auto animate-bounce">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Reservation Confirmed</span>
              <h3 className="text-2xl font-extrabold font-display text-slate-900 mt-1">UMak Visitor Parking E-Pass</h3>
              <p className="text-xs text-slate-500 mt-1">Present this digital pass to Campus Security at HPSB Gate upon arrival.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3 font-mono text-xs shadow-inner">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Pass Ref Code:</span>
                <strong className="text-emerald-700 font-bold text-sm">{receipt.passCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <strong className="text-slate-900">{receipt.details.guest_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plate Number:</span>
                <strong className="text-slate-900 uppercase">{receipt.details.plate_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event Name:</span>
                <strong className="text-slate-900">{receipt.details.event_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <strong className="text-slate-900">{receipt.details.event_date} ({receipt.details.time_start} - {receipt.details.time_end})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <strong className="text-slate-900">{receipt.details.building_room}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preferred Floor:</span>
                <strong className="text-emerald-700 font-bold">{receipt.details.preferred_level || 'HPSB Level 2'}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px]">
                <span className="text-slate-500">Host Contact:</span>
                <span className="text-slate-700">{receipt.details.point_person_name} ({receipt.details.point_person_contact})</span>
              </div>
            </div>

            <button
              onClick={handleCloseAll}
              className="px-8 py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form className="space-y-6 flex-grow flex flex-col justify-between">
            
            {/* STEP 1: NOTICE & POLICIES */}
            {step === 1 && (
              <div className="space-y-5 text-xs text-slate-700">
                
                {/* Operating Hours Notice Banner */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-2 text-amber-800">
                    <i className="fa-solid fa-clock text-amber-600"></i> Operating Schedule & Submission Notice
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This reservation form is accessible <strong>from 8:00 AM to 4:00 PM on weekdays</strong>, excluding holidays. Kindly provide all required information accurately prior to arrival.
                  </p>
                </div>

                {/* Data Privacy Notice Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <i className="fa-solid fa-user-shield"></i> Data Privacy Notice
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-600 italic">
                    "The Occupational Health and Safety Office (OHSO) recognizes and protects your rights as data subject by applying appropriate security measures in compliance with data privacy laws. We only require the minimum personal information necessary. Contact our Data Protection Officer at <a href="mailto:dprms@umak.edu.ph" className="text-umak-orange underline">dprms@umak.edu.ph</a>."
                  </p>
                </div>

                {/* Entry / Parking Policy Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 max-h-48 overflow-y-auto pr-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <i className="fa-solid fa-clipboard-list text-umak-orange"></i> Entry & Parking Policy at University of Makati
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                    <li>Parking slots provided for guests, visitors, or clients having transactions within campus premises.</li>
                    <li>Physically challenged employees/visitors, pregnant women, and senior citizens given priority.</li>
                    <li>Observe rules: No littering, respect property, speed limit 10kph, no idling, do not block entrances/exits.</li>
                    <li><strong>Clamping Rule:</strong> Vehicles left unattended for more than 48 hours without permit will be clamped with storage/removal fees.</li>
                    <li>Gate closed from 10:00 PM to 5:00 AM. Liability waiver applies for theft/damage.</li>
                  </ol>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataPrivacyConsent}
                      onChange={(e) => setDataPrivacyConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">
                      I/We HEREBY declare that the information provided is true and correct, and AGREE to the Data Privacy Notice.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyAgreement}
                      onChange={(e) => setPolicyAgreement(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">
                      I, HEREBY, acknowledge and agree to abide by all parking policies and guidelines provided by the University of Makati.
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleNextStep1}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Proceed to Event Details</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: EVENT DETAILS */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
                  <i className="fa-solid fa-calendar-day text-emerald-600"></i> Event & Location Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
                    <input
                      type="date"
                      name="event_date"
                      min={todayStr}
                      value={formData.event_date}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time Started *</label>
                    <input
                      type="time"
                      name="time_start"
                      value={formData.time_start}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time Ended *</label>
                    <input
                      type="time"
                      name="time_end"
                      value={formData.time_end}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Name of Event *</label>
                  <input
                    type="text"
                    name="event_name"
                    placeholder="e.g. Annual IT Innovation Seminar 2026"
                    value={formData.event_name}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kind of Event *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {['Seminar / Trainings', 'Assembly', 'Meeting', 'Joint Training', 'Other'].map((kind) => (
                      <label key={kind} className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${formData.event_kind === kind ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="event_kind"
                          value={kind}
                          checked={formData.event_kind === kind}
                          onChange={handleChange}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{kind}</span>
                      </label>
                    ))}
                  </div>
                  {formData.event_kind === 'Other' && (
                    <input
                      type="text"
                      name="event_kind_other"
                      placeholder="Specify event type..."
                      value={formData.event_kind_other}
                      onChange={handleChange}
                      className="w-full mt-2 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Building & Room of Event *</label>
                  <input
                    type="text"
                    name="building_room"
                    placeholder="e.g. HPSB 1012, Admin UPAT, Grand Theater"
                    value={formData.building_room}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Proceed to Guest Info</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GUEST & CONTACT PERSON */}
            {step === 3 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
                  <i className="fa-solid fa-id-badge text-emerald-600"></i> Guests & Contact Person Details
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guest / Visitor Name *</label>
                  <input
                    type="text"
                    name="guest_name"
                    placeholder="Full name of visiting guest or driver"
                    value={formData.guest_name}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Point Person (Host) *</label>
                    <input
                      type="text"
                      name="point_person_name"
                      placeholder="e.g. Prof. Juan Cruz (CCIS)"
                      value={formData.point_person_name}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number of Point Person *</label>
                    <input
                      type="text"
                      name="point_person_contact"
                      placeholder="e.g. 09171234567"
                      value={formData.point_person_contact}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role of Parking Requestee *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {['Guest Speaker', 'Joint Training', 'Partner Company', 'Visitor', 'Event Judge', 'Other'].map((role) => (
                      <label key={role} className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${formData.requestee_role === role ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="requestee_role"
                          value={role}
                          checked={formData.requestee_role === role}
                          onChange={handleChange}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                  {formData.requestee_role === 'Other' && (
                    <input
                      type="text"
                      name="requestee_role_other"
                      placeholder="Specify role..."
                      value={formData.requestee_role_other}
                      onChange={handleChange}
                      className="w-full mt-2 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep3}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Proceed to Vehicle Info</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: VEHICLE & SUBMIT */}
            {step === 4 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
                  <i className="fa-solid fa-car text-emerald-600"></i> Vehicle Details & Submission
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notification Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. visitor@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Details (Make/Model/Color) *</label>
                    <input
                      type="text"
                      name="vehicle_details"
                      placeholder="e.g. Mitsubishi Strada / Yellow"
                      value={formData.vehicle_details}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plate Number *</label>
                    <input
                      type="text"
                      name="plate_number"
                      placeholder="e.g. ABC 1234 / NAK 8842"
                      value={formData.plate_number}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred HPSB Parking Floor Level <span className="text-emerald-600 font-normal">(Real-time Slots Available)</span> *
                  </label>
                  <select
                    name="preferred_level"
                    value={formData.preferred_level}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {(lots || []).map((lot) => {
                      const isFull = lot.availableSlots === 0;
                      return (
                        <option key={lot.id} value={lot.name} disabled={isFull}>
                          {lot.name} — {isFull ? '🔴 FULL (0 Slots Free)' : `🟢 ${lot.availableSlots} Free Slots`}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select your preferred floor level inside HPSB Building based on current live availability.
                  </p>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Submitting Pass...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>Submit Online Reservation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
};
