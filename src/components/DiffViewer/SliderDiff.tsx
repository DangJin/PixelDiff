import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';
import { usePanZoom } from '../../hooks';
import { DiffLabel } from './DiffLabel';
import { SliderHandle } from './SliderHandle';
import { CheckerboardBackground } from './CheckerboardBackground';

interface SegmentedButtonProps {
    options: {
        value: string;
        label: string;
        icon?: React.ElementType;
    }[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SegmentedButton: React.FC<SegmentedButtonProps> = ({ options, value, onChange, className }) => {
    return (
        <div className={cn("inline-flex rounded-2xl border border-md-outline bg-transparent p-0 overflow-hidden", className)}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-5 py-2 text-xs font-medium transition-colors border-r border-md-outline last:border-r-0 focus:outline-none relative overflow-hidden min-w-[80px]",
                            isSelected
                                ? "bg-md-secondary-container text-md-on-secondary-container"
                                : "bg-transparent text-md-on-surface-variant hover:bg-md-on-surface/10"
                        )}
                    >
                        {option.icon && <option.icon size={20} />}
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    )
}

interface ImageSize {
  width: number;
  height: number;
}

interface SliderDiffProps {
  beforeImage: string;
  afterImage: string;
  zoom: number;
  beforeSize?: ImageSize | null;
  afterSize?: ImageSize | null;
  hasTopTip?: boolean;
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

export const SliderDiff: React.FC<SliderDiffProps> = ({
  beforeImage,
  afterImage,
  zoom,
  beforeSize,
  afterSize,
  hasTopTip = false,
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
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 使用共享的 pan/zoom hook
  const { isPanning, pan, handleContainerMouseDown, handleWheel, getCursor } = usePanZoom({
    zoom,
    currentTool,
    onZoomIn,
    onZoomOut,
  });

  const handleSliderMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        handleSliderMove(e.clientX);
      }
    },
    [isResizing, handleSliderMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isResizing) {
        handleSliderMove(e.touches[0].clientX);
      }
    },
    [isResizing, handleSliderMove]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

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
        onWheel={handleWheel}
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

            {/* Before Image - Overlay with clip-path */}
            <img
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full select-none pointer-events-none object-contain"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
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
        />
        <DiffLabel
          label="After"
          position="right"
          hasTopTip={hasTopTip}
          width={afterSize?.width}
          height={afterSize?.height}
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

        {/* Slider Handle Layer - 独立层，z-20，在标注层之上 */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none z-20",
            !isPanning && "transition-transform duration-200 ease-out"
          )}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="relative inline-block">
            {/* 占位用的隐藏图片，用于获取正确的尺寸 */}
            <img
              src={afterImage}
              alt=""
              className="select-none pointer-events-none block max-w-[90vw] max-h-[80vh] invisible"
              draggable={false}
            />
            {/* Slider Handle - pointer-events: auto 使其可交互 */}
            <div className="pointer-events-auto">
              <SliderHandle
                position={sliderPosition}
                zoom={zoom}
                onMouseDown={handleSliderMouseDown}
                onTouchStart={() => setIsResizing(true)}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
