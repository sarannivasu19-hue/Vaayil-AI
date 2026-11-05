/**
 * Sector Themes & Visual Worlds Configuration
 * 
 * Provides original visual identity for each of the six Vaayil AI business worlds:
 * - Panchayat Health (Village healthcare desk)
 * - Clinic (Doctor's private clinic)
 * - Veterinary Clinic (Animal hospital)
 * - Hotel / Lodge (Hospitality front desk)
 * - Restaurant / Catering (Bhavan / Food service)
 * - Coaching Centre (Academic academy)
 * 
 * Complies with WCAG AA contrast standards.
 */

export interface SectorVisualTheme {
  id: string;
  sceneId: string;
  name_en: string;
  name_ta: string;
  worldName_en: string;
  worldName_ta: string;
  tagline_ta: string;
  tagline_en: string;
  
  // Colors
  accent: string;             // Primary sector accent
  accentSecondary: string;    // Complementary lighter accent
  glow: string;               // Glow aura rgba
  
  // Gradients
  gradient: {
    from: string;             // Base dark 1
    mid: string;              // Mid tone
    to: string;               // Deep tone
    css: string;              // Linear gradient CSS
    radial: string;           // Radial atmospheric gradient CSS
  };
  
  // Surfaces & Borders
  surface: string;            // Panel background with tint
  surfaceElevated: string;    // Elevated card surface
  surfaceGlass: string;       // Glassmorphism background
  border: string;             // Border with sector tint
  borderHighlight: string;    // Active/focus border
  
  // Text & Badges
  badgeBg: string;            // Badge background
  badgeText: string;          // Badge text
  textPrimary: string;        // WCAG AA compliant text (#E8EDF9)
  textSecondary: string;      // #9AA7BE
  
  // World Motif & Atmosphere
  motifs: string[];           // Descriptive key motifs
  particles: string[];        // Particle colors
}

