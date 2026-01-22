import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export const ZOOM_STEP = 0.25;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;

interface ZoomToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const ZoomToolbar: React.FC<ZoomToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-md-surface/95 backdrop-blur-md rounded-full shadow-md-3 border border-md-outline-variant px-2 py-1.5">
      <button
        onClick={onZoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="p-2 rounded-full hover:bg-md-on-surface/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-md-on-surface"
        title="Zoom Out"
      >
        <ZoomOut size={20} />
      </button>

      <button
        onClick={onZoomReset}
        className="px-3 py-1 min-w-[60px] text-sm font-medium text-md-on-surface hover:bg-md-on-surface/10 rounded-full transition-colors"
        title="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={onZoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="p-2 rounded-full hover:bg-md-on-surface/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-md-on-surface"
        title="Zoom In"
      >
        <ZoomIn size={20} />
      </button>
    </div>
  );
};
