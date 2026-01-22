import React from 'react';
import { GitCompare } from 'lucide-react';

interface SliderHandleProps {
  position: number; // 0-100 百分比
  zoom: number;
  onMouseDown: () => void;
  onTouchStart: () => void;
}

export const SliderHandle: React.FC<SliderHandleProps> = ({
  position,
  zoom,
  onMouseDown,
  onTouchStart,
}) => {
  return (
    <div
      className="absolute inset-y-0 slider-handle cursor-ew-resize z-20 group touch-none"
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* 垂直线 - 保持宽度不变 */}
      <div
        className="absolute inset-y-0 bg-md-primary shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all"
        style={{
          width: `${Math.max(2, 2 / zoom)}px`,
          left: `${-1 / zoom}px`
        }}
      />
      {/* 圆形手柄 - 保持大小不变 */}
      <div
        className="absolute top-1/2 left-0 bg-md-primary rounded-full shadow-md-3 flex items-center justify-center text-md-on-primary transition-transform"
        style={{
          transform: `translate(-50%, -50%) scale(${1 / zoom})`,
          width: '48px',
          height: '32px'
        }}
      >
        <GitCompare size={18} className="rotate-90" />
      </div>
    </div>
  );
};
