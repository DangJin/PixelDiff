import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (direction: 1 | -1) => void;
  onPlaybackRateChange: (rate: number) => void;
}

const PLAYBACK_RATES = [0.5, 1, 2];

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onStepFrame,
  onPlaybackRateChange,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 bg-md-surface/95 backdrop-blur-md rounded-2xl shadow-md-3 border border-md-outline-variant px-4 py-3 min-w-[400px]">
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-3">
        <span className="text-xs text-md-on-surface-variant min-w-[40px]">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative h-1.5 bg-md-surface-container-highest rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-md-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={currentTime}
            onChange={handleProgressChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-xs text-md-on-surface-variant min-w-[40px] text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Frame Step Back */}
        <button
          onClick={() => onStepFrame(-1)}
          disabled={isPlaying}
          className="p-2 rounded-full hover:bg-md-on-surface/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-md-on-surface"
          title="Previous Frame"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Skip Back 5s */}
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 5))}
          className="p-2 rounded-full hover:bg-md-on-surface/10 transition-colors text-md-on-surface"
          title="Rewind 5s"
        >
          <SkipBack size={18} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-md-primary text-md-on-primary hover:bg-md-primary/90 transition-colors mx-1"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* Skip Forward 5s */}
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 5))}
          className="p-2 rounded-full hover:bg-md-on-surface/10 transition-colors text-md-on-surface"
          title="Forward 5s"
        >
          <SkipForward size={18} />
        </button>

        {/* Frame Step Forward */}
        <button
          onClick={() => onStepFrame(1)}
          disabled={isPlaying}
          className="p-2 rounded-full hover:bg-md-on-surface/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-md-on-surface"
          title="Next Frame"
        >
          <ChevronRight size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-md-outline-variant mx-2" />

        {/* Playback Speed */}
        <div className="flex items-center gap-1">
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              onClick={() => onPlaybackRateChange(rate)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full transition-colors",
                playbackRate === rate
                  ? "bg-md-secondary-container text-md-on-secondary-container"
                  : "text-md-on-surface-variant hover:bg-md-on-surface/10"
              )}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
