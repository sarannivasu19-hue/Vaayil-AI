import React, { useState, useEffect } from 'react';
import type { SectorDetail, CallLogItem } from '../../types';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Phone,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface UrgentAlertsViewProps {
  sectorDetail: SectorDetail;
}

export const UrgentAlertsView: React.FC<UrgentAlertsViewProps> = ({ sectorDetail }) => {
  const [alerts, setAlerts] = useState<CallLogItem[]>([]);
  const [allLogs, setAllLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchAlerts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const [urgent, all] = await Promise.all([
        api.getCallLogs('', 'all', true),
        api.getCallLogs('', 'all', false),
      ]);
      setAlerts(urgent);
      setAllLogs(all);
    } catch (e) {
      console.error('Failed to load urgent alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [sectorDetail.id]);

  const totalCalls = allLogs.length;
  const urgentCount = alerts.length;
  const normalCount = totalCalls - urgentCount;

  // Rough counts from alert outcomes
  const verifiedCount = alerts.filter(a => a.outcome === 'urgent').length;
  const awaitingCount = alerts.filter(a => a.outcome !== 'urgent').length;

  const accent = sectorDetail.accent_color;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5" style={{ color: '#FF647C' }} />
            <h1 className="text-2xl font-bold text-[#E8EDF9] font-heading">
              அவசர எச்சரிக்கை — Urgent Alerts
            </h1>
          </div>
          <p className="text-sm text-[#9AA7BE]">
            {sectorDetail.name} · Calls flagged for possible urgent conditions
          </p>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer"
          style={{
            background: 'rgba(23,31,51,0.7)',
            borderColor: 'rgba(255,255,255,0.08)',
            color: '#9AA7BE',
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Medical disclaimer — always visible */}
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl border text-xs"
        style={{
          background: 'rgba(255,100,124,0.07)',
          borderColor: 'rgba(255,100,124,0.25)',
          color: '#FF647C',
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Keyword-based alert, not a medical diagnosis.</strong>{' '}
          These alerts are triggered by keyword matching. Always verify with a qualified medical professional before taking action. Never rely solely on this system for clinical decisions.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="default" className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider font-mono">Total Calls</span>
            <Phone className="w-4 h-4 text-[#9AA7BE]" />
          </div>
          <p className="text-2xl font-bold text-[#E8EDF9] font-heading">{totalCalls}</p>
          <p className="text-[10px] text-[#4A5568] font-mono">In this session</p>
        </Card>

        <Card variant="default" className="p-4 space-y-2" style={{ borderColor: 'rgba(255,100,124,0.25)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: '#FF647C' }}>Flagged Urgent</span>
            <ShieldAlert className="w-4 h-4" style={{ color: '#FF647C' }} />
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: urgentCount > 0 ? '#FF647C' : '#E8EDF9' }}>
            {urgentCount}
          </p>
          <p className="text-[10px] text-[#4A5568] font-mono">Needs review</p>
        </Card>

        <Card variant="default" className="p-4 space-y-2" style={{ borderColor: 'rgba(255,191,105,0.25)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: '#FFBF69' }}>Awaiting Review</span>
            <Clock className="w-4 h-4" style={{ color: '#FFBF69' }} />
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: '#FFBF69' }}>{awaitingCount}</p>
          <p className="text-[10px] text-[#4A5568] font-mono">Outcome unclear</p>
        </Card>

        <Card variant="default" className="p-4 space-y-2" style={{ borderColor: 'rgba(66,214,164,0.2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: '#42D6A4' }}>Confirmed Urgent</span>
            <ShieldCheck className="w-4 h-4" style={{ color: '#42D6A4' }} />
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: '#42D6A4' }}>{verifiedCount}</p>
          <p className="text-[10px] text-[#4A5568] font-mono">Outcome = urgent</p>
        </Card>
      </div>

      {/* Alert Cards */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-10 h-10" />}
          title="No Urgent Alerts"
          description="No calls have been flagged for urgent conditions in this sector yet. Complete a voice call to see alerts here."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isExpanded = expanded[alert.id] ?? false;
            const noteVal = notes[alert.id] ?? '';
            const detectedPhrase = alert.insights?.summary
              ? alert.insights.summary.split(' ').slice(0, 8).join(' ') + '…'
              : 'Urgent keyword detected in transcript.';

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  variant="default"
                  padding="none"
                  className="overflow-hidden border-l-[3px]"
                  style={{ borderLeftColor: '#FF647C' }}
                >
                  <div className="p-4">
                    {/* Alert header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Phone + badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="flex items-center gap-1.5 text-xs font-mono font-bold"
                            style={{ color: '#E8EDF9' }}
                          >
                            <Phone className="w-3.5 h-3.5 text-[#9AA7BE]" />
                            {alert.caller_phone}
                          </span>
                          <Badge variant="danger" size="sm">⚠ Urgent Flag</Badge>
                          {alert.outcome === 'urgent' && (
                            <Badge variant="danger" size="sm">Confirmed Urgent</Badge>
                          )}
                        </div>

                        {/* Detected phrase */}
                        <div
                          className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                          style={{ background: 'rgba(255,100,124,0.07)', borderLeft: '2px solid rgba(255,100,124,0.4)' }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#FF647C' }} />
                          <div>
                            <span className="text-[10px] font-mono text-[#9AA7BE] block mb-0.5">DETECTED PHRASE:</span>
                            <span className="text-[#E8EDF9] font-tamil">{detectedPhrase}</span>
                          </div>
                        </div>

                        {/* Intent + sentiment row */}
                        <div className="flex gap-4 text-[11px]">
                          <div>
                            <span className="text-[#9AA7BE] font-mono text-[10px]">INTENT: </span>
                            <span className="text-[#E8EDF9]">{alert.insights?.intent || 'Unclassified'}</span>
                          </div>
                          <div>
                            <span className="text-[#9AA7BE] font-mono text-[10px]">DURATION: </span>
                            <span className="text-[#E8EDF9] font-mono">{alert.duration_seconds}s</span>
                          </div>
                          <div>
                            <span className="text-[#9AA7BE] font-mono text-[10px]">TIME: </span>
                            <span className="text-[#E8EDF9] font-mono">
                              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setExpanded(p => ({ ...p, [alert.id]: !p[alert.id] }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border"
                          style={{
                            background: 'rgba(23,31,51,0.7)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            color: '#9AA7BE',
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {isExpanded ? 'Hide' : 'Review'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable review panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-3 pt-3 space-y-3"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            {/* Transcript turns */}
                            {alert.transcript_turns.length > 0 && (
                              <div>
                                <p className="text-[10px] font-mono text-[#9AA7BE] uppercase mb-2">Dialogue Turns</p>
                                <div
                                  className="space-y-2 p-3 rounded-xl max-h-48 overflow-y-auto"
                                  style={{ background: '#080B18' }}
                                >
                                  {alert.transcript_turns.map((t, i) => (
                                    <div
                                      key={i}
                                      className={`text-xs p-2 rounded-lg font-tamil ${
                                        t.speaker === 'caller' ? 'ml-4' : 'mr-4'
                                      }`}
                                      style={{
                                        background: t.speaker === 'caller'
                                          ? 'rgba(255,255,255,0.04)'
                                          : `${accent}10`,
                                        borderLeft: t.speaker !== 'caller' ? `2px solid ${accent}60` : undefined,
                                        color: '#E8EDF9',
                                      }}
                                    >
                                      <span
                                        className="text-[9px] font-mono uppercase block mb-0.5"
                                        style={{ color: '#9AA7BE' }}
                                      >
                                        {t.speaker === 'caller' ? 'Caller' : 'Vaayil Agent'}
                                      </span>
                                      {t.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Review note */}
                            <div>
                              <label className="text-[10px] font-mono text-[#9AA7BE] uppercase block mb-1">
                                Review Note (not saved to database — for reference only)
                              </label>
                              <textarea
                                rows={2}
                                value={noteVal}
                                onChange={e => setNotes(p => ({ ...p, [alert.id]: e.target.value }))}
                                placeholder="e.g. Called back – confirmed chest pain, referred to hospital…"
                                className="w-full px-3 py-2 rounded-xl text-xs font-mono text-[#E8EDF9] resize-none focus:outline-none focus:ring-1 focus:ring-[#FF647C]/40"
                                style={{ background: '#080B18', border: '1px solid rgba(255,255,255,0.08)' }}
                              />
                            </div>

                            <div
                              className="flex items-center gap-2 p-2.5 rounded-lg text-[11px]"
                              style={{ background: 'rgba(255,191,105,0.08)', border: '1px solid rgba(255,191,105,0.2)' }}
                            >
                              <Info className="w-3.5 h-3.5 shrink-0" style={{ color: '#FFBF69' }} />
                              <span style={{ color: '#FFBF69' }}>
                                Review notes are session-only. The audit trail lives in the backend call log.
                              </span>
                            </div>

                            {alert.insights?.summary && (
                              <div>
                                <p className="text-[10px] font-mono text-[#9AA7BE] uppercase mb-1">AI Summary (heuristic)</p>
                                <p className="text-xs text-[#E8EDF9] leading-relaxed">{alert.insights.summary}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats summary at bottom */}
      {alerts.length > 0 && (
        <Card variant="elevated" padding="sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#42D6A4' }} />
            <span className="text-xs font-semibold text-[#E8EDF9]">Alert Rate Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#9AA7BE] font-mono text-[10px] block mb-0.5">URGENT RATE</span>
              <span className="text-[#E8EDF9] font-bold">
                {totalCalls > 0 ? ((urgentCount / totalCalls) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-[#9AA7BE]"> of all calls ({urgentCount}/{totalCalls})</span>
            </div>
            <div>
              <span className="text-[#9AA7BE] font-mono text-[10px] block mb-0.5">NORMAL CALLS</span>
              <span className="text-[#E8EDF9] font-bold">{normalCount}</span>
              <span className="text-[#9AA7BE]"> calls without flag</span>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#9AA7BE] leading-relaxed">
            Rate is based on keyword matching only. False positives (negated phrases like "no chest pain") may appear. See Safety Test Sheet for a full benchmark.
          </p>
        </Card>
      )}
    </div>
  );
};