export const SECTOR_THEMES: Record<string, SectorVisualTheme> = {
  panchayat_health: {
    id: 'panchayat_health',
    sceneId: 'panchayat_health',
    name_en: 'Health Help Desk',
    name_ta: 'ஆரம்ப சுகாதார நிலையம்',
    worldName_en: 'Panchayat Health Haven',
    worldName_ta: 'கிராம நல்வாழ்வு மையம்',
    tagline_ta: 'கிராமப்புற குடிமக்களுக்கான உடனடி தாய்-சேய் நல மற்றும் அவசர உதவி.',
    tagline_en: 'Rural healthcare helpline for immunization, maternal care & health emergencies.',
    accent: '#35D7E8',
    accentSecondary: '#7DE8F5',
    glow: 'rgba(53, 215, 232, 0.45)',
    gradient: {
      from: '#06262B',
      mid: '#083332',
      to: '#0B3D3A',
      css: 'linear-gradient(135deg, #06262B 0%, #083332 45%, #0B3D3A 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #0B3D3A 0%, #06262B 65%, #031417 100%)',
    },
    surface: 'rgba(6, 38, 43, 0.85)',
    surfaceElevated: '#0B3338',
    surfaceGlass: 'rgba(9, 46, 52, 0.65)',
    border: 'rgba(53, 215, 232, 0.18)',
    borderHighlight: 'rgba(53, 215, 232, 0.50)',
    badgeBg: 'rgba(53, 215, 232, 0.14)',
    badgeText: '#35D7E8',
    textPrimary: '#E8EDF9',
    textSecondary: '#A2B9C8',
    motifs: ['Village Health Centre', 'Medical Cross', 'Drifting Leaves', 'Emergency Beacon'],
    particles: ['#35D7E8', '#7DE8F5', '#42D6A4'],
  },

  clinic: {
    id: 'clinic',
    sceneId: 'clinic',
    name_en: 'Private Clinic',
    name_ta: 'மருத்துவ மனை',
    worldName_en: 'Clinical Diagnostic Sanctum',
    worldName_ta: 'மருத்துவ கலந்தாய்வு அரங்கம்',
    tagline_ta: 'மருத்துவ ஆலோசனைகள் மற்றும் முன் சந்திப்புகளுக்கான தானியங்கி குரல் சேவை.',
    tagline_en: 'Automated appointments, patient triage and doctor scheduling.',
    accent: '#9275FF',
    accentSecondary: '#B9A6FF',
    glow: 'rgba(146, 117, 255, 0.45)',
    gradient: {
      from: '#0A1430',
      mid: '#121A46',
      to: '#1A1F5C',
      css: 'linear-gradient(135deg, #0A1430 0%, #121A46 50%, #1A1F5C 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #1A1F5C 0%, #0A1430 65%, #050A1A 100%)',
    },
    surface: 'rgba(14, 23, 56, 0.85)',
    surfaceElevated: '#172152',
    surfaceGlass: 'rgba(18, 28, 68, 0.65)',
    border: 'rgba(146, 117, 255, 0.20)',
    borderHighlight: 'rgba(146, 117, 255, 0.55)',
    badgeBg: 'rgba(146, 117, 255, 0.15)',
    badgeText: '#B9A6FF',
    textPrimary: '#E8EDF9',
    textSecondary: '#A7B3D2',
    motifs: ['Floating Caduceus', 'Heartbeat Waveform', 'Stethoscope Arc', 'Diagnostic Rings'],
    particles: ['#9275FF', '#32D8E8', '#C3A5FF'],
  },

  vet_clinic: {
    id: 'vet_clinic',
    sceneId: 'vet_clinic',
    name_en: 'Veterinary Clinic',
    name_ta: 'கால்நடை மருத்துவமனை',
    worldName_en: 'Veterinary Care Glade',
    worldName_ta: 'கால்நடை நலம் & காப்பகம்',
    tagline_ta: 'செல்லப்பிராணிகள் மற்றும் கால்நடைகளுக்கான மருத்துவப் பதிவு & அவசர சிகிச்சை.',
    tagline_en: 'Pet care appointments, livestock checkups, vaccination & emergency triage.',
    accent: '#42D6A4',
    accentSecondary: '#7CF0C7',
    glow: 'rgba(66, 214, 164, 0.45)',
    gradient: {
      from: '#0A2418',
      mid: '#0E3020',
      to: '#123B2A',
      css: 'linear-gradient(135deg, #0A2418 0%, #0E3020 50%, #123B2A 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #123B2A 0%, #0A2418 65%, #04120B 100%)',
    },
    surface: 'rgba(12, 40, 28, 0.85)',
    surfaceElevated: '#13402C',
    surfaceGlass: 'rgba(15, 48, 34, 0.65)',
    border: 'rgba(66, 214, 164, 0.18)',
    borderHighlight: 'rgba(66, 214, 164, 0.50)',
    badgeBg: 'rgba(66, 214, 164, 0.14)',
    badgeText: '#42D6A4',
    textPrimary: '#E8EDF9',
    textSecondary: '#A3C8B7',
    motifs: ['Luminous Paws', 'Livestock Contours', 'Gentle Botanical Leaf', 'Animal Care Cross'],
    particles: ['#42D6A4', '#7CF0C7', '#35D7E8'],
  },

  hotel_lodge: {
    id: 'hotel_lodge',
    sceneId: 'hotel_lodge',
    name_en: 'Hotel & Lodge',
    name_ta: 'ஹோட்டல் & தங்குமிடம்',
    worldName_en: 'Grand Gateway Manor',
    worldName_ta: 'விருந்தினர் மாளிகை',
    tagline_ta: 'அறை முன்பதிவு, சோதனை நேரம் மற்றும் விருந்தினர் கோரிக்கைகளுக்கான உதவி.',
    tagline_en: 'Room booking, check-in schedules, amenities & 24/7 guest reception.',
    accent: '#FFBF69',
    accentSecondary: '#FFD79E',
    glow: 'rgba(255, 191, 105, 0.45)',
    gradient: {
      from: '#1A1610',
      mid: '#272011',
      to: '#3A2C12',
      css: 'linear-gradient(135deg, #1A1610 0%, #272011 50%, #3A2C12 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #3A2C12 0%, #1A1610 65%, #0E0C08 100%)',
    },
    surface: 'rgba(32, 26, 17, 0.85)',
    surfaceElevated: '#382B17',
    surfaceGlass: 'rgba(42, 33, 19, 0.65)',
    border: 'rgba(255, 191, 105, 0.18)',
    borderHighlight: 'rgba(255, 191, 105, 0.50)',
    badgeBg: 'rgba(255, 191, 105, 0.14)',
    badgeText: '#FFBF69',
    textPrimary: '#E8EDF9',
    textSecondary: '#C5B79C',
    motifs: ['Gilded Key', 'Concierge Bell', 'Warm Illuminated Facade', 'Hospitality Stars'],
    particles: ['#FFBF69', '#FFD79E', '#FF886F'],
  },

  restaurant: {
    id: 'restaurant',
    sceneId: 'restaurant',
    name_en: 'Restaurant & Catering',
    name_ta: 'உணவகம் & கேட்டரிங்',
    worldName_en: 'Culinary Hearth Pavilion',
    worldName_ta: 'சுவை அரங்கம் & சமையற்கூடம்',
    tagline_ta: 'மேஜை முன்பதிவு, விசேஷ உணவு ஆர்டர்கள் மற்றும் கேட்டரிங் சேவைகள்.',
    tagline_en: 'Table reservations, catering banquets, party orders & menu inquiries.',
    accent: '#FF886F',
    accentSecondary: '#FFA996',
    glow: 'rgba(255, 136, 111, 0.45)',
    gradient: {
      from: '#2A0F10',
      mid: '#3A1413',
      to: '#4A1B17',
      css: 'linear-gradient(135deg, #2A0F10 0%, #3A1413 50%, #4A1B17 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #4A1B17 0%, #2A0F10 65%, #140707 100%)',
    },
    surface: 'rgba(46, 17, 18, 0.85)',
    surfaceElevated: '#4D1D1B',
    surfaceGlass: 'rgba(58, 21, 22, 0.65)',
    border: 'rgba(255, 136, 111, 0.18)',
    borderHighlight: 'rgba(255, 136, 111, 0.50)',
    badgeBg: 'rgba(255, 136, 111, 0.14)',
    badgeText: '#FF886F',
    textPrimary: '#E8EDF9',
    textSecondary: '#C9A5A3',
    motifs: ['Gleaming Cloche', 'Rising Fragrant Steam', 'Bespoke Utensils', 'Warm Ember Sparks'],
    particles: ['#FF886F', '#FFA996', '#FFBF69'],
  },

  coaching: {
    id: 'coaching',
    sceneId: 'coaching',
    name_en: 'Coaching Centre',
    name_ta: 'பயிற்சி மையம்',
    worldName_en: 'Academic Academy of Wisdom',
    worldName_ta: 'அறிவுப் பூங்கா & பயிற்சி அரங்கம்',
    tagline_ta: 'தேர்வுப் பயிற்சி, சேர்க்கை விபரம், கட்டண விளக்கம் மற்றும் வகுப்பு அட்டவணை.',
    tagline_en: 'Competitive exams training, batch enrollments, syllabus & demo classes.',
    accent: '#E58BCB',
    accentSecondary: '#F3AEE0',
    glow: 'rgba(229, 139, 203, 0.45)',
    gradient: {
      from: '#1E0F2B',
      mid: '#2E1339',
      to: '#3D1745',
      css: 'linear-gradient(135deg, #1E0F2B 0%, #2E1339 50%, #3D1745 100%)',
      radial: 'radial-gradient(circle at 50% 15%, #3D1745 0%, #1E0F2B 65%, #100717 100%)',
    },
    surface: 'rgba(38, 17, 51, 0.85)',
    surfaceElevated: '#421950',
    surfaceGlass: 'rgba(50, 20, 62, 0.65)',
    border: 'rgba(229, 139, 203, 0.18)',
    borderHighlight: 'rgba(229, 139, 203, 0.50)',
    badgeBg: 'rgba(229, 139, 203, 0.14)',
    badgeText: '#E58BCB',
    textPrimary: '#E8EDF9',
    textSecondary: '#C5A6C9',
    motifs: ['Stacked Scholarly Tomes', 'Graduation Mortarboard', 'Floating Formulas', 'Radiant Glyphs'],
    particles: ['#E58BCB', '#F3AEE0', '#9275FF'],
  },
};

