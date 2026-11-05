import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className,
    )}
  >
    {icon && (
      <div className="mb-5 w-16 h-16 rounded-2xl bg-[#171F33] border border-white/[0.07] flex items-center justify-center text-[#9AA7BE]">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-[#E8EDF9] font-heading mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-[#9AA7BE] max-w-xs leading-relaxed">{description}</p>
    )}
    {action && (
      <div className="mt-6">
        <Button variant="secondary" size="sm" leftIcon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      </div>
    )}
  </div>
);

