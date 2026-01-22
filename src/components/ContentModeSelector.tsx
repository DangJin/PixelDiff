import React, { useRef, useEffect, useState } from 'react';
import { Image, Film } from 'lucide-react';

type ContentMode = 'image' | 'video';

interface ContentModeSelectorProps {
  value: ContentMode;
  onChange: (mode: ContentMode) => void;
}

export const ContentModeSelector: React.FC<ContentModeSelectorProps> = ({
  value,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = value === 'image' ? imageRef : videoRef;
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
        ref={imageRef}
        onClick={() => onChange('image')}
        className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          value === 'image'
            ? 'text-md-on-secondary-container'
            : 'text-md-on-surface-variant hover:text-md-on-surface'
        }`}
      >
        <Image size={16} />
        Image
      </button>
      <button
        ref={videoRef}
        onClick={() => onChange('video')}
        className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          value === 'video'
            ? 'text-md-on-secondary-container'
            : 'text-md-on-surface-variant hover:text-md-on-surface'
        }`}
      >
        <Film size={16} />
        Video
      </button>
    </div>
  );
};
