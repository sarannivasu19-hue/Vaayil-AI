import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { TNDistrict } from '../../data/tamilNaduDistricts';

export interface SectorCategory {
  id: string;
  nameEn: string;
  nameTa: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

export const SECTOR_CATEGORIES: SectorCategory[] = [
  {
    id: 'panchayat_health',
    nameEn: 'Panchayat / Public Services',
    nameTa: 'ஊராட்சி / பொதுச் சேவைகள்',
    icon: '🌾',
    description: 'Panchayat health desks, immunization drives, sanitation complaints & community welfare',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
  },
  {
    id: 'clinic',
    nameEn: 'Healthcare / Clinics',
    nameTa: 'மருத்துவ சேவைகள் / கிளினிக்',
    icon: '🏥',
    description: 'General medicine, pediatric consultations, token scheduling & outpatient triage',
    color: '#32D8E8',
    bg: 'rgba(50,216,232,0.08)',
  },
  {
    id: 'vet_clinic',
    nameEn: 'Veterinary Services',
    nameTa: 'கால்நடை மருத்துவ சேவைகள்',
    icon: '🐾',
    description: 'Livestock cattle care, veterinary clinic visits, farm doctor visits & pet treatments',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.08)',
  },
  {
    id: 'hotel_lodge',
    nameEn: 'Hotels / Accommodation',
    nameTa: 'விடுதிகள் / தங்குமிடம்',
    icon: '🏨',
    description: 'AC & deluxe room booking, family suites, temple stay reservations & guest desks',
    color: '#C9A227',
    bg: 'rgba(201,162,39,0.08)',
  },
  {
    id: 'restaurant',
    nameEn: 'Restaurants / Food Ordering',
    nameTa: 'உணவகங்கள் / உணவு முன்பதிவு',
    icon: '🍽️',
    description: 'Table reservations, traditional banquet orders, wedding & bulk event catering',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.08)',
  },
  {
    id: 'coaching',
    nameEn: 'Coaching / Education',
    nameTa: 'பயிற்சி மையங்கள் / கல்வி',
    icon: '📚',
    description: 'TNPSC, NEET, JEE exam guidance, free demo seat booking & course fee inquiries',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
  },
];

interface SectorSelectorProps {
  district: TNDistrict;
  onSelectSector: (sector: SectorCategory) => void;
  onBack: () => void;
}

export const SectorSelector: React.FC<SectorSelectorProps> = ({
  district,
  onSelectSector,
  onBack,
}) => {
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
          style={{ background: 'rgba(255,255,255,0.05)', color: '#9AA7BE' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs mb-0.5" style={{ color: '#4A5568' }}>
            <span>{district.en}</span>
            <span className="font-tamil">{district.ta}</span>
          </div>
          <h1
            className="text-base font-bold"
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
          >
            Select Business Sector
          </h1>
          <p className="text-xs font-tamil" style={{ color: '#5A6480' }}>
            தொழில் பிரிவை தேர்ந்தெடுக்கவும்
          </p>
        </div>
      </div>

      {/* Sector grid */}
      <div className="flex-1 px-4 py-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTOR_CATEGORIES.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => onSelectSector(s)}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl cursor-pointer border-none text-left transition-all group"
                style={{
                  background: s.bg,
                  border: `1px solid ${s.color}22`,
                }}
                whileHover={{
                  scale: 1.02,
                  borderColor: s.color + '55',
                  boxShadow: `0 0 20px ${s.color}18`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: s.color }}>
                    {s.nameEn}
                  </p>
                  <p className="text-xs font-tamil mb-2" style={{ color: '#5A6480' }}>
                    {s.nameTa}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#4A5568' }}>
                    {s.description}
                  </p>
                </div>
                <div className="self-end">
                  <ChevronRight className="w-4 h-4" style={{ color: s.color + '80' }} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

