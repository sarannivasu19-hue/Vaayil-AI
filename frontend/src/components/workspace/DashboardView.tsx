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
  Stethoscope,
  HeartPulse,
  PawPrint,
  Building,
  Utensils,
  GraduationCap,
  Users,
  ArrowRight,
  Globe2,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
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
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '../ui/Card';
import { SkeletonKPI } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';

interface DashboardViewProps {
  sectorDetail: SectorDetail;
  onNavigateTab: (tab: any) => void;
}

function getGreeting(): { ta: string; en: string } {
  const h = new Date().getHours();
  if (h < 12) return { ta: 'காலை வணக்கம்', en: 'Good Morning' };
  if (h < 17) return { ta: 'மதிய வணக்கம்', en: 'Good Afternoon' };
  return { ta: 'மாலை வணக்கம்', en: 'Good Evening' };
}

const SECTOR_HERO_IMAGES: Record<string, string> = {
  panchayat_health: '/sectors/panchayat-health.webp',
  clinic: '/sectors/clinic.webp',
  vet_clinic: '/sectors/veterinary.webp',
  hotel_lodge: '/sectors/hotel-lodge.webp',
  restaurant: '/sectors/restaurant-catering.webp',
  coaching: '/sectors/coaching-centre.webp',
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0A0F1E',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: '12px',
    fontSize: '11px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#E8EDF9' },
  labelStyle: { color: '#9AA7BE', fontWeight: 600 },
};

const OUTCOME_COLORS: Record<string, string> = {
  booked: '#42D6A4',      // emerald
  completed: '#32D8E8',   // cyan
  urgent: '#FF647C',      // rose
  cancelled: '#FFBF69',   // amber
  abandoned: '#9AA7BE',   // slate
};

const LANGUAGE_COLORS: Record<string, string> = {
  Tamil: '#32D8E8',       // cyan
  Tanglish: '#8065FF',    // holographic purple
  English: '#A58EFF',     // lavender
};

