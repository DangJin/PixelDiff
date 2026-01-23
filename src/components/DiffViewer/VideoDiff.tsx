import React from 'react';
import { cn } from '../../utils/cn';
import { VideoControls } from './VideoControls';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { usePanZoom, useVideoPlayback, useKeyboardShortcuts } from '../../hooks';
import { DiffLabel } from './DiffLabel';
import { CheckerboardBackground } from './CheckerboardBackground';

interface VideoDiffProps {
  beforeVideo: string;
  afterVideo: string;
  zoom: number;
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
  onToolSelect: (tool: AnnotationTool) => void; // 用于快捷键选择工具（更新主工具）
  onAnnotationHover: (isHovering: boolean) => void;
}

export const VideoDiff: React.FC<VideoDiffProps> = ({
  beforeVideo,
  afterVideo,
  zoom,
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
  onToolSelect,
  onAnnotationHover,
}) => {
  // 使用共享的 hooks
  const { isPanning, pan, handleContainerMouseDown, handleWheel, getCursor } = usePanZoom({
    zoom,
    currentTool,
    onZoomIn,
    onZoomOut,
  });

  const {
    beforeVideoRef,
    afterVideoRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    frameDuration,
    beforeInfo,
    afterInfo,
    handlePlayPause,
    handleSeek,
    handleStepFrame,
    handlePlaybackRateChange,
  } = useVideoPlayback({ beforeVideo, afterVideo });

  // 使用共享的键盘快捷键
  useKeyboardShortcuts({
    currentTime,
    duration,
    frameDuration,
    onSeek: handleSeek,
    onPlayPause: handlePlayPause,
    onToolSelect,
  });

  // 判断是否在标注模式
  const isAnnotating = currentTool !== 'select';

  return (
    <div
      className="relative grid grid-cols-1 md:grid-cols-2 w-full h-full select-none"
      style={{ cursor: getCursor() }}
      onMouseDown={handleContainerMouseDown}
      onWheel={handleWheel}
    >
      {/* Before Video */}
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden border-r border-md-outline-variant/30">
        <CheckerboardBackground />
        <div
          className={cn("p-4 relative z-0", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <video
            ref={beforeVideoRef}
            src={beforeVideo}
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            muted
            playsInline
          />
        </div>
        <DiffLabel
          label="Before"
          width={beforeInfo?.width}
          height={beforeInfo?.height}
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

      {/* After Video */}
      <div className="relative flex items-center justify-center bg-md-surface-container-low overflow-hidden">
        <CheckerboardBackground />
        <div
          className={cn("p-4 relative z-0", !isPanning && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <video
            ref={afterVideoRef}
            src={afterVideo}
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            muted
            playsInline
          />
        </div>
        <DiffLabel
          label="After"
          width={afterInfo?.width}
          height={afterInfo?.height}
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

      {/* Video Controls */}
      <VideoControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onStepFrame={handleStepFrame}
        onPlaybackRateChange={handlePlaybackRateChange}
      />
    </div>
  );
};
