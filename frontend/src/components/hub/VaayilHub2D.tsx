import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Sector, HubOverview } from '../../types';
import { api } from '../../services/api';
import { DynamicIcon } from '../ui/Icons';
import {
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface VaayilHub2DProps {
  sectors: Sector[];
  selectedSector: Sector | null;
  hoveredSector?: Sector | null;
  onHoverSector?: (sector: Sector | null) => void;
  onSelectSector: (sector: Sector) => void;
}

function getGreeting(): { ta: string; en: string } {
  const h = new Date().getHours();
  if (h < 12) return { ta: 'காலை வணக்கம்', en: 'Good Morning' };
  if (h < 17) return { ta: 'மதிய வணக்கம்', en: 'Good Afternoon' };
  return { ta: 'மாலை வணக்கம்', en: 'Good Evening' };
}

const SECTOR_IMAGE_MAP: Record<string, string> = {
  panchayat_health: '/assets/backgrounds/dashboard/panchayat-health.webp',
  clinic: '/assets/backgrounds/dashboard/clinic.webp',
  vet_clinic: '/assets/backgrounds/dashboard/veterinary-clinic.webp',
  hotel_lodge: '/assets/backgrounds/dashboard/hotel-lodge.webp',
  restaurant: '/assets/backgrounds/dashboard/restaurant-catering.webp',
  coaching: '/assets/backgrounds/dashboard/coaching-centre.webp',
};

export const VaayilHub2D: React.FC<VaayilHub2DProps> = ({
  sectors,
  selectedSector,
  hoveredSector,
  onHoverSector,
  onSelectSector,
}) => {
  const [hubOverview, setHubOverview] = useState<HubOverview | null>(null);
  const greeting = getGreeting();

  useEffect(() => {
    async function fetchOverview() {
      try {
        const data = await api.getHubOverview();
        setHubOverview(data);
      } catch (err) {
        console.warn('Could not load hub overview metrics:', err);
      }
    }
    fetchOverview();
  }, []);

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
      
      {/* ── Top Welcome & Status Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          {/* Glowing Arch Logo */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 shadow-xl border border-white/10"
                 style={{ background: 'linear-gradient(135deg, #17152D 0%, #0F172A 100%)' }}>
              <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
                <path
                  d="M12 44V26C12 17.163 19.163 10 28 10C36.837 10 44 17.163 44 26V44"
                  stroke="#8065FF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="28" cy="27" r="4.5" fill="#32D8E8" />
                <line x1="12" y1="44" x2="44" y2="44" stroke="#32D8E8" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#080B18]" title="Voice Core Active" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                {greeting.ta} · {greeting.en}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                வாயில் AI — Central Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E8EDF9] tracking-tight mt-1 font-heading">
              VAAYIL AI <span className="text-[#9AA7BE] font-normal text-lg sm:text-xl">Platform Overview</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9AA7BE] font-tamil mt-0.5">
              ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் — Every business. One intelligent voice at the door.
            </p>
          </div>
        </div>

        {/* Live Engine Status Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-slate-900/80 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <p className="text-xs font-semibold text-emerald-300 font-mono leading-none">
              Voice Agent Engine Online
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none">
              Gnani Prisma STT v3.0 · Timbre TTS v3.0
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Executive Platform KPI Cards (Real DB Data) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-8">
        {[
          {
            label_en: 'Total Calls Handled',
            label_ta: 'மொத்த அழைப்புகள்',
            value: hubOverview ? hubOverview.total_calls : '…',
            sub: hubOverview ? `${hubOverview.today_calls} calls today` : 'Loading calls',
            Icon: PhoneCall,
            color: '#38BDF8',
          },
          {
            label_en: 'Confirmed Bookings',
            label_ta: 'முன்பதிவுகள்',
            value: hubOverview ? hubOverview.total_bookings : '…',
            sub: hubOverview ? `${hubOverview.today_bookings} scheduled today` : 'Loading bookings',
            Icon: CalendarCheck,
            color: '#4ADE80',
          },
          {
            label_en: 'Call Completion Rate',
            label_ta: 'வெற்றி விகிதம்',
            value: hubOverview ? `${hubOverview.overall_completion_rate}%` : '…',
            sub: 'Voice conversation success',
            Icon: TrendingUp,
            color: '#A855F7',
          },
          {
            label_en: 'Emergency & Urgent',
            label_ta: 'அவசர அழைப்புகள்',
            value: hubOverview ? hubOverview.total_urgent_alerts : '0',
            sub: '108 Triage & review flags',
            Icon: ShieldAlert,
            color: '#F43F5E',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.Icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/75 border border-white/10 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 font-tamil">{kpi.label_ta}</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${kpi.color}15`,
                    borderColor: `${kpi.color}35`,
                    color: kpi.color,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                  {kpi.value}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono truncate">
                  {kpi.sub}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Section Title: The 6 Sector Workspaces ── */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Select Sector Workspace · ஆறு துறைகள்</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any sector to enter its dedicated voice console, bookings, and dashboard.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          6 Live Workspaces Available
        </span>
      </div>

      {/* ── Six Large Visually Attractive Sector Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full mb-8">
        {sectors.map((sector, index) => {
          const isSelected = selectedSector?.id === sector.id;
          const isHovered = hoveredSector?.id === sector.id;
          const isHighlighted = isSelected || isHovered;
          const stat = hubOverview?.sector_stats[sector.id];
          const imageSrc = SECTOR_IMAGE_MAP[sector.id];

          return (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              whileHover={{ y: -5, transition: { duration: 0.18 } }}
              onMouseEnter={() => onHoverSector?.(sector)}
              onMouseLeave={() => onHoverSector?.(null)}
              onClick={() => onSelectSector(sector)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectSector(sector)}
              aria-label={`Enter ${sector.display_name_en} workspace`}
              className="group relative rounded-2xl cursor-pointer text-left overflow-hidden transition-all duration-300 flex flex-col justify-between"
              style={{
                background: isHighlighted ? `${sector.accent_color}18` : 'rgba(16, 22, 38, 0.85)',
                border: `1px solid ${isHighlighted ? sector.accent_color : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isHighlighted ? `0 12px 35px -8px ${sector.accent_color}35` : '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* Sector Visual Header (3D Artwork or Stylized Gradient) */}
              <div className="h-32 w-full relative overflow-hidden bg-slate-950/80 border-b border-white/5">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt={sector.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(10,14,26,0.85) 80%, rgba(10,14,26,1) 100%)`,
                  }}
                />

                {/* Floating Sector Icon Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-md"
                    style={{
                      backgroundColor: `${sector.accent_color}25`,
                      borderColor: `${sector.accent_color}60`,
                      color: sector.accent_color,
                    }}
                  >
                    <DynamicIcon name={sector.icon} className="w-5 h-5" />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md border uppercase tracking-wider font-mono"
                    style={{
                      backgroundColor: 'rgba(10,14,26,0.7)',
                      borderColor: `${sector.accent_color}40`,
                      color: sector.accent_color,
                    }}
                  >
                    {sector.name}
                  </span>
                </div>

                {/* Live Activity Counter */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/10 text-[10px] text-slate-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{stat ? `${stat.calls_today} calls` : 'Live'}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-tamil tracking-tight">
                    {sector.display_name_ta}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5 mb-2">
                    {sector.display_name_en}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-tamil">
                    {sector.tagline_ta}
                  </p>
                </div>

                {/* Sector Stats & Quick Launch Action */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">Bookings:</span>{' '}
                      <span className="text-white font-semibold">{stat ? stat.total_bookings : 0}</span>
                    </div>
                    {stat && stat.urgent_alerts > 0 && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {stat.urgent_alerts}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 text-xs font-semibold transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: sector.accent_color }}
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Selection Border Glow */}
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl border-2"
                  style={{ borderColor: sector.accent_color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Platform Analytics & Recent Calls Feed (Real DB Streams) ── */}
      {hubOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full mb-8">
          {/* 7-Day Trend Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/75 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Platform Call Volume Trend (7 Days)
                </h3>
                <p className="text-xs text-slate-400 font-tamil">
                  கடந்த 7 நாட்களின் மொத்த அழைப்புகள்
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                Live Data
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hubOverview.daily_trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hubCallGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Calls"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hubCallGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Activity Stream */}
          <div className="p-5 rounded-2xl bg-slate-900/75 border border-white/10 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Calls · சமீபத்திய அழைப்புகள்</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Live</span>
              </div>

              <div className="space-y-2.5">
                {hubOverview.recent_calls.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No recent calls yet.</p>
                ) : (
                  hubOverview.recent_calls.slice(0, 5).map((call, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200 font-semibold">{call.caller_phone}</span>
                          {call.urgent && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-500/30 text-rose-400 text-[9px] font-bold">
                              URGENT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          {call.sector_id.replace('_', ' ')} · {call.duration}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            call.outcome === 'booked'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {call.outcome}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{call.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono text-center pt-3 border-t border-white/5">
              Automated Voice Loops with Gnani Prisma STT
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-slate-500 text-center font-mono mt-2"
      >
        Vaayil AI (வாயில் AI) · Tamil Nadu AI Voice Agent Architecture · Gnani Challenge 2026
      </motion.p>
    </div>
  );
};
