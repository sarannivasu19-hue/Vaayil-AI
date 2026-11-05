import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8065FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B18] disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-[#8065FF] hover:bg-[#9275FF] text-white shadow-lg shadow-[#8065FF]/25',
  secondary: 'bg-[#171F33] hover:bg-[#1e2a45] text-[#E8EDF9] border border-white/10',
  ghost:     'bg-transparent hover:bg-[#171F33] text-[#9AA7BE] hover:text-[#E8EDF9]',
  danger:    'bg-[#FF647C]/15 hover:bg-[#FF647C]/25 text-[#FF647C] border border-[#FF647C]/30',
  success:   'bg-[#42D6A4]/15 hover:bg-[#42D6A4]/25 text-[#42D6A4] border border-[#42D6A4]/30',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 min-h-[36px] px-3.5 text-xs',
  md: 'h-11 min-h-[44px] px-5 text-sm',
  lg: 'h-12 min-h-[48px] px-6 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={clsx(
          BASE,
          VARIANTS[variant],
          SIZES[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || isLoading}
        {...(rest as any)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && (
          <span className={clsx(isLoading && 'opacity-70')}>{children}</span>
        )}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
