import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Sector } from '../../types';
import { getSectorTheme } from '../../config/sectorThemes';
import { DynamicIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Lock,
  User as UserIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface SectorLoginCardProps {
  sector: Sector;
  onBack: () => void;
  onLoginSuccess: () => void;
  onOpenRegister?: () => void;
}

interface SectorMeta {
  role: string;
  email: string;
  username: string;
  badgeEn: string;
  badgeTa: string;
  storyEn: string;
  storyTa: string;
  capabilities: string[];
}

const SECTOR_META: Record<string, SectorMeta> = {
  panchayat_health: {
    role: 'Selvi Anitha (Village Health Nurse)',
    email: 'health.desk@panchayat.tn.gov.in',
    username: 'panchayat_admin',
    badgeEn: 'Panchayat Health Help Desk',
    badgeTa: 'ஊராட்சி சுகாதார மையம்',
    storyEn: 'Instant maternal-child triage, vaccination alert dispatch, and 24/7 bilingual voice response for rural citizens.',
    storyTa: 'கிராமப்புற குடிமக்களுக்கான உடனடி தாய்-சேய் நல ஆலோசனை, தடுப்பூசி எச்சரிக்கைகள் மற்றும் 24/7 குரல் உதவி.',
    capabilities: ['Maternal Triage', 'Polio & MMR Reminders', 'Tamil Voice Agent', 'Doctor Escalation'],
  },
  clinic: {
    role: 'Dr. Karthik Sundaram (Clinic Admin)',
    email: 'appointments@saranclinic.com',
    username: 'clinic_admin',
    badgeEn: 'Saran Clinic',
    badgeTa: 'சரண் முதன்மை சிகிச்சை மையம்',
    storyEn: 'Streamlined appointment scheduling, intelligent token triage, and emergency severity screening across outpatient desks.',
    storyTa: 'முன்பதிவுகள், தானியங்கி டோக்கன் மேலாண்மை மற்றும் தீவிர அவசரநிலை கண்டறிதல் வசதி.',
    capabilities: ['Smart Token Booking', 'Symptom Triage', 'Slot Conflict Guard', 'Prescription Desk'],
  },
  vet_clinic: {
    role: 'Dr. Murugan Velu (Veterinary Officer)',
    email: 'doctor@govtvetmedcentre.tn.gov.in',
    username: 'vet_admin',
    badgeEn: 'Government Veterinary Medical Centre',
    badgeTa: 'அரசு கால்நடை மருத்துவ மையம்',
    storyEn: 'Pet care appointments, livestock checkups, vaccination alerts, and voice triage for village farmers.',
    storyTa: 'செல்லப்பிராணிகள் & கால்நடைகளுக்கான மருத்துவப் பதிவு, அவசர சிகிச்சை மற்றும் தடுப்பூசி எச்சரிக்கைகள்.',
    capabilities: ['Livestock Intake', 'Farm Visit Routing', 'Urgent Symptom Alarm', 'Multilingual Audio'],
  },
  hotel_lodge: {
    role: 'R. Senthil Nathan (Front Desk Manager)',
    email: 'reservations@saranhotel.com',
    username: 'hotel_admin',
    badgeEn: 'Saran Hotel',
    badgeTa: 'சரண் ஹெரிடேஜ் விடுதி',
    storyEn: '24/7 automated room reservations, check-in logistics, tariff inquiries, and bilingual guest hospitality.',
    storyTa: '24 மணி நேர அறை முன்பதிவு, சோதனை நேரம், கட்டண விபரம் மற்றும் விருந்தினர் குரல் வரவேற்பு.',
    capabilities: ['Instant Availability', 'Tariff & AC Queries', 'Late Arrival Alerts', 'Auto Confirmation'],
  },
  restaurant: {
    role: 'Chef Sundaram Chettiar (Restaurant Manager)',
    email: 'orders@saranrestaurant.com',
    username: 'restaurant_admin',
    badgeEn: 'Saran Restaurant',
    badgeTa: 'சரண் உணவகம்',
    storyEn: 'Table reservations, catering orders, daily specials Q&A, and banquet booking powered by natural voice AI.',
    storyTa: 'மேஜை முன்பதிவு, சுபமுகூர்த்த கேட்டரிங் ஆர்டர்கள் மற்றும் அன்றாட சிறப்பு உணவு வழிகாட்டி.',
    capabilities: ['Table Booking', 'Catering Orders', 'Cuisine Menu Bot', 'Party Hall Inquiries'],
  },
  coaching: {
    role: 'Prof. Vigneshwaran K (Academic Director)',
    email: 'admissions@sarancoaching.com',
    username: 'coaching_admin',
    badgeEn: 'Saran Coaching Centre',
    badgeTa: 'சரண் பயிற்சி மையம்',
    storyEn: 'Course admissions, batch schedules, syllabus inquiries, and demo session bookings in clear Tamil and English.',
    storyTa: 'போட்டித் தேர்வுப் பயிற்சி சேர்க்கை, வகுப்பு அட்டவணை, கட்டண விளக்கம் மற்றும் இலவச மாதிரி வகுப்புகள்.',
    capabilities: ['Batch Enrollments', 'Exam Syllabus Guide', 'Demo Class Booking', 'Parent Helpline'],
  },
};

export const SectorLoginCard: React.FC<SectorLoginCardProps> = ({
  sector,
  onBack,
  onLoginSuccess,
  onOpenRegister,
}) => {
  const { login } = useAuth();
  const theme = getSectorTheme(sector.id);
  const meta = SECTOR_META[sector.id] || {
    role: 'Workspace Administrator',
    email: `${sector.id}@vaayil.ai`,
    username: `${sector.id}_admin`,
    badgeEn: sector.name,
    badgeTa: sector.display_name_ta,
    storyEn: sector.tagline_en,
    storyTa: sector.tagline_ta,
    capabilities: ['Voice Agent Desk', 'Tamil Recognition', 'Real-time Triage', 'Audit Logs'],
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your registered Gmail/username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(identifier.trim(), password);
      onLoginSuccess();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify your Gmail address and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl"
      style={{
        background: '#080B18',
        border: `1px solid ${theme.borderHighlight}`,
        boxShadow: `0 0 60px ${theme.glow}, 0 25px 70px rgba(0,0,0,0.9)`,
      }}
    >
      {/* Top Accent Gradient Bar */}
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, #32D8E8 0%, ${theme.accent} 50%, ${theme.accentSecondary} 100%)`,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* ============================================================
            LEFT COLUMN: 3D Visual Artwork, Branding & Storytelling
            ============================================================ */}
        <div
          className="lg:col-span-5 relative flex flex-col justify-between p-6 sm:p-8 overflow-hidden border-b lg:border-b-0 lg:border-r"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: `radial-gradient(circle at 20% 20%, ${theme.accent}20 0%, #080B18 85%)`,
          }}
        >
          {/* Subtle Sector 3D Image Artwork in Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen bg-cover bg-center"
            style={{
              backgroundImage: `url(${theme.imagePath})`,
              filter: 'blur(1px) contrast(1.1)',
            }}
          />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#32D8E8] animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider text-[#32D8E8] uppercase font-semibold">
                Vaayil AI · Voice OS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E8EDF9] tracking-tight mb-1">
              Vaayil <span style={{ color: theme.accent }}>AI</span>
            </h1>
            <p className="text-xs text-[#9AA7BE] font-medium leading-relaxed font-tamil">
              ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் வாயில்.
            </p>
            <p className="text-[11px] text-[#9AA7BE]/80 tracking-wide mt-0.5">
              Every business. One voice at the door.
            </p>
          </div>

          {/* Middle 3D Sector Showcase Card */}
          <div className="relative z-10 my-6">
            <div
              className="p-4 rounded-xl border backdrop-blur-xl relative overflow-hidden"
              style={{
                background: 'rgba(16, 22, 38, 0.75)',
                borderColor: `${theme.accent}35`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    background: `${theme.accent}18`,
                    borderColor: `${theme.accent}45`,
                    color: theme.accent,
                  }}
                >
                  <DynamicIcon name={sector.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#E8EDF9] font-tamil leading-tight">
                    {meta.badgeTa}
                  </h3>
                  <p className="text-xs text-[#9AA7BE] font-medium">{meta.badgeEn}</p>
                </div>
              </div>

              {/* Story Description */}
              <p className="text-xs text-[#BAC7DF] font-tamil leading-relaxed mb-3">
                {meta.storyTa}
              </p>
              <p className="text-[11px] text-[#8695B0] leading-normal italic">
                "{meta.storyEn}"
              </p>

              {/* Animated AI Voice Waveform Visualizer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#32D8E8] animate-pulse" />
                  <span className="text-[11px] text-[#32D8E8] font-mono font-medium">
                    Gnani Prisma Voice Engine
                  </span>
                </div>
                {/* 6-bar audio visualizer */}
                <div className="flex items-center gap-1 h-4">
                  {[40, 75, 100, 60, 85, 45].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ background: theme.accent }}
                      animate={{
                        height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`],
                      }}
                      transition={{
                        duration: 0.9 + i * 0.15,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Capabilities Pills */}
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-mono tracking-wider text-[#7E8CA3] mb-2 font-semibold">
              Included Voice Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meta.capabilities.map((cap, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#C6D2E8]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN: Authentication Form & Instant Demo Entry
            ============================================================ */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-[#0B0F20]/90">
          <div>
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between gap-2 mb-6">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#9AA7BE] hover:text-[#E8EDF9] transition-colors cursor-pointer border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg group"
                title="Back to Business Selection"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-[#42D6A4] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42D6A4]" />
                Live TN Sector Ready
              </div>
            </div>

            {/* Sector Welcome Title */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8EDF9] tracking-tight">
                Sign in to {sector.name}
              </h2>
              <p className="text-xs text-[#9AA7BE] mt-1">
                Access your sector dashboard, live call logs, appointments, and voice engine controls.
              </p>
            </div>

            {/* Single Gmail Account Callout */}
            <div
              className="mb-5 p-3.5 rounded-xl border relative overflow-hidden"
              style={{
                background: 'rgba(50, 216, 232, 0.05)',
                borderColor: 'rgba(50, 216, 232, 0.20)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#32D8E8]/15 border border-[#32D8E8]/30 flex items-center justify-center shrink-0 text-[#32D8E8] mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#E8EDF9]">
                    One Gmail Account · All Six Workspaces
                  </p>
                  <p className="text-[11px] text-[#9AA7BE] mt-0.5 leading-relaxed">
                    Sign in with your registered Gmail address to access {sector.name}.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-xs border"
                style={{
                  background: 'rgba(255, 100, 124, 0.10)',
                  borderColor: 'rgba(255, 100, 124, 0.35)',
                  color: '#FF889B',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF647C]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#FF647C]">Login Error</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Username or Email Input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#BAC7DF] mb-1.5 font-mono">
                  Username or Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7E8CA3] pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none transition-all"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    placeholder={`e.g. ${meta.username} or ${meta.email}`}
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#BAC7DF] font-mono">
                    Password
                  </label>
                  <span className="text-[11px] text-[#7E8CA3] font-mono">
                    Demo pass: vaayil123
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7E8CA3] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-[#E8EDF9] placeholder-[#59667D] outline-none transition-all"
                    style={{
                      background: 'rgba(16, 22, 38, 0.85)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7E8CA3] hover:text-[#E8EDF9] bg-transparent border-none cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-none transition-all mt-2 disabled:opacity-60 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSecondary} 100%)`,
                  color: '#080B18',
                  boxShadow: `0 4px 20px ${theme.glow}`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to {sector.name}</span>
                  </>
                )}
              </button>

              {/* Register Link */}
              {onOpenRegister && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="text-xs text-[#32D8E8] hover:underline bg-transparent border-none cursor-pointer font-medium"
                  >
                    New here? Create one account for all six workspaces →
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Bottom Security Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#7E8CA3]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#42D6A4]" />
              <span>JWT Signed · Sector RBAC Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Need help?</span>
              <a
                href="#hub"
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
                className="text-[#32D8E8] hover:underline"
              >
                Return to Hub
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
