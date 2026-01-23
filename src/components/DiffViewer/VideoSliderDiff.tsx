import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { VideoControls } from './VideoControls';
import { AnnotationLayer } from '../Annotation/AnnotationLayer';
import type { Annotation, AnnotationTool } from '../../types/annotation';
import { usePanZoom, useVideoPlayback, useKeyboardShortcuts } from '../../hooks';
import { DiffLabel } from './DiffLabel';
import { SliderHandle } from './SliderHandle';
import { CheckerboardBackground } from './CheckerboardBackground';

interface VideoSliderDiffProps {
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

export const VideoSliderDiff: React.FC<VideoSliderDiffProps> = ({
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
  // Slider 状态
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

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

  // ============ 滑块逻辑 ============

  const handleSliderMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!videoContainerRef.current) return;
      const rect = videoContainerRef.current.getBoundingClientRect();
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

  return (
    <div
      className="relative w-full h-full bg-md-surface-container-low overflow-hidden select-none"
      style={{ cursor: getCursor() }}
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onWheel={handleWheel}
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

            {/* Before Video - Overlay with clip-path */}
            <video
              ref={beforeVideoRef}
              src={beforeVideo}
              className="absolute inset-0 w-full h-full select-none pointer-events-none object-contain"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
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

        {/* Slider Handle Layer - 独立层，z-20，在标注层之上 */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none z-20",
            !isPanning && "transition-transform duration-200 ease-out"
          )}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="relative inline-block">
            {/* 占位用的隐藏视频，用于获取正确的尺寸 */}
            <video
              src={afterVideo}
              className="select-none pointer-events-none block max-w-[90vw] max-h-[80vh] invisible"
              muted
              playsInline
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
