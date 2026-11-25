import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

export const DioramaTab = ({ authFetch, showToast }) => {
  const [deviceState, setDeviceState] = useState(null);
  const [events, setEvents] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [guestReservations, setGuestReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Command dispatch state
  const [cmdType, setCmdType] = useState('STATUS');
  const [cmdUid, setCmdUid] = useState('');
  const [cmdParam, setCmdParam] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Card pool action modal state
  const [selectedResId, setSelectedResId] = useState('');
  const [selectedCardUid, setSelectedCardUid] = useState('');

  const fetchData = async () => {
    try {
      const [stateRes, eventsRes, cardsRes, guestsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/device/state`),
        authFetch(`${API_BASE_URL}/api/device/admin/events`),
        authFetch(`${API_BASE_URL}/api/guests/admin/available-cards`),
        authFetch(`${API_BASE_URL}/api/guests/admin/all`)
      ]);

      if (stateRes.status === 'fulfilled' && stateRes.value.ok) {
        const s = await stateRes.value.json();
        setDeviceState(s);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const ev = await eventsRes.value.json();
        setEvents(ev.events || []);
      }
      if (cardsRes.status === 'fulfilled' && cardsRes.value.ok) {
        const c = await cardsRes.value.json();
        setAvailableCards(c);
      }
      if (guestsRes.status === 'fulfilled' && guestsRes.value.ok) {
        const g = await guestsRes.value.json();
        setGuestReservations(g);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async (e) => {
    e.preventDefault();
    setDispatching(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/device/admin/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdType,
          uid: cmdUid || undefined,
          param: cmdParam ? parseInt(cmdParam, 10) : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Command ${cmdType} queued for ESP32 diorama!`, 'success');
        setCmdUid('');
        setCmdParam('');
        fetchData();
      } else {
        showToast(data.error || 'Failed to dispatch command', 'error');
      }
    } catch (err) {
      showToast('Network error dispatching command', 'error');
    } finally {
      setDispatching(false);
    }
  };

  const handleClaimCard = async (e) => {
    e.preventDefault();
    if (!selectedResId || !selectedCardUid) {
      showToast('Please select both a reservation and an available card.', 'warning');
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/guests/admin/claim-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: selectedResId,
          card_uid: selectedCardUid
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Card linked successfully!', 'success');
        setSelectedResId('');
        setSelectedCardUid('');
        fetchData();
      } else {
        showToast(data.error || 'Failed to claim card', 'error');
      }
    } catch (err) {
      showToast('Network error claiming card', 'error');
    }
  };

  const handleSurrenderCard = async (resId, uid) => {
    if (!window.confirm(`Surrender card ${uid} back to physical pool and mark reservation completed?`)) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/guests/admin/surrender-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: resId, card_uid: uid })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Card returned to pool!', 'success');
        fetchData();
      } else {
        showToast(data.error || 'Failed to surrender card', 'error');
      }
    } catch (err) {
      showToast('Network error surrendering card', 'error');
    }
  };

  const isOnline = deviceState?.online;
  const activeHolds = guestReservations.filter(g => ['approved', 'claimed', 'inside'].includes(g.status));

  return (
    <div className="space-y-6 tab-content-enter">
      {/* Device Status & Health Overview */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isOnline 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-rose-500/10 border-rose-500/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white ${
              isOnline ? 'bg-emerald-600 shadow-emerald-500/50 shadow-md' : 'bg-rose-600 shadow-rose-500/50 shadow-md'
            }`}>
              <i className="fa-solid fa-microchip"></i>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold font-display text-slate-900">
                  ESP32 Diorama Gate Controller
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono ${
                  isOnline ? 'bg-emerald-200 text-emerald-900 animate-pulse' : 'bg-rose-200 text-rose-900'
                }`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {isOnline
                  ? `Last Heartbeat: ${deviceState?.sec_since_heartbeat || 0}s ago | Gate & Sensor telemetry synced`
                  : 'Heartbeat timeout (>15 seconds). ESP32 is offline. Gates operate on local cached rules.'}
              </p>
            </div>
          </div>

          {/* Active Warnings Alert Box */}
          {deviceState?.active_warnings ? (
            <div className="px-4 py-2 bg-amber-500/20 border border-amber-400 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base"></i>
              <span>Active Warnings: <strong>{deviceState.active_warnings}</strong></span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>All Sensors & Gate Subsystems Normal</span>
            </div>
          )}
        </div>

        {/* Live Gate & Slot Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Physical Cap</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{deviceState?.capacity ?? 2}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Vehicles Inside</span>
            <p className="text-xl font-extrabold text-blue-600 mt-0.5">{deviceState?.inside ?? 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Parked (Ultra)</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{deviceState?.parked ?? 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">In-Transit</span>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{deviceState?.in_transit ?? 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Active Holds</span>
            <p className="text-xl font-extrabold text-purple-600 mt-0.5">{deviceState?.reserved ?? 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Walk-in Free</span>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{deviceState?.free ?? 2}</p>
          </div>
        </div>
      </div>

      {/* 2-Column: Physical Card Pool Management & Admin Override Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Guest Card Pool Claim & Surrender */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-id-card-clip text-umak-orange"></i>
              Guest Physical Card Assignment & Surrender
            </h4>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              Pool Available: {availableCards.length}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Link an approved guest reservation with an unassigned physical RFID keycard from the front-desk pool. When returned at exit, surrender the card to release the hold.
          </p>

          <form onSubmit={handleClaimCard} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Approved Guest Reservation</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Guest --</option>
                  {guestReservations
                    .filter(g => g.status === 'approved' && !g.card_uid)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.guest_name} ({g.pass_code}) - {g.plate_number}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Available Pool Card</label>
                <select
                  value={selectedCardUid}
                  onChange={(e) => setSelectedCardUid(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select RFID UID --</option>
                  {availableCards.map(c => (
                    <option key={c.uid} value={c.uid}>
                      {c.uid} ({c.assigned_name || 'Guest Card'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-link mr-1"></i> Issue & Claim Physical Card
            </button>
          </form>

          {/* Currently Claimed / Active Cards Table */}
          <div className="mt-4">
            <h5 className="text-xs font-bold text-slate-700 mb-2">Active Claimed Cards:</h5>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase">
                  <tr>
                    <th className="p-2">Guest</th>
                    <th className="p-2">Card UID</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {guestReservations.filter(g => ['claimed', 'inside', 'exited'].includes(g.status) && g.card_uid).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-slate-400">No cards currently checked out</td>
                    </tr>
                  ) : (
                    guestReservations
                      .filter(g => ['claimed', 'inside', 'exited'].includes(g.status) && g.card_uid)
                      .map(g => (
                        <tr key={g.id}>
                          <td className="p-2 font-medium">{g.guest_name}</td>
                          <td className="p-2 font-mono font-bold text-umak-navy">{g.card_uid}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {g.status}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => handleSurrenderCard(g.id, g.card_uid)}
                              className="px-2 py-1 bg-slate-200 hover:bg-rose-600 hover:text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Surrender Card
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Remote Admin Overrides & Gate Commands */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-terminal text-umak-navy"></i>
            Hardware Admin Override & Command Dispatch
          </h4>
          <p className="text-xs text-slate-500">
            Transmit low-level administrative commands directly to the ESP32 diorama queue. Commands execute on the next poll cycle.
          </p>

          <form onSubmit={handleSendCommand} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Command Action</label>
              <select
                value={cmdType}
                onChange={(e) => setCmdType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="STATUS">STATUS (Force Telemetry Dump)</option>
                <option value="RESET">RESET (Force All Cards Outside & Clear Reservations)</option>
                <option value="SETIN">SETIN (Force Specific Card to Inside State)</option>
                <option value="SETOUT">SETOUT (Force Specific Card to Outside State)</option>
                <option value="RES">RES (Manually Hold Space for Card UID)</option>
                <option value="CANCEL">CANCEL (Cancel Space Hold for Card UID)</option>
              </select>
            </div>

            {['SETIN', 'SETOUT', 'RES', 'CANCEL'].includes(cmdType) && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Card UID (Hex)</label>
                <input
                  type="text"
                  placeholder="e.g. 0054709E"
                  value={cmdUid}
                  onChange={(e) => setCmdUid(e.target.value.toUpperCase())}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  required
                />
              </div>
            )}

            {cmdType === 'RES' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Hold Duration (Seconds)</label>
                <input
                  type="number"
                  placeholder="900"
                  value={cmdParam}
                  onChange={(e) => setCmdParam(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={dispatching}
              className="w-full py-2 bg-umak-navy hover:bg-umak-navydark text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {dispatching ? 'Queueing...' : `Dispatch ${cmdType} Command`}
            </button>
          </form>

          {/* Quick Command Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                await authFetch(`${API_BASE_URL}/api/device/admin/command`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: 'STATUS' })
                });
                showToast('STATUS command dispatched', 'info');
              }}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
            >
              <i className="fa-solid fa-arrows-rotate mr-1"></i> Force Status
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!window.confirm('Reset diorama state? Every card will be marked outside.')) return;
                await authFetch(`${API_BASE_URL}/api/device/admin/command`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: 'RESET' })
                });
                showToast('RESET command dispatched', 'warning');
              }}
              className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200"
            >
              <i className="fa-solid fa-power-off mr-1"></i> Reset Gates
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Hardware Event Log Stream */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-blue-600"></i>
            ESP32 Diorama Hardware Event Ingestion Stream
          </h4>
          <span className="text-xs text-slate-500">Auto-refreshing every 4s</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Gate</th>
                <th className="p-3">Event</th>
                <th className="p-3">Card UID</th>
                <th className="p-3">Inside</th>
                <th className="p-3">Parked</th>
                <th className="p-3">Walk-in Free</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center font-sans text-slate-400">
                    No hardware events recorded yet.
                  </td>
                </tr>
              ) : (
                events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 font-sans">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{ev.gate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.event === 'entered' ? 'bg-emerald-100 text-emerald-800' :
                        ev.event === 'exited' ? 'bg-blue-100 text-blue-800' :
                        ev.event.startsWith('denied') ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ev.event}
                      </span>
                    </td>
                    <td className="p-3 text-umak-navy font-bold">{ev.uid || '-'}</td>
                    <td className="p-3 text-slate-700">{ev.inside}</td>
                    <td className="p-3 text-slate-700">{ev.parked}</td>
                    <td className="p-3 font-bold text-emerald-600">{ev.free}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
