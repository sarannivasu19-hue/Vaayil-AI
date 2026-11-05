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
import { DynamicIcon } from '../ui/Icons';
import { Loader2, ArrowLeft, LogOut } from 'lucide-react';

interface WorkspaceShellProps {
  sector: Sector;
  user: User;
  onLogout: () => void;
  onReturnHub?: () => void;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  sector,
  user,
  onLogout,
  onReturnHub,
}) => {
  const [sectorDetail, setSectorDetail] = useState<SectorDetail | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('bookings');
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070b14] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading {sector.name} Package...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#070b14] text-slate-100 overflow-hidden relative">
      {/* Desktop Collapsible Sidebar */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Workspace Top Header Bar */}
        <header className="px-5 py-3 border-b border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-20">
          <div className="flex items-center gap-3 truncate text-left">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${sectorDetail.accent_color}25`,
                borderColor: `${sectorDetail.accent_color}50`,
                color: sectorDetail.accent_color,
              }}
            >
              <DynamicIcon name={sectorDetail.icon} className="w-4 h-4" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate font-tamil">
                  {sectorDetail.display_name_ta}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 hidden sm:inline-block">
                  {sectorDetail.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onReturnHub && (
              <button
                onClick={onReturnHub}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}

            <button
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'bookings' && (
              <BookingsManager sectorDetail={sectorDetail} />
            )}
            {activeTab === 'dashboard' && (
              <DashboardView
                sectorDetail={sectorDetail}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'live-call' && (
              <LiveCallPage sectorDetail={sectorDetail} />
            )}
            {activeTab === 'call-logs' && (
              <CallLogsManager sectorDetail={sectorDetail} />
            )}
            {activeTab === 'noise-lab' && (
              <NoiseLabView sectorDetail={sectorDetail} />
            )}
            {activeTab === 'safety-test' && (
              <SafetyTestSheetView sectorDetail={sectorDetail} />
            )}
            {activeTab === 'settings' && (
              <SettingsManager sectorDetail={sectorDetail} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accentColor={sectorDetail.accent_color}
      />
    </div>
  );
};
