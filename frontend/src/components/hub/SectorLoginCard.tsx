import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { getSectorTheme } from '../../config/sectorThemes';
import { DynamicIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Lock, User as UserIcon, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface SectorLoginCardProps {
  sector: Sector;
  onBack: () => void;
  onLoginSuccess: () => void;
}

const DEMO_CREDENTIALS_MAP: Record<string, { username: string; label: string }> = {
  panchayat_health: { username: 'panchayat_admin', label: 'Selvi Anitha (Village Nurse)' },
  clinic:           { username: 'clinic_admin',    label: 'Dr. Karthik Sundaram (Clinic)' },
  vet_clinic:       { username: 'vet_admin',        label: 'Dr. Murugan Velu (Veterinary)' },
  hotel_lodge:      { username: 'hotel_admin',      label: 'R. Senthil Nathan (Front Desk)' },
  restaurant:       { username: 'restaurant_admin', label: 'Chef Sundaram (Bhavan)' },
  coaching:         { username: 'coaching_admin',   label: 'Prof. Vigneshwaran (Academy)' },
};

export const SectorLoginCard: React.FC<SectorLoginCardProps> = ({
  sector,
  onBack,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const demo = DEMO_CREDENTIALS_MAP[sector.id] || { username: 'panchayat_admin', label: 'Admin' };

  const [username, setUsername] = useState(demo.username);
  const [password, setPassword] = useState('vaayil123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const doLogin = async (u: string, p: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(u, p);
      onLoginSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doLogin(username, password); };
  const handleDemoLogin = () => { setUsername(demo.username); setPassword('vaayil123'); doLogin(demo.username, 'vaayil123'); };

  const theme = getSectorTheme(sector.id);
  const accent = theme.accent;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 14 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
      className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
      style={{
        background: theme.surfaceTint,
        border: `1px solid ${theme.borderHighlight}`,
        boxShadow: `0 0 50px ${theme.glow}, 0 24px 60px rgba(0,0,0,0.85)`,
      }}
    >
      {/* Top colour band */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentSecondary})` }}
      />

      <div className="p-6">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[#9AA7BE] hover:text-[#E8EDF9] transition-colors mb-5 cursor-pointer border-none bg-transparent group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Vaayil Hub
        </button>

        {/* Sector header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ background: `${accent}18`, borderColor: `${accent}40`, color: accent }}
          >
            <DynamicIcon name={sector.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8EDF9] font-tamil leading-tight">
              {sector.display_name_ta}
            </h2>
            <p className="text-xs text-[#9AA7BE]">{sector.display_name_en}</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs text-[#9AA7BE] leading-relaxed mb-5 font-tamil p-3 rounded-xl" style={{ background: 'rgba(8,11,24,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {sector.tagline_ta}
        </p>

        {/* Demo login */}
        <div
          className="mb-5 p-3.5 rounded-xl flex items-center justify-between gap-3"
          style={{ background: 'rgba(50,216,232,0.06)', border: '1px solid rgba(50,216,232,0.20)' }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-[#32D8E8]" />
              <span className="text-xs font-semibold text-[#32D8E8]">Demo Account</span>
            </div>
            <p className="text-[11px] text-[#9AA7BE]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {demo.username} · {demo.label}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border-none disabled:opacity-50 shrink-0"
            style={{ background: '#32D8E8', color: '#080B18' }}
          >
            {isSubmitting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Enter</span></>
            }
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[10px] text-[#4A5568] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>or sign in</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Error */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl flex items-center gap-2 text-xs"
            style={{ background: 'rgba(255,100,124,0.10)', border: '1px solid rgba(255,100,124,0.30)', color: '#FF647C' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#9AA7BE] pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-base pl-10"
                placeholder="e.g. panchayat_admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#9AA7BE] pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-base pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-60 transition-opacity mt-1"
            style={{ background: accent, color: '#fff', boxShadow: `0 0 20px ${accent}35` }}
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying…</span></>
              : <span>Sign in to {sector.name}</span>
            }
          </button>
        </form>
      </div>
    </motion.div>
  );
};
