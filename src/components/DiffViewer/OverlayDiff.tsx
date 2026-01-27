import React, { useRef } from 'react';
import { cn } from '../../utils/cn';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';
import { usePanZoom } from '../../hooks';
import { DiffLabel } from './DiffLabel';
import { CheckerboardBackground } from './CheckerboardBackground';

interface ImageSize {
  width: number;
  height: number;
}

interface OverlayDiffProps {
  beforeImage: string;
  afterImage: string;
  zoom: number;
  beforeSize?: ImageSize | null;
  afterSize?: ImageSize | null;
  beforeFilename?: string;
  afterFilename?: string;
  hasTopTip?: boolean;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  // 缩放相关
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  // 标注相关
  annotations: Annotation[];
  currentTool: AnnotationTool;
  currentColor: string;
  selectedAnnotationId: string | null;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationSelect: (id: string | null) => void;
  onDeleteSelected: () => void;
  onToolChange: (tool: AnnotationTool) => void;
  onAnnotationHover: (isHovering: boolean) => void;
}

export const OverlayDiff: React.FC<OverlayDiffProps> = ({
  beforeImage,
  afterImage,
  zoom,
  beforeSize,
  afterSize,
  beforeFilename,
  afterFilename,
  hasTopTip = false,
  opacity,
  onOpacityChange,
  onZoomIn,
  onZoomOut,
  annotations,
  currentTool,
  currentColor,
  selectedAnnotationId,
  onAnnotationAdd,
  onAnnotationSelect,
  onDeleteSelected,
  onToolChange,
  onAnnotationHover,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 使用共享的 pan/zoom hook
  const { isPanning, pan, containerRef, handleContainerMouseDown, getCursor } = usePanZoom({
    zoom,
    currentTool,
    onZoomIn,
    onZoomOut,
  });

  // 判断是否在标注模式（非选择工具）
  const isAnnotating = currentTool !== 'select';

  return (
    <div
      className={cn(
        "relative w-full h-full bg-md-surface-container-low overflow-hidden select-none"
      )}
      style={{ cursor: getCursor() }}
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
    >
      <CheckerboardBackground />

      <div className="absolute inset-0">
        {/* Content Area - 图片层 */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            !isPanning && "transition-transform duration-200 ease-out"
          )}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* 图片容器 */}
          <div
            ref={imageContainerRef}
            className="relative inline-block"
          >
            {/* After Image - Base layer */}
            <img
              src={afterImage}
              alt="After"
              className="select-none pointer-events-none block max-w-[90vw] max-h-[80vh]"
              draggable={false}
            />

            {/* Before Image - Overlay with opacity */}
            <img
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full select-none pointer-events-none object-contain"
              style={{
                opacity: opacity,
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Labels */}
        <DiffLabel
          label="Before"
          position="left"
          hasTopTip={hasTopTip}
          width={beforeSize?.width}
          height={beforeSize?.height}
          filename={beforeFilename}
        />
        <DiffLabel
          label="After"
          position="right"
          hasTopTip={hasTopTip}
          width={afterSize?.width}
          height={afterSize?.height}
          filename={afterFilename}
        />

        {/* Annotation Layer - z-10 */}
        <AnnotationLayer
          annotations={annotations}
          currentTool={currentTool}
          currentColor={currentColor}
          selectedId={selectedAnnotationId}
          onAnnotationAdd={onAnnotationAdd}
          onAnnotationSelect={onAnnotationSelect}
          onDeleteSelected={onDeleteSelected}
          onToolChange={onToolChange}
          onAnnotationHover={onAnnotationHover}
          zoom={zoom}
          pan={pan}
          disabled={!isAnnotating && currentTool === 'select'}
        />

        {/* Opacity Slider - 顶部 */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-md-surface/95 backdrop-blur-md rounded-full px-4 py-2 shadow-md-2 border border-md-outline-variant"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-md-on-surface-variant font-medium whitespace-nowrap">
            Before
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity * 100}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="w-32 sm:w-48 h-1 bg-md-surface-container-highest rounded-full appearance-none cursor-pointer accent-md-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-md-primary [&::-webkit-slider-thumb]:shadow-md"
          />
          <span className="text-xs text-md-on-surface-variant font-medium w-10 text-right">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
