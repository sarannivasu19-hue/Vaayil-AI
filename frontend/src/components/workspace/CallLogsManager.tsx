import React, { useState, useEffect } from 'react';
import type { SectorDetail, CallLogItem } from '../../types';
import { api } from '../../services/api';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  Phone,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const CallLogsManager: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail }) => {
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CallLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getCallLogs(searchTerm, outcomeFilter, urgentOnly);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load call logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [outcomeFilter, urgentOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const accent = sectorDetail.accent_color;

  // Single Call Log Detail View
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      if (selectedLog && !e.state?.logDetail) {
        setSelectedLog(null);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [selectedLog]);

  const handleSelectLog = (log: CallLogItem) => {
    setSelectedLog(log);
    window.history.pushState({ logDetail: true, logId: log.id }, '', window.location.hash);
  };

  const handleCloseDetail = () => {
    if (window.history.state?.logDetail) {
      window.history.back();
    } else {
      setSelectedLog(null);
    }
  };

  if (selectedLog) {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto py-2">
        <button
          onClick={handleCloseDetail}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Calls</span>
        </button>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-tamil">
                  அழைப்பு விவரம் #{selectedLog.id}
                </h2>
                {selectedLog.urgent_flag && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Possible Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Caller Phone: <span className="font-mono text-slate-200">{selectedLog.caller_phone}</span> · Duration: {selectedLog.duration_seconds}s
              </p>
            </div>

            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-xl uppercase border ${
                selectedLog.outcome === 'booked'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : selectedLog.outcome === 'urgent'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-white/10 text-slate-400'
              }`}
            >
              Outcome: {selectedLog.outcome}
            </span>
          </div>

          {/* Heuristic Insights Card */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Call Insights & Sentiment (Rule-Based Heuristic)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Detected Intent:</span>
                <span className="font-semibold text-slate-200">{selectedLog.insights.intent || 'Inquiry'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Sentiment Score:</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedLog.insights.sentiment || 'neutral'}</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 pt-2 border-t border-white/5 leading-relaxed">
              <strong>Summary:</strong> {selectedLog.insights.summary || 'Summary unavailable.'}
            </div>
          </div>

          {/* Full Turn-by-Turn Transcript */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Full Dialogue Turns ({selectedLog.transcript_turns.length})
            </h3>
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10 max-h-[350px] overflow-y-auto">
              {selectedLog.transcript_turns.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs font-tamil ${
                    t.speaker === 'caller'
                      ? 'bg-slate-900 text-slate-200 ml-6 border border-white/5'
                      : 'bg-slate-900/40 text-white mr-6 border-l-3'
                  }`}
                  style={t.speaker !== 'caller' ? { borderLeftColor: accent } : {}}
                >
                  <span className="text-[10px] font-mono uppercase block mb-1 opacity-60">
                    {t.speaker === 'caller' ? 'Caller' : 'Vaayil Voice Agent'}
                  </span>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Call Logs Listing View
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-tamil tracking-tight">
            அழைப்பு பதிவுகள் — Call Intelligence Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {sectorDetail.name} · Real-time Call Logs, Dialogue Transcripts & Heuristic Insights
          </p>
        </div>

        {/* Urgent Only Filter Toggle */}
        <button
          onClick={() => setUrgentOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            urgentOnly
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Urgent Cases Only</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search phone number, symptom, or transcript text..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="booked">Booked / Confirmed</option>
            <option value="urgent">Urgent Flagged</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
          <span className="text-xs font-mono">Loading call logs from database...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 text-slate-400">
          <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-white">No call logs found</p>
          <p className="text-xs text-slate-500 mt-1">
            Complete a live voice call turn on the Live Call page to see it logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={() => handleSelectLog(log)}
              className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {log.caller_phone}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                      log.outcome === 'booked'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : log.outcome === 'urgent'
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    {log.outcome}
                  </span>
                  {log.urgent_flag && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 text-[10px] font-bold uppercase flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {log.insights.summary || 'Dialogue turns recorded.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {log.duration_seconds}s duration
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
