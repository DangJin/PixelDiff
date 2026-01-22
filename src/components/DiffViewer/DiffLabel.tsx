import React from 'react';
import { cn } from '../../utils/cn';

interface DiffLabelProps {
  label: 'Before' | 'After';
  position?: 'left' | 'right';
  hasTopTip?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const DiffLabel: React.FC<DiffLabelProps> = ({
  label,
  position = 'left',
  hasTopTip = false,
  width,
  height,
  className,
}) => {
  const hasSize = width && height;

  return (
    <div
      className={cn(
        "absolute px-3 py-1 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-full shadow-md-1 pointer-events-none z-10 border border-md-outline-variant backdrop-blur-sm transition-all",
        position === 'left' ? 'left-4' : 'right-4',
        hasTopTip ? 'top-14' : 'top-4',
        className
      )}
    >
      {label}
      {hasSize && (
        <span className="text-xs opacity-70 ml-1.5">
          {width}×{height}
        </span>
      )}
    </div>
  );
};
