import React from 'react';
import type { Sector, User } from '../../types';
import { DynamicIcon } from '../ui/Icons';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Volume2,
  ShieldAlert,
} from 'lucide-react';

export type WorkspaceTab =
  | 'dashboard'
  | 'live-call'
  | 'bookings'
  | 'call-logs'
  | 'noise-lab'
  | 'safety-test'
  | 'settings';

interface SidebarProps {
  sector: Sector;
  user: User;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  onReturnHub: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sector,
  user,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  onReturnHub,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as WorkspaceTab,
      label_en: 'Dashboard',
      label_ta: 'டாஷ்போர்டு',
      icon: LayoutDashboard,
      badge: 'Preview',
    },
    {
      id: 'live-call' as WorkspaceTab,
      label_en: 'Live Call Console',
      label_ta: 'நேரடி அழைப்பு',
      icon: PhoneCall,
      badge: 'Phase 3/5',
    },
    {
      id: 'bookings' as WorkspaceTab,
      label_en: 'Bookings & Requests',
      label_ta: 'முன்பதிவுகள்',
      icon: CalendarDays,
      badge: 'Active',
    },
    {
      id: 'call-logs' as WorkspaceTab,
      label_en: 'Call Logs & Intel',
      label_ta: 'அழைப்பு பதிவுகள்',
      icon: FileText,
      badge: 'Phase 6',
    },
    {
      id: 'noise-lab' as WorkspaceTab,
      label_en: 'Noise Lab',
      label_ta: 'இரைச்சல் ஆய்வகம்',
      icon: Volume2,
      badge: 'Phase 9',
    },
    {
      id: 'safety-test' as WorkspaceTab,
      label_en: 'Safety Test Sheet',
      label_ta: 'பாதுகாப்பு சோதனை',
      icon: ShieldAlert,
      badge: 'Phase 9',
    },
    {
      id: 'settings' as WorkspaceTab,
      label_en: 'Workspace Settings',
      label_ta: 'அமைப்புகள்',
      icon: Settings,
      badge: 'Phase 6',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-white/10 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 relative z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md"
              style={{
                backgroundColor: `${sector.accent_color}25`,
                borderColor: `${sector.accent_color}50`,
                color: sector.accent_color,
              }}
            >
              <DynamicIcon name={sector.icon} className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-bold text-white truncate font-tamil">
                  {sector.display_name_ta.split(' ')[0]} {sector.display_name_ta.split(' ')[1] || ''}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {sector.id}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'text-slate-950 font-bold shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
                style={{
                  backgroundColor: isActive ? sector.accent_color : undefined,
                  boxShadow: isActive ? `0 0 20px ${sector.accent_color}35` : undefined,
                }}
                title={isCollapsed ? item.label_en : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <div className="flex flex-col truncate">
                      <span className="truncate">{item.label_en}</span>
                      <span className={`text-[10px] font-tamil leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {item.label_ta}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border font-normal ${
                          isActive
                            ? 'bg-slate-950/20 border-slate-950/30 text-slate-950'
                            : item.badge === 'Active'
                            ? 'bg-cyan-950/70 border-cyan-500/30 text-cyan-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-left flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>{user.role}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReturnHub}
            className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Return to Hub Doorway"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Hub</span>}
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

