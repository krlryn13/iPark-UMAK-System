import React from 'react';

export const InspectLotModal = ({ selectedLot, onClose, onOpenDirections }) => {
  if (!selectedLot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 text-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-slate-100 text-umak-navy border border-slate-200">
              {selectedLot.code || `HPSB-L${selectedLot.id}`}
            </span>
            <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{selectedLot.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <i className="fa-solid fa-location-dot text-amber-500"></i> {selectedLot.location}
              </p>
              {onOpenDirections && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDirections(selectedLot);
                  }}
                  className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors cursor-pointer"
                >
                  How to Go ➔
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Capacity breakdown */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Capacity</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedLot.totalSlots}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-600">Available</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {selectedLot.availableSlots !== undefined ? selectedLot.availableSlots : (selectedLot.totalSlots - selectedLot.occupiedSlots)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-600">Occupied</p>
            <p className="text-xl font-extrabold text-red-600 mt-0.5">{selectedLot.occupiedSlots || 0}</p>
          </div>
        </div>

        {/* Visual slot representation */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-table-cells text-umak-orange"></i> Parking Slot Layout
            </span>
            {selectedLot.hardware_monitored ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                <i className="fa-solid fa-microchip mr-1"></i>Slot 1: Hardware Monitored
              </span>
            ) : (
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-300">
                <i className="fa-solid fa-cloud mr-1"></i>Simulated Slots
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto touch-scroll p-2 bg-slate-50 rounded-xl border border-slate-200">
            {selectedLot.slotsList && selectedLot.slotsList.length > 0 ? (
              selectedLot.slotsList.map((slot) => {
                const isOccupied = slot.status === 'occupied';
                return (
                  <div
                    key={slot.id}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center border text-xs font-mono font-bold transition-all shadow-2xs ${isOccupied
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                  >
                    <i className={`fa-solid ${isOccupied ? 'fa-car' : 'fa-check'} text-[10px]`}></i>
                    <span>{slot.slot_number}</span>
                  </div>
                );
              })
            ) : (
              Array.from({ length: selectedLot.totalSlots }).map((_, idx) => {
                const isOccupied = idx < (selectedLot.occupiedSlots || 0);
                return (
                  <div
                    key={idx}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center border text-xs font-mono font-bold transition-all ${isOccupied
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                  >
                    <i className={`fa-solid ${isOccupied ? 'fa-car' : 'fa-check'} text-[10px]`}></i>
                    <span>S-{idx + 1}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mt-2 px-1">
            <span><i className="fa-solid fa-square text-emerald-500 mr-1"></i> Green = Free</span>
            <span><i className="fa-solid fa-square text-red-500 mr-1"></i> Red = Occupied</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-umak-navy hover:bg-umak-navydark text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
};
