import React from 'react';
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

interface SideBySideDiffProps {
  beforeImage: string;
  afterImage: string;
  zoom: number;
  beforeSize?: ImageSize | null;
  afterSize?: ImageSize | null;
  beforeFilename?: string;
  afterFilename?: string;
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

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  beforeImage,
  afterImage,
  zoom,
  beforeSize,
  afterSize,
  beforeFilename,
  afterFilename,
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
  // 使用共享的 pan/zoom hook
  const { isPanning, pan, containerRef, handleContainerMouseDown, getCursor } = usePanZoom({
    zoom,
    currentTool,
    onZoomIn,
    onZoomOut,
  });

  // 判断是否在标注模式
  const isAnnotating = currentTool !== 'select';

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative grid grid-cols-1 md:grid-cols-2 w-full h-full select-none",
        hasTopTip && "pt-10"
      )}
      style={{ cursor: getCursor() }}
      onMouseDown={handleContainerMouseDown}
    >
      {/* Before 区域 */}
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden border-r border-md-outline-variant/30">
        <CheckerboardBackground />
        <div
          className={cn("p-4 relative z-0", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
        <DiffLabel
          label="Before"
          width={beforeSize?.width}
          height={beforeSize?.height}
          filename={beforeFilename}
        />
        {/* Before 区域的标注层 */}
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

      {/* After 区域 */}
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden">
        <CheckerboardBackground />
        <div
          className={cn("p-4 relative z-0", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img
            src={afterImage}
            alt="After"
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
        <DiffLabel
          label="After"
          width={afterSize?.width}
          height={afterSize?.height}
          filename={afterFilename}
        />
        {/* After 区域的标注层 - 允许绘制和选择 */}
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
