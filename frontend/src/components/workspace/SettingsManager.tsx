import React, { useState, useEffect } from 'react';
import type { SectorDetail, SectorSettingsData } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Card } from '../ui/Card';
import {
  Sliders,
  Save,
  Volume2,
  ShieldAlert,
  Loader2,
  Clock,
  Info,
} from 'lucide-react';

export const SettingsManager: React.FC<{ sectorDetail: SectorDetail }> = ({ sectorDetail }) => {
  const { toast } = useToast();
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
      toast({ type: 'success', message: 'Settings saved successfully!' });
    } catch (e) {
      console.error(e);
      toast({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const accent = sectorDetail.accent_color;

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
        <span className="text-xs font-mono text-[#9AA7BE]">Loading settings…</span>
      </div>
    );
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-[#E8EDF9] text-xs focus:outline-none focus:ring-1 transition-all"
    + " bg-[#080B18] border border-white/[0.08] focus:ring-[#8065FF]/40 focus:border-[#8065FF]/50";

  const selectClass = inputClass;

  const sectionTitleClass = "text-xs font-mono uppercase tracking-wider font-bold text-[#E8EDF9] flex items-center gap-2 mb-4";

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E8EDF9] font-heading font-tamil">
          {sectorDetail.display_name_ta} — அமைப்புகள்
        </h1>
        <p className="text-sm text-[#9AA7BE] mt-0.5">
          Workspace configuration, voice and language preferences, urgent keywords
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Business Profile */}
        <Card variant="elevated" padding="md">
          <h3 className={sectionTitleClass}>
            <Sliders className="w-4 h-4" style={{ color: '#32D8E8' }} />
            Business Profile & Operation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Business / Office Name</label>
              <input
                type="text"
                value={settings.business_name}
                onChange={e => setSettings({ ...settings, business_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Working Hours</label>
              <input
                type="text"
                value={settings.working_hours}
                onChange={e => setSettings({ ...settings, working_hours: e.target.value })}
                placeholder="09:00 AM - 06:00 PM"
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Voice & Language */}
        <Card variant="elevated" padding="md">
          <h3 className={sectionTitleClass}>
            <Volume2 className="w-4 h-4" style={{ color: '#8065FF' }} />
            Gnani Voice & Language Mode
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Default Language Mode</label>
              <select
                value={settings.language_mode}
                onChange={e => setSettings({ ...settings, language_mode: e.target.value })}
                className={selectClass}
              >
                <option value="tanglish">Tanglish (Tamil + English code-mixed)</option>
                <option value="tamil">தமிழ் (Pure Tamil)</option>
                <option value="english">English (Indian English)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Gnani Timbre TTS Voice</label>
              <select
                value={settings.tts_voice}
                onChange={e => setSettings({ ...settings, tts_voice: e.target.value })}
                className={selectClass}
              >
                <option value="Shivani">Shivani (Female · Default)</option>
                <option value="Avinash">Avinash (Male)</option>
                <option value="Lakshmi">Lakshmi (Female)</option>
                <option value="Kalpana">Kalpana (Female)</option>
                <option value="Shubham">Shubham (Male)</option>
                <option value="Prakash">Prakash (Male)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 3: Slot Length */}
        <Card variant="elevated" padding="md">
          <h3 className={sectionTitleClass}>
            <Clock className="w-4 h-4" style={{ color: '#FFBF69' }} />
            Booking Slot Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Slot Length (minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={settings.slot_length_minutes}
                onChange={e => setSettings({ ...settings, slot_length_minutes: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.store_audio}
                    onChange={e => setSettings({ ...settings, store_audio: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className="w-10 h-5 rounded-full transition-colors"
                    style={{ background: settings.store_audio ? '#8065FF' : 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
                      style={{ transform: settings.store_audio ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-[#E8EDF9]">Store Audio Recordings</span>
                  <p className="text-[10px] text-[#9AA7BE] mt-0.5">Off by default — Noise Lab deletes temp files after use</p>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Section 4: Urgent Keywords */}
        <Card variant="elevated" padding="md">
          <h3 className={sectionTitleClass}>
            <ShieldAlert className="w-4 h-4" style={{ color: '#FF647C' }} />
            Urgent Triage Keywords
          </h3>
          <div
            className="flex items-start gap-2 p-3 rounded-xl mb-4 text-xs"
            style={{ background: 'rgba(255,100,124,0.07)', border: '1px solid rgba(255,100,124,0.2)' }}
          >
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#FF647C' }} />
            <div style={{ color: '#FF647C' }}>
              <strong>Keyword-based alert, not a medical diagnosis.</strong>{' '}
              The safety engine matches these words in Tamil, Tanglish and English while handling negation and past events.
            </div>
          </div>
          <label className="text-[11px] font-mono text-[#9AA7BE] block mb-1.5">Keywords (comma separated)</label>
          <textarea
            rows={3}
            value={keywordsText}
            onChange={e => setKeywordsText(e.target.value)}
            className={`${inputClass} resize-none font-mono`}
            placeholder="chest pain, nenju vali, accident, heavy bleeding, snake bite"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {keywordsText.split(',').map(k => k.trim()).filter(Boolean).map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ background: 'rgba(255,100,124,0.12)', color: '#FF647C', border: '1px solid rgba(255,100,124,0.25)' }}
              >
                {kw}
              </span>
            ))}
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-[#080B18] transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: accent, boxShadow: `0 0 20px ${accent}30` }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

