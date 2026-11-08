import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenUserLogin: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenUserLogin,
}) => {
  const { adminLogin } = useAuth();
  const [username, setUsername] = useState('Saran');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Please enter administrator credentials.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminLogin(username.trim(), password);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Access denied. Administrator privileges required.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="relative z-10 w-full max-w-md my-auto rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: '#070A17',
          borderColor: 'rgba(128, 101, 255, 0.4)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 50px rgba(128, 101, 255, 0.15)',
        }}
      >
        {/* Top gold & violet accent stripe */}
        <div
          className="h-1.5 w-full"
          style={{
            background: 'linear-gradient(90deg, #8065FF 0%, #C3A5FF 50%, #FFBF69 100%)',
          }}
        />

        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#A58EFF] border"
              style={{
                background: 'rgba(128, 101, 255, 0.12)',
                borderColor: 'rgba(128, 101, 255, 0.3)',
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FFBF69] font-bold">
                  Restricted Gateway
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#E8EDF9] font-heading">
                Vaayil Platform Admin
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9AA7BE] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning Box */}
        <div className="p-6 pt-4 space-y-4">
          <div
            className="p-3 rounded-xl border flex items-start gap-2.5 text-xs"
            style={{
              background: 'rgba(128, 101, 255, 0.08)',
              borderColor: 'rgba(128, 101, 255, 0.25)',
              color: '#C6D2E8',
            }}
          >
            <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-[#A58EFF]" />
            <p className="leading-relaxed">
              This portal is restricted to authorized platform architects and administrators. All authorization events are cryptographically audited.
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs border"
                style={{
                  background: 'rgba(255, 100, 124, 0.12)',
                  borderColor: 'rgba(255, 100, 124, 0.35)',
                  color: '#FF889B',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF647C]" />
                <span className="leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                Admin Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7E8CA3] pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter administrator username"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                  style={{
                    background: 'rgba(16, 22, 38, 0.85)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                Admin Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7E8CA3] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none font-mono"
                  style={{
                    background: 'rgba(16, 22, 38, 0.85)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7E8CA3] hover:text-white bg-transparent border-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7E8CA3]">
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#42D6A4]" />
                RBAC Protected
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Cryptographically Audited
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#BAC7DF] transition-all"
                title="Back to Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-none text-white shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8065FF 0%, #A58EFF 100%)',
                  boxShadow: '0 4px 20px rgba(128, 101, 255, 0.35)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Administrator…</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate as Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to normal login */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#7E8CA3]">
            <span>Need business owner sign-in?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUserLogin();
              }}
              className="text-[#32D8E8] hover:underline bg-transparent border-none cursor-pointer font-semibold"
            >
              ← User Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

