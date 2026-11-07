import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  AlertCircle,
  Box,
  Layers,
  Shield,
  User as UserIcon,
  Power,
  Server,
} from 'lucide-react';

interface NavbarProps {
  is3DMode: boolean;
  setIs3DMode: (val: boolean) => void;
  onReturnHub?: () => void;
  onOpenUserAuth?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAdminDashboard?: () => void;
}

/* Doorway arch SVG logo mark */
const VaayilLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <rect width="36" height="36" rx="10" fill="url(#vg)" />
    {/* arch shape */}
    <path
      d="M9 27V16.5C9 11.806 13.029 8 18 8C22.971 8 27 11.806 27 16.5V27"
      stroke="#E8EDF9"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* door columns */}
    <line x1="9" y1="27" x2="9" y2="27" stroke="#E8EDF9" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="27" y1="27" x2="27" y2="27" stroke="#E8EDF9" strokeWidth="2.2" strokeLinecap="round" />
    {/* inner glow dot */}
    <circle cx="18" cy="18" r="2.5" fill="#32D8E8" opacity="0.9" />
    <defs>
      <linearGradient id="vg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#17152D" />
        <stop offset="1" stopColor="#101626" />
      </linearGradient>
    </defs>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  is3DMode,
  setIs3DMode,
  onReturnHub,
  onOpenUserAuth,
  onOpenAdminLogin,
  onOpenAdminDashboard,
}) => {
  const { user, isAdmin, logout, health } = useAuth();
  const isHealthy = health?.status === 'healthy';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 sm:px-6"
      style={{ background: 'rgba(8,11,24,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        {/* ── Brand ── */}
        <button
          onClick={onReturnHub}
          className="flex items-center gap-3 select-none group cursor-pointer border-none bg-transparent p-0"
          aria-label="Vaayil AI home"
        >
          <VaayilLogo size={36} />
          <div className="flex flex-col text-left leading-none">
            <span
              className="text-sm font-bold tracking-wide text-[#E8EDF9] group-hover:text-[#A58EFF] transition-colors duration-200"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              VAAYIL AI
            </span>
            <span className="text-[10px] text-[#9AA7BE] hidden sm:block mt-0.5">
              Every business. One voice at the door.
            </span>
          </div>
        </button>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status badge */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(16,22,38,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {isHealthy ? (
              <CheckCircle2 className="w-3 h-3 text-[#42D6A4] shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 text-[#FFBF69] shrink-0" />
            )}
            <span className="text-[#9AA7BE]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Gnani&nbsp;
              <span className={isHealthy ? 'text-[#42D6A4]' : 'text-[#FFBF69]'}>
                {isHealthy ? 'Online' : 'Connecting'}
              </span>
            </span>
          </div>

          {/* 3D / 2D toggle — only shown on Hub (not logged in) */}
          {!user && (
            <div
              className="flex items-center p-1 rounded-xl"
              style={{
                background: 'rgba(16,22,38,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={() => setIs3DMode(true)}
                title="3D Hub view"
                aria-label="Switch to 3D Hub view"
                aria-pressed={is3DMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  is3DMode
                    ? 'bg-[#8065FF] text-white shadow-sm'
                    : 'text-[#9AA7BE] hover:text-[#E8EDF9]'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D</span>
              </button>
              <button
                onClick={() => setIs3DMode(false)}
                title="2D grid view"
                aria-label="Switch to 2D grid view"
                aria-pressed={!is3DMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  !is3DMode
                    ? 'bg-[#A58EFF] text-[#080B18] shadow-sm'
                    : 'text-[#9AA7BE] hover:text-[#E8EDF9]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2D</span>
              </button>
            </div>
          )}

          {/* Authentication Action Buttons */}
          {!user ? (
            <div className="flex items-center gap-2">
              {/* User Login & Register button */}
              <button
                type="button"
                onClick={onOpenUserAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#32D8E8]/10 hover:bg-[#32D8E8]/20 text-[#32D8E8] border border-[#32D8E8]/30 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">User Sign In / Register</span>
                <span className="sm:hidden">Sign In</span>
              </button>

              {/* Admin Portal button */}
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#8065FF]/15 hover:bg-[#8065FF]/25 text-[#A58EFF] border border-[#8065FF]/35 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={onOpenAdminDashboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8065FF]/20 text-[#A58EFF] border border-[#8065FF]/40 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Admin Hub</span>
                </button>
              ) : (
                <span className="text-xs text-[#9AA7BE] font-mono hidden sm:inline">
                  {user.full_name} ({user.role})
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#FF647C] bg-[#FF647C]/10 border border-[#FF647C]/30 hover:bg-[#FF647C]/20 transition-all cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}

          {/* Language hint chips */}
          <div
            className="hidden md:flex items-center gap-1.5 text-[10px] text-[#9AA7BE]"
            style={{ fontFamily: 'Noto Sans Tamil, sans-serif' }}
          >
            <span
              className="px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,22,38,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              தமிழ்
            </span>
            <span className="text-[#4A5568]">|</span>
            <span
              className="px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,22,38,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Tanglish
            </span>
            <span className="text-[#4A5568]">|</span>
            <span
              className="px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,22,38,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              English
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
