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
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { user, activeSector, logout, isLoading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [loadingSectors, setLoadingSectors] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch registered sectors from backend
  useEffect(() => {
    async function loadSectors() {
      try {
        setLoadingSectors(true);
        const data = await api.getSectors();
        setSectors(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setFetchError(err.message);
        } else {
          setFetchError('Failed to load sectors');
        }
      } finally {
        setLoadingSectors(false);
      }
    }
    loadSectors();
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIs3DMode(false);
    }
  }, []);

  if (authLoading || loadingSectors) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-2xl font-tamil text-slate-950 shadow-xl shadow-cyan-500/30 animate-pulse">
            வா
          </div>
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin absolute -bottom-2 -right-2" />
        </div>
        <p className="text-sm font-semibold text-slate-300 font-tamil">
          வாயில் AI தொடங்குதல்...
        </p>
        <span className="text-xs text-slate-500 mt-1">Connecting to Vaayil backend & sector nodes</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white px-4">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Backend Connection Error</h2>
          <p className="text-xs text-rose-300 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the dedicated Sector Workspace
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

  // Unauthenticated Vaayil Hub Experience
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 relative overflow-hidden flex flex-col select-none">
      {/* Top Navbar */}
      <Navbar
        is3DMode={is3DMode}
        setIs3DMode={setIs3DMode}
        onReturnHub={() => setSelectedSector(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex items-center justify-center w-full min-h-screen pt-14">
        <div className="w-full h-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center relative">
          {/* 3D Hub View */}
          {is3DMode ? (
            <div className="absolute inset-0 w-full h-full">
              <VaayilHub3D
                sectors={sectors}
                selectedSector={selectedSector}
                onSelectSector={(sec) => setSelectedSector(sec)}
              />
            </div>
          ) : (
            // 2D Card Carousel Fallback
            <div className="w-full py-8">
              <VaayilHub2D
                sectors={sectors}
                selectedSector={selectedSector}
                onSelectSector={(sec) => setSelectedSector(sec)}
              />
            </div>
          )}

          {/* Overlay Login Card (Modal/Overlay when a sector is clicked) */}
          <AnimatePresence>
            {selectedSector && (
              <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                <SectorLoginCard
                  sector={selectedSector}
                  onBack={() => setSelectedSector(null)}
                  onLoginSuccess={() => setSelectedSector(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Bottom Hub Hint when in 3D mode without selection */}
          {is3DMode && !selectedSector && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10"
            >
              <div className="px-4 py-2 rounded-full glass-panel border border-cyan-500/25 text-xs text-slate-300 flex items-center gap-2 shadow-2xl backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-tamil">துறையை தேர்வு செய்ய கிளிக் செய்யவும்</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Click any sector node to sign in</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
