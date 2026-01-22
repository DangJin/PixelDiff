import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';

interface ImageSize {
  width: number;
  height: number;
}

interface SideBySideDiffProps {
  beforeImage: string;
  afterImage: string;
  zoom: number;
  beforeSize?: ImageSize | null;
  afterSize?: ImageSize | null;
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

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  beforeImage,
  afterImage,
  zoom,
  beforeSize,
  afterSize,
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
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 当 zoom 重置为 1 时，重置平移位置
  useEffect(() => {
    if (zoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // 判断是否在标注模式
  const isAnnotating = currentTool !== 'select';

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // 标注模式下，不处理拖动
    if (isAnnotating) return;
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
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
        "relative grid grid-cols-1 md:grid-cols-2 w-full h-full select-none",
        hasTopTip && "pt-10"
      )}
      style={{ cursor: getCursor() }}
      onMouseDown={handleContainerMouseDown}
    >
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden border-r border-md-outline-variant/30">
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
        <div
          className={cn("p-4", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-full shadow-md-1 backdrop-blur-sm border border-md-outline-variant">
            Before {beforeSize && <span className="text-xs opacity-70 ml-1">{beforeSize.width}×{beforeSize.height}</span>}
        </div>
      </div>
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden">
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
        <div
          className={cn("p-4", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img
            src={afterImage}
            alt="After"
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-md-surface/90 text-md-on-surface text-sm font-medium rounded-full shadow-md-1 backdrop-blur-sm border border-md-outline-variant">
            After {afterSize && <span className="text-xs opacity-70 ml-1">{afterSize.width}×{afterSize.height}</span>}
        </div>
      </div>

      {/* Annotation Layer - 覆盖整个区域 */}
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
  );
};