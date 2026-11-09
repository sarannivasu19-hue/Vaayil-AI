import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import type { Sector } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors?: Sector[];
  initialSector?: Sector | null;
  onSuccess: () => void;
  onOpenAdminLogin: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  sectors: _sectors,
  initialSector: _initialSector,
  onSuccess,
  onOpenAdminLogin,
}) => {
  const { login, registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (One Gmail = One User ID = Access to All Six Workspaces)
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your Gmail address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify credentials or use a demo account.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }
    const cleanEmail = registerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid Gmail address (e.g. name@gmail.com).');
      return;
    }
    if (registerPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!/\d/.test(registerPassword) || !/[a-zA-Z]/.test(registerPassword)) {
      setErrorMessage('Password must contain both letters and at least one numeric digit.');
      return;
    }
    if (registerPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerUser({
        full_name: fullName.trim(),
        email: cleanEmail,
        password: registerPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMessage(res.message || 'Account created successfully! Switching to sign in…');
      // Pre-fill login with registered credentials
      setLoginIdentifier(cleanEmail);
      setLoginPassword(registerPassword);
      // Switch to login tab after brief pause
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('Account registered! Please sign in to access all six business workspaces.');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        className="relative z-10 w-full max-w-lg my-auto rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: '#0B0F20',
          borderColor: 'rgba(50, 216, 232, 0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 40px rgba(50, 216, 232, 0.1)',
        }}
      >
        {/* Top color bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background: 'linear-gradient(90deg, #32D8E8 0%, #8065FF 50%, #FF647C 100%)',
          }}
        />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#32D8E8] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#32D8E8] font-bold">
                Vaayil AI · User Portal
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#E8EDF9] mt-1 font-heading">
              {mode === 'login' ? 'வணக்கம் · User Sign In' : 'புதிய கணக்கு · Create Account'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9AA7BE] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              mode === 'login'
                ? 'bg-[#32D8E8]/15 border-[#32D8E8]/40 text-[#32D8E8]'
                : 'bg-white/5 border-white/10 text-[#9AA7BE] hover:text-[#E8EDF9]'
            }`}
          >
            User Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              mode === 'register'
                ? 'bg-[#8065FF]/20 border-[#8065FF]/40 text-[#A58EFF]'
                : 'bg-white/5 border-white/10 text-[#9AA7BE] hover:text-[#E8EDF9]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 pt-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs border"
                style={{
                  background: 'rgba(255, 100, 124, 0.1)',
                  borderColor: 'rgba(255, 100, 124, 0.3)',
                  color: '#FF889B',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF647C]" />
                <div className="flex-1">
                  <p className="leading-relaxed">{errorMessage}</p>
                  {errorMessage.toLowerCase().includes('already registered') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setLoginIdentifier(registerEmail);
                        setErrorMessage(null);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors border-none cursor-pointer"
                    >
                      <span>Log In Now →</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs border"
                style={{
                  background: 'rgba(66, 214, 164, 0.1)',
                  borderColor: 'rgba(66, 214, 164, 0.3)',
                  color: '#42D6A4',
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#42D6A4]" />
                <span className="leading-relaxed">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================== LOGIN MODE ==================== */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                  Gmail Address or Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="e.g. sarannivasusenthil@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] font-mono">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] text-[#32D8E8] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7E8CA3] hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 text-[#32D8E8] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#9AA7BE]">Remember this session</span>
                </label>
                <span className="text-[11px] text-[#7E8CA3] font-mono">Demo: vaayil123</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-none text-[#080B18] shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #32D8E8 0%, #7DE8F5 100%)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ==================== REGISTER MODE: ONE GMAIL = ACCESS TO ALL 6 WORKSPACES ==================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div
                className="p-3 rounded-xl border text-xs"
                style={{
                  background: 'rgba(128,101,255,0.08)',
                  borderColor: 'rgba(128,101,255,0.25)',
                  color: '#C4B5FD',
                }}
              >
                <span className="font-semibold text-white">One Account · All Six Workspaces:</span>
                <p className="mt-0.5 text-[#9AA7BE] text-[11px] leading-relaxed">
                  Register once with your Gmail to instantly access Panchayat, Saran Clinic, Vet Centre, Saran Hotel, Saran Restaurant, and Coaching Centre.
                </p>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Saran Nivasu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
              </div>

              {/* 2. Gmail Address */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                  Gmail Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-[#7E8CA3] mt-1 block">
                  This Gmail will be your global login for all six business workspaces.
                </span>
              </div>

              {/* 3. Password & 4. Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                    Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                      style={{
                        background: 'rgba(16, 22, 38, 0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#7E8CA3] hover:text-white bg-transparent border-none cursor-pointer"
                    >
                      {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9AA7BE] mb-1 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7E8CA3] pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none"
                      style={{
                        background: 'rgba(16, 22, 38, 0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick switch to Login if already registered */}
              {errorMessage && errorMessage.includes('already registered') && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between">
                  <span>Already have an account with this Gmail?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setLoginIdentifier(registerEmail.trim());
                      setErrorMessage(null);
                    }}
                    className="font-bold underline hover:text-white bg-transparent border-none cursor-pointer text-cyan-200"
                  >
                    Log In Now →
                  </button>
                </div>
              )}

              {/* 5. Create Account Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-none text-white shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8065FF 0%, #A58EFF 100%)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Account (All 6 Workspaces)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password Helper Box */}
          <AnimatePresence>
            {showForgotPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3.5 rounded-xl border bg-black/40 text-xs"
                style={{ borderColor: 'rgba(50, 216, 232, 0.3)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[#32D8E8] font-bold">
                    <HelpCircle className="w-4 h-4" />
                    <span>Password Assistance</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-[#9AA7BE] hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-[#BAC7DF] leading-relaxed">
                  For demonstration accounts, use the default password{' '}
                  <code className="text-[#32D8E8] font-mono bg-white/5 px-1.5 py-0.5 rounded">
                    vaayil123
                  </code>
                  . For registered accounts, contact your system administrator at{' '}
                  <span className="text-[#32D8E8]">admin@vaayil.ai</span> to reset your access credentials.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin Switch Banner */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#7E8CA3]">
            <span>Are you a platform administrator?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminLogin();
              }}
              className="flex items-center gap-1.5 text-[#8065FF] hover:text-[#A58EFF] font-semibold bg-transparent border-none cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal →</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

