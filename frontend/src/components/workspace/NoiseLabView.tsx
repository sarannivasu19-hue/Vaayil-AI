import React, { useState, useRef, useEffect } from 'react';
import type {
  SectorDetail,
  NoiseLabVariantResult,
  NoiseLabExperimentResponse,
  NoiseLabSavedRun,
} from '../../types';
import { api } from '../../services/api';
import {
  Volume2,
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  BookmarkPlus,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

interface NoiseLabViewProps {
  sectorDetail: SectorDetail;
}

const SAMPLE_SENTENCES = [
  {
    label: 'Tamil (Routine)',
    lang: 'tamil',
    text: 'வணக்கம் எனக்கு ஆரம்ப சுகாதார நிலையத்தில் குழந்தை தடுப்பூசி போட வேண்டும்.',
  },
  {
    label: 'Tamil (Emergency)',
    lang: 'tamil',
    text: 'ஐயா என் கணவருக்கு கடுமையான நெஞ்சு வலி உள்ளது உடனே உதவி வேண்டும்.',
  },
  {
    label: 'Tanglish (Booking)',
    lang: 'tanglish',
    text: 'Naalaikku doctor appointment kaalai 10 manikku confirm pannunga.',
  },
  {
    label: 'English (Inquiry)',
    lang: 'english',
    text: 'I would like to schedule a routine health checkup consultation for tomorrow.',
  },
];

export const NoiseLabView: React.FC<NoiseLabViewProps> = ({ sectorDetail }) => {
  const [referenceText, setReferenceText] = useState(SAMPLE_SENTENCES[0].text);
  const [languageMode, setLanguageMode] = useState<string>('tamil');
  const [noiseLevels, setNoiseLevels] = useState<Record<string, boolean>>({
    light: true,
    medium: true,
    heavy: true,
  });
  const [includePhoneSim, setIncludePhoneSim] = useState(true);

  // Audio Recording & Upload state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingSource, setIsPlayingSource] = useState(false);

  // Execution & Benchmark Results
  const [running, setRunning] = useState(false);
  const [experimentResult, setExperimentResult] = useState<NoiseLabExperimentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<NoiseLabSavedRun[]>([]);
  const [savingRun, setSavingRun] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Accordion state for DSP steps
  const [expandedDsp, setExpandedDsp] = useState<Record<string, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSavedRuns();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function loadSavedRuns() {
    try {
      const runs = await api.getNoiseLabRuns();
      setSavedRuns(runs);
    } catch (err) {
      console.warn('Could not load saved noise lab runs', err);
    }
  }

  // --- Audio Recording Handler ---
  async function startRecording() {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(`Microphone access denied or unsupported: ${err.message}`);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  }

  function togglePlaySource() {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingSource(false);
    }
    if (audioPlayerRef.current) {
      if (isPlayingSource) {
        audioPlayerRef.current.pause();
        setIsPlayingSource(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingSource(true);
      }
    }
  }

  // --- Run Experiment ---
  async function handleRunExperiment() {
    if (!audioBlob) {
      setErrorMsg('Please record or upload a clean reference audio sample first.');
      return;
    }
    if (!referenceText.trim()) {
      setErrorMsg('Please specify the reference sentence that was spoken in the audio.');
      return;
    }

    try {
      setRunning(true);
      setErrorMsg(null);
      setSaveSuccessMsg(null);

      const levels = Object.entries(noiseLevels)
        .filter(([_, active]) => active)
        .map(([lvl]) => lvl)
        .join(',');

      const resp = await api.runNoiseLab(
        audioBlob,
        referenceText.trim(),
        languageMode,
        levels || 'light,medium,heavy',
        includePhoneSim
      );

      setExperimentResult(resp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Noise Lab experiment run failed.');
    } finally {
      setRunning(false);
    }
  }

  // --- Save Run ---
  async function handleSaveRun() {
    if (!experimentResult) return;
    try {
      setSavingRun(true);
      const res = await api.saveNoiseLabRun({
        reference_text: experimentResult.reference_text,
        language_mode: experimentResult.language_mode,
        audio_filename: 'recorded_audio.wav',
        results: experimentResult.results,
        summary: experimentResult.summary,
      });
      setSaveSuccessMsg(`Benchmark saved successfully! (Run #${res.run_id})`);
      loadSavedRuns();
    } catch (err: any) {
      setErrorMsg(`Failed to save run: ${err.message}`);
    } finally {
      setSavingRun(false);
    }
  }

  function handleDownloadCsv(runId: number) {
    const url = `/api/noise-lab/runs/${runId}/export-csv`;
    window.open(url, '_blank');
  }

  const chartData = (experimentResult?.results || []).map((r) => ({
    name: r.label.replace(' (Clean Baseline)', '').replace(' Simulation', ''),
    Accuracy: r.word_accuracy_percent,
    WER: r.wer_percent,
    Latency: r.latency_ms,
  }));

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Volume2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-sora">
              Vaayil Noise Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controlled Synthetic Degradation & Genuine Gnani Prisma STT Robustness Benchmark
          </p>
        </div>

        {/* Notice Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Synthetic noise is a rough test, not a guarantee of real-world acoustic performance.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Control Panel: Audio Ingestion & Reference Sentence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Audio Source Card (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>1. Audio Source (Clean Baseline)</span>
          </h2>

          <div className="space-y-3">
            {/* Record Button */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={running}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg disabled:opacity-50 touch-target"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Clean Audio</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg animate-pulse touch-target"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              {/* Upload Input */}
              <label className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer touch-target">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Audio</span>
                <input
                  type="file"
                  accept="audio/*,.wav,.webm,.ogg,.mp3,.m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={running || isRecording}
                />
              </label>
            </div>

            {/* Audio Preview */}
            {audioBlob && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Audio loaded ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={togglePlaySource}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlayingSource ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingSource ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Conditions Controls */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Noise Levels to Synthesize:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', db: '20 dB' },
                { id: 'medium', label: 'Medium', db: '10 dB' },
                { id: 'heavy', label: 'Heavy', db: '3 dB' },
              ].map((lvl) => (
                <label
                  key={lvl.id}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    noiseLevels[lvl.id]
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!noiseLevels[lvl.id]}
                    onChange={(e) =>
                      setNoiseLevels((prev) => ({ ...prev, [lvl.id]: e.target.checked }))
                    }
                    className="hidden"
                  />
                  <span className="text-xs font-bold">{lvl.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{lvl.db} SNR</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhoneSim}
                onChange={(e) => setIncludePhoneSim(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
              />
              <div className="text-xs">
                <span className="text-white font-medium">PSTN Phone Simulation</span>
                <span className="text-[10px] text-slate-400 block">
                  ITU-T G.712 (300–3400 Hz), 8 kHz downsampling, non-linear saturation
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right: Reference Sentence & Presets (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>2. Reference Text (Ground Truth)</span>
              </h2>

              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-white/10 text-cyan-400 font-mono cursor-pointer"
              >
                <option value="tamil">Tamil (ta-IN)</option>
                <option value="tanglish">Tanglish (Code-mix)</option>
                <option value="english">English (en-IN)</option>
                <option value="auto">Auto Detect</option>
              </select>
            </div>

            <textarea
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Type exactly what is spoken in the audio recording..."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-white/10 text-slate-100 text-sm focus:border-cyan-400 focus:outline-none transition-colors resize-none font-tamil"
            />

            {/* Quick Fill Presets */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick-Fill Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SENTENCES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReferenceText(preset.text);
                      setLanguageMode(preset.lang);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-[11px] text-slate-300 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleRunExperiment}
            disabled={running || !audioBlob}
            className="w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-target text-slate-950 font-sora"
            style={{ backgroundColor: sectorDetail.accent_color }}
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing Degradations & Querying Prisma API...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Real Noise Benchmark on Prisma STT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {experimentResult && (
        <div className="space-y-6 pt-2">
          {/* Top Summary Banner */}
          <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Prisma Evaluation Complete
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({experimentResult.summary.successful_variants}/{experimentResult.summary.total_variants} succeeded)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Evaluated against formula:{' '}
                <code className="text-cyan-300 font-mono text-[11px]">
                  WER = (S + D + I) / N_ref; Accuracy = max(0, 1 - WER) * 100%
                </code>
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={handleSaveRun}
                disabled={savingRun}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer touch-target"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>{savingRun ? 'Saving...' : 'Save Run'}</span>
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Degradation Curve: Word Accuracy vs WER
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="Accuracy" fill="#06b6d4" name="Word Accuracy %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="WER" fill="#f43f5e" name="Word Error Rate (WER) %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side-by-Side Results Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Variant Transcripts & Alignment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experimentResult.results.map((res: NoiseLabVariantResult) => {
                const isExpanded = expandedDsp[res.variant_key] || false;
                const isSuccess = res.status === 'success';

                return (
                  <div
                    key={res.variant_key}
                    className={`p-4 rounded-2xl glass-panel border transition-all ${
                      res.variant_key === 'original'
                        ? 'border-cyan-500/40 bg-cyan-950/10'
                        : isSuccess
                        ? 'border-white/10'
                        : 'border-rose-500/40 bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                      <div>
                        <span className="text-xs font-bold text-white block">{res.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.snr_db !== null ? `Target SNR: ${res.snr_db} dB` : 'Clean Baseline'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {res.latency_ms} ms
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 my-3 text-center">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Accuracy</span>
                        <span className="text-sm font-extrabold text-cyan-400 font-mono">
                          {res.word_accuracy_percent}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">WER</span>
                        <span className="text-sm font-extrabold text-rose-400 font-mono">
                          {res.wer_percent}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Errors (S/D/I)</span>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {res.substitutions}/{res.deletions}/{res.insertions}
                        </span>
                      </div>
                    </div>

                    {/* Transcript Comparison */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                          Prisma Transcript:
                        </span>
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 font-tamil text-slate-200 min-h-[42px]">
                          {res.transcript || (
                            <span className="text-rose-400 italic">
                              {res.error_detail || 'No transcript returned'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Word Alignment Tags */}
                      {res.alignment && res.alignment.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 block mb-1">
                            Word-Level Alignment:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {res.alignment.map((tok, ti) => {
                              if (tok.type === 'match') {
                                return (
                                  <span
                                    key={ti}
                                    className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-tamil"
                                  >
                                    {tok.hyp}
                                  </span>
                                );
                              }
                              if (tok.type === 'sub') {
                                return (
                                  <span
                                    key={ti}
                                    title={`Expected: ${tok.ref}`}
                                    className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-[11px] text-amber-300 font-tamil"
                                  >
                                    {tok.hyp} <span className="text-[9px] line-through opacity-70">({tok.ref})</span>
                                  </span>
                                );
                              }
                              if (tok.type === 'del') {
                                return (
                                  <span
                                    key={ti}
                                    className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-300 line-through font-tamil"
                                  >
                                    {tok.ref}
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={ti}
                                  className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-300 font-tamil"
                                >
                                  +{tok.hyp}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DSP Explanation Accordion */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDsp((prev) => ({ ...prev, [res.variant_key]: !isExpanded }))
                        }
                        className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-400 font-mono cursor-pointer"
                      >
                        <span>DSP Processing Steps</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300 space-y-1">
                          <p className="text-slate-400 italic mb-1">{res.description}</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {res.dsp_steps.map((st, si) => (
                              <li key={si}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Limitations Section */}
          <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Scientific Limitations & Honest Caveats</span>
            </div>
            <ul className="list-disc pl-5 text-slate-300 space-y-1">
              {experimentResult.limitations.map((lim, li) => (
                <li key={li}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Saved Runs History */}
      {savedRuns.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Saved Noise Lab Benchmarks ({savedRuns.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-white/5">
            {savedRuns.slice(0, 5).map((run) => (
              <div
                key={run.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">Run #{run.id}</span>
                    <span className="text-slate-400 font-tamil truncate max-w-xs sm:max-w-md">
                      "{run.reference_text}"
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Mode: {run.language_mode} • Created: {new Date(run.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadCsv(run.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

