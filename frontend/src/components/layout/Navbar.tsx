import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Layers, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { DynamicIcon } from '../ui/Icons';

interface NavbarProps {
  is3DMode: boolean;
  setIs3DMode: (val: boolean) => void;
  onReturnHub?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  is3DMode,
  setIs3DMode,
  onReturnHub,
}) => {
  const { user, activeSector, logout, health } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3.5 backdrop-blur-md bg-slate-950/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={onReturnHub}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-slate-950 text-xl font-tamil">வா</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-ping opacity-75" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Vaayil AI
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-tamil">
                வாயில்
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
              Every business. One voice at the door.
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Backend / Gnani Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs">
            {health?.status === 'healthy' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">
              API: <span className="text-emerald-400 font-semibold">{health?.status || 'Connecting'}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Gnani {health?.gnani_stt_configured ? 'Online' : 'Config Ready'}
            </span>
          </div>

          {/* 3D vs 2D Mode Switcher */}
          {!user && (
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10 shadow-inner">
              <button
                onClick={() => setIs3DMode(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  is3DMode
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="3D Orbit View"
                aria-label="Switch to 3D Orbit View"
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D Hub</span>
              </button>
              <button
                onClick={() => setIs3DMode(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !is3DMode
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="2D Card Grid View (Reduced Motion)"
                aria-label="Switch to 2D Card Grid View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2D Grid</span>
              </button>
            </div>
          )}

          {/* User Account State */}
          {user && activeSector && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${activeSector.accent_color}25`, color: activeSector.accent_color }}
                >
                  <DynamicIcon name={activeSector.icon} className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-bold text-white leading-tight font-tamil">
                    {activeSector.display_name_ta.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user.username} ({user.role})
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
