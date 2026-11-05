import React from 'react';
import type { WorkspaceTab } from './Sidebar';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  FileText,
  Settings,
  Volume2,
  ShieldAlert,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  accentColor: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  accentColor,
}) => {
  const items = [
    { id: 'dashboard' as WorkspaceTab, label: 'Dash', icon: LayoutDashboard },
    { id: 'live-call' as WorkspaceTab, label: 'Call', icon: PhoneCall },
    { id: 'bookings' as WorkspaceTab, label: 'Bookings', icon: CalendarDays },
    { id: 'call-logs' as WorkspaceTab, label: 'Logs', icon: FileText },
    { id: 'noise-lab' as WorkspaceTab, label: 'Noise', icon: Volume2 },
    { id: 'safety-test' as WorkspaceTab, label: 'Safety', icon: ShieldAlert },
    { id: 'settings' as WorkspaceTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex md:hidden items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110' : ''}`}
              style={{
                backgroundColor: isActive ? `${accentColor}30` : 'transparent',
                color: isActive ? accentColor : undefined,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isActive ? 'font-bold' : ''
              }`}
              style={{ color: isActive ? accentColor : undefined }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

