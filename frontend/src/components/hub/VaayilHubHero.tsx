import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, ShieldCheck } from 'lucide-react';

interface VaayilHubHeroProps {
  onSelectDistrict: () => void;
  onOpenAdminLogin: () => void;
  onOpenUserLogin: () => void;
}

const SECTOR_PILLS = [
  { icon: '🏥', label: 'Clinics', ta: 'மருத்துவமனை' },
  { icon: '🌾', label: 'Panchayat Health', ta: 'பஞ்சாயத்து சுகாதாரம்' },
  { icon: '🐾', label: 'Vet Clinics', ta: 'கால்நடை மருத்துவம்' },
  { icon: '🏨', label: 'Hotels & Lodges', ta: 'ஹோட்டல்' },
  { icon: '🍽️', label: 'Restaurants', ta: 'உணவகம்' },
  { icon: '📚', label: 'Coaching', ta: 'கோச்சிங்' },
];

export const VaayilHubHero: React.FC<VaayilHubHeroProps> = ({
  onSelectDistrict,
  onOpenAdminLogin,
  onOpenUserLogin,
}) => {
  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden"
      style={{ background: '#080B18', color: '#E8EDF9' }}
    >
      {/* ── Background decorative layers ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(128,101,255,0.12) 0%, transparent 70%)',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Gold accent line top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #C9A227 30%, #32D8E8 50%, #C9A227 70%, transparent 100%)',
        }}
      />
      {/* SVG Tamil Nadu silhouette faint */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none"
        style={{ width: 480, height: 480 }}
        aria-hidden
      >
        <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M200 20 C160 40 100 80 80 140 C60 200 70 260 90 310 C110 360 130 390 160 420 C180 440 200 480 200 480 C200 480 220 440 240 420 C270 390 290 360 310 310 C330 260 340 200 320 140 C300 80 240 40 200 20Z"
            fill="url(#tn-grad)"
          />
          <defs>
            <linearGradient id="tn-grad" x1="200" y1="20" x2="200" y2="480">
              <stop stopColor="#C9A227" />
              <stop offset="1" stopColor="#8065FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── Top navigation bar ── */}
      <header
        className="relative z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8065FF 0%, #32D8E8 100%)' }}
          >
            <Mic className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: '#E8EDF9', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
            >
              VAAYIL AI
            </span>
            <span
              className="hidden sm:block text-[10px] leading-none"
              style={{ color: '#5A6480', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
            >
              Tamil Nadu Business Voice Platform
            </span>
          </div>
        </div>

        {/* Auth links */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUserLogin}
            className="text-sm font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none"
            style={{
              background: 'rgba(128,101,255,0.12)',
              color: '#A58EFF',
              border: '1px solid rgba(128,101,255,0.25)',
            }}
          >
            Login
          </button>
          <button
            onClick={onOpenAdminLogin}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border-none"
            style={{
              background: 'rgba(201,162,39,0.10)',
              color: '#C9A227',
              border: '1px solid rgba(201,162,39,0.20)',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
      </header>

      {/* ── Main hero content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
          style={{
            background: 'rgba(50,216,232,0.08)',
            border: '1px solid rgba(50,216,232,0.20)',
            color: '#32D8E8',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#32D8E8' }}
          />
          AI Voice Agents for Tamil Nadu Businesses
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 max-w-3xl"
          style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', color: '#E8EDF9' }}
        >
          Every Business.{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #8065FF, #32D8E8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            One Voice
          </span>{' '}
          at the Door.
        </motion.h1>

        {/* Tamil tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg font-tamil mb-3"
          style={{ color: '#C9A227' }}
        >
          ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் வாயில்.
        </motion.p>

        {/* Sub description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm sm:text-base max-w-xl mb-10 leading-relaxed"
          style={{ color: '#6B7A99' }}
        >
          Automated AI voice agents for clinics, panchayat health centres, veterinary clinics,
          hotels, restaurants and coaching centres across all 38 Tamil Nadu districts.
        </motion.p>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onClick={onSelectDistrict}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold cursor-pointer border-none mb-4 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #8065FF 0%, #5B8DEF 100%)',
            color: '#fff',
            boxShadow: '0 0 32px rgba(128,101,255,0.35)',
          }}
        >
          <span>Select Your District</span>
          <ChevronRight
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </motion.button>

        {/* Tamil CTA hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs font-tamil"
          style={{ color: '#4A5568' }}
        >
          உங்கள் மாவட்டத்தை தேர்வு செய்யவும்
        </motion.p>

        {/* Sector pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-14 flex flex-wrap justify-center gap-3 max-w-2xl"
        >
          {SECTOR_PILLS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#7A8599',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span className="font-tamil text-[10px]" style={{ color: '#4A5568' }}>
                {s.ta}
              </span>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 text-center py-5 text-xs"
        style={{ color: '#3A4458', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        © 2025 Vaayil AI · Tamil Nadu · தமிழ்நாடு
      </footer>
    </div>
  );
};

