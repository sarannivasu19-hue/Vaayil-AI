import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Sector } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { SectorLoginCard } from './components/hub/SectorLoginCard';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { SectorBackground } from './components/world/SectorBackground';
import { SectorTransitionIntro } from './components/world/SectorTransitionIntro';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { VaayilHubHero } from './components/hub/VaayilHubHero';
import { DistrictSelector } from './components/hub/DistrictSelector';
import { SectorSelector } from './components/hub/SectorSelector';
import { BusinessSelector } from './components/hub/BusinessSelector';
import type { TNDistrict } from './data/tamilNaduDistricts';
import type { SectorCategory } from './components/hub/SectorSelector';
import { AlertCircle } from 'lucide-react';

/* ── Navigation states ── */
type NavState = 'hero' | 'district' | 'sector' | 'business' | 'login';

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
            <stop stopColor="#17152D" />
            <stop offset="1" stopColor="#101626" />
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
        className="text-2xl font-bold text-[#E8EDF9] tracking-tight"
        style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
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
  const [loadingSectors, setLoadingSectors] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Navigation state machine with persistent district memory
  const [navState, setNavState] = useState<NavState>('hero');
  const [selectedDistrict, setSelectedDistrict] = useState<TNDistrict | null>(() => {
    try {
      const saved = localStorage.getItem('vaayil_active_district');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedSectorCategory, setSelectedSectorCategory] = useState<SectorCategory | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Authentication Modals
  const [showUserAuthModal, setShowUserAuthModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Save selected district to localStorage whenever changed
  useEffect(() => {
    if (selectedDistrict) {
      localStorage.setItem('vaayil_active_district', JSON.stringify(selectedDistrict));
    }
  }, [selectedDistrict]);

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

  // Sync navigation state with browser history (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.navState) {
        setNavState(state.navState);
        if (state.district !== undefined) setSelectedDistrict(state.district);
        if (state.sectorCategory !== undefined) setSelectedSectorCategory(state.sectorCategory);
        if (state.sector !== undefined) setSelectedSector(state.sector);
        setShowIntro(false);
      } else {
        // Default to hero if no state recorded
        setNavState('hero');
        setShowIntro(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /* ── Navigation handlers with browser history support ── */
  const handleDistrictSelected = (district: TNDistrict) => {
    setSelectedDistrict(district);
    setNavState('sector');
    window.history.pushState(
      { navState: 'sector', district, sectorCategory: null, sector: null },
      '',
      `#sector-${district.id}`
    );
  };

  const handleSectorCategorySelected = (sectorCat: SectorCategory) => {
    setSelectedSectorCategory(sectorCat);
    setNavState('business');
    window.history.pushState(
      { navState: 'business', district: selectedDistrict, sectorCategory: sectorCat, sector: null },
      '',
      `#business-${sectorCat.id}`
    );
  };

  const handleBusinessSelected = (sec: Sector) => {
    setSelectedSector(sec);
    setShowIntro(true);
    setNavState('login');
    window.history.pushState(
      { navState: 'login', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: sec },
      '',
      `#login-${sec.id}`
    );
  };

  const handleNavigateToDistrict = () => {
    setNavState('district');
    window.history.pushState(
      { navState: 'district', district: null, sectorCategory: null, sector: null },
      '',
      '#district'
    );
  };

  const handleBackToHero = () => {
    setNavState('hero');
    setSelectedDistrict(null);
    setSelectedSectorCategory(null);
    setSelectedSector(null);
    setShowIntro(false);
    window.history.pushState({ navState: 'hero' }, '', window.location.pathname);
  };

  const handleBackToDistrict = () => {
    setNavState('district');
    setSelectedSectorCategory(null);
    setSelectedSector(null);
    setShowIntro(false);
    window.history.pushState(
      { navState: 'district', district: selectedDistrict, sectorCategory: null, sector: null },
      '',
      '#district'
    );
  };

  const handleBackToSector = () => {
    setNavState('sector');
    setSelectedSector(null);
    setShowIntro(false);
    window.history.pushState(
      { navState: 'sector', district: selectedDistrict, sectorCategory: null, sector: null },
      '',
      `#sector-${selectedDistrict?.id || ''}`
    );
  };

  const handleBackToBusiness = () => {
    setNavState('business');
    setSelectedSector(null);
    setShowIntro(false);
    window.history.pushState(
      { navState: 'business', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null },
      '',
      `#business-${selectedSectorCategory?.id || ''}`
    );
  };

  if (authLoading || loadingSectors) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen error={fetchError} />;

  /* ============================================================
     1. AUTHENTICATED PLATFORM EXPERIENCES
     ============================================================ */
  if (user && user.role === 'admin') {
    return <AdminDashboardView sectors={sectors} onReturnHub={logout} />;
  }

  if (user && activeSector) {
    return (
      <WorkspaceShell
        sector={activeSector}
        user={user}
        district={selectedDistrict}
        onLogout={logout}
        onReturnHub={logout}
      />
    );
  }

  /* ============================================================
     2. PUBLIC NAVIGATION FLOW (UNAUTHENTICATED)
     ============================================================ */

  // Hero page
  if (navState === 'hero') {
    return (
      <>
        <VaayilHubHero
          onSelectDistrict={handleNavigateToDistrict}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          onOpenUserLogin={() => setShowUserAuthModal(true)}
        />
        <UserAuthModal
          isOpen={showUserAuthModal}
          onClose={() => setShowUserAuthModal(false)}
          sectors={sectors}
          initialSector={null}
          onSuccess={() => setShowUserAuthModal(false)}
          onOpenAdminLogin={() => {
            setShowUserAuthModal(false);
            setShowAdminLoginModal(true);
          }}
        />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => setShowAdminLoginModal(false)}
          onOpenUserLogin={() => {
            setShowAdminLoginModal(false);
            setShowUserAuthModal(true);
          }}
        />
      </>
    );
  }

  // District selector
  if (navState === 'district') {
    return (
      <>
        <DistrictSelector
          onSelectDistrict={handleDistrictSelected}
          onBack={handleBackToHero}
        />
        <UserAuthModal
          isOpen={showUserAuthModal}
          onClose={() => setShowUserAuthModal(false)}
          sectors={sectors}
          initialSector={null}
          onSuccess={() => setShowUserAuthModal(false)}
          onOpenAdminLogin={() => {
            setShowUserAuthModal(false);
            setShowAdminLoginModal(true);
          }}
        />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => setShowAdminLoginModal(false)}
          onOpenUserLogin={() => {
            setShowAdminLoginModal(false);
            setShowUserAuthModal(true);
          }}
        />
      </>
    );
  }

  // Sector category selector
  if (navState === 'sector' && selectedDistrict) {
    return (
      <>
        <SectorSelector
          district={selectedDistrict}
          onSelectSector={handleSectorCategorySelected}
          onBack={handleBackToDistrict}
        />
        <UserAuthModal
          isOpen={showUserAuthModal}
          onClose={() => setShowUserAuthModal(false)}
          sectors={sectors}
          initialSector={null}
          onSuccess={() => setShowUserAuthModal(false)}
          onOpenAdminLogin={() => {
            setShowUserAuthModal(false);
            setShowAdminLoginModal(true);
          }}
        />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => setShowAdminLoginModal(false)}
          onOpenUserLogin={() => {
            setShowAdminLoginModal(false);
            setShowUserAuthModal(true);
          }}
        />
      </>
    );
  }

  // Business selector
  if (navState === 'business' && selectedDistrict && selectedSectorCategory) {
    return (
      <>
        <BusinessSelector
          district={selectedDistrict}
          sectorCategory={selectedSectorCategory}
          onSelectBusiness={handleBusinessSelected}
          onBack={handleBackToSector}
          onBackToDistricts={handleBackToDistrict}
        />
        <UserAuthModal
          isOpen={showUserAuthModal}
          onClose={() => setShowUserAuthModal(false)}
          sectors={sectors}
          initialSector={null}
          onSuccess={() => setShowUserAuthModal(false)}
          onOpenAdminLogin={() => {
            setShowUserAuthModal(false);
            setShowAdminLoginModal(true);
          }}
        />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => setShowAdminLoginModal(false)}
          onOpenUserLogin={() => {
            setShowAdminLoginModal(false);
            setShowUserAuthModal(true);
          }}
        />
      </>
    );
  }

  /* ============================================================
     3. LOGIN OVERLAY (Sector Login Card + Intro Animation)
     ============================================================ */
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col select-none"
      style={{ background: '#080B18', color: '#E8EDF9' }}
    >
      {/* Back button */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={handleBackToBusiness}
          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer border-none px-3 py-2 rounded-xl text-slate-200 transition-colors"
          style={{
            background: 'rgba(16,22,38,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          title="Back to Business & Services"
        >
          <span>← Back to Businesses</span>
        </button>
        <button
          onClick={handleBackToSector}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium cursor-pointer border-none px-3 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          style={{
            background: 'rgba(16,22,38,0.70)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          title="Back to Categories"
        >
          <span>Categories</span>
        </button>
      </div>

      {/* Sector Transition Intro (1.5s skippable doorway portal) */}
      <AnimatePresence>
        {selectedSector && showIntro && (
          <SectorTransitionIntro
            sector={selectedSector}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* Full Immersive Sector World Login Overlay */}
      <AnimatePresence>
        {selectedSector && !showIntro && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Immersive Photographic & Gradient Sector Background */}
            <SectorBackground sectorId={selectedSector.id} mode="immersive" />

            {/* Frosted panel overlay for login card */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

            {/* Sector Login Card centered on top with widescreen desktop layout */}
            <div className="relative z-10 w-full max-w-4xl xl:max-w-5xl my-auto py-4">
              <SectorLoginCard
                sector={selectedSector}
                onBack={handleBackToBusiness}
                onLoginSuccess={handleBackToHero}
                onOpenRegister={() => {
                  setSelectedSector(null);
                  setNavState('hero');
                  setShowUserAuthModal(true);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modals */}
      <UserAuthModal
        isOpen={showUserAuthModal}
        onClose={() => setShowUserAuthModal(false)}
        sectors={sectors}
        initialSector={selectedSector}
        onSuccess={() => setShowUserAuthModal(false)}
        onOpenAdminLogin={() => {
          setShowUserAuthModal(false);
          setShowAdminLoginModal(true);
        }}
      />
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => setShowAdminLoginModal(false)}
        onOpenUserLogin={() => {
          setShowAdminLoginModal(false);
          setShowUserAuthModal(true);
        }}
      />
    </div>
  );
};
