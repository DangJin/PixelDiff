import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnnotationTool } from '../types/annotation';

interface UsePanZoomOptions {
  zoom: number;
  currentTool: AnnotationTool;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

interface UsePanZoomReturn {
  isPanning: boolean;
  pan: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleContainerMouseDown: (e: React.MouseEvent) => void;
  getCursor: () => 'crosshair' | 'grabbing' | 'grab' | 'default';
}

export const usePanZoom = ({ zoom, currentTool, onZoomIn, onZoomOut }: UsePanZoomOptions): UsePanZoomReturn => {
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onZoomInRef = useRef(onZoomIn);
  const onZoomOutRef = useRef(onZoomOut);

  // 更新 ref 以保持最新的回调
  useEffect(() => {
    onZoomInRef.current = onZoomIn;
    onZoomOutRef.current = onZoomOut;
  }, [onZoomIn, onZoomOut]);

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

  // 使用 useEffect 添加 non-passive 的 wheel 事件监听器，避免 passive 警告
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 阻止默认的页面滚动行为
      e.preventDefault();

      // deltaY < 0 表示滚轮向上，放大；deltaY > 0 表示滚轮向下，缩小
      if (e.deltaY < 0) {
        onZoomInRef.current?.();
      } else if (e.deltaY > 0) {
        onZoomOutRef.current?.();
      }
    };

    // 使用 { passive: false } 以允许 preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return {
    isPanning,
    pan,
    containerRef,
    handleContainerMouseDown,
    getCursor,
  };
};
