import React from 'react';
import { clsx } from 'clsx';

/* ------------------------------------------------------------------ */
/* Skeleton — base atom                                                 */
/* ------------------------------------------------------------------ */
interface SkeletonProps {
  shape?: 'line' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  shape = 'line',
  width,
  height,
  className,
}) => {
  const style: React.CSSProperties = {
    width:  width  !== undefined ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={clsx(
        'skeleton',
        shape === 'line'   && 'h-4 rounded-md',
        shape === 'circle' && 'rounded-full',
        shape === 'rect'   && 'rounded-xl',
        className,
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

/* ------------------------------------------------------------------ */
/* SkeletonCard — a 3-line card-shaped placeholder                      */
/* ------------------------------------------------------------------ */
export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div
    className={clsx(
      'rounded-2xl bg-[#101626] border border-white/[0.07] p-5 space-y-3',
      className,
    )}
    aria-busy="true"
    aria-label="Loading…"
  >
    <Skeleton shape="line" width="60%" />
    {lines >= 2 && <Skeleton shape="line" width="90%" />}
    {lines >= 3 && <Skeleton shape="line" width="75%" />}
  </div>
);

/* ------------------------------------------------------------------ */
/* SkeletonTable — a list of rows placeholder                           */
/* ------------------------------------------------------------------ */
export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => (
  <div
    className={clsx('space-y-2', className)}
    aria-busy="true"
    aria-label="Loading…"
  >
    {/* Header row */}
    <div className="flex items-center gap-4 px-4 py-2">
      <Skeleton shape="line" width="30%" />
      <Skeleton shape="line" width="20%" className="ml-auto" />
      <Skeleton shape="line" width="15%" />
    </div>
    {/* Body rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#101626] border border-white/[0.05]"
      >
        <Skeleton shape="circle" width={36} height={36} className="shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="line" width="55%" />
          <Skeleton shape="line" width="35%" height={10} />
        </div>
        <Skeleton shape="line" width={64} height={22} className="rounded-full" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* SkeletonKPI — dashboard KPI card skeleton                            */
/* ------------------------------------------------------------------ */
export const SkeletonKPI: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      'rounded-2xl bg-[#101626] border border-white/[0.07] p-5 space-y-4',
      className,
    )}
    aria-busy="true"
  >
    <div className="flex items-center justify-between">
      <Skeleton shape="line" width="40%" height={12} />
      <Skeleton shape="circle" width={36} height={36} />
    </div>
    <Skeleton shape="line" width="50%" height={28} className="rounded-lg" />
    <Skeleton shape="line" width="65%" height={10} />
  </div>
);