export const DashboardView: React.FC<DashboardViewProps> = ({ sectorDetail, onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const greeting = getGreeting();
  const accent = sectorDetail.accent_color;
  const heroImageSrc = SECTOR_HERO_IMAGES[sectorDetail.id] || '/assets/backgrounds/dashboard/vaayil-hub.webp';

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

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

  useEffect(() => {
    setHeroImageLoaded(false);
    const img = new Image();
    img.src = heroImageSrc;
    img.onload = () => setHeroImageLoaded(true);
    img.onerror = () => setHeroImageLoaded(false);
  }, [heroImageSrc]);

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
          { label: 'Citizen Enquiries', val: summary.today_calls, sub: 'Total phone calls', icon: Users, color: '#35D7E8' },
          { label: 'Health Service Requests', val: summary.today_bookings, sub: 'Vaccines & tokens today', icon: HeartPulse, color: '#42D6A4' },
          { label: '108 Emergency Alerts', val: summary.urgent_alerts_count, sub: 'Urgent ambulance flags', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Assistance Rate', val: `${summary.completion_rate_pct}%`, sub: 'Resolved citizen calls', icon: CheckCircle2, color: '#8065FF' },
          { label: 'Pending Actions', val: summary.pending_actions_count || 0, sub: 'Requires nurse review', icon: Clock, color: '#FFBF69' },
        ];
      case 'clinic':
        return [
          { label: 'Total Patients Calling', val: summary.today_calls, sub: 'Today phone consultations', icon: Users, color: '#9275FF' },
          { label: "Today's Appointments", val: summary.today_bookings, sub: 'Confirmed doctor slots', icon: Stethoscope, color: '#35D7E8' },
          { label: 'Urgent Triage Cases', val: summary.urgent_alerts_count, sub: 'Flagged for doctor', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Slot Booking Rate', val: `${summary.completion_rate_pct}%`, sub: 'Zero conflict scheduling', icon: CheckCircle2, color: '#42D6A4' },
          { label: 'Pending Follow-ups', val: summary.pending_actions_count || 0, sub: 'Awaiting doctor review', icon: Clock, color: '#FFBF69' },
        ];
      case 'vet_clinic':
        return [
          { label: 'Animal Treatment Enquiries', val: summary.today_calls, sub: 'Farmers & pet owners', icon: PhoneCall, color: '#42D6A4' },
          { label: 'Veterinary Appointments', val: summary.today_bookings, sub: 'Confirmed visits today', icon: PawPrint, color: '#35D7E8' },
          { label: 'Emergency Animal Care', val: summary.urgent_alerts_count, sub: 'Critical triage alerts', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Follow-up Success', val: `${summary.completion_rate_pct}%`, sub: 'Completed scheduling', icon: CheckCircle2, color: '#9275FF' },
          { label: 'Pending Visits', val: summary.pending_actions_count || 0, sub: 'Field visits queued', icon: Clock, color: '#FFBF69' },
        ];
      case 'hotel_lodge':
        return [
          { label: 'Guest Booking Calls', val: summary.today_calls, sub: 'Inbound reception calls', icon: PhoneCall, color: '#FFBF69' },
          { label: "Today's Bookings", val: summary.today_bookings, sub: 'Arrivals confirmed today', icon: Building, color: '#42D6A4' },
          { label: 'Urgent Guest Requests', val: summary.urgent_alerts_count, sub: 'Reception assistance', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Occupancy Conversion', val: `${summary.completion_rate_pct}%`, sub: 'Call-to-booking ratio', icon: CheckCircle2, color: '#9275FF' },
          { label: 'Pending Enquiries', val: summary.pending_actions_count || 0, sub: 'Unconfirmed queries', icon: Clock, color: '#35D7E8' },
        ];
      case 'restaurant':
        return [
          { label: 'Customer Dining Calls', val: summary.today_calls, sub: 'Table & party orders', icon: PhoneCall, color: '#FF886F' },
          { label: 'Table & Catering Orders', val: summary.today_bookings, sub: 'Confirmed orders today', icon: Utensils, color: '#42D6A4' },
          { label: 'Special Event Alerts', val: summary.urgent_alerts_count, sub: 'Urgent party catering', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Reservation Success', val: `${summary.completion_rate_pct}%`, sub: 'Automated table booking', icon: CheckCircle2, color: '#35D7E8' },
          { label: 'Pending Orders', val: summary.pending_actions_count || 0, sub: 'Awaiting kitchen verify', icon: Clock, color: '#FFBF69' },
        ];
      case 'coaching':
        return [
          { label: 'Student & Parent Enquiries', val: summary.today_calls, sub: 'Course & batch calls', icon: PhoneCall, color: '#E58BCB' },
          { label: 'Demo Registrations', val: summary.today_bookings, sub: 'Demo class bookings', icon: GraduationCap, color: '#42D6A4' },
          { label: 'Urgent Admission Queries', val: summary.urgent_alerts_count, sub: 'Fast-track enrollments', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Conversion Rate', val: `${summary.completion_rate_pct}%`, sub: 'Enquiry to demo booked', icon: CheckCircle2, color: '#35D7E8' },
          { label: 'Pending Follow-ups', val: summary.pending_actions_count || 0, sub: 'Counselling queued', icon: Clock, color: '#FFBF69' },
        ];
      default:
        return [
          { label: "Today's Calls", val: summary.today_calls, sub: 'Logged sessions', icon: PhoneCall, color: accent },
          { label: 'Bookings Today', val: summary.today_bookings, sub: 'Confirmed today', icon: CalendarCheck, color: '#42D6A4' },
          { label: 'Completion Rate', val: `${summary.completion_rate_pct}%`, sub: 'Slots finalized', icon: CheckCircle2, color: '#8065FF' },
          { label: 'Urgent Alerts', val: summary.urgent_alerts_count, sub: 'Safety escalations', icon: ShieldAlert, color: '#FF647C' },
          { label: 'Pending Actions', val: summary.pending_actions_count || 0, sub: 'Follow-ups pending', icon: Clock, color: '#FFBF69' },
        ];
    }
  }, [summary, sectorDetail.id, accent]);

  /* ──────────────────────────────────────────────────────────────────────────
     CHARTS DATA PREPARATION
  ────────────────────────────────────────────────────────────────────────── */
  const outcomesChartData = useMemo(() => {
    if (!summary?.outcomes) return [];
    return summary.outcomes.map((o) => ({
      name: o.outcome.charAt(0).toUpperCase() + o.outcome.slice(1),
      value: o.count,
      color: OUTCOME_COLORS[o.outcome.toLowerCase()] || '#9AA7BE',
    }));
  }, [summary]);

  const languageChartData = useMemo(() => {
    if (!summary?.language_distribution) return [];
    return summary.language_distribution.map((l) => ({
      name: l.language,
      count: l.count,
      percentage: l.percentage,
      color: LANGUAGE_COLORS[l.language] || '#32D8E8',
    }));
  }, [summary]);

  const totalCallsInPeriod = useMemo(() => {
    if (!summary?.calls_per_day) return 0;
    return summary.calls_per_day.reduce((acc, d) => acc + d.count, 0);
  }, [summary]);

  const totalBookingsInPeriod = useMemo(() => {
    if (!summary?.booking_trends) return 0;
    return summary.booking_trends.reduce((acc, d) => acc + d.count, 0);
  }, [summary]);

  return (
    <div className="space-y-6 text-left py-2">

      {/* ══════════════════════════════════════════════════════════════════════
         PART 5.1 — TOP SECTION: WELCOME, STATUS, SECTOR 3D HERO BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.92) 0%, rgba(8,11,24,0.96) 100%)',
        }}
      >
        {/* Designated Sector 3D Illustration Area (Faded smoothly on the right) */}
        {heroImageLoaded && (
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 pointer-events-none select-none overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 100%)',
            }}
          >
            <img
              src={heroImageSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-right opacity-40 sm:opacity-50 transition-opacity duration-700"
            />
          </div>
        )}

        {/* Ambient sector accent glow behind title */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-25"
          style={{ backgroundColor: accent }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Status */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider font-mono flex items-center gap-1.5"
                style={{
                  backgroundColor: `${accent}15`,
                  borderColor: `${accent}40`,
                  color: accent,
                }}
              >
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accent }} />
                {sectorDetail.name} Workspace
              </span>

              {/* Live Voice-Agent Status Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gnani Prisma v3.0 &amp; Timbre Active</span>
              </div>
            </div>

            {/* Greeting & Date */}
            <div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>{todayFormatted}</span>
                <span>•</span>
                <span className="font-tamil text-slate-300">{greeting.ta}</span>
                <span>({greeting.en})</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E8EDF9] font-heading mt-1">
                {sectorDetail.display_name_ta}{' '}
                <span className="text-slate-400 font-normal text-lg sm:text-xl">
                  — {sectorDetail.display_name_en}
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-tamil leading-relaxed max-w-xl">
              {sectorDetail.tagline_ta} • <span className="font-sans text-slate-400">{sectorDetail.tagline_en}</span>
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              onClick={() => onNavigateTab('smart-service')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/40 bg-cyan-500/20 hover:bg-cyan-500/30"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Smart Service Center</span>
            </button>

            <button
              onClick={() => onNavigateTab('live-call')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 transition-all shadow-lg hover:shadow-cyan-500/20 hover:scale-105 active:scale-95 cursor-pointer border-none"
              style={{ backgroundColor: accent }}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch Live Call</span>
            </button>

            <button
              onClick={handleLoadDemo}
              disabled={demoActionLoading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all hover:bg-purple-950/40 disabled:opacity-50"
              style={{ background: 'rgba(128,101,255,0.12)', borderColor: 'rgba(128,101,255,0.30)', color: '#A58EFF' }}
              title="Seed synthetic bookings and calls from sector package"
            >
              {demoActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Load Demo</span>
            </button>

            <button
              onClick={handleClearDemo}
              disabled={demoActionLoading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all hover:bg-rose-950/40 disabled:opacity-50"
              style={{ background: 'rgba(255,100,124,0.08)', borderColor: 'rgba(255,100,124,0.20)', color: '#FF647C' }}
              title="Reset sector records to clear state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <a
              href="/api/analytics/export/calls"
              download
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-800"
              style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.10)', color: '#9AA7BE' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         PART 5.2 — SUMMARY SECTION: 5 KEY METRIC TILES
      ══════════════════════════════════════════════════════════════════════ */}
      {loading && !summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonKPI key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {sectorKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={idx}
                variant="default"
                className="p-4 space-y-2 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all hover:-translate-y-0.5 shadow-md"
              >
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
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════════
         PART 5.3 — MIDDLE SECTION: CHARTS AND GRAPHS
      ══════════════════════════════════════════════════════════════════════ */}
      {summary && (
        <div className="space-y-6">

          {/* Row 1: Calls Activity (7-Day Area Chart) + Booking Trends (7-Day Bar Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Chart 1: Calls Activity Trend */}
            <Card variant="elevated" className="lg:col-span-7 p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Calls Activity — Daily Inbound Calls (Last 7 Days)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {totalCallsInPeriod} Total Calls
                </span>
              </div>

              {totalCallsInPeriod === 0 ? (
                <EmptyState
                  title="No call logs in this 7-day period"
                  description="Use 'Launch Live Call' or 'Load Demo' to generate voice interaction records."
                  className="py-12"
                />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.calls_per_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="callsActivityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={accent} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={accent} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Calls Received"
                        stroke={accent}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#callsActivityGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Booking Trends (Last 7 Days) */}
            <Card variant="elevated" className="lg:col-span-5 p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Booking Trends (Last 7 Days)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {totalBookingsInPeriod} Bookings
                </span>
              </div>

              {totalBookingsInPeriod === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Confirmed bookings from voice calls or demo seeding will populate here."
                  className="py-12"
                />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.booking_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Bookings Made" fill="#42D6A4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Row 2: Call Outcomes Donut + Language Distribution + Peak Calling Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Chart 3: Call Outcomes (Donut/Pie Chart) */}
            <Card variant="elevated" className="p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Call Outcomes Breakdown
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Total: {totalCallsInPeriod}</span>
              </div>

              {outcomesChartData.length === 0 ? (
                <EmptyState title="No call outcomes" description="No call results logged yet." className="py-8" />
              ) : (
                <div className="h-52 w-full flex flex-col justify-between">
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Pie
                        data={outcomesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={58}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {outcomesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/5">
                    {outcomesChartData.map((item) => (
                      <span key={item.name} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}: <strong className="text-white">{item.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Chart 4: Language Distribution (Tamil, Tanglish, English) */}
            <Card variant="elevated" className="p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Language Distribution
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Tamil Nadu Voice Core
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {languageChartData.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name === 'Tamil' && 'தமிழ் (Pure Tamil)'}
                        {item.name === 'Tanglish' && 'Tanglish (Code-Mixed)'}
                        {item.name === 'English' && 'Indian English'}
                      </span>
                      <span className="font-mono text-slate-300">
                        {item.count} calls ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5 font-mono">
                Real-time STT classification from Gnani Prisma interaction logs.
              </p>
            </Card>

            {/* Chart 5: Peak Calling Hours (Hourly Bar Chart) */}
            <Card variant="elevated" className="p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Peak Calling Hours (09:00 - 19:00)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Hourly Volume</span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.peak_hours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="calls" name="Calls" fill="#FFBF69" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 3: Sector Comparison + Sector Domain Specific Slots Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Chart 6: Sector Activity Comparison across all 6 sectors */}
            <Card variant="elevated" className="lg:col-span-7 p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                    Sector Activity Comparison (Platform-Wide DB Records)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  All 6 Sectors
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.sector_comparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={9}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="calls" name="Calls Handled" fill="#32D8E8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bookings" name="Bookings Made" fill="#8065FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Sector Specific Category & Domain Breakdown */}
            <Card variant="elevated" className="lg:col-span-5 p-5 space-y-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                  {sectorDetail.id === 'panchayat_health' && 'Health Service Request Types'}
                  {sectorDetail.id === 'clinic' && 'Doctor Specialty Demand'}
                  {sectorDetail.id === 'vet_clinic' && 'Animal Categories Treated'}
                  {sectorDetail.id === 'hotel_lodge' && 'Room Type Reservations'}
                  {sectorDetail.id === 'restaurant' && 'Dining vs Catering Orders'}
                  {sectorDetail.id === 'coaching' && 'Target Exam Enquiries'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Captured Slots</span>
              </div>

              {sectorDomainData.chartList.length === 0 ? (
                <EmptyState
                  title="No sector slots logged yet"
                  description="Incoming voice calls will automatically populate this breakdown."
                  className="py-10"
                />
              ) : (
                <div className="space-y-3 pt-1">
                  {sectorDomainData.chartList.slice(0, 5).map((item, i) => {
                    const percentage = Math.round((item.count / bookings.length) * 100) || 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{item.name}</span>
                          <span className="text-slate-400 font-mono">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
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

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => onNavigateTab('bookings')}
                  className="text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  style={{ color: accent }}
                >
                  <span>View in Bookings Manager</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         PART 5.4 — BOTTOM SECTION: RECENT CALLS, BOOKINGS & ALERTS
      ══════════════════════════════════════════════════════════════════════ */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Recent Inbound Calls */}
          <Card variant="elevated" className="lg:col-span-6 p-5 space-y-3 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                  Recent Inbound Calls
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('call-logs')}
                className="text-[10px] cursor-pointer border-none bg-transparent transition-colors hover:underline"
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
                    className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                    style={{ background: 'rgba(8,11,24,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${accent}15`,
                          borderColor: `${accent}35`,
                          color: accent,
                        }}
                      >
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#E8EDF9] font-mono">{rc.caller_phone}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{rc.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">{rc.duration}</span>
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

          {/* Recent Bookings & Pending Actions */}
          <Card variant="elevated" className="lg:col-span-6 p-5 space-y-3 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-[#E8EDF9] font-heading">
                  Recent Bookings &amp; Service Tokens
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-[10px] cursor-pointer border-none bg-transparent transition-colors hover:underline text-emerald-400 font-mono"
              >
                Manage bookings →
              </button>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                title="No bookings recorded yet"
                description="Bookings created by callers will appear here immediately."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                    style={{ background: 'rgba(8,11,24,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-emerald-950/40 border-emerald-500/30 text-emerald-400">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#E8EDF9]">{b.customer_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{b.phone} • Ref: {b.reference_number}</p>
                      </div>
                    </div>
                    <Badge
                      variant={b.status === 'confirmed' ? 'success' : b.status === 'completed' ? 'info' : 'warning'}
                      size="sm"
                    >
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
