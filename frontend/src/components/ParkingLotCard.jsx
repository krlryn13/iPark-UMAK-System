import React from 'react';

export const ParkingLotCard = ({ lot, onInspect }) => {
  const available = lot.availableSlots !== undefined ? lot.availableSlots : (lot.totalSlots - lot.occupiedSlots);
  const occupied = lot.occupiedSlots || 0;
  const percentage = Math.round((occupied / lot.totalSlots) * 100);
  const isFull = available === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all duration-300 p-6 flex flex-col justify-between h-full group shadow-sm hover:shadow-xl">
      <div>
        {/* Card Top */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-md bg-slate-100 text-umak-navy border border-slate-200 inline-block">
              {lot.code || `HPSB-L${lot.id}`}
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900 mt-2.5 group-hover:text-umak-orange transition-colors">
              {lot.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
              <i className="fa-solid fa-location-dot text-slate-400"></i> {lot.location}
            </p>
          </div>

          <span className={`px-3 py-1 text-xs font-bold rounded-full border flex-shrink-0 ${isFull
            ? 'bg-red-50 text-red-600 border-red-200'
            : available <= 3
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
            <i className={`fa-solid ${isFull ? 'fa-circle-xmark' : 'fa-circle-check'} mr-1.5`}></i>
            {isFull ? 'Lot Full' : available <= 3 ? 'Limited' : 'Open'}
          </span>
        </div>

        {/* Meter Progress */}
        <div className="my-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-600 font-semibold">Occupancy Load</span>
            <span className="font-mono font-bold text-slate-900">{percentage}% ({occupied}/{lot.totalSlots})</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Slot Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Available</p>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{available}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
            <p className="text-[11px] font-bold text-red-700 uppercase">Occupied</p>
            <p className="text-2xl font-bold font-display text-red-600 mt-1">{occupied}</p>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <button
        onClick={() => onInspect(lot)}
        className="w-full py-3 px-4 bg-slate-100 hover:bg-umak-navy text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border border-slate-200 cursor-pointer shadow-sm mt-auto"
      >
        <i className="fa-solid fa-eye text-xs"></i>
        Inspect Level Layout & Details
      </button>
    </div>
  );
};
