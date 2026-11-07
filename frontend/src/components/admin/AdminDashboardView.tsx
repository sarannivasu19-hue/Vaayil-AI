import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Phone,
  Server,
  RefreshCw,
  Search,
  Power,
  Activity,
  Building2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { AdminOverview, AdminUser, AlertItem, Sector } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DynamicIcon } from '../ui/Icons';

interface AdminDashboardViewProps {
  onReturnHub: () => void;
  sectors: Sector[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onReturnHub,
  sectors,
}) => {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts' | 'integrations'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User search/filter
  const [searchUser, setSearchUser] = useState('');
  const [filterSector, setFilterSector] = useState('all');

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [ov, us, al] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAlerts({ sector_id: 'all' }),
      ]);
      setOverview(ov);
      setUsers(us);
      setAlerts(al);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (targetUser: AdminUser) => {
    const nextState = !targetUser.is_active;
    try {
      await api.toggleUserStatus(targetUser.id, nextState);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextState } : u))
      );
      if (overview) {
        setOverview({
          ...overview,
          active_users: nextState ? overview.active_users + 1 : overview.active_users - 1,
        });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.phone && u.phone.includes(searchUser));
    const matchesSector = filterSector === 'all' || u.sector_id === filterSector;
    return matchesSearch && matchesSector;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B18] flex flex-col items-center justify-center p-6 text-[#9AA7BE]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8065FF] mb-3" />
        <p className="text-sm font-mono">Loading Vaayil Administrative Telemetry…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B18] text-[#E8EDF9] flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-16 border-b border-white/10 bg-[#0B0F20]/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8065FF]/20 border border-[#8065FF]/40 flex items-center justify-center text-[#A58EFF]">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-white font-heading">
                VAAYIL AI · Admin Control Hub
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#8065FF]/20 text-[#A58EFF] text-[10px] font-mono font-bold">
                Platform Root
              </span>
            </div>
            <p className="text-[11px] text-[#9AA7BE] hidden sm:block">
              Authenticated as {user?.full_name || 'System Administrator'} ({user?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-[#9AA7BE] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={onReturnHub}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-[#9AA7BE] hover:text-white transition-colors cursor-pointer"
          >
            Public Hub
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF647C] bg-[#FF647C]/10 border border-[#FF647C]/30 hover:bg-[#FF647C]/20 transition-all cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'alerts', label: `Urgent Alerts (${alerts.length})`, icon: ShieldAlert },
            { id: 'integrations', label: 'Integrations & API Status', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8065FF] border-[#8065FF] text-white shadow-lg shadow-purple-900/30'
                    : 'bg-white/5 border-white/10 text-[#9AA7BE] hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#101626] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-[#9AA7BE] text-xs">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-[#32D8E8]" />
                </div>
                <p className="text-2xl font-bold font-heading text-white">{overview.total_users}</p>
                <p className="text-[11px] text-[#42D6A4] font-mono">{overview.active_users} Active Accounts</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#101626] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-[#9AA7BE] text-xs">
                  <span>Active Sectors</span>
                  <Building2 className="w-4 h-4 text-[#8065FF]" />
                </div>
                <p className="text-2xl font-bold font-heading text-white">{overview.total_sectors} Sectors</p>
                <p className="text-[11px] text-[#9AA7BE] font-mono">100% Operational</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#101626] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-[#9AA7BE] text-xs">
                  <span>Total Voice Calls</span>
                  <Phone className="w-4 h-4 text-[#42D6A4]" />
                </div>
                <p className="text-2xl font-bold font-heading text-white">{overview.total_calls}</p>
                <p className="text-[11px] text-[#9AA7BE] font-mono">{overview.total_bookings} Bookings Created</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#101626] border border-[#FF647C]/30 space-y-1">
                <div className="flex items-center justify-between text-[#FF647C] text-xs font-semibold">
                  <span>Urgent Alerts</span>
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold font-heading text-[#FF647C]">{overview.total_alerts}</p>
                <p className="text-[11px] text-[#FFBF69] font-mono">{overview.new_alerts} Pending Review</p>
              </div>
            </div>

            {/* Sector Breakdown Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Sector Workspaces Activity Breakdown
                </h3>
                <span className="text-xs text-[#9AA7BE] font-mono">Real-time Telemetry</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.sector_breakdown.map((sec) => (
                  <div
                    key={sec.sector_id}
                    className="p-4 rounded-2xl bg-[#101626]/80 border transition-all hover:border-white/20"
                    style={{ borderColor: `${sec.accent_color}30` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border"
                        style={{
                          background: `${sec.accent_color}15`,
                          borderColor: `${sec.accent_color}40`,
                          color: sec.accent_color,
                        }}
                      >
                        <DynamicIcon name={sec.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{sec.name}</h4>
                        <p className="text-xs text-[#9AA7BE] font-tamil">{sec.display_name_ta}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#7E8CA3] block font-mono">USERS</span>
                        <span className="font-bold text-white">{sec.users_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7E8CA3] block font-mono">CALLS</span>
                        <span className="font-bold text-white">{sec.calls_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7E8CA3] block font-mono">ALERTS</span>
                        <span className={`font-bold ${sec.alerts_count > 0 ? 'text-[#FF647C]' : 'text-white'}`}>
                          {sec.alerts_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: USER MANAGEMENT ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#7E8CA3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, phone…"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#101626] border border-white/10 text-white placeholder-[#59667D] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#9AA7BE] font-mono">Sector:</span>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-[#101626] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="all">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-white/10 bg-[#101626] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/30 border-b border-white/10 text-[10px] font-mono uppercase text-[#7E8CA3]">
                    <tr>
                      <th className="p-3.5 pl-4">User</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Assigned Sector</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Created</th>
                      <th className="p-3.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 pl-4">
                          <p className="font-bold text-white">{u.full_name}</p>
                          <p className="text-[11px] text-[#7E8CA3] font-mono">@{u.username}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="text-white">{u.email}</p>
                          <p className="text-[11px] text-[#7E8CA3] font-mono">{u.phone || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-[#BAC7DF]">
                            {u.sector_id || 'System Global'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-[#8065FF]/20 text-[#A58EFF] border border-[#8065FF]/30'
                                : 'bg-cyan-500/10 text-[#32D8E8] border border-cyan-500/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              u.is_active
                                ? 'bg-emerald-500/10 text-[#42D6A4]'
                                : 'bg-rose-500/10 text-[#FF647C]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-[#42D6A4]' : 'bg-[#FF647C]'}`} />
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#7E8CA3] font-mono text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                u.is_active
                                  ? 'border-[#FF647C]/40 bg-[#FF647C]/10 text-[#FF647C] hover:bg-[#FF647C]/20'
                                  : 'border-[#42D6A4]/40 bg-[#42D6A4]/10 text-[#42D6A4] hover:bg-[#42D6A4]/20'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: URGENT ALERTS ==================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#101626] border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Platform-Wide Urgent Alerts Telemetry
                </h3>
                <p className="text-xs text-[#9AA7BE]">
                  All alerts detected by the AI voice engine across all six sectors.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FF647C]/15 border border-[#FF647C]/30 text-xs font-bold text-[#FF647C] font-mono">
                {alerts.length} Total Incidents
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 rounded-2xl bg-[#101626] border border-l-4 transition-all"
                  style={{ borderLeftColor: alt.severity === 'critical' ? '#FF647C' : '#FFBF69' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">#ALT-{alt.id}</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-[#BAC7DF]">
                        {alt.sector_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alt.severity === 'critical'
                            ? 'bg-[#FF647C]/20 text-[#FF647C]'
                            : 'bg-[#FFBF69]/20 text-[#FFBF69]'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#7E8CA3]">
                      <span>{alt.phone}</span>
                      <span>•</span>
                      <span>{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <p className="text-xs text-white font-semibold mb-1">{alt.reason}</p>
                  <p className="text-xs text-[#9AA7BE] font-tamil p-2 rounded-lg bg-black/30 border border-white/5 mb-2">
                    "{alt.snippet}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#7E8CA3]">
                    <span>
                      Status:{' '}
                      <strong className="text-[#32D8E8] uppercase font-mono">{alt.status}</strong>
                      {alt.reviewed_by && ` (Reviewed by ${alt.reviewed_by})`}
                    </span>
                    {alt.is_dev_sample && (
                      <span className="text-[10px] text-[#7E8CA3] font-mono">
                        [Development Sample Record]
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: INTEGRATIONS & API ==================== */}
        {activeTab === 'integrations' && overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#101626] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#32D8E8]/10 border border-[#32D8E8]/30 flex items-center justify-center text-[#32D8E8]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gnani.ai Speech Engine</h4>
                  <p className="text-xs text-[#9AA7BE]">Speech-to-Text & Text-to-Speech Integration</p>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-white/5">
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">STT MODEL</span>
                  <span className="font-mono text-white">{overview.integrations.gnani_stt.model}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">STT STATUS</span>
                  <span className="font-mono text-[#42D6A4] uppercase font-bold">
                    {overview.integrations.gnani_stt.status}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">TTS VOICE</span>
                  <span className="font-mono text-white">{overview.integrations.gnani_tts.voice}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">LANGUAGES</span>
                  <span className="font-mono text-white">Tamil, Tanglish, English</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#101626] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8065FF]/10 border border-[#8065FF]/30 flex items-center justify-center text-[#A58EFF]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Database & Security</h4>
                  <p className="text-xs text-[#9AA7BE]">ACID Persistence & Access Management</p>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-white/5">
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">ENGINE</span>
                  <span className="font-mono text-white">{overview.integrations.database.type}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">PING LATENCY</span>
                  <span className="font-mono text-[#42D6A4]">{overview.integrations.database.ping_ms} ms</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">AUTH PROTOCOL</span>
                  <span className="font-mono text-white">{overview.integrations.security.auth_mode}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7E8CA3] font-mono">RBAC ENFORCEMENT</span>
                  <span className="font-mono text-[#42D6A4]">Enabled (Owner / Admin)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
