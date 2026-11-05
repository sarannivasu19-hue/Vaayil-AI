/**
 * LiveCallPage.tsx — Vaayil AI Phase 3, 4 & 5
 *
 * Full Voice Loop Experience:
 *   1. Record User Voice (MediaRecorder)
 *   2. Prisma STT (Speech-to-Text) -> Transcript
 *   3. /api/agent/turn (Deterministic Slot Engine) -> Agent Response
 *   4. Timbre TTS (Text-to-Speech) -> Plays Agent Audio
 *   5. Auto-listen toggle (default OFF) or manual mic tap to continue loop
 *   6. 5-State Voice Orb: idle, listening (with mic volume), processing, speaking, error
 *   7. Replay button, Stop button, Mute toggle, Autoplay blocked "Tap to play" fallback
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SectorDetail, TranscribeResponse, LanguageMode, ConversationTurn } from '../../types';
import { api, ApiError } from '../../services/api';
import { VoiceOrb, type OrbState } from './VoiceOrb';
import {
  Mic,
  MicOff,
  Square,
  Upload,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Play,
  Volume2,
  VolumeX,
  ChevronDown,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LanguageOption {
  value: LanguageMode;
  label: string;
  sublabel: string;
  code: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'tamil',    label: 'தமிழ்',    sublabel: 'Tamil',         code: 'ta-IN' },
  { value: 'tanglish', label: 'Tanglish', sublabel: 'Tamil + English', code: 'ta-IN' },
  { value: 'english',  label: 'English',  sublabel: 'Indian English', code: 'en-IN' },
  { value: 'auto',     label: 'Auto',     sublabel: 'Auto-detect',   code: 'ta-IN' },
];

const MAX_RECORDING_SECONDS = 30;

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LiveCallPage: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail }) => {
  // --- Voice / Loop States ---
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [language, setLanguage] = useState<LanguageMode>('tanglish');
  const [autoListen, setAutoListen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [micVolume, setMicVolume] = useState(0.1);
  const [timerSecs, setTimerSecs] = useState(0);

  // --- Feedback & Metadata ---
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [prismaMeta, setPrismaMeta] = useState<TranscribeResponse | null>(null);
  const [lastAgentAudioUrl, setLastAgentAudioUrl] = useState<string | null>(null);

  // --- Conversation Engine States ---
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ConversationTurn[]>([]);
  const [extractedSlots, setExtractedSlots] = useState<Record<string, any>>({});
  const [engineState, setEngineState] = useState<'collecting' | 'confirming' | 'completed'>('collecting');
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [submittingTurn, setSubmittingTurn] = useState(false);

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const accent = sectorDetail.accent_color;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (lastAgentAudioUrl) URL.revokeObjectURL(lastAgentAudioUrl);
    };
  }, [lastAgentAudioUrl]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, submittingTurn]);

  // Initial welcome message from sector package
  useEffect(() => {
    if (chatHistory.length === 0) {
      const firstSlot = sectorDetail.slots[0];
      const initialGreeting = language === 'tamil'
        ? firstSlot.prompts.ta
        : language === 'english'
          ? firstSlot.prompts.en
          : firstSlot.prompts.tanglish;

      setChatHistory([
        {
          speaker: 'agent',
          text: initialGreeting,
        },
      ]);
      setNextSlot(firstSlot.name);
    }
  }, [sectorDetail, language, chatHistory.length]);

  // Plays TTS audio with autoplay fallback handling
  const playAgentAudio = useCallback(async (audioUrl: string) => {
    if (isMuted) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      setOrbState('speaking');
      try {
        await audioPlayerRef.current.play();
        setAutoplayBlocked(false);
      } catch (err) {
        console.warn('Autoplay blocked by browser:', err);
        setAutoplayBlocked(true);
        setOrbState('idle');
      }
    }
  }, [isMuted]);

  const handleAudioEnded = useCallback(() => {
    setOrbState('idle');
    // If auto-listen is active and call not completed, start recording next turn
    if (autoListen && engineState !== 'completed') {
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, [autoListen, engineState]);

  // Dispatches text into engine turn + executes Timbre TTS
  const dispatchTurn = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSubmittingTurn(true);
    setOrbState('processing');
    setErrorMessage(null);

    try {
      const turnResponse = await api.executeAgentTurn({
        session_id: sessionId || undefined,
        sector_id: sectorDetail.id,
        transcript_text: text,
        language_mode: language,
      });

      setSessionId(turnResponse.session_id);
      setEngineState(turnResponse.state);
      setExtractedSlots(turnResponse.slots);
      setNextSlot(turnResponse.next_slot);
      setChatHistory(turnResponse.conversation_history);

      // Now call genuine Gnani Timbre TTS to synthesize the agent's response
      const agentMsg = turnResponse.agent_message;
      const langCode = language === 'english' ? 'en-IN' : 'ta-IN';

      try {
        const audioBlob = await api.speakText(agentMsg, langCode, 'Shivani');
        const url = URL.createObjectURL(audioBlob);
        setLastAgentAudioUrl(url);
        playAgentAudio(url);
      } catch (ttsErr) {
        console.error('Timbre TTS error:', ttsErr);
        setOrbState('idle');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Turn execution failed.';
      setErrorMessage(msg);
      setOrbState('error');
    } finally {
      setSubmittingTurn(false);
    }
  }, [sessionId, sectorDetail.id, language, playAgentAudio]);

  // Sends recorded voice to Prisma STT -> Pipes into conversation loop
  const sendToPrismaAndEngine = useCallback(async (blob: Blob, fileName: string) => {
    setOrbState('processing');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('audio', blob, fileName);
    formData.append('language', language);

    try {
      const result = await api.transcribe(formData);
      setPrismaMeta(result);

      if (result.transcript && result.transcript.trim()) {
        await dispatchTurn(result.transcript);
      } else {
        setErrorMessage('Prisma returned empty transcript. Please speak louder or closer to mic.');
        setOrbState('error');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Transcription failed.';
      setErrorMessage(msg);
      setOrbState('error');
    }
  }, [language, dispatchTurn]);

  // Start Mic recording with live audio level visualization
  const startRecording = useCallback(async () => {
    setMicError(null);
    setErrorMessage(null);
    setOrbState('listening');
    chunksRef.current = [];

    // Stop any existing playing agent audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const e = err as DOMException;
      setMicError(e.name === 'NotAllowedError' ? 'Microphone permission denied.' : `Mic error: ${e.message}`);
      setOrbState('error');
      return;
    }

    streamRef.current = stream;

    // Web Audio API volume analyser for reactive Voice Orb
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        setMicVolume(Math.min(1.0, avg * 2.5));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Web Audio Analyser not supported:', e);
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      await sendToPrismaAndEngine(blob, 'voice.webm');
    };

    recorder.start(250);
    setTimerSecs(0);

    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        if (prev + 1 >= MAX_RECORDING_SECONDS) {
          recorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return prev + 1;
      });
    }, 1000);
  }, [sendToPrismaAndEngine]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendToPrismaAndEngine(file, file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [sendToPrismaAndEngine]);

  const resetCall = () => {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setOrbState('idle');
    setTimerSecs(0);
    setErrorMessage(null);
    setMicError(null);
    setPrismaMeta(null);
    setSessionId(null);
    setExtractedSlots({});
    setEngineState('collecting');
    setTypedInput('');

    const firstSlot = sectorDetail.slots[0];
    const initialGreeting = language === 'tamil'
      ? firstSlot.prompts.ta
      : language === 'english'
        ? firstSlot.prompts.en
        : firstSlot.prompts.tanglish;

    setChatHistory([{ speaker: 'agent', text: initialGreeting }]);
    setNextSlot(firstSlot.name);
  };

  const selectedLang = LANGUAGE_OPTIONS.find(o => o.value === language) ?? LANGUAGE_OPTIONS[1];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2 text-left">
      <audio ref={audioPlayerRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white font-tamil tracking-tight">
              நேரடி அழைப்பு — Voice Loop & Orb
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300">
              Phase 5 Timbre TTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {sectorDetail.name} · Full Voice Loop (Prisma STT ➔ Engine ➔ Timbre TTS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-listen toggle */}
          <button
            onClick={() => setAutoListen(v => !v)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoListen
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${autoListen ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Auto-Listen: {autoListen ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(v => !v)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Agent' : 'Mute Agent'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Language menu */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel border border-white/10 text-xs text-white font-medium hover:border-white/20 transition-colors cursor-pointer"
            >
              <span className="font-tamil">{selectedLang.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl glass-panel border border-white/15 shadow-xl z-30 overflow-hidden">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setLanguage(opt.value); setShowLangMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors cursor-pointer text-left text-slate-300 hover:text-white"
                  >
                    <span className="font-tamil">{opt.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={resetCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Autoplay blocked banner */}
      {autoplayBlocked && (
        <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-between gap-4">
          <div className="text-xs text-amber-200">
            Browser paused audio output. Tap to listen to the agent's spoken reply.
          </div>
          <button
            onClick={() => {
              if (audioPlayerRef.current) audioPlayerRef.current.play();
              setAutoplayBlocked(false);
            }}
            className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Tap to Play 🔊
          </button>
        </div>
      )}

      {/* Center 5-State Voice Orb Showcase */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
        <VoiceOrb
          state={orbState}
          accentColor={accent}
          micVolume={micVolume}
          onClick={() => {
            if (orbState === 'listening') stopRecording();
            else if (orbState === 'idle') startRecording();
          }}
        />

        {/* Dynamic Orb Status Label */}
        <div className="text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            {orbState === 'idle' && 'Tap orb or mic to speak'}
            {orbState === 'listening' && `Listening... (${formatTimer(timerSecs)} / 0:30)`}
            {orbState === 'processing' && 'Transcribing with Prisma STT & Engine...'}
            {orbState === 'speaking' && 'Speaking via Gnani Timbre (Shivani)...'}
            {orbState === 'error' && 'Encountered error — retry below'}
          </span>
        </div>

        {/* Controls beneath the orb */}
        <div className="flex items-center gap-3 mt-1">
          {orbState !== 'listening' ? (
            <button
              onClick={startRecording}
              disabled={submittingTurn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              <Mic className="w-4 h-4" />
              <span>Record Answer</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Done Speaking</span>
            </button>
          )}

          {lastAgentAudioUrl && (
            <button
              onClick={() => playAgentAudio(lastAgentAudioUrl)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Replay Reply</span>
            </button>
          )}

          {orbState === 'speaking' && (
            <button
              onClick={() => {
                if (audioPlayerRef.current) audioPlayerRef.current.pause();
                setOrbState('idle');
              }}
              className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Stop Audio
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/10 transition-colors cursor-pointer"
            title="Upload audio clip"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.ogg,.flac,.aac,.m4a,.webm"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Errors */}
        {micError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 mt-2">
            <MicOff className="w-4 h-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column: Left Chat View, Right Extracted Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chat history & Typing Input */}
        <div className="lg:col-span-7 space-y-4">
          <div
            ref={chatScrollRef}
            className="h-[320px] overflow-y-auto p-4 rounded-3xl glass-panel border border-white/10 space-y-3 flex flex-col"
          >
            {chatHistory.map((turn, idx) => {
              const isCaller = turn.speaker === 'caller';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isCaller ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCaller && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                      style={{
                        backgroundColor: `${accent}25`,
                        borderColor: `${accent}40`,
                        color: accent,
                      }}
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-tamil shadow-sm ${
                      isCaller
                        ? 'bg-slate-800 text-white border border-white/10 rounded-tr-xs'
                        : 'bg-slate-950/80 text-slate-200 border border-white/10 rounded-tl-xs'
                    }`}
                    style={!isCaller ? { borderLeft: `3px solid ${accent}` } : {}}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                      {isCaller ? 'Caller' : 'Vaayil Agent (Shivani)'}
                    </span>
                    {turn.text}
                  </div>

                  {isCaller && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {submittingTurn && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Processing turn...</span>
              </div>
            )}
          </div>

          {/* Typing test fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!typedInput.trim() || submittingTurn) return;
              const txt = typedInput;
              setTypedInput('');
              dispatchTurn(txt);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Or type reply to test (e.g. 'En peyar Saravanan, phone 9840123456')..."
              disabled={submittingTurn}
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-xs font-tamil placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || submittingTurn}
              className="absolute right-2 p-2 rounded-xl text-slate-950 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: accent }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Prisma STT debug tag */}
          {prismaMeta && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate mr-2">Prisma STT: "{prismaMeta.transcript}"</span>
              <span className="shrink-0">{prismaMeta.language_code}</span>
            </div>
          )}
        </div>

        {/* Right: Extracted Details Live Slot Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  State Machine
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-tamil">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                  நேரலை விவரங்கள் (Live Slots)
                </h3>
              </div>

              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold border ${
                  engineState === 'completed'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : engineState === 'confirming'
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                }`}
              >
                {engineState}
              </span>
            </div>

            {/* List of slots */}
            <div className="space-y-2.5">
              {sectorDetail.slots.map((slot) => {
                const isFilled = extractedSlots[slot.name] !== undefined && extractedSlots[slot.name] !== null;
                const isTarget = nextSlot === slot.name && !isFilled;
                const val = extractedSlots[slot.name];

                return (
                  <div
                    key={slot.name}
                    className={`p-3 rounded-2xl border transition-all text-left ${
                      isFilled
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : isTarget
                          ? 'bg-cyan-950/20 border-cyan-500/40 animate-pulse'
                          : 'bg-slate-900/50 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300 font-tamil">
                        {slot.label_ta} ({slot.label_en})
                      </span>
                      {isFilled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {isTarget && (
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                          Next Required
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs font-semibold">
                      {isFilled ? (
                        <span className="text-white font-mono">{String(val)}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic font-mono">
                          {slot.required ? 'Waiting for input...' : 'Optional'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Confirmation Banner */}
            {engineState === 'confirming' && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 text-left">
                <p className="text-xs font-bold text-amber-300 font-tamil">
                  அனைத்து விவரங்களும் பெறப்பட்டன!
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Summary presented. Click Confirm to save into database, or Edit to update slots.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      try {
                        setSubmittingTurn(true);
                        const b = await api.confirmBookingFromCall({
                          session_id: sessionId || 'sess-manual',
                          sector_id: sectorDetail.id,
                          slots: extractedSlots,
                        });
                        setEngineState('completed');
                        // Vocalize confirmation with Timbre
                        const confirmMsg = `மிக்க நன்றி! உங்கள் முன்பதிவு எண் ${b.reference_number}.`;
                        api.speakText(confirmMsg, 'ta-IN', 'Shivani').then((blob) => {
                          const url = URL.createObjectURL(blob);
                          setLastAgentAudioUrl(url);
                          playAgentAudio(url);
                        }).catch(() => {});
                      } catch (err: any) {
                        setErrorMessage(err.message || 'Confirmation failed');
                      } finally {
                        setSubmittingTurn(false);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Confirm & Save (உறுதி செய்)
                  </button>

                  <button
                    onClick={() => {
                      setEngineState('collecting');
                      dispatchTurn('illa, details mathanum');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    Edit (மாற்று)
                  </button>

                  <button
                    onClick={resetCall}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {engineState === 'completed' && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-left">
                <p className="text-xs font-bold text-emerald-300 font-tamil">
                  முன்பதிவு தயார் (Call Completed)
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The full voice loop has successfully concluded with Timbre voice playback!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
