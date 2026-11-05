/**
 * LiveCallPage.tsx — Vaayil AI Phase D Premium UI
 * 3-column desktop layout: Call Info | Orb+Transcript | Details
 * All logic identical to original — only JSX/styling changed.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SectorDetail, TranscribeResponse, LanguageMode, ConversationTurn } from '../../types';
import { api, ApiError } from '../../services/api';
import { VoiceOrb, type OrbState } from './VoiceOrb';
import {
  Mic, MicOff, Square, Upload, Loader2, AlertTriangle,
  RefreshCw, Play, Volume2, VolumeX, ChevronDown, Send,
  Bot, User as UserIcon, CheckCircle2, Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { SectorWorld2D } from '../world/SectorWorld2D';

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
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [language, setLanguage] = useState<LanguageMode>('tanglish');
  const [autoListen, setAutoListen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [micVolume, setMicVolume] = useState(0.1);
  const [timerSecs, setTimerSecs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [prismaMeta, setPrismaMeta] = useState<TranscribeResponse | null>(null);
  const [lastAgentAudioUrl, setLastAgentAudioUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ConversationTurn[]>([]);
  const [extractedSlots, setExtractedSlots] = useState<Record<string, any>>({});
  const [engineState, setEngineState] = useState<'collecting' | 'confirming' | 'completed'>('collecting');
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [submittingTurn, setSubmittingTurn] = useState(false);

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

  useEffect(() => {
    if (chatHistory.length === 0) {
      const firstSlot = sectorDetail.slots[0];
      const initialGreeting = language === 'tamil' ? firstSlot.prompts.ta
        : language === 'english' ? firstSlot.prompts.en : firstSlot.prompts.tanglish;
      setChatHistory([{ speaker: 'agent', text: initialGreeting }]);
      setNextSlot(firstSlot.name);
    }
  }, [sectorDetail, language, chatHistory.length]);

  const playAgentAudio = useCallback(async (audioUrl: string) => {
    if (isMuted) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      setOrbState('speaking');
      try {
        await audioPlayerRef.current.play();
        setAutoplayBlocked(false);
      } catch {
        setAutoplayBlocked(true);
        setOrbState('idle');
      }
    }
  }, [isMuted]);

  const handleAudioEnded = useCallback(() => {
    setOrbState('idle');
    if (autoListen && engineState !== 'completed') {
      setTimeout(() => startRecording(), 500);
    }
  }, [autoListen, engineState]);

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
      const agentMsg = turnResponse.agent_message;
      const langCode = language === 'english' ? 'en-IN' : 'ta-IN';
      try {
        const audioBlob = await api.speakText(agentMsg, langCode, 'Shivani');
        const url = URL.createObjectURL(audioBlob);
        setLastAgentAudioUrl(url);
        playAgentAudio(url);
      } catch { setOrbState('idle'); }
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Turn execution failed.');
      setOrbState('error');
    } finally {
      setSubmittingTurn(false);
    }
  }, [sessionId, sectorDetail.id, language, playAgentAudio]);

  const sendToPrismaAndEngine = useCallback(async (blob: Blob, fileName: string) => {
    setOrbState('processing');
    setErrorMessage(null);
    const formData = new FormData();
    formData.append('audio', blob, fileName);
    formData.append('language', language);
    try {
      const result = await api.transcribe(formData);
      setPrismaMeta(result);
      if (result.transcript?.trim()) {
        await dispatchTurn(result.transcript);
      } else {
        setErrorMessage('Prisma returned empty transcript. Please speak louder or closer.');
        setOrbState('error');
      }
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Transcription failed.');
      setOrbState('error');
    }
  }, [language, dispatchTurn]);

  const startRecording = useCallback(async () => {
    setMicError(null); setErrorMessage(null); setOrbState('listening'); chunksRef.current = [];
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (err) {
      const e = err as DOMException;
      setMicError(e.name === 'NotAllowedError' ? 'Microphone permission denied.' : `Mic error: ${e.message}`);
      setOrbState('error'); return;
    }
    streamRef.current = stream;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser(); analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser); audioContextRef.current = audioCtx; analyserRef.current = analyser;
      const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0; for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        setMicVolume(Math.min(1.0, (sum / bufferLength / 255) * 2.5));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch { /* Web Audio not supported */ }
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      await sendToPrismaAndEngine(blob, 'voice.webm');
    };
    recorder.start(250); setTimerSecs(0);
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        if (prev + 1 >= MAX_RECORDING_SECONDS) { recorder.stop(); if (timerRef.current) clearInterval(timerRef.current); }
        return prev + 1;
      });
    }, 1000);
  }, [sendToPrismaAndEngine]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    await sendToPrismaAndEngine(file, file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [sendToPrismaAndEngine]);

  const resetCall = () => {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setOrbState('idle'); setTimerSecs(0); setErrorMessage(null); setMicError(null);
    setPrismaMeta(null); setSessionId(null); setExtractedSlots({}); setEngineState('collecting'); setTypedInput('');
    const firstSlot = sectorDetail.slots[0];
    const initialGreeting = language === 'tamil' ? firstSlot.prompts.ta
      : language === 'english' ? firstSlot.prompts.en : firstSlot.prompts.tanglish;
    setChatHistory([{ speaker: 'agent', text: initialGreeting }]);
    setNextSlot(firstSlot.name);
  };

  const selectedLang = LANGUAGE_OPTIONS.find(o => o.value === language) ?? LANGUAGE_OPTIONS[1];
  const filledCount = Object.values(extractedSlots).filter(v => v !== undefined && v !== null).length;
  const totalSlots = sectorDetail.slots.length;

  return (
    <div className="h-full flex flex-col" style={{ background: '#080B18' }}>
      <audio ref={audioPlayerRef} onEnded={handleAudioEnded} className="hidden" />
      <input ref={fileInputRef} type="file" accept="audio/*,.wav,.mp3,.ogg,.flac,.aac,.m4a,.webm" onChange={handleFileUpload} className="hidden" />

      {/* ── Top Controls Bar ── */}
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#E8EDF9] font-tamil">{sectorDetail.display_name_ta}</span>
          <span
            className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', {
              'text-[#42D6A4] border-[#42D6A4]/30': engineState === 'completed',
              'text-[#FFBF69] border-[#FFBF69]/30': engineState === 'confirming',
              'text-[#32D8E8] border-[#32D8E8]/30': engineState === 'collecting',
            })}
            style={{ background: 'rgba(8,11,24,0.6)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {engineState}
          </span>
          {sessionId && (
            <span className="text-[10px] text-[#4A5568] hidden sm:block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              #{sessionId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-listen */}
          <button
            onClick={() => setAutoListen(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors',
              autoListen
                ? 'border-[#32D8E8]/40 text-[#32D8E8]'
                : 'border-white/08 text-[#9AA7BE] hover:text-[#E8EDF9]'
            )}
            style={{ background: autoListen ? 'rgba(50,216,232,0.08)' : 'rgba(23,31,51,0.7)' }}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${autoListen ? 'bg-[#32D8E8] animate-pulse' : 'bg-[#4A5568]'}`} />
            Auto-Listen
          </button>

          {/* Mute */}
          <button
            onClick={() => setIsMuted(v => !v)}
            className="p-2 rounded-xl border cursor-pointer transition-colors"
            style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: isMuted ? '#FF647C' : '#9AA7BE' }}
            title={isMuted ? 'Unmute agent' : 'Mute agent'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors"
              style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#E8EDF9' }}
            >
              <span className="font-tamil">{selectedLang.label}</span>
              <ChevronDown className="w-3 h-3 text-[#9AA7BE]" />
            </button>
            {showLangMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 rounded-xl overflow-hidden z-30 shadow-xl"
                style={{ background: '#101626', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setLanguage(opt.value); setShowLangMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer border-none bg-transparent hover:bg-[#171F33] transition-colors text-left"
                    style={{ color: language === opt.value ? accent : '#9AA7BE' }}
                  >
                    <span className="font-tamil">{opt.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={resetCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors"
            style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Autoplay blocked banner */}
      {autoplayBlocked && (
        <div
          className="shrink-0 flex items-center justify-between gap-4 px-5 py-2.5 text-xs"
          style={{ background: 'rgba(255,191,105,0.10)', borderBottom: '1px solid rgba(255,191,105,0.25)' }}
        >
          <span className="text-[#FFBF69]">Browser paused audio — tap to hear the agent reply.</span>
          <button
            onClick={() => { if (audioPlayerRef.current) audioPlayerRef.current.play(); setAutoplayBlocked(false); }}
            className="px-3 py-1 rounded-lg font-bold cursor-pointer border-none text-xs"
            style={{ background: '#FFBF69', color: '#080B18' }}
          >
            Tap to Play
          </button>
        </div>
      )}

      {/* ── 3-Column layout (desktop) | stacked (mobile) ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-0 relative">
        {/* Sector World 2D Ambient Backdrop */}
        <SectorWorld2D sectorId={sectorDetail.id} mode="ambient" className="z-0" />

        {/* ─── LEFT: Call info + controls ─── */}
        <div
          className="flex flex-col gap-4 p-5 border-r overflow-y-auto relative z-10"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,17,32,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* Timer / status */}
          <div className="text-center pt-2">
            <div
              className="text-3xl font-bold font-heading mb-1"
              style={{ color: orbState === 'listening' ? '#32D8E8' : '#E8EDF9', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {formatTimer(timerSecs)}
            </div>
            <p className="text-xs text-[#9AA7BE]">
              {orbState === 'listening' ? `Recording… / 0:${MAX_RECORDING_SECONDS}` : 'Call timer'}
            </p>
          </div>

          {/* Slot progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#9AA7BE] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Slots</span>
              <span className="text-[10px] font-bold" style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}>{filledCount}/{totalSlots}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(filledCount / totalSlots) * 100}%`, background: accent }}
              />
            </div>
          </div>

          {/* Prisma meta */}
          {prismaMeta && (
            <div
              className="p-2.5 rounded-xl text-[10px] space-y-1"
              style={{ background: 'rgba(8,11,24,0.6)', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <div className="text-[#9AA7BE]">Prisma STT</div>
              <div className="text-[#E8EDF9] truncate">"{prismaMeta.transcript}"</div>
              <div className="text-[#4A5568]">{prismaMeta.language_code}</div>
            </div>
          )}

          {/* Errors */}
          {micError && (
            <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ background: 'rgba(255,100,124,0.10)', border: '1px solid rgba(255,100,124,0.25)', color: '#FF647C' }}>
              <MicOff className="w-4 h-4 shrink-0" />
              <span>{micError}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ background: 'rgba(255,100,124,0.10)', border: '1px solid rgba(255,100,124,0.25)', color: '#FF647C' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* ─── CENTRE: Orb + Transcript ─── */}
        <div className="flex flex-col overflow-hidden relative z-10" style={{ background: 'rgba(8,11,24,0.45)', backdropFilter: 'blur(8px)' }}>
          {/* Orb area */}
          <div
            className="shrink-0 flex flex-col items-center justify-center gap-5 py-10 px-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <VoiceOrb
              state={orbState}
              accentColor={accent}
              micVolume={micVolume}
              onClick={() => {
                if (orbState === 'listening') stopRecording();
                else if (orbState === 'idle') startRecording();
              }}
            />

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {orbState !== 'listening' ? (
                <button
                  onClick={startRecording}
                  disabled={submittingTurn}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                  style={{ background: accent, color: '#fff', boxShadow: `0 0 20px ${accent}40` }}
                >
                  <Mic className="w-4 h-4" />
                  <span>Record</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none transition-transform hover:scale-105 active:scale-95"
                  style={{ background: '#FF647C', color: '#fff' }}
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Done Speaking</span>
                </button>
              )}

              {lastAgentAudioUrl && (
                <button
                  onClick={() => playAgentAudio(lastAgentAudioUrl)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
                  style={{ background: 'rgba(23,31,51,0.8)', borderColor: 'rgba(255,255,255,0.10)', color: '#9AA7BE' }}
                >
                  <Play className="w-3.5 h-3.5" />
                  Replay
                </button>
              )}

              {orbState === 'speaking' && (
                <button
                  onClick={() => { if (audioPlayerRef.current) audioPlayerRef.current.pause(); setOrbState('idle'); }}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
                  style={{ background: 'rgba(23,31,51,0.8)', borderColor: 'rgba(255,255,255,0.10)', color: '#9AA7BE' }}
                >
                  Stop Audio
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl cursor-pointer border transition-colors"
                style={{ background: 'rgba(23,31,51,0.8)', borderColor: 'rgba(255,255,255,0.10)', color: '#9AA7BE' }}
                title="Upload audio file"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {chatHistory.map((turn, idx) => {
              const isCaller = turn.speaker === 'caller';
              return (
                <div key={idx} className={`flex items-start gap-2.5 ${isCaller ? 'justify-end' : 'justify-start'}`}>
                  {!isCaller && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                      style={{ background: `${accent}18`, borderColor: `${accent}35`, color: accent }}
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed font-tamil"
                    style={
                      isCaller
                        ? { background: 'rgba(23,31,51,0.9)', border: '1px solid rgba(255,255,255,0.09)', color: '#E8EDF9' }
                        : { background: 'rgba(8,11,24,0.7)', border: `1px solid rgba(255,255,255,0.07)`, borderLeft: `3px solid ${accent}`, color: '#E8EDF9' }
                    }
                  >
                    <span className="block text-[9px] mb-1 font-mono" style={{ color: '#4A5568' }}>
                      {isCaller ? 'Caller' : 'Vaayil Agent (Shivani)'}
                    </span>
                    {turn.text}
                  </div>
                  {isCaller && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(23,31,51,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: '#9AA7BE' }}>
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
            {submittingTurn && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#9AA7BE' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accent }} />
                <span>Processing turn…</span>
              </div>
            )}
          </div>

          {/* Typed input */}
          <div className="shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); if (!typedInput.trim() || submittingTurn) return; const txt = typedInput; setTypedInput(''); dispatchTurn(txt); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type your reply here… (தமிழ் / Tanglish / English)"
                disabled={submittingTurn}
                className="input-base pr-11 font-tamil"
              />
              <button
                type="submit"
                disabled={!typedInput.trim() || submittingTurn}
                className="absolute right-2 p-2 rounded-lg cursor-pointer border-none disabled:opacity-40 transition-colors"
                style={{ background: accent, color: '#fff' }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* ─── RIGHT: Extracted Details + Confirmation ─── */}
        <div
          className="flex flex-col gap-4 p-5 border-l overflow-y-auto relative z-10"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,17,32,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* Slots header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-xs font-semibold text-[#E8EDF9] font-tamil">நேரலை விவரங்கள்</span>
          </div>

          {/* Slot list */}
          <div className="space-y-2">
            {sectorDetail.slots.map((slot) => {
              const isFilled = extractedSlots[slot.name] !== undefined && extractedSlots[slot.name] !== null;
              const isTarget = nextSlot === slot.name && !isFilled;
              const val = extractedSlots[slot.name];
              return (
                <div
                  key={slot.name}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    background: isFilled ? 'rgba(66,214,164,0.08)' : isTarget ? 'rgba(50,216,232,0.07)' : 'rgba(8,11,24,0.5)',
                    border: `1px solid ${isFilled ? 'rgba(66,214,164,0.25)' : isTarget ? 'rgba(50,216,232,0.25)' : 'rgba(255,255,255,0.05)'}`,
                    opacity: (!isFilled && !isTarget) ? 0.65 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#9AA7BE] font-tamil">{slot.label_ta}</span>
                    {isFilled && <CheckCircle2 className="w-3.5 h-3.5 text-[#42D6A4]" />}
                    {isTarget && <span className="text-[9px] text-[#32D8E8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>NEXT</span>}
                  </div>
                  <div className="text-xs font-semibold">
                    {isFilled
                      ? <span className="text-[#E8EDF9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{String(val)}</span>
                      : <span className="text-[#4A5568] italic">{slot.required ? 'Waiting…' : 'Optional'}</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirmation card */}
          {engineState === 'confirming' && (
            <Card variant="default" className="p-4 space-y-3" style={{ borderColor: 'rgba(255,191,105,0.30)' }}>
              <div>
                <p className="text-xs font-bold text-[#FFBF69] font-tamil mb-1">அனைத்து விவரங்களும் பெறப்பட்டன!</p>
                <p className="text-[11px] text-[#9AA7BE] leading-relaxed">Review and confirm to save to database.</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    try {
                      setSubmittingTurn(true);
                      const b = await api.confirmBookingFromCall({ session_id: sessionId || 'sess-manual', sector_id: sectorDetail.id, slots: extractedSlots });
                      setEngineState('completed');
                      const confirmMsg = `மிக்க நன்றி! உங்கள் முன்பதிவு எண் ${b.reference_number}.`;
                      api.speakText(confirmMsg, 'ta-IN', 'Shivani').then((blob) => {
                        const url = URL.createObjectURL(blob); setLastAgentAudioUrl(url); playAgentAudio(url);
                      }).catch(() => {});
                    } catch (err: any) { setErrorMessage(err.message || 'Confirmation failed'); }
                    finally { setSubmittingTurn(false); }
                  }}
                  className="w-full py-2 rounded-xl font-bold text-sm cursor-pointer border-none text-center transition-colors"
                  style={{ background: '#42D6A4', color: '#080B18' }}
                >
                  Confirm & Save
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEngineState('collecting'); dispatchTurn('illa, details mathanum'); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
                    style={{ background: 'rgba(23,31,51,0.8)', borderColor: 'rgba(255,255,255,0.10)', color: '#9AA7BE' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={resetCall}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
                    style={{ background: 'rgba(255,100,124,0.10)', borderColor: 'rgba(255,100,124,0.25)', color: '#FF647C' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {engineState === 'completed' && (
            <Card variant="default" className="p-4 space-y-2" style={{ borderColor: 'rgba(66,214,164,0.25)' }}>
              <p className="text-xs font-bold text-[#42D6A4] font-tamil">முன்பதிவு தயார் ✓</p>
              <p className="text-[11px] text-[#9AA7BE]">Call completed. Booking saved to database with Timbre voice confirmation.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
