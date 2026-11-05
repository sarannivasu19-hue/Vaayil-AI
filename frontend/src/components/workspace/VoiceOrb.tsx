import React from 'react';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceOrbProps {
  state: OrbState;
  accentColor: string;
  micVolume?: number; // 0.0 to 1.0 (from Web Audio analyser)
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  accentColor,
  micVolume = 0.2,
  onClick,
}) => {
  // Compute dynamic scale and glow based on volume when listening
  const dynamicScale = state === 'listening' ? 1 + micVolume * 0.4 : 1;

  return (
    <div
      onClick={onClick}
      className={`relative w-40 h-40 flex items-center justify-center cursor-pointer select-none transition-transform duration-300 ${
        state === 'idle' ? 'hover:scale-105' : ''
      }`}
    >
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          state === 'listening'
            ? 'opacity-80 scale-125'
            : state === 'speaking'
              ? 'opacity-70 scale-115'
              : state === 'processing'
                ? 'opacity-60 scale-110'
                : state === 'error'
                  ? 'opacity-90 scale-125'
                  : 'opacity-30 scale-100'
        }`}
        style={{
          backgroundColor:
            state === 'error'
              ? '#ef4444'
              : state === 'speaking'
                ? '#8b5cf6'
                : accentColor,
        }}
      />

      {/* Rotating conic light ring for processing */}
      {state === 'processing' && (
        <div
          className="absolute inset-1 rounded-full animate-spin pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor})`,
            animationDuration: '2s',
          }}
        />
      )}

      {/* Rhythmic pulses for speaking */}
      {state === 'speaking' && (
        <>
          <div
            className="absolute inset-2 rounded-full border border-purple-400/40 animate-ping pointer-events-none"
            style={{ animationDuration: '1.4s' }}
          />
          <div
            className="absolute inset-0 rounded-full border border-purple-400/20 animate-ping pointer-events-none"
            style={{ animationDuration: '2.1s' }}
          />
        </>
      )}

      {/* Audio waveform rings for listening */}
      {state === 'listening' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-pulse pointer-events-none"
          style={{ transform: `scale(${dynamicScale})` }}
        />
      )}

      {/* Core Sphere */}
      <div
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 backdrop-blur-md border ${
          state === 'idle' ? 'animate-bounce-slow' : ''
        }`}
        style={{
          transform: `scale(${dynamicScale})`,
          background:
            state === 'error'
              ? 'radial-gradient(circle at 35% 35%, #f87171, #dc2626 60%, #7f1d1d)'
              : state === 'speaking'
                ? 'radial-gradient(circle at 35% 35%, #c084fc, #9333ea 60%, #581c87)'
                : state === 'listening'
                  ? `radial-gradient(circle at 35% 35%, #a5f3fc, ${accentColor} 65%, #083344)`
                  : state === 'processing'
                    ? `radial-gradient(circle at 35% 35%, #e2e8f0, #475569 70%, #0f172a)`
                    : `radial-gradient(circle at 35% 35%, #ffffff 0%, ${accentColor} 50%, #030712 95%)`,
          borderColor:
            state === 'error'
              ? '#fca5a5'
              : state === 'speaking'
                ? '#e9d5ff'
                : state === 'listening'
                  ? '#cffafe'
                  : 'rgba(255,255,255,0.2)',
          boxShadow: `0 0 35px ${
            state === 'error' ? '#ef444480' : `${accentColor}80`
          }`,
        }}
      >
        {/* Specular highlight */}
        <div className="absolute top-2.5 left-3 w-8 h-4 rounded-full bg-white/40 blur-[1px] transform -rotate-30 pointer-events-none" />

        {/* State label */}
        <span className="text-[10px] font-mono uppercase tracking-widest font-black text-white/90 drop-shadow-md">
          {state === 'idle' && 'READY'}
          {state === 'listening' && 'HEARING'}
          {state === 'processing' && 'THINKING'}
          {state === 'speaking' && 'SPEAKING'}
          {state === 'error' && 'ERROR'}
        </span>
      </div>
    </div>
  );
};