/**
 * Fallback neutral theme
 */
export const DEFAULT_THEME: SectorVisualTheme = {
  id: 'default',
  sceneId: 'default',
  name_en: 'Vaayil Hub',
  name_ta: 'வாயில் மையம்',
  worldName_en: 'Vaayil Intelligent Gateway',
  worldName_ta: 'வாயில் நுழைவுத்தளம்',
  tagline_ta: 'ஒவ்வொரு தொழிலுக்கும் ஒரே குரல் வாயில்.',
  tagline_en: 'Every business. One intelligent voice at the door.',
  accent: '#8065FF',
  accentSecondary: '#A58EFF',
  glow: 'rgba(128, 101, 255, 0.40)',
  gradient: {
    from: '#080B18',
    mid: '#101626',
    to: '#17152D',
    css: 'linear-gradient(135deg, #080B18 0%, #101626 50%, #17152D 100%)',
    radial: 'radial-gradient(circle at 50% 20%, #17152D 0%, #080B18 80%, #04060E 100%)',
  },
  surface: '#101626',
  surfaceElevated: '#171F33',
  surfaceGlass: 'rgba(23, 31, 51, 0.70)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(128, 101, 255, 0.50)',
  badgeBg: 'rgba(128, 101, 255, 0.15)',
  badgeText: '#A58EFF',
  textPrimary: '#E8EDF9',
  textSecondary: '#9AA7BE',
  motifs: ['Intelligent Doorway', 'Shared AI Orb', 'Waveform Nexus'],
  particles: ['#8065FF', '#32D8E8', '#A58EFF'],
};

