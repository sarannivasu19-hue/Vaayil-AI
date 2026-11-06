import React, { useState, useEffect } from 'react';
import type { Sector, SectorDetail, User } from '../../types';
import { api } from '../../services/api';
import { Sidebar, type WorkspaceTab } from '../workspace/Sidebar';
import { BottomNav } from '../workspace/BottomNav';
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
import { Loader2, LogOut, ArrowLeft, Search, Globe } from 'lucide-react';

interface WorkspaceShellProps {
  sector: Sector;
  user: User;
  onLogout: () => void;
  onReturnHub?: () => void;
}

const TAB_LABELS: Record<WorkspaceTab, string> = {
  'dashboard':      'Dashboard',
  'live-call':      'Live Call Console',
  'bookings':       'Bookings',
  'call-logs':      'Call Logs',
  'urgent-alerts':  'Urgent Alerts',
  'noise-lab':      'Noise Lab',
  'safety-test':    'Safety Test Sheet',
  'settings':       'Settings',
};

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  sector,
  user,
  onLogout,
  onReturnHub,
}) => {
  const [sectorDetail, setSectorDetail] = useState<SectorDetail | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);

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
            Loading {sector.name}…
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
        setActiveTab={setActiveTab}
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
          {/* Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ background: theme.badgeBg, borderColor: theme.borderHighlight, color: theme.accent }}
            >
              <DynamicIcon name={sectorDetail.icon} className="w-4 h-4" />
            </div>
            <span
              className="text-xs font-semibold hidden sm:block font-tamil truncate"
              style={{ color: theme.accent }}
            >
              {sectorDetail.display_name_ta}
            </span>
            <span className="text-xs text-[#4A5568] hidden sm:block">/</span>
            <span className="text-xs font-semibold text-[#E8EDF9] truncate">
              {TAB_LABELS[activeTab]}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search (icon only — placeholder, no functionality added) */}
            <button
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer border-none"
              style={{ background: 'rgba(23,31,51,0.7)', color: '#9AA7BE' }}
              aria-label="Search (coming soon)"
              title="Search"
              disabled
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language indicator */}
            <button
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg transition-colors cursor-pointer border text-xs"
              style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
              aria-label="Language settings"
              title="Language settings"
              onClick={() => setActiveTab('settings')}
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span className="font-tamil hidden md:block">தமிழ் / EN</span>
            </button>

            {/* Return to Hub */}
            {onReturnHub && (
              <button
                onClick={onReturnHub}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg transition-colors cursor-pointer border text-xs font-medium"
                style={{ background: 'rgba(23,31,51,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA7BE' }}
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}

            {/* User chip + logout */}
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

              <button
                onClick={onLogout}
                title="Log out"
                aria-label="Log out"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer border"
                style={{
                  background: 'rgba(255,100,124,0.10)',
                  borderColor: 'rgba(255,100,124,0.25)',
                  color: '#FF647C',
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className={isFullWidth ? 'h-full' : 'max-w-6xl mx-auto px-4 sm:px-6 py-6'}>
            {activeTab === 'dashboard'      && <DashboardView      sectorDetail={sectorDetail} onNavigateTab={(tab) => setActiveTab(tab)} />}
            {activeTab === 'live-call'      && <LiveCallPage        sectorDetail={sectorDetail} />}
            {activeTab === 'bookings'       && <BookingsManager     sectorDetail={sectorDetail} />}
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
        setActiveTab={setActiveTab}
        accentColor={accent}
      />
    </div>
  );
};
