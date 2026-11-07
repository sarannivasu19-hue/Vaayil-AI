import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, LogIn, Sparkles, CheckCircle2, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import type { TNDistrict } from '../../data/tamilNaduDistricts';
import type { SectorCategory } from './SectorSelector';
import type { Sector } from '../../types';
import { api } from '../../services/api';
import { REGISTERED_BUSINESSES_AND_SERVICES } from '../../data/registeredBusinesses';

interface BusinessSelectorProps {
  district: TNDistrict;
  sectorCategory: SectorCategory;
  onSelectBusiness: (sector: Sector) => void;
  onBack: () => void;
  onBackToDistricts?: () => void;
}

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  district,
  sectorCategory,
  onSelectBusiness,
  onBack,
  onBackToDistricts,
}) => {
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSectors()
      .then((data) => {
        setAllSectors(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load sector data');
        setLoading(false);
      });
  }, []);

  // 1. Find corresponding DB sector object for the active category
  const dbSector = allSectors.find(
    (s) =>
      s.id === sectorCategory.id ||
      s.name?.toLowerCase().includes(sectorCategory.id.toLowerCase())
  );

  // 2. Find registry profile and check if it operates in this selected district
  const registryEntry = REGISTERED_BUSINESSES_AND_SERVICES.find(
    (b) => b.sectorId === sectorCategory.id
  );

  const operatesInDistrict = registryEntry?.districts.includes(district.id) ?? false;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#080B18', color: '#E8EDF9' }}
    >
      {/* Header with full breadcrumbs */}
      <header
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(8,11,24,0.96)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm cursor-pointer border-none px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#9AA7BE' }}
            title="Back to Sector Categories"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          {onBackToDistricts && (
            <button
              onClick={onBackToDistricts}
              className="hidden sm:flex items-center gap-1.5 text-xs cursor-pointer border-none px-2.5 py-1.5 rounded-lg transition-colors text-slate-400 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              title="Change Tamil Nadu District"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Districts</span>
            </button>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs mb-0.5" style={{ color: '#6B7A99' }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <strong className="text-slate-300">{district.en}</strong> ({district.ta})
            </span>
            <span style={{ color: '#2A3448' }}>›</span>
            <span style={{ color: sectorCategory.color }}>{sectorCategory.nameEn}</span>
          </div>
          <h1
            className="text-base font-bold"
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
          >
            Registered Business &amp; Service Offerings
          </h1>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 px-4 py-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
                style={{ borderColor: sectorCategory.color }}
              />
              <p className="text-sm" style={{ color: '#6B7A99' }}>
                Querying registered businesses in {district.en}…
              </p>
            </div>
          )}

          {error && (
            <div
              className="p-4 rounded-xl text-sm text-center"
              style={{
                background: 'rgba(255,100,124,0.08)',
                border: '1px solid rgba(255,100,124,0.20)',
                color: '#FF647C',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Context Summary Banner */}
              <div
                className="p-4 rounded-2xl flex items-center justify-between gap-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div>
                  <p className="text-xs text-slate-400">
                    Active District Filter:{' '}
                    <span className="text-white font-semibold">{district.en} ({district.ta})</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category: <span style={{ color: sectorCategory.color }}>{sectorCategory.nameEn}</span>
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: operatesInDistrict ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
                    color: operatesInDistrict ? '#4ADE80' : '#F59E0B',
                    border: `1px solid ${operatesInDistrict ? 'rgba(74,222,128,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  }}
                >
                  {operatesInDistrict ? '1 Verified Business Operating' : 'No Business in this District'}
                </div>
              </div>

              {/* CASE 1: MATCHING REGISTERED BUSINESS IN THIS DISTRICT */}
              {operatesInDistrict && dbSector && registryEntry ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Registered Enterprise in {district.en}
                    </h2>

                    {/* Business Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        border: `1px solid ${sectorCategory.color}40`,
                        boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{ background: sectorCategory.bg, border: `1px solid ${sectorCategory.color}30` }}
                          >
                            {sectorCategory.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">
                                {registryEntry.nameEn}
                              </h3>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                style={{ background: 'rgba(50,216,232,0.15)', color: '#32D8E8' }}
                              >
                                Registered
                              </span>
                            </div>
                            <p className="text-xs font-tamil text-slate-400 mt-0.5">
                              {registryEntry.nameTa}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 max-w-lg">
                              {registryEntry.taglineEn}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-white/5">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                {registryEntry.phone}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                {registryEntry.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sign in button for this verified business */}
                        <button
                          onClick={() => onSelectBusiness(dbSector)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto cursor-pointer border-none transition-transform active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${sectorCategory.color} 0%, #3B82F6 100%)`,
                            color: '#070B14',
                            boxShadow: `0 4px 14px ${sectorCategory.color}40`,
                          }}
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Login to Workspace</span>
                        </button>
                      </div>

                      {/* Configurable Service Offerings */}
                      <div className="mt-5 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5" style={{ color: sectorCategory.color }} />
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Available Service Offerings ({registryEntry.services.length} Configured)
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {registryEntry.services.map((srv) => (
                            <div
                              key={srv.id}
                              className="p-3 rounded-xl flex items-start gap-2.5"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <CheckCircle2
                                className="w-4 h-4 shrink-0 mt-0.5"
                                style={{ color: sectorCategory.color }}
                              />
                              <div>
                                <p className="text-xs font-semibold text-slate-200">
                                  {srv.nameEn}
                                </p>
                                <p className="text-[11px] font-tamil text-slate-400">
                                  {srv.nameTa}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {srv.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                /* CASE 2: NO REGISTERED BUSINESS IN THIS DISTRICT */
                <div
                  className="p-8 rounded-2xl text-center space-y-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                  }}
                >
                  <Building2
                    className="w-12 h-12 mx-auto text-slate-600 opacity-60"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-300">
                      No Registered {sectorCategory.nameEn} in {district.en} Yet
                    </h3>
                    <p className="text-xs font-tamil text-slate-500 mt-1">
                      {district.ta} மாவட்டத்தில் இந்த பிரிவில் இதுவரை பதிவுசெய்யப்பட்ட வணிகங்கள் இல்லை.
                    </p>
                    <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                      Would you like to register your business in {district.en}? Contact our onboarding desk or test the voice agent using the interactive demo workspace below.
                    </p>
                  </div>
                </div>
              )}

              {/* ALWAYS AVAILABLE: SEPARATE DEMO WORKSPACE OPTION */}
              {dbSector && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Interactive Demo Workspace
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evaluate the AI Voice Receptionist capabilities with simulated calls and analytics
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(201,162,39,0.15)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }}
                    >
                      Demo Sandbox
                    </span>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer"
                    style={{
                      background: 'rgba(201,162,39,0.04)',
                      border: '1px solid rgba(201,162,39,0.20)',
                    }}
                    onClick={() => onSelectBusiness(dbSector)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: 'rgba(201,162,39,0.1)' }}
                      >
                        {sectorCategory.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          Launch Demo: {dbSector.display_name_en || dbSector.name}
                        </p>
                        <p className="text-xs text-slate-400 font-tamil">
                          {dbSector.display_name_ta}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A227]">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
