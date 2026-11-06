import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { getSectorTheme, type SectorVisualTheme } from '../../config/sectorThemes';
import { DynamicIcon } from '../ui/Icons';
import { SectorBackground } from './SectorBackground';
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
    // 1.0 second duration (as requested for brief, professional entry)
    const startTime = Date.now();
    const duration = 1000;

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

  // Handle ESC or Enter or Space key to skip
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
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
      onClick={onComplete}
      title="Click or press any key to skip"
    >
      {/* Immersive Sector Background (Gradient + Photo when available) */}
      <SectorBackground sectorId={sector.id} mode="immersive" />

      {/* Main Intro Card */}
      <div className="relative z-10 text-center px-6 max-w-lg flex flex-col items-center">
        {/* Sector Icon Crest */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-2xl relative border"
          style={{
            background: theme.surfaceElevated,
            borderColor: theme.borderHighlight,
            color: theme.accent,
            boxShadow: `0 12px 40px ${theme.glow}`,
          }}
        >
          <DynamicIcon name={sector.icon} className="w-10 h-10" />
        </motion.div>

        {/* Sector Name in Tamil */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-2xl sm:text-3xl font-bold font-tamil text-[#E8EDF9] mb-1.5"
        >
          {sector.display_name_ta}
        </motion.h2>

        {/* Sector Name in English */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-lg sm:text-xl font-bold font-heading mb-3"
          style={{ color: theme.accent }}
        >
          {sector.display_name_en}
        </motion.h1>

        {/* Sector Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-xs sm:text-sm font-tamil text-[#9AA7BE] leading-relaxed max-w-md mb-6"
        >
          {sector.tagline_ta}
        </motion.p>

        {/* Progress bar & skip */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: theme.accent,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9AA7BE] px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#32D8E8]" />
              Entering {sector.name}…
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="hover:text-[#E8EDF9] cursor-pointer flex items-center gap-1 text-[11px]"
            >
              Skip <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
