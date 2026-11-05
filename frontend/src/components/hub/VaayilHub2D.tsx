import React from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { DynamicIcon } from '../ui/Icons';
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Central 2D Glowing Portal Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 relative"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>வாயில் AI — Sector Workspace Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 font-tamil">
          உங்கள் தொழிலுக்கான குரல் முகப்பு
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Every business. One voice at the door. Select an industry portal to enter its dedicated voice management workspace.
        </p>
      </motion.div>

      {/* Grid of Sector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {sectors.map((sector, index) => {
          const isSelected = selectedSector?.id === sector.id;

          return (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => onSelectSector(sector)}
              className={`group relative rounded-2xl p-6 cursor-pointer border backdrop-blur-xl transition-all duration-300 text-left overflow-hidden ${
                isSelected
                  ? 'border-cyan-400 shadow-2xl'
                  : 'border-white/10 hover:border-white/25 bg-slate-900/60'
              }`}
              style={{
                boxShadow: isSelected
                  ? `0 0 35px ${sector.accent_color}35`
                  : undefined,
              }}
            >
              {/* Subtle accent glow gradient */}
              <div
                className="absolute -right-12 -top-12 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                style={{ backgroundColor: sector.accent_color }}
              />

              {/* Header: Icon & Tamil Name */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${sector.accent_color}18`,
                    borderColor: `${sector.accent_color}45`,
                    color: sector.accent_color,
                  }}
                >
                  <DynamicIcon name={sector.icon} className="w-6 h-6" />
                </div>
                <span
                  className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border"
                  style={{
                    color: sector.accent_color,
                    borderColor: `${sector.accent_color}35`,
                    backgroundColor: `${sector.accent_color}10`,
                  }}
                >
                  {sector.id.replace('_', ' ')}
                </span>
              </div>

              {/* Title & Taglines */}
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-tamil mb-1">
                {sector.display_name_ta}
              </h3>
              <p className="text-xs font-medium text-slate-300 mb-3 tracking-wide">
                {sector.display_name_en}
              </p>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-tamil">
                {sector.tagline_ta}
              </p>

              {/* Action Link Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 group-hover:text-white transition-colors">
                  Open Voice Console
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1"
                  style={{ backgroundColor: `${sector.accent_color}25`, color: sector.accent_color }}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
