import React from 'react';
import { cn } from '../../utils/cn';

interface DiffLabelProps {
  label: 'Before' | 'After';
  position?: 'left' | 'right';
  hasTopTip?: boolean;
  width?: number;
  height?: number;
  filename?: string;
  className?: string;
}

export const DiffLabel: React.FC<DiffLabelProps> = ({
  label,
  position = 'left',
  hasTopTip = false,
  width,
  height,
  filename,
  className,
}) => {
  const hasSize = width && height;

  return (
    <div
      className={cn(
        "absolute px-3 py-1.5 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-xl shadow-md-1 pointer-events-none z-10 border border-md-outline-variant backdrop-blur-sm transition-all flex flex-col gap-0.5",
        position === 'left' ? 'left-4' : 'right-4',
        hasTopTip ? 'top-14' : 'top-4',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {hasSize && (
          <span className="text-xs opacity-70">
            {width}×{height}
          </span>
        )}
      </div>
      {filename && (
        <div className="text-xs text-md-on-surface-variant truncate max-w-[200px]" title={filename}>
          {filename}
        </div>
      )}
    </div>
  );
};
