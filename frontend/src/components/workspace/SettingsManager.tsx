import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SectorDetail, SectorSettingsData, AgentQuestion, SlotDefinition } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import {
  Building2, Clock, Calendar, Globe2, Mic2, ShieldAlert, Lock,
  Save, RotateCcw, Loader2, Info, Plus, Trash2, GripVertical,
  CheckCircle2, AlertTriangle, Phone, Mail, ChevronDown, ChevronUp,
  Settings2, MessageSquare, X, RefreshCw, Send,
} from 'lucide-react';

interface SettingsManagerProps {
  sectorDetail: SectorDetail;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

const GNANI_VOICES = [
  { value: 'Shivani', label: 'Shivani', gender: 'Female', note: 'Default · Best for Tamil Nadu' },
  { value: 'Avinash', label: 'Avinash', gender: 'Male', note: 'Clear diction' },
  { value: 'Lakshmi', label: 'Lakshmi', gender: 'Female', note: 'Warm tone' },
  { value: 'Kalpana', label: 'Kalpana', gender: 'Female', note: 'Professional' },
  { value: 'Shubham', label: 'Shubham', gender: 'Male', note: 'Formal' },
  { value: 'Prakash', label: 'Prakash', gender: 'Male', note: 'Authoritative' },
];

const LANGUAGE_MODES = [
  { value: 'tanglish', label: 'Tanglish', desc: 'Tamil + English code-mixed (Recommended)' },
  { value: 'tamil', label: 'தமிழ்', desc: 'Pure Tamil script responses' },
  { value: 'english', label: 'English', desc: 'Indian English responses' },
];

const SLOT_DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

// Default settings matching backend defaults
function makeDefault(sd: SectorDetail): SectorSettingsData {
  return {
    business_name: sd.name,
    contact_phone: '',
    contact_email: '',
    open_time: '09:00',
    close_time: '18:00',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    slot_length_minutes: 30,
    language_mode: 'tanglish',
    tts_voice: 'Shivani',
    agent_questions: sd.slots.map((s, i) => ({
      id: s.name,
      text_en: s.prompts.en,
      text_ta: s.prompts.ta,
      order: i,
    })),
    urgent_keywords: sd.urgent_keywords || [],
    store_audio: false,
    data_retention_days: 90,
    consent_banner_enabled: false,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  icon, title, accent, children, defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-white">
          <span className="p-1.5 rounded-lg" style={{ background: `${accent}18`, color: accent }}>
            {icon}
          </span>
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/5">{children}</div>}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{children}</label>
      {hint && (
        <span className="group relative">
          <Info className="w-3 h-3 text-slate-600 cursor-help" />
          <span className="absolute left-4 top-0 z-20 w-52 text-xs bg-slate-800 border border-white/10 rounded-lg p-2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
            {hint}
          </span>
        </span>
      )}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-900/80 border border-white/[0.08] focus:ring-cyan-500/40 focus:border-cyan-500/50 placeholder-slate-600";

function NotConnected({ label }: { label: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-2 text-xs text-slate-500">
      <Info className="w-3.5 h-3.5 shrink-0" />
      <span><strong className="text-slate-400">{label}</strong> — Not connected to the backend yet. Contact support to enable this.</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const SettingsManager: React.FC<SettingsManagerProps> = ({ sectorDetail }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SectorSettingsData>(makeDefault(sectorDetail));
  const [saved, setSaved] = useState<SectorSettingsData>(makeDefault(sectorDetail));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newKeyword, setNewKeyword] = useState('');
  const [newQuestion, setNewQuestion] = useState({ text_en: '', text_ta: '' });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ── Centralized Shared Gmail & Google Integration State ──
  const [gmailStatus, setGmailStatus] = useState<{
    is_connected: boolean;
    email: string | null;
    token_status: string;
    workspaces_enabled: string[];
    last_error: string | null;
  }>({
    is_connected: false,
    email: null,
    token_status: 'disconnected',
    workspaces_enabled: [],
    last_error: null,
  });
  const [gmailLoading, setGmailLoading] = useState(false);
  const [connectEmailInput, setConnectEmailInput] = useState('sarannivasusenthil@gmail.com');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [customTestEmail, setCustomTestEmail] = useState('');

  const loadGmailStatus = async () => {
    try {
      const data = await api.getGmailStatus();
      setGmailStatus(data);
      if (data.email) {
        setConnectEmailInput(data.email);
      }
    } catch (e) {
      console.warn('Failed to fetch Gmail status:', e);
    }
  };

  const handleConnectGmail = async (emailToConnect: string) => {
    setGmailLoading(true);
    try {
      const res = await api.connectGmail(emailToConnect);
      setGmailStatus(res);
      setShowConnectModal(false);
      toast({
        type: 'success',
        message: `Gmail account ${res.email} successfully connected across all 6 workspaces!`,
      });
    } catch (e: any) {
      toast({
        type: 'error',
        message: e?.message || 'Failed to connect Gmail account.',
      });
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setGmailLoading(true);
    try {
      const res = await api.disconnectGmail();
      setGmailStatus(res);
      toast({
        type: 'info',
        message: 'Gmail account disconnected across all workspaces.',
      });
    } catch (e: any) {
      toast({
        type: 'error',
        message: e?.message || 'Failed to disconnect Gmail account.',
      });
    } finally {
      setGmailLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailSending(true);
    try {
      const res = await api.sendTestGmailEmail(sectorDetail.id, customTestEmail || undefined);
      toast({
        type: 'success',
        message: `Test email sent for ${res.business_name} to ${res.recipient_email}! Ref: ${res.reference_number}`,
      });
    } catch (e: any) {
      toast({
        type: 'error',
        message: e?.message || 'Failed to send test email. Check Gmail connection.',
      });
    } finally {
      setTestEmailSending(false);
    }
  };

  // Dirty state: has user made unsaved changes?
  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved);

  // Load settings on mount / sector change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSettings();
        if (!cancelled) {
          setSettings(data);
          setSaved(data);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        // Fall back to defaults derived from sectorDetail
        const defaults = makeDefault(sectorDetail);
        if (!cancelled) {
          setSettings(defaults);
          setSaved(defaults);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    loadGmailStatus();
    return () => { cancelled = true; };
  }, [sectorDetail.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before tab close if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Field helpers ──
  const set = useCallback(<K extends keyof SectorSettingsData>(key: K, val: SectorSettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  // ── Validation ──
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!settings.business_name.trim()) errs.business_name = 'Business name is required.';
    if (settings.contact_phone && !/^\d{7,15}$/.test(settings.contact_phone.replace(/[\s\-+()]/g, '')))
      errs.contact_phone = 'Enter a valid phone number.';
    if (settings.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email))
      errs.contact_email = 'Enter a valid email address.';
    if (settings.open_time >= settings.close_time)
      errs.open_time = 'Opening time must be before closing time.';
    if (settings.working_days.length === 0)
      errs.working_days = 'Select at least one working day.';
    if (settings.urgent_keywords.some(k => !k.trim()))
      errs.urgent_keywords = 'Remove empty keywords.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast({ type: 'error', message: 'Please fix the validation errors before saving.' });
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateSettings(settings);
      setSaved(updated);
      setSettings(updated);
      setSaveSuccess(true);
      toast({ type: 'success', message: 'Settings saved and will apply on the next call.' });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }

  // ── Cancel / Reset ──
  function handleCancel() {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    setSettings(saved);
    setErrors({});
    setSaveSuccess(false);
  }

  // ── Keywords ──
  function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw) return;
    if (settings.urgent_keywords.includes(kw)) {
      toast({ type: 'error', message: 'This keyword already exists.' });
      return;
    }
    set('urgent_keywords', [...settings.urgent_keywords, kw]);
    setNewKeyword('');
  }

  function removeKeyword(kw: string) {
    set('urgent_keywords', settings.urgent_keywords.filter(k => k !== kw));
  }

  // ── Agent Questions ──
  function addQuestion() {
    const qen = newQuestion.text_en.trim();
    const qta = newQuestion.text_ta.trim();
    if (!qen) return;
    const newQ: AgentQuestion = {
      id: `custom_${Date.now()}`,
      text_en: qen,
      text_ta: qta,
      order: settings.agent_questions.length,
    };
    set('agent_questions', [...settings.agent_questions, newQ]);
    setNewQuestion({ text_en: '', text_ta: '' });
    setShowAddQuestion(false);
  }

  function removeQuestion(id: string) {
    set('agent_questions', settings.agent_questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })));
  }

  function updateQuestion(id: string, field: 'text_en' | 'text_ta', value: string) {
    set('agent_questions', settings.agent_questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  }

  // Drag-to-reorder
  function handleDragStart(idx: number) { dragItem.current = idx; }
  function handleDragEnter(idx: number) { dragOverItem.current = idx; }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    const list = [...settings.agent_questions];
    const dragged = list.splice(dragItem.current, 1)[0];
    list.splice(dragOverItem.current, 0, dragged);
    set('agent_questions', list.map((q, i) => ({ ...q, order: i })));
    dragItem.current = null;
    dragOverItem.current = null;
  }

  // ── Render ──
  const accent = sectorDetail.accent_color;

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
        <span className="text-xs text-slate-400 font-mono">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" style={{ color: accent }} />
            <h1 className="text-xl font-bold text-white font-heading">
              {sectorDetail.display_name_ta} — அமைப்புகள்
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your workspace · Changes apply on the next call
          </p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Unsaved changes
          </div>
        )}
        {saveSuccess && !isDirty && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4" noValidate>

        {/* ══ 1. BUSINESS PROFILE ══ */}
        <SectionCard icon={<Building2 className="w-4 h-4" />} title="Business Profile" accent={accent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Business / Office Name *</FieldLabel>
              <input
                className={`${inputCls} ${errors.business_name ? 'border-rose-500/60 focus:ring-rose-500/40' : ''}`}
                value={settings.business_name}
                onChange={e => set('business_name', e.target.value)}
                placeholder="Enter your business name"
              />
              {errors.business_name && <p className="text-rose-400 text-xs mt-1">{errors.business_name}</p>}
            </div>

            <div>
              <FieldLabel>Sector</FieldLabel>
              <input
                className={`${inputCls} opacity-60 cursor-not-allowed`}
                value={sectorDetail.display_name_en}
                readOnly
              />
              <p className="text-[10px] text-slate-500 mt-1">Sector is fixed at login. Contact support to change.</p>
            </div>

            <div>
              <FieldLabel hint="Displayed to callers when asking for a callback number">
                Contact Phone
              </FieldLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  className={`${inputCls} pl-9 ${errors.contact_phone ? 'border-rose-500/60' : ''}`}
                  value={settings.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)}
                  placeholder="+91 98400 00000"
                  type="tel"
                />
              </div>
              {errors.contact_phone && <p className="text-rose-400 text-xs mt-1">{errors.contact_phone}</p>}
            </div>

            <div>
              <FieldLabel>Contact Email</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  className={`${inputCls} pl-9 ${errors.contact_email ? 'border-rose-500/60' : ''}`}
                  value={settings.contact_email}
                  onChange={e => set('contact_email', e.target.value)}
                  placeholder="office@example.com"
                  type="email"
                />
              </div>
              {errors.contact_email && <p className="text-rose-400 text-xs mt-1">{errors.contact_email}</p>}
            </div>
          </div>
        </SectionCard>

        {/* ══ 2. GOOGLE ACCOUNT & GMAIL INTEGRATION (SHARED ACROSS ALL 6 WORKSPACES) ══ */}
        <SectionCard icon={<Mail className="w-4 h-4" />} title="Google Account & Gmail Integration" accent="#ea4335">
          <div className="space-y-4">
            {/* Status Header Banner */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${gmailStatus.is_connected ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {gmailStatus.is_connected ? gmailStatus.email : 'No Gmail Account Connected'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${gmailStatus.is_connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${gmailStatus.is_connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      {gmailStatus.is_connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gmailStatus.is_connected
                      ? `Active & authorized across all 6 business workspaces. Token status: ${gmailStatus.token_status}`
                      : 'Connect your Gmail account to enable isolated booking confirmations & service notices.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {gmailStatus.is_connected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConnectGmail(connectEmailInput || 'sarannivasusenthil@gmail.com')}
                      disabled={gmailLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
                      Reauthorize
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGmail}
                      disabled={gmailLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(true)}
                    disabled={gmailLoading}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Connect Gmail
                  </button>
                )}
              </div>
            </div>

            {/* Workspaces Shared Pill List */}
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Shared Workspace Access (1 Account → 6 Workspaces)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'panchayat_health', label: 'Panchayat Health Help Desk', current: sectorDetail.id === 'panchayat_health' },
                  { id: 'clinic', label: 'Saran Primary Clinic', current: sectorDetail.id === 'clinic' },
                  { id: 'vet_clinic', label: 'Govt Veterinary Centre', current: sectorDetail.id === 'vet_clinic' },
                  { id: 'hotel_lodge', label: 'Saran Hotel & Lodge', current: sectorDetail.id === 'hotel_lodge' },
                  { id: 'restaurant', label: 'Saran Restaurant & Catering', current: sectorDetail.id === 'restaurant' },
                  { id: 'coaching', label: 'Saran Coaching Academy', current: sectorDetail.id === 'coaching' },
                ].map((w) => (
                  <span
                    key={w.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 ${
                      w.current
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-white/5'
                    }`}
                  >
                    <CheckCircle2 className={`w-3 h-3 ${w.current ? 'text-cyan-400' : 'text-slate-500'}`} />
                    {w.label} {w.current && <span className="text-[10px] uppercase font-bold text-cyan-400">(Current)</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Email Dispatch Box */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Test Workspace Notification Email
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sends a live branded notification for <strong>{sectorDetail.name}</strong> ensuring tenant data isolation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={!gmailStatus.is_connected || testEmailSending}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className={`w-3 h-3 ${testEmailSending ? 'animate-pulse' : ''}`} />
                  {testEmailSending ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  className={`${inputCls} text-xs py-1.5`}
                  placeholder={`Recipient email (defaults to ${gmailStatus.email || 'connected address'})`}
                  value={customTestEmail}
                  onChange={(e) => setCustomTestEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Connect Modal Overlay */}
            {showConnectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Connect Google / Gmail</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Enter the Gmail address you want to authorize across all six Vaayil AI workspaces:
                  </p>
                  <div>
                    <input
                      type="email"
                      className={inputCls}
                      value={connectEmailInput}
                      onChange={(e) => setConnectEmailInput(e.target.value)}
                      placeholder="e.g. sarannivasusenthil@gmail.com"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectGmail(connectEmailInput)}
                      disabled={!connectEmailInput || gmailLoading}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50"
                    >
                      {gmailLoading ? 'Connecting...' : 'Authorize Gmail'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══ 3. WORKING HOURS ══ */}
        <SectionCard icon={<Clock className="w-4 h-4" />} title="Working Hours" accent="#06b6d4">

          {/* Open / Close time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Opening Time</FieldLabel>
              <input
                type="time"
                className={`${inputCls} ${errors.open_time ? 'border-rose-500/60' : ''}`}
                value={settings.open_time}
                onChange={e => set('open_time', e.target.value)}
              />
              {errors.open_time && <p className="text-rose-400 text-xs mt-1">{errors.open_time}</p>}
            </div>
            <div>
              <FieldLabel>Closing Time</FieldLabel>
              <input
                type="time"
                className={inputCls}
                value={settings.close_time}
                onChange={e => set('close_time', e.target.value)}
              />
            </div>
          </div>

          {/* Working days */}
          <div>
            <FieldLabel>Working Days</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS_OF_WEEK.map(day => {
                const active = settings.working_days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? settings.working_days.filter(d => d !== day)
                        : [...settings.working_days, day];
                      set('working_days', next);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900/60 border-white/[0.06] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.working_days && <p className="text-rose-400 text-xs mt-1">{errors.working_days}</p>}
            <p className="text-[10px] text-slate-500 mt-1.5">
              Active: {settings.working_days.map(d => DAY_LABELS[d]).join(', ') || 'None selected'}
            </p>
          </div>

          {/* Holiday settings — not connected */}
          <NotConnected label="Holiday / Closure Dates" />
        </SectionCard>

        {/* ══ 3. BOOKING CONFIGURATION ══ */}
        <SectionCard icon={<Calendar className="w-4 h-4" />} title="Booking Configuration" accent="#f59e0b">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel hint="Duration of each appointment slot in minutes">
                Slot Duration (minutes)
              </FieldLabel>
              <select
                className={inputCls}
                value={settings.slot_length_minutes}
                onChange={e => set('slot_length_minutes', Number(e.target.value))}
              >
                {SLOT_DURATIONS.map(d => (
                  <option key={d} value={d}>{d} min{d >= 60 ? ` (${d / 60}h)` : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <p className="text-xs text-slate-400">
                At <strong className="text-white">{settings.slot_length_minutes}min</strong> per slot, your{' '}
                {settings.open_time}–{settings.close_time} window holds up to{' '}
                <strong className="text-cyan-400">
                  {Math.floor(
                    ((parseInt(settings.close_time) * 60 + parseInt(settings.close_time.split(':')[1])) -
                     (parseInt(settings.open_time) * 60 + parseInt(settings.open_time.split(':')[1]))) /
                    settings.slot_length_minutes
                  )} slots
                </strong> per day.
              </p>
            </div>
          </div>

          {/* Sector booking fields — read-only display */}
          <div>
            <FieldLabel hint="These fields are collected during each booking call">
              Booking Fields (Sector-Specific)
            </FieldLabel>
            <div className="space-y-1.5 mt-1">
              {sectorDetail.slots.map((slot: SlotDefinition) => (
                <div
                  key={slot.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-white/[0.05] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">{slot.label_en}</span>
                    <span className="text-slate-500 font-mono">({slot.label_ta})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-white/5">
                      {slot.type}
                    </span>
                    {slot.required && (
                      <span className="text-[10px] text-cyan-400 font-semibold">required</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Booking field definitions are managed in the sector configuration. Contact support to add or remove fields.
            </p>
          </div>
        </SectionCard>

        {/* ══ 4. LANGUAGE SETTINGS ══ */}
        <SectionCard icon={<Globe2 className="w-4 h-4" />} title="Language Settings" accent="#a78bfa">
          <div>
            <FieldLabel hint="Controls which language the AI voice agent responds in">
              Default Language Mode
            </FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              {LANGUAGE_MODES.map(lang => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => set('language_mode', lang.value)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    settings.language_mode === lang.value
                      ? 'bg-purple-500/15 border-purple-500/50'
                      : 'bg-slate-900/60 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <p className={`text-sm font-bold ${settings.language_mode === lang.value ? 'text-purple-300' : 'text-slate-300'}`}>
                    {lang.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{lang.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-400" />
              <span>
                This language mode is passed to the <strong className="text-slate-200">Gnani Prisma STT</strong> and{' '}
                <strong className="text-slate-200">Gnani Timbre TTS</strong> APIs for every call in this workspace.
                Tanglish is recommended for Tamil Nadu businesses.
              </span>
            </div>
          </div>
        </SectionCard>

        {/* ══ 5. AI AGENT QUESTIONS ══ */}
        <SectionCard icon={<MessageSquare className="w-4 h-4" />} title="AI Agent Questions" accent="#06b6d4">
          <div className="mb-2 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              These are the questions the AI agent asks callers to collect booking information.
              Drag to reorder · Edit English and Tamil text · Add custom questions · Delete questions.
            </span>
          </div>

          <div className="space-y-2">
            {settings.agent_questions
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-white/10 group transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-slate-600 cursor-grab mt-2 shrink-0 group-hover:text-slate-400 transition-colors" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">English</p>
                        <input
                          className={`${inputCls} py-1.5 text-xs`}
                          value={q.text_en}
                          onChange={e => updateQuestion(q.id, 'text_en', e.target.value)}
                          placeholder="English question text"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 mb-1">Tamil / தமிழ்</p>
                        <input
                          className={`${inputCls} py-1.5 text-xs font-tamil`}
                          value={q.text_ta}
                          onChange={e => updateQuestion(q.id, 'text_ta', e.target.value)}
                          placeholder="Tamil question text (optional)"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer mt-1 shrink-0"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Add new question */}
          {showAddQuestion ? (
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-3 mt-2">
              <p className="text-xs font-semibold text-cyan-300">Add New Question</p>
              <input
                className={`${inputCls} text-xs`}
                placeholder="English question text *"
                value={newQuestion.text_en}
                onChange={e => setNewQuestion(prev => ({ ...prev, text_en: e.target.value }))}
              />
              <input
                className={`${inputCls} text-xs font-tamil`}
                placeholder="Tamil question text (optional)"
                value={newQuestion.text_ta}
                onChange={e => setNewQuestion(prev => ({ ...prev, text_ta: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={!newQuestion.text_en.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddQuestion(false); setNewQuestion({ text_en: '', text_ta: '' }); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddQuestion(true)}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/40 text-slate-500 hover:text-cyan-400 text-xs transition-colors cursor-pointer w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Add a custom question
            </button>
          )}
        </SectionCard>

        {/* ══ 6. VOICE SETTINGS ══ */}
        <SectionCard icon={<Mic2 className="w-4 h-4" />} title="Voice Settings (Gnani Timbre TTS)" accent="#f97316">
          <div>
            <FieldLabel hint="All voices are connected to the Gnani Timbre v3.0 API">
              AI Agent Voice
            </FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {GNANI_VOICES.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => set('tts_voice', v.value)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    settings.tts_voice === v.value
                      ? 'bg-orange-500/15 border-orange-500/50'
                      : 'bg-slate-900/60 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Mic2 className={`w-3.5 h-3.5 ${settings.tts_voice === v.value ? 'text-orange-400' : 'text-slate-600'}`} />
                    <span className={`text-sm font-bold ${settings.tts_voice === v.value ? 'text-orange-300' : 'text-slate-300'}`}>
                      {v.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{v.gender} · {v.note}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-400" />
              <span>
                Voice selection is live and connected to <strong className="text-slate-200">Gnani Timbre v3.0</strong>.
                Each voice uses the Tamil Nadu accent profile optimised for local business contexts.
                Voice preview is not available from the settings page — test using the Live Call page.
              </span>
            </div>
          </div>
        </SectionCard>

        {/* ══ 7. URGENT KEYWORDS ══ */}
        <SectionCard icon={<ShieldAlert className="w-4 h-4" />} title="Urgent Triage Keywords" accent="#f43f5e">
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <strong>Keyword-based alert — not a medical diagnosis.</strong>
              {' '}The safety engine matches these words in real time during calls (Tamil, Tanglish, English).
              It handles negation ("no chest pain") and past events ("last year I had…") to reduce false alarms.
              Changes take effect on the next call. Run the Safety Test Sheet to validate.
            </div>
          </div>

          {/* Tag display */}
          <div>
            <FieldLabel>Active Keywords ({settings.urgent_keywords.length})</FieldLabel>
            <div className="flex flex-wrap gap-1.5 mt-1 min-h-[2.5rem] p-2 rounded-xl bg-slate-900/40 border border-white/[0.06]">
              {settings.urgent_keywords.length === 0 && (
                <span className="text-slate-600 text-xs self-center px-1">No keywords added yet.</span>
              )}
              {settings.urgent_keywords.map(kw => (
                <span
                  key={kw}
                  className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-mono bg-rose-950/60 border border-rose-500/30 text-rose-300"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="p-0.5 rounded-full hover:bg-rose-500/20 cursor-pointer text-rose-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.urgent_keywords && <p className="text-rose-400 text-xs mt-1">{errors.urgent_keywords}</p>}
          </div>

          {/* Add keyword */}
          <div className="flex gap-2">
            <input
              className={`${inputCls} flex-1 font-mono text-xs`}
              placeholder="Type a keyword and press Add (e.g. nenju vali)"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          <p className="text-[10px] text-slate-500">
            Tamil script (நெஞ்சு வலி), Tanglish (nenju vali), and English (chest pain) keywords all work.
            Run the Safety Test Sheet after any change to validate recall and false-alarm rates.
          </p>
        </SectionCard>

        {/* ══ 8. PRIVACY SETTINGS ══ */}
        <SectionCard icon={<Lock className="w-4 h-4" />} title="Privacy & Data Settings" accent="#8b5cf6" defaultOpen={false}>
          {/* Store audio toggle — connected */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={settings.store_audio}
                  onChange={e => set('store_audio', e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-10 h-5 rounded-full transition-colors"
                  style={{ background: settings.store_audio ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
                    style={{ transform: settings.store_audio ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-200">Store Call Audio Recordings</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  When disabled (default), audio is processed in memory and deleted immediately after STT transcription.
                  Enable only for quality assurance purposes.
                </p>
              </div>
            </label>
          </div>

          {/* Call Recording Consent Banner — Connected */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(settings.consent_banner_enabled)}
                  onChange={e => set('consent_banner_enabled', e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-10 h-5 rounded-full transition-colors"
                  style={{ background: settings.consent_banner_enabled ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
                    style={{ transform: settings.consent_banner_enabled ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-200">Call Recording Consent Notification</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Play an automated consent disclosure to callers before recording starts (compliant with DPDP Act &amp; Telecom norms).
                </p>
              </div>
            </label>
          </div>

          {/* Data Retention Period — Connected */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Data Retention Period (Days)
            </label>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.data_retention_days ?? 90}
                onChange={e => set('data_retention_days', parseInt(e.target.value, 10) || 90)}
                className={inputCls}
              />
              <span className="text-xs text-slate-400 shrink-0">days</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transcripts and call metadata are retained for this period (1 to 3650 days). Default is 90 days.
            </p>
          </div>

          {/* Features not yet connected */}
          <div className="space-y-2 pt-1">
            <NotConnected label="GDPR / IT Act Automated Data Deletion Request" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-400" />
            <span>
              Audio recordings are governed by India's IT (Amendment) Act. The store_audio flag is saved to the database and read by the voice engine on every call.
            </span>
          </div>
        </SectionCard>

        {/* ══ SAVE / CANCEL ══ */}
        <div className="flex items-center justify-between pt-2 pb-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Cancel Changes
          </button>

          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ backgroundColor: isDirty ? accent : '#334155', boxShadow: isDirty ? `0 0 20px ${accent}30` : 'none' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-800" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
