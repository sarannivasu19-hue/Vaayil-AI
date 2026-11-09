import React, { useState, useEffect, useMemo } from 'react';
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
import { VaayilHub2D } from './components/hub/VaayilHub2D';
import { DistrictSelector } from './components/hub/DistrictSelector';
import { SectorSelector } from './components/hub/SectorSelector';
import { BusinessSelector } from './components/hub/BusinessSelector';
import type { TNDistrict } from './data/tamilNaduDistricts';
import type { SectorCategory } from './components/hub/SectorSelector';
import { AlertCircle, Mic, LogOut, MapPin } from 'lucide-react';

/*
 * Navigation State Machine
 *
 * Public flow  : hero → district → sector → business → login → (workspace)
 * Authenticated: workspace (can go back to sector/district without logging out)
 * Exit         : clears session, replaces history to prevent back-to-workspace
 *
 * Every forward navigation uses pushState so the browser Back button steps
 * back one entry at a time.  The workspace step also gets its own history
 * entry so Back from workspace lands on the business/login screen.
 */

type NavState = 'hero' | 'district' | 'sector' | 'business' | 'login' | 'workspace';

const LS_DISTRICT = 'vaayil_active_district';
const LS_SECTOR_CAT = 'vaayil_active_sector_cat';
const LS_SECTOR = 'vaayil_active_sector';

function readLS<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore quota */ }
}

function getInitialNavState(): {
  navState: NavState;
  district: TNDistrict | null;
  sectorCategory: SectorCategory | null;
  sector: Sector | null;
} {
  const hash = window.location.hash;
  const savedDistrict = readLS<TNDistrict>(LS_DISTRICT);
  const savedSectorCat = readLS<SectorCategory>(LS_SECTOR_CAT);
  const savedSector = readLS<Sector>(LS_SECTOR);
  const token = localStorage.getItem('vaayil_token');

  if (hash.startsWith('#workspace') && token) {
    return { navState: 'workspace', district: savedDistrict, sectorCategory: savedSectorCat, sector: savedSector };
  }
  if (hash.startsWith('#login') && savedSector) {
    return { navState: 'login', district: savedDistrict, sectorCategory: savedSectorCat, sector: savedSector };
  }
  if (hash.startsWith('#business') && savedDistrict && savedSectorCat) {
    return { navState: 'business', district: savedDistrict, sectorCategory: savedSectorCat, sector: savedSector };
  }
  if (hash.startsWith('#sector') && savedDistrict) {
    return { navState: 'sector', district: savedDistrict, sectorCategory: savedSectorCat, sector: null };
  }
  if (hash === '#district') {
    return { navState: 'district', district: null, sectorCategory: null, sector: null };
  }
  return { navState: 'hero', district: null, sectorCategory: null, sector: null };
}

/* ── Loading screen ── */
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#080B18' }}>
    <div className="relative">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="animate-pulse-glow">
        <rect width="64" height="64" rx="18" fill="url(#lg-load)" />
        <path d="M14 50V29C14 19.611 22.059 12 32 12C41.941 12 50 19.611 50 29V50" stroke="#A58EFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="31" r="4" fill="#32D8E8" opacity="0.9" />
        <defs>
          <linearGradient id="lg-load" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#17152D" />
            <stop offset="1" stopColor="#101626" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 rounded-[18px] border-2 border-transparent animate-spin" style={{ borderTopColor: '#8065FF', borderRightColor: 'transparent', animationDuration: '1.4s' }} />
    </div>
    <div className="text-center space-y-1.5">
      <h1 className="text-2xl font-bold text-[#E8EDF9] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>VAAYIL AI</h1>
      <p className="text-sm text-[#9AA7BE] font-tamil">வாயில் AI தொடங்குகிறது…</p>
      <p className="text-xs text-[#4A5568]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Connecting to backend &amp; sector nodes</p>
    </div>
  </div>
);

