import React, { useState, useEffect, useMemo } from 'react';
import type { SectorDetail, DashboardSummary, Booking } from '../../types';
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
  TrendingUp,
  UserCheck,
  Stethoscope,
  HeartPulse,
  PawPrint,
  Building,
  Utensils,
  GraduationCap,
  Users,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: '12px',
    fontSize: '11px',
  },
  itemStyle: { color: '#E8EDF9' },
  labelStyle: { color: '#9AA7BE' },
};

export const DashboardView: React.FC<{
  sectorDetail: SectorDetail;
  onNavigateTab: (tab: any) => void;
}> = ({ sectorDetail, onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, bookingsData] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getBookings().catch(() => []),
      ]);
      setSummary(summaryData);
      setBookings(bookingsData);
    } catch (e) {
      console.error('Failed to load sector dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sectorDetail.id]);

  const handleLoadDemo = async () => {
    try {
      setDemoActionLoading(true);
      await api.loadDemoBookings();
      await fetchData();
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
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const accent = sectorDetail.accent_color;

  /* ──────────────────────────────────────────────────────────────────────────
     SECTOR SPECIFIC SLOT & DOMAIN ANALYSIS (From real database Booking records)
  ────────────────────────────────────────────────────────────────────────── */
  const sectorDomainData = useMemo(() => {
    const counts: Record<string, number> = {};
    let secondaryCounts: Record<string, number> = {};
    let totalHeadcount = 0;

    bookings.forEach((b) => {
      try {
        const details = typeof b.details === 'string' ? JSON.parse(b.details) : (b.details || {});

        if (sectorDetail.id === 'panchayat_health') {
          const st = details.service_type || 'General Assistance';
          counts[st] = (counts[st] || 0) + 1;
          const ward = details.village_ward || 'Ward 1';
          secondaryCounts[ward] = (secondaryCounts[ward] || 0) + 1;
        } else if (sectorDetail.id === 'clinic') {
          const spec = details.doctor_specialty || 'General Physician';
          counts[spec] = (counts[spec] || 0) + 1;
        } else if (sectorDetail.id === 'vet_clinic') {
          const animal = details.animal_type || 'Cattle / Cow';
          counts[animal] = (counts[animal] || 0) + 1;
          const mode = details.visit_mode || 'Clinic OPD';
          secondaryCounts[mode] = (secondaryCounts[mode] || 0) + 1;
        } else if (sectorDetail.id === 'hotel_lodge') {
          const room = details.room_type || 'Standard AC';
          counts[room] = (counts[room] || 0) + 1;
        } else if (sectorDetail.id === 'restaurant') {
          const st = details.service_type || 'Table Dining';
          counts[st] = (counts[st] || 0) + 1;
          const hc = parseInt(details.headcount, 10);
          if (!isNaN(hc)) totalHeadcount += hc;
        } else if (sectorDetail.id === 'coaching') {
          const exam = details.target_exam || 'TNPSC Group 4/2';
          counts[exam] = (counts[exam] || 0) + 1;
          const et = details.enquiry_type || 'Free Demo Class';
          secondaryCounts[et] = (secondaryCounts[et] || 0) + 1;
        }
      } catch (err) {
        // ignore parse error
      }
    });

    const chartList = Object.entries(counts).map(([name, count]) => ({ name, count }));
    return { chartList, secondaryCounts, totalHeadcount };
  }, [bookings, sectorDetail.id]);

  /* ──────────────────────────────────────────────────────────────────────────
     SECTOR SPECIFIC KPI CONFIGURATION
  ────────────────────────────────────────────────────────────────────────── */
  const sectorKpis = useMemo(() => {
    if (!summary) return [];

    switch (sectorDetail.id) {
      case 'panchayat_health':
        return [
          { label: 'Citizen Enquiries', val: summary.today_calls, sub: 'Total phone inquiries', icon: Users, color: '#35D7E8' },
          { label: 'Health Service Requests', val: bookings.length, sub: 'Immunization, visit & token', icon: HeartPulse, color: '#42D6A4' },
          { label: '108 Emergency Alerts', val: summary.urgent_alerts_count, sub: 'Immediate ambulance flag', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Village Assistance Rate', val: `${summary.completion_rate_pct}%`, sub: 'Resolved citizen calls', icon: CheckCircle2, color: '#8065FF' },
        ];
      case 'clinic':
        return [
          { label: 'Total Patients Calling', val: summary.today_calls, sub: 'Today phone consultations', icon: Users, color: '#9275FF' },
          { label: "Today's Appointments", val: summary.today_bookings, sub: 'Confirmed doctor slots', icon: Stethoscope, color: '#35D7E8' },
          { label: 'Consultations Logged', val: bookings.length, sub: 'Active patient registry', icon: CalendarCheck, color: '#42D6A4' },
          { label: 'Slot Booking Rate', val: `${summary.completion_rate_pct}%`, sub: 'Zero conflict scheduling', icon: CheckCircle2, color: '#FFBF69' },
        ];
      case 'vet_clinic':
        return [
          { label: 'Animal Treatment Enquiries', val: summary.today_calls, sub: 'Farmers & pet owners', icon: PhoneCall, color: '#42D6A4' },
          { label: 'Veterinary Appointments', val: bookings.length, sub: 'Clinic & farm visits', icon: PawPrint, color: '#35D7E8' },
          { label: 'Emergency Animal Care', val: summary.urgent_alerts_count, sub: 'Critical triage cases', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Follow-up Success', val: `${summary.completion_rate_pct}%`, sub: 'Completed scheduling', icon: CheckCircle2, color: '#9275FF' },
        ];
      case 'hotel_lodge':
        return [
          { label: 'Guest Booking Calls', val: summary.today_calls, sub: 'Inbound reception calls', icon: PhoneCall, color: '#FFBF69' },
          { label: 'Confirmed Reservations', val: bookings.length, sub: 'Active room bookings', icon: Building, color: '#42D6A4' },
          { label: "Today's Check-ins", val: summary.today_bookings, sub: 'Arrivals scheduled today', icon: CalendarCheck, color: '#35D7E8' },
          { label: 'Occupancy Conversion', val: `${summary.completion_rate_pct}%`, sub: 'Call-to-booking ratio', icon: CheckCircle2, color: '#9275FF' },
        ];
      case 'restaurant':
        return [
          { label: 'Customer Dining Calls', val: summary.today_calls, sub: 'Table & party orders', icon: PhoneCall, color: '#FF886F' },
          { label: 'Table & Catering Orders', val: bookings.length, sub: 'Confirmed reservations', icon: Utensils, color: '#42D6A4' },
          { label: 'Total Guest Headcount', val: sectorDomainData.totalHeadcount || (bookings.length * 4), sub: 'Expected covers / diners', icon: Users, color: '#FFBF69' },
          { label: 'Reservation Success', val: `${summary.completion_rate_pct}%`, sub: 'Automated table booking', icon: CheckCircle2, color: '#35D7E8' },
        ];
      case 'coaching':
        return [
          { label: 'Student & Parent Enquiries', val: summary.today_calls, sub: 'Course & batch calls', icon: PhoneCall, color: '#E58BCB' },
          { label: 'Demo Class Registrations', val: bookings.length, sub: 'Scheduled orientations', icon: GraduationCap, color: '#42D6A4' },
          { label: 'New Admission Enquiries', val: summary.today_bookings, sub: 'Active enrollment intents', icon: UserCheck, color: '#35D7E8' },
          { label: 'Conversion Rate', val: `${summary.completion_rate_pct}%`, sub: 'Enquiry to demo scheduled', icon: CheckCircle2, color: '#FFBF69' },
        ];
      default:
        return [
          { label: "Today's Calls", val: summary.today_calls, sub: 'Logged sessions', icon: PhoneCall, color: accent },
          { label: 'Bookings', val: summary.today_bookings, sub: 'Confirmed today', icon: CalendarCheck, color: '#42D6A4' },
          { label: 'Completion Rate', val: `${summary.completion_rate_pct}%`, sub: 'Slots finalized', icon: CheckCircle2, color: '#8065FF' },
          { label: 'Avg Duration', val: `${summary.avg_call_duration_seconds}s`, sub: 'Per dialogue', icon: Clock, color: '#FFBF69' },
        ];
    }
  }, [summary, bookings.length, sectorDetail.id, sectorDomainData.totalHeadcount, accent]);

  return (
    <div className="space-y-6 text-left py-2">
      
      {/* ── Sector Specific Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono"
              style={{
                backgroundColor: `${accent}15`,
                borderColor: `${accent}40`,
                color: accent,
              }}
            >
              {sectorDetail.name} Workspace
            </span>
            <span className="text-xs text-slate-400 font-tamil">{getGreeting()}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#E8EDF9] font-heading mt-1">
            {sectorDetail.display_name_ta}{' '}
            <span className="text-[#9AA7BE] font-normal text-base sm:text-lg">
              — {sectorDetail.display_name_en} Dashboard
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-tamil mt-0.5">
            {sectorDetail.tagline_ta}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateTab('live-call')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 transition-all shadow-md cursor-pointer border-none"
            style={{ backgroundColor: accent }}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Launch Live Call</span>
          </button>

          <button
            onClick={handleLoadDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors disabled:opacity-50"
            style={{ background: 'rgba(128,101,255,0.12)', borderColor: 'rgba(128,101,255,0.30)', color: '#A58EFF' }}
            title="Seed sector synthetic bookings and call records"
          >
            {demoActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Load Demo</span>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={demoActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,100,124,0.08)', borderColor: 'rgba(255,100,124,0.20)', color: '#FF647C' }}
            title="Reset sector records to blank state"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <a
            href="/api/analytics/export/calls"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>
        </div>
      </div>

      {/* ── Sector Specific KPI Grid ── */}
      {loading && !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {sectorKpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card key={idx} variant="default" className="p-4 space-y-2 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${kpi.color}15`,
                        borderColor: `${kpi.color}35`,
                        color: kpi.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#E8EDF9] font-heading">
                    {kpi.val}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {kpi.sub}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* ── Specialized Sector Domain Breakdown & Chart Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Sector Specific Category Breakdown */}
            <Card variant="elevated" className="lg:col-span-4 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                  {sectorDetail.id === 'panchayat_health' && 'Health Request Types'}
                  {sectorDetail.id === 'clinic' && 'Doctor Specialty Demand'}
                  {sectorDetail.id === 'vet_clinic' && 'Animal Categories Treated'}
                  {sectorDetail.id === 'hotel_lodge' && 'Room Type Reservations'}
                  {sectorDetail.id === 'restaurant' && 'Dining vs Catering Orders'}
                  {sectorDetail.id === 'coaching' && 'Target Exam Enquiries'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Real Slots</span>
              </div>

              {sectorDomainData.chartList.length === 0 ? (
                <EmptyState
                  title="No sector slots logged yet"
                  description="Incoming voice calls will automatically populate this breakdown."
                  className="py-8"
                />
              ) : (
                <div className="space-y-2.5 pt-2">
                  {sectorDomainData.chartList.map((item, i) => {
                    const percentage = Math.round((item.count / bookings.length) * 100) || 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{item.name}</span>
                          <span className="text-slate-400 font-mono">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: accent,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Navigation into Manager */}
              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => onNavigateTab('bookings')}
                  className="text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: accent }}
                >
                  <span>Manage in Bookings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* 7-Day Call Volume Area Chart */}
            <Card variant="elevated" className="lg:col-span-8 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: accent }} />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    {sectorDetail.name} — Call Volume Trend (7 Days)
                  </span>
                </div>
                <Badge variant="muted">Live DB Trend</Badge>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.calls_per_day}>
                    <defs>
                      <linearGradient id="sectorCallGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" name="Calls" stroke={accent} strokeWidth={2} fillOpacity={1} fill="url(#sectorCallGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Peak Hours & Recent Sector Calls ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Peak Hours Distribution */}
            <Card variant="elevated" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                  Peak Inbound Call Hours
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Hourly Distribution</span>
              </div>
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

            {/* Recent Sector Calls */}
            <Card variant="elevated" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">Recent Sector Calls</span>
                <button
                  onClick={() => onNavigateTab('call-logs')}
                  className="text-[10px] cursor-pointer border-none bg-transparent transition-colors"
                  style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  View full logs →
                </button>
              </div>

              {summary.recent_calls.length === 0 ? (
                <EmptyState
                  title="No calls logged yet"
                  description="Use the 'Launch Live Call' button to run your first automated voice interaction."
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
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center border"
                          style={{
                            backgroundColor: `${accent}15`,
                            borderColor: `${accent}35`,
                            color: accent,
                          }}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#E8EDF9] font-mono">{rc.caller_phone}</p>
                          <p className="text-[10px] text-[#4A5568]">{rc.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9AA7BE] font-mono">{rc.duration}</span>
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
