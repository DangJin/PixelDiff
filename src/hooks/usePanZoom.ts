import { useState, useCallback, useEffect } from 'react';
import type { AnnotationTool } from '../types/annotation';

interface UsePanZoomOptions {
  zoom: number;
  currentTool: AnnotationTool;
}

interface UsePanZoomReturn {
  isPanning: boolean;
  pan: { x: number; y: number };
  handleContainerMouseDown: (e: React.MouseEvent) => void;
  getCursor: () => 'crosshair' | 'grabbing' | 'grab' | 'default';
}

export const usePanZoom = ({ zoom, currentTool }: UsePanZoomOptions): UsePanZoomReturn => {
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
    // 点击滑块手柄时，由手柄自己处理
    if ((e.target as HTMLElement).closest('.slider-handle')) return;

    // 只有放大时才支持拖动平移画布
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan, isAnnotating]);

  // 获取光标样式
  const getCursor = useCallback(() => {
    if (isAnnotating) return 'crosshair' as const;
    if (zoom > 1) return isPanning ? 'grabbing' as const : 'grab' as const;
    return 'default' as const;
  }, [isAnnotating, zoom, isPanning]);

  return {
    isPanning,
    pan,
    handleContainerMouseDown,
    getCursor,
  };
};
