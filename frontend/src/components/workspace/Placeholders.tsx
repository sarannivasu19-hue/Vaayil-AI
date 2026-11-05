import React from 'react';
import type { SectorDetail } from '../../types';
import {
  PhoneCall,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react';

export const DashboardPlaceholder: React.FC<{ sectorDetail: SectorDetail; onNavigateBookings: () => void }> = ({
  sectorDetail,
  onNavigateBookings,
}) => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-tamil tracking-tight">
            {sectorDetail.display_name_ta} — டாஷ்போர்டு
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Operational Overview & Call Intelligence Metrics
          </p>
        </div>
        <button
          onClick={onNavigateBookings}
          className="px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
          style={{ backgroundColor: sectorDetail.accent_color }}
        >
          <span>Go to Bookings Console</span>
        </button>
      </div>

      {/* KPI Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Calls", val: '0', sub: 'Phase 3/5 Audio Loop' },
          { label: 'Booking Requests', val: 'Active in Phase 2', sub: 'Database CRUD Live' },
          { label: 'Urgent Cases Flagged', val: '0', sub: 'Safety Triage Engine' },
          { label: 'Avg Call Duration', val: '0s', sub: 'Voice Agent Timings' },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-2xl glass-panel border border-white/10">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{c.label}</span>
            <p className="text-xl font-extrabold text-white mt-1.5">{c.val}</p>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 block">{c.sub}</span>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Phase 2 Status: Bookings Engine & Dynamic Slots Live</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          The unified backend slot engine is fully operational with <strong>{sectorDetail.slots.length} sector-specific configuration slots</strong> for {sectorDetail.name}. You can create, edit, search, and cancel bookings with conflict detection on the Bookings tab.
        </p>
        <button
          onClick={onNavigateBookings}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
        >
          Open Bookings Manager →
        </button>
      </div>
    </div>
  );
};

export const LiveCallPlaceholder: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail: _sectorDetail }) => {
  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto py-8">
      <div className="p-8 rounded-3xl glass-panel border border-cyan-500/30 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-4 animate-pulse">
          <PhoneCall className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
          Scheduled for Phase 3 & 5
        </span>
        <h2 className="text-2xl font-bold text-white mt-4 font-tamil">
          3D Voice Orb & நேரடி குரல் அழைப்பு
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Interactive voice call engine powered by genuine <strong>Gnani Prisma (STT)</strong> and <strong>Gnani Timbre (TTS)</strong> with real-time audio orb states (idle, listening, processing, speaking).
        </p>
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[10px] font-mono text-cyan-400 block mb-1">Phase 3</span>
            <p className="text-xs font-bold text-white">Prisma STT</p>
            <span className="text-[10px] text-slate-400">Microphone & audio upload with editable transcript</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[10px] font-mono text-cyan-400 block mb-1">Phase 4</span>
            <p className="text-xs font-bold text-white">Slot Filling Engine</p>
            <span className="text-[10px] text-slate-400">Deterministic Tamil/Tanglish slot state machine</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[10px] font-mono text-cyan-400 block mb-1">Phase 5</span>
            <p className="text-xs font-bold text-white">Timbre TTS & Orb</p>
            <span className="text-[10px] text-slate-400">Shivani voice output with animated 3D voice orb</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CallLogsPlaceholder: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail: _sectorDetail }) => {
  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto py-8">
      <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center">
        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30">
          Scheduled for Phase 6
        </span>
        <h2 className="text-xl font-bold text-white mt-4 font-tamil">
          அழைப்பு பதிவுகள் & நுண்ணறிவு (Call Logs & Intelligence)
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Comprehensive call intelligence logs: multi-turn Tamil/Tanglish transcripts, sentiment analysis, audio replays, and urgent case triage review queue.
        </p>
      </div>
    </div>
  );
};

export const SettingsPlaceholder: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail }) => {
  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto py-8">
      <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center">
        <Settings className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-3 py-1 rounded-full bg-slate-900 border border-white/10">
          Sector Settings
        </span>
        <h2 className="text-xl font-bold text-white mt-4 font-tamil">
          {sectorDetail.display_name_ta} — அமைப்புகள்
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Customize working hours, slot question prompts, language preference mode (Tamil / Tanglish / English), and Timbre voice parameters.
        </p>
      </div>
    </div>
  );
};
