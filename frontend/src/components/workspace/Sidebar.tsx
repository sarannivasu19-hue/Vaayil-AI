import React from 'react';
import type { Sector, User } from '../../types';
import { getSectorTheme } from '../../config/sectorThemes';
import { useLanguage } from '../../context/LanguageContext';
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
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export type WorkspaceTab =
  | 'dashboard'
  | 'smart-service'
  | 'live-call'
  | 'bookings'
  | 'call-logs'
  | 'urgent-alerts'
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

/* Doorway logo mark (same as Navbar) */
const ArchMark: React.FC<{ color: string; size?: number }> = ({ color, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path
      d="M5 22V13C5 8.582 9.029 5 14 5C18.971 5 23 8.582 23 13V22"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="14" cy="13.5" r="2" fill={color} opacity="0.8"/>
  </svg>
);

const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'dashboard' as WorkspaceTab,      label_en: 'Dashboard',             label_ta: 'டாஷ்போர்டு',             Icon: LayoutDashboard },
      { id: 'smart-service' as WorkspaceTab,  label_en: 'Smart Service Center',  label_ta: 'ஸ்மார்ட் சேவை மையம்',    Icon: Sparkles        },
      { id: 'live-call' as WorkspaceTab,      label_en: 'Live Call Console',     label_ta: 'நேரடி அழைப்பு',           Icon: PhoneCall       },
      { id: 'bookings'  as WorkspaceTab,      label_en: 'Bookings',              label_ta: 'முன்பதிவுகள்',             Icon: CalendarDays    },
      { id: 'call-logs' as WorkspaceTab,      label_en: 'Call Logs',             label_ta: 'அழைப்பு பதிவுகள்',        Icon: FileText        },
      { id: 'urgent-alerts' as WorkspaceTab,  label_en: 'Urgent Alerts',      label_ta: 'அவசர எச்சரிக்கை',        Icon: ShieldAlert     },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { id: 'noise-lab'    as WorkspaceTab, label_en: 'Noise Lab',          label_ta: 'இரைச்சல் ஆய்வகம்', Icon: Volume2     },
      { id: 'safety-test'  as WorkspaceTab, label_en: 'Safety Test Sheet',  label_ta: 'பாதுகாப்பு சோதனை', Icon: ShieldAlert  },
    ],
  },
  {
    label: 'CONFIG',
    items: [
      { id: 'settings' as WorkspaceTab, label_en: 'Settings', label_ta: 'அமைப்புகள்', Icon: Settings },
    ],
  },
];

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
  const { t, language } = useLanguage();
  const theme = getSectorTheme(sector.id);
  const accent = theme.accent;

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col h-full border-r shrink-0 transition-all duration-200 relative z-30',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{
        background: theme.surface,
        borderColor: theme.border,
      }}
    >
      {/* ── Brand header ── */}
      <div
        className="flex items-center justify-between px-3 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <ArchMark color={accent} size={24} />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                style={{ background: theme.badgeBg, borderColor: theme.borderHighlight, color: accent }}
              >
                <DynamicIcon name={sector.icon} className="w-3 h-3" />
              </div>
            </div>
            <div className="flex flex-col leading-none overflow-hidden">
              <span
                className="text-xs font-bold tracking-widest text-[#E8EDF9] truncate"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                VAAYIL AI
              </span>
              <span
                className="text-[9px] mt-0.5 truncate font-tamil font-medium"
                style={{ color: theme.accentSecondary }}
              >
                {sector.display_name_ta}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer border-none',
            isCollapsed ? 'mx-auto' : '',
          )}
          style={{ background: 'rgba(23,31,51,0.7)', color: '#9AA7BE' }}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* ── Sector icon strip (collapsed shows sector icon) ── */}
      {isCollapsed && (
        <div className="flex justify-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}20`, color: accent }}
          >
            <DynamicIcon name={sector.icon} className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="nav-section-label">{group.label}</div>
            )}
            {isCollapsed && <div className="my-2 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}

            {group.items.map(({ id, label_en, label_ta, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={isCollapsed ? label_en : undefined}
                  aria-label={label_en}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 cursor-pointer border-none text-left',
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-[rgba(128,101,255,0.10)] border-l-[3px] text-[#E8EDF9]'
                      : 'text-[#9AA7BE] hover:text-[#E8EDF9] hover:bg-[#171F33]',
                  )}
                  style={isActive ? { borderLeftColor: accent, paddingLeft: isCollapsed ? undefined : '9px' } : { borderLeft: '3px solid transparent' }}
                >
                  <Icon
                    className="w-[18px] h-[18px] shrink-0"
                    style={{ color: isActive ? accent : undefined }}
                  />
                  {!isCollapsed && (
                    <div className="flex flex-col leading-none overflow-hidden">
                      <span className="text-[13px] font-medium truncate">
                        {language === 'tamil'
                          ? label_ta
                          : language === 'english'
                          ? label_en
                          : t('nav.' + id.replace('-', '_'))}
                      </span>
                      <span className="text-[10px] mt-0.5 truncate" style={{ color: isActive ? '#9AA7BE' : '#4A5568' }}>
                        {language === 'tamil' ? label_en : label_ta}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User profile footer ── */}
      <div
        className="shrink-0 p-3 space-y-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* User card (hidden when collapsed) */}
        {!isCollapsed && (
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{ background: 'rgba(23,31,51,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${accent}25`, color: accent, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-[#E8EDF9] truncate">{user.full_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#42D6A4] shrink-0" />
                <span className="text-[10px] text-[#42D6A4]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={clsx('flex gap-1.5', isCollapsed ? 'flex-col items-center' : 'flex-row')}>
          <button
            onClick={onReturnHub}
            title="Return to Vaayil Hub"
            aria-label="Return to Vaayil Hub"
            className={clsx(
              'flex items-center justify-center gap-1.5 rounded-xl transition-colors cursor-pointer border text-xs font-medium',
              isCollapsed ? 'w-10 h-10 p-0' : 'flex-1 py-2 px-2.5',
            )}
            style={{
              background: 'rgba(23,31,51,0.7)',
              borderColor: 'rgba(255,255,255,0.10)',
              color: '#9AA7BE',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Hub</span>}
          </button>

          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className={clsx(
              'flex items-center justify-center rounded-xl transition-colors cursor-pointer border',
              isCollapsed ? 'w-10 h-10 p-0' : 'w-10 h-9',
            )}
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
    </aside>
  );
};
