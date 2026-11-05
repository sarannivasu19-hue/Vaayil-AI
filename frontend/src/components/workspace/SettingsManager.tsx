import React, { useState, useEffect } from 'react';
import type { SectorDetail, SectorSettingsData } from '../../types';
import { api } from '../../services/api';
import {
  Sliders,
  Save,
  CheckCircle2,
  Volume2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export const SettingsManager: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail }) => {
  const [settings, setSettings] = useState<SectorSettingsData>({
    business_name: sectorDetail.name,
    working_hours: '09:00 AM - 06:00 PM',
    slot_length_minutes: 30,
    language_mode: 'tanglish',
    tts_voice: 'Shivani',
    urgent_keywords: sectorDetail.urgent_keywords || [],
    store_audio: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [keywordsText, setKeywordsText] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
        setKeywordsText((data.urgent_keywords || []).join(', '));
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectorDetail.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const kwList = keywordsText
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const updated = await api.updateSettings({
        ...settings,
        urgent_keywords: kwList,
      });
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const accent = sectorDetail.accent_color;

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <span className="text-xs font-mono">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto py-2">
      <div className="pb-3 border-b border-white/10">
        <h1 className="text-2xl font-extrabold text-white font-tamil tracking-tight">
          {sectorDetail.display_name_ta} — அமைப்புகள் (Settings)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Workspace Parameters, Operational Hours, Voice Configuration & Urgent Keywords
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Business Profile */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Business Profile & Operation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Business / Office Name</label>
              <input
                type="text"
                value={settings.business_name}
                onChange={e => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Working Hours Schedule</label>
              <input
                type="text"
                value={settings.working_hours}
                onChange={e => setSettings({ ...settings, working_hours: e.target.value })}
                placeholder="09:00 AM - 06:00 PM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Voice & Language Settings */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            Gnani Voice & Language Mode
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Default Language Mode</label>
              <select
                value={settings.language_mode}
                onChange={e => setSettings({ ...settings, language_mode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="tanglish">Tanglish (Tamil + English code-mixed)</option>
                <option value="tamil">தமிழ் (Pure Tamil)</option>
                <option value="english">English (Indian English)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Gnani Timbre TTS Production Voice</label>
              <select
                value={settings.tts_voice}
                onChange={e => setSettings({ ...settings, tts_voice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="Shivani">Shivani (Female - Default recommended)</option>
                <option value="Avinash">Avinash (Male)</option>
                <option value="Lakshmi">Lakshmi (Female)</option>
                <option value="Kalpana">Kalpana (Female)</option>
                <option value="Shubham">Shubham (Male)</option>
                <option value="Prakash">Prakash (Male)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Urgent Case Triage Keywords */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Editable Urgent Triage Keywords (Comma Separated)
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The safety engine flags emergency conditions matching these keywords in Tamil, Tanglish or English, while handling negation ('no chest pain') and past events.
          </p>

          <textarea
            rows={3}
            value={keywordsText}
            onChange={e => setKeywordsText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500/50"
            placeholder="chest pain, nenju vali, accident, heavy bleeding, snake bite"
          />
        </div>

        {/* Save button & status */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully!
            </span>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
