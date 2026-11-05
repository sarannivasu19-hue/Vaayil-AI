import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { getSectorTheme, type SectorVisualTheme } from '../../config/sectorThemes';
import { DynamicIcon } from '../ui/Icons';
import { SectorWorld2D } from './SectorWorld2D';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SectorTransitionIntroProps {
  sector: Sector;
  onComplete: () => void;
}

export const SectorTransitionIntro: React.FC<SectorTransitionIntroProps> = ({
  sector,
  onComplete,
}) => {
  const theme: SectorVisualTheme = getSectorTheme(sector.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1.5 second duration
    const startTime = Date.now();
    const duration = 1500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Handle ESC key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
      onClick={onComplete}
      title="Click or press any key to skip"
    >
      {/* Immersive 2D Sector World Atmosphere */}
      <SectorWorld2D sectorId={sector.id} mode="full" />

      {/* Radial Portal Doorway Warp Effect */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 1.2, 1], opacity: [0, 0.8, 0.6] }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          border: `2px solid ${theme.accent}`,
          boxShadow: `0 0 100px ${theme.accent}60, inset 0 0 80px ${theme.accent}30`,
        }}
      />

      {/* Main Intro Badge & Content */}
      <div className="relative z-10 text-center px-6 max-w-xl flex flex-col items-center">
        {/* Luminous Sector Icon Crest */}
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative"
          style={{
            background: theme.surfaceElevated,
            border: `2px solid ${theme.accent}`,
            boxShadow: `0 0 50px ${theme.accent}50`,
            color: theme.accent,
          }}
        >
          <DynamicIcon name={sector.icon} className="w-12 h-12" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-2 rounded-[28px] border border-dashed pointer-events-none"
            style={{ borderColor: `${theme.accent}70` }}
          />
        </motion.div>

        {/* World Name in Tamil */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold font-tamil text-[#E8EDF9] mb-1.5"
        >
          {theme.worldName_ta}
        </motion.h2>

        {/* World Name in English */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-xl sm:text-2xl font-extrabold font-heading tracking-wide mb-3"
          style={{ color: theme.accent }}
        >
          {theme.worldName_en}
        </motion.h1>

        {/* Motifs Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
        >
          {theme.motifs.map((motif, i) => (
            <span
              key={i}
              className="text-[11px] font-mono px-3 py-1 rounded-full border"
              style={{
                background: theme.badgeBg,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            >
              {motif}
            </span>
          ))}
        </motion.div>

        {/* Sector Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-xs sm:text-sm font-tamil text-[#9AA7BE] leading-relaxed max-w-md mb-8"
        >
          {theme.tagline_ta}
        </motion.p>

        {/* Entering Progress Bar & Skip action */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentSecondary})`,
                boxShadow: `0 0 10px ${theme.accent}`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9AA7BE] px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#32D8E8] animate-spin" />
              Entering sector world…
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="hover:text-[#E8EDF9] underline cursor-pointer flex items-center gap-1 text-[11px]"
            >
              Skip <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
