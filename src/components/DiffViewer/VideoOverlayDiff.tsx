import React, { useRef } from 'react';
import { cn } from '../../utils/cn';
import { VideoControls } from './VideoControls';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { usePanZoom, useVideoPlayback, useKeyboardShortcuts } from '../../hooks';
import { DiffLabel } from './DiffLabel';
import { CheckerboardBackground } from './CheckerboardBackground';

interface VideoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
}

interface VideoOverlayDiffProps {
  beforeVideo: string;
  afterVideo: string;
  zoom: number;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  // 缩放相关
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  // 视频播放状态（跨模式共享）
  videoPlaybackState?: VideoPlaybackState;
  onVideoPlaybackStateChange?: (state: VideoPlaybackState) => void;
  // 标注相关
  annotations: Annotation[];
  currentTool: AnnotationTool;
  currentColor: string;
  selectedAnnotationId: string | null;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationSelect: (id: string | null) => void;
  onDeleteSelected: () => void;
  onToolChange: (tool: AnnotationTool) => void;
  onToolSelect: (tool: AnnotationTool) => void;
  onAnnotationHover: (isHovering: boolean) => void;
}

export const VideoOverlayDiff: React.FC<VideoOverlayDiffProps> = ({
  beforeVideo,
  afterVideo,
  zoom,
  opacity,
  onOpacityChange,
  onZoomIn,
  onZoomOut,
  videoPlaybackState,
  onVideoPlaybackStateChange,
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
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // 使用共享的 hooks
  const { isPanning, pan, containerRef, handleContainerMouseDown, getCursor } = usePanZoom({
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
  } = useVideoPlayback({
    beforeVideo,
    afterVideo,
    externalState: videoPlaybackState,
    onStateChange: onVideoPlaybackStateChange,
  });

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
      className="relative w-full h-full bg-md-surface-container-low overflow-hidden select-none"
      style={{ cursor: getCursor() }}
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
    >
      <CheckerboardBackground />

      <div className="absolute inset-0">
        {/* Content Area - 视频层 */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            !isPanning && "transition-transform duration-200 ease-out"
          )}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* 视频容器 */}
          <div
            ref={videoContainerRef}
            className="relative inline-block"
          >
            {/* After Video - Base layer */}
            <video
              ref={afterVideoRef}
              src={afterVideo}
              className="select-none pointer-events-none block max-w-[90vw] max-h-[80vh]"
              muted
              playsInline
            />

            {/* Before Video - Overlay with opacity */}
            <video
              ref={beforeVideoRef}
              src={beforeVideo}
              className="absolute inset-0 w-full h-full select-none pointer-events-none object-contain"
              style={{
                opacity: opacity,
              }}
              muted
              playsInline
            />
          </div>
        </div>

        {/* Labels */}
        <DiffLabel
          label="Before"
          position="left"
          width={beforeInfo?.width}
          height={beforeInfo?.height}
        />
        <DiffLabel
          label="After"
          position="right"
          width={afterInfo?.width}
          height={afterInfo?.height}
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
