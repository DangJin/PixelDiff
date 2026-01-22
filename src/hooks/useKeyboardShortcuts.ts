import { useEffect } from 'react';
import type { AnnotationTool } from '../types/annotation';

interface UseKeyboardShortcutsOptions {
  // 视频相关（可选）
  currentTime?: number;
  duration?: number;
  frameDuration?: number;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
  // 标注工具（可选）
  onToolSelect?: (tool: AnnotationTool) => void;
}

export const useKeyboardShortcuts = ({
  currentTime,
  duration,
  frameDuration,
  onSeek,
  onPlayPause,
  onToolSelect,
}: UseKeyboardShortcutsOptions): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 输入框中不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // 视频控制快捷键
      if (onSeek && frameDuration !== undefined && currentTime !== undefined && duration !== undefined) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onSeek(Math.max(0, currentTime - frameDuration));
          return;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + frameDuration));
          return;
        }
      }

      // 播放/暂停
      if (onPlayPause && e.key === ' ') {
        e.preventDefault();
        onPlayPause();
        return;
      }

      // 工具快捷键
      if (onToolSelect) {
        if (key === 'v') {
          e.preventDefault();
          onToolSelect('select');
        } else if (key === 'a') {
          e.preventDefault();
          onToolSelect('arrow');
        } else if (key === 'r') {
          e.preventDefault();
          onToolSelect('rect');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, frameDuration, onSeek, onPlayPause, onToolSelect]);
};
