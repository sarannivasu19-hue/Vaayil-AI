import React, { useState, useEffect, useMemo } from 'react';
import type { SectorDetail, SafetyBenchmarkResult, SafetyEvaluationItem } from '../../types';
import { api } from '../../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  BookOpen,
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

interface SafetyTestSheetViewProps {
  sectorDetail: SectorDetail;
}

const SECTOR_LABELS: Record<string, string> = {
  all: 'All Sectors',
  panchayat_health: 'Panchayat Health',
  clinic: 'Clinic',
  vet_clinic: 'Veterinary',
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  urgent_true: 'Genuine Emergency',
  normal_call: 'Normal Call',
  negated: 'Negated Statement',
  past_event: 'Past Event',
  spelling_variant: 'Spelling Variant',
  transcript_error: 'Transcript Error',
};

const LANG_LABELS: Record<string, string> = {
  all: 'All Languages',
  tamil: 'Tamil',
  tanglish: 'Tanglish',
  english: 'English',
};

const CLASSIFICATION_BADGE: Record<string, { label: string; cls: string }> = {
  TP: { label: '✓ Correctly Detected', cls: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' },
  TN: { label: '✓ Correctly Cleared', cls: 'bg-slate-800/60 border-white/10 text-slate-300' },
  FP: { label: '⚠ False Alarm', cls: 'bg-rose-950/60 border-rose-500/40 text-rose-300' },
  FN: { label: '✗ Missed Emergency', cls: 'bg-amber-950/60 border-amber-500/40 text-amber-300' },
};

const CATEGORY_COLORS: Record<string, string> = {
  urgent_true: '#10b981',
  normal_call: '#06b6d4',
  negated: '#a78bfa',
  past_event: '#f59e0b',
  spelling_variant: '#f97316',
  transcript_error: '#e879f9',
};

function ScoreGauge({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export const SafetyTestSheetView: React.FC<SafetyTestSheetViewProps> = ({ sectorDetail: _sectorDetail }) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<SafetyBenchmarkResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'all_results' | 'misses' | 'false_alarms' | 'suggestions'>('overview');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
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

  // Collect all results from the benchmark response
  const allResults: SafetyEvaluationItem[] = useMemo(() => {
    if (!benchmarkResult) return [];
    return benchmarkResult.all_results || [...(benchmarkResult.misses || []), ...(benchmarkResult.false_alarms || [])];
  }, [benchmarkResult]);

  // Filtered results for the all-results table
  const filteredResults = useMemo(() => {
    return allResults.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (selectedLang !== 'all' && r.language !== selectedLang) return false;
      if (searchQuery && !r.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allResults, selectedCategory, selectedLang, searchQuery]);

  const categoryChartData = benchmarkResult
    ? Object.entries(benchmarkResult.category_breakdown).map(([cat, stats]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        shortName: cat.replace('_', ' ').toUpperCase(),
        Accuracy: stats.accuracy_percent,
        Errors: stats.errors,
        Total: stats.total,
        fill: CATEGORY_COLORS[cat] || '#94a3b8',
      }))
    : [];

  const radarData = benchmarkResult
    ? Object.entries(benchmarkResult.category_breakdown).map(([cat, stats]) => ({
        category: CATEGORY_LABELS[cat]?.split(' ')[0] || cat,
        accuracy: stats.accuracy_percent,
      }))
    : [];

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const r = benchmarkResult;
  const recallColor = r ? (r.metrics.recall_percent >= 95 ? '#10b981' : r.metrics.recall_percent >= 80 ? '#f59e0b' : '#f43f5e') : '#94a3b8';
  const farColor = r ? (r.metrics.false_alarm_rate_percent <= 5 ? '#10b981' : r.metrics.false_alarm_rate_percent <= 15 ? '#f59e0b' : '#f43f5e') : '#94a3b8';

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-heading">
              Safety Test Sheet
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ground-Truth Urgent-Case Detection Benchmark · Recall, Negation Handling, Past-Event Filtering, False-Alarm Rates
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-semibold">Keyword-based alert — not a medical diagnosis.</span>
          </div>
          <span className="text-[10px] text-slate-500">System is not 100% accurate. All failures are shown honestly.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* ── CONTROL BAR ── */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sector filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Sector:</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(SECTOR_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setSelectedSector(id); runBenchmark(id); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedSector === id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Language filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Language:</span>
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="bg-slate-900 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {Object.entries(LANG_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sentences or IDs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/50 placeholder-slate-600"
            />
          </div>

          {/* Re-run button */}
          <button
            type="button"
            onClick={() => runBenchmark(selectedSector)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            {loading ? 'Running…' : 'Run Safety Test'}
          </button>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="p-10 rounded-2xl glass-panel border border-white/10 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Running {benchmarkResult ? benchmarkResult.total_test_cases : 180} test sentences through the detection engine…</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {!loading && benchmarkResult && (
        <div className="space-y-6">

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Cases', value: benchmarkResult.total_test_cases, unit: '', color: '#94a3b8', note: `${Object.keys(benchmarkResult.category_breakdown).length} categories` },
              { label: 'Recall', value: benchmarkResult.metrics.recall_percent, unit: '%', color: recallColor, note: `${benchmarkResult.confusion_matrix.tp}/${benchmarkResult.confusion_matrix.actual_positives} emergencies caught` },
              { label: 'False-Alarm Rate', value: benchmarkResult.metrics.false_alarm_rate_percent, unit: '%', color: farColor, note: `${benchmarkResult.confusion_matrix.fp} false alerts`, invertBar: true },
              { label: 'Specificity', value: benchmarkResult.metrics.specificity_percent, unit: '%', color: '#06b6d4', note: `${benchmarkResult.confusion_matrix.tn} non-emerg. cleared` },
              { label: 'Accuracy', value: benchmarkResult.metrics.accuracy_percent, unit: '%', color: '#a78bfa', note: `Across ${benchmarkResult.total_test_cases} cases` },
            ].map((kpi) => (
              <div key={kpi.label} className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">{kpi.label}</span>
                <p className="text-2xl font-extrabold font-mono" style={{ color: kpi.color }}>
                  {kpi.value}{kpi.unit}
                </p>
                <ScoreGauge value={kpi.value} color={kpi.color} />
                <span className="text-[10px] text-slate-400 block leading-tight">{kpi.note}</span>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Overview & Charts' },
              { id: 'all_results', label: `All Results (${benchmarkResult.total_test_cases})` },
              { id: 'misses', label: `Missed Emergencies (${benchmarkResult.misses_count})` },
              { id: 'false_alarms', label: `False Alarms (${benchmarkResult.false_alarms_count})` },
              { id: 'suggestions', label: `Suggestions (${benchmarkResult.suggested_improvements.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px text-xs font-semibold ${
                  activeTab === t.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Confusion Matrix */}
                <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Confusion Matrix
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'True Positives (TP)', value: benchmarkResult.confusion_matrix.tp, sub: 'Emergencies correctly caught', cls: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' },
                      { label: 'False Positives (FP)', value: benchmarkResult.confusion_matrix.fp, sub: 'Normal calls wrongly flagged', cls: 'bg-rose-950/40 border-rose-500/40 text-rose-300' },
                      { label: 'False Negatives (FN)', value: benchmarkResult.confusion_matrix.fn, sub: 'Missed real emergencies', cls: 'bg-amber-950/40 border-amber-500/40 text-amber-300' },
                      { label: 'True Negatives (TN)', value: benchmarkResult.confusion_matrix.tn, sub: 'Normal calls correctly cleared', cls: 'bg-slate-900/60 border-white/10 text-slate-300' },
                    ].map(item => (
                      <div key={item.label} className={`p-3 rounded-xl border text-center ${item.cls}`}>
                        <span className="text-[10px] font-mono uppercase block opacity-80">{item.label}</span>
                        <p className="text-2xl font-extrabold font-mono mt-0.5">{item.value}</p>
                        <span className="text-[10px] opacity-70">{item.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Accuracy by Category (Radar)
                  </h3>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#ffffff15" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Radar name="Accuracy %" dataKey="accuracy" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} dot={{ r: 3, fill: '#06b6d4' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px', fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bar Chart — accuracy per category */}
              <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Performance by Utterance Category
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fontSize: 9 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis unit="%" stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px', fontSize: 11 }}
                        formatter={(v: any) => [`${v}%`, 'Accuracy']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                      <Bar dataKey="Accuracy" name="Accuracy %" radius={[4, 4, 0, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category breakdown table */}
              <div className="p-5 rounded-2xl glass-panel border border-white/10">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Category Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/10">
                        <th className="text-left pb-2 font-mono">Category</th>
                        <th className="text-center pb-2 font-mono">Total</th>
                        <th className="text-center pb-2 font-mono">Correct</th>
                        <th className="text-center pb-2 font-mono">Errors</th>
                        <th className="text-center pb-2 font-mono">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(benchmarkResult.category_breakdown).map(([cat, stats]) => (
                        <tr key={cat} className="text-slate-200">
                          <td className="py-2.5 pr-4">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                              {CATEGORY_LABELS[cat] || cat}
                            </span>
                          </td>
                          <td className="text-center py-2.5 font-mono">{stats.total}</td>
                          <td className="text-center py-2.5 font-mono text-emerald-400">{stats.correct}</td>
                          <td className="text-center py-2.5 font-mono text-rose-400">{stats.errors}</td>
                          <td className="text-center py-2.5">
                            <span className={`font-mono font-bold ${
                              stats.accuracy_percent >= 95 ? 'text-emerald-400' :
                              stats.accuracy_percent >= 80 ? 'text-cyan-400' : 'text-amber-400'
                            }`}>
                              {stats.accuracy_percent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400 flex items-start gap-2">
                <BookOpen className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-slate-200">How to read these results:</strong>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li><strong>Recall (Sensitivity)</strong> — What % of real emergencies were caught. Higher is safer.</li>
                    <li><strong>False-Alarm Rate</strong> — What % of normal calls were wrongly flagged. Lower is better.</li>
                    <li><strong>Specificity</strong> — What % of normal calls were correctly cleared.</li>
                    <li>The ideal system has <strong>Recall = 100%</strong> and <strong>False-Alarm Rate = 0%</strong>.</li>
                    <li>Uncertain situations should <em>never</em> be automatically discarded.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALL RESULTS */}
          {activeTab === 'all_results' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  Showing all {allResults.length} test results.
                  {benchmarkResult.confusion_matrix.tp + benchmarkResult.confusion_matrix.tn} passed correctly.
                  Use the category, language and sector filters to narrow down.
                </span>
              </div>

              {filteredResults.length === 0 ? (
                <div className="p-10 text-center rounded-2xl glass-panel border border-white/10 text-slate-400 text-sm">
                  {allResults.length === 0
                    ? '🎉 All test cases classified correctly. No errors to show.'
                    : 'No results match your current filters.'}
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {filteredResults.map((item) => {
                    const cls = item.predicted_urgent !== item.expected_urgent
                      ? (item.predicted_urgent ? 'FP' : 'FN')
                      : (item.expected_urgent ? 'TP' : 'TN');
                    const badge = CLASSIFICATION_BADGE[cls];
                    const expanded = expandedRows.has(item.id);
                    return (
                      <div key={item.id} className="p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 font-bold">{item.id}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                              {item.sector} · {item.language} · {CATEGORY_LABELS[item.category] || item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="font-tamil text-slate-200 text-sm font-medium">"{item.text}"</p>
                        {expanded && (
                          <div className="pt-2 space-y-1 text-[11px] text-slate-400 border-t border-white/5">
                            <p>Expected: <span className={item.expected_urgent ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{item.expected_urgent ? 'URGENT' : 'Normal'}</span></p>
                            <p>Detected: <span className={item.predicted_urgent ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{item.predicted_urgent ? 'URGENT' : 'Normal'}</span></p>
                            {item.matched_keyword && (
                              <p>Triggered keyword: <code className="text-cyan-300 font-mono">"{item.matched_keyword}"</code></p>
                            )}
                            <p>Notes: {item.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MISSES */}
          {activeTab === 'misses' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                <strong>False Negatives (Missed Emergencies):</strong> The caller described a real urgent condition, but the keyword detector did not trigger an alert. These are the most critical failures — a missed emergency could delay life-saving help.
              </div>

              {benchmarkResult.misses.length === 0 ? (
                <div className="p-10 text-center rounded-2xl glass-panel border border-emerald-500/20 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-semibold text-sm">No missed emergencies — 100% Recall achieved!</p>
                  <p className="text-slate-400 text-xs">Every genuine emergency in the benchmark was correctly detected.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {benchmarkResult.misses.map((m) => (
                    <div key={m.id} className="p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{m.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                            {m.sector} · {m.language} · {CATEGORY_LABELS[m.category] || m.category}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                          ✗ MISSED EMERGENCY
                        </span>
                      </div>
                      <p className="font-tamil text-slate-200 text-sm font-medium">"{m.text}"</p>
                      <p className="text-[11px] text-slate-400">Why missed: {m.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FALSE ALARMS */}
          {activeTab === 'false_alarms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs">
                <strong>False Positives (False Alarms):</strong> The caller asked a routine question, but the detector flagged it as urgent — often due to past-event wording, negated sentences, or complex structure. These cause alert fatigue if too frequent.
              </div>

              {benchmarkResult.false_alarms.length === 0 ? (
                <div className="p-10 text-center rounded-2xl glass-panel border border-emerald-500/20 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-semibold text-sm">No false alarms — 0% False-Alarm Rate achieved!</p>
                  <p className="text-slate-400 text-xs">Every normal call in the benchmark was correctly cleared without alerting.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {benchmarkResult.false_alarms.map((fa) => (
                    <div key={fa.id} className="p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-rose-400 font-bold">{fa.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                            {fa.sector} · {fa.language} · {CATEGORY_LABELS[fa.category] || fa.category}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300">
                          ⚠ FALSE ALARM
                        </span>
                      </div>
                      <p className="font-tamil text-slate-200 text-sm font-medium">"{fa.text}"</p>
                      <p className="text-[11px] text-slate-400">
                        Triggered keyword: <code className="text-cyan-300 font-mono">"{fa.matched_keyword}"</code> — {fa.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Proposed Detector Rule Enhancements</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  These improvements are automatically suggested based on benchmark failures. No production changes are applied without your explicit approval.
                </p>
              </div>

              {benchmarkResult.suggested_improvements.length === 0 ? (
                <div className="p-10 text-center rounded-2xl glass-panel border border-emerald-500/20 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-semibold text-sm">No improvements needed — benchmark is perfect!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                  {benchmarkResult.suggested_improvements.map((sug, si) => (
                    <div key={si} className="p-4 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-cyan-400 font-bold">{sug.item_id}</span>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          sug.type === 'missed_emergency'
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        }`}>
                          {sug.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-tamil text-slate-300 italic">"{sug.text}"</p>
                      <p className="text-slate-200 pt-1 leading-relaxed">{sug.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Rule adjustments are staged for review. No production changes apply until you approve.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !benchmarkResult && !errorMsg && (
        <div className="p-14 text-center rounded-2xl glass-panel border border-white/10 space-y-4">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">Click "Run Safety Test" to begin</p>
          <p className="text-slate-500 text-xs">The system will evaluate {180} benchmark sentences across all detection categories.</p>
        </div>
      )}
    </div>
  );
};
