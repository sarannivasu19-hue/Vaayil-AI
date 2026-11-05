import React, { useState, useEffect } from 'react';
import type { SectorDetail, SafetyBenchmarkResult } from '../../types';
import { api } from '../../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface SafetyTestSheetViewProps {
  sectorDetail: SectorDetail;
}

export const SafetyTestSheetView: React.FC<SafetyTestSheetViewProps> = ({ sectorDetail: _sectorDetail }) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<SafetyBenchmarkResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'misses' | 'false_alarms' | 'suggestions'>('overview');

  useEffect(() => {
    // Run benchmark initially on load
    runBenchmark('all');
  }, []);

  async function runBenchmark(sector: string) {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.runSafetyBenchmark(sector);
      setBenchmarkResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute safety benchmark');
    } finally {
      setLoading(false);
    }
  }

  const categoryChartData = benchmarkResult
    ? Object.entries(benchmarkResult.category_breakdown).map(([cat, stats]) => ({
        name: cat.replace('_', ' ').toUpperCase(),
        Accuracy: stats.accuracy_percent,
        Total: stats.total,
        Correct: stats.correct,
      }))
    : [];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-sora">
              Safety Test Sheet
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ground-Truth Urgent-Case Detection Benchmark (Recall, Negation Handling, False-Alarm Rates)
          </p>
        </div>

        {/* Clinical Disclaimer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="font-semibold">Keyword-based alert, not a medical diagnosis.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Sector Filter & Run Benchmark */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider shrink-0">
            Sector Filter:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Sectors (180)' },
              { id: 'panchayat_health', label: 'Health Help Desk (60)' },
              { id: 'clinic', label: 'Clinic (60)' },
              { id: 'vet_clinic', label: 'Veterinary (60)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedSector(tab.id);
                  runBenchmark(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSector === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => runBenchmark(selectedSector)}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 touch-target"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{loading ? 'Evaluating...' : 'Re-Run Benchmark'}</span>
        </button>
      </div>

      {benchmarkResult && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Recall (Sensitivity)
              </span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                {benchmarkResult.metrics.recall_percent}%
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {benchmarkResult.confusion_matrix.tp} / {benchmarkResult.confusion_matrix.actual_positives} real emergencies caught
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-rose-500/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                False-Alarm Rate
              </span>
              <p className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                {benchmarkResult.metrics.false_alarm_rate_percent}%
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {benchmarkResult.confusion_matrix.fp} / {benchmarkResult.confusion_matrix.actual_negatives} normal queries falsely flagged
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Specificity
              </span>
              <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                {benchmarkResult.metrics.specificity_percent}%
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {benchmarkResult.confusion_matrix.tn} / {benchmarkResult.confusion_matrix.actual_negatives} non-emergencies correctly passed
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-purple-500/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Overall Accuracy
              </span>
              <p className="text-2xl font-extrabold text-purple-300 font-mono mt-1">
                {benchmarkResult.metrics.accuracy_percent}%
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Across {benchmarkResult.total_test_cases} benchmark cases
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-white/10 gap-4 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Benchmark Overview & Breakdown' },
              { id: 'misses', label: `Misses / False Negatives (${benchmarkResult.misses_count})` },
              { id: 'false_alarms', label: `False Alarms (${benchmarkResult.false_alarms_count})` },
              { id: 'suggestions', label: `Rule Suggestions (${benchmarkResult.suggested_improvements.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`pb-2.5 transition-colors cursor-pointer border-b-2 -mb-px ${
                  activeTab === t.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & BREAKDOWN */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Confusion Matrix Visualization */}
              <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Confusion Matrix (Ground Truth vs Model Detection)
                </h3>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block">True Positives (TP)</span>
                    <p className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">
                      {benchmarkResult.confusion_matrix.tp}
                    </p>
                    <span className="text-[10px] text-slate-400">Emergencies Correctly Caught</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center">
                    <span className="text-[10px] font-mono text-rose-400 uppercase block">False Positives (FP)</span>
                    <p className="text-xl font-extrabold text-rose-300 font-mono mt-0.5">
                      {benchmarkResult.confusion_matrix.fp}
                    </p>
                    <span className="text-[10px] text-slate-400">False Alarms Raised</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block">False Negatives (FN)</span>
                    <p className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">
                      {benchmarkResult.confusion_matrix.fn}
                    </p>
                    <span className="text-[10px] text-slate-400">Missed Emergencies</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <span className="text-[10px] font-mono text-slate-300 uppercase block">True Negatives (TN)</span>
                    <p className="text-xl font-extrabold text-slate-200 font-mono mt-0.5">
                      {benchmarkResult.confusion_matrix.tn}
                    </p>
                    <span className="text-[10px] text-slate-400">Normal Calls Correctly Cleared</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Recharts Bar Chart */}
              <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Performance by Utterance Category (% Accuracy)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis unit="%" stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Accuracy" name="Accuracy %" radius={[4, 4, 0, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.Accuracy >= 90
                                ? '#10b981'
                                : entry.Accuracy >= 75
                                ? '#06b6d4'
                                : '#f59e0b'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MISSES (FALSE NEGATIVES) */}
          {activeTab === 'misses' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                <strong>False Negatives (Misses):</strong> The caller described a real urgent condition, but the rule-based keyword detector did not trigger an alert.
              </div>

              {benchmarkResult.misses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  No misses found for this sector filter. 100% recall achieved!
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {benchmarkResult.misses.map((m) => (
                    <div key={m.id} className="p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{m.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                            {m.sector} • {m.language}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                          MISSED EMERGENCY
                        </span>
                      </div>
                      <p className="font-tamil text-slate-200 text-sm font-medium">"{m.text}"</p>
                      <p className="text-[11px] text-slate-400">Reason: {m.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FALSE ALARMS (FALSE POSITIVES) */}
          {activeTab === 'false_alarms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs">
                <strong>False Positives (False Alarms):</strong> The caller asked a routine question, but the detector triggered an alert because of past event wording or complex sentence structure.
              </div>

              {benchmarkResult.false_alarms.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  No false alarms detected. 0% false alarm rate achieved!
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {benchmarkResult.false_alarms.map((fa) => (
                    <div key={fa.id} className="p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-rose-400 font-bold">{fa.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                            {fa.sector} • {fa.language}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300">
                          FALSE ALARM
                        </span>
                      </div>
                      <p className="font-tamil text-slate-200 text-sm font-medium">"{fa.text}"</p>
                      <p className="text-[11px] text-slate-400">
                        Triggered on keyword: <code className="text-cyan-300 font-mono">"{fa.matched_keyword}"</code> — {fa.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUGGESTIONS & WEAK SPOTS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Proposed Detector Rule Enhancements</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The benchmark honestly surfaced weak spots in Tanglish misspellings and temporal past-event qualifiers. Here are the exact rule improvements recommended for your approval:
                </p>
              </div>

              <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                {benchmarkResult.suggested_improvements.map((sug, si) => (
                  <div key={si} className="p-4 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold">{sug.item_id}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {sug.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-tamil text-slate-300 italic">"{sug.text}"</p>
                    <p className="text-slate-200 pt-1 leading-relaxed">{sug.reason}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  As required by policy, these rule adjustments remain staged for user review. No changes are applied until you approve.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
