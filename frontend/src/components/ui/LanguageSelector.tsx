import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import type { AppLanguage } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'compact' | 'segmented' | 'cards';
  accentColor?: string;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  accentColor = '#8065FF',
  className = '',
}) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  // 1. COMPACT DROPDOWN / PILL (Great for Navbar and Workspace Header)
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none"
          style={{
            background: dropdownOpen ? 'rgba(128,101,255,0.15)' : 'rgba(23,31,51,0.85)',
            borderColor: dropdownOpen ? accentColor : 'rgba(255,255,255,0.12)',
            color: '#E8EDF9',
          }}
          title="Switch Application Language (தமிழ் / English / Tanglish)"
          aria-label="Language Selector"
        >
          <Globe className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <span>{activeLang.label}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 opacity-80" />
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl p-1.5 z-50 border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: '#0E1326',
              borderColor: 'rgba(255,255,255,0.12)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
            }}
          >
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Select Language
            </div>
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as AppLanguage);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[13px]">{lang.nativeLabel}</span>
                    <span className="text-[10px] text-slate-400">{lang.desc}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" style={{ color: accentColor }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. SEGMENTED SWITCHER (Ideal for toolbars or modal headers)
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl border bg-black/40 border-white/10 ${className}`}
      >
        {supportedLanguages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code as AppLanguage)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                background: isSelected ? accentColor : 'transparent',
              }}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    );
  }

  // 3. CARDS (In SettingsManager)
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {supportedLanguages.map((lang) => {
        const isSelected = lang.code === language;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code as AppLanguage)}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
              isSelected
                ? 'ring-2'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
            style={{
              borderColor: isSelected ? accentColor : undefined,
              backgroundColor: isSelected ? `${accentColor}12` : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{lang.nativeLabel}</span>
              {isSelected ? (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: accentColor, color: '#fff' }}
                >
                  <Check className="w-3 h-3" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-white/20" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{lang.desc}</p>
          </button>
        );
      })}
    </div>
  );
};

