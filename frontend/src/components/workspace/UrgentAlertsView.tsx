import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Phone,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import type { SectorDetail, AlertItem, AlertSummary } from '../../types';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface UrgentAlertsViewProps {
  sectorDetail: SectorDetail;
  onNavigateToSafety?: () => void;
}

export const UrgentAlertsView: React.FC<UrgentAlertsViewProps> = ({
  sectorDetail,
  onNavigateToSafety,
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Alert for Details / Review Modal
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [reviewAction, setReviewAction] = useState<string>('confirm');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const fetchAlerts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setFetchError(null);

      const [alertsData, summaryData] = await Promise.all([
        api.getAlerts({
          sector_id: sectorDetail.id,
          status: statusFilter,
          severity: severityFilter,
          search: searchTerm,
        }),
        api.getAlertSummary(sectorDetail.id),
      ]);

      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load urgent alerts:', err);
      setFetchError(err instanceof Error ? err.message : 'Unable to connect to Urgent Alerts service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [sectorDetail.id, statusFilter, severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlerts(true);
  };

  const handleOpenReview = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setReviewAction(
      alert.status === 'confirmed'
        ? 'confirm'
        : alert.status === 'false_alarm'
        ? 'false_alarm'
        : alert.status === 'resolved'
        ? 'resolve'
        : 'confirm'
    );
    setReviewNotes(alert.review_notes || '');
    setReviewSuccess(null);
  };

  const handleSaveReview = async () => {
    if (!selectedAlert) return;
    setIsSubmittingReview(true);
    setReviewSuccess(null);
    try {
      const updated = await api.reviewAlert(selectedAlert.id, reviewAction, reviewNotes);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAlert(updated);
      setReviewSuccess(`Decision saved: Alert is marked as '${updated.status}'.`);
      const updatedSummary = await api.getAlertSummary(sectorDetail.id);
      setSummary(updatedSummary);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#101626] border border-rose-500/30 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertOctagon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            Failed to Load Urgent Alerts
          </h3>
          <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto">
            {fetchError}
          </p>
        </div>
        <button
          onClick={() => fetchAlerts()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#8065FF] hover:bg-[#9275FF] text-white transition-colors cursor-pointer border-none shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading Alerts</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-6 h-6 text-[#FF647C]" />
            <h1 className="text-2xl font-bold text-[#E8EDF9] font-heading">
              அவசர எச்சரிக்கை — Urgent Alerts Hub
            </h1>
          </div>
          <p className="text-xs text-[#9AA7BE]">
            {sectorDetail.name} · Real-time keyword triage and patient safety escalation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-[#9AA7BE] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Triage Disclaimer Banner */}
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl border text-xs"
        style={{
          background: 'rgba(255,100,124,0.07)',
          borderColor: 'rgba(255,100,124,0.25)',
          color: '#FF889B',
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF647C]" />
        <div>
          <strong className="text-[#FF647C]">Critical AI Keyword Triage Protocol:</strong> Alerts are triggered by real-time speech keyword matching (e.g. chest pain, seizures, toxic ingestion, severe bleeding). All alerts must be validated by a licensed professional or supervisor before clinical escalation.
        </div>
      </div>

      {/* TOP SUMMARY KPI CARDS */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card variant="default" className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#9AA7BE]">Total Alerts</span>
            <p className="text-2xl font-bold font-heading text-white">{summary.total_alerts}</p>
            <p className="text-[10px] text-[#7E8CA3] font-mono">All-time logged</p>
          </Card>

          <Card
            variant="default"
            className="p-3.5 space-y-1"
            style={{ borderColor: 'rgba(255,100,124,0.3)', background: 'rgba(255,100,124,0.05)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#FF647C]">New Alerts</span>
              <span className="w-2 h-2 rounded-full bg-[#FF647C] animate-ping" />
            </div>
            <p className="text-2xl font-bold font-heading text-[#FF647C]">{summary.new_alerts}</p>
            <p className="text-[10px] text-[#FF889B] font-mono">Requires action</p>
          </Card>

          <Card
            variant="default"
            className="p-3.5 space-y-1"
            style={{ borderColor: 'rgba(255,191,105,0.25)' }}
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#FFBF69]">Under Review</span>
            <p className="text-2xl font-bold font-heading text-[#FFBF69]">{summary.under_review}</p>
            <p className="text-[10px] text-[#7E8CA3] font-mono">Follow-up assigned</p>
          </Card>

          <Card
            variant="default"
            className="p-3.5 space-y-1"
            style={{ borderColor: 'rgba(66,214,164,0.25)' }}
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#42D6A4]">Confirmed Urgent</span>
            <p className="text-2xl font-bold font-heading text-[#42D6A4]">{summary.confirmed_urgent}</p>
            <p className="text-[10px] text-[#7E8CA3] font-mono">Validated incident</p>
          </Card>

          <Card variant="default" className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#9AA7BE]">Resolved</span>
            <p className="text-2xl font-bold font-heading text-white">{summary.resolved_alerts}</p>
            <p className="text-[10px] text-[#7E8CA3] font-mono">Triage closed</p>
          </Card>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#101626] border border-white/10">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'new', label: 'New' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'false_alarm', label: 'False Alarms' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                statusFilter === st.id
                  ? 'bg-[#32D8E8]/15 border-[#32D8E8]/50 text-[#32D8E8]'
                  : 'bg-white/5 border-transparent text-[#9AA7BE] hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search & Severity Dropdown */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-[#7E8CA3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter keyword, phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-black/40 border border-white/10 text-white placeholder-[#59667D] outline-none"
            />
          </form>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-black/40 border border-white/10 text-[#BAC7DF] outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* ALERT LIST / EMPTY STATE */}
      {alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#101626] border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#42D6A4]/10 border border-[#42D6A4]/30 flex items-center justify-center mx-auto text-[#42D6A4]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              No urgent alerts yet
            </h3>
            <p className="text-xs text-[#9AA7BE] mt-1 max-w-md mx-auto leading-relaxed">
              New urgent cases detected by the voice engine will appear here. No emergencies are currently flagged for {sectorDetail.name}.
            </p>
          </div>

          {onNavigateToSafety && (
            <button
              onClick={onNavigateToSafety}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#8065FF] hover:bg-[#A58EFF] text-white transition-colors cursor-pointer border-none shadow-md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open AI Safety Benchmark Sheet</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-[#101626] overflow-hidden transition-all hover:border-white/20"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor:
                    alert.status === 'confirmed'
                      ? '#42D6A4'
                      : alert.status === 'false_alarm'
                      ? '#7E8CA3'
                      : isCritical
                      ? '#FF647C'
                      : '#FFBF69',
                }}
              >
                <div className="p-4 space-y-3">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">#ALT-{alert.id}</span>

                      {/* Severity Pill */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          alert.severity === 'critical'
                            ? 'bg-[#FF647C]/20 text-[#FF647C] border border-[#FF647C]/30'
                            : alert.severity === 'high'
                            ? 'bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/30'
                            : 'bg-blue-500/20 text-[#32D8E8] border border-blue-500/30'
                        }`}
                      >
                        {alert.severity}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          alert.status === 'confirmed'
                            ? 'bg-emerald-500/15 text-[#42D6A4]'
                            : alert.status === 'resolved'
                            ? 'bg-blue-500/15 text-[#32D8E8]'
                            : alert.status === 'under_review'
                            ? 'bg-amber-500/15 text-[#FFBF69]'
                            : alert.status === 'false_alarm'
                            ? 'bg-zinc-500/20 text-[#9AA7BE]'
                            : 'bg-rose-500/20 text-[#FF647C] animate-pulse'
                        }`}
                      >
                        {alert.status.replace('_', ' ')}
                      </span>

                      {alert.is_dev_sample && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-[#7E8CA3]">
                          Dev Sample
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#7E8CA3]">
                      <span className="flex items-center gap-1 text-white">
                        <Phone className="w-3.5 h-3.5 text-[#32D8E8]" />
                        {alert.phone}
                      </span>
                      <span>•</span>
                      <span>
                        {alert.created_at ? (
                          (() => {
                            const d = new Date(alert.created_at);
                            return isNaN(d.getTime()) ? alert.created_at : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()
                        ) : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Reason & Detected Keyword Box */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-[#FF647C] shrink-0" />
                        <span className="text-xs font-bold text-white">{alert.reason}</span>
                      </div>
                      <p className="text-xs text-[#BAC7DF] font-tamil pl-6">
                        "{alert.snippet}"
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/25 text-[11px] font-mono text-[#FF889B]">
                      <span>KEYWORD:</span>
                      <strong className="text-white font-tamil">{alert.matched_keyword}</strong>
                    </div>
                  </div>

                  {/* Review History Footer & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-[#7E8CA3]">
                    <div>
                      {alert.reviewed_by ? (
                        <span>
                          Reviewed by <strong className="text-[#E8EDF9]">{alert.reviewed_by}</strong>{' '}
                          {alert.reviewed_at && (
                            <>at {new Date(alert.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#FFBF69] font-medium">
                          Awaiting initial review decision
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenReview(alert)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#32D8E8]/10 hover:bg-[#32D8E8]/20 text-[#32D8E8] border border-[#32D8E8]/30 transition-all cursor-pointer self-end sm:self-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Review &amp; Full Transcript</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ==================== REVIEW MODAL / DRAWER ==================== */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div
              onClick={() => setSelectedAlert(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              className="relative z-10 w-full max-w-2xl my-auto rounded-2xl bg-[#0B0F20] border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#FF647C]" />
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Alert Review · #ALT-{selectedAlert.id}
                    </h3>
                    <p className="text-xs text-[#9AA7BE]">
                      Caller: {selectedAlert.phone} · Sector: {selectedAlert.sector_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-1.5 rounded-lg text-[#9AA7BE] hover:text-white bg-white/5 hover:bg-white/10 border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status Notice */}
                {reviewSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-[#42D6A4] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {/* Detected Context */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[#7E8CA3] uppercase text-[10px]">DETECTION REASON</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-[#FF647C]/20 text-[#FF647C] font-bold">
                      {selectedAlert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-bold text-white text-sm">{selectedAlert.reason}</p>
                  <p className="text-[#BAC7DF] font-tamil leading-relaxed">
                    "{selectedAlert.snippet}"
                  </p>
                </div>

                {/* Full Transcript Turns */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#7E8CA3] uppercase tracking-wider mb-2">
                    Full Available Transcript Turns ({selectedAlert.transcript_turns.length})
                  </h4>
                  {selectedAlert.transcript_turns.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/20 text-xs text-[#7E8CA3] text-center">
                      No dialogue turns recorded for this incident.
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/5 max-h-52 overflow-y-auto">
                      {selectedAlert.transcript_turns.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs font-tamil ${
                            t.speaker === 'caller'
                              ? 'bg-white/5 ml-4 border-l-2 border-[#32D8E8]'
                              : 'bg-white/10 mr-4 border-l-2 border-[#8065FF]'
                          }`}
                        >
                          <span className="text-[10px] font-mono uppercase text-[#7E8CA3] block mb-0.5">
                            {t.speaker === 'caller' ? 'Caller' : 'Vaayil Voice Agent'}
                          </span>
                          <span className="text-[#E8EDF9]">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Action Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#7E8CA3] uppercase tracking-wider">
                    Select Review Decision
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'confirm', label: 'Confirm Alert', color: '#42D6A4' },
                      { id: 'false_alarm', label: 'False Alarm', color: '#7E8CA3' },
                      { id: 'follow_up', label: 'Under Review', color: '#FFBF69' },
                      { id: 'resolve', label: 'Resolve Alert', color: '#32D8E8' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setReviewAction(btn.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          reviewAction === btn.id
                            ? 'bg-white/15 border-white text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-[#9AA7BE] hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer Audit Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-[#7E8CA3] uppercase tracking-wider">
                    Clinical / Operational Audit Notes (Saved to Database)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={`e.g. Verified with emergency duty officer. Action initiated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Case escalated for ${sectorDetail.name}.`}
                    className="w-full p-3 rounded-xl text-xs bg-black/40 border border-white/10 text-white placeholder-[#59667D] outline-none resize-none focus:border-[#32D8E8]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9AA7BE] hover:text-white bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#42D6A4] hover:bg-[#57f0be] text-[#080B18] cursor-pointer border-none shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Saving to Database…' : 'Save Review Decision'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
