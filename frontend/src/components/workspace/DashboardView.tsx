import React, { useState, useEffect } from 'react';
import type { SectorDetail, DashboardSummary } from '../../types';
import { api } from '../../services/api';
import {
  PhoneCall, CalendarCheck, CheckCircle2, Clock, ShieldAlert,
  Sparkles, Download, Trash2, Loader2, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
} from 'recharts';
import { Card } from '../ui/Card';
import { SkeletonKPI, SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'காலை வணக்கம்'; // Good morning
  if (h < 17) return 'மதிய வணக்கம்'; // Good afternoon
  return 'மாலை வணக்கம்';             // Good evening
}

const OUTCOME_COLORS: Record<string, string> = {
  booked: '#42D6A4', completed: '#32D8E8',
  urgent: '#FF647C', cancelled: '#4A5568',
  abandoned: '#FFBF69',
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#101626', borderColor: 'rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: '11px' },
  itemStyle: { color: '#E8EDF9' },
  labelStyle: { color: '#9AA7BE' },
};

export const DashboardView: React.FC<{
  sectorDetail: SectorDetail;
  onNavigateTab: (tab: any) => void;
}> = ({ sectorDetail, onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsSummary();
      setSummary(data);
    } catch (e) {
      console.error('Failed to load dashboard summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleLoadDemo = async () => {
    try { setDemoActionLoading(true); await api.loadDemoBookings(); await fetchSummary(); }
    catch (e) { console.error(e); } finally { setDemoActionLoading(false); }
  };

  const handleClearDemo = async () => {
    try { setDemoActionLoading(true); await api.clearDemoData(); await fetchSummary(); }
    catch (e) { console.error(e); } finally { setDemoActionLoading(false); }
  };

  const accent = sectorDetail.accent_color;

  return (
    <div className="space-y-6 text-left py-2">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#9AA7BE] font-tamil mb-1">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-[#E8EDF9] font-heading">
            {sectorDetail.display_name_en} <span className="text-[#9AA7BE] font-normal">— Dashboard</span>
          </h1>
          <p className="text-xs text-[#4A5568] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Live database metrics · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors disabled:opacity-50"
            style={{ background: 'rgba(128,101,255,0.12)', borderColor: 'rgba(128,101,255,0.30)', color: '#A58EFF' }}
          >
            {demoActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Load Demo</span>
          </button>
          <button
            onClick={handleClearDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,100,124,0.08)', borderColor: 'rgba(255,100,124,0.20)', color: '#FF647C' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo</span>
          </button>
          <a
            href="/api/analytics/export/calls"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Calls CSV</span>
          </a>
          <a
            href="/api/analytics/export/bookings"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Bookings CSV</span>
          </a>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {loading && !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonKPI key={i} />)}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Calls Today */}
            <Card variant="default" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Calls Today</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                  <PhoneCall className="w-4 h-4" style={{ color: accent }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#E8EDF9] font-heading">{summary.today_calls}</p>
              <p className="text-[10px] text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Logged sessions</p>
            </Card>

            {/* Bookings */}
            <Card variant="default" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Bookings</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(66,214,164,0.12)' }}>
                  <CalendarCheck className="w-4 h-4 text-[#42D6A4]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#E8EDF9] font-heading">{summary.today_bookings}</p>
              <p className="text-[10px] text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Confirmed today</p>
            </Card>

            {/* Completion */}
            <Card variant="default" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Completion</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(128,101,255,0.12)' }}>
                  <CheckCircle2 className="w-4 h-4 text-[#8065FF]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#E8EDF9] font-heading">{summary.completion_rate_pct}%</p>
              <p className="text-[10px] text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Slots finalised</p>
            </Card>

            {/* Avg Duration */}
            <Card variant="default" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Avg Duration</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,191,105,0.12)' }}>
                  <Clock className="w-4 h-4 text-[#FFBF69]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#E8EDF9] font-heading">{summary.avg_call_duration_seconds}s</p>
              <p className="text-[10px] text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Per dialogue</p>
            </Card>

            {/* Urgent Alerts */}
            <Card variant="default" className="p-4 space-y-2" style={{ borderColor: summary.urgent_alerts_count > 0 ? 'rgba(255,100,124,0.25)' : undefined }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Urgent Alerts</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,100,124,0.12)' }}>
                  <ShieldAlert className="w-4 h-4 text-[#FF647C]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-heading" style={{ color: summary.urgent_alerts_count > 0 ? '#FF647C' : '#E8EDF9' }}>
                {summary.urgent_alerts_count}
              </p>
              <p className="text-[10px] text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Pending review</p>
            </Card>
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Call trend area chart */}
            <Card variant="elevated" className="lg:col-span-8 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: accent }} />
                  <span className="text-xs font-semibold text-[#E8EDF9]">Call Volume — Past 7 Days</span>
                </div>
                <Badge variant="muted">Daily trend</Badge>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.calls_per_day}>
                    <defs>
                      <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={accent} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" stroke={accent} strokeWidth={2} fillOpacity={1} fill="url(#cgrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Outcome pie */}
            <Card variant="elevated" className="lg:col-span-4 p-5 space-y-3">
              <span className="text-xs font-semibold text-[#E8EDF9]">Call Outcomes</span>
              {summary.outcomes.length === 0 ? (
                <EmptyState
                  title="No calls yet"
                  description="Outcomes will appear after the first call."
                  className="py-8"
                />
              ) : (
                <>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={summary.outcomes} dataKey="count" nameKey="outcome"
                          cx="50%" cy="50%" outerRadius={62} innerRadius={36} paddingAngle={3}>
                          {summary.outcomes.map((e, i) => (
                            <Cell key={i} fill={OUTCOME_COLORS[e.outcome] || '#4A5568'} />
                          ))}
                        </Pie>
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {summary.outcomes.map((o) => (
                      <div key={o.outcome} className="flex items-center gap-1.5 text-[10px] text-[#9AA7BE]">
                        <div className="w-2 h-2 rounded-full" style={{ background: OUTCOME_COLORS[o.outcome] || '#4A5568' }} />
                        <span className="capitalize">{o.outcome}: {o.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* ── Peak hours + Recent ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card variant="elevated" className="p-5 space-y-3">
              <span className="text-xs font-semibold text-[#E8EDF9]">Peak Hours Distribution</span>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.peak_hours}>
                    <XAxis dataKey="hour" stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="calls" fill={accent} radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card variant="elevated" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#E8EDF9]">Recent Calls</span>
                <button
                  onClick={() => onNavigateTab('call-logs')}
                  className="text-[10px] cursor-pointer border-none bg-transparent transition-colors"
                  style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  View all →
                </button>
              </div>

              {summary.recent_calls.length === 0 ? (
                <EmptyState
                  title="No recent calls"
                  description='Load demo data or make a real call to see activity.'
                  className="py-8"
                />
              ) : (
                <div className="space-y-2">
                  {summary.recent_calls.slice(0, 5).map((rc) => (
                    <div
                      key={rc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl"
                      style={{ background: 'rgba(8,11,24,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                          <PhoneCall className="w-3.5 h-3.5" style={{ color: accent }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#E8EDF9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{rc.caller_phone}</p>
                          <p className="text-[10px] text-[#4A5568]">{rc.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9AA7BE]">{rc.duration}</span>
                        <Badge
                          variant={rc.outcome === 'booked' ? 'success' : rc.outcome === 'urgent' ? 'danger' : 'muted'}
                          size="sm"
                        >
                          {rc.outcome}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <SkeletonCard lines={3} />
      )}
    </div>
  );
};
