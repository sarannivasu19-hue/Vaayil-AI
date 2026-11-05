import React, { useState, useEffect } from 'react';
import type { SectorDetail, DashboardSummary } from '../../types';
import { api } from '../../services/api';
import {
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const DashboardView: React.FC<{
  sectorDetail: SectorDetail;
  onNavigateTab: (tab: any) => void;
}> = ({ sectorDetail, onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsSummary(dateFilter.start || undefined, dateFilter.end || undefined);
      setSummary(data);
    } catch (e) {
      console.error('Failed to load dashboard summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateFilter]);

  const handleLoadDemo = async () => {
    try {
      setDemoActionLoading(true);
      await api.loadDemoBookings();
      await fetchSummary();
    } catch (e) {
      console.error(e);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleClearDemo = async () => {
    try {
      setDemoActionLoading(true);
      await api.clearDemoData();
      await fetchSummary();
    } catch (e) {
      console.error(e);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const accent = sectorDetail.accent_color;
  const OUTCOME_COLORS: Record<string, string> = {
    booked: '#10b981',
    completed: '#06b6d4',
    urgent: '#ef4444',
    cancelled: '#64748b',
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto py-2">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-tamil tracking-tight">
              {sectorDetail.display_name_ta} — டாஷ்போர்டு
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              Live Database Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Call Intelligence & Operational Analytics for {sectorDetail.name}
          </p>
        </div>

        {/* Demo Mode & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Load Demo Data</span>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-white/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Clear Demo Data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo</span>
          </button>

          <a
            href="/api/analytics/export/calls"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Calls CSV</span>
          </a>

          <a
            href="/api/analytics/export/bookings"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Bookings CSV</span>
          </a>
        </div>
      </div>

      {loading && !summary ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
          <span className="text-xs font-mono">Aggregating live database metrics...</span>
        </div>
      ) : summary ? (
        <>
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                Today's Calls
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <p className="text-2xl font-black text-white">{summary.today_calls}</p>
              <span className="text-[10px] text-slate-500 font-mono">Logged across sessions</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                Today's Bookings
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <p className="text-2xl font-black text-white">{summary.today_bookings}</p>
              <span className="text-[10px] text-slate-500 font-mono">Confirmed reservations</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                Completion Rate
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              </span>
              <p className="text-2xl font-black text-white">{summary.completion_rate_pct}%</p>
              <span className="text-[10px] text-slate-500 font-mono">Slots finalized</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                Avg Call Duration
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <p className="text-2xl font-black text-white">{summary.avg_call_duration_seconds}s</p>
              <span className="text-[10px] text-slate-500 font-mono">Per dialogue session</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                Urgent Alerts
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <p className="text-2xl font-black text-rose-300">{summary.urgent_alerts_count}</p>
              <span className="text-[10px] text-slate-500 font-mono">Pending staff review</span>
            </div>
          </div>

          {/* Recharts Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Calls Trend (7 Days) */}
            <div className="lg:col-span-8 p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                  Call Volume Trend (Past 7 Days)
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">Daily Trend</span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.calls_per_day}>
                    <defs>
                      <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke={accent} strokeWidth={2} fillOpacity={1} fill="url(#callGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Outcome Distribution Pie */}
            <div className="lg:col-span-4 p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                Call Outcomes Breakdown
              </h3>
              <div className="h-44 w-full">
                {summary.outcomes.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No calls recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.outcomes}
                        dataKey="count"
                        nameKey="outcome"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={38}
                        paddingAngle={3}
                      >
                        {summary.outcomes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={OUTCOME_COLORS[entry.outcome] || '#94a3b8'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {summary.outcomes.map((o) => (
                  <div key={o.outcome} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: OUTCOME_COLORS[o.outcome] || '#94a3b8' }}
                    />
                    <span className="capitalize">{o.outcome}: {o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peak Hours & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Peak Hours Bar Chart */}
            <div className="lg:col-span-6 p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                Hourly Peak Call Distribution
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.peak_hours}>
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="calls" fill={accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Calls List */}
            <div className="lg:col-span-6 p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                  Recent Call Activity
                </h3>
                <button
                  onClick={() => onNavigateTab('call-logs')}
                  className="text-[10px] text-cyan-400 font-mono hover:underline cursor-pointer"
                >
                  View All Logs →
                </button>
              </div>

              {summary.recent_calls.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No recent calls. Click "Load Demo Data" above to view sample metrics.
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.recent_calls.slice(0, 5).map((rc) => (
                    <div
                      key={rc.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 font-semibold">{rc.caller_phone}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase ${
                            rc.outcome === 'booked'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : rc.outcome === 'urgent'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-900 text-slate-400 border border-white/10'
                          }`}
                        >
                          {rc.outcome}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{rc.time} · {rc.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
