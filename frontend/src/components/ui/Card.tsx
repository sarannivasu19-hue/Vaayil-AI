import React from 'react';
import { clsx } from 'clsx';

type CardVariant = 'default' | 'elevated' | 'glass' | 'accent';

interface CardProps {
  variant?: CardVariant;
  accentColor?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const VARIANTS: Record<CardVariant, string> = {
  default:  'bg-[#101626] border border-white/[0.07]',
  elevated: 'bg-[#171F33] border border-white/[0.09]',
  glass:    'glass-panel',
  accent:   'bg-[#101626] border border-white/[0.07] border-l-[3px]',
};

const PADDING: Record<string, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  accentColor,
  children,
  className,
  onClick,
  padding = 'md',
  style,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={clsx(
        'rounded-2xl',
        VARIANTS[variant],
        PADDING[padding],
        isClickable && 'cursor-pointer transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5',
        className,
      )}
      style={{
        ...(variant === 'accent' && accentColor ? { borderLeftColor: accentColor } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* Convenience sub-components */
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={clsx('flex items-center justify-between mb-4', className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3 className={clsx('text-sm font-semibold text-[#E8EDF9] font-heading', className)}>
    {children}
  </h3>
);