/* ── Error screen ── */
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#080B18' }}>
    <div className="w-full max-w-sm p-6 rounded-2xl text-center" style={{ background: '#101626', border: '1px solid rgba(255,100,124,0.30)' }}>
      <AlertCircle className="w-10 h-10 mx-auto mb-4 text-[#FF647C]" />
      <h2 className="text-base font-semibold text-[#E8EDF9] mb-2 font-heading">Backend Connection Error</h2>
      <p className="text-xs text-[#FF647C] mb-5 leading-relaxed break-words">{error}</p>
      <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border-none" style={{ background: '#8065FF', color: '#fff' }}>
        Retry Connection
      </button>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { user, activeSector, logout, switchSector, isLoading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ── Navigation state with direct URL / refresh restoration ── */
  const initialNav = useMemo(() => getInitialNavState(), []);
  const [navState, setNavState] = useState<NavState>(initialNav.navState);
  const [selectedDistrict, setSelectedDistrict] = useState<TNDistrict | null>(() => initialNav.district || readLS<TNDistrict>(LS_DISTRICT));
  const [selectedSectorCategory, setSelectedSectorCategory] = useState<SectorCategory | null>(() => initialNav.sectorCategory || readLS<SectorCategory>(LS_SECTOR_CAT));
  const [selectedSector, setSelectedSector] = useState<Sector | null>(() => initialNav.sector || readLS<Sector>(LS_SECTOR));
  const [showIntro, setShowIntro] = useState<boolean>(false);

  /*
   * forceShowHub — when true, the user is still authenticated but we show
   * the public navigation flow (Back from workspace without logout).
   * Set to true by handleBackFromWorkspace, false by handleLoginSuccess / handleExit.
   */
  const [forceShowHub, setForceShowHub] = useState<boolean>(false);

  /* ── Auth modals ── */
  const [showUserAuthModal, setShowUserAuthModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  /* ── Sector list ── */
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

  /* ── Browser Back / Forward ── */
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const s = e.state as null | {
        navState?: NavState;
        step?: number;
        district?: TNDistrict | null;
        sectorCategory?: SectorCategory | null;
        sector?: Sector | null;
        forceShowHub?: boolean;
      };

      if (s?.navState) {
        setNavState(s.navState);
        setForceShowHub(s.forceShowHub ?? (s.navState !== 'workspace'));
        if (s.district !== undefined) {
          setSelectedDistrict(s.district);
          writeLS(LS_DISTRICT, s.district);
        }
        if (s.sectorCategory !== undefined) {
          setSelectedSectorCategory(s.sectorCategory);
          writeLS(LS_SECTOR_CAT, s.sectorCategory);
        }
        if (s.sector !== undefined) {
          setSelectedSector(s.sector);
          writeLS(LS_SECTOR, s.sector);
        }
        setShowIntro(false);
      } else {
        const fallback = getInitialNavState();
        setNavState(fallback.navState);
        setForceShowHub(false);
        setShowIntro(false);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  /* ── Forward navigation handlers (pushState with sequential step) ── */

  const handleNavigateToDistrict = () => {
    setNavState('district');
    window.history.pushState({ navState: 'district', step: 1, district: null, sectorCategory: null, sector: null }, '', '#district');
  };

  const handleDistrictSelected = (district: TNDistrict) => {
    setSelectedDistrict(district);
    writeLS(LS_DISTRICT, district);
    if (user) {
      setNavState('workspace');
      setForceShowHub(true);
      window.history.pushState(
        { navState: 'hub', step: 1, district, forceShowHub: true },
        '',
        '#hub'
      );
    } else {
      setNavState('sector');
      window.history.pushState({ navState: 'sector', step: 2, district, sectorCategory: null, sector: null }, '', `#sector-${district.id}`);
    }
  };

  const handleSectorCategorySelected = (sectorCat: SectorCategory) => {
    setSelectedSectorCategory(sectorCat);
    writeLS(LS_SECTOR_CAT, sectorCat);
    setNavState('business');
    window.history.pushState({ navState: 'business', step: 3, district: selectedDistrict, sectorCategory: sectorCat, sector: null }, '', `#business-${sectorCat.id}`);
  };

  const handleBusinessSelected = async (sec: Sector) => {
    setSelectedSector(sec);
    writeLS(LS_SECTOR, sec);

    // If user is already authenticated (e.g. via Gmail account), switch workspace directly
    if (user) {
      try {
        await switchSector(sec.id);
        setShowIntro(false);
        setNavState('workspace');
        setForceShowHub(false);
        window.history.pushState(
          { navState: 'workspace', step: 4, district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: sec },
          '',
          '#workspace'
        );
        return;
      } catch (err) {
        console.warn('Switch sector failed, falling back to login view:', err);
      }
    }

    setShowIntro(true);
    setNavState('login');
    window.history.pushState({ navState: 'login', step: 4, district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: sec }, '', `#login-${sec.id}`);
  };

  /*
   * Called when login/demo-login succeeds.
   */
  const handleLoginSuccess = () => {
    setShowIntro(false);
    if (selectedSector) {
      setNavState('workspace');
      setForceShowHub(false);
      window.history.replaceState(
        { navState: 'workspace', step: 4, district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: selectedSector },
        '',
        '#workspace',
      );
    } else {
      setNavState('workspace');
      setForceShowHub(true);
      window.history.replaceState(
        { navState: 'hub', step: 1, forceShowHub: true },
        '',
        '#hub',
      );
    }
  };

  /* ── Back navigation handlers (Use window.history.back when available to prevent duplicate forward entries) ── */

  const handleBackToHero = () => {
    if (window.history.state?.step !== undefined && window.history.state.step > 0) {
      window.history.back();
    } else {
      setNavState('hero');
      setSelectedDistrict(null);
      setSelectedSectorCategory(null);
      setSelectedSector(null);
      setShowIntro(false);
      writeLS(LS_DISTRICT, null);
      writeLS(LS_SECTOR_CAT, null);
      writeLS(LS_SECTOR, null);
      window.history.replaceState({ navState: 'hero', step: 0 }, '', window.location.pathname.replace(/#.*$/, ''));
    }
  };

  const handleBackToDistrict = () => {
    if (window.history.state?.step !== undefined && window.history.state.step > 1) {
      window.history.back();
    } else {
      setNavState('district');
      setSelectedSectorCategory(null);
      setSelectedSector(null);
      setShowIntro(false);
      writeLS(LS_SECTOR_CAT, null);
      writeLS(LS_SECTOR, null);
      window.history.replaceState({ navState: 'district', step: 1, district: selectedDistrict, sectorCategory: null, sector: null }, '', '#district');
    }
  };

  const handleBackToSector = () => {
    if (window.history.state?.step !== undefined && window.history.state.step > 2) {
      window.history.back();
    } else {
      setNavState('sector');
      setSelectedSector(null);
      setShowIntro(false);
      writeLS(LS_SECTOR, null);
      window.history.replaceState({ navState: 'sector', step: 2, district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null }, '', `#sector-${selectedDistrict?.id ?? ''}`);
    }
  };

  const handleBackToBusiness = () => {
    if (window.history.state?.step !== undefined && window.history.state.step > 3) {
      window.history.back();
    } else {
      setNavState('business');
      setSelectedSector(null);
      setShowIntro(false);
      writeLS(LS_SECTOR, null);
      window.history.replaceState({ navState: 'business', step: 3, district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null }, '', `#business-${selectedSectorCategory?.id ?? ''}`);
    }
  };

  /*
   * Back from workspace — returns to the main hub showing all 6 business workspaces WITHOUT logout.
   * The user stays authenticated; forceShowHub shows the 6-workspace hub dashboard.
   */
  const handleBackFromWorkspace = () => {
    setForceShowHub(true);
    setSelectedSector(null);
    setShowIntro(false);
    writeLS(LS_SECTOR, null);
    window.history.pushState(
      { navState: 'hub', step: 1, forceShowHub: true },
      '',
      '#hub',
    );
  };

  /*
   * Exit — clears the session completely and replaces the current history
   * entry with #login so the browser Back button cannot return to workspace.
   */
  const handleExit = () => {
    // Clear auth
    logout();
    // Clear navigation memory
    setSelectedDistrict(null);
    setSelectedSectorCategory(null);
    setSelectedSector(null);
    setNavState('hero');
    setForceShowHub(false);
    setShowIntro(false);
    writeLS(LS_DISTRICT, null);
    writeLS(LS_SECTOR_CAT, null);
    writeLS(LS_SECTOR, null);
    // Replace entire history stack back to root so Back never returns to workspace
    window.history.replaceState({ navState: 'hero' }, '', window.location.pathname.replace(/#.*$/, ''));
  };

  /* ── Sync navState to 'workspace' on page-refresh with valid token ── */
  useEffect(() => {
    if (user && activeSector && selectedSector && navState !== 'workspace' && !forceShowHub) {
      setNavState('workspace');
    }
  }, [user, activeSector, selectedSector, navState, forceShowHub]);

  /* ── Guards ── */
  if (authLoading || loadingSectors) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen error={fetchError} />;

  /* ============================================================
     1. ADMIN EXPERIENCE
     ============================================================ */
  if (user && user.role === 'admin') {
    return <AdminDashboardView sectors={sectors} onReturnHub={handleExit} />;
  }

  /* ============================================================
     2. AUTHENTICATED WORKSPACE SHELL
     Show workspace when: user authenticated AND activeSector set
     AND user selected a specific sector AND we are NOT on the hub.
     ============================================================ */
  if (user && activeSector && selectedSector && !forceShowHub) {
    return (
      <WorkspaceShell
        sector={activeSector}
        user={user}
        district={selectedDistrict}
        onLogout={handleExit}        // Exit button — clears session, replaces history
        onReturnHub={handleBackFromWorkspace}  // Back button — returns to 6-workspaces hub
      />
    );
  }

  /* ============================================================
     3. AUTHENTICATED MAIN HUB: ALL SIX BUSINESS WORKSPACES
     One Gmail Account = One User ID = Access to All Six Workspaces.
     ============================================================ */
  if (user) {
    return (
      <div className="min-h-screen flex flex-col relative" style={{ background: '#080B18', color: '#E8EDF9' }}>
        {/* Top Navbar */}
        <header
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-20"
          style={{
            background: 'rgba(8,11,24,0.96)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8065FF 0%, #32D8E8 100%)' }}
            >
              <Mic className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white font-heading">
                VAAYIL AI
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400">
                Single Gmail Account · All Six Business Workspaces
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tamil Nadu District Selector / Switcher */}
            <button
              onClick={() => {
                setNavState('district');
                window.history.pushState(
                  { navState: 'district', step: 1, district: selectedDistrict },
                  '',
                  '#district'
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors hover:border-cyan-400"
              style={{
                background: 'rgba(50,216,232,0.08)',
                borderColor: 'rgba(50,216,232,0.25)',
                color: '#32D8E8',
              }}
              title="Switch Tamil Nadu District (All 38 Districts Available)"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedDistrict ? `${selectedDistrict.en} (${selectedDistrict.ta})` : 'All 38 Districts'}</span>
              <span className="text-[10px] text-cyan-300/70 hidden sm:inline">Change</span>
            </button>

            {/* User Account Chip */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{user.full_name || user.username}</span>
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">({user.email})</span>
            </div>

            {/* Exit / Sign Out Button */}
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: 'rgba(255,100,124,0.1)',
                borderColor: 'rgba(255,100,124,0.25)',
                color: '#FF647C',
              }}
              title="Sign Out (Clears Session)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </header>

        {/* All Six Workspaces Hub Grid */}
        <main className="flex-1 overflow-y-auto">
          <VaayilHub2D
            sectors={sectors.filter((s) => s.id !== 'system')}
            selectedSector={selectedSector || activeSector}
            onSelectSector={handleBusinessSelected}
          />
        </main>
      </div>
    );
  }

  /* ============================================================
     3. PUBLIC NAVIGATION FLOW
     ============================================================ */

  // Auth modals shared across all public screens
  const sharedModals = (
    <>
      <UserAuthModal
        isOpen={showUserAuthModal}
        onClose={() => setShowUserAuthModal(false)}
        sectors={sectors}
        initialSector={selectedSector}
        onSuccess={handleLoginSuccess}
        onOpenAdminLogin={() => { setShowUserAuthModal(false); setShowAdminLoginModal(true); }}
      />
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onOpenUserLogin={() => { setShowAdminLoginModal(false); setShowUserAuthModal(true); }}
      />
    </>
  );

  // Hero
  if (navState === 'hero') {
    return (
      <>
        <VaayilHubHero
          onSelectDistrict={handleNavigateToDistrict}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          onOpenUserLogin={() => setShowUserAuthModal(true)}
        />
        {sharedModals}
      </>
    );
  }

  // District selector
  if (navState === 'district') {
    return (
      <>
        <DistrictSelector
          onSelectDistrict={handleDistrictSelected}
          onBack={user ? handleBackFromWorkspace : handleBackToHero}
        />
        {sharedModals}
      </>
    );
  }

  // Sector category selector
  if (navState === 'sector') {
    if (!selectedDistrict) {
      return (
        <>
          <DistrictSelector onSelectDistrict={handleDistrictSelected} onBack={handleBackToHero} />
          {sharedModals}
        </>
      );
    }
    return (
      <>
        <SectorSelector district={selectedDistrict} onSelectSector={handleSectorCategorySelected} onBack={handleBackToDistrict} />
        {sharedModals}
      </>
    );
  }

  // Business selector
  if (navState === 'business') {
    if (!selectedDistrict || !selectedSectorCategory) {
      return (
        <>
          <DistrictSelector onSelectDistrict={handleDistrictSelected} onBack={handleBackToHero} />
          {sharedModals}
        </>
      );
    }
    return (
      <>
        <BusinessSelector
          district={selectedDistrict}
          sectorCategory={selectedSectorCategory}
          onSelectBusiness={handleBusinessSelected}
          onBack={handleBackToSector}
          onBackToDistricts={handleBackToDistrict}
        />
        {sharedModals}
      </>
    );
  }

  /* ============================================================
     4. LOGIN OVERLAY
     (Sector selected, not yet authenticated)
     ============================================================ */
  if (!selectedSector) {
    return (
      <>
        <VaayilHubHero
          onSelectDistrict={handleNavigateToDistrict}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          onOpenUserLogin={() => setShowUserAuthModal(true)}
        />
        {sharedModals}
      </>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col select-none" style={{ background: '#080B18', color: '#E8EDF9' }}>

      {/* ── Back breadcrumb ── */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={handleBackToBusiness}
          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer border-none px-3 py-2 rounded-xl text-slate-200 transition-colors"
          style={{ background: 'rgba(16,22,38,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
          title="Back to Business &amp; Services"
        >
          <span>← Back to Businesses</span>
        </button>
        <button
          onClick={handleBackToSector}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium cursor-pointer border-none px-3 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          style={{ background: 'rgba(16,22,38,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Back to Categories"
        >
          <span>Categories</span>
        </button>
      </div>

      {/* Sector Transition Intro */}
      <AnimatePresence>
        {selectedSector && showIntro && (
          <SectorTransitionIntro sector={selectedSector} onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Login Card */}
      <AnimatePresence>
        {selectedSector && !showIntro && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <SectorBackground sectorId={selectedSector.id} mode="immersive" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
            <div className="relative z-10 w-full max-w-4xl xl:max-w-5xl my-auto py-4">
              <SectorLoginCard
                sector={selectedSector}
                onBack={handleBackToBusiness}
                onLoginSuccess={handleLoginSuccess}
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

      {sharedModals}
    </div>
  );
};
