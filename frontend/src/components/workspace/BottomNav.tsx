import React, { useState } from 'react';
import type { WorkspaceTab } from './Sidebar';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  FileText,
  Settings,
  Volume2,
  ShieldAlert,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

interface BottomNavProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  accentColor: string;
}

const PRIMARY_ITEMS = [
  { id: 'dashboard'  as WorkspaceTab, label: 'Home',     Icon: LayoutDashboard },
  { id: 'live-call'  as WorkspaceTab, label: 'Call',     Icon: PhoneCall       },
  { id: 'bookings'   as WorkspaceTab, label: 'Bookings', Icon: CalendarDays    },
  { id: 'call-logs'  as WorkspaceTab, label: 'Logs',     Icon: FileText        },
];

const MORE_ITEMS = [
  { id: 'urgent-alerts' as WorkspaceTab, label: 'Alerts',       Icon: ShieldAlert },
  { id: 'noise-lab'     as WorkspaceTab, label: 'Noise Lab',    Icon: Volume2     },
  { id: 'safety-test'   as WorkspaceTab, label: 'Safety Sheet', Icon: ShieldAlert },
  { id: 'settings'      as WorkspaceTab, label: 'Settings',     Icon: Settings    },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, accentColor }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((i) => i.id === activeTab);

  const handleSelect = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Bottom drawer for "More" */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-[60px] left-0 right-0 z-50 md:hidden rounded-t-2xl overflow-hidden"
            style={{ background: '#101626', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none' }}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xs font-semibold text-[#9AA7BE]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>MORE</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-[#9AA7BE] hover:text-[#E8EDF9] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {MORE_ITEMS.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl transition-colors cursor-pointer border-none"
                    style={{
                      background: isActive ? `${accentColor}18` : 'rgba(23,31,51,0.6)',
                      color: isActive ? accentColor : '#9AA7BE',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            {/* safe area */}
            <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex items-center"
        style={{
          height: 60,
          background: '#101626',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Primary items */}
        {PRIMARY_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setMoreOpen(false); setActiveTab(id); }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full cursor-pointer border-none bg-transparent transition-colors"
              style={{ color: isActive ? accentColor : '#9AA7BE', minHeight: 44 }}
            >
              <Icon className={clsx('w-[22px] h-[22px]', isActive && 'scale-110 transition-transform')} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          aria-label="More options"
          aria-expanded={moreOpen}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full cursor-pointer border-none bg-transparent transition-colors"
          style={{ color: isMoreActive ? accentColor : '#9AA7BE', minHeight: 44 }}
        >
          {moreOpen
            ? <X className="w-[22px] h-[22px]" />
            : <MoreHorizontal className="w-[22px] h-[22px]" />
          }
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>
    </>
  );
};
