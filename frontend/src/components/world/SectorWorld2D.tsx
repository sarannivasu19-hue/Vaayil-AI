import React from 'react';
import { motion } from 'framer-motion';
import { getSectorTheme, type SectorVisualTheme } from '../../config/sectorThemes';

interface SectorWorld2DProps {
  sectorId: string;
  mode?: 'full' | 'ambient' | 'subtle';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 2D Fallback & Ambient Layer for Sector Worlds
 * Features layered vector silhouettes, atmospheric glow, and gentle parallax floating
 */
export const SectorWorld2D: React.FC<SectorWorld2DProps> = ({
  sectorId,
  mode = 'full',
  className = '',
  style = {},
}) => {
  const theme: SectorVisualTheme = getSectorTheme(sectorId);
  const opacity = mode === 'full' ? 0.95 : mode === 'ambient' ? 0.35 : 0.18;
  const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Floating animation variant
  const floatAnim = (duration = 6, yOffset = 10, delay = 0) =>
    isReduced
      ? {}
      : {
          animate: {
            y: [-yOffset, yOffset, -yOffset],
            transition: {
              duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            },
          },
        };

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none transition-colors duration-700 ${className}`}
      style={{
        background: theme.gradient.radial,
        ...style,
      }}
    >
      {/* Dynamic atmospheric radial glow in sector accent */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${theme.accent}35 0%, transparent 70%)`,
          opacity,
        }}
      />

      {/* Atmospheric secondary light pocket */}
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${theme.accentSecondary}22 0%, transparent 70%)`,
          opacity: opacity * 0.8,
        }}
      />

      {/* Sector-specific original vector world */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ opacity }}>
        {sectorId === 'panchayat_health' && (
          <PanchayatHealthWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
        {sectorId === 'clinic' && (
          <ClinicWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
        {sectorId === 'vet_clinic' && (
          <VeterinaryWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
        {sectorId === 'hotel_lodge' && (
          <HotelLodgeWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
        {sectorId === 'restaurant' && (
          <RestaurantWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
        {sectorId === 'coaching' && (
          <CoachingWorld theme={theme} floatAnim={floatAnim} isReduced={isReduced} />
        )}
      </div>

      {/* Subtle grid pattern overlay for high-tech architectural depth */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.accent} 1px, transparent 1px), linear-gradient(to bottom, ${theme.accent} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 1. Panchayat Health World Art                                       */
/* Motifs: Village health centre building, medical cross, soft leaves */
/* ------------------------------------------------------------------ */
const PanchayatHealthWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-80"
  >
    <defs>
      <linearGradient id="ph-building" x1="500" y1="200" x2="500" y2="480" gradientUnits="userSpaceOnUse">
        <stop stopColor={theme.accent} stopOpacity="0.25" />
        <stop offset="1" stopColor={theme.accent} stopOpacity="0.03" />
      </linearGradient>
      <filter id="ph-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Rural Health Centre Facade & Pediment */}
    <g opacity="0.6">
      {/* Foundation & Steps */}
      <rect x="300" y="460" width="400" height="12" rx="4" fill={theme.accent} fillOpacity="0.18" />
      <rect x="320" y="448" width="360" height="12" rx="4" fill={theme.accent} fillOpacity="0.22" />

      {/* Main Clinic Hall */}
      <path d="M340 448 V310 L500 240 L660 310 V448 Z" fill="url(#ph-building)" stroke={theme.accent} strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Pillared Portico */}
      <rect x="380" y="330" width="16" height="118" rx="2" fill={theme.accent} fillOpacity="0.25" />
      <rect x="440" y="330" width="16" height="118" rx="2" fill={theme.accent} fillOpacity="0.25" />
      <rect x="544" y="330" width="16" height="118" rx="2" fill={theme.accent} fillOpacity="0.25" />
      <rect x="604" y="330" width="16" height="118" rx="2" fill={theme.accent} fillOpacity="0.25" />

      {/* Centre Arch Doorway */}
      <path d="M475 448 V365 C475 350 525 350 525 365 V448 Z" fill={theme.gradient.from} stroke={theme.accent} strokeWidth="2" strokeOpacity="0.5" />
    </g>

    {/* Floating Medical Cross Beacon over Pediment */}
    <motion.g {...floatAnim(5, 8, 0)}>
      <circle cx="500" cy="210" r="38" fill={theme.accent} fillOpacity="0.12" filter="url(#ph-glow)" />
      <circle cx="500" cy="210" r="28" stroke={theme.accent} strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.7" />
      {/* Cross geometry */}
      <path
        d="M493 186 H507 V203 H524 V217 H507 V234 H493 V217 H476 V203 H493 Z"
        fill={theme.accent}
        filter="url(#ph-glow)"
      />
    </motion.g>

    {/* Drifting Herbal / Health Botanical Leaves */}
    <motion.g {...floatAnim(7, 12, 0.4)}>
      <path
        d="M260 220 C280 200 320 210 310 240 C290 250 250 240 260 220 Z"
        fill={theme.accentSecondary}
        fillOpacity="0.3"
        stroke={theme.accent}
        strokeWidth="1"
      />
      <path d="M260 220 Q285 225 310 240" stroke={theme.accent} strokeWidth="0.8" strokeOpacity="0.6" />
    </motion.g>

    <motion.g {...floatAnim(6.5, 14, 1.2)}>
      <path
        d="M740 280 C760 260 800 270 790 300 C770 310 730 300 740 280 Z"
        fill={theme.accentSecondary}
        fillOpacity="0.3"
        stroke={theme.accent}
        strokeWidth="1"
      />
      <path d="M740 280 Q765 285 790 300" stroke={theme.accent} strokeWidth="0.8" strokeOpacity="0.6" />
    </motion.g>

    <motion.g {...floatAnim(8, 10, 2)}>
      <path
        d="M210 380 C230 365 265 375 255 400 C235 410 200 400 210 380 Z"
        fill={theme.accent}
        fillOpacity="0.25"
      />
    </motion.g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 2. Clinic World Art                                                */
/* Motifs: Floating medical cross, glowing heartbeat ECG, stethoscope */
/* ------------------------------------------------------------------ */
const ClinicWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-85"
  >
    <defs>
      <filter id="clinic-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Concentric Diagnostic Aura Rings */}
    <circle cx="500" cy="300" r="190" stroke={theme.accent} strokeWidth="1" strokeDasharray="4 6" strokeOpacity="0.25" />
    <circle cx="500" cy="300" r="260" stroke={theme.accentSecondary} strokeWidth="0.8" strokeDasharray="2 8" strokeOpacity="0.18" />

    {/* Glowing Heartbeat ECG Waveform running through centre */}
    <g filter="url(#clinic-glow)">
      <path
        d="M 120 300 L 320 300 L 345 300 L 360 250 L 375 350 L 395 210 L 415 380 L 435 285 L 450 315 L 465 300 L 535 300 L 550 285 L 565 315 L 585 210 L 605 380 L 625 250 L 640 350 L 655 300 L 880 300"
        stroke={theme.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.75"
      />
    </g>

    {/* Central Floating Diagnostic Cross */}
    <motion.g {...floatAnim(5.5, 9, 0)}>
      <circle cx="500" cy="180" r="46" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="1.5" strokeOpacity="0.4" />
      <path
        d="M492 154 H508 V172 H526 V188 H508 V206 H492 V188 H474 V172 H492 Z"
        fill={theme.accent}
        filter="url(#clinic-glow)"
      />
    </motion.g>

    {/* Stethoscope Silhouette Loop (Left) */}
    <motion.g {...floatAnim(6.5, 12, 0.8)} opacity="0.5">
      <path
        d="M 230 190 C 230 250 290 280 290 340 C 290 380 260 410 220 410"
        stroke={theme.accent}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="220" cy="410" r="16" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="2.5" />
      <circle cx="220" cy="410" r="7" fill={theme.accent} />
    </motion.g>

    {/* Vital Signs Hexagonal Glyphs (Right) */}
    <motion.g {...floatAnim(6, 10, 1.4)} opacity="0.6">
      <polygon
        points="760,200 790,215 790,250 760,265 730,250 730,215"
        fill={theme.surfaceElevated}
        stroke={theme.accentSecondary}
        strokeWidth="1.5"
      />
      <circle cx="760" cy="232" r="6" fill={theme.accent} />
    </motion.g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 3. Veterinary World Art                                            */
/* Motifs: Paw prints, bone silhouette, canine & feline contours      */
/* ------------------------------------------------------------------ */
const VeterinaryWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-85"
  >
    <defs>
      <filter id="vet-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Organic Sanctuary Halo */}
    <circle cx="500" cy="300" r="220" stroke={theme.accent} strokeWidth="1" strokeDasharray="6 8" strokeOpacity="0.25" />
    <circle cx="500" cy="300" r="280" stroke={theme.accentSecondary} strokeWidth="0.8" strokeOpacity="0.15" />

    {/* Elegant Canine Silhouette (Left) */}
    <motion.g {...floatAnim(6, 8, 0)} opacity="0.65">
      <path
        d="M 330 430 C 330 380 340 330 370 290 C 380 270 380 240 365 220 C 385 225 405 240 415 260 C 430 250 455 255 460 275 C 445 285 435 300 430 320 C 435 360 425 410 425 430 Z"
        fill={theme.surfaceElevated}
        stroke={theme.accent}
        strokeWidth="1.5"
      />
    </motion.g>

    {/* Elegant Feline Silhouette (Right) */}
    <motion.g {...floatAnim(6.5, 9, 0.6)} opacity="0.65">
      <path
        d="M 670 430 C 670 390 660 350 635 315 C 640 280 625 240 600 225 C 610 245 605 270 590 280 C 580 270 560 270 550 285 C 565 295 570 320 575 350 C 575 390 580 415 580 430 Z"
        fill={theme.surfaceElevated}
        stroke={theme.accentSecondary}
        strokeWidth="1.5"
      />
    </motion.g>

    {/* Center Luminous Paw Print Emblem */}
    <motion.g {...floatAnim(5, 10, 0.2)}>
      {/* Main pad */}
      <ellipse cx="500" cy="270" rx="34" ry="26" fill={theme.accent} fillOpacity="0.75" filter="url(#vet-glow)" />
      {/* 4 Toe beans */}
      <circle cx="468" cy="225" r="12" fill={theme.accent} filter="url(#vet-glow)" />
      <circle cx="490" cy="215" r="12" fill={theme.accent} filter="url(#vet-glow)" />
      <circle cx="512" cy="215" r="12" fill={theme.accent} filter="url(#vet-glow)" />
      <circle cx="534" cy="225" r="12" fill={theme.accent} filter="url(#vet-glow)" />
    </motion.g>

    {/* Floating Playful Bone Silhouette */}
    <motion.g {...floatAnim(7, 12, 1.2)} opacity="0.5">
      <path
        d="M 230 230 C 220 220 205 225 205 240 C 205 245 200 250 195 250 C 180 250 185 270 195 270 L 265 270 C 275 270 280 250 265 250 C 260 250 255 245 255 240 C 255 225 240 220 230 230 Z"
        fill={theme.accentSecondary}
      />
    </motion.g>

    {/* Secondary floating paw (Right) */}
    <motion.g {...floatAnim(6.8, 11, 1.8)} opacity="0.4">
      <ellipse cx="760" cy="230" rx="16" ry="12" fill={theme.accent} />
      <circle cx="745" cy="208" r="6" fill={theme.accent} />
      <circle cx="756" cy="202" r="6" fill={theme.accent} />
      <circle cx="767" cy="202" r="6" fill={theme.accent} />
      <circle cx="778" cy="208" r="6" fill={theme.accent} />
    </motion.g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 4. Hotel & Lodge World Art                                         */
/* Motifs: Gilded room key, concierge bell, softly lit windows facade */
/* ------------------------------------------------------------------ */
const HotelLodgeWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-85"
  >
    <defs>
      <filter id="hotel-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Boutique Hotel Facade with Warm Windows */}
    <g opacity="0.55">
      <rect x="360" y="240" width="280" height="220" rx="6" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="1.5" />
      {/* Decorative Rooftop Crown */}
      <path d="M 350 240 L 500 170 L 650 240 Z" fill={theme.surface} stroke={theme.accent} strokeWidth="1.5" />

      {/* Grid of 6 Warm Light Windows */}
      {[
        [395, 270], [470, 270], [545, 270],
        [395, 330], [470, 330], [545, 330],
      ].map(([wx, wy], idx) => (
        <rect
          key={idx}
          x={wx}
          y={wy}
          width="48"
          height="38"
          rx="4"
          fill={theme.accent}
          fillOpacity={idx % 2 === 0 ? 0.35 : 0.20}
          stroke={theme.accent}
          strokeWidth="1"
        />
      ))}

      {/* Arched Portico Entry */}
      <path d="M 465 460 V 400 C 465 385 535 385 535 400 V 460 Z" fill={theme.gradient.from} stroke={theme.accent} strokeWidth="2" />
    </g>

    {/* Gilded Room Key with Room # Silhouette (Left) */}
    <motion.g {...floatAnim(5.5, 11, 0.3)}>
      <g filter="url(#hotel-glow)">
        <circle cx="240" cy="280" r="26" stroke={theme.accent} strokeWidth="3" fill="none" />
        <circle cx="240" cy="280" r="14" stroke={theme.accentSecondary} strokeWidth="1.5" fill="none" />
        {/* Key shaft & teeth */}
        <path d="M 266 280 H 350 M 325 280 V 298 M 345 280 V 306" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" />
      </g>
    </motion.g>

    {/* Classic Concierge Service Bell (Right) */}
    <motion.g {...floatAnim(6, 10, 0.9)}>
      <g filter="url(#hotel-glow)">
        {/* Plinth */}
        <rect x="700" y="320" width="80" height="12" rx="3" fill={theme.accent} />
        {/* Dome */}
        <path d="M 710 320 C 710 275 770 275 770 320 Z" fill={theme.accent} fillOpacity="0.8" />
        {/* Top button stem */}
        <rect x="736" y="260" width="8" height="15" fill={theme.accentSecondary} />
        <ellipse cx="740" cy="258" rx="10" ry="4" fill={theme.accentSecondary} />
      </g>
    </motion.g>

    {/* Floating Hospitality Stars */}
    {[
      [500, 140, 1.2],
      [470, 150, 0.9],
      [530, 150, 0.9],
      [440, 160, 0.7],
      [560, 160, 0.7],
    ].map(([sx, sy, scale], i) => (
      <polygon
        key={i}
        points={`${sx},${sy - 8 * scale} ${sx + 2.5 * scale},${sy - 2.5 * scale} ${sx + 8 * scale},${sy} ${sx + 2.5 * scale},${sy + 2.5 * scale} ${sx},${sy + 8 * scale} ${sx - 2.5 * scale},${sy + 2.5 * scale} ${sx - 8 * scale},${sy} ${sx - 2.5 * scale},${sy - 2.5 * scale}`}
        fill={theme.accent}
        filter="url(#hotel-glow)"
      />
    ))}
  </svg>
);

/* ------------------------------------------------------------------ */
/* 5. Restaurant & Catering World Art                                 */
/* Motifs: Elegant cloche dish, utensils, rising steam, spice embers  */
/* ------------------------------------------------------------------ */
const RestaurantWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-85"
  >
    <defs>
      <filter id="rest-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Central Service Platter & Cloche Dome */}
    <motion.g {...floatAnim(5.5, 9, 0)}>
      {/* Tray Platter */}
      <ellipse cx="500" cy="380" rx="140" ry="24" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="2" />
      <ellipse cx="500" cy="380" rx="155" ry="12" stroke={theme.accentSecondary} strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Cloche Dome */}
      <path
        d="M 390 376 C 390 260 610 260 610 376 Z"
        fill={theme.accent}
        fillOpacity="0.35"
        stroke={theme.accent}
        strokeWidth="2.5"
        filter="url(#rest-glow)"
      />
      {/* Top Dome Knob */}
      <circle cx="500" cy="254" r="12" fill={theme.accent} filter="url(#rest-glow)" />
      <rect x="496" y="266" width="8" height="10" fill={theme.accent} />
    </motion.g>

    {/* Rising Fragrant Steam Tendrils */}
    <motion.g {...floatAnim(4.5, 14, 0.4)} opacity="0.65">
      <path d="M 470 230 Q 455 190 480 150 Q 500 120 480 90" stroke={theme.accentSecondary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 500 230 Q 520 180 495 140 Q 480 110 505 80" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 530 230 Q 545 190 520 150 Q 505 120 535 90" stroke={theme.accentSecondary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </motion.g>

    {/* Minimalist Fork (Left) */}
    <motion.g {...floatAnim(6, 12, 0.8)} opacity="0.55">
      <path d="M 270 220 V 270 C 270 295 300 295 300 270 V 220" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 285 220 V 280" stroke={theme.accent} strokeWidth="2" />
      <path d="M 285 285 V 410" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" />
    </motion.g>

    {/* Minimalist Spoon (Right) */}
    <motion.g {...floatAnim(6.2, 11, 1.2)} opacity="0.55">
      <ellipse cx="725" cy="250" rx="20" ry="34" stroke={theme.accent} strokeWidth="2.5" fill="none" />
      <path d="M 725 284 V 410" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" />
    </motion.g>

    {/* Floating Spice / Hearth Ember Particles */}
    {[
      [420, 160, 4],
      [580, 150, 3.5],
      [450, 110, 3],
      [550, 100, 4],
      [340, 320, 5],
      [660, 310, 4.5],
    ].map(([px, py, pr], i) => (
      <circle key={i} cx={px} cy={py} r={pr} fill={theme.accent} filter="url(#rest-glow)" />
    ))}
  </svg>
);

/* ------------------------------------------------------------------ */
/* 6. Coaching Centre World Art                                       */
/* Motifs: Stacked scholarly tomes, graduation cap, floating formulas */
/* ------------------------------------------------------------------ */
const CoachingWorld: React.FC<{
  theme: SectorVisualTheme;
  floatAnim: (d?: number, y?: number, del?: number) => any;
  isReduced: boolean;
}> = ({ theme, floatAnim }) => (
  <svg
    viewBox="0 0 1000 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-w-5xl max-h-[85vh] object-contain opacity-85"
  >
    <defs>
      <filter id="coach-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Stacked Scholarly Volumes Base */}
    <g opacity="0.6">
      {/* Book 1 (Bottom) */}
      <polygon points="360,420 640,420 620,445 340,445" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="1.5" />
      <rect x="340" y="445" width="280" height="18" rx="3" fill={theme.accent} fillOpacity="0.25" stroke={theme.accent} strokeWidth="1" />

      {/* Book 2 (Middle) */}
      <polygon points="380,380 620,380 605,405 365,405" fill={theme.surfaceElevated} stroke={theme.accentSecondary} strokeWidth="1.5" />
      <rect x="365" y="405" width="240" height="15" rx="3" fill={theme.accentSecondary} fillOpacity="0.25" stroke={theme.accentSecondary} strokeWidth="1" />

      {/* Book 3 (Top open tome) */}
      <path d="M 400 375 Q 490 360 490 375 Q 490 360 580 375 L 590 355 Q 500 340 500 355 Q 500 340 390 355 Z" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="1.5" />
    </g>

    {/* Graduation Mortarboard with Tassel (Hovering Above) */}
    <motion.g {...floatAnim(5, 10, 0)}>
      <g filter="url(#coach-glow)">
        {/* Diamond Rhombus Top */}
        <polygon points="500,170 630,210 500,250 370,210" fill={theme.surfaceElevated} stroke={theme.accent} strokeWidth="2.5" />
        {/* Skull cap band */}
        <path d="M 430 230 C 430 265 570 265 570 230" stroke={theme.accent} strokeWidth="2.5" fill="none" />
        {/* Central button */}
        <circle cx="500" cy="210" r="6" fill={theme.accentSecondary} />
        {/* Tassel line & fringe */}
        <path d="M 500 210 Q 565 220 575 270" stroke={theme.accentSecondary} strokeWidth="2" fill="none" />
        <rect x="571" y="270" width="8" height="16" rx="2" fill={theme.accentSecondary} />
      </g>
    </motion.g>

    {/* Floating Academic & Mathematical Glyphs */}
    <motion.g {...floatAnim(6.5, 12, 0.5)} opacity="0.65">
      {/* Sigma Σ */}
      <text x="260" y="240" fill={theme.accent} fontSize="44" fontFamily="Sora, sans-serif" fontWeight="bold">
        Σ
      </text>
      {/* Pi π */}
      <text x="730" y="230" fill={theme.accentSecondary} fontSize="42" fontFamily="Sora, sans-serif">
        π
      </text>
    </motion.g>

    <motion.g {...floatAnim(6, 14, 1.2)} opacity="0.6">
      {/* Integral ∫ */}
      <text x="280" y="360" fill={theme.accentSecondary} fontSize="48" fontFamily="serif" fontStyle="italic">
        ∫
      </text>
      {/* Delta Δ */}
      <text x="710" y="350" fill={theme.accent} fontSize="38" fontFamily="Sora, sans-serif" fontWeight="bold">
        Δ
      </text>
    </motion.g>

    <motion.g {...floatAnim(7, 10, 1.8)} opacity="0.5">
      {/* Infinity ∞ */}
      <text x="500" y="125" textAnchor="middle" fill={theme.accent} fontSize="34" fontFamily="Sora, sans-serif">
        ∞
      </text>
    </motion.g>
  </svg>
);
