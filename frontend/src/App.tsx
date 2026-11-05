import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Sector } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { VaayilHub3D } from './components/hub/VaayilHub3D';
import { VaayilHub2D } from './components/hub/VaayilHub2D';
import { SectorLoginCard } from './components/hub/SectorLoginCard';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { AlertCircle } from 'lucide-react';

/* ── Loading screen ── */
const LoadingScreen: React.FC = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center gap-5"
    style={{ background: '#080B18' }}
  >
    <div className="relative">
      {/* Arch pulse */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="animate-pulse-glow">
        <rect width="64" height="64" rx="18" fill="url(#lg-load)" />
        <path
          d="M14 50V29C14 19.611 22.059 12 32 12C41.941 12 50 19.611 50 29V50"
          stroke="#A58EFF"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="31" r="4" fill="#32D8E8" opacity="0.9" />
        <defs>
          <linearGradient id="lg-load" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#17152D"/>
            <stop offset="1" stopColor="#101626"/>
          </linearGradient>
        </defs>
      </svg>
      {/* Rotating ring */}
      <div
        className="absolute inset-0 rounded-[18px] border-2 border-transparent animate-spin"
        style={{
          borderTopColor: '#8065FF',
          borderRightColor: 'transparent',
          animationDuration: '1.4s',
        }}
      />
    </div>

    <div className="text-center space-y-1.5">
      <h1
        className="text-2xl font-bold text-[#E8EDF9] tracking-wide"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        VAAYIL AI
      </h1>
      <p className="text-sm text-[#9AA7BE] font-tamil">வாயில் AI தொடங்குகிறது…</p>
      <p className="text-xs text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        Connecting to backend &amp; sector nodes
      </p>
    </div>
  </div>
);

/* ── Error screen ── */
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <div
    className="min-h-screen flex flex-col items-center justify-center px-4"
    style={{ background: '#080B18' }}
  >
    <div
      className="w-full max-w-sm p-6 rounded-2xl text-center"
      style={{ background: '#101626', border: '1px solid rgba(255,100,124,0.30)' }}
    >
      <AlertCircle className="w-10 h-10 mx-auto mb-4 text-[#FF647C]" />
      <h2 className="text-base font-semibold text-[#E8EDF9] mb-2 font-heading">
        Backend Connection Error
      </h2>
      <p className="text-xs text-[#FF647C] mb-5 leading-relaxed break-words">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border-none"
        style={{ background: '#8065FF', color: '#fff' }}
      >
        Retry Connection
      </button>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { user, activeSector, logout, isLoading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [loadingSectors, setLoadingSectors] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSectors() {
      try {
        setLoadingSectors(true);
        const data = await api.getSectors();
        setSectors(data);
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load sectors');
      } finally {
        setLoadingSectors(false);
      }
    }
    loadSectors();
  }, []);

  /* Respect reduced motion */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setIs3DMode(false);
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setIs3DMode(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (authLoading || loadingSectors) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen error={fetchError} />;

  /* Authenticated workspace */
  if (user && activeSector) {
    return (
      <WorkspaceShell
        sector={activeSector}
        user={user}
        onLogout={logout}
        onReturnHub={logout}
      />
    );
  }

  /* Unauthenticated — Hub */
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col select-none"
      style={{ background: '#080B18', color: '#E8EDF9' }}
    >
      <Navbar
        is3DMode={is3DMode}
        setIs3DMode={setIs3DMode}
        onReturnHub={() => setSelectedSector(null)}
      />

      <main className="flex-1 relative flex items-center justify-center w-full min-h-screen pt-14">
        <div className="w-full h-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center relative">

          {is3DMode ? (
            <div className="absolute inset-0 w-full h-full">
              <VaayilHub3D
                sectors={sectors}
                selectedSector={selectedSector}
                onSelectSector={(sec) => setSelectedSector(sec)}
              />
            </div>
          ) : (
            <div className="w-full py-8">
              <VaayilHub2D
                sectors={sectors}
                selectedSector={selectedSector}
                onSelectSector={(sec) => setSelectedSector(sec)}
              />
            </div>
          )}

          {/* Login card overlay */}
          <AnimatePresence>
            {selectedSector && (
              <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <SectorLoginCard
                  sector={selectedSector}
                  onBack={() => setSelectedSector(null)}
                  onLoginSuccess={() => setSelectedSector(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Hub hint */}
          {is3DMode && !selectedSector && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10"
            >
              <div
                className="px-4 py-2 rounded-full text-xs flex items-center gap-2.5 shadow-xl backdrop-blur-xl"
                style={{
                  background: 'rgba(16,22,38,0.75)',
                  border: '1px solid rgba(50,216,232,0.20)',
                  color: '#9AA7BE',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#32D8E8] animate-ping" />
                <span className="font-tamil">துறையை தேர்வு செய்ய கிளிக் செய்யவும்</span>
                <span style={{ color: '#4A5568' }}>•</span>
                <span>Click any sector to sign in</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
