import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, MapPin } from 'lucide-react';
import { DISTRICTS, type TNDistrict } from '../../data/tamilNaduDistricts';

interface DistrictSelectorProps {
  onSelectDistrict: (district: TNDistrict) => void;
  onBack: () => void;
}

export const DistrictSelector: React.FC<DistrictSelectorProps> = ({
  onSelectDistrict,
  onBack,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DISTRICTS;
    return DISTRICTS.filter(
      (d) =>
        d.en.toLowerCase().includes(q) || d.ta.includes(q) || d.id.includes(q)
    );
  }, [query]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#080B18', color: '#E8EDF9' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(8,11,24,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm cursor-pointer border-none px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#9AA7BE',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1
            className="text-base font-bold"
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
          >
            Select Your District
          </h1>
          <p className="text-xs font-tamil" style={{ color: '#5A6480' }}>
            உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-5">
        <div
          className="relative max-w-md mx-auto"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#4A5568' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search district / மாவட்டம் தேடுக"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#E8EDF9',
            }}
          />
        </div>
      </div>

      {/* District grid */}
      <div className="flex-1 px-4 pb-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#4A5568' }}>
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No district found for "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((d, i) => (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => onSelectDistrict(d)}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl cursor-pointer border-none text-left transition-all group"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  whileHover={{
                    background: 'rgba(128,101,255,0.08)',
                    borderColor: 'rgba(128,101,255,0.30)',
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <MapPin
                    className="w-4 h-4 mb-1"
                    style={{ color: '#5A6480' }}
                  />
                  <span
                    className="text-xs font-semibold text-center leading-tight"
                    style={{ color: '#C8D0E0' }}
                  >
                    {d.en}
                  </span>
                  <span
                    className="text-[11px] font-tamil text-center"
                    style={{ color: '#4A5568' }}
                  >
                    {d.ta}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

