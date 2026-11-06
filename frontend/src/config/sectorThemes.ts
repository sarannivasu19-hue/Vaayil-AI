/**
 * Sector Visual Themes — Professional Enterprise Identity
 * 
 * Each of the six sectors is defined by a realistic photographic background
 * (loaded in Stage 2), dark colour-graded overlay, consistent typography,
 * and calibrated WCAG AA contrast.
 */

export interface SectorVisualTheme {
  id: string;
  name_en: string;
  name_ta: string;
  tagline_ta: string;
  tagline_en: string;

  // Gradients
  gradientStart: string;
  gradientEnd: string;
  gradient: {
    from: string;
    to: string;
    css: string;
    radial: string;
  };

  // Accents and lighting
  accent: string;
  accentSecondary: string;
  glow: string;

  // Surfaces and borders
  surfaceTint: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderHighlight: string;
  badgeBg: string;
  badgeText: string;

  // Photographic Assets
  imagePath: string;
  mobileImagePath: string;
  overlayGradient: string;

  // Typography & Contrast (WCAG AA/AAA)
  textPrimary: string;
  textSecondary: string;
}

export const SECTOR_THEMES: Record<string, SectorVisualTheme> = {
  panchayat_health: {
    id: 'panchayat_health',
    name_en: 'Health Help Desk',
    name_ta: 'ஆரம்ப சுகாதார நிலையம்',
    tagline_ta: 'கிராமப்புற குடிமக்களுக்கான உடனடி தாய்-சேய் நல மற்றும் அவசர உதவி.',
    tagline_en: 'Rural healthcare helpline for immunization, maternal care & health emergencies.',
    gradientStart: '#06262B',
    gradientEnd: '#0B3D3A',
    gradient: {
      from: '#06262B',
      to: '#0B3D3A',
      css: 'linear-gradient(135deg, #06262B 0%, #083332 50%, #0B3D3A 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #0B3D3A 0%, #06262B 75%, #031417 100%)',
    },
    accent: '#35D7E8',
    accentSecondary: '#7DE8F5',
    glow: 'rgba(53, 215, 232, 0.35)',
    surfaceTint: 'rgba(6, 38, 43, 0.92)',
    surface: '#0A2B2D',
    surfaceElevated: '#0E3639',
    border: 'rgba(53, 215, 232, 0.16)',
    borderHighlight: 'rgba(53, 215, 232, 0.45)',
    badgeBg: 'rgba(53, 215, 232, 0.12)',
    badgeText: '#35D7E8',
    imagePath: '/sectors/panchayat-health.webp',
    mobileImagePath: '/sectors/panchayat-health.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(6,38,43,0.85) 0%, rgba(11,61,58,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },

  clinic: {
    id: 'clinic',
    name_en: 'Private Clinic',
    name_ta: 'மருத்துவ மனை',
    tagline_ta: 'மருத்துவ ஆலோசனைகள் மற்றும் முன் சந்திப்புகளுக்கான தானியங்கி குரல் சேவை.',
    tagline_en: 'Automated appointments, patient triage and doctor scheduling.',
    gradientStart: '#0A1430',
    gradientEnd: '#1A1F5C',
    gradient: {
      from: '#0A1430',
      to: '#1A1F5C',
      css: 'linear-gradient(135deg, #0A1430 0%, #121A46 50%, #1A1F5C 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #1A1F5C 0%, #0A1430 75%, #050A1A 100%)',
    },
    accent: '#9275FF',
    accentSecondary: '#B9A6FF',
    glow: 'rgba(146, 117, 255, 0.35)',
    surfaceTint: 'rgba(10, 20, 48, 0.92)',
    surface: '#0F1A3D',
    surfaceElevated: '#15234F',
    border: 'rgba(146, 117, 255, 0.18)',
    borderHighlight: 'rgba(146, 117, 255, 0.50)',
    badgeBg: 'rgba(146, 117, 255, 0.14)',
    badgeText: '#B9A6FF',
    imagePath: '/sectors/clinic.webp',
    mobileImagePath: '/sectors/clinic.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(10,20,48,0.85) 0%, rgba(26,31,92,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },

  vet_clinic: {
    id: 'vet_clinic',
    name_en: 'Veterinary Clinic',
    name_ta: 'கால்நடை மருத்துவமனை',
    tagline_ta: 'செல்லப்பிராணிகள் மற்றும் கால்நடைகளுக்கான மருத்துவப் பதிவு & அவசர சிகிச்சை.',
    tagline_en: 'Pet care appointments, livestock checkups, vaccination & emergency triage.',
    gradientStart: '#0A2418',
    gradientEnd: '#123B2A',
    gradient: {
      from: '#0A2418',
      to: '#123B2A',
      css: 'linear-gradient(135deg, #0A2418 0%, #0E3020 50%, #123B2A 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #123B2A 0%, #0A2418 75%, #04120B 100%)',
    },
    accent: '#42D6A4',
    accentSecondary: '#7CF0C7',
    glow: 'rgba(66, 214, 164, 0.35)',
    surfaceTint: 'rgba(10, 36, 24, 0.92)',
    surface: '#0E2E20',
    surfaceElevated: '#143C2B',
    border: 'rgba(66, 214, 164, 0.16)',
    borderHighlight: 'rgba(66, 214, 164, 0.45)',
    badgeBg: 'rgba(66, 214, 164, 0.12)',
    badgeText: '#42D6A4',
    imagePath: '/sectors/veterinary.webp',
    mobileImagePath: '/sectors/veterinary.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(10,36,24,0.85) 0%, rgba(18,59,42,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },

  hotel_lodge: {
    id: 'hotel_lodge',
    name_en: 'Hotel & Lodge',
    name_ta: 'ஹோட்டல் & தங்குமிடம்',
    tagline_ta: 'அறை முன்பதிவு, சோதனை நேரம் மற்றும் விருந்தினர் கோரிக்கைகளுக்கான உதவி.',
    tagline_en: 'Room booking, check-in schedules, amenities & 24/7 guest reception.',
    gradientStart: '#1A1610',
    gradientEnd: '#3A2C12',
    gradient: {
      from: '#1A1610',
      to: '#3A2C12',
      css: 'linear-gradient(135deg, #1A1610 0%, #272011 50%, #3A2C12 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #3A2C12 0%, #1A1610 75%, #0E0C08 100%)',
    },
    accent: '#FFBF69',
    accentSecondary: '#FFD79E',
    glow: 'rgba(255, 191, 105, 0.35)',
    surfaceTint: 'rgba(26, 22, 16, 0.92)',
    surface: '#241E15',
    surfaceElevated: '#31281A',
    border: 'rgba(255, 191, 105, 0.16)',
    borderHighlight: 'rgba(255, 191, 105, 0.45)',
    badgeBg: 'rgba(255, 191, 105, 0.12)',
    badgeText: '#FFBF69',
    imagePath: '/sectors/hotel-lodge.webp',
    mobileImagePath: '/sectors/hotel-lodge.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(26,22,16,0.85) 0%, rgba(58,44,18,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },

  restaurant: {
    id: 'restaurant',
    name_en: 'Restaurant & Catering',
    name_ta: 'உணவகம் & கேட்டரிங்',
    tagline_ta: 'மேஜை முன்பதிவு, விசேஷ உணவு ஆர்டர்கள் மற்றும் கேட்டரிங் சேவைகள்.',
    tagline_en: 'Table reservations, catering banquets, party orders & menu inquiries.',
    gradientStart: '#2A0F10',
    gradientEnd: '#4A1B17',
    gradient: {
      from: '#2A0F10',
      to: '#4A1B17',
      css: 'linear-gradient(135deg, #2A0F10 0%, #3A1413 50%, #4A1B17 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #4A1B17 0%, #2A0F10 75%, #140707 100%)',
    },
    accent: '#FF886F',
    accentSecondary: '#FFA996',
    glow: 'rgba(255, 136, 111, 0.35)',
    surfaceTint: 'rgba(42, 15, 16, 0.92)',
    surface: '#331415',
    surfaceElevated: '#421A1B',
    border: 'rgba(255, 136, 111, 0.16)',
    borderHighlight: 'rgba(255, 136, 111, 0.45)',
    badgeBg: 'rgba(255, 136, 111, 0.12)',
    badgeText: '#FF886F',
    imagePath: '/sectors/restaurant-catering.webp',
    mobileImagePath: '/sectors/restaurant-catering.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(42,15,16,0.85) 0%, rgba(74,27,23,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },

  coaching: {
    id: 'coaching',
    name_en: 'Coaching Centre',
    name_ta: 'பயிற்சி மையம்',
    tagline_ta: 'தேர்வுப் பயிற்சி, சேர்க்கை விபரம், கட்டண விளக்கம் மற்றும் வகுப்பு அட்டவணை.',
    tagline_en: 'Competitive exams training, batch enrollments, syllabus & demo classes.',
    gradientStart: '#1E0F2B',
    gradientEnd: '#3D1745',
    gradient: {
      from: '#1E0F2B',
      to: '#3D1745',
      css: 'linear-gradient(135deg, #1E0F2B 0%, #2E1339 50%, #3D1745 100%)',
      radial: 'radial-gradient(circle at 50% 20%, #3D1745 0%, #1E0F2B 75%, #100717 100%)',
    },
    accent: '#E58BCB',
    accentSecondary: '#F3AEE0',
    glow: 'rgba(229, 139, 203, 0.35)',
    surfaceTint: 'rgba(30, 15, 43, 0.92)',
    surface: '#2B1439',
    surfaceElevated: '#381A4B',
    border: 'rgba(229, 139, 203, 0.16)',
    borderHighlight: 'rgba(229, 139, 203, 0.45)',
    badgeBg: 'rgba(229, 139, 203, 0.12)',
    badgeText: '#E58BCB',
    imagePath: '/sectors/coaching-centre.webp',
    mobileImagePath: '/sectors/coaching-centre.webp',
    overlayGradient: 'linear-gradient(180deg, rgba(30,15,43,0.85) 0%, rgba(61,23,69,0.92) 100%)',
    textPrimary: '#E8EDF9',
    textSecondary: '#9AA7BE',
  },
};

export const DEFAULT_THEME: SectorVisualTheme = {
  id: 'default',
  name_en: 'Vaayil Hub',
  name_ta: 'வாயில் மையம்',
  tagline_ta: 'ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் வாயில்.',
  tagline_en: 'Every business. One intelligent voice at the door.',
  gradientStart: '#080B18',
  gradientEnd: '#17152D',
  gradient: {
    from: '#080B18',
    to: '#17152D',
    css: 'linear-gradient(135deg, #080B18 0%, #101626 50%, #17152D 100%)',
    radial: 'radial-gradient(circle at 50% 20%, #17152D 0%, #080B18 80%, #04060E 100%)',
  },
  accent: '#8065FF',
  accentSecondary: '#A58EFF',
  glow: 'rgba(128, 101, 255, 0.35)',
  surfaceTint: 'rgba(16, 22, 38, 0.92)',
  surface: '#101626',
  surfaceElevated: '#171F33',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(128, 101, 255, 0.50)',
  badgeBg: 'rgba(128, 101, 255, 0.14)',
  badgeText: '#A58EFF',
  imagePath: '',
  mobileImagePath: '',
  overlayGradient: 'linear-gradient(180deg, rgba(8,11,24,0.85) 0%, rgba(23,21,45,0.92) 100%)',
  textPrimary: '#E8EDF9',
  textSecondary: '#9AA7BE',
};

export function getSectorTheme(sectorId?: string | null): SectorVisualTheme {
  if (!sectorId) return DEFAULT_THEME;
  return SECTOR_THEMES[sectorId] || DEFAULT_THEME;
}

export function getSectorCssVariables(theme: SectorVisualTheme): React.CSSProperties {
  return {
    ['--sector-gradient-start' as any]: theme.gradientStart,
    ['--sector-gradient-end' as any]: theme.gradientEnd,
    ['--sector-accent' as any]: theme.accent,
    ['--sector-accent-sec' as any]: theme.accentSecondary,
    ['--sector-glow' as any]: theme.glow,
    ['--sector-surface-tint' as any]: theme.surfaceTint,
    ['--sector-surface' as any]: theme.surface,
    ['--sector-surface-elevated' as any]: theme.surfaceElevated,
    ['--sector-border' as any]: theme.border,
    ['--sector-border-highlight' as any]: theme.borderHighlight,
    ['--sector-badge-bg' as any]: theme.badgeBg,
    ['--sector-badge-text' as any]: theme.badgeText,
    ['--sector-gradient' as any]: theme.gradient.css,
    ['--sector-radial' as any]: theme.gradient.radial,
    ['--sector-overlay' as any]: theme.overlayGradient,
  };
}
