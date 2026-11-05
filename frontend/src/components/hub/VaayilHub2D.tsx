import React from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { DynamicIcon } from '../ui/Icons';
import { ArrowRight } from 'lucide-react';

interface VaayilHub2DProps {
  sectors: Sector[];
  selectedSector: Sector | null;
  onSelectSector: (sector: Sector) => void;
}

export const VaayilHub2D: React.FC<VaayilHub2DProps> = ({
  sectors,
  selectedSector,
  onSelectSector,
}) => {
  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        {/* Arch SVG mark */}
        <div className="flex justify-center mb-5">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#17152D"/>
            <path
              d="M12 44V26C12 17.163 19.163 10 28 10C36.837 10 44 17.163 44 26V44"
              stroke="#8065FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="28" cy="27" r="3.5" fill="#32D8E8"/>
            <line x1="12" y1="44" x2="44" y2="44" stroke="#32D8E8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          </svg>
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold text-[#E8EDF9] tracking-tight mb-2"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          VAAYIL AI
        </h1>
        <p className="text-sm text-[#9AA7BE] mb-1 font-tamil">
          ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் — Every business. One voice at the door.
        </p>
        <p className="text-xs text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          One intelligent voice · Six powerful workspaces · Choose your sector to enter
        </p>
      </motion.div>

      {/* Sector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {sectors.map((sector, index) => {
          const isSelected = selectedSector?.id === sector.id;

          return (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
              whileHover={{ y: -4, transition: { duration: 0.18 } }}
              onClick={() => onSelectSector(sector)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectSector(sector)}
              aria-label={`Enter ${sector.display_name_en} workspace`}
              className="group relative rounded-2xl p-5 cursor-pointer text-left overflow-hidden transition-shadow duration-200"
              style={{
                background: isSelected ? `${sector.accent_color}10` : '#101626',
                border: `1px solid ${isSelected ? sector.accent_color : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? `0 0 30px ${sector.accent_color}25` : undefined,
              }}
            >
              {/* Background gradient on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 30%, ${sector.accent_color}08, transparent 70%)` }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: `${sector.accent_color}18`,
                    borderColor: `${sector.accent_color}35`,
                    color: sector.accent_color,
                  }}
                >
                  <DynamicIcon name={sector.icon} className="w-5 h-5" />
                </div>

                {/* Name */}
                <h3
                  className="text-base font-semibold text-[#E8EDF9] mb-0.5 font-tamil"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {sector.display_name_ta}
                </h3>
                <p className="text-xs text-[#9AA7BE] mb-3">{sector.display_name_en}</p>
                <p className="text-xs text-[#4A5568] leading-relaxed line-clamp-2 font-tamil">
                  {sector.tagline_ta}
                </p>

                {/* Enter arrow */}
                <div
                  className="mt-4 flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ color: sector.accent_color }}
                >
                  <span>Enter workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-2 h-2 rounded-full"
                  style={{ background: sector.accent_color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-xs text-[#4A5568] text-center"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Powered by Gnani Prisma STT · Timbre TTS
      </motion.p>
    </div>
  );
};
