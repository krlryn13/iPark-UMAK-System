import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#0A1F5C', '#F5821F', '#2C7A7B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'];

export const AnalyticsTab = ({
  analyticsData,
  dateRange,
  setDateRange,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-umak-orange"></i>
        <p className="text-sm font-semibold text-slate-500">Compiling Analytics Data & Visualizations...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-semibold">No analytics data available for this range.</p>
      </div>
    );
  }

  const { summary, series, breakdowns, userTotals } = analyticsData;

  const trendData = series?.points?.map(p => ({
    name: p.period.length > 7 ? p.period.slice(5) : p.period,
    stickers: p.stickers || 0,
    guests: p.guests || 0,
    revenue: p.revenue || 0
  })) || [];

  const vehicleData = breakdowns?.vehicleType?.map(v => ({
    name: v.key.toUpperCase(),
    value: v.value
  })) || [];

  const stickerStatusData = breakdowns?.stickerStatus?.map(s => ({
    name: s.key.replace(/_/g, ' ').toUpperCase(),
    value: s.value
  })) || [];

  const calculatePct = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Campus Analytics & Operational Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated metrics, user registration trends, and vehicle sticker volume.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 pl-2">Range:</span>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-umak-navy"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-umak-navy"
            />
          </div>

          <button
            onClick={onRefresh}
            className="px-4 py-2.5 bg-umak-navy hover:bg-umak-navy/90 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Apply Range
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sticker Applications</p>
              <h3 className="text-3xl font-extrabold font-display text-slate-900 mt-1">{summary?.stickerApplications?.current || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-umak-navy flex items-center justify-center text-lg border border-blue-100">
              <i className="fa-solid fa-id-card"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`font-bold ${summary?.stickerApplications?.current >= (summary?.stickerApplications?.previous || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
              {calculatePct(summary?.stickerApplications?.current, summary?.stickerApplications?.previous)}
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Collected</p>
              <h3 className="text-3xl font-extrabold font-display text-emerald-600 mt-1">
                ₱{(summary?.revenue?.current || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100">
              <i className="fa-solid fa-peso-sign"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`font-bold ${summary?.revenue?.current >= (summary?.revenue?.previous || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
              {calculatePct(summary?.revenue?.current, summary?.revenue?.previous)}
            </span>
            <span className="text-slate-400">verified payments</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guest Reservations</p>
              <h3 className="text-3xl font-extrabold font-display text-slate-900 mt-1">{summary?.guestReservations?.current || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-umak-orange flex items-center justify-center text-lg border border-amber-100">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`font-bold ${summary?.guestReservations?.current >= (summary?.guestReservations?.previous || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
              {calculatePct(summary?.guestReservations?.current, summary?.guestReservations?.previous)}
            </span>
            <span className="text-slate-400">visitors & events</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Flags</p>
              <h3 className="text-3xl font-extrabold font-display text-red-600 mt-1">{summary?.failedLogins?.current || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg border border-red-100">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">
              {userTotals?.locked || 0} locked / {userTotals?.total || 0} users
            </span>
          </div>
        </div>
      </div>

      {/* TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Activity Over Time</h3>
              <p className="text-xs text-slate-500">Sticker applications vs Guest parking requests</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="stickersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A1F5C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A1F5C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="guestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5821F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F5821F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="stickers" name="Stickers" stroke="#0A1F5C" strokeWidth={2.5} fillOpacity={1} fill="url(#stickersGrad)" />
                <Area type="monotone" dataKey="guests" name="Guests" stroke="#F5821F" strokeWidth={2.5} fillOpacity={1} fill="url(#guestsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Breakdown Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vehicle Classification</h3>
            <p className="text-xs text-slate-500">Distribution across cars, motorcycles, e-bikes</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {vehicleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vehicleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No vehicle data for range</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-around text-center text-xs">
            {vehicleData.map((v, i) => (
              <div key={v.name}>
                <span className="text-slate-400 block font-semibold">{v.name}</span>
                <span className="text-sm font-extrabold text-slate-800">{v.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STICKER STATUS & REVENUE BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sticker Application Approval Stages</h3>
            <p className="text-xs text-slate-500">Distribution across document review, payment verification, and released stickers</p>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stickerStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="value" name="Applications" fill="#0A1F5C" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Revenue Distribution by Period</h3>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₱${val}`} />
                <Tooltip
                  formatter={(val) => [`₱${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