/**
 * Retrieve the theme for a sector ID safely
 */
export function getSectorTheme(sectorId?: string | null): SectorVisualTheme {
  if (!sectorId) return DEFAULT_THEME;
  return SECTOR_THEMES[sectorId] || DEFAULT_THEME;
}

/**
 * Build inline CSS custom properties dictionary for a sector theme
 */
export function getSectorCssVariables(theme: SectorVisualTheme): React.CSSProperties {
  return {
    ['--sector-accent' as any]: theme.accent,
    ['--sector-accent-sec' as any]: theme.accentSecondary,
    ['--sector-glow' as any]: theme.glow,
    ['--sector-bg-1' as any]: theme.gradient.from,
    ['--sector-bg-2' as any]: theme.gradient.mid,
    ['--sector-bg-3' as any]: theme.gradient.to,
    ['--sector-gradient' as any]: theme.gradient.css,
    ['--sector-radial' as any]: theme.gradient.radial,
    ['--sector-surface' as any]: theme.surface,
    ['--sector-surface-elevated' as any]: theme.surfaceElevated,
    ['--sector-surface-glass' as any]: theme.surfaceGlass,
    ['--sector-border' as any]: theme.border,
    ['--sector-border-highlight' as any]: theme.borderHighlight,
    ['--sector-badge-bg' as any]: theme.badgeBg,
    ['--sector-badge-text' as any]: theme.badgeText,
  };
}
