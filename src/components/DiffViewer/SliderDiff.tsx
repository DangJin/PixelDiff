import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GitCompare } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';

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
        <div className={cn("inline-flex h-10 rounded-full border border-md-outline bg-transparent p-0 overflow-hidden", className)}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex items-center gap-2 px-4 text-sm font-medium transition-colors border-r border-md-outline last:border-r-0 focus:outline-none relative overflow-hidden",
                            isSelected 
                                ? "bg-md-secondary-container text-md-on-secondary-container" 
                                : "bg-transparent text-md-on-surface-variant hover:bg-md-on-surface/10"
                        )}
                    >
                        {option.icon && <option.icon size={18} />}
                        {option.label}
                        {/* Selected Check Icon placeholder if strict MD3, but color change is enough for now */}
                    </button>
                );
            })}
        </div>
    )
}

interface SliderDiffProps {
  beforeImage: string;
  afterImage: string;
  zoom: number;
  hasTopTip?: boolean;
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
  hasTopTip = false,
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
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 当 zoom 重置为 1 时，重置平移位置
  useEffect(() => {
    if (zoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleSliderMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsPanning(false);
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

  const handlePanMove = useCallback(
    (clientX: number, clientY: number) => {
      setPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
    },
    [panStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        handleSliderMove(e.clientX);
      } else if (isPanning) {
        handlePanMove(e.clientX, e.clientY);
      }
    },
    [isResizing, isPanning, handleSliderMove, handlePanMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isResizing) {
        handleSliderMove(e.touches[0].clientX);
      } else if (isPanning) {
        handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [isResizing, isPanning, handleSliderMove, handlePanMove]
  );

  useEffect(() => {
    if (isResizing || isPanning) {
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
  }, [isResizing, isPanning, handleMouseMove, handleMouseUp, handleTouchMove]);

  // 判断是否在标注模式（非选择工具）
  const isAnnotating = currentTool !== 'select';

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // 标注模式下，不处理拖动
    if (isAnnotating) return;
    // 点击滑块手柄时，由手柄自己处理
    if ((e.target as HTMLElement).closest('.slider-handle')) return;

    // 只有放大时才支持拖动平移画布
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
    // 移除点击移动滑块的逻辑，滑块只能通过拖动手柄移动
  }, [zoom, pan, isAnnotating]);

  // 获取光标样式
  const getCursor = () => {
    if (isAnnotating) return 'crosshair';
    if (zoom > 1) return isPanning ? 'grabbing' : 'grab';
    return 'default';
  };

  return (
    <div
        className={cn(
          "relative w-full h-full bg-md-surface-container-low overflow-hidden select-none"
        )}
        style={{ cursor: getCursor() }}
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
    >
       {/* Background pattern */}
       <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{
                   backgroundImage: `
                    linear-gradient(45deg, #000 25%, transparent 25%),
                    linear-gradient(-45deg, #000 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #000 75%),
                    linear-gradient(-45deg, transparent 75%, #000 75%)`,
                   backgroundSize: '20px 20px',
                   backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
               }}
      />

      <div className="absolute inset-0">

        {/* Content Area */}
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

            {/* Slider Handle */}
            <div
              className="absolute inset-y-0 slider-handle cursor-ew-resize z-20 group touch-none"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleSliderMouseDown}
              onTouchStart={() => setIsResizing(true)}
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
          </div>
        </div>

        {/* Labels */}
        <div className={cn(
          "absolute left-4 px-3 py-1 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-full shadow-md-1 pointer-events-none z-10 border border-md-outline-variant backdrop-blur-sm transition-all",
          hasTopTip ? "top-14" : "top-4"
        )}>
          Before
        </div>
        <div className={cn(
          "absolute right-4 px-3 py-1 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-full shadow-md-1 pointer-events-none z-10 border border-md-outline-variant backdrop-blur-sm transition-all",
          hasTopTip ? "top-14" : "top-4"
        )}>
          After
        </div>

        {/* Annotation Layer */}
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

      </div>
    </div>
  );
};