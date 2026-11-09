import React, { useState, useEffect, useCallback } from 'react';
import type { Sector, SectorDetail, User } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { Sidebar, type WorkspaceTab } from '../workspace/Sidebar';
import { BottomNav } from '../workspace/BottomNav';
import { SmartServiceCenter } from '../workspace/SmartServiceCenter';
import { BookingsManager } from '../workspace/BookingsManager';
import { LiveCallPage } from '../workspace/LiveCallPage';
import { CallLogsManager } from '../workspace/CallLogsManager';
import { DashboardView } from '../workspace/DashboardView';
import { SettingsManager } from '../workspace/SettingsManager';
import { NoiseLabView } from '../workspace/NoiseLabView';
import { SafetyTestSheetView } from '../workspace/SafetyTestSheetView';
import { UrgentAlertsView } from '../workspace/UrgentAlertsView';
import { getSectorTheme, getSectorCssVariables } from '../../config/sectorThemes';
import { SectorBackground } from '../world/SectorBackground';
import { DynamicIcon } from '../ui/Icons';
import { Loader2, LogOut, ArrowLeft, Search, MapPin, Mail } from 'lucide-react';
import type { TNDistrict } from '../../data/tamilNaduDistricts';

interface WorkspaceShellProps {
  sector: Sector;
  user: User;
  district?: TNDistrict | null;
  onLogout: () => void;
  onReturnHub?: () => void;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  sector,
  user,
  district,
  onLogout,
  onReturnHub,
}) => {
  const { t, language } = useLanguage();
  const [sectorDetail, setSectorDetail] = useState<SectorDetail | null>(null);

  // Read initial tab from URL hash if present
  const getTabFromHash = useCallback((): WorkspaceTab => {
    const hash = window.location.hash;
    if (hash.startsWith('#workspace/')) {
      const tabKey = hash.replace('#workspace/', '').split('?')[0] as WorkspaceTab;
      const validTabs: WorkspaceTab[] = [
        'dashboard',
        'smart-service',
        'live-call',
        'bookings',
        'call-logs',
        'urgent-alerts',
        'noise-lab',
        'safety-test',
        'settings',
      ];
      if (validTabs.includes(tabKey)) return tabKey;
    }
    return 'dashboard';
  }, []);

  const [activeTab, setActiveTabState] = useState<WorkspaceTab>(getTabFromHash);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [gmailStatus, setGmailStatus] = useState<{ is_connected: boolean; email: string | null } | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getGmailStatus()
      .then((status) => {
        if (isMounted) {
          setGmailStatus({ is_connected: status.is_connected, email: status.email });
        }
      })
      .catch(() => {
        if (isMounted) setGmailStatus(null);
      });
    return () => {
      isMounted = false;
    };
  }, [sector.id]);

  // Synchronized tab navigation with history and URL hash
  const navigateToTab = useCallback((tab: WorkspaceTab, replace: boolean = false) => {
    setActiveTabState(tab);
    const targetHash = tab === 'dashboard' ? '#workspace' : `#workspace/${tab}`;
    const stateObj = { navState: 'workspace', step: tab === 'dashboard' ? 4 : 5, tab };

    if (replace || window.location.hash === targetHash) {
      window.history.replaceState(stateObj, '', targetHash);
    } else {
      window.history.pushState(stateObj, '', targetHash);
    }
  }, []);

  // Sync activeTab when browser Back / Forward is clicked
  useEffect(() => {
    const handlePop = () => {
      if (window.location.hash.startsWith('#workspace')) {
        const tab = getTabFromHash();
        setActiveTabState(tab);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [getTabFromHash]);

  // Back button handler: returns to dashboard if in sub-tab, or to hub if already on dashboard
  const handleBackAction = () => {
    if (activeTab !== 'dashboard') {
      if (window.history.state?.step && window.history.state.step > 4) {
        window.history.back();
      } else {
        navigateToTab('dashboard');
      }
    } else {
      if (onReturnHub) {
        onReturnHub();
      }
    }
  };

  const getTabLabel = (tab: WorkspaceTab): string => {
    switch (tab) {
      case 'dashboard':
        return t('nav.dashboard');
      case 'smart-service':
        return t('nav.smart_service');
      case 'live-call':
        return t('nav.live_call');
      case 'bookings':
        return t('nav.bookings');
      case 'call-logs':
        return t('nav.call_logs');
      case 'urgent-alerts':
        return t('nav.urgent_alerts');
      case 'noise-lab':
        return t('nav.noise_lab');
      case 'safety-test':
        return t('nav.safety_test');
      case 'settings':
        return t('nav.settings');
      default:
        return tab;
    }
  };

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoadingDetail(true);
        const data = await api.getSectorDetail(sector.id);
        setSectorDetail(data);
      } catch (e) {
        console.error('Failed to load sector package details:', e);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [sector.id]);

  if (loadingDetail || !sectorDetail) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center" style={{ background: '#080B18' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${sector.accent_color}20`, color: sector.accent_color }}
          >
            <DynamicIcon name={sector.icon} className="w-6 h-6" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: sector.accent_color }} />
          <p className="text-xs text-[#9AA7BE]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {t('common.loading')} {sector.name}…
          </p>
        </div>
      </div>
    );
  }

  const theme = getSectorTheme(sectorDetail.id);
  const sectorVariables = getSectorCssVariables(theme);
  const accent = theme.accent;

  /* Live Call gets full width — no max-w constraint */
  const isFullWidth = activeTab === 'live-call';

  return (
    <div
      className="flex h-screen w-full overflow-hidden relative transition-colors duration-700"
      style={{
        ...sectorVariables,
        background: theme.gradient.css,
        color: '#E8EDF9',
      }}
    >
      {/* Desktop sidebar */}
      <Sidebar
        sector={sectorDetail}
        user={user}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onReturnHub={onReturnHub || onLogout}
        onLogout={onLogout}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">

        {/* Ambient subtle sector background for non-live-call pages */}
        {!isFullWidth && (
          <SectorBackground
            sectorId={sectorDetail.id}
            mode="subtle"
            className="z-0"
          />
        )}

        {/* ── Top header bar ── */}
        <header
          className="shrink-0 flex items-center justify-between gap-4 px-5 h-14 relative z-20"
          style={{
            background: theme.surface,
            borderBottom: `1px solid ${theme.border}`,
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Breadcrumb with District, Sector & Business */}
          <div className="flex items-center gap-2 min-w-0">
            {district && (
              <>
                <div
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{
                    background: 'rgba(50,216,232,0.08)',
                    borderColor: 'rgba(50,216,232,0.25)',
                    color: '#32D8E8',
                  }}
                  title={`Tamil Nadu District: ${district.en}`}
                >
                  <MapPin className="w-3 h-3 text-[#32D8E8]" />
                  <span>{language === 'tamil' ? district.ta : district.en}</span>
                  <span className="opacity-75 text-[11px]">
                    ({language === 'tamil' ? district.en : district.ta})
                  </span>
                </div>
                <span className="text-xs text-[#4A5568] hidden md:block">/</span>
              </>
            )}

            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ background: theme.badgeBg, borderColor: theme.borderHighlight, color: theme.accent }}
            >
              <DynamicIcon name={sectorDetail.icon} className="w-4 h-4" />
            </div>
            <span
              className="text-xs font-semibold hidden sm:block truncate"
              style={{ color: theme.accent }}
            >
              {sectorDetail.name}
            </span>
            <span
              className="text-xs hidden lg:block truncate text-slate-400"
            >
              ({language === 'tamil' ? sectorDetail.display_name_ta : sectorDetail.display_name_en})
            </span>
            <span className="text-xs text-[#4A5568] hidden sm:block">/</span>
            <span className="text-xs font-semibold text-[#E8EDF9] truncate">
              {getTabLabel(activeTab)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search */}
            <button
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer border-none"
              style={{ background: 'rgba(23,31,51,0.7)', color: '#9AA7BE' }}
              aria-label="Search"
              title="Search"
              disabled
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language Selector in Workspace Top Bar */}
            <LanguageSelector variant="compact" accentColor={accent} />

            {/* Shared Gmail Connection Status Chip across all 6 workspaces */}
            {gmailStatus && (
              <button
                onClick={() => navigateToTab('settings')}
                data-testid="header-gmail-status"
                className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs transition-colors cursor-pointer"
                style={{
                  background: gmailStatus.is_connected ? 'rgba(34,197,94,0.08)' : 'rgba(23,31,51,0.7)',
                  borderColor: gmailStatus.is_connected ? 'rgba(34,197,94,0.30)' : 'rgba(255,255,255,0.08)',
                  color: gmailStatus.is_connected ? '#4ADE80' : '#9AA7BE',
                }}
                title={
                  gmailStatus.is_connected
                    ? `Gmail Connected: ${gmailStatus.email || 'sarannivasusenthil@gmail.com'} (Shared across all 6 workspaces). Click to manage.`
                    : 'Gmail Not Connected. Click to configure in Settings.'
                }
              >
                {gmailStatus.is_connected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <Mail className={`w-3.5 h-3.5 ${gmailStatus.is_connected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="font-mono text-[11px] truncate max-w-[150px]">
                  {gmailStatus.is_connected ? (gmailStatus.email || 'Connected') : 'Gmail'}
                </span>
              </button>
            )}

            {/* Back button — goes back 1 step (to Dashboard or to Categories) */}
            <button
              onClick={handleBackAction}
              data-testid="workspace-back-btn"
              aria-label={activeTab !== 'dashboard' ? 'Back to Dashboard' : 'Back to categories'}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg transition-all cursor-pointer border text-xs font-semibold hover:bg-white/10 active:scale-95"
              style={{
                background: 'rgba(23,31,51,0.7)',
                borderColor: 'rgba(255,255,255,0.12)',
                color: '#E8EDF9',
              }}
              title={activeTab !== 'dashboard' ? 'Back to Dashboard' : 'Back to category selection (stays logged in)'}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="hidden sm:inline">
                {activeTab !== 'dashboard'
                  ? (language === 'tamil' ? 'முதன்மை பக்கம்' : 'Dashboard')
                  : (language === 'tamil' ? 'அனைத்து துறைகள்' : 'All Workspaces')}
              </span>
            </button>

            {/* User chip + Exit button */}
            <div className="flex items-center gap-1.5">
              <div
                className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-lg border"
                style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: `${accent}25`, color: accent, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-[#E8EDF9] font-medium hidden md:block max-w-[100px] truncate">
                  {user.full_name.split(' ')[0]}
                </span>
              </div>

              {/* Exit — clears session, browser Back cannot return to workspace */}
              <button
                onClick={onLogout}
                title="Exit & sign out (clears session)"
                aria-label="Exit"
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg transition-colors cursor-pointer border text-xs font-semibold"
                style={{
                  background: 'rgba(255,100,124,0.10)',
                  borderColor: 'rgba(255,100,124,0.25)',
                  color: '#FF647C',
                }}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t('common.exit')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative z-10">
          <div className={isFullWidth ? 'h-full' : 'max-w-6xl mx-auto px-4 sm:px-6 py-6'}>
            {activeTab === 'dashboard'      && <DashboardView      sectorDetail={sectorDetail} onNavigateTab={(tab) => navigateToTab(tab)} />}
            {activeTab === 'smart-service'  && <SmartServiceCenter sectorDetail={sectorDetail} onNavigateTab={(tab) => navigateToTab(tab as any)} />}
            {activeTab === 'live-call'      && <LiveCallPage        sectorDetail={sectorDetail} />}
            {activeTab === 'bookings'       && <BookingsManager     sectorDetail={sectorDetail} district={district} />}
            {activeTab === 'call-logs'      && <CallLogsManager     sectorDetail={sectorDetail} />}
            {activeTab === 'urgent-alerts'  && <UrgentAlertsView    sectorDetail={sectorDetail} />}
            {activeTab === 'noise-lab'      && <NoiseLabView        sectorDetail={sectorDetail} />}
            {activeTab === 'safety-test'    && <SafetyTestSheetView sectorDetail={sectorDetail} />}
            {activeTab === 'settings'       && <SettingsManager     sectorDetail={sectorDetail} />}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        accentColor={accent}
      />
    </div>
  );
};
