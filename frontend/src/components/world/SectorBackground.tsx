import React, { useState, useEffect } from 'react';
import { getSectorTheme, type SectorVisualTheme } from '../../config/sectorThemes';

export type SectorBackgroundMode = 'immersive' | 'ambient' | 'subtle';

interface SectorBackgroundProps {
  sectorId: string;
  mode?: SectorBackgroundMode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * SectorBackground — Professional Realistic Photography & Gradient Overlay System
 * 
 * Modes:
 * - "immersive": Login screen & Hub sector intro (rich photo with 80-88% dark overlay)
 * - "ambient": Live Call Console (dimmed, softened with 88-92% overlay behind VoiceOrb)
 * - "subtle": All other workspace pages (heavily dimmed with 92-96% overlay behind cards/tables)
 * 
 * Gracefully falls back to pure sector gradient if photo has not been added or fails to load.
 */
export const SectorBackground: React.FC<SectorBackgroundProps> = ({
  sectorId,
  mode = 'subtle',
  className = '',
  style = {},
  children,
}) => {
  const theme: SectorVisualTheme = getSectorTheme(sectorId);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [testedSrc, setTestedSrc] = useState<string>('');

  useEffect(() => {
    if (!theme.imagePath) {
      setImageLoaded(false);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.src = theme.imagePath;

    img.onload = () => {
      if (isMounted) {
        setImageLoaded(true);
        setTestedSrc(theme.imagePath);
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setImageLoaded(false);
        setTestedSrc('');
      }
    };

    return () => {
      isMounted = false;
    };
  }, [theme.imagePath]);

  // Mode-based opacity and blur settings
  const imageOpacity = mode === 'immersive' ? 0.45 : mode === 'ambient' ? 0.22 : 0.12;
  const imageBlur = mode === 'immersive' ? 'blur(0px)' : mode === 'ambient' ? 'blur(8px)' : 'blur(16px)';
  const overlayOpacity = mode === 'immersive' ? 0.85 : mode === 'ambient' ? 0.90 : 0.94;

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none transition-colors duration-700 ${className}`}
      style={{
        background: theme.gradient.radial,
        ...style,
      }}
    >
      {/* Photo layer (renders only when image file genuinely loads) */}
      {imageLoaded && testedSrc && (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-out"
          style={{
            opacity: imageOpacity,
            filter: imageBlur,
            transform: 'scale(1.02)',
          }}
        >
          <img
            src={testedSrc}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* Dark colour-graded overlay from sector tone (guarantees WCAG AA contrast) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-700"
        style={{
          background: `linear-gradient(180deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
          opacity: overlayOpacity,
        }}
      />

      {/* Atmospheric radial vignette */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 25%, transparent 35%, rgba(0, 0, 0, 0.70) 100%)`,
        }}
      />

      {/* Fine architectural grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.accent} 1px, transparent 1px), linear-gradient(to bottom, ${theme.accent} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Optional nested content */}
      {children}
    </div>
  );
};

