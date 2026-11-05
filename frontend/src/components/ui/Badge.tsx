import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';
type BadgeSize    = 'sm' | 'md';

const VARIANTS: Record<BadgeVariant, string> = {
  default:  'bg-[#171F33] text-[#9AA7BE] border border-white/10',
  success:  'bg-[#42D6A4]/15 text-[#42D6A4] border border-[#42D6A4]/30',
  warning:  'bg-[#FFBF69]/15 text-[#FFBF69] border border-[#FFBF69]/30',
  danger:   'bg-[#FF647C]/15 text-[#FF647C] border border-[#FF647C]/30',
  info:     'bg-[#32D8E8]/15 text-[#32D8E8] border border-[#32D8E8]/30',
  accent:   'border',
  muted:    'bg-[#101626] text-[#9AA7BE] border border-white/[0.06]',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] leading-tight',
  md: 'px-2.5 py-1 text-xs',
};

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  accentColor?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  accentColor,
  children,
  className,
  icon,
}) => {
  const style: React.CSSProperties =
    variant === 'accent' && accentColor
      ? {
          backgroundColor: `${accentColor}18`,
          color: accentColor,
          borderColor: `${accentColor}40`,
        }
      : {};

  return (
    <span
      className={clsx(
        'chip font-mono',
        VARIANTS[variant],
        SIZES[size],
        'rounded-full',
        className,
      )}
      style={style}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

/* Booking status badge helper */
const STATUS_MAP: Record<string, BadgeVariant> = {
  confirmed:    'success',
  pending:      'warning',
  completed:    'info',
  cancelled:    'danger',
  'needs-review': 'warning',
  urgent:       'danger',
  booked:       'success',
  abandoned:    'muted',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Badge variant={STATUS_MAP[status] ?? 'muted'} size="sm">
    {status.replace('-', ' ')}
  </Badge>
);

