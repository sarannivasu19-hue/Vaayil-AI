import React from 'react';
import { clsx } from 'clsx';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceOrbProps {
  state: OrbState;
  accentColor: string;
  micVolume?: number;
  onClick?: () => void;
}

const STATE_CONFIG = {
  idle:       { label: 'Ready to listen.',      labelTa: 'தயார்',           color: null,      glowOpacity: 0.25, coreClass: '' },
  listening:  { label: 'நான் கேட்கிறேன்…',      labelTa: 'நான் கேட்கிறேன்…', color: '#32D8E8', glowOpacity: 0.65, coreClass: '' },
  processing: { label: 'புரிந்துகொள்கிறேன்…',   labelTa: 'புரிந்துகொள்கிறேன்…', color: '#8065FF', glowOpacity: 0.55, coreClass: '' },
  speaking:   { label: 'பதில் அளிக்கிறேன்…',   labelTa: 'பதில் அளிக்கிறேன்…', color: '#A58EFF', glowOpacity: 0.60, coreClass: '' },
  error:      { label: 'மீண்டும் முயற்சிக்கவும்.', labelTa: 'பிழை',         color: '#FF647C', glowOpacity: 0.80, coreClass: '' },
};

const WAVEFORM_BARS = 12;

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  accentColor,
  micVolume = 0.15,
  onClick,
}) => {
  const cfg = STATE_CONFIG[state];
  const resolvedColor = cfg.color ?? accentColor;
  const dynamicScale = state === 'listening' ? 1 + micVolume * 0.35 : 1;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-center justify-center select-none',
        onClick && 'cursor-pointer',
      )}
      role={onClick ? 'button' : undefined}
      aria-label={cfg.label}
    >
      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          width: 220,
          height: 220,
          background: resolvedColor,
          opacity: cfg.glowOpacity,
          transform: `scale(${dynamicScale})`,
        }}
      />

      {/* Processing: rotating ring */}
      {state === 'processing' && (
        <div
          className="absolute rounded-full border-2 border-transparent pointer-events-none animate-spin"
          style={{
            width: 164,
            height: 164,
            borderTopColor: '#8065FF',
            borderRightColor: '#A58EFF',
            animationDuration: '1.4s',
          }}
        />
      )}

      {/* Speaking: expanding ping rings */}
      {state === 'speaking' && (
        <>
          <div
            className="absolute rounded-full border pointer-events-none animate-ping"
            style={{ width: 148, height: 148, borderColor: `${resolvedColor}50`, animationDuration: '1.6s' }}
          />
          <div
            className="absolute rounded-full border pointer-events-none animate-ping"
            style={{ width: 176, height: 176, borderColor: `${resolvedColor}30`, animationDuration: '2.4s' }}
          />
        </>
      )}

      {/* Listening: audio-reactive border */}
      {state === 'listening' && (
        <div
          className="absolute rounded-full border-2 pointer-events-none transition-all duration-100"
          style={{
            width: 148,
            height: 148,
            borderColor: `${resolvedColor}70`,
            transform: `scale(${dynamicScale})`,
          }}
        />
      )}

      {/* Core orb sphere */}
      <div
        className="relative flex flex-col items-center justify-center rounded-full border transition-all duration-300"
        style={{
          width: 128,
          height: 128,
          transform: `scale(${dynamicScale})`,
          background:
            state === 'error'
              ? 'radial-gradient(circle at 35% 32%, #ff9eac, #FF647C 55%, #7f1d2a)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 35% 32%, #C3A5FF, #8065FF 55%, #17152D)'
              : state === 'listening'
              ? `radial-gradient(circle at 35% 32%, #a5f9fd, ${resolvedColor} 60%, #05232a)`
              : state === 'processing'
              ? 'radial-gradient(circle at 35% 32%, #d4d8e8, #4A5568 65%, #0f172a)'
              : `radial-gradient(circle at 35% 32%, #ffffff 0%, ${accentColor} 50%, #080B18 95%)`,
          borderColor:
            state === 'error'      ? 'rgba(255,100,124,0.6)'
            : state === 'speaking' ? 'rgba(195,165,255,0.5)'
            : state === 'listening'? 'rgba(50,216,232,0.7)'
            : 'rgba(255,255,255,0.18)',
          boxShadow: `0 0 40px ${resolvedColor}60, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full bg-white/35 blur-[1px] pointer-events-none"
          style={{ width: 36, height: 20, top: 18, left: 22, transform: 'rotate(-25deg)' }}
        />

        {/* State label (Tamil) */}
        <span
          className="text-[11px] font-medium text-white/90 drop-shadow text-center leading-tight px-2 font-tamil"
          style={{ fontFamily: 'Noto Sans Tamil, Inter, sans-serif' }}
        >
          {cfg.labelTa}
        </span>
      </div>

      {/* Waveform bars (listening only) */}
      {state === 'listening' && (
        <div className="mt-5 flex items-end gap-[3px]" style={{ height: 28 }}>
          {Array.from({ length: WAVEFORM_BARS }).map((_, i) => {
            const delay = (i * 0.08).toFixed(2);
            const height = 4 + Math.round(micVolume * 24 * (0.5 + Math.random() * 0.5));
            return (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  height: `${height}px`,
                  background: resolvedColor,
                  opacity: 0.7 + micVolume * 0.3,
                  animation: `waveform 0.6s ${delay}s ease-in-out infinite alternate`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* English label */}
      <p
        className="mt-3 text-xs text-[#9AA7BE] text-center"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {cfg.label}
      </p>
    </div>
  );
};
