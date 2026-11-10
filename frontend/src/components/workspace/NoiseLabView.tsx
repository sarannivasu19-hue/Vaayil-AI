import React, { useState, useRef, useEffect } from 'react';
import type {
  SectorDetail,
  NoiseLabVariantResult,
  NoiseLabExperimentResponse,
  NoiseLabSavedRun,
} from '../../types';
import { api, API_BASE } from '../../services/api';
import {
  Volume2,
  Mic,
  Square,
  Upload,
  Play,
  Pause,
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
  HelpCircle,
  RotateCcw,
  Sliders,
  Check,
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
    label: 'Tamil (Healthcare / Routine)',
    lang: 'tamil',
    text: 'வணக்கம் எனக்கு ஆரம்ப சுகாதார நிலையத்தில் குழந்தை தடுப்பூசி போட வேண்டும்.',
    desc: 'Rural Health Desk vaccination booking',
  },
  {
    label: 'Tamil (Medical Emergency)',
    lang: 'tamil',
    text: 'ஐயா என் கணவருக்கு கடுமையான நெஞ்சு வலி உள்ளது உடனே உதவி வேண்டும்.',
    desc: 'Critical 108 emergency triage',
  },
  {
    label: 'Tanglish (Clinic Appointment)',
    lang: 'tanglish',
    text: 'Naalaikku doctor appointment kaalai 10 manikku confirm pannunga.',
    desc: 'Private clinic schedule confirmation',
  },
  {
    label: 'English (Inquiry)',
    lang: 'english',
    text: 'I would like to schedule a routine health checkup consultation for tomorrow.',
    desc: 'General outpatient inquiry',
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
  const [audioFileName, setAudioFileName] = useState<string>('sample.wav');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingSource, setIsPlayingSource] = useState(false);

  // Live Canvas Waveform & Audio Meter
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Execution & Benchmark Results
  const [running, setRunning] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [experimentResult, setExperimentResult] = useState<NoiseLabExperimentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<NoiseLabSavedRun[]>([]);
  const [savingRun, setSavingRun] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // UI view toggles
  const [activeTab, setActiveTab] = useState<'comparison' | 'cards' | 'charts' | 'guide'>('comparison');
  const [expandedDsp, setExpandedDsp] = useState<Record<string, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSavedRuns();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
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

  // --- Real-time Visualizer ---
  function startVisualizer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const cCtx = canvas.getContext('2d');
        if (!cCtx) return;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        cCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          cCtx.fillStyle = '#22d3ee';
          cCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      }
      draw();
    } catch (e) {
      console.warn('Audio visualizer unsupported or failed:', e);
    }
  }

  function stopVisualizer() {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (canvasRef.current) {
      const cCtx = canvasRef.current.getContext('2d');
      if (cCtx) cCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

      startVisualizer(stream);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioFileName('microphone_recording.webm');
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        stopVisualizer();
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
    setAudioFileName(file.name);
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
      setErrorMsg('Please record audio with your microphone or upload an audio file first.');
      return;
    }
    if (!referenceText.trim()) {
      setErrorMsg('Please enter the reference sentence that was spoken in the audio.');
      return;
    }

    try {
      setRunning(true);
      setErrorMsg(null);
      setSaveSuccessMsg(null);
      setLoadingStep('Synthesizing acoustic noise & phone simulations...');

      const levels = Object.entries(noiseLevels)
        .filter(([_, active]) => active)
        .map(([lvl]) => lvl)
        .join(',');

      setTimeout(() => {
        setLoadingStep('Querying genuine Gnani Prisma STT v3.0 API...');
      }, 900);

      const resp = await api.runNoiseLab(
        audioBlob,
        referenceText.trim(),
        languageMode,
        levels || 'light,medium,heavy',
        includePhoneSim
      );

      setExperimentResult(resp);
      setActiveTab('comparison');
    } catch (err: any) {
      setErrorMsg(err.message || 'Noise Lab benchmark failed. Please check audio format and connectivity.');
    } finally {
      setRunning(false);
      setLoadingStep('');
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
        audio_filename: audioFileName,
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

  async function handleDownloadCsv(runId: number) {
    try {
      const token = localStorage.getItem('vaayil_token');
      const resp = await fetch(`${API_BASE}/noise-lab/runs/${runId}/export-csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`Export failed: ${resp.statusText}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noise_lab_run_${runId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(`CSV export failed: ${err.message}`);
    }
  }

  const chartData = (experimentResult?.results || []).map((r) => ({
    name: r.label.replace(' (Clean Baseline)', '').replace(' Simulation', ''),
    Accuracy: r.word_accuracy_percent,
    WER: r.wer_percent,
    Latency: r.latency_ms,
  }));

  const accent = sectorDetail.accent_color;

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: `${accent}20`,
                borderColor: `${accent}40`,
                color: accent,
              }}
            >
              <Volume2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-heading">
              Vaayil Noise Lab
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
              STT Robustness Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical stress-testing of genuine <strong>Gnani Prisma STT v3.0</strong> under controlled synthetic noise & telephony filtering.
          </p>
        </div>

        {/* Core Principles Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Lower WER is better:</strong> 0% WER = 100% perfect transcription.
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ── Section 1 & 2: Test Setup & Audio Ingestion ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Step 1: Audio Input Card (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Step 1: Clean Reference Audio</span>
              </h2>
              {audioBlob && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Record a clear sentence using your microphone, or upload a pre-recorded audio file.
            </p>

            {/* Record / Upload Controls */}
            <div className="flex items-center gap-2.5">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={running}
                  className="flex-1 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Microphone</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop ({recordingSeconds}s)</span>
                </button>
              )}

              <label className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer">
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

            {/* Live Audio Waveform Canvas */}
            <div className="h-16 w-full rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-center overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={64}
                className="w-full h-full"
              />
              {!isRecording && !audioBlob && (
                <span className="text-[11px] text-slate-500 font-mono absolute">
                  Waveform appears when speaking or playing
                </span>
              )}
            </div>

            {/* Audio Loaded Preview & Playback */}
            {audioBlob && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300 truncate max-w-[200px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="truncate font-mono text-[11px]">{audioFileName}</span>
                  <span className="text-slate-500 text-[10px]">({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={togglePlaySource}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isPlayingSource ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingSource ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Conditions Checklist */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Noise Degradations to Apply:
              </span>
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', db: '20 dB SNR', desc: 'Fan / AC hum' },
                { id: 'medium', label: 'Medium', db: '10 dB SNR', desc: 'Tea stall chatter' },
                { id: 'heavy', label: 'Heavy', db: '3 dB SNR', desc: 'Bus stand traffic' },
              ].map((lvl) => (
                <label
                  key={lvl.id}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    noiseLevels[lvl.id]
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950/60 border-white/5 text-slate-500'
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
                  <span className="text-[10px] font-mono opacity-80">{lvl.db}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhoneSim}
                onChange={(e) => setIncludePhoneSim(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
              />
              <div className="text-xs">
                <span className="text-slate-200 font-medium">PSTN Phone-Call Simulation</span>
                <span className="text-[10px] text-slate-400 block">
                  ITU-T G.712 (300–3400 Hz), 8 kHz sampling & non-linear mic saturation
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Reference Sentence (Ground Truth) (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Step 2: Reference Sentence (Spoken Words)</span>
              </h2>

              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-white/10 text-cyan-400 font-mono cursor-pointer"
              >
                <option value="tamil">Tamil (ta-IN)</option>
                <option value="tanglish">Tanglish (Code-mix)</option>
                <option value="english">English (en-IN)</option>
                <option value="auto">Auto Detect</option>
              </select>
            </div>

            <p className="text-xs text-slate-400">
              Type exactly what was spoken in the audio recording. The Word Error Rate (WER) is computed against this reference text.
            </p>

            <textarea
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Type exact spoken sentence..."
              rows={3}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-white/10 text-slate-100 text-sm focus:border-cyan-400 focus:outline-none transition-colors resize-none font-tamil leading-relaxed"
            />

            {/* Quick-Fill Presets */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick-Fill Tamil & Tanglish Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_SENTENCES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReferenceText(preset.text);
                      setLanguageMode(preset.lang);
                    }}
                    className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 text-left text-xs transition-colors cursor-pointer group"
                  >
                    <span className="font-semibold text-cyan-400 font-mono text-[10px] block group-hover:text-cyan-300">
                      {preset.label}
                    </span>
                    <span className="text-slate-300 font-tamil line-clamp-1 text-[11px]">
                      {preset.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Benchmark Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRunExperiment}
              disabled={running || !audioBlob}
              className="w-full py-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-target text-slate-950 font-heading"
              style={{ backgroundColor: accent }}
            >
              {running ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{loadingStep || 'Synthesizing Audio & Benchmarking Prisma...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Real Noise Benchmark on Gnani Prisma STT</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Benchmark Results Dashboard ── */}
      {experimentResult ? (
        <div className="space-y-6 pt-2">
          
          {/* Executive Results Banner */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Gnani Prisma Benchmark Completed
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({experimentResult.summary.successful_variants}/{experimentResult.summary.total_variants} conditions evaluated)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Reference Ground Truth:{' '}
                <strong className="text-white font-tamil font-semibold">"{experimentResult.reference_text}"</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Formula: WER = (Substitutions + Deletions + Insertions) / Total Words · Lower WER is better.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                type="button"
                onClick={handleSaveRun}
                disabled={savingRun}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>{savingRun ? 'Saving...' : 'Save Benchmark'}</span>
              </button>

              <button
                type="button"
                onClick={() => setExperimentResult(null)}
                className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1"
                title="Reset Benchmark"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            {[
              { id: 'comparison', label: '1. Comparison Table' },
              { id: 'charts', label: '2. Accuracy vs WER Chart' },
              { id: 'cards', label: '3. Condition Cards & Waveforms' },
              { id: 'guide', label: '4. Business Owner Guide' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Comparison Table */}
          {activeTab === 'comparison' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Noise Condition Side-by-Side Comparison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing speech recognition fidelity from clean studio recording to heavy traffic & phone line.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Prisma Model: prisma-v3.0
                </span>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Noise / Bandwidth</th>
                    <th className="py-2.5 px-3">Gnani Prisma Transcript</th>
                    <th className="py-2.5 px-3 text-center">Word Accuracy</th>
                    <th className="py-2.5 px-3 text-center">WER (Lower = Better)</th>
                    <th className="py-2.5 px-3 text-center">Errors (S/D/I)</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {experimentResult.results.map((r) => {
                    const isClean = r.variant_key === 'original';
                    const werColor =
                      r.wer_percent <= 15
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                        : r.wer_percent <= 40
                        ? 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                        : 'text-rose-400 bg-rose-950/60 border-rose-500/30';

                    return (
                      <tr key={r.variant_key} className={isClean ? 'bg-cyan-950/20' : ''}>
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            {isClean && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                            <span>{r.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {r.snr_db !== null ? `${r.snr_db} dB SNR` : 'Clean Baseline (16 kHz)'}
                        </td>
                        <td className="py-3 px-3 font-tamil text-slate-200 max-w-xs">
                          {r.transcript ? (
                            <span>{r.transcript}</span>
                          ) : (
                            <span className="text-rose-400 italic">{r.error_detail || 'No transcript'}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-cyan-300">
                          {r.word_accuracy_percent}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-mono font-bold border text-[11px] ${werColor}`}>
                            {r.wer_percent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {r.substitutions} sub / {r.deletions} del / {r.insertions} ins
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {r.latency_ms} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Accuracy vs WER Chart */}
          {activeTab === 'charts' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Degradation Curve: Accuracy vs WER (Error Rate)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Observe how acoustic noise decreases accuracy and increases error rate.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-3 h-3 rounded bg-[#06b6d4]" /> Accuracy (Higher = Better)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 ml-2">
                    <span className="w-3 h-3 rounded bg-[#f43f5e]" /> WER (Lower = Better)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
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
                    <Bar dataKey="WER" fill="#f43f5e" name="WER (Error Rate %) ↓ Lower is better" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: Condition Cards & Waveforms */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experimentResult.results.map((res: NoiseLabVariantResult) => {
                const isExpanded = expandedDsp[res.variant_key] || false;
                const isSuccess = res.status === 'success';

                return (
                  <div
                    key={res.variant_key}
                    className={`p-5 rounded-2xl bg-slate-900/80 border transition-all ${
                      res.variant_key === 'original'
                        ? 'border-cyan-500/40 bg-cyan-950/15'
                        : isSuccess
                        ? 'border-white/10'
                        : 'border-rose-500/40 bg-rose-950/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-sm font-bold text-white block font-heading">{res.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.snr_db !== null ? `Signal-to-Noise Ratio: ${res.snr_db} dB` : 'Clean Baseline (16 kHz WAV)'}
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

                    {/* Metric Cards Row */}
                    <div className="grid grid-cols-3 gap-2 my-3 text-center">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Word Accuracy</span>
                        <span className="text-base font-extrabold text-cyan-400 font-mono">
                          {res.word_accuracy_percent}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                        <span className="text-[10px] text-rose-400 font-mono uppercase block">WER (Error Rate)</span>
                        <span className="text-base font-extrabold text-rose-400 font-mono">
                          {res.wer_percent}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">S / D / I</span>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {res.substitutions}/{res.deletions}/{res.insertions}
                        </span>
                      </div>
                    </div>

                    {/* Reference vs Transcript */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                          Prisma STT Transcript:
                        </span>
                        <div className="p-3 rounded-xl bg-slate-950 border border-white/5 font-tamil text-slate-100 min-h-[44px]">
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
                            Word Token Alignment:
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

                    {/* Expandable DSP Steps */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDsp((prev) => ({ ...prev, [res.variant_key]: !isExpanded }))
                        }
                        className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-400 font-mono cursor-pointer"
                      >
                        <span>DSP Audio Alteration Steps</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-300 space-y-1">
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
          )}

          {/* TAB 4: Business Owner Guide */}
          {activeTab === 'guide' && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-heading text-sm">
                <HelpCircle className="w-5 h-5" />
                <span>Business Owner's Guide: Understanding Audio Noise & Speech Accuracy</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white">What is Word Error Rate (WER)?</h4>
                  <p className="text-slate-300 leading-relaxed">
                    WER measures how many words the AI got wrong (Substitutions, Deletions, or Insertions) divided by the total words spoken.
                    <strong> Lower WER is always better.</strong> A WER below 15% is excellent for natural business conversation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white">How does Noise affect Tamil Nadu Callers?</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Callers from rural tea stalls, buses, or street markets produce background chatter. Gnani Prisma STT filters out moderate noise well, but heavy noise (3 dB) may cause missed slot details, triggering confirmation requests.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white">PSTN Phone Simulation</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Phone calls over 2G/4G networks compress sound between 300 Hz and 3400 Hz. Our simulation validates that the voice agent can understand callers even on standard cellular network audio quality.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white">Safe Confirmation Protocol</h4>
                  <p className="text-slate-300 leading-relaxed">
                    When high noise causes low STT confidence, Vaayil AI’s state machine gracefully repeats the question or asks the caller to confirm critical appointment dates and phone numbers before saving.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400 mx-auto">
            <Volume2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-heading">
            No Noise Benchmark Run Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Record clean speech or upload an audio file above, ensure the reference sentence matches what was spoken, and click <strong>"Execute Real Noise Benchmark"</strong> to evaluate Gnani Prisma STT across 5 noise conditions.
          </p>
        </div>
      )}

      {/* ── Saved Runs History ── */}
      {savedRuns.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
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
                    <span className="text-slate-300 font-tamil truncate max-w-xs sm:max-w-md">
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
                    <span>Download CSV</span>
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
