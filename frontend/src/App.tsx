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
  const { user, activeSector, logout, isLoading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ── Navigation state ── */
  const [navState, setNavState] = useState<NavState>('hero');
  const [selectedDistrict, setSelectedDistrict] = useState<TNDistrict | null>(() => readLS<TNDistrict>(LS_DISTRICT));
  const [selectedSectorCategory, setSelectedSectorCategory] = useState<SectorCategory | null>(() => readLS<SectorCategory>(LS_SECTOR_CAT));
  const [selectedSector, setSelectedSector] = useState<Sector | null>(() => readLS<Sector>(LS_SECTOR));
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
      const s = e.state as null | { navState: NavState; district: TNDistrict | null; sectorCategory: SectorCategory | null; sector: Sector | null; forceShowHub?: boolean };
      if (s?.navState) {
        // Restore every field stored in the history entry
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

        // If we popped BACK from workspace and no longer on 'workspace',
        // we must NOT logout — just show the pre-login screen again.
        // If the token is still valid the user stays logged in until they
        // explicitly press Exit.
      } else {
        setNavState('hero');
        setForceShowHub(false);
        setShowIntro(false);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  /* ── Forward navigation handlers ── */

  const handleNavigateToDistrict = () => {
    setNavState('district');
    window.history.pushState({ navState: 'district', district: null, sectorCategory: null, sector: null }, '', '#district');
  };

  const handleDistrictSelected = (district: TNDistrict) => {
    setSelectedDistrict(district);
    writeLS(LS_DISTRICT, district);
    setNavState('sector');
    window.history.pushState({ navState: 'sector', district, sectorCategory: null, sector: null }, '', `#sector-${district.id}`);
  };

  const handleSectorCategorySelected = (sectorCat: SectorCategory) => {
    setSelectedSectorCategory(sectorCat);
    writeLS(LS_SECTOR_CAT, sectorCat);
    setNavState('business');
    window.history.pushState({ navState: 'business', district: selectedDistrict, sectorCategory: sectorCat, sector: null }, '', `#business-${sectorCat.id}`);
  };

  const handleBusinessSelected = (sec: Sector) => {
    setSelectedSector(sec);
    writeLS(LS_SECTOR, sec);
    setShowIntro(true);
    setNavState('login');
    window.history.pushState({ navState: 'login', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: sec }, '', `#login-${sec.id}`);
  };

  /*
   * Called when login/demo-login succeeds.
   * Pushes a 'workspace' history entry so browser Back goes back to 'login',
   * NOT straight to 'district'.
   */
  const handleLoginSuccess = () => {
    setShowIntro(false);
    setNavState('workspace');
    setForceShowHub(false);
    window.history.pushState(
      { navState: 'workspace', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: selectedSector },
      '',
      '#workspace',
    );
  };

  /* ── Back navigation handlers (do NOT logout) ── */

  const handleBackToHero = () => {
    setNavState('hero');
    setSelectedDistrict(null);
    setSelectedSectorCategory(null);
    setSelectedSector(null);
    setShowIntro(false);
    writeLS(LS_DISTRICT, null);
    writeLS(LS_SECTOR_CAT, null);
    writeLS(LS_SECTOR, null);
    window.history.pushState({ navState: 'hero' }, '', window.location.pathname.replace(/#.*$/, ''));
  };

  const handleBackToDistrict = () => {
    setNavState('district');
    setSelectedSectorCategory(null);
    setSelectedSector(null);
    setShowIntro(false);
    writeLS(LS_SECTOR_CAT, null);
    writeLS(LS_SECTOR, null);
    window.history.pushState({ navState: 'district', district: selectedDistrict, sectorCategory: null, sector: null }, '', '#district');
  };

  const handleBackToSector = () => {
    setNavState('sector');
    setSelectedSector(null);
    setShowIntro(false);
    writeLS(LS_SECTOR, null);
    window.history.pushState({ navState: 'sector', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null }, '', `#sector-${selectedDistrict?.id ?? ''}`);
  };

  const handleBackToBusiness = () => {
    setNavState('business');
    setSelectedSector(null);
    setShowIntro(false);
    writeLS(LS_SECTOR, null);
    window.history.pushState({ navState: 'business', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null }, '', `#business-${selectedSectorCategory?.id ?? ''}`);
  };

  /*
   * Back from workspace — goes to the category/sector screen WITHOUT logout.
   * The user stays authenticated; forceShowHub shows the public nav flow
   * while keeping the session alive so they can re-enter workspace quickly.
   */
  const handleBackFromWorkspace = () => {
    setNavState('business');
    setForceShowHub(true);
    setShowIntro(false);
    window.history.pushState(
      { navState: 'business', district: selectedDistrict, sectorCategory: selectedSectorCategory, sector: null, forceShowHub: true },
      '',
      `#business-${selectedSectorCategory?.id ?? ''}`,
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
    if (user && activeSector && navState !== 'workspace' && !forceShowHub) {
      setNavState('workspace');
    }
  }, [user, activeSector, navState, forceShowHub]);

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
     2. AUTHENTICATED WORKSPACE
     Show workspace when: user authenticated AND activeSector set
     AND we are NOT forcing the hub/public-nav view.
     forceShowHub is set by Back-from-workspace so the user can
     browse other businesses without being logged out.
     ============================================================ */
  if (user && activeSector && !forceShowHub) {
    return (
      <WorkspaceShell
        sector={activeSector}
        user={user}
        district={selectedDistrict}
        onLogout={handleExit}        // Exit button — clears session, replaces history
        onReturnHub={handleBackFromWorkspace}  // Back button — no logout, goes to category
      />
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
        <DistrictSelector onSelectDistrict={handleDistrictSelected} onBack={handleBackToHero} />
        {sharedModals}
      </>
    );
  }

  // Sector category selector
  if (navState === 'sector' && selectedDistrict) {
    return (
      <>
        <SectorSelector district={selectedDistrict} onSelectSector={handleSectorCategorySelected} onBack={handleBackToDistrict} />
        {sharedModals}
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
        {sharedModals}
      </>
    );
  }

  /* ============================================================
     4. LOGIN OVERLAY
     (Sector selected, not yet authenticated)
     ============================================================ */
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
