import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
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
  clinic: { username: 'clinic_admin', label: 'Dr. Karthik Sundaram (Clinic)' },
  vet_clinic: { username: 'vet_admin', label: 'Dr. Murugan Velu (Veterinary)' },
  hotel_lodge: { username: 'hotel_admin', label: 'R. Senthil Nathan (Front Desk)' },
  restaurant: { username: 'restaurant_admin', label: 'Chef Sundaram (Bhavan)' },
  coaching: { username: 'coaching_admin', label: 'Prof. Vigneshwaran (Academy)' },
};

export const SectorLoginCard: React.FC<SectorLoginCardProps> = ({
  sector,
  onBack,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const demoAccount = DEMO_CREDENTIALS_MAP[sector.id] || { username: 'panchayat_admin', label: 'Admin' };

  const [username, setUsername] = useState(demoAccount.username);
  const [password, setPassword] = useState('vaayil123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setUsername(demoAccount.username);
    setPassword('vaayil123');
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(demoAccount.username, 'vaayil123');
      onLoginSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Demo login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 15 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto p-6 sm:p-7 rounded-3xl glass-panel-glow relative z-20 text-left"
      style={{
        boxShadow: `0 0 50px ${sector.accent_color}25, 0 25px 50px rgba(0,0,0,0.7)`,
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-5 group cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        <span>Back to Vaayil Hub</span>
      </button>

      {/* Sector Header Banner */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg"
          style={{
            backgroundColor: `${sector.accent_color}20`,
            borderColor: `${sector.accent_color}50`,
            color: sector.accent_color,
          }}
        >
          <DynamicIcon name={sector.icon} className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border"
              style={{
                color: sector.accent_color,
                borderColor: `${sector.accent_color}40`,
                backgroundColor: `${sector.accent_color}15`,
              }}
            >
              Workspace
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight truncate font-tamil">
            {sector.display_name_ta}
          </h2>
          <p className="text-xs text-slate-300 font-medium truncate">
            {sector.display_name_en}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-5 leading-relaxed font-tamil bg-slate-950/40 p-3 rounded-xl border border-white/5">
        {sector.tagline_ta}
      </p>

      {/* 1-Click Fast Demo Sign-In Card */}
      <div className="mb-5 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-inner">
        <div className="text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Account</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
            {demoAccount.username} <span className="text-slate-500">•</span> {demoAccount.label}
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstantDemoLogin}
          disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1-Click Enter</span>
            </>
          )}
        </button>
      </div>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
          Or Enter Credentials
        </span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="e.g. panchayat_admin"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2 disabled:opacity-60"
          style={{
            backgroundColor: sector.accent_color,
            boxShadow: `0 0 25px ${sector.accent_color}40`,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying & Loading Workspace...</span>
            </>
          ) : (
            <span>Sign In to {sector.name}</span>
          )}
        </button>
      </form>
    </motion.div>
  );
};
