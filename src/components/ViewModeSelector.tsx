import React, { useRef, useEffect, useState } from 'react';
import { GitCompare, Columns, Layers } from 'lucide-react';

type ViewMode = 'slider' | 'side-by-side' | 'overlay';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  value,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLButtonElement>(null);
  const sideBySideRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = value === 'slider' ? sliderRef : value === 'side-by-side' ? sideBySideRef : overlayRef;
    if (activeRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-1 bg-md-surface-container rounded-full p-1"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-md-secondary-container rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      <button
        ref={sliderRef}
        onClick={() => onChange('slider')}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
          value === 'slider'
            ? 'text-md-on-secondary-container'
            : 'text-md-on-surface-variant hover:text-md-on-surface'
        }`}
        title="Slider Mode"
      >
        <GitCompare size={16} />
        <span className="hidden sm:inline">Slider</span>
      </button>
      <button
        ref={sideBySideRef}
        onClick={() => onChange('side-by-side')}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
          value === 'side-by-side'
            ? 'text-md-on-secondary-container'
            : 'text-md-on-surface-variant hover:text-md-on-surface'
        }`}
        title="Side by Side Mode"
      >
        <Columns size={16} />
        <span className="hidden sm:inline">Side by Side</span>
      </button>
      <button
        ref={overlayRef}
        onClick={() => onChange('overlay')}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
          value === 'overlay'
            ? 'text-md-on-secondary-container'
            : 'text-md-on-surface-variant hover:text-md-on-surface'
        }`}
        title="Overlay Mode"
      >
        <Layers size={16} />
        <span className="hidden sm:inline">Overlay</span>
      </button>
    </div>
  );
};
