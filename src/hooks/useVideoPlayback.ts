import { useState, useCallback, useEffect, useRef } from 'react';

const FRAME_DURATION = 1 / 30; // 固定 30fps 用于帧步进

interface UseVideoPlaybackOptions {
  beforeVideo: string;
  afterVideo: string;
  // 外部状态同步（用于模式切换时保持播放进度）
  externalState?: {
    isPlaying: boolean;
    currentTime: number;
    playbackRate: number;
  };
  onStateChange?: (state: { isPlaying: boolean; currentTime: number; playbackRate: number }) => void;
}

interface VideoInfo {
  width: number;
  height: number;
}

interface UseVideoPlaybackReturn {
  beforeVideoRef: React.RefObject<HTMLVideoElement | null>;
  afterVideoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  frameDuration: number;
  beforeInfo: VideoInfo | null;
  afterInfo: VideoInfo | null;
  handlePlayPause: () => void;
  handleSeek: (time: number) => void;
  handleStepFrame: (direction: 1 | -1) => void;
  handlePlaybackRateChange: (rate: number) => void;
}

export const useVideoPlayback = ({
  beforeVideo,
  afterVideo,
  externalState,
  onStateChange,
}: UseVideoPlaybackOptions): UseVideoPlaybackReturn => {
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(externalState?.isPlaying ?? false);
  const [currentTime, setCurrentTime] = useState(externalState?.currentTime ?? 0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(externalState?.playbackRate ?? 1);

  // 标记是否已经恢复了外部状态
  const hasRestoredState = useRef(false);

  // 视频信息
  const [beforeInfo, setBeforeInfo] = useState<VideoInfo | null>(null);
  const [afterInfo, setAfterInfo] = useState<VideoInfo | null>(null);

  // 同步播放/暂停
  const handlePlayPause = useCallback(() => {
    const before = beforeVideoRef.current;
    const after = afterVideoRef.current;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      before?.play();
      after?.play();
    } else {
      before?.pause();
      after?.pause();
    }
    setIsPlaying(newIsPlaying);
    onStateChange?.({ isPlaying: newIsPlaying, currentTime, playbackRate });
  }, [isPlaying, currentTime, playbackRate, onStateChange]);

  // 同步 seek
  const handleSeek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    if (beforeVideoRef.current) beforeVideoRef.current.currentTime = clampedTime;
    if (afterVideoRef.current) afterVideoRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
    onStateChange?.({ isPlaying, currentTime: clampedTime, playbackRate });
  }, [duration, isPlaying, playbackRate, onStateChange]);

  // 帧步进
  const handleStepFrame = useCallback((direction: 1 | -1) => {
    const newTime = currentTime + (direction * FRAME_DURATION);
    handleSeek(newTime);
  }, [currentTime, handleSeek]);

  // 播放速度
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (beforeVideoRef.current) beforeVideoRef.current.playbackRate = rate;
    if (afterVideoRef.current) afterVideoRef.current.playbackRate = rate;
    onStateChange?.({ isPlaying, currentTime, playbackRate: rate });
  }, [isPlaying, currentTime, onStateChange]);

  // 监听视频元数据加载
  useEffect(() => {
    const before = beforeVideoRef.current;
    const after = afterVideoRef.current;

    const handleBeforeLoadedMetadata = () => {
      if (before) {
        setBeforeInfo({ width: before.videoWidth, height: before.videoHeight });
      }
      updateDuration();
      restoreExternalState();
    };

    const handleAfterLoadedMetadata = () => {
      if (after) {
        setAfterInfo({ width: after.videoWidth, height: after.videoHeight });
      }
      updateDuration();
      restoreExternalState();
    };

    const updateDuration = () => {
      const beforeDuration = before?.duration || 0;
      const afterDuration = after?.duration || 0;
      setDuration(Math.min(beforeDuration, afterDuration) || beforeDuration || afterDuration);
    };

    // 恢复外部状态（模式切换时保持播放进度）
    const restoreExternalState = () => {
      if (hasRestoredState.current || !externalState) return;

      const before = beforeVideoRef.current;
      const after = afterVideoRef.current;

      // 确保两个视频都已加载
      if (!before || !after || !before.duration || !after.duration) return;

      hasRestoredState.current = true;

      // 恢复播放位置
      if (externalState.currentTime > 0) {
        before.currentTime = externalState.currentTime;
        after.currentTime = externalState.currentTime;
        setCurrentTime(externalState.currentTime);
      }

      // 恢复播放速度
      if (externalState.playbackRate !== 1) {
        before.playbackRate = externalState.playbackRate;
        after.playbackRate = externalState.playbackRate;
        setPlaybackRate(externalState.playbackRate);
      }

      // 恢复播放状态
      if (externalState.isPlaying) {
        before.play();
        after.play();
        setIsPlaying(true);
      }
    };

    before?.addEventListener('loadedmetadata', handleBeforeLoadedMetadata);
    after?.addEventListener('loadedmetadata', handleAfterLoadedMetadata);

    // 如果视频已经加载过元数据，直接尝试恢复
    if (before?.duration && after?.duration) {
      restoreExternalState();
    }

    return () => {
      before?.removeEventListener('loadedmetadata', handleBeforeLoadedMetadata);
      after?.removeEventListener('loadedmetadata', handleAfterLoadedMetadata);
    };
  }, [beforeVideo, afterVideo, externalState]);

  // 监听时间更新
  useEffect(() => {
    const before = beforeVideoRef.current;

    const handleTimeUpdate = () => {
      if (before) {
        setCurrentTime(before.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    before?.addEventListener('timeupdate', handleTimeUpdate);
    before?.addEventListener('ended', handleEnded);

    return () => {
      before?.removeEventListener('timeupdate', handleTimeUpdate);
      before?.removeEventListener('ended', handleEnded);
    };
  }, [beforeVideo]);

  // 同步两个视频
  useEffect(() => {
    if (!isPlaying) return;

    const syncInterval = setInterval(() => {
      const before = beforeVideoRef.current;
      const after = afterVideoRef.current;

      if (before && after) {
        const timeDiff = Math.abs(before.currentTime - after.currentTime);
        if (timeDiff > 0.1) {
          after.currentTime = before.currentTime;
        }
      }
    }, 500);

    return () => clearInterval(syncInterval);
  }, [isPlaying]);

  return {
    beforeVideoRef,
    afterVideoRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    frameDuration: FRAME_DURATION,
    beforeInfo,
    afterInfo,
    handlePlayPause,
    handleSeek,
    handleStepFrame,
    handlePlaybackRateChange,
  };
};
